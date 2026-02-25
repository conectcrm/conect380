import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateOportunidadeStageEvents1802800000000 implements MigrationInterface {
  name = 'CreateOportunidadeStageEvents1802800000000';

  private resolveOportunidadeIdSqlType(
    rows: Array<{ data_type?: string; udt_name?: string }>,
  ): 'uuid' | 'integer' | 'bigint' {
    const row = rows?.[0];
    const dataType = (row?.data_type || '').toLowerCase();
    const udtName = (row?.udt_name || '').toLowerCase();

    if (dataType === 'uuid' || udtName === 'uuid') {
      return 'uuid';
    }

    if (dataType === 'bigint' || udtName === 'int8') {
      return 'bigint';
    }

    if (dataType === 'integer' || udtName === 'int4') {
      return 'integer';
    }

    return 'uuid';
  }

  public async up(queryRunner: QueryRunner): Promise<void> {
    const oportunidadeIdTypeRows = await queryRunner.query(`
      SELECT data_type, udt_name
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'oportunidades'
        AND column_name = 'id'
      LIMIT 1
    `);
    const oportunidadeIdSqlType = this.resolveOportunidadeIdSqlType(oportunidadeIdTypeRows);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "oportunidade_stage_events" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "empresa_id" uuid NOT NULL,
        "oportunidade_id" ${oportunidadeIdSqlType} NOT NULL,
        "from_stage" character varying(80),
        "to_stage" character varying(80) NOT NULL,
        "changed_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "changed_by" uuid,
        "source" character varying(40) NOT NULL,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_oportunidade_stage_events_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'FK_oportunidade_stage_events_empresa'
        ) THEN
          ALTER TABLE "oportunidade_stage_events"
            ADD CONSTRAINT "FK_oportunidade_stage_events_empresa"
            FOREIGN KEY ("empresa_id")
            REFERENCES "empresas"("id")
            ON DELETE NO ACTION
            ON UPDATE NO ACTION;
        END IF;
      END
      $$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'FK_oportunidade_stage_events_oportunidade'
        ) THEN
          ALTER TABLE "oportunidade_stage_events"
            ADD CONSTRAINT "FK_oportunidade_stage_events_oportunidade"
            FOREIGN KEY ("oportunidade_id")
            REFERENCES "oportunidades"("id")
            ON DELETE CASCADE
            ON UPDATE NO ACTION;
        END IF;
      END
      $$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'FK_oportunidade_stage_events_changed_by'
        ) THEN
          ALTER TABLE "oportunidade_stage_events"
            ADD CONSTRAINT "FK_oportunidade_stage_events_changed_by"
            FOREIGN KEY ("changed_by")
            REFERENCES "users"("id")
            ON DELETE SET NULL
            ON UPDATE NO ACTION;
        END IF;
      END
      $$;
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_ose_empresa_changed_at"
      ON "oportunidade_stage_events" ("empresa_id", "changed_at")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_ose_empresa_oportunidade_changed_desc"
      ON "oportunidade_stage_events" ("empresa_id", "oportunidade_id", "changed_at" DESC)
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_ose_empresa_to_stage_changed"
      ON "oportunidade_stage_events" ("empresa_id", "to_stage", "changed_at")
    `);

    // Backfill inicial: 1 evento base por oportunidade para preservar histórico mínimo.
    await queryRunner.query(`
      DO $$
      DECLARE
        changed_at_expr text;
        changed_by_expr text;
      BEGIN
        changed_at_expr := CASE
          WHEN EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name = 'oportunidades'
              AND column_name = 'createdAt'
          ) THEN 'COALESCE(o."createdAt", now())'
          WHEN EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name = 'oportunidades'
              AND column_name = 'criado_em'
          ) THEN 'COALESCE(o."criado_em", now())'
          ELSE 'now()'
        END;

        changed_by_expr := CASE
          WHEN EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name = 'oportunidades'
              AND column_name = 'responsavel_id'
          ) THEN 'o."responsavel_id"'
          WHEN EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name = 'oportunidades'
              AND column_name = 'usuario_id'
          ) THEN 'o."usuario_id"'
          ELSE 'NULL::uuid'
        END;

        EXECUTE format(
          $sql$
            INSERT INTO "oportunidade_stage_events" (
              "empresa_id",
              "oportunidade_id",
              "from_stage",
              "to_stage",
              "changed_at",
              "changed_by",
              "source"
            )
            SELECT
              o."empresa_id",
              o."id",
              NULL,
              CASE lower(coalesce(o."estagio"::text, ''))
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
                ELSE lower(coalesce(o."estagio"::text, 'leads'))
              END,
              %1$s,
              %2$s,
              'backfill_snapshot'
            FROM "oportunidades" o
            WHERE o."empresa_id" IS NOT NULL
              AND NOT EXISTS (
                SELECT 1
                FROM "oportunidade_stage_events" e
                WHERE e."empresa_id" = o."empresa_id"
                  AND e."oportunidade_id" = o."id"
                  AND e."source" = 'backfill_snapshot'
              )
          $sql$,
          changed_at_expr,
          changed_by_expr
        );
      END
      $$;
    `);

    // Backfill de mudanças de estágio a partir de atividades legadas.
    await queryRunner.query(`
      DO $$
      DECLARE
        changed_at_expr text;
        changed_by_expr text;
      BEGIN
        changed_at_expr := CASE
          WHEN EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name = 'atividades'
              AND column_name = 'dataAtividade'
          ) THEN 'COALESCE(a."dataAtividade", now())'
          WHEN EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name = 'atividades'
              AND column_name = 'data'
          ) THEN 'COALESCE(a."data", now())'
          ELSE 'now()'
        END;

        changed_by_expr := CASE
          WHEN EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name = 'atividades'
              AND column_name = 'criado_por_id'
          ) THEN 'a."criado_por_id"'
          WHEN EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name = 'atividades'
              AND column_name = 'usuario_id'
          ) THEN 'a."usuario_id"'
          ELSE 'NULL::uuid'
        END;

        EXECUTE format(
          $sql$
            WITH raw_events AS (
              SELECT
                a."empresa_id",
                a."oportunidade_id",
                %1$s AS "changed_at",
                %2$s AS "changed_by",
                COALESCE(a."descricao", '') AS "descricao"
              FROM "atividades" a
              WHERE a."empresa_id" IS NOT NULL
                AND a."oportunidade_id" IS NOT NULL
                AND EXISTS (
                  SELECT 1
                  FROM "oportunidades" o
                  WHERE o."id" = a."oportunidade_id"
                    AND o."empresa_id" = a."empresa_id"
                )
                AND (
                  a."descricao" ILIKE 'Estagio alterado de %% para %%'
                  OR a."descricao" ILIKE 'Estágio alterado de %% para %%'
                  OR a."descricao" ILIKE 'Movido para estagio:%%'
                  OR a."descricao" ILIKE 'Movido para estágio:%%'
                )
            ),
            parsed AS (
              SELECT
                r."empresa_id",
                r."oportunidade_id",
                r."changed_at",
                r."changed_by",
                CASE
                  WHEN r."descricao" ~* 'est[aá]gio\\s+alterado\\s+de.*para'
                    THEN (regexp_match(r."descricao", '(?i)de\\s+\\"?([^\\"\\n\\r]+)\\"?\\s+para\\s+\\"?([^\\"\\n\\r]+)\\"?'))[1]
                  ELSE NULL
                END AS "from_stage_raw",
                CASE
                  WHEN r."descricao" ~* 'est[aá]gio\\s+alterado\\s+de.*para'
                    THEN (regexp_match(r."descricao", '(?i)de\\s+\\"?([^\\"\\n\\r]+)\\"?\\s+para\\s+\\"?([^\\"\\n\\r]+)\\"?'))[2]
                  WHEN r."descricao" ~* 'movido\\s+para\\s+est[aá]gio\\s*:'
                    THEN (regexp_match(r."descricao", '(?i)movido\\s+para\\s+est[aá]gio\\s*:\\s*\\"?([^\\"\\n\\r]+)\\"?'))[1]
                  ELSE NULL
                END AS "to_stage_raw"
              FROM raw_events r
            ),
            normalized AS (
              SELECT
                p."empresa_id",
                p."oportunidade_id",
                p."changed_at",
                p."changed_by",
                CASE lower(trim(coalesce(p."from_stage_raw", '')))
                  WHEN '' THEN NULL
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
                  ELSE lower(trim(p."from_stage_raw"))
                END AS "from_stage",
                CASE lower(trim(coalesce(p."to_stage_raw", '')))
                  WHEN '' THEN NULL
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
                  ELSE lower(trim(p."to_stage_raw"))
                END AS "to_stage"
              FROM parsed p
            )
            INSERT INTO "oportunidade_stage_events" (
              "empresa_id",
              "oportunidade_id",
              "from_stage",
              "to_stage",
              "changed_at",
              "changed_by",
              "source"
            )
            SELECT
              n."empresa_id",
              n."oportunidade_id",
              n."from_stage",
              n."to_stage",
              n."changed_at",
              n."changed_by",
              'backfill_activity'
            FROM normalized n
            WHERE n."to_stage" IS NOT NULL
              AND NOT EXISTS (
                SELECT 1
                FROM "oportunidade_stage_events" e
                WHERE e."empresa_id" = n."empresa_id"
                  AND e."oportunidade_id" = n."oportunidade_id"
                  AND e."changed_at" = n."changed_at"
                  AND e."to_stage" = n."to_stage"
                  AND e."source" = 'backfill_activity'
              )
          $sql$,
          changed_at_expr,
          changed_by_expr
        );
      END
      $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "oportunidade_stage_events" CASCADE`);
  }
}
