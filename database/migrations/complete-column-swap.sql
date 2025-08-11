-- Finalizando as renomeações das colunas
ALTER TABLE faturas RENAME COLUMN "clienteId" TO "clienteId_old_numeric";
ALTER TABLE faturas RENAME COLUMN "clienteid_uuid" TO "clienteId";

-- Adicionando foreign key constraint
ALTER TABLE faturas 
ADD CONSTRAINT faturas_clienteId_fkey 
FOREIGN KEY ("clienteId") REFERENCES clientes(id) ON DELETE RESTRICT ON UPDATE CASCADE;

-- Verificando resultado
SELECT 
    f.id as fatura_id,
    f."clienteId" as cliente_uuid,
    c.nome as cliente_nome,
    f.status
FROM faturas f
JOIN clientes c ON f."clienteId" = c.id
WHERE f.ativo = true
ORDER BY f.id;
