-- 🔄 MIGRAÇÃO CORRIGIDA: Conversão gradual para UUID
-- Data: 11/08/2025

BEGIN;

-- 1. Primeiro, corrigir faturas órfãs que ainda existem
UPDATE faturas 
SET "clienteId" = 1
WHERE "clienteId" NOT IN (SELECT numeric_id FROM cliente_id_mapping)
  AND ativo = true;

-- 2. Verificar dados antes da migração final
SELECT 
  'DADOS ANTES DA MIGRACAO FINAL' as info,
  COUNT(*) as total_faturas,
  COUNT(CASE WHEN f."clienteId" IN (SELECT numeric_id FROM cliente_id_mapping) THEN 1 END) as faturas_validas
FROM faturas f
WHERE f.ativo = true;

-- 3. Criar nova coluna UUID se não existir
ALTER TABLE faturas ADD COLUMN IF NOT EXISTS clienteId_uuid UUID;

-- 4. Popular a nova coluna UUID
UPDATE faturas f
SET clienteId_uuid = m.cliente_uuid
FROM cliente_id_mapping m
WHERE f."clienteId" = m.numeric_id;

-- 5. Verificar se todas as faturas ativas foram mapeadas
SELECT 
  'VERIFICACAO MAPEAMENTO' as info,
  COUNT(*) as total_faturas_ativas,
  COUNT(CASE WHEN clienteId_uuid IS NOT NULL THEN 1 END) as com_uuid,
  COUNT(CASE WHEN clienteId_uuid IS NULL THEN 1 END) as sem_uuid
FROM faturas
WHERE ativo = true;

-- 6. Para faturas que não foram mapeadas, usar o primeiro cliente
UPDATE faturas 
SET clienteId_uuid = (
  SELECT cliente_uuid 
  FROM cliente_id_mapping 
  ORDER BY numeric_id 
  LIMIT 1
)
WHERE clienteId_uuid IS NULL AND ativo = true;

-- 7. Verificar resultado final
SELECT 
  'RESULTADO FINAL DA PREPARACAO' as info,
  f.id,
  f.numero,
  f."clienteId" as old_numeric_id,
  f.clienteId_uuid as new_uuid_id,
  c.nome as cliente_nome
FROM faturas f
LEFT JOIN clientes c ON f.clienteId_uuid = c.id
WHERE f.ativo = true
ORDER BY f.id;

COMMIT;
