const { createLogger, format, transports } = require('winston');
require('winston-daily-rotate-file');

const { combine, timestamp, errors, printf } = format;

const fileFormat = combine(
  timestamp({ format: 'DD-MM-YYYY HH:mm:ss' }),
  errors({ stack: true }),
  printf(({ timestamp, level, message, stack }) => `[${timestamp}] ${level}: ${stack || message}`)
);

const consoleFormat = combine(
  format.colorize(),
  timestamp({ format: 'HH:mm:ss' }),
  printf(({ timestamp, level, message }) => `[${timestamp}] ${level}: ${message}`)
);

const warnAndInfoFilter = format((info) => {
  return info.level === 'warn' || info.level === 'info' ? info : false;
});

const logger = createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  transports: [
    new transports.Console({
      level: 'debug',
      format: consoleFormat,
    }),

    new transports.DailyRotateFile({
      filename: 'logs/app-%DATE%.log',
      datePattern: 'DD-MM-YYYY',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '14d',
      format: combine(warnAndInfoFilter(), fileFormat),
    }),

    new transports.File({
      filename: 'logs/error.log',
      level: 'error',
      format: fileFormat,
      handleExceptions: false,
    }),
  ],

  exceptionHandlers: [
    new transports.File({
      filename: 'logs/exceptions.log',
      format: fileFormat,
    }),
  ],

  rejectionHandlers: [
    new transports.File({
      filename: 'logs/rejections.log',
      format: fileFormat,
    }),
  ],
});

module.exports = logger;
