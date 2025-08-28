require('dotenv').config();
const express = require('express');
const morgan = require('morgan');
const logger = require('./src/utils/logger');
const { connectDB } = require('./src/config/database');

const app = express();
const PORT = process.env.PORT || 4000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Middleware untuk parse JSON
app.use(express.json());
// Morgan middleware for HTTP request log
app.use(morgan('dev'));

connectDB();

app.get('/status', (req, res) => {
  logger.info('Health check endpoint accessed');
  res.status(200).json({
    status: 'OK',
    message: 'Server is healthy or running normal',
    environment: NODE_ENV,
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  logger.info(`Server running in ${NODE_ENV} mode on http://localhost:${PORT}`);
});