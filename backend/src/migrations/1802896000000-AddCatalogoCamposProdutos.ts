import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCatalogoCamposProdutos1802896000000 implements MigrationInterface {
  name = 'AddCatalogoCamposProdutos1802896000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "produtos"
      ADD COLUMN IF NOT EXISTS "custoUnitario" numeric(10,2)
    `);

    await queryRunner.query(`
      ALTER TABLE "produtos"
      ADD COLUMN IF NOT EXISTS "tipoItem" character varying(100)
    `);

    await queryRunner.query(`
      ALTER TABLE "produtos"
      ADD COLUMN IF NOT EXISTS "frequencia" character varying(100)
    `);

    await queryRunner.query(`
      ALTER TABLE "produtos"
      ADD COLUMN IF NOT EXISTS "unidadeMedida" character varying(100)
    `);

    await queryRunner.query(`
      ALTER TABLE "produtos"
      ADD COLUMN IF NOT EXISTS "status" character varying(100)
    `);

    await queryRunner.query(`
      ALTER TABLE "produtos"
      ADD COLUMN IF NOT EXISTS "fornecedor" character varying(255)
    `);

    await queryRunner.query(`
      ALTER TABLE "produtos"
      ADD COLUMN IF NOT EXISTS "estoqueMinimo" integer
    `);

    await queryRunner.query(`
      ALTER TABLE "produtos"
      ADD COLUMN IF NOT EXISTS "estoqueMaximo" integer
    `);

    await queryRunner.query(`
      ALTER TABLE "produtos"
      ADD COLUMN IF NOT EXISTS "vendasMes" integer
    `);

    await queryRunner.query(`
      ALTER TABLE "produtos"
      ADD COLUMN IF NOT EXISTS "vendasTotal" integer
    `);

    await queryRunner.query(`
      ALTER TABLE "produtos"
      ADD COLUMN IF NOT EXISTS "tags" json
    `);

    await queryRunner.query(`
      ALTER TABLE "produtos"
      ADD COLUMN IF NOT EXISTS "variacoes" json
    `);

    await queryRunner.query(`
      UPDATE "produtos"
      SET
        "custoUnitario" = COALESCE("custoUnitario", "preco", 0),
        "tipoItem" = COALESCE("tipoItem", 'produto'),
        "frequencia" = COALESCE("frequencia", 'unico'),
        "unidadeMedida" = COALESCE("unidadeMedida", 'unidade'),
        "status" = COALESCE("status", CASE WHEN "ativo" = true THEN 'ativo' ELSE 'inativo' END),
        "fornecedor" = COALESCE("fornecedor", 'Nao informado'),
        "estoqueMinimo" = COALESCE("estoqueMinimo", 0),
        "estoqueMaximo" = COALESCE("estoqueMaximo", 0),
        "vendasMes" = COALESCE("vendasMes", 0),
        "vendasTotal" = COALESCE("vendasTotal", 0)
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_produtos_status"
      ON "produtos" ("status")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_produtos_tipoItem"
      ON "produtos" ("tipoItem")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_produtos_tipoItem"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_produtos_status"`);

    await queryRunner.query(`
      ALTER TABLE "produtos"
      DROP COLUMN IF EXISTS "variacoes"
    `);

    await queryRunner.query(`
      ALTER TABLE "produtos"
      DROP COLUMN IF EXISTS "tags"
    `);

    await queryRunner.query(`
      ALTER TABLE "produtos"
      DROP COLUMN IF EXISTS "vendasTotal"
    `);

    await queryRunner.query(`
      ALTER TABLE "produtos"
      DROP COLUMN IF EXISTS "vendasMes"
    `);

    await queryRunner.query(`
      ALTER TABLE "produtos"
      DROP COLUMN IF EXISTS "estoqueMaximo"
    `);

    await queryRunner.query(`
      ALTER TABLE "produtos"
      DROP COLUMN IF EXISTS "estoqueMinimo"
    `);

    await queryRunner.query(`
      ALTER TABLE "produtos"
      DROP COLUMN IF EXISTS "fornecedor"
    `);

    await queryRunner.query(`
      ALTER TABLE "produtos"
      DROP COLUMN IF EXISTS "status"
    `);

    await queryRunner.query(`
      ALTER TABLE "produtos"
      DROP COLUMN IF EXISTS "unidadeMedida"
    `);

    await queryRunner.query(`
      ALTER TABLE "produtos"
      DROP COLUMN IF EXISTS "frequencia"
    `);

    await queryRunner.query(`
      ALTER TABLE "produtos"
      DROP COLUMN IF EXISTS "tipoItem"
    `);

    await queryRunner.query(`
      ALTER TABLE "produtos"
      DROP COLUMN IF EXISTS "custoUnitario"
    `);
  }
}
