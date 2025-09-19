require('dotenv').config();
require('reflect-metadata');
const { AppDataSource } = require('../config/database');

(async () => {
    try {
        await AppDataSource.initialize();

        const attendanceRepo = AppDataSource.getRepository('Attendance');
        const userRepo = AppDataSource.getRepository('User');
        const eventRepo = AppDataSource.getRepository('Event');

        // ambil user pertama & event pertama (sesuai kebutuhan)
        const users = await userRepo.find();
        const events = await eventRepo.find();

        if (users.length === 0 || events.length === 0) {
            console.log("❌ Tidak ada user atau event untuk membuat daftar_hadir.");
            process.exit(0);
        }

        // contoh data kehadiran
        const attendances = [
            {
                user: users[0],
                event: events[0],
                otp: "123456",
                status_absen: "hadir",
                waktu_absen: new Date()
            }
        ];

        for (const att of attendances) {
            const newAtt = attendanceRepo.create(att);
            await attendanceRepo.save(newAtt);
        }

        console.log("✅ Seeding daftar_hadir selesai!");
        process.exit(0);
    } catch (error) {
        console.error("❌ Seeding gagal:", error);
        process.exit(1);
    }
})();
