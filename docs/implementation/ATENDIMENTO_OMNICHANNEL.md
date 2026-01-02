# 🎯 Módulo de Atendimento Omnichannel - ConectCRM

**Data:** 10 de outubro de 2025  
**Status:** 📋 Planejamento  
**Prioridade:** 🔥 Alta

---

## 📊 **VISÃO GERAL**

Sistema completo de atendimento omnichannel integrado ao ConectCRM, com **núcleo próprio** de atendimento e **IA nativa** para respostas automáticas inteligentes, análise de sentimento e predição de churn.

---

## 🎭 **ESTRATÉGIA: Núcleo Próprio com IA (Escalável para SaaS)**

### **🚀 Por que construir um núcleo próprio de atendimento?**

Para um **SaaS de alta escalabilidade com recursos de IA**, construir seu próprio sistema é fundamental:

✅ **Vantagens Estratégicas:**
- 🤖 **IA Nativa Integrada**: GPT-4, Claude, Gemini para respostas automáticas inteligentes
- 🧠 **Machine Learning**: Análise de sentimento, classificação automática, predição de churn
- � **Analytics Proprietário**: Dados são seu diferencial competitivo
- 💰 **Monetização de IA**: Cobrar por features de IA (respostas automáticas, insights, etc)
- 🎯 **Controle Total**: Customizações ilimitadas, workflows complexos
- 📈 **Escalabilidade Real**: Microserviços, queues distribuídas, cache otimizado
- 🏢 **Multi-tenant Robusto**: Isolamento por empresa, limites configuráveis
- 🔧 **Flexibilidade**: Criar features únicas que concorrentes não têm

### **� Conectores para Canais (não dependências)**

Use **conectores** para integração com plataformas externas:

- 📱 **WhatsApp Business API** (oficial) - Conector principal
- 💬 **Twilio** - SMS, WhatsApp, Voice
- 📧 **SendGrid/AWS SES** - Email
- 🤖 **Telegram Bot API** - Telegram
- � **Meta Graph API** - Facebook/Instagram
- 🌐 **WebChat próprio** - Widget JavaScript customizável

**Cada conector é um adapter independente e substituível.**

### **⚠️ Por que NÃO usar Chatwoot como base?**

❌ **Limitações para SaaS escalável:**
- 🤖 IA limitada ou inexistente nativamente
- 💰 Dificulta monetização (features já incluídas)
- � Dependência de sistema externo (vendor lock-in)
- 🎨 Customização limitada
- 📊 Dados não são 100% seus
- 🏗️ Não é seu "core business"
- 🚀 Escalabilidade limitada pela arquitetura deles

**Chatwoot é ótimo para empresas que USAM atendimento, não para quem VENDE atendimento.**

---

## 🏗️ **ARQUITETURA DO SISTEMA (Escalável + IA)**

```
┌─────────────────────────────────────────────────────────────────────┐
│              Frontend - ConectCRM Web + Mobile                      │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │        Interface Unificada de Atendimento                  │    │
│  │  - Lista de conversas/tickets com IA insights             │    │
│  │  - Chat em tempo real com sugestões de IA                 │    │
│  │  - Análise de sentimento do cliente                       │    │
│  │  - Histórico e contexto do cliente (360°)                 │    │
│  │  - Ações rápidas IA-powered                               │    │
│  │  - Dashboard com métricas preditivas                      │    │
│  └────────────────────────────────────────────────────────────┘    │
└───────────────────────────┬─────────────────────────────────────────┘
                            │ REST API + WebSockets (Socket.io)
┌───────────────────────────▼─────────────────────────────────────────┐
│         Backend NestJS - Núcleo de Atendimento                      │
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │              🧠 AI/ML Service Layer                          │   │
│  │  ┌─────────────────────────────────────────────────────┐   │   │
│  │  │  - OpenAI/Claude API (respostas automáticas)        │   │   │
│  │  │  - Análise de sentimento (positivo/neutro/negativo) │   │   │
│  │  │  - Classificação automática de tickets               │   │   │
│  │  │  - Sugestões de resposta para atendentes            │   │   │
│  │  │  - Detecção de intenção do cliente                  │   │   │
│  │  │  - RAG (busca em histórico + contexto CRM)          │   │   │
│  │  │  - Predição de churn e urgência                     │   │   │
│  │  └─────────────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │     Core Atendimento Service (Orquestrador)                │   │
│  │  - Gestão de tickets e conversas                           │   │
│  │  - Roteamento inteligente (IA-based)                       │   │
│  │  - Filas e distribuição automática                         │   │
│  │  - SLA tracking e alertas                                  │   │
│  │  - WebSockets para real-time                               │   │
│  └───┬─────────────────────────────────────────────────────────┘   │
│      │                                                              │
│  ┌───▼──────────────────────────────────────────────────────────┐  │
│  │           Message Queue (BullMQ + Redis)                    │  │
│  │  - Processamento assíncrono de mensagens                    │  │
│  │  - Jobs de IA (análise, classificação)                      │  │
│  │  - Envio de notificações                                    │  │
│  │  - Sincronização entre canais                               │  │
│  └───┬──────────────────────────────────────────────────────────┘  │
│      │                                                              │
│  ┌───▼──────────────────────────────────────────────────────────┐  │
│  │           Channel Adapters (Conectores)                     │  │
│  │                                                              │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │  │
│  │  │WhatsApp  │  │ Telegram │  │  Email   │  │ WebChat  │   │  │
│  │  │Business  │  │   Bot    │  │SendGrid  │  │  Widget  │   │  │
│  │  │API       │  │   API    │  │  /SES    │  │  (Own)   │   │  │
│  │  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘   │  │
│  │       │             │             │             │          │  │
│  │  ┌────▼─────┐  ┌────▼─────┐  ┌───▼──────┐  ┌───▼──────┐  │  │
│  │  │  Twilio  │  │Facebook/ │  │  SMS     │  │  Voice   │  │  │
│  │  │(optional)│  │Instagram │  │  (Twilio)│  │(optional)│  │  │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘  │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │          PostgreSQL Database (ConectCRM)                    │  │
│  │  - tickets, mensagens, canais                                │  │
│  │  - atendentes, filas, tags, templates                        │  │
│  │  - ai_insights, sentiment_analysis                           │  │
│  │  - ml_predictions, chat_history                              │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │          Redis (Cache + PubSub + Sessions)                  │  │
│  │  - Cache de mensagens recentes                               │  │
│  │  - Session management                                        │  │
│  │  - Real-time events (Socket.io adapter)                     │  │
│  │  - Rate limiting                                             │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │          Elasticsearch/Typesense (opcional)                 │  │
│  │  - Busca full-text em mensagens                             │  │
│  │  - Analytics e agregações                                   │  │
│  │  - Índice para RAG (contexto semântico)                     │  │
│  └──────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────┘

External Services:
├─ OpenAI/Claude API (IA generativa)
├─ WhatsApp Business API (Meta)
├─ Twilio (SMS, WhatsApp, Voice)
├─ SendGrid/AWS SES (Email)
├─ Telegram Bot API
└─ Meta Graph API (Facebook/Instagram)
```

---

## 🤖 **COMPONENTE DE IA - Detalhamento**

### **AI Service - Funcionalidades**

