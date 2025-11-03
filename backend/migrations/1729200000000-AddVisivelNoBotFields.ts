import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddVisivelNoBotFields1729200000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Adicionar campo visivel_no_bot em nucleos_atendimento
    await queryRunner.addColumn(
      'nucleos_atendimento',
      new TableColumn({
        name: 'visivel_no_bot',
        type: 'boolean',
        default: true,
      }),
    );

    // Adicionar campo visivel_no_bot em departamentos
    await queryRunner.addColumn(
      'departamentos',
      new TableColumn({
        name: 'visivel_no_bot',
        type: 'boolean',
        default: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('departamentos', 'visivel_no_bot');
    await queryRunner.dropColumn('nucleos_atendimento', 'visivel_no_bot');
  }
}
