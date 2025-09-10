const { EntitySchema } = require('typeorm');

module.exports = new EntitySchema({
    name: 'User',
    tableName: 'users',
    columns: {
        id: {
            type: 'int',
            primary: true,
            generated: true
        },
        email: {
            type: 'varchar',
            length: 255,
            unique: true,
            nullable: false
        },
        no_handphone: {
            type: 'varchar',
            length: 20,
            unique: true,
            nullable: false
        },
        password: {
            type: 'varchar',
            length: 255,
            nullable: false
        },
        alamat: {
            type: 'text',
            nullable: true
        },
        pendidikan_terakhir: {
            type: 'enum',
            enum: ['SD/MI', 'SMP/MTS', 'SMA/SMK', 'Diploma', 'Sarjana', 'Lainnya'],
            default: 'Lainnya',
            nullable: false
        },
        status_akun: {
            type: 'enum',
            enum: ['aktif', 'belum-aktif'],
            default: 'belum-aktif',
            nullable: false
        },
        otp: {
            type: 'varchar',
            length: 10,
            nullable: true
        },
        otp_expiry: {
            type: 'datetime',
            nullable: true
        }
    },
    relations: {
        attendances: {
            target: 'EventAttendance',
            type: 'one-to-many',
            inverseSide: 'user'
        }
    }
});
