-- Script simplificado para criar usuários ConectCRM
-- Respeitando a estrutura real das tabelas

-- 1. Primeiro criar uma empresa
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
  email_verificado,
  created_at,
  updated_at
) VALUES (
  'f47ac10b-58cc-4372-a567-0e02b2c3d479',
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
  true,
  NOW(),
  NOW()
);

-- 2. Criar usuário administrador
INSERT INTO users (
  id,
  nome,
  email,
  senha,
  role,
  empresa_id,
  idioma_preferido,
  ativo,
  created_at,
  updated_at
) VALUES (
  'a47ac10b-58cc-4372-a567-0e02b2c3d480',
  'Administrador ConectCRM',
  'admin@conectcrm.com',
  '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
  'admin',
  'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  'pt-BR',
  true,
  NOW(),
  NOW()
);

-- 3. Criar usuário gerente
INSERT INTO users (
  id,
  nome,
  email,
  senha,
  role,
  empresa_id,
  idioma_preferido,
  ativo,
  created_at,
  updated_at
) VALUES (
  'b47ac10b-58cc-4372-a567-0e02b2c3d481',
  'Ana Silva',
  'gerente@conectcrm.com',
  '$2a$10$N9qo8uLOickgx2ZMRZoMye1XyLp5UkKKWk1iEz.mADl3G3urCG.Q6',
  'manager',
  'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  'pt-BR',
  true,
  NOW(),
  NOW()
);

-- 4. Criar usuário vendedor
INSERT INTO users (
  id,
  nome,
  email,
  senha,
  role,
  empresa_id,
  idioma_preferido,
  ativo,
  created_at,
  updated_at
) VALUES (
  'c47ac10b-58cc-4372-a567-0e02b2c3d482',
  'Carlos Vendas',
  'vendedor@conectcrm.com',
  '$2a$10$E4B0L2sTVzRGNr8Q.7LWSeGyCT0fI9d0VYAd0WJ9ZZzKPsf1QCvH6',
  'vendedor',
  'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  'pt-BR',
  true,
  NOW(),
  NOW()
);

-- Verificar se foi criado corretamente
SELECT 
  u.nome,
  u.email,
  u.role,
  u.ativo,
  e.nome as empresa
FROM users u
JOIN empresas e ON u.empresa_id = e.id;
