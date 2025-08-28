const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');
const User = require('../entities/User');
const { AppDataSource } = require('../config/database');

const userRepository = AppDataSource.getRepository('User');

// REGISTER
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

        const newUser = userRepository.create({
            email,
            no_handphone,
            password: hashedPassword,
            alamat,
            pendidikan_terakhir,
            status_akun: 'belum-aktif'
        });

        await userRepository.save(newUser);

        logger.info(`User registered successfully: id=${newUser.id}, email=${email}`);

        res.status(201).json({ message: 'Registrasi berhasil', user: newUser });
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

// LOGOUT (Client-side biasanya hapus token)
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
