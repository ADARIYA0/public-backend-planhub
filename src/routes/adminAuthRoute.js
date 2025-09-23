const express = require('express');
const adminAuthController = require('../controllers/adminAuthController');

const router = express.Router();

router.post('/register', adminAuthController.registerAdmin);
router.post('/login', adminAuthController.loginAdmin);
// refresh token route still in /api/auth/refresh-token (already exist) -> using verifyRefreshToken middleware
// logout still using /api/auth/logout (already exist) and now already support different roles (admin & user)

module.exports = router;
