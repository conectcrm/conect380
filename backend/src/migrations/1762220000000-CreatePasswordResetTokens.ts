import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePasswordResetTokens1762220000000 implements MigrationInterface {
  name = 'CreatePasswordResetTokens1762220000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "password_reset_tokens" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL,
        "token_hash" character varying(128) NOT NULL,
        "expires_at" TIMESTAMP NOT NULL,
        "used_at" TIMESTAMP,
        "requested_ip" character varying(45),
        "user_agent" text,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_password_reset_tokens" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_password_reset_tokens_token_hash"
      ON "password_reset_tokens" ("token_hash")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_password_reset_tokens_user_id"
      ON "password_reset_tokens" ("user_id")
    `);

    await queryRunner.query(`
      ALTER TABLE "password_reset_tokens"
      ADD CONSTRAINT "FK_password_reset_tokens_user"
      FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "password_reset_tokens"
      DROP CONSTRAINT "FK_password_reset_tokens_user"
    `);

    await queryRunner.query(`
      DROP INDEX "IDX_password_reset_tokens_user_id"
    `);

    await queryRunner.query(`
      DROP INDEX "IDX_password_reset_tokens_token_hash"
    `);

    await queryRunner.query(`
      DROP TABLE "password_reset_tokens"
    `);
  }
}
