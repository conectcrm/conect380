SELECT 
    f.id as fatura_id,
    f."clienteId" as cliente_uuid,
    c.nome as cliente_nome,
    f.status,
    'UUID_NATIVO' as tipo_relacionamento
FROM faturas f
JOIN clientes c ON f."clienteId" = c.id
WHERE f.ativo = true
ORDER BY f.id;
