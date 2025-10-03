const fs = require('fs');
const fsPromises = fs.promises;
const logger = require('./logger');
const path = require('path');

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

/**
 * Rename/move uploaded file to a filename based on slug (preserve extension).
 * Ensures not to overwrite existing file by appending counter if necessary.
 *
 * @param {Object} fileObj - multer file object (expects .path and .originalname)
 * @param {string} destDir - destination directory absolute path
 * @param {string} baseName - desired base name WITHOUT extension, e.g. "my-event-flyer"
 * @returns {Promise<{ filename: string, path: string }>} - new filename and full path
 */
async function renameUploadedFileToSlug(fileObj, destDir, baseName) {
    if (!fileObj) return null;
    await fsPromises.mkdir(destDir, { recursive: true });

    const ext = path.extname(fileObj.originalname) || path.extname(fileObj.filename) || '';
    let filename = `${baseName}${ext}`;
    let destPath = path.join(destDir, filename);
    let counter = 0;

    // If destPath exists, add suffix -1, -2 ...
    while (true) {
        try {
            await fsPromises.access(destPath, fs.constants.F_OK);
            counter += 1;
            filename = `${baseName}-${counter}${ext}`;
            destPath = path.join(destDir, filename);
        } catch (err) {
            // not exists -> we can use it
            break;
        }
    }

    await fsPromises.rename(fileObj.path, destPath);

    logger.debug('File renamed to slug name', { from: fileObj.path, to: destPath });
    return { filename, path: destPath };
}

module.exports = { cleanupFiles, renameUploadedFileToSlug };
