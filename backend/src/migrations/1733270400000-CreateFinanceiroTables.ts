import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migration legada preservada por compatibilidade histórica.
 *
 * Contexto:
 * - O arquivo existia vazio no histórico do projeto.
 * - Para manter rastreabilidade e evitar ambiguidades no pipeline,
 *   ele passa a declarar explicitamente um no-op.
 */
export class CreateFinanceiroTables1733270400000 implements MigrationInterface {
  name = 'CreateFinanceiroTables1733270400000';

  public async up(_queryRunner: QueryRunner): Promise<void> {
    // no-op intencional
  }

  public async down(_queryRunner: QueryRunner): Promise<void> {
    // no-op intencional
  }
}
