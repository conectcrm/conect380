import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlignPropostasDateColumnsForDashboard1802874000000 implements MigrationInterface {
  name = 'AlignPropostasDateColumnsForDashboard1802874000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    if (!(await queryRunner.hasTable('propostas'))) {
      return;
    }

    await queryRunner.query(`
      ALTER TABLE "propostas"
      ADD COLUMN IF NOT EXISTS "criadaEm" timestamp without time zone
    `);

    await queryRunner.query(`
      ALTER TABLE "propostas"
      ADD COLUMN IF NOT EXISTS "atualizadaEm" timestamp without time zone
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1
          FROM information_schema.columns
          WHERE table_schema = 'public'
            AND table_name = 'propostas'
            AND column_name = 'criado_em'
        ) THEN
          UPDATE "propostas"
          SET "criadaEm" = COALESCE("criadaEm", "criado_em")
          WHERE "criadaEm" IS NULL;
        END IF;
      END
      $$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1
          FROM information_schema.columns
          WHERE table_schema = 'public'
            AND table_name = 'propostas'
            AND column_name = 'atualizado_em'
        ) THEN
          UPDATE "propostas"
          SET "atualizadaEm" = COALESCE("atualizadaEm", "atualizado_em")
          WHERE "atualizadaEm" IS NULL;
        END IF;
      END
      $$;
    `);

    await queryRunner.query(`
      UPDATE "propostas"
      SET "criadaEm" = COALESCE("criadaEm", NOW())
      WHERE "criadaEm" IS NULL
    `);

    await queryRunner.query(`
      UPDATE "propostas"
      SET "atualizadaEm" = COALESCE("atualizadaEm", "criadaEm", NOW())
      WHERE "atualizadaEm" IS NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "propostas"
      ALTER COLUMN "criadaEm" SET DEFAULT NOW()
    `);

    await queryRunner.query(`
      ALTER TABLE "propostas"
      ALTER COLUMN "atualizadaEm" SET DEFAULT NOW()
    `);

    await queryRunner.query(`
      ALTER TABLE "propostas"
      ALTER COLUMN "criadaEm" SET NOT NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "propostas"
      ALTER COLUMN "atualizadaEm" SET NOT NULL
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_propostas_criadaEm"
      ON "propostas" ("criadaEm")
    `);
  }

  public async down(_queryRunner: QueryRunner): Promise<void> {
    // Safe no-op: corrective baseline migration.
  }
}
