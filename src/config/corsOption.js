require('dotenv').config();
const logger = require('../utils/logger');

const allowedOrigins = (process.env.CORS_ORIGINS || '')
    .split(',')
    .map(origin => origin.trim())
    .filter(Boolean);

const LOG_CACHE_TTL_MS = 60 * 1000; // 1 minute
const recentOriginLog = new Map();
const recentNoOriginLogKey = '__no_origin__';

function shouldLogOnce(key) {
    const now = Date.now();
    const last = recentOriginLog.get(key);
    if (!last || (now - last) > LOG_CACHE_TTL_MS) {
        recentOriginLog.set(key, now);
        return true;
    }
    return false;
}

const corsOptions = {
    origin: function (origin, callback) {
        if (!origin) {
            if (process.env.NODE_ENV !== 'production' && shouldLogOnce(recentNoOriginLogKey)) {
                logger.debug('No origin provided — allowing request (likely server-to-server or Postman)');
            }
            return callback(null, true);
        }

        if (allowedOrigins.includes(origin)) {
            if (process.env.NODE_ENV !== 'production' && shouldLogOnce(origin)) {
                logger.debug(`Allowed origin: ${origin}`);
            }
            return callback(null, true);
        }

        logger.warn(`Blocked origin: ${origin} — not in allowed list`);
        return callback(new Error(`Origin ${origin} not allowed by CORS policy`));
    },
    credentials: true,
    optionsSuccessStatus: 200,
};

function verifyCorsConfig() {
    if (allowedOrigins.length === 0) {
        logger.warn('Warning: No allowed origins set in environment variable (CORS_ORIGINS)');
    } else {
        logger.info(`Allowed origins verified: ${allowedOrigins.join(', ')}`);
    }
    return allowedOrigins;
}

module.exports = { corsOptions, verifyCorsConfig };
