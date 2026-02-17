import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddContatoEmailToTicket1763561367642 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "atendimento_tickets" 
            ADD COLUMN "contato_email" VARCHAR(255) NULL
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "atendimento_tickets" 
            DROP COLUMN "contato_email"
        `);
  }
}
