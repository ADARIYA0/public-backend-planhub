const { EntitySchema } = require('typeorm');

module.exports = new EntitySchema({
    name: 'EventAttendance',
    tableName: 'daftar_hadir',
    columns: {
        id: {
            type: 'int',
            primary: true,
            generated: true
        },
        otp: {
            type: 'varchar',
            length: 10,
            nullable: true
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
        }
    },
    relations: {
        user: {
            target: 'User',
            type: 'many-to-one',
            inverseSide: 'attendances',
            joinColumn: {
                name: 'user_id'
            },
            nullable: false
        },
        event: {
            target: 'Events',
            type: 'many-to-one',
            inverseSide: 'attendances',
            joinColumn: {
                name: 'kegiatan_id'
            },
            nullable: false
        }
    }
});
