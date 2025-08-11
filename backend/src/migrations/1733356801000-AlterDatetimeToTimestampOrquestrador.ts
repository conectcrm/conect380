import { MigrationInterface, QueryRunner } from 'typeorm';

// Desativada temporariamente pois tabelas alvo não existem no ambiente atual.
export class AlterDatetimeToTimestampOrquestrador1733356801000 implements MigrationInterface {
  name = 'AlterDatetimeToTimestampOrquestrador1733356801000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // No-op temporário
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // No-op
  }
}
