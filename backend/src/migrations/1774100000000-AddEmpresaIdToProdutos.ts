import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddEmpresaIdToProdutos1774100000000 implements MigrationInterface {
  name = 'AddEmpresaIdToProdutos1774100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "produtos"
      ADD COLUMN IF NOT EXISTS "empresa_id" uuid
    `);

    await queryRunner.query(`
      UPDATE "produtos"
      SET empresa_id = '11111111-1111-1111-1111-111111111111'
      WHERE empresa_id IS NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "produtos"
      ALTER COLUMN "empresa_id" SET NOT NULL
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'FK_produtos_empresa'
        ) THEN
          ALTER TABLE "produtos"
            ADD CONSTRAINT "FK_produtos_empresa"
            FOREIGN KEY ("empresa_id")
            REFERENCES "empresas"("id")
            ON DELETE NO ACTION
            ON UPDATE NO ACTION;
        END IF;
      END
      $$;
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_produtos_empresa_id"
      ON "produtos" ("empresa_id")
    `);

    // Em bases antigas, a coluna era "codigo" e "sku" pode não existir.
    // A aplicação (entity) espera "sku" (varchar(100)) como obrigatório.
    await queryRunner.query(`
      ALTER TABLE "produtos"
      ADD COLUMN IF NOT EXISTS "sku" character varying(100)
    `);

    // Backfill seguro: tenta reaproveitar "codigo" quando existir, e garante unicidade
    // caindo para o próprio UUID do produto em caso de duplicidade/ausência.
    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1
          FROM information_schema.columns
          WHERE table_schema = 'public'
            AND table_name = 'produtos'
            AND column_name = 'codigo'
        ) THEN
          UPDATE "produtos"
          SET "sku" = NULLIF("codigo", '')
          WHERE ("sku" IS NULL OR "sku" = '')
            AND "codigo" IS NOT NULL;
        END IF;

        UPDATE "produtos"
        SET "sku" = "id"::text
        WHERE ("sku" IS NULL OR "sku" = '');

        WITH dups AS (
          SELECT "empresa_id", "sku"
          FROM "produtos"
          WHERE "sku" IS NOT NULL
          GROUP BY "empresa_id", "sku"
          HAVING COUNT(*) > 1
        )
        UPDATE "produtos" p
        SET "sku" = p."id"::text
        FROM dups d
        WHERE p."empresa_id" = d."empresa_id"
          AND p."sku" = d."sku";
      END
      $$;
    `);

    await queryRunner.query(`
      ALTER TABLE "produtos"
      ALTER COLUMN "sku" SET NOT NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "produtos"
      DROP CONSTRAINT IF EXISTS "produtos_sku_key"
    `);

    await queryRunner.query(`
      ALTER TABLE "produtos"
      DROP CONSTRAINT IF EXISTS "UQ_produtos_empresa_sku"
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1
          FROM information_schema.columns
          WHERE table_schema = 'public'
            AND table_name = 'produtos'
            AND column_name = 'sku'
        ) AND NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'UQ_produtos_empresa_sku'
        ) THEN
          ALTER TABLE "produtos"
            ADD CONSTRAINT "UQ_produtos_empresa_sku"
            UNIQUE ("empresa_id", "sku");
        END IF;
      END
      $$;
    `);

    // Habilitar RLS e politica de isolamento
    await queryRunner.query(`ALTER TABLE "produtos" ENABLE ROW LEVEL SECURITY`);
    await queryRunner.query(`DROP POLICY IF EXISTS tenant_isolation_produtos ON "produtos"`);
    await queryRunner.query(`
      CREATE POLICY tenant_isolation_produtos ON "produtos"
      FOR ALL
      USING (empresa_id = get_current_tenant())
      WITH CHECK (empresa_id = get_current_tenant())
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "produtos"
      DROP CONSTRAINT IF EXISTS "UQ_produtos_empresa_sku"
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1
          FROM information_schema.columns
          WHERE table_schema = 'public'
            AND table_name = 'produtos'
            AND column_name = 'sku'
        ) AND NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'produtos_sku_key'
        ) THEN
          ALTER TABLE "produtos"
            ADD CONSTRAINT "produtos_sku_key"
            UNIQUE ("sku");
        END IF;
      END
      $$;
    `);

    await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_produtos_empresa_id"`);
    await queryRunner.query(`DROP POLICY IF EXISTS tenant_isolation_produtos ON "produtos"`);
    await queryRunner.query(`ALTER TABLE "produtos" DISABLE ROW LEVEL SECURITY`);
    await queryRunner.query(`ALTER TABLE "produtos" DROP CONSTRAINT IF EXISTS "FK_produtos_empresa"`);
    await queryRunner.query(`ALTER TABLE "produtos" DROP COLUMN IF EXISTS "empresa_id"`);
  }
}
