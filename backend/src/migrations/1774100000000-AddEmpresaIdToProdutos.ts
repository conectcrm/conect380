import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddEmpresaIdToProdutos1774100000000 implements MigrationInterface {
  name = 'AddEmpresaIdToProdutos1774100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "produtos"
      ADD COLUMN "empresa_id" uuid
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
      ALTER TABLE "produtos"
      ADD CONSTRAINT "FK_produtos_empresa"
      FOREIGN KEY ("empresa_id")
      REFERENCES "empresas"("id")
      ON DELETE NO ACTION
      ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_produtos_empresa_id"
      ON "produtos" ("empresa_id")
    `);

    await queryRunner.query(`
      ALTER TABLE "produtos"
      DROP CONSTRAINT IF EXISTS "produtos_sku_key"
    `);

    await queryRunner.query(`
      ALTER TABLE "produtos"
      ADD CONSTRAINT "UQ_produtos_empresa_sku"
      UNIQUE ("empresa_id", "sku")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "produtos"
      DROP CONSTRAINT "UQ_produtos_empresa_sku"
    `);

    await queryRunner.query(`
      ALTER TABLE "produtos"
      ADD CONSTRAINT "produtos_sku_key"
      UNIQUE ("sku")
    `);

    await queryRunner.query(`DROP INDEX "public"."IDX_produtos_empresa_id"`);
    await queryRunner.query(`ALTER TABLE "produtos" DROP CONSTRAINT "FK_produtos_empresa"`);
    await queryRunner.query(`ALTER TABLE "produtos" DROP COLUMN "empresa_id"`);
  }
}
