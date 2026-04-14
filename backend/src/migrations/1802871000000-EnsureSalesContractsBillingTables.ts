import { MigrationInterface, QueryRunner } from 'typeorm';

export class EnsureSalesContractsBillingTables1802871000000 implements MigrationInterface {
  name = 'EnsureSalesContractsBillingTables1802871000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
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

    if (!(await queryRunner.hasTable('contratos'))) {
      await queryRunner.query(`
        CREATE TABLE "contratos" (
          "id" SERIAL PRIMARY KEY,
          "numero" character varying(50) NOT NULL,
          "propostaId" uuid NULL,
          "clienteId" uuid NOT NULL,
          "empresa_id" uuid NOT NULL,
          "usuarioResponsavelId" uuid NOT NULL,
          "tipo" character varying(30) NOT NULL DEFAULT 'servico',
          "status" character varying(40) NOT NULL DEFAULT 'aguardando_assinatura',
          "objeto" text NOT NULL,
          "valorTotal" numeric(10,2) NOT NULL,
          "dataInicio" date NOT NULL,
          "dataFim" date NOT NULL,
          "dataAssinatura" date NULL,
          "dataVencimento" date NOT NULL,
          "observacoes" text NULL,
          "clausulasEspeciais" text NULL,
          "condicoesPagamento" jsonb NULL,
          "caminhoArquivoPDF" text NULL,
          "hashDocumento" text NULL,
          "ativo" boolean NOT NULL DEFAULT true,
          "createdAt" timestamp without time zone NOT NULL DEFAULT now(),
          "updatedAt" timestamp without time zone NOT NULL DEFAULT now()
        )
      `);
    }

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "UQ_contratos_numero"
      ON "contratos" ("numero")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_contratos_empresa_id"
      ON "contratos" ("empresa_id")
    `);

    if (!(await queryRunner.hasTable('assinaturas_contrato'))) {
      await queryRunner.query(`
        CREATE TABLE "assinaturas_contrato" (
          "id" SERIAL PRIMARY KEY,
          "contratoId" integer NOT NULL,
          "usuarioId" uuid NOT NULL,
          "tipo" character varying(20) NOT NULL DEFAULT 'digital',
          "status" character varying(20) NOT NULL DEFAULT 'pendente',
          "certificadoDigital" text NULL,
          "hashAssinatura" text NULL,
          "ipAssinatura" text NULL,
          "userAgent" text NULL,
          "dataAssinatura" timestamp without time zone NULL,
          "motivoRejeicao" text NULL,
          "metadados" jsonb NULL,
          "tokenValidacao" text NULL,
          "dataEnvio" timestamp without time zone NULL,
          "dataExpiracao" timestamp without time zone NULL,
          "createdAt" timestamp without time zone NOT NULL DEFAULT now()
        )
      `);
    }

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_assinaturas_contrato_contratoId"
      ON "assinaturas_contrato" ("contratoId")
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "UQ_assinaturas_contrato_tokenValidacao"
      ON "assinaturas_contrato" ("tokenValidacao")
      WHERE "tokenValidacao" IS NOT NULL
    `);

    if (!(await queryRunner.hasTable('faturas'))) {
      await queryRunner.query(`
        CREATE TABLE "faturas" (
          "id" SERIAL PRIMARY KEY,
          "empresa_id" uuid NOT NULL,
          "numero" character varying(50) NOT NULL,
          "contratoId" integer NULL,
          "clienteId" uuid NOT NULL,
          "usuarioResponsavelId" uuid NOT NULL,
          "tipo" character varying(30) NOT NULL DEFAULT 'unica',
          "status" character varying(30) NOT NULL DEFAULT 'pendente',
          "formaPagamentoPreferida" character varying(30) NULL,
          "descricao" text NOT NULL,
          "valorTotal" numeric(10,2) NOT NULL,
          "valorPago" numeric(10,2) NOT NULL DEFAULT 0,
          "valorDesconto" numeric(10,2) NOT NULL DEFAULT 0,
          "valorJuros" numeric(10,2) NOT NULL DEFAULT 0,
          "valorMulta" numeric(10,2) NOT NULL DEFAULT 0,
          "dataEmissao" date NOT NULL,
          "dataVencimento" date NOT NULL,
          "dataPagamento" date NULL,
          "observacoes" text NULL,
          "linkPagamento" text NULL,
          "qrCodePix" text NULL,
          "codigoBoleto" text NULL,
          "metadados" jsonb NULL,
          "ativo" boolean NOT NULL DEFAULT true,
          "createdAt" timestamp without time zone NOT NULL DEFAULT now(),
          "updatedAt" timestamp without time zone NOT NULL DEFAULT now()
        )
      `);
    }

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "UQ_faturas_numero"
      ON "faturas" ("numero")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_faturas_empresa_id"
      ON "faturas" ("empresa_id")
    `);

    if (!(await queryRunner.hasTable('itens_fatura'))) {
      await queryRunner.query(`
        CREATE TABLE "itens_fatura" (
          "id" SERIAL PRIMARY KEY,
          "faturaId" integer NOT NULL,
          "descricao" text NOT NULL,
          "quantidade" numeric(10,4) NOT NULL,
          "valorUnitario" numeric(10,2) NOT NULL,
          "valorTotal" numeric(10,2) NOT NULL,
          "unidade" text NULL,
          "codigoProduto" text NULL,
          "percentualDesconto" numeric(5,2) NOT NULL DEFAULT 0,
          "valorDesconto" numeric(10,2) NOT NULL DEFAULT 0
        )
      `);
    }

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_itens_fatura_faturaId"
      ON "itens_fatura" ("faturaId")
    `);

    if (!(await queryRunner.hasTable('pagamentos'))) {
      await queryRunner.query(`
        CREATE TABLE "pagamentos" (
          "id" SERIAL PRIMARY KEY,
          "empresa_id" uuid NOT NULL,
          "faturaId" integer NOT NULL,
          "transacaoId" character varying(100) NOT NULL,
          "tipo" character varying(20) NOT NULL DEFAULT 'pagamento',
          "status" character varying(20) NOT NULL DEFAULT 'pendente',
          "valor" numeric(10,2) NOT NULL,
          "taxa" numeric(10,2) NOT NULL DEFAULT 0,
          "valorLiquido" numeric(10,2) NOT NULL,
          "metodoPagamento" text NOT NULL,
          "gateway" text NULL,
          "gatewayTransacaoId" text NULL,
          "gatewayStatusRaw" text NULL,
          "dadosCompletos" jsonb NULL,
          "dataProcessamento" timestamp without time zone NULL,
          "dataAprovacao" timestamp without time zone NULL,
          "motivoRejeicao" text NULL,
          "observacoes" text NULL,
          "createdAt" timestamp without time zone NOT NULL DEFAULT now()
        )
      `);
    }

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "UQ_pagamentos_transacaoId"
      ON "pagamentos" ("transacaoId")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_pagamentos_empresa_id"
      ON "pagamentos" ("empresa_id")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_pagamentos_faturaId"
      ON "pagamentos" ("faturaId")
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF to_regclass('public.contratos') IS NOT NULL
          AND to_regclass('public.propostas') IS NOT NULL
          AND NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_contratos_proposta')
        THEN
          ALTER TABLE "contratos"
            ADD CONSTRAINT "FK_contratos_proposta"
            FOREIGN KEY ("propostaId") REFERENCES "propostas"("id")
            ON DELETE SET NULL ON UPDATE NO ACTION;
        END IF;
      END
      $$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF to_regclass('public.contratos') IS NOT NULL
          AND to_regclass('public.clientes') IS NOT NULL
          AND NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_contratos_cliente')
        THEN
          ALTER TABLE "contratos"
            ADD CONSTRAINT "FK_contratos_cliente"
            FOREIGN KEY ("clienteId") REFERENCES "clientes"("id")
            ON DELETE NO ACTION ON UPDATE NO ACTION;
        END IF;
      END
      $$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF to_regclass('public.contratos') IS NOT NULL
          AND to_regclass('public.empresas') IS NOT NULL
          AND NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_contratos_empresa')
        THEN
          ALTER TABLE "contratos"
            ADD CONSTRAINT "FK_contratos_empresa"
            FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id")
            ON DELETE NO ACTION ON UPDATE NO ACTION;
        END IF;
      END
      $$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF to_regclass('public.contratos') IS NOT NULL
          AND to_regclass('public.users') IS NOT NULL
          AND NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_contratos_usuario_responsavel')
        THEN
          ALTER TABLE "contratos"
            ADD CONSTRAINT "FK_contratos_usuario_responsavel"
            FOREIGN KEY ("usuarioResponsavelId") REFERENCES "users"("id")
            ON DELETE NO ACTION ON UPDATE NO ACTION;
        END IF;
      END
      $$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF to_regclass('public.assinaturas_contrato') IS NOT NULL
          AND to_regclass('public.contratos') IS NOT NULL
          AND NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_assinaturas_contrato_contrato')
        THEN
          ALTER TABLE "assinaturas_contrato"
            ADD CONSTRAINT "FK_assinaturas_contrato_contrato"
            FOREIGN KEY ("contratoId") REFERENCES "contratos"("id")
            ON DELETE CASCADE ON UPDATE NO ACTION;
        END IF;
      END
      $$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF to_regclass('public.assinaturas_contrato') IS NOT NULL
          AND to_regclass('public.users') IS NOT NULL
          AND NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_assinaturas_contrato_usuario')
        THEN
          ALTER TABLE "assinaturas_contrato"
            ADD CONSTRAINT "FK_assinaturas_contrato_usuario"
            FOREIGN KEY ("usuarioId") REFERENCES "users"("id")
            ON DELETE NO ACTION ON UPDATE NO ACTION;
        END IF;
      END
      $$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF to_regclass('public.faturas') IS NOT NULL
          AND to_regclass('public.empresas') IS NOT NULL
          AND NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_faturas_empresa')
        THEN
          ALTER TABLE "faturas"
            ADD CONSTRAINT "FK_faturas_empresa"
            FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id")
            ON DELETE NO ACTION ON UPDATE NO ACTION;
        END IF;
      END
      $$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF to_regclass('public.faturas') IS NOT NULL
          AND to_regclass('public.contratos') IS NOT NULL
          AND NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_faturas_contrato')
        THEN
          ALTER TABLE "faturas"
            ADD CONSTRAINT "FK_faturas_contrato"
            FOREIGN KEY ("contratoId") REFERENCES "contratos"("id")
            ON DELETE SET NULL ON UPDATE NO ACTION;
        END IF;
      END
      $$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF to_regclass('public.faturas') IS NOT NULL
          AND to_regclass('public.clientes') IS NOT NULL
          AND NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_faturas_cliente')
        THEN
          ALTER TABLE "faturas"
            ADD CONSTRAINT "FK_faturas_cliente"
            FOREIGN KEY ("clienteId") REFERENCES "clientes"("id")
            ON DELETE NO ACTION ON UPDATE NO ACTION;
        END IF;
      END
      $$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF to_regclass('public.faturas') IS NOT NULL
          AND to_regclass('public.users') IS NOT NULL
          AND NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_faturas_usuario_responsavel')
        THEN
          ALTER TABLE "faturas"
            ADD CONSTRAINT "FK_faturas_usuario_responsavel"
            FOREIGN KEY ("usuarioResponsavelId") REFERENCES "users"("id")
            ON DELETE NO ACTION ON UPDATE NO ACTION;
        END IF;
      END
      $$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF to_regclass('public.itens_fatura') IS NOT NULL
          AND to_regclass('public.faturas') IS NOT NULL
          AND NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_itens_fatura_fatura')
        THEN
          ALTER TABLE "itens_fatura"
            ADD CONSTRAINT "FK_itens_fatura_fatura"
            FOREIGN KEY ("faturaId") REFERENCES "faturas"("id")
            ON DELETE CASCADE ON UPDATE NO ACTION;
        END IF;
      END
      $$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF to_regclass('public.pagamentos') IS NOT NULL
          AND to_regclass('public.faturas') IS NOT NULL
          AND NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_pagamentos_fatura')
        THEN
          ALTER TABLE "pagamentos"
            ADD CONSTRAINT "FK_pagamentos_fatura"
            FOREIGN KEY ("faturaId") REFERENCES "faturas"("id")
            ON DELETE NO ACTION ON UPDATE NO ACTION;
        END IF;
      END
      $$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF to_regclass('public.pagamentos') IS NOT NULL
          AND to_regclass('public.empresas') IS NOT NULL
          AND NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_pagamentos_empresa')
        THEN
          ALTER TABLE "pagamentos"
            ADD CONSTRAINT "FK_pagamentos_empresa"
            FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id")
            ON DELETE NO ACTION ON UPDATE NO ACTION;
        END IF;
      END
      $$;
    `);

    await queryRunner.query(`ALTER TABLE IF EXISTS "contratos" ENABLE ROW LEVEL SECURITY`);
    await queryRunner.query(`ALTER TABLE IF EXISTS "faturas" ENABLE ROW LEVEL SECURITY`);
    await queryRunner.query(`ALTER TABLE IF EXISTS "pagamentos" ENABLE ROW LEVEL SECURITY`);

    await queryRunner.query(`
      DROP POLICY IF EXISTS tenant_isolation_contratos ON "contratos";
      CREATE POLICY tenant_isolation_contratos ON "contratos"
      FOR ALL
      USING ("empresa_id" = get_current_tenant())
      WITH CHECK ("empresa_id" = get_current_tenant());
    `);

    await queryRunner.query(`
      DROP POLICY IF EXISTS tenant_isolation_faturas ON "faturas";
      CREATE POLICY tenant_isolation_faturas ON "faturas"
      FOR ALL
      USING ("empresa_id" = get_current_tenant())
      WITH CHECK ("empresa_id" = get_current_tenant());
    `);

    await queryRunner.query(`
      DROP POLICY IF EXISTS tenant_isolation_pagamentos ON "pagamentos";
      CREATE POLICY tenant_isolation_pagamentos ON "pagamentos"
      FOR ALL
      USING ("empresa_id" = get_current_tenant())
      WITH CHECK ("empresa_id" = get_current_tenant());
    `);
  }

  public async down(_queryRunner: QueryRunner): Promise<void> {
    // Safe no-op: corrective baseline migration.
  }
}
