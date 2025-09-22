const { AppDataSource } = require('../config/database');
const { cleanupFiles } = require('../utils/fileHelper');
const { startOfWeek, endOfWeek, startOfMonth, endOfMonth, addMonths } = require('date-fns');
const logger = require('../utils/logger');
const slugify = require('slugify');

const attendanceRepo = () => AppDataSource.getRepository('Attendance');
const categoryRepo = () => AppDataSource.getRepository('EventCategory');
const eventRepo = () => AppDataSource.getRepository('Event');

// GET ALL EVENTS
exports.getAllEvent = async (req, res) => {
    try {
        const page = Math.max(parseInt(req.query.page) || 1, 1);
        const limit = Math.min(parseInt(req.query.limit) || 10, 100);
        const offset = (page - 1) * limit;

        logger.info(`GET /event?page=${page}&limit=${limit} accessed`);

        const qb = eventRepo().createQueryBuilder('kegiatan')
            .leftJoinAndSelect('kegiatan.category', 'category')
            .orderBy('kegiatan.waktu_mulai', 'ASC');

        if (req.query.category) {
            qb.andWhere('category.slug = :slug', { slug: req.query.category });
            logger.debug(`Filtering by category slug=${req.query.category}`);
        }

        if (req.query.search) {
            qb.andWhere('(kegiatan.judul_kegiatan LIKE :q OR kegiatan.deskripsi_kegiatan LIKE :q)', { q: `%${req.query.search}%` });
            logger.debug(`Searching with query="${req.query.search}"`);
        }

        if (req.query.upcoming === 'true') {
            qb.andWhere('kegiatan.waktu_berakhir >= :now', { now: new Date() });
            logger.debug('Filtering only upcoming events');
        }

        if (req.query.time_range) {
            const now = new Date();

            switch (req.query.time_range) {
                case 'today':
                    qb.andWhere('DATE(kegiatan.waktu_mulai) = CURDATE()');
                    break;
                case 'this_week':
                    qb.andWhere('kegiatan.waktu_mulai BETWEEN :start AND :end', {
                        start: startOfWeek(now, { weekStartsOn: 1 }),
                        end: endOfWeek(now, { weekStartsOn: 1 })
                    });
                    break;
                case 'this_month':
                    qb.andWhere('kegiatan.waktu_mulai BETWEEN :start AND :end', {
                        start: startOfMonth(now),
                        end: endOfMonth(now)
                    });
                    break;
                case 'next_month':
                    qb.andWhere('kegiatan.waktu_mulai BETWEEN :start AND :end', {
                        start: startOfMonth(addMonths(now, 1)),
                        end: endOfMonth(addMonths(now, 1))
                    });
                    break;
                default:
                    logger.warn(`Unknown time_range filter: ${req.query.time_range}`);
            }

            logger.debug(`Filtering by time_range=${req.query.time_range}`);
        }

        const [items, total] = await qb.skip(offset).take(limit).getManyAndCount();

        const events = await Promise.all(items.map(async ev => {
            const count = await attendanceRepo().createQueryBuilder('d')
                .where('d.kegiatan_id = :id', { id: ev.id })
                .getCount();

            const is_full = (ev.kapasitas_peserta > 0) && (count >= ev.kapasitas_peserta);

            return {
                id: ev.id,
                judul_kegiatan: ev.judul_kegiatan,
                slug: ev.slug,
                deskripsi_kegiatan: ev.deskripsi_kegiatan,
                lokasi_kegiatan: ev.lokasi_kegiatan,
                flyer_kegiatan: ev.flyer_kegiatan,
                gambar_kegiatan: ev.gambar_kegiatan,
                kapasitas_peserta: ev.kapasitas_peserta,
                harga: ev.harga,
                waktu_mulai: ev.waktu_mulai,
                waktu_berakhir: ev.waktu_berakhir,
                kategori: ev.category
                    ? { id: ev.category.id, nama_kategori: ev.category.nama_kategori, slug: ev.category.slug }
                    : null,
                attendee_count: count,
                is_full
            };
        }));

        logger.info(`Events retrieved: count=${events.length}, total=${total}`);
        return res.json({ meta: { page, limit, total }, data: events });
    } catch (error) {
        logger.error(`getAllEvent error: ${error.message}`, { stack: error.stack });
        return res.status(500).json({ message: 'Internal server error' });
    }
};

// GET EVENT BY SLUG
exports.getEventBySlug = async (req, res) => {
    try {
        const { slug } = req.params;
        logger.info(`GET /event/slug/${slug} accessed`);

        const ev = await eventRepo().findOne({
            where: { slug },
            relations: ['category']
        });

        if (!ev) {
            logger.warn(`Event not found: slug=${slug}`);
            return res.status(404).json({ message: 'Event not found' });
        }

        const attendeeCount = await attendanceRepo().createQueryBuilder('d')
            .where('d.kegiatan_id = :id', { id: ev.id })
            .getCount();

        const response = {
            id: ev.id,
            judul_kegiatan: ev.judul_kegiatan,
            slug: ev.slug,
            deskripsi_kegiatan: ev.deskripsi_kegiatan,
            lokasi_kegiatan: ev.lokasi_kegiatan,
            flyer_kegiatan: ev.flyer_kegiatan,
            gambar_kegiatan: ev.gambar_kegiatan,
            kapasitas_peserta: ev.kapasitas_peserta,
            harga: ev.harga,
            waktu_mulai: ev.waktu_mulai,
            waktu_berakhir: ev.waktu_berakhir,
            kategori: ev.category
                ? { id: ev.category.id, nama_kategori: ev.category.nama_kategori, slug: ev.category.slug }
                : null,
            attendee_count: attendeeCount,
            is_full: (ev.kapasitas_peserta > 0) && (attendeeCount >= ev.kapasitas_peserta)
        };

        logger.info(`Event retrieved successfully: slug=${slug}`);
        return res.json(response);
    } catch (error) {
        logger.error(`getEventBySlug error: ${error.message}`, { stack: error.stack });
        return res.status(500).json({ message: 'Internal server error' });
    }
};

