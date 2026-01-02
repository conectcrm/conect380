-- ============================================
-- FASE 3 - TICKETS CONFIGURÁVEIS
-- Migração Manual das 3 Migrations
-- ============================================

BEGIN;

-- ============================================
-- MIGRATION 1: RefatorarTicketsConfiguraveis
-- ============================================

-- 1.1. Criar tabela niveis_atendimento
CREATE TABLE IF NOT EXISTS niveis_atendimento (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  codigo VARCHAR(10) NOT NULL,
  nome VARCHAR(100) NOT NULL,
  descricao TEXT,
  ordem INTEGER NOT NULL,
  ativo BOOLEAN DEFAULT true,
  cor VARCHAR(7),
  empresa_id UUID NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT fk_nivel_empresa FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE,
  CONSTRAINT uq_nivel_codigo_empresa UNIQUE (empresa_id, codigo)
);

CREATE INDEX idx_niveis_empresa_ordem ON niveis_atendimento(empresa_id, ordem);

-- 1.2. Criar tabela status_customizados
CREATE TABLE IF NOT EXISTS status_customizados (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome VARCHAR(100) NOT NULL,
  descricao TEXT,
  nivel_id UUID NOT NULL,
  cor VARCHAR(7) NOT NULL,
  ordem INTEGER NOT NULL,
  finalizador BOOLEAN DEFAULT false,
  ativo BOOLEAN DEFAULT true,
  empresa_id UUID NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT fk_status_nivel FOREIGN KEY (nivel_id) REFERENCES niveis_atendimento(id) ON DELETE CASCADE,
  CONSTRAINT fk_status_empresa FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE
);

CREATE INDEX idx_status_empresa_nivel_ordem ON status_customizados(empresa_id, nivel_id, ordem);

-- 1.3. Criar tabela tipos_servico
CREATE TABLE IF NOT EXISTS tipos_servico (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome VARCHAR(100) NOT NULL,
  descricao TEXT,
  cor VARCHAR(7),
  icone VARCHAR(50),
  ordem INTEGER DEFAULT 0,
  ativo BOOLEAN DEFAULT true,
  empresa_id UUID NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT fk_tipo_empresa FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE
);

CREATE INDEX idx_tipos_empresa_ordem ON tipos_servico(empresa_id, ordem);

-- 1.4. Popular dados iniciais - Níveis
INSERT INTO niveis_atendimento (codigo, nome, descricao, ordem, cor, empresa_id)
SELECT 'N1', 'N1 - Suporte Básico', 'Atendimento de primeiro nível - questões simples e FAQ', 1, '#10B981', e.id
FROM empresas e
WHERE NOT EXISTS (SELECT 1 FROM niveis_atendimento na WHERE na.empresa_id = e.id AND na.codigo = 'N1');

INSERT INTO niveis_atendimento (codigo, nome, descricao, ordem, cor, empresa_id)
SELECT 'N2', 'N2 - Suporte Avançado', 'Atendimento de segundo nível - problemas técnicos complexos', 2, '#F59E0B', e.id
FROM empresas e
WHERE NOT EXISTS (SELECT 1 FROM niveis_atendimento na WHERE na.empresa_id = e.id AND na.codigo = 'N2');

INSERT INTO niveis_atendimento (codigo, nome, descricao, ordem, cor, empresa_id)
SELECT 'N3', 'N3 - Especialista/Desenvolvimento', 'Atendimento de terceiro nível - desenvolvimento e customizações', 3, '#EF4444', e.id
FROM empresas e
WHERE NOT EXISTS (SELECT 1 FROM niveis_atendimento na WHERE na.empresa_id = e.id AND na.codigo = 'N3');

