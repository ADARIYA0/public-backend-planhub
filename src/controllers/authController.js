const { addToBlacklist, generateTokens } = require('../utils/tokenUtils');
const { getRepository } = require('../utils/getRepository');
const { sendOtpEmail } = require('../services/emailService');
const AdminToken = require('../entities/Auth/AdminToken');
const bcrypt = require('bcryptjs');
const logger = require('../utils/logger');
const ms = require('ms');
const User = require('../entities/Auth/User');
const UserToken = require('../entities/Auth/UserToken');

function generateOtp() {
    return Math.floor(100000 + Math.random() * 900000).toString(); // 6 digit
}

function getExpiryDate(minutes) {
    return new Date(Date.now() + minutes * 60 * 1000);
}

exports.register = async (req, res) => {
    try {
        const userRepository = getRepository(User);

        const { email, no_handphone, password, alamat, pendidikan_terakhir } = req.body;

        logger.info(`POST /auth/register accessed, email=${email}`);

        const existingUsers = await userRepository.find({
            where: [{ email }, { no_handphone }]
        });

        let errors = [];
        for (const u of existingUsers) {
            if (u.email === email) errors.push('Email sudah terdaftar');
            if (u.no_handphone === no_handphone) errors.push('Nomor handphone sudah terdaftar');
        }

        if (errors.length > 0) {
            logger.warn(`Registration failed: ${errors.join(', ')}, email=${email}`);
            return res.status(400).json({ message: errors });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const otp = generateOtp();
        const expiresMinutes = parseInt(process.env.OTP_EXPIRES_MINUTES, 10);

        const newUser = userRepository.create({
            email,
            no_handphone,
            password: hashedPassword,
            alamat,
            pendidikan_terakhir,
            status_akun: 'belum-aktif',
            otp,
            otp_expiry: getExpiryDate(expiresMinutes)
        });

        await userRepository.save(newUser);

        try {
            await sendOtpEmail(email, otp, expiresMinutes);
            logger.info(`OTP sent for registration: email=${email}, expiresAt=${newUser.otp_expiry}`);
        } catch (mailError) {
            logger.error(`Failed to send OTP (email=${email}): ${mailError.message}`, { stack: mailError.stack });
        }

        res.status(201).json({
            message: 'Registrasi berhasil. Kode OTP telah dikirim ke email.',
            user: { id: newUser.id, email: newUser.email, no_handphone: newUser.no_handphone }
        });
    } catch (error) {
        logger.error(`Registration error for email=${req.body.email}: ${error}`, { stack: error.stack });
        res.status(500).json({ message: 'Terjadi kesalahan', error: error });
    }
};

exports.login = async (req, res) => {
    try {
        const userRepository = getRepository(User);
        const userTokenRepository = getRepository(UserToken);

        const { email, password } = req.body;

        logger.info(`POST /auth/login accessed, email=${email}`);

        const user = await userRepository
            .createQueryBuilder("user")
            .addSelect("user.password")
            .where("user.email = :email", { email })
            .getOne();
        if (!user) {
            logger.warn(`Login failed: user not found, email=${email}`);
            return res.status(404).json({ message: 'User tidak ditemukan' });
        }

        if (user.status_akun !== 'aktif') {
            logger.warn(`Login failed: account not verified, email=${email}`);
            return res.status(403).json({ message: 'Akun belum terverifikasi. Silakan verifikasi lewat OTP.' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            logger.warn(`Login failed: wrong password, email=${email}`);
            return res.status(400).json({ message: 'Password salah' });
        }

        const { accessToken, refreshToken } = generateTokens(user.id, 'user');

        const userToken = userTokenRepository.create({
            user,
            refresh_token: refreshToken,
            user_agent: req.headers['user-agent'] || null,
            ip_address: req.ip,
            created_at: new Date(),
            expires_at: new Date(Date.now() + ms(process.env.JWT_REFRESH_EXPIRES))
        });
        await userTokenRepository.save(userToken);

        logger.info(`Login successful: userId=${user.id}, email=${email}`);
        logger.debug(`Generated JWT payload: ${JSON.stringify({ id: user.id })}`);

        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: process.env.COOKIE_SECURE === 'true',
            sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
            path: "/",
            maxAge: ms(process.env.JWT_REFRESH_EXPIRES)
        });

        res.status(200).json({
            message: 'Login berhasil',
            accessToken
        });
    } catch (error) {
        logger.error(`Login error for email=${req.body.email}: ${error}`, { stack: error.stack });
        res.status(500).json({ message: 'Terjadi kesalahan', error: error });
    }
};

exports.refreshToken = async (req, res) => {
    try {
        const userTokenRepository = getRepository(UserToken);
        const adminTokenRepository = getRepository(AdminToken);

        const { id, role } = req.user;
        const refreshToken = req.refreshToken;

        const tokenRepo = role === 'admin'
            ? adminTokenRepository
            : userTokenRepository;

        const relationName = role === 'admin' ? 'admin' : 'user';
        const userToken = await tokenRepo.findOne({
            where: { refresh_token: refreshToken },
            relations: [relationName]
        });

        if (!userToken) {
            logger.warn(`Refresh failed: token not found in DB, subjectId=${id}, role=${role}`);
            return res.status(403).json({ message: 'Refresh token tidak ditemukan atau sudah dicabut' });
        }

        const { accessToken, refreshToken: newRefreshToken } = generateTokens(id, role);

        userToken.refresh_token = newRefreshToken;
        userToken.expires_at = new Date(Date.now() + ms(process.env.JWT_REFRESH_EXPIRES));
        await tokenRepo.save(userToken);

        logger.info(`Refresh successful: subjectId=${id}, role=${role}`);

        res.cookie("refreshToken", newRefreshToken, {
            httpOnly: true,
            secure: process.env.COOKIE_SECURE === 'true',
            sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
            path: "/",
            maxAge: ms(process.env.JWT_REFRESH_EXPIRES)
        });
        res.status(200).json({ accessToken });
    } catch (error) {
        logger.error(`refreshToken error: ${error}`, { stack: error.stack });
        res.status(500).json({ message: 'Terjadi kesalahan', error: error });
    }
};

exports.verifyOtp = async (req, res) => {
    try {
        const userRepository = getRepository(User);

        const { email, otp } = req.body;
        logger.info(`POST /auth/verify-otp accessed, email=${email}`);

        if (!email || !otp) {
            return res.status(400).json({ message: 'Email dan OTP diperlukan' });
        }

        const user = await userRepository.findOne({ where: { email } });
        if (!user) return res.status(404).json({ message: 'User tidak ditemukan' });

        if (user.status_akun === 'aktif') {
            logger.warn(`Verify OTP failed: already active, email=${email}`);
            return res.status(400).json({ message: 'Akun sudah terverifikasi' });
        }

        if (!user.otp || !user.otp_expiry) {
            logger.warn(`Verify OTP failed: no active OTP, email=${email}`);
            return res.status(400).json({ message: 'Tidak ada OTP yang aktif. Silakan minta OTP ulang.' });
        }

        const now = new Date();
        if (now > new Date(user.otp_expiry)) {
            logger.warn(`OTP expired for email=${email}, expiredAt=${user.otp_expiry}`);
            return res.status(400).json({ message: 'OTP sudah kadaluarsa. Silakan request ulang.' });
        }

        if (user.otp !== otp) {
            logger.warn(`Invalid OTP attempt for email=${email}`);
            return res.status(400).json({ message: 'OTP salah' });
        }

        user.status_akun = 'aktif';
        user.otp = null;
        user.otp_expiry = null;
        await userRepository.save(user);

        logger.info(`Email verified successfully: email=${email}, userId=${user.id}`);
        res.status(200).json({ message: 'Verifikasi berhasil. Akun sudah aktif.' });
    } catch (error) {
        logger.error(`verifyOtp error: ${error}`, { stack: error.stack });
        res.status(500).json({ message: 'Terjadi kesalahan', error: error });
    }
};

exports.resendOtp = async (req, res) => {
    try {
        const userRepository = getRepository(User);

        const { email } = req.body;
        logger.info(`POST /auth/resend-otp accessed, email=${email}`);

        if (!email) return res.status(400).json({ message: 'Email diperlukan' });

        const user = await userRepository.findOne({ where: { email } });
        if (!user) return res.status(404).json({ message: 'User tidak ditemukan' });

        if (user.status_akun === 'aktif') {
            logger.warn(`Resend OTP failed: already active, email=${email}`);
            return res.status(400).json({ message: 'Akun sudah terverifikasi' });
        }

        const otp = generateOtp();
        const expiresMinutes = parseInt(process.env.OTP_EXPIRES_MINUTES, 10);
        user.otp = otp;
        user.otp_expiry = getExpiryDate(expiresMinutes);
        await userRepository.save(user);

        try {
            await sendOtpEmail(email, otp, expiresMinutes);
            logger.info(`OTP resent: email=${email}, expiresAt=${user.otp_expiry}`);
        } catch (mailError) {
            logger.error(`Failed to resend OTP: ${mailError.message}, email=${email}`, { stack: mailError.stack });
            return res.status(500).json({ message: 'Gagal mengirim OTP, coba lagi nanti' });
        }

        res.status(200).json({ message: 'OTP terkirim ulang ke email' });
    } catch (error) {
        logger.error(`resendOtp error: ${error}`, { stack: error.stack });
        res.status(500).json({ message: 'Terjadi kesalahan', error: error });
    }
};

exports.logout = async (req, res) => {
    try {
        const userTokenRepository = getRepository(UserToken);
        const adminTokenRepository = getRepository(AdminToken);

        const accessToken = req.headers.authorization?.split(' ')[1];
        if (accessToken) addToBlacklist(accessToken);

        const refreshToken = req.cookies?.refreshToken;
        const role = req.user?.role || 'user';

        if (refreshToken) {
            if (role === 'admin') {
                await adminTokenRepository.delete({ refresh_token: refreshToken });
            } else {
                await userTokenRepository.delete({ refresh_token: refreshToken });
            }
        }

        const actor = role === 'admin' ? 'Admin' : 'User';
        logger.info(`${actor} logout: ${actor.toLowerCase()}Id=${req.user?.id || 'unknown'}`);

        res.clearCookie("refreshToken", { path: "/" });
        res.status(200).json({ message: 'Logout berhasil' });
    } catch (error) {
        logger.error(`Logout error: ${error}`, { stack: error.stack });
        res.status(500).json({ message: 'Terjadi kesalahan', error: error });
    }
}
