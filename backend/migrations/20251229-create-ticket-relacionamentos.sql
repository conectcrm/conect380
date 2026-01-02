-- Migration: Criar tabela de relacionamentos entre tickets
-- Data: 2025-12-29

CREATE TABLE IF NOT EXISTS ticket_relacionamentos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_origem_id UUID NOT NULL REFERENCES atendimento_tickets(id) ON DELETE CASCADE,
  ticket_destino_id UUID NOT NULL REFERENCES atendimento_tickets(id) ON DELETE CASCADE,
  tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('relacionado', 'duplicado', 'bloqueado')),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_relacionamento UNIQUE (ticket_origem_id, ticket_destino_id, tipo)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_ticket_relacionamentos_origem ON ticket_relacionamentos(ticket_origem_id);
CREATE INDEX IF NOT EXISTS idx_ticket_relacionamentos_destino ON ticket_relacionamentos(ticket_destino_id);
CREATE INDEX IF NOT EXISTS idx_ticket_relacionamentos_tipo ON ticket_relacionamentos(tipo);

-- Comentários
COMMENT ON TABLE ticket_relacionamentos IS 'Relacionamentos entre tickets (relacionado, duplicado, bloqueado por)';
COMMENT ON COLUMN ticket_relacionamentos.tipo IS 'Tipo de relacionamento: relacionado (associado), duplicado (cópia), bloqueado (dependência)';
COMMENT ON COLUMN ticket_relacionamentos.ticket_origem_id IS 'Ticket que contém o relacionamento';
COMMENT ON COLUMN ticket_relacionamentos.ticket_destino_id IS 'Ticket relacionado/referenciado';
