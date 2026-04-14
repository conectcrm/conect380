import { MigrationInterface, QueryRunner } from 'typeorm';

export class EnsureSubscriptionCatalogTables1808500000000 implements MigrationInterface {
  name = 'EnsureSubscriptionCatalogTables1808500000000';
  public transaction = false;

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "modulos_sistema" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "nome" character varying(100) NOT NULL,
        "codigo" character varying(50) NOT NULL,
        "descricao" text,
        "icone" character varying(100),
        "cor" character varying(50),
        "ativo" boolean NOT NULL DEFAULT true,
        "essencial" boolean NOT NULL DEFAULT false,
        "ordem" integer NOT NULL DEFAULT 0,
        "criadoEm" timestamp without time zone NOT NULL DEFAULT now(),
        "atualizadoEm" timestamp without time zone NOT NULL DEFAULT now(),
        CONSTRAINT "PK_modulos_sistema_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'UQ_modulos_sistema_codigo'
        ) THEN
          ALTER TABLE "modulos_sistema"
            ADD CONSTRAINT "UQ_modulos_sistema_codigo" UNIQUE ("codigo");
        END IF;
      END
      $$;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "planos" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "nome" character varying(100) NOT NULL,
        "codigo" character varying(50) NOT NULL,
        "descricao" text,
        "preco" numeric(10,2) NOT NULL,
        "limiteUsuarios" integer NOT NULL DEFAULT 1,
        "limiteClientes" integer NOT NULL DEFAULT 1000,
        "limiteStorage" bigint NOT NULL DEFAULT 5368709120,
        "limiteApiCalls" integer NOT NULL DEFAULT 1000,
        "whiteLabel" boolean NOT NULL DEFAULT false,
        "suportePrioritario" boolean NOT NULL DEFAULT false,
        "ativo" boolean NOT NULL DEFAULT true,
        "ordem" integer NOT NULL DEFAULT 0,
        "criadoEm" timestamp without time zone NOT NULL DEFAULT now(),
        "atualizadoEm" timestamp without time zone NOT NULL DEFAULT now(),
        CONSTRAINT "PK_planos_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'UQ_planos_codigo'
        ) THEN
          ALTER TABLE "planos"
            ADD CONSTRAINT "UQ_planos_codigo" UNIQUE ("codigo");
        END IF;
      END
      $$;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "planos_modulos" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "criadoEm" timestamp without time zone NOT NULL DEFAULT now(),
        "plano_id" uuid,
        "modulo_id" uuid,
        CONSTRAINT "PK_planos_modulos_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF to_regclass('public.planos_modulos') IS NOT NULL
          AND to_regclass('public.planos') IS NOT NULL
          AND NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_planos_modulos_plano')
        THEN
          ALTER TABLE "planos_modulos"
            ADD CONSTRAINT "FK_planos_modulos_plano"
            FOREIGN KEY ("plano_id") REFERENCES "planos"("id")
            ON DELETE CASCADE ON UPDATE NO ACTION;
        END IF;
      END
      $$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF to_regclass('public.planos_modulos') IS NOT NULL
          AND to_regclass('public.modulos_sistema') IS NOT NULL
          AND NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_planos_modulos_modulo')
        THEN
          ALTER TABLE "planos_modulos"
            ADD CONSTRAINT "FK_planos_modulos_modulo"
            FOREIGN KEY ("modulo_id") REFERENCES "modulos_sistema"("id")
            ON DELETE CASCADE ON UPDATE NO ACTION;
        END IF;
      END
      $$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF to_regclass('public.assinaturas_empresas') IS NOT NULL THEN
          ALTER TABLE "assinaturas_empresas"
            ADD COLUMN IF NOT EXISTS "plano_id" uuid;
        END IF;
      END
      $$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF to_regclass('public.assinaturas_empresas') IS NOT NULL
          AND to_regclass('public.planos') IS NOT NULL
          AND NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_assinaturas_empresas_plano')
        THEN
          ALTER TABLE "assinaturas_empresas"
            ADD CONSTRAINT "FK_assinaturas_empresas_plano"
            FOREIGN KEY ("plano_id") REFERENCES "planos"("id")
            ON DELETE RESTRICT ON UPDATE NO ACTION;
        END IF;
      END
      $$;
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_modulos_sistema_ativo_ordem"
      ON "modulos_sistema" ("ativo", "ordem")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_planos_ativo_ordem"
      ON "planos" ("ativo", "ordem")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_planos_modulos_plano_id"
      ON "planos_modulos" ("plano_id")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_planos_modulos_modulo_id"
      ON "planos_modulos" ("modulo_id")
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "UQ_planos_modulos_plano_modulo"
      ON "planos_modulos" ("plano_id", "modulo_id")
      WHERE "plano_id" IS NOT NULL AND "modulo_id" IS NOT NULL
    `);
  }

  public async down(): Promise<void> {
    // no-op intencional para preservar dados de producao.
  }
}
