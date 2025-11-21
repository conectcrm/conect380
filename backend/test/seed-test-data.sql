-- ============================================
-- Seed de Dados para Testes E2E Multi-Tenancy
-- ============================================
-- Executar ANTES dos testes E2E
-- Cria 2 empresas e usuários de teste

-- Limpar dados de teste anteriores (opcional)
-- DELETE FROM users WHERE email IN ('admin@empresa1.com', 'admin@empresa2.com');
-- DELETE FROM empresas WHERE nome IN ('Empresa Teste 1', 'Empresa Teste 2');

-- ============================================
-- 1. Criar Empresas de Teste
-- ============================================

-- Empresa 1
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
)
VALUES (
  '11111111-1111-1111-1111-111111111111',
  'Empresa Teste 1',
  'empresa-teste-1',
  '11111111000111',
  'contato@empresa1test.com',
  '11999999991',
  'Rua Teste 1, 123',
  'São Paulo',
  'SP',
  '01000-000',
  'empresa1test',
  true,
  'starter',
  NOW(),
  NOW()
)
ON CONFLICT (cnpj) DO UPDATE SET
  nome = EXCLUDED.nome,
  updated_at = NOW();

-- Empresa 2
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
)
VALUES (
  '22222222-2222-2222-2222-222222222222',
  'Empresa Teste 2',
  'empresa-teste-2',
  '22222222000122',
  'contato@empresa2test.com',
  '11999999992',
  'Rua Teste 2, 456',
  'São Paulo',
  'SP',
  '02000-000',
  'empresa2test',
  true,
  'starter',
  NOW(),
  NOW()
)
ON CONFLICT (cnpj) DO UPDATE SET
  nome = EXCLUDED.nome,
  updated_at = NOW();

-- ============================================
-- 2. Criar Usuários de Teste
-- ============================================
-- Senha: senha123 (hash bcrypt com salt 10)
-- Hash gerado: $2b$10$K7L1OJ45/4Y2nIvhRVpCe.FTksqZOhHkrPi0a5SWSKtUxqXlsH6G6

-- Usuário Admin da Empresa 1
INSERT INTO users (
  id,
  nome,
  email,
  senha,
  empresa_id,
  role,
  ativo,
  created_at,
  updated_at
)
VALUES (
  gen_random_uuid(),
  'Admin Empresa 1',
  'admin@empresa1.com',
  '$2b$10$K7L1OJ45/4Y2nIvhRVpCe.FTksqZOhHkrPi0a5SWSKtUxqXlsH6G6',
  '11111111-1111-1111-1111-111111111111',
  'admin',
  true,
  NOW(),
  NOW()
)
ON CONFLICT (email) DO UPDATE SET
  nome = EXCLUDED.nome,
  empresa_id = EXCLUDED.empresa_id,
  updated_at = NOW();

-- Usuário Admin da Empresa 2
INSERT INTO users (
  id,
  nome,
  email,
  senha,
  empresa_id,
  role,
  ativo,
  created_at,
  updated_at
)
VALUES (
  gen_random_uuid(),
  'Admin Empresa 2',
  'admin@empresa2.com',
  '$2b$10$K7L1OJ45/4Y2nIvhRVpCe.FTksqZOhHkrPi0a5SWSKtUxqXlsH6G6',
  '22222222-2222-2222-2222-222222222222',
  'admin',
  true,
  NOW(),
  NOW()
)
ON CONFLICT (email) DO UPDATE SET
  nome = EXCLUDED.nome,
  empresa_id = EXCLUDED.empresa_id,
  updated_at = NOW();

-- ============================================
-- 3. Verificar Dados Criados
-- ============================================

SELECT 
  e.id,
  e.nome as empresa,
  e.cnpj,
  u.id as user_id,
  u.nome as usuario,
  u.email,
  u.role
FROM empresas e
LEFT JOIN users u ON u.empresa_id = e.id
WHERE e.nome LIKE 'Empresa Teste%'
ORDER BY e.nome, u.nome;

-- Resultado esperado:
-- +-----------------------+------------------+----------------+-------------+------------------+----------------------+-------+
-- | id                    | empresa          | cnpj           | user_id     | usuario          | email                | role  |
-- +-----------------------+------------------+----------------+-------------+------------------+----------------------+-------+
-- | empresa-teste-1-uuid  | Empresa Teste 1  | 11111111000111 | uuid...     | Admin Empresa 1  | admin@empresa1.com   | admin |
-- | empresa-teste-2-uuid  | Empresa Teste 2  | 22222222000122 | uuid...     | Admin Empresa 2  | admin@empresa2.com   | admin |
-- +-----------------------+------------------+----------------+-------------+------------------+----------------------+-------+

-- ============================================
-- 4. Credenciais para Testes
-- ============================================

/*
EMPRESA 1:
  Email: admin@empresa1.com
  Senha: senha123
  Empresa ID: 11111111-1111-1111-1111-111111111111

EMPRESA 2:
  Email: admin@empresa2.com
  Senha: senha123
  Empresa ID: 22222222-2222-2222-2222-222222222222
*/

-- ============================================
-- 5. Limpar Dados de Teste (Após Testes)
-- ============================================

-- Descomentar e executar após os testes E2E:

-- DELETE FROM leads WHERE empresa_id IN ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222');
-- DELETE FROM oportunidades WHERE empresa_id IN ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222');
-- DELETE FROM clientes WHERE empresa_id IN ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222');
-- DELETE FROM users WHERE email IN ('admin@empresa1.com', 'admin@empresa2.com');
-- DELETE FROM empresas WHERE id IN ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222');
