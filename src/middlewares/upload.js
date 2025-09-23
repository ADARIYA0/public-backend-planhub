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

const MAX_SIZES = {
    flyer_kegiatan: 20 * 1024 * 1024,       // 20MB
    sertifikat_kegiatan: 20 * 1024 * 1024,  // 20MB
    gambar_kegiatan: 5 * 1024 * 1024        // 5MB
};

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
    const allowed = /^image\/(jpeg|png|webp|gif)$/.test(file.mimetype) || file.mimetype === 'application/pdf';
    if (!allowed) {
        return cb(new Error('Only image and PDF files are allowed'), false);
    }

    const maxSize = MAX_SIZES[file.fieldname] || (20 * 1024 * 1024);
    if (file.size > maxSize) {
        return cb(new Error(`File ${file.fieldname} exceeds the maximum size of ${maxSize / (1024 * 1024)}MB`), false);
    }

    cb(null, true);
};

// Still using the large limit so the multer can accept files up to 20MB
const upload = multer({
    storage,
    limits: { fileSize: 20 * 1024 * 1024 },
    fileFilter
});

module.exports = upload;
