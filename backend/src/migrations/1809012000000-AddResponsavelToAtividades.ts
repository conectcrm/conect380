import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddResponsavelToAtividades1809012000000 implements MigrationInterface {
  name = 'AddResponsavelToAtividades1809012000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE IF EXISTS "atividades"
      ADD COLUMN IF NOT EXISTS "responsavel_id" uuid
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM pg_constraint
          WHERE conname = 'FK_atividades_responsavel_user'
        ) THEN
          ALTER TABLE "atividades"
          ADD CONSTRAINT "FK_atividades_responsavel_user"
          FOREIGN KEY ("responsavel_id")
          REFERENCES "users"("id")
          ON DELETE SET NULL
          ON UPDATE CASCADE;
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_atividades_responsavel_id"
      ON "atividades" ("responsavel_id")
      WHERE "responsavel_id" IS NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_atividades_responsavel_id"
    `);

    await queryRunner.query(`
      ALTER TABLE IF EXISTS "atividades"
      DROP CONSTRAINT IF EXISTS "FK_atividades_responsavel_user"
    `);

    await queryRunner.query(`
      ALTER TABLE IF EXISTS "atividades"
      DROP COLUMN IF EXISTS "responsavel_id"
    `);
  }
}

