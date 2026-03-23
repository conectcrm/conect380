import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAp304TiposAlertaOperacionalFinanceiro1802890000000 implements MigrationInterface {
  name = 'AddAp304TiposAlertaOperacionalFinanceiro1802890000000';

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
              AND e.enumlabel = 'status_sincronizacao_divergente'
          ) THEN
            ALTER TYPE "public"."alertas_operacionais_financeiro_tipo_enum"
              ADD VALUE 'status_sincronizacao_divergente';
          END IF;

          IF NOT EXISTS (
            SELECT 1
            FROM pg_enum e
            JOIN pg_type t ON t.oid = e.enumtypid
            WHERE t.typname = 'alertas_operacionais_financeiro_tipo_enum'
              AND e.enumlabel = 'referencia_integracao_invalida'
          ) THEN
            ALTER TYPE "public"."alertas_operacionais_financeiro_tipo_enum"
              ADD VALUE 'referencia_integracao_invalida';
          END IF;

          IF NOT EXISTS (
            SELECT 1
            FROM pg_enum e
            JOIN pg_type t ON t.oid = e.enumtypid
            WHERE t.typname = 'alertas_operacionais_financeiro_tipo_enum'
              AND e.enumlabel = 'estorno_falha'
          ) THEN
            ALTER TYPE "public"."alertas_operacionais_financeiro_tipo_enum"
              ADD VALUE 'estorno_falha';
          END IF;
        END IF;
      END$$;
    `);
  }

  public async down(_queryRunner: QueryRunner): Promise<void> {
    // PostgreSQL nao suporta remover valor de enum com segurança sem recriar o tipo.
    // Mantemos no-op para preservar compatibilidade com dados existentes.
  }
}

