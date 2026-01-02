-- Script para inserir dados de teste realistas para o Dashboard
-- Execute: psql -h localhost -p 5434 -U conectcrm -d conectcrm_db -f scripts/inserir-dados-teste-dashboard.sql

-- 1. Inserir alguns clientes de teste
INSERT INTO clientes (id, nome, email, telefone, empresa_id, status, created_at, updated_at)
VALUES
  (gen_random_uuid(), 'Empresa Tech LTDA', 'contato@empresatech.com', '11987654321', '11111111-1111-1111-1111-111111111111', 'ativo', NOW() - INTERVAL '6 months', NOW()),
  (gen_random_uuid(), 'Soluções Corp', 'vendas@solucoes.com', '11987654322', '11111111-1111-1111-1111-111111111111', 'ativo', NOW() - INTERVAL '5 months', NOW()),
  (gen_random_uuid(), 'Inovação SA', 'info@inovacao.com', '11987654323', '11111111-1111-1111-1111-111111111111', 'ativo', NOW() - INTERVAL '4 months', NOW()),
  (gen_random_uuid(), 'Digital Plus', 'contato@digitalplus.com', '11987654324', '11111111-1111-1111-1111-111111111111', 'ativo', NOW() - INTERVAL '3 months', NOW()),
  (gen_random_uuid(), 'TechStart', 'hello@techstart.com', '11987654325', '11111111-1111-1111-1111-111111111111', 'ativo', NOW() - INTERVAL '2 months', NOW())
ON CONFLICT DO NOTHING;

-- 2. Inserir propostas com diferentes status e valores
-- Janeiro (2 propostas aprovadas)
INSERT INTO propostas (id, cliente_id, titulo, descricao, valor, status, empresa_id, data_envio, data_aprovacao, created_at, updated_at)
SELECT 
  gen_random_uuid(),
  c.id,
  'Proposta Janeiro - ' || c.nome,
  'Implementação de sistema CRM',
  55000.00,
  'aprovada',
  '11111111-1111-1111-1111-111111111111',
  DATE '2025-01-15',
  DATE '2025-01-25',
  DATE '2025-01-10',
  DATE '2025-01-25'
FROM clientes c WHERE c.empresa_id = '11111111-1111-1111-1111-111111111111' LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO propostas (id, cliente_id, titulo, descricao, valor, status, empresa_id, data_envio, data_aprovacao, created_at, updated_at)
SELECT 
  gen_random_uuid(),
  c.id,
  'Proposta Janeiro B - ' || c.nome,
  'Consultoria em tecnologia',
  70000.00,
  'aprovada',
  '11111111-1111-1111-1111-111111111111',
  DATE '2025-01-20',
  DATE '2025-01-28',
  DATE '2025-01-18',
  DATE '2025-01-28'
FROM clientes c WHERE c.empresa_id = '11111111-1111-1111-1111-111111111111' OFFSET 1 LIMIT 1
ON CONFLICT DO NOTHING;

-- Fevereiro (3 propostas aprovadas)
INSERT INTO propostas (id, cliente_id, titulo, descricao, valor, status, empresa_id, data_envio, data_aprovacao, created_at, updated_at)
SELECT 
  gen_random_uuid(),
  c.id,
  'Proposta Fevereiro - ' || c.nome,
  'Desenvolvimento de aplicativo',
  85000.00,
  'aprovada',
  '11111111-1111-1111-1111-111111111111',
  DATE '2025-02-10',
  DATE '2025-02-20',
  DATE '2025-02-05',
  DATE '2025-02-20'
FROM clientes c WHERE c.empresa_id = '11111111-1111-1111-1111-111111111111' OFFSET 2 LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO propostas (id, cliente_id, titulo, descricao, valor, status, empresa_id, data_envio, created_at, updated_at)
SELECT 
  gen_random_uuid(),
  c.id,
  'Proposta Fevereiro B - ' || c.nome,
  'Suporte técnico',
  35000.00,
  'enviada',
  '11111111-1111-1111-1111-111111111111',
  DATE '2025-02-15',
  NULL,
  DATE '2025-02-12',
  DATE '2025-02-15'
FROM clientes c WHERE c.empresa_id = '11111111-1111-1111-1111-111111111111' OFFSET 3 LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO propostas (id, cliente_id, titulo, descricao, valor, status, empresa_id, data_envio, data_aprovacao, created_at, updated_at)
SELECT 
  gen_random_uuid(),
  c.id,
  'Proposta Fevereiro C - ' || c.nome,
  'Infraestrutura cloud',
  25000.00,
  'aprovada',
  '11111111-1111-1111-1111-111111111111',
  DATE '2025-02-22',
  DATE '2025-02-28',
  DATE '2025-02-20',
  DATE '2025-02-28'
FROM clientes c WHERE c.empresa_id = '11111111-1111-1111-1111-111111111111' OFFSET 4 LIMIT 1
ON CONFLICT DO NOTHING;

