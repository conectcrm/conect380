-- Script simplificado para inserir propostas de teste
-- Execute: psql -h localhost -p 5434 -U conectcrm -d conectcrm_db -f scripts/inserir-dados-simples.sql

-- Janeiro 2025
INSERT INTO propostas (numero, titulo, cliente, produtos, subtotal, total, valor, status, "formaPagamento", empresa_id, "criadaEm", "atualizadaEm") VALUES 
('PROP-2025-001', 'Implementação CRM', '{"nome": "Tech Solutions"}'::jsonb, '[{"nome": "CRM"}]'::jsonb, 55000, 55000, 55000, 'aprovada', 'avista', '11111111-1111-1111-1111-111111111111', '2025-01-10', '2025-01-25')
ON CONFLICT (numero) DO NOTHING;

INSERT INTO propostas (numero, titulo, cliente, produtos, subtotal, total, valor, status, "formaPagamento", empresa_id, "criadaEm", "atualizadaEm") VALUES 
('PROP-2025-002', 'Consultoria', '{"nome": "Inovacao Corp"}'::jsonb, '[{"nome": "Consultoria"}]'::jsonb, 70000, 70000, 70000, 'aprovada', 'boleto', '11111111-1111-1111-1111-111111111111', '2025-01-15', '2025-01-28')
ON CONFLICT (numero) DO NOTHING;

-- Fevereiro 2025
INSERT INTO propostas (numero, titulo, cliente, produtos, subtotal, total, valor, status, "formaPagamento", empresa_id, "criadaEm", "atualizadaEm") VALUES 
('PROP-2025-003', 'App Mobile', '{"nome": "Digital Plus"}'::jsonb, '[{"nome": "App"}]'::jsonb, 85000, 85000, 85000, 'aprovada', 'cartao', '11111111-1111-1111-1111-111111111111', '2025-02-05', '2025-02-20')
ON CONFLICT (numero) DO NOTHING;

INSERT INTO propostas (numero, titulo, cliente, produtos, subtotal, total, valor, status, "formaPagamento", empresa_id, "criadaEm", "atualizadaEm") VALUES 
('PROP-2025-004', 'Suporte Anual', '{"nome": "StartupTech"}'::jsonb, '[{"nome": "Suporte"}]'::jsonb, 30000, 30000, 30000, 'aprovada', 'pix', '11111111-1111-1111-1111-111111111111', '2025-02-12', '2025-02-28')
ON CONFLICT (numero) DO NOTHING;

INSERT INTO propostas (numero, titulo, cliente, produtos, subtotal, total, valor, status, "formaPagamento", empresa_id, "criadaEm", "atualizadaEm") VALUES 
('PROP-2025-005', 'Cloud Setup', '{"nome": "MegaCorp"}'::jsonb, '[{"nome": "AWS"}]'::jsonb, 35000, 35000, 35000, 'enviada', 'avista', '11111111-1111-1111-1111-111111111111', '2025-02-22', '2025-02-22')
ON CONFLICT (numero) DO NOTHING;

-- Março 2025
INSERT INTO propostas (numero, titulo, cliente, produtos, subtotal, total, valor, status, "formaPagamento", empresa_id, "criadaEm", "atualizadaEm") VALUES 
('PROP-2025-006', 'Migracao Sistemas', '{"nome": "Legacy Systems"}'::jsonb, '[{"nome": "Migracao"}]'::jsonb, 95000, 95000, 95000, 'aprovada', 'boleto', '11111111-1111-1111-1111-111111111111', '2025-03-01', '2025-03-15')
ON CONFLICT (numero) DO NOTHING;

INSERT INTO propostas (numero, titulo, cliente, produtos, subtotal, total, valor, status, "formaPagamento", empresa_id, "criadaEm", "atualizadaEm") VALUES 
('PROP-2025-007', 'Treinamento', '{"nome": "SmallBiz"}'::jsonb, '[{"nome": "Treinamento"}]'::jsonb, 15000, 15000, 15000, 'rejeitada', 'avista', '11111111-1111-1111-1111-111111111111', '2025-03-08', '2025-03-18')
ON CONFLICT (numero) DO NOTHING;

INSERT INTO propostas (numero, titulo, cliente, produtos, subtotal, total, valor, status, "formaPagamento", empresa_id, "criadaEm", "atualizadaEm") VALUES 
('PROP-2025-008', 'API Gateway', '{"nome": "E-commerce Plus"}'::jsonb, '[{"nome": "API"}]'::jsonb, 42000, 42000, 42000, 'aprovada', 'pix', '11111111-1111-1111-1111-111111111111', '2025-03-12', '2025-03-25')
ON CONFLICT (numero) DO NOTHING;

INSERT INTO propostas (numero, titulo, cliente, produtos, subtotal, total, valor, status, "formaPagamento", empresa_id, "criadaEm", "atualizadaEm") VALUES 
('PROP-2025-009', 'Dashboard BI', '{"nome": "DataDriven Corp"}'::jsonb, '[{"nome": "Dashboard"}]'::jsonb, 28000, 28000, 28000, 'aprovada', 'cartao', '11111111-1111-1111-1111-111111111111', '2025-03-18', '2025-03-28')
ON CONFLICT (numero) DO NOTHING;

-- Abril 2025
INSERT INTO propostas (numero, titulo, cliente, produtos, subtotal, total, valor, status, "formaPagamento", empresa_id, "criadaEm", "atualizadaEm") VALUES 
('PROP-2025-010', 'Website Redesign', '{"nome": "Fashion Brand"}'::jsonb, '[{"nome": "Web"}]'::jsonb, 52000, 52000, 52000, 'aprovada', 'boleto', '11111111-1111-1111-1111-111111111111', '2025-04-05', '2025-04-18')
ON CONFLICT (numero) DO NOTHING;

INSERT INTO propostas (numero, titulo, cliente, produtos, subtotal, total, valor, status, "formaPagamento", empresa_id, "criadaEm", "atualizadaEm") VALUES 
('PROP-2025-011', 'SEO Marketing', '{"nome": "GrowthHack LTDA"}'::jsonb, '[{"nome": "SEO"}]'::jsonb, 38000, 38000, 38000, 'enviada', 'recorrente', '11111111-1111-1111-1111-111111111111', '2025-04-10', '2025-04-12')
ON CONFLICT (numero) DO NOTHING;

INSERT INTO propostas (numero, titulo, cliente, produtos, subtotal, total, valor, status, "formaPagamento", empresa_id, "criadaEm", "atualizadaEm") VALUES 
('PROP-2025-012', 'MVP Development', '{"nome": "StartupX Ventures"}'::jsonb, '[{"nome": "MVP"}]'::jsonb, 65000, 65000, 65000, 'aprovada', 'cartao', '11111111-1111-1111-1111-111111111111', '2025-04-18', '2025-04-28')
ON CONFLICT (numero) DO NOTHING;

-- Resumo
SELECT 'Inseridas: ' || COUNT(*) as resultado FROM propostas WHERE empresa_id = '11111111-1111-1111-1111-111111111111';
