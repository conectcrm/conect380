import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAgendaEventIdToInteracoes1764002000000 implements MigrationInterface {
  name = 'AddAgendaEventIdToInteracoes1764002000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "interacoes"
      ADD COLUMN IF NOT EXISTS "agenda_event_id" uuid NULL
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_interacoes_agenda_event_id"
      ON "interacoes" ("agenda_event_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_interacoes_agenda_event_id"`);
    await queryRunner.query(`ALTER TABLE "interacoes" DROP COLUMN IF EXISTS "agenda_event_id"`);
  }
}