-- Março (4 propostas - 3 aprovadas, 1 rejeitada)
INSERT INTO propostas (id, cliente_id, titulo, descricao, valor, status, empresa_id, data_envio, data_aprovacao, created_at, updated_at)
SELECT 
  gen_random_uuid(),
  c.id,
  'Proposta Março - ' || c.nome,
  'Migração de sistemas',
  95000.00,
  'aprovada',
  '11111111-1111-1111-1111-111111111111',
  DATE '2025-03-05',
  DATE '2025-03-15',
  DATE '2025-03-01',
  DATE '2025-03-15'
FROM clientes c WHERE c.empresa_id = '11111111-1111-1111-1111-111111111111' LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO propostas (id, cliente_id, titulo, descricao, valor, status, empresa_id, data_envio, created_at, updated_at)
SELECT 
  gen_random_uuid(),
  c.id,
  'Proposta Março B - ' || c.nome,
  'Treinamento',
  15000.00,
  'rejeitada',
  '11111111-1111-1111-1111-111111111111',
  DATE '2025-03-10',
  NULL,
  DATE '2025-03-08',
  DATE '2025-03-18'
FROM clientes c WHERE c.empresa_id = '11111111-1111-1111-1111-111111111111' OFFSET 1 LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO propostas (id, cliente_id, titulo, descricao, valor, status, empresa_id, data_envio, data_aprovacao, created_at, updated_at)
SELECT 
  gen_random_uuid(),
  c.id,
  'Proposta Março C - ' || c.nome,
  'Integração API',
  42000.00,
  'aprovada',
  '11111111-1111-1111-1111-111111111111',
  DATE '2025-03-15',
  DATE '2025-03-25',
  DATE '2025-03-12',
  DATE '2025-03-25'
FROM clientes c WHERE c.empresa_id = '11111111-1111-1111-1111-111111111111' OFFSET 2 LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO propostas (id, cliente_id, titulo, descricao, valor, status, empresa_id, data_envio, data_aprovacao, created_at, updated_at)
SELECT 
  gen_random_uuid(),
  c.id,
  'Proposta Março D - ' || c.nome,
  'Dashboard analytics',
  28000.00,
  'aprovada',
  '11111111-1111-1111-1111-111111111111',
  DATE '2025-03-20',
  DATE '2025-03-28',
  DATE '2025-03-18',
  DATE '2025-03-28'
FROM clientes c WHERE c.empresa_id = '11111111-1111-1111-1111-111111111111' OFFSET 3 LIMIT 1
ON CONFLICT DO NOTHING;

-- Abril (3 aprovadas, 1 enviada)
INSERT INTO propostas (id, cliente_id, titulo, descricao, valor, status, empresa_id, data_envio, data_aprovacao, created_at, updated_at)
SELECT 
  gen_random_uuid(),
  c.id,
  'Proposta Abril - ' || c.nome,
  'Redesign website',
  52000.00,
  'aprovada',
  '11111111-1111-1111-1111-111111111111',
  DATE '2025-04-08',
  DATE '2025-04-18',
  DATE '2025-04-05',
  DATE '2025-04-18'
FROM clientes c WHERE c.empresa_id = '11111111-1111-1111-1111-111111111111' OFFSET 4 LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO propostas (id, cliente_id, titulo, descricao, valor, status, empresa_id, data_envio, created_at, updated_at)
SELECT 
  gen_random_uuid(),
  c.id,
  'Proposta Abril B - ' || c.nome,
  'SEO e Marketing Digital',
  38000.00,
  'enviada',
  '11111111-1111-1111-1111-111111111111',
  DATE '2025-04-12',
  NULL,
  DATE '2025-04-10',
  DATE '2025-04-12'
FROM clientes c WHERE c.empresa_id = '11111111-1111-1111-1111-111111111111' LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO propostas (id, cliente_id, titulo, descricao, valor, status, empresa_id, data_envio, data_aprovacao, created_at, updated_at)
SELECT 
  gen_random_uuid(),
  c.id,
  'Proposta Abril C - ' || c.nome,
  'App Mobile',
  65000.00,
  'aprovada',
  '11111111-1111-1111-1111-111111111111',
  DATE '2025-04-20',
  DATE '2025-04-28',
  DATE '2025-04-18',
  DATE '2025-04-28'
FROM clientes c WHERE c.empresa_id = '11111111-1111-1111-1111-111111111111' OFFSET 1 LIMIT 1
ON CONFLICT DO NOTHING;

-- 3. Inserir eventos (reuniões, ligações, emails) para timeline de atividades
INSERT INTO eventos (id, titulo, descricao, tipo, data_inicio, data_fim, cliente_id, empresa_id, status, created_at, updated_at)
SELECT
  gen_random_uuid(),
  'Reunião Janeiro - ' || c.nome,
  'Apresentação inicial',
  'reuniao',
  TIMESTAMP '2025-01-10 10:00:00',
  TIMESTAMP '2025-01-10 11:00:00',
  c.id,
  '11111111-1111-1111-1111-111111111111',
  'concluido',
  TIMESTAMP '2025-01-08',
  TIMESTAMP '2025-01-10 11:00:00'
