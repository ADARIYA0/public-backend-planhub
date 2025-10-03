const { EntitySchema } = require('typeorm');

module.exports = new EntitySchema({
    name: 'AdminToken',
    tableName: 'admin_tokens',
    columns: {
        id: {
            type: Number,
            primary: true,
            generated: true
        },
        refresh_token: {
            type: 'text',
            nullable: false
        },
        user_agent: {
            type: String,
            nullable: true
        },
        ip_address: {
            type: String,
            nullable: true
        },
        created_at: {
            type: 'timestamp',
            createDate: true
        },
        expires_at: {
            type: 'timestamp',
            nullable: true
        }
    },
    relations: {
        admin: {
            type: 'many-to-one',
            target: 'Admin',
            joinColumn: { name: 'admin_id' },
            nullable: false,
            onDelete: 'CASCADE'
        }
    }
});
