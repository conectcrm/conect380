import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateComissoesTables1809030000000 implements MigrationInterface {
  name = 'CreateComissoesTables1809030000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const propostasExists = await queryRunner.hasTable('propostas');
    if (propostasExists) {
      await queryRunner.query(`
        ALTER TABLE "propostas"
        ADD COLUMN IF NOT EXISTS "comissao_config" jsonb
      `);
    }

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "comissoes_lancamentos" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "empresa_id" uuid NOT NULL,
        "proposta_id" uuid,
        "fatura_id" integer NOT NULL,
        "pagamento_id" integer NOT NULL,
        "origem" character varying NOT NULL DEFAULT 'pagamento.aprovado',
        "competencia_ano" integer NOT NULL,
        "competencia_mes" integer NOT NULL,
        "data_evento" TIMESTAMP NOT NULL DEFAULT now(),
        "valor_base_liquido" numeric(15,2) NOT NULL DEFAULT 0,
        "valor_comissao_total" numeric(15,2) NOT NULL DEFAULT 0,
        "status" character varying NOT NULL DEFAULT 'pendente',
        "metadata" jsonb,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_comissoes_lancamentos_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_comissoes_lancamentos_empresa_pagamento" UNIQUE ("empresa_id", "pagamento_id")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_comissoes_lancamentos_empresa_competencia"
      ON "comissoes_lancamentos" ("empresa_id", "competencia_ano", "competencia_mes")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_comissoes_lancamentos_empresa_status"
      ON "comissoes_lancamentos" ("empresa_id", "status", "data_evento")
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "comissoes_lancamento_participantes" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "empresa_id" uuid NOT NULL,
        "lancamento_id" uuid NOT NULL,
        "usuario_id" uuid NOT NULL,
        "papel" character varying,
        "percentual" numeric(7,4) NOT NULL DEFAULT 0,
        "valor_comissao" numeric(15,2) NOT NULL DEFAULT 0,
        "metadata" jsonb,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_comissoes_lancamento_participantes_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_comissoes_participantes_empresa_usuario"
      ON "comissoes_lancamento_participantes" ("empresa_id", "usuario_id", "created_at")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_comissoes_participantes_empresa_lancamento"
      ON "comissoes_lancamento_participantes" ("empresa_id", "lancamento_id")
    `);

    // Optional FKs: keep migration resilient if legacy schemas differ.
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'FK_comissoes_lancamentos_fatura'
        ) THEN
          ALTER TABLE "comissoes_lancamentos"
          ADD CONSTRAINT "FK_comissoes_lancamentos_fatura"
          FOREIGN KEY ("fatura_id") REFERENCES "faturas"("id") ON DELETE RESTRICT;
        END IF;
      EXCEPTION WHEN undefined_table THEN
        -- faturas table not present in this environment
        NULL;
      END $$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'FK_comissoes_lancamentos_pagamento'
        ) THEN
          ALTER TABLE "comissoes_lancamentos"
          ADD CONSTRAINT "FK_comissoes_lancamentos_pagamento"
          FOREIGN KEY ("pagamento_id") REFERENCES "pagamentos"("id") ON DELETE RESTRICT;
        END IF;
      EXCEPTION WHEN undefined_table THEN
        -- pagamentos table not present in this environment
        NULL;
      END $$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'FK_comissoes_participantes_lancamento'
        ) THEN
          ALTER TABLE "comissoes_lancamento_participantes"
          ADD CONSTRAINT "FK_comissoes_participantes_lancamento"
          FOREIGN KEY ("lancamento_id") REFERENCES "comissoes_lancamentos"("id") ON DELETE CASCADE;
        END IF;
      END $$;
    `);

    // Multi-tenant hardening: enable RLS when tenant functions exist.
    const hasTenantFn = await queryRunner.query(`
      SELECT EXISTS(SELECT 1 FROM pg_proc WHERE proname = 'get_current_tenant') AS "exists";
    `);
    const canEnableRls = Boolean(hasTenantFn?.[0]?.exists);

    if (canEnableRls) {
      await queryRunner.query(`ALTER TABLE "comissoes_lancamentos" ENABLE ROW LEVEL SECURITY;`);
      await queryRunner.query(
        `DROP POLICY IF EXISTS tenant_isolation_comissoes_lancamentos ON "comissoes_lancamentos";`,
      );
      await queryRunner.query(`
        CREATE POLICY tenant_isolation_comissoes_lancamentos ON "comissoes_lancamentos"
        USING ("empresa_id" = get_current_tenant());
      `);

      await queryRunner.query(
        `ALTER TABLE "comissoes_lancamento_participantes" ENABLE ROW LEVEL SECURITY;`,
      );
      await queryRunner.query(
        `DROP POLICY IF EXISTS tenant_isolation_comissoes_lancamento_participantes ON "comissoes_lancamento_participantes";`,
      );
      await queryRunner.query(`
        CREATE POLICY tenant_isolation_comissoes_lancamento_participantes ON "comissoes_lancamento_participantes"
        USING ("empresa_id" = get_current_tenant());
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const hasTenantFn = await queryRunner.query(`
      SELECT EXISTS(SELECT 1 FROM pg_proc WHERE proname = 'get_current_tenant') AS "exists";
    `);
    const canEnableRls = Boolean(hasTenantFn?.[0]?.exists);

    if (canEnableRls) {
      await queryRunner.query(
        `DROP POLICY IF EXISTS tenant_isolation_comissoes_lancamento_participantes ON "comissoes_lancamento_participantes";`,
      );
      await queryRunner.query(
        `DROP POLICY IF EXISTS tenant_isolation_comissoes_lancamentos ON "comissoes_lancamentos";`,
      );
    }

    await queryRunner.query(`DROP TABLE IF EXISTS "comissoes_lancamento_participantes"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "comissoes_lancamentos"`);

    const propostasExists = await queryRunner.hasTable('propostas');
    if (propostasExists) {
      await queryRunner.query(`
        ALTER TABLE "propostas"
        DROP COLUMN IF EXISTS "comissao_config"
      `);
    }
  }
}

