import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddGatewayPagamentoConfigToEmpresaConfiguracoes1809014000000
  implements MigrationInterface
{
  name = 'AddGatewayPagamentoConfigToEmpresaConfiguracoes1809014000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const tableExists = await queryRunner.hasTable('empresa_configuracoes');
    if (!tableExists) {
      return;
    }

    await queryRunner.query(`
      ALTER TABLE "empresa_configuracoes"
      ADD COLUMN IF NOT EXISTS "gateway_pagamento_provider" character varying
    `);

    await queryRunner.query(`
      ALTER TABLE "empresa_configuracoes"
      ADD COLUMN IF NOT EXISTS "gateway_pagamento_access_token" character varying
    `);

    await queryRunner.query(`
      ALTER TABLE "empresa_configuracoes"
      ADD COLUMN IF NOT EXISTS "gateway_pagamento_webhook_secret" character varying
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const tableExists = await queryRunner.hasTable('empresa_configuracoes');
    if (!tableExists) {
      return;
    }

    await queryRunner.query(`
      ALTER TABLE "empresa_configuracoes"
      DROP COLUMN IF EXISTS "gateway_pagamento_webhook_secret"
    `);

    await queryRunner.query(`
      ALTER TABLE "empresa_configuracoes"
      DROP COLUMN IF EXISTS "gateway_pagamento_access_token"
    `);

    await queryRunner.query(`
      ALTER TABLE "empresa_configuracoes"
      DROP COLUMN IF EXISTS "gateway_pagamento_provider"
    `);
  }
}

