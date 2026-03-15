import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateMfaLoginChallenges1802891000000 implements MigrationInterface {
  name = 'CreateMfaLoginChallenges1802891000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const tableExists = await queryRunner.hasTable('mfa_login_challenges');
    if (tableExists) {
      return;
    }

    await queryRunner.query(`
      CREATE TABLE "mfa_login_challenges" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "empresa_id" uuid,
        "user_id" uuid NOT NULL,
        "code_hash" character varying(128) NOT NULL,
        "expires_at" TIMESTAMP NOT NULL,
        "used_at" TIMESTAMP,
        "failed_attempts" integer NOT NULL DEFAULT 0,
        "max_attempts" integer NOT NULL DEFAULT 5,
        "requested_ip" character varying(45),
        "user_agent" text,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_mfa_login_challenges" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_mfa_login_challenges_user_id"
      ON "mfa_login_challenges" ("user_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_mfa_login_challenges_expires_at"
      ON "mfa_login_challenges" ("expires_at")
    `);

    await queryRunner.query(`
      ALTER TABLE "mfa_login_challenges"
      ADD CONSTRAINT "FK_mfa_login_challenges_user"
      FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "mfa_login_challenges"
      ADD CONSTRAINT "FK_mfa_login_challenges_empresa"
      FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE SET NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const tableExists = await queryRunner.hasTable('mfa_login_challenges');
    if (!tableExists) {
      return;
    }

    await queryRunner.query(`
      ALTER TABLE "mfa_login_challenges"
      DROP CONSTRAINT IF EXISTS "FK_mfa_login_challenges_empresa"
    `);

    await queryRunner.query(`
      ALTER TABLE "mfa_login_challenges"
      DROP CONSTRAINT IF EXISTS "FK_mfa_login_challenges_user"
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_mfa_login_challenges_expires_at"
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_mfa_login_challenges_user_id"
    `);

    await queryRunner.query(`
      DROP TABLE IF EXISTS "mfa_login_challenges"
    `);
  }
}
