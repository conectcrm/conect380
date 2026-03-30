import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddEmpresaIdToPlanosCobranca1809009000000 implements MigrationInterface {
  name = 'AddEmpresaIdToPlanosCobranca1809009000000';
  public transaction = false;

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE IF EXISTS "planos_cobranca"
      ADD COLUMN IF NOT EXISTS "empresa_id" uuid
    `);

    await queryRunner.query(`
      UPDATE "planos_cobranca" pc
      SET "empresa_id" = c."empresa_id"
      FROM "contratos" c
      WHERE pc."empresa_id" IS NULL
        AND c."id" = pc."contratoId"
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_planos_cobranca_empresa_id"
      ON "planos_cobranca" ("empresa_id")
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM pg_constraint
          WHERE conname = 'FK_planos_cobranca_empresa_id_empresas'
        ) THEN
          ALTER TABLE "planos_cobranca"
          ADD CONSTRAINT "FK_planos_cobranca_empresa_id_empresas"
          FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id")
          ON DELETE NO ACTION
          ON UPDATE NO ACTION;
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1
          FROM information_schema.columns
          WHERE table_schema = 'public'
            AND table_name = 'planos_cobranca'
            AND column_name = 'empresa_id'
            AND is_nullable = 'YES'
        ) AND NOT EXISTS (
          SELECT 1 FROM "planos_cobranca" WHERE "empresa_id" IS NULL
        ) THEN
          ALTER TABLE "planos_cobranca"
          ALTER COLUMN "empresa_id" SET NOT NULL;
        END IF;
      END $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE IF EXISTS "planos_cobranca"
      DROP CONSTRAINT IF EXISTS "FK_planos_cobranca_empresa_id_empresas"
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_planos_cobranca_empresa_id"
    `);

    await queryRunner.query(`
      ALTER TABLE IF EXISTS "planos_cobranca"
      DROP COLUMN IF EXISTS "empresa_id"
    `);
  }
}
