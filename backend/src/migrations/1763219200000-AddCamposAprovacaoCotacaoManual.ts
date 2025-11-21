import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCamposAprovacaoCotacaoManual1763219200000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Verificar e adicionar data_aprovacao se não existir
    const hasDataAprovacao = await queryRunner.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name='cotacoes' AND column_name='data_aprovacao'
    `);

    if (hasDataAprovacao.length === 0) {
      await queryRunner.query(`
        ALTER TABLE "cotacoes" 
        ADD COLUMN "data_aprovacao" TIMESTAMP NULL
      `);
    }

    // Verificar e adicionar status_aprovacao se não existir
    const hasStatusAprovacao = await queryRunner.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name='cotacoes' AND column_name='status_aprovacao'
    `);

    if (hasStatusAprovacao.length === 0) {
      await queryRunner.query(`
        ALTER TABLE "cotacoes" 
        ADD COLUMN "status_aprovacao" VARCHAR(20) NULL
      `);
    }

    // Verificar e adicionar justificativa_aprovacao se não existir
    const hasJustificativaAprovacao = await queryRunner.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name='cotacoes' AND column_name='justificativa_aprovacao'
    `);

    if (hasJustificativaAprovacao.length === 0) {
      await queryRunner.query(`
        ALTER TABLE "cotacoes" 
        ADD COLUMN "justificativa_aprovacao" TEXT NULL
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "cotacoes" DROP COLUMN IF EXISTS "justificativa_aprovacao"`);
    await queryRunner.query(`ALTER TABLE "cotacoes" DROP COLUMN IF EXISTS "status_aprovacao"`);
    await queryRunner.query(`ALTER TABLE "cotacoes" DROP COLUMN IF EXISTS "data_aprovacao"`);
  }
}
