import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAuthLoginAttempts1802892000000 implements MigrationInterface {
  name = 'CreateAuthLoginAttempts1802892000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const tableExists = await queryRunner.hasTable('auth_login_attempts');
    if (tableExists) {
      return;
    }

    await queryRunner.query(`
      CREATE TABLE "auth_login_attempts" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "identity" character varying(255) NOT NULL,
        "failed_attempts" integer NOT NULL DEFAULT 0,
        "consecutive_lockouts" integer NOT NULL DEFAULT 0,
        "first_failed_at" TIMESTAMP,
        "last_failed_at" TIMESTAMP,
        "locked_until" TIMESTAMP,
        "last_ip" character varying(45),
        "last_user_agent" text,
        "user_id" uuid,
        "empresa_id" uuid,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_auth_login_attempts" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_auth_login_attempts_identity" UNIQUE ("identity")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_auth_login_attempts_locked_until"
      ON "auth_login_attempts" ("locked_until")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_auth_login_attempts_user_id"
      ON "auth_login_attempts" ("user_id")
    `);

    await queryRunner.query(`
      ALTER TABLE "auth_login_attempts"
      ADD CONSTRAINT "FK_auth_login_attempts_user"
      FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "auth_login_attempts"
      ADD CONSTRAINT "FK_auth_login_attempts_empresa"
      FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE SET NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const tableExists = await queryRunner.hasTable('auth_login_attempts');
    if (!tableExists) {
      return;
    }

    await queryRunner.query(`
      ALTER TABLE "auth_login_attempts"
      DROP CONSTRAINT IF EXISTS "FK_auth_login_attempts_empresa"
    `);

    await queryRunner.query(`
      ALTER TABLE "auth_login_attempts"
      DROP CONSTRAINT IF EXISTS "FK_auth_login_attempts_user"
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_auth_login_attempts_user_id"
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_auth_login_attempts_locked_until"
    `);

    await queryRunner.query(`
      DROP TABLE IF EXISTS "auth_login_attempts"
    `);
  }
}
