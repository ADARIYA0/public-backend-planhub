const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');
const { isBlacklisted } = require('../utils/tokenUtils');

const verifyToken = (req, res, next) => {
    const ip = req.ip || req.connection.remoteAddress;
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        logger.warn(`Token missing/malformed, ip=${ip}, url=${req.originalUrl}`);
        return res.status(401).json({ message: 'Token tidak ditemukan atau format salah' });
    }

    const token = authHeader.split(' ')[1];

    if (isBlacklisted(token)) {
        logger.warn(`Blacklisted token used, ip=${ip}`);
        return res.status(403).json({ message: 'Token tidak valid (blacklisted)' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        logger.debug(`Token verified: userId=${decoded.id}, ip=${ip}, url=${req.originalUrl}`);
        next();
    } catch (error) {
        logger.warn(`Invalid token: ${error}, ip=${ip}, url=${req.originalUrl}`);
        return res.status(403).json({ message: 'Token tidak valid atau sudah expired' });
    }
};

module.exports = verifyToken;
