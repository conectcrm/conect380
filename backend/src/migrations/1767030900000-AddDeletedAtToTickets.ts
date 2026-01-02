import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddDeletedAtToTickets1767030900000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'atendimento_tickets',
      new TableColumn({
        name: 'deleted_at',
        type: 'timestamp',
        isNullable: true,
        default: null,
      }),
    );

    console.log('✅ Coluna deleted_at adicionada à tabela atendimento_tickets');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('atendimento_tickets', 'deleted_at');
  }
}
