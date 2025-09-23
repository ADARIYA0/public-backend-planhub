const { EntitySchema } = require('typeorm');

module.exports = new EntitySchema({
    name: 'UserToken',
    tableName: 'user_tokens',
    columns: {
        id: {
            type: 'int',
            primary: true,
            generated: true
        },
        refresh_token: {
            type: 'text',
            nullable: false
        },
        ip_address: {
            type: 'varchar',
            length: 45,
            nullable: true
        },
        user_agent: {
            type: 'varchar',
            length: 255,
            nullable: true
        },
        created_at: {
            type: 'datetime',
            createDate: true
        },
        expires_at: {
            type: 'datetime',
            nullable: true
        }
    },
    relations: {
        user: {
            target: 'User',
            type: 'many-to-one',
            joinColumn: true,
            onDelete: 'CASCADE'
        }
    }
});