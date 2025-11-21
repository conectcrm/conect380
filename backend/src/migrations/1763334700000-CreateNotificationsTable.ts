import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class CreateNotificationsTable1763334700000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Criar enum de tipos de notificação
    await queryRunner.query(`
      CREATE TYPE "notifications_type_enum" AS ENUM(
        'COTACAO_APROVADA', 
        'COTACAO_REPROVADA', 
        'COTACAO_PENDENTE', 
        'SISTEMA'
      )
    `);

    // Criar tabela notifications
    await queryRunner.createTable(
      new Table({
        name: 'notifications',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
          },
          {
            name: 'user_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'type',
            type: 'notifications_type_enum',
            default: "'SISTEMA'",
          },
          {
            name: 'title',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'message',
            type: 'text',
            isNullable: false,
          },
          {
            name: 'read',
            type: 'boolean',
            default: false,
          },
          {
            name: 'data',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'now()',
          },
          {
            name: 'read_at',
            type: 'timestamp',
            isNullable: true,
          },
        ],
      }),
      true,
    );

    // Criar foreign key para users
    await queryRunner.createForeignKey(
      'notifications',
      new TableForeignKey({
        columnNames: ['user_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
      }),
    );

    // Criar índices para performance
    await queryRunner.query(`
      CREATE INDEX "IDX_notifications_user_id" ON "notifications" ("user_id");
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_notifications_read" ON "notifications" ("read");
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_notifications_created_at" ON "notifications" ("created_at");
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_notifications_user_unread" ON "notifications" ("user_id", "read") WHERE read = false;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Dropar índices
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_notifications_user_unread"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_notifications_created_at"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_notifications_read"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_notifications_user_id"`);

    // Dropar foreign key
    const table = await queryRunner.getTable('notifications');
    if (table) {
      const foreignKey = table.foreignKeys.find(
        (fk) => fk.columnNames.indexOf('user_id') !== -1,
      );
      if (foreignKey) {
        await queryRunner.dropForeignKey('notifications', foreignKey);
      }
    }

    // Dropar tabela
    await queryRunner.dropTable('notifications');

    // Dropar enum
    await queryRunner.query(`DROP TYPE IF EXISTS "notifications_type_enum"`);
  }
}
