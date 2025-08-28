require('dotenv').config();
require('reflect-metadata');
const { DataSource } = require('typeorm');
const logger = require('../utils/logger');

const AppDataSource = new DataSource({
  type: 'mariadb',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT, 10),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  synchronize: true, // jangan aktifkan di production (hanya untuk dev)
  logging: false,
  entities: [
    require('../entities/User')
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