```typescript
// AI Service principal
@Injectable()
export class AIService {
  // 1. Respostas Automáticas Inteligentes
  async gerarRespostaAutomatica(
    mensagemCliente: string,
    contextoCliente: ClienteContexto,
    historico: Mensagem[]
  ): Promise<string>

  // 2. Análise de Sentimento
  async analisarSentimento(
    mensagem: string
  ): Promise<{
    sentimento: 'positivo' | 'neutro' | 'negativo' | 'urgente',
    confianca: number,
    emocoes: string[]
  }>

  // 3. Classificação de Ticket
  async classificarTicket(
    mensagem: string
  ): Promise<{
    categoria: string,
    prioridade: 'baixa' | 'normal' | 'alta' | 'urgente',
    tags_sugeridas: string[]
  }>

  // 4. Detecção de Intenção
  async detectarIntencao(
    mensagem: string
  ): Promise<{
    intencao: 'duvida' | 'reclamacao' | 'elogio' | 'pedido' | 'cancelamento',
    confianca: number
  }>

  // 5. Sugestões para Atendente
  async sugerirRespostas(
    contexto: TicketContexto
  ): Promise<string[]>

  // 6. RAG - Busca em Base de Conhecimento
  async buscarContextoRelevante(
    pergunta: string,
    empresaId: string
  ): Promise<string[]>

  // 7. Resumo de Conversa
  async resumirConversa(
    mensagens: Mensagem[]
  ): Promise<string>

  // 8. Predição de Churn
  async predizerChurn(
    clienteId: string,
    historico: TicketHistorico
  ): Promise<{
    risco: 'baixo' | 'medio' | 'alto',
    probabilidade: number,
    fatores: string[]
  }>
}
```

---

## 📦 **ESTRUTURA DO BANCO DE DADOS**

### **1. Canais de Atendimento**

```sql
-- Canais disponíveis (WhatsApp, Email, Chat Web, etc)
CREATE TABLE atendimento_canais (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE,
    
    -- Identificação
    nome VARCHAR(100) NOT NULL, -- 'WhatsApp Suporte', 'Email Vendas'
    tipo VARCHAR(50) NOT NULL, -- 'whatsapp', 'email', 'telegram', 'webchat', 'facebook', 'instagram'
    
    -- Integração
    provedor VARCHAR(50) NOT NULL DEFAULT 'whatsapp', -- 'whatsapp', 'telegram', 'email', 'webchat', 'facebook', 'instagram', 'sms'
    config JSONB, -- Configurações específicas do canal (tokens, números, etc)
    
    -- Status
    ativo BOOLEAN DEFAULT TRUE,
    status VARCHAR(20) DEFAULT 'conectado', -- 'conectado', 'desconectado', 'erro', 'configurando'
    ultima_sincronizacao TIMESTAMP,
    
    -- Configurações
    horario_atendimento JSONB, -- { "seg-sex": "08:00-18:00", ... }
    mensagem_ausencia TEXT,
    auto_resposta_ativa BOOLEAN DEFAULT FALSE,
    
    -- Metadados
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_atendimento_canais_empresa ON atendimento_canais(empresa_id);
CREATE INDEX idx_atendimento_canais_tipo ON atendimento_canais(tipo);
```

### **2. Filas de Atendimento**

```sql
-- Organização de atendimento por departamentos/equipes
CREATE TABLE atendimento_filas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE,
    
    -- Identificação
    nome VARCHAR(100) NOT NULL, -- 'Suporte Técnico', 'Vendas', 'Financeiro'
    descricao TEXT,
    cor VARCHAR(7), -- Hex color para UI
    icone VARCHAR(50),
    
    -- Configurações
    prioridade INTEGER DEFAULT 0, -- Ordem de exibição
    sla_resposta_minutos INTEGER, -- Tempo máximo para primeira resposta
    sla_resolucao_horas INTEGER, -- Tempo máximo para resolução
    
    -- Distribuição automática
    distribuicao_automatica BOOLEAN DEFAULT FALSE,
    tipo_distribuicao VARCHAR(20) DEFAULT 'round_robin', -- 'round_robin', 'menos_ocupado', 'manual'
    max_tickets_por_atendente INTEGER DEFAULT 5,
    
    -- Status
    ativa BOOLEAN DEFAULT TRUE,
    
    -- Metadados
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_atendimento_filas_empresa ON atendimento_filas(empresa_id);
```

### **3. Atendentes**

```sql
-- Relacionamento usuários com atendimento
CREATE TABLE atendimento_atendentes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE,
    usuario_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    -- Status
    status VARCHAR(20) DEFAULT 'offline', -- 'online', 'offline', 'ausente', 'ocupado'
    disponivel BOOLEAN DEFAULT TRUE,
    max_atendimentos_simultaneos INTEGER DEFAULT 5,
    
    -- Estatísticas
    total_atendimentos INTEGER DEFAULT 0,
    total_mensagens_enviadas INTEGER DEFAULT 0,
    tempo_medio_resposta_segundos INTEGER,
    avaliacao_media DECIMAL(3,2), -- 0.00 a 5.00
    
    -- Último acesso
    ultimo_acesso TIMESTAMP,
    
    -- Metadados
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(empresa_id, usuario_id)
);

CREATE INDEX idx_atendimento_atendentes_empresa ON atendimento_atendentes(empresa_id);
CREATE INDEX idx_atendimento_atendentes_usuario ON atendimento_atendentes(usuario_id);
CREATE INDEX idx_atendimento_atendentes_status ON atendimento_atendentes(status);
```

### **4. Relacionamento Atendentes x Filas**

```sql
-- Atendentes podem estar em múltiplas filas
CREATE TABLE atendimento_atendentes_filas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    atendente_id UUID REFERENCES atendimento_atendentes(id) ON DELETE CASCADE,
    fila_id UUID REFERENCES atendimento_filas(id) ON DELETE CASCADE,
    
    -- Configurações
    prioridade INTEGER DEFAULT 0,
    notificacoes_ativas BOOLEAN DEFAULT TRUE,
    
    -- Metadados
    created_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(atendente_id, fila_id)
);

CREATE INDEX idx_atendentes_filas_atendente ON atendimento_atendentes_filas(atendente_id);
CREATE INDEX idx_atendentes_filas_fila ON atendimento_atendentes_filas(fila_id);
```

### **5. Tickets/Conversas**

```sql
-- Conversas/Tickets de atendimento
CREATE TABLE atendimento_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE,
    numero INTEGER NOT NULL, -- Número sequencial por empresa
    
    -- Identificação externa
    chatwoot_conversation_id INTEGER, -- ID da conversa no Chatwoot
    identificador_externo VARCHAR(255), -- ID no sistema externo (ex: número do WhatsApp)
    
    -- Canal e Fila
    canal_id UUID REFERENCES atendimento_canais(id),
    fila_id UUID REFERENCES atendimento_filas(id),
    
    -- Cliente
    cliente_id UUID REFERENCES clientes(id), -- Relacionamento com CRM
    contato_nome VARCHAR(255),
    contato_telefone VARCHAR(50),
    contato_email VARCHAR(255),
    contato_dados JSONB, -- Dados adicionais do contato
    
    -- Atendimento
    atendente_id UUID REFERENCES atendimento_atendentes(id),
    status VARCHAR(20) DEFAULT 'aberto', -- 'aberto', 'em_atendimento', 'pendente', 'resolvido', 'fechado'
    prioridade VARCHAR(20) DEFAULT 'normal', -- 'baixa', 'normal', 'alta', 'urgente'
    
    -- Assunto
    assunto VARCHAR(255),
    descricao TEXT,
    categoria VARCHAR(100), -- 'suporte', 'vendas', 'financeiro', 'cancelamento'
    
    -- SLA
    data_primeira_resposta TIMESTAMP,
    data_resolucao TIMESTAMP,
    sla_resposta_vencido BOOLEAN DEFAULT FALSE,
    sla_resolucao_vencido BOOLEAN DEFAULT FALSE,
    
    -- Avaliação
    avaliacao INTEGER, -- 1 a 5 estrelas
    comentario_avaliacao TEXT,
    data_avaliacao TIMESTAMP,
    
    -- Contexto CRM
    proposta_id UUID REFERENCES propostas(id),
    oportunidade_id UUID REFERENCES oportunidades(id),
    fatura_id UUID REFERENCES faturas(id),
    contrato_id UUID REFERENCES contratos(id),
    
    -- Timestamps
    data_abertura TIMESTAMP DEFAULT NOW(),
    data_fechamento TIMESTAMP,
    ultima_mensagem_em TIMESTAMP,
    
    -- Metadados
    metadata JSONB, -- Dados adicionais customizáveis
    tags TEXT[], -- Array de tags
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_atendimento_tickets_empresa ON atendimento_tickets(empresa_id);
CREATE INDEX idx_atendimento_tickets_numero ON atendimento_tickets(empresa_id, numero);
CREATE INDEX idx_atendimento_tickets_cliente ON atendimento_tickets(cliente_id);
CREATE INDEX idx_atendimento_tickets_atendente ON atendimento_tickets(atendente_id);
CREATE INDEX idx_atendimento_tickets_status ON atendimento_tickets(status);
CREATE INDEX idx_atendimento_tickets_fila ON atendimento_tickets(fila_id);
CREATE INDEX idx_atendimento_tickets_canal ON atendimento_tickets(canal_id);
```

