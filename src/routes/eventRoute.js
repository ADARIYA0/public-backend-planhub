const express = require('express');
const eventController = require('../controllers/eventController');

const router = express.Router();

router.get('/', eventController.getAllEvent);
router.get('/:id', eventController.getEventById);

module.exports = router;
