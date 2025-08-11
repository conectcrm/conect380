-- Script para atribuir clientes às faturas que ficaram sem clienteId

-- 1. Atribuir clientes aleatoriamente às faturas
-- Vamos distribuir as faturas entre os clientes disponíveis

-- Faturas 11-13 -> Beatriz Dos Santos
UPDATE faturas 
SET "clienteId" = '11870d4f-0059-4466-a546-1c878d1330a2'
WHERE id IN (11, 12, 13);

-- Faturas 14-16 -> Dhonleno Freitas
UPDATE faturas 
SET "clienteId" = '876d96fa-82d2-4e8a-8c37-91ed51bf701d'
WHERE id IN (14, 15, 16);

-- Faturas 17-19 -> Thiago Borges
UPDATE faturas 
SET "clienteId" = '2772593a-1e64-494b-a39a-825ee1245425'
WHERE id IN (17, 18, 19);

-- 2. Verificar o resultado
SELECT 'Resultado final:' as info;
SELECT f.id, f.numero, f."clienteId", f.ativo, c.nome as cliente_nome
FROM faturas f
LEFT JOIN clientes c ON f."clienteId" = c.id
ORDER BY f.id;
