const { AppDataSource } = require('../config/database');
const logger = require('./logger');

/**
 * Lazy getter untuk repository TypeORM.
 * Pastikan DataSource sudah diinisialisasi.
 * @param {EntityClass} entityClass
 * @returns {Repository}
 */
function getRepository(entityClass) {
    if (!AppDataSource.isInitialized) {
        throw new Error(`DataSource belum diinisialisasi. Panggil connectDB() dulu.`);
    }

    try {
        return AppDataSource.getRepository(entityClass);
    } catch (error) {
        logger.error(`Gagal mendapatkan repository untuk ${entityClass.name}: ${error}`);
        throw error;
    }
}

module.exports = { getRepository };
