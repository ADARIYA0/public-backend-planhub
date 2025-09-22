const { eventValidationRules, validate } = require('../validators/eventValidator');
const express = require('express');
const eventController = require('../controllers/eventController');
const upload = require('../middlewares/upload');

const router = express.Router();

router.get('/', eventController.getAllEvent);
router.post(
    '/',
    upload.fields([
        { name: 'flyer_kegiatan', maxCount: 1 },
        { name: 'gambar_kegiatan', maxCount: 1 },
        { name: 'sertifikat_kegiatan', maxCount: 1 }
    ]),
    eventValidationRules,
    validate,
    eventController.createEvent
);
router.get('/slug/:slug', eventController.getEventBySlug);
router.get('/:id', eventController.getEventById);

module.exports = router;
