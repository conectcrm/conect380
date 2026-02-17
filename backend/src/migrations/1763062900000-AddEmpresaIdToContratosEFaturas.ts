import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddEmpresaIdToContratosEFaturas1763062900000 implements MigrationInterface {
  name = 'AddEmpresaIdToContratosEFaturas1763062900000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const contratosExists = await queryRunner.hasTable('contratos');
    const faturasExists = await queryRunner.hasTable('faturas');

    // ===========================================================================
    // TABELA: contratos
    // ===========================================================================

    if (contratosExists) {
      // 1. Adicionar coluna empresa_id como NULLABLE
      await queryRunner.query(`
        ALTER TABLE "contratos"
        ADD COLUMN IF NOT EXISTS "empresa_id" uuid
      `);

      // 2. Popular empresa_id derivando do cliente (clientes JÁ têm empresa_id)
      await queryRunner.query(`
        DO $$
        BEGIN
          IF EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name = 'contratos'
              AND column_name = 'clienteId'
          ) AND to_regclass('public.clientes') IS NOT NULL
            AND EXISTS (
              SELECT 1
              FROM information_schema.columns
              WHERE table_schema = 'public'
                AND table_name = 'clientes'
                AND column_name = 'empresa_id'
            )
          THEN
            UPDATE "contratos" c
            SET empresa_id = cl.empresa_id
            FROM clientes cl
            WHERE c."clienteId" = cl.id;
          END IF;
        END
        $$;
      `);

      // 3. Se ainda há contratos sem empresa_id (órfãos), usar empresa padrão
      await queryRunner.query(`
        UPDATE "contratos"
        SET empresa_id = '11111111-1111-1111-1111-111111111111'
        WHERE empresa_id IS NULL
      `);

      // 4. Tornar coluna NOT NULL
      await queryRunner.query(`
        ALTER TABLE "contratos"
        ALTER COLUMN "empresa_id" SET NOT NULL
      `);

      // 5. Adicionar FK para empresas (apenas se não existir)
      await queryRunner.query(`
        DO $$
        BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_contratos_empresa')
            AND to_regclass('public.contratos') IS NOT NULL
          THEN
            ALTER TABLE "contratos"
            ADD CONSTRAINT "FK_contratos_empresa"
            FOREIGN KEY ("empresa_id")
            REFERENCES "empresas"("id")
            ON DELETE NO ACTION
            ON UPDATE NO ACTION;
          END IF;
        END
        $$;
      `);

      // 6. Criar índice para performance
      await queryRunner.query(`
        CREATE INDEX IF NOT EXISTS "IDX_contratos_empresa_id"
        ON "contratos" ("empresa_id")
      `);

      // 7. Habilitar RLS e política de isolamento
      await queryRunner.query(`ALTER TABLE "contratos" ENABLE ROW LEVEL SECURITY`);
      await queryRunner.query(`
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1
            FROM pg_policies
            WHERE schemaname = 'public'
              AND tablename = 'contratos'
              AND policyname = 'tenant_isolation_contratos'
          )
          THEN
            CREATE POLICY tenant_isolation_contratos ON "contratos"
            USING (empresa_id = get_current_tenant());
          END IF;
        END
        $$;
      `);
    }

    // ===========================================================================
    // TABELA: faturas
    // ===========================================================================

    if (faturasExists) {
      // 1. Adicionar coluna empresa_id como NULLABLE
      await queryRunner.query(`
        ALTER TABLE "faturas"
        ADD COLUMN IF NOT EXISTS "empresa_id" uuid
      `);

      // 2. Popular empresa_id derivando do cliente (clientes JÁ têm empresa_id)
      await queryRunner.query(`
        DO $$
        BEGIN
          IF EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name = 'faturas'
              AND column_name = 'clienteId'
          ) AND to_regclass('public.clientes') IS NOT NULL
            AND EXISTS (
              SELECT 1
              FROM information_schema.columns
              WHERE table_schema = 'public'
                AND table_name = 'clientes'
                AND column_name = 'empresa_id'
            )
          THEN
            UPDATE "faturas" f
            SET empresa_id = cl.empresa_id
            FROM clientes cl
            WHERE f."clienteId" = cl.id;
          END IF;
        END
        $$;
      `);

      // 3. Se ainda há faturas sem empresa_id (órfãos), usar empresa padrão
      await queryRunner.query(`
        UPDATE "faturas"
        SET empresa_id = '11111111-1111-1111-1111-111111111111'
        WHERE empresa_id IS NULL
      `);

      // 4. Tornar coluna NOT NULL
      await queryRunner.query(`
        ALTER TABLE "faturas"
        ALTER COLUMN "empresa_id" SET NOT NULL
      `);

      // 5. Adicionar FK para empresas (apenas se não existir)
      await queryRunner.query(`
        DO $$
        BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_faturas_empresa')
            AND to_regclass('public.faturas') IS NOT NULL
          THEN
            ALTER TABLE "faturas"
            ADD CONSTRAINT "FK_faturas_empresa"
            FOREIGN KEY ("empresa_id")
            REFERENCES "empresas"("id")
            ON DELETE NO ACTION
            ON UPDATE NO ACTION;
          END IF;
        END
        $$;
      `);

      // 6. Criar índice para performance
      await queryRunner.query(`
        CREATE INDEX IF NOT EXISTS "IDX_faturas_empresa_id"
        ON "faturas" ("empresa_id")
      `);

      // 7. Habilitar RLS e política de isolamento
      await queryRunner.query(`ALTER TABLE "faturas" ENABLE ROW LEVEL SECURITY`);
      await queryRunner.query(`
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1
            FROM pg_policies
            WHERE schemaname = 'public'
              AND tablename = 'faturas'
              AND policyname = 'tenant_isolation_faturas'
          )
          THEN
            CREATE POLICY tenant_isolation_faturas ON "faturas"
            USING (empresa_id = get_current_tenant());
          END IF;
        END
        $$;
      `);
    }

    console.log('✅ empresa_id adicionado a contratos/faturas (quando existem).');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const contratosExists = await queryRunner.hasTable('contratos');
    const faturasExists = await queryRunner.hasTable('faturas');

    // ===========================================================================
    // REVERTER TABELA: faturas
    // ===========================================================================

    if (faturasExists) {
      await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_faturas_empresa_id"`);
      await queryRunner.query(
        `DROP POLICY IF EXISTS tenant_isolation_faturas ON "faturas"`,
      );
      await queryRunner.query(`ALTER TABLE "faturas" DISABLE ROW LEVEL SECURITY`);
      await queryRunner.query(
        `ALTER TABLE "faturas" DROP CONSTRAINT IF EXISTS "FK_faturas_empresa"`,
      );
      await queryRunner.query(`ALTER TABLE "faturas" DROP COLUMN IF EXISTS "empresa_id"`);
    }

    // ===========================================================================
    // REVERTER TABELA: contratos
    // ===========================================================================

    if (contratosExists) {
      await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_contratos_empresa_id"`);
      await queryRunner.query(
        `DROP POLICY IF EXISTS tenant_isolation_contratos ON "contratos"`,
      );
      await queryRunner.query(`ALTER TABLE "contratos" DISABLE ROW LEVEL SECURITY`);
      await queryRunner.query(
        `ALTER TABLE "contratos" DROP CONSTRAINT IF EXISTS "FK_contratos_empresa"`,
      );
      await queryRunner.query(`ALTER TABLE "contratos" DROP COLUMN IF EXISTS "empresa_id"`);
    }

    console.log('✅ empresa_id removido de contratos e faturas (rollback)');
  }
}
