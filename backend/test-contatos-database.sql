-- ============================================
-- SCRIPT DE TESTE: Tabela Contatos
-- ============================================
-- Este script testa a estrutura da tabela e
-- insere dados de exemplo para validação
-- ============================================

-- 1. Verificar se a tabela foi criada
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM 
    information_schema.columns
WHERE 
    table_name = 'contatos'
ORDER BY 
    ordinal_position;

-- 2. Verificar índices criados
SELECT
    indexname,
    indexdef
FROM
    pg_indexes
WHERE
    tablename = 'contatos';

-- 3. Verificar foreign key
SELECT
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM
    information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
WHERE
    tc.table_name = 'contatos'
    AND tc.constraint_type = 'FOREIGN KEY';

-- ============================================
-- TESTES DE INSERÇÃO (Se cliente existir)
-- ============================================

-- Buscar um cliente existente para teste
-- (Substitua o UUID abaixo por um cliente real do seu banco)
DO $$
DECLARE
    v_cliente_id UUID;
    v_contato_joao_id UUID;
    v_contato_maria_id UUID;
    v_contato_pedro_id UUID;
BEGIN
    -- Buscar primeiro cliente disponível
    SELECT id INTO v_cliente_id 
    FROM clientes 
    WHERE ativo = true 
    LIMIT 1;

    IF v_cliente_id IS NULL THEN
        RAISE NOTICE 'Nenhum cliente encontrado. Crie um cliente primeiro.';
        RETURN;
    END IF;

    RAISE NOTICE 'Cliente encontrado: %', v_cliente_id;

    -- TESTE 1: Inserir contato principal
    INSERT INTO contatos (
        nome,
        email,
        telefone,
        cargo,
        principal,
        "clienteId",
        observacoes
    ) VALUES (
        'João Silva',
        'joao@empresa.com',
        '11988888888',
        'Gerente Comercial',
        true,
        v_cliente_id,
        'Contato principal da empresa'
    ) RETURNING id INTO v_contato_joao_id;

    RAISE NOTICE 'Contato João criado: %', v_contato_joao_id;

    -- TESTE 2: Inserir segundo contato
    INSERT INTO contatos (
        nome,
        email,
        telefone,
        cargo,
        principal,
        "clienteId"
    ) VALUES (
        'Maria Santos',
        'maria@empresa.com',
        '11977777777',
        'Compradora',
        false,
        v_cliente_id
    ) RETURNING id INTO v_contato_maria_id;

    RAISE NOTICE 'Contato Maria criado: %', v_contato_maria_id;

    -- TESTE 3: Inserir terceiro contato
    INSERT INTO contatos (
        nome,
        email,
        telefone,
        cargo,
        "clienteId",
        observacoes
    ) VALUES (
        'Pedro Costa',
        'pedro@empresa.com',
        '11966666666',
        'Financeiro',
        v_cliente_id,
        'Responsável por pagamentos'
    ) RETURNING id INTO v_contato_pedro_id;

    RAISE NOTICE 'Contato Pedro criado: %', v_contato_pedro_id;

    -- TESTE 4: Listar contatos criados
    RAISE NOTICE '=== LISTAGEM DE CONTATOS ===';
    
    PERFORM RAISE_NOTICE(
        '% - % (%) - Principal: %',
        nome,
        cargo,
        telefone,
        CASE WHEN principal THEN 'SIM ⭐' ELSE 'NÃO' END
    )
    FROM contatos
    WHERE "clienteId" = v_cliente_id
    ORDER BY principal DESC, nome ASC;

    RAISE NOTICE 'Testes de inserção concluídos com sucesso!';

END $$;

-- ============================================
-- QUERIES DE VALIDAÇÃO
-- ============================================

-- Contar contatos por cliente
SELECT 
    c.nome AS cliente,
    COUNT(ct.id) AS total_contatos,
    COUNT(CASE WHEN ct.principal THEN 1 END) AS principais,
    COUNT(CASE WHEN ct.ativo THEN 1 END) AS ativos
FROM 
    clientes c
LEFT JOIN 
    contatos ct ON ct."clienteId" = c.id
WHERE 
    c.ativo = true
GROUP BY 
    c.id, c.nome
ORDER BY 
    total_contatos DESC
LIMIT 10;

-- Listar todos os contatos com seus clientes
SELECT 
    ct.nome AS contato_nome,
    ct.cargo,
    ct.telefone,
    ct.principal,
    ct.ativo,
    c.nome AS cliente_nome,
    c.email AS cliente_email
FROM 
    contatos ct
INNER JOIN 
    clientes c ON c.id = ct."clienteId"
ORDER BY 
    c.nome, ct.principal DESC, ct.nome;

-- Buscar contatos principais
SELECT 
    ct.nome AS contato,
    ct.cargo,
    ct.telefone,
    c.nome AS cliente,
    c.tipo AS tipo_cliente
FROM 
    contatos ct
INNER JOIN 
    clientes c ON c.id = ct."clienteId"
WHERE 
    ct.principal = true
    AND ct.ativo = true
ORDER BY 
    c.nome;

-- ============================================
-- QUERIES DE LIMPEZA (Use com cuidado!)
-- ============================================

-- Deletar contatos de teste (descomente para usar)
-- DELETE FROM contatos WHERE nome IN ('João Silva', 'Maria Santos', 'Pedro Costa');

-- Ver contatos inativos (soft delete)
-- SELECT * FROM contatos WHERE ativo = false;

-- ============================================
-- RESULTADO ESPERADO
-- ============================================
/*
✅ Tabela criada com sucesso
✅ 4 índices criados:
   - idx_contatos_clienteId
   - idx_contatos_telefone
   - idx_contatos_ativo
   - idx_contatos_principal
✅ Foreign Key configurada (ON DELETE CASCADE)
✅ Inserções funcionando
✅ Ordenação por principal DESC, nome ASC
✅ Validações de constraint

📊 Estrutura Validada:
   - Relacionamento ManyToOne com clientes
   - Soft delete com campo 'ativo'
   - Flag 'principal' para destacar contato
   - Campos observacoes para notas
   - Timestamps automáticos
*/
