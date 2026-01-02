import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class CreateAgendaEventosTable1777000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const hasTable = await queryRunner.hasTable('agenda_eventos');
    if (hasTable) return;

    await queryRunner.createTable(
      new Table({
        name: 'agenda_eventos',
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
            name: 'titulo',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'descricao',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'inicio',
            type: 'timestamp with time zone',
          },
          {
            name: 'fim',
            type: 'timestamp with time zone',
            isNullable: true,
          },
          {
            name: 'all_day',
            type: 'boolean',
            default: false,
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['confirmado', 'pendente', 'cancelado'],
            default: "'confirmado'",
          },
          {
            name: 'prioridade',
            type: 'enum',
            enum: ['alta', 'media', 'baixa'],
            default: "'media'",
          },
          {
            name: 'local',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'color',
            type: 'varchar',
            length: '20',
            isNullable: true,
          },
          {
            name: 'attendees',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'interacao_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp with time zone',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp with time zone',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
        indices: [
          {
            name: 'IDX_AGENDA_EVENTOS_EMPRESA',
            columnNames: ['empresa_id'],
          },
          {
            name: 'IDX_AGENDA_EVENTOS_INICIO',
            columnNames: ['inicio'],
          },
          {
            name: 'IDX_AGENDA_EVENTOS_INTERACAO',
            columnNames: ['interacao_id'],
          },
        ],
      }),
      true,
    );

    await queryRunner.createForeignKeys('agenda_eventos', [
      new TableForeignKey({
        name: 'FK_AGENDA_EVENTOS_EMPRESA',
        columnNames: ['empresa_id'],
        referencedTableName: 'empresas',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
      new TableForeignKey({
        name: 'FK_AGENDA_EVENTOS_INTERACAO',
        columnNames: ['interacao_id'],
        referencedTableName: 'interacoes',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
    ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const hasTable = await queryRunner.hasTable('agenda_eventos');
    if (!hasTable) return;

    await queryRunner.dropForeignKey('agenda_eventos', 'FK_AGENDA_EVENTOS_EMPRESA');
    await queryRunner.dropForeignKey('agenda_eventos', 'FK_AGENDA_EVENTOS_INTERACAO');
    await queryRunner.dropTable('agenda_eventos');
  }
}
