import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddFiscalProviderConfigToEmpresaConfiguracoes1809002000000
  implements MigrationInterface
{
  name = 'AddFiscalProviderConfigToEmpresaConfiguracoes1809002000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const tableExists = await queryRunner.hasTable('empresa_configuracoes');
    if (!tableExists) {
      return;
    }

    await queryRunner.query(`
      ALTER TABLE "empresa_configuracoes"
      ADD COLUMN IF NOT EXISTS "fiscal_provider" character varying
    `);

    await queryRunner.query(`
      ALTER TABLE "empresa_configuracoes"
      ADD COLUMN IF NOT EXISTS "fiscal_official_http_enabled" boolean
    `);

    await queryRunner.query(`
      ALTER TABLE "empresa_configuracoes"
      ADD COLUMN IF NOT EXISTS "fiscal_official_base_url" character varying
    `);

    await queryRunner.query(`
      ALTER TABLE "empresa_configuracoes"
      ADD COLUMN IF NOT EXISTS "fiscal_official_api_token" character varying
    `);

    await queryRunner.query(`
      ALTER TABLE "empresa_configuracoes"
      ADD COLUMN IF NOT EXISTS "fiscal_official_webhook_secret" character varying
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const tableExists = await queryRunner.hasTable('empresa_configuracoes');
    if (!tableExists) {
      return;
    }

    await queryRunner.query(`
      ALTER TABLE "empresa_configuracoes"
      DROP COLUMN IF EXISTS "fiscal_official_webhook_secret"
    `);

    await queryRunner.query(`
      ALTER TABLE "empresa_configuracoes"
      DROP COLUMN IF EXISTS "fiscal_official_api_token"
    `);

    await queryRunner.query(`
      ALTER TABLE "empresa_configuracoes"
      DROP COLUMN IF EXISTS "fiscal_official_base_url"
    `);

    await queryRunner.query(`
      ALTER TABLE "empresa_configuracoes"
      DROP COLUMN IF EXISTS "fiscal_official_http_enabled"
    `);

    await queryRunner.query(`
      ALTER TABLE "empresa_configuracoes"
      DROP COLUMN IF EXISTS "fiscal_provider"
    `);
  }
}