### **6. Mensagens**

```sql
-- Mensagens dos tickets
CREATE TABLE atendimento_mensagens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID REFERENCES atendimento_tickets(id) ON DELETE CASCADE,
    
    -- Identificação externa
    chatwoot_message_id INTEGER, -- ID da mensagem no Chatwoot
    
    -- Origem
    tipo VARCHAR(20) NOT NULL, -- 'recebida', 'enviada', 'interna'
    remetente_tipo VARCHAR(20) NOT NULL, -- 'cliente', 'atendente', 'sistema', 'bot'
    atendente_id UUID REFERENCES atendimento_atendentes(id),
    
    -- Conteúdo
    conteudo TEXT NOT NULL,
    conteudo_formatado TEXT, -- HTML ou Markdown
    
    -- Anexos
    anexos JSONB, -- [{ "url": "", "tipo": "imagem", "nome": "" }]
    
    -- Status
    lida BOOLEAN DEFAULT FALSE,
    data_leitura TIMESTAMP,
    entregue BOOLEAN DEFAULT TRUE,
    erro_envio TEXT,
    
    -- Contexto
    privada BOOLEAN DEFAULT FALSE, -- Mensagem interna (não visível ao cliente)
    resposta_automatica BOOLEAN DEFAULT FALSE,
    template_usado VARCHAR(100),
    
    -- Metadados
    metadata JSONB,
    
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_atendimento_mensagens_ticket ON atendimento_mensagens(ticket_id);
CREATE INDEX idx_atendimento_mensagens_tipo ON atendimento_mensagens(tipo);
CREATE INDEX idx_atendimento_mensagens_atendente ON atendimento_mensagens(atendente_id);
CREATE INDEX idx_atendimento_mensagens_data ON atendimento_mensagens(created_at);
```

### **7. Templates de Mensagens (Respostas Prontas)**

```sql
-- Mensagens pré-definidas para respostas rápidas
CREATE TABLE atendimento_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE,
    
    -- Identificação
    nome VARCHAR(100) NOT NULL,
    atalho VARCHAR(50), -- Ex: '/saudacao', '/horario'
    categoria VARCHAR(100), -- 'saudacao', 'despedida', 'ausencia', 'aguardando'
    
    -- Conteúdo
    conteudo TEXT NOT NULL,
    variaveis TEXT[], -- ['{{nome_cliente}}', '{{numero_ticket}}']
    
    -- Anexos padrão
    anexos JSONB,
    
    -- Uso
    total_usos INTEGER DEFAULT 0,
    
    -- Status
    ativo BOOLEAN DEFAULT TRUE,
    
    -- Metadados
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_atendimento_templates_empresa ON atendimento_templates(empresa_id);
CREATE INDEX idx_atendimento_templates_atalho ON atendimento_templates(atalho);
```

### **8. Tags**

```sql
-- Tags para organização de tickets
CREATE TABLE atendimento_tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE,
    
    nome VARCHAR(50) NOT NULL,
    cor VARCHAR(7), -- Hex color
    descricao TEXT,
    
    -- Uso
    total_usos INTEGER DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(empresa_id, nome)
);

CREATE INDEX idx_atendimento_tags_empresa ON atendimento_tags(empresa_id);
```

### **9. Histórico de Mudanças**

```sql
-- Log de mudanças em tickets
CREATE TABLE atendimento_historico (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID REFERENCES atendimento_tickets(id) ON DELETE CASCADE,
    
    -- Usuário que fez a mudança
    usuario_id UUID REFERENCES users(id),
    
    -- Tipo de evento
    tipo VARCHAR(50) NOT NULL, -- 'criado', 'atribuido', 'status_alterado', 'transferido', 'comentario', 'avaliado'
    
    -- Dados da mudança
    campo VARCHAR(100),
    valor_anterior TEXT,
    valor_novo TEXT,
    
    -- Descrição
    descricao TEXT,
    
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_atendimento_historico_ticket ON atendimento_historico(ticket_id);
CREATE INDEX idx_atendimento_historico_tipo ON atendimento_historico(tipo);
```

### **10. Configurações de Integração**

```sql
-- Configurações específicas de integrações
CREATE TABLE atendimento_integracoes_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE,
    
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
    auto_criar_clientes BOOLEAN DEFAULT TRUE, -- Criar cliente automaticamente ao receber mensagem
    auto_criar_leads BOOLEAN DEFAULT TRUE, -- Criar lead automaticamente
    notificacoes_ativas BOOLEAN DEFAULT TRUE,
    
    -- Metadados
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(empresa_id)
);
```

### **11. Insights e Análises de IA**

```sql
-- Armazenar insights gerados pela IA
CREATE TABLE atendimento_ai_insights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID REFERENCES atendimento_tickets(id) ON DELETE CASCADE,
    empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE,
    
    -- Tipo de insight
    tipo VARCHAR(50) NOT NULL, -- 'sentimento', 'intencao', 'churn_prediction', 'classificacao'
    
    -- Dados do insight
    resultado JSONB NOT NULL, -- { "sentimento": "negativo", "confianca": 0.92, "emocoes": ["frustrado", "ansioso"] }
    confianca DECIMAL(3,2), -- 0.00 a 1.00
    
    -- Análise
    sugestoes TEXT[],
    alertas TEXT[],
    
    -- Modelo usado
    modelo VARCHAR(100), -- 'gpt-4', 'claude-3', etc
    versao_modelo VARCHAR(50),
    
    -- Metadados
    processado_em TIMESTAMP DEFAULT NOW(),
    tempo_processamento_ms INTEGER,
    
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_ai_insights_ticket ON atendimento_ai_insights(ticket_id);
CREATE INDEX idx_ai_insights_empresa ON atendimento_ai_insights(empresa_id);
CREATE INDEX idx_ai_insights_tipo ON atendimento_ai_insights(tipo);
```

### **12. Base de Conhecimento para RAG**

```sql
-- Artigos e documentos da base de conhecimento
CREATE TABLE atendimento_base_conhecimento (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE,
    
    -- Conteúdo
    titulo VARCHAR(255) NOT NULL,
    conteudo TEXT NOT NULL,
    resumo TEXT,
    
    -- Categorização
    categoria VARCHAR(100),
    tags TEXT[],
    palavras_chave TEXT[],
    
    -- Embeddings para busca semântica (opcional)
    -- embedding VECTOR(1536), -- OpenAI ada-002 embeddings
    
    -- Uso
    total_visualizacoes INTEGER DEFAULT 0,
    total_util INTEGER DEFAULT 0,
    total_nao_util INTEGER DEFAULT 0,
    
    -- Status
    publicado BOOLEAN DEFAULT TRUE,
    
    -- Metadados
    criado_por UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_base_conhecimento_empresa ON atendimento_base_conhecimento(empresa_id);
CREATE INDEX idx_base_conhecimento_categoria ON atendimento_base_conhecimento(categoria);
CREATE INDEX idx_base_conhecimento_publicado ON atendimento_base_conhecimento(publicado);

-- Se usar pgvector para busca semântica:
-- CREATE EXTENSION IF NOT EXISTS vector;
-- CREATE INDEX idx_base_conhecimento_embedding ON atendimento_base_conhecimento 
-- USING ivfflat (embedding vector_cosine_ops);
```

