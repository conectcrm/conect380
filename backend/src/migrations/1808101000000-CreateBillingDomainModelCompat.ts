import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateBillingDomainModelCompat1808101000000 implements MigrationInterface {
  name = 'CreateBillingDomainModelCompat1808101000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    if (!(await queryRunner.hasTable('billing_events'))) {
      await queryRunner.query(`
        CREATE TABLE "billing_events" (
          "id" SERIAL PRIMARY KEY,
          "empresa_id" uuid NOT NULL,
          "aggregate_type" character varying(40) NOT NULL,
          "aggregate_id" character varying(120) NOT NULL,
          "event_type" character varying(80) NOT NULL,
          "source" character varying(40) NOT NULL DEFAULT 'system',
          "status" character varying(24) NOT NULL DEFAULT 'recorded',
          "payload" jsonb NOT NULL DEFAULT '{}'::jsonb,
          "correlation_id" character varying(120) NULL,
          "actor_id" uuid NULL,
          "actor_role" character varying(40) NULL,
          "note" text NULL,
          "occurred_at" timestamp without time zone NOT NULL DEFAULT now(),
          "created_at" timestamp without time zone NOT NULL DEFAULT now()
        )
      `);
    }

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_billing_events_empresa_occurred_at"
      ON "billing_events" ("empresa_id", "occurred_at" DESC)
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_billing_events_aggregate_occurred_at"
      ON "billing_events" ("aggregate_type", "aggregate_id", "occurred_at" DESC)
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_billing_events_correlation_id"
      ON "billing_events" ("correlation_id")
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF to_regclass('public.billing_events') IS NOT NULL
          AND to_regclass('public.empresas') IS NOT NULL
          AND NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_billing_events_empresa')
        THEN
          ALTER TABLE "billing_events"
            ADD CONSTRAINT "FK_billing_events_empresa"
            FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id")
            ON DELETE CASCADE ON UPDATE NO ACTION;
        END IF;
      END
      $$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF to_regclass('public.assinaturas_empresas') IS NOT NULL THEN
          EXECUTE '
            CREATE OR REPLACE VIEW "billing_subscriptions" AS
            SELECT
              ae.id::text AS id,
              ae.empresa_id::uuid AS empresa_id,
              ae.plano_id::text AS plan_id,
              CASE ae.status
                WHEN ''ativa'' THEN ''active''
                WHEN ''cancelada'' THEN ''canceled''
                WHEN ''suspensa'' THEN ''suspended''
                WHEN ''pendente'' THEN ''trial''
                ELSE ae.status::text
              END AS status,
              ae."dataInicio"::timestamp without time zone AS period_start,
              ae."dataFim"::timestamp without time zone AS period_end,
              ae."proximoVencimento"::timestamp without time zone AS next_billing_at,
              ae."valorMensal"::numeric(10,2) AS amount,
              ae."renovacaoAutomatica"::boolean AS auto_renew,
              ae."criadoEm"::timestamp without time zone AS created_at,
              ae."atualizadoEm"::timestamp without time zone AS updated_at
            FROM "assinaturas_empresas" ae
          ';
        END IF;
      END
      $$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF to_regclass('public.faturas') IS NOT NULL THEN
          EXECUTE '
            CREATE OR REPLACE VIEW "billing_invoices" AS
            SELECT
              f.id::text AS id,
              f.empresa_id::uuid AS empresa_id,
              f.numero::text AS invoice_number,
              CASE f.status
                WHEN ''pendente'' THEN ''pending''
                WHEN ''enviada'' THEN ''sent''
                WHEN ''paga'' THEN ''paid''
                WHEN ''vencida'' THEN ''overdue''
                WHEN ''cancelada'' THEN ''canceled''
                WHEN ''parcialmente_paga'' THEN ''partially_paid''
                ELSE f.status::text
              END AS status,
              f."dataEmissao"::timestamp without time zone AS issued_at,
              f."dataVencimento"::timestamp without time zone AS due_at,
              f."dataPagamento"::timestamp without time zone AS paid_at,
              f."valorTotal"::numeric(10,2) AS total_amount,
              f."valorPago"::numeric(10,2) AS paid_amount,
              f."valorDesconto"::numeric(10,2) AS discount_amount,
              f."valorJuros"::numeric(10,2) AS interest_amount,
              f."valorMulta"::numeric(10,2) AS penalty_amount,
              f.metadados::jsonb AS metadata,
              f."createdAt"::timestamp without time zone AS created_at,
              f."updatedAt"::timestamp without time zone AS updated_at
            FROM "faturas" f
          ';
        END IF;
      END
      $$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF to_regclass('public.pagamentos') IS NOT NULL THEN
          EXECUTE '
            CREATE OR REPLACE VIEW "billing_payments" AS
            SELECT
              p.id::text AS id,
              p.empresa_id::uuid AS empresa_id,
              p."faturaId"::text AS invoice_id,
              p."transacaoId"::text AS transaction_id,
              CASE p.status
                WHEN ''pendente'' THEN ''pending''
                WHEN ''processando'' THEN ''processing''
                WHEN ''aprovado'' THEN ''approved''
                WHEN ''rejeitado'' THEN ''rejected''
                WHEN ''cancelado'' THEN ''canceled''
                WHEN ''estornado'' THEN ''refunded''
                ELSE p.status::text
              END AS status,
              p.valor::numeric(10,2) AS amount,
              p.taxa::numeric(10,2) AS fee_amount,
              p."valorLiquido"::numeric(10,2) AS net_amount,
              p."metodoPagamento"::text AS payment_method,
              p.gateway::text AS gateway,
              p."gatewayTransacaoId"::text AS gateway_transaction_id,
              p."gatewayStatusRaw"::text AS gateway_status_raw,
              p."dataProcessamento"::timestamp without time zone AS processed_at,
              p."dataAprovacao"::timestamp without time zone AS approved_at,
              p."createdAt"::timestamp without time zone AS created_at
            FROM "pagamentos" p
          ';
        END IF;
      END
      $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP VIEW IF EXISTS "billing_payments"`);
    await queryRunner.query(`DROP VIEW IF EXISTS "billing_invoices"`);
    await queryRunner.query(`DROP VIEW IF EXISTS "billing_subscriptions"`);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF to_regclass('public.billing_events') IS NOT NULL
          AND EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_billing_events_empresa')
        THEN
          ALTER TABLE "billing_events" DROP CONSTRAINT "FK_billing_events_empresa";
        END IF;
      END
      $$;
    `);

    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_billing_events_correlation_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_billing_events_aggregate_occurred_at"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_billing_events_empresa_occurred_at"`);

    await queryRunner.query(`DROP TABLE IF EXISTS "billing_events"`);
  }
}
