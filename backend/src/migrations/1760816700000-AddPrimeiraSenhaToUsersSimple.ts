import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPrimeiraSenhaToUsers1760816700000 implements MigrationInterface {
  name = 'AddPrimeiraSenhaToUsers1760816700000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Adicionar coluna primeira_senha na tabela users
    await queryRunner.query(
      `ALTER TABLE "users" ADD "primeira_senha" boolean NOT NULL DEFAULT false`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remover coluna primeira_senha da tabela users
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "primeira_senha"`);
  }
}