### **13. Respostas Automáticas da IA**

```sql
-- Log de respostas automáticas geradas pela IA
CREATE TABLE atendimento_ai_respostas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID REFERENCES atendimento_tickets(id) ON DELETE CASCADE,
    mensagem_id UUID REFERENCES atendimento_mensagens(id) ON DELETE CASCADE,
    
    -- Prompt e resposta
    prompt TEXT NOT NULL,
    resposta_gerada TEXT NOT NULL,
    resposta_enviada TEXT, -- Pode ser editada pelo atendente antes de enviar
    
    -- Modelo
    modelo VARCHAR(100),
    tokens_usados INTEGER,
    custo_estimado DECIMAL(10,6),
    
    -- Feedback
    aprovada BOOLEAN, -- Atendente aprovou sem editar?
    editada BOOLEAN DEFAULT FALSE,
    util BOOLEAN, -- Cliente achou útil?
    feedback_atendente TEXT,
    
    -- Contexto usado
    contexto_usado JSONB, -- Histórico, dados do cliente, base de conhecimento, etc
    base_conhecimento_ids UUID[], -- IDs dos artigos da base usados no RAG
    
    -- Metadados
    gerada_em TIMESTAMP DEFAULT NOW(),
    tempo_geracao_ms INTEGER,
    
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_ai_respostas_ticket ON atendimento_ai_respostas(ticket_id);
CREATE INDEX idx_ai_respostas_mensagem ON atendimento_ai_respostas(mensagem_id);
CREATE INDEX idx_ai_respostas_aprovada ON atendimento_ai_respostas(aprovada);
```

### **14. Métricas de Performance de IA**

```sql
-- Métricas agregadas de performance da IA por dia
CREATE TABLE atendimento_ai_metricas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE,
    
    -- Período
    data DATE NOT NULL,
    
    -- Respostas automáticas
    total_respostas_geradas INTEGER DEFAULT 0,
    total_respostas_enviadas INTEGER DEFAULT 0,
    total_respostas_editadas INTEGER DEFAULT 0,
    taxa_aprovacao DECIMAL(5,2), -- Porcentagem
    
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
    
    UNIQUE(empresa_id, data)
);

CREATE INDEX idx_ai_metricas_empresa_data ON atendimento_ai_metricas(empresa_id, data);
```

---

## 🔧 **ESTRUTURA DO MÓDULO BACKEND (Atualizada com IA)**

### **Estrutura de Pastas**

```
backend/src/modules/atendimento/
├── atendimento.module.ts
├── atendimento.controller.ts
│
├── entities/
│   ├── canal.entity.ts
│   ├── fila.entity.ts
│   ├── atendente.entity.ts
│   ├── ticket.entity.ts
│   ├── mensagem.entity.ts
│   ├── template.entity.ts
│   ├── tag.entity.ts
│   ├── historico.entity.ts
│   ├── ai-insight.entity.ts              # 🆕 IA
│   ├── base-conhecimento.entity.ts       # 🆕 RAG
│   ├── ai-resposta.entity.ts             # 🆕 IA
│   └── ai-metrica.entity.ts              # 🆕 IA
│
├── dto/
│   ├── create-ticket.dto.ts
│   ├── update-ticket.dto.ts
│   ├── send-message.dto.ts
│   ├── create-canal.dto.ts
│   ├── ai-generate-response.dto.ts       # 🆕 IA
│   ├── ai-analyze-sentiment.dto.ts       # 🆕 IA
│   └── filters.dto.ts
│
├── services/
│   ├── atendimento.service.ts            # Service principal
│   ├── ticket.service.ts                 # Gestão de tickets
│   ├── mensagem.service.ts               # Gestão de mensagens
│   ├── canal.service.ts                  # Gestão de canais
│   ├── fila.service.ts                   # Gestão de filas
│   ├── atendente.service.ts              # Gestão de atendentes
│   ├── template.service.ts               # Templates de mensagens
│   │
│   ├── orquestrador.service.ts           # 🎯 Orquestrador principal
│   │
│   ├── ai/                                # 🆕 Serviços de IA
│   │   ├── ai.service.ts                 # Service principal de IA
│   │   ├── ai-response.service.ts        # Geração de respostas
│   │   ├── ai-sentiment.service.ts       # Análise de sentimento
│   │   ├── ai-classification.service.ts  # Classificação de tickets
│   │   ├── ai-intent.service.ts          # Detecção de intenção
│   │   ├── ai-churn.service.ts           # Predição de churn
│   │   ├── rag.service.ts                # RAG (base de conhecimento)
│   │   └── ai-metrics.service.ts         # Métricas de IA
│   │
│   ├── adapters/                          # Conectores de canais
│   │   ├── whatsapp-business-api.service.ts  # WhatsApp Business API
│   │   ├── twilio-adapter.service.ts         # Twilio
│   │   ├── telegram-adapter.service.ts       # Telegram
│   │   ├── email-adapter.service.ts          # Email
│   │   ├── meta-adapter.service.ts           # Facebook/Instagram
│   │   ├── webchat-adapter.service.ts        # WebChat próprio
│   │   └── base-adapter.interface.ts         # Interface comum
│   │
│   └── webhooks/
│       ├── whatsapp-webhook.service.ts   # Webhooks WhatsApp Business
│       ├── telegram-webhook.service.ts   # Webhooks Telegram
│       └── meta-webhook.service.ts       # Webhooks Facebook/Instagram
│
├── guards/
│   └── atendente.guard.ts                # Verificar se usuário é atendente
│
├── queues/                                # 🆕 Processamento assíncrono
│   ├── message.processor.ts             # Processar mensagens
│   ├── ai.processor.ts                  # Processar análises de IA
│   └── notification.processor.ts        # Processar notificações
│
└── utils/
    ├── sla-calculator.util.ts            # Cálculo de SLA
    ├── notification.util.ts              # Notificações
    ├── message-formatter.util.ts         # Formatação de mensagens
    └── ai-prompt-builder.util.ts         # 🆕 Construtor de prompts IA
```

---

## 🤖 **SERVIÇOS DE IA - Implementação Detalhada**

### **1. AIService - Service Principal**

