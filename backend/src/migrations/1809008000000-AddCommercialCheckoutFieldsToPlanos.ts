import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCommercialCheckoutFieldsToPlanos1809008000000
  implements MigrationInterface
{
  name = 'AddCommercialCheckoutFieldsToPlanos1809008000000';
  public transaction = false;

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE IF EXISTS "planos"
      ADD COLUMN IF NOT EXISTS "periodicidade_cobranca" varchar(20) NOT NULL DEFAULT 'mensal',
      ADD COLUMN IF NOT EXISTS "dias_trial" integer NOT NULL DEFAULT 0,
      ADD COLUMN IF NOT EXISTS "gateway_price_id" varchar(120),
      ADD COLUMN IF NOT EXISTS "publicado_checkout" boolean NOT NULL DEFAULT true
    `);

    await queryRunner.query(`
      UPDATE "planos"
      SET "periodicidade_cobranca" = 'mensal'
      WHERE LOWER(COALESCE("periodicidade_cobranca", '')) NOT IN ('mensal', 'anual')
    `);

    await queryRunner.query(`
      UPDATE "planos"
      SET "dias_trial" = 0
      WHERE "dias_trial" IS NULL OR "dias_trial" < 0 OR "dias_trial" > 365
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'ck_planos_periodicidade_cobranca'
        ) THEN
          ALTER TABLE "planos"
          ADD CONSTRAINT "ck_planos_periodicidade_cobranca"
          CHECK ("periodicidade_cobranca" IN ('mensal', 'anual'));
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'ck_planos_dias_trial_range'
        ) THEN
          ALTER TABLE "planos"
          ADD CONSTRAINT "ck_planos_dias_trial_range"
          CHECK ("dias_trial" >= 0 AND "dias_trial" <= 365);
        END IF;
      END $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE IF EXISTS "planos"
      DROP CONSTRAINT IF EXISTS "ck_planos_dias_trial_range",
      DROP CONSTRAINT IF EXISTS "ck_planos_periodicidade_cobranca"
    `);

    await queryRunner.query(`
      ALTER TABLE IF EXISTS "planos"
      DROP COLUMN IF EXISTS "publicado_checkout",
      DROP COLUMN IF EXISTS "gateway_price_id",
      DROP COLUMN IF EXISTS "dias_trial",
      DROP COLUMN IF EXISTS "periodicidade_cobranca"
    `);
  }
}

