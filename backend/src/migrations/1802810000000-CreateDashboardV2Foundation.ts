import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateDashboardV2Foundation1802810000000 implements MigrationInterface {
  name = 'CreateDashboardV2Foundation1802810000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "dashboard_pipeline_snapshot_daily" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "empresa_id" uuid NOT NULL,
        "date_key" date NOT NULL,
        "stage" character varying(80) NOT NULL,
        "quantidade" integer NOT NULL DEFAULT 0,
        "valor_total" numeric(14,2) NOT NULL DEFAULT 0,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_dashboard_pipeline_snapshot_daily" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "dashboard_funnel_metrics_daily" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "empresa_id" uuid NOT NULL,
        "date_key" date NOT NULL,
        "from_stage" character varying(80) NOT NULL,
        "to_stage" character varying(80) NOT NULL,
        "entered_count" integer NOT NULL DEFAULT 0,
        "progressed_count" integer NOT NULL DEFAULT 0,
        "conversion_rate" numeric(8,2) NOT NULL DEFAULT 0,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_dashboard_funnel_metrics_daily" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "dashboard_aging_stage_daily" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "empresa_id" uuid NOT NULL,
        "date_key" date NOT NULL,
        "stage" character varying(80) NOT NULL,
        "avg_days" numeric(8,2) NOT NULL DEFAULT 0,
        "stalled_count" integer NOT NULL DEFAULT 0,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_dashboard_aging_stage_daily" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "dashboard_revenue_metrics_daily" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "empresa_id" uuid NOT NULL,
        "date_key" date NOT NULL,
        "receita_fechada" numeric(14,2) NOT NULL DEFAULT 0,
        "receita_prevista" numeric(14,2) NOT NULL DEFAULT 0,
        "ticket_medio" numeric(14,2) NOT NULL DEFAULT 0,
        "ciclo_medio_dias" numeric(8,2) NOT NULL DEFAULT 0,
        "oportunidades_ativas" integer NOT NULL DEFAULT 0,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_dashboard_revenue_metrics_daily" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "feature_flags_tenant" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "empresa_id" uuid NOT NULL,
        "flag_key" character varying(80) NOT NULL,
        "enabled" boolean NOT NULL DEFAULT false,
        "rollout_percentage" integer NOT NULL DEFAULT 0,
        "updated_by" uuid,
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_feature_flags_tenant" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "dashboard_v2_metric_divergence" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "empresa_id" uuid NOT NULL,
        "metric_key" character varying(80) NOT NULL,
        "period_start" date NOT NULL,
        "period_end" date NOT NULL,
        "v1_value" numeric(14,2) NOT NULL,
        "v2_value" numeric(14,2) NOT NULL,
        "divergence_pct" numeric(8,2) NOT NULL,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_dashboard_v2_metric_divergence" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'UQ_pipeline_snapshot_empresa_date_stage'
        ) THEN
          ALTER TABLE "dashboard_pipeline_snapshot_daily"
            ADD CONSTRAINT "UQ_pipeline_snapshot_empresa_date_stage"
            UNIQUE ("empresa_id", "date_key", "stage");
        END IF;
      END
      $$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'UQ_funnel_metrics_empresa_date_from_to'
        ) THEN
          ALTER TABLE "dashboard_funnel_metrics_daily"
            ADD CONSTRAINT "UQ_funnel_metrics_empresa_date_from_to"
            UNIQUE ("empresa_id", "date_key", "from_stage", "to_stage");
        END IF;
      END
      $$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'UQ_aging_stage_empresa_date_stage'
        ) THEN
          ALTER TABLE "dashboard_aging_stage_daily"
            ADD CONSTRAINT "UQ_aging_stage_empresa_date_stage"
            UNIQUE ("empresa_id", "date_key", "stage");
        END IF;
      END
      $$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'UQ_revenue_metrics_empresa_date'
        ) THEN
          ALTER TABLE "dashboard_revenue_metrics_daily"
            ADD CONSTRAINT "UQ_revenue_metrics_empresa_date"
            UNIQUE ("empresa_id", "date_key");
        END IF;
      END
      $$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'UQ_feature_flags_tenant_empresa_flag'
        ) THEN
          ALTER TABLE "feature_flags_tenant"
            ADD CONSTRAINT "UQ_feature_flags_tenant_empresa_flag"
            UNIQUE ("empresa_id", "flag_key");
        END IF;
      END
      $$;
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_dashboard_pipeline_snapshot_empresa_date"
      ON "dashboard_pipeline_snapshot_daily" ("empresa_id", "date_key")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_dashboard_funnel_metrics_empresa_date"
      ON "dashboard_funnel_metrics_daily" ("empresa_id", "date_key")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_dashboard_aging_stage_empresa_date"
      ON "dashboard_aging_stage_daily" ("empresa_id", "date_key")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_dashboard_revenue_metrics_empresa_date"
      ON "dashboard_revenue_metrics_daily" ("empresa_id", "date_key")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_feature_flags_tenant_empresa"
      ON "feature_flags_tenant" ("empresa_id")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_dashboard_v2_divergence_empresa_created"
      ON "dashboard_v2_metric_divergence" ("empresa_id", "created_at")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_dashboard_v2_divergence_empresa_created"`,
    );
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_feature_flags_tenant_empresa"`);
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_dashboard_revenue_metrics_empresa_date"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_dashboard_aging_stage_empresa_date"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_dashboard_funnel_metrics_empresa_date"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_dashboard_pipeline_snapshot_empresa_date"`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "dashboard_v2_metric_divergence" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "feature_flags_tenant" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "dashboard_revenue_metrics_daily" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "dashboard_aging_stage_daily" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "dashboard_funnel_metrics_daily" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "dashboard_pipeline_snapshot_daily" CASCADE`);
  }
}
