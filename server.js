require('dotenv').config();
const logger = require('./src/utils/logger');
const { connectDB } = require('./src/config/database');
const app = require('./app');

const PORT = process.env.PORT || 6000;
const NODE_ENV = process.env.NODE_ENV || 'development';

connectDB();

app.listen(PORT, () => {
  logger.info(`Server running in ${NODE_ENV} mode on http://localhost:${PORT}`);
});
