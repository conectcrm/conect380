import { MigrationInterface, QueryRunner } from 'typeorm';

export class NormalizeInvalidPlanLimitZeros1808600000000 implements MigrationInterface {
  name = 'NormalizeInvalidPlanLimitZeros1808600000000';
  public transaction = false;

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE "planos"
      SET
        "limiteUsuarios" = CASE WHEN "limiteUsuarios" = 0 THEN -1 ELSE "limiteUsuarios" END,
        "limiteClientes" = CASE WHEN "limiteClientes" = 0 THEN -1 ELSE "limiteClientes" END,
        "limiteStorage" = CASE WHEN "limiteStorage" = 0 THEN -1 ELSE "limiteStorage" END,
        "limiteApiCalls" = CASE WHEN "limiteApiCalls" = 0 THEN -1 ELSE "limiteApiCalls" END,
        "atualizadoEm" = NOW()
      WHERE
        "limiteUsuarios" = 0
        OR "limiteClientes" = 0
        OR "limiteStorage" = 0
        OR "limiteApiCalls" = 0
    `);
  }

  public async down(): Promise<void> {
    // no-op intencional para evitar regressao de dados em producao
  }
}
