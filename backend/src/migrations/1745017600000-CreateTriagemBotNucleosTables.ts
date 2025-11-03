import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTriagemBotNucleosTables1745017600000 implements MigrationInterface {
  name = 'CreateTriagemBotNucleosTables1745017600000';

  public async up(queryRunner: QueryRunner): Promise<void> {

    // ===================================================================
    // 1. TABELA: nucleos_atendimento
    // ===================================================================
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS nucleos_atendimento (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        empresa_id UUID NOT NULL,
        
        -- Identificação
        nome VARCHAR(100) NOT NULL,
        descricao TEXT,
        codigo VARCHAR(50), -- código único para referência (ex: SUP_TEC, FIN, COM)
        cor VARCHAR(7) DEFAULT '#3B82F6', -- cor hex para UI
        icone VARCHAR(50) DEFAULT 'headset', -- nome do ícone lucide-react
        
        -- Status e Configurações
        ativo BOOLEAN DEFAULT TRUE,
        prioridade INTEGER DEFAULT 0, -- ordem de exibição
        
        -- Horário de Funcionamento
        horario_funcionamento JSONB DEFAULT '{}',
        -- Exemplo: {"seg": {"inicio": "08:00", "fim": "18:00"}, "ter": {...}}
        timezone VARCHAR(50) DEFAULT 'America/Sao_Paulo',
        
        -- SLA e Métricas
        sla_resposta_minutos INTEGER DEFAULT 60,
        sla_resolucao_horas INTEGER DEFAULT 24,
        tempo_medio_atendimento_minutos INTEGER DEFAULT 0,
        
        -- Equipe
        atendentes_ids UUID[] DEFAULT '{}', -- array de IDs de usuários
        supervisor_id UUID,
        capacidade_maxima_tickets INTEGER DEFAULT 50, -- limite por atendente
        
        -- Roteamento
        tipo_distribuicao VARCHAR(30) DEFAULT 'round_robin', 
        -- Tipos: round_robin, load_balancing, skill_based, manual
        
        -- Mensagens Automáticas
        mensagem_boas_vindas TEXT,
        mensagem_fora_horario TEXT,
        mensagem_transferencia TEXT,
        mensagem_aguarde TEXT,
        
        -- Estatísticas (cache)
        total_tickets_abertos INTEGER DEFAULT 0,
        total_tickets_resolvidos INTEGER DEFAULT 0,
        taxa_satisfacao DECIMAL(5,2) DEFAULT 0.00,
        
        -- Auditoria
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        created_by UUID,
        
        CONSTRAINT fk_nucleo_empresa 
          FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE,
        
        CONSTRAINT fk_nucleo_supervisor 
          FOREIGN KEY (supervisor_id) REFERENCES users(id) ON DELETE SET NULL,
          
        CONSTRAINT unique_nucleo_codigo_empresa 
          UNIQUE(empresa_id, codigo)
      )
    `);

    await queryRunner.query(`
      CREATE INDEX idx_nucleo_empresa ON nucleos_atendimento(empresa_id)
    `);

    await queryRunner.query(`
      CREATE INDEX idx_nucleo_ativo ON nucleos_atendimento(ativo)
    `);

    await queryRunner.query(`
      CREATE INDEX idx_nucleo_codigo ON nucleos_atendimento(codigo)
    `);

    // ===================================================================
    // 2. TABELA: fluxos_triagem
    // ===================================================================
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS fluxos_triagem (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        empresa_id UUID NOT NULL,
        
        -- Identificação
        nome VARCHAR(100) NOT NULL,
        descricao TEXT,
        codigo VARCHAR(50), -- código único para referência
        tipo VARCHAR(50) DEFAULT 'menu_opcoes', 
        -- Tipos: menu_opcoes, arvore_decisao, keyword_match, condicional
        
        -- Status
        ativo BOOLEAN DEFAULT TRUE,
        versao INTEGER DEFAULT 1,
        publicado BOOLEAN DEFAULT FALSE,
        
        -- Triggers/Condições de Ativação
        canais VARCHAR[] DEFAULT ARRAY['whatsapp'], -- whatsapp, telegram, email, chat
        palavras_gatilho VARCHAR[] DEFAULT '{}', -- palavras que ativam o fluxo
        horario_ativo JSONB, -- quando o fluxo está ativo
        prioridade INTEGER DEFAULT 0, -- ordem de avaliação
        
        -- Estrutura do Fluxo (JSON Tree)
        estrutura JSONB NOT NULL,
        /*
        Exemplo estrutura:
        {
          "etapaInicial": "boas_vindas",
          "versao": "1.0",
          "etapas": {
            "boas_vindas": {
              "id": "boas_vindas",
              "tipo": "mensagem_menu",
              "mensagem": "Olá {nome}! Como posso ajudar?\n\n",
              "opcoes": [
                { 
                  "numero": 1, 
                  "texto": "🛠️ Suporte Técnico", 
                  "proximaEtapa": "menu_suporte",
                  "icone": "wrench"
                },
                { 
                  "numero": 2, 
                  "texto": "💰 Financeiro", 
                  "proximaEtapa": "menu_financeiro",
                  "icone": "dollar-sign"
                }
              ],
              "timeout": 300,
              "acaoTimeout": "transferir_humano",
              "mensagemTimeout": "Vejo que você não respondeu. Vou te transferir para um atendente."
            },
            "menu_suporte": {
              "id": "menu_suporte",
              "tipo": "mensagem_menu",
              "mensagem": "🛠️ Suporte Técnico\n\nQual o problema?",
              "opcoes": [
                { 
                  "numero": 1, 
                  "texto": "Sistema fora do ar", 
                  "acao": "criar_ticket",
                  "nucleoId": "uuid-suporte-tecnico",
                  "prioridade": "alta",
                  "tags": ["sistema_fora", "urgente"]
                }
              ]
            }
          },
          "variaveis": {
            "nome": { "tipo": "texto", "obrigatorio": false },
            "telefone": { "tipo": "telefone", "obrigatorio": true }
          }
        }
        */
        
        -- Configurações de Comportamento
        permite_voltar BOOLEAN DEFAULT TRUE,
        permite_sair BOOLEAN DEFAULT TRUE,
        salvar_historico BOOLEAN DEFAULT TRUE,
        tentar_entender_texto_livre BOOLEAN DEFAULT FALSE,
        
        -- Estatísticas
        total_execucoes INTEGER DEFAULT 0,
        total_conclusoes INTEGER DEFAULT 0,
        total_abandonos INTEGER DEFAULT 0,
        taxa_conclusao DECIMAL(5,2) DEFAULT 0.00,
        tempo_medio_conclusao_segundos INTEGER DEFAULT 0,
        
        -- Auditoria
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        created_by UUID,
        published_at TIMESTAMP,
        
        CONSTRAINT fk_fluxo_empresa 
          FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE,
          
        CONSTRAINT unique_fluxo_codigo_empresa 
          UNIQUE(empresa_id, codigo, versao)
      )
    `);

    await queryRunner.query(`
      CREATE INDEX idx_fluxo_empresa ON fluxos_triagem(empresa_id)
    `);

    await queryRunner.query(`
      CREATE INDEX idx_fluxo_ativo ON fluxos_triagem(ativo)
    `);

    await queryRunner.query(`
      CREATE INDEX idx_fluxo_publicado ON fluxos_triagem(publicado)
    `);

    await queryRunner.query(`
      CREATE INDEX idx_fluxo_canais ON fluxos_triagem USING GIN(canais)
    `);

    // ===================================================================
    // 3. TABELA: sessoes_triagem
    // ===================================================================
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS sessoes_triagem (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        empresa_id UUID NOT NULL,
        fluxo_id UUID NOT NULL,
        
        -- Identificação do Usuário
        contato_telefone VARCHAR(20) NOT NULL,
        contato_nome VARCHAR(100),
        contato_email VARCHAR(100),
        canal VARCHAR(50) DEFAULT 'whatsapp', -- whatsapp, telegram, chat, etc
        
        -- Relacionamentos
        ticket_id UUID, -- ticket criado ao final da triagem
        atendente_id UUID, -- atendente que assumiu (se transferido)
        nucleo_destino_id UUID,
        
        -- Estado da Sessão
        etapa_atual VARCHAR(100),
        etapa_anterior VARCHAR(100),
        contexto JSONB DEFAULT '{}', 
        -- Variáveis coletadas: {"nome": "João", "cpf": "123.456.789-00", "problema": "..."}
        
        historico JSONB DEFAULT '[]',
        -- Array de steps: [
        --   {"etapa": "boas_vindas", "resposta": "1", "timestamp": "...", "tempo_resposta_segundos": 5},
        --   {"etapa": "menu_suporte", "resposta": "2", "timestamp": "..."}
        -- ]
        
        -- Status
        status VARCHAR(50) DEFAULT 'em_andamento',
        -- em_andamento, concluido, abandonado, transferido, erro, expirado
        
        -- Métricas
        iniciado_em TIMESTAMP DEFAULT NOW(),
        concluido_em TIMESTAMP,
        tempo_total_segundos INTEGER,
        total_mensagens_enviadas INTEGER DEFAULT 0,
        total_mensagens_recebidas INTEGER DEFAULT 0,
        
        -- Resultado
        resultado VARCHAR(50), -- ticket_criado, transferido_humano, abandonado, etc
        satisfacao_nota INTEGER, -- 1-5 se perguntado ao final
        satisfacao_comentario TEXT,
        
        -- Metadata
        ip_address VARCHAR(45),
        user_agent TEXT,
        dispositivo VARCHAR(50),
        navegador VARCHAR(50),
        
        -- Auditoria
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        
        CONSTRAINT fk_sessao_empresa 
          FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE,
          
        CONSTRAINT fk_sessao_fluxo 
          FOREIGN KEY (fluxo_id) REFERENCES fluxos_triagem(id) ON DELETE CASCADE,
          
        CONSTRAINT fk_sessao_ticket 
          FOREIGN KEY (ticket_id) REFERENCES atendimento_tickets(id) ON DELETE SET NULL,
          
        CONSTRAINT fk_sessao_nucleo 
          FOREIGN KEY (nucleo_destino_id) REFERENCES nucleos_atendimento(id) ON DELETE SET NULL
      )
    `);

    await queryRunner.query(`
      CREATE INDEX idx_sessao_contato ON sessoes_triagem(contato_telefone)
    `);

    await queryRunner.query(`
      CREATE INDEX idx_sessao_status ON sessoes_triagem(status)
    `);

    await queryRunner.query(`
      CREATE INDEX idx_sessao_fluxo ON sessoes_triagem(fluxo_id)
    `);

    await queryRunner.query(`
      CREATE INDEX idx_sessao_ticket ON sessoes_triagem(ticket_id)
    `);

    await queryRunner.query(`
      CREATE INDEX idx_sessao_iniciado ON sessoes_triagem(iniciado_em)
    `);

    // ===================================================================
    // 4. TABELA: templates_mensagem_triagem
    // ===================================================================
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS templates_mensagem_triagem (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        empresa_id UUID NOT NULL,
        
        -- Identificação
        codigo VARCHAR(50) NOT NULL, -- ex: BOAS_VINDAS_GERAL, MENU_PRINCIPAL
        nome VARCHAR(100) NOT NULL,
        categoria VARCHAR(50), -- boas_vindas, menu, confirmacao, erro, despedida, timeout
        
        -- Conteúdo
        mensagem TEXT NOT NULL,
        variaveis VARCHAR[] DEFAULT '{}', 
        -- Variáveis disponíveis: ['{nome}', '{empresa}', '{horario}', '{data}']
        
        -- Mídia (opcional)
        tipo_midia VARCHAR(20), -- imagem, video, documento, audio
        url_midia TEXT,
        legenda_midia TEXT,
        
        -- Formatação
        usar_markdown BOOLEAN DEFAULT FALSE,
        usar_emojis BOOLEAN DEFAULT TRUE,
        
        -- Opções de Menu (se aplicável)
        tem_opcoes BOOLEAN DEFAULT FALSE,
        opcoes JSONB, -- [{"numero": 1, "texto": "Opção 1"}, ...]
        
        -- Status
        ativo BOOLEAN DEFAULT TRUE,
        versao INTEGER DEFAULT 1,
        
        -- Tags para busca
        tags VARCHAR[] DEFAULT '{}',
        
        -- Auditoria
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        created_by UUID,
        
        CONSTRAINT fk_template_empresa 
          FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE,
          
        CONSTRAINT unique_template_codigo_empresa 
          UNIQUE(empresa_id, codigo)
      )
    `);

    await queryRunner.query(`
      CREATE INDEX idx_template_empresa ON templates_mensagem_triagem(empresa_id)
    `);

    await queryRunner.query(`
      CREATE INDEX idx_template_categoria ON templates_mensagem_triagem(categoria)
    `);

    await queryRunner.query(`
      CREATE INDEX idx_template_ativo ON templates_mensagem_triagem(ativo)
    `);

    // ===================================================================
    // 5. TABELA: metricas_nucleo (para estatísticas agregadas)
    // ===================================================================
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS metricas_nucleo (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        nucleo_id UUID NOT NULL,
        
        -- Período
        data DATE NOT NULL,
        hora INTEGER, -- 0-23 para métricas horárias, NULL para diárias
        
        -- Métricas de Tickets
        tickets_criados INTEGER DEFAULT 0,
        tickets_resolvidos INTEGER DEFAULT 0,
        tickets_pendentes INTEGER DEFAULT 0,
        tickets_reabertos INTEGER DEFAULT 0,
        
        -- Métricas de Tempo
        tempo_medio_primeira_resposta_minutos INTEGER DEFAULT 0,
        tempo_medio_resolucao_horas INTEGER DEFAULT 0,
        tempo_medio_espera_minutos INTEGER DEFAULT 0,
        
        -- Métricas de SLA
        tickets_dentro_sla INTEGER DEFAULT 0,
        tickets_fora_sla INTEGER DEFAULT 0,
        percentual_sla DECIMAL(5,2) DEFAULT 0.00,
        
        -- Métricas de Satisfação
        avaliacoes_total INTEGER DEFAULT 0,
        avaliacoes_positivas INTEGER DEFAULT 0,
        avaliacoes_negativas INTEGER DEFAULT 0,
        nota_media DECIMAL(3,2) DEFAULT 0.00,
        
        -- Métricas de Atendentes
        atendentes_ativos INTEGER DEFAULT 0,
        carga_media_atendente INTEGER DEFAULT 0,
        
        created_at TIMESTAMP DEFAULT NOW(),
        
        CONSTRAINT fk_metricas_nucleo 
          FOREIGN KEY (nucleo_id) REFERENCES nucleos_atendimento(id) ON DELETE CASCADE,
          
        CONSTRAINT unique_metrica_nucleo_data_hora 
          UNIQUE(nucleo_id, data, hora)
      )
    `);

    await queryRunner.query(`
      CREATE INDEX idx_metricas_nucleo ON metricas_nucleo(nucleo_id)
    `);

    await queryRunner.query(`
      CREATE INDEX idx_metricas_data ON metricas_nucleo(data)
    `);

    // ===================================================================
    // 6. Inserir Núcleos Padrão (Exemplo)
    // ===================================================================
    await queryRunner.query(`
      INSERT INTO nucleos_atendimento 
        (empresa_id, nome, descricao, codigo, cor, icone, ativo, prioridade, sla_resposta_minutos, sla_resolucao_horas, mensagem_boas_vindas)
      SELECT 
        e.id,
        'Suporte Técnico',
        'Atendimento para problemas técnicos, bugs e dúvidas sobre o sistema',
        'SUP_TEC',
        '#3B82F6',
        'wrench',
        TRUE,
        1,
        30,
        4,
        '🛠️ Você foi direcionado para o Suporte Técnico. Um especialista irá te atender em breve!'
      FROM empresas e
      WHERE NOT EXISTS (
        SELECT 1 FROM nucleos_atendimento n 
        WHERE n.empresa_id = e.id AND n.codigo = 'SUP_TEC'
      )
    `);

    await queryRunner.query(`
      INSERT INTO nucleos_atendimento 
        (empresa_id, nome, descricao, codigo, cor, icone, ativo, prioridade, sla_resposta_minutos, sla_resolucao_horas, mensagem_boas_vindas)
      SELECT 
        e.id,
        'Financeiro',
        'Atendimento para questões de cobrança, pagamentos e negociação',
        'FINANCEIRO',
        '#10B981',
        'dollar-sign',
        TRUE,
        2,
        60,
        24,
        '💰 Você foi direcionado para o Financeiro. Nossa equipe irá te auxiliar em breve!'
      FROM empresas e
      WHERE NOT EXISTS (
        SELECT 1 FROM nucleos_atendimento n 
        WHERE n.empresa_id = e.id AND n.codigo = 'FINANCEIRO'
      )
    `);

    await queryRunner.query(`
      INSERT INTO nucleos_atendimento 
        (empresa_id, nome, descricao, codigo, cor, icone, ativo, prioridade, sla_resposta_minutos, sla_resolucao_horas, mensagem_boas_vindas)
      SELECT 
        e.id,
        'Comercial/Vendas',
        'Atendimento para dúvidas sobre produtos, upgrades e contratação',
        'COMERCIAL',
        '#8B5CF6',
        'briefcase',
        TRUE,
        3,
        15,
        2,
        '🎯 Você foi direcionado para a equipe Comercial. Vamos te ajudar a encontrar a melhor solução!'
      FROM empresas e
      WHERE NOT EXISTS (
        SELECT 1 FROM nucleos_atendimento n 
        WHERE n.empresa_id = e.id AND n.codigo = 'COMERCIAL'
      )
    `);

    console.log('✅ Tabelas de Triagem Bot e Núcleos criadas com sucesso!');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Rollback na ordem inversa (por causa das FKs)
    await queryRunner.query(`DROP TABLE IF EXISTS metricas_nucleo CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS templates_mensagem_triagem CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS sessoes_triagem CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS fluxos_triagem CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS nucleos_atendimento CASCADE`);

    console.log('✅ Tabelas de Triagem Bot e Núcleos removidas com sucesso!');
  }
}
