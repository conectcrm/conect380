-- Script para corrigir o problema de tipos e reativar faturas
-- Executar no PostgreSQL

-- 1. Primeiro, vamos verificar os dados atuais
SELECT 'Verificando faturas antes da correção:' as info;
SELECT f.id, f.numero, f."clienteId", f.ativo, c.id as cliente_uuid, c.nome 
FROM faturas f 
LEFT JOIN clientes c ON f."clienteId"::text = c.id
ORDER BY f.id;

-- 2. Criar uma tabela temporária para mapear IDs antigos para UUIDs
CREATE TEMP TABLE cliente_mapping AS
SELECT 
  ROW_NUMBER() OVER (ORDER BY id) as old_id,
  id as uuid_id,
  nome
FROM clientes;

-- Verificar o mapeamento
SELECT 'Mapeamento Cliente ID -> UUID:' as info;
SELECT * FROM cliente_mapping;

-- 3. Backup da tabela faturas antes da modificação
CREATE TABLE faturas_backup_20250810 AS SELECT * FROM faturas;

-- 4. Adicionar uma nova coluna temporária para UUID
ALTER TABLE faturas ADD COLUMN clienteId_uuid UUID;

-- 5. Atualizar a nova coluna com base no mapeamento
UPDATE faturas 
SET clienteId_uuid = cm.uuid_id
FROM cliente_mapping cm
WHERE faturas."clienteId" = cm.old_id;

-- Se alguns clienteId não foram mapeados, vamos tentar mapear pela posição
UPDATE faturas 
SET clienteId_uuid = (
  SELECT id FROM clientes 
  ORDER BY nome 
  LIMIT 1 OFFSET (faturas."clienteId" - 1)
)
WHERE clienteId_uuid IS NULL;

-- 6. Verificar os dados após o mapeamento
SELECT 'Verificando mapeamento:' as info;
SELECT f.id, f.numero, f."clienteId", f.clienteId_uuid, c.nome
FROM faturas f
LEFT JOIN clientes c ON f.clienteId_uuid = c.id
ORDER BY f.id;

-- 7. Remover a coluna antiga e renomear a nova
ALTER TABLE faturas DROP COLUMN "clienteId";
ALTER TABLE faturas RENAME COLUMN clienteId_uuid TO "clienteId";

-- 8. Reativar todas as faturas que estavam inativas
UPDATE faturas SET ativo = true WHERE ativo = false;

-- 9. Verificar o resultado final
SELECT 'Resultado final:' as info;
SELECT f.id, f.numero, f."clienteId", f.ativo, c.nome as cliente_nome
FROM faturas f
LEFT JOIN clientes c ON f."clienteId" = c.id
ORDER BY f.id;

SELECT 'Contagem por status ativo:' as info;
SELECT ativo, COUNT(*) as total FROM faturas GROUP BY ativo;
