import { MigrationInterface, QueryRunner, TableColumn, TableForeignKey, TableIndex } from 'typeorm';

export class AdicionarDepartamentoConfiguracaoInatividade1730860000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Remover índice único anterior (apenas empresaId)
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_configuracao_inatividade_empresa";
    `);

    // 2. Adicionar coluna departamento_id
    await queryRunner.addColumn(
      'atendimento_configuracao_inatividade',
      new TableColumn({
        name: 'departamento_id',
        type: 'uuid',
        isNullable: true,
        comment: 'Departamento específico (NULL = configuração global da empresa)',
      }),
    );

    // 3. Criar índice único composto (empresaId + departamentoId)
    await queryRunner.createIndex(
      'atendimento_configuracao_inatividade',
      new TableIndex({
        name: 'IDX_configuracao_inatividade_empresa_departamento',
        columnNames: ['empresa_id', 'departamento_id'],
        isUnique: true,
      }),
    );

    // 4. Criar foreign key para departamentos
    await queryRunner.createForeignKey(
      'atendimento_configuracao_inatividade',
      new TableForeignKey({
        name: 'FK_configuracao_inatividade_departamento',
        columnNames: ['departamento_id'],
        referencedTableName: 'departamentos',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 1. Remover foreign key
    await queryRunner.dropForeignKey(
      'atendimento_configuracao_inatividade',
      'FK_configuracao_inatividade_departamento',
    );

    // 2. Remover índice composto
    await queryRunner.dropIndex(
      'atendimento_configuracao_inatividade',
      'IDX_configuracao_inatividade_empresa_departamento',
    );

    // 3. Remover coluna
    await queryRunner.dropColumn('atendimento_configuracao_inatividade', 'departamento_id');

    // 4. Recriar índice único anterior (apenas empresaId)
    await queryRunner.createIndex(
      'atendimento_configuracao_inatividade',
      new TableIndex({
        name: 'IDX_configuracao_inatividade_empresa',
        columnNames: ['empresa_id'],
        isUnique: true,
      }),
    );
  }
}
