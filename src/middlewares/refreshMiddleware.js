const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

const verifyRefreshToken = (req, res, next) => {
    const refreshToken = req.cookies?.refreshToken;

    if (!refreshToken) {
        return res.status(401).json({ message: 'Refresh token tidak ditemukan' });
    }

    jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET, (err, decoded) => {
        if (err) {
            const msg = err.name === 'TokenExpiredError'
                ? 'Refresh token kadaluarsa, silakan login ulang'
                : 'Refresh token tidak valid';
            logger.warn(`${msg}, ip=${req.ip}`);
            return res.status(403).json({ message: msg });
        }

        req.user = { id: decoded.id };
        req.refreshToken = refreshToken;
        next();
    });
};

module.exports = verifyRefreshToken;
