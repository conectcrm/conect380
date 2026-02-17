import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPendenteStatusToCotacao1763405981614 implements MigrationInterface {
  name = 'AddPendenteStatusToCotacao1763405981614';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "notifications" DROP CONSTRAINT "FK_9a8a82462cab47c73d25f49261f"`,
    );
    await queryRunner.query(`ALTER TABLE "produtos" DROP CONSTRAINT "FK_produtos_empresa"`);
    await queryRunner.query(`ALTER TABLE "atividades" DROP CONSTRAINT "FK_atividades_empresa"`);
    await queryRunner.query(
      `ALTER TABLE "oportunidades" DROP CONSTRAINT "FK_oportunidades_empresa"`,
    );
    await queryRunner.query(
      `ALTER TABLE "oportunidades" DROP CONSTRAINT "FK_oportunidades_cliente"`,
    );
    await queryRunner.query(`ALTER TABLE "leads" DROP CONSTRAINT "FK_leads_oportunidade"`);
    await queryRunner.query(`ALTER TABLE "leads" DROP CONSTRAINT "FK_leads_responsavel"`);
    await queryRunner.query(`ALTER TABLE "leads" DROP CONSTRAINT "FK_leads_empresa"`);
    await queryRunner.query(`ALTER TABLE "cotacoes" DROP CONSTRAINT "fk_cotacoes_aprovador"`);
    await queryRunner.query(
      `ALTER TABLE "filas_atendentes" DROP CONSTRAINT "FK_filas_atendentes_user"`,
    );
    await queryRunner.query(
      `ALTER TABLE "filas_atendentes" DROP CONSTRAINT "FK_filas_atendentes_fila"`,
    );
    await queryRunner.query(`ALTER TABLE "filas" DROP CONSTRAINT "FK_filas_departamento"`);
    await queryRunner.query(`ALTER TABLE "filas" DROP CONSTRAINT "FK_filas_nucleo"`);
    await queryRunner.query(
      `ALTER TABLE "atendimento_tickets" DROP CONSTRAINT "FK_ticket_departamento"`,
    );
    await queryRunner.query(
      `ALTER TABLE "configuracoes_gateway_pagamento" DROP CONSTRAINT "FK_config_gateway_empresa"`,
    );
    await queryRunner.query(`ALTER TABLE "contratos" DROP CONSTRAINT "FK_contratos_empresa"`);
    await queryRunner.query(`ALTER TABLE "pagamentos" DROP CONSTRAINT "FK_pagamentos_empresa"`);
    await queryRunner.query(`ALTER TABLE "faturas" DROP CONSTRAINT "FK_faturas_empresa"`);
    await queryRunner.query(
      `ALTER TABLE "transacoes_gateway_pagamento" DROP CONSTRAINT "FK_transacoes_gateway_pagamento"`,
    );
    await queryRunner.query(
      `ALTER TABLE "transacoes_gateway_pagamento" DROP CONSTRAINT "FK_transacoes_gateway_fatura"`,
    );
    await queryRunner.query(
      `ALTER TABLE "transacoes_gateway_pagamento" DROP CONSTRAINT "FK_transacoes_gateway_config"`,
    );
    await queryRunner.query(
      `ALTER TABLE "transacoes_gateway_pagamento" DROP CONSTRAINT "FK_transacoes_gateway_empresa"`,
    );
    await queryRunner.query(
      `ALTER TABLE "empresa_modulos" DROP CONSTRAINT "fk_empresa_modulos_empresa"`,
    );
    await queryRunner.query(
      `ALTER TABLE "password_reset_tokens" DROP CONSTRAINT "FK_password_reset_tokens_user"`,
    );
    await queryRunner.query(
      `ALTER TABLE "distribuicao_config" DROP CONSTRAINT "FK_544fd99a976c9ad31371a00d1c7"`,
    );
    await queryRunner.query(
      `ALTER TABLE "distribuicao_log" DROP CONSTRAINT "FK_380a8c5c105b3cc1b6018baee94"`,
    );
    await queryRunner.query(
      `ALTER TABLE "distribuicao_log" DROP CONSTRAINT "FK_f9e61fcb5a74c76ddb93e2d04c5"`,
    );
    await queryRunner.query(
      `ALTER TABLE "atendimento_configuracao_inatividade" DROP CONSTRAINT "FK_configuracao_inatividade_departamento"`,
    );
    await queryRunner.query(`ALTER TABLE "ticket_tags" DROP CONSTRAINT "FK_TICKET_TAGS_TAG"`);
    await queryRunner.query(`ALTER TABLE "ticket_tags" DROP CONSTRAINT "FK_TICKET_TAGS_TICKET"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_notifications_user_id"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_notifications_read"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_notifications_created_at"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_notifications_user_unread"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_produtos_empresa_id"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_atividades_empresa_id"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_oportunidades_empresa_id"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_oportunidades_empresa_estagio"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_leads_empresa_id"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_leads_status"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_leads_responsavel_id"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_leads_created_at"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_filas_atendentes_fila_atendente"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_filas_atendentes_filaId"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_filas_atendentes_atendenteId"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_TAGS_NOME"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_TAGS_NOME_EMPRESA"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_TAGS_ATIVO"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_TAGS_EMPRESA"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_ticket_departamento"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_contratos_empresa_id"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_pagamentos_empresa_id"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_faturas_empresa_id"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_67862e1af92d16dfa50f4e9d18"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_1162d4fe194d2e32a9ecf6ccb4"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_c0d57c7b5bde732ac3d3ed3558"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_139d3276e0a299deacb53a557d"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_60cf6cd7b6a1b7298af56b056d"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_c74f605d546764c24c0d9451f0"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_a4c04e78810691f77a6c4dd8e6"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_e0741e7b51d90755844ae04d67"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_450c254ac416c5207f90573259"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_transacoes_gateway_config"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_transacoes_gateway_fatura"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_transacoes_gateway_pagamento"`);
    await queryRunner.query(`DROP INDEX "public"."idx_empresa_modulo_unique"`);
    await queryRunner.query(`DROP INDEX "public"."idx_empresa_modulos_empresa_id"`);
    await queryRunner.query(`DROP INDEX "public"."idx_empresa_modulos_ativo"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_password_reset_tokens_token_hash"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_password_reset_tokens_user_id"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_SLA_LOG_TICKET"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_SLA_LOG_STATUS"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_SLA_LOG_TIPO_EVENTO"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_SLA_LOG_CREATED_AT"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_SLA_LOG_EMPRESA"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_SLA_CONFIG_EMPRESA"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_SLA_CONFIG_PRIORIDADE"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_SLA_CONFIG_ATIVO"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_SLA_CONFIG_EMPRESA_PRIORIDADE"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_MESSAGE_TEMPLATES_EMPRESA"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_MESSAGE_TEMPLATES_ATIVO"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_MESSAGE_TEMPLATES_ATALHO"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_MESSAGE_TEMPLATES_CATEGORIA"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_configuracao_inatividade_ativo"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_configuracao_inatividade_empresa_departamento"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_TICKET_TAGS_TAG"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_TICKET_TAGS_TICKET"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_TICKET_TAGS_COMPOSITE"`);
    await queryRunner.query(`ALTER TABLE "produtos" DROP CONSTRAINT "UQ_produtos_empresa_sku"`);
    await queryRunner.query(
      `CREATE TABLE "equipe_atribuicoes" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "equipe_id" uuid NOT NULL, "nucleo_id" uuid, "departamento_id" uuid, "prioridade" integer NOT NULL DEFAULT '0', "ativo" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_feff7a3ca4116b573219b984939" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "atendente_equipes" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "atendente_id" uuid NOT NULL, "equipe_id" uuid NOT NULL, "funcao" character varying(50) NOT NULL DEFAULT 'membro', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_298921e69f1a5860ac5d51e6543" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "equipes" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "empresa_id" uuid NOT NULL, "nome" character varying(100) NOT NULL, "descricao" text, "cor" character varying(7) NOT NULL DEFAULT '#3B82F6', "icone" character varying(50) NOT NULL DEFAULT 'users', "ativo" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_9f0bfc492ee9542b0c0f42eb21d" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(`ALTER TABLE "faturas" DROP COLUMN "criadoPor"`);
    await queryRunner.query(`ALTER TABLE "faturas" DROP COLUMN "atualizadoPor"`);
    await queryRunner.query(`ALTER TABLE "faturas" DROP COLUMN "empresa_id"`);
    await queryRunner.query(`ALTER TABLE "ticket_tags" DROP COLUMN "createdAt"`);
    await queryRunner.query(`ALTER TABLE "faturas" ADD "empresa_id" uuid NOT NULL`);
    await queryRunner.query(`ALTER TABLE "faturas" ADD "criadoPor" uuid`);
    await queryRunner.query(`ALTER TABLE "faturas" ADD "atualizadoPor" uuid`);
    await queryRunner.query(`ALTER TABLE "leads" DROP COLUMN "status"`);
    await queryRunner.query(`DROP TYPE "public"."leads_status_enum"`);
    await queryRunner.query(
      `ALTER TABLE "leads" ADD "status" character varying NOT NULL DEFAULT 'novo'`,
    );
    await queryRunner.query(`ALTER TABLE "leads" DROP COLUMN "origem"`);
    await queryRunner.query(`DROP TYPE "public"."leads_origem_enum"`);
    await queryRunner.query(`ALTER TABLE "leads" ADD "origem" character varying`);
    await queryRunner.query(`COMMENT ON COLUMN "fornecedores"."cnpj_cpf" IS NULL`);
    await queryRunner.query(
      `ALTER TYPE "public"."cotacoes_status_enum" RENAME TO "cotacoes_status_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."cotacoes_status_enum" AS ENUM('rascunho', 'enviada', 'pendente', 'em_analise', 'aprovada', 'rejeitada', 'vencida', 'convertida', 'cancelada')`,
    );
    await queryRunner.query(`ALTER TABLE "cotacoes" ALTER COLUMN "status" DROP DEFAULT`);
    await queryRunner.query(
      `ALTER TABLE "cotacoes" ALTER COLUMN "status" TYPE "public"."cotacoes_status_enum" USING "status"::"text"::"public"."cotacoes_status_enum"`,
    );
    await queryRunner.query(`ALTER TABLE "cotacoes" ALTER COLUMN "status" SET DEFAULT 'rascunho'`);
    await queryRunner.query(`DROP TYPE "public"."cotacoes_status_enum_old"`);
    await queryRunner.query(
      `ALTER TABLE "itens_cotacao" ALTER COLUMN "valorTotal" SET DEFAULT '0'`,
    );
    await queryRunner.query(
      `ALTER TABLE "fluxos_triagem" ALTER COLUMN "historico_versoes" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "fluxos_triagem" ALTER COLUMN "versao_atual" SET NOT NULL`,
    );
    await queryRunner.query(`COMMENT ON COLUMN "filas_atendentes"."filaId" IS NULL`);
    await queryRunner.query(`COMMENT ON COLUMN "filas_atendentes"."atendenteId" IS NULL`);
    await queryRunner.query(
      `COMMENT ON COLUMN "filas_atendentes"."capacidade" IS 'Tickets simultâneos que este atendente pode ter nesta fila'`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "filas_atendentes"."prioridade" IS '1=alta prioridade, 10=baixa prioridade'`,
    );
    await queryRunner.query(`COMMENT ON COLUMN "filas_atendentes"."ativo" IS NULL`);
    await queryRunner.query(
      `ALTER TYPE "public"."estrategia_distribuicao_enum" RENAME TO "estrategia_distribuicao_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."filas_estrategia_distribuicao_enum" AS ENUM('ROUND_ROBIN', 'MENOR_CARGA', 'PRIORIDADE')`,
    );
    await queryRunner.query(
      `ALTER TABLE "filas" ALTER COLUMN "estrategia_distribuicao" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "filas" ALTER COLUMN "estrategia_distribuicao" TYPE "public"."filas_estrategia_distribuicao_enum" USING "estrategia_distribuicao"::"text"::"public"."filas_estrategia_distribuicao_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "filas" ALTER COLUMN "estrategia_distribuicao" SET DEFAULT 'ROUND_ROBIN'`,
    );
    await queryRunner.query(`DROP TYPE "public"."estrategia_distribuicao_enum_old"`);
    await queryRunner.query(`COMMENT ON COLUMN "filas"."estrategia_distribuicao" IS NULL`);
    await queryRunner.query(`COMMENT ON COLUMN "filas"."capacidade_maxima" IS NULL`);
    await queryRunner.query(`COMMENT ON COLUMN "filas"."distribuicao_automatica" IS NULL`);
    await queryRunner.query(`COMMENT ON COLUMN "filas"."configuracoes" IS NULL`);
    await queryRunner.query(`COMMENT ON COLUMN "tags"."cor" IS NULL`);
    await queryRunner.query(`COMMENT ON COLUMN "tags"."empresaId" IS NULL`);
    await queryRunner.query(`ALTER TABLE "tags" ALTER COLUMN "createdAt" SET DEFAULT now()`);
    await queryRunner.query(`ALTER TABLE "tags" ALTER COLUMN "updatedAt" SET DEFAULT now()`);
    await queryRunner.query(`COMMENT ON COLUMN "atendimento_tickets"."departamento_id" IS NULL`);
    await queryRunner.query(
      `ALTER TABLE "triagem_logs" ALTER COLUMN "created_at" SET DEFAULT now()`,
    );
    await queryRunner.query(`DROP INDEX "public"."UQ_config_gateway_empresa_tipo_modo"`);
    await queryRunner.query(
      `ALTER TYPE "public"."config_gateway_gateway_enum" RENAME TO "config_gateway_gateway_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."configuracoes_gateway_pagamento_gateway_enum" AS ENUM('mercado_pago', 'stripe', 'pagseguro')`,
    );
    await queryRunner.query(
      `ALTER TABLE "configuracoes_gateway_pagamento" ALTER COLUMN "gateway" TYPE "public"."configuracoes_gateway_pagamento_gateway_enum" USING "gateway"::"text"::"public"."configuracoes_gateway_pagamento_gateway_enum"`,
    );
    await queryRunner.query(`DROP TYPE "public"."config_gateway_gateway_enum_old"`);
    await queryRunner.query(
      `ALTER TYPE "public"."config_gateway_modo_enum" RENAME TO "config_gateway_modo_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."configuracoes_gateway_pagamento_modo_operacao_enum" AS ENUM('sandbox', 'producao')`,
    );
    await queryRunner.query(
      `ALTER TABLE "configuracoes_gateway_pagamento" ALTER COLUMN "modo_operacao" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "configuracoes_gateway_pagamento" ALTER COLUMN "modo_operacao" TYPE "public"."configuracoes_gateway_pagamento_modo_operacao_enum" USING "modo_operacao"::"text"::"public"."configuracoes_gateway_pagamento_modo_operacao_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "configuracoes_gateway_pagamento" ALTER COLUMN "modo_operacao" SET DEFAULT 'sandbox'`,
    );
    await queryRunner.query(`DROP TYPE "public"."config_gateway_modo_enum_old"`);
    await queryRunner.query(
      `ALTER TYPE "public"."config_gateway_status_enum" RENAME TO "config_gateway_status_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."configuracoes_gateway_pagamento_status_enum" AS ENUM('ativo', 'inativo', 'erro')`,
    );
    await queryRunner.query(
      `ALTER TABLE "configuracoes_gateway_pagamento" ALTER COLUMN "status" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "configuracoes_gateway_pagamento" ALTER COLUMN "status" TYPE "public"."configuracoes_gateway_pagamento_status_enum" USING "status"::"text"::"public"."configuracoes_gateway_pagamento_status_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "configuracoes_gateway_pagamento" ALTER COLUMN "status" SET DEFAULT 'inativo'`,
    );
    await queryRunner.query(`DROP TYPE "public"."config_gateway_status_enum_old"`);
    await queryRunner.query(
      `ALTER TABLE "configuracoes_gateway_pagamento" ALTER COLUMN "credenciais" SET DEFAULT '{}'::jsonb`,
    );
    await queryRunner.query(
      `ALTER TABLE "configuracoes_gateway_pagamento" ALTER COLUMN "metodos_permitidos" SET DEFAULT '[]'::jsonb`,
    );
    await queryRunner.query(`ALTER TABLE "faturas" ALTER COLUMN "valorTotal" TYPE numeric(10,2)`);
    await queryRunner.query(`ALTER TABLE "faturas" ALTER COLUMN "valorPago" TYPE numeric(10,2)`);
    await queryRunner.query(
      `ALTER TABLE "faturas" ALTER COLUMN "valorDesconto" TYPE numeric(10,2)`,
    );
    await queryRunner.query(`ALTER TABLE "faturas" ALTER COLUMN "valorJuros" TYPE numeric(10,2)`);
    await queryRunner.query(`ALTER TABLE "faturas" ALTER COLUMN "valorMulta" TYPE numeric(10,2)`);
    await queryRunner.query(
      `ALTER TYPE "public"."transacao_gateway_status_enum" RENAME TO "transacao_gateway_status_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."transacoes_gateway_pagamento_status_enum" AS ENUM('pendente', 'processando', 'aprovado', 'recusado', 'cancelado', 'erro')`,
    );
    await queryRunner.query(
      `ALTER TABLE "transacoes_gateway_pagamento" ALTER COLUMN "status" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "transacoes_gateway_pagamento" ALTER COLUMN "status" TYPE "public"."transacoes_gateway_pagamento_status_enum" USING "status"::"text"::"public"."transacoes_gateway_pagamento_status_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "transacoes_gateway_pagamento" ALTER COLUMN "status" SET DEFAULT 'pendente'`,
    );
    await queryRunner.query(`DROP TYPE "public"."transacao_gateway_status_enum_old"`);
    await queryRunner.query(
      `ALTER TYPE "public"."transacao_gateway_operacao_enum" RENAME TO "transacao_gateway_operacao_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."transacoes_gateway_pagamento_tipo_operacao_enum" AS ENUM('cobranca', 'estorno', 'webhook', 'validacao')`,
    );
    await queryRunner.query(
      `ALTER TABLE "transacoes_gateway_pagamento" ALTER COLUMN "tipo_operacao" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "transacoes_gateway_pagamento" ALTER COLUMN "tipo_operacao" TYPE "public"."transacoes_gateway_pagamento_tipo_operacao_enum" USING "tipo_operacao"::"text"::"public"."transacoes_gateway_pagamento_tipo_operacao_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "transacoes_gateway_pagamento" ALTER COLUMN "tipo_operacao" SET DEFAULT 'cobranca'`,
    );
    await queryRunner.query(`DROP TYPE "public"."transacao_gateway_operacao_enum_old"`);
    await queryRunner.query(
      `ALTER TYPE "public"."transacao_gateway_metodo_enum" RENAME TO "transacao_gateway_metodo_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."transacoes_gateway_pagamento_metodo_enum" AS ENUM('pix', 'cartao_credito', 'cartao_debito', 'boleto', 'link_pagamento', 'transferencia')`,
    );
    await queryRunner.query(
      `ALTER TABLE "transacoes_gateway_pagamento" ALTER COLUMN "metodo" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "transacoes_gateway_pagamento" ALTER COLUMN "metodo" TYPE "public"."transacoes_gateway_pagamento_metodo_enum" USING "metodo"::"text"::"public"."transacoes_gateway_pagamento_metodo_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "transacoes_gateway_pagamento" ALTER COLUMN "metodo" SET DEFAULT 'pix'`,
    );
    await queryRunner.query(`DROP TYPE "public"."transacao_gateway_metodo_enum_old"`);
    await queryRunner.query(
      `ALTER TABLE "transacoes_gateway_pagamento" ALTER COLUMN "payload_envio" SET DEFAULT '{}'::jsonb`,
    );
    await queryRunner.query(
      `ALTER TABLE "transacoes_gateway_pagamento" ALTER COLUMN "payload_resposta" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "transacoes_gateway_pagamento" ALTER COLUMN "payload_resposta" SET DEFAULT '{}'::jsonb`,
    );
    await queryRunner.query(`ALTER TABLE "contas_pagar" DROP COLUMN "descricao"`);
    await queryRunner.query(
      `ALTER TABLE "contas_pagar" ADD "descricao" character varying NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "faturas" DROP CONSTRAINT "FK_9b8490bce74e62adb498b5ccbb6"`,
    );
    await queryRunner.query(`ALTER TABLE "faturas" ALTER COLUMN "contratoId" DROP NOT NULL`);
    await queryRunner.query(
      `ALTER TABLE "empresa_modulos" ALTER COLUMN "data_ativacao" SET DEFAULT now()`,
    );
    await queryRunner.query(`COMMENT ON COLUMN "empresa_modulos"."data_expiracao" IS NULL`);
    await queryRunner.query(
      `ALTER TABLE "empresa_modulos" ALTER COLUMN "created_at" SET DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "empresa_modulos" ALTER COLUMN "updated_at" SET DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "sla_event_logs" ALTER COLUMN "createdAt" SET DEFAULT now()`,
    );
    await queryRunner.query(`ALTER TABLE "sla_configs" ALTER COLUMN "createdAt" SET DEFAULT now()`);
    await queryRunner.query(`ALTER TABLE "sla_configs" ALTER COLUMN "updatedAt" SET DEFAULT now()`);
    await queryRunner.query(
      `ALTER TABLE "atendimento_canais" ALTER COLUMN "provedor" DROP DEFAULT`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "atendimento_configuracao_inatividade"."departamento_id" IS NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "atendimento_configuracao_inatividade" ALTER COLUMN "created_at" SET DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "atendimento_configuracao_inatividade" ALTER COLUMN "updated_at" SET DEFAULT now()`,
    );
    await queryRunner.query(`ALTER TABLE "canais" DROP COLUMN "nome"`);
    await queryRunner.query(`ALTER TABLE "canais" ADD "nome" character varying NOT NULL`);
    await queryRunner.query(`ALTER TABLE "canais" DROP COLUMN "tipo"`);
    await queryRunner.query(`ALTER TABLE "canais" ADD "tipo" character varying NOT NULL`);
    await queryRunner.query(`ALTER TABLE "canais" DROP COLUMN "provider"`);
    await queryRunner.query(`ALTER TABLE "canais" ADD "provider" character varying`);
    await queryRunner.query(`ALTER TABLE "canais" DROP COLUMN "status"`);
    await queryRunner.query(`ALTER TABLE "canais" ADD "status" character varying`);
    await queryRunner.query(`ALTER TABLE "canais" DROP COLUMN "webhook_url"`);
    await queryRunner.query(`ALTER TABLE "canais" ADD "webhook_url" character varying`);
    await queryRunner.query(`ALTER TABLE "canais" DROP COLUMN "webhook_secret"`);
    await queryRunner.query(`ALTER TABLE "canais" ADD "webhook_secret" character varying`);
    await queryRunner.query(
      `CREATE INDEX "IDX_dced2c6050cacb6b2f6a5c2bb5" ON "filas_atendentes" ("atendenteId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_4d7b70fba91aea5d9439fcee01" ON "filas_atendentes" ("filaId") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_cdcb1da9877f92375cff9b2812" ON "filas_atendentes" ("filaId", "atendenteId") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_config_gateway_empresa_tipo_modo" ON "configuracoes_gateway_pagamento" ("empresa_id", "gateway", "modo_operacao") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_pagamentos_empresa_id" ON "pagamentos" ("empresa_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_67862e1af92d16dfa50f4e9d18" ON "faturas" ("clienteId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_1162d4fe194d2e32a9ecf6ccb4" ON "faturas" ("status") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_c0d57c7b5bde732ac3d3ed3558" ON "faturas" ("dataEmissao") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_139d3276e0a299deacb53a557d" ON "faturas" ("dataVencimento") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_60cf6cd7b6a1b7298af56b056d" ON "faturas" ("ativo") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_c74f605d546764c24c0d9451f0" ON "faturas" ("createdAt") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_a4c04e78810691f77a6c4dd8e6" ON "faturas" ("numero") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_e0741e7b51d90755844ae04d67" ON "faturas" ("dataVencimento", "status") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_450c254ac416c5207f90573259" ON "faturas" ("clienteId", "status") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_563dad1f6cbd1478ca0ae34845" ON "atendimento_configuracao_inatividade" ("empresa_id", "departamento_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_bd3c69926bfff8721e010e77bc" ON "ticket_tags" ("ticketId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_4c0c28c88a8ad89b2c1ba6c661" ON "ticket_tags" ("tagId") `,
    );
    await queryRunner.query(
      `ALTER TABLE "empresa_modulos" ADD CONSTRAINT "UQ_77259e6fdc8105e25f82ac00bb6" UNIQUE ("empresa_id", "modulo")`,
    );
    await queryRunner.query(
      `ALTER TABLE "notifications" ADD CONSTRAINT "FK_9a8a82462cab47c73d25f49261f" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "produtos" ADD CONSTRAINT "FK_afe3324a3eebac3e0cdc0c3d6ff" FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "atividades" ADD CONSTRAINT "FK_6f6cda5daa94cbf4831213f29b6" FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "oportunidades" ADD CONSTRAINT "FK_21bbf91bef3ac34a19858316c17" FOREIGN KEY ("cliente_id") REFERENCES "clientes"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "oportunidades" ADD CONSTRAINT "FK_5a29d725e26c0fa6aa7fa5b7881" FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "leads" ADD CONSTRAINT "FK_6618ae5771955eefeb3c5605a28" FOREIGN KEY ("responsavel_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "leads" ADD CONSTRAINT "FK_c1bd083a5d03538d2e23015c255" FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "leads" ADD CONSTRAINT "FK_502b5e6facd74f522ca707b359b" FOREIGN KEY ("oportunidade_id") REFERENCES "oportunidades"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "cotacoes" ADD CONSTRAINT "FK_c6877b6157ba08b668c85b5ac97" FOREIGN KEY ("aprovador_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "filas_atendentes" ADD CONSTRAINT "FK_4d7b70fba91aea5d9439fcee014" FOREIGN KEY ("filaId") REFERENCES "filas"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "filas_atendentes" ADD CONSTRAINT "FK_dced2c6050cacb6b2f6a5c2bb5d" FOREIGN KEY ("atendenteId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "filas" ADD CONSTRAINT "FK_f4c11751cb292dd663b107ec15f" FOREIGN KEY ("nucleoId") REFERENCES "nucleos_atendimento"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "filas" ADD CONSTRAINT "FK_882c24ce0a8aad3fe5bab5c0971" FOREIGN KEY ("departamentoId") REFERENCES "departamentos"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "atendimento_tickets" ADD CONSTRAINT "FK_49ba5247c171bb23921c171a545" FOREIGN KEY ("fila_id") REFERENCES "filas"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "equipe_atribuicoes" ADD CONSTRAINT "FK_ad01e06883cc2096416adaabc30" FOREIGN KEY ("equipe_id") REFERENCES "equipes"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "equipe_atribuicoes" ADD CONSTRAINT "FK_e95f80150da73629f28591e2423" FOREIGN KEY ("nucleo_id") REFERENCES "nucleos_atendimento"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "equipe_atribuicoes" ADD CONSTRAINT "FK_0468dc456954a358670b7d876bd" FOREIGN KEY ("departamento_id") REFERENCES "departamentos"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "atendente_equipes" ADD CONSTRAINT "FK_f2dfc074738e5b2afcfc72cf1be" FOREIGN KEY ("atendente_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "atendente_equipes" ADD CONSTRAINT "FK_21c3c8d3eb43ba80af89e860b59" FOREIGN KEY ("equipe_id") REFERENCES "equipes"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "equipes" ADD CONSTRAINT "FK_807928ca2ddc53142f024894d1a" FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "configuracoes_gateway_pagamento" ADD CONSTRAINT "FK_f53ca59a1c05ea4d8f6f851927a" FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "contratos" ADD CONSTRAINT "FK_f4c48faad5e870abd0b4eac069e" FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "pagamentos" ADD CONSTRAINT "FK_e87c3a5a1e8b1c047ebbe0adda0" FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "faturas" ADD CONSTRAINT "FK_9b8490bce74e62adb498b5ccbb6" FOREIGN KEY ("contratoId") REFERENCES "contratos"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "faturas" ADD CONSTRAINT "FK_644bf709a39af5c760b98e56a06" FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "transacoes_gateway_pagamento" ADD CONSTRAINT "FK_dab1b20ebbbce0172feaedcf1c6" FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "transacoes_gateway_pagamento" ADD CONSTRAINT "FK_670ed2eaaceb73e9115cfa1776b" FOREIGN KEY ("configuracao_id") REFERENCES "configuracoes_gateway_pagamento"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "transacoes_gateway_pagamento" ADD CONSTRAINT "FK_29a8272fafddb18246eb0ea7625" FOREIGN KEY ("fatura_id") REFERENCES "faturas"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "transacoes_gateway_pagamento" ADD CONSTRAINT "FK_510e9e87265c905d9d084b40f5f" FOREIGN KEY ("pagamento_id") REFERENCES "pagamentos"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "empresa_modulos" ADD CONSTRAINT "FK_46edc34189c9fc0365aa377b4f6" FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "FK_52ac39dd8a28730c63aeb428c9c" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "distribuicao_log" ADD CONSTRAINT "FK_f9e61fcb5a74c76ddb93e2d04c5" FOREIGN KEY ("atendenteId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "distribuicao_log" ADD CONSTRAINT "FK_380a8c5c105b3cc1b6018baee94" FOREIGN KEY ("filaId") REFERENCES "filas"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "atendimento_configuracao_inatividade" ADD CONSTRAINT "FK_eb5c423596a1b4426136371d5d6" FOREIGN KEY ("departamento_id") REFERENCES "departamentos"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "ticket_tags" ADD CONSTRAINT "FK_bd3c69926bfff8721e010e77bcc" FOREIGN KEY ("ticketId") REFERENCES "atendimento_tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "ticket_tags" ADD CONSTRAINT "FK_4c0c28c88a8ad89b2c1ba6c6619" FOREIGN KEY ("tagId") REFERENCES "tags"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "ticket_tags" DROP CONSTRAINT "FK_4c0c28c88a8ad89b2c1ba6c6619"`,
    );
    await queryRunner.query(
      `ALTER TABLE "ticket_tags" DROP CONSTRAINT "FK_bd3c69926bfff8721e010e77bcc"`,
    );
    await queryRunner.query(
      `ALTER TABLE "atendimento_configuracao_inatividade" DROP CONSTRAINT "FK_eb5c423596a1b4426136371d5d6"`,
    );
    await queryRunner.query(
      `ALTER TABLE "distribuicao_log" DROP CONSTRAINT "FK_380a8c5c105b3cc1b6018baee94"`,
    );
    await queryRunner.query(
      `ALTER TABLE "distribuicao_log" DROP CONSTRAINT "FK_f9e61fcb5a74c76ddb93e2d04c5"`,
    );
    await queryRunner.query(
      `ALTER TABLE "password_reset_tokens" DROP CONSTRAINT "FK_52ac39dd8a28730c63aeb428c9c"`,
    );
    await queryRunner.query(
      `ALTER TABLE "empresa_modulos" DROP CONSTRAINT "FK_46edc34189c9fc0365aa377b4f6"`,
    );
    await queryRunner.query(
      `ALTER TABLE "transacoes_gateway_pagamento" DROP CONSTRAINT "FK_510e9e87265c905d9d084b40f5f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "transacoes_gateway_pagamento" DROP CONSTRAINT "FK_29a8272fafddb18246eb0ea7625"`,
    );
    await queryRunner.query(
      `ALTER TABLE "transacoes_gateway_pagamento" DROP CONSTRAINT "FK_670ed2eaaceb73e9115cfa1776b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "transacoes_gateway_pagamento" DROP CONSTRAINT "FK_dab1b20ebbbce0172feaedcf1c6"`,
    );
    await queryRunner.query(
      `ALTER TABLE "faturas" DROP CONSTRAINT "FK_644bf709a39af5c760b98e56a06"`,
    );
    await queryRunner.query(
      `ALTER TABLE "faturas" DROP CONSTRAINT "FK_9b8490bce74e62adb498b5ccbb6"`,
    );
    await queryRunner.query(
      `ALTER TABLE "pagamentos" DROP CONSTRAINT "FK_e87c3a5a1e8b1c047ebbe0adda0"`,
    );
    await queryRunner.query(
      `ALTER TABLE "contratos" DROP CONSTRAINT "FK_f4c48faad5e870abd0b4eac069e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "configuracoes_gateway_pagamento" DROP CONSTRAINT "FK_f53ca59a1c05ea4d8f6f851927a"`,
    );
    await queryRunner.query(
      `ALTER TABLE "equipes" DROP CONSTRAINT "FK_807928ca2ddc53142f024894d1a"`,
    );
    await queryRunner.query(
      `ALTER TABLE "atendente_equipes" DROP CONSTRAINT "FK_21c3c8d3eb43ba80af89e860b59"`,
    );
    await queryRunner.query(
      `ALTER TABLE "atendente_equipes" DROP CONSTRAINT "FK_f2dfc074738e5b2afcfc72cf1be"`,
    );
    await queryRunner.query(
      `ALTER TABLE "equipe_atribuicoes" DROP CONSTRAINT "FK_0468dc456954a358670b7d876bd"`,
    );
    await queryRunner.query(
      `ALTER TABLE "equipe_atribuicoes" DROP CONSTRAINT "FK_e95f80150da73629f28591e2423"`,
    );
    await queryRunner.query(
      `ALTER TABLE "equipe_atribuicoes" DROP CONSTRAINT "FK_ad01e06883cc2096416adaabc30"`,
    );
    await queryRunner.query(
      `ALTER TABLE "atendimento_tickets" DROP CONSTRAINT "FK_49ba5247c171bb23921c171a545"`,
    );
    await queryRunner.query(`ALTER TABLE "filas" DROP CONSTRAINT "FK_882c24ce0a8aad3fe5bab5c0971"`);
    await queryRunner.query(`ALTER TABLE "filas" DROP CONSTRAINT "FK_f4c11751cb292dd663b107ec15f"`);
    await queryRunner.query(
      `ALTER TABLE "filas_atendentes" DROP CONSTRAINT "FK_dced2c6050cacb6b2f6a5c2bb5d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "filas_atendentes" DROP CONSTRAINT "FK_4d7b70fba91aea5d9439fcee014"`,
    );
    await queryRunner.query(
      `ALTER TABLE "cotacoes" DROP CONSTRAINT "FK_c6877b6157ba08b668c85b5ac97"`,
    );
    await queryRunner.query(`ALTER TABLE "leads" DROP CONSTRAINT "FK_502b5e6facd74f522ca707b359b"`);
    await queryRunner.query(`ALTER TABLE "leads" DROP CONSTRAINT "FK_c1bd083a5d03538d2e23015c255"`);
    await queryRunner.query(`ALTER TABLE "leads" DROP CONSTRAINT "FK_6618ae5771955eefeb3c5605a28"`);
    await queryRunner.query(
      `ALTER TABLE "oportunidades" DROP CONSTRAINT "FK_5a29d725e26c0fa6aa7fa5b7881"`,
    );
    await queryRunner.query(
      `ALTER TABLE "oportunidades" DROP CONSTRAINT "FK_21bbf91bef3ac34a19858316c17"`,
    );
    await queryRunner.query(
      `ALTER TABLE "atividades" DROP CONSTRAINT "FK_6f6cda5daa94cbf4831213f29b6"`,
    );
    await queryRunner.query(
      `ALTER TABLE "produtos" DROP CONSTRAINT "FK_afe3324a3eebac3e0cdc0c3d6ff"`,
    );
    await queryRunner.query(
      `ALTER TABLE "notifications" DROP CONSTRAINT "FK_9a8a82462cab47c73d25f49261f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "empresa_modulos" DROP CONSTRAINT "UQ_77259e6fdc8105e25f82ac00bb6"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_4c0c28c88a8ad89b2c1ba6c661"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_bd3c69926bfff8721e010e77bc"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_563dad1f6cbd1478ca0ae34845"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_450c254ac416c5207f90573259"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_e0741e7b51d90755844ae04d67"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_a4c04e78810691f77a6c4dd8e6"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_c74f605d546764c24c0d9451f0"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_60cf6cd7b6a1b7298af56b056d"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_139d3276e0a299deacb53a557d"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_c0d57c7b5bde732ac3d3ed3558"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_1162d4fe194d2e32a9ecf6ccb4"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_67862e1af92d16dfa50f4e9d18"`);
    await queryRunner.query(`DROP INDEX "public"."idx_pagamentos_empresa_id"`);
    await queryRunner.query(`DROP INDEX "public"."UQ_config_gateway_empresa_tipo_modo"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_cdcb1da9877f92375cff9b2812"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_4d7b70fba91aea5d9439fcee01"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_dced2c6050cacb6b2f6a5c2bb5"`);
    await queryRunner.query(`ALTER TABLE "canais" DROP COLUMN "webhook_secret"`);
    await queryRunner.query(`ALTER TABLE "canais" ADD "webhook_secret" character varying(255)`);
    await queryRunner.query(`ALTER TABLE "canais" DROP COLUMN "webhook_url"`);
    await queryRunner.query(`ALTER TABLE "canais" ADD "webhook_url" character varying(500)`);
    await queryRunner.query(`ALTER TABLE "canais" DROP COLUMN "status"`);
    await queryRunner.query(
      `ALTER TABLE "canais" ADD "status" character varying(30) DEFAULT 'CONFIGURANDO'`,
    );
    await queryRunner.query(`ALTER TABLE "canais" DROP COLUMN "provider"`);
    await queryRunner.query(`ALTER TABLE "canais" ADD "provider" character varying(100)`);
    await queryRunner.query(`ALTER TABLE "canais" DROP COLUMN "tipo"`);
    await queryRunner.query(`ALTER TABLE "canais" ADD "tipo" character varying(30) NOT NULL`);
    await queryRunner.query(`ALTER TABLE "canais" DROP COLUMN "nome"`);
    await queryRunner.query(`ALTER TABLE "canais" ADD "nome" character varying(100) NOT NULL`);
    await queryRunner.query(
      `ALTER TABLE "atendimento_configuracao_inatividade" ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP`,
    );
    await queryRunner.query(
      `ALTER TABLE "atendimento_configuracao_inatividade" ALTER COLUMN "created_at" SET DEFAULT CURRENT_TIMESTAMP`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "atendimento_configuracao_inatividade"."departamento_id" IS 'Departamento específico (NULL = configuração global da empresa)'`,
    );
    await queryRunner.query(
      `ALTER TABLE "atendimento_canais" ALTER COLUMN "provedor" SET DEFAULT 'whatsapp_business_api'`,
    );
    await queryRunner.query(
      `ALTER TABLE "sla_configs" ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP`,
    );
    await queryRunner.query(
      `ALTER TABLE "sla_configs" ALTER COLUMN "createdAt" SET DEFAULT CURRENT_TIMESTAMP`,
    );
    await queryRunner.query(
      `ALTER TABLE "sla_event_logs" ALTER COLUMN "createdAt" SET DEFAULT CURRENT_TIMESTAMP`,
    );
    await queryRunner.query(
      `ALTER TABLE "empresa_modulos" ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP`,
    );
    await queryRunner.query(
      `ALTER TABLE "empresa_modulos" ALTER COLUMN "created_at" SET DEFAULT CURRENT_TIMESTAMP`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "empresa_modulos"."data_expiracao" IS 'Null = sem expiração'`,
    );
    await queryRunner.query(
      `ALTER TABLE "empresa_modulos" ALTER COLUMN "data_ativacao" SET DEFAULT CURRENT_TIMESTAMP`,
    );
    await queryRunner.query(`ALTER TABLE "faturas" ALTER COLUMN "contratoId" SET NOT NULL`);
    await queryRunner.query(
      `ALTER TABLE "faturas" ADD CONSTRAINT "FK_9b8490bce74e62adb498b5ccbb6" FOREIGN KEY ("contratoId") REFERENCES "contratos"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(`ALTER TABLE "contas_pagar" DROP COLUMN "descricao"`);
    await queryRunner.query(
      `ALTER TABLE "contas_pagar" ADD "descricao" character varying(255) NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "transacoes_gateway_pagamento" ALTER COLUMN "payload_resposta" SET DEFAULT '{}'`,
    );
    await queryRunner.query(
      `ALTER TABLE "transacoes_gateway_pagamento" ALTER COLUMN "payload_resposta" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "transacoes_gateway_pagamento" ALTER COLUMN "payload_envio" SET DEFAULT '{}'`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."transacao_gateway_metodo_enum_old" AS ENUM('pix', 'cartao_credito', 'cartao_debito', 'boleto', 'link_pagamento', 'transferencia')`,
    );
    await queryRunner.query(
      `ALTER TABLE "transacoes_gateway_pagamento" ALTER COLUMN "metodo" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "transacoes_gateway_pagamento" ALTER COLUMN "metodo" TYPE "public"."transacao_gateway_metodo_enum_old" USING "metodo"::"text"::"public"."transacao_gateway_metodo_enum_old"`,
    );
    await queryRunner.query(
      `ALTER TABLE "transacoes_gateway_pagamento" ALTER COLUMN "metodo" SET DEFAULT 'pix'`,
    );
    await queryRunner.query(`DROP TYPE "public"."transacoes_gateway_pagamento_metodo_enum"`);
    await queryRunner.query(
      `ALTER TYPE "public"."transacao_gateway_metodo_enum_old" RENAME TO "transacao_gateway_metodo_enum"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."transacao_gateway_operacao_enum_old" AS ENUM('cobranca', 'estorno', 'webhook', 'validacao')`,
    );
    await queryRunner.query(
      `ALTER TABLE "transacoes_gateway_pagamento" ALTER COLUMN "tipo_operacao" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "transacoes_gateway_pagamento" ALTER COLUMN "tipo_operacao" TYPE "public"."transacao_gateway_operacao_enum_old" USING "tipo_operacao"::"text"::"public"."transacao_gateway_operacao_enum_old"`,
    );
    await queryRunner.query(
      `ALTER TABLE "transacoes_gateway_pagamento" ALTER COLUMN "tipo_operacao" SET DEFAULT 'cobranca'`,
    );
    await queryRunner.query(`DROP TYPE "public"."transacoes_gateway_pagamento_tipo_operacao_enum"`);
    await queryRunner.query(
      `ALTER TYPE "public"."transacao_gateway_operacao_enum_old" RENAME TO "transacao_gateway_operacao_enum"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."transacao_gateway_status_enum_old" AS ENUM('pendente', 'processando', 'aprovado', 'recusado', 'cancelado', 'erro')`,
    );
    await queryRunner.query(
      `ALTER TABLE "transacoes_gateway_pagamento" ALTER COLUMN "status" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "transacoes_gateway_pagamento" ALTER COLUMN "status" TYPE "public"."transacao_gateway_status_enum_old" USING "status"::"text"::"public"."transacao_gateway_status_enum_old"`,
    );
    await queryRunner.query(
      `ALTER TABLE "transacoes_gateway_pagamento" ALTER COLUMN "status" SET DEFAULT 'pendente'`,
    );
    await queryRunner.query(`DROP TYPE "public"."transacoes_gateway_pagamento_status_enum"`);
    await queryRunner.query(
      `ALTER TYPE "public"."transacao_gateway_status_enum_old" RENAME TO "transacao_gateway_status_enum"`,
    );
    await queryRunner.query(`ALTER TABLE "faturas" ALTER COLUMN "valorMulta" TYPE numeric(12,2)`);
    await queryRunner.query(`ALTER TABLE "faturas" ALTER COLUMN "valorJuros" TYPE numeric(12,2)`);
    await queryRunner.query(
      `ALTER TABLE "faturas" ALTER COLUMN "valorDesconto" TYPE numeric(12,2)`,
    );
    await queryRunner.query(`ALTER TABLE "faturas" ALTER COLUMN "valorPago" TYPE numeric(12,2)`);
    await queryRunner.query(`ALTER TABLE "faturas" ALTER COLUMN "valorTotal" TYPE numeric(12,2)`);
    await queryRunner.query(
      `ALTER TABLE "configuracoes_gateway_pagamento" ALTER COLUMN "metodos_permitidos" SET DEFAULT '[]'`,
    );
    await queryRunner.query(
      `ALTER TABLE "configuracoes_gateway_pagamento" ALTER COLUMN "credenciais" SET DEFAULT '{}'`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."config_gateway_status_enum_old" AS ENUM('ativo', 'inativo', 'erro')`,
    );
    await queryRunner.query(
      `ALTER TABLE "configuracoes_gateway_pagamento" ALTER COLUMN "status" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "configuracoes_gateway_pagamento" ALTER COLUMN "status" TYPE "public"."config_gateway_status_enum_old" USING "status"::"text"::"public"."config_gateway_status_enum_old"`,
    );
    await queryRunner.query(
      `ALTER TABLE "configuracoes_gateway_pagamento" ALTER COLUMN "status" SET DEFAULT 'inativo'`,
    );
    await queryRunner.query(`DROP TYPE "public"."configuracoes_gateway_pagamento_status_enum"`);
    await queryRunner.query(
      `ALTER TYPE "public"."config_gateway_status_enum_old" RENAME TO "config_gateway_status_enum"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."config_gateway_modo_enum_old" AS ENUM('sandbox', 'producao')`,
    );
    await queryRunner.query(
      `ALTER TABLE "configuracoes_gateway_pagamento" ALTER COLUMN "modo_operacao" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "configuracoes_gateway_pagamento" ALTER COLUMN "modo_operacao" TYPE "public"."config_gateway_modo_enum_old" USING "modo_operacao"::"text"::"public"."config_gateway_modo_enum_old"`,
    );
    await queryRunner.query(
      `ALTER TABLE "configuracoes_gateway_pagamento" ALTER COLUMN "modo_operacao" SET DEFAULT 'sandbox'`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."configuracoes_gateway_pagamento_modo_operacao_enum"`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."config_gateway_modo_enum_old" RENAME TO "config_gateway_modo_enum"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."config_gateway_gateway_enum_old" AS ENUM('mercado_pago', 'stripe', 'pagseguro')`,
    );
    await queryRunner.query(
      `ALTER TABLE "configuracoes_gateway_pagamento" ALTER COLUMN "gateway" TYPE "public"."config_gateway_gateway_enum_old" USING "gateway"::"text"::"public"."config_gateway_gateway_enum_old"`,
    );
    await queryRunner.query(`DROP TYPE "public"."configuracoes_gateway_pagamento_gateway_enum"`);
    await queryRunner.query(
      `ALTER TYPE "public"."config_gateway_gateway_enum_old" RENAME TO "config_gateway_gateway_enum"`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_config_gateway_empresa_tipo_modo" ON "configuracoes_gateway_pagamento" ("empresa_id", "gateway", "modo_operacao") `,
    );
    await queryRunner.query(
      `ALTER TABLE "triagem_logs" ALTER COLUMN "created_at" SET DEFAULT CURRENT_TIMESTAMP`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "atendimento_tickets"."departamento_id" IS 'Departamento responsável pelo atendimento'`,
    );
    await queryRunner.query(
      `ALTER TABLE "tags" ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP`,
    );
    await queryRunner.query(
      `ALTER TABLE "tags" ALTER COLUMN "createdAt" SET DEFAULT CURRENT_TIMESTAMP`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "tags"."empresaId" IS 'ID da empresa (multi-tenant)'`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "tags"."cor" IS 'Cor em formato hexadecimal #RRGGBB'`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "filas"."configuracoes" IS 'Configurações adicionais (tempoMaximoEspera, prioridadePadrao, notificarAposMinutos)'`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "filas"."distribuicao_automatica" IS 'Se true, tickets são distribuídos automaticamente'`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "filas"."capacidade_maxima" IS 'Capacidade máxima de tickets por atendente'`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "filas"."estrategia_distribuicao" IS 'Estratégia de distribuição de tickets'`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."estrategia_distribuicao_enum_old" AS ENUM('ROUND_ROBIN', 'MENOR_CARGA', 'PRIORIDADE')`,
    );
    await queryRunner.query(
      `ALTER TABLE "filas" ALTER COLUMN "estrategia_distribuicao" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "filas" ALTER COLUMN "estrategia_distribuicao" TYPE "public"."estrategia_distribuicao_enum_old" USING "estrategia_distribuicao"::"text"::"public"."estrategia_distribuicao_enum_old"`,
    );
    await queryRunner.query(
      `ALTER TABLE "filas" ALTER COLUMN "estrategia_distribuicao" SET DEFAULT 'ROUND_ROBIN'`,
    );
    await queryRunner.query(`DROP TYPE "public"."filas_estrategia_distribuicao_enum"`);
    await queryRunner.query(
      `ALTER TYPE "public"."estrategia_distribuicao_enum_old" RENAME TO "estrategia_distribuicao_enum"`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "filas_atendentes"."ativo" IS 'Se atendente está ativo nesta fila'`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "filas_atendentes"."prioridade" IS 'Prioridade do atendente nesta fila (1=alta, 10=baixa)'`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "filas_atendentes"."capacidade" IS 'Capacidade do atendente nesta fila específica (1-50)'`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "filas_atendentes"."atendenteId" IS 'ID do atendente (User)'`,
    );
    await queryRunner.query(`COMMENT ON COLUMN "filas_atendentes"."filaId" IS 'ID da fila'`);
    await queryRunner.query(
      `ALTER TABLE "fluxos_triagem" ALTER COLUMN "versao_atual" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "fluxos_triagem" ALTER COLUMN "historico_versoes" DROP NOT NULL`,
    );
    await queryRunner.query(`ALTER TABLE "itens_cotacao" ALTER COLUMN "valorTotal" DROP DEFAULT`);
    await queryRunner.query(
      `CREATE TYPE "public"."cotacoes_status_enum_old" AS ENUM('rascunho', 'enviada', 'em_analise', 'aprovada', 'rejeitada', 'vencida', 'convertida', 'cancelada')`,
    );
    await queryRunner.query(`ALTER TABLE "cotacoes" ALTER COLUMN "status" DROP DEFAULT`);
    await queryRunner.query(
      `ALTER TABLE "cotacoes" ALTER COLUMN "status" TYPE "public"."cotacoes_status_enum_old" USING "status"::"text"::"public"."cotacoes_status_enum_old"`,
    );
    await queryRunner.query(`ALTER TABLE "cotacoes" ALTER COLUMN "status" SET DEFAULT 'rascunho'`);
    await queryRunner.query(`DROP TYPE "public"."cotacoes_status_enum"`);
    await queryRunner.query(
      `ALTER TYPE "public"."cotacoes_status_enum_old" RENAME TO "cotacoes_status_enum"`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "fornecedores"."cnpj_cpf" IS 'CNPJ ou CPF do fornecedor (formatado)'`,
    );
    await queryRunner.query(`ALTER TABLE "leads" DROP COLUMN "origem"`);
    await queryRunner.query(
      `CREATE TYPE "public"."leads_origem_enum" AS ENUM('site', 'formulario', 'telefone', 'email', 'chat', 'indicacao', 'outros')`,
    );
    await queryRunner.query(`ALTER TABLE "leads" ADD "origem" "public"."leads_origem_enum"`);
    await queryRunner.query(`ALTER TABLE "leads" DROP COLUMN "status"`);
    await queryRunner.query(
      `CREATE TYPE "public"."leads_status_enum" AS ENUM('novo', 'contatado', 'qualificado', 'convertido', 'perdido')`,
    );
    await queryRunner.query(
      `ALTER TABLE "leads" ADD "status" "public"."leads_status_enum" NOT NULL DEFAULT 'novo'`,
    );
    await queryRunner.query(`ALTER TABLE "faturas" DROP COLUMN "atualizadoPor"`);
    await queryRunner.query(`ALTER TABLE "faturas" DROP COLUMN "criadoPor"`);
    await queryRunner.query(`ALTER TABLE "faturas" DROP COLUMN "empresa_id"`);
    await queryRunner.query(
      `ALTER TABLE "ticket_tags" ADD "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP`,
    );
    await queryRunner.query(`ALTER TABLE "faturas" ADD "empresa_id" uuid NOT NULL`);
    await queryRunner.query(`ALTER TABLE "faturas" ADD "atualizadoPor" uuid`);
    await queryRunner.query(`ALTER TABLE "faturas" ADD "criadoPor" uuid`);
    await queryRunner.query(`DROP TABLE "equipes"`);
    await queryRunner.query(`DROP TABLE "atendente_equipes"`);
    await queryRunner.query(`DROP TABLE "equipe_atribuicoes"`);
    await queryRunner.query(
      `ALTER TABLE "produtos" ADD CONSTRAINT "UQ_produtos_empresa_sku" UNIQUE ("sku", "empresa_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_TICKET_TAGS_COMPOSITE" ON "ticket_tags" ("ticketId", "tagId") `,
    );
    await queryRunner.query(`CREATE INDEX "IDX_TICKET_TAGS_TICKET" ON "ticket_tags" ("ticketId") `);
    await queryRunner.query(`CREATE INDEX "IDX_TICKET_TAGS_TAG" ON "ticket_tags" ("tagId") `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_configuracao_inatividade_empresa_departamento" ON "atendimento_configuracao_inatividade" ("empresa_id", "departamento_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_configuracao_inatividade_ativo" ON "atendimento_configuracao_inatividade" ("ativo") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_MESSAGE_TEMPLATES_CATEGORIA" ON "message_templates" ("categoria") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_MESSAGE_TEMPLATES_ATALHO" ON "message_templates" ("atalho") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_MESSAGE_TEMPLATES_ATIVO" ON "message_templates" ("ativo") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_MESSAGE_TEMPLATES_EMPRESA" ON "message_templates" ("empresaId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_SLA_CONFIG_EMPRESA_PRIORIDADE" ON "sla_configs" ("prioridade", "canal", "ativo", "empresaId") `,
    );
    await queryRunner.query(`CREATE INDEX "IDX_SLA_CONFIG_ATIVO" ON "sla_configs" ("ativo") `);
    await queryRunner.query(
      `CREATE INDEX "IDX_SLA_CONFIG_PRIORIDADE" ON "sla_configs" ("prioridade") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_SLA_CONFIG_EMPRESA" ON "sla_configs" ("empresaId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_SLA_LOG_EMPRESA" ON "sla_event_logs" ("empresaId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_SLA_LOG_CREATED_AT" ON "sla_event_logs" ("createdAt") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_SLA_LOG_TIPO_EVENTO" ON "sla_event_logs" ("tipoEvento") `,
    );
    await queryRunner.query(`CREATE INDEX "IDX_SLA_LOG_STATUS" ON "sla_event_logs" ("status") `);
    await queryRunner.query(`CREATE INDEX "IDX_SLA_LOG_TICKET" ON "sla_event_logs" ("ticketId") `);
    await queryRunner.query(
      `CREATE INDEX "IDX_password_reset_tokens_user_id" ON "password_reset_tokens" ("user_id") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_password_reset_tokens_token_hash" ON "password_reset_tokens" ("token_hash") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_empresa_modulos_ativo" ON "empresa_modulos" ("empresa_id", "ativo") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_empresa_modulos_empresa_id" ON "empresa_modulos" ("empresa_id") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "idx_empresa_modulo_unique" ON "empresa_modulos" ("empresa_id", "modulo") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_transacoes_gateway_pagamento" ON "transacoes_gateway_pagamento" ("pagamento_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_transacoes_gateway_fatura" ON "transacoes_gateway_pagamento" ("fatura_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_transacoes_gateway_config" ON "transacoes_gateway_pagamento" ("configuracao_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_450c254ac416c5207f90573259" ON "faturas" ("clienteId", "status") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_e0741e7b51d90755844ae04d67" ON "faturas" ("dataVencimento", "status") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_a4c04e78810691f77a6c4dd8e6" ON "faturas" ("numero") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_c74f605d546764c24c0d9451f0" ON "faturas" ("createdAt") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_60cf6cd7b6a1b7298af56b056d" ON "faturas" ("ativo") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_139d3276e0a299deacb53a557d" ON "faturas" ("dataVencimento") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_c0d57c7b5bde732ac3d3ed3558" ON "faturas" ("dataEmissao") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_1162d4fe194d2e32a9ecf6ccb4" ON "faturas" ("status") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_67862e1af92d16dfa50f4e9d18" ON "faturas" ("clienteId") `,
    );
    await queryRunner.query(`CREATE INDEX "IDX_faturas_empresa_id" ON "faturas" ("empresa_id") `);
    await queryRunner.query(
      `CREATE INDEX "IDX_pagamentos_empresa_id" ON "pagamentos" ("empresa_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_contratos_empresa_id" ON "contratos" ("empresa_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ticket_departamento" ON "atendimento_tickets" ("departamento_id") `,
    );
    await queryRunner.query(`CREATE INDEX "IDX_TAGS_EMPRESA" ON "tags" ("empresaId") `);
    await queryRunner.query(`CREATE INDEX "IDX_TAGS_ATIVO" ON "tags" ("ativo") `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_TAGS_NOME_EMPRESA" ON "tags" ("nome", "empresaId") `,
    );
    await queryRunner.query(`CREATE INDEX "IDX_TAGS_NOME" ON "tags" ("nome") `);
    await queryRunner.query(
      `CREATE INDEX "IDX_filas_atendentes_atendenteId" ON "filas_atendentes" ("atendenteId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_filas_atendentes_filaId" ON "filas_atendentes" ("filaId") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_filas_atendentes_fila_atendente" ON "filas_atendentes" ("filaId", "atendenteId") `,
    );
    await queryRunner.query(`CREATE INDEX "IDX_leads_created_at" ON "leads" ("created_at") `);
    await queryRunner.query(
      `CREATE INDEX "IDX_leads_responsavel_id" ON "leads" ("responsavel_id") `,
    );
    await queryRunner.query(`CREATE INDEX "IDX_leads_status" ON "leads" ("status") `);
    await queryRunner.query(`CREATE INDEX "IDX_leads_empresa_id" ON "leads" ("empresa_id") `);
    await queryRunner.query(
      `CREATE INDEX "IDX_oportunidades_empresa_estagio" ON "oportunidades" ("estagio", "empresa_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_oportunidades_empresa_id" ON "oportunidades" ("empresa_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_atividades_empresa_id" ON "atividades" ("empresa_id") `,
    );
    await queryRunner.query(`CREATE INDEX "IDX_produtos_empresa_id" ON "produtos" ("empresa_id") `);
    await queryRunner.query(
      `CREATE INDEX "IDX_notifications_user_unread" ON "notifications" ("user_id", "read") WHERE (read = false)`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_notifications_created_at" ON "notifications" ("created_at") `,
    );
    await queryRunner.query(`CREATE INDEX "IDX_notifications_read" ON "notifications" ("read") `);
    await queryRunner.query(
      `CREATE INDEX "IDX_notifications_user_id" ON "notifications" ("user_id") `,
    );
    await queryRunner.query(
      `ALTER TABLE "ticket_tags" ADD CONSTRAINT "FK_TICKET_TAGS_TICKET" FOREIGN KEY ("ticketId") REFERENCES "atendimento_tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "ticket_tags" ADD CONSTRAINT "FK_TICKET_TAGS_TAG" FOREIGN KEY ("tagId") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "atendimento_configuracao_inatividade" ADD CONSTRAINT "FK_configuracao_inatividade_departamento" FOREIGN KEY ("departamento_id") REFERENCES "departamentos"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "distribuicao_log" ADD CONSTRAINT "FK_f9e61fcb5a74c76ddb93e2d04c5" FOREIGN KEY ("atendenteId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "distribuicao_log" ADD CONSTRAINT "FK_380a8c5c105b3cc1b6018baee94" FOREIGN KEY ("filaId") REFERENCES "filas"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "distribuicao_config" ADD CONSTRAINT "FK_544fd99a976c9ad31371a00d1c7" FOREIGN KEY ("filaBackupId") REFERENCES "filas"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "FK_password_reset_tokens_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "empresa_modulos" ADD CONSTRAINT "fk_empresa_modulos_empresa" FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "transacoes_gateway_pagamento" ADD CONSTRAINT "FK_transacoes_gateway_empresa" FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "transacoes_gateway_pagamento" ADD CONSTRAINT "FK_transacoes_gateway_config" FOREIGN KEY ("configuracao_id") REFERENCES "configuracoes_gateway_pagamento"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "transacoes_gateway_pagamento" ADD CONSTRAINT "FK_transacoes_gateway_fatura" FOREIGN KEY ("fatura_id") REFERENCES "faturas"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "transacoes_gateway_pagamento" ADD CONSTRAINT "FK_transacoes_gateway_pagamento" FOREIGN KEY ("pagamento_id") REFERENCES "pagamentos"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "faturas" ADD CONSTRAINT "FK_faturas_empresa" FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "pagamentos" ADD CONSTRAINT "FK_pagamentos_empresa" FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "contratos" ADD CONSTRAINT "FK_contratos_empresa" FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "configuracoes_gateway_pagamento" ADD CONSTRAINT "FK_config_gateway_empresa" FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "atendimento_tickets" ADD CONSTRAINT "FK_ticket_departamento" FOREIGN KEY ("departamento_id") REFERENCES "departamentos"("id") ON DELETE SET NULL ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "filas" ADD CONSTRAINT "FK_filas_nucleo" FOREIGN KEY ("nucleoId") REFERENCES "nucleos_atendimento"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "filas" ADD CONSTRAINT "FK_filas_departamento" FOREIGN KEY ("departamentoId") REFERENCES "departamentos"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "filas_atendentes" ADD CONSTRAINT "FK_filas_atendentes_fila" FOREIGN KEY ("filaId") REFERENCES "filas"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "filas_atendentes" ADD CONSTRAINT "FK_filas_atendentes_user" FOREIGN KEY ("atendenteId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "cotacoes" ADD CONSTRAINT "fk_cotacoes_aprovador" FOREIGN KEY ("aprovador_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "leads" ADD CONSTRAINT "FK_leads_empresa" FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "leads" ADD CONSTRAINT "FK_leads_responsavel" FOREIGN KEY ("responsavel_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "leads" ADD CONSTRAINT "FK_leads_oportunidade" FOREIGN KEY ("oportunidade_id") REFERENCES "oportunidades"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "oportunidades" ADD CONSTRAINT "FK_oportunidades_cliente" FOREIGN KEY ("cliente_id") REFERENCES "clientes"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "oportunidades" ADD CONSTRAINT "FK_oportunidades_empresa" FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "atividades" ADD CONSTRAINT "FK_atividades_empresa" FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "produtos" ADD CONSTRAINT "FK_produtos_empresa" FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "notifications" ADD CONSTRAINT "FK_9a8a82462cab47c73d25f49261f" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }
}
