-- Script SIMPLIFICADO para inserir propostas de teste
-- Execute: psql -h localhost -p 5434 -U conectcrm -d conectcrm_db -f scripts/inserir-propostas-teste.sql

-- Inserir propostas com status 'aprovada' para aparecer nos gráficos
-- Janeiro 2025 (2 propostas)
-- Nota: formaPagamento deve estar em lowercase no INSERT
INSERT INTO propostas (
  numero, titulo, cliente, produtos, subtotal, total, valor, status, 
  "formaPagamento", "validadeDias", empresa_id, "criadaEm", "atualizadaEm"
) VALUES
  (
    'PROP-2025-001',
    'Implementação CRM - Janeiro',
    '{"nome": "Tech Solutions LTDA", "email": "contato@techsolutions.com"}'::jsonb,
    '[{"nome": "Licença CRM", "quantidade": 10, "precoUnitario": 5500}]'::jsonb,
    55000.00,
    55000.00,
    55000.00,
    'aprovada',
    'avista',
    30,
    '11111111-1111-1111-1111-111111111111',
    TIMESTAMP '2025-01-10 10:00:00',
    TIMESTAMP '2025-01-25 15:00:00'
  ),
  (
    'PROP-2025-002',
    'Consultoria Tecnológica - Janeiro',
    '{"nome": "Inovação Corp", "email": "vendas@inovacao.com"}'::jsonb,
    '[{"nome": "Consultoria", "quantidade": 1, "precoUnitario": 70000}]'::jsonb,
    70000.00,
    70000.00,
    70000.00,
    'aprovada',
    'parcelado',
    30,
    '11111111-1111-1111-1111-111111111111',
    TIMESTAMP '2025-01-15 09:00:00',
    TIMESTAMP '2025-01-28 14:00:00'
  ),

-- Fevereiro 2025 (3 propostas - 2 aprovadas, 1 enviada)
  (
    'PROP-2025-003',
    'Desenvolvimento App Mobile - Fevereiro',
    '{"nome": "Digital Plus SA", "email": "contato@digitalplus.com"}'::jsonb,
    '[{"nome": "App iOS", "quantidade": 1, "precoUnitario": 45000}, {"nome": "App Android", "quantidade": 1, "precoUnitario": 40000}]'::jsonb,
    85000.00,
    85000.00,
    85000.00,
    'aprovada',
    'parcelado',
    30,
    '11111111-1111-1111-1111-111111111111',
    TIMESTAMP '2025-02-05 11:00:00',
    TIMESTAMP '2025-02-20 16:00:00'
  ),
  (
    'PROP-2025-004',
    'Suporte Técnico Anual - Fevereiro',
    '{"nome": "StartupTech", "email": "hello@startuptech.com"}'::jsonb,
    '[{"nome": "Suporte Premium", "quantidade": 12, "precoUnitario": 2500}]'::jsonb,
    30000.00,
    30000.00,
    30000.00,
    'aprovada',
    'avista',
    30,
    '11111111-1111-1111-1111-111111111111',
    TIMESTAMP '2025-02-12 10:00:00',
    TIMESTAMP '2025-02-28 12:00:00'
  ),
  (
    'PROP-2025-005',
    'Cloud Infrastructure - Fevereiro',
    '{"nome": "MegaCorp International", "email": "it@megacorp.com"}'::jsonb,
    '[{"nome": "AWS Setup", "quantidade": 1, "precoUnitario": 35000}]'::jsonb,
    35000.00,
    35000.00,
    35000.00,
    'enviada',
    'avista',
    30,
    '11111111-1111-1111-1111-111111111111',
    TIMESTAMP '2025-02-22 14:00:00',
    TIMESTAMP '2025-02-22 14:30:00'
  ),

