-- ========================================
-- MIGRAÇÃO FINAL: UUID NATIVO PARA FATURAS
-- ========================================
-- Este script finaliza a migração para UUIDs nativos
-- IMPORTANTE: Execute apenas após validar que todas as faturas estão preparadas

BEGIN;

-- Passo 1: Validar estado antes da migração
DO $$
DECLARE
    total_faturas INTEGER;
    faturas_preparadas INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_faturas FROM faturas WHERE ativo = true;
    SELECT COUNT(*) INTO faturas_preparadas FROM faturas WHERE ativo = true AND clienteid_uuid IS NOT NULL;
    
    RAISE NOTICE 'VALIDAÇÃO PRÉ-MIGRAÇÃO:';
    RAISE NOTICE '- Total de faturas ativas: %', total_faturas;
    RAISE NOTICE '- Faturas preparadas (com UUID): %', faturas_preparadas;
    
    IF total_faturas != faturas_preparadas THEN
        RAISE EXCEPTION 'ERRO: Nem todas as faturas estão preparadas! Execute primeiro migracao-preparacao-uuid.sql';
    END IF;
    
    RAISE NOTICE '✅ Validação passou - todas as faturas estão preparadas';
END $$;

-- Passo 2: Remover constraint da coluna antiga (se existir)
ALTER TABLE faturas DROP CONSTRAINT IF EXISTS faturas_clienteid_fkey;

-- Passo 3: Renomear colunas (swap)
ALTER TABLE faturas RENAME COLUMN "clienteId" TO "clienteId_old_numeric";
ALTER TABLE faturas RENAME COLUMN "clienteid_uuid" TO "clienteId";

-- Passo 4: Adicionar constraint de foreign key para UUID
ALTER TABLE faturas 
ADD CONSTRAINT faturas_clienteId_fkey 
FOREIGN KEY ("clienteId") REFERENCES clientes(id) ON DELETE RESTRICT ON UPDATE CASCADE;

-- Passo 5: Verificar integridade após migração
DO $$
DECLARE
    faturas_com_cliente INTEGER;
    total_faturas INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_faturas FROM faturas WHERE ativo = true;
    SELECT COUNT(*) INTO faturas_com_cliente 
    FROM faturas f 
    JOIN clientes c ON f."clienteId" = c.id 
    WHERE f.ativo = true;
    
    RAISE NOTICE 'VALIDAÇÃO PÓS-MIGRAÇÃO:';
    RAISE NOTICE '- Total de faturas ativas: %', total_faturas;
    RAISE NOTICE '- Faturas com clientes válidos: %', faturas_com_cliente;
    
    IF total_faturas != faturas_com_cliente THEN
        RAISE EXCEPTION 'ERRO: Algumas faturas ficaram órfãs após migração!';
    END IF;
    
    RAISE NOTICE '✅ Migração concluída com sucesso - todas as faturas mantêm clientes válidos';
END $$;

-- Passo 6: Mostrar resultado final
SELECT 
    f.id as fatura_id,
    f."clienteId" as cliente_uuid,
    c.nome as cliente_nome,
    f.valor,
    f.status,
    'UUID_NATIVO' as tipo_relacionamento
FROM faturas f
JOIN clientes c ON f."clienteId" = c.id
WHERE f.ativo = true
ORDER BY f.id;

COMMIT;

-- Mensagens finais (fora da transação)
\echo ''
\echo '🎉 MIGRAÇÃO FINALIZADA COM SUCESSO!'
\echo 'Para limpeza final, execute separadamente:'
\echo '  ALTER TABLE faturas DROP COLUMN "clienteId_old_numeric";'
\echo '  DROP TABLE cliente_id_mapping;'
