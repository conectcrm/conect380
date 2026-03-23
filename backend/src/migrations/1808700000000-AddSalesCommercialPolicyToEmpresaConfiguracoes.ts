import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSalesCommercialPolicyToEmpresaConfiguracoes1808700000000
  implements MigrationInterface
{
  name = 'AddSalesCommercialPolicyToEmpresaConfiguracoes1808700000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const tableExists = await queryRunner.hasTable('empresa_configuracoes');
    if (!tableExists) {
      return;
    }

    await queryRunner.query(`
      ALTER TABLE "empresa_configuracoes"
      ADD COLUMN IF NOT EXISTS "comercial_limite_desconto_percentual" numeric(5,2) NOT NULL DEFAULT 10
    `);

    await queryRunner.query(`
      ALTER TABLE "empresa_configuracoes"
      ADD COLUMN IF NOT EXISTS "comercial_aprovacao_interna_habilitada" boolean NOT NULL DEFAULT true
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const tableExists = await queryRunner.hasTable('empresa_configuracoes');
    if (!tableExists) {
      return;
    }

    await queryRunner.query(`
      ALTER TABLE "empresa_configuracoes"
      DROP COLUMN IF EXISTS "comercial_aprovacao_interna_habilitada"
    `);

    await queryRunner.query(`
      ALTER TABLE "empresa_configuracoes"
      DROP COLUMN IF EXISTS "comercial_limite_desconto_percentual"
    `);
  }
}
