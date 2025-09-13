const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');
const User = require('../entities/User');
const { AppDataSource } = require('../config/database');
const { sendOtpEmail } = require('../services/emailService');

const userRepository = AppDataSource.getRepository('User');

function generateOtp() {
    return Math.floor(100000 + Math.random() * 900000).toString(); // 6 digit
}

function getExpiryDate(minutes) {
    return new Date(Date.now() + minutes * 60 * 1000);
}

// REGISTER
exports.register = async (req, res) => {
    const ip = req.ip || req.connection.remoteAddress;
    const agent = req.headers['user-agent'];

    try {
        const { email, no_handphone, password, alamat, pendidikan_terakhir } = req.body;

        logger.info(`POST /auth/register accessed, email=${email}, ip=${ip}, agent=${agent}`);

        // Cari user yang punya email ATAU nomor handphone sama
        const existingUsers = await userRepository.find({
            where: [
                { email },
                { no_handphone }
            ]
        });

        let errors = [];
        for (const u of existingUsers) {
            if (u.email === email) {
                errors.push('Email sudah terdaftar');
            }
            if (u.no_handphone === no_handphone) {
                errors.push('Nomor handphone sudah terdaftar');
            }
        }

        if (errors.length > 0) {
            logger.warn(`Registration failed: ${errors.join(', ')}, ip=${ip}, email=${email}`);
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
        logger.error(`Registration error for email=${req.body.email}: ${error.message}`, { stack: error.stack });
        res.status(500).json({ message: 'Terjadi kesalahan', error: error.message });
    }
};

// LOGIN    
exports.login = async (req, res) => {
    const ip = req.ip || req.connection.remoteAddress;
    const agent = req.headers['user-agent'];

    try {
        const { email, password } = req.body;

        logger.info(`POST /auth/login accessed, email=${email}, ip=${ip}, agent=${agent}`);

        const user = await userRepository.findOne({ where: { email } });
        if (!user) {
            logger.warn(`Login failed: user not found, email=${email}, ip=${ip}`);
            return res.status(404).json({ message: 'User tidak ditemukan' });
        }

        if (user.status_akun !== 'aktif') {
            logger.warn(`Login failed: account not verified, email=${email}, ip=${ip}`);
            return res.status(403).json({ message: 'Akun belum terverifikasi. Silakan verifikasi lewat OTP.' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            logger.warn(`Login failed: wrong password, email=${email}, ip=${ip}`);
            return res.status(400).json({ message: 'Password salah' });
        }

        const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });

        logger.info(`Login successful: userId=${user.id}, email=${email}, ip=${ip}`);
        logger.debug(`Generated JWT payload: ${JSON.stringify({ id: user.id })}`);

        res.status(200).json({ message: 'Login berhasil', token });
    } catch (error) {
        logger.error(`Login error for email=${req.body.email}: ${error.message}`, { stack: error.stack });
        res.status(500).json({ message: 'Terjadi kesalahan', error: error.message });
    }
};

// VERIFY OTP
exports.verifyOtp = async (req, res) => {
    const ip = req.ip || req.connection.remoteAddress;

    try {
        const { email, otp } = req.body;
        logger.info(`POST /auth/verify-otp accessed, email=${email}, ip=${ip}`);

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
        logger.error(`verifyOtp error: ${error.message}`, { stack: error.stack });
        res.status(500).json({ message: 'Terjadi kesalahan', error: error.message });
    }
};

// RESEND OTP
exports.resendOtp = async (req, res) => {
    const ip = req.ip || req.connection.remoteAddress;

    try {
        const { email } = req.body;
        logger.info(`POST /auth/resend-otp accessed, email=${email}, ip=${ip}`);

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
        logger.error(`resendOtp error: ${error.message}`, { stack: error.stack });
        res.status(500).json({ message: 'Terjadi kesalahan', error: error.message });
    }
};

// LOGOUT (meminta verifyToken middleware agar req.user tersedia)
exports.logout = async (req, res) => {
    const ip = req.ip || req.connection.remoteAddress;

    try {
        const userId = req.user?.id || 'unknown';
        logger.info(`User logout: userId=${userId}, ip=${ip}, url=${req.originalUrl}`);
        res.status(200).json({ message: 'Logout berhasil (hapus token di client)' });
    } catch (error) {
        logger.error(`Logout error: ${error.message}`, { stack: error.stack });
        res.status(500).json({ message: 'Terjadi kesalahan', error: error.message });
    }
};
