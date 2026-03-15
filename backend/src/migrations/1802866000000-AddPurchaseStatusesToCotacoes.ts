import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Fase 2 do fluxo de compras internas para cotações:
 * - adiciona status reais: pedido_gerado e adquirido
 * - migra registros legados "convertida" para os novos status
 *
 * Estratégia de migração:
 * - se metadados.compra.status = 'adquirido' => status = 'adquirido'
 * - demais 'convertida' => status = 'pedido_gerado'
 *
 * A migration é idempotente e segura para rodar múltiplas vezes.
 */
export class AddPurchaseStatusesToCotacoes1802866000000 implements MigrationInterface {
  name = 'AddPurchaseStatusesToCotacoes1802866000000';
  public transaction = false;

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1
          FROM pg_type t
          JOIN pg_namespace n ON n.oid = t.typnamespace
          WHERE t.typname = 'cotacoes_status_enum'
            AND n.nspname = 'public'
        ) THEN
          IF NOT EXISTS (
            SELECT 1
            FROM pg_enum e
            JOIN pg_type t ON t.oid = e.enumtypid
            WHERE t.typname = 'cotacoes_status_enum'
              AND e.enumlabel = 'pedido_gerado'
          ) THEN
            ALTER TYPE "public"."cotacoes_status_enum" ADD VALUE 'pedido_gerado';
          END IF;

          IF NOT EXISTS (
            SELECT 1
            FROM pg_enum e
            JOIN pg_type t ON t.oid = e.enumtypid
            WHERE t.typname = 'cotacoes_status_enum'
              AND e.enumlabel = 'adquirido'
          ) THEN
            ALTER TYPE "public"."cotacoes_status_enum" ADD VALUE 'adquirido';
          END IF;
        END IF;
      END$$;
    `);

    // Migra convertidas já concluídas em metadados para "adquirido"
    await queryRunner.query(`
      UPDATE "cotacoes"
      SET "status" = 'adquirido'::"public"."cotacoes_status_enum"
      WHERE "status"::text = 'convertida'
        AND COALESCE(("metadados"::jsonb -> 'compra' ->> 'status'), '') = 'adquirido';
    `);

    // Demais convertidas passam a representar "pedido_gerado"
    await queryRunner.query(`
      UPDATE "cotacoes"
      SET "status" = 'pedido_gerado'::"public"."cotacoes_status_enum"
      WHERE "status"::text = 'convertida';
    `);

    // Sincroniza metadados.compra.status com os novos status (quando ausente)
    await queryRunner.query(`
      UPDATE "cotacoes"
      SET "metadados" = jsonb_set(
        COALESCE("metadados"::jsonb, '{}'::jsonb),
        '{compra,status}',
        to_jsonb(CASE
          WHEN "status" = 'adquirido' THEN 'adquirido'
          WHEN "status" = 'pedido_gerado' THEN 'pedido_gerado'
          ELSE 'pedido_gerado'
        END::text),
        true
      )::json
      WHERE "status" IN ('pedido_gerado', 'adquirido')
        AND COALESCE(("metadados"::jsonb -> 'compra' ->> 'status'), '') = '';
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Reverte os dados para o status legado "convertida".
    // PostgreSQL não permite remover valores de enum sem recriação completa do tipo.
    await queryRunner.query(`
      UPDATE "cotacoes"
      SET "status" = 'convertida'::"public"."cotacoes_status_enum"
      WHERE "status"::text IN ('pedido_gerado', 'adquirido');
    `);
  }
}
