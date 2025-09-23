const multer = require('multer');
const path = require('path');
const fs = require('fs');

const UPLOAD_DIRS = {
    flyer_kegiatan: path.join(__dirname, '..', '..', 'uploads', 'flyer'),
    gambar_kegiatan: path.join(__dirname, '..', '..', 'uploads', 'events'),
    sertifikat_kegiatan: path.join(__dirname, '..', '..', 'uploads', 'certificates')
};

Object.values(UPLOAD_DIRS).forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

const MAX_SIZE = 10 * 1024 * 1024; // 10MB

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const field = file.fieldname;
        const dir = UPLOAD_DIRS[field] || UPLOAD_DIRS.gambar_kegiatan;
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        const base = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        cb(null, `${base}${ext}`);
    }
});

const fileFilter = (req, file, cb) => {
    const allowed = /^image\/(jpeg|png|webp|gif)$/.test(file.mimetype);
    if (!allowed) {
        return cb(new Error('Only image files are allowed (JPEG, PNG, WEBP, GIF)'), false);
    }

    if (file.size > MAX_SIZE) {
        return cb(new Error(`File ${file.fieldname} exceeds the maximum size of 10MB`), false);
    }

    cb(null, true);
};

const upload = multer({
    storage,
    limits: { fileSize: MAX_SIZE },
    fileFilter
});

module.exports = upload;