```typescript
// services/ai/ai.service.ts
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

export interface ClienteContexto {
  nome: string;
  email?: string;
  telefone?: string;
  empresa?: string;
  historico_compras?: any[];
  valor_total_gasto?: number;
  ultima_compra?: Date;
  tickets_anteriores?: number;
}

export interface SentimentoAnalise {
  sentimento: 'positivo' | 'neutro' | 'negativo' | 'urgente';
  confianca: number;
  emocoes: string[];
  urgencia: number; // 0-10
}

export interface ClassificacaoTicket {
  categoria: string;
  prioridade: 'baixa' | 'normal' | 'alta' | 'urgente';
  tags_sugeridas: string[];
  confianca: number;
}

export interface IntencaoDetectada {
  intencao: 'duvida' | 'reclamacao' | 'elogio' | 'pedido' | 'cancelamento' | 'suporte';
  confianca: number;
  sub_intencoes: string[];
}

@Injectable()
export class AIService {
  private openai: OpenAI;
  
  constructor(
    private configService: ConfigService,
  ) {
    this.openai = new OpenAI({
      apiKey: this.configService.get('OPENAI_API_KEY'),
    });
  }

  /**
   * 1. Gerar Resposta Automática Inteligente
   */
  async gerarRespostaAutomatica(
    mensagemCliente: string,
    contextoCliente: ClienteContexto,
    historicoConversa: any[],
    baseConhecimento?: string[]
  ): Promise<{
    resposta: string;
    confianca: number;
    tokens_usados: number;
    custo_estimado: number;
  }> {
    const prompt = this.construirPromptResposta(
      mensagemCliente,
      contextoCliente,
      historicoConversa,
      baseConhecimento
    );

    const completion = await this.openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: `Você é um assistente de atendimento ao cliente profissional e empático.
          Seu objetivo é ajudar o cliente de forma rápida, clara e eficiente.
          Mantenha um tom amigável mas profissional.
          Se não tiver certeza da resposta, seja honesto e sugira contato com um atendente humano.`
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    const resposta = completion.choices[0].message.content;
    const tokens_usados = completion.usage.total_tokens;
    const custo_estimado = this.calcularCusto(tokens_usados, 'gpt-4-turbo-preview');

    return {
      resposta,
      confianca: 0.85, // Pode ser calculado com base em heurísticas
      tokens_usados,
      custo_estimado
    };
  }

  /**
   * 2. Análise de Sentimento
   */
  async analisarSentimento(mensagem: string): Promise<SentimentoAnalise> {
    const completion = await this.openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: `Analise o sentimento da mensagem do cliente.
          Retorne um JSON com:
          - sentimento: 'positivo', 'neutro', 'negativo' ou 'urgente'
          - confianca: número de 0 a 1
          - emocoes: array de emoções detectadas
          - urgencia: número de 0 a 10 indicando o nível de urgência`
        },
        {
          role: 'user',
          content: mensagem
        }
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' }
    });

    const resultado = JSON.parse(completion.choices[0].message.content);
    return resultado as SentimentoAnalise;
  }

  /**
   * 3. Classificação Automática de Ticket
   */
  async classificarTicket(mensagem: string): Promise<ClassificacaoTicket> {
    const completion = await this.openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: `Classifique o ticket de atendimento.
          Categorias possíveis: suporte_tecnico, vendas, financeiro, cancelamento, duvida, reclamacao, elogio
          Prioridades: baixa, normal, alta, urgente
          
          Retorne JSON com:
          - categoria: string
          - prioridade: string
          - tags_sugeridas: array de strings
          - confianca: número de 0 a 1`
        },
        {
          role: 'user',
          content: mensagem
        }
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' }
    });

    const resultado = JSON.parse(completion.choices[0].message.content);
    return resultado as ClassificacaoTicket;
  }

  /**
   * 4. Detecção de Intenção
   */
  async detectarIntencao(mensagem: string): Promise<IntencaoDetectada> {
    const completion = await this.openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: `Detecte a intenção principal do cliente.
          Intenções: duvida, reclamacao, elogio, pedido, cancelamento, suporte
          
          Retorne JSON com:
          - intencao: string
          - confianca: número de 0 a 1
          - sub_intencoes: array de intenções secundárias`
        },
        {
          role: 'user',
          content: mensagem
        }
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' }
    });

    const resultado = JSON.parse(completion.choices[0].message.content);
    return resultado as IntencaoDetectada;
  }

  /**
   * 5. Sugestões de Resposta para Atendente
   */
  async sugerirRespostas(
    mensagemCliente: string,
    contexto: any
  ): Promise<string[]> {
    const completion = await this.openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: `Gere 3 sugestões de resposta diferentes para o atendente enviar.
          Retorne como array JSON de strings.
          Varie o tom: uma formal, uma casual, uma empática.`
        },
        {
          role: 'user',
          content: `Mensagem do cliente: ${mensagemCliente}\n\nContexto: ${JSON.stringify(contexto)}`
        }
      ],
      temperature: 0.8,
      response_format: { type: 'json_object' }
    });

    const resultado = JSON.parse(completion.choices[0].message.content);
    return resultado.sugestoes || [];
  }

  /**
   * 6. Resumo de Conversa
   */
  async resumirConversa(mensagens: any[]): Promise<string> {
    const conversaTexto = mensagens
      .map(m => `${m.remetente}: ${m.conteudo}`)
      .join('\n');

    const completion = await this.openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'Resuma a conversa de atendimento em 2-3 frases, destacando o problema e a solução.'
        },
        {
          role: 'user',
          content: conversaTexto
        }
      ],
      temperature: 0.5,
      max_tokens: 150,
    });

    return completion.choices[0].message.content;
  }

  /**
   * 7. Predição de Churn
   */
  async predizerChurn(
    clienteId: string,
    historico: any
  ): Promise<{
    risco: 'baixo' | 'medio' | 'alto';
    probabilidade: number;
    fatores: string[];
  }> {
    // Análise baseada em:
    // - Frequência de reclamações
    // - Tom das mensagens (sentimento)
    // - Tempo desde última compra
    // - Tickets não resolvidos
    // - etc
    
    const prompt = `Analise o risco de churn deste cliente:
    ${JSON.stringify(historico)}
    
    Retorne JSON com:
    - risco: 'baixo', 'medio' ou 'alto'
    - probabilidade: número de 0 a 1
    - fatores: array de strings explicando os principais indicadores`;

    const completion = await this.openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        { role: 'system', content: 'Você é um analista de customer success experiente.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' }
    });

    const resultado = JSON.parse(completion.choices[0].message.content);
    return resultado;
  }

  // Métodos auxiliares
  private construirPromptResposta(
    mensagem: string,
    contexto: ClienteContexto,
    historico: any[],
    baseConhecimento?: string[]
  ): string {
    let prompt = `Cliente: ${contexto.nome}\n`;
    
    if (contexto.empresa) {
      prompt += `Empresa: ${contexto.empresa}\n`;
    }
    
    if (historico.length > 0) {
      prompt += `\nHistórico recente:\n`;
      historico.slice(-5).forEach(msg => {
        prompt += `- ${msg.remetente}: ${msg.conteudo}\n`;
      });
    }
    
    if (baseConhecimento && baseConhecimento.length > 0) {
      prompt += `\nInformações relevantes da base de conhecimento:\n`;
      baseConhecimento.forEach(info => {
        prompt += `- ${info}\n`;
      });
    }
    
    prompt += `\nMensagem atual do cliente: ${mensagem}\n`;
    prompt += `\nGere uma resposta profissional e útil:`;
    
    return prompt;
  }

  private calcularCusto(tokens: number, modelo: string): number {
    // Preços aproximados (atualizar conforme necessário)
    const precos = {
      'gpt-4-turbo-preview': 0.00003, // $0.03 por 1K tokens
      'gpt-3.5-turbo': 0.000002,      // $0.002 por 1K tokens
    };
    
    return (tokens / 1000) * (precos[modelo] || 0.00001);
  }
}

└── utils/
    ├── sla-calculator.util.ts           # Cálculo de SLA
    ├── notification.util.ts             # Notificações
    └── message-formatter.util.ts        # Formatação de mensagens
```

---

## 🎯 **SERVIÇOS PRINCIPAIS**

### **1. OrquestradorService (Camada de Abstração de Canais)**

