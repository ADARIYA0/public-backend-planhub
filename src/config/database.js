const { DataSource } = require('typeorm');
const logger = require('../utils/logger');
require('dotenv').config();
require('reflect-metadata');

const requiredEnv = [
  'DB_HOST',
  'DB_PORT',
  'DB_USER',
  'DB_NAME',
  'DB_SYNCHRONIZE'
];

const missingEnv = requiredEnv.filter(key => !process.env[key]);
if (missingEnv.length > 0) {
  logger.error(`Missing required environment variables for database: ${missingEnv.join(', ')}`);
  process.exit(1);
}

if (process.env.DB_USER !== 'root' && !process.env.DB_PASSWORD) {
  logger.error(`DB_PASSWORD is required`);
  process.exit(1);
}

const AppDataSource = new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST.trim(),
  port: parseInt(process.env.DB_PORT, 10),
  username: process.env.DB_USER.trim(),
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME.trim(),
  synchronize: process.env.DB_SYNCHRONIZE === 'true',
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
    logger.error(`Database connection failed: ${error}`);
    process.exit(1);
  }
};

module.exports = { AppDataSource, connectDB };
