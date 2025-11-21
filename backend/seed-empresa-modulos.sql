-- Script para popular tabela empresa_modulos com plano ENTERPRISE para todas as empresas
-- Executar este script manualmente no banco de dados

-- 1. Verificar se a tabela existe
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'empresa_modulos'
);

-- 2. Se não existir, criar a tabela
CREATE TABLE IF NOT EXISTS empresa_modulos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  modulo VARCHAR(50) NOT NULL,
  ativo BOOLEAN NOT NULL DEFAULT true,
  data_ativacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  data_expiracao TIMESTAMP NULL,
  plano VARCHAR(20) NOT NULL DEFAULT 'STARTER',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT UQ_empresa_modulo UNIQUE (empresa_id, modulo)
);

-- 3. Criar índices
CREATE INDEX IF NOT EXISTS IDX_empresa_modulos_empresa ON empresa_modulos(empresa_id);
CREATE INDEX IF NOT EXISTS IDX_empresa_modulos_modulo ON empresa_modulos(modulo);
CREATE INDEX IF NOT EXISTS IDX_empresa_modulos_ativo ON empresa_modulos(ativo);

-- 4. Limpar dados existentes (se houver)
TRUNCATE TABLE empresa_modulos;

-- 5. Popular com plano ENTERPRISE (todos os módulos) para todas as empresas
INSERT INTO empresa_modulos (empresa_id, modulo, ativo, plano)
SELECT 
  e.id,
  modulo.nome,
  true,
  'ENTERPRISE'
FROM empresas e
CROSS JOIN (
  VALUES 
    ('ATENDIMENTO'),
    ('CRM'),
    ('VENDAS'),
    ('FINANCEIRO'),
    ('BILLING'),
    ('ADMINISTRACAO')
) AS modulo(nome)
ON CONFLICT (empresa_id, modulo) 
DO UPDATE SET 
  ativo = true,
  plano = 'ENTERPRISE',
  updated_at = CURRENT_TIMESTAMP;

-- 6. Verificar resultado
SELECT 
  e.nome_fantasia,
  e.razao_social,
  em.modulo,
  em.ativo,
  em.plano,
  em.data_ativacao
FROM empresa_modulos em
JOIN empresas e ON e.id = em.empresa_id
ORDER BY e.nome_fantasia, em.modulo;

-- 7. Contar módulos por empresa
SELECT 
  e.nome_fantasia,
  COUNT(*) as total_modulos,
  SUM(CASE WHEN em.ativo THEN 1 ELSE 0 END) as modulos_ativos
FROM empresas e
LEFT JOIN empresa_modulos em ON em.empresa_id = e.id
GROUP BY e.id, e.nome_fantasia
ORDER BY e.nome_fantasia;
