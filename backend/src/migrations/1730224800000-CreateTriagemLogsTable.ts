import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm';

export class CreateTriagemLogsTable1730224800000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'triagem_logs',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'empresa_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'sessao_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'fluxo_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'etapa',
            type: 'varchar',
            length: '120',
            isNullable: true,
          },
          {
            name: 'direcao',
            type: 'varchar',
            length: '20',
            isNullable: false,
          },
          {
            name: 'canal',
            type: 'varchar',
            length: '30',
            default: "'whatsapp'",
          },
          {
            name: 'tipo',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'mensagem_id',
            type: 'varchar',
            length: '160',
            isNullable: true,
          },
          {
            name: 'mensagem',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'payload',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'contexto_snapshot',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'metadata',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Criar índices
    await queryRunner.createIndex(
      'triagem_logs',
      new TableIndex({
        name: 'idx_triagem_logs_empresa',
        columnNames: ['empresa_id'],
      }),
    );

    await queryRunner.createIndex(
      'triagem_logs',
      new TableIndex({
        name: 'idx_triagem_logs_sessao',
        columnNames: ['sessao_id'],
      }),
    );

    await queryRunner.createIndex(
      'triagem_logs',
      new TableIndex({
        name: 'idx_triagem_logs_fluxo',
        columnNames: ['fluxo_id'],
      }),
    );

    // Criar foreign keys
    await queryRunner.createForeignKey(
      'triagem_logs',
      new TableForeignKey({
        columnNames: ['sessao_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'sessoes_triagem',
        onDelete: 'SET NULL',
      }),
    );

    await queryRunner.createForeignKey(
      'triagem_logs',
      new TableForeignKey({
        columnNames: ['fluxo_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'fluxos_triagem',
        onDelete: 'SET NULL',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('triagem_logs');
  }
}
