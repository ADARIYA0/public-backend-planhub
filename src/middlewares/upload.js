const multer = require('multer');
const path = require('path');
const fs = require('fs');

const UPLOAD_DIRS = {
    flyer_kegiatan: path.join(__dirname, '..', '..', 'uploads', 'flyer'), // uploads/flyer
    gambar_kegiatan: path.join(__dirname, '..', '..', 'uploads', 'events'), // uploads/events
    sertifikat_kegiatan: path.join(__dirname, '..', '..', 'uploads', 'certificates') // uploads/certificates
};

Object.values(UPLOAD_DIRS).forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

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
    if (
        /^image\/(jpeg|png|webp|gif)$/.test(file.mimetype) ||
        file.mimetype === 'application/pdf'
    ) {
        cb(null, true);
    } else {
        cb(new Error('Only image and PDF files are allowed'), false);
    }
};

const upload = multer({
    storage,
    limits: { fileSize: parseInt(20 * 1024 * 1024) }, // 20MB
    fileFilter
});

module.exports = upload;
