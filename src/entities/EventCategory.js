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
            length: 150
        },
        slug: {
            type: 'varchar',
            length: 150,
            unique: true
        },
        kategori_logo: {
            type: 'varchar',
            length: 255,
            nullable: true
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
        event: {
            target: 'Event',
            type: 'one-to-many',
            inverseSide: 'category'
        }
    }
});
