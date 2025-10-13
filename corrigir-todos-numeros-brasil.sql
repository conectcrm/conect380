-- ========================================
-- CORREÇÃO DEFINITIVA: Números de Telefone Brasileiros
-- ========================================
-- 
-- CONTEXTO:
-- Em 2015-2017, o Brasil adicionou o dígito 9 no início de todos
-- os números de celular. Formato correto:
-- 
-- Internacional: +55 (DDD) 9XXXX-XXXX
-- Limpo: 55DDXXXXXXXXX (13 dígitos)
-- Sem +55: DDXXXXXXXXX (11 dígitos)
-- 
-- ESTE SCRIPT:
-- 1. Identifica números sem o dígito 9 (10 dígitos após código país)
-- 2. Adiciona o dígito 9 automaticamente
-- 3. Valida e corrige todos os números na base
-- 
-- ========================================

-- ========================================
-- PASSO 1: VERIFICAR NÚMEROS PROBLEMÁTICOS
-- ========================================

SELECT 
    id,
    numero,
    contato_nome,
    contato_telefone,
    LENGTH(contato_telefone) as tamanho,
    CASE 
        WHEN LENGTH(contato_telefone) = 13 AND SUBSTRING(contato_telefone, 3, 1) = '9' THEN '✅ CORRETO (13 dígitos com 9)'
        WHEN LENGTH(contato_telefone) = 12 AND SUBSTRING(contato_telefone, 3, 1) != '9' THEN '❌ FALTA DÍGITO 9 (12 dígitos)'
        WHEN LENGTH(contato_telefone) = 11 AND SUBSTRING(contato_telefone, 1, 1) = '9' THEN '✅ CORRETO (11 dígitos começando com 9)'
        WHEN LENGTH(contato_telefone) = 10 THEN '❌ FALTA DÍGITO 9 (10 dígitos)'
        ELSE '⚠️ TAMANHO INESPERADO'
    END as status,
    CASE 
        WHEN LENGTH(contato_telefone) = 12 AND SUBSTRING(contato_telefone, 1, 2) = '55' THEN 
            CONCAT('55', SUBSTRING(contato_telefone, 3, 2), '9', SUBSTRING(contato_telefone, 5))
        WHEN LENGTH(contato_telefone) = 10 THEN 
            CONCAT(SUBSTRING(contato_telefone, 1, 2), '9', SUBSTRING(contato_telefone, 3))
        ELSE contato_telefone
    END as sugestao_correcao
FROM atendimento_tickets
WHERE contato_telefone IS NOT NULL
ORDER BY LENGTH(contato_telefone), contato_telefone;

-- ========================================
-- PASSO 2: BACKUP DOS DADOS ORIGINAIS
-- ========================================

-- Criar tabela temporária de backup (caso precise reverter)
CREATE TEMP TABLE IF NOT EXISTS backup_telefones_tickets AS
SELECT id, numero, contato_nome, contato_telefone, NOW() as backup_em
FROM atendimento_tickets
WHERE contato_telefone IS NOT NULL;

SELECT 'ℹ️ Backup criado com ' || COUNT(*) || ' registros' as info
FROM backup_telefones_tickets;

-- ========================================
-- PASSO 3: CORRIGIR NÚMEROS COM 12 DÍGITOS (55DDXXXXXXXX)
-- ========================================

-- Números com código país (55) mas sem o dígito 9
UPDATE atendimento_tickets
SET contato_telefone = CONCAT(
    '55',                                    -- Código do país
    SUBSTRING(contato_telefone, 3, 2),       -- DDD (2 dígitos)
    '9',                                     -- Dígito adicional (✨ NOVO)
    SUBSTRING(contato_telefone, 5)           -- Restante do número (8 dígitos)
)
WHERE LENGTH(contato_telefone) = 12
  AND SUBSTRING(contato_telefone, 1, 2) = '55'
  AND SUBSTRING(contato_telefone, 3, 1) != '9';

SELECT 'ℹ️ Corrigidos ' || ROW_COUNT() || ' números com 12 dígitos (formato 55DDXXXXXXXX)' as info;

-- ========================================
-- PASSO 4: CORRIGIR NÚMEROS COM 10 DÍGITOS (DDXXXXXXXX)
-- ========================================

-- Números sem código país e sem o dígito 9
UPDATE atendimento_tickets
SET contato_telefone = CONCAT(
    SUBSTRING(contato_telefone, 1, 2),       -- DDD (2 dígitos)
    '9',                                     -- Dígito adicional (✨ NOVO)
    SUBSTRING(contato_telefone, 3)           -- Restante do número (8 dígitos)
)
WHERE LENGTH(contato_telefone) = 10
  AND SUBSTRING(contato_telefone, 1, 1) IN ('1', '2', '3', '4', '5', '6', '7', '8', '9'); -- Começa com DDD válido

