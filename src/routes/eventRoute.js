const { eventValidationRules, validate } = require('../validators/eventValidator');
const authorizeRoles = require('../middlewares/authorizeRoles');
const express = require('express');
const eventController = require('../controllers/eventController');
const upload = require('../middlewares/upload');
const verifyToken = require('../middlewares/authMiddleware');

const router = express.Router();

router.get('/', eventController.getAllEvent);

router.post(
    '/',
    verifyToken,
    authorizeRoles('admin'),
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