-- 1.5. Popular dados iniciais - Status (N1)
INSERT INTO status_customizados (nome, descricao, nivel_id, cor, ordem, finalizador, empresa_id)
SELECT 'Fila', 'Aguardando atribuição de atendente', na.id, '#94A3B8', 1, false, e.id
FROM empresas e
JOIN niveis_atendimento na ON na.empresa_id = e.id AND na.codigo = 'N1'
WHERE NOT EXISTS (SELECT 1 FROM status_customizados sc WHERE sc.empresa_id = e.id AND sc.nivel_id = na.id AND sc.nome = 'Fila');

INSERT INTO status_customizados (nome, descricao, nivel_id, cor, ordem, finalizador, empresa_id)
SELECT 'Em Atendimento', 'Ticket sendo tratado por um atendente', na.id, '#3B82F6', 2, false, e.id
FROM empresas e
JOIN niveis_atendimento na ON na.empresa_id = e.id AND na.codigo = 'N1'
WHERE NOT EXISTS (SELECT 1 FROM status_customizados sc WHERE sc.empresa_id = e.id AND sc.nivel_id = na.id AND sc.nome = 'Em Atendimento');

INSERT INTO status_customizados (nome, descricao, nivel_id, cor, ordem, finalizador, empresa_id)
SELECT 'Aguardando Cliente', 'Aguardando resposta ou ação do cliente', na.id, '#F59E0B', 3, false, e.id
FROM empresas e
JOIN niveis_atendimento na ON na.empresa_id = e.id AND na.codigo = 'N1'
WHERE NOT EXISTS (SELECT 1 FROM status_customizados sc WHERE sc.empresa_id = e.id AND sc.nivel_id = na.id AND sc.nome = 'Aguardando Cliente');

INSERT INTO status_customizados (nome, descricao, nivel_id, cor, ordem, finalizador, empresa_id)
SELECT 'Concluído', 'Ticket resolvido e finalizado', na.id, '#10B981', 4, true, e.id
FROM empresas e
JOIN niveis_atendimento na ON na.empresa_id = e.id AND na.codigo = 'N1'
WHERE NOT EXISTS (SELECT 1 FROM status_customizados sc WHERE sc.empresa_id = e.id AND sc.nivel_id = na.id AND sc.nome = 'Concluído');

-- 1.6. Replicar status para N2 e N3
INSERT INTO status_customizados (nome, descricao, nivel_id, cor, ordem, finalizador, empresa_id)
SELECT s.nome, s.descricao, na2.id, s.cor, s.ordem, s.finalizador, e.id
FROM empresas e
JOIN niveis_atendimento na1 ON na1.empresa_id = e.id AND na1.codigo = 'N1'
JOIN niveis_atendimento na2 ON na2.empresa_id = e.id AND na2.codigo = 'N2'
JOIN status_customizados s ON s.empresa_id = e.id AND s.nivel_id = na1.id
WHERE NOT EXISTS (SELECT 1 FROM status_customizados sc WHERE sc.empresa_id = e.id AND sc.nivel_id = na2.id AND sc.nome = s.nome);

INSERT INTO status_customizados (nome, descricao, nivel_id, cor, ordem, finalizador, empresa_id)
SELECT s.nome, s.descricao, na3.id, s.cor, s.ordem, s.finalizador, e.id
FROM empresas e
JOIN niveis_atendimento na1 ON na1.empresa_id = e.id AND na1.codigo = 'N1'
JOIN niveis_atendimento na3 ON na3.empresa_id = e.id AND na3.codigo = 'N3'
JOIN status_customizados s ON s.empresa_id = e.id AND s.nivel_id = na1.id
WHERE NOT EXISTS (SELECT 1 FROM status_customizados sc WHERE sc.empresa_id = e.id AND sc.nivel_id = na3.id AND sc.nome = s.nome);

-- 1.7. Popular dados iniciais - Tipos de Serviço
INSERT INTO tipos_servico (nome, descricao, cor, icone, ordem, empresa_id)
SELECT 'Suporte', 'Suporte técnico geral', '#8B5CF6', 'HelpCircle', 1, e.id
FROM empresas e
WHERE NOT EXISTS (SELECT 1 FROM tipos_servico ts WHERE ts.empresa_id = e.id AND ts.nome = 'Suporte');

