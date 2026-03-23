import { MigrationInterface, QueryRunner } from 'typeorm';

export class EnableRlsRemainingTenantTables1802876000000 implements MigrationInterface {
  name = 'EnableRlsRemainingTenantTables1802876000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION set_current_tenant(tenant_id uuid)
      RETURNS void AS $$
      BEGIN
        PERFORM set_config('app.current_tenant_id', tenant_id::text, false);
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    `);

    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION get_current_tenant()
      RETURNS uuid AS $$
      BEGIN
        RETURN current_setting('app.current_tenant_id', true)::uuid;
      END;
      $$ LANGUAGE plpgsql STABLE;
    `);

    const tables = [
      'atendimento_configuracao_inatividade',
      'atendimento_demandas',
      'atendimento_notas_cliente',
      'atendimento_redmine_configs',
      'atendimento_redmine_integrations',
      'cliente_anexos',
      'contatos',
      'dashboard_aging_stage_daily',
      'dashboard_funnel_metrics_daily',
      'dashboard_pipeline_snapshot_daily',
      'dashboard_revenue_metrics_daily',
      'dashboard_v2_metric_divergence',
      'empresa_configuracoes',
      'empresa_modulos',
      'feature_flags_tenant',
      'historico_planos',
      'metas',
      'modulos_empresas',
    ] as const;

    const applyTenantRls = async (
      tableName: string,
      policyName: string,
      indexName: string,
    ): Promise<void> => {
      if (!(await queryRunner.hasTable(tableName))) {
        return;
      }

      const empresaIdColumn = await queryRunner.query(
        `
          SELECT 1
          FROM information_schema.columns
          WHERE table_schema = 'public'
            AND table_name = $1
            AND column_name = 'empresa_id'
          LIMIT 1
        `,
        [tableName],
      );

      if (!empresaIdColumn?.length) {
        return;
      }

      await queryRunner.query(`ALTER TABLE "${tableName}" ENABLE ROW LEVEL SECURITY;`);

      await queryRunner.query(`DROP POLICY IF EXISTS "${policyName}" ON "${tableName}";`);
      await queryRunner.query(`
        CREATE POLICY "${policyName}" ON "${tableName}"
        FOR ALL
        USING ("empresa_id" = get_current_tenant())
        WITH CHECK ("empresa_id" = get_current_tenant());
      `);

      await queryRunner.query(`
        CREATE INDEX IF NOT EXISTS "${indexName}"
        ON "${tableName}" ("empresa_id");
      `);
    };

    for (const tableName of tables) {
      const policyName = `tenant_isolation_${tableName}`;
      const indexName = `IDX_${tableName}_empresa_id`;
      await applyTenantRls(tableName, policyName, indexName);
    }
  }

  public async down(_queryRunner: QueryRunner): Promise<void> {
    // Safe no-op: corrective baseline migration.
  }
}
