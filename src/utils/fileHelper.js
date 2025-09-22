const fs = require('fs');
const logger = require('./logger');

/**
 * Hapus array path file secara async
 * @param {string[]} filePaths
 */
function cleanupFiles(filePaths = []) {
    filePaths.forEach((filePath) => {
        if (!filePath) return;
        fs.unlink(filePath, (err) => {
            if (err) {
                logger.warn('Cleanup failed', { file: filePath, error: err.message });
            } else {
                logger.debug('File cleaned up', { file: filePath });
            }
        });
    });
}

module.exports = { cleanupFiles };