const express = require('express');
const adminController = require('../controllers/adminController');

const router = express.Router();

router.post('/register', adminController.registerAdmin);
router.post('/login', adminController.loginAdmin);
// refresh token route still in /api/auth/refresh-token (already exist) -> using verifyRefreshToken middleware
// logout still using /api/auth/logout (already exist) and now already support different roles (admin & user)

module.exports = router;