SELECT 'ℹ️ Corrigidos ' || ROW_COUNT() || ' números com 10 dígitos (formato DDXXXXXXXX)' as info;

-- ========================================
-- PASSO 5: ADICIONAR CÓDIGO DO PAÍS (55) SE NECESSÁRIO
-- ========================================

-- Se o sistema espera sempre código do país, adicionar 55 nos números que têm 11 dígitos
UPDATE atendimento_tickets
SET contato_telefone = CONCAT('55', contato_telefone)
WHERE LENGTH(contato_telefone) = 11
  AND SUBSTRING(contato_telefone, 1, 2) != '55'
  AND SUBSTRING(contato_telefone, 3, 1) = '9'; -- Tem o dígito 9 correto

SELECT 'ℹ️ Adicionado código do país em ' || ROW_COUNT() || ' números' as info;

-- ========================================
-- PASSO 6: VERIFICAÇÃO FINAL
-- ========================================

SELECT 
    '📊 ESTATÍSTICAS FINAIS' as titulo,
    COUNT(*) as total_registros,
    COUNT(CASE WHEN LENGTH(contato_telefone) = 13 THEN 1 END) as numeros_13_digitos,
    COUNT(CASE WHEN LENGTH(contato_telefone) = 11 THEN 1 END) as numeros_11_digitos,
    COUNT(CASE WHEN LENGTH(contato_telefone) NOT IN (11, 13) THEN 1 END) as numeros_outros_tamanhos
FROM atendimento_tickets
WHERE contato_telefone IS NOT NULL;

-- Mostrar números corrigidos
SELECT 
    '✅ NÚMEROS CORRIGIDOS' as titulo,
    t.id,
    t.numero,
    t.contato_nome,
    b.contato_telefone as antes,
    t.contato_telefone as depois,
    LENGTH(t.contato_telefone) as tamanho_depois,
    CASE 
        WHEN LENGTH(t.contato_telefone) = 13 AND SUBSTRING(t.contato_telefone, 5, 1) = '9' THEN '✅ CORRETO'
        WHEN LENGTH(t.contato_telefone) = 11 AND SUBSTRING(t.contato_telefone, 3, 1) = '9' THEN '✅ CORRETO'
        ELSE '⚠️ VERIFICAR'
    END as validacao
FROM atendimento_tickets t
INNER JOIN backup_telefones_tickets b ON t.id = b.id
WHERE t.contato_telefone != b.contato_telefone
ORDER BY t.numero;

-- ========================================
-- PASSO 7: VALIDAÇÃO DOS NÚMEROS CORRIGIDOS
-- ========================================

-- Verificar se ainda há números suspeitos
SELECT 
    '⚠️ NÚMEROS QUE PRECISAM VERIFICAÇÃO MANUAL' as alerta,
    id,
    numero,
    contato_nome,
    contato_telefone,
    LENGTH(contato_telefone) as tamanho,
    CASE 
        WHEN LENGTH(contato_telefone) = 13 AND SUBSTRING(contato_telefone, 5, 1) != '9' THEN 'Falta dígito 9'
        WHEN LENGTH(contato_telefone) = 11 AND SUBSTRING(contato_telefone, 3, 1) != '9' THEN 'Falta dígito 9'
        WHEN LENGTH(contato_telefone) NOT IN (11, 13) THEN 'Tamanho inválido'
        ELSE 'OK'
    END as problema
FROM atendimento_tickets
WHERE contato_telefone IS NOT NULL
  AND (
    (LENGTH(contato_telefone) = 13 AND SUBSTRING(contato_telefone, 5, 1) != '9') OR
    (LENGTH(contato_telefone) = 11 AND SUBSTRING(contato_telefone, 3, 1) != '9') OR
    LENGTH(contato_telefone) NOT IN (11, 13)
  );

-- ========================================
-- ROLLBACK (APENAS SE NECESSÁRIO)
-- ========================================

-- ⚠️ USE APENAS SE PRECISAR DESFAZER AS ALTERAÇÕES!
-- 
-- UPDATE atendimento_tickets t
-- SET contato_telefone = b.contato_telefone
-- FROM backup_telefones_tickets b
-- WHERE t.id = b.id;
-- 
-- SELECT 'ℹ️ Rollback executado com sucesso!' as info;

-- ========================================
-- RESULTADO ESPERADO:
-- ========================================
-- 
-- ANTES:
-- - 556296689991 (12 dígitos - sem o 9) ❌
-- - 6296689991 (10 dígitos - sem código país e sem 9) ❌
-- 
-- DEPOIS:
-- - 5562996689991 (13 dígitos - correto) ✅
-- - 62996689991 (11 dígitos - correto) ✅
-- 
-- FORMATO FINAL:
-- - Com código país: 55 + DD + 9 + XXXXXXXX = 13 dígitos
-- - Sem código país: DD + 9 + XXXXXXXX = 11 dígitos
-- 
-- ========================================
