import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddContatoFieldsToOportunidades1809023000000 implements MigrationInterface {
  name = 'AddContatoFieldsToOportunidades1809023000000';
  transaction = false;

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        IF to_regclass('public.oportunidades') IS NULL THEN
          RETURN;
        END IF;

        IF NOT EXISTS (
          SELECT 1
          FROM information_schema.columns
          WHERE table_schema = 'public'
            AND table_name = 'oportunidades'
            AND column_name = 'nome_contato'
        ) THEN
          ALTER TABLE "oportunidades"
            ADD COLUMN "nome_contato" character varying(255);
        END IF;

        IF NOT EXISTS (
          SELECT 1
          FROM information_schema.columns
          WHERE table_schema = 'public'
            AND table_name = 'oportunidades'
            AND column_name = 'email_contato'
        ) THEN
          ALTER TABLE "oportunidades"
            ADD COLUMN "email_contato" character varying(255);
        END IF;

        IF NOT EXISTS (
          SELECT 1
          FROM information_schema.columns
          WHERE table_schema = 'public'
            AND table_name = 'oportunidades'
            AND column_name = 'telefone_contato'
        ) THEN
          ALTER TABLE "oportunidades"
            ADD COLUMN "telefone_contato" character varying(20);
        END IF;

        IF NOT EXISTS (
          SELECT 1
          FROM information_schema.columns
          WHERE table_schema = 'public'
            AND table_name = 'oportunidades'
            AND column_name = 'empresa_contato'
        ) THEN
          ALTER TABLE "oportunidades"
            ADD COLUMN "empresa_contato" character varying(255);
        END IF;
      END
      $$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF to_regclass('public.oportunidades') IS NULL OR to_regclass('public.clientes') IS NULL THEN
          RETURN;
        END IF;

        UPDATE "oportunidades" o
        SET
          "nome_contato" = COALESCE(NULLIF(BTRIM(o."nome_contato"), ''), NULLIF(BTRIM(c."nome"), '')),
          "email_contato" = COALESCE(NULLIF(BTRIM(o."email_contato"), ''), NULLIF(BTRIM(c."email"), '')),
          "telefone_contato" = COALESCE(NULLIF(BTRIM(o."telefone_contato"), ''), NULLIF(BTRIM(c."telefone"), '')),
          "empresa_contato" = COALESCE(NULLIF(BTRIM(o."empresa_contato"), ''), NULLIF(BTRIM(c."nome"), ''))
        FROM "clientes" c
        WHERE c."id" = o."cliente_id"
          AND c."empresa_id" = o."empresa_id"
          AND (
            NULLIF(BTRIM(o."nome_contato"), '') IS NULL
            OR NULLIF(BTRIM(o."email_contato"), '') IS NULL
            OR NULLIF(BTRIM(o."telefone_contato"), '') IS NULL
            OR NULLIF(BTRIM(o."empresa_contato"), '') IS NULL
          );
      END
      $$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF to_regclass('public.oportunidades') IS NULL OR to_regclass('public.leads') IS NULL THEN
          RETURN;
        END IF;

        WITH lead_mais_recente AS (
          SELECT DISTINCT ON (l."empresa_id", l."oportunidade_id")
            l."empresa_id",
            l."oportunidade_id",
            l."nome",
            l."email",
            l."telefone",
            l."empresa_nome"
          FROM "leads" l
          WHERE l."oportunidade_id" IS NOT NULL
          ORDER BY l."empresa_id", l."oportunidade_id", l."updated_at" DESC NULLS LAST
        )
        UPDATE "oportunidades" o
        SET
          "nome_contato" = COALESCE(NULLIF(BTRIM(o."nome_contato"), ''), NULLIF(BTRIM(l."nome"), '')),
          "email_contato" = COALESCE(NULLIF(BTRIM(o."email_contato"), ''), NULLIF(BTRIM(l."email"), '')),
          "telefone_contato" = COALESCE(NULLIF(BTRIM(o."telefone_contato"), ''), NULLIF(BTRIM(l."telefone"), '')),
          "empresa_contato" = COALESCE(
            NULLIF(BTRIM(o."empresa_contato"), ''),
            NULLIF(BTRIM(l."empresa_nome"), ''),
            NULLIF(BTRIM(l."nome"), '')
          )
        FROM lead_mais_recente l
        WHERE l."empresa_id" = o."empresa_id"
          AND l."oportunidade_id"::text = o."id"::text
          AND (
            NULLIF(BTRIM(o."nome_contato"), '') IS NULL
            OR NULLIF(BTRIM(o."email_contato"), '') IS NULL
            OR NULLIF(BTRIM(o."telefone_contato"), '') IS NULL
            OR NULLIF(BTRIM(o."empresa_contato"), '') IS NULL
          );
      END
      $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        IF to_regclass('public.oportunidades') IS NULL THEN
          RETURN;
        END IF;

        IF EXISTS (
          SELECT 1
          FROM information_schema.columns
          WHERE table_schema = 'public'
            AND table_name = 'oportunidades'
            AND column_name = 'empresa_contato'
        ) THEN
          ALTER TABLE "oportunidades" DROP COLUMN "empresa_contato";
        END IF;

        IF EXISTS (
          SELECT 1
          FROM information_schema.columns
          WHERE table_schema = 'public'
            AND table_name = 'oportunidades'
            AND column_name = 'telefone_contato'
        ) THEN
          ALTER TABLE "oportunidades" DROP COLUMN "telefone_contato";
        END IF;

        IF EXISTS (
          SELECT 1
          FROM information_schema.columns
          WHERE table_schema = 'public'
            AND table_name = 'oportunidades'
            AND column_name = 'email_contato'
        ) THEN
          ALTER TABLE "oportunidades" DROP COLUMN "email_contato";
        END IF;

        IF EXISTS (
          SELECT 1
          FROM information_schema.columns
          WHERE table_schema = 'public'
            AND table_name = 'oportunidades'
            AND column_name = 'nome_contato'
        ) THEN
          ALTER TABLE "oportunidades" DROP COLUMN "nome_contato";
        END IF;
      END
      $$;
    `);
  }
}

