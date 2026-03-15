import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddEmpresaIdToPasswordResetTokens1802895000000 implements MigrationInterface {
  name = 'AddEmpresaIdToPasswordResetTokens1802895000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "password_reset_tokens"
      ADD COLUMN IF NOT EXISTS "empresa_id" uuid
    `);

    await queryRunner.query(`
      UPDATE "password_reset_tokens" prt
      SET "empresa_id" = u."empresa_id"
      FROM "users" u
      WHERE prt."user_id" = u."id"
        AND prt."empresa_id" IS NULL
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_password_reset_tokens_empresa_id"
      ON "password_reset_tokens" ("empresa_id")
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM pg_constraint
          WHERE conname = 'FK_password_reset_tokens_empresa'
        ) THEN
          ALTER TABLE "password_reset_tokens"
          ADD CONSTRAINT "FK_password_reset_tokens_empresa"
          FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE SET NULL;
        END IF;
      END
      $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "password_reset_tokens"
      DROP CONSTRAINT IF EXISTS "FK_password_reset_tokens_empresa"
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_password_reset_tokens_empresa_id"
    `);

    await queryRunner.query(`
      ALTER TABLE "password_reset_tokens"
      DROP COLUMN IF EXISTS "empresa_id"
    `);
  }
}
