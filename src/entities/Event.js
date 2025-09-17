const { EntitySchema } = require('typeorm');

module.exports = new EntitySchema({
    name: 'Event',
    tableName: 'kegiatan',
    columns: {
        id: {
            type: 'int',
            primary: true,
            generated: true
        },
        judul_kegiatan: {
            type: 'varchar',
            length: 255,
            nullable: false,
        },
        slug: {
            type: 'varchar',
            length: 255,
            unique: true,
            nullable: true
        },
        deskripsi_kegiatan: {
            type: 'text',
            nullable: false
        },
        lokasi_kegiatan: {
            type: 'varchar',
            length: 255,
            nullable: false
        },
        flyer_kegiatan: {
            type: 'varchar',
            length: 255,
            nullable: true
        },
        sertifikat_kegiatan: {
            type: 'varchar',
            length: 255,
            nullable: false
        },
        gambar_kegiatan: {
            type: 'varchar',
            length: 255,
            nullable: false
        },
        kapasitas_peserta: {
            type: 'int',
            default: 0
        },
        harga: {
            type: 'decimal',
            precision: 10,
            scale: 2,
            default: 0,
            nullable: false
        },
        waktu_mulai: {
            type: 'datetime',
            nullable: false
        },
        waktu_berakhir: {
            type: 'datetime',
            nullable: false
        },
        created_at: {
            type: 'datetime',
            createDate: true
        },
        updated_at: {
            type: 'datetime',
            updateDate: true
        }
    },
    relations: {
        category: {
            target: 'EventCategory',
            type: 'many-to-one',
            joinColumn: { name: 'kategori_id' },
            inverseSide: 'event'
        },
        attendance: {
            target: 'Attendance',
            type: 'one-to-many',
            inverseSide: 'event'
        }
    }
});
