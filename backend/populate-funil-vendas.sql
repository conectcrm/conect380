-- Script para criar dados de exemplo no funil de vendas
-- Execute este script no PostgreSQL após criar as tabelas

-- Inserir usuários de exemplo (vendedores)
INSERT INTO users (id, nome, email, password, role, empresa_id, ativo, email_verificado, created_at, updated_at) 
VALUES 
  ('vendor-1', 'Ana Silva', 'ana.silva@conectcrm.com', '$2b$10$9VrJJLfEOsLkFOVwDNvkQOVGjZEcnMyLJkJxMrJmyHnE9qz2QgJ9q', 'vendedor', 1, true, true, NOW(), NOW()),
  ('vendor-2', 'Carlos Vendas', 'carlos.vendas@conectcrm.com', '$2b$10$9VrJJLfEOsLkFOVwDNvkQOVGjZEcnMyLJkJxMrJmyHnE9qz2QgJ9q', 'vendedor', 1, true, true, NOW(), NOW()),
  ('manager-1', 'Roberto Manager', 'roberto.manager@conectcrm.com', '$2b$10$9VrJJLfEOsLkFOVwDNvkQOVGjZEcnMyLJkJxMrJmyHnE9qz2QgJ9q', 'manager', 1, true, true, NOW(), NOW())
ON CONFLICT (email) DO NOTHING;

-- Inserir clientes de exemplo
INSERT INTO clientes (nome, email, telefone, empresa, endereco, cidade, estado, cep, observacoes, ativo, empresa_id, created_at, updated_at)
VALUES 
  ('TechCorp Solutions', 'contato@techcorp.com', '(11) 9999-1111', 'TechCorp Solutions', 'Av. Paulista, 1000', 'São Paulo', 'SP', '01310-100', 'Cliente premium de tecnologia', true, 1, NOW(), NOW()),
  ('Inovação Digital Ltda', 'vendas@inovacaodigital.com', '(21) 8888-2222', 'Inovação Digital Ltda', 'Rua das Flores, 200', 'Rio de Janeiro', 'RJ', '22071-900', 'Startup de transformação digital', true, 1, NOW(), NOW()),
  ('Empresa Familiar S/A', 'comercial@empresafamiliar.com', '(31) 7777-3333', 'Empresa Familiar S/A', 'Rua do Comércio, 300', 'Belo Horizonte', 'MG', '30112-000', 'Empresa tradicional em expansão', true, 1, NOW(), NOW()),
  ('StartupX', 'ceo@startupx.com', '(11) 6666-4444', 'StartupX', 'Rua dos Empreendedores, 50', 'São Paulo', 'SP', '04038-001', 'Startup de IA', true, 1, NOW(), NOW()),
  ('Global Services Inc', 'brazil@globalservices.com', '(11) 5555-5555', 'Global Services Inc', 'Av. Faria Lima, 1500', 'São Paulo', 'SP', '01452-000', 'Multinacional americana', true, 1, NOW(), NOW())
ON CONFLICT (email) DO NOTHING;

