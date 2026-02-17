import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migration legada preservada por compatibilidade histórica.
 *
 * Contexto:
 * - O arquivo existia vazio no histórico do projeto.
 * - Para manter rastreabilidade e evitar ambiguidades no pipeline,
 *   ele passa a declarar explicitamente um no-op.
 */
export class CreateSubscriptionTables1704396800000 implements MigrationInterface {
  name = 'CreateSubscriptionTables1704396800000';

  public async up(_queryRunner: QueryRunner): Promise<void> {
    // no-op intencional
  }

  public async down(_queryRunner: QueryRunner): Promise<void> {
    // no-op intencional
  }
}
