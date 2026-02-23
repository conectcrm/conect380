import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAgendaAttendeeResponses1780000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE IF EXISTS "agenda_eventos"
      ADD COLUMN IF NOT EXISTS "attendee_responses" jsonb
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE IF EXISTS "agenda_eventos"
      DROP COLUMN IF EXISTS "attendee_responses"
    `);
  }
}
