import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateWebhooksGatewayEventos1802885000000 implements MigrationInterface {
  name = 'CreateWebhooksGatewayEventos1802885000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_type WHERE typname = 'webhooks_gateway_eventos_gateway_enum'
        ) THEN
          CREATE TYPE "public"."webhooks_gateway_eventos_gateway_enum" AS ENUM('mercado_pago', 'stripe', 'pagseguro');
        END IF;
      END$$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_type WHERE typname = 'webhooks_gateway_eventos_status_enum'
        ) THEN
          CREATE TYPE "public"."webhooks_gateway_eventos_status_enum" AS ENUM('recebido', 'processando', 'processado', 'falha');
        END IF;
      END$$;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "webhooks_gateway_eventos" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "empresa_id" uuid NOT NULL,
        "gateway" "public"."webhooks_gateway_eventos_gateway_enum" NOT NULL,
        "idempotency_key" character varying(180) NOT NULL,
        "event_id" character varying(180),
        "request_id" character varying(180),
        "referencia_gateway" character varying(180),
        "status" "public"."webhooks_gateway_eventos_status_enum" NOT NULL DEFAULT 'recebido',
        "tentativas" integer NOT NULL DEFAULT 0,
        "payload_raw" jsonb NOT NULL DEFAULT '{}'::jsonb,
        "erro" text,
        "processado_em" TIMESTAMP NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_webhooks_gateway_eventos_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "UQ_webhooks_gateway_eventos_empresa_gateway_idempotency"
      ON "webhooks_gateway_eventos" ("empresa_id", "gateway", "idempotency_key")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_webhooks_gateway_eventos_empresa_created_at"
      ON "webhooks_gateway_eventos" ("empresa_id", "created_at")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_webhooks_gateway_eventos_empresa_gateway_status"
      ON "webhooks_gateway_eventos" ("empresa_id", "gateway", "status")
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM information_schema.table_constraints
          WHERE constraint_name = 'fk_webhooks_gateway_eventos_empresa'
            AND table_name = 'webhooks_gateway_eventos'
        ) THEN
          ALTER TABLE "webhooks_gateway_eventos"
            ADD CONSTRAINT "fk_webhooks_gateway_eventos_empresa"
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
      ALTER TABLE "webhooks_gateway_eventos"
      DROP CONSTRAINT IF EXISTS "fk_webhooks_gateway_eventos_empresa"
    `);

    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_webhooks_gateway_eventos_empresa_gateway_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_webhooks_gateway_eventos_empresa_created_at"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "UQ_webhooks_gateway_eventos_empresa_gateway_idempotency"`);

    await queryRunner.query(`DROP TABLE IF EXISTS "webhooks_gateway_eventos"`);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM pg_type WHERE typname = 'webhooks_gateway_eventos_status_enum'
        ) THEN
          DROP TYPE "public"."webhooks_gateway_eventos_status_enum";
        END IF;
      END$$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM pg_type WHERE typname = 'webhooks_gateway_eventos_gateway_enum'
        ) THEN
          DROP TYPE "public"."webhooks_gateway_eventos_gateway_enum";
        END IF;
      END$$;
    `);
  }
}