-- Março 2025 (4 propostas - 3 aprovadas, 1 rejeitada)
  (
    'PROP-2025-006',
    'Migração de Sistemas - Março',
    '{"nome": "Legacy Systems Inc", "email": "admin@legacy.com"}'::jsonb,
    '[{"nome": "Migração Full", "quantidade": 1, "precoUnitario": 95000}]'::jsonb,
    95000.00,
    95000.00,
    95000.00,
    'aprovada',
    'parcelado',
    60,
    '11111111-1111-1111-1111-111111111111',
    TIMESTAMP '2025-03-01 09:00:00',
    TIMESTAMP '2025-03-15 17:00:00'
  ),
  (
    'PROP-2025-007',
    'Treinamento Equipe - Março',
    '{"nome": "SmallBiz LTDA", "email": "contato@smallbiz.com"}'::jsonb,
    '[{"nome": "Treinamento", "quantidade": 1, "precoUnitario": 15000}]'::jsonb,
    15000.00,
    15000.00,
    15000.00,
    'rejeitada',
    'avista',
    30,
    '11111111-1111-1111-1111-111111111111',
    TIMESTAMP '2025-03-08 11:00:00',
    TIMESTAMP '2025-03-18 10:00:00'
  ),
  (
    'PROP-2025-008',
    'Integração API - Março',
    '{"nome": "E-commerce Plus", "email": "tech@ecommerceplus.com"}'::jsonb,
    '[{"nome": "API Gateway", "quantidade": 1, "precoUnitario": 42000}]'::jsonb,
    42000.00,
    42000.00,
    42000.00,
    'aprovada',
    'avista',
    30,
    '11111111-1111-1111-1111-111111111111',
    TIMESTAMP '2025-03-12 13:00:00',
    TIMESTAMP '2025-03-25 15:00:00'
  ),
  (
    'PROP-2025-009',
    'Dashboard Analytics - Março',
    '{"nome": "DataDriven Corp", "email": "analytics@datadriven.com"}'::jsonb,
    '[{"nome": "Dashboard BI", "quantidade": 1, "precoUnitario": 28000}]'::jsonb,
    28000.00,
    28000.00,
    28000.00,
    'aprovada',
    'avista',
    30,
    '11111111-1111-1111-1111-111111111111',
    TIMESTAMP '2025-03-18 10:00:00',
    TIMESTAMP '2025-03-28 14:00:00'
  ),

-- Abril 2025 (3 propostas - 2 aprovadas, 1 enviada)
  (
    'PROP-2025-010',
    'Website Redesign - Abril',
    '{"nome": "Fashion Brand SA", "email": "marketing@fashionbrand.com"}'::jsonb,
    '[{"nome": "Redesign Completo", "quantidade": 1, "precoUnitario": 52000}]'::jsonb,
    52000.00,
    52000.00,
    52000.00,
    'aprovada',
    'parcelado',
    45,
    '11111111-1111-1111-1111-111111111111',
    TIMESTAMP '2025-04-05 09:00:00',
    TIMESTAMP '2025-04-18 16:00:00'
  ),
  (
    'PROP-2025-011',
    'SEO e Marketing Digital - Abril',
    '{"nome": "GrowthHack LTDA", "email": "seo@growthhack.com"}'::jsonb,
    '[{"nome": "Campanha SEO", "quantidade": 6, "precoUnitario": 6300}]'::jsonb,
    38000.00,
    38000.00,
    38000.00,
    'enviada',
    'parcelado',
    30,
    '11111111-1111-1111-1111-111111111111',
    TIMESTAMP '2025-04-10 11:00:00',
    TIMESTAMP '2025-04-12 09:00:00'
  ),
  (
    'PROP-2025-012',
    'Mobile App MVP - Abril',
    '{"nome": "StartupX Ventures", "email": "founders@startupx.com"}'::jsonb,
    '[{"nome": "MVP Development", "quantidade": 1, "precoUnitario": 65000}]'::jsonb,
    65000.00,
    65000.00,
    65000.00,
    'aprovada',
    'parcelado',
    60,
    '11111111-1111-1111-1111-111111111111',
    TIMESTAMP '2025-04-18 14:00:00',
    TIMESTAMP '2025-04-28 17:00:00'
  )
ON CONFLICT (numero) DO NOTHING;

-- Confirmar inserção
SELECT 
  'Total de propostas: ' || COUNT(*) as resultado
FROM propostas
WHERE empresa_id = '11111111-1111-1111-1111-111111111111'

UNION ALL

SELECT 
  'Propostas aprovadas: ' || COUNT(*) as resultado
FROM propostas
WHERE empresa_id = '11111111-1111-1111-1111-111111111111'
  AND status = 'aprovada'

UNION ALL

SELECT 
  'Propostas enviadas: ' || COUNT(*) as resultado
FROM propostas
WHERE empresa_id = '11111111-1111-1111-1111-111111111111'
  AND status = 'enviada'

UNION ALL

SELECT 
  'Propostas rejeitadas: ' || COUNT(*) as resultado
FROM propostas
WHERE empresa_id = '11111111-1111-1111-1111-111111111111'
  AND status = 'rejeitada';

-- Ver resumo por mês
SELECT 
  TO_CHAR("atualizadaEm", 'Mon/YYYY') as mes,
  status,
  COUNT(*) as quantidade,
  SUM(valor) as total_valor
FROM propostas
WHERE empresa_id = '11111111-1111-1111-1111-111111111111'
GROUP BY TO_CHAR("atualizadaEm", 'Mon/YYYY'), EXTRACT(MONTH FROM "atualizadaEm"), status
ORDER BY EXTRACT(MONTH FROM "atualizadaEm"), status;
