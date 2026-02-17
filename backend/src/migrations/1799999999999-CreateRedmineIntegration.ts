import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class CreateRedmineIntegration1735000000001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Tabela de configuração Redmine por empresa
    await queryRunner.createTable(
      new Table({
        name: 'atendimento_redmine_configs',
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
            isUnique: true,
          },
          {
            name: 'redmine_url',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'redmine_api_key_encrypted',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'redmine_project_id',
            type: 'int',
          },
          {
            name: 'redmine_custom_field_id',
            type: 'int',
            default: 1,
          },
          {
            name: 'mapeamento_trackers',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'mapeamento_status',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'mapeamento_prioridade',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'sincronizacao_automatica',
            type: 'boolean',
            default: true,
          },
          {
            name: 'sincronizacao_bidirecional',
            type: 'boolean',
            default: false,
          },
          {
            name: 'intervalo_polling',
            type: 'int',
            default: 300,
          },
          {
            name: 'ativo',
            type: 'boolean',
            default: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // FK empresa_id
    await queryRunner.createForeignKey(
      'atendimento_redmine_configs',
      new TableForeignKey({
        columnNames: ['empresa_id'],
        referencedTableName: 'empresas',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    // Tabela de sincronização demanda ↔ Redmine issue
    await queryRunner.createTable(
      new Table({
        name: 'atendimento_redmine_integrations',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'demanda_id',
            type: 'uuid',
          },
          {
            name: 'empresa_id',
            type: 'uuid',
          },
          {
            name: 'redmine_url',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'redmine_issue_id',
            type: 'int',
          },
          {
            name: 'redmine_project_id',
            type: 'int',
          },
          {
            name: 'status_sincronizacao',
            type: 'varchar',
            length: '20',
            default: "'pendente'",
          },
          {
            name: 'ultima_sincronizacao',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'erro_sincronizacao',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'metadados',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Índices
    await queryRunner.createIndex(
      'atendimento_redmine_integrations',
      new TableIndex({
        columnNames: ['demanda_id'],
      }),
    );

    await queryRunner.createIndex(
      'atendimento_redmine_integrations',
      new TableIndex({
        columnNames: ['empresa_id'],
      }),
    );

    await queryRunner.createIndex(
      'atendimento_redmine_integrations',
      new TableIndex({
        columnNames: ['redmine_issue_id'],
      }),
    );

    // FKs
    // Nem sempre `atendimento_demandas` existe neste ponto do histórico.
    // Se não existir, pulamos a FK e ela pode ser criada por migrations posteriores.
    const hasAtendimentoDemandas = await queryRunner.hasTable('atendimento_demandas');
    if (hasAtendimentoDemandas) {
      await queryRunner.createForeignKey(
        'atendimento_redmine_integrations',
        new TableForeignKey({
          columnNames: ['demanda_id'],
          referencedTableName: 'atendimento_demandas',
          referencedColumnNames: ['id'],
          onDelete: 'CASCADE',
          name: 'fk_redmine_integrations_demanda',
        }),
      );
    }

    await queryRunner.createForeignKey(
      'atendimento_redmine_integrations',
      new TableForeignKey({
        columnNames: ['empresa_id'],
        referencedTableName: 'empresas',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
        name: 'fk_redmine_integrations_empresa',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('atendimento_redmine_integrations');
    await queryRunner.dropTable('atendimento_redmine_configs');
  }
}