// GET EVENT BY ID
exports.getEventById = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        logger.info(`GET /event/${id} accessed`);

        const ev = await eventRepo().findOne({
            where: { id },
            relations: ['category']
        });

        if (!ev) {
            logger.warn(`Event not found: id=${id}`);
            return res.status(404).json({ message: 'Event not found' });
        }

        const attendeeCount = await attendanceRepo().createQueryBuilder('d')
            .where('d.kegiatan_id = :id', { id })
            .getCount();

        const response = {
            id: ev.id,
            judul_kegiatan: ev.judul_kegiatan,
            slug: ev.slug,
            deskripsi_kegiatan: ev.deskripsi_kegiatan,
            lokasi_kegiatan: ev.lokasi_kegiatan,
            flyer_kegiatan: ev.flyer_kegiatan,
            gambar_kegiatan: ev.gambar_kegiatan,
            kapasitas_peserta: ev.kapasitas_peserta,
            harga: ev.harga,
            waktu_mulai: ev.waktu_mulai,
            waktu_berakhir: ev.waktu_berakhir,
            kategori: ev.category
                ? { id: ev.category.id, nama_kategori: ev.category.nama_kategori }
                : null,
            attendee_count: attendeeCount,
            is_full: (ev.kapasitas_peserta > 0) && (attendeeCount >= ev.kapasitas_peserta)
        };

        logger.info(`Event retrieved successfully: id=${id}`);
        return res.json(response);
    } catch (error) {
        logger.error(`getEventById error: ${error.message}`, { stack: error.stack });
        return res.status(500).json({ message: 'Internal server error' });
    }
};

// CREATE EVENT
exports.createEvent = async (req, res) => {
    try {
        // ringkasan request untuk logging (jangan log deskripsi panjang)
        const meta = {
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            files: Object.keys(req.files || {})
        };
        logger.info('POST /event create request', meta);

        const {
            judul_kegiatan,
            slug: providedSlug,
            deskripsi_kegiatan,
            lokasi_kegiatan,
            kapasitas_peserta,
            harga,
            waktu_mulai,
            waktu_berakhir,
            kategori_id,
            kategori_slug
        } = req.body;

        let category = null;
        if (kategori_id) {
            category = await categoryRepo().findOne({ where: { id: parseInt(kategori_id, 10) } });
            if (!category) {
                logger.warn('Kategori tidak ditemukan saat membuat event', { kategori_id });
                return res.status(400).json({ message: 'Kategori tidak ditemukan' });
            }
        } else if (kategori_slug) {
            category = await categoryRepo().findOne({ where: { slug: kategori_slug } });
            if (!category) {
                logger.warn('Kategori slug tidak ditemukan saat membuat event', { kategori_slug });
                return res.status(400).json({ message: 'Kategori tidak ditemukan' });
            }
        }

        // generate slug
        let eventSlug = providedSlug ? slugify(providedSlug, { lower: true, strict: true }) :
            slugify(judul_kegiatan || '', { lower: true, strict: true });

        // make sure it's unique (append counter if neccessary)
        let counter = 0;
        let exists = await eventRepo().findOne({ where: { slug: eventSlug } });
        while (exists) {
            counter += 1;
            eventSlug = `${eventSlug}-${counter}`;
            exists = await eventRepo().findOne({ where: { slug: eventSlug } });
        }

        const flyer = req.files?.flyer_kegiatan?.[0]?.filename || null;
        const gambar = req.files?.gambar_kegiatan?.[0]?.filename || null;
        const sertifikat = req.files?.sertifikat_kegiatan?.[0]?.filename || null;

        // fallback for image if database cannot be null
        const gambar_final = gambar || 'default-event.png';

        const eventData = {
            judul_kegiatan,
            slug: eventSlug,
            deskripsi_kegiatan,
            lokasi_kegiatan,
            flyer_kegiatan: flyer,
            sertifikat_kegiatan: sertifikat,
            gambar_kegiatan: gambar_final,
            kapasitas_peserta: kapasitas_peserta ? parseInt(kapasitas_peserta, 10) : 0,
            harga: harga ? parseFloat(harga) : 0.0,
            waktu_mulai: new Date(waktu_mulai),
            waktu_berakhir: new Date(waktu_berakhir),
            category: category ? { id: category.id } : null
        };

        // use short transactions to make it atomic (files have been saved by multer)
        const saved = await AppDataSource.manager.transaction(async (manager) => {
            const repo = manager.getRepository('Event');
            const created = repo.create(eventData);
            return await repo.save(created);
        });

        logger.info('Event created', { id: saved.id, slug: saved.slug });
        return res.status(201).json({
            message: 'Event created',
            data: {
                id: saved.id,
                judul_kegiatan: saved.judul_kegiatan,
                slug: saved.slug,
                waktu_mulai: saved.waktu_mulai,
                waktu_berakhir: saved.waktu_berakhir
            }
        });
    } catch (error) {
        const allFiles = [
            req.files?.flyer_kegiatan?.[0]?.path,
            req.files?.gambar_kegiatan?.[0]?.path,
            req.files?.sertifikat_kegiatan?.[0]?.path
        ].filter(Boolean);

        cleanupFiles(allFiles);

        logger.error('createEvent error', { message: error.message, stack: error.stack });
        return res.status(500).json({ message: 'Internal server error' });
    }
};
