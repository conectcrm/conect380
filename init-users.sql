-- ==========================================
-- SCRIPT DE DADOS INICIAIS - CONECT CRM
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
  'Conect Tecnologia', 
  'conect-tecnologia', 
  '12.345.678/0001-99', 
  'contato@conectcrm.com.br', 
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
  'admin@conectsuite.com.br',
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
  'maria@conectcrm.com',
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
  'joao@conectcrm.com',
  '$2a$10$E4B0L2sTVzRGNr8Q.7LWSeGyCT0fI9d0VYAd0WJ9ZZzKPsf1QCvH6', -- vendedor123
  'vendedor',
  true,
  (SELECT id FROM empresas WHERE cnpj = '12.345.678/0001-99'),
  NOW(),
  NOW()
) ON CONFLICT (email) DO NOTHING;

-- ==========================================
-- CRIAR REGISTROS DE ATIVIDADES DE USUÁRIOS
-- ==========================================

-- Criar tabela de atividades de usuários, se ela não existir
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_activities') THEN
    CREATE TABLE user_activities (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      usuario_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      empresa_id UUID NOT NULL,
      tipo VARCHAR(50) NOT NULL,
      descricao VARCHAR(255) NOT NULL,
      detalhes TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    );
  END IF;
END
$$;

-- Inserir atividades para o administrador
INSERT INTO user_activities (
  usuario_id,
  empresa_id,
  tipo,
  descricao,
  created_at
) VALUES 
(
  (SELECT id FROM users WHERE email = 'admin@conectsuite.com.br'),
  (SELECT empresa_id FROM users WHERE email = 'admin@conectsuite.com.br'),
  'LOGIN',
  'Efetuou login no sistema',
  NOW() - INTERVAL '2 hours'
),
(
  (SELECT id FROM users WHERE email = 'admin@conectsuite.com.br'),
  (SELECT empresa_id FROM users WHERE email = 'admin@conectsuite.com.br'),
  'CRIACAO',
  'Criou novo usuário: Carlos Ferreira',
  NOW() - INTERVAL '1 day'
),
(
  (SELECT id FROM users WHERE email = 'admin@conectsuite.com.br'),
  (SELECT empresa_id FROM users WHERE email = 'admin@conectsuite.com.br'),
  'ALTERACAO_STATUS',
  'Alterou status de usuário para inativo',
  NOW() - INTERVAL '3 days'
);

-- Inserir atividades para o gerente
INSERT INTO user_activities (
  usuario_id,
  empresa_id,
  tipo,
  descricao,
  created_at
) VALUES 
(
  (SELECT id FROM users WHERE email = 'maria@conectcrm.com'),
  (SELECT empresa_id FROM users WHERE email = 'maria@conectcrm.com'),
  'LOGIN',
  'Efetuou login no sistema',
  NOW() - INTERVAL '1 hour'
),
(
  (SELECT id FROM users WHERE email = 'maria@conectcrm.com'),
  (SELECT empresa_id FROM users WHERE email = 'maria@conectcrm.com'),
  'RESET_SENHA',
  'Redefiniu senha de usuário',
  NOW() - INTERVAL '2 days'
);

-- Inserir atividades para o vendedor
INSERT INTO user_activities (
  usuario_id,
  empresa_id,
  tipo,
  descricao,
  created_at
) VALUES 
(
  (SELECT id FROM users WHERE email = 'joao@conectcrm.com'),
  (SELECT empresa_id FROM users WHERE email = 'joao@conectcrm.com'),
  'LOGIN',
  'Efetuou login no sistema',
  NOW() - INTERVAL '30 minutes'
),
(
  (SELECT id FROM users WHERE email = 'joao@conectcrm.com'),
  (SELECT empresa_id FROM users WHERE email = 'joao@conectcrm.com'),
  'LOGOUT',
  'Saiu do sistema',
  NOW() - INTERVAL '1 day 2 hours'
);

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
-- VERIFICAR ATIVIDADES CRIADAS
-- ==========================================

SELECT 
  u.nome as usuario,
  ua.tipo,
  ua.descricao,
  ua.created_at as data_hora
FROM user_activities ua
JOIN users u ON ua.usuario_id = u.id
ORDER BY ua.created_at DESC;

-- ==========================================
-- CREDENCIAIS CRIADAS:
-- ==========================================
-- Email: admin@conectsuite.com.br     | Senha: admin123
-- Email: maria@conectcrm.com     | Senha: manager123  
-- Email: joao@conectcrm.com      | Senha: vendedor123
-- ==========================================
