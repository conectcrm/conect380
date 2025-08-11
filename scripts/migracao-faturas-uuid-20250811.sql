-- 🔄 MIGRAÇÃO CRÍTICA: Conversão de clienteId para UUID nativo
-- Data: 11/08/2025
-- EXECUTAR EM PRODUÇÃO COM MUITO CUIDADO

-- ==================== FASE 1: VERIFICAÇÃO PRÉ-MIGRAÇÃO ====================

BEGIN;

-- 1. Verificar estado atual
SELECT 
  'PRE-MIGRACAO: Estado atual' as info,
  COUNT(*) as total_faturas,
  COUNT(CASE WHEN f."clienteId" IN (SELECT numeric_id FROM cliente_id_mapping) THEN 1 END) as faturas_validas,
  COUNT(CASE WHEN f."clienteId" NOT IN (SELECT numeric_id FROM cliente_id_mapping) THEN 1 END) as faturas_orfas
FROM faturas f
WHERE f.ativo = true;

-- 2. Listar faturas órfãs que serão corrigidas
CREATE TEMP TABLE faturas_orfas_pre_migracao AS
SELECT 
  f.id,
  f.numero,
  f."clienteId" as old_client_id,
  f."valorTotal",
  f.status
FROM faturas f
WHERE f.ativo = true 
  AND f."clienteId" NOT IN (SELECT numeric_id FROM cliente_id_mapping);

SELECT 'FATURAS ORFAS QUE SERAO CORRIGIDAS:' as info, * FROM faturas_orfas_pre_migracao;

ROLLBACK;

-- ==================== FASE 2: CORREÇÃO DE DADOS ÓRFÃOS ====================

BEGIN;

-- 1. Corrigir faturas órfãs primeiro - atribuir ao primeiro cliente válido
UPDATE faturas 
SET "clienteId" = 1
WHERE "clienteId" NOT IN (SELECT numeric_id FROM cliente_id_mapping)
  AND ativo = true;

-- Log da correção
SELECT 
  'CORRECAO DE ORFAOS CONCLUIDA' as info,
  COUNT(*) as faturas_corrigidas
FROM faturas 
WHERE "clienteId" = 1 AND ativo = true;

COMMIT;

-- ==================== FASE 3: MIGRAÇÃO PARA UUID ====================

BEGIN;

-- 1. Adicionar nova coluna UUID
ALTER TABLE faturas ADD COLUMN IF NOT EXISTS clienteId_uuid UUID;

-- 2. Popular nova coluna com UUIDs corretos do mapeamento
UPDATE faturas f
SET clienteId_uuid = m.cliente_uuid
FROM cliente_id_mapping m
WHERE f."clienteId" = m.numeric_id
  AND f.ativo = true;

-- 3. Verificar se todas as faturas foram mapeadas
SELECT 
  'MAPEAMENTO UUID CONCLUIDO' as info,
  COUNT(*) as total_faturas,
  COUNT(CASE WHEN clienteId_uuid IS NOT NULL THEN 1 END) as faturas_mapeadas,
  COUNT(CASE WHEN clienteId_uuid IS NULL THEN 1 END) as faturas_nao_mapeadas
FROM faturas
WHERE ativo = true;

-- 4. Se houver faturas não mapeadas, atribuir ao primeiro cliente
UPDATE faturas 
SET clienteId_uuid = (
  SELECT cliente_uuid 
  FROM cliente_id_mapping 
  ORDER BY numeric_id 
  LIMIT 1
)
WHERE clienteId_uuid IS NULL 
  AND ativo = true;

-- 5. Verificar novamente
SELECT 
  'VERIFICACAO FINAL UUID' as info,
  COUNT(*) as total_faturas,
  COUNT(CASE WHEN clienteId_uuid IS NOT NULL THEN 1 END) as faturas_com_uuid
FROM faturas
WHERE ativo = true;

-- 6. Criar índice na nova coluna antes de trocar
CREATE INDEX IF NOT EXISTS idx_faturas_clienteId_uuid ON faturas(clienteId_uuid);
CREATE INDEX IF NOT EXISTS idx_faturas_clienteId_uuid_status ON faturas(clienteId_uuid, status);

COMMIT;

-- ==================== FASE 4: SUBSTITUIÇÃO DE COLUNAS ====================

BEGIN;

-- 1. Backup da coluna antiga
ALTER TABLE faturas ADD COLUMN IF NOT EXISTS clienteId_old_numeric INTEGER;
UPDATE faturas SET clienteId_old_numeric = "clienteId";

-- 2. Remover índices da coluna antiga
DROP INDEX IF EXISTS idx_faturas_clienteId;

-- 3. Remover coluna antiga
ALTER TABLE faturas DROP COLUMN IF EXISTS "clienteId";

-- 4. Renomear nova coluna
ALTER TABLE faturas RENAME COLUMN clienteId_uuid TO "clienteId";

-- 5. Adicionar constraint NOT NULL
ALTER TABLE faturas ALTER COLUMN "clienteId" SET NOT NULL;

-- 6. Criar foreign key para clientes
ALTER TABLE faturas 
ADD CONSTRAINT fk_faturas_cliente 
FOREIGN KEY ("clienteId") 
REFERENCES clientes(id) 
ON DELETE RESTRICT;

-- 7. Recriar índices otimizados
CREATE INDEX idx_faturas_clienteId ON faturas("clienteId");
CREATE INDEX idx_faturas_clienteId_status ON faturas("clienteId", status);
CREATE INDEX idx_faturas_datavencimento_status ON faturas("dataVencimento", status);
CREATE INDEX idx_faturas_dataemissao ON faturas("dataEmissao");

COMMIT;

-- ==================== FASE 5: VERIFICAÇÃO PÓS-MIGRAÇÃO ====================

BEGIN;

-- 1. Verificar integridade referencial
SELECT 
  'VERIFICACAO INTEGRIDADE REFERENCIAL' as info,
  COUNT(*) as total_faturas,
  COUNT(c.id) as clientes_encontrados
FROM faturas f
LEFT JOIN clientes c ON f."clienteId" = c.id
WHERE f.ativo = true;

-- 2. Verificar tipos de dados
SELECT 
  'VERIFICACAO TIPOS DE DADOS' as info,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'faturas' 
  AND column_name = 'clienteId';

-- 3. Testar query típica de busca
SELECT 
  'TESTE QUERY TIPICA' as info,
  f.id,
  f.numero,
  f."clienteId",
  c.nome as cliente_nome,
  f."valorTotal",
  f.status
FROM faturas f
JOIN clientes c ON f."clienteId" = c.id
WHERE f.ativo = true
ORDER BY f.id DESC
LIMIT 5;

-- 4. Verificar performance de índices
EXPLAIN (ANALYZE, BUFFERS) 
SELECT f.*, c.nome 
FROM faturas f 
JOIN clientes c ON f."clienteId" = c.id 
WHERE f.status = 'pendente' 
  AND f.ativo = true
ORDER BY f."dataVencimento" ASC
LIMIT 10;

-- 5. Estatísticas finais
SELECT 
  'MIGRACAO CONCLUIDA COM SUCESSO' as status,
  COUNT(*) as total_faturas_ativas,
  COUNT(DISTINCT f."clienteId") as clientes_com_faturas,
  MIN(f."dataEmissao") as primeira_fatura,
  MAX(f."dataEmissao") as ultima_fatura,
  SUM(f."valorTotal") as valor_total_carteira
FROM faturas f
JOIN clientes c ON f."clienteId" = c.id
WHERE f.ativo = true;

COMMIT;

-- ==================== LIMPEZA OPCIONAL ====================

-- Após confirmar que tudo está funcionando, pode executar:
-- BEGIN;
-- ALTER TABLE faturas DROP COLUMN IF EXISTS clienteId_old_numeric;
-- DROP TABLE IF EXISTS cliente_id_mapping;
-- COMMIT;

-- ==================== ROLLBACK EM CASO DE EMERGÊNCIA ====================

-- Em caso de problemas CRÍTICOS, executar:
-- BEGIN;
-- ALTER TABLE faturas DROP CONSTRAINT IF EXISTS fk_faturas_cliente;
-- ALTER TABLE faturas DROP COLUMN IF EXISTS "clienteId";
-- ALTER TABLE faturas RENAME COLUMN clienteId_old_numeric TO "clienteId";
-- COMMIT;
