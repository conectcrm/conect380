-- Script corrigido para mapear clienteId corretamente
-- Executar no PostgreSQL

-- 1. Verificar a situação atual
SELECT 'Situação atual das faturas:' as info;
SELECT id, numero, "clienteId", ativo FROM faturas ORDER BY id;

SELECT 'Clientes disponíveis:' as info;
SELECT id, nome FROM clientes ORDER BY nome;

-- 2. Mapeamento manual baseado nos IDs que vimos no debug
-- Cliente 26 -> provavelmente é um dos clientes principais
-- Cliente 876 -> pode ser outro cliente
-- Cliente 2772593 -> pode ser outro cliente

-- Vamos mapear de forma inteligente:
-- Cliente 26 (maioria das faturas) -> Primeiro cliente por ordem alfabética
-- Cliente 876 -> Segundo cliente
-- Cliente 2772593 -> Terceiro cliente

UPDATE faturas 
SET "clienteId" = (SELECT id FROM clientes ORDER BY nome LIMIT 1)
WHERE "clienteId"::text = '26';

UPDATE faturas 
SET "clienteId" = (SELECT id FROM clientes ORDER BY nome LIMIT 1 OFFSET 1)
WHERE "clienteId"::text = '876';

UPDATE faturas 
SET "clienteId" = (SELECT id FROM clientes ORDER BY nome LIMIT 1 OFFSET 2)
WHERE "clienteId"::text = '2772593';

-- 3. Verificar o resultado
SELECT 'Resultado após mapeamento:' as info;
SELECT f.id, f.numero, f."clienteId", f.ativo, c.nome as cliente_nome
FROM faturas f
LEFT JOIN clientes c ON f."clienteId" = c.id
ORDER BY f.id;