```typescript
// services/orquestrador.service.ts
import { Injectable } from '@nestjs/common';
import { WhatsAppBusinessAPIService } from './adapters/whatsapp-business-api.service';
import { TwilioAdapterService } from './adapters/twilio-adapter.service';
import { TelegramAdapterService } from './adapters/telegram-adapter.service';
import { EmailAdapterService } from './adapters/email-adapter.service';
import { Canal } from '../entities/canal.entity';

@Injectable()
export class AtendimentoOrquestradorService {
  constructor(
    private whatsappAPI: WhatsAppBusinessAPIService,
    private twilioAdapter: TwilioAdapterService,
    private telegramAdapter: TelegramAdapterService,
    private emailAdapter: EmailAdapterService,
  ) {}

  /**
   * Envia mensagem usando o canal apropriado
   */
  async enviarMensagem(
    canal: Canal,
    destinatario: string,
    mensagem: string,
    anexos?: any[]
  ): Promise<any> {
    switch (canal.provedor) {
      case 'whatsapp':
        return await this.whatsappAPI.enviarMensagem(
          canal.config,
          destinatario,
          mensagem,
          anexos
        );

      case 'telegram':
        return await this.telegramAdapter.enviarMensagem(
          canal.config,
          destinatario,
          mensagem,
          anexos
        );

      case 'email':
        return await this.emailAdapter.enviarEmail(
          canal.config,
          destinatario,
          mensagem,
          anexos
        );

      case 'sms':
        return await this.twilioAdapter.enviarSMS(
          canal.config,
          destinatario,
          mensagem
        );

      default:
        throw new Error(`Provedor ${canal.provedor} não suportado`);
    }
  }

  /**
   * Busca mensagens de uma conversa
   */
  async buscarMensagens(
    canal: Canal,
    conversationId: string
  ): Promise<any[]> {
    // Buscar no banco de dados local
    // As mensagens já estão sincronizadas via webhooks
    return [];
  }

  /**
   * Verifica status do canal
   */
  async verificarStatusCanal(canal: Canal): Promise<string> {
    try {
      switch (canal.provedor) {
        case 'whatsapp':
          return await this.whatsappAPI.verificarStatus(canal.config);
        
        case 'telegram':
          return await this.telegramAdapter.verificarStatus(canal.config);
        
        default:
          return 'ativo';
      }
    } catch (error) {
      return 'erro';
    }
  }
}
```

---

## 🔌 **CHANNEL ADAPTERS - Conectores de Canais**

### **1. WhatsApp Business API Service**

```typescript
// services/adapters/whatsapp-business-api.service.ts
import { Injectable } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';

interface WhatsAppConfig {
  api_token: string;
  phone_number_id: string;
  business_account_id: string;
}

@Injectable()
export class WhatsAppBusinessAPIService {
  /**
   * Envia mensagem via WhatsApp Business API (oficial)
   */
  async enviarMensagem(
    config: WhatsAppConfig,
    destinatario: string,
    mensagem: string,
    anexos?: any[]
  ): Promise<any> {
    const apiClient = axios.create({
      baseURL: 'https://graph.facebook.com/v18.0',
      headers: {
        'Authorization': `Bearer ${config.api_token}`,
        'Content-Type': 'application/json',
      },
    });

    const payload: any = {
      messaging_product: 'whatsapp',
      to: this.formatarNumero(destinatario),
      type: 'text',
      text: {
        body: mensagem,
      },
    };

    try {
      const response = await apiClient.post(
        `/${config.phone_number_id}/messages`,
        payload
      );

      return response.data;
    } catch (error) {
      console.error('Erro ao enviar mensagem WhatsApp:', error.response?.data);
      throw error;
    }
  }

  /**
   * Processa webhook do WhatsApp
   */
  async processarWebhook(payload: any): Promise<void> {
    // Processar mensagens recebidas
    const mensagens = payload.entry?.[0]?.changes?.[0]?.value?.messages || [];
    
    for (const msg of mensagens) {
      // Salvar mensagem no banco
      // Criar ou atualizar ticket
      // Notificar atendentes
      console.log('Mensagem recebida:', msg);
    }
  }

  /**
   * Verifica status da API
   */
  async verificarStatus(config: WhatsAppConfig): Promise<string> {
    try {
      const apiClient = axios.create({
        baseURL: 'https://graph.facebook.com/v18.0',
        headers: {
          'Authorization': `Bearer ${config.api_token}`,
        },
      });

      const response = await apiClient.get(`/${config.phone_number_id}`);
      return response.status === 200 ? 'conectado' : 'desconectado';
    } catch (error) {
      return 'erro';
    }
  }

  private formatarNumero(numero: string): string {
    // Remove caracteres não numéricos
    return numero.replace(/\D/g, '');
  }
}
```

### **2. Telegram Adapter Service**

```typescript
// services/adapters/telegram-adapter.service.ts
import { Injectable } from '@nestjs/common';
import axios from 'axios';

interface TelegramConfig {
  bot_token: string;
  webhook_url?: string;
}

@Injectable()
export class TelegramAdapterService {
  async enviarMensagem(
    config: TelegramConfig,
    chatId: string,
    mensagem: string,
    anexos?: any[]
  ): Promise<any> {
    const url = `https://api.telegram.org/bot${config.bot_token}/sendMessage`;

    try {
      const response = await axios.post(url, {
        chat_id: chatId,
        text: mensagem,
        parse_mode: 'Markdown',
      });

      return response.data;
    } catch (error) {
      console.error('Erro ao enviar mensagem Telegram:', error.response?.data);
      throw error;
    }
  }

  async processarWebhook(payload: any): Promise<void> {
    if (payload.message) {
      const msg = payload.message;
      console.log('Mensagem Telegram recebida:', msg);
      // Processar e salvar no banco
    }
  }

  async verificarStatus(config: TelegramConfig): Promise<string> {
    try {
      const url = `https://api.telegram.org/bot${config.bot_token}/getMe`;
      const response = await axios.get(url);
      return response.data.ok ? 'conectado' : 'desconectado';
    } catch (error) {
      return 'erro';
    }
  }
}
```

### **3. Email Adapter Service**

```typescript
// services/adapters/email-adapter.service.ts
import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

interface EmailConfig {
  provider: 'sendgrid' | 'ses' | 'smtp';
  api_key?: string;
  from_address: string;
  smtp_host?: string;
  smtp_port?: number;
  smtp_user?: string;
  smtp_pass?: string;
}

@Injectable()
export class EmailAdapterService {
  async enviarEmail(
    config: EmailConfig,
    destinatario: string,
    mensagem: string,
    anexos?: any[]
  ): Promise<any> {
    let transporter;

    if (config.provider === 'smtp') {
      transporter = nodemailer.createTransporter({
        host: config.smtp_host,
        port: config.smtp_port,
        secure: config.smtp_port === 465,
        auth: {
          user: config.smtp_user,
          pass: config.smtp_pass,
        },
      });
    }
    // Adicionar suporte para SendGrid, SES, etc

    const mailOptions = {
      from: config.from_address,
      to: destinatario,
      subject: 'Mensagem de Atendimento',
      text: mensagem,
      html: `<p>${mensagem.replace(/\n/g, '<br>')}</p>`,
      attachments: anexos || [],
    };

    try {
      const result = await transporter.sendMail(mailOptions);
      return result;
    } catch (error) {
      console.error('Erro ao enviar email:', error);
      throw error;
    }
  }
}
```

---

## 🚀 **ENDPOINTS DA API**

    // 2. Buscar ou criar conversa
    const conversa = await this.buscarOuCriarConversa(inboxId, contato.id);

    // 3. Enviar mensagem
    const response = await this.apiClient.post(
      `/conversations/${conversa.id}/messages`,
      {
        content: conteudo,
        message_type: 'outgoing',
        attachments: anexos || []
      }
    );

    return response.data;
  }

  async buscarOuCriarContato(dados: any): Promise<any> {
    // Implementação de busca/criação de contato
    try {
      const accountId = process.env.CHATWOOT_ACCOUNT_ID;
      
      // Buscar contato existente
      if (dados.phone_number) {
        const searchResponse = await this.apiClient.get(
          `/accounts/${accountId}/contacts/search`,
          { params: { q: dados.phone_number } }
        );
        
        if (searchResponse.data?.payload?.length > 0) {
          return searchResponse.data.payload[0];
        }
      }

      // Criar novo contato
      const createResponse = await this.apiClient.post(
        `/accounts/${accountId}/contacts`,
        dados
      );
      
      return createResponse.data.payload;
    } catch (error) {
      console.error('Erro ao buscar/criar contato:', error);
      throw error;
    }
  }

  async buscarOuCriarConversa(inboxId: number, contactId: number): Promise<any> {
    // Implementação de busca/criação de conversa
    try {
      const accountId = process.env.CHATWOOT_ACCOUNT_ID;
      
      // Buscar conversas abertas do contato
      const conversationsResponse = await this.apiClient.get(
        `/accounts/${accountId}/contacts/${contactId}/conversations`
      );
      
      // Verificar se há conversa aberta na inbox específica
      const conversaAberta = conversationsResponse.data?.payload?.find(
        (conv: any) => conv.inbox_id === inboxId && conv.status !== 'resolved'
      );
      
      if (conversaAberta) {
        return conversaAberta;
      }

      // Criar nova conversa
      const createResponse = await this.apiClient.post(
        `/accounts/${accountId}/conversations`,
        {
          inbox_id: inboxId,
          contact_id: contactId,
          status: 'open'
        }
      );
      
      return createResponse.data;
    } catch (error) {
      console.error('Erro ao buscar/criar conversa:', error);
      throw error;
    }
  }

  async buscarMensagens(conversationId: string): Promise<any[]> {
    const accountId = process.env.CHATWOOT_ACCOUNT_ID;
    const response = await this.apiClient.get(
      `/accounts/${accountId}/conversations/${conversationId}/messages`
    );
    return response.data.payload || [];
  }

  async sincronizarContatos(inboxId: number): Promise<void> {
    // Implementar sincronização de contatos
  }

  async verificarStatus(inboxId: number): Promise<string> {
    try {
      const accountId = process.env.CHATWOOT_ACCOUNT_ID;
      const response = await this.apiClient.get(
        `/accounts/${accountId}/inboxes/${inboxId}`
      );
      
      return response.status === 200 ? 'conectado' : 'desconectado';
    } catch (error) {
      return 'erro';
    }
  }
}
```

