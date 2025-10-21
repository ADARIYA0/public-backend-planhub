require('dotenv').config();
const { connectDB, AppDataSource } = require('./src/config/database');
const { verifyTransporter } = require('./src/services/emailService');
const { verifyCorsConfig } = require('./src/config/corsOption');
const app = require('./app');
const logger = require('./src/utils/logger');

const PORT = process.env.PORT || 6000;
const NODE_ENV = process.env.NODE_ENV || 'development';

let server;

(async () => {
  try {
    await connectDB();
    await verifyTransporter();
    verifyCorsConfig();

    server = app.listen(PORT, '0.0.0.0', () => {
      logger.info(`Server running in ${NODE_ENV} mode on all interfaces (0.0.0.0:${PORT})`);
    });
  } catch (error) {
    logger.error(`Failed to start application: ${error}`);
    process.exit(1);
  }
})();

const shutdown = async (signal) => {
  try {
    logger.info(`Received ${signal}. Shutting down gracefully...`);

    if (server) {
      await new Promise((resolve, reject) => {
        server.close((error) => {
          if (error) return reject(error);
          logger.info('HTTP server closed.');
          resolve();
        });
      });
    }

    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
      logger.info('Database connection closed. Server has been successfully shutdown gracefully!');
    }

    process.exit(0);
  } catch (error) {
    logger.error(`Error during shutdown: ${error}`);
    process.exit(1);
  }
};

['SIGINT', 'SIGTERM'].forEach((signal) => {
  process.on(signal, () => shutdown(signal));
});

process.on('SIGKILL', () => {
  logger.warn('SIGKILL received: cannot perform graceful shutdown, process will be killed immediately.');
})
