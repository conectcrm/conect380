import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddOportunidadesLifecycleControls1808100000000 implements MigrationInterface {
  name = 'AddOportunidadesLifecycleControls1808100000000';
  transaction = false;

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        IF to_regclass('public.oportunidades') IS NULL THEN
          RETURN;
        END IF;

        ALTER TABLE "oportunidades"
          ADD COLUMN IF NOT EXISTS "lifecycle_status" character varying(20);
        ALTER TABLE "oportunidades"
          ADD COLUMN IF NOT EXISTS "archived_at" TIMESTAMPTZ;
        ALTER TABLE "oportunidades"
          ADD COLUMN IF NOT EXISTS "archived_by" uuid;
        ALTER TABLE "oportunidades"
          ADD COLUMN IF NOT EXISTS "deleted_at" TIMESTAMPTZ;
        ALTER TABLE "oportunidades"
          ADD COLUMN IF NOT EXISTS "deleted_by" uuid;
        ALTER TABLE "oportunidades"
          ADD COLUMN IF NOT EXISTS "reopened_at" TIMESTAMPTZ;
        ALTER TABLE "oportunidades"
          ADD COLUMN IF NOT EXISTS "reopened_by" uuid;
      END
      $$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF to_regclass('public.oportunidades') IS NULL THEN
          RETURN;
        END IF;

        UPDATE "oportunidades"
           SET "lifecycle_status" = CASE lower(coalesce("estagio"::text, ''))
             WHEN 'ganho' THEN 'won'
             WHEN 'won' THEN 'won'
             WHEN 'perdido' THEN 'lost'
             WHEN 'lost' THEN 'lost'
             ELSE 'open'
           END
         WHERE "lifecycle_status" IS NULL;

        ALTER TABLE "oportunidades"
          ALTER COLUMN "lifecycle_status" SET DEFAULT 'open';

        IF NOT EXISTS (
          SELECT 1
          FROM "oportunidades"
          WHERE "lifecycle_status" IS NULL
        ) THEN
          ALTER TABLE "oportunidades"
            ALTER COLUMN "lifecycle_status" SET NOT NULL;
        END IF;
      END
      $$;
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_oportunidades_lifecycle_status"
      ON "oportunidades" ("lifecycle_status")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_oportunidades_empresa_lifecycle_estagio"
      ON "oportunidades" ("empresa_id", "lifecycle_status", "estagio")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_oportunidades_deleted_at"
      ON "oportunidades" ("deleted_at")
      WHERE "deleted_at" IS NOT NULL
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_oportunidades_archived_at"
      ON "oportunidades" ("archived_at")
      WHERE "archived_at" IS NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_oportunidades_archived_at"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_oportunidades_deleted_at"`);
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_oportunidades_empresa_lifecycle_estagio"`,
    );
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_oportunidades_lifecycle_status"`);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF to_regclass('public.oportunidades') IS NULL THEN
          RETURN;
        END IF;

        ALTER TABLE "oportunidades" DROP COLUMN IF EXISTS "reopened_by";
        ALTER TABLE "oportunidades" DROP COLUMN IF EXISTS "reopened_at";
        ALTER TABLE "oportunidades" DROP COLUMN IF EXISTS "deleted_by";
        ALTER TABLE "oportunidades" DROP COLUMN IF EXISTS "deleted_at";
        ALTER TABLE "oportunidades" DROP COLUMN IF EXISTS "archived_by";
        ALTER TABLE "oportunidades" DROP COLUMN IF EXISTS "archived_at";
        ALTER TABLE "oportunidades" DROP COLUMN IF EXISTS "lifecycle_status";
      END
      $$;
    `);
  }
}

