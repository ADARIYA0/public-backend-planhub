const { body, validationResult } = require('express-validator');
const logger = require('../utils/logger');

const eventValidationRules = [
    body('judul_kegiatan').notEmpty().withMessage('judul_kegiatan is required').isLength({ max: 255 }),
    body('deskripsi_kegiatan').notEmpty().withMessage('deskripsi_kegiatan is required'),
    body('lokasi_kegiatan').notEmpty().withMessage('lokasi_kegiatan is required'),
    body('waktu_mulai').notEmpty().withMessage('waktu_mulai is required').isISO8601().toDate(),
    body('waktu_berakhir').notEmpty().withMessage('waktu_berakhir is required').isISO8601().toDate()
        .custom((value, { req }) => {
            const start = new Date(req.body.waktu_mulai);
            const end = new Date(value);
            if (end < start) throw new Error('waktu_berakhir must be after or equal to waktu_mulai');
            return true;
        }),
    body('kapasitas_peserta').optional().isInt({ min: 0 }).toInt(),
    body('harga').optional().isFloat({ min: 0 }).toFloat(),
    body('kategori_id').optional().isInt().toInt()
];

const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        logger.warn('Validation failed creating event', { errors: errors.array() });
        return res.status(422).json({ errors: errors.array() });
    }
    next();
};

module.exports = {
    eventValidationRules,
    validate
};
