-- Script SQL para verificar propostas com valores problemáticos
-- Execute este script no PostgreSQL para diagnosticar problemas

SELECT 
    'DIAGNÓSTICO: Propostas com valores problemáticos' as diagnostico;

-- 1. Verificar propostas com total NULL ou 0
SELECT 
    'Propostas com total NULL ou 0:' as problema,
    COUNT(*) as quantidade
FROM propostas 
WHERE status = 'enviada' 
  AND (total IS NULL OR total = 0);

-- 2. Verificar propostas com total não numérico (se armazenado como texto)
SELECT 
    'Propostas "enviada" com status problemático:' as problema,
    numero,
    total,
    subtotal,
    status,
    "criadaEm"
FROM propostas 
WHERE status = 'enviada' 
  AND (total IS NULL OR total = 0 OR total::text ~ '[^0-9\.]')
LIMIT 10;

-- 3. Verificar todas as propostas "enviada" e seus totais
SELECT 
    'Resumo propostas enviadas:' as resumo,
    COUNT(*) as total_propostas,
    SUM(CASE WHEN total IS NULL THEN 1 ELSE 0 END) as total_null,
    SUM(CASE WHEN total = 0 THEN 1 ELSE 0 END) as total_zero,
    SUM(COALESCE(total::numeric, 0)) as soma_total,
    ROUND(AVG(COALESCE(total::numeric, 0)), 2) as media_total
FROM propostas 
WHERE status = 'enviada';

-- 4. Propostas enviadas ordenadas por valor
SELECT 
    numero,
    titulo,
    total,
    subtotal,
    "criadaEm"
FROM propostas 
WHERE status = 'enviada'
ORDER BY total DESC NULLS LAST
LIMIT 5;

-- 5. Verificar integridade geral dos dados
SELECT 
    status,
    COUNT(*) as quantidade,
    SUM(COALESCE(total::numeric, 0)) as valor_total,
    ROUND(AVG(COALESCE(total::numeric, 0)), 2) as ticket_medio
FROM propostas 
GROUP BY status
ORDER BY quantidade DESC;
