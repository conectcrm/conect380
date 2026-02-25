import { MigrationInterface, QueryRunner } from 'typeorm';

export class EnableRlsSalesPaymentGatewayTables1802872000000 implements MigrationInterface {
  name = 'EnableRlsSalesPaymentGatewayTables1802872000000';

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

    const getEmpresaIdColumnType = async (tableName: string): Promise<string | undefined> => {
      const rows: Array<{ data_type?: string; udt_name?: string }> = await queryRunner.query(
        `
          SELECT data_type, udt_name
          FROM information_schema.columns
          WHERE table_schema = 'public'
            AND table_name = $1
            AND column_name = 'empresa_id'
          LIMIT 1
        `,
        [tableName],
      );

      const first = rows?.[0];
      return (first?.udt_name || first?.data_type) as string | undefined;
    };

    const buildEmpresaIdPredicate = (empresaIdColumnType: string | undefined): string => {
      const normalizedType = (empresaIdColumnType || '').toLowerCase();

      if (normalizedType === 'uuid') {
        return `"empresa_id" = get_current_tenant()`;
      }

      return `(NULLIF("empresa_id", ''))::uuid = get_current_tenant()`;
    };

    const applyTenantRls = async (
      tableName: string,
      policyName: string,
      indexName: string,
    ): Promise<void> => {
      if (!(await queryRunner.hasTable(tableName))) {
        return;
      }

      const empresaIdType = await getEmpresaIdColumnType(tableName);
      if (!empresaIdType) {
        return;
      }

      const predicate = buildEmpresaIdPredicate(empresaIdType);

      await queryRunner.query(`ALTER TABLE "${tableName}" ENABLE ROW LEVEL SECURITY;`);
      await queryRunner.query(`DROP POLICY IF EXISTS "${policyName}" ON "${tableName}";`);
      await queryRunner.query(`
        CREATE POLICY "${policyName}" ON "${tableName}"
        FOR ALL
        USING (${predicate})
        WITH CHECK (${predicate});
      `);
      await queryRunner.query(`
        CREATE INDEX IF NOT EXISTS "${indexName}" ON "${tableName}" ("empresa_id");
      `);
    };

    await applyTenantRls(
      'contas_pagar',
      'tenant_isolation_contas_pagar',
      'IDX_contas_pagar_empresa_id',
    );
    await applyTenantRls(
      'configuracoes_gateway_pagamento',
      'tenant_isolation_configuracoes_gateway_pagamento',
      'IDX_configuracoes_gateway_pagamento_empresa_id',
    );
    await applyTenantRls(
      'transacoes_gateway_pagamento',
      'tenant_isolation_transacoes_gateway_pagamento',
      'IDX_transacoes_gateway_pagamento_empresa_id',
    );
  }

  public async down(_queryRunner: QueryRunner): Promise<void> {
    // Safe no-op: corrective baseline migration.
  }
}
