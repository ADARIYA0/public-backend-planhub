const { body } = require('express-validator');

exports.registerValidator = [
    body('email')
        .notEmpty().withMessage('Email wajib diisi')
        .isEmail().withMessage('Format email tidak valid'),
    body('no_handphone')
        .notEmpty().withMessage('Nomor handphone wajib diisi'),
    body('password')
        .notEmpty().withMessage('Password wajib diisi')
        .isLength({ min: 8 }).withMessage('Password minimal 8 karakter')
        .matches(/\d/).withMessage('Password harus mengandung angka')
        .matches(/[A-Z]/).withMessage('Password harus mengandung huruf besar')
        .matches(/[a-z]/).withMessage('Password harus mengandung huruf kecil')
        .matches(/[\W_]/).withMessage('Password harus mengandung karakter spesial'),
    body('alamat')
        .notEmpty().withMessage('Alamat wajib diisi'),
    body('pendidikan_terakhir')
        .notEmpty().withMessage('Pendidikan terakhir wajib diisi')
        .isIn(['SD/MI', 'SMP/MTS', 'SMA/SMK', 'Diploma', 'Sarjana', 'Lainnya'])
        .withMessage('Pendidikan terakhir tidak valid')
];

exports.loginValidator = [
    body('email')
        .notEmpty().withMessage('Email wajib diisi')
        .isEmail().withMessage('Format email tidak valid'),
    body('password')
        .notEmpty().withMessage('Password wajib diisi')
];
