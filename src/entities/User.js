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
            nullable: false
        },
        no_handphone: {
            type: 'varchar',
            length: 20,
            nullable: false
        },
        password: {
            type: 'varchar',
            length: 255,
            nullable: false,
            select: false
            
        },
        alamat: {
            type: 'text',
            nullable: false
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
        },
        reset_otp: {
            type: 'varchar',
            length: 10,
            nullable: true
        },
        reset_otp_expiry: {
            type: 'datetime',
            nullable: true
        },
        created_at: {
            type: 'datetime',
            createDate: true,
            nullable: true
        },
        updated_at: {
            type: 'datetime',
            updateDate: true,
            nullable: true
        }
    },
    relations: {
        attendance: {
            target: 'Attendance',
            type: 'one-to-many',
            inverseSide: 'user'
        }
    }
});
