import { MigrationInterface, QueryRunner, TableColumn, TableForeignKey } from 'typeorm';

export class AddOportunidadeIdToPropostas1775100000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    console.log('🔄 Iniciando migration: Adicionar oportunidade_id em propostas...');

    const propostasTable = await queryRunner.getTable('propostas');
    if (!propostasTable) {
      throw new Error('Tabela propostas não encontrada');
    }

    // 1. Adicionar coluna oportunidade_id, caso ainda não exista
    const hasColumn = propostasTable.findColumnByName('oportunidade_id');
    if (!hasColumn) {
      await queryRunner.addColumn(
        'propostas',
        new TableColumn({
          name: 'oportunidade_id',
          type: 'integer',
          isNullable: true,
          comment: 'FK para oportunidade que originou esta proposta',
        }),
      );
      console.log('✅ Coluna oportunidade_id adicionada');
    } else {
      console.log('ℹ️  Coluna oportunidade_id já existe. Pulando criação.');
    }

    // 2. Criar foreign key apenas se ainda não existir
    const hasForeignKey = propostasTable.foreignKeys.some(
      (fk) => fk.name === 'FK_propostas_oportunidade',
    );
    if (!hasForeignKey) {
      await queryRunner.createForeignKey(
        'propostas',
        new TableForeignKey({
          name: 'FK_propostas_oportunidade',
          columnNames: ['oportunidade_id'],
          referencedTableName: 'oportunidades',
          referencedColumnNames: ['id'],
          onDelete: 'SET NULL',
          onUpdate: 'CASCADE',
        }),
      );
      console.log('✅ Foreign key FK_propostas_oportunidade criada');
    } else {
      console.log('ℹ️  Foreign key FK_propostas_oportunidade já existe.');
    }

    // 3. Criar índice para performance (idempotente)
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS IDX_propostas_oportunidade_id 
      ON propostas(oportunidade_id) 
      WHERE oportunidade_id IS NOT NULL;
    `);

    console.log('✅ Índice IDX_propostas_oportunidade_id pronto');
    console.log('🎉 Migration concluída com sucesso!');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    console.log('🔄 Revertendo migration: Remover oportunidade_id de propostas...');

    // 1. Remover índice
    await queryRunner.query(`DROP INDEX IF EXISTS IDX_propostas_oportunidade_id;`);
    console.log('✅ Índice removido');

    const propostasTable = await queryRunner.getTable('propostas');
    if (!propostasTable) {
      console.log('⚠️  Tabela propostas não encontrada. Nada para reverter.');
      return;
    }

    // 2. Remover foreign key se existir
    const fk = propostasTable.foreignKeys.find((key) => key.name === 'FK_propostas_oportunidade');
    if (fk) {
      await queryRunner.dropForeignKey('propostas', fk);
      console.log('✅ Foreign key removida');
    } else {
      console.log('ℹ️  Foreign key FK_propostas_oportunidade não existe.');
    }

    // 3. Remover coluna somente se existir
    const hasColumn = propostasTable.findColumnByName('oportunidade_id');
    if (hasColumn) {
      await queryRunner.dropColumn('propostas', 'oportunidade_id');
      console.log('✅ Coluna oportunidade_id removida');
    } else {
      console.log('ℹ️  Coluna oportunidade_id não existe.');
    }

    console.log('🎉 Rollback concluído com sucesso!');
  }
}
