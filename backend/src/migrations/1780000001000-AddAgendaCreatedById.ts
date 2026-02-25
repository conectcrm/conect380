import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAgendaCreatedById1780000001000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE IF EXISTS "agenda_eventos"
      ADD COLUMN IF NOT EXISTS "criado_por_id" uuid
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE IF EXISTS "agenda_eventos"
      DROP COLUMN IF EXISTS "criado_por_id"
    `);
  }
}
