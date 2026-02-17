import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddEmpresaIdToPagamentos1763275000000 implements MigrationInterface {
  name = 'AddEmpresaIdToPagamentos1763275000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const pagamentosExists = await queryRunner.hasTable('pagamentos');
    if (!pagamentosExists) {
      console.log('ℹ️  Tabela pagamentos não existe; pulando migration AddEmpresaIdToPagamentos.');
      return;
    }

    const faturasExists = await queryRunner.hasTable('faturas');

    // 1. Adicionar coluna empresa_id como nullable para evitar falha em dados existentes
    await queryRunner.query(`
      ALTER TABLE "pagamentos"
      ADD COLUMN IF NOT EXISTS "empresa_id" uuid
    `);

    // 2. Popular empresa_id derivando da fatura associada (faturas já possuem empresa_id)
    if (faturasExists) {
      await queryRunner.query(`
        DO $$
        BEGIN
          IF EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name = 'pagamentos'
              AND column_name = 'faturaId'
          ) AND EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name = 'faturas'
              AND column_name = 'empresa_id'
          )
          THEN
            UPDATE "pagamentos" p
            SET empresa_id = f.empresa_id
            FROM faturas f
            WHERE p."faturaId" = f.id;
          END IF;
        END
        $$;
      `);
    }

    // 3. Garantir fallback para registros órfãos usando empresa padrão (mesmo valor usado nas demais migrations)
    await queryRunner.query(`
      UPDATE "pagamentos"
      SET empresa_id = '11111111-1111-1111-1111-111111111111'
      WHERE empresa_id IS NULL
    `);

    // 4. Tornar coluna obrigatória
    await queryRunner.query(`
      ALTER TABLE "pagamentos"
      ALTER COLUMN "empresa_id" SET NOT NULL
    `);

    // 5. Criar relacionamento e índice para consultas multi-tenant
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_pagamentos_empresa')
          AND to_regclass('public.pagamentos') IS NOT NULL
        THEN
          ALTER TABLE "pagamentos"
          ADD CONSTRAINT "FK_pagamentos_empresa"
          FOREIGN KEY ("empresa_id")
          REFERENCES "empresas"("id")
          ON DELETE NO ACTION
          ON UPDATE NO ACTION;
        END IF;
      END
      $$;
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_pagamentos_empresa_id"
      ON "pagamentos" ("empresa_id")
    `);

    // 6. Habilitar RLS e politica de isolamento
    await queryRunner.query(`ALTER TABLE "pagamentos" ENABLE ROW LEVEL SECURITY`);
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM pg_policies
          WHERE schemaname = 'public'
            AND tablename = 'pagamentos'
            AND policyname = 'tenant_isolation_pagamentos'
        )
        THEN
          CREATE POLICY tenant_isolation_pagamentos ON "pagamentos"
          USING (empresa_id = get_current_tenant());
        END IF;
      END
      $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const pagamentosExists = await queryRunner.hasTable('pagamentos');
    if (!pagamentosExists) return;

    await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_pagamentos_empresa_id"`);
    await queryRunner.query(
      `DROP POLICY IF EXISTS tenant_isolation_pagamentos ON "pagamentos"`,
    );
    await queryRunner.query(`ALTER TABLE "pagamentos" DISABLE ROW LEVEL SECURITY`);
    await queryRunner.query(
      `ALTER TABLE "pagamentos" DROP CONSTRAINT IF EXISTS "FK_pagamentos_empresa"`,
    );
    await queryRunner.query(`ALTER TABLE "pagamentos" DROP COLUMN IF EXISTS "empresa_id"`);
  }
}
