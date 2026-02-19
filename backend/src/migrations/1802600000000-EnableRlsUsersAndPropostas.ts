import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Habilita RLS + policies de isolamento multi-tenant para tabelas críticas do dashboard.
 *
 * Motivação:
 * - Endpoints de dashboard agregam dados de users/propostas.
 * - Mesmo com filtros por empresa no código, RLS é a última linha de defesa.
 */
export class EnableRlsUsersAndPropostas1802600000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Garantir funções base de tenant (idempotente).
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

    const buildEmpresaIdPredicate = (
      empresaIdColumnType: string | undefined,
      columnSql: string,
    ) => {
      const normalizedType = (empresaIdColumnType || '').toLowerCase();

      if (normalizedType === 'uuid') {
        return `${columnSql} = get_current_tenant()`;
      }

      // Para text/varchar: usa NULLIF antes do cast para evitar erro com string vazia.
      // IMPORTANTE: parênteses são necessários para evitar que o cast seja aplicado ao literal ''
      // (senão o PostgreSQL tenta converter '' para uuid ao criar o policy).
      return `(NULLIF(${columnSql}, ''))::uuid = get_current_tenant()`;
    };

    const getEmpresaIdColumnType = async (tableName: string) => {
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

    const usersEmpresaIdType = await getEmpresaIdColumnType('users');
    const propostasEmpresaIdType = await getEmpresaIdColumnType('propostas');

    // users
    await queryRunner.query(`ALTER TABLE IF EXISTS "users" ENABLE ROW LEVEL SECURITY;`);
    await queryRunner.query(`DROP POLICY IF EXISTS tenant_isolation_users ON "users";`);

    const usersPredicate = buildEmpresaIdPredicate(usersEmpresaIdType, '"empresa_id"');
    await queryRunner.query(`
      CREATE POLICY tenant_isolation_users ON "users"
      FOR ALL
      USING (${usersPredicate})
      WITH CHECK (${usersPredicate});
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_users_empresa_id" ON "users" ("empresa_id");
    `);

    // propostas
    await queryRunner.query(`ALTER TABLE IF EXISTS "propostas" ENABLE ROW LEVEL SECURITY;`);
    await queryRunner.query(`DROP POLICY IF EXISTS tenant_isolation_propostas ON "propostas";`);

    const propostasPredicate = buildEmpresaIdPredicate(propostasEmpresaIdType, '"empresa_id"');
    await queryRunner.query(`
      CREATE POLICY tenant_isolation_propostas ON "propostas"
      FOR ALL
      USING (${propostasPredicate})
      WITH CHECK (${propostasPredicate});
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_propostas_empresa_id" ON "propostas" ("empresa_id");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP POLICY IF EXISTS tenant_isolation_propostas ON "propostas";`);
    await queryRunner.query(`DROP POLICY IF EXISTS tenant_isolation_users ON "users";`);

    // Opcionalmente desabilitar RLS no rollback.
    await queryRunner.query(`ALTER TABLE IF EXISTS "propostas" DISABLE ROW LEVEL SECURITY;`);
    await queryRunner.query(`ALTER TABLE IF EXISTS "users" DISABLE ROW LEVEL SECURITY;`);
  }
}
