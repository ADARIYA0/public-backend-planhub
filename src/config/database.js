const { DataSource } = require('typeorm');
const logger = require('../utils/logger');
require('dotenv').config();
require('reflect-metadata');

const AppDataSource = new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT, 10),
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  synchronize: process.env.DB_SYNCHRONIZE,
  logging: false,
  entities: [
    require('../entities/Auth/User'),
    require('../entities/Auth/UserToken'),
    require('../entities/Auth/Admin'),
    require('../entities/Auth/AdminToken'),
    require('../entities/Events/Event'),
    require('../entities/Events/EventCategory'),
    require('../entities/Events/Attendance')
  ]
});

const connectDB = async () => {
  try {
    await AppDataSource.initialize();
    logger.info('Database connected successfully!');
  } catch (error) {
    logger.error(`Database connection failed: ${error.message}`);
    process.exit(1);
  }
};

module.exports = { AppDataSource, connectDB };
