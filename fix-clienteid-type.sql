-- Script para alterar tipo da coluna clienteId de UUID para INTEGER

-- 1. Alterar tipo da coluna clienteId
ALTER TABLE faturas ALTER COLUMN "clienteId" TYPE INTEGER USING 1;

-- 2. Atualizar com IDs numéricos baseados no mapeamento
UPDATE faturas 
SET "clienteId" = 1
WHERE "clienteId" = 1; -- já está correto para Beatriz

UPDATE faturas 
SET "clienteId" = 3
WHERE id IN (14, 15, 16); -- Dhonleno Freitas

UPDATE faturas 
SET "clienteId" = 5  
WHERE id IN (17, 18, 19); -- Thiago Borges

-- 3. Verificar resultado
SELECT 'Faturas com IDs numéricos:' as info;
SELECT f.id, f.numero, f."clienteId", f.ativo, m.nome as cliente_nome
FROM faturas f
LEFT JOIN cliente_id_mapping m ON f."clienteId" = m.numeric_id
ORDER BY f.id;
