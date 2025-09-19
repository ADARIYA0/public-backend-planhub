require('dotenv').config();
require('reflect-metadata');
const { AppDataSource } = require('../config/database');
const { generateSlug } = require('../utils/slugify');

const categories = [
    'Workshop',
    'Konferensi',
    'Meetup'
];

const events = [
    {
        title: 'React & Next.js Workshop for Beginners',
        description: 'Learn the fundamentals of React and Next.js in this comprehensive workshop. Build modern web applications with the latest technologies.',
        date: '2025-01-15',
        time: '09:00',
        location: 'Jakarta Convention Center, Jakarta',
        image: '/event/event-1.jpg',
        category: 'Workshop',
        price: 250000,
        maxParticipants: 50,
    },
    {
        title: 'Digital Marketing Conference 2025',
        description: 'Join industry experts as they share the latest trends and strategies in digital marketing.',
        date: '2025-01-20',
        time: '08:30',
        location: 'Balai Kartini, Jakarta',
        image: '/event/event-2.jpg',
        category: 'Konferensi',
        price: 0,
        maxParticipants: 200,
    },
    {
        title: 'Startup Pitch Night',
        description: 'Watch innovative startups pitch their ideas to investors. Great networking opportunity for entrepreneurs and investors alike.',
        date: '2025-01-25',
        time: '18:00',
        location: 'Cyber Hub, Bandung',
        image: '/event/event-3.jpg',
        category: 'Meetup',
        price: 150000,
        maxParticipants: 75,
    }
    // ...
];

(async () => {
    try {
        await AppDataSource.initialize();

        const categoryRepo = AppDataSource.getRepository('EventCategory');
        const eventRepo = AppDataSource.getRepository('Event');

        for (const name of categories) {
            let cat = await categoryRepo.findOneBy({ nama_kategori: name });
            if (!cat) {
                cat = categoryRepo.create({
                    nama_kategori: name,
                    slug: generateSlug(name)
                });
                await categoryRepo.save(cat);
            }
        }

        for (const ev of events) {
            const cat = await categoryRepo.findOneBy({ nama_kategori: ev.category });

            const start = new Date(`${ev.date}T${ev.time}:00`);
            const end = new Date(start.getTime() + 2 * 60 * 60 * 1000); // default durasi 2 jam

            const event = eventRepo.create({
                judul_kegiatan: ev.title,
                slug: generateSlug(ev.title),
                deskripsi_kegiatan: ev.description,
                lokasi_kegiatan: ev.location,
                flyer_kegiatan: null,
                sertifikat_kegiatan: null,
                gambar_kegiatan: ev.image,
                kapasitas_peserta: ev.maxParticipants,
                harga: ev.price,
                waktu_mulai: start,
                waktu_berakhir: end,
                category: cat
            });

            await eventRepo.save(event);
        }

        console.log('Seeding selesai!');
        process.exit(0);
    } catch (error) {
        console.error('Seeding gagal:', error);
        process.exit(1);
    }
})();
