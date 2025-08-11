import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlterFaturaContratoIdNullable1733356800000 implements MigrationInterface {
  name = 'AlterFaturaContratoIdNullable1733356800000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Tornar contratoId nullable
    await queryRunner.query(`ALTER TABLE "faturas" ALTER COLUMN "contratoId" DROP NOT NULL`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Reverter para NOT NULL (cuidado: pode falhar se existir linhas sem contratoId)
    await queryRunner.query(`UPDATE "faturas" SET "contratoId" = 0 WHERE "contratoId" IS NULL`); // fallback mínimo
    await queryRunner.query(`ALTER TABLE "faturas" ALTER COLUMN "contratoId" SET NOT NULL`);
  }
}
