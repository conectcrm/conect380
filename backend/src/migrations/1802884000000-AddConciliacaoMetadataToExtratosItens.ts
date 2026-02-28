import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddConciliacaoMetadataToExtratosItens1802884000000 implements MigrationInterface {
  name = 'AddConciliacaoMetadataToExtratosItens1802884000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "extratos_bancarios_itens"
      ADD COLUMN IF NOT EXISTS "data_conciliacao" TIMESTAMP NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "extratos_bancarios_itens"
      ADD COLUMN IF NOT EXISTS "conciliado_por" character varying NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "extratos_bancarios_itens"
      ADD COLUMN IF NOT EXISTS "conciliacao_origem" character varying(20) NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "extratos_bancarios_itens"
      ADD COLUMN IF NOT EXISTS "motivo_conciliacao" character varying(500) NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "extratos_bancarios_itens"
      ADD COLUMN IF NOT EXISTS "auditoria_conciliacao" jsonb DEFAULT '[]'::jsonb
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "extratos_bancarios_itens"
      DROP COLUMN IF EXISTS "auditoria_conciliacao"
    `);

    await queryRunner.query(`
      ALTER TABLE "extratos_bancarios_itens"
      DROP COLUMN IF EXISTS "motivo_conciliacao"
    `);

    await queryRunner.query(`
      ALTER TABLE "extratos_bancarios_itens"
      DROP COLUMN IF EXISTS "conciliacao_origem"
    `);

    await queryRunner.query(`
      ALTER TABLE "extratos_bancarios_itens"
      DROP COLUMN IF EXISTS "conciliado_por"
    `);

    await queryRunner.query(`
      ALTER TABLE "extratos_bancarios_itens"
      DROP COLUMN IF EXISTS "data_conciliacao"
    `);
  }
}
