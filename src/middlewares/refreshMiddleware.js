const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

const verifyRefreshToken = (req, res, next) => {
    const refreshToken = req.cookies?.refreshToken;

    if (!refreshToken) {
        return res.status(401).json({ message: 'Refresh token tidak ditemukan' });
    }

    jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET, (error, decoded) => {
        if (error) {
            const msg = error.name === 'TokenExpiredError'
                ? 'Refresh token kadaluarsa, silakan login ulang'
                : 'Refresh token tidak valid';
            logger.warn(`${msg}, ip=${req.ip}`);
            return res.status(403).json({ message: msg });
        }

        // IMPORTANT: decoded must include role when token is already created (we will include it)
        req.user = { id: decoded.id, role: decoded.role || 'user' };
        req.refreshToken = refreshToken;
        next();
    });
};

module.exports = verifyRefreshToken;
