import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddACombinarFormaPagamentoFaturas1808701000000 implements MigrationInterface {
  name = 'AddACombinarFormaPagamentoFaturas1808701000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1
          FROM pg_type
          WHERE typname = 'faturas_formapagamentopreferida_enum'
        ) THEN
          IF NOT EXISTS (
            SELECT 1
            FROM pg_enum e
            JOIN pg_type t ON t.oid = e.enumtypid
            WHERE t.typname = 'faturas_formapagamentopreferida_enum'
              AND e.enumlabel = 'a_combinar'
          ) THEN
            ALTER TYPE "public"."faturas_formapagamentopreferida_enum"
              ADD VALUE 'a_combinar';
          END IF;
        END IF;
      END$$;
    `);
  }

  public async down(_queryRunner: QueryRunner): Promise<void> {
    // PostgreSQL nao suporta remover valor de enum sem recriar o tipo.
    // Mantemos no-op para preservar compatibilidade com dados existentes.
  }
}