INSERT INTO tipos_servico (nome, descricao, cor, icone, ordem, empresa_id)
SELECT 'Técnica', 'Questões técnicas e troubleshooting', '#3B82F6', 'Wrench', 2, e.id
FROM empresas e
WHERE NOT EXISTS (SELECT 1 FROM tipos_servico ts WHERE ts.empresa_id = e.id AND ts.nome = 'Técnica');

INSERT INTO tipos_servico (nome, descricao, cor, icone, ordem, empresa_id)
SELECT 'Comercial', 'Questões comerciais e vendas', '#10B981', 'DollarSign', 3, e.id
FROM empresas e
WHERE NOT EXISTS (SELECT 1 FROM tipos_servico ts WHERE ts.empresa_id = e.id AND ts.nome = 'Comercial');

INSERT INTO tipos_servico (nome, descricao, cor, icone, ordem, empresa_id)
SELECT 'Financeira', 'Questões financeiras e pagamentos', '#F59E0B', 'CreditCard', 4, e.id
FROM empresas e
WHERE NOT EXISTS (SELECT 1 FROM tipos_servico ts WHERE ts.empresa_id = e.id AND ts.nome = 'Financeira');

INSERT INTO tipos_servico (nome, descricao, cor, icone, ordem, empresa_id)
SELECT 'Reclamação', 'Reclamações e insatisfações', '#EF4444', 'AlertTriangle', 5, e.id
FROM empresas e
WHERE NOT EXISTS (SELECT 1 FROM tipos_servico ts WHERE ts.empresa_id = e.id AND ts.nome = 'Reclamação');

INSERT INTO tipos_servico (nome, descricao, cor, icone, ordem, empresa_id)
SELECT 'Solicitação de Melhoria', 'Sugestões de melhorias', '#06B6D4', 'Sparkles', 6, e.id
FROM empresas e
WHERE NOT EXISTS (SELECT 1 FROM tipos_servico ts WHERE ts.empresa_id = e.id AND ts.nome = 'Solicitação de Melhoria');

INSERT INTO tipos_servico (nome, descricao, cor, icone, ordem, empresa_id)
SELECT 'Bug/Outros', 'Bugs reportados e outros assuntos', '#EC4899', 'Bug', 7, e.id
FROM empresas e
WHERE NOT EXISTS (SELECT 1 FROM tipos_servico ts WHERE ts.empresa_id = e.id AND ts.nome = 'Bug/Outros');

-- ============================================
-- MIGRATION 2: AdicionarFKsConfiguraveisTicket
-- ============================================

-- 2.1. Adicionar colunas FK (nullable)
ALTER TABLE atendimento_tickets ADD COLUMN IF NOT EXISTS nivel_atendimento_id UUID;
ALTER TABLE atendimento_tickets ADD COLUMN IF NOT EXISTS status_customizado_id UUID;
ALTER TABLE atendimento_tickets ADD COLUMN IF NOT EXISTS tipo_servico_id UUID;

-- 2.2. Criar índices
CREATE INDEX IF NOT EXISTS idx_tickets_nivel_atendimento ON atendimento_tickets(nivel_atendimento_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status_customizado ON atendimento_tickets(status_customizado_id);
CREATE INDEX IF NOT EXISTS idx_tickets_tipo_servico ON atendimento_tickets(tipo_servico_id);

-- 2.3. Adicionar constraints de FK
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_ticket_nivel_atendimento'
  ) THEN
    ALTER TABLE atendimento_tickets 
    ADD CONSTRAINT fk_ticket_nivel_atendimento 
    FOREIGN KEY (nivel_atendimento_id) 
    REFERENCES niveis_atendimento(id) 
    ON DELETE SET NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_ticket_status_customizado'
  ) THEN
    ALTER TABLE atendimento_tickets 
    ADD CONSTRAINT fk_ticket_status_customizado 
    FOREIGN KEY (status_customizado_id) 
    REFERENCES status_customizados(id) 
    ON DELETE SET NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_ticket_tipo_servico'
  ) THEN
    ALTER TABLE atendimento_tickets 
    ADD CONSTRAINT fk_ticket_tipo_servico 
    FOREIGN KEY (tipo_servico_id) 
    REFERENCES tipos_servico(id) 
    ON DELETE SET NULL;
  END IF;
