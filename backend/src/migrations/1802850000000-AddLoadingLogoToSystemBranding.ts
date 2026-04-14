import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddLoadingLogoToSystemBranding1802850000000 implements MigrationInterface {
  name = 'AddLoadingLogoToSystemBranding1802850000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE IF EXISTS "system_branding"
      ADD COLUMN IF NOT EXISTS "loading_logo_url" text;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE IF EXISTS "system_branding"
      DROP COLUMN IF EXISTS "loading_logo_url";
    `);
  }
}