-- Inserir oportunidades de exemplo
INSERT INTO oportunidades (titulo, descricao, valor, probabilidade, estagio, prioridade, origem, tags, data_fechamento_esperado, responsavel_id, cliente_id, nome_contato, email_contato, telefone_contato, empresa_contato, cargo_contato, observacoes, ativo, empresa_id, created_at, updated_at)
VALUES 
  -- LEADS (prospects iniciais)
  ('Sistema CRM Enterprise', 'Implementação de sistema CRM completo para empresa de tecnologia', 150000.00, 25, 'leads', 'alta', 'website', 'CRM,Enterprise,Tecnologia', '2025-09-15', 'vendor-1', 1, 'João Silva', 'joao.silva@techcorp.com', '(11) 9999-1111', 'TechCorp Solutions', 'CTO', 'Cliente muito interessado em automação', true, 1, NOW(), NOW()),
  
  ('Consultoria Digital', 'Projeto de transformação digital para empresa tradicional', 80000.00, 15, 'leads', 'media', 'indicacao', 'Consultoria,Digital,Transformação', '2025-10-30', 'vendor-2', 3, 'Maria Santos', 'maria.santos@empresafamiliar.com', '(31) 7777-3333', 'Empresa Familiar S/A', 'Diretora de TI', 'Primeira reunião agendada', true, 1, NOW(), NOW()),
  
  ('Automação de Vendas', 'Sistema de automação para equipe comercial', 45000.00, 20, 'leads', 'baixa', 'linkedin', 'Automação,Vendas,CRM', '2025-08-20', 'vendor-1', 4, 'Pedro Startup', 'pedro@startupx.com', '(11) 6666-4444', 'StartupX', 'CEO', 'Startup em crescimento rápido', true, 1, NOW(), NOW()),

  -- QUALIFICATION (qualificados)
  ('Plataforma de Atendimento', 'Sistema integrado de atendimento ao cliente', 120000.00, 45, 'qualification', 'alta', 'website', 'Atendimento,Integração,Suporte', '2025-08-30', 'vendor-2', 2, 'Ana Costa', 'ana.costa@inovacaodigital.com', '(21) 8888-2222', 'Inovação Digital Ltda', 'Gerente de Operações', 'Budget aprovado, definindo escopo', true, 1, NOW(), NOW()),
  
  ('Dashboard Executivo', 'Painel de controle gerencial personalizado', 65000.00, 40, 'qualification', 'media', 'evento', 'Dashboard,BI,Executivo', '2025-09-10', 'vendor-1', 5, 'Robert Johnson', 'robert.johnson@globalservices.com', '(11) 5555-5555', 'Global Services Inc', 'VP de Operações', 'Multinacional com processo rigoroso', true, 1, NOW(), NOW()),

  -- PROPOSAL (propostas enviadas)
  ('Migração de Sistema', 'Migração do sistema legado para plataforma moderna', 200000.00, 65, 'proposal', 'alta', 'indicacao', 'Migração,Modernização,Sistema', '2025-07-31', 'vendor-2', 1, 'Carlos Tech', 'carlos.tech@techcorp.com', '(11) 9999-1111', 'TechCorp Solutions', 'Diretor de TI', 'Proposta técnica aprovada, aguardando comercial', true, 1, NOW(), NOW()),
  
  ('Portal do Cliente', 'Desenvolvimento de portal self-service para clientes', 90000.00, 60, 'proposal', 'media', 'website', 'Portal,Self-service,Cliente', '2025-08-15', 'vendor-1', 2, 'Fernando Digital', 'fernando@inovacaodigital.com', '(21) 8888-2222', 'Inovação Digital Ltda', 'Product Owner', 'Proposta enviada, aguardando feedback', true, 1, NOW(), NOW()),

  -- NEGOTIATION (em negociação)
  ('Integração ERP-CRM', 'Integração entre sistemas ERP e CRM existentes', 110000.00, 75, 'negotiation', 'alta', 'evento', 'Integração,ERP,CRM', '2025-07-25', 'vendor-2', 3, 'Sandra Familiar', 'sandra@empresafamiliar.com', '(31) 7777-3333', 'Empresa Familiar S/A', 'CFO', 'Negociando prazo e forma de pagamento', true, 1, NOW(), NOW()),
  
  ('App Mobile Vendas', 'Aplicativo mobile para força de vendas', 75000.00, 80, 'negotiation', 'media', 'linkedin', 'Mobile,App,Vendas', '2025-08-05', 'vendor-1', 4, 'Lucas Mobile', 'lucas@startupx.com', '(11) 6666-4444', 'StartupX', 'Head of Sales', 'Últimos ajustes no contrato', true, 1, NOW(), NOW()),

  -- WON (ganhas)
  ('Sistema de Relatórios', 'Plataforma de relatórios e analytics avançados', 85000.00, 100, 'won', 'alta', 'indicacao', 'Relatórios,Analytics,BI', '2025-06-30', 'vendor-2', 5, 'Michael Global', 'michael@globalservices.com', '(11) 5555-5555', 'Global Services Inc', 'Analytics Manager', 'Contrato assinado! Início imediato', true, 1, NOW(), NOW()),

  -- LOST (perdidas)
  ('Chatbot Inteligente', 'Implementação de chatbot com IA para atendimento', 55000.00, 0, 'lost', 'baixa', 'website', 'Chatbot,IA,Atendimento', '2025-06-15', 'vendor-1', 2, 'Paulo Bot', 'paulo@inovacaodigital.com', '(21) 8888-2222', 'Inovação Digital Ltda', 'Tech Lead', 'Cliente optou por solução interna', true, 1, NOW(), NOW())
ON CONFLICT DO NOTHING;

-- Inserir atividades de exemplo
INSERT INTO atividades (tipo, descricao, data_atividade, oportunidade_id, criado_por_id, created_at)
VALUES 
  ('note', 'Primeira conversa - cliente muito interessado em modernizar processos', NOW() - INTERVAL '2 days', 1, 'vendor-1', NOW() - INTERVAL '2 days'),
  ('call', 'Ligação de follow-up - agendada reunião técnica', NOW() - INTERVAL '1 day', 1, 'vendor-1', NOW() - INTERVAL '1 day'),
  ('meeting', 'Reunião de apresentação da solução', NOW(), 4, 'vendor-2', NOW()),
  ('email', 'Envio de proposta técnica detalhada', NOW() - INTERVAL '3 days', 6, 'vendor-2', NOW() - INTERVAL '3 days'),
  ('note', 'Cliente solicitou ajustes no cronograma', NOW() - INTERVAL '1 day', 8, 'vendor-2', NOW() - INTERVAL '1 day'),
  ('call', 'Negociação final - cliente aceitou condições', NOW() - INTERVAL '5 days', 10, 'vendor-2', NOW() - INTERVAL '5 days'),
  ('note', 'Contrato assinado! Projeto aprovado', NOW() - INTERVAL '1 week', 10, 'vendor-2', NOW() - INTERVAL '1 week'),
  ('note', 'Cliente decidiu por solução concorrente', NOW() - INTERVAL '10 days', 11, 'vendor-1', NOW() - INTERVAL '10 days')
ON CONFLICT DO NOTHING;

-- Verificar os dados inseridos
SELECT 
  'Oportunidades por estágio' as info,
  estagio,
  COUNT(*) as quantidade,
  SUM(valor) as valor_total
FROM oportunidades 
WHERE ativo = true 
GROUP BY estagio
ORDER BY 
  CASE estagio
    WHEN 'leads' THEN 1
    WHEN 'qualification' THEN 2
    WHEN 'proposal' THEN 3
    WHEN 'negotiation' THEN 4
    WHEN 'won' THEN 5
    WHEN 'lost' THEN 6
  END;

SELECT 'Resumo do funil' as info, COUNT(*) as total_oportunidades, SUM(valor) as valor_total_pipeline FROM oportunidades WHERE ativo = true;