END $$;

-- ============================================
-- MIGRATION 3: MigrarDadosEnumParaFKTickets
-- ============================================

-- 3.1. Migrar assigned_level → nivel_atendimento_id
UPDATE atendimento_tickets t
SET nivel_atendimento_id = na.id
FROM niveis_atendimento na
WHERE t.assigned_level = 'N1'
  AND na.codigo = 'N1'
  AND na.empresa_id = t.empresa_id
  AND t.nivel_atendimento_id IS NULL;

UPDATE atendimento_tickets t
SET nivel_atendimento_id = na.id
FROM niveis_atendimento na
WHERE t.assigned_level = 'N2'
  AND na.codigo = 'N2'
  AND na.empresa_id = t.empresa_id
  AND t.nivel_atendimento_id IS NULL;

UPDATE atendimento_tickets t
SET nivel_atendimento_id = na.id
FROM niveis_atendimento na
WHERE t.assigned_level = 'N3'
  AND na.codigo = 'N3'
  AND na.empresa_id = t.empresa_id
  AND t.nivel_atendimento_id IS NULL;

-- 3.2. Migrar status → status_customizado_id
-- NOTA: O enum atual tem apenas 4 valores (FILA, EM_ATENDIMENTO, ENVIO_ATIVO, ENCERRADO)

-- FILA → Fila
UPDATE atendimento_tickets t
SET status_customizado_id = sc.id
FROM status_customizados sc
JOIN niveis_atendimento na ON na.id = sc.nivel_id
WHERE t.status::text = 'FILA'
  AND sc.nome = 'Fila'
  AND na.id = t.nivel_atendimento_id
  AND sc.empresa_id = t.empresa_id
  AND t.status_customizado_id IS NULL;

-- EM_ATENDIMENTO → Em Atendimento
UPDATE atendimento_tickets t
SET status_customizado_id = sc.id
FROM status_customizados sc
JOIN niveis_atendimento na ON na.id = sc.nivel_id
WHERE t.status::text = 'EM_ATENDIMENTO'
  AND sc.nome = 'Em Atendimento'
  AND na.id = t.nivel_atendimento_id
  AND sc.empresa_id = t.empresa_id
  AND t.status_customizado_id IS NULL;

-- ENVIO_ATIVO → Em Atendimento (mapear para Em Atendimento)
UPDATE atendimento_tickets t
SET status_customizado_id = sc.id
FROM status_customizados sc
JOIN niveis_atendimento na ON na.id = sc.nivel_id
WHERE t.status::text = 'ENVIO_ATIVO'
  AND sc.nome = 'Em Atendimento'
  AND na.id = t.nivel_atendimento_id
  AND sc.empresa_id = t.empresa_id
  AND t.status_customizado_id IS NULL;

-- ENCERRADO → Concluído (mapear para Concluído)
UPDATE atendimento_tickets t
SET status_customizado_id = sc.id
FROM status_customizados sc
JOIN niveis_atendimento na ON na.id = sc.nivel_id
WHERE t.status::text = 'ENCERRADO'
  AND sc.nome = 'Concluído'
  AND na.id = t.nivel_atendimento_id
  AND sc.empresa_id = t.empresa_id
  AND t.status_customizado_id IS NULL;

