// src/entities/User.js
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
            unique: true
        },
        no_handphone: {
            type: 'varchar',
            unique: true
        },
        password: {
            type: 'varchar'
        },
        alamat: {
            type: 'text',
            nullable: true
        },
        pendidikan_terakhir: {
            type: 'enum',
            enum: ['SD/MI', 'SMP/MTS', 'SMA/SMK', 'Diploma', 'Sarjana', 'Lainnya'],
            default: 'Lainnya'
        },
        status_akun: {
            type: 'enum',
            enum: ['aktif', 'belum-aktif'],
            default: 'belum-aktif'
        },
        otp: {
            type: 'varchar',
            nullable: true
        },
        otp_expiry: {
            type: 'datetime',
            nullable: true
        }
    }
});
