import { MigrationInterface, QueryRunner } from "typeorm";

export class AlterEmpresaAddAdminFields1763734040746 implements MigrationInterface {
  name = 'AlterEmpresaAddAdminFields1763734040746'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "faturas" DROP CONSTRAINT IF EXISTS "FK_644bf709a39af5c760b98e56a06"`);
    await queryRunner.query(`
            DO $$
            BEGIN
                IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_activities_tipo_enum') THEN
                    CREATE TYPE "public"."user_activities_tipo_enum" AS ENUM('LOGIN', 'LOGOUT', 'CRIACAO', 'EDICAO', 'EXCLUSAO', 'ALTERACAO_STATUS', 'RESET_SENHA');
                END IF;
            END
            $$;
        `);
    await queryRunner.query(`CREATE TABLE IF NOT EXISTS "user_activities" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "usuario_id" uuid NOT NULL, "empresa_id" character varying NOT NULL, "tipo" "public"."user_activities_tipo_enum" NOT NULL DEFAULT 'LOGIN', "descricao" character varying NOT NULL, "detalhes" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_1245d4d2cf04ba7743f2924d951" PRIMARY KEY ("id"))`);

    // ⚡ MULTI-TENANT: Habilitar RLS
    await queryRunner.query(`
      ALTER TABLE IF ENABLE ROW LEVEL SECURITY;
    `);

    // ⚡ MULTI-TENANT: Criar política de isolamento
    await queryRunner.query(`
      CREATE POLICY tenant_isolation_IF ON IF
        FOR ALL USING (empresa_id = get_current_tenant());
    `);

    // ⚡ MULTI-TENANT: Criar índice para performance
    await queryRunner.query(`
      CREATE INDEX idx_IF_empresa_id ON IF(empresa_id);
    `);
    await queryRunner.query(`
            DO $$
            BEGIN
                IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'fluxos_automatizados_status_enum') THEN
                    CREATE TYPE "public"."fluxos_automatizados_status_enum" AS ENUM('proposta_aceita', 'contrato_gerado', 'contrato_enviado', 'contrato_assinado', 'fatura_gerada', 'pagamento_processado', 'workflow_concluido', 'erro_processamento', 'pausado', 'cancelado');
                END IF;
            END
            $$;
        `);
    await queryRunner.query(`CREATE TABLE IF NOT EXISTS "fluxos_automatizados" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenantId" uuid NOT NULL, "numeroFluxo" character varying(50) NOT NULL, "propostaId" uuid NOT NULL, "contratoId" uuid, "faturaId" uuid, "status" "public"."fluxos_automatizados_status_enum" NOT NULL DEFAULT 'proposta_aceita', "etapaAtual" integer NOT NULL DEFAULT '1', "totalEtapas" integer NOT NULL DEFAULT '6', "dataInicio" TIMESTAMP, "dataConclusao" TIMESTAMP, "dataProximaAcao" TIMESTAMP, "tentativasProcessamento" integer NOT NULL DEFAULT '0', "maxTentativas" integer NOT NULL DEFAULT '3', "configuracoes" json, "metadados" json, "observacoes" text, "ultimoErro" text, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_0e1071330540eb38be4c823e94f" PRIMARY KEY ("id"))`);
    await queryRunner.query(`
            DO $$
            BEGIN
                IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'eventos_fluxo_tipoevento_enum') THEN
                    CREATE TYPE "public"."eventos_fluxo_tipoevento_enum" AS ENUM('proposta_aceita', 'contrato_criado', 'contrato_enviado', 'contrato_assinado', 'fatura_criada', 'pagamento_recebido', 'erro_ocorrido', 'workflow_pausado', 'workflow_retomado', 'workflow_cancelado');
                END IF;
            END
            $$;
        `);
    await queryRunner.query(`
            DO $$
            BEGIN
                IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'eventos_fluxo_status_enum') THEN
                    CREATE TYPE "public"."eventos_fluxo_status_enum" AS ENUM('pendente', 'processando', 'concluido', 'erro', 'cancelado');
                END IF;
            END
            $$;
        `);
    await queryRunner.query(`CREATE TABLE IF NOT EXISTS "eventos_fluxo" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenantId" uuid NOT NULL, "fluxoId" uuid NOT NULL, "tipoEvento" "public"."eventos_fluxo_tipoevento_enum" NOT NULL, "status" "public"."eventos_fluxo_status_enum" NOT NULL DEFAULT 'pendente', "titulo" character varying(255) NOT NULL, "descricao" text, "dadosEvento" json, "dataProcessamento" TIMESTAMP, "dataAgendamento" TIMESTAMP, "tentativas" integer NOT NULL DEFAULT '0', "maxTentativas" integer NOT NULL DEFAULT '3', "ultimoErro" text, "processadoPor" character varying(100), "tempoProcessamento" integer, "resultadoProcessamento" json, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "fluxo_id" uuid, CONSTRAINT "PK_c69e700eeef3232957ce795f8f8" PRIMARY KEY ("id"))`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_fa2c2f9353b1c9108b4651153a" ON "eventos_fluxo" ("status", "dataProcessamento") `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_006aec56cd22a82d0fe68a18d9" ON "eventos_fluxo" ("fluxoId", "createdAt") `);
    await queryRunner.query(`
            DO $$
            BEGIN
                IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'contas_pagar_status_enum') THEN
                    CREATE TYPE "public"."contas_pagar_status_enum" AS ENUM('pendente', 'paga', 'vencida', 'cancelada');
                END IF;
            END
            $$;
        `);
    await queryRunner.query(`CREATE TABLE IF NOT EXISTS "contas_pagar" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "descricao" character varying NOT NULL, "valor" numeric(10,2) NOT NULL, "data_vencimento" TIMESTAMP NOT NULL, "data_pagamento" TIMESTAMP, "status" "public"."contas_pagar_status_enum" NOT NULL DEFAULT 'pendente', "fornecedor_id" uuid NOT NULL, "empresa_id" character varying NOT NULL, "observacoes" character varying, "numero_documento" character varying, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_2f0a30e7ee98c3035dcce83ebe7" PRIMARY KEY ("id"))`);
    await queryRunner.query(`CREATE TABLE IF NOT EXISTS "canais" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "nome" character varying NOT NULL, "tipo" character varying NOT NULL, "empresaId" uuid NOT NULL, "ativo" boolean NOT NULL DEFAULT false, "configuracao" jsonb, "provider" character varying, "status" character varying, "webhook_url" character varying, "webhook_secret" character varying, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, CONSTRAINT "PK_61f874d660728a3b5c261419dcb" PRIMARY KEY ("id"))`);

