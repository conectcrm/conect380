import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAlcadaAprovacaoFinanceiraToEmpresaConfiguracoes1802882000000
  implements MigrationInterface
{
  name = 'AddAlcadaAprovacaoFinanceiraToEmpresaConfiguracoes1802882000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const tableExists = await queryRunner.hasTable('empresa_configuracoes');
    if (!tableExists) {
      return;
    }

    await queryRunner.query(`
      ALTER TABLE "empresa_configuracoes"
      ADD COLUMN IF NOT EXISTS "alcada_aprovacao_financeira" numeric(15,2)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const tableExists = await queryRunner.hasTable('empresa_configuracoes');
    if (!tableExists) {
      return;
    }

    await queryRunner.query(`
      ALTER TABLE "empresa_configuracoes"
      DROP COLUMN IF EXISTS "alcada_aprovacao_financeira"
    `);
  }
}
