const { EntitySchema } = require('typeorm');

module.exports = new EntitySchema({
    name: 'Events',
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
            nullable: false
        },
        slug: {
            type: 'varchar',
            length: 100,
            nullable: true,
            unique: true
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
            nullable: false
        },
        sertifikat_kegiatan: {
            type: 'varchar',
            length: 255,
            nullable: false
        },
        gambar_kegiatan: {
            type: 'longblob',
            nullable: false
        },
        kapasitas_peserta: {
            type: 'int',
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
        }
    },
    relations: {
        category: {
            target: 'EventCategory',
            type: 'many-to-one',
            joinColumn: {
                name: 'kategori_id'
            },
            nullable: false
        },
        attendances: {
            target: 'EventAttendance',
            type: 'one-to-many',
            inverseSide: 'event'
        }
    }
});