    const hasEmpresaIdColumn = await queryRunner.hasColumn('faturas', 'empresa_id');
    if (!hasEmpresaIdColumn) {
      await queryRunner.query(`ALTER TABLE "faturas" ADD "empresa_id" uuid`);
    }
    await queryRunner.query(`ALTER TABLE "faturas" ALTER COLUMN "empresa_id" TYPE uuid USING "empresa_id"::uuid`);
    await queryRunner.query(`ALTER TABLE "faturas" ALTER COLUMN "empresa_id" SET NOT NULL`);

    if (!(await queryRunner.hasColumn('faturas', 'criadoPor'))) {
      await queryRunner.query(`ALTER TABLE "faturas" ADD "criadoPor" uuid`);
    }
    if (!(await queryRunner.hasColumn('faturas', 'atualizadoPor'))) {
      await queryRunner.query(`ALTER TABLE "faturas" ADD "atualizadoPor" uuid`);
    }
    await queryRunner.query(`ALTER TABLE "configuracoes_gateway_pagamento" ALTER COLUMN "credenciais" SET DEFAULT '{}'::jsonb`);
    await queryRunner.query(`ALTER TABLE "configuracoes_gateway_pagamento" ALTER COLUMN "metodos_permitidos" SET DEFAULT '[]'::jsonb`);
    await queryRunner.query(`ALTER TABLE "transacoes_gateway_pagamento" ALTER COLUMN "payload_envio" SET DEFAULT '{}'::jsonb`);
    await queryRunner.query(`ALTER TABLE "transacoes_gateway_pagamento" ALTER COLUMN "payload_resposta" SET DEFAULT '{}'::jsonb`);
    await queryRunner.query(`ALTER TABLE "faturas" DROP CONSTRAINT IF EXISTS "FK_9b8490bce74e62adb498b5ccbb6"`);
    await queryRunner.query(`ALTER TABLE "faturas" ALTER COLUMN "contratoId" DROP NOT NULL`);
    await queryRunner.query(`ALTER TABLE "faturas" ALTER COLUMN "valorTotal" TYPE numeric(12,2)`);
    await queryRunner.query(`ALTER TABLE "faturas" ALTER COLUMN "valorPago" TYPE numeric(12,2)`);
    await queryRunner.query(`ALTER TABLE "faturas" ALTER COLUMN "valorDesconto" TYPE numeric(12,2)`);
    await queryRunner.query(`ALTER TABLE "faturas" ALTER COLUMN "valorJuros" TYPE numeric(12,2)`);
    await queryRunner.query(`ALTER TABLE "faturas" ALTER COLUMN "valorMulta" TYPE numeric(12,2)`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_67862e1af92d16dfa50f4e9d18" ON "faturas" ("clienteId") `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_1162d4fe194d2e32a9ecf6ccb4" ON "faturas" ("status") `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_c0d57c7b5bde732ac3d3ed3558" ON "faturas" ("dataEmissao") `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_139d3276e0a299deacb53a557d" ON "faturas" ("dataVencimento") `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_60cf6cd7b6a1b7298af56b056d" ON "faturas" ("ativo") `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_c74f605d546764c24c0d9451f0" ON "faturas" ("createdAt") `);
    await queryRunner.query(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_a4c04e78810691f77a6c4dd8e6" ON "faturas" ("numero") `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_e0741e7b51d90755844ae04d67" ON "faturas" ("dataVencimento", "status") `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_450c254ac416c5207f90573259" ON "faturas" ("clienteId", "status") `);
    await queryRunner.query(`
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.table_constraints
                    WHERE constraint_name = 'FK_de78dd239133a21e389b3132a99'
                      AND table_name = 'user_activities'
                      AND table_schema = 'public'
                ) THEN
                    ALTER TABLE "user_activities" ADD CONSTRAINT "FK_de78dd239133a21e389b3132a99" FOREIGN KEY ("usuario_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
                END IF;
            END
            $$;
        `);
    await queryRunner.query(`
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.table_constraints
                    WHERE constraint_name = 'FK_9b8490bce74e62adb498b5ccbb6'
                      AND table_name = 'faturas'
                      AND table_schema = 'public'
                ) THEN
                    ALTER TABLE "faturas" ADD CONSTRAINT "FK_9b8490bce74e62adb498b5ccbb6" FOREIGN KEY ("contratoId") REFERENCES "contratos"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
                END IF;
            END
            $$;
        `);
    await queryRunner.query(`
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.table_constraints
                    WHERE constraint_name = 'FK_644bf709a39af5c760b98e56a06'
                      AND table_name = 'faturas'
                      AND table_schema = 'public'
                ) THEN
                    ALTER TABLE "faturas" ADD CONSTRAINT "FK_644bf709a39af5c760b98e56a06" FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
                END IF;
            END
            $$;
        `);
    await queryRunner.query(`
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.table_constraints
                    WHERE constraint_name = 'FK_7b22daee8fdde61514a153e4e04'
                      AND table_name = 'eventos_fluxo'
                      AND table_schema = 'public'
                ) THEN
                    ALTER TABLE "eventos_fluxo" ADD CONSTRAINT "FK_7b22daee8fdde61514a153e4e04" FOREIGN KEY ("fluxo_id") REFERENCES "fluxos_automatizados"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
                END IF;
            END
            $$;
        `);
    await queryRunner.query(`
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.table_constraints
                    WHERE constraint_name = 'fk_contas_pagar_fornecedor'
                      AND table_name = 'contas_pagar'
                      AND table_schema = 'public'
                ) THEN
                    ALTER TABLE "contas_pagar" ADD CONSTRAINT "fk_contas_pagar_fornecedor" FOREIGN KEY ("fornecedor_id") REFERENCES "fornecedores"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;
                END IF;
            END
            $$;
        `);
    await queryRunner.query(`
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.table_constraints
                    WHERE constraint_name = 'FK_2eb76f75d6d4f850a8c1eee9dfb'
                      AND table_name = 'canais'
                      AND table_schema = 'public'
                ) THEN
                    ALTER TABLE "canais" ADD CONSTRAINT "FK_2eb76f75d6d4f850a8c1eee9dfb" FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
                END IF;
            END
            $$;
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "canais" DROP CONSTRAINT IF EXISTS "FK_2eb76f75d6d4f850a8c1eee9dfb"`);
    await queryRunner.query(`ALTER TABLE "contas_pagar" DROP CONSTRAINT IF EXISTS "fk_contas_pagar_fornecedor"`);
    await queryRunner.query(`ALTER TABLE "eventos_fluxo" DROP CONSTRAINT IF EXISTS "FK_7b22daee8fdde61514a153e4e04"`);
    await queryRunner.query(`ALTER TABLE "faturas" DROP CONSTRAINT IF EXISTS "FK_644bf709a39af5c760b98e56a06"`);
    await queryRunner.query(`ALTER TABLE "faturas" DROP CONSTRAINT IF EXISTS "FK_9b8490bce74e62adb498b5ccbb6"`);
    await queryRunner.query(`ALTER TABLE "user_activities" DROP CONSTRAINT IF EXISTS "FK_de78dd239133a21e389b3132a99"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_450c254ac416c5207f90573259"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_e0741e7b51d90755844ae04d67"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_a4c04e78810691f77a6c4dd8e6"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_c74f605d546764c24c0d9451f0"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_60cf6cd7b6a1b7298af56b056d"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_139d3276e0a299deacb53a557d"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_c0d57c7b5bde732ac3d3ed3558"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_1162d4fe194d2e32a9ecf6ccb4"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_67862e1af92d16dfa50f4e9d18"`);
    await queryRunner.query(`ALTER TABLE "faturas" ALTER COLUMN "valorMulta" TYPE numeric(10,2)`);
    await queryRunner.query(`ALTER TABLE "faturas" ALTER COLUMN "valorJuros" TYPE numeric(10,2)`);
    await queryRunner.query(`ALTER TABLE "faturas" ALTER COLUMN "valorDesconto" TYPE numeric(10,2)`);
    await queryRunner.query(`ALTER TABLE "faturas" ALTER COLUMN "valorPago" TYPE numeric(10,2)`);
    await queryRunner.query(`ALTER TABLE "faturas" ALTER COLUMN "valorTotal" TYPE numeric(10,2)`);
    await queryRunner.query(`ALTER TABLE "faturas" ALTER COLUMN "contratoId" SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE "faturas" ADD CONSTRAINT "FK_9b8490bce74e62adb498b5ccbb6" FOREIGN KEY ("contratoId") REFERENCES "contratos"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    await queryRunner.query(`ALTER TABLE "transacoes_gateway_pagamento" ALTER COLUMN "payload_resposta" SET DEFAULT '{}'`);
    await queryRunner.query(`ALTER TABLE "transacoes_gateway_pagamento" ALTER COLUMN "payload_envio" SET DEFAULT '{}'`);
    await queryRunner.query(`ALTER TABLE "configuracoes_gateway_pagamento" ALTER COLUMN "metodos_permitidos" SET DEFAULT '[]'`);
    await queryRunner.query(`ALTER TABLE "configuracoes_gateway_pagamento" ALTER COLUMN "credenciais" SET DEFAULT '{}'`);
    await queryRunner.query(`ALTER TABLE "faturas" DROP COLUMN IF EXISTS "atualizadoPor"`);
    await queryRunner.query(`ALTER TABLE "faturas" DROP COLUMN IF EXISTS "criadoPor"`);
    await queryRunner.query(`ALTER TABLE "faturas" DROP COLUMN IF EXISTS "empresa_id"`);

    const hasEmpresaIdAfterDrop = await queryRunner.hasColumn('faturas', 'empresa_id');
    if (!hasEmpresaIdAfterDrop) {
      await queryRunner.query(`ALTER TABLE "faturas" ADD "empresa_id" uuid NOT NULL`);
    }

    await queryRunner.query(`DROP TABLE IF EXISTS "canais"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "contas_pagar"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."contas_pagar_status_enum"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_006aec56cd22a82d0fe68a18d9"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_fa2c2f9353b1c9108b4651153a"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "eventos_fluxo"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."eventos_fluxo_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."eventos_fluxo_tipoevento_enum"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "fluxos_automatizados"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."fluxos_automatizados_status_enum"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "user_activities"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."user_activities_tipo_enum"`);
    await queryRunner.query(`
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.table_constraints
                    WHERE constraint_name = 'FK_644bf709a39af5c760b98e56a06'
                      AND table_name = 'faturas'
                      AND table_schema = 'public'
                ) THEN
                    ALTER TABLE "faturas" ADD CONSTRAINT "FK_644bf709a39af5c760b98e56a06" FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
                END IF;
            END
            $$;
        `);
  }

}
