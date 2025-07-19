-- ==========================================
-- SCRIPT DE DADOS INICIAIS - FÊNIX CRM
-- ==========================================
-- Execute este script no PostgreSQL para criar os usuários iniciais

-- 1. Criar empresa padrão
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
  'Fênix Tecnologia', 
  'fenix-tecnologia', 
  '12.345.678/0001-99', 
  'contato@fenixtecnologia.com.br', 
  '(11) 99999-9999',
  'Rua das Empresas, 123',
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
  'admin@fenixcrm.com',
  '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- admin123
  'admin',
  true,
  (SELECT id FROM empresas WHERE cnpj = '12.345.678/0001-99'),
  NOW(),
  NOW()
) ON CONFLICT (email) DO NOTHING;

-- 3. Criar usuário Gerente
-- Senha: manager123 (hash bcrypt)
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
  'Maria Santos',
  'maria@fenixcrm.com',
  '$2a$10$N9qo8uLOickgx2ZMRZoMye1XyLp5UkKKWk1iEz.mADl3G3urCG.Q6', -- manager123
  'manager',
  true,
  (SELECT id FROM empresas WHERE cnpj = '12.345.678/0001-99'),
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
  'João Silva',
  'joao@fenixcrm.com',
  '$2a$10$E4B0L2sTVzRGNr8Q.7LWSeGyCT0fI9d0VYAd0WJ9ZZzKPsf1QCvH6', -- vendedor123
  'vendedor',
  true,
  (SELECT id FROM empresas WHERE cnpj = '12.345.678/0001-99'),
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
WHERE e.cnpj = '12.345.678/0001-99';

-- ==========================================
-- CREDENCIAIS CRIADAS:
-- ==========================================
-- Email: admin@fenixcrm.com     | Senha: admin123
-- Email: maria@fenixcrm.com     | Senha: manager123  
-- Email: joao@fenixcrm.com      | Senha: vendedor123
-- ==========================================
