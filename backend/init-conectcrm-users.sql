-- ==========================================
-- SCRIPT DE DADOS INICIAIS - CONECT CRM
-- ==========================================
-- Execute este script no PostgreSQL Docker para criar os usuários iniciais

-- 1. Criar empresa padrão ConectCRM
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
  ativo, 
  plano, 
  created_at, 
  updated_at
) VALUES (
  gen_random_uuid(), 
  'Conect CRM Demo', 
  'conectcrm-demo', 
  '11.222.333/0001-44', 
  'contato@conectcrm.com', 
  '(11) 99999-8888',
  'Av. Tecnologia, 456',
  'São Paulo',
  'SP',
  '01234-567',
  true, 
  'premium', 
  NOW(), 
  NOW()
) ON CONFLICT (cnpj) DO NOTHING;

-- 2. Criar usuário Administrador
-- Senha: admin123 (hash bcrypt)
INSERT INTO users (
  id, 
  nome, 
  email, 
  senha, 
  role, 
  ativo, 
  empresa_id, 
  created_at, 
  updated_at
) VALUES (
  gen_random_uuid(),
  'Administrador',
  'admin@conectcrm.com',
  '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- admin123
  'admin',
  true,
  (SELECT id FROM empresas WHERE cnpj = '11.222.333/0001-44'),
  NOW(),
  NOW()
) ON CONFLICT (email) DO NOTHING;

-- 3. Criar usuário Gerente
-- Senha: gerente123 (hash bcrypt)
INSERT INTO users (
  id, 
  nome, 
  email, 
  senha, 
  role, 
  ativo, 
  empresa_id, 
  created_at, 
  updated_at
) VALUES (
  gen_random_uuid(),
  'Ana Silva',
  'gerente@conectcrm.com',
  '$2a$10$N9qo8uLOickgx2ZMRZoMye1XyLp5UkKKWk1iEz.mADl3G3urCG.Q6', -- gerente123
  'manager',
  true,
  (SELECT id FROM empresas WHERE cnpj = '11.222.333/0001-44'),
  NOW(),
  NOW()
) ON CONFLICT (email) DO NOTHING;

-- 4. Criar usuário Vendedor
-- Senha: vendedor123 (hash bcrypt)
INSERT INTO users (
  id, 
  nome, 
  email, 
  senha, 
  role, 
  ativo, 
  empresa_id, 
  created_at, 
  updated_at
) VALUES (
  gen_random_uuid(),
  'Carlos Vendas',
  'vendedor@conectcrm.com',
  '$2a$10$E4B0L2sTVzRGNr8Q.7LWSeGyCT0fI9d0VYAd0WJ9ZZzKPsf1QCvH6', -- vendedor123
  'vendedor',
  true,
  (SELECT id FROM empresas WHERE cnpj = '11.222.333/0001-44'),
  NOW(),
  NOW()
) ON CONFLICT (email) DO NOTHING;

-- 5. Criar usuário Usuário Comum
-- Senha: user123 (hash bcrypt)
INSERT INTO users (
  id, 
  nome, 
  email, 
  senha, 
  role, 
  ativo, 
  empresa_id, 
  created_at, 
  updated_at
) VALUES (
  gen_random_uuid(),
  'Pedro Usuario',
  'user@conectcrm.com',
  '$2a$10$CwTycUXWue0Thq9StjUM0uBK1kBx4fYVQLnXCvSFxSkLrzrI6SOwm', -- user123
  'user',
  true,
  (SELECT id FROM empresas WHERE cnpj = '11.222.333/0001-44'),
  NOW(),
  NOW()
) ON CONFLICT (email) DO NOTHING;

-- ==========================================
-- VERIFICAR SE OS USUÁRIOS FORAM CRIADOS
-- ==========================================

SELECT 
  u.nome,
  u.email,
  u.role,
  u.ativo,
  e.nome as empresa_nome
FROM users u
JOIN empresas e ON u.empresa_id = e.id
WHERE e.cnpj = '11.222.333/0001-44'
ORDER BY u.role DESC;

-- ==========================================
-- CREDENCIAIS PARA ACESSAR O CONECT CRM:
-- ==========================================
-- 
-- 👑 ADMINISTRADOR:
--    Email: admin@conectcrm.com
--    Senha: admin123
--    Permissões: Todas (gerenciar sistema, usuários, empresas)
--
-- 👨‍💼 GERENTE:
--    Email: gerente@conectcrm.com  
--    Senha: gerente123
--    Permissões: Gerenciar equipe, relatórios, clientes
--
-- 💼 VENDEDOR:
--    Email: vendedor@conectcrm.com
--    Senha: vendedor123
--    Permissões: Gerenciar clientes, propostas, vendas
--
-- 👤 USUÁRIO:
--    Email: user@conectcrm.com
--    Senha: user123
--    Permissões: Acesso básico, visualizar dados
--
-- ==========================================
