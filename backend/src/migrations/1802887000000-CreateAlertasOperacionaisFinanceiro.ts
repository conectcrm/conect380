import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAlertasOperacionaisFinanceiro1802887000000 implements MigrationInterface {
  name = 'CreateAlertasOperacionaisFinanceiro1802887000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_type WHERE typname = 'alertas_operacionais_financeiro_tipo_enum'
        ) THEN
          CREATE TYPE "public"."alertas_operacionais_financeiro_tipo_enum" AS ENUM(
            'conta_vence_em_3_dias',
            'conta_vencida',
            'conciliacao_pendente_critica',
            'webhook_pagamento_falha',
            'exportacao_contabil_falha'
          );
        END IF;
      END$$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_type WHERE typname = 'alertas_operacionais_financeiro_severidade_enum'
        ) THEN
          CREATE TYPE "public"."alertas_operacionais_financeiro_severidade_enum" AS ENUM('info', 'warning', 'critical');
        END IF;
      END$$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_type WHERE typname = 'alertas_operacionais_financeiro_status_enum'
        ) THEN
          CREATE TYPE "public"."alertas_operacionais_financeiro_status_enum" AS ENUM('ativo', 'acknowledged', 'resolvido');
        END IF;
      END$$;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "alertas_operacionais_financeiro" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "empresa_id" uuid NOT NULL,
        "tipo" "public"."alertas_operacionais_financeiro_tipo_enum" NOT NULL,
        "severidade" "public"."alertas_operacionais_financeiro_severidade_enum" NOT NULL DEFAULT 'warning',
        "titulo" character varying(220) NOT NULL,
        "descricao" text,
        "referencia" character varying(180),
        "status" "public"."alertas_operacionais_financeiro_status_enum" NOT NULL DEFAULT 'ativo',
        "payload" jsonb NOT NULL DEFAULT '{}'::jsonb,
        "auditoria" jsonb NOT NULL DEFAULT '[]'::jsonb,
        "acknowledged_por" character varying(120),
        "acknowledged_em" TIMESTAMP NULL,
        "resolvido_por" character varying(120),
        "resolvido_em" TIMESTAMP NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_alertas_operacionais_financeiro_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_alertas_operacionais_financeiro_empresa_status"
      ON "alertas_operacionais_financeiro" ("empresa_id", "status")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_alertas_operacionais_financeiro_empresa_severidade"
      ON "alertas_operacionais_financeiro" ("empresa_id", "severidade")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_alertas_operacionais_financeiro_empresa_created_at"
      ON "alertas_operacionais_financeiro" ("empresa_id", "created_at")
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM information_schema.table_constraints
          WHERE constraint_name = 'fk_alertas_operacionais_financeiro_empresa'
            AND table_name = 'alertas_operacionais_financeiro'
        ) THEN
          ALTER TABLE "alertas_operacionais_financeiro"
            ADD CONSTRAINT "fk_alertas_operacionais_financeiro_empresa"
            FOREIGN KEY ("empresa_id")
            REFERENCES "empresas"("id")
            ON DELETE CASCADE
            ON UPDATE NO ACTION;
        END IF;
      END$$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "alertas_operacionais_financeiro"
      DROP CONSTRAINT IF EXISTS "fk_alertas_operacionais_financeiro_empresa"
    `);

    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_alertas_operacionais_financeiro_empresa_created_at"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_alertas_operacionais_financeiro_empresa_severidade"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_alertas_operacionais_financeiro_empresa_status"`);

    await queryRunner.query(`DROP TABLE IF EXISTS "alertas_operacionais_financeiro"`);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM pg_type WHERE typname = 'alertas_operacionais_financeiro_status_enum'
        ) THEN
          DROP TYPE "public"."alertas_operacionais_financeiro_status_enum";
        END IF;
      END$$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM pg_type WHERE typname = 'alertas_operacionais_financeiro_severidade_enum'
        ) THEN
          DROP TYPE "public"."alertas_operacionais_financeiro_severidade_enum";
        END IF;
      END$$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM pg_type WHERE typname = 'alertas_operacionais_financeiro_tipo_enum'
        ) THEN
          DROP TYPE "public"."alertas_operacionais_financeiro_tipo_enum";
        END IF;
      END$$;
    `);
  }
}
