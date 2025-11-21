import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDeveTrocarSenhaFlagToUsers1762216500000 implements MigrationInterface {
  name = 'AddDeveTrocarSenhaFlagToUsers1762216500000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
      ADD "deve_trocar_senha" boolean NOT NULL DEFAULT false
    `);

    await queryRunner.query(`
      UPDATE "users"
      SET "deve_trocar_senha" = false
      WHERE "deve_trocar_senha" IS NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
      DROP COLUMN "deve_trocar_senha"
    `);
  }
}
