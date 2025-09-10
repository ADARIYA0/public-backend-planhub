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

// REGISTER (sekali daftar, kirim OTP ke gmail)
exports.register = async (req, res) => {
    try {
        const { email, no_handphone, password, alamat, pendidikan_terakhir } = req.body;

        logger.info(`User registration attempt: email=${email}`);

        const existingUser = await userRepository.findOne({ where: { email } });
        if (existingUser) {
            logger.warn(`Registration failed: email already exists (email=${email})`);
            return res.status(400).json({ message: 'Email sudah terdaftar' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const otp = generateOtp();
        const expiresMinutes = parseInt(process.env.OTP_EXPIRES_MINUTES, 10) || 15;

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

        // kirim OTP via email (jangan log OTP-nya)
        try {
            await sendOtpEmail(email, otp, expiresMinutes);
            logger.info(`OTP sent for registration: email=${email}`);
        } catch (mailError) {
            // email gagal dikirim — log saja (user sudah terdaftar di DB)
            logger.error(`Failed to send OTP email after registration (email=${email}): ${mailError.message}`);
            // kamu bisa pilih untuk menghapus user jika pengiriman email gagal; di sini kita tetap biarkan
        }

        res.status(201).json({ message: 'Registrasi berhasil. Kode OTP telah dikirim ke email.', user: { id: newUser.id, email: newUser.email } });
    } catch (error) {
        logger.error(`Registration error for email=${req.body.email}: ${error.message}`);
        res.status(500).json({ message: 'Terjadi kesalahan', error: error.message });
    }
};

// LOGIN    
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        logger.info(`Login attempt: email=${email}`);

        const user = await userRepository.findOne({ where: { email } });
        if (!user) {
            logger.warn(`Login failed: user not found (email=${email})`);
            return res.status(404).json({ message: 'User tidak ditemukan' });
        }

        if (user.status_akun !== 'aktif') {
            logger.warn(`Login failed: account not verified (email=${email})`);
            return res.status(403).json({ message: 'Akun belum terverifikasi. Silakan verifikasi lewat OTP.' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            logger.warn(`Login failed: wrong password (email=${email})`);
            return res.status(400).json({ message: 'Password salah' });
        }

        const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET || 'secret', { expiresIn: '1h' });

        logger.info(`Login successful: userId=${user.id}, email=${email}`);

        res.status(200).json({ message: 'Login berhasil', token });
    } catch (error) {
        logger.error(`Login error for email=${req.body.email}: ${error.message}`);
        res.status(500).json({ message: 'Terjadi kesalahan', error: error.message });
    }
};

// VERIFY OTP
exports.verifyOtp = async (req, res) => {
    try {
        const { email, otp } = req.body;

        if (!email || !otp) {
            return res.status(400).json({ message: 'Email dan OTP diperlukan' });
        }

        const user = await userRepository.findOne({ where: { email } });
        if (!user) return res.status(404).json({ message: 'User tidak ditemukan' });

        if (user.status_akun === 'aktif') {
            return res.status(400).json({ message: 'Akun sudah terverifikasi' });
        }

        if (!user.otp || !user.otp_expiry) {
            return res.status(400).json({ message: 'Tidak ada OTP yang aktif. Silakan minta OTP ulang.' });
        }

        const now = new Date();
        if (now > new Date(user.otp_expiry)) {
            logger.warn(`OTP expired for email=${email}`);
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
        logger.error(`verifyOtp error: ${error.message}`);
        res.status(500).json({ message: 'Terjadi kesalahan', error: error.message });
    }
};

// RESEND OTP
exports.resendOtp = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ message: 'Email diperlukan' });

        const user = await userRepository.findOne({ where: { email } });
        if (!user) return res.status(404).json({ message: 'User tidak ditemukan' });

        if (user.status_akun === 'aktif') {
            return res.status(400).json({ message: 'Akun sudah terverifikasi' });
        }

        const otp = generateOtp();
        const expiresMinutes = parseInt(process.env.OTP_EXPIRES_MINUTES, 10) || 15;
        user.otp = otp;
        user.otp_expiry = getExpiryDate(expiresMinutes);
        await userRepository.save(user);

        try {
            await sendOtpEmail(email, otp, expiresMinutes);
            logger.info(`OTP resent to email=${email}`);
        } catch (mailError) {
            logger.error(`Failed to resend OTP email to ${email}: ${mailError.message}`);
            return res.status(500).json({ message: 'Gagal mengirim OTP, coba lagi nanti' });
        }

        res.status(200).json({ message: 'OTP terkirim ulang ke email' });
    } catch (error) {
        logger.error(`resendOtp error: ${error.message}`);
        res.status(500).json({ message: 'Terjadi kesalahan', error: error.message });
    }
};

// LOGOUT (meminta verifyToken middleware agar req.user tersedia)
exports.logout = async (req, res) => {
    try {
        const userId = req.user?.id || 'unknown';
        logger.info(`User logout: userId=${userId}`);
        res.status(200).json({ message: 'Logout berhasil (hapus token di client)' });
    } catch (error) {
        logger.error(`Logout error: ${error.message}`);
        res.status(500).json({ message: 'Terjadi kesalahan', error: error.message });
    }
};
