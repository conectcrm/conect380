-- Migration: Criar tabela de tickets de atendimento
-- Data: 12/10/2025
-- Descrição: Tabela principal para gerenciamento de tickets do sistema omnichannel

-- Criar tabela de tickets
CREATE TABLE IF NOT EXISTS atendimento_tickets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Identificação
    numero SERIAL NOT NULL,
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    canal_id UUID NOT NULL REFERENCES canais(id) ON DELETE CASCADE,
    
    -- Cliente
    cliente_nome VARCHAR(255),
    cliente_numero VARCHAR(50) NOT NULL, -- Número WhatsApp ou identificador único
    cliente_email VARCHAR(255),
    cliente_metadata JSONB DEFAULT '{}',
    
    -- Status e Atribuição
    status VARCHAR(20) NOT NULL DEFAULT 'aberto', -- aberto, em_atendimento, aguardando, resolvido, fechado
    prioridade VARCHAR(20) DEFAULT 'media', -- baixa, media, alta, urgente
    atendente_id UUID REFERENCES atendimento_atendentes(id) ON DELETE SET NULL,
    atribuido_em TIMESTAMP,
    
    -- Assunto e Categorização
    assunto VARCHAR(500),
    categoria VARCHAR(100),
    tags TEXT[] DEFAULT '{}',
    
    -- Controle de Tempo (SLA)
    primeira_resposta_em TIMESTAMP,
    tempo_primeira_resposta INTEGER, -- segundos
    resolvido_em TIMESTAMP,
    fechado_em TIMESTAMP,
    reaberto_count INTEGER DEFAULT 0,
    
    -- IA e Automação
    auto_resposta_ativa BOOLEAN DEFAULT true,
    sentimento VARCHAR(20), -- positivo, neutro, negativo
    
    -- Metadata e Origem
    origem VARCHAR(50) NOT NULL DEFAULT 'whatsapp',
    metadata JSONB DEFAULT '{}',
    
    -- Auditoria
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT fk_tickets_empresa FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE,
    CONSTRAINT fk_tickets_canal FOREIGN KEY (canal_id) REFERENCES canais(id) ON DELETE CASCADE,
    CONSTRAINT fk_tickets_atendente FOREIGN KEY (atendente_id) REFERENCES atendimento_atendentes(id) ON DELETE SET NULL
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_tickets_empresa ON atendimento_tickets(empresa_id);
CREATE INDEX IF NOT EXISTS idx_tickets_canal ON atendimento_tickets(canal_id);
CREATE INDEX IF NOT EXISTS idx_tickets_cliente_numero ON atendimento_tickets(cliente_numero);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON atendimento_tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_atendente ON atendimento_tickets(atendente_id);
CREATE INDEX IF NOT EXISTS idx_tickets_created ON atendimento_tickets(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tickets_numero ON atendimento_tickets(numero);
CREATE INDEX IF NOT EXISTS idx_tickets_empresa_status ON atendimento_tickets(empresa_id, status);
CREATE INDEX IF NOT EXISTS idx_tickets_empresa_canal ON atendimento_tickets(empresa_id, canal_id);

-- Índice para busca full-text (busca por assunto e nome do cliente)
CREATE INDEX IF NOT EXISTS idx_tickets_busca ON atendimento_tickets 
    USING gin(to_tsvector('portuguese', coalesce(assunto, '') || ' ' || coalesce(cliente_nome, '')));

-- Índice no JSONB metadata
CREATE INDEX IF NOT EXISTS idx_tickets_metadata ON atendimento_tickets USING gin(metadata);

-- Constraints de validação
ALTER TABLE atendimento_tickets 
    ADD CONSTRAINT chk_ticket_status 
    CHECK (status IN ('aberto', 'em_atendimento', 'aguardando', 'resolvido', 'fechado'));

ALTER TABLE atendimento_tickets 
    ADD CONSTRAINT chk_ticket_prioridade 
    CHECK (prioridade IN ('baixa', 'media', 'alta', 'urgente'));

ALTER TABLE atendimento_tickets 
    ADD CONSTRAINT chk_ticket_sentimento 
    CHECK (sentimento IS NULL OR sentimento IN ('positivo', 'neutro', 'negativo'));

-- Comentários nas colunas
COMMENT ON TABLE atendimento_tickets IS 'Tickets de atendimento do sistema omnichannel';
COMMENT ON COLUMN atendimento_tickets.numero IS 'Número sequencial do ticket (auto-incremento)';
COMMENT ON COLUMN atendimento_tickets.cliente_numero IS 'Número WhatsApp ou identificador único do cliente';
COMMENT ON COLUMN atendimento_tickets.status IS 'Status atual do ticket';
COMMENT ON COLUMN atendimento_tickets.prioridade IS 'Prioridade do ticket';
COMMENT ON COLUMN atendimento_tickets.tempo_primeira_resposta IS 'Tempo até primeira resposta em segundos';
COMMENT ON COLUMN atendimento_tickets.auto_resposta_ativa IS 'Se a IA deve responder automaticamente';
COMMENT ON COLUMN atendimento_tickets.sentimento IS 'Sentimento detectado pela IA';

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_atendimento_tickets_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_atendimento_tickets_updated_at
    BEFORE UPDATE ON atendimento_tickets
    FOR EACH ROW
    EXECUTE FUNCTION update_atendimento_tickets_updated_at();

-- Trigger para calcular tempo de primeira resposta
CREATE OR REPLACE FUNCTION calculate_primeira_resposta()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.primeira_resposta_em IS NOT NULL AND OLD.primeira_resposta_em IS NULL THEN
        NEW.tempo_primeira_resposta = EXTRACT(EPOCH FROM (NEW.primeira_resposta_em - NEW.created_at))::INTEGER;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_calculate_primeira_resposta
    BEFORE UPDATE ON atendimento_tickets
    FOR EACH ROW
    EXECUTE FUNCTION calculate_primeira_resposta();
