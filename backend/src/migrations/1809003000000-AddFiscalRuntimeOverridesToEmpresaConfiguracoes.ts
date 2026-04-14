import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddFiscalRuntimeOverridesToEmpresaConfiguracoes1809003000000
  implements MigrationInterface
{
  name = 'AddFiscalRuntimeOverridesToEmpresaConfiguracoes1809003000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const tableExists = await queryRunner.hasTable('empresa_configuracoes');
    if (!tableExists) {
      return;
    }

    await queryRunner.query(`
      ALTER TABLE "empresa_configuracoes"
      ADD COLUMN IF NOT EXISTS "fiscal_require_official_provider" boolean
    `);

    await queryRunner.query(`
      ALTER TABLE "empresa_configuracoes"
      ADD COLUMN IF NOT EXISTS "fiscal_official_strict_response" boolean
    `);

    await queryRunner.query(`
      ALTER TABLE "empresa_configuracoes"
      ADD COLUMN IF NOT EXISTS "fiscal_official_webhook_allow_insecure" boolean
    `);

    await queryRunner.query(`
      ALTER TABLE "empresa_configuracoes"
      ADD COLUMN IF NOT EXISTS "fiscal_official_correlation_header" character varying
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const tableExists = await queryRunner.hasTable('empresa_configuracoes');
    if (!tableExists) {
      return;
    }

    await queryRunner.query(`
      ALTER TABLE "empresa_configuracoes"
      DROP COLUMN IF EXISTS "fiscal_official_correlation_header"
    `);

    await queryRunner.query(`
      ALTER TABLE "empresa_configuracoes"
      DROP COLUMN IF EXISTS "fiscal_official_webhook_allow_insecure"
    `);

    await queryRunner.query(`
      ALTER TABLE "empresa_configuracoes"
      DROP COLUMN IF EXISTS "fiscal_official_strict_response"
    `);

    await queryRunner.query(`
      ALTER TABLE "empresa_configuracoes"
      DROP COLUMN IF EXISTS "fiscal_require_official_provider"
    `);
  }
}

