import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAtendimentoTables1728518400000 implements MigrationInterface {
  name = 'CreateAtendimentoTables1728518400000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // NecessÃ¡rio para `gen_random_uuid()` (Postgres)
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`);

    // 1. Tabela de Canais de Atendimento
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS atendimento_canais (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL,

    -- Identificação
    nome VARCHAR(100) NOT NULL,
    tipo VARCHAR(50) NOT NULL,

    -- Integração
    provedor VARCHAR(50) NOT NULL DEFAULT 'whatsapp_business_api',
    config JSONB,

    -- Status
    ativo BOOLEAN DEFAULT TRUE,
    status VARCHAR(20) DEFAULT 'conectado',
    ultima_sincronizacao TIMESTAMP,
        
        -- Configurações
        horario_atendimento JSONB,
        mensagem_ausencia TEXT,
        auto_resposta_ativa BOOLEAN DEFAULT FALSE,
        
        -- Metadados
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        
        CONSTRAINT fk_atendimento_canais_empresa 
          FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX idx_atendimento_canais_empresa ON atendimento_canais(empresa_id)
    `);

    await queryRunner.query(`
      CREATE INDEX idx_atendimento_canais_tipo ON atendimento_canais(tipo)
    `);

    // 2. Tabela de Filas de Atendimento
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS atendimento_filas (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        empresa_id UUID NOT NULL,
        
        -- Identificação
        nome VARCHAR(100) NOT NULL,
        descricao TEXT,
        cor VARCHAR(7),
        icone VARCHAR(50),
        
        -- Configurações
        prioridade INTEGER DEFAULT 0,
        sla_resposta_minutos INTEGER,
        sla_resolucao_horas INTEGER,
        
        -- Distribuição automática
        distribuicao_automatica BOOLEAN DEFAULT FALSE,
        tipo_distribuicao VARCHAR(20) DEFAULT 'round_robin',
        max_tickets_por_atendente INTEGER DEFAULT 5,
        
        -- Status
        ativa BOOLEAN DEFAULT TRUE,
        
        -- Metadados
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        
        CONSTRAINT fk_atendimento_filas_empresa 
          FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX idx_atendimento_filas_empresa ON atendimento_filas(empresa_id)
    `);

    // 3. Tabela de Atendentes
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS atendimento_atendentes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        empresa_id UUID NOT NULL,
        usuario_id UUID NOT NULL,
        
        -- Status
        status VARCHAR(20) DEFAULT 'offline',
        disponivel BOOLEAN DEFAULT TRUE,
        max_atendimentos_simultaneos INTEGER DEFAULT 5,
        
        -- Estatísticas
        total_atendimentos INTEGER DEFAULT 0,
        total_mensagens_enviadas INTEGER DEFAULT 0,
        tempo_medio_resposta_segundos INTEGER,
        avaliacao_media DECIMAL(3,2),
        
        -- Último acesso
        ultimo_acesso TIMESTAMP,
        
        -- Metadados
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        
        CONSTRAINT fk_atendimento_atendentes_empresa 
          FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE,
        CONSTRAINT fk_atendimento_atendentes_usuario 
          FOREIGN KEY (usuario_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE(empresa_id, usuario_id)
      )
    `);

    await queryRunner.query(`
      CREATE INDEX idx_atendimento_atendentes_empresa ON atendimento_atendentes(empresa_id)
    `);

    await queryRunner.query(`
      CREATE INDEX idx_atendimento_atendentes_usuario ON atendimento_atendentes(usuario_id)
    `);

    await queryRunner.query(`
      CREATE INDEX idx_atendimento_atendentes_status ON atendimento_atendentes(status)
    `);

    // 4. Relacionamento Atendentes x Filas
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS atendimento_atendentes_filas (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        atendente_id UUID NOT NULL,
        fila_id UUID NOT NULL,
        
        -- Configurações
        prioridade INTEGER DEFAULT 0,
        notificacoes_ativas BOOLEAN DEFAULT TRUE,
        
        -- Metadados
        created_at TIMESTAMP DEFAULT NOW(),
        
        CONSTRAINT fk_atendentes_filas_atendente 
          FOREIGN KEY (atendente_id) REFERENCES atendimento_atendentes(id) ON DELETE CASCADE,
        CONSTRAINT fk_atendentes_filas_fila 
          FOREIGN KEY (fila_id) REFERENCES atendimento_filas(id) ON DELETE CASCADE,
        UNIQUE(atendente_id, fila_id)
      )
    `);

    await queryRunner.query(`
      CREATE INDEX idx_atendentes_filas_atendente ON atendimento_atendentes_filas(atendente_id)
    `);

    await queryRunner.query(`
      CREATE INDEX idx_atendentes_filas_fila ON atendimento_atendentes_filas(fila_id)
    `);

    // 5. Tabela de Tickets/Conversas
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS atendimento_tickets (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        empresa_id UUID NOT NULL,
        numero INTEGER NOT NULL,
        
        -- Identificação externa
        identificador_externo VARCHAR(255), -- ID no sistema externo (ex: WhatsApp message ID)
        
        -- Canal e Fila
        canal_id UUID,
        fila_id UUID,
        
        -- Cliente
        cliente_id UUID,
        contato_nome VARCHAR(255),
        contato_telefone VARCHAR(50),
        contato_email VARCHAR(255),
        contato_dados JSONB,
        
        -- Atendimento
        atendente_id UUID,
        status VARCHAR(20) DEFAULT 'aberto',
        prioridade VARCHAR(20) DEFAULT 'normal',
        
        -- Assunto
        assunto VARCHAR(255),
        descricao TEXT,
        categoria VARCHAR(100),
        
        -- SLA
        data_primeira_resposta TIMESTAMP,
        data_resolucao TIMESTAMP,
        sla_resposta_vencido BOOLEAN DEFAULT FALSE,
        sla_resolucao_vencido BOOLEAN DEFAULT FALSE,
        
        -- Avaliação
        avaliacao INTEGER,
        comentario_avaliacao TEXT,
        data_avaliacao TIMESTAMP,
        
        -- Contexto CRM
        proposta_id UUID,
        oportunidade_id UUID,
        fatura_id UUID,
        contrato_id UUID,
        
        -- Timestamps
        data_abertura TIMESTAMP DEFAULT NOW(),
        data_fechamento TIMESTAMP,
        ultima_mensagem_em TIMESTAMP,
        
        -- Metadados
        metadata JSONB,
        tags TEXT[],
        
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        
        CONSTRAINT fk_atendimento_tickets_empresa 
          FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE,
        CONSTRAINT fk_atendimento_tickets_canal 
          FOREIGN KEY (canal_id) REFERENCES atendimento_canais(id) ON DELETE SET NULL,
        CONSTRAINT fk_atendimento_tickets_fila 
          FOREIGN KEY (fila_id) REFERENCES atendimento_filas(id) ON DELETE SET NULL,
        CONSTRAINT fk_atendimento_tickets_atendente 
          FOREIGN KEY (atendente_id) REFERENCES atendimento_atendentes(id) ON DELETE SET NULL
      )
    `);

    await queryRunner.query(`
      CREATE INDEX idx_atendimento_tickets_empresa ON atendimento_tickets(empresa_id)
    `);

    await queryRunner.query(`
      CREATE INDEX idx_atendimento_tickets_numero ON atendimento_tickets(empresa_id, numero)
    `);

    await queryRunner.query(`
      CREATE INDEX idx_atendimento_tickets_cliente ON atendimento_tickets(cliente_id)
    `);

    await queryRunner.query(`
      CREATE INDEX idx_atendimento_tickets_atendente ON atendimento_tickets(atendente_id)
    `);

    await queryRunner.query(`
      CREATE INDEX idx_atendimento_tickets_status ON atendimento_tickets(status)
    `);

    await queryRunner.query(`
      CREATE INDEX idx_atendimento_tickets_fila ON atendimento_tickets(fila_id)
    `);

    await queryRunner.query(`
      CREATE INDEX idx_atendimento_tickets_canal ON atendimento_tickets(canal_id)
    `);

    // 6. Tabela de Mensagens
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS atendimento_mensagens (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        ticket_id UUID NOT NULL,
        
        -- Identificação externa
        identificador_externo VARCHAR(255), -- ID da mensagem no sistema externo
        
        -- Origem
        tipo VARCHAR(20) NOT NULL,
        remetente_tipo VARCHAR(20) NOT NULL,
        atendente_id UUID,
        
        -- Conteúdo
        conteudo TEXT NOT NULL,
        conteudo_formatado TEXT,
        
        -- Anexos
        anexos JSONB,
        
        -- Status
        lida BOOLEAN DEFAULT FALSE,
        data_leitura TIMESTAMP,
        entregue BOOLEAN DEFAULT TRUE,
        erro_envio TEXT,
        
        -- Contexto
        privada BOOLEAN DEFAULT FALSE,
        resposta_automatica BOOLEAN DEFAULT FALSE,
        template_usado VARCHAR(100),
        
        -- Metadados
        metadata JSONB,
        
        created_at TIMESTAMP DEFAULT NOW(),
        
        CONSTRAINT fk_atendimento_mensagens_ticket 
          FOREIGN KEY (ticket_id) REFERENCES atendimento_tickets(id) ON DELETE CASCADE,
        CONSTRAINT fk_atendimento_mensagens_atendente 
          FOREIGN KEY (atendente_id) REFERENCES atendimento_atendentes(id) ON DELETE SET NULL
      )
    `);

    await queryRunner.query(`
      CREATE INDEX idx_atendimento_mensagens_ticket ON atendimento_mensagens(ticket_id)
    `);

    await queryRunner.query(`
      CREATE INDEX idx_atendimento_mensagens_tipo ON atendimento_mensagens(tipo)
    `);

    await queryRunner.query(`
      CREATE INDEX idx_atendimento_mensagens_atendente ON atendimento_mensagens(atendente_id)
    `);

    await queryRunner.query(`
      CREATE INDEX idx_atendimento_mensagens_data ON atendimento_mensagens(created_at)
    `);

    // 7. Tabela de Templates de Mensagens
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS atendimento_templates (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        empresa_id UUID NOT NULL,
        
        -- Identificação
        nome VARCHAR(100) NOT NULL,
        atalho VARCHAR(50),
        categoria VARCHAR(100),
        
        -- Conteúdo
        conteudo TEXT NOT NULL,
        variaveis TEXT[],
        
        -- Anexos padrão
        anexos JSONB,
        
        -- Uso
        total_usos INTEGER DEFAULT 0,
        
        -- Status
        ativo BOOLEAN DEFAULT TRUE,
        
        -- Metadados
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        
        CONSTRAINT fk_atendimento_templates_empresa 
          FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX idx_atendimento_templates_empresa ON atendimento_templates(empresa_id)
    `);

    await queryRunner.query(`
      CREATE INDEX idx_atendimento_templates_atalho ON atendimento_templates(atalho)
    `);

    // 8. Tabela de Tags
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS atendimento_tags (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        empresa_id UUID NOT NULL,
        
        nome VARCHAR(50) NOT NULL,
        cor VARCHAR(7),
        descricao TEXT,
        
        -- Uso
        total_usos INTEGER DEFAULT 0,
        
        created_at TIMESTAMP DEFAULT NOW(),
        
        CONSTRAINT fk_atendimento_tags_empresa 
          FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE,
        UNIQUE(empresa_id, nome)
      )
    `);

    await queryRunner.query(`
      CREATE INDEX idx_atendimento_tags_empresa ON atendimento_tags(empresa_id)
    `);

    // 9. Tabela de Histórico de Mudanças
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS atendimento_historico (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        ticket_id UUID NOT NULL,
        
        -- Usuário que fez a mudança
        usuario_id UUID,
        
        -- Tipo de evento
        tipo VARCHAR(50) NOT NULL,
        
        -- Dados da mudança
        campo VARCHAR(100),
        valor_anterior TEXT,
        valor_novo TEXT,
        
        -- Descrição
        descricao TEXT,
        
        created_at TIMESTAMP DEFAULT NOW(),
        
        CONSTRAINT fk_atendimento_historico_ticket 
          FOREIGN KEY (ticket_id) REFERENCES atendimento_tickets(id) ON DELETE CASCADE,
        CONSTRAINT fk_atendimento_historico_usuario 
          FOREIGN KEY (usuario_id) REFERENCES users(id) ON DELETE SET NULL
      )
    `);

    await queryRunner.query(`
      CREATE INDEX idx_atendimento_historico_ticket ON atendimento_historico(ticket_id)
    `);

    await queryRunner.query(`
      CREATE INDEX idx_atendimento_historico_tipo ON atendimento_historico(tipo)
    `);

    // 10. Tabela de Configurações de Integração
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS atendimento_integracoes_config (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        empresa_id UUID NOT NULL,
        
        -- WhatsApp Business API (Principal)
        whatsapp_api_token VARCHAR(255),
        whatsapp_phone_number_id VARCHAR(100),
        whatsapp_business_account_id VARCHAR(100),
        whatsapp_webhook_verify_token VARCHAR(255),
        whatsapp_ativo BOOLEAN DEFAULT FALSE,
        
        -- Twilio (Opcional)
        twilio_account_sid VARCHAR(255),
        twilio_auth_token VARCHAR(255),
        twilio_whatsapp_number VARCHAR(50),
        twilio_sms_number VARCHAR(50),
        twilio_ativo BOOLEAN DEFAULT FALSE,
        
        -- Email
        email_provider VARCHAR(50), -- 'sendgrid', 'ses', 'smtp'
        email_api_key VARCHAR(255),
        email_from_address VARCHAR(255),
        email_ativo BOOLEAN DEFAULT FALSE,
        
        -- Telegram
        telegram_bot_token VARCHAR(255),
        telegram_webhook_url VARCHAR(255),
        telegram_ativo BOOLEAN DEFAULT FALSE,
        
        -- Facebook/Instagram
        facebook_page_id VARCHAR(100),
        facebook_page_access_token TEXT,
        instagram_account_id VARCHAR(100),
        meta_ativo BOOLEAN DEFAULT FALSE,
        
        -- IA/ML
        openai_api_key VARCHAR(255),
        openai_model VARCHAR(50) DEFAULT 'gpt-4',
        anthropic_api_key VARCHAR(255),
        anthropic_model VARCHAR(50) DEFAULT 'claude-3-sonnet',
        ia_provider VARCHAR(50) DEFAULT 'openai', -- 'openai', 'anthropic', 'both'
        ia_respostas_automaticas BOOLEAN DEFAULT FALSE,
        ia_analise_sentimento BOOLEAN DEFAULT FALSE,
        ia_classificacao_automatica BOOLEAN DEFAULT FALSE,
        ia_sugestoes_atendente BOOLEAN DEFAULT TRUE,
        
        -- Configurações gerais
        auto_criar_clientes BOOLEAN DEFAULT TRUE,
        auto_criar_leads BOOLEAN DEFAULT TRUE,
        notificacoes_ativas BOOLEAN DEFAULT TRUE,
        
        -- Metadados
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        
        CONSTRAINT fk_atendimento_integracoes_empresa 
          FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE,
        UNIQUE(empresa_id)
      )
    `);

    // 11. Tabela de Insights e Análises de IA
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS atendimento_ai_insights (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        ticket_id UUID NOT NULL,
        empresa_id UUID NOT NULL,
        
        -- Tipo de insight
        tipo VARCHAR(50) NOT NULL, -- 'sentimento', 'intencao', 'churn_prediction', 'classificacao'
        
        -- Dados do insight
        resultado JSONB NOT NULL,
        confianca DECIMAL(3,2),
        
        -- Análise
        sugestoes TEXT[],
        alertas TEXT[],
        
        -- Modelo usado
        modelo VARCHAR(100),
        versao_modelo VARCHAR(50),
        
        -- Metadados
        processado_em TIMESTAMP DEFAULT NOW(),
        tempo_processamento_ms INTEGER,
        
        created_at TIMESTAMP DEFAULT NOW(),
        
        CONSTRAINT fk_ai_insights_ticket 
          FOREIGN KEY (ticket_id) REFERENCES atendimento_tickets(id) ON DELETE CASCADE,
        CONSTRAINT fk_ai_insights_empresa 
          FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX idx_ai_insights_ticket ON atendimento_ai_insights(ticket_id)
    `);

    await queryRunner.query(`
      CREATE INDEX idx_ai_insights_empresa ON atendimento_ai_insights(empresa_id)
    `);

    await queryRunner.query(`
      CREATE INDEX idx_ai_insights_tipo ON atendimento_ai_insights(tipo)
    `);

    // 12. Tabela de Base de Conhecimento para RAG
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS atendimento_base_conhecimento (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        empresa_id UUID NOT NULL,
        
        -- Conteúdo
        titulo VARCHAR(255) NOT NULL,
        conteudo TEXT NOT NULL,
        resumo TEXT,
        
        -- Categorização
        categoria VARCHAR(100),
        tags TEXT[],
        palavras_chave TEXT[],
        
        -- Uso
        total_visualizacoes INTEGER DEFAULT 0,
        total_util INTEGER DEFAULT 0,
        total_nao_util INTEGER DEFAULT 0,
        
        -- Status
        publicado BOOLEAN DEFAULT TRUE,
        
        -- Metadados
        criado_por UUID,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        
        CONSTRAINT fk_base_conhecimento_empresa 
          FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE,
        CONSTRAINT fk_base_conhecimento_criador 
          FOREIGN KEY (criado_por) REFERENCES users(id) ON DELETE SET NULL
      )
    `);

    await queryRunner.query(`
      CREATE INDEX idx_base_conhecimento_empresa ON atendimento_base_conhecimento(empresa_id)
    `);

    await queryRunner.query(`
      CREATE INDEX idx_base_conhecimento_categoria ON atendimento_base_conhecimento(categoria)
    `);

    await queryRunner.query(`
      CREATE INDEX idx_base_conhecimento_publicado ON atendimento_base_conhecimento(publicado)
    `);

    // 13. Tabela de Respostas Automáticas da IA
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS atendimento_ai_respostas (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        ticket_id UUID NOT NULL,
        mensagem_id UUID,
        
        -- Prompt e resposta
        prompt TEXT NOT NULL,
        resposta_gerada TEXT NOT NULL,
        resposta_enviada TEXT,
        
        -- Modelo
        modelo VARCHAR(100),
        tokens_usados INTEGER,
        custo_estimado DECIMAL(10,6),
        
        -- Feedback
        aprovada BOOLEAN,
        editada BOOLEAN DEFAULT FALSE,
        util BOOLEAN,
        feedback_atendente TEXT,
        
        -- Contexto usado
        contexto_usado JSONB,
        base_conhecimento_ids UUID[],
        
        -- Metadados
        gerada_em TIMESTAMP DEFAULT NOW(),
        tempo_geracao_ms INTEGER,
        
        created_at TIMESTAMP DEFAULT NOW(),
        
        CONSTRAINT fk_ai_respostas_ticket 
          FOREIGN KEY (ticket_id) REFERENCES atendimento_tickets(id) ON DELETE CASCADE,
        CONSTRAINT fk_ai_respostas_mensagem 
          FOREIGN KEY (mensagem_id) REFERENCES atendimento_mensagens(id) ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX idx_ai_respostas_ticket ON atendimento_ai_respostas(ticket_id)
    `);

    await queryRunner.query(`
      CREATE INDEX idx_ai_respostas_mensagem ON atendimento_ai_respostas(mensagem_id)
    `);

    await queryRunner.query(`
      CREATE INDEX idx_ai_respostas_aprovada ON atendimento_ai_respostas(aprovada)
    `);

    // 14. Tabela de Métricas de Performance de IA
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS atendimento_ai_metricas (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        empresa_id UUID NOT NULL,
        
        -- Período
        data DATE NOT NULL,
        
        -- Respostas automáticas
        total_respostas_geradas INTEGER DEFAULT 0,
        total_respostas_enviadas INTEGER DEFAULT 0,
        total_respostas_editadas INTEGER DEFAULT 0,
        taxa_aprovacao DECIMAL(5,2),
        
        -- Classificação
        total_classificacoes INTEGER DEFAULT 0,
        acuracia_classificacao DECIMAL(5,2),
        
        -- Sentimento
        total_analises_sentimento INTEGER DEFAULT 0,
        sentimento_positivo INTEGER DEFAULT 0,
        sentimento_neutro INTEGER DEFAULT 0,
        sentimento_negativo INTEGER DEFAULT 0,
        sentimento_urgente INTEGER DEFAULT 0,
        
        -- Custos
        tokens_totais INTEGER DEFAULT 0,
        custo_total DECIMAL(10,2) DEFAULT 0,
        
        -- Performance
        tempo_medio_resposta_ms INTEGER,
        
        -- Metadados
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        
        CONSTRAINT fk_ai_metricas_empresa 
          FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE,
        UNIQUE(empresa_id, data)
      )
    `);

    await queryRunner.query(`
      CREATE INDEX idx_ai_metricas_empresa_data ON atendimento_ai_metricas(empresa_id, data)
    `);

    // Criar função para auto-incrementar número do ticket por empresa
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION atendimento_tickets_numero_seq()
      RETURNS TRIGGER AS $$
      BEGIN
        IF NEW.numero IS NULL THEN
          SELECT COALESCE(MAX(numero), 0) + 1
          INTO NEW.numero
          FROM atendimento_tickets
          WHERE empresa_id = NEW.empresa_id;
        END IF;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    await queryRunner.query(`
      CREATE TRIGGER atendimento_tickets_numero_trigger
      BEFORE INSERT ON atendimento_tickets
      FOR EACH ROW
      EXECUTE FUNCTION atendimento_tickets_numero_seq();
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remover trigger e função
    await queryRunner.query(
      `DROP TRIGGER IF EXISTS atendimento_tickets_numero_trigger ON atendimento_tickets`,
    );
    await queryRunner.query(`DROP FUNCTION IF EXISTS atendimento_tickets_numero_seq()`);

    // Remover tabelas na ordem reversa (dependências primeiro)
    await queryRunner.query(`DROP TABLE IF EXISTS atendimento_ai_metricas CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS atendimento_ai_respostas CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS atendimento_base_conhecimento CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS atendimento_ai_insights CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS atendimento_integracoes_config CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS atendimento_historico CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS atendimento_tags CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS atendimento_templates CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS atendimento_mensagens CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS atendimento_tickets CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS atendimento_atendentes_filas CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS atendimento_atendentes CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS atendimento_filas CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS atendimento_canais CASCADE`);
  }
}
