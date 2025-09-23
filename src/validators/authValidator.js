const { body } = require('express-validator');

exports.registerValidator = [
    body('email')
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Email Format is not valid'),
    body('no_handphone')
        .notEmpty().withMessage('Nomor Handphone is required'),
    body('password')
        .notEmpty().withMessage('Password wajib diisi')
        .isLength({ min: 8 }).withMessage('Password must be 8 characters')
        .matches(/\d/).withMessage('Password must contain numbers')
        .matches(/[A-Z]/).withMessage('Password must contain uppercase letters')
        .matches(/[a-z]/).withMessage('Password must contain lowercase letters')
        .matches(/[\W_]/).withMessage('Password must contain special characters'),
    body('alamat')
        .notEmpty().withMessage('Alamat is required'),
    body('pendidikan_terakhir')
        .notEmpty().withMessage('Pendidikan Terakhir is required')
        .isIn(['SD/MI', 'SMP/MTS', 'SMA/SMK', 'Diploma', 'Sarjana', 'Lainnya'])
        .withMessage('Pendidikan Terakhir is not valid')
];

exports.loginValidator = [
    body('email')
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Email Format is not valid'),
    body('password')
        .notEmpty().withMessage('Password is required')
];
