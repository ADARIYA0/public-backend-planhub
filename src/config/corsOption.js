require('dotenv').config();
const logger = require('../utils/logger');

const allowedOrigins = (process.env.CORS_ORIGINS || '')
    .split(',')
    .map(origin => origin.trim())
    .filter(Boolean);

const corsOptions = {
    origin: function (origin, callback) {
        if (!origin) {
            logger.debug('No origin provided — allowing request (likely server-to-server or Postman)');
            return callback(null, true);
        }

        if (allowedOrigins.includes(origin)) {
            logger.debug(`Allowed origin: ${origin}`);
            callback(null, true);
        } else {
            logger.warn(`Blocked origin: ${origin} — not in allowed list`);
            callback(new Error(`Origin ${origin} not allowed by CORS policy`));
        }
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
