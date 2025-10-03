const { EntitySchema } = require('typeorm');

module.exports = new EntitySchema({
    name: 'Admin',
    tableName: 'admins',
    columns: {
        id: {
            type: Number,
            primary: true,
            generated: true
        },
        email: {
            type: String,
            unique: true,
            nullable: false
        },
        password: {
            type: String,
            nullable: false,
            select: false
        },
        status_akun: {
            type: String,
            default: 'belum-aktif'
        },
        created_at: {
            type: 'timestamp',
            createDate: true
        },
        updated_at: {
            type: 'timestamp',
            updateDate: true
        }
    }
});
