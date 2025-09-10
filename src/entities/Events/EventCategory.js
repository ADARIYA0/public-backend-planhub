const { EntitySchema } = require('typeorm');

module.exports = new EntitySchema({
    name: 'EventCategory',
    tableName: 'kategori_kegiatan',
    columns: {
        id: {
            type: 'int',
            primary: true,
            generated: true
        },
        nama_kategori: {
            type: 'varchar',
            length: 100,
            nullable: false
        },
        slug: {
            type: 'varchar',
            length: 100,
            nullable: true,
            unique: true
        },
        kategori_logo: {
            type: 'varchar',
            length: 255,
            nullable: true
        }
    },
    relations: {
        event: {
            target: 'Events',
            type: 'one-to-many',
            inverseSide: 'category'
        }
    }
});
