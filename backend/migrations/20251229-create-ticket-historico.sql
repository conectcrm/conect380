-- Migration: Criar tabela de histórico de alterações de tickets
-- Data: 2025-12-29

CREATE TABLE IF NOT EXISTS ticket_historico (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_id UUID NOT NULL REFERENCES atendimento_tickets(id) ON DELETE CASCADE,
  usuario_id UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  campo VARCHAR(100) NOT NULL,
  valor_anterior TEXT,
  valor_novo TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_ticket_historico_ticket_id ON ticket_historico(ticket_id);
CREATE INDEX IF NOT EXISTS idx_ticket_historico_usuario_id ON ticket_historico(usuario_id);
CREATE INDEX IF NOT EXISTS idx_ticket_historico_created_at ON ticket_historico(created_at DESC);

-- Comentários
COMMENT ON TABLE ticket_historico IS 'Registra todas as alterações feitas em tickets para auditoria';
COMMENT ON COLUMN ticket_historico.campo IS 'Nome do campo que foi alterado (ex: status, prioridade, responsavel)';
COMMENT ON COLUMN ticket_historico.valor_anterior IS 'Valor antes da alteração (pode ser NULL em criações)';
COMMENT ON COLUMN ticket_historico.valor_novo IS 'Valor após a alteração';
