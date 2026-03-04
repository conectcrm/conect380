import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMaintenanceBannerToSystemBranding1802902000000 implements MigrationInterface {
  name = 'AddMaintenanceBannerToSystemBranding1802902000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE IF EXISTS "system_branding"
      ADD COLUMN IF NOT EXISTS "maintenance_enabled" boolean NOT NULL DEFAULT false;
    `);

    await queryRunner.query(`
      ALTER TABLE IF EXISTS "system_branding"
      ADD COLUMN IF NOT EXISTS "maintenance_title" character varying(120);
    `);

    await queryRunner.query(`
      ALTER TABLE IF EXISTS "system_branding"
      ADD COLUMN IF NOT EXISTS "maintenance_message" text;
    `);

    await queryRunner.query(`
      ALTER TABLE IF EXISTS "system_branding"
      ADD COLUMN IF NOT EXISTS "maintenance_starts_at" TIMESTAMP WITH TIME ZONE;
    `);

    await queryRunner.query(`
      ALTER TABLE IF EXISTS "system_branding"
      ADD COLUMN IF NOT EXISTS "maintenance_expected_end_at" TIMESTAMP WITH TIME ZONE;
    `);

    await queryRunner.query(`
      ALTER TABLE IF EXISTS "system_branding"
      ADD COLUMN IF NOT EXISTS "maintenance_severity" character varying(20) NOT NULL DEFAULT 'warning';
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE IF EXISTS "system_branding"
      DROP COLUMN IF EXISTS "maintenance_severity";
    `);

    await queryRunner.query(`
      ALTER TABLE IF EXISTS "system_branding"
      DROP COLUMN IF EXISTS "maintenance_expected_end_at";
    `);

    await queryRunner.query(`
      ALTER TABLE IF EXISTS "system_branding"
      DROP COLUMN IF EXISTS "maintenance_starts_at";
    `);

    await queryRunner.query(`
      ALTER TABLE IF EXISTS "system_branding"
      DROP COLUMN IF EXISTS "maintenance_message";
    `);

    await queryRunner.query(`
      ALTER TABLE IF EXISTS "system_branding"
      DROP COLUMN IF EXISTS "maintenance_title";
    `);

    await queryRunner.query(`
      ALTER TABLE IF EXISTS "system_branding"
      DROP COLUMN IF EXISTS "maintenance_enabled";
    `);
  }
}

