const jwt = require('jsonwebtoken');
const logger = require('./logger');
const ms = require('ms');

function generateTokens(subjectId, role = 'user') {
    const payload = { id: subjectId, role };

    const accessToken = jwt.sign(
        payload,
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_ACCESS_EXPIRES }
    );

    const refreshToken = jwt.sign(
        payload,
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: process.env.JWT_REFRESH_EXPIRES }
    );

    logger.debug(`Generated tokens for subjectId=${subjectId}, role=${role}`);
    return { accessToken, refreshToken };
}

function getRefreshExpiryDate() {
    return new Date(Date.now() + ms(process.env.JWT_REFRESH_EXPIRES));
}

let blacklist = [];
function addToBlacklist(token) {
    blacklist.push(token);
}

function isBlacklisted(token) {
    return blacklist.includes(token);
}

module.exports = {
    addToBlacklist,
    generateTokens,
    getRefreshExpiryDate,
    isBlacklisted
};
