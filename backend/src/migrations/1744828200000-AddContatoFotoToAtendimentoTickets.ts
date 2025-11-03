import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddContatoFotoToAtendimentoTickets1744828200000 implements MigrationInterface {
  name = 'AddContatoFotoToAtendimentoTickets1744828200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE atendimento_tickets
      ADD COLUMN IF NOT EXISTS contato_foto VARCHAR(512)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE atendimento_tickets
      DROP COLUMN IF EXISTS contato_foto
    `);
  }
}
