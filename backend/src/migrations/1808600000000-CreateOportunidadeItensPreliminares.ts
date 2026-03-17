import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateOportunidadeItensPreliminares1808600000000 implements MigrationInterface {
  name = 'CreateOportunidadeItensPreliminares1808600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "oportunidade_itens_preliminares" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "empresa_id" uuid NOT NULL,
        "oportunidade_id" character varying(64) NOT NULL,
        "produto_id" uuid NULL,
        "catalog_item_id" uuid NULL,
        "nome_snapshot" character varying(255) NOT NULL,
        "sku_snapshot" character varying(100) NULL,
        "descricao_snapshot" text NULL,
        "preco_unitario_estimado" numeric(12,2) NOT NULL DEFAULT 0,
        "quantidade_estimada" numeric(12,3) NOT NULL DEFAULT 1,
        "desconto_percentual" numeric(5,2) NOT NULL DEFAULT 0,
        "subtotal_estimado" numeric(14,2) NOT NULL DEFAULT 0,
        "origem" character varying(30) NOT NULL DEFAULT 'manual',
        "ordem" integer NOT NULL DEFAULT 0,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_oportunidade_itens_preliminares" PRIMARY KEY ("id"),
        CONSTRAINT "CHK_oip_preco_non_negative" CHECK ("preco_unitario_estimado" >= 0),
        CONSTRAINT "CHK_oip_quantidade_positive" CHECK ("quantidade_estimada" > 0),
        CONSTRAINT "CHK_oip_desconto_range" CHECK ("desconto_percentual" >= 0 AND "desconto_percentual" <= 100),
        CONSTRAINT "CHK_oip_subtotal_non_negative" CHECK ("subtotal_estimado" >= 0)
      )
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM pg_constraint
          WHERE conname = 'FK_oip_empresa'
        ) THEN
          ALTER TABLE "oportunidade_itens_preliminares"
          ADD CONSTRAINT "FK_oip_empresa"
          FOREIGN KEY ("empresa_id")
          REFERENCES "empresas"("id")
          ON DELETE CASCADE
          ON UPDATE CASCADE;
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_oip_empresa_oportunidade"
      ON "oportunidade_itens_preliminares" ("empresa_id", "oportunidade_id")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_oip_produto_id"
      ON "oportunidade_itens_preliminares" ("produto_id")
      WHERE "produto_id" IS NOT NULL
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_oip_catalog_item_id"
      ON "oportunidade_itens_preliminares" ("catalog_item_id")
      WHERE "catalog_item_id" IS NOT NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "oportunidade_itens_preliminares" ENABLE ROW LEVEL SECURITY
    `);
    await queryRunner.query(`
      DROP POLICY IF EXISTS "tenant_isolation_oportunidade_itens_preliminares"
      ON "oportunidade_itens_preliminares"
    `);
    await queryRunner.query(`
      CREATE POLICY "tenant_isolation_oportunidade_itens_preliminares"
      ON "oportunidade_itens_preliminares"
      FOR ALL
      USING (empresa_id = get_current_tenant())
      WITH CHECK (empresa_id = get_current_tenant())
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP POLICY IF EXISTS "tenant_isolation_oportunidade_itens_preliminares"
      ON "oportunidade_itens_preliminares"
    `);
    await queryRunner.query(`
      ALTER TABLE "oportunidade_itens_preliminares" DISABLE ROW LEVEL SECURITY
    `);
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_oip_catalog_item_id"
    `);
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_oip_produto_id"
    `);
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_oip_empresa_oportunidade"
    `);
    await queryRunner.query(`
      ALTER TABLE "oportunidade_itens_preliminares"
      DROP CONSTRAINT IF EXISTS "FK_oip_empresa"
    `);
    await queryRunner.query(`
      DROP TABLE IF EXISTS "oportunidade_itens_preliminares"
    `);
  }
}
