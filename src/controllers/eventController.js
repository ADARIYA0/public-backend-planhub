const { AppDataSource } = require('../config/database');
const logger = require('../utils/logger');

const eventRepo = () => AppDataSource.getRepository('Event');
const attendanceRepo = () => AppDataSource.getRepository('Attendance');

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
            qb.andWhere('category.id = :cat', { cat: parseInt(req.query.category) });
            logger.debug(`Filtering by category=${req.query.category}`);
        }
        if (req.query.search) {
            qb.andWhere('(kegiatan.judul_kegiatan LIKE :q OR kegiatan.deskripsi_kegiatan LIKE :q)', { q: `%${req.query.search}%` });
            logger.debug(`Searching with query="${req.query.search}"`);
        }
        if (req.query.upcoming === 'true') {
            qb.andWhere('kegiatan.waktu_berakhir >= :now', { now: new Date() });
            logger.debug('Filtering only upcoming events');
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
