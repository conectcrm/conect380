import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSaldoCaixaCriticoTipoAlertaOperacionalFinanceiro1802891000000
  implements MigrationInterface
{
  name = 'AddSaldoCaixaCriticoTipoAlertaOperacionalFinanceiro1802891000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM pg_type WHERE typname = 'alertas_operacionais_financeiro_tipo_enum'
        ) THEN
          IF NOT EXISTS (
            SELECT 1
            FROM pg_enum e
            JOIN pg_type t ON t.oid = e.enumtypid
            WHERE t.typname = 'alertas_operacionais_financeiro_tipo_enum'
              AND e.enumlabel = 'saldo_caixa_critico'
          ) THEN
            ALTER TYPE "public"."alertas_operacionais_financeiro_tipo_enum"
              ADD VALUE 'saldo_caixa_critico';
          END IF;
        END IF;
      END$$;
    `);
  }

  public async down(_queryRunner: QueryRunner): Promise<void> {
    // PostgreSQL nao suporta remover valor de enum sem recriar tipo.
    // Mantemos no-op para preservar compatibilidade com dados existentes.
  }
}
