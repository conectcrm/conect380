-- Script para criar mapeamento de IDs numericos para UUIDs de clientes
-- Isso permite manter compatibilidade com o código atual

-- 1. Criar tabela de mapeamento
CREATE TABLE IF NOT EXISTS cliente_id_mapping (
  numeric_id SERIAL PRIMARY KEY,
  cliente_uuid UUID NOT NULL UNIQUE,
  nome VARCHAR(255)
);

-- 2. Inserir mapeamento para os clientes existentes
INSERT INTO cliente_id_mapping (cliente_uuid, nome)
SELECT id, nome 
FROM clientes 
ON CONFLICT (cliente_uuid) DO NOTHING;

-- 3. Verificar o mapeamento criado
SELECT 'Mapeamento de IDs criado:' as info;
SELECT * FROM cliente_id_mapping ORDER BY numeric_id;

-- 4. Atualizar as faturas para usar os IDs numéricos correspondentes
UPDATE faturas f
SET "clienteId" = m.numeric_id
FROM cliente_id_mapping m
WHERE f."clienteId"::text = m.cliente_uuid::text;

-- Se ainda houver faturas sem mapeamento, usar ID sequencial simples
UPDATE faturas 
SET "clienteId" = 1
WHERE "clienteId" = '11870d4f-0059-4466-a546-1c878d1330a2';

UPDATE faturas 
SET "clienteId" = 2
WHERE "clienteId" = '876d96fa-82d2-4e8a-8c37-91ed51bf701d';

UPDATE faturas 
SET "clienteId" = 3
WHERE "clienteId" = '2772593a-1e64-494b-a39a-825ee1245425';

-- 5. Verificar resultado final
SELECT 'Faturas após mapeamento:' as info;
SELECT f.id, f.numero, f."clienteId", f.ativo, m.nome as cliente_nome
FROM faturas f
LEFT JOIN cliente_id_mapping m ON f."clienteId" = m.numeric_id
ORDER BY f.id;
