import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddHistoricoVersoes1761582305362 implements MigrationInterface {
  name = 'AddHistoricoVersoes1761582305362';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const itensFaturaExists = await queryRunner.hasTable('itens_fatura');
    const pagamentosExists = await queryRunner.hasTable('pagamentos');
    const faturasExists = await queryRunner.hasTable('faturas');
    const contasPagarExists = await queryRunner.hasTable('contas_pagar');
    const atendimentoMensagensExists = await queryRunner.hasTable('atendimento_mensagens');
    const atendimentoNotasClienteExists = await queryRunner.hasTable('atendimento_notas_cliente');
    const atendimentoIntegracoesExists = await queryRunner.hasTable(
      'atendimento_integracoes_config',
    );
    const filasExists = await queryRunner.hasTable('filas');
    const atendentesExists = await queryRunner.hasTable('atendentes');
    const atendimentoCanaisExists = await queryRunner.hasTable('atendimento_canais');
    const atendimentoDemandasExists = await queryRunner.hasTable('atendimento_demandas');
    const canaisExists = await queryRunner.hasTable('canais');
    const fornecedoresExists = await queryRunner.hasTable('fornecedores');

    await queryRunner.query(
      `ALTER TABLE "contatos" DROP CONSTRAINT IF EXISTS "fk_contatos_cliente"`,
    );
    await queryRunner.query(
      `ALTER TABLE "fluxos_triagem" DROP CONSTRAINT IF EXISTS "fk_fluxo_empresa"`,
    );
    await queryRunner.query(
      `ALTER TABLE "nucleos_atendimento" DROP CONSTRAINT IF EXISTS "fk_nucleo_empresa"`,
    );
    await queryRunner.query(
      `ALTER TABLE "nucleos_atendimento" DROP CONSTRAINT IF EXISTS "fk_nucleo_supervisor"`,
    );
    await queryRunner.query(
      `ALTER TABLE "atendimento_tickets" DROP CONSTRAINT IF EXISTS "fk_atendimento_tickets_empresa"`,
    );
    await queryRunner.query(
      `ALTER TABLE "atendimento_tickets" DROP CONSTRAINT IF EXISTS "fk_atendimento_tickets_canal"`,
    );
    await queryRunner.query(
      `ALTER TABLE "atendimento_tickets" DROP CONSTRAINT IF EXISTS "fk_atendimento_tickets_fila"`,
    );
    await queryRunner.query(
      `ALTER TABLE "atendimento_tickets" DROP CONSTRAINT IF EXISTS "fk_atendimento_tickets_atendente"`,
    );
    // Dropar constraints da sessoes_triagem - com IF EXISTS para evitar erros
    await queryRunner.query(
      `ALTER TABLE "sessoes_triagem" DROP CONSTRAINT IF EXISTS "fk_sessao_empresa"`,
    );
    await queryRunner.query(
      `ALTER TABLE "sessoes_triagem" DROP CONSTRAINT IF EXISTS "fk_sessao_fluxo"`,
    );
    await queryRunner.query(
      `ALTER TABLE "sessoes_triagem" DROP CONSTRAINT IF EXISTS "fk_sessao_ticket"`,
    );
    await queryRunner.query(
      `ALTER TABLE "sessoes_triagem" DROP CONSTRAINT IF EXISTS "fk_sessao_nucleo"`,
    );
    await queryRunner.query(
      `ALTER TABLE "sessoes_triagem" DROP CONSTRAINT IF EXISTS "FK_0a356ee00ac545a9274ca367a70"`,
    );
    await queryRunner.query(
      `ALTER TABLE "sessoes_triagem" DROP CONSTRAINT IF EXISTS "FK_46125a5e80b2058ff72922f1ed4"`,
    );
    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1
          FROM information_schema.tables
          WHERE table_schema = 'public'
            AND table_name = 'user_activities'
        ) THEN
          ALTER TABLE "user_activities" DROP CONSTRAINT IF EXISTS "user_activities_usuario_id_fkey";
        END IF;
      END
      $$;
    `);
    await queryRunner.query(
      `ALTER TABLE "departamentos" DROP CONSTRAINT IF EXISTS "fk_departamentos_empresa"`,
    );
    await queryRunner.query(
      `ALTER TABLE "departamentos" DROP CONSTRAINT IF EXISTS "fk_departamentos_nucleo"`,
    );
    await queryRunner.query(
      `ALTER TABLE "departamentos" DROP CONSTRAINT IF EXISTS "fk_departamentos_supervisor"`,
    );
    await queryRunner.query(
      `ALTER TABLE "equipe_atribuicoes" DROP CONSTRAINT IF EXISTS "fk_equipe_atribuicoes_equipe"`,
    );
    await queryRunner.query(
      `ALTER TABLE "equipe_atribuicoes" DROP CONSTRAINT IF EXISTS "fk_equipe_atribuicoes_nucleo"`,
    );
    await queryRunner.query(
      `ALTER TABLE "equipe_atribuicoes" DROP CONSTRAINT IF EXISTS "fk_equipe_atribuicoes_departamento"`,
    );
    await queryRunner.query(
      `ALTER TABLE "atendente_equipes" DROP CONSTRAINT IF EXISTS "fk_atendente_equipes_atendente"`,
    );
    await queryRunner.query(
      `ALTER TABLE "atendente_equipes" DROP CONSTRAINT IF EXISTS "fk_atendente_equipes_equipe"`,
    );
    await queryRunner.query(`ALTER TABLE "equipes" DROP CONSTRAINT IF EXISTS "fk_equipes_empresa"`);
    await queryRunner.query(
      `ALTER TABLE "atendente_atribuicoes" DROP CONSTRAINT IF EXISTS "fk_atendente_atribuicoes_atendente"`,
    );
    await queryRunner.query(
      `ALTER TABLE "atendente_atribuicoes" DROP CONSTRAINT IF EXISTS "fk_atendente_atribuicoes_nucleo"`,
    );
    await queryRunner.query(
      `ALTER TABLE "atendente_atribuicoes" DROP CONSTRAINT IF EXISTS "fk_atendente_atribuicoes_departamento"`,
    );
    await queryRunner.query(
      `ALTER TABLE "contratos" DROP CONSTRAINT IF EXISTS "FK_contratos_proposta"`,
    );
    if (itensFaturaExists) {
      await queryRunner.query(
        `ALTER TABLE "itens_fatura" DROP CONSTRAINT IF EXISTS "itens_fatura_faturaId_fkey"`,
      );
    }
    if (pagamentosExists) {
      await queryRunner.query(
        `ALTER TABLE "pagamentos" DROP CONSTRAINT IF EXISTS "fk_pagamentos_fatura"`,
      );
    }
    if (faturasExists) {
      await queryRunner.query(
        `ALTER TABLE "faturas" DROP CONSTRAINT IF EXISTS "faturas_clienteid_fkey"`,
      );
    }
    if (contasPagarExists) {
      await queryRunner.query(
        `ALTER TABLE "contas_pagar" DROP CONSTRAINT IF EXISTS "fk_contas_pagar_conta_bancaria"`,
      );
    }
    if (atendimentoMensagensExists) {
      await queryRunner.query(
        `ALTER TABLE "atendimento_mensagens" DROP CONSTRAINT IF EXISTS "fk_atendimento_mensagens_ticket"`,
      );
      await queryRunner.query(
        `ALTER TABLE "atendimento_mensagens" DROP CONSTRAINT IF EXISTS "fk_atendimento_mensagens_atendente"`,
      );
    }
    if (atendimentoNotasClienteExists) {
      await queryRunner.query(
        `ALTER TABLE "atendimento_notas_cliente" DROP CONSTRAINT IF EXISTS "FK_c60fc0dc807287e6f8d11594469"`,
      );
    }
    if (atendimentoIntegracoesExists) {
      await queryRunner.query(
        `ALTER TABLE "atendimento_integracoes_config" DROP CONSTRAINT IF EXISTS "fk_atendimento_integracoes_empresa"`,
      );
    }
    if (filasExists) {
      await queryRunner.query(
        `ALTER TABLE "filas" DROP CONSTRAINT IF EXISTS "filas_empresaId_fkey"`,
      );
    }
    if (atendentesExists) {
      await queryRunner.query(
        `ALTER TABLE "atendentes" DROP CONSTRAINT IF EXISTS "atendentes_empresaId_fkey"`,
      );
      await queryRunner.query(
        `ALTER TABLE "atendentes" DROP CONSTRAINT IF EXISTS "atendentes_usuarioId_fkey"`,
      );
    }
    if (atendimentoCanaisExists) {
      await queryRunner.query(
        `ALTER TABLE "atendimento_canais" DROP CONSTRAINT IF EXISTS "fk_atendimento_canais_empresa"`,
      );
    }
    if (atendimentoDemandasExists) {
      await queryRunner.query(
        `ALTER TABLE "atendimento_demandas" DROP CONSTRAINT IF EXISTS "FK_2691f1d5df7e1c8cdb076a55e83"`,
      );
      await queryRunner.query(
        `ALTER TABLE "atendimento_demandas" DROP CONSTRAINT IF EXISTS "FK_8941088e9191d7c1c826a8c4084"`,
      );
    }
    if (canaisExists) {
      await queryRunner.query(
        `ALTER TABLE "canais" DROP CONSTRAINT IF EXISTS "canais_empresaId_fkey"`,
      );
    }
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_contatos_clienteid"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_contatos_telefone"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_contatos_ativo"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_contatos_principal"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_contatos_last_activity"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_fornecedores_cnpj_cpf"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_fornecedores_email"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_fornecedores_empresa_ativo"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_fluxo_empresa"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_fluxo_ativo"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_fluxo_publicado"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_fluxo_canais"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_nucleo_empresa"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_nucleo_ativo"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_nucleo_codigo"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_atendimento_tickets_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_atendimento_tickets_empresa"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_atendimento_tickets_numero"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_atendimento_tickets_cliente"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_atendimento_tickets_atendente"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_atendimento_tickets_fila"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_atendimento_tickets_canal"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_sessao_contato"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_sessao_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_sessao_fluxo"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_sessao_ticket"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_sessao_iniciado"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_departamentos_empresa"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_departamentos_nucleo"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_departamentos_ativo"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_equipe_atribuicoes_equipe"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_equipe_atribuicoes_nucleo"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_equipe_atribuicoes_departamento"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_equipe_atribuicoes_ativo"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_atendente_equipes_atendente"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_atendente_equipes_equipe"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_equipes_empresa"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_equipes_ativo"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_atendente_atribuicoes_atendente"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_atendente_atribuicoes_nucleo"`);
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."idx_atendente_atribuicoes_departamento"`,
    );
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_atendente_atribuicoes_ativo"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_itens_fatura_fatura"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_faturas_clienteid_uuid_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_faturas_numero"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_faturas_contrato"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_faturas_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_faturas_vencimento"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_faturas_clienteid_uuid"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_contas_pagar_empresa_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_contas_pagar_fornecedor"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_contas_pagar_vencimento"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_contas_pagar_data_emissao"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_contas_pagar_categoria"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_atendimento_mensagens_ticket"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_atendimento_mensagens_tipo"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_atendimento_mensagens_atendente"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_atendimento_mensagens_data"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_notas_cliente_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_notas_ticket_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_notas_telefone"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_notas_empresa_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_notas_importante"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_notas_created_at"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_integracoes_config_empresa_tipo"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_integracoes_config_ativo"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_filas_empresa"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_atendentes_empresa"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_atendimento_canais_empresa"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_atendimento_canais_tipo"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_demandas_tipo"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_demandas_responsavel_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_demandas_data_vencimento"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_demandas_cliente_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_demandas_ticket_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_demandas_telefone"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_demandas_empresa_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_demandas_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_demandas_prioridade"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_demandas_created_at"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_canais_empresa"`);
    if (fornecedoresExists) {
      await queryRunner.query(
        `ALTER TABLE "fornecedores" DROP CONSTRAINT IF EXISTS "chk_fornecedores_estado"`,
      );
      await queryRunner.query(
        `ALTER TABLE "fornecedores" DROP CONSTRAINT IF EXISTS "chk_fornecedores_cep"`,
      );
    }
    await queryRunner.query(
      `ALTER TABLE "equipe_atribuicoes" DROP CONSTRAINT IF EXISTS "check_equipe_atribuicao"`,
    );
    await queryRunner.query(
      `ALTER TABLE "atendente_atribuicoes" DROP CONSTRAINT IF EXISTS "check_atribuicao"`,
    );
    if (pagamentosExists) {
      await queryRunner.query(
        `ALTER TABLE "pagamentos" DROP CONSTRAINT IF EXISTS "pagamentos_tipo_check"`,
      );
      await queryRunner.query(
        `ALTER TABLE "pagamentos" DROP CONSTRAINT IF EXISTS "pagamentos_status_check"`,
      );
    }
    await queryRunner.query(`ALTER TABLE "faturas" DROP CONSTRAINT IF EXISTS "faturas_tipo_check"`);
    await queryRunner.query(
      `ALTER TABLE "faturas" DROP CONSTRAINT IF EXISTS "faturas_status_check"`,
    );
    await queryRunner.query(
      `ALTER TABLE "faturas" DROP CONSTRAINT IF EXISTS "faturas_formaPagamentoPreferida_check"`,
    );
    if (contasPagarExists) {
      await queryRunner.query(
        `ALTER TABLE "contas_pagar" DROP CONSTRAINT IF EXISTS "contas_pagar_status_check"`,
      );
      await queryRunner.query(
        `ALTER TABLE "contas_pagar" DROP CONSTRAINT IF EXISTS "contas_pagar_prioridade_check"`,
      );
      await queryRunner.query(
        `ALTER TABLE "contas_pagar" DROP CONSTRAINT IF EXISTS "contas_pagar_forma_pagamento_check"`,
      );
      await queryRunner.query(
        `ALTER TABLE "contas_pagar" DROP CONSTRAINT IF EXISTS "chk_contas_pagar_valor_original"`,
      );
      await queryRunner.query(
        `ALTER TABLE "contas_pagar" DROP CONSTRAINT IF EXISTS "chk_contas_pagar_valor_pago"`,
      );
      await queryRunner.query(
        `ALTER TABLE "contas_pagar" DROP CONSTRAINT IF EXISTS "chk_contas_pagar_data_vencimento"`,
      );
      await queryRunner.query(
        `ALTER TABLE "contas_pagar" DROP CONSTRAINT IF EXISTS "contas_pagar_categoria_check"`,
      );
    }
    if (fornecedoresExists) {
      await queryRunner.query(
        `ALTER TABLE "fornecedores" DROP CONSTRAINT IF EXISTS "uk_fornecedores_cnpj_cpf_empresa"`,
      );
    }
    await queryRunner.query(
      `ALTER TABLE "fluxos_triagem" DROP CONSTRAINT IF EXISTS "unique_fluxo_codigo_empresa"`,
    );
    await queryRunner.query(
      `ALTER TABLE "nucleos_atendimento" DROP CONSTRAINT IF EXISTS "unique_nucleo_codigo_empresa"`,
    );
    await queryRunner.query(
      `ALTER TABLE "atendente_equipes" DROP CONSTRAINT IF EXISTS "uk_atendente_equipe"`,
    );
    await queryRunner.query(`COMMENT ON TABLE "contatos" IS NULL`);
    if (fornecedoresExists) {
      await queryRunner.query(`COMMENT ON TABLE "fornecedores" IS NULL`);
    }
    await queryRunner.query(`COMMENT ON TABLE "equipe_atribuicoes" IS NULL`);
    await queryRunner.query(`COMMENT ON TABLE "atendente_equipes" IS NULL`);
    await queryRunner.query(`COMMENT ON TABLE "equipes" IS NULL`);
    await queryRunner.query(`COMMENT ON TABLE "atendente_atribuicoes" IS NULL`);
    if (contasPagarExists) {
      await queryRunner.query(`COMMENT ON TABLE "contas_pagar" IS NULL`);
    }
    if (filasExists) {
      await queryRunner.query(`COMMENT ON TABLE "filas" IS NULL`);
    }
    if (atendentesExists) {
      await queryRunner.query(`COMMENT ON TABLE "atendentes" IS NULL`);
    }
    if (canaisExists) {
      await queryRunner.query(`COMMENT ON TABLE "canais" IS NULL`);
    }
    await queryRunner.query(
      `CREATE TABLE "itens_cotacao" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "cotacao_id" uuid NOT NULL, "ordem" integer NOT NULL DEFAULT '1', "descricao" character varying(500) NOT NULL, "quantidade" numeric(10,3) NOT NULL, "unidade" character varying(20) NOT NULL, "valorUnitario" numeric(15,2) NOT NULL, "valorTotal" numeric(15,2) NOT NULL, "observacoes" text, "codigo" character varying(100), "categoria" character varying(200), "desconto" numeric(5,2) DEFAULT '0', "valorDesconto" numeric(15,2) DEFAULT '0', "aliquotaImposto" numeric(5,2) DEFAULT '0', "valorImposto" numeric(15,2) DEFAULT '0', "valorLiquido" numeric(15,2) DEFAULT '0', "prazoEntregaDias" integer, "especificacoes" json, "metadados" json, "data_criacao" TIMESTAMP NOT NULL DEFAULT now(), "data_atualizacao" TIMESTAMP NOT NULL DEFAULT now(), "criado_por" character varying NOT NULL, "atualizado_por" character varying NOT NULL, "id_produto_externo" character varying(100), "sku" character varying(100), "ncm" character varying(100), CONSTRAINT "PK_5d497caf66dd6761c953ce8a40c" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_4abce30d9cb740a703be515d80" ON "itens_cotacao" ("ordem") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_c2c7135bba968bf7a704f83571" ON "itens_cotacao" ("cotacao_id") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."cotacoes_status_enum" AS ENUM('rascunho', 'enviada', 'em_analise', 'aprovada', 'rejeitada', 'vencida', 'convertida', 'cancelada')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."cotacoes_prioridade_enum" AS ENUM('baixa', 'media', 'alta', 'urgente')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."cotacoes_origem_enum" AS ENUM('manual', 'website', 'email', 'telefone', 'whatsapp', 'indicacao')`,
    );
    await queryRunner.query(
      `CREATE TABLE "cotacoes" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "numero" character varying(20) NOT NULL, "titulo" character varying(200) NOT NULL, "descricao" text, "status" "public"."cotacoes_status_enum" NOT NULL DEFAULT 'rascunho', "prioridade" "public"."cotacoes_prioridade_enum" NOT NULL DEFAULT 'media', "origem" "public"."cotacoes_origem_enum" NOT NULL DEFAULT 'manual', "valorTotal" numeric(15,2) NOT NULL DEFAULT '0', "prazoResposta" date, "observacoes" text, "condicoesPagamento" text, "prazoEntrega" character varying(100), "localEntrega" character varying(200), "validadeOrcamento" integer DEFAULT '30', "fornecedor_id" uuid NOT NULL, "responsavel_id" uuid NOT NULL, "data_criacao" TIMESTAMP NOT NULL DEFAULT now(), "data_atualizacao" TIMESTAMP NOT NULL DEFAULT now(), "deletado_em" TIMESTAMP, "criado_por" uuid NOT NULL, "atualizado_por" uuid NOT NULL, "deletado_por" character varying, "data_envio" TIMESTAMP, "data_aprovacao" TIMESTAMP, "data_rejeicao" TIMESTAMP, "data_conversao" TIMESTAMP, "metadados" json, "desconto" numeric(5,2) DEFAULT '0', "valorDesconto" numeric(15,2) DEFAULT '0', "valorImposto" numeric(15,2) DEFAULT '0', "valorFrete" numeric(15,2) DEFAULT '0', "valorLiquido" numeric(15,2) DEFAULT '0', "moeda" character varying(100), "taxaCambio" numeric(10,4) DEFAULT '1', "versao" integer NOT NULL DEFAULT '1', "ultima_visualizacao" TIMESTAMP, "visualizado_por" character varying, "id_externo" character varying(100), "sistema_origem" character varying(100), "dados_sincronizacao" json, CONSTRAINT "UQ_a8cc61433ad56cc7353f281841c" UNIQUE ("numero"), CONSTRAINT "PK_5bf611a523f8c37582a65a767c0" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_6aac38dbd9295ab00b90483b0b" ON "cotacoes" ("data_criacao") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_02d7405f867a53d9ec501c686d" ON "cotacoes" ("prazoResposta") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_bf14ca2583d1c90e8ea75ffd8a" ON "cotacoes" ("status") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_73a50683a9099014dfc1ae5f54" ON "cotacoes" ("responsavel_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_b67b9648e4c0f0752cc559044c" ON "cotacoes" ("fornecedor_id") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_a8cc61433ad56cc7353f281841" ON "cotacoes" ("numero") `,
    );
    await queryRunner.query(
      `CREATE TABLE "anexos_cotacao" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "cotacao_id" uuid NOT NULL, "nome" character varying(255) NOT NULL, "tipo" character varying(100) NOT NULL, "url" character varying(500) NOT NULL, "tamanho" bigint NOT NULL, "descricao" text, "mimeType" character varying(100), "extensao" character varying(10), "data_criacao" TIMESTAMP NOT NULL DEFAULT now(), "criado_por" uuid NOT NULL, "metadados" json, "ativo" boolean NOT NULL DEFAULT true, "downloads" integer, "ultimo_download" TIMESTAMP, "hash" character varying(64), "publico" boolean NOT NULL DEFAULT false, "data_expiracao" TIMESTAMP, CONSTRAINT "PK_fb30e82c701583b424977f36316" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_8e40da9649c6e14b9178f68b01" ON "anexos_cotacao" ("tipo") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_70fe58d85050b98f06a61c9f77" ON "anexos_cotacao" ("cotacao_id") `,
    );
    // ❌ REMOVIDO: Tabela triagem_logs já criada pela migration CreateTriagemLogsTable1730224800000
    // await queryRunner.query(`CREATE TABLE "triagem_logs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "empresa_id" uuid NOT NULL, "sessao_id" uuid, "fluxo_id" uuid, "etapa" character varying(120), "direcao" character varying(20) NOT NULL, "canal" character varying(30) NOT NULL DEFAULT 'whatsapp', "tipo" character varying(50), "mensagem_id" character varying(160), "mensagem" text, "payload" jsonb, "contexto_snapshot" jsonb, "metadata" jsonb, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_2c7de3a599c9debc82c211bcbf1" PRIMARY KEY ("id"))`);
    // ❌ REMOVIDO: Índices já criados pela migration CreateTriagemLogsTable1730224800000
    // await queryRunner.query(`CREATE INDEX "idx_triagem_logs_fluxo" ON "triagem_logs" ("fluxo_id") `);
    // await queryRunner.query(`CREATE INDEX "idx_triagem_logs_sessao" ON "triagem_logs" ("sessao_id") `);
    // await queryRunner.query(`CREATE INDEX "idx_triagem_logs_empresa" ON "triagem_logs" ("empresa_id") `);
    await queryRunner.query(
      `CREATE TYPE "public"."fluxos_automatizados_status_enum" AS ENUM('proposta_aceita', 'contrato_gerado', 'contrato_enviado', 'contrato_assinado', 'fatura_gerada', 'pagamento_processado', 'workflow_concluido', 'erro_processamento', 'pausado', 'cancelado')`,
    );
    await queryRunner.query(
      `CREATE TABLE "fluxos_automatizados" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenantId" uuid NOT NULL, "numeroFluxo" character varying(50) NOT NULL, "propostaId" uuid NOT NULL, "contratoId" uuid, "faturaId" uuid, "status" "public"."fluxos_automatizados_status_enum" NOT NULL DEFAULT 'proposta_aceita', "etapaAtual" integer NOT NULL DEFAULT '1', "totalEtapas" integer NOT NULL DEFAULT '6', "dataInicio" TIMESTAMP, "dataConclusao" TIMESTAMP, "dataProximaAcao" TIMESTAMP, "tentativasProcessamento" integer NOT NULL DEFAULT '0', "maxTentativas" integer NOT NULL DEFAULT '3', "configuracoes" json, "metadados" json, "observacoes" text, "ultimoErro" text, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_0e1071330540eb38be4c823e94f" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."eventos_fluxo_tipoevento_enum" AS ENUM('proposta_aceita', 'contrato_criado', 'contrato_enviado', 'contrato_assinado', 'fatura_criada', 'pagamento_recebido', 'erro_ocorrido', 'workflow_pausado', 'workflow_retomado', 'workflow_cancelado')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."eventos_fluxo_status_enum" AS ENUM('pendente', 'processando', 'concluido', 'erro', 'cancelado')`,
    );
    await queryRunner.query(
      `CREATE TABLE "eventos_fluxo" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenantId" uuid NOT NULL, "fluxoId" uuid NOT NULL, "tipoEvento" "public"."eventos_fluxo_tipoevento_enum" NOT NULL, "status" "public"."eventos_fluxo_status_enum" NOT NULL DEFAULT 'pendente', "titulo" character varying(255) NOT NULL, "descricao" text, "dadosEvento" json, "dataProcessamento" TIMESTAMP, "dataAgendamento" TIMESTAMP, "tentativas" integer NOT NULL DEFAULT '0', "maxTentativas" integer NOT NULL DEFAULT '3', "ultimoErro" text, "processadoPor" character varying(100), "tempoProcessamento" integer, "resultadoProcessamento" json, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "fluxo_id" uuid, CONSTRAINT "PK_c69e700eeef3232957ce795f8f8" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_fa2c2f9353b1c9108b4651153a" ON "eventos_fluxo" ("status", "dataProcessamento") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_006aec56cd22a82d0fe68a18d9" ON "eventos_fluxo" ("fluxoId", "createdAt") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."assinaturas_contrato_tipo_enum" AS ENUM('digital', 'eletronica', 'presencial')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."assinaturas_contrato_status_enum" AS ENUM('pendente', 'assinado', 'rejeitado', 'expirado')`,
    );
    await queryRunner.query(
      `CREATE TABLE "assinaturas_contrato" ("id" SERIAL NOT NULL, "contratoId" integer NOT NULL, "usuarioId" uuid NOT NULL, "tipo" "public"."assinaturas_contrato_tipo_enum" NOT NULL DEFAULT 'digital', "status" "public"."assinaturas_contrato_status_enum" NOT NULL DEFAULT 'pendente', "certificadoDigital" text, "hashAssinatura" text, "ipAssinatura" text, "userAgent" text, "dataAssinatura" TIMESTAMP, "motivoRejeicao" text, "metadados" json, "tokenValidacao" text, "dataEnvio" TIMESTAMP, "dataExpiracao" TIMESTAMP, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_95d00342a5061709eac02dc3276" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."planos_cobranca_tiporecorrencia_enum" AS ENUM('mensal', 'trimestral', 'semestral', 'anual', 'personalizado')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."planos_cobranca_status_enum" AS ENUM('ativo', 'pausado', 'cancelado', 'expirado')`,
    );
    await queryRunner.query(
      `CREATE TABLE "planos_cobranca" ("id" SERIAL NOT NULL, "codigo" character varying NOT NULL, "contratoId" integer NOT NULL, "clienteId" uuid NOT NULL, "usuarioResponsavelId" uuid NOT NULL, "nome" text NOT NULL, "descricao" text, "tipoRecorrencia" "public"."planos_cobranca_tiporecorrencia_enum" NOT NULL DEFAULT 'mensal', "intervaloRecorrencia" integer NOT NULL DEFAULT '1', "status" "public"."planos_cobranca_status_enum" NOT NULL DEFAULT 'ativo', "valorRecorrente" numeric(10,2) NOT NULL, "diaVencimento" integer NOT NULL DEFAULT '5', "dataInicio" date NOT NULL, "dataFim" date, "proximaCobranca" date, "limiteCiclos" integer, "ciclosExecutados" integer NOT NULL DEFAULT '0', "jurosAtraso" numeric(5,2) NOT NULL DEFAULT '2', "multaAtraso" numeric(5,2) NOT NULL DEFAULT '10', "diasTolerancia" integer NOT NULL DEFAULT '5', "enviarLembrete" boolean NOT NULL DEFAULT true, "diasAntesLembrete" integer NOT NULL DEFAULT '3', "configuracoes" json, "ativo" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_fbf6f251734e26df72e77cc29f4" UNIQUE ("codigo"), CONSTRAINT "PK_701b3c93f0c885abac88f856f5d" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "primeira_senha"`);
    await queryRunner.query(`ALTER TABLE "contatos" DROP COLUMN IF EXISTS "online_status"`);
    await queryRunner.query(`ALTER TABLE "contatos" DROP COLUMN IF EXISTS "last_activity"`);
    await queryRunner.query(`ALTER TABLE "atendimento_tickets" DROP COLUMN IF EXISTS "cliente_id"`);
    await queryRunner.query(`ALTER TABLE "atendimento_tickets" DROP COLUMN IF EXISTS "descricao"`);
    await queryRunner.query(
      `ALTER TABLE "atendimento_tickets" DROP COLUMN IF EXISTS "comentario_avaliacao"`,
    );
    await queryRunner.query(
      `ALTER TABLE "atendimento_tickets" DROP COLUMN IF EXISTS "identificador_externo"`,
    );
    await queryRunner.query(`ALTER TABLE "atendimento_tickets" DROP COLUMN IF EXISTS "avaliacao"`);
    await queryRunner.query(
      `ALTER TABLE "atendimento_tickets" DROP COLUMN IF EXISTS "contrato_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "atendimento_tickets" DROP COLUMN IF EXISTS "contato_online"`,
    );
    await queryRunner.query(
      `ALTER TABLE "atendimento_tickets" DROP COLUMN IF EXISTS "data_avaliacao"`,
    );
    await queryRunner.query(`ALTER TABLE "atendimento_tickets" DROP COLUMN IF EXISTS "metadata"`);
    await queryRunner.query(
      `ALTER TABLE "atendimento_tickets" DROP COLUMN IF EXISTS "contato_last_activity"`,
    );
    await queryRunner.query(
      `ALTER TABLE "atendimento_tickets" DROP COLUMN IF EXISTS "sla_resolucao_vencido"`,
    );
    await queryRunner.query(
      `ALTER TABLE "atendimento_tickets" DROP COLUMN IF EXISTS "contato_dados"`,
    );
    await queryRunner.query(`ALTER TABLE "atendimento_tickets" DROP COLUMN IF EXISTS "tags"`);
    await queryRunner.query(`ALTER TABLE "atendimento_tickets" DROP COLUMN IF EXISTS "categoria"`);
    await queryRunner.query(
      `ALTER TABLE "atendimento_tickets" DROP COLUMN IF EXISTS "contato_email"`,
    );
    await queryRunner.query(
      `ALTER TABLE "atendimento_tickets" DROP COLUMN IF EXISTS "sla_resposta_vencido"`,
    );
    await queryRunner.query(
      `ALTER TABLE "atendimento_tickets" DROP COLUMN IF EXISTS "oportunidade_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "atendimento_tickets" DROP COLUMN IF EXISTS "proposta_id"`,
    );
    await queryRunner.query(`ALTER TABLE "atendimento_tickets" DROP COLUMN IF EXISTS "fatura_id"`);
    await queryRunner.query(`ALTER TABLE "faturas" DROP COLUMN IF EXISTS "clienteId_old_numeric"`);
    if (contasPagarExists) {
      await queryRunner.query(
        `ALTER TABLE "contas_pagar" DROP COLUMN IF EXISTS "valor_pago" CASCADE`,
      );
      await queryRunner.query(`ALTER TABLE "contas_pagar" DROP COLUMN IF EXISTS "recorrente"`);
      await queryRunner.query(
        `ALTER TABLE "contas_pagar" DROP COLUMN IF EXISTS "comprovante_pagamento"`,
      );
      await queryRunner.query(
        `ALTER TABLE "contas_pagar" DROP COLUMN IF EXISTS "frequencia_recorrencia"`,
      );
      await queryRunner.query(`ALTER TABLE "contas_pagar" DROP COLUMN IF EXISTS "valor_juros"`);
      await queryRunner.query(`ALTER TABLE "contas_pagar" DROP COLUMN IF EXISTS "categoria"`);
      await queryRunner.query(`ALTER TABLE "contas_pagar" DROP COLUMN IF EXISTS "tags"`);
      await queryRunner.query(`ALTER TABLE "contas_pagar" DROP COLUMN IF EXISTS "valor_desconto"`);
      await queryRunner.query(`ALTER TABLE "contas_pagar" DROP COLUMN IF EXISTS "valor_multa"`);
      await queryRunner.query(`ALTER TABLE "contas_pagar" DROP COLUMN IF EXISTS "criado_por"`);
      await queryRunner.query(
        `ALTER TABLE "contas_pagar" DROP COLUMN IF EXISTS "conta_bancaria_id"`,
      );
      await queryRunner.query(
        `ALTER TABLE "contas_pagar" DROP CONSTRAINT IF EXISTS "contas_pagar_numero_key"`,
      );
      await queryRunner.query(`ALTER TABLE "contas_pagar" DROP COLUMN IF EXISTS "numero"`);
      await queryRunner.query(`ALTER TABLE "contas_pagar" DROP COLUMN IF EXISTS "forma_pagamento"`);
      await queryRunner.query(`ALTER TABLE "contas_pagar" DROP COLUMN IF EXISTS "atualizado_em"`);
      await queryRunner.query(`ALTER TABLE "contas_pagar" DROP COLUMN IF EXISTS "data_aprovacao"`);
      await queryRunner.query(
        `ALTER TABLE "contas_pagar" DROP COLUMN IF EXISTS "necessita_aprovacao"`,
      );
      await queryRunner.query(`ALTER TABLE "contas_pagar" DROP COLUMN IF EXISTS "data_emissao"`);
      await queryRunner.query(`ALTER TABLE "contas_pagar" DROP COLUMN IF EXISTS "anexos"`);
      await queryRunner.query(`ALTER TABLE "contas_pagar" DROP COLUMN IF EXISTS "centro_custo"`);
      await queryRunner.query(`ALTER TABLE "contas_pagar" DROP COLUMN IF EXISTS "tipo_pagamento"`);
      await queryRunner.query(`ALTER TABLE "contas_pagar" DROP COLUMN IF EXISTS "valor_restante"`);
      await queryRunner.query(
        `ALTER TABLE "contas_pagar" DROP COLUMN IF EXISTS "data_agendamento"`,
      );
      await queryRunner.query(`ALTER TABLE "contas_pagar" DROP COLUMN IF EXISTS "atualizado_por"`);
      await queryRunner.query(`ALTER TABLE "contas_pagar" DROP COLUMN IF EXISTS "aprovado_por"`);
      await queryRunner.query(`ALTER TABLE "contas_pagar" DROP COLUMN IF EXISTS "valor_total"`);
      await queryRunner.query(`ALTER TABLE "contas_pagar" DROP COLUMN IF EXISTS "prioridade"`);
      await queryRunner.query(`ALTER TABLE "contas_pagar" DROP COLUMN IF EXISTS "criado_em"`);
      await queryRunner.query(`ALTER TABLE "contas_pagar" DROP COLUMN IF EXISTS "valor_original"`);
    }

    if (atendimentoMensagensExists) {
      await queryRunner.query(
        `ALTER TABLE "atendimento_mensagens" DROP COLUMN IF EXISTS "resposta_automatica"`,
      );
      await queryRunner.query(
        `ALTER TABLE "atendimento_mensagens" DROP COLUMN IF EXISTS "erro_envio"`,
      );
      await queryRunner.query(
        `ALTER TABLE "atendimento_mensagens" DROP COLUMN IF EXISTS "metadata"`,
      );
      await queryRunner.query(
        `ALTER TABLE "atendimento_mensagens" DROP COLUMN IF EXISTS "data_leitura"`,
      );
      await queryRunner.query(`ALTER TABLE "atendimento_mensagens" DROP COLUMN IF EXISTS "lida"`);
      await queryRunner.query(
        `ALTER TABLE "atendimento_mensagens" DROP COLUMN IF EXISTS "entregue"`,
      );
      await queryRunner.query(
        `ALTER TABLE "atendimento_mensagens" DROP COLUMN IF EXISTS "privada"`,
      );
      await queryRunner.query(
        `ALTER TABLE "atendimento_mensagens" DROP COLUMN IF EXISTS "template_usado"`,
      );
      await queryRunner.query(
        `ALTER TABLE "atendimento_mensagens" DROP COLUMN IF EXISTS "atendente_id"`,
      );
      await queryRunner.query(
        `ALTER TABLE "atendimento_mensagens" DROP COLUMN IF EXISTS "conteudo_formatado"`,
      );
    }

    if (atendimentoIntegracoesExists) {
      await queryRunner.query(
        `ALTER TABLE "atendimento_integracoes_config" DROP COLUMN IF EXISTS "email_ativo"`,
      );
      await queryRunner.query(
        `ALTER TABLE "atendimento_integracoes_config" DROP COLUMN IF EXISTS "meta_ativo"`,
      );
      await queryRunner.query(
        `ALTER TABLE "atendimento_integracoes_config" DROP COLUMN IF EXISTS "created_at"`,
      );
      await queryRunner.query(
        `ALTER TABLE "atendimento_integracoes_config" DROP COLUMN IF EXISTS "instagram_account_id"`,
      );
      await queryRunner.query(
        `ALTER TABLE "atendimento_integracoes_config" DROP COLUMN IF EXISTS "notificacoes_ativas"`,
      );
      await queryRunner.query(
        `ALTER TABLE "atendimento_integracoes_config" DROP COLUMN IF EXISTS "email_api_key"`,
      );
      await queryRunner.query(
        `ALTER TABLE "atendimento_integracoes_config" DROP COLUMN IF EXISTS "twilio_auth_token"`,
      );
      await queryRunner.query(
        `ALTER TABLE "atendimento_integracoes_config" DROP COLUMN IF EXISTS "twilio_account_sid"`,
      );
      await queryRunner.query(
        `ALTER TABLE "atendimento_integracoes_config" DROP COLUMN IF EXISTS "ia_analise_sentimento"`,
      );
      await queryRunner.query(
        `ALTER TABLE "atendimento_integracoes_config" DROP COLUMN IF EXISTS "ia_provider"`,
      );
      await queryRunner.query(
        `ALTER TABLE "atendimento_integracoes_config" DROP COLUMN IF EXISTS "ia_respostas_automaticas"`,
      );
      await queryRunner.query(
        `ALTER TABLE "atendimento_integracoes_config" DROP COLUMN IF EXISTS "email_from_address"`,
      );
      await queryRunner.query(
        `ALTER TABLE "atendimento_integracoes_config" DROP COLUMN IF EXISTS "email_provider"`,
      );
      await queryRunner.query(
        `ALTER TABLE "atendimento_integracoes_config" DROP COLUMN IF EXISTS "facebook_page_access_token"`,
      );
      await queryRunner.query(
        `ALTER TABLE "atendimento_integracoes_config" DROP COLUMN IF EXISTS "updated_at"`,
      );
      await queryRunner.query(
        `ALTER TABLE "atendimento_integracoes_config" DROP COLUMN IF EXISTS "telegram_ativo"`,
      );
      await queryRunner.query(
        `ALTER TABLE "atendimento_integracoes_config" DROP COLUMN IF EXISTS "openai_api_key"`,
      );
      await queryRunner.query(
        `ALTER TABLE "atendimento_integracoes_config" DROP COLUMN IF EXISTS "ia_sugestoes_atendente"`,
      );
      await queryRunner.query(
        `ALTER TABLE "atendimento_integracoes_config" DROP COLUMN IF EXISTS "facebook_page_id"`,
      );
      await queryRunner.query(
        `ALTER TABLE "atendimento_integracoes_config" DROP COLUMN IF EXISTS "anthropic_api_key"`,
      );
      await queryRunner.query(
        `ALTER TABLE "atendimento_integracoes_config" DROP COLUMN IF EXISTS "openai_model"`,
      );
      await queryRunner.query(
        `ALTER TABLE "atendimento_integracoes_config" DROP COLUMN IF EXISTS "anthropic_model"`,
      );
      await queryRunner.query(
        `ALTER TABLE "atendimento_integracoes_config" DROP COLUMN IF EXISTS "twilio_sms_number"`,
      );
      await queryRunner.query(
        `ALTER TABLE "atendimento_integracoes_config" DROP COLUMN IF EXISTS "ia_classificacao_automatica"`,
      );
      await queryRunner.query(
        `ALTER TABLE "atendimento_integracoes_config" DROP COLUMN IF EXISTS "auto_criar_clientes"`,
      );
      await queryRunner.query(
        `ALTER TABLE "atendimento_integracoes_config" DROP COLUMN IF EXISTS "telegram_bot_token"`,
      );
      await queryRunner.query(
        `ALTER TABLE "atendimento_integracoes_config" DROP COLUMN IF EXISTS "telegram_webhook_url"`,
      );
      await queryRunner.query(
        `ALTER TABLE "atendimento_integracoes_config" DROP COLUMN IF EXISTS "twilio_ativo"`,
      );
      await queryRunner.query(
        `ALTER TABLE "atendimento_integracoes_config" DROP COLUMN IF EXISTS "twilio_whatsapp_number"`,
      );
      await queryRunner.query(
        `ALTER TABLE "atendimento_integracoes_config" DROP COLUMN IF EXISTS "auto_criar_leads"`,
      );
    }

    if (contasPagarExists) {
      await queryRunner.query(
        `ALTER TABLE "contas_pagar" ADD "valor" numeric(10,2) NOT NULL DEFAULT '0'`,
      );
      await queryRunner.query(`ALTER TABLE "contas_pagar" ALTER COLUMN "valor" DROP DEFAULT`);
      await queryRunner.query(
        `ALTER TABLE "contas_pagar" ADD "created_at" TIMESTAMP NOT NULL DEFAULT now()`,
      );
      await queryRunner.query(
        `ALTER TABLE "contas_pagar" ADD "updated_at" TIMESTAMP NOT NULL DEFAULT now()`,
      );
    }

    if (faturasExists) {
      await queryRunner.query(`ALTER TABLE "faturas" ADD "criadoPor" uuid`);
      await queryRunner.query(`ALTER TABLE "faturas" ADD "atualizadoPor" uuid`);
    }

    // Verificar nomenclatura de colunas em contatos (pode ser camelCase ou snake_case)
    const contatosColumns = await queryRunner.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'contatos' 
      AND column_name IN ('createdAt', 'created_at', 'updatedAt', 'updated_at', 'cargo', 'ativo', 'principal', 'clienteId')
    `);
    const hasCreatedAt = contatosColumns.some((col: any) => col.column_name === 'createdAt');
    const hasUpdatedAt = contatosColumns.some((col: any) => col.column_name === 'updatedAt');
    const hasCargo = contatosColumns.some((col: any) => col.column_name === 'cargo');

    if (hasCargo) {
      await queryRunner.query(`COMMENT ON COLUMN "contatos"."cargo" IS NULL`);
    }
    await queryRunner.query(`ALTER TABLE "contatos" ALTER COLUMN "ativo" SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE "contatos" ALTER COLUMN "principal" SET NOT NULL`);
    await queryRunner.query(`COMMENT ON COLUMN "contatos"."principal" IS NULL`);
    await queryRunner.query(`COMMENT ON COLUMN "contatos"."clienteId" IS NULL`);
    if (hasCreatedAt) {
      await queryRunner.query(`ALTER TABLE "contatos" ALTER COLUMN "createdAt" SET NOT NULL`);
    }
    if (hasUpdatedAt) {
      await queryRunner.query(`ALTER TABLE "contatos" ALTER COLUMN "updatedAt" SET NOT NULL`);
    }
    if (fornecedoresExists) {
      await queryRunner.query(
        `UPDATE "fornecedores" SET "cnpj_cpf" = CONCAT('TEMP-', SUBSTRING(md5(id::text), 1, 12)) WHERE COALESCE(TRIM("cnpj_cpf"::text), '') = ''`,
      );
      await queryRunner.query(
        `ALTER TABLE "fornecedores" ALTER COLUMN "cnpj_cpf" TYPE character varying(20) USING SUBSTRING("cnpj_cpf"::text, 1, 20)`,
      );
      await queryRunner.query(`ALTER TABLE "fornecedores" ALTER COLUMN "cnpj_cpf" SET NOT NULL`);
      await queryRunner.query(
        `ALTER TABLE "fornecedores" ADD CONSTRAINT "UQ_36915b17f08ccc3ce20a2f1d37a" UNIQUE ("cnpj_cpf")`,
      );
      await queryRunner.query(
        `ALTER TABLE "fornecedores" ALTER COLUMN "endereco" TYPE character varying(500)`,
      );
      await queryRunner.query(
        `ALTER TABLE "fornecedores" ALTER COLUMN "cep" TYPE character varying(10)`,
      );
      await queryRunner.query(`ALTER TABLE "fornecedores" ALTER COLUMN "ativo" SET NOT NULL`);
      await queryRunner.query(`ALTER TABLE "fornecedores" ALTER COLUMN "criado_em" SET NOT NULL`);
      await queryRunner.query(
        `ALTER TABLE "fornecedores" ALTER COLUMN "criado_em" SET DEFAULT now()`,
      );
      await queryRunner.query(
        `ALTER TABLE "fornecedores" ALTER COLUMN "atualizado_em" SET NOT NULL`,
      );
      await queryRunner.query(
        `ALTER TABLE "fornecedores" ALTER COLUMN "atualizado_em" SET DEFAULT now()`,
      );
    }

    // Verificar quais colunas existem em fluxos_triagem antes de ALTER
    const fluxosTriagemColumns = await queryRunner.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'fluxos_triagem'
    `);
    const fluxosTriagemColumnNames = fluxosTriagemColumns.map((col: any) => col.column_name);

    if (fluxosTriagemColumnNames.includes('tipo')) {
      await queryRunner.query(`ALTER TABLE "fluxos_triagem" ALTER COLUMN "tipo" SET NOT NULL`);
    }
    if (fluxosTriagemColumnNames.includes('ativo')) {
      await queryRunner.query(`ALTER TABLE "fluxos_triagem" ALTER COLUMN "ativo" SET NOT NULL`);
    }
    if (fluxosTriagemColumnNames.includes('versao')) {
      await queryRunner.query(`ALTER TABLE "fluxos_triagem" ALTER COLUMN "versao" SET NOT NULL`);
    }
    if (fluxosTriagemColumnNames.includes('publicado')) {
      await queryRunner.query(`ALTER TABLE "fluxos_triagem" ALTER COLUMN "publicado" SET NOT NULL`);
    }
    if (fluxosTriagemColumnNames.includes('canais')) {
      await queryRunner.query(`ALTER TABLE "fluxos_triagem" ALTER COLUMN "canais" SET NOT NULL`);
      await queryRunner.query(
        `ALTER TABLE "fluxos_triagem" ALTER COLUMN "canais" SET DEFAULT '["whatsapp"]'`,
      );
    }
    if (fluxosTriagemColumnNames.includes('palavras_gatilho')) {
      await queryRunner.query(
        `ALTER TABLE "fluxos_triagem" ALTER COLUMN "palavras_gatilho" SET NOT NULL`,
      );
    }
    if (fluxosTriagemColumnNames.includes('prioridade')) {
      await queryRunner.query(
        `ALTER TABLE "fluxos_triagem" ALTER COLUMN "prioridade" SET NOT NULL`,
      );
    }
    if (fluxosTriagemColumnNames.includes('permite_voltar')) {
      await queryRunner.query(
        `ALTER TABLE "fluxos_triagem" ALTER COLUMN "permite_voltar" SET NOT NULL`,
      );
    }
    if (fluxosTriagemColumnNames.includes('permite_sair')) {
      await queryRunner.query(
        `ALTER TABLE "fluxos_triagem" ALTER COLUMN "permite_sair" SET NOT NULL`,
      );
    }
    if (fluxosTriagemColumnNames.includes('salvar_historico')) {
      await queryRunner.query(
        `ALTER TABLE "fluxos_triagem" ALTER COLUMN "salvar_historico" SET NOT NULL`,
      );
    }
    if (fluxosTriagemColumnNames.includes('tentar_entender_texto_livre')) {
      await queryRunner.query(
        `ALTER TABLE "fluxos_triagem" ALTER COLUMN "tentar_entender_texto_livre" SET NOT NULL`,
      );
    }
    if (fluxosTriagemColumnNames.includes('total_execucoes')) {
      await queryRunner.query(
        `ALTER TABLE "fluxos_triagem" ALTER COLUMN "total_execucoes" SET NOT NULL`,
      );
    }
    if (fluxosTriagemColumnNames.includes('total_conclusoes')) {
      await queryRunner.query(
        `ALTER TABLE "fluxos_triagem" ALTER COLUMN "total_conclusoes" SET NOT NULL`,
      );
    }
    if (fluxosTriagemColumnNames.includes('total_abandonos')) {
      await queryRunner.query(
        `ALTER TABLE "fluxos_triagem" ALTER COLUMN "total_abandonos" SET NOT NULL`,
      );
    }
    if (fluxosTriagemColumnNames.includes('taxa_conclusao')) {
      await queryRunner.query(
        `ALTER TABLE "fluxos_triagem" ALTER COLUMN "taxa_conclusao" SET NOT NULL`,
      );
      await queryRunner.query(
        `ALTER TABLE "fluxos_triagem" ALTER COLUMN "taxa_conclusao" SET DEFAULT '0'`,
      );
    }
    if (fluxosTriagemColumnNames.includes('tempo_medio_conclusao_segundos')) {
      await queryRunner.query(
        `ALTER TABLE "fluxos_triagem" ALTER COLUMN "tempo_medio_conclusao_segundos" SET NOT NULL`,
      );
    }
    if (fluxosTriagemColumnNames.includes('created_at')) {
      await queryRunner.query(
        `ALTER TABLE "fluxos_triagem" ALTER COLUMN "created_at" SET NOT NULL`,
      );
    }
    if (fluxosTriagemColumnNames.includes('updated_at')) {
      await queryRunner.query(
        `ALTER TABLE "fluxos_triagem" ALTER COLUMN "updated_at" SET NOT NULL`,
      );
    }

    // Verificar quais colunas existem em nucleos_atendimento
    const nucleosAtendimentoColumns = await queryRunner.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'nucleos_atendimento'
    `);
    const nucleosColumnNames = nucleosAtendimentoColumns.map((col: any) => col.column_name);

    if (nucleosColumnNames.includes('cor')) {
      await queryRunner.query(`ALTER TABLE "nucleos_atendimento" ALTER COLUMN "cor" SET NOT NULL`);
    }
    if (nucleosColumnNames.includes('icone')) {
      await queryRunner.query(
        `ALTER TABLE "nucleos_atendimento" ALTER COLUMN "icone" SET NOT NULL`,
      );
    }
    if (nucleosColumnNames.includes('ativo')) {
      await queryRunner.query(
        `ALTER TABLE "nucleos_atendimento" ALTER COLUMN "ativo" SET NOT NULL`,
      );
    }
    if (nucleosColumnNames.includes('prioridade')) {
      await queryRunner.query(
        `ALTER TABLE "nucleos_atendimento" ALTER COLUMN "prioridade" SET NOT NULL`,
      );
    }
    if (nucleosColumnNames.includes('horario_funcionamento')) {
      await queryRunner.query(
        `ALTER TABLE "nucleos_atendimento" ALTER COLUMN "horario_funcionamento" DROP DEFAULT`,
      );
    }
    if (nucleosColumnNames.includes('timezone')) {
      await queryRunner.query(
        `ALTER TABLE "nucleos_atendimento" ALTER COLUMN "timezone" SET NOT NULL`,
      );
    }
    if (nucleosColumnNames.includes('sla_resposta_minutos')) {
      await queryRunner.query(
        `ALTER TABLE "nucleos_atendimento" ALTER COLUMN "sla_resposta_minutos" SET NOT NULL`,
      );
    }
    if (nucleosColumnNames.includes('sla_resolucao_horas')) {
      await queryRunner.query(
        `ALTER TABLE "nucleos_atendimento" ALTER COLUMN "sla_resolucao_horas" SET NOT NULL`,
      );
    }
    if (nucleosColumnNames.includes('tempo_medio_atendimento_minutos')) {
      await queryRunner.query(
        `ALTER TABLE "nucleos_atendimento" ALTER COLUMN "tempo_medio_atendimento_minutos" SET NOT NULL`,
      );
    }
    if (nucleosColumnNames.includes('atendentes_ids')) {
      await queryRunner.query(
        `ALTER TABLE "nucleos_atendimento" ALTER COLUMN "atendentes_ids" SET NOT NULL`,
      );
    }
    if (nucleosColumnNames.includes('capacidade_maxima_tickets')) {
      await queryRunner.query(
        `ALTER TABLE "nucleos_atendimento" ALTER COLUMN "capacidade_maxima_tickets" SET NOT NULL`,
      );
    }
    if (nucleosColumnNames.includes('tipo_distribuicao')) {
      await queryRunner.query(
        `ALTER TABLE "nucleos_atendimento" ALTER COLUMN "tipo_distribuicao" SET NOT NULL`,
      );
    }
    if (nucleosColumnNames.includes('total_tickets_abertos')) {
      await queryRunner.query(
        `ALTER TABLE "nucleos_atendimento" ALTER COLUMN "total_tickets_abertos" SET NOT NULL`,
      );
    }
    if (nucleosColumnNames.includes('total_tickets_resolvidos')) {
      await queryRunner.query(
        `ALTER TABLE "nucleos_atendimento" ALTER COLUMN "total_tickets_resolvidos" SET NOT NULL`,
      );
    }
    if (nucleosColumnNames.includes('taxa_satisfacao')) {
      await queryRunner.query(
        `ALTER TABLE "nucleos_atendimento" ALTER COLUMN "taxa_satisfacao" SET NOT NULL`,
      );
      await queryRunner.query(
        `ALTER TABLE "nucleos_atendimento" ALTER COLUMN "taxa_satisfacao" SET DEFAULT '0'`,
      );
    }
    if (nucleosColumnNames.includes('created_at')) {
      await queryRunner.query(
        `ALTER TABLE "nucleos_atendimento" ALTER COLUMN "created_at" SET NOT NULL`,
      );
    }
    if (nucleosColumnNames.includes('updated_at')) {
      await queryRunner.query(
        `ALTER TABLE "nucleos_atendimento" ALTER COLUMN "updated_at" SET NOT NULL`,
      );
    }
    await queryRunner.query(
      `ALTER TABLE "atendimento_tickets" ALTER COLUMN "numero" DROP NOT NULL`,
    );
    await queryRunner.query(`ALTER TABLE "atendimento_tickets" ALTER COLUMN "status" SET NOT NULL`);
    await queryRunner.query(
      `ALTER TABLE "atendimento_tickets" ALTER COLUMN "status" SET DEFAULT 'ABERTO'`,
    );
    await queryRunner.query(
      `ALTER TABLE "atendimento_tickets" ALTER COLUMN "prioridade" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "atendimento_tickets" ALTER COLUMN "prioridade" SET DEFAULT 'MEDIA'`,
    );
    await queryRunner.query(`ALTER TABLE "atendimento_tickets" DROP COLUMN "contato_telefone"`);
    await queryRunner.query(
      `ALTER TABLE "atendimento_tickets" ADD "contato_telefone" character varying(20)`,
    );
    await queryRunner.query(
      `ALTER TABLE "atendimento_tickets" ALTER COLUMN "data_abertura" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "atendimento_tickets" ALTER COLUMN "created_at" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "atendimento_tickets" ALTER COLUMN "updated_at" SET NOT NULL`,
    );

    // Verificar quais colunas existem em sessoes_triagem
    const sessoesTriagemColumns = await queryRunner.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'sessoes_triagem'
    `);
    const sessoesColumnNames = sessoesTriagemColumns.map((col: any) => col.column_name);

    if (sessoesColumnNames.includes('canal')) {
      await queryRunner.query(`ALTER TABLE "sessoes_triagem" ALTER COLUMN "canal" SET NOT NULL`);
    }
    if (sessoesColumnNames.includes('contexto')) {
      await queryRunner.query(`ALTER TABLE "sessoes_triagem" ALTER COLUMN "contexto" SET NOT NULL`);
    }
    if (sessoesColumnNames.includes('historico')) {
      await queryRunner.query(
        `ALTER TABLE "sessoes_triagem" ALTER COLUMN "historico" SET NOT NULL`,
      );
    }
    if (sessoesColumnNames.includes('status')) {
      await queryRunner.query(`ALTER TABLE "sessoes_triagem" ALTER COLUMN "status" SET NOT NULL`);
    }
    if (sessoesColumnNames.includes('iniciado_em')) {
      await queryRunner.query(
        `ALTER TABLE "sessoes_triagem" ALTER COLUMN "iniciado_em" SET NOT NULL`,
      );
    }
    if (sessoesColumnNames.includes('total_mensagens_enviadas')) {
      await queryRunner.query(
        `ALTER TABLE "sessoes_triagem" ALTER COLUMN "total_mensagens_enviadas" SET NOT NULL`,
      );
    }
    if (sessoesColumnNames.includes('total_mensagens_recebidas')) {
      await queryRunner.query(
        `ALTER TABLE "sessoes_triagem" ALTER COLUMN "total_mensagens_recebidas" SET NOT NULL`,
      );
    }
    if (sessoesColumnNames.includes('created_at')) {
      await queryRunner.query(
        `ALTER TABLE "sessoes_triagem" ALTER COLUMN "created_at" SET NOT NULL`,
      );
    }
    if (sessoesColumnNames.includes('updated_at')) {
      await queryRunner.query(
        `ALTER TABLE "sessoes_triagem" ALTER COLUMN "updated_at" SET NOT NULL`,
      );
    }

    // Verificar se user_activities existe
    const userActivitiesExists = await queryRunner.hasTable('user_activities');

    if (userActivitiesExists) {
      await queryRunner.query(
        `UPDATE "user_activities" SET "empresa_id" = "usuario_id" WHERE "empresa_id" IS NULL`,
      );
      await queryRunner.query(
        `ALTER TABLE "user_activities" ALTER COLUMN "empresa_id" TYPE character varying USING "empresa_id"::text`,
      );
      await queryRunner.query(
        `ALTER TABLE "user_activities" ALTER COLUMN "empresa_id" SET NOT NULL`,
      );
      await queryRunner.query(
        `UPDATE "user_activities" SET "tipo" = 'LOGIN' WHERE COALESCE(TRIM("tipo"::text), '') = ''`,
      );
      await queryRunner.query(
        `CREATE TYPE "public"."user_activities_tipo_enum" AS ENUM('LOGIN', 'LOGOUT', 'CRIACAO', 'EDICAO', 'EXCLUSAO', 'ALTERACAO_STATUS', 'RESET_SENHA')`,
      );
      await queryRunner.query(
        `ALTER TABLE "user_activities" ALTER COLUMN "tipo" TYPE "public"."user_activities_tipo_enum" USING "tipo"::"public"."user_activities_tipo_enum"`,
      );
      await queryRunner.query(
        `ALTER TABLE "user_activities" ALTER COLUMN "tipo" SET DEFAULT 'LOGIN'`,
      );
      await queryRunner.query(
        `UPDATE "user_activities" SET "descricao" = 'Atividade sem descrição' WHERE COALESCE(TRIM("descricao"), '') = ''`,
      );
      await queryRunner.query(
        `ALTER TABLE "user_activities" ALTER COLUMN "descricao" TYPE character varying USING "descricao"::character varying`,
      );
      await queryRunner.query(
        `ALTER TABLE "user_activities" ALTER COLUMN "descricao" SET NOT NULL`,
      );
      await queryRunner.query(
        `ALTER TABLE "user_activities" ALTER COLUMN "created_at" SET NOT NULL`,
      );
    }
    await queryRunner.query(
      `ALTER TABLE "equipe_atribuicoes" ALTER COLUMN "prioridade" SET NOT NULL`,
    );
    await queryRunner.query(`COMMENT ON COLUMN "equipe_atribuicoes"."prioridade" IS NULL`);
    await queryRunner.query(`ALTER TABLE "equipe_atribuicoes" ALTER COLUMN "ativo" SET NOT NULL`);
    await queryRunner.query(
      `ALTER TABLE "equipe_atribuicoes" ALTER COLUMN "created_at" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "equipe_atribuicoes" ALTER COLUMN "updated_at" SET NOT NULL`,
    );
    await queryRunner.query(`ALTER TABLE "atendente_equipes" ALTER COLUMN "funcao" SET NOT NULL`);
    await queryRunner.query(`COMMENT ON COLUMN "atendente_equipes"."funcao" IS NULL`);
    await queryRunner.query(
      `ALTER TABLE "atendente_equipes" ALTER COLUMN "created_at" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "atendente_equipes" ALTER COLUMN "updated_at" SET NOT NULL`,
    );
    await queryRunner.query(`ALTER TABLE "equipes" ALTER COLUMN "cor" SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE "equipes" ALTER COLUMN "icone" SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE "equipes" ALTER COLUMN "ativo" SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE "equipes" ALTER COLUMN "created_at" SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE "equipes" ALTER COLUMN "updated_at" SET NOT NULL`);
    await queryRunner.query(
      `ALTER TABLE "atendente_atribuicoes" ALTER COLUMN "prioridade" SET NOT NULL`,
    );
    await queryRunner.query(`COMMENT ON COLUMN "atendente_atribuicoes"."prioridade" IS NULL`);
    await queryRunner.query(
      `ALTER TABLE "atendente_atribuicoes" ALTER COLUMN "ativo" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "atendente_atribuicoes" ALTER COLUMN "created_at" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "atendente_atribuicoes" ALTER COLUMN "updated_at" SET NOT NULL`,
    );
    const clienteIdColumn = await queryRunner.query(
      `SELECT data_type FROM information_schema.columns WHERE table_name = 'contratos' AND column_name = 'clienteId'`,
    );
    if (clienteIdColumn.length > 0 && clienteIdColumn[0]?.data_type !== 'uuid') {
      const mappingExists = await queryRunner.query(
        `SELECT to_regclass('public.cliente_id_mapping') as reg`,
      );
      await queryRunner.query(`ALTER TABLE "contratos" ADD "clienteId_uuid" uuid`);
      if (mappingExists?.[0]?.reg) {
        await queryRunner.query(
          `UPDATE "contratos" c SET "clienteId_uuid" = cim.cliente_uuid FROM cliente_id_mapping cim WHERE c."clienteId" = cim.numeric_id`,
        );
      }
      await queryRunner.query(
        `UPDATE "contratos" SET "clienteId_uuid" = uuid_generate_v4() WHERE "clienteId_uuid" IS NULL`,
      );
      await queryRunner.query(`ALTER TABLE "contratos" DROP COLUMN "clienteId"`);
      await queryRunner.query(
        `ALTER TABLE "contratos" RENAME COLUMN "clienteId_uuid" TO "clienteId"`,
      );
    }
    await queryRunner.query(`ALTER TABLE "contratos" ALTER COLUMN "clienteId" SET NOT NULL`);
    if (itensFaturaExists) {
      await queryRunner.query(
        `ALTER TABLE "itens_fatura" ALTER COLUMN "percentualDesconto" SET NOT NULL`,
      );
      await queryRunner.query(
        `ALTER TABLE "itens_fatura" ALTER COLUMN "valorDesconto" SET NOT NULL`,
      );
    }
    if (pagamentosExists) {
      await queryRunner.query(`ALTER TABLE "pagamentos" DROP COLUMN "tipo"`);
      await queryRunner.query(
        `CREATE TYPE "public"."pagamentos_tipo_enum" AS ENUM('pagamento', 'estorno', 'ajuste', 'desconto')`,
      );
      await queryRunner.query(
        `ALTER TABLE "pagamentos" ADD "tipo" "public"."pagamentos_tipo_enum" NOT NULL DEFAULT 'pagamento'`,
      );
      await queryRunner.query(`ALTER TABLE "pagamentos" DROP COLUMN "status"`);
      await queryRunner.query(
        `CREATE TYPE "public"."pagamentos_status_enum" AS ENUM('pendente', 'processando', 'aprovado', 'rejeitado', 'cancelado', 'estornado')`,
      );
      await queryRunner.query(
        `ALTER TABLE "pagamentos" ADD "status" "public"."pagamentos_status_enum" NOT NULL DEFAULT 'pendente'`,
      );
      await queryRunner.query(`ALTER TABLE "pagamentos" ALTER COLUMN "taxa" SET NOT NULL`);
      await queryRunner.query(`ALTER TABLE "pagamentos" DROP COLUMN "dadosCompletos"`);
      await queryRunner.query(`ALTER TABLE "pagamentos" ADD "dadosCompletos" json`);
      await queryRunner.query(`ALTER TABLE "pagamentos" ALTER COLUMN "createdAt" SET NOT NULL`);
      await queryRunner.query(
        `ALTER TABLE "pagamentos" ALTER COLUMN "createdAt" SET DEFAULT now()`,
      );
    }
    await queryRunner.query(`ALTER TABLE "faturas" ALTER COLUMN "contratoId" SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE "faturas" ALTER COLUMN "clienteId" SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE "faturas" DROP COLUMN IF EXISTS "tipo"`);
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'faturas_tipo_enum') THEN
          CREATE TYPE "public"."faturas_tipo_enum" AS ENUM('unica', 'recorrente', 'parcela', 'adicional');
        END IF;
      END
      $$;
    `);
    await queryRunner.query(
      `ALTER TABLE "faturas" ADD COLUMN IF NOT EXISTS "tipo" "public"."faturas_tipo_enum" NOT NULL DEFAULT 'unica'`,
    );
    await queryRunner.query(`ALTER TABLE "faturas" DROP COLUMN IF EXISTS "status"`);
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'faturas_status_enum') THEN
          CREATE TYPE "public"."faturas_status_enum" AS ENUM('pendente', 'enviada', 'paga', 'vencida', 'cancelada', 'parcialmente_paga');
        END IF;
      END
      $$;
    `);
    await queryRunner.query(
      `ALTER TABLE "faturas" ADD COLUMN IF NOT EXISTS "status" "public"."faturas_status_enum" NOT NULL DEFAULT 'pendente'`,
    );
    await queryRunner.query(
      `ALTER TABLE "faturas" DROP COLUMN IF EXISTS "formaPagamentoPreferida"`,
    );
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'faturas_formapagamentopreferida_enum') THEN
          CREATE TYPE "public"."faturas_formapagamentopreferida_enum" AS ENUM('pix', 'cartao_credito', 'cartao_debito', 'boleto', 'transferencia', 'dinheiro');
        END IF;
      END
      $$;
    `);
    await queryRunner.query(
      `ALTER TABLE "faturas" ADD COLUMN IF NOT EXISTS "formaPagamentoPreferida" "public"."faturas_formapagamentopreferida_enum"`,
    );

    // Verificar colunas existentes em faturas antes de ALTER COLUMN
    const faturasColumnNames = (
      await queryRunner.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'faturas'
      AND column_name IN ('valorPago', 'valorDesconto', 'valorJuros', 'valorMulta', 'metadados', 'ativo', 'createdAt', 'updatedAt', 'valorTotal', 'clienteId')
    `)
    ).map((row: any) => row.column_name);

    if (faturasColumnNames.includes('valorPago')) {
      await queryRunner.query(`ALTER TABLE "faturas" ALTER COLUMN "valorPago" SET NOT NULL`);
    }
    if (faturasColumnNames.includes('valorDesconto')) {
      await queryRunner.query(`ALTER TABLE "faturas" ALTER COLUMN "valorDesconto" SET NOT NULL`);
    }
    if (faturasColumnNames.includes('valorJuros')) {
      await queryRunner.query(`ALTER TABLE "faturas" ALTER COLUMN "valorJuros" SET NOT NULL`);
    }
    if (faturasColumnNames.includes('valorMulta')) {
      await queryRunner.query(`ALTER TABLE "faturas" ALTER COLUMN "valorMulta" SET NOT NULL`);
    }
    if (faturasColumnNames.includes('metadados')) {
      await queryRunner.query(`ALTER TABLE "faturas" DROP COLUMN "metadados"`);
      await queryRunner.query(`ALTER TABLE "faturas" ADD "metadados" json`);
    }
    if (faturasColumnNames.includes('ativo')) {
      await queryRunner.query(`ALTER TABLE "faturas" ALTER COLUMN "ativo" SET NOT NULL`);
    }
    if (faturasColumnNames.includes('createdAt')) {
      await queryRunner.query(`ALTER TABLE "faturas" ALTER COLUMN "createdAt" SET NOT NULL`);
      await queryRunner.query(`ALTER TABLE "faturas" ALTER COLUMN "createdAt" SET DEFAULT now()`);
    }
    if (faturasColumnNames.includes('updatedAt')) {
      await queryRunner.query(`ALTER TABLE "faturas" ALTER COLUMN "updatedAt" SET NOT NULL`);
      await queryRunner.query(`ALTER TABLE "faturas" ALTER COLUMN "updatedAt" SET DEFAULT now()`);
    }
    if (contasPagarExists) {
      const contasPagarDescricaoColumn = await queryRunner.query(
        `SELECT column_name FROM information_schema.columns WHERE table_name = 'contas_pagar' AND column_name = 'descricao'`,
      );
      await queryRunner.query(`ALTER TABLE "contas_pagar" DISABLE TRIGGER USER`);
      if (contasPagarDescricaoColumn.length > 0) {
        await queryRunner.query(
          `ALTER TABLE "contas_pagar" ADD "descricao_temp" character varying(255)`,
        );
        await queryRunner.query(
          `UPDATE "contas_pagar" SET "descricao_temp" = CASE WHEN COALESCE(TRIM("descricao"::text), '') = '' THEN 'Descrição não informada' ELSE LEFT(TRIM("descricao"::text), 255) END`,
        );
        await queryRunner.query(`ALTER TABLE "contas_pagar" DROP COLUMN "descricao"`);
        await queryRunner.query(
          `ALTER TABLE "contas_pagar" RENAME COLUMN "descricao_temp" TO "descricao"`,
        );
      } else {
        await queryRunner.query(
          `ALTER TABLE "contas_pagar" ADD "descricao" character varying(255)`,
        );
        await queryRunner.query(
          `UPDATE "contas_pagar" SET "descricao" = 'Descrição não informada' WHERE COALESCE(TRIM("descricao"::text), '') = ''`,
        );
      }
      await queryRunner.query(`ALTER TABLE "contas_pagar" ALTER COLUMN "descricao" SET NOT NULL`);
      await queryRunner.query(`ALTER TABLE "contas_pagar" ADD "data_vencimento_temp" TIMESTAMP`);
      await queryRunner.query(
        `UPDATE "contas_pagar" SET "data_vencimento_temp" = COALESCE("data_vencimento"::timestamp, "data_pagamento"::timestamp, CURRENT_TIMESTAMP)`,
      );
      await queryRunner.query(`ALTER TABLE "contas_pagar" DROP COLUMN "data_vencimento"`);
      await queryRunner.query(
        `ALTER TABLE "contas_pagar" RENAME COLUMN "data_vencimento_temp" TO "data_vencimento"`,
      );
      await queryRunner.query(
        `ALTER TABLE "contas_pagar" ALTER COLUMN "data_vencimento" SET NOT NULL`,
      );
      await queryRunner.query(`ALTER TABLE "contas_pagar" ADD "data_pagamento_temp" TIMESTAMP`);
      await queryRunner.query(
        `UPDATE "contas_pagar" SET "data_pagamento_temp" = CASE WHEN "data_pagamento" IS NOT NULL THEN "data_pagamento"::timestamp ELSE NULL END`,
      );
      await queryRunner.query(`ALTER TABLE "contas_pagar" DROP COLUMN "data_pagamento"`);
      await queryRunner.query(
        `ALTER TABLE "contas_pagar" RENAME COLUMN "data_pagamento_temp" TO "data_pagamento"`,
      );
      await queryRunner.query(`ALTER TABLE "contas_pagar" ENABLE TRIGGER USER`);
      await queryRunner.query(`ALTER TABLE "contas_pagar" DROP COLUMN "status"`);
      await queryRunner.query(
        `CREATE TYPE "public"."contas_pagar_status_enum" AS ENUM('pendente', 'paga', 'vencida', 'cancelada')`,
      );
      await queryRunner.query(
        `ALTER TABLE "contas_pagar" ADD "status" "public"."contas_pagar_status_enum" NOT NULL DEFAULT 'pendente'`,
      );
      await queryRunner.query(`ALTER TABLE "contas_pagar" DISABLE TRIGGER USER`);
      const contasPagarEmpresaColumn = await queryRunner.query(
        `SELECT column_name FROM information_schema.columns WHERE table_name = 'contas_pagar' AND column_name = 'empresa_id'`,
      );
      if (contasPagarEmpresaColumn.length > 0) {
        await queryRunner.query(
          `ALTER TABLE "contas_pagar" ADD "empresa_id_temp" character varying`,
        );
        await queryRunner.query(
          `UPDATE "contas_pagar" SET "empresa_id_temp" = NULLIF(TRIM("empresa_id"::text), '')`,
        );
        await queryRunner.query(`ALTER TABLE "contas_pagar" DROP COLUMN "empresa_id"`);
        await queryRunner.query(
          `ALTER TABLE "contas_pagar" RENAME COLUMN "empresa_id_temp" TO "empresa_id"`,
        );
      } else {
        await queryRunner.query(`ALTER TABLE "contas_pagar" ADD "empresa_id" character varying`);
      }
      await queryRunner.query(
        `UPDATE "contas_pagar" SET "empresa_id" = COALESCE(NULLIF(TRIM("empresa_id"::text), ''), 'empresa_nao_informada') WHERE "empresa_id" IS NULL OR TRIM("empresa_id"::text) = ''`,
      );
      await queryRunner.query(`ALTER TABLE "contas_pagar" ALTER COLUMN "empresa_id" SET NOT NULL`);
      await queryRunner.query(`ALTER TABLE "contas_pagar" ENABLE TRIGGER USER`);
      await queryRunner.query(`ALTER TABLE "contas_pagar" DROP COLUMN "observacoes"`);
      await queryRunner.query(`ALTER TABLE "contas_pagar" ADD "observacoes" character varying`);
      await queryRunner.query(`ALTER TABLE "contas_pagar" DROP COLUMN "numero_documento"`);
      await queryRunner.query(
        `ALTER TABLE "contas_pagar" ADD "numero_documento" character varying`,
      );
    }

    // Operações adicionais em faturas com guards (linhas 767-781 originais)
    if (faturasColumnNames.includes('clienteId')) {
      await queryRunner.query(`ALTER TABLE "faturas" ALTER COLUMN "clienteId" SET NOT NULL`);
    }
    if (faturasColumnNames.includes('valorTotal')) {
      await queryRunner.query(`ALTER TABLE "faturas" ALTER COLUMN "valorTotal" TYPE numeric(12,2)`);
    }
    if (faturasColumnNames.includes('valorPago')) {
      await queryRunner.query(`ALTER TABLE "faturas" ALTER COLUMN "valorPago" TYPE numeric(12,2)`);
      await queryRunner.query(`ALTER TABLE "faturas" ALTER COLUMN "valorPago" SET NOT NULL`);
    }
    if (faturasColumnNames.includes('valorDesconto')) {
      await queryRunner.query(
        `ALTER TABLE "faturas" ALTER COLUMN "valorDesconto" TYPE numeric(12,2)`,
      );
      await queryRunner.query(`ALTER TABLE "faturas" ALTER COLUMN "valorDesconto" SET NOT NULL`);
    }
    if (faturasColumnNames.includes('valorJuros')) {
      await queryRunner.query(`ALTER TABLE "faturas" ALTER COLUMN "valorJuros" TYPE numeric(12,2)`);
      await queryRunner.query(`ALTER TABLE "faturas" ALTER COLUMN "valorJuros" SET NOT NULL`);
    }
    if (faturasColumnNames.includes('valorMulta')) {
      await queryRunner.query(`ALTER TABLE "faturas" ALTER COLUMN "valorMulta" TYPE numeric(12,2)`);
      await queryRunner.query(`ALTER TABLE "faturas" ALTER COLUMN "valorMulta" SET NOT NULL`);
    }
    if (faturasColumnNames.includes('ativo')) {
      await queryRunner.query(`ALTER TABLE "faturas" ALTER COLUMN "ativo" SET NOT NULL`);
    }
    if (faturasColumnNames.includes('createdAt')) {
      await queryRunner.query(`ALTER TABLE "faturas" ALTER COLUMN "createdAt" SET NOT NULL`);
      await queryRunner.query(`ALTER TABLE "faturas" ALTER COLUMN "createdAt" SET DEFAULT now()`);
    }
    if (faturasColumnNames.includes('updatedAt')) {
      await queryRunner.query(`ALTER TABLE "faturas" ALTER COLUMN "updatedAt" SET NOT NULL`);
      await queryRunner.query(`ALTER TABLE "faturas" ALTER COLUMN "updatedAt" SET DEFAULT now()`);
    }

    await queryRunner.query(
      `ALTER TABLE "atendimento_mensagens" ALTER COLUMN "created_at" SET NOT NULL`,
    );

    // Operações em atendimento_integracoes_config com guards
    if (atendimentoIntegracoesExists) {
      await queryRunner.query(
        `ALTER TABLE "atendimento_integracoes_config" DROP CONSTRAINT IF EXISTS "atendimento_integracoes_config_empresa_id_key"`,
      );

      const integracoesColumnNames = (
        await queryRunner.query(`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name = 'atendimento_integracoes_config'
        AND column_name IN ('tipo', 'ativo', 'credenciais', 'webhook_secret', 'whatsapp_api_token', 'criado_em', 'atualizado_em')
      `)
      ).map((row: any) => row.column_name);

      if (integracoesColumnNames.includes('tipo')) {
        await queryRunner.query(
          `ALTER TABLE "atendimento_integracoes_config" ALTER COLUMN "tipo" SET NOT NULL`,
        );
        await queryRunner.query(
          `COMMENT ON COLUMN "atendimento_integracoes_config"."tipo" IS NULL`,
        );
      }
      if (integracoesColumnNames.includes('ativo')) {
        await queryRunner.query(
          `ALTER TABLE "atendimento_integracoes_config" ALTER COLUMN "ativo" SET NOT NULL`,
        );
        await queryRunner.query(
          `COMMENT ON COLUMN "atendimento_integracoes_config"."ativo" IS NULL`,
        );
      }
      if (integracoesColumnNames.includes('credenciais')) {
        await queryRunner.query(
          `COMMENT ON COLUMN "atendimento_integracoes_config"."credenciais" IS NULL`,
        );
      }
      if (integracoesColumnNames.includes('webhook_secret')) {
        await queryRunner.query(
          `COMMENT ON COLUMN "atendimento_integracoes_config"."webhook_secret" IS NULL`,
        );
      }
      if (integracoesColumnNames.includes('whatsapp_api_token')) {
        await queryRunner.query(
          `ALTER TABLE "atendimento_integracoes_config" DROP COLUMN "whatsapp_api_token"`,
        );
        await queryRunner.query(
          `ALTER TABLE "atendimento_integracoes_config" ADD "whatsapp_api_token" character varying(500)`,
        );
      }
      if (integracoesColumnNames.includes('criado_em')) {
        await queryRunner.query(
          `ALTER TABLE "atendimento_integracoes_config" ALTER COLUMN "criado_em" SET NOT NULL`,
        );
      }
      if (integracoesColumnNames.includes('atualizado_em')) {
        await queryRunner.query(
          `ALTER TABLE "atendimento_integracoes_config" ALTER COLUMN "atualizado_em" SET NOT NULL`,
        );
      }
    }

    // Operações em filas com guard
    if (filasExists) {
      await queryRunner.query(`ALTER TABLE "filas" ALTER COLUMN "ativo" SET NOT NULL`);
      await queryRunner.query(`ALTER TABLE "filas" ALTER COLUMN "ordem" SET NOT NULL`);
      await queryRunner.query(`ALTER TABLE "filas" ALTER COLUMN "createdAt" SET NOT NULL`);
      await queryRunner.query(`ALTER TABLE "filas" ALTER COLUMN "updatedAt" SET NOT NULL`);
    }

    // Operações em atendentes com guard
    if (atendentesExists) {
      const atendentesEmailColumn = await queryRunner.query(
        `SELECT column_name FROM information_schema.columns WHERE table_name = 'atendentes' AND column_name = 'email'`,
      );
      if (atendentesEmailColumn.length > 0) {
        await queryRunner.query(
          `UPDATE "atendentes" SET "email" = NULLIF(TRIM("email"::text), '')`,
        );
        await queryRunner.query(
          `UPDATE "atendentes" SET "email" = CONCAT('sem-email-', id::text, '@legacy.local') WHERE "email" IS NULL`,
        );
        await queryRunner.query(
          `ALTER TABLE "atendentes" ALTER COLUMN "email" TYPE character varying(100) USING LEFT(TRIM("email"::text), 100)`,
        );
      } else {
        await queryRunner.query(`ALTER TABLE "atendentes" ADD "email" character varying(100)`);
        await queryRunner.query(
          `UPDATE "atendentes" SET "email" = CONCAT('sem-email-', id::text, '@legacy.local') WHERE "email" IS NULL`,
        );
      }
      await queryRunner.query(`ALTER TABLE "atendentes" ALTER COLUMN "email" SET NOT NULL`);
      await queryRunner.query(`ALTER TABLE "atendentes" ALTER COLUMN "status" SET NOT NULL`);
      await queryRunner.query(
        `ALTER TABLE "atendentes" ALTER COLUMN "capacidadeMaxima" SET NOT NULL`,
      );
      await queryRunner.query(`ALTER TABLE "atendentes" ALTER COLUMN "ticketsAtivos" SET NOT NULL`);
      await queryRunner.query(`ALTER TABLE "atendentes" ALTER COLUMN "createdAt" SET NOT NULL`);
      await queryRunner.query(`ALTER TABLE "atendentes" ALTER COLUMN "updatedAt" SET NOT NULL`);
    }

    // Operações em atendimento_canais com guard
    if (atendimentoCanaisExists) {
      const atendimentoCanaisNomeColumn = await queryRunner.query(
        `SELECT column_name FROM information_schema.columns WHERE table_name = 'atendimento_canais' AND column_name = 'nome'`,
      );
      if (atendimentoCanaisNomeColumn.length > 0) {
        await queryRunner.query(
          `ALTER TABLE "atendimento_canais" ADD "nome_temp" character varying(50)`,
        );
        await queryRunner.query(`
                UPDATE "atendimento_canais"
                SET "nome_temp" = CASE
                    WHEN COALESCE(TRIM("nome"::text), '') = ''
                        THEN CONCAT('Canal ', COALESCE(NULLIF(TRIM("tipo"::text), ''), 'desconhecido'), '-', id::text)
                    ELSE LEFT(TRIM("nome"::text), 50)
                END
            `);
        await queryRunner.query(`ALTER TABLE "atendimento_canais" DROP COLUMN "nome"`);
        await queryRunner.query(
          `ALTER TABLE "atendimento_canais" RENAME COLUMN "nome_temp" TO "nome"`,
        );
        await queryRunner.query(
          `ALTER TABLE "atendimento_canais" ALTER COLUMN "nome" SET NOT NULL`,
        );
      } else {
        await queryRunner.query(
          `ALTER TABLE "atendimento_canais" ADD "nome" character varying(50) NOT NULL DEFAULT 'Canal sem nome'`,
        );
        await queryRunner.query(
          `ALTER TABLE "atendimento_canais" ALTER COLUMN "nome" DROP DEFAULT`,
        );
      }
      await queryRunner.query(
        `CREATE TYPE "public"."atendimento_canais_tipo_enum" AS ENUM('whatsapp', 'telegram', 'email', 'sms', 'facebook', 'instagram', 'webchat')`,
      );
      await queryRunner.query(`
            UPDATE "atendimento_canais"
            SET "tipo" = CASE
                WHEN LOWER(TRIM("tipo"::text)) IN ('whatsapp', 'whatsapp_api', 'whatsapp_business', 'wpp', 'meta_whatsapp', 'meta_whatsapp_api') THEN 'whatsapp'
                WHEN LOWER(TRIM("tipo"::text)) IN ('telegram', 'telegram_bot', 'telegram_bot_api') THEN 'telegram'
                WHEN LOWER(TRIM("tipo"::text)) IN ('email', 'e-mail', 'mail') THEN 'email'
                WHEN LOWER(TRIM("tipo"::text)) IN ('sms', 'text', 'text_message') THEN 'sms'
                WHEN LOWER(TRIM("tipo"::text)) IN ('facebook', 'facebook_messenger', 'messenger') THEN 'facebook'
                WHEN LOWER(TRIM("tipo"::text)) IN ('instagram', 'instagram_dm') THEN 'instagram'
                WHEN LOWER(TRIM("tipo"::text)) IN ('webchat', 'web_chat', 'chat', 'site', 'widget') THEN 'webchat'
                ELSE 'whatsapp'
            END
        `);
      await queryRunner.query(
        `ALTER TABLE "atendimento_canais" ALTER COLUMN "tipo" TYPE "public"."atendimento_canais_tipo_enum" USING LOWER(TRIM("tipo"::text))::"public"."atendimento_canais_tipo_enum"`,
      );
      await queryRunner.query(`ALTER TABLE "atendimento_canais" ALTER COLUMN "tipo" SET NOT NULL`);
      await queryRunner.query(
        `COMMENT ON COLUMN "atendimento_canais"."provedor" IS 'whatsapp_business_api, twilio, telegram_bot_api, sendgrid, meta_graph_api'`,
      );
      await queryRunner.query(
        `ALTER TABLE "atendimento_canais" ALTER COLUMN "provedor" DROP DEFAULT`,
      );
      await queryRunner.query(`ALTER TABLE "atendimento_canais" DROP COLUMN "status"`);
      await queryRunner.query(
        `CREATE TYPE "public"."atendimento_canais_status_enum" AS ENUM('ativo', 'inativo', 'configurando', 'erro')`,
      );
      await queryRunner.query(
        `ALTER TABLE "atendimento_canais" ADD "status" "public"."atendimento_canais_status_enum" NOT NULL DEFAULT 'configurando'`,
      );
      await queryRunner.query(
        `COMMENT ON COLUMN "atendimento_canais"."config" IS 'Configurações específicas do provider (tokens, credenciais, etc)'`,
      );
      await queryRunner.query(`ALTER TABLE "atendimento_canais" ALTER COLUMN "ativo" SET NOT NULL`);
      await queryRunner.query(
        `ALTER TABLE "atendimento_canais" ALTER COLUMN "ativo" SET DEFAULT false`,
      );
      await queryRunner.query(
        `ALTER TABLE "atendimento_canais" ALTER COLUMN "auto_resposta_ativa" SET NOT NULL`,
      );
      await queryRunner.query(
        `ALTER TABLE "atendimento_canais" ALTER COLUMN "created_at" SET NOT NULL`,
      );
      await queryRunner.query(
        `ALTER TABLE "atendimento_canais" ALTER COLUMN "updated_at" SET NOT NULL`,
      );
    }

    // Operações em canais com guard
    if (canaisExists) {
      const canaisNomeColumn = await queryRunner.query(
        `SELECT column_name FROM information_schema.columns WHERE table_name = 'canais' AND column_name = 'nome'`,
      );
      if (canaisNomeColumn.length > 0) {
        await queryRunner.query(`ALTER TABLE "canais" ADD "nome_temp" character varying(100)`);
        await queryRunner.query(`
                UPDATE "canais"
                SET "nome_temp" = CASE
                    WHEN COALESCE(TRIM("nome"::text), '') = ''
                        THEN CONCAT('Canal ', COALESCE(NULLIF(TRIM("tipo"::text), ''), 'desconhecido'), '-', id::text)
                    ELSE LEFT(TRIM("nome"::text), 100)
                END
            `);
        await queryRunner.query(`ALTER TABLE "canais" DROP COLUMN "nome"`);
        await queryRunner.query(`ALTER TABLE "canais" RENAME COLUMN "nome_temp" TO "nome"`);
      } else {
        await queryRunner.query(
          `ALTER TABLE "canais" ADD "nome" character varying(100) NOT NULL DEFAULT 'Canal sem nome'`,
        );
        await queryRunner.query(`ALTER TABLE "canais" ALTER COLUMN "nome" DROP DEFAULT`);
      }
      await queryRunner.query(`ALTER TABLE "canais" ALTER COLUMN "nome" SET NOT NULL`);

      const canaisTipoColumn = await queryRunner.query(
        `SELECT column_name FROM information_schema.columns WHERE table_name = 'canais' AND column_name = 'tipo'`,
      );
      if (canaisTipoColumn.length > 0) {
        await queryRunner.query(`
                UPDATE "canais"
                SET "tipo" = CASE
                    WHEN LOWER(TRIM("tipo"::text)) IN ('whatsapp', 'whatsapp_api', 'whatsapp_business', 'wpp', 'meta_whatsapp', 'meta_whatsapp_api') THEN 'whatsapp'
                    WHEN LOWER(TRIM("tipo"::text)) IN ('telegram', 'telegram_bot', 'telegram_bot_api') THEN 'telegram'
                    WHEN LOWER(TRIM("tipo"::text)) IN ('email', 'e-mail', 'mail') THEN 'email'
                    WHEN LOWER(TRIM("tipo"::text)) IN ('sms', 'text', 'text_message') THEN 'sms'
                    WHEN LOWER(TRIM("tipo"::text)) IN ('facebook', 'facebook_messenger', 'messenger') THEN 'facebook'
                    WHEN LOWER(TRIM("tipo"::text)) IN ('instagram', 'instagram_dm') THEN 'instagram'
                    WHEN LOWER(TRIM("tipo"::text)) IN ('webchat', 'web_chat', 'chat', 'site', 'widget') THEN 'webchat'
                    ELSE 'whatsapp'
                END
            `);
        await queryRunner.query(
          `ALTER TABLE "canais" ALTER COLUMN "tipo" TYPE character varying(30) USING LOWER(TRIM("tipo"::text))`,
        );
      } else {
        await queryRunner.query(`ALTER TABLE "canais" ADD "tipo" character varying(30)`);
      }
      await queryRunner.query(
        `UPDATE "canais" SET "tipo" = 'whatsapp' WHERE COALESCE(TRIM("tipo"::text), '') = '' OR "tipo" IS NULL`,
      );
      await queryRunner.query(`ALTER TABLE "canais" ALTER COLUMN "tipo" SET NOT NULL`);

      const canaisProviderColumn = await queryRunner.query(
        `SELECT column_name FROM information_schema.columns WHERE table_name = 'canais' AND column_name = 'provider'`,
      );
      if (canaisProviderColumn.length > 0) {
        await queryRunner.query(
          `ALTER TABLE "canais" ALTER COLUMN "provider" TYPE character varying(100) USING NULLIF(TRIM("provider"::text), '')`,
        );
      } else {
        await queryRunner.query(`ALTER TABLE "canais" ADD "provider" character varying(100)`);
      }

      const canaisStatusColumn = await queryRunner.query(
        `SELECT column_name FROM information_schema.columns WHERE table_name = 'canais' AND column_name = 'status'`,
      );
      if (canaisStatusColumn.length > 0) {
        await queryRunner.query(
          `ALTER TABLE "canais" ALTER COLUMN "status" TYPE character varying(30) USING NULLIF(TRIM("status"::text), '')`,
        );
      } else {
        await queryRunner.query(`ALTER TABLE "canais" ADD "status" character varying(30)`);
      }
      await queryRunner.query(
        `UPDATE "canais" SET "status" = 'configurando' WHERE COALESCE(TRIM("status"::text), '') = ''`,
      );

      const canaisWebhookUrlColumn = await queryRunner.query(
        `SELECT column_name FROM information_schema.columns WHERE table_name = 'canais' AND column_name = 'webhook_url'`,
      );
      if (canaisWebhookUrlColumn.length > 0) {
        await queryRunner.query(
          `ALTER TABLE "canais" ALTER COLUMN "webhook_url" TYPE character varying(500) USING NULLIF(TRIM("webhook_url"::text), '')`,
        );
      } else {
        await queryRunner.query(`ALTER TABLE "canais" ADD "webhook_url" character varying(500)`);
      }

      const canaisWebhookSecretColumn = await queryRunner.query(
        `SELECT column_name FROM information_schema.columns WHERE table_name = 'canais' AND column_name = 'webhook_secret'`,
      );
      if (canaisWebhookSecretColumn.length > 0) {
        await queryRunner.query(
          `ALTER TABLE "canais" ALTER COLUMN "webhook_secret" TYPE character varying(255) USING NULLIF(TRIM("webhook_secret"::text), '')`,
        );
      } else {
        await queryRunner.query(`ALTER TABLE "canais" ADD "webhook_secret" character varying(255)`);
      }

      await queryRunner.query(`ALTER TABLE "canais" ALTER COLUMN "ativo" SET NOT NULL`);
      await queryRunner.query(`ALTER TABLE "canais" ALTER COLUMN "createdAt" SET NOT NULL`);
      await queryRunner.query(`ALTER TABLE "canais" ALTER COLUMN "updatedAt" SET NOT NULL`);
    }

    await queryRunner.query(
      `CREATE INDEX "IDX_51444df940548e9dda1be15423" ON "atendimento_tickets" ("atendente_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_de0189e9fc08cd5284c0a461b7" ON "atendimento_tickets" ("status") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_b4bbaa2f40bf189614a186b4cc" ON "atendimento_tickets" ("empresa_id") `,
    );

    // Índices em faturas - verificar colunas primeiro
    if (faturasExists) {
      const faturasIndexColumns = await queryRunner.query(`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name = 'faturas'
        AND column_name IN ('clienteId', 'status', 'dataEmissao', 'dataVencimento', 'ativo', 'createdAt', 'numero')
      `);
      const faturasIndexColNames = faturasIndexColumns.map((row: any) => row.column_name);

      if (faturasIndexColNames.includes('clienteId')) {
        await queryRunner.query(
          `CREATE INDEX "IDX_67862e1af92d16dfa50f4e9d18" ON "faturas" ("clienteId") `,
        );
      }
      if (faturasIndexColNames.includes('status')) {
        await queryRunner.query(
          `CREATE INDEX "IDX_1162d4fe194d2e32a9ecf6ccb4" ON "faturas" ("status") `,
        );
      }
      if (faturasIndexColNames.includes('dataEmissao')) {
        await queryRunner.query(
          `CREATE INDEX "IDX_c0d57c7b5bde732ac3d3ed3558" ON "faturas" ("dataEmissao") `,
        );
      }
      if (faturasIndexColNames.includes('dataVencimento')) {
        await queryRunner.query(
          `CREATE INDEX "IDX_139d3276e0a299deacb53a557d" ON "faturas" ("dataVencimento") `,
        );
      }
      if (faturasIndexColNames.includes('ativo')) {
        await queryRunner.query(
          `CREATE INDEX "IDX_60cf6cd7b6a1b7298af56b056d" ON "faturas" ("ativo") `,
        );
      }
      if (faturasIndexColNames.includes('createdAt')) {
        await queryRunner.query(
          `CREATE INDEX "IDX_c74f605d546764c24c0d9451f0" ON "faturas" ("createdAt") `,
        );
      }
      if (faturasIndexColNames.includes('numero')) {
        await queryRunner.query(
          `CREATE UNIQUE INDEX "IDX_a4c04e78810691f77a6c4dd8e6" ON "faturas" ("numero") `,
        );
      }
      if (
        faturasIndexColNames.includes('dataVencimento') &&
        faturasIndexColNames.includes('status')
      ) {
        await queryRunner.query(
          `CREATE INDEX "IDX_e0741e7b51d90755844ae04d67" ON "faturas" ("dataVencimento", "status") `,
        );
      }
      if (faturasIndexColNames.includes('clienteId') && faturasIndexColNames.includes('status')) {
        await queryRunner.query(
          `CREATE INDEX "IDX_450c254ac416c5207f90573259" ON "faturas" ("clienteId", "status") `,
        );
      }
    }

    // Índice em atendimento_mensagens
    if (atendimentoMensagensExists) {
      await queryRunner.query(
        `CREATE INDEX "IDX_ce731265611e11951800e954e6" ON "atendimento_mensagens" ("ticket_id") `,
      );
    }

    // Índice em filas
    if (filasExists) {
      await queryRunner.query(
        `CREATE INDEX "IDX_9d106ad882650c79cf22ce0ccd" ON "filas" ("empresaId") `,
      );
    }

    // Índice em atendentes
    if (atendentesExists) {
      await queryRunner.query(
        `CREATE INDEX "IDX_56a142c6411aa1d5209d1d31a8" ON "atendentes" ("empresaId") `,
      );
    }

    // Índices em atendimento_canais
    if (atendimentoCanaisExists) {
      await queryRunner.query(
        `CREATE INDEX "IDX_27128d55374ddcb811478fe161" ON "atendimento_canais" ("empresa_id", "status") `,
      );
      await queryRunner.query(
        `CREATE INDEX "IDX_ea7b378b4f541113c0d2f82144" ON "atendimento_canais" ("empresa_id", "tipo") `,
      );
    }
    await queryRunner.query(
      `ALTER TABLE "contatos" ADD CONSTRAINT "FK_4239f05a745fb2f8ff77569c52f" FOREIGN KEY ("clienteId") REFERENCES "clientes"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );

    // Operações em fornecedores (se existir)
    if (fornecedoresExists) {
      const fallbackEmpresa = await queryRunner.query(`SELECT id FROM "empresas" LIMIT 1`);
      if (!fallbackEmpresa?.length || !fallbackEmpresa[0]?.id) {
        throw new Error('Nenhuma empresa cadastrada encontrada para vincular fornecedores órfãos');
      }
      const fallbackEmpresaId: string = fallbackEmpresa[0].id;
      await queryRunner.query(
        `UPDATE "fornecedores" f
               SET "empresa_id" = $1
               WHERE "empresa_id" IS NULL
                  OR NOT EXISTS (SELECT 1 FROM "empresas" e WHERE e.id = f."empresa_id")`,
        [fallbackEmpresaId],
      );
      await queryRunner.query(
        `ALTER TABLE "fornecedores" ADD CONSTRAINT "FK_0fb8f907c40978d0f3b198adabc" FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
      );
    }
    await queryRunner.query(
      `ALTER TABLE "itens_cotacao" ADD CONSTRAINT "FK_c2c7135bba968bf7a704f835711" FOREIGN KEY ("cotacao_id") REFERENCES "cotacoes"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );

    // Foreign key cotacoes -> fornecedores (se fornecedores existir)
    if (fornecedoresExists) {
      await queryRunner.query(
        `ALTER TABLE "cotacoes" ADD CONSTRAINT "FK_b67b9648e4c0f0752cc559044cf" FOREIGN KEY ("fornecedor_id") REFERENCES "fornecedores"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
      );
    }
    await queryRunner.query(
      `ALTER TABLE "cotacoes" ADD CONSTRAINT "FK_73a50683a9099014dfc1ae5f54b" FOREIGN KEY ("responsavel_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "cotacoes" ADD CONSTRAINT "FK_07efe975a2015dacee8008aed9e" FOREIGN KEY ("criado_por") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "cotacoes" ADD CONSTRAINT "FK_da821dfa7a5a1c4b8f25bf331b3" FOREIGN KEY ("atualizado_por") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "anexos_cotacao" ADD CONSTRAINT "FK_70fe58d85050b98f06a61c9f77c" FOREIGN KEY ("cotacao_id") REFERENCES "cotacoes"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "anexos_cotacao" ADD CONSTRAINT "FK_30bf115d427f4f75a8795db81d0" FOREIGN KEY ("criado_por") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "fluxos_triagem" ADD CONSTRAINT "FK_d39ec337e1301c5f517fa7ebbdb" FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "nucleos_atendimento" ADD CONSTRAINT "FK_d2a8671cf567caef7aeda8352b3" FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "nucleos_atendimento" ADD CONSTRAINT "FK_547d4917d8ad9ae00b0565290de" FOREIGN KEY ("supervisor_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "sessoes_triagem" ADD CONSTRAINT "FK_6207d9e297dac9b4d96099310fa" FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "sessoes_triagem" ADD CONSTRAINT "FK_4669abc8bd535917354ef7a6482" FOREIGN KEY ("fluxo_id") REFERENCES "fluxos_triagem"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "sessoes_triagem" ADD CONSTRAINT "FK_09bedc37fe0a7e7848505e44bbc" FOREIGN KEY ("ticket_id") REFERENCES "atendimento_tickets"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "sessoes_triagem" ADD CONSTRAINT "FK_9742e924c633a82330c135b6f09" FOREIGN KEY ("nucleo_destino_id") REFERENCES "nucleos_atendimento"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    // ❌ REMOVIDO: Foreign keys de triagem_logs já criadas pela migration CreateTriagemLogsTable1730224800000
    // await queryRunner.query(`ALTER TABLE "triagem_logs" ADD CONSTRAINT "FK_0a356ee00ac545a9274ca367a70" FOREIGN KEY ("sessao_id") REFERENCES "sessoes_triagem"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    // await queryRunner.query(`ALTER TABLE "triagem_logs" ADD CONSTRAINT "FK_46125a5e80b2058ff72922f1ed4" FOREIGN KEY ("fluxo_id") REFERENCES "fluxos_triagem"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);

    // Foreign key em user_activities (se existir)
    if (userActivitiesExists) {
      await queryRunner.query(
        `ALTER TABLE "user_activities" ADD CONSTRAINT "FK_de78dd239133a21e389b3132a99" FOREIGN KEY ("usuario_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
      );
    }
    await queryRunner.query(
      `ALTER TABLE "departamentos" ADD CONSTRAINT "FK_b66dbedc1b7354ea37e3931551f" FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "departamentos" ADD CONSTRAINT "FK_adf5ac13288ba0e8b9a2ef272a1" FOREIGN KEY ("nucleo_id") REFERENCES "nucleos_atendimento"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "departamentos" ADD CONSTRAINT "FK_db00064f5ca1cf26f1d6776011c" FOREIGN KEY ("supervisor_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
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
      `ALTER TABLE "atendente_atribuicoes" ADD CONSTRAINT "FK_1b47cb3f693f95a3a067dc8640a" FOREIGN KEY ("atendente_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "atendente_atribuicoes" ADD CONSTRAINT "FK_d6ec4d35674ff06994bd1197e40" FOREIGN KEY ("nucleo_id") REFERENCES "nucleos_atendimento"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "atendente_atribuicoes" ADD CONSTRAINT "FK_cdc9f5acf590fb9e8760d92ba1e" FOREIGN KEY ("departamento_id") REFERENCES "departamentos"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "eventos_fluxo" ADD CONSTRAINT "FK_7b22daee8fdde61514a153e4e04" FOREIGN KEY ("fluxo_id") REFERENCES "fluxos_automatizados"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );

    // Foreign keys envolvendo contratos - verificar compatibilidade de tipos
    // contratos.id é uuid, mas assinaturas_contrato.contratoId e planos_cobranca.contratoId são integer
    // Só criar se os tipos forem compatíveis
    const contratosIdType = await queryRunner.query(`
      SELECT data_type 
      FROM information_schema.columns 
      WHERE table_name = 'contratos' AND column_name = 'id'
    `);

    const assinaturasContratoIdType = await queryRunner.query(`
      SELECT data_type 
      FROM information_schema.columns 
      WHERE table_name = 'assinaturas_contrato' AND column_name = 'contratoId'
    `);

    // Só criar FK se tipos forem compatíveis (ambos uuid ou ambos integer)
    if (
      contratosIdType.length > 0 &&
      assinaturasContratoIdType.length > 0 &&
      contratosIdType[0].data_type === assinaturasContratoIdType[0].data_type
    ) {
      await queryRunner.query(
        `ALTER TABLE "assinaturas_contrato" ADD CONSTRAINT "FK_6888c39ba396119569bdfc395d7" FOREIGN KEY ("contratoId") REFERENCES "contratos"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
      );
    }
    await queryRunner.query(
      `ALTER TABLE "assinaturas_contrato" ADD CONSTRAINT "FK_982337179049cf74ed56082a947" FOREIGN KEY ("usuarioId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );

    // Verificar colunas existentes em contratos para FKs
    const contratosColumns = await queryRunner.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'contratos' 
      AND column_name IN ('propostaId', 'usuarioResponsavelId')
    `);
    const contratosColNames = contratosColumns.map((c) => c.column_name);

    if (contratosColNames.includes('propostaId')) {
      await queryRunner.query(
        `ALTER TABLE "contratos" ADD CONSTRAINT "FK_fba798764f6836ea6d314959532" FOREIGN KEY ("propostaId") REFERENCES "propostas"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
      );
    }
    if (contratosColNames.includes('usuarioResponsavelId')) {
      await queryRunner.query(
        `ALTER TABLE "contratos" ADD CONSTRAINT "FK_f2926f09e28397467be35b35f8c" FOREIGN KEY ("usuarioResponsavelId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
      );
    }

    // Foreign keys em itens_fatura (se existir)
    if (itensFaturaExists) {
      await queryRunner.query(
        `ALTER TABLE "itens_fatura" ADD CONSTRAINT "FK_932b3f8c92967639f60371e0933" FOREIGN KEY ("faturaId") REFERENCES "faturas"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
      );
    }

    // Foreign keys em pagamentos (se existir)
    if (pagamentosExists) {
      await queryRunner.query(
        `ALTER TABLE "pagamentos" ADD CONSTRAINT "FK_70ac296be6d09bee54e7281b9be" FOREIGN KEY ("faturaId") REFERENCES "faturas"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
      );
    }

    // Foreign keys em faturas (se existir)
    if (faturasExists) {
      // Verificar colunas que existem em faturas para FK
      const faturasColumnsForFK = await queryRunner.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'faturas' 
        AND column_name IN ('contratoId', 'clienteId', 'usuarioResponsavelId')
      `);
      const faturasColForFK = faturasColumnsForFK.map((c) => c.column_name);

      if (faturasColForFK.includes('contratoId')) {
        await queryRunner.query(
          `ALTER TABLE "faturas" ADD CONSTRAINT "FK_9b8490bce74e62adb498b5ccbb6" FOREIGN KEY ("contratoId") REFERENCES "contratos"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
        );
      }
      if (faturasColForFK.includes('clienteId')) {
        await queryRunner.query(
          `ALTER TABLE "faturas" ADD CONSTRAINT "FK_67862e1af92d16dfa50f4e9d18b" FOREIGN KEY ("clienteId") REFERENCES "clientes"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
        );
      }
      if (faturasColForFK.includes('usuarioResponsavelId')) {
        await queryRunner.query(
          `ALTER TABLE "faturas" ADD CONSTRAINT "FK_5a418769af0f3afc6d27318a97e" FOREIGN KEY ("usuarioResponsavelId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
        );
      }
    }

    // Foreign key planos_cobranca -> contratos (verificar compatibilidade de tipos)
    const planosCobrancaContratoIdType = await queryRunner.query(`
      SELECT data_type 
      FROM information_schema.columns 
      WHERE table_name = 'planos_cobranca' AND column_name = 'contratoId'
    `);

    if (
      contratosIdType.length > 0 &&
      planosCobrancaContratoIdType.length > 0 &&
      contratosIdType[0].data_type === planosCobrancaContratoIdType[0].data_type
    ) {
      await queryRunner.query(
        `ALTER TABLE "planos_cobranca" ADD CONSTRAINT "FK_62e13ecdcccfbf97a7e84354b62" FOREIGN KEY ("contratoId") REFERENCES "contratos"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
      );
    }

    // Verificar se usuarioResponsavelId existe em planos_cobranca
    const planosCobrancaColumns = await queryRunner.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'planos_cobranca' AND column_name = 'usuarioResponsavelId'
    `);

    if (planosCobrancaColumns.length > 0) {
      await queryRunner.query(
        `ALTER TABLE "planos_cobranca" ADD CONSTRAINT "FK_2153bcc7f78cf5433578e7870ea" FOREIGN KEY ("usuarioResponsavelId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
      );
    }
    await queryRunner.query(
      `ALTER TABLE "atendimento_notas_cliente" ADD CONSTRAINT "FK_c60fc0dc807287e6f8d11594469" FOREIGN KEY ("autor_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "atendimento_demandas" ADD CONSTRAINT "FK_2691f1d5df7e1c8cdb076a55e83" FOREIGN KEY ("responsavel_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "atendimento_demandas" ADD CONSTRAINT "FK_8941088e9191d7c1c826a8c4084" FOREIGN KEY ("autor_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );

    // Foreign key em canais (se existir)
    if (canaisExists) {
      await queryRunner.query(
        `ALTER TABLE "canais" ADD CONSTRAINT "FK_2eb76f75d6d4f850a8c1eee9dfb" FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "canais" DROP CONSTRAINT "FK_2eb76f75d6d4f850a8c1eee9dfb"`,
    );
    await queryRunner.query(
      `ALTER TABLE "atendimento_demandas" DROP CONSTRAINT "FK_8941088e9191d7c1c826a8c4084"`,
    );
    await queryRunner.query(
      `ALTER TABLE "atendimento_demandas" DROP CONSTRAINT "FK_2691f1d5df7e1c8cdb076a55e83"`,
    );
    await queryRunner.query(
      `ALTER TABLE "atendimento_notas_cliente" DROP CONSTRAINT "FK_c60fc0dc807287e6f8d11594469"`,
    );
    await queryRunner.query(
      `ALTER TABLE "planos_cobranca" DROP CONSTRAINT "FK_2153bcc7f78cf5433578e7870ea"`,
    );
    await queryRunner.query(
      `ALTER TABLE "planos_cobranca" DROP CONSTRAINT "FK_62e13ecdcccfbf97a7e84354b62"`,
    );
    await queryRunner.query(
      `ALTER TABLE "faturas" DROP CONSTRAINT "FK_5a418769af0f3afc6d27318a97e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "faturas" DROP CONSTRAINT "FK_67862e1af92d16dfa50f4e9d18b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "faturas" DROP CONSTRAINT "FK_9b8490bce74e62adb498b5ccbb6"`,
    );
    await queryRunner.query(
      `ALTER TABLE "pagamentos" DROP CONSTRAINT "FK_70ac296be6d09bee54e7281b9be"`,
    );
    await queryRunner.query(
      `ALTER TABLE "itens_fatura" DROP CONSTRAINT "FK_932b3f8c92967639f60371e0933"`,
    );
    await queryRunner.query(
      `ALTER TABLE "contratos" DROP CONSTRAINT "FK_f2926f09e28397467be35b35f8c"`,
    );
    await queryRunner.query(
      `ALTER TABLE "contratos" DROP CONSTRAINT "FK_fba798764f6836ea6d314959532"`,
    );
    await queryRunner.query(
      `ALTER TABLE "assinaturas_contrato" DROP CONSTRAINT "FK_982337179049cf74ed56082a947"`,
    );
    await queryRunner.query(
      `ALTER TABLE "assinaturas_contrato" DROP CONSTRAINT "FK_6888c39ba396119569bdfc395d7"`,
    );
    await queryRunner.query(
      `ALTER TABLE "eventos_fluxo" DROP CONSTRAINT "FK_7b22daee8fdde61514a153e4e04"`,
    );
    await queryRunner.query(
      `ALTER TABLE "atendente_atribuicoes" DROP CONSTRAINT "FK_cdc9f5acf590fb9e8760d92ba1e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "atendente_atribuicoes" DROP CONSTRAINT "FK_d6ec4d35674ff06994bd1197e40"`,
    );
    await queryRunner.query(
      `ALTER TABLE "atendente_atribuicoes" DROP CONSTRAINT "FK_1b47cb3f693f95a3a067dc8640a"`,
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
      `ALTER TABLE "departamentos" DROP CONSTRAINT "FK_db00064f5ca1cf26f1d6776011c"`,
    );
    await queryRunner.query(
      `ALTER TABLE "departamentos" DROP CONSTRAINT "FK_adf5ac13288ba0e8b9a2ef272a1"`,
    );
    await queryRunner.query(
      `ALTER TABLE "departamentos" DROP CONSTRAINT "FK_b66dbedc1b7354ea37e3931551f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_activities" DROP CONSTRAINT "FK_de78dd239133a21e389b3132a99"`,
    );
    // ❌ REMOVIDO: Não dropar foreign keys de triagem_logs (gerenciadas por outra migration)
    // await queryRunner.query(`ALTER TABLE "triagem_logs" DROP CONSTRAINT "FK_46125a5e80b2058ff72922f1ed4"`);
    // await queryRunner.query(`ALTER TABLE "triagem_logs" DROP CONSTRAINT "FK_0a356ee00ac545a9274ca367a70"`);
    await queryRunner.query(
      `ALTER TABLE "sessoes_triagem" DROP CONSTRAINT "FK_9742e924c633a82330c135b6f09"`,
    );
    await queryRunner.query(
      `ALTER TABLE "sessoes_triagem" DROP CONSTRAINT "FK_09bedc37fe0a7e7848505e44bbc"`,
    );
    await queryRunner.query(
      `ALTER TABLE "sessoes_triagem" DROP CONSTRAINT "FK_4669abc8bd535917354ef7a6482"`,
    );
    await queryRunner.query(
      `ALTER TABLE "sessoes_triagem" DROP CONSTRAINT "FK_6207d9e297dac9b4d96099310fa"`,
    );
    await queryRunner.query(
      `ALTER TABLE "nucleos_atendimento" DROP CONSTRAINT "FK_547d4917d8ad9ae00b0565290de"`,
    );
    await queryRunner.query(
      `ALTER TABLE "nucleos_atendimento" DROP CONSTRAINT "FK_d2a8671cf567caef7aeda8352b3"`,
    );
    await queryRunner.query(
      `ALTER TABLE "fluxos_triagem" DROP CONSTRAINT "FK_d39ec337e1301c5f517fa7ebbdb"`,
    );
    await queryRunner.query(
      `ALTER TABLE "anexos_cotacao" DROP CONSTRAINT "FK_30bf115d427f4f75a8795db81d0"`,
    );
    await queryRunner.query(
      `ALTER TABLE "anexos_cotacao" DROP CONSTRAINT "FK_70fe58d85050b98f06a61c9f77c"`,
    );
    await queryRunner.query(
      `ALTER TABLE "cotacoes" DROP CONSTRAINT "FK_da821dfa7a5a1c4b8f25bf331b3"`,
    );
    await queryRunner.query(
      `ALTER TABLE "cotacoes" DROP CONSTRAINT "FK_07efe975a2015dacee8008aed9e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "cotacoes" DROP CONSTRAINT "FK_73a50683a9099014dfc1ae5f54b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "cotacoes" DROP CONSTRAINT "FK_b67b9648e4c0f0752cc559044cf"`,
    );
    await queryRunner.query(
      `ALTER TABLE "itens_cotacao" DROP CONSTRAINT "FK_c2c7135bba968bf7a704f835711"`,
    );
    await queryRunner.query(
      `ALTER TABLE "fornecedores" DROP CONSTRAINT "FK_0fb8f907c40978d0f3b198adabc"`,
    );
    await queryRunner.query(
      `ALTER TABLE "contatos" DROP CONSTRAINT "FK_4239f05a745fb2f8ff77569c52f"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_ea7b378b4f541113c0d2f82144"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_27128d55374ddcb811478fe161"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_56a142c6411aa1d5209d1d31a8"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_9d106ad882650c79cf22ce0ccd"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_ce731265611e11951800e954e6"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_450c254ac416c5207f90573259"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_e0741e7b51d90755844ae04d67"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_a4c04e78810691f77a6c4dd8e6"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_c74f605d546764c24c0d9451f0"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_60cf6cd7b6a1b7298af56b056d"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_139d3276e0a299deacb53a557d"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_c0d57c7b5bde732ac3d3ed3558"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_1162d4fe194d2e32a9ecf6ccb4"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_67862e1af92d16dfa50f4e9d18"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_b4bbaa2f40bf189614a186b4cc"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_de0189e9fc08cd5284c0a461b7"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_51444df940548e9dda1be15423"`);
    await queryRunner.query(`ALTER TABLE "canais" ALTER COLUMN "updatedAt" DROP NOT NULL`);
    await queryRunner.query(`ALTER TABLE "canais" ALTER COLUMN "createdAt" DROP NOT NULL`);
    await queryRunner.query(`ALTER TABLE "canais" DROP COLUMN "webhook_secret"`);
    await queryRunner.query(`ALTER TABLE "canais" ADD "webhook_secret" text`);
    await queryRunner.query(`ALTER TABLE "canais" DROP COLUMN "webhook_url"`);
    await queryRunner.query(`ALTER TABLE "canais" ADD "webhook_url" text`);
    await queryRunner.query(`ALTER TABLE "canais" DROP COLUMN "status"`);
    await queryRunner.query(
      `ALTER TABLE "canais" ADD "status" character varying(20) DEFAULT 'CONFIGURANDO'`,
    );
    await queryRunner.query(`ALTER TABLE "canais" DROP COLUMN "provider"`);
    await queryRunner.query(`ALTER TABLE "canais" ADD "provider" character varying(50)`);
    await queryRunner.query(`ALTER TABLE "canais" ALTER COLUMN "ativo" DROP NOT NULL`);
    await queryRunner.query(`ALTER TABLE "canais" DROP COLUMN "tipo"`);
    await queryRunner.query(`ALTER TABLE "canais" ADD "tipo" character varying(20) NOT NULL`);
    await queryRunner.query(`ALTER TABLE "canais" DROP COLUMN "nome"`);
    await queryRunner.query(`ALTER TABLE "canais" ADD "nome" character varying(100) NOT NULL`);
    await queryRunner.query(
      `ALTER TABLE "atendimento_canais" ALTER COLUMN "updated_at" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "atendimento_canais" ALTER COLUMN "created_at" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "atendimento_canais" ALTER COLUMN "auto_resposta_ativa" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "atendimento_canais" ALTER COLUMN "ativo" SET DEFAULT true`,
    );
    await queryRunner.query(`ALTER TABLE "atendimento_canais" ALTER COLUMN "ativo" DROP NOT NULL`);
    await queryRunner.query(`COMMENT ON COLUMN "atendimento_canais"."config" IS NULL`);
    await queryRunner.query(`ALTER TABLE "atendimento_canais" DROP COLUMN "status"`);
    await queryRunner.query(`DROP TYPE "public"."atendimento_canais_status_enum"`);
    await queryRunner.query(
      `ALTER TABLE "atendimento_canais" ADD "status" character varying(20) DEFAULT 'conectado'`,
    );
    await queryRunner.query(
      `ALTER TABLE "atendimento_canais" ALTER COLUMN "provedor" SET DEFAULT 'whatsapp_business_api'`,
    );
    await queryRunner.query(`COMMENT ON COLUMN "atendimento_canais"."provedor" IS NULL`);
    await queryRunner.query(
      `ALTER TABLE "atendimento_canais" ALTER COLUMN "tipo" TYPE character varying(50) USING "tipo"::text`,
    );
    await queryRunner.query(`ALTER TABLE "atendimento_canais" ALTER COLUMN "tipo" SET NOT NULL`);
    await queryRunner.query(`DROP TYPE "public"."atendimento_canais_tipo_enum"`);
    await queryRunner.query(
      `ALTER TABLE "atendimento_canais" ADD "nome_temp" character varying(100)`,
    );
    await queryRunner.query(`UPDATE "atendimento_canais" SET "nome_temp" = "nome"`);
    await queryRunner.query(`ALTER TABLE "atendimento_canais" DROP COLUMN "nome"`);
    await queryRunner.query(`ALTER TABLE "atendimento_canais" RENAME COLUMN "nome_temp" TO "nome"`);
    await queryRunner.query(`ALTER TABLE "atendimento_canais" ALTER COLUMN "nome" SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE "atendentes" ALTER COLUMN "updatedAt" DROP NOT NULL`);
    await queryRunner.query(`ALTER TABLE "atendentes" ALTER COLUMN "createdAt" DROP NOT NULL`);
    await queryRunner.query(`ALTER TABLE "atendentes" ALTER COLUMN "ticketsAtivos" DROP NOT NULL`);
    await queryRunner.query(
      `ALTER TABLE "atendentes" ALTER COLUMN "capacidadeMaxima" DROP NOT NULL`,
    );
    await queryRunner.query(`ALTER TABLE "atendentes" ALTER COLUMN "status" DROP NOT NULL`);
    const atendentesEmailColumnDown = await queryRunner.query(
      `SELECT column_name FROM information_schema.columns WHERE table_name = 'atendentes' AND column_name = 'email'`,
    );
    if (atendentesEmailColumnDown.length > 0) {
      await queryRunner.query(
        `ALTER TABLE "atendentes" ALTER COLUMN "email" TYPE character varying(255) USING LEFT(TRIM("email"::text), 255)`,
      );
    } else {
      await queryRunner.query(`ALTER TABLE "atendentes" ADD "email" character varying(255)`);
    }
    await queryRunner.query(`ALTER TABLE "atendentes" ALTER COLUMN "email" SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE "filas" ALTER COLUMN "updatedAt" DROP NOT NULL`);
    await queryRunner.query(`ALTER TABLE "filas" ALTER COLUMN "createdAt" DROP NOT NULL`);
    await queryRunner.query(`ALTER TABLE "filas" ALTER COLUMN "ordem" DROP NOT NULL`);
    await queryRunner.query(`ALTER TABLE "filas" ALTER COLUMN "ativo" DROP NOT NULL`);
    await queryRunner.query(
      `ALTER TABLE "atendimento_integracoes_config" ALTER COLUMN "atualizado_em" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "atendimento_integracoes_config" ALTER COLUMN "criado_em" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "atendimento_integracoes_config" DROP COLUMN "whatsapp_api_token"`,
    );
    await queryRunner.query(
      `ALTER TABLE "atendimento_integracoes_config" ADD "whatsapp_api_token" character varying(255)`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "atendimento_integracoes_config"."webhook_secret" IS 'Secret para validação de webhooks'`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "atendimento_integracoes_config"."credenciais" IS 'Credenciais e configurações em formato JSONB flexível'`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "atendimento_integracoes_config"."ativo" IS 'Se a integração está ativa ou não'`,
    );
    await queryRunner.query(
      `ALTER TABLE "atendimento_integracoes_config" ALTER COLUMN "ativo" DROP NOT NULL`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "atendimento_integracoes_config"."tipo" IS 'Tipo de integração: openai, anthropic, whatsapp, etc'`,
    );
    await queryRunner.query(
      `ALTER TABLE "atendimento_integracoes_config" ALTER COLUMN "tipo" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "atendimento_integracoes_config" ADD CONSTRAINT "atendimento_integracoes_config_empresa_id_key" UNIQUE ("empresa_id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "atendimento_mensagens" ALTER COLUMN "created_at" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "faturas" ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP`,
    );
    await queryRunner.query(`ALTER TABLE "faturas" ALTER COLUMN "updatedAt" DROP NOT NULL`);
    await queryRunner.query(
      `ALTER TABLE "faturas" ALTER COLUMN "createdAt" SET DEFAULT CURRENT_TIMESTAMP`,
    );
    await queryRunner.query(`ALTER TABLE "faturas" ALTER COLUMN "createdAt" DROP NOT NULL`);
    await queryRunner.query(`ALTER TABLE "faturas" ALTER COLUMN "ativo" DROP NOT NULL`);
    await queryRunner.query(`ALTER TABLE "faturas" ALTER COLUMN "valorMulta" DROP NOT NULL`);
    await queryRunner.query(`ALTER TABLE "faturas" ALTER COLUMN "valorMulta" TYPE numeric(10,2)`);
    await queryRunner.query(`ALTER TABLE "faturas" ALTER COLUMN "valorJuros" DROP NOT NULL`);
    await queryRunner.query(`ALTER TABLE "faturas" ALTER COLUMN "valorJuros" TYPE numeric(10,2)`);
    await queryRunner.query(`ALTER TABLE "faturas" ALTER COLUMN "valorDesconto" DROP NOT NULL`);
    await queryRunner.query(
      `ALTER TABLE "faturas" ALTER COLUMN "valorDesconto" TYPE numeric(10,2)`,
    );
    await queryRunner.query(`ALTER TABLE "faturas" ALTER COLUMN "valorPago" DROP NOT NULL`);
    await queryRunner.query(`ALTER TABLE "faturas" ALTER COLUMN "valorPago" TYPE numeric(10,2)`);
    await queryRunner.query(`ALTER TABLE "faturas" ALTER COLUMN "valorTotal" TYPE numeric(10,2)`);
    await queryRunner.query(`ALTER TABLE "faturas" ALTER COLUMN "clienteId" DROP NOT NULL`);
    await queryRunner.query(`ALTER TABLE "contas_pagar" DROP COLUMN "numero_documento"`);
    await queryRunner.query(
      `ALTER TABLE "contas_pagar" ADD "numero_documento" character varying(100)`,
    );
    await queryRunner.query(`ALTER TABLE "contas_pagar" DROP COLUMN "observacoes"`);
    await queryRunner.query(`ALTER TABLE "contas_pagar" ADD "observacoes" text`);
    const contasPagarEmpresaColumnDown = await queryRunner.query(
      `SELECT column_name FROM information_schema.columns WHERE table_name = 'contas_pagar' AND column_name = 'empresa_id'`,
    );
    if (contasPagarEmpresaColumnDown.length > 0) {
      await queryRunner.query(`ALTER TABLE "contas_pagar" ADD "empresa_id_temp" uuid`);
      await queryRunner.query(
        `UPDATE "contas_pagar" SET "empresa_id_temp" = NULLIF("empresa_id", '')::uuid WHERE "empresa_id" ~* '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'`,
      );
      await queryRunner.query(
        `UPDATE "contas_pagar" SET "empresa_id_temp" = '00000000-0000-0000-0000-000000000000' WHERE "empresa_id_temp" IS NULL`,
      );
      await queryRunner.query(`ALTER TABLE "contas_pagar" DROP COLUMN "empresa_id"`);
      await queryRunner.query(
        `ALTER TABLE "contas_pagar" RENAME COLUMN "empresa_id_temp" TO "empresa_id"`,
      );
    } else {
      await queryRunner.query(`ALTER TABLE "contas_pagar" ADD "empresa_id" uuid`);
    }
    await queryRunner.query(
      `UPDATE "contas_pagar" SET "empresa_id" = COALESCE("empresa_id", '00000000-0000-0000-0000-000000000000')`,
    );
    await queryRunner.query(`ALTER TABLE "contas_pagar" ALTER COLUMN "empresa_id" SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE "contas_pagar" DROP COLUMN "status"`);
    await queryRunner.query(`DROP TYPE "public"."contas_pagar_status_enum"`);
    await queryRunner.query(
      `ALTER TABLE "contas_pagar" ADD "status" character varying(20) DEFAULT 'pendente'`,
    );
    await queryRunner.query(`ALTER TABLE "contas_pagar" DROP COLUMN "data_pagamento"`);
    await queryRunner.query(`ALTER TABLE "contas_pagar" ADD "data_pagamento" date`);
    await queryRunner.query(`ALTER TABLE "contas_pagar" DROP COLUMN "data_vencimento"`);
    await queryRunner.query(`ALTER TABLE "contas_pagar" ADD "data_vencimento" date NOT NULL`);
    await queryRunner.query(`ALTER TABLE "contas_pagar" DROP COLUMN "descricao"`);
    await queryRunner.query(
      `ALTER TABLE "contas_pagar" ADD "descricao" character varying(255) NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "faturas" ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP`,
    );
    await queryRunner.query(`ALTER TABLE "faturas" ALTER COLUMN "updatedAt" DROP NOT NULL`);
    await queryRunner.query(
      `ALTER TABLE "faturas" ALTER COLUMN "createdAt" SET DEFAULT CURRENT_TIMESTAMP`,
    );
    await queryRunner.query(`ALTER TABLE "faturas" ALTER COLUMN "createdAt" DROP NOT NULL`);
    await queryRunner.query(`ALTER TABLE "faturas" ALTER COLUMN "ativo" DROP NOT NULL`);
    await queryRunner.query(`ALTER TABLE "faturas" DROP COLUMN "metadados"`);
    await queryRunner.query(`ALTER TABLE "faturas" ADD "metadados" jsonb`);
    await queryRunner.query(`ALTER TABLE "faturas" ALTER COLUMN "valorMulta" DROP NOT NULL`);
    await queryRunner.query(`ALTER TABLE "faturas" ALTER COLUMN "valorJuros" DROP NOT NULL`);
    await queryRunner.query(`ALTER TABLE "faturas" ALTER COLUMN "valorDesconto" DROP NOT NULL`);
    await queryRunner.query(`ALTER TABLE "faturas" ALTER COLUMN "valorPago" DROP NOT NULL`);
    await queryRunner.query(`ALTER TABLE "faturas" DROP COLUMN "formaPagamentoPreferida"`);
    await queryRunner.query(`DROP TYPE "public"."faturas_formapagamentopreferida_enum"`);
    await queryRunner.query(
      `ALTER TABLE "faturas" ADD "formaPagamentoPreferida" character varying`,
    );
    await queryRunner.query(`ALTER TABLE "faturas" DROP COLUMN "status"`);
    await queryRunner.query(`DROP TYPE "public"."faturas_status_enum"`);
    await queryRunner.query(
      `ALTER TABLE "faturas" ADD "status" character varying DEFAULT 'pendente'`,
    );
    await queryRunner.query(`ALTER TABLE "faturas" DROP COLUMN "tipo"`);
    await queryRunner.query(`DROP TYPE "public"."faturas_tipo_enum"`);
    await queryRunner.query(`ALTER TABLE "faturas" ADD "tipo" character varying DEFAULT 'unica'`);
    await queryRunner.query(`ALTER TABLE "faturas" ALTER COLUMN "clienteId" DROP NOT NULL`);
    await queryRunner.query(`ALTER TABLE "faturas" ALTER COLUMN "contratoId" DROP NOT NULL`);
    await queryRunner.query(
      `ALTER TABLE "pagamentos" ALTER COLUMN "createdAt" SET DEFAULT CURRENT_TIMESTAMP`,
    );
    await queryRunner.query(`ALTER TABLE "pagamentos" ALTER COLUMN "createdAt" DROP NOT NULL`);
    await queryRunner.query(`ALTER TABLE "pagamentos" DROP COLUMN "dadosCompletos"`);
    await queryRunner.query(`ALTER TABLE "pagamentos" ADD "dadosCompletos" jsonb`);
    await queryRunner.query(`ALTER TABLE "pagamentos" ALTER COLUMN "taxa" DROP NOT NULL`);
    await queryRunner.query(`ALTER TABLE "pagamentos" DROP COLUMN "status"`);
    await queryRunner.query(`DROP TYPE "public"."pagamentos_status_enum"`);
    await queryRunner.query(
      `ALTER TABLE "pagamentos" ADD "status" character varying DEFAULT 'pendente'`,
    );
    await queryRunner.query(`ALTER TABLE "pagamentos" DROP COLUMN "tipo"`);
    await queryRunner.query(`DROP TYPE "public"."pagamentos_tipo_enum"`);
    await queryRunner.query(
      `ALTER TABLE "pagamentos" ADD "tipo" character varying DEFAULT 'pagamento'`,
    );
    await queryRunner.query(
      `ALTER TABLE "itens_fatura" ALTER COLUMN "valorDesconto" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "itens_fatura" ALTER COLUMN "percentualDesconto" DROP NOT NULL`,
    );
    await queryRunner.query(`ALTER TABLE "contratos" ADD "clienteId_int" integer`);
    const mappingExistsDown = await queryRunner.query(
      `SELECT to_regclass('public.cliente_id_mapping') as reg`,
    );
    if (mappingExistsDown?.[0]?.reg) {
      await queryRunner.query(
        `UPDATE "contratos" c SET "clienteId_int" = cim.numeric_id FROM cliente_id_mapping cim WHERE c."clienteId" = cim.cliente_uuid`,
      );
    }
    await queryRunner.query(
      `UPDATE "contratos" SET "clienteId_int" = 0 WHERE "clienteId_int" IS NULL`,
    );
    await queryRunner.query(`ALTER TABLE "contratos" DROP COLUMN "clienteId"`);
    await queryRunner.query(`ALTER TABLE "contratos" RENAME COLUMN "clienteId_int" TO "clienteId"`);
    await queryRunner.query(`ALTER TABLE "contratos" ALTER COLUMN "clienteId" SET NOT NULL`);
    await queryRunner.query(
      `ALTER TABLE "atendente_atribuicoes" ALTER COLUMN "updated_at" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "atendente_atribuicoes" ALTER COLUMN "created_at" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "atendente_atribuicoes" ALTER COLUMN "ativo" DROP NOT NULL`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "atendente_atribuicoes"."prioridade" IS 'Prioridade da atribuição (0 = maior prioridade)'`,
    );
    await queryRunner.query(
      `ALTER TABLE "atendente_atribuicoes" ALTER COLUMN "prioridade" DROP NOT NULL`,
    );
    await queryRunner.query(`ALTER TABLE "equipes" ALTER COLUMN "updated_at" DROP NOT NULL`);
    await queryRunner.query(`ALTER TABLE "equipes" ALTER COLUMN "created_at" DROP NOT NULL`);
    await queryRunner.query(`ALTER TABLE "equipes" ALTER COLUMN "ativo" DROP NOT NULL`);
    await queryRunner.query(`ALTER TABLE "equipes" ALTER COLUMN "icone" DROP NOT NULL`);
    await queryRunner.query(`ALTER TABLE "equipes" ALTER COLUMN "cor" DROP NOT NULL`);
    await queryRunner.query(
      `ALTER TABLE "atendente_equipes" ALTER COLUMN "updated_at" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "atendente_equipes" ALTER COLUMN "created_at" DROP NOT NULL`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "atendente_equipes"."funcao" IS 'Função do atendente na equipe: lider, membro, supervisor, etc.'`,
    );
    await queryRunner.query(`ALTER TABLE "atendente_equipes" ALTER COLUMN "funcao" DROP NOT NULL`);
    await queryRunner.query(
      `ALTER TABLE "equipe_atribuicoes" ALTER COLUMN "updated_at" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "equipe_atribuicoes" ALTER COLUMN "created_at" DROP NOT NULL`,
    );
    await queryRunner.query(`ALTER TABLE "equipe_atribuicoes" ALTER COLUMN "ativo" DROP NOT NULL`);
    await queryRunner.query(
      `COMMENT ON COLUMN "equipe_atribuicoes"."prioridade" IS 'Prioridade da atribuição (0 = maior prioridade)'`,
    );
    await queryRunner.query(
      `ALTER TABLE "equipe_atribuicoes" ALTER COLUMN "prioridade" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_activities" ALTER COLUMN "created_at" DROP NOT NULL`,
    );
    await queryRunner.query(`ALTER TABLE "user_activities" ALTER COLUMN "descricao" DROP NOT NULL`);
    await queryRunner.query(
      `ALTER TABLE "user_activities" ALTER COLUMN "descricao" TYPE character varying(255) USING "descricao"::character varying`,
    );
    await queryRunner.query(`ALTER TABLE "user_activities" ALTER COLUMN "tipo" DROP DEFAULT`);
    await queryRunner.query(
      `ALTER TABLE "user_activities" ALTER COLUMN "tipo" TYPE character varying(50) USING "tipo"::text`,
    );
    await queryRunner.query(`DROP TYPE "public"."user_activities_tipo_enum"`);
    await queryRunner.query(
      `ALTER TABLE "user_activities" ALTER COLUMN "empresa_id" TYPE uuid USING NULLIF("empresa_id", '')::uuid`,
    );
    await queryRunner.query(
      `UPDATE "user_activities" SET "empresa_id" = NULL WHERE "empresa_id" = "usuario_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_activities" ALTER COLUMN "empresa_id" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "sessoes_triagem" ALTER COLUMN "updated_at" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "sessoes_triagem" ALTER COLUMN "created_at" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "sessoes_triagem" ALTER COLUMN "total_mensagens_recebidas" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "sessoes_triagem" ALTER COLUMN "total_mensagens_enviadas" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "sessoes_triagem" ALTER COLUMN "iniciado_em" DROP NOT NULL`,
    );
    await queryRunner.query(`ALTER TABLE "sessoes_triagem" ALTER COLUMN "status" DROP NOT NULL`);
    await queryRunner.query(`ALTER TABLE "sessoes_triagem" ALTER COLUMN "historico" DROP NOT NULL`);
    await queryRunner.query(`ALTER TABLE "sessoes_triagem" ALTER COLUMN "contexto" DROP NOT NULL`);
    await queryRunner.query(`ALTER TABLE "sessoes_triagem" ALTER COLUMN "canal" DROP NOT NULL`);
    await queryRunner.query(
      `ALTER TABLE "atendimento_tickets" ALTER COLUMN "updated_at" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "atendimento_tickets" ALTER COLUMN "created_at" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "atendimento_tickets" ALTER COLUMN "data_abertura" SET DEFAULT now()`,
    );
    await queryRunner.query(`ALTER TABLE "atendimento_tickets" DROP COLUMN "contato_telefone"`);
    await queryRunner.query(
      `ALTER TABLE "atendimento_tickets" ADD "contato_telefone" character varying(50)`,
    );
    await queryRunner.query(
      `ALTER TABLE "atendimento_tickets" ALTER COLUMN "prioridade" SET DEFAULT 'normal'`,
    );
    await queryRunner.query(
      `ALTER TABLE "atendimento_tickets" ALTER COLUMN "prioridade" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "atendimento_tickets" ALTER COLUMN "status" SET DEFAULT 'aberto'`,
    );
    await queryRunner.query(
      `ALTER TABLE "atendimento_tickets" ALTER COLUMN "status" DROP NOT NULL`,
    );
    await queryRunner.query(`ALTER TABLE "atendimento_tickets" ALTER COLUMN "numero" SET NOT NULL`);
    await queryRunner.query(
      `ALTER TABLE "nucleos_atendimento" ALTER COLUMN "updated_at" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "nucleos_atendimento" ALTER COLUMN "created_at" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "nucleos_atendimento" ALTER COLUMN "taxa_satisfacao" SET DEFAULT 0.00`,
    );
    await queryRunner.query(
      `ALTER TABLE "nucleos_atendimento" ALTER COLUMN "taxa_satisfacao" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "nucleos_atendimento" ALTER COLUMN "total_tickets_resolvidos" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "nucleos_atendimento" ALTER COLUMN "total_tickets_abertos" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "nucleos_atendimento" ALTER COLUMN "tipo_distribuicao" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "nucleos_atendimento" ALTER COLUMN "capacidade_maxima_tickets" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "nucleos_atendimento" ALTER COLUMN "atendentes_ids" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "nucleos_atendimento" ALTER COLUMN "tempo_medio_atendimento_minutos" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "nucleos_atendimento" ALTER COLUMN "sla_resolucao_horas" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "nucleos_atendimento" ALTER COLUMN "sla_resposta_minutos" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "nucleos_atendimento" ALTER COLUMN "timezone" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "nucleos_atendimento" ALTER COLUMN "horario_funcionamento" SET DEFAULT '{}'`,
    );
    await queryRunner.query(
      `ALTER TABLE "nucleos_atendimento" ALTER COLUMN "prioridade" DROP NOT NULL`,
    );
    await queryRunner.query(`ALTER TABLE "nucleos_atendimento" ALTER COLUMN "ativo" DROP NOT NULL`);
    await queryRunner.query(`ALTER TABLE "nucleos_atendimento" ALTER COLUMN "icone" DROP NOT NULL`);
    await queryRunner.query(`ALTER TABLE "nucleos_atendimento" ALTER COLUMN "cor" DROP NOT NULL`);
    await queryRunner.query(`ALTER TABLE "fluxos_triagem" ALTER COLUMN "updated_at" DROP NOT NULL`);
    await queryRunner.query(`ALTER TABLE "fluxos_triagem" ALTER COLUMN "created_at" DROP NOT NULL`);
    await queryRunner.query(
      `ALTER TABLE "fluxos_triagem" ALTER COLUMN "tempo_medio_conclusao_segundos" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "fluxos_triagem" ALTER COLUMN "taxa_conclusao" SET DEFAULT 0.00`,
    );
    await queryRunner.query(
      `ALTER TABLE "fluxos_triagem" ALTER COLUMN "taxa_conclusao" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "fluxos_triagem" ALTER COLUMN "total_abandonos" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "fluxos_triagem" ALTER COLUMN "total_conclusoes" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "fluxos_triagem" ALTER COLUMN "total_execucoes" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "fluxos_triagem" ALTER COLUMN "tentar_entender_texto_livre" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "fluxos_triagem" ALTER COLUMN "salvar_historico" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "fluxos_triagem" ALTER COLUMN "permite_sair" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "fluxos_triagem" ALTER COLUMN "permite_voltar" DROP NOT NULL`,
    );
    await queryRunner.query(`ALTER TABLE "fluxos_triagem" ALTER COLUMN "prioridade" DROP NOT NULL`);
    await queryRunner.query(
      `ALTER TABLE "fluxos_triagem" ALTER COLUMN "palavras_gatilho" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "fluxos_triagem" ALTER COLUMN "canais" SET DEFAULT ARRAY['whatsapp'`,
    );
    await queryRunner.query(`ALTER TABLE "fluxos_triagem" ALTER COLUMN "canais" DROP NOT NULL`);
    await queryRunner.query(`ALTER TABLE "fluxos_triagem" ALTER COLUMN "publicado" DROP NOT NULL`);
    await queryRunner.query(`ALTER TABLE "fluxos_triagem" ALTER COLUMN "versao" DROP NOT NULL`);
    await queryRunner.query(`ALTER TABLE "fluxos_triagem" ALTER COLUMN "ativo" DROP NOT NULL`);
    await queryRunner.query(`ALTER TABLE "fluxos_triagem" ALTER COLUMN "tipo" DROP NOT NULL`);
    await queryRunner.query(
      `ALTER TABLE "fornecedores" ALTER COLUMN "atualizado_em" SET DEFAULT CURRENT_TIMESTAMP`,
    );
    await queryRunner.query(
      `ALTER TABLE "fornecedores" ALTER COLUMN "atualizado_em" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "fornecedores" ALTER COLUMN "criado_em" SET DEFAULT CURRENT_TIMESTAMP`,
    );
    await queryRunner.query(`ALTER TABLE "fornecedores" ALTER COLUMN "criado_em" DROP NOT NULL`);
    await queryRunner.query(`ALTER TABLE "fornecedores" ALTER COLUMN "ativo" DROP NOT NULL`);
    await queryRunner.query(
      `ALTER TABLE "fornecedores" DROP CONSTRAINT "UQ_36915b17f08ccc3ce20a2f1d37a"`,
    );
    await queryRunner.query(`ALTER TABLE "fornecedores" ALTER COLUMN "cnpj_cpf" DROP NOT NULL`);
    await queryRunner.query(
      `UPDATE "fornecedores" SET "cnpj_cpf" = NULL WHERE "cnpj_cpf" LIKE 'TEMP-%'`,
    );
    await queryRunner.query(
      `ALTER TABLE "fornecedores" ALTER COLUMN "cnpj_cpf" TYPE character varying(18) USING SUBSTRING("cnpj_cpf"::text, 1, 18)`,
    );
    await queryRunner.query(
      `ALTER TABLE "fornecedores" ALTER COLUMN "endereco" TYPE character varying(255)`,
    );
    await queryRunner.query(
      `ALTER TABLE "fornecedores" ALTER COLUMN "cep" TYPE character varying(9)`,
    );
    await queryRunner.query(`ALTER TABLE "contatos" ALTER COLUMN "updatedAt" DROP NOT NULL`);
    await queryRunner.query(`ALTER TABLE "contatos" ALTER COLUMN "createdAt" DROP NOT NULL`);
    await queryRunner.query(
      `COMMENT ON COLUMN "contatos"."clienteId" IS 'Cliente (empresa) ao qual o contato pertence'`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "contatos"."principal" IS 'Se true, é o contato principal da empresa'`,
    );
    await queryRunner.query(`ALTER TABLE "contatos" ALTER COLUMN "principal" DROP NOT NULL`);
    await queryRunner.query(`ALTER TABLE "contatos" ALTER COLUMN "ativo" DROP NOT NULL`);
    await queryRunner.query(
      `COMMENT ON COLUMN "contatos"."cargo" IS 'Cargo do contato na empresa (ex: Gerente, Comprador, Financeiro)'`,
    );
    await queryRunner.query(`ALTER TABLE "faturas" DROP COLUMN "atualizadoPor"`);
    await queryRunner.query(`ALTER TABLE "faturas" DROP COLUMN "criadoPor"`);
    await queryRunner.query(`ALTER TABLE "contas_pagar" DROP COLUMN "updated_at"`);
    await queryRunner.query(`ALTER TABLE "contas_pagar" DROP COLUMN "created_at"`);
    await queryRunner.query(`ALTER TABLE "contas_pagar" DROP COLUMN "valor"`);
    await queryRunner.query(
      `ALTER TABLE "atendimento_integracoes_config" ADD "auto_criar_leads" boolean DEFAULT true`,
    );
    await queryRunner.query(
      `ALTER TABLE "atendimento_integracoes_config" ADD "twilio_whatsapp_number" character varying(50)`,
    );
    await queryRunner.query(
      `ALTER TABLE "atendimento_integracoes_config" ADD "twilio_ativo" boolean DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "atendimento_integracoes_config" ADD "telegram_webhook_url" character varying(255)`,
    );
    await queryRunner.query(
      `ALTER TABLE "atendimento_integracoes_config" ADD "telegram_bot_token" character varying(255)`,
    );
    await queryRunner.query(
      `ALTER TABLE "atendimento_integracoes_config" ADD "auto_criar_clientes" boolean DEFAULT true`,
    );
    await queryRunner.query(
      `ALTER TABLE "atendimento_integracoes_config" ADD "ia_classificacao_automatica" boolean DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "atendimento_integracoes_config" ADD "twilio_sms_number" character varying(50)`,
    );
    await queryRunner.query(
      `ALTER TABLE "atendimento_integracoes_config" ADD "anthropic_model" character varying(50) DEFAULT 'claude-3-sonnet'`,
    );
    await queryRunner.query(
      `ALTER TABLE "atendimento_integracoes_config" ADD "openai_model" character varying(50) DEFAULT 'gpt-4'`,
    );
    await queryRunner.query(
      `ALTER TABLE "atendimento_integracoes_config" ADD "anthropic_api_key" character varying(255)`,
    );
    await queryRunner.query(
      `ALTER TABLE "atendimento_integracoes_config" ADD "facebook_page_id" character varying(100)`,
    );
    await queryRunner.query(
      `ALTER TABLE "atendimento_integracoes_config" ADD "ia_sugestoes_atendente" boolean DEFAULT true`,
    );
    await queryRunner.query(
      `ALTER TABLE "atendimento_integracoes_config" ADD "openai_api_key" character varying(255)`,
    );
    await queryRunner.query(
      `ALTER TABLE "atendimento_integracoes_config" ADD "telegram_ativo" boolean DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "atendimento_integracoes_config" ADD "updated_at" TIMESTAMP DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "atendimento_integracoes_config" ADD "facebook_page_access_token" text`,
    );
    await queryRunner.query(
      `ALTER TABLE "atendimento_integracoes_config" ADD "email_provider" character varying(50)`,
    );
    await queryRunner.query(
      `ALTER TABLE "atendimento_integracoes_config" ADD "email_from_address" character varying(255)`,
    );
    await queryRunner.query(
      `ALTER TABLE "atendimento_integracoes_config" ADD "ia_respostas_automaticas" boolean DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "atendimento_integracoes_config" ADD "ia_provider" character varying(50) DEFAULT 'openai'`,
    );
    await queryRunner.query(
      `ALTER TABLE "atendimento_integracoes_config" ADD "ia_analise_sentimento" boolean DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "atendimento_integracoes_config" ADD "twilio_account_sid" character varying(255)`,
    );
    await queryRunner.query(
      `ALTER TABLE "atendimento_integracoes_config" ADD "twilio_auth_token" character varying(255)`,
    );
    await queryRunner.query(
      `ALTER TABLE "atendimento_integracoes_config" ADD "email_api_key" character varying(255)`,
    );
    await queryRunner.query(
      `ALTER TABLE "atendimento_integracoes_config" ADD "notificacoes_ativas" boolean DEFAULT true`,
    );
    await queryRunner.query(
      `ALTER TABLE "atendimento_integracoes_config" ADD "instagram_account_id" character varying(100)`,
    );
    await queryRunner.query(
      `ALTER TABLE "atendimento_integracoes_config" ADD "created_at" TIMESTAMP DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "atendimento_integracoes_config" ADD "meta_ativo" boolean DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "atendimento_integracoes_config" ADD "email_ativo" boolean DEFAULT false`,
    );
    await queryRunner.query(`ALTER TABLE "atendimento_mensagens" ADD "conteudo_formatado" text`);
    await queryRunner.query(`ALTER TABLE "atendimento_mensagens" ADD "atendente_id" uuid`);
    await queryRunner.query(
      `ALTER TABLE "atendimento_mensagens" ADD "template_usado" character varying(100)`,
    );
    await queryRunner.query(
      `ALTER TABLE "atendimento_mensagens" ADD "privada" boolean DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "atendimento_mensagens" ADD "entregue" boolean DEFAULT true`,
    );
    await queryRunner.query(`ALTER TABLE "atendimento_mensagens" ADD "lida" boolean DEFAULT false`);
    await queryRunner.query(`ALTER TABLE "atendimento_mensagens" ADD "data_leitura" TIMESTAMP`);
    await queryRunner.query(`ALTER TABLE "atendimento_mensagens" ADD "metadata" jsonb`);
    await queryRunner.query(`ALTER TABLE "atendimento_mensagens" ADD "erro_envio" text`);
    await queryRunner.query(
      `ALTER TABLE "atendimento_mensagens" ADD "resposta_automatica" boolean DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "contas_pagar" ADD "valor_original" numeric(15,2) NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "contas_pagar" ADD "criado_em" TIMESTAMP DEFAULT CURRENT_TIMESTAMP`,
    );
    await queryRunner.query(
      `ALTER TABLE "contas_pagar" ADD "prioridade" character varying(10) DEFAULT 'media'`,
    );
    await queryRunner.query(`ALTER TABLE "contas_pagar" ADD "valor_total" numeric(15,2)`);
    await queryRunner.query(`ALTER TABLE "contas_pagar" ADD "aprovado_por" uuid`);
    await queryRunner.query(`ALTER TABLE "contas_pagar" ADD "atualizado_por" uuid`);
    await queryRunner.query(`ALTER TABLE "contas_pagar" ADD "data_agendamento" date`);
    await queryRunner.query(`ALTER TABLE "contas_pagar" ADD "valor_restante" numeric(15,2)`);
    await queryRunner.query(
      `ALTER TABLE "contas_pagar" ADD "tipo_pagamento" character varying(30)`,
    );
    await queryRunner.query(`ALTER TABLE "contas_pagar" ADD "centro_custo" character varying(100)`);
    await queryRunner.query(`ALTER TABLE "contas_pagar" ADD "anexos" jsonb`);
    await queryRunner.query(
      `ALTER TABLE "contas_pagar" ADD "data_emissao" date DEFAULT CURRENT_DATE`,
    );
    await queryRunner.query(
      `ALTER TABLE "contas_pagar" ADD "necessita_aprovacao" boolean DEFAULT false`,
    );
    await queryRunner.query(`ALTER TABLE "contas_pagar" ADD "data_aprovacao" TIMESTAMP`);
    await queryRunner.query(
      `ALTER TABLE "contas_pagar" ADD "atualizado_em" TIMESTAMP DEFAULT CURRENT_TIMESTAMP`,
    );
    await queryRunner.query(
      `ALTER TABLE "contas_pagar" ADD "forma_pagamento" character varying(30)`,
    );
    await queryRunner.query(`ALTER TABLE "contas_pagar" ADD "numero" character varying(50)`);
    await queryRunner.query(
      `ALTER TABLE "contas_pagar" ADD CONSTRAINT "contas_pagar_numero_key" UNIQUE ("numero")`,
    );
    await queryRunner.query(`ALTER TABLE "contas_pagar" ADD "conta_bancaria_id" uuid`);
    await queryRunner.query(`ALTER TABLE "contas_pagar" ADD "criado_por" uuid`);
    await queryRunner.query(
      `ALTER TABLE "contas_pagar" ADD "valor_multa" numeric(15,2) DEFAULT '0'`,
    );
    await queryRunner.query(
      `ALTER TABLE "contas_pagar" ADD "valor_desconto" numeric(15,2) DEFAULT '0'`,
    );
    await queryRunner.query(`ALTER TABLE "contas_pagar" ADD "tags" character varying(500)`);
    await queryRunner.query(
      `ALTER TABLE "contas_pagar" ADD "categoria" character varying(50) DEFAULT 'operacional'`,
    );
    await queryRunner.query(
      `ALTER TABLE "contas_pagar" ADD "valor_juros" numeric(15,2) DEFAULT '0'`,
    );
    await queryRunner.query(
      `ALTER TABLE "contas_pagar" ADD "frequencia_recorrencia" character varying(50)`,
    );
    await queryRunner.query(
      `ALTER TABLE "contas_pagar" ADD "comprovante_pagamento" character varying(500)`,
    );
    await queryRunner.query(`ALTER TABLE "contas_pagar" ADD "recorrente" boolean DEFAULT false`);
    await queryRunner.query(
      `ALTER TABLE "contas_pagar" ADD "valor_pago" numeric(15,2) DEFAULT '0'`,
    );
    await queryRunner.query(`ALTER TABLE "faturas" ADD "clienteId_old_numeric" integer`);
    await queryRunner.query(`ALTER TABLE "atendimento_tickets" ADD "fatura_id" uuid`);
    await queryRunner.query(`ALTER TABLE "atendimento_tickets" ADD "proposta_id" uuid`);
    await queryRunner.query(`ALTER TABLE "atendimento_tickets" ADD "oportunidade_id" uuid`);
    await queryRunner.query(
      `ALTER TABLE "atendimento_tickets" ADD "sla_resposta_vencido" boolean DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "atendimento_tickets" ADD "contato_email" character varying(255)`,
    );
    await queryRunner.query(
      `ALTER TABLE "atendimento_tickets" ADD "categoria" character varying(100)`,
    );
    await queryRunner.query(`ALTER TABLE "atendimento_tickets" ADD "tags" text array`);
    await queryRunner.query(`ALTER TABLE "atendimento_tickets" ADD "contato_dados" jsonb`);
    await queryRunner.query(
      `ALTER TABLE "atendimento_tickets" ADD "sla_resolucao_vencido" boolean DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "atendimento_tickets" ADD "contato_last_activity" TIMESTAMP`,
    );
    await queryRunner.query(`ALTER TABLE "atendimento_tickets" ADD "metadata" jsonb`);
    await queryRunner.query(`ALTER TABLE "atendimento_tickets" ADD "data_avaliacao" TIMESTAMP`);
    await queryRunner.query(
      `ALTER TABLE "atendimento_tickets" ADD "contato_online" boolean DEFAULT false`,
    );
    await queryRunner.query(`ALTER TABLE "atendimento_tickets" ADD "contrato_id" uuid`);
    await queryRunner.query(`ALTER TABLE "atendimento_tickets" ADD "avaliacao" integer`);
    await queryRunner.query(
      `ALTER TABLE "atendimento_tickets" ADD "identificador_externo" character varying(255)`,
    );
    await queryRunner.query(`ALTER TABLE "atendimento_tickets" ADD "comentario_avaliacao" text`);
    await queryRunner.query(`ALTER TABLE "atendimento_tickets" ADD "descricao" text`);
    await queryRunner.query(`ALTER TABLE "atendimento_tickets" ADD "cliente_id" uuid`);
    await queryRunner.query(`ALTER TABLE "contatos" ADD "last_activity" TIMESTAMP`);
    await queryRunner.query(`ALTER TABLE "contatos" ADD "online_status" boolean DEFAULT false`);
    await queryRunner.query(
      `ALTER TABLE "users" ADD "primeira_senha" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(`DROP TABLE "planos_cobranca"`);
    await queryRunner.query(`DROP TYPE "public"."planos_cobranca_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."planos_cobranca_tiporecorrencia_enum"`);
    await queryRunner.query(`DROP TABLE "assinaturas_contrato"`);
    await queryRunner.query(`DROP TYPE "public"."assinaturas_contrato_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."assinaturas_contrato_tipo_enum"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_006aec56cd22a82d0fe68a18d9"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_fa2c2f9353b1c9108b4651153a"`);
    await queryRunner.query(`DROP TABLE "eventos_fluxo"`);
    await queryRunner.query(`DROP TYPE "public"."eventos_fluxo_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."eventos_fluxo_tipoevento_enum"`);
    await queryRunner.query(`DROP TABLE "fluxos_automatizados"`);
    await queryRunner.query(`DROP TYPE "public"."fluxos_automatizados_status_enum"`);
    // ❌ REMOVIDO: Não dropar índices e tabela triagem_logs (gerenciados por outra migration)
    // await queryRunner.query(`DROP INDEX "public"."idx_triagem_logs_empresa"`);
    // await queryRunner.query(`DROP INDEX "public"."idx_triagem_logs_sessao"`);
    // await queryRunner.query(`DROP INDEX "public"."idx_triagem_logs_fluxo"`);
    // await queryRunner.query(`DROP TABLE "triagem_logs"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_70fe58d85050b98f06a61c9f77"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_8e40da9649c6e14b9178f68b01"`);
    await queryRunner.query(`DROP TABLE "anexos_cotacao"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_a8cc61433ad56cc7353f281841"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_b67b9648e4c0f0752cc559044c"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_73a50683a9099014dfc1ae5f54"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_bf14ca2583d1c90e8ea75ffd8a"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_02d7405f867a53d9ec501c686d"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_6aac38dbd9295ab00b90483b0b"`);
    await queryRunner.query(`DROP TABLE "cotacoes"`);
    await queryRunner.query(`DROP TYPE "public"."cotacoes_origem_enum"`);
    await queryRunner.query(`DROP TYPE "public"."cotacoes_prioridade_enum"`);
    await queryRunner.query(`DROP TYPE "public"."cotacoes_status_enum"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_c2c7135bba968bf7a704f83571"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_4abce30d9cb740a703be515d80"`);
    await queryRunner.query(`DROP TABLE "itens_cotacao"`);
    await queryRunner.query(
      `COMMENT ON TABLE "canais" IS 'Canais de comunicaÃ§Ã£o (WhatsApp, Telegram, Email, etc)'`,
    );
    await queryRunner.query(`COMMENT ON TABLE "atendentes" IS 'Atendentes/Agentes do sistema'`);
    await queryRunner.query(
      `COMMENT ON TABLE "filas" IS 'Filas de atendimento para distribuiÃ§Ã£o de tickets'`,
    );
    await queryRunner.query(
      `COMMENT ON TABLE "contas_pagar" IS 'Contas a pagar com controle de status e pagamentos'`,
    );
    await queryRunner.query(
      `COMMENT ON TABLE "atendente_atribuicoes" IS 'Atribuições diretas de atendentes a núcleos ou departamentos específicos'`,
    );
    await queryRunner.query(`COMMENT ON TABLE "equipes" IS 'Equipes de atendimento da empresa'`);
    await queryRunner.query(
      `COMMENT ON TABLE "atendente_equipes" IS 'RelacionamentoMany-to-Many entre atendentes e equipes'`,
    );
    await queryRunner.query(
      `COMMENT ON TABLE "equipe_atribuicoes" IS 'Atribuições de equipes a núcleos ou departamentos específicos'`,
    );
    await queryRunner.query(
      `COMMENT ON TABLE "fornecedores" IS 'Cadastro de fornecedores com isolamento por empresa'`,
    );
    await queryRunner.query(
      `COMMENT ON TABLE "contatos" IS 'Contatos (funcionários) vinculados a clientes (empresas)'`,
    );
    await queryRunner.query(
      `ALTER TABLE "atendente_equipes" ADD CONSTRAINT "uk_atendente_equipe" UNIQUE ("atendente_id", "equipe_id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "nucleos_atendimento" ADD CONSTRAINT "unique_nucleo_codigo_empresa" UNIQUE ("empresa_id", "codigo")`,
    );
    await queryRunner.query(
      `ALTER TABLE "fluxos_triagem" ADD CONSTRAINT "unique_fluxo_codigo_empresa" UNIQUE ("empresa_id", "codigo", "versao")`,
    );
    await queryRunner.query(
      `ALTER TABLE "fornecedores" ADD CONSTRAINT "uk_fornecedores_cnpj_cpf_empresa" UNIQUE ("cnpj_cpf", "empresa_id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "contas_pagar" ADD CONSTRAINT "contas_pagar_categoria_check" CHECK (((categoria)::text = ANY (ARRAY[('operacional'::character varying)::text, ('administrativa'::character varying)::text, ('financeira'::character varying)::text, ('tributaria'::character varying)::text, ('investimento'::character varying)::text, ('fornecedores'::character varying)::text, ('outros'::character varying)::text])))`,
    );
    await queryRunner.query(
      `ALTER TABLE "contas_pagar" ADD CONSTRAINT "chk_contas_pagar_data_vencimento" CHECK ((data_vencimento >= data_emissao))`,
    );
    await queryRunner.query(
      `ALTER TABLE "contas_pagar" ADD CONSTRAINT "chk_contas_pagar_valor_pago" CHECK ((valor_pago >= (0)::numeric))`,
    );
    await queryRunner.query(
      `ALTER TABLE "contas_pagar" ADD CONSTRAINT "chk_contas_pagar_valor_original" CHECK ((valor_original > (0)::numeric))`,
    );
    await queryRunner.query(
      `ALTER TABLE "contas_pagar" ADD CONSTRAINT "contas_pagar_forma_pagamento_check" CHECK (((forma_pagamento)::text = ANY ((ARRAY['dinheiro'::character varying, 'transferencia'::character varying, 'boleto'::character varying, 'cartao_credito'::character varying, 'cartao_debito'::character varying, 'pix'::character varying, 'cheque'::character varying])::text[])))`,
    );
    await queryRunner.query(
      `ALTER TABLE "contas_pagar" ADD CONSTRAINT "contas_pagar_prioridade_check" CHECK (((prioridade)::text = ANY ((ARRAY['baixa'::character varying, 'media'::character varying, 'alta'::character varying, 'urgente'::character varying])::text[])))`,
    );
    await queryRunner.query(
      `ALTER TABLE "contas_pagar" ADD CONSTRAINT "contas_pagar_status_check" CHECK (((status)::text = ANY ((ARRAY['pendente'::character varying, 'pago'::character varying, 'vencido'::character varying, 'cancelado'::character varying])::text[])))`,
    );
    await queryRunner.query(
      `ALTER TABLE "faturas" ADD CONSTRAINT "faturas_formaPagamentoPreferida_check" CHECK ((("formaPagamentoPreferida")::text = ANY ((ARRAY['pix'::character varying, 'cartao_credito'::character varying, 'cartao_debito'::character varying, 'boleto'::character varying, 'transferencia'::character varying, 'dinheiro'::character varying])::text[])))`,
    );
    await queryRunner.query(
      `ALTER TABLE "faturas" ADD CONSTRAINT "faturas_status_check" CHECK (((status)::text = ANY ((ARRAY['pendente'::character varying, 'enviada'::character varying, 'paga'::character varying, 'vencida'::character varying, 'cancelada'::character varying, 'parcialmente_paga'::character varying])::text[])))`,
    );
    await queryRunner.query(
      `ALTER TABLE "faturas" ADD CONSTRAINT "faturas_tipo_check" CHECK (((tipo)::text = ANY ((ARRAY['unica'::character varying, 'recorrente'::character varying, 'parcela'::character varying, 'adicional'::character varying])::text[])))`,
    );
    await queryRunner.query(
      `ALTER TABLE "pagamentos" ADD CONSTRAINT "pagamentos_status_check" CHECK (((status)::text = ANY ((ARRAY['pendente'::character varying, 'processando'::character varying, 'aprovado'::character varying, 'rejeitado'::character varying, 'cancelado'::character varying, 'estornado'::character varying])::text[])))`,
    );
    await queryRunner.query(
      `ALTER TABLE "pagamentos" ADD CONSTRAINT "pagamentos_tipo_check" CHECK (((tipo)::text = ANY ((ARRAY['pagamento'::character varying, 'estorno'::character varying, 'ajuste'::character varying, 'desconto'::character varying])::text[])))`,
    );
    await queryRunner.query(
      `ALTER TABLE "atendente_atribuicoes" ADD CONSTRAINT "check_atribuicao" CHECK (((nucleo_id IS NOT NULL) OR (departamento_id IS NOT NULL)))`,
    );
    await queryRunner.query(
      `ALTER TABLE "equipe_atribuicoes" ADD CONSTRAINT "check_equipe_atribuicao" CHECK (((nucleo_id IS NOT NULL) OR (departamento_id IS NOT NULL)))`,
    );
    await queryRunner.query(
      `ALTER TABLE "fornecedores" ADD CONSTRAINT "chk_fornecedores_cep" CHECK ((((cep)::text ~ '^[0-9]{5}-?[0-9]{3}$'::text) OR (cep IS NULL)))`,
    );
    await queryRunner.query(
      `ALTER TABLE "fornecedores" ADD CONSTRAINT "chk_fornecedores_estado" CHECK ((((estado)::text ~ '^[A-Z]{2}$'::text) OR (estado IS NULL)))`,
    );
    await queryRunner.query(`CREATE INDEX "idx_canais_empresa" ON "canais" ("empresaId") `);
    await queryRunner.query(
      `CREATE INDEX "idx_demandas_created_at" ON "atendimento_demandas" ("created_at") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_demandas_prioridade" ON "atendimento_demandas" ("prioridade") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_demandas_status" ON "atendimento_demandas" ("status") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_demandas_empresa_id" ON "atendimento_demandas" ("empresa_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_demandas_telefone" ON "atendimento_demandas" ("contato_telefone") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_demandas_ticket_id" ON "atendimento_demandas" ("ticket_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_demandas_cliente_id" ON "atendimento_demandas" ("cliente_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_demandas_data_vencimento" ON "atendimento_demandas" ("data_vencimento") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_demandas_responsavel_id" ON "atendimento_demandas" ("responsavel_id") `,
    );
    await queryRunner.query(`CREATE INDEX "idx_demandas_tipo" ON "atendimento_demandas" ("tipo") `);
    await queryRunner.query(
      `CREATE INDEX "idx_atendimento_canais_tipo" ON "atendimento_canais" ("tipo") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_atendimento_canais_empresa" ON "atendimento_canais" ("empresa_id") `,
    );
    await queryRunner.query(`CREATE INDEX "idx_atendentes_empresa" ON "atendentes" ("empresaId") `);
    await queryRunner.query(`CREATE INDEX "idx_filas_empresa" ON "filas" ("empresaId") `);
    await queryRunner.query(
      `CREATE INDEX "idx_integracoes_config_ativo" ON "atendimento_integracoes_config" ("ativo") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_integracoes_config_empresa_tipo" ON "atendimento_integracoes_config" ("empresa_id", "tipo") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_notas_created_at" ON "atendimento_notas_cliente" ("created_at") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_notas_importante" ON "atendimento_notas_cliente" ("importante") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_notas_empresa_id" ON "atendimento_notas_cliente" ("empresa_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_notas_telefone" ON "atendimento_notas_cliente" ("contato_telefone") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_notas_ticket_id" ON "atendimento_notas_cliente" ("ticket_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_notas_cliente_id" ON "atendimento_notas_cliente" ("cliente_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_atendimento_mensagens_data" ON "atendimento_mensagens" ("created_at") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_atendimento_mensagens_atendente" ON "atendimento_mensagens" ("atendente_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_atendimento_mensagens_tipo" ON "atendimento_mensagens" ("tipo") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_atendimento_mensagens_ticket" ON "atendimento_mensagens" ("ticket_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_contas_pagar_categoria" ON "contas_pagar" ("categoria") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_contas_pagar_data_emissao" ON "contas_pagar" ("data_emissao") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_contas_pagar_vencimento" ON "contas_pagar" ("data_vencimento") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_contas_pagar_fornecedor" ON "contas_pagar" ("fornecedor_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_contas_pagar_empresa_status" ON "contas_pagar" ("status", "empresa_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_faturas_clienteid_uuid" ON "faturas" ("clienteId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_faturas_vencimento" ON "faturas" ("dataVencimento") `,
    );
    await queryRunner.query(`CREATE INDEX "idx_faturas_status" ON "faturas" ("status") `);
    await queryRunner.query(`CREATE INDEX "idx_faturas_contrato" ON "faturas" ("contratoId") `);
    await queryRunner.query(`CREATE INDEX "idx_faturas_numero" ON "faturas" ("numero") `);
    await queryRunner.query(
      `CREATE INDEX "idx_faturas_clienteid_uuid_status" ON "faturas" ("status", "clienteId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_itens_fatura_fatura" ON "itens_fatura" ("faturaId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_atendente_atribuicoes_ativo" ON "atendente_atribuicoes" ("ativo") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_atendente_atribuicoes_departamento" ON "atendente_atribuicoes" ("departamento_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_atendente_atribuicoes_nucleo" ON "atendente_atribuicoes" ("nucleo_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_atendente_atribuicoes_atendente" ON "atendente_atribuicoes" ("atendente_id") `,
    );
    await queryRunner.query(`CREATE INDEX "idx_equipes_ativo" ON "equipes" ("ativo") `);
    await queryRunner.query(`CREATE INDEX "idx_equipes_empresa" ON "equipes" ("empresa_id") `);
    await queryRunner.query(
      `CREATE INDEX "idx_atendente_equipes_equipe" ON "atendente_equipes" ("equipe_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_atendente_equipes_atendente" ON "atendente_equipes" ("atendente_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_equipe_atribuicoes_ativo" ON "equipe_atribuicoes" ("ativo") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_equipe_atribuicoes_departamento" ON "equipe_atribuicoes" ("departamento_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_equipe_atribuicoes_nucleo" ON "equipe_atribuicoes" ("nucleo_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_equipe_atribuicoes_equipe" ON "equipe_atribuicoes" ("equipe_id") `,
    );
    await queryRunner.query(`CREATE INDEX "idx_departamentos_ativo" ON "departamentos" ("ativo") `);
    await queryRunner.query(
      `CREATE INDEX "idx_departamentos_nucleo" ON "departamentos" ("nucleo_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_departamentos_empresa" ON "departamentos" ("empresa_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_sessao_iniciado" ON "sessoes_triagem" ("iniciado_em") `,
    );
    await queryRunner.query(`CREATE INDEX "idx_sessao_ticket" ON "sessoes_triagem" ("ticket_id") `);
    await queryRunner.query(`CREATE INDEX "idx_sessao_fluxo" ON "sessoes_triagem" ("fluxo_id") `);
    await queryRunner.query(`CREATE INDEX "idx_sessao_status" ON "sessoes_triagem" ("status") `);
    await queryRunner.query(
      `CREATE INDEX "idx_sessao_contato" ON "sessoes_triagem" ("contato_telefone") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_atendimento_tickets_canal" ON "atendimento_tickets" ("canal_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_atendimento_tickets_fila" ON "atendimento_tickets" ("fila_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_atendimento_tickets_atendente" ON "atendimento_tickets" ("atendente_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_atendimento_tickets_cliente" ON "atendimento_tickets" ("cliente_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_atendimento_tickets_numero" ON "atendimento_tickets" ("empresa_id", "numero") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_atendimento_tickets_empresa" ON "atendimento_tickets" ("empresa_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_atendimento_tickets_status" ON "atendimento_tickets" ("status") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_nucleo_codigo" ON "nucleos_atendimento" ("codigo") `,
    );
    await queryRunner.query(`CREATE INDEX "idx_nucleo_ativo" ON "nucleos_atendimento" ("ativo") `);
    await queryRunner.query(
      `CREATE INDEX "idx_nucleo_empresa" ON "nucleos_atendimento" ("empresa_id") `,
    );
    await queryRunner.query(`CREATE INDEX "idx_fluxo_canais" ON "fluxos_triagem" ("canais") `);
    await queryRunner.query(
      `CREATE INDEX "idx_fluxo_publicado" ON "fluxos_triagem" ("publicado") `,
    );
    await queryRunner.query(`CREATE INDEX "idx_fluxo_ativo" ON "fluxos_triagem" ("ativo") `);
    await queryRunner.query(`CREATE INDEX "idx_fluxo_empresa" ON "fluxos_triagem" ("empresa_id") `);
    await queryRunner.query(
      `CREATE INDEX "idx_fornecedores_empresa_ativo" ON "fornecedores" ("empresa_id", "ativo") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_fornecedores_email" ON "fornecedores" ("email") WHERE (email IS NOT NULL)`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_fornecedores_cnpj_cpf" ON "fornecedores" ("cnpj_cpf") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_contatos_last_activity" ON "contatos" ("last_activity") `,
    );
    await queryRunner.query(`CREATE INDEX "idx_contatos_principal" ON "contatos" ("principal") `);
    await queryRunner.query(`CREATE INDEX "idx_contatos_ativo" ON "contatos" ("ativo") `);
    await queryRunner.query(`CREATE INDEX "idx_contatos_telefone" ON "contatos" ("telefone") `);
    await queryRunner.query(`CREATE INDEX "idx_contatos_clienteid" ON "contatos" ("clienteId") `);
    await queryRunner.query(
      `ALTER TABLE "canais" ADD CONSTRAINT "canais_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "atendimento_demandas" ADD CONSTRAINT "FK_8941088e9191d7c1c826a8c4084" FOREIGN KEY ("autor_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "atendimento_demandas" ADD CONSTRAINT "FK_2691f1d5df7e1c8cdb076a55e83" FOREIGN KEY ("responsavel_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "atendimento_canais" ADD CONSTRAINT "fk_atendimento_canais_empresa" FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "atendentes" ADD CONSTRAINT "atendentes_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "atendentes" ADD CONSTRAINT "atendentes_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "filas" ADD CONSTRAINT "filas_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "atendimento_integracoes_config" ADD CONSTRAINT "fk_atendimento_integracoes_empresa" FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "atendimento_notas_cliente" ADD CONSTRAINT "FK_c60fc0dc807287e6f8d11594469" FOREIGN KEY ("autor_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "atendimento_mensagens" ADD CONSTRAINT "fk_atendimento_mensagens_atendente" FOREIGN KEY ("atendente_id") REFERENCES "atendimento_atendentes"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "atendimento_mensagens" ADD CONSTRAINT "fk_atendimento_mensagens_ticket" FOREIGN KEY ("ticket_id") REFERENCES "atendimento_tickets"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "contas_pagar" ADD CONSTRAINT "fk_contas_pagar_conta_bancaria" FOREIGN KEY ("conta_bancaria_id") REFERENCES "contas_bancarias"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "faturas" ADD CONSTRAINT "faturas_clienteid_fkey" FOREIGN KEY ("clienteId") REFERENCES "clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "pagamentos" ADD CONSTRAINT "fk_pagamentos_fatura" FOREIGN KEY ("faturaId") REFERENCES "faturas"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "itens_fatura" ADD CONSTRAINT "itens_fatura_faturaId_fkey" FOREIGN KEY ("faturaId") REFERENCES "faturas"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "contratos" ADD CONSTRAINT "FK_contratos_proposta" FOREIGN KEY ("propostaId") REFERENCES "propostas"("id") ON DELETE SET NULL ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "atendente_atribuicoes" ADD CONSTRAINT "fk_atendente_atribuicoes_departamento" FOREIGN KEY ("departamento_id") REFERENCES "departamentos"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "atendente_atribuicoes" ADD CONSTRAINT "fk_atendente_atribuicoes_nucleo" FOREIGN KEY ("nucleo_id") REFERENCES "nucleos_atendimento"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "atendente_atribuicoes" ADD CONSTRAINT "fk_atendente_atribuicoes_atendente" FOREIGN KEY ("atendente_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "equipes" ADD CONSTRAINT "fk_equipes_empresa" FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "atendente_equipes" ADD CONSTRAINT "fk_atendente_equipes_equipe" FOREIGN KEY ("equipe_id") REFERENCES "equipes"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "atendente_equipes" ADD CONSTRAINT "fk_atendente_equipes_atendente" FOREIGN KEY ("atendente_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "equipe_atribuicoes" ADD CONSTRAINT "fk_equipe_atribuicoes_departamento" FOREIGN KEY ("departamento_id") REFERENCES "departamentos"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "equipe_atribuicoes" ADD CONSTRAINT "fk_equipe_atribuicoes_nucleo" FOREIGN KEY ("nucleo_id") REFERENCES "nucleos_atendimento"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "equipe_atribuicoes" ADD CONSTRAINT "fk_equipe_atribuicoes_equipe" FOREIGN KEY ("equipe_id") REFERENCES "equipes"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "departamentos" ADD CONSTRAINT "fk_departamentos_supervisor" FOREIGN KEY ("supervisor_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "departamentos" ADD CONSTRAINT "fk_departamentos_nucleo" FOREIGN KEY ("nucleo_id") REFERENCES "nucleos_atendimento"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "departamentos" ADD CONSTRAINT "fk_departamentos_empresa" FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_activities" ADD CONSTRAINT "user_activities_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "sessoes_triagem" ADD CONSTRAINT "fk_sessao_nucleo" FOREIGN KEY ("nucleo_destino_id") REFERENCES "nucleos_atendimento"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "sessoes_triagem" ADD CONSTRAINT "fk_sessao_ticket" FOREIGN KEY ("ticket_id") REFERENCES "atendimento_tickets"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "sessoes_triagem" ADD CONSTRAINT "fk_sessao_fluxo" FOREIGN KEY ("fluxo_id") REFERENCES "fluxos_triagem"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "sessoes_triagem" ADD CONSTRAINT "fk_sessao_empresa" FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "atendimento_tickets" ADD CONSTRAINT "fk_atendimento_tickets_atendente" FOREIGN KEY ("atendente_id") REFERENCES "atendimento_atendentes"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "atendimento_tickets" ADD CONSTRAINT "fk_atendimento_tickets_fila" FOREIGN KEY ("fila_id") REFERENCES "atendimento_filas"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "atendimento_tickets" ADD CONSTRAINT "fk_atendimento_tickets_canal" FOREIGN KEY ("canal_id") REFERENCES "atendimento_canais"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "atendimento_tickets" ADD CONSTRAINT "fk_atendimento_tickets_empresa" FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "nucleos_atendimento" ADD CONSTRAINT "fk_nucleo_supervisor" FOREIGN KEY ("supervisor_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "nucleos_atendimento" ADD CONSTRAINT "fk_nucleo_empresa" FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "fluxos_triagem" ADD CONSTRAINT "fk_fluxo_empresa" FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "contatos" ADD CONSTRAINT "fk_contatos_cliente" FOREIGN KEY ("clienteId") REFERENCES "clientes"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }
}