### **3. WhatsAppDirectService (Fallback)**

```typescript
// services/adapters/whatsapp-direct.service.ts
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Client, LocalAuth, Message } from 'whatsapp-web.js';

@Injectable()
export class WhatsAppDirectService implements OnModuleInit, OnModuleDestroy {
  private client: Client;
  private isReady = false;
  private qrCode: string;

  async onModuleInit() {
    await this.inicializar();
  }

  async onModuleDestroy() {
    if (this.client) {
      await this.client.destroy();
    }
  }

  private async inicializar() {
    this.client = new Client({
      authStrategy: new LocalAuth({
        clientId: 'conectcrm-whatsapp',
      }),
      puppeteer: {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      },
    });

    this.client.on('qr', (qr) => {
      console.log('📱 QR Code gerado para WhatsApp direto');
      this.qrCode = qr;
      // Você pode expor isso via endpoint para o frontend exibir
    });

    this.client.on('ready', () => {
      console.log('✅ WhatsApp direto conectado!');
      this.isReady = true;
    });

    this.client.on('message', async (message: Message) => {
      await this.processarMensagemRecebida(message);
    });

    this.client.on('disconnected', () => {
      console.log('❌ WhatsApp direto desconectado');
      this.isReady = false;
    });

    await this.client.initialize();
  }

  async enviarMensagem(
    destinatario: string,
    mensagem: string,
    anexos?: any[]
  ): Promise<any> {
    if (!this.isReady) {
      throw new Error('WhatsApp direto não está conectado');
    }

    try {
      // Formatar número para padrão WhatsApp
      const numero = this.formatarNumero(destinatario);
      const chatId = `${numero}@c.us`;

      // Enviar mensagem
      const result = await this.client.sendMessage(chatId, mensagem);

      // Enviar anexos se houver
      if (anexos && anexos.length > 0) {
        for (const anexo of anexos) {
          // Implementar envio de anexos
        }
      }

      return result;
    } catch (error) {
      console.error('Erro ao enviar mensagem WhatsApp direto:', error);
      throw error;
    }
  }

  private formatarNumero(numero: string): string {
    // Remove caracteres não numéricos
    return numero.replace(/\D/g, '');
  }

  async verificarStatus(): Promise<string> {
    return this.isReady ? 'conectado' : 'desconectado';
  }

  getQRCode(): string {
    return this.qrCode;
  }

  private async processarMensagemRecebida(message: Message) {
    console.log('📨 Mensagem recebida via WhatsApp direto:', message.body);
    
    // Aqui você deve:
    // 1. Criar ou atualizar ticket no banco de dados
    // 2. Salvar mensagem
    // 3. Notificar atendentes
    // 4. Disparar webhooks se necessário
    
    // Implementar lógica completa...
  }
}
```

---

## 🚀 **ENDPOINTS DA API**

### **Tickets**

```
GET    /api/atendimento/tickets                    # Listar tickets
GET    /api/atendimento/tickets/:id                # Detalhes do ticket
POST   /api/atendimento/tickets                    # Criar ticket
PATCH  /api/atendimento/tickets/:id                # Atualizar ticket
DELETE /api/atendimento/tickets/:id                # Deletar ticket

POST   /api/atendimento/tickets/:id/atribuir       # Atribuir a atendente
POST   /api/atendimento/tickets/:id/transferir     # Transferir para fila
POST   /api/atendimento/tickets/:id/resolver       # Marcar como resolvido
POST   /api/atendimento/tickets/:id/reabrir        # Reabrir ticket
POST   /api/atendimento/tickets/:id/avaliar        # Avaliar atendimento
```

### **Mensagens**

```
GET    /api/atendimento/tickets/:ticketId/mensagens       # Mensagens do ticket
POST   /api/atendimento/tickets/:ticketId/mensagens       # Enviar mensagem
POST   /api/atendimento/tickets/:ticketId/mensagens/lote  # Enviar múltiplas

PATCH  /api/atendimento/mensagens/:id/ler                 # Marcar como lida
```

### **Canais**

```
GET    /api/atendimento/canais                     # Listar canais
POST   /api/atendimento/canais                     # Criar canal
PATCH  /api/atendimento/canais/:id                 # Atualizar canal
DELETE /api/atendimento/canais/:id                 # Deletar canal

GET    /api/atendimento/canais/:id/status          # Verificar status do canal
POST   /api/atendimento/canais/:id/sincronizar     # Sincronizar canal
POST   /api/atendimento/canais/:id/reconectar      # Reconectar canal
```

### **Filas**

```
GET    /api/atendimento/filas                      # Listar filas
POST   /api/atendimento/filas                      # Criar fila
PATCH  /api/atendimento/filas/:id                  # Atualizar fila
DELETE /api/atendimento/filas/:id                  # Deletar fila

GET    /api/atendimento/filas/:id/tickets          # Tickets da fila
GET    /api/atendimento/filas/:id/atendentes       # Atendentes da fila
```

### **Atendentes**

```
GET    /api/atendimento/atendentes                 # Listar atendentes
POST   /api/atendimento/atendentes                 # Cadastrar atendente
PATCH  /api/atendimento/atendentes/:id             # Atualizar atendente

POST   /api/atendimento/atendentes/me/status       # Alterar meu status
GET    /api/atendimento/atendentes/me/tickets      # Meus tickets
GET    /api/atendimento/atendentes/me/estatisticas # Minhas estatísticas
```

### **Templates**

```
GET    /api/atendimento/templates                  # Listar templates
POST   /api/atendimento/templates                  # Criar template
PATCH  /api/atendimento/templates/:id              # Atualizar template
DELETE /api/atendimento/templates/:id              # Deletar template
```

### **Webhooks**

```
POST   /api/atendimento/webhooks/chatwoot          # Receber eventos do Chatwoot
POST   /api/atendimento/webhooks/whatsapp/:empresaId  # Receber eventos do WhatsApp (sempre enviar X-Hub-Signature-256)
```

### **Relatórios**

