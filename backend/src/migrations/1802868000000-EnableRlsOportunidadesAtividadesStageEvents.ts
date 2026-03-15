import { MigrationInterface, QueryRunner } from 'typeorm';

export class EnableRlsOportunidadesAtividadesStageEvents1802868000000
  implements MigrationInterface
{
  name = 'EnableRlsOportunidadesAtividadesStageEvents1802868000000';

  private async hasEmpresaIdColumn(queryRunner: QueryRunner, tableName: string): Promise<boolean> {
    const rows = await queryRunner.query(
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

    return Array.isArray(rows) && rows.length > 0;
  }

  private async enableTenantRls(queryRunner: QueryRunner, tableName: string): Promise<void> {
    const hasTable = await queryRunner.hasTable(tableName);
    if (!hasTable) {
      console.log(`⚠️ Tabela ${tableName} não existe. Pulando RLS.`);
      return;
    }

    const hasEmpresaId = await this.hasEmpresaIdColumn(queryRunner, tableName);
    if (!hasEmpresaId) {
      console.log(`⚠️ Tabela ${tableName} não possui coluna empresa_id. Pulando RLS.`);
      return;
    }

    const policyName = `tenant_isolation_${tableName}`;

    await queryRunner.query(`ALTER TABLE "${tableName}" ENABLE ROW LEVEL SECURITY;`);
    await queryRunner.query(`DROP POLICY IF EXISTS "${policyName}" ON "${tableName}";`);
    await queryRunner.query(`
      CREATE POLICY "${policyName}" ON "${tableName}"
      FOR ALL
      USING (empresa_id = get_current_tenant())
      WITH CHECK (empresa_id = get_current_tenant());
    `);

    console.log(`✅ RLS habilitado em ${tableName} com policy ${policyName}`);
  }

  private async disableTenantRls(queryRunner: QueryRunner, tableName: string): Promise<void> {
    const hasTable = await queryRunner.hasTable(tableName);
    if (!hasTable) {
      return;
    }

    const policyName = `tenant_isolation_${tableName}`;
    await queryRunner.query(`DROP POLICY IF EXISTS "${policyName}" ON "${tableName}";`);
    await queryRunner.query(`ALTER TABLE "${tableName}" DISABLE ROW LEVEL SECURITY;`);
  }

  public async up(queryRunner: QueryRunner): Promise<void> {
    console.log('🚀 Habilitando RLS em oportunidades/atividades/oportunidade_stage_events...');

    await this.enableTenantRls(queryRunner, 'oportunidades');
    await this.enableTenantRls(queryRunner, 'atividades');
    await this.enableTenantRls(queryRunner, 'oportunidade_stage_events');

    console.log('✅ RLS aplicado no núcleo do pipeline comercial.');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    console.log('↩️ Revertendo RLS em oportunidades/atividades/oportunidade_stage_events...');

    await this.disableTenantRls(queryRunner, 'oportunidade_stage_events');
    await this.disableTenantRls(queryRunner, 'atividades');
    await this.disableTenantRls(queryRunner, 'oportunidades');

    console.log('✅ Reversão de RLS concluída.');
  }
}
