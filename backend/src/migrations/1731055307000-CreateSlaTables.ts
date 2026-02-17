import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateSlaTables20251108074147 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Criar tabela sla_configs
    await queryRunner.createTable(
      new Table({
        name: 'sla_configs',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
          },
          {
            name: 'nome',
            type: 'varchar',
            length: '100',
            isNullable: false,
          },
          {
            name: 'descricao',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'prioridade',
            type: 'varchar',
            length: '20',
            isNullable: false,
          },
          {
            name: 'canal',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'tempoRespostaMinutos',
            type: 'int',
            isNullable: false,
          },
          {
            name: 'tempoResolucaoMinutos',
            type: 'int',
            isNullable: false,
          },
          {
            name: 'horariosFuncionamento',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'alertaPercentual',
            type: 'int',
            default: 80,
            isNullable: false,
          },
          {
            name: 'notificarEmail',
            type: 'boolean',
            default: true,
            isNullable: false,
          },
          {
            name: 'notificarSistema',
            type: 'boolean',
            default: true,
            isNullable: false,
          },
          {
            name: 'ativo',
            type: 'boolean',
            default: true,
            isNullable: false,
          },
          {
            name: 'empresaId',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
        ],
      }),
      true,
    );

    // Índices para sla_configs
    await queryRunner.createIndex(
      'sla_configs',
      new TableIndex({
        name: 'IDX_SLA_CONFIG_EMPRESA',
        columnNames: ['empresaId'],
      }),
    );

    await queryRunner.createIndex(
      'sla_configs',
      new TableIndex({
        name: 'IDX_SLA_CONFIG_PRIORIDADE',
        columnNames: ['prioridade'],
      }),
    );

    await queryRunner.createIndex(
      'sla_configs',
      new TableIndex({
        name: 'IDX_SLA_CONFIG_ATIVO',
        columnNames: ['ativo'],
      }),
    );

    await queryRunner.createIndex(
      'sla_configs',
      new TableIndex({
        name: 'IDX_SLA_CONFIG_EMPRESA_PRIORIDADE',
        columnNames: ['empresaId', 'prioridade', 'canal', 'ativo'],
      }),
    );

    // Criar tabela sla_event_logs
    await queryRunner.createTable(
      new Table({
        name: 'sla_event_logs',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
          },
          {
            name: 'ticketId',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'slaConfigId',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'tipoEvento',
            type: 'varchar',
            length: '50',
            isNullable: false,
          },
          {
            name: 'status',
            type: 'varchar',
            length: '30',
            isNullable: false,
          },
          {
            name: 'tempoRespostaMinutos',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'tempoResolucaoMinutos',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'tempoLimiteMinutos',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'percentualUsado',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'detalhes',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'empresaId',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
        ],
      }),
      true,
    );

    // Índices para sla_event_logs
    await queryRunner.createIndex(
      'sla_event_logs',
      new TableIndex({
        name: 'IDX_SLA_LOG_EMPRESA',
        columnNames: ['empresaId'],
      }),
    );

    await queryRunner.createIndex(
      'sla_event_logs',
      new TableIndex({
        name: 'IDX_SLA_LOG_TICKET',
        columnNames: ['ticketId'],
      }),
    );

    await queryRunner.createIndex(
      'sla_event_logs',
      new TableIndex({
        name: 'IDX_SLA_LOG_STATUS',
        columnNames: ['status'],
      }),
    );

    await queryRunner.createIndex(
      'sla_event_logs',
      new TableIndex({
        name: 'IDX_SLA_LOG_TIPO_EVENTO',
        columnNames: ['tipoEvento'],
      }),
    );

    await queryRunner.createIndex(
      'sla_event_logs',
      new TableIndex({
        name: 'IDX_SLA_LOG_CREATED_AT',
        columnNames: ['createdAt'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remover índices de sla_event_logs
    await queryRunner.dropIndex('sla_event_logs', 'IDX_SLA_LOG_CREATED_AT');
    await queryRunner.dropIndex('sla_event_logs', 'IDX_SLA_LOG_TIPO_EVENTO');
    await queryRunner.dropIndex('sla_event_logs', 'IDX_SLA_LOG_STATUS');
    await queryRunner.dropIndex('sla_event_logs', 'IDX_SLA_LOG_TICKET');
    await queryRunner.dropIndex('sla_event_logs', 'IDX_SLA_LOG_EMPRESA');

    // Remover tabela sla_event_logs
    await queryRunner.dropTable('sla_event_logs');

    // Remover índices de sla_configs
    await queryRunner.dropIndex('sla_configs', 'IDX_SLA_CONFIG_EMPRESA_PRIORIDADE');
    await queryRunner.dropIndex('sla_configs', 'IDX_SLA_CONFIG_ATIVO');
    await queryRunner.dropIndex('sla_configs', 'IDX_SLA_CONFIG_PRIORIDADE');
    await queryRunner.dropIndex('sla_configs', 'IDX_SLA_CONFIG_EMPRESA');

    // Remover tabela sla_configs
    await queryRunner.dropTable('sla_configs');
  }
}
