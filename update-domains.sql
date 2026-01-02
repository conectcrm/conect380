-- ==========================================
-- SCRIPT DE ATUALIZAÇÃO DE DOMÍNIOS - CONECT CRM
-- ==========================================
-- Execute este script para atualizar os domínios antigos do Fênix para Conect

-- 1. Atualizar empresa padrão
UPDATE empresas 
SET 
  nome = 'Conect Tecnologia',
  slug = 'conect-tecnologia',
  email = 'contato@conectcrm.com.br',
  updated_at = NOW()
WHERE cnpj = '12.345.678/0001-99' AND nome = 'Fênix Tecnologia';

-- 2. Atualizar usuário Administrador
UPDATE users 
SET 
  email = 'admin@conectsuite.com.br',
  updated_at = NOW()
WHERE email = 'admin@fenixcrm.com';

-- 3. Atualizar usuário Gerente
UPDATE users 
SET 
  email = 'maria@conectcrm.com',
  updated_at = NOW()
WHERE email = 'maria@fenixcrm.com';

-- 4. Atualizar usuário Vendedor
UPDATE users 
SET 
  email = 'joao@conectcrm.com',
  updated_at = NOW()
WHERE email = 'joao@fenixcrm.com';

-- ==========================================
-- VERIFICAR ATUALIZAÇÕES
-- ==========================================

SELECT 
  'Empresa' as tipo,
  nome,
  email,
  slug
FROM empresas 
WHERE cnpj = '12.345.678/0001-99'

UNION ALL

SELECT 
  'Usuário' as tipo,
  u.nome,
  u.email,
  u.role
FROM users u
JOIN empresas e ON u.empresa_id = e.id
WHERE e.cnpj = '12.345.678/0001-99'
ORDER BY tipo, nome;

-- ==========================================
-- CREDENCIAIS ATUALIZADAS:
-- ==========================================
-- Email: admin@conectsuite.com.br     | Senha: admin123
-- Email: maria@conectcrm.com     | Senha: manager123  
-- Email: joao@conectcrm.com      | Senha: vendedor123
-- ==========================================
