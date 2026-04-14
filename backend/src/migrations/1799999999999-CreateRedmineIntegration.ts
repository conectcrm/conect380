import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class CreateRedmineIntegration1735000000001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Redmine config per company
    await queryRunner.createTable(
      new Table({
        name: 'atendimento_redmine_configs',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, generationStrategy: 'uuid', default: 'uuid_generate_v4()' },
          { name: 'empresa_id', type: 'uuid', isUnique: true },
          { name: 'redmine_url', type: 'varchar', length: '255' },
          { name: 'redmine_api_key_encrypted', type: 'varchar', length: '255' },
          { name: 'redmine_project_id', type: 'int' },
          { name: 'redmine_custom_field_id', type: 'int', default: 1 },
          { name: 'mapeamento_trackers', type: 'jsonb', isNullable: true },
          { name: 'mapeamento_status', type: 'jsonb', isNullable: true },
          { name: 'mapeamento_prioridade', type: 'jsonb', isNullable: true },
          { name: 'sincronizacao_automatica', type: 'boolean', default: true },
          { name: 'sincronizacao_bidirecional', type: 'boolean', default: false },
          { name: 'intervalo_polling', type: 'int', default: 300 },
          { name: 'ativo', type: 'boolean', default: true },
          { name: 'created_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
          { name: 'updated_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
        ],
      }),
      true,
    );

    const configsTable = await queryRunner.getTable('atendimento_redmine_configs');
    const hasConfigsEmpresaFk = configsTable?.foreignKeys?.some(
      (fk) => fk.name === 'fk_redmine_configs_empresa',
    );
    if (!hasConfigsEmpresaFk) {
      await queryRunner.createForeignKey(
        'atendimento_redmine_configs',
        new TableForeignKey({
          name: 'fk_redmine_configs_empresa',
          columnNames: ['empresa_id'],
          referencedTableName: 'empresas',
          referencedColumnNames: ['id'],
          onDelete: 'CASCADE',
        }),
      );
    }

    // Mapping demanda <-> redmine issue
    await queryRunner.createTable(
      new Table({
        name: 'atendimento_redmine_integrations',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, generationStrategy: 'uuid', default: 'uuid_generate_v4()' },
          { name: 'demanda_id', type: 'uuid' },
          { name: 'empresa_id', type: 'uuid' },
          { name: 'redmine_url', type: 'varchar', length: '255' },
          { name: 'redmine_issue_id', type: 'int' },
          { name: 'redmine_project_id', type: 'int' },
          { name: 'status_sincronizacao', type: 'varchar', length: '20', default: "'pendente'" },
          { name: 'ultima_sincronizacao', type: 'timestamp', isNullable: true },
          { name: 'erro_sincronizacao', type: 'text', isNullable: true },
          { name: 'metadados', type: 'jsonb', isNullable: true },
          { name: 'created_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
          { name: 'updated_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
        ],
      }),
      true,
    );

    // Idempotent indexes for partial migration reruns
    await queryRunner.query(
      'CREATE INDEX IF NOT EXISTS idx_redmine_integrations_demanda ON atendimento_redmine_integrations(demanda_id)',
    );
    await queryRunner.query(
      'CREATE INDEX IF NOT EXISTS idx_redmine_integrations_empresa ON atendimento_redmine_integrations(empresa_id)',
    );
    await queryRunner.query(
      'CREATE INDEX IF NOT EXISTS idx_redmine_integrations_issue ON atendimento_redmine_integrations(redmine_issue_id)',
    );

    const integrationsTable = await queryRunner.getTable('atendimento_redmine_integrations');
    const hasIntegrationFk = (name: string) =>
      integrationsTable?.foreignKeys?.some((fk) => fk.name === name);

    // atendimento_demandas may not exist in old states
    const hasAtendimentoDemandas = await queryRunner.hasTable('atendimento_demandas');
    if (hasAtendimentoDemandas && !hasIntegrationFk('fk_redmine_integrations_demanda')) {
      await queryRunner.createForeignKey(
        'atendimento_redmine_integrations',
        new TableForeignKey({
          name: 'fk_redmine_integrations_demanda',
          columnNames: ['demanda_id'],
          referencedTableName: 'atendimento_demandas',
          referencedColumnNames: ['id'],
          onDelete: 'CASCADE',
        }),
      );
    }

    if (!hasIntegrationFk('fk_redmine_integrations_empresa')) {
      await queryRunner.createForeignKey(
        'atendimento_redmine_integrations',
        new TableForeignKey({
          name: 'fk_redmine_integrations_empresa',
          columnNames: ['empresa_id'],
          referencedTableName: 'empresas',
          referencedColumnNames: ['id'],
          onDelete: 'CASCADE',
        }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('atendimento_redmine_integrations');
    await queryRunner.dropTable('atendimento_redmine_configs');
  }
}
