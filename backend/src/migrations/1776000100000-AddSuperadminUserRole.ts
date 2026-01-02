import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSuperadminUserRole1776000100000 implements MigrationInterface {
  name = 'AddSuperadminUserRole1776000100000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_type t
          WHERE t.typname = 'users_role_enum'
        ) THEN
          CREATE TYPE "public"."users_role_enum" AS ENUM ('superadmin', 'admin', 'manager', 'vendedor', 'user');
        ELSIF NOT EXISTS (
          SELECT 1 FROM pg_enum e
          WHERE e.enumtypid = 'users_role_enum'::regtype
            AND e.enumlabel = 'superadmin'
        ) THEN
          ALTER TYPE "public"."users_role_enum" ADD VALUE 'superadmin';
        END IF;
      END
      $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM pg_type t
          WHERE t.typname = 'users_role_enum'
        ) THEN
          UPDATE "users" SET "role" = 'admin' WHERE "role" = 'superadmin';
          CREATE TYPE "public"."users_role_enum_old" AS ENUM ('admin', 'manager', 'vendedor', 'user');
          ALTER TABLE "users" ALTER COLUMN "role" TYPE "public"."users_role_enum_old" USING "role"::text::"public"."users_role_enum_old";
          DROP TYPE "public"."users_role_enum";
          ALTER TYPE "public"."users_role_enum_old" RENAME TO "users_role_enum";
        END IF;
      END
      $$;
    `);
  }
}
