require('dotenv').config();
const app = require('./app');
const logger = require('./src/utils/logger');
const { AppDataSource, connectDB } = require('./src/config/database');
const { verifyTransporter } = require('./src/services/emailService');

const PORT = process.env.PORT || 6000;
const NODE_ENV = process.env.NODE_ENV || 'development';

let server;

(async () => {
  try {
    await connectDB();
    await verifyTransporter();
    server = app.listen(PORT, () => {
      logger.info(`Server running in ${NODE_ENV} mode on http://localhost:${PORT}`);
    });
  } catch (error) {
    logger.error(`Failed to start application: ${error.message}`);
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
      logger.info('Database connection closed.');
    }

    process.exit(0);
  } catch (error) {
    logger.error(`Error during shutdown: ${error.message}`);
    process.exit(1);
  }
};

// Catch termination signals
['SIGINT', 'SIGTERM'].forEach((signal) => {
  process.on(signal, () => shutdown(signal));
});

// SIGKILL cannot be caught, but log a warning for clarity
process.on('SIGKILL', () => {
  logger.warn('SIGKILL received: cannot perform graceful shutdown, process will be killed immediately.');
})
