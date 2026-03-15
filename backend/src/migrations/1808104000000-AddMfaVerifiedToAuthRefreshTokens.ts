import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMfaVerifiedToAuthRefreshTokens1808104000000 implements MigrationInterface {
  name = 'AddMfaVerifiedToAuthRefreshTokens1808104000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        IF to_regclass('public.auth_refresh_tokens') IS NOT NULL THEN
          IF NOT EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name = 'auth_refresh_tokens'
              AND column_name = 'mfa_verified'
          ) THEN
            ALTER TABLE "auth_refresh_tokens"
            ADD COLUMN "mfa_verified" boolean NOT NULL DEFAULT false;
          END IF;
        END IF;
      END
      $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        IF to_regclass('public.auth_refresh_tokens') IS NOT NULL THEN
          IF EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name = 'auth_refresh_tokens'
              AND column_name = 'mfa_verified'
          ) THEN
            ALTER TABLE "auth_refresh_tokens"
            DROP COLUMN "mfa_verified";
          END IF;
        END IF;
      END
      $$;
    `);
  }
}

