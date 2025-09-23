const { EntitySchema } = require('typeorm');

module.exports = new EntitySchema({
    name: 'Attendance',
    tableName: 'daftar_hadir',
    columns: {
        id: {
            type: 'int', primary: true,
            generated: true
        },
        otp: {
            type: 'varchar', length: 10,
            nullable: true,
            select: false
        },
        status_absen: {
            type: 'enum',
            enum: ['hadir', 'tidak-hadir'],
            default: 'tidak-hadir',
            nullable: false
        },
        waktu_absen: {
            type: 'datetime',
            nullable: true
        },
        created_at: {
            type: 'datetime',
            createDate: true,
            nullable: true
        }
    },
    relations: {
        user: {
            target: 'User',
            type: 'many-to-one',
            joinColumn: { name: 'user_id' },
            inverseSide: 'attendance',
            onDelete: 'CASCADE'
        },
        event: {
            target: 'Event',
            type: 'many-to-one',
            joinColumn: { name: 'kegiatan_id' },
            inverseSide: 'attendance',
            onDelete: 'CASCADE'
        }
    }
});
