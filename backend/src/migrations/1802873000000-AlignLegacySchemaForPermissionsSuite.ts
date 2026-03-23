import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlignLegacySchemaForPermissionsSuite1802873000000 implements MigrationInterface {
  name = 'AlignLegacySchemaForPermissionsSuite1802873000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    if (await queryRunner.hasTable('users')) {
      await queryRunner.query(`
        ALTER TABLE "users"
        ADD COLUMN IF NOT EXISTS "idioma_preferido" character varying(10) NOT NULL DEFAULT 'pt-BR'
      `);

      await queryRunner.query(`
        UPDATE "users"
        SET "idioma_preferido" = 'pt-BR'
        WHERE "idioma_preferido" IS NULL OR BTRIM("idioma_preferido") = ''
      `);
    }

    if (await queryRunner.hasTable('propostas')) {
      await queryRunner.query(`
        ALTER TABLE "propostas"
        ADD COLUMN IF NOT EXISTS "total" numeric(10,2) NOT NULL DEFAULT 0
      `);

      await queryRunner.query(`
        DO $$
        BEGIN
          IF EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name = 'propostas'
              AND column_name = 'valor'
          ) THEN
            UPDATE "propostas"
            SET "total" = COALESCE("total", "valor", 0)
            WHERE "total" IS NULL OR "total" = 0;
          ELSE
            UPDATE "propostas"
            SET "total" = COALESCE("total", 0)
            WHERE "total" IS NULL;
          END IF;
        END
        $$;
      `);
    }

    if (await queryRunner.hasTable('atendimento_tickets')) {
      await queryRunner.query(`
        ALTER TABLE "atendimento_tickets"
        ADD COLUMN IF NOT EXISTS "cliente_id" uuid
      `);
      await queryRunner.query(`
        ALTER TABLE "atendimento_tickets"
        ADD COLUMN IF NOT EXISTS "titulo" character varying(200)
      `);
      await queryRunner.query(`
        ALTER TABLE "atendimento_tickets"
        ADD COLUMN IF NOT EXISTS "descricao" text
      `);
      await queryRunner.query(`
        ALTER TABLE "atendimento_tickets"
        ADD COLUMN IF NOT EXISTS "tipo" character varying(50)
      `);
      await queryRunner.query(`
        ALTER TABLE "atendimento_tickets"
        ADD COLUMN IF NOT EXISTS "data_vencimento" timestamp without time zone
      `);
      await queryRunner.query(`
        ALTER TABLE "atendimento_tickets"
        ADD COLUMN IF NOT EXISTS "responsavel_id" uuid
      `);
      await queryRunner.query(`
        ALTER TABLE "atendimento_tickets"
        ADD COLUMN IF NOT EXISTS "autor_id" uuid
      `);

      await queryRunner.query(`
        CREATE INDEX IF NOT EXISTS "idx_tickets_cliente_id"
        ON "atendimento_tickets" ("cliente_id")
      `);
      await queryRunner.query(`
        CREATE INDEX IF NOT EXISTS "idx_tickets_tipo"
        ON "atendimento_tickets" ("tipo")
      `);
      await queryRunner.query(`
        CREATE INDEX IF NOT EXISTS "idx_tickets_responsavel_id"
        ON "atendimento_tickets" ("responsavel_id")
      `);
      await queryRunner.query(`
        CREATE INDEX IF NOT EXISTS "idx_tickets_autor_id"
        ON "atendimento_tickets" ("autor_id")
      `);
      await queryRunner.query(`
        CREATE INDEX IF NOT EXISTS "idx_tickets_data_vencimento"
        ON "atendimento_tickets" ("data_vencimento")
      `);

      await queryRunner.query(`
        DO $$
        BEGIN
          IF to_regclass('public.atendimento_tickets') IS NOT NULL
            AND to_regclass('public.users') IS NOT NULL
            AND NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_tickets_responsavel_user')
          THEN
            ALTER TABLE "atendimento_tickets"
              ADD CONSTRAINT "FK_tickets_responsavel_user"
              FOREIGN KEY ("responsavel_id") REFERENCES "users"("id")
              ON DELETE NO ACTION ON UPDATE NO ACTION;
          END IF;
        END
        $$;
      `);

      await queryRunner.query(`
        DO $$
        BEGIN
          IF to_regclass('public.atendimento_tickets') IS NOT NULL
            AND to_regclass('public.users') IS NOT NULL
            AND NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_tickets_autor_user')
          THEN
            ALTER TABLE "atendimento_tickets"
              ADD CONSTRAINT "FK_tickets_autor_user"
              FOREIGN KEY ("autor_id") REFERENCES "users"("id")
              ON DELETE NO ACTION ON UPDATE NO ACTION;
          END IF;
        END
        $$;
      `);
    }

    if (await queryRunner.hasTable('evento')) {
      await queryRunner.query(`
        ALTER TABLE "evento"
        ADD COLUMN IF NOT EXISTS "empresa_id" uuid
      `);

      const eventoEmpresaIdLegacyColumnRows: Array<{ column_name?: string }> = await queryRunner.query(
        `
          SELECT column_name
          FROM information_schema.columns
          WHERE table_schema = 'public'
            AND table_name = 'evento'
            AND column_name = 'empresaId'
          LIMIT 1
        `,
      );

      const hasEventoEmpresaIdLegacyColumn =
        Array.isArray(eventoEmpresaIdLegacyColumnRows) && eventoEmpresaIdLegacyColumnRows.length > 0;

      if (hasEventoEmpresaIdLegacyColumn) {
        await queryRunner.query(`
          UPDATE "evento"
          SET "empresa_id" = COALESCE("empresa_id", "empresaId")
          WHERE "empresa_id" IS NULL
        `);

        await queryRunner.query(`
          CREATE OR REPLACE FUNCTION sync_evento_empresa_columns()
          RETURNS trigger AS $$
          BEGIN
            NEW."empresa_id" := COALESCE(NEW."empresa_id", NEW."empresaId");
            NEW."empresaId" := COALESCE(NEW."empresaId", NEW."empresa_id");
            RETURN NEW;
          END;
          $$ LANGUAGE plpgsql;
        `);

        await queryRunner.query(`
          DROP TRIGGER IF EXISTS trg_sync_evento_empresa_columns ON "evento"
        `);

        await queryRunner.query(`
          CREATE TRIGGER trg_sync_evento_empresa_columns
          BEFORE INSERT OR UPDATE ON "evento"
          FOR EACH ROW
          EXECUTE FUNCTION sync_evento_empresa_columns()
        `);

        await queryRunner.query(`
          UPDATE "evento"
          SET "empresaId" = COALESCE("empresaId", "empresa_id")
          WHERE "empresaId" IS NULL
        `);
      } else {
        await queryRunner.query(`
          DROP TRIGGER IF EXISTS trg_sync_evento_empresa_columns ON "evento"
        `);
        await queryRunner.query(`
          DROP FUNCTION IF EXISTS sync_evento_empresa_columns()
        `);
      }

      await queryRunner.query(`
        CREATE INDEX IF NOT EXISTS "IDX_evento_empresa_id"
        ON "evento" ("empresa_id")
      `);

      await queryRunner.query(`
        DO $$
        BEGIN
          IF to_regclass('public.evento') IS NOT NULL
            AND to_regclass('public.empresas') IS NOT NULL
            AND NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_evento_empresa_tenant')
          THEN
            ALTER TABLE "evento"
              ADD CONSTRAINT "FK_evento_empresa_tenant"
              FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id")
              ON DELETE NO ACTION ON UPDATE NO ACTION;
          END IF;
        END
        $$;
      `);

      await queryRunner.query(`
        CREATE OR REPLACE FUNCTION set_current_tenant(tenant_id uuid)
        RETURNS void AS $$
        BEGIN
          PERFORM set_config('app.current_tenant_id', tenant_id::text, false);
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;
      `);

      await queryRunner.query(`
        CREATE OR REPLACE FUNCTION get_current_tenant()
        RETURNS uuid AS $$
        BEGIN
          RETURN current_setting('app.current_tenant_id', true)::uuid;
        END;
        $$ LANGUAGE plpgsql STABLE;
      `);

      await queryRunner.query(`ALTER TABLE "evento" ENABLE ROW LEVEL SECURITY`);

      await queryRunner.query(`
        DROP POLICY IF EXISTS tenant_isolation_evento ON "evento";
        CREATE POLICY tenant_isolation_evento ON "evento"
        FOR ALL
        USING ("empresa_id" = get_current_tenant())
        WITH CHECK ("empresa_id" = get_current_tenant());
      `);
    }
  }

  public async down(_queryRunner: QueryRunner): Promise<void> {
    // Safe no-op: corrective baseline migration.
  }
}
