import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddOportunidadeIdToPropostas1764685747623 implements MigrationInterface {
  name = 'AddOportunidadeIdToPropostas1764685747623';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Esta migration legacy derrubava e recriava dezenas de constraints/índices, o que não é
    // mais seguro para os ambientes atuais. Ela passa a atuar apenas como marcador de versão,
    // permitindo que as migrations seguintes (especialmente 1775100000000) sejam executadas.

    const hasEquipes = await queryRunner.hasTable('equipes');
    const hasAtendenteEquipes = await queryRunner.hasTable('atendente_equipes');
    const hasEquipeAtribuicoes = await queryRunner.hasTable('equipe_atribuicoes');

    if (hasEquipes && hasAtendenteEquipes && hasEquipeAtribuicoes) {
      console.log(
        'ℹ️  AddOportunidadeIdToPropostas1764685747623 já aplicada anteriormente. Sem alterações.',
      );
      return;
    }

    console.log(
      '⚠️  Estrutura de equipes não encontrada. Esta migration legacy foi desativada por segurança.',
    );
    console.log(
      '⚠️  Gere uma nova migration específica para criar as tabelas necessárias e executar novamente.',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "oportunidades" DROP CONSTRAINT "FK_21bbf91bef3ac34a19858316c17"`,
    );
    await queryRunner.query(
      `ALTER TABLE "faturas" DROP CONSTRAINT "FK_644bf709a39af5c760b98e56a06"`,
    );
    await queryRunner.query(
      `ALTER TABLE "faturas" DROP CONSTRAINT "FK_9b8490bce74e62adb498b5ccbb6"`,
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
    await queryRunner.query(`DROP INDEX "public"."IDX_450c254ac416c5207f90573259"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_e0741e7b51d90755844ae04d67"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_a4c04e78810691f77a6c4dd8e6"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_c74f605d546764c24c0d9451f0"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_60cf6cd7b6a1b7298af56b056d"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_139d3276e0a299deacb53a557d"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_c0d57c7b5bde732ac3d3ed3558"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_1162d4fe194d2e32a9ecf6ccb4"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_67862e1af92d16dfa50f4e9d18"`);
    await queryRunner.query(
      `ALTER TABLE "atendimento_canais" ALTER COLUMN "provedor" SET DEFAULT 'whatsapp_business_api'`,
    );
    await queryRunner.query(`ALTER TABLE "metas" ALTER COLUMN "valor" SET DEFAULT '0'`);
    await queryRunner.query(
      `ALTER TABLE "transacoes_gateway_pagamento" ALTER COLUMN "payload_resposta" SET DEFAULT '{}'`,
    );
    await queryRunner.query(
      `ALTER TABLE "transacoes_gateway_pagamento" ALTER COLUMN "payload_envio" SET DEFAULT '{}'`,
    );
    await queryRunner.query(`ALTER TABLE "faturas" ALTER COLUMN "valorMulta" TYPE numeric(12,2)`);
    await queryRunner.query(`ALTER TABLE "faturas" ALTER COLUMN "valorJuros" TYPE numeric(12,2)`);
    await queryRunner.query(
      `ALTER TABLE "faturas" ALTER COLUMN "valorDesconto" TYPE numeric(12,2)`,
    );
    await queryRunner.query(`ALTER TABLE "faturas" ALTER COLUMN "valorPago" TYPE numeric(12,2)`);
    await queryRunner.query(`ALTER TABLE "faturas" ALTER COLUMN "valorTotal" TYPE numeric(12,2)`);
    await queryRunner.query(`ALTER TABLE "faturas" ALTER COLUMN "contratoId" DROP NOT NULL`);
    await queryRunner.query(
      `ALTER TABLE "faturas" ADD CONSTRAINT "FK_9b8490bce74e62adb498b5ccbb6" FOREIGN KEY ("contratoId") REFERENCES "contratos"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "configuracoes_gateway_pagamento" ALTER COLUMN "metodos_permitidos" SET DEFAULT '[]'`,
    );
    await queryRunner.query(
      `ALTER TABLE "configuracoes_gateway_pagamento" ALTER COLUMN "credenciais" SET DEFAULT '{}'`,
    );
    await queryRunner.query(`ALTER TABLE "empresas" ALTER COLUMN "health_score" DROP NOT NULL`);
    await queryRunner.query(`ALTER TABLE "empresas" ALTER COLUMN "usuarios_ativos" DROP NOT NULL`);
    await queryRunner.query(`ALTER TABLE "empresas" ALTER COLUMN "valor_mensal" DROP NOT NULL`);
    await queryRunner.query(`ALTER TABLE "empresas" ALTER COLUMN "status" DROP NOT NULL`);
    await queryRunner.query(`ALTER TABLE "faturas" DROP COLUMN "atualizadoPor"`);
    await queryRunner.query(`ALTER TABLE "faturas" DROP COLUMN "criadoPor"`);
    await queryRunner.query(`ALTER TABLE "faturas" DROP COLUMN "empresa_id"`);
    await queryRunner.query(`ALTER TABLE "faturas" ADD "empresa_id" uuid NOT NULL`);
    await queryRunner.query(
      `ALTER TABLE "oportunidades" ADD "dias_no_estagio_atual" integer DEFAULT '0'`,
    );
    await queryRunner.query(
      `ALTER TABLE "oportunidades" ADD "data_ultima_mudanca_estagio" TIMESTAMP DEFAULT now()`,
    );
    await queryRunner.query(`ALTER TABLE "oportunidades" ADD "data_revisao" TIMESTAMP`);
    await queryRunner.query(
      `ALTER TABLE "oportunidades" ADD "concorrente_nome" character varying(100)`,
    );
    await queryRunner.query(
      `ALTER TABLE "oportunidades" ADD "precisa_atencao" boolean DEFAULT false`,
    );
    await queryRunner.query(`ALTER TABLE "oportunidades" ADD "motivo_perda_detalhes" text`);
    await queryRunner.query(
      `CREATE TYPE "public"."oportunidades_motivo_perda_enum" AS ENUM('preco', 'concorrente', 'timing', 'orcamento', 'produto', 'projeto_cancelado', 'sem_resposta', 'outro')`,
    );
    await queryRunner.query(
      `ALTER TABLE "oportunidades" ADD "motivo_perda" "public"."oportunidades_motivo_perda_enum"`,
    );
    await queryRunner.query(`ALTER TABLE "faturas" ADD "criadoPor" uuid`);
    await queryRunner.query(`ALTER TABLE "faturas" ADD "atualizadoPor" uuid`);
    await queryRunner.query(`DROP TABLE "equipes"`);
    await queryRunner.query(`DROP TABLE "atendente_equipes"`);
    await queryRunner.query(`DROP TABLE "equipe_atribuicoes"`);
    await queryRunner.query(
      `ALTER TABLE "produtos" ADD CONSTRAINT "UQ_produtos_empresa_sku" UNIQUE ("sku", "empresa_id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "empresas" ADD CONSTRAINT "empresas_status_check" CHECK (((status)::text = ANY ((ARRAY['trial'::character varying, 'active'::character varying, 'suspended'::character varying, 'cancelled'::character varying, 'past_due'::character varying])::text[])))`,
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
      `CREATE INDEX "IDX_atendimento_mensagens_created_at" ON "atendimento_mensagens" ("created_at") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_atendimento_mensagens_ticket_id" ON "atendimento_mensagens" ("ticket_id") `,
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
      `CREATE INDEX "IDX_SLA_LOG_CREATED_AT" ON "sla_event_logs" ("createdAt") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_SLA_LOG_TIPO_EVENTO" ON "sla_event_logs" ("tipoEvento") `,
    );
    await queryRunner.query(`CREATE INDEX "IDX_SLA_LOG_STATUS" ON "sla_event_logs" ("status") `);
    await queryRunner.query(`CREATE INDEX "IDX_SLA_LOG_TICKET" ON "sla_event_logs" ("ticketId") `);
    await queryRunner.query(
      `CREATE INDEX "IDX_SLA_LOG_EMPRESA" ON "sla_event_logs" ("empresaId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_password_reset_tokens_user_id" ON "password_reset_tokens" ("user_id") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_password_reset_tokens_token_hash" ON "password_reset_tokens" ("token_hash") `,
    );
    await queryRunner.query(`CREATE INDEX "IDX_contatos_cliente_id" ON "contatos" ("clienteId") `);
    await queryRunner.query(
      `CREATE INDEX "idx_empresa_modulos_ativo" ON "empresa_modulos" ("empresa_id", "ativo") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_empresa_modulos_empresa_id" ON "empresa_modulos" ("empresa_id") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "idx_empresa_modulo_unique" ON "empresa_modulos" ("empresa_id", "modulo") `,
    );
    await queryRunner.query(`CREATE INDEX "IDX_leads_created_at" ON "leads" ("created_at") `);
    await queryRunner.query(
      `CREATE INDEX "IDX_leads_responsavel_id" ON "leads" ("responsavel_id") `,
    );
    await queryRunner.query(`CREATE INDEX "IDX_leads_status" ON "leads" ("status") `);
    await queryRunner.query(`CREATE INDEX "IDX_leads_empresa_id" ON "leads" ("empresa_id") `);
    await queryRunner.query(
      `CREATE INDEX "IDX_metas_ativos" ON "metas" ("ativa") WHERE (ativa = true)`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_metas_empresa_periodo" ON "metas" ("periodo", "empresa_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_metas_periodo_tipo" ON "metas" ("tipo", "periodo") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_oportunidades_dias_estagio" ON "oportunidades" ("estagio", "dias_no_estagio_atual") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_oportunidades_precisa_atencao" ON "oportunidades" ("precisa_atencao") WHERE (precisa_atencao = true)`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_oportunidades_motivo_perda" ON "oportunidades" ("motivo_perda") WHERE (motivo_perda IS NOT NULL)`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_oportunidades_empresa_id" ON "oportunidades" ("empresa_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_oportunidades_empresa_estagio_created" ON "oportunidades" ("estagio", "empresa_id", "createdAt") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_oportunidades_created_at" ON "oportunidades" ("createdAt") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_oportunidades_empresa_estagio" ON "oportunidades" ("estagio", "empresa_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_atividades_empresa_id" ON "atividades" ("empresa_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_atividades_oportunidade_id" ON "atividades" ("oportunidade_id") `,
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
      `CREATE INDEX "IDX_faturas_empresa_status_vencimento" ON "faturas" ("dataVencimento", "status", "empresa_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_faturas_vencimento" ON "faturas" ("dataVencimento") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_faturas_empresa_status" ON "faturas" ("status", "empresa_id") `,
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
    await queryRunner.query(
      `CREATE INDEX "IDX_pagamentos_empresa_id" ON "pagamentos" ("empresa_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_itens_fatura_fatura_id" ON "itens_fatura" ("faturaId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_clientes_empresa_ativo_created" ON "clientes" ("empresa_id", "ativo", "created_at") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_clientes_empresa_ativo" ON "clientes" ("empresa_id", "ativo") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_contratos_empresa_id" ON "contratos" ("empresa_id") `,
    );
    await queryRunner.query(`CREATE INDEX "IDX_produtos_status" ON "produtos" ("status") `);
    await queryRunner.query(`CREATE INDEX "IDX_produtos_empresa_id" ON "produtos" ("empresa_id") `);
    await queryRunner.query(
      `CREATE INDEX "IDX_atendimento_tickets_priority" ON "atendimento_tickets" ("prioridade") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_atendimento_tickets_empresa_status_priority" ON "atendimento_tickets" ("status", "prioridade", "empresa_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_atendimento_tickets_created_at" ON "atendimento_tickets" ("created_at") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_atendimento_tickets_empresa_status" ON "atendimento_tickets" ("status", "empresa_id") `,
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
    await queryRunner.query(`CREATE INDEX "IDX_users_ativo" ON "users" ("ativo") `);
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
      `ALTER TABLE "atendimento_demandas" ADD CONSTRAINT "FK_38d6f6cb4a5f9cca287be7e4b50" FOREIGN KEY ("autor_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "FK_password_reset_tokens_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "empresa_modulos" ADD CONSTRAINT "fk_empresa_modulos_empresa" FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "faturas" ADD CONSTRAINT "FK_644bf709a39af5c760b98e56a06" FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
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
      `ALTER TABLE "oportunidades" ADD CONSTRAINT "FK_oportunidades_empresa" FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "oportunidades" ADD CONSTRAINT "FK_oportunidades_cliente" FOREIGN KEY ("cliente_id") REFERENCES "clientes"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "atividades" ADD CONSTRAINT "FK_atividades_empresa" FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
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
      `ALTER TABLE "pagamentos" ADD CONSTRAINT "FK_pagamentos_empresa" FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "contratos" ADD CONSTRAINT "FK_contratos_empresa" FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "configuracoes_gateway_pagamento" ADD CONSTRAINT "FK_config_gateway_empresa" FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "produtos" ADD CONSTRAINT "FK_produtos_empresa" FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "triagem_logs" ADD CONSTRAINT "fk_triagem_logs_sessao" FOREIGN KEY ("sessao_id") REFERENCES "sessoes_triagem"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "triagem_logs" ADD CONSTRAINT "fk_triagem_logs_fluxo" FOREIGN KEY ("fluxo_id") REFERENCES "fluxos_triagem"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
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
      `ALTER TABLE "departamentos" ADD CONSTRAINT "fk_departamentos_nucleo" FOREIGN KEY ("nucleo_id") REFERENCES "nucleos_atendimento"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "filas_atendentes" ADD CONSTRAINT "FK_filas_atendentes_fila" FOREIGN KEY ("filaId") REFERENCES "filas"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "filas_atendentes" ADD CONSTRAINT "FK_filas_atendentes_user" FOREIGN KEY ("atendenteId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
  }
}
