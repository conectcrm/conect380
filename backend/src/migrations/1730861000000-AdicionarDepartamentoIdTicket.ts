import { MigrationInterface, QueryRunner, TableColumn, TableForeignKey } from 'typeorm';

export class AdicionarDepartamentoIdTicket1730861000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Adicionar coluna departamento_id na tabela de tickets
    await queryRunner.addColumn(
      'atendimento_tickets',
      new TableColumn({
        name: 'departamento_id',
        type: 'uuid',
        isNullable: true,
        comment: 'Departamento responsável pelo atendimento',
      }),
    );

    // Criar foreign key para departamentos
    await queryRunner.createForeignKey(
      'atendimento_tickets',
      new TableForeignKey({
        name: 'FK_ticket_departamento',
        columnNames: ['departamento_id'],
        referencedTableName: 'departamentos',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL', // Se departamento for deletado, ticket mantém mas perde referência
        onUpdate: 'CASCADE',
      }),
    );

    // Criar índice para melhorar performance de queries
    await queryRunner.query(`
      CREATE INDEX "IDX_ticket_departamento" 
      ON "atendimento_tickets" ("departamento_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remover índice
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_ticket_departamento"
    `);

    // Remover foreign key
    await queryRunner.dropForeignKey('atendimento_tickets', 'FK_ticket_departamento');

    // Remover coluna
    await queryRunner.dropColumn('atendimento_tickets', 'departamento_id');
  }
}