FROM clientes c WHERE c.empresa_id = '11111111-1111-1111-1111-111111111111'
ON CONFLICT DO NOTHING;

-- Mais eventos para criar timeline realista
-- Fevereiro
INSERT INTO eventos (id, titulo, tipo, data_inicio, data_fim, empresa_id, status, created_at)
VALUES
  (gen_random_uuid(), 'Follow-up ligação', 'ligacao', TIMESTAMP '2025-02-05 14:00:00', TIMESTAMP '2025-02-05 14:30:00', '11111111-1111-1111-1111-111111111111', 'concluido', TIMESTAMP '2025-02-05'),
  (gen_random_uuid(), 'Email comercial', 'email', TIMESTAMP '2025-02-08 09:00:00', TIMESTAMP '2025-02-08 09:15:00', '11111111-1111-1111-1111-111111111111', 'concluido', TIMESTAMP '2025-02-08'),
  (gen_random_uuid(), 'Reunião técnica', 'reuniao', TIMESTAMP '2025-02-15 15:00:00', TIMESTAMP '2025-02-15 16:30:00', '11111111-1111-1111-1111-111111111111', 'concluido', TIMESTAMP '2025-02-15')
ON CONFLICT DO NOTHING;

-- Março
INSERT INTO eventos (id, titulo, tipo, data_inicio, data_fim, empresa_id, status, created_at)
VALUES
  (gen_random_uuid(), 'Ligação prospect', 'ligacao', TIMESTAMP '2025-03-10 11:00:00', TIMESTAMP '2025-03-10 11:20:00', '11111111-1111-1111-1111-111111111111', 'concluido', TIMESTAMP '2025-03-10'),
  (gen_random_uuid(), 'Email follow-up', 'email', TIMESTAMP '2025-03-12 10:00:00', TIMESTAMP '2025-03-12 10:10:00', '11111111-1111-1111-1111-111111111111', 'concluido', TIMESTAMP '2025-03-12'),
  (gen_random_uuid(), 'Apresentação proposta', 'reuniao', TIMESTAMP '2025-03-20 14:00:00', TIMESTAMP '2025-03-20 15:00:00', '11111111-1111-1111-1111-111111111111', 'concluido', TIMESTAMP '2025-03-20')
ON CONFLICT DO NOTHING;

-- Abril
INSERT INTO eventos (id, titulo, tipo, data_inicio, data_fim, empresa_id, status, created_at)
VALUES
  (gen_random_uuid(), 'Ligação agendamento', 'ligacao', TIMESTAMP '2025-04-05 09:30:00', TIMESTAMP '2025-04-05 09:45:00', '11111111-1111-1111-1111-111111111111', 'concluido', TIMESTAMP '2025-04-05'),
  (gen_random_uuid(), 'Email proposta', 'email', TIMESTAMP '2025-04-08 11:00:00', TIMESTAMP '2025-04-08 11:15:00', '11111111-1111-1111-1111-111111111111', 'concluido', TIMESTAMP '2025-04-08'),
  (gen_random_uuid(), 'Reunião fechamento', 'reuniao', TIMESTAMP '2025-04-18 16:00:00', TIMESTAMP '2025-04-18 17:00:00', '11111111-1111-1111-1111-111111111111', 'concluido', TIMESTAMP '2025-04-18')
ON CONFLICT DO NOTHING;

-- 4. Confirmar inserção
SELECT 
  'Clientes inseridos: ' || COUNT(*) as resultado 
FROM clientes 
WHERE empresa_id = '11111111-1111-1111-1111-111111111111'

UNION ALL

SELECT 
  'Propostas inseridas: ' || COUNT(*) as resultado 
FROM propostas 
WHERE empresa_id = '11111111-1111-1111-1111-111111111111'

UNION ALL

SELECT 
  'Eventos inseridos: ' || COUNT(*) as resultado 
FROM eventos 
WHERE empresa_id = '11111111-1111-1111-1111-111111111111'

UNION ALL

SELECT 
  'Propostas aprovadas: ' || COUNT(*) as resultado 
FROM propostas 
WHERE empresa_id = '11111111-1111-1111-1111-111111111111' 
  AND status = 'aprovada';

-- 5. Verificar totais por mês
SELECT 
  TO_CHAR(data_aprovacao, 'Mon') as mes,
  COUNT(*) as quantidade,
  SUM(valor) as total_valor
FROM propostas
WHERE empresa_id = '11111111-1111-1111-1111-111111111111'
  AND status = 'aprovada'
  AND data_aprovacao IS NOT NULL
GROUP BY TO_CHAR(data_aprovacao, 'Mon'), EXTRACT(MONTH FROM data_aprovacao)
ORDER BY EXTRACT(MONTH FROM data_aprovacao);
