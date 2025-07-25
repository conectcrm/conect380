-- Criar empresa de teste se não existir
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
  'f47ac10b-58cc-4372-a567-0e02b2c3d480',
  'Empresa Teste',
  'empresa-teste',
  '12345678000195',
  'contato@empresateste.com',
  '11999999999',
  'Rua Teste, 123',
  'São Paulo',
  'SP',
  '01234567',
  'empresateste',
  true,
  'starter',
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Script para criar usuário de teste
INSERT INTO users (
  id, 
  nome, 
  email, 
  senha, 
  role, 
  empresa_id, 
  ativo, 
  created_at, 
  updated_at
) VALUES (
  'f47ac10b-58cc-4372-a567-0e02b2c3d479', 
  'Admin Teste', 
  'admin@teste.com', 
  '$2b$10$dummy.hash.for.testing.purpose.only', 
  'admin', 
  'f47ac10b-58cc-4372-a567-0e02b2c3d480', 
  true, 
  NOW(), 
  NOW()
) ON CONFLICT (id) DO NOTHING;
