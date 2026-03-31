import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddConclusaoToAtividades1809013000000 implements MigrationInterface {
  name = 'AddConclusaoToAtividades1809013000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE IF EXISTS "atividades"
      ADD COLUMN IF NOT EXISTS "status" varchar(20) NOT NULL DEFAULT 'pending'
    `);

    await queryRunner.query(`
      ALTER TABLE IF EXISTS "atividades"
      ADD COLUMN IF NOT EXISTS "resultado_conclusao" text
    `);

    await queryRunner.query(`
      ALTER TABLE IF EXISTS "atividades"
      ADD COLUMN IF NOT EXISTS "concluido_por" uuid
    `);

    await queryRunner.query(`
      ALTER TABLE IF EXISTS "atividades"
      ADD COLUMN IF NOT EXISTS "concluido_em" timestamptz
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM pg_constraint
          WHERE conname = 'CHK_atividades_status_values'
        ) THEN
          ALTER TABLE "atividades"
          ADD CONSTRAINT "CHK_atividades_status_values"
          CHECK ("status" IN ('pending', 'completed'));
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM pg_constraint
          WHERE conname = 'FK_atividades_concluido_por_user'
        ) THEN
          ALTER TABLE "atividades"
          ADD CONSTRAINT "FK_atividades_concluido_por_user"
          FOREIGN KEY ("concluido_por")
          REFERENCES "users"("id")
          ON DELETE SET NULL
          ON UPDATE CASCADE;
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_atividades_status"
      ON "atividades" ("status")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_atividades_concluido_por"
      ON "atividades" ("concluido_por")
      WHERE "concluido_por" IS NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_atividades_concluido_por"
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_atividades_status"
    `);

    await queryRunner.query(`
      ALTER TABLE IF EXISTS "atividades"
      DROP CONSTRAINT IF EXISTS "FK_atividades_concluido_por_user"
    `);

    await queryRunner.query(`
      ALTER TABLE IF EXISTS "atividades"
      DROP CONSTRAINT IF EXISTS "CHK_atividades_status_values"
    `);

    await queryRunner.query(`
      ALTER TABLE IF EXISTS "atividades"
      DROP COLUMN IF EXISTS "concluido_em"
    `);

    await queryRunner.query(`
      ALTER TABLE IF EXISTS "atividades"
      DROP COLUMN IF EXISTS "concluido_por"
    `);

    await queryRunner.query(`
      ALTER TABLE IF EXISTS "atividades"
      DROP COLUMN IF EXISTS "resultado_conclusao"
    `);

    await queryRunner.query(`
      ALTER TABLE IF EXISTS "atividades"
      DROP COLUMN IF EXISTS "status"
    `);
  }
}

