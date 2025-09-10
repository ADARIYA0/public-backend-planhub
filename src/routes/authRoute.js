const express = require('express');
const authController = require('../controllers/authController');
const authValidator = require('../validators/authValidator');
const { validate } = require('../middlewares/validate');
const verifyToken = require('../middlewares/authMiddleware');

const router = express.Router();

router.post('/register', authValidator.registerValidator, validate, authController.register);
router.post('/login', authValidator.loginValidator, validate, authController.login);
router.post('/logout', verifyToken, authController.logout);

router.post('/verify-otp', authController.verifyOtp);
router.post('/resend-otp', authController.resendOtp);

module.exports = router;