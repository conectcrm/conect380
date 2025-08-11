-- 🔒 BACKUP DE SEGURANCA - Sistema de Faturamento
-- Data: 11/08/2025
-- EXECUTAR ANTES DE QUALQUER ALTERAÇÃO

BEGIN;

-- 1. Backup completo da tabela faturas
CREATE TABLE faturas_backup_20250811 AS 
SELECT * FROM faturas;

-- 2. Backup da tabela de mapeamento
CREATE TABLE cliente_id_mapping_backup_20250811 AS 
SELECT * FROM cliente_id_mapping;

-- 3. Verificar dados antes da correcao
SELECT 
  'DADOS ANTES DA CORRECAO' as status,
  COUNT(*) as total_faturas,
  COUNT(CASE WHEN f."clienteId" IN (SELECT numeric_id FROM cliente_id_mapping) THEN 1 END) as faturas_com_cliente_valido,
  COUNT(CASE WHEN f."clienteId" NOT IN (SELECT numeric_id FROM cliente_id_mapping) THEN 1 END) as faturas_orfas
FROM faturas f
WHERE f.ativo = true;

-- 4. Listar faturas orfas para analise
SELECT 
  'FATURAS ORFAS DETECTADAS' as info,
  f.id, 
  f.numero, 
  f."clienteId", 
  f."valorTotal",
  f.status
FROM faturas f
WHERE f.ativo = true 
  AND f."clienteId" NOT IN (SELECT numeric_id FROM cliente_id_mapping)
ORDER BY f.id;

-- 5. Verificar clientes disponiveis no mapping
SELECT 
  'CLIENTES DISPONIVEIS NO MAPPING' as info,
  m.numeric_id,
  m.cliente_uuid,
  m.nome,
  COUNT(f.id) as qtd_faturas
FROM cliente_id_mapping m
LEFT JOIN faturas f ON m.numeric_id = f."clienteId"
GROUP BY m.numeric_id, m.cliente_uuid, m.nome
ORDER BY m.numeric_id;

COMMIT;

-- Instruções para rollback se necessário:
-- DROP TABLE faturas_backup_20250811;
-- DROP TABLE cliente_id_mapping_backup_20250811;
