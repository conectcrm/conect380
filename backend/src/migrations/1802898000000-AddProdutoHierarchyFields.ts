import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddProdutoHierarchyFields1802898000000 implements MigrationInterface {
  name = 'AddProdutoHierarchyFields1802898000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "produtos"
      ADD COLUMN IF NOT EXISTS "categoria_id" uuid
    `);

    await queryRunner.query(`
      ALTER TABLE "produtos"
      ADD COLUMN IF NOT EXISTS "subcategoria_id" uuid
    `);

    await queryRunner.query(`
      ALTER TABLE "produtos"
      ADD COLUMN IF NOT EXISTS "configuracao_id" uuid
    `);

    await queryRunner.query(`
      UPDATE "produtos" AS produto
      SET "categoria_id" = categoria.id
      FROM "categorias_produtos" AS categoria
      WHERE produto."categoria_id" IS NULL
        AND categoria."empresa_id" = produto."empresa_id"
        AND lower(trim(coalesce(produto."categoria", ''))) = lower(trim(categoria."nome"))
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_produtos_categoria_id"
      ON "produtos" ("categoria_id")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_produtos_subcategoria_id"
      ON "produtos" ("subcategoria_id")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_produtos_configuracao_id"
      ON "produtos" ("configuracao_id")
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'FK_produtos_categoria'
        ) THEN
          ALTER TABLE "produtos"
          ADD CONSTRAINT "FK_produtos_categoria"
          FOREIGN KEY ("categoria_id") REFERENCES "categorias_produtos"("id") ON DELETE SET NULL;
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'FK_produtos_subcategoria'
        ) THEN
          ALTER TABLE "produtos"
          ADD CONSTRAINT "FK_produtos_subcategoria"
          FOREIGN KEY ("subcategoria_id") REFERENCES "subcategorias_produtos"("id") ON DELETE SET NULL;
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'FK_produtos_configuracao'
        ) THEN
          ALTER TABLE "produtos"
          ADD CONSTRAINT "FK_produtos_configuracao"
          FOREIGN KEY ("configuracao_id") REFERENCES "configuracoes_produtos"("id") ON DELETE SET NULL;
        END IF;
      END $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "produtos"
      DROP CONSTRAINT IF EXISTS "FK_produtos_configuracao"
    `);

    await queryRunner.query(`
      ALTER TABLE "produtos"
      DROP CONSTRAINT IF EXISTS "FK_produtos_subcategoria"
    `);

    await queryRunner.query(`
      ALTER TABLE "produtos"
      DROP CONSTRAINT IF EXISTS "FK_produtos_categoria"
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_produtos_configuracao_id"
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_produtos_subcategoria_id"
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_produtos_categoria_id"
    `);

    await queryRunner.query(`
      ALTER TABLE "produtos"
      DROP COLUMN IF EXISTS "configuracao_id"
    `);

    await queryRunner.query(`
      ALTER TABLE "produtos"
      DROP COLUMN IF EXISTS "subcategoria_id"
    `);

    await queryRunner.query(`
      ALTER TABLE "produtos"
      DROP COLUMN IF EXISTS "categoria_id"
    `);
  }
}
