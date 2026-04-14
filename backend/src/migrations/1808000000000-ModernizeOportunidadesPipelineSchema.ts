import { MigrationInterface, QueryRunner } from 'typeorm';

export class ModernizeOportunidadesPipelineSchema1808000000000 implements MigrationInterface {
  name = 'ModernizeOportunidadesPipelineSchema1808000000000';
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
            AND column_name = 'responsavel_id'
        ) THEN
          ALTER TABLE "oportunidades" ADD COLUMN "responsavel_id" uuid;
        END IF;
      END
      $$;
    `);

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
            AND column_name = 'usuario_id'
        ) AND EXISTS (
          SELECT 1
          FROM information_schema.columns
          WHERE table_schema = 'public'
            AND table_name = 'oportunidades'
            AND column_name = 'responsavel_id'
        ) THEN
          UPDATE "oportunidades"
             SET "responsavel_id" = "usuario_id"
           WHERE "responsavel_id" IS NULL
             AND "usuario_id" IS NOT NULL;
        END IF;
      END
      $$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF to_regclass('public.oportunidades') IS NULL OR to_regclass('public.users') IS NULL THEN
          RETURN;
        END IF;

        IF EXISTS (
          SELECT 1
          FROM information_schema.columns
          WHERE table_schema = 'public'
            AND table_name = 'oportunidades'
            AND column_name = 'responsavel_id'
        ) THEN
          UPDATE "oportunidades" o
             SET "responsavel_id" = (
               SELECT u."id"
               FROM "users" u
               WHERE u."empresa_id" = o."empresa_id"
               ORDER BY u."id"
               LIMIT 1
             )
           WHERE o."responsavel_id" IS NULL
             AND EXISTS (
               SELECT 1
               FROM "users" u_check
               WHERE u_check."empresa_id" = o."empresa_id"
             );
        END IF;
      END
      $$;
    `);

    await queryRunner.query(`
      DO $$
      DECLARE
        estagio_udt text;
        stage_value text;
      BEGIN
        IF to_regclass('public.oportunidades') IS NULL THEN
          RETURN;
        END IF;

        SELECT c.udt_name
          INTO estagio_udt
          FROM information_schema.columns c
         WHERE c.table_schema = 'public'
           AND c.table_name = 'oportunidades'
           AND c.column_name = 'estagio'
         LIMIT 1;

        IF estagio_udt IS NULL THEN
          RETURN;
        END IF;

        IF NOT EXISTS (
          SELECT 1
          FROM pg_type t
          INNER JOIN pg_namespace n ON n.oid = t.typnamespace
          WHERE n.nspname = 'public'
            AND t.typname = estagio_udt
        ) THEN
          RETURN;
        END IF;

        FOREACH stage_value IN ARRAY ARRAY['leads', 'qualification', 'proposal', 'negotiation', 'closing', 'won', 'lost']
        LOOP
          IF NOT EXISTS (
            SELECT 1
            FROM pg_type t
            INNER JOIN pg_namespace n ON n.oid = t.typnamespace
            INNER JOIN pg_enum e ON e.enumtypid = t.oid
            WHERE n.nspname = 'public'
              AND t.typname = estagio_udt
              AND e.enumlabel = stage_value
          ) THEN
            EXECUTE format('ALTER TYPE %I.%I ADD VALUE %L', 'public', estagio_udt, stage_value);
          END IF;
        END LOOP;
      END
      $$;
    `);

    await queryRunner.query(`
      DO $$
      DECLARE
        estagio_data_type text;
        estagio_udt text;
      BEGIN
        IF to_regclass('public.oportunidades') IS NULL THEN
          RETURN;
        END IF;

        SELECT c.data_type, c.udt_name
          INTO estagio_data_type, estagio_udt
          FROM information_schema.columns c
         WHERE c.table_schema = 'public'
           AND c.table_name = 'oportunidades'
           AND c.column_name = 'estagio'
         LIMIT 1;

        IF estagio_data_type IS NULL THEN
          RETURN;
        END IF;

        IF lower(estagio_data_type) = 'user-defined' AND estagio_udt IS NOT NULL THEN
          EXECUTE format(
            $sql$
              UPDATE "oportunidades"
                 SET "estagio" = (
                   CASE lower(coalesce("estagio"::text, ''))
                     WHEN 'lead' THEN 'leads'
                     WHEN 'leads' THEN 'leads'
                     WHEN 'qualificado' THEN 'qualification'
                     WHEN 'qualificacao' THEN 'qualification'
                     WHEN 'qualification' THEN 'qualification'
                     WHEN 'proposta' THEN 'proposal'
                     WHEN 'proposal' THEN 'proposal'
                     WHEN 'negociacao' THEN 'negotiation'
                     WHEN 'negotiation' THEN 'negotiation'
                     WHEN 'fechamento' THEN 'closing'
                     WHEN 'closing' THEN 'closing'
                     WHEN 'ganho' THEN 'won'
                     WHEN 'won' THEN 'won'
                     WHEN 'perdido' THEN 'lost'
                     WHEN 'lost' THEN 'lost'
                     ELSE 'leads'
                   END
                 )::%I.%I
               WHERE lower(coalesce("estagio"::text, '')) IN (
                 'lead', 'leads', 'qualificado', 'qualificacao', 'qualification',
                 'proposta', 'proposal', 'negociacao', 'negotiation',
                 'fechamento', 'closing', 'ganho', 'won', 'perdido', 'lost'
               )
            $sql$,
            'public',
            estagio_udt
          );
        ELSE
          UPDATE "oportunidades"
             SET "estagio" = CASE lower(coalesce("estagio"::text, ''))
               WHEN 'lead' THEN 'leads'
               WHEN 'leads' THEN 'leads'
               WHEN 'qualificado' THEN 'qualification'
               WHEN 'qualificacao' THEN 'qualification'
               WHEN 'qualification' THEN 'qualification'
               WHEN 'proposta' THEN 'proposal'
               WHEN 'proposal' THEN 'proposal'
               WHEN 'negociacao' THEN 'negotiation'
               WHEN 'negotiation' THEN 'negotiation'
               WHEN 'fechamento' THEN 'closing'
               WHEN 'closing' THEN 'closing'
               WHEN 'ganho' THEN 'won'
               WHEN 'won' THEN 'won'
               WHEN 'perdido' THEN 'lost'
               WHEN 'lost' THEN 'lost'
               ELSE 'leads'
             END
           WHERE lower(coalesce("estagio"::text, '')) IN (
             'lead', 'leads', 'qualificado', 'qualificacao', 'qualification',
             'proposta', 'proposal', 'negociacao', 'negotiation',
             'fechamento', 'closing', 'ganho', 'won', 'perdido', 'lost'
           );
        END IF;
      END
      $$;
    `);

    await queryRunner.query(`
      DO $$
      DECLARE
        missing_count bigint;
      BEGIN
        IF to_regclass('public.oportunidades') IS NULL THEN
          RETURN;
        END IF;

        IF EXISTS (
          SELECT 1
          FROM information_schema.columns
          WHERE table_schema = 'public'
            AND table_name = 'oportunidades'
            AND column_name = 'responsavel_id'
        ) THEN
          IF NOT EXISTS (
            SELECT 1
            FROM pg_constraint
            WHERE conname = 'FK_oportunidades_responsavel'
          ) THEN
            ALTER TABLE "oportunidades"
              ADD CONSTRAINT "FK_oportunidades_responsavel"
              FOREIGN KEY ("responsavel_id")
              REFERENCES "users"("id")
              ON DELETE RESTRICT
              ON UPDATE CASCADE;
          END IF;

          CREATE INDEX IF NOT EXISTS "IDX_oportunidades_responsavel_id"
            ON "oportunidades" ("responsavel_id");

          SELECT COUNT(*) INTO missing_count
          FROM "oportunidades"
          WHERE "responsavel_id" IS NULL;

          IF missing_count = 0 THEN
            ALTER TABLE "oportunidades"
              ALTER COLUMN "responsavel_id" SET NOT NULL;
          END IF;
        END IF;
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
          FROM pg_constraint
          WHERE conname = 'FK_oportunidades_responsavel'
        ) THEN
          ALTER TABLE "oportunidades"
            DROP CONSTRAINT "FK_oportunidades_responsavel";
        END IF;

        DROP INDEX IF EXISTS "IDX_oportunidades_responsavel_id";
      END
      $$;
    `);
  }
}