-- 3.3. Migrar tipo → tipo_servico_id
UPDATE atendimento_tickets t
SET tipo_servico_id = ts.id
FROM tipos_servico ts
WHERE t.tipo = 'tecnica' AND ts.nome = 'Técnica' AND ts.empresa_id = t.empresa_id AND t.tipo_servico_id IS NULL;

UPDATE atendimento_tickets t
SET tipo_servico_id = ts.id
FROM tipos_servico ts
WHERE t.tipo = 'comercial' AND ts.nome = 'Comercial' AND ts.empresa_id = t.empresa_id AND t.tipo_servico_id IS NULL;

UPDATE atendimento_tickets t
SET tipo_servico_id = ts.id
FROM tipos_servico ts
WHERE t.tipo = 'financeira' AND ts.nome = 'Financeira' AND ts.empresa_id = t.empresa_id AND t.tipo_servico_id IS NULL;

UPDATE atendimento_tickets t
SET tipo_servico_id = ts.id
FROM tipos_servico ts
WHERE t.tipo = 'suporte' AND ts.nome = 'Suporte' AND ts.empresa_id = t.empresa_id AND t.tipo_servico_id IS NULL;

UPDATE atendimento_tickets t
SET tipo_servico_id = ts.id
FROM tipos_servico ts
WHERE t.tipo = 'reclamacao' AND ts.nome = 'Reclamação' AND ts.empresa_id = t.empresa_id AND t.tipo_servico_id IS NULL;

UPDATE atendimento_tickets t
SET tipo_servico_id = ts.id
FROM tipos_servico ts
WHERE t.tipo = 'solicitacao' AND ts.nome = 'Solicitação de Melhoria' AND ts.empresa_id = t.empresa_id AND t.tipo_servico_id IS NULL;

UPDATE atendimento_tickets t
SET tipo_servico_id = ts.id
FROM tipos_servico ts
WHERE t.tipo = 'outros' AND ts.nome = 'Bug/Outros' AND ts.empresa_id = t.empresa_id AND t.tipo_servico_id IS NULL;

-- Tickets sem tipo definido → Suporte
UPDATE atendimento_tickets t
SET tipo_servico_id = ts.id
FROM tipos_servico ts
WHERE t.tipo IS NULL AND ts.nome = 'Suporte' AND ts.empresa_id = t.empresa_id AND t.tipo_servico_id IS NULL;

-- ============================================
-- REGISTRAR MIGRATIONS
-- ============================================
-- Verificar se já existem antes de inserir
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM migrations WHERE name = 'RefatorarTicketsConfiguraveis1735421400000') THEN
    INSERT INTO migrations (timestamp, name) VALUES (1735421400000, 'RefatorarTicketsConfiguraveis1735421400000');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM migrations WHERE name = 'AdicionarFKsConfiguraveisTicket1735423800000') THEN
    INSERT INTO migrations (timestamp, name) VALUES (1735423800000, 'AdicionarFKsConfiguraveisTicket1735423800000');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM migrations WHERE name = 'MigrarDadosEnumParaFKTickets1735424400000') THEN
    INSERT INTO migrations (timestamp, name) VALUES (1735424400000, 'MigrarDadosEnumParaFKTickets1735424400000');
  END IF;
END $$;

COMMIT;

-- ============================================
-- VALIDAÇÃO
-- ============================================
SELECT 
  COUNT(*) as total_tickets,
  COUNT(nivel_atendimento_id) as com_nivel,
  COUNT(status_customizado_id) as com_status,
  COUNT(tipo_servico_id) as com_tipo,
  ROUND(100.0 * COUNT(nivel_atendimento_id) / COUNT(*), 2) as percent_nivel,
  ROUND(100.0 * COUNT(status_customizado_id) / COUNT(*), 2) as percent_status,
  ROUND(100.0 * COUNT(tipo_servico_id) / COUNT(*), 2) as percent_tipo
FROM atendimento_tickets;
