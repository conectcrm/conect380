import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateSubscriptionStateMachineStatuses1808102000000 implements MigrationInterface {
  name = 'UpdateSubscriptionStateMachineStatuses1808102000000';
  public transaction = false;

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      DECLARE
        enum_value text;
      BEGIN
        IF EXISTS (
          SELECT 1
          FROM pg_type t
          JOIN pg_namespace n ON n.oid = t.typnamespace
          WHERE t.typname = 'assinaturas_empresas_status_enum'
            AND n.nspname = 'public'
        ) THEN
          FOREACH enum_value IN ARRAY ARRAY['trial', 'active', 'past_due', 'suspended', 'canceled'] LOOP
            IF NOT EXISTS (
              SELECT 1
              FROM pg_enum e
              JOIN pg_type t ON t.oid = e.enumtypid
              JOIN pg_namespace n ON n.oid = t.typnamespace
              WHERE t.typname = 'assinaturas_empresas_status_enum'
                AND n.nspname = 'public'
                AND e.enumlabel = enum_value
            ) THEN
              EXECUTE format(
                'ALTER TYPE "public"."assinaturas_empresas_status_enum" ADD VALUE %L',
                enum_value
              );
            END IF;
          END LOOP;
        END IF;
      END
      $$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF to_regclass('public.assinaturas_empresas') IS NOT NULL THEN
          UPDATE "assinaturas_empresas"
          SET status = CASE status
            WHEN 'ativa' THEN 'active'
            WHEN 'pendente' THEN 'trial'
            WHEN 'suspensa' THEN 'suspended'
            WHEN 'cancelada' THEN 'canceled'
            ELSE status
          END
          WHERE status IN ('ativa', 'pendente', 'suspensa', 'cancelada');
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
              CASE
                WHEN ae.status IN (''active'', ''ativa'') THEN ''active''
                WHEN ae.status IN (''trial'', ''pendente'') THEN ''trial''
                WHEN ae.status = ''past_due'' THEN ''past_due''
                WHEN ae.status IN (''suspended'', ''suspensa'') THEN ''suspended''
                WHEN ae.status IN (''canceled'', ''cancelada'') THEN ''canceled''
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
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        IF to_regclass('public.assinaturas_empresas') IS NOT NULL THEN
          UPDATE "assinaturas_empresas"
          SET status = CASE status
            WHEN 'active' THEN 'ativa'
            WHEN 'trial' THEN 'pendente'
            WHEN 'past_due' THEN 'pendente'
            WHEN 'suspended' THEN 'suspensa'
            WHEN 'canceled' THEN 'cancelada'
            ELSE status
          END
          WHERE status IN ('active', 'trial', 'past_due', 'suspended', 'canceled');
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
  }
}
