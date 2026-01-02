-- ==========================================
-- FIX: Corrigir UUID da Empresa
-- ==========================================
-- Este script corrige o UUID da empresa para um valor conhecido
-- e atualiza todos os usuários para usarem essa empresa

-- 1. Criar/atualizar empresa com UUID conhecido
INSERT INTO empresas (
  id, 
  nome, 
  slug, 
  cnpj, 
  email, 
  telefone, 
  endereco, 
  cidade, 
  estado, 
  cep,
  subdominio,
  ativo, 
  plano, 
  created_at, 
  updated_at
) VALUES (
  '550e8400-e29b-41d4-a716-446655440000', -- UUID fixo e válido
  'Conect CRM Demo', 
  'conectcrm-demo', 
  '11.222.333/0001-44', 
  'contato@conectcrm.com', 
  '(11) 99999-8888',
  'Av. Tecnologia, 456',
  'São Paulo',
  'SP',
  '01234-567',
  'demo',
  true, 
  'premium', 
  NOW(), 
  NOW()
) 
ON CONFLICT (id) DO UPDATE SET
  nome = EXCLUDED.nome,
  slug = EXCLUDED.slug,
  email = EXCLUDED.email,
  telefone = EXCLUDED.telefone,
  endereco = EXCLUDED.endereco,
  cidade = EXCLUDED.cidade,
  estado = EXCLUDED.estado,
  cep = EXCLUDED.cep,
  subdominio = EXCLUDED.subdominio,
  ativo = EXCLUDED.ativo,
  plano = EXCLUDED.plano,
  updated_at = NOW();

-- 2. Atualizar usuário admin para usar essa empresa
UPDATE users 
SET empresa_id = '550e8400-e29b-41d4-a716-446655440000'
WHERE email = 'admin@conectsuite.com.br';

-- 3. Verificar resultado
SELECT 
  u.id, 
  u.nome, 
  u.email, 
  u.role, 
  u.empresa_id,
  e.nome as empresa_nome
FROM users u
LEFT JOIN empresas e ON e.id = u.empresa_id
WHERE u.email = 'admin@conectsuite.com.br';

-- 4. Criar módulos para essa empresa (se não existirem)
INSERT INTO empresa_modulos (empresa_id, modulo, ativo, plano)
VALUES 
  ('550e8400-e29b-41d4-a716-446655440000', 'ATENDIMENTO', true, 'premium'),
  ('550e8400-e29b-41d4-a716-446655440000', 'COMERCIAL', true, 'premium'),
  ('550e8400-e29b-41d4-a716-446655440000', 'FINANCEIRO', true, 'premium'),
  ('550e8400-e29b-41d4-a716-446655440000', 'GESTAO', true, 'premium')
ON CONFLICT (empresa_id, modulo) DO UPDATE SET
  ativo = EXCLUDED.ativo,
  plano = EXCLUDED.plano;

-- Mensagem de sucesso
SELECT '✅ Empresa criada/atualizada com UUID: 550e8400-e29b-41d4-a716-446655440000' as resultado;
SELECT '✅ Usuário admin@conectsuite.com.br atualizado' as resultado;
SELECT '✅ Faça logout e login novamente no frontend' as instrucao;
