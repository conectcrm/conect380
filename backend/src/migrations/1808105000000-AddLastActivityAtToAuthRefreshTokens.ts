import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddLastActivityAtToAuthRefreshTokens1808105000000 implements MigrationInterface {
  name = 'AddLastActivityAtToAuthRefreshTokens1808105000000';

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
              AND column_name = 'last_activity_at'
          ) THEN
            ALTER TABLE "auth_refresh_tokens"
            ADD COLUMN "last_activity_at" timestamp NOT NULL DEFAULT now();
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
              AND column_name = 'last_activity_at'
          ) THEN
            ALTER TABLE "auth_refresh_tokens"
            DROP COLUMN "last_activity_at";
          END IF;
        END IF;
      END
      $$;
    `);
  }
}

