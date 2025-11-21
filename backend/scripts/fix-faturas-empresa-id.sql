-- =========================================================
-- SCRIPT DE CORREÇÃO: Adicionar empresa_id em faturas
-- =========================================================
-- Problema: Faturas sem empresa_id causam falha na migration
-- Solução: Associar faturas órfãs à primeira empresa disponível
-- Data: 19/11/2025
-- =========================================================

-- 1. Verificar quantas faturas não têm empresa_id
SELECT 
    COUNT(*) as total_faturas_sem_empresa,
    COUNT(DISTINCT contrato_id) as contratos_distintos
FROM faturas 
WHERE empresa_id IS NULL;

-- 2. Verificar se há contratos associados
SELECT 
    f.id as fatura_id,
    f.numero_fatura,
    f.contrato_id,
    c.id as contrato_valido,
    c.empresa_id as empresa_do_contrato
FROM faturas f
LEFT JOIN contratos c ON c.id = f.contrato_id
WHERE f.empresa_id IS NULL
LIMIT 10;

-- 3. OPÇÃO A: Associar faturas à empresa do contrato (se existir)
UPDATE faturas f
SET empresa_id = c.empresa_id
FROM contratos c
WHERE f.contrato_id = c.id
  AND f.empresa_id IS NULL
  AND c.empresa_id IS NOT NULL;

-- 4. OPÇÃO B: Associar faturas órfãs à primeira empresa disponível
-- (usar apenas se houver faturas sem contrato válido)
UPDATE faturas
SET empresa_id = (SELECT id FROM empresas ORDER BY created_at ASC LIMIT 1)
WHERE empresa_id IS NULL;

-- 5. Verificar se ainda há faturas sem empresa_id
SELECT COUNT(*) as faturas_sem_empresa_apos_correcao
FROM faturas
WHERE empresa_id IS NULL;

-- 6. Se tudo OK, resultado deve ser 0
-- Agora pode executar: npm run migration:run
