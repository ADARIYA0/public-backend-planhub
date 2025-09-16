const { createLogger, format, transports } = require('winston');
require('winston-daily-rotate-file');

const logFormat = format.printf(({ timestamp, level, message, stack }) => {
  return `[${timestamp}] ${level}: ${stack || message}`;
});

const logger = createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: format.combine(
    format.timestamp({ format: 'DD-MM-YYYY HH:mm:ss' }),
    format.errors({ stack: true }),
    logFormat
  ),
  transports: [
    // Console untuk dev
    new transports.Console({
      format: format.combine(
        format.colorize(),
        format.timestamp({ format: 'DD-MM-YYYY HH:mm:ss' }),
        logFormat
      )
    }),

    new transports.DailyRotateFile({
      filename: 'logs/app-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '14d'
    })
  ],
  exceptionHandlers: [
    new transports.File({ filename: 'logs/exceptions.log' })
  ],
  rejectionHandlers: [
    new transports.File({ filename: 'logs/rejections.log' })
  ]
});

module.exports = logger;