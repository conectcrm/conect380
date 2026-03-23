import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAuthRefreshTokens1802896000000 implements MigrationInterface {
  name = 'CreateAuthRefreshTokens1802896000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const tableExists = await queryRunner.hasTable('auth_refresh_tokens');
    if (tableExists) {
      return;
    }

    await queryRunner.query(`
      CREATE TABLE "auth_refresh_tokens" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "token_hash" character varying(128) NOT NULL,
        "user_id" uuid NOT NULL,
        "empresa_id" uuid,
        "expires_at" TIMESTAMP NOT NULL,
        "revoked_at" TIMESTAMP,
        "revoke_reason" character varying(80),
        "replaced_by_token_hash" character varying(128),
        "requested_ip" character varying(45),
        "user_agent" text,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_auth_refresh_tokens" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_auth_refresh_tokens_token_hash" UNIQUE ("token_hash")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_auth_refresh_tokens_user_id"
      ON "auth_refresh_tokens" ("user_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_auth_refresh_tokens_expires_at"
      ON "auth_refresh_tokens" ("expires_at")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_auth_refresh_tokens_revoked_at"
      ON "auth_refresh_tokens" ("revoked_at")
    `);

    await queryRunner.query(`
      ALTER TABLE "auth_refresh_tokens"
      ADD CONSTRAINT "FK_auth_refresh_tokens_user"
      FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "auth_refresh_tokens"
      ADD CONSTRAINT "FK_auth_refresh_tokens_empresa"
      FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE SET NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const tableExists = await queryRunner.hasTable('auth_refresh_tokens');
    if (!tableExists) {
      return;
    }

    await queryRunner.query(`
      ALTER TABLE "auth_refresh_tokens"
      DROP CONSTRAINT IF EXISTS "FK_auth_refresh_tokens_empresa"
    `);

    await queryRunner.query(`
      ALTER TABLE "auth_refresh_tokens"
      DROP CONSTRAINT IF EXISTS "FK_auth_refresh_tokens_user"
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_auth_refresh_tokens_revoked_at"
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_auth_refresh_tokens_expires_at"
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_auth_refresh_tokens_user_id"
    `);

    await queryRunner.query(`
      DROP TABLE IF EXISTS "auth_refresh_tokens"
    `);
  }
}
