-- Migration: Criar tabela de atendentes
-- Data: 12/10/2025
-- Descrição: Tabela para cadastro de atendentes do sistema omnichannel

-- Criar tabela de atendentes
CREATE TABLE IF NOT EXISTS atendimento_atendentes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Relacionamento com usuário
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    
    -- Dados do atendente
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    avatar_url TEXT,
    
    -- Status e configurações
    status VARCHAR(20) NOT NULL DEFAULT 'offline', -- online, offline, ausente
    max_tickets INTEGER DEFAULT 5, -- Máximo de tickets simultâneos
    
    -- Controle
    ativo BOOLEAN DEFAULT true,
    
    -- Auditoria
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_atendentes_usuario ON atendimento_atendentes(usuario_id);
CREATE INDEX IF NOT EXISTS idx_atendentes_status ON atendimento_atendentes(status);
CREATE INDEX IF NOT EXISTS idx_atendentes_ativo ON atendimento_atendentes(ativo);

-- Constraint para garantir status válido
ALTER TABLE atendimento_atendentes 
    ADD CONSTRAINT chk_atendente_status 
    CHECK (status IN ('online', 'offline', 'ausente'));

-- Comentários nas colunas
COMMENT ON TABLE atendimento_atendentes IS 'Cadastro de atendentes do sistema omnichannel';
COMMENT ON COLUMN atendimento_atendentes.usuario_id IS 'Referência ao usuário do sistema';
COMMENT ON COLUMN atendimento_atendentes.status IS 'Status atual: online, offline ou ausente';
COMMENT ON COLUMN atendimento_atendentes.max_tickets IS 'Máximo de tickets simultâneos que o atendente pode ter';

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_atendimento_atendentes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_atendimento_atendentes_updated_at
    BEFORE UPDATE ON atendimento_atendentes
    FOR EACH ROW
    EXECUTE FUNCTION update_atendimento_atendentes_updated_at();
