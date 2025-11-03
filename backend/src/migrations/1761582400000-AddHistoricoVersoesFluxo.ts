import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddHistoricoVersoesFluxo1761582400000 implements MigrationInterface {
  name = 'AddHistoricoVersoesFluxo1761582400000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const tableName = 'fluxos_triagem';

    // Adicionar coluna historico_versoes (JSONB array) se ainda não existir
    const hasHistoricoColumn = await queryRunner.hasColumn(tableName, 'historico_versoes');
    if (!hasHistoricoColumn) {
      await queryRunner.query(`
        ALTER TABLE "${tableName}" 
        ADD COLUMN "historico_versoes" jsonb DEFAULT '[]'::jsonb
      `);
    }

    // Adicionar coluna versao_atual (INTEGER) se ainda não existir
    const hasVersaoAtualColumn = await queryRunner.hasColumn(tableName, 'versao_atual');
    if (!hasVersaoAtualColumn) {
      await queryRunner.query(`
        ALTER TABLE "${tableName}" 
        ADD COLUMN "versao_atual" integer DEFAULT 1
      `);
    }

    console.log('✅ Colunas de versionamento adicionadas com sucesso!');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const tableName = 'fluxos_triagem';

    // Remover colunas em caso de rollback
    const hasVersaoAtualColumn = await queryRunner.hasColumn(tableName, 'versao_atual');
    if (hasVersaoAtualColumn) {
      await queryRunner.query(`
        ALTER TABLE "${tableName}" 
        DROP COLUMN "versao_atual"
      `);
    }

    const hasHistoricoColumn = await queryRunner.hasColumn(tableName, 'historico_versoes');
    if (hasHistoricoColumn) {
      await queryRunner.query(`
        ALTER TABLE "${tableName}" 
        DROP COLUMN "historico_versoes"
      `);
    }

    console.log('✅ Rollback de versionamento executado com sucesso!');
  }
}