```
GET    /api/atendimento/relatorios/dashboard       # Dashboard de métricas
GET    /api/atendimento/relatorios/atendentes      # Performance de atendentes
GET    /api/atendimento/relatorios/sla             # Relatório de SLA
GET    /api/atendimento/relatorios/satisfacao      # Satisfação dos clientes
```

---

## 🎨 **INTERFACE FRONTEND**

### **Estrutura de Páginas**

```
frontend-web/src/pages/atendimento/
├── AtendimentoPage.tsx              # Página principal (inbox unificada)
├── TicketDetalhePage.tsx            # Visualização completa do ticket
├── ConfiguracoesPage.tsx            # Configurações do módulo
│
├── components/
│   ├── InboxList.tsx                # Lista de tickets/conversas
│   ├── ChatWindow.tsx               # Janela de chat
│   ├── MessageInput.tsx             # Input de mensagens
│   ├── TicketInfo.tsx               # Informações do ticket (sidebar)
│   ├── ClienteContexto.tsx          # Contexto CRM do cliente
│   ├── AcoesRapidas.tsx             # Ações rápidas (criar proposta, etc)
│   ├── TemplatesPicker.tsx          # Seletor de templates
│   ├── TransferirTicket.tsx         # Modal transferir ticket
│   ├── StatusSelector.tsx           # Seletor de status
│   └── AvaliacaoForm.tsx            # Formulário de avaliação
│
└── configuracoes/
    ├── CanaisConfig.tsx             # Configuração de canais
    ├── FilasConfig.tsx              # Configuração de filas
    ├── AtendentesConfig.tsx         # Gestão de atendentes
    └── TemplatesConfig.tsx          # Gestão de templates
```

### **Layout Principal**

```typescript
// AtendimentoPage.tsx
const AtendimentoPage = () => {
  return (
    <div className="flex h-screen">
      {/* Sidebar - Lista de conversas */}
      <div className="w-80 border-r">
        <InboxList />
      </div>

      {/* Área central - Chat */}
      <div className="flex-1 flex flex-col">
        <ChatWindow />
      </div>

      {/* Sidebar direita - Informações */}
      <div className="w-96 border-l">
        <TicketInfo />
        <ClienteContexto />
        <AcoesRapidas />
      </div>
    </div>
  );
};
```

---

## 📊 **MÉTRICAS E RELATÓRIOS**

### **Dashboard de Atendimento**

- ⏱️ Tempo médio de primeira resposta
- ✅ Taxa de resolução no primeiro contato
- 📈 Tickets abertos vs resolvidos
- ⭐ Satisfação média dos clientes
- 👥 Performance por atendente
- 🕐 SLA cumprido vs violado
- 📊 Volume por canal
- 🏷️ Tickets por categoria

---

## 🔄 **INTEGRAÇÕES COM CRM**

### **Contexto Automático**

Quando um ticket é criado, o sistema automaticamente:

1. **Identifica o cliente** pelo telefone/email
2. **Busca histórico** de interações
3. **Lista propostas** ativas
4. **Mostra faturas** pendentes
5. **Exibe contratos** vigentes
6. **Carrega oportunidades** em andamento

### **Ações Rápidas no Atendimento**

- 📄 Criar proposta direto do chat
- 💰 Gerar segunda via de fatura
- 📋 Criar novo contrato
- 🎯 Converter em oportunidade de venda
- 👤 Atualizar cadastro do cliente

---

## 🚀 **ROADMAP DE IMPLEMENTAÇÃO**

### **FASE 1: Fundação (Semana 1-2)**
- ✅ Criar estrutura de banco de dados
- ✅ Implementar entities e DTOs
- ✅ Criar serviços base (Ticket, Mensagem, Canal)
- ✅ Implementar ChatwootAdapterService
- ✅ Criar endpoints REST básicos

### **FASE 2: Integração Chatwoot (Semana 3)**
- ✅ Webhooks do Chatwoot
- ✅ Sincronização bidirecional
- ✅ Testes de integração
- ✅ Tratamento de erros e fallbacks

### **FASE 3: Interface Web (Semana 4)**
- ✅ Criar componentes base
- ✅ Implementar chat em tempo real (WebSockets)
- ✅ Lista de tickets
- ✅ Detalhes e informações do cliente

### **FASE 4: Recursos Avançados (Semana 5-6)**
- ✅ Templates de mensagens
- ✅ Filas e distribuição automática
- ✅ SLA e alertas
- ✅ Relatórios e dashboard

### **FASE 5: WhatsApp Direto (Opcional - Semana 7)**
- ✅ Implementar WhatsAppDirectService
- ✅ QR Code para autenticação
- ✅ Fallback automático
- ⚠️ Testes cuidadosos para evitar ban

### **FASE 6: Otimizações (Semana 8)**
- ✅ Performance e cache
- ✅ Notificações push
- ✅ Testes end-to-end
- ✅ Documentação completa

---

## ⚙️ **CONFIGURAÇÃO E SETUP**

### **Variáveis de Ambiente**

```env
# Chatwoot (Principal)
CHATWOOT_BASE_URL=http://localhost:3000
CHATWOOT_ACCESS_TOKEN=seu_token_aqui
CHATWOOT_ACCOUNT_ID=1
CHATWOOT_WEBHOOK_TOKEN=seu_webhook_token

# WhatsApp Direto (Opcional/Fallback)
WHATSAPP_DIRECT_ENABLED=false
WHATSAPP_DIRECT_SESSION_NAME=conectcrm-session

# Atendimento
ATENDIMENTO_AUTO_CRIAR_CLIENTES=true
ATENDIMENTO_AUTO_CRIAR_LEADS=true
ATENDIMENTO_SLA_RESPOSTA_MINUTOS=30
ATENDIMENTO_SLA_RESOLUCAO_HORAS=24
```

### **Instalação Chatwoot (Docker)**

```bash
# Clone o repositório do Chatwoot
git clone https://github.com/chatwoot/chatwoot.git
cd chatwoot

# Configure variáveis
cp .env.example .env
# Edite .env conforme necessário

# Iniciar com Docker
docker-compose up -d

# Acesse: http://localhost:3000
```

---

## 🔐 **SEGURANÇA**

### **Autenticação e Autorização**

- JWT para autenticar usuários
- Guard `@IsAtendente()` para proteger rotas
- Permissões por empresa/canal
- Logs de auditoria completos

### **Proteção de Dados**

- Criptografia de tokens de integração
- HTTPS obrigatório em produção
- Rate limiting em webhooks
- Validação rigorosa de inputs

---

## 📈 **ESCALABILIDADE**

### **Performance**

- Cache de mensagens recentes (Redis)
- Paginação em todas as listagens
- WebSockets para atualizações em tempo real
- Queue de mensagens (Bull/BullMQ)

### **Multi-tenant**

- Separação por `empresa_id`
- Configurações isoladas por empresa
- Limites configuráveis por plano

---

## 🎯 **RESULTADO ESPERADO**

Após a implementação completa, o ConectCRM terá:

✅ **Atendimento omnichannel profissional**
✅ **Integração nativa com Chatwoot**
✅ **Gestão completa de equipe**
✅ **Contexto CRM em tempo real**
✅ **SLA e métricas automáticas**
✅ **Interface moderna e intuitiva**
✅ **Fallback para WhatsApp direto (opcional)**
✅ **Escalável e multi-tenant**

---

## 📞 **PRÓXIMOS PASSOS**

1. ✅ Revisar e aprovar esta documentação
2. ⏭️ Criar as migrations do banco de dados
3. ⏭️ Implementar módulo backend
4. ⏭️ Desenvolver interface frontend
5. ⏭️ Testar integração com Chatwoot
6. ⏭️ Deploy e homologação

---

**Documentação criada em:** 10 de outubro de 2025  
**Sistema:** ConectCRM - Módulo Atendimento Omnichannel  
**Versão:** 1.0  
**Responsável:** Equipe de Desenvolvimento
