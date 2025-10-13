-- ========================================
-- CORREÇÃO: Número de Telefone no Ticket
-- ========================================
-- Problema: Número no banco está errado (556296689991)
-- Solução: Corrigir para 5562996689991 (adicionar dígito 6)
-- ========================================

-- 1. Verificar tickets com número errado
SELECT 
    id,
    numero,
    contato_nome,
    contato_telefone,
    'ERRADO - Falta um 6' as status
FROM atendimento_tickets 
WHERE contato_telefone = '556296689991';

-- 2. Corrigir o número do telefone
UPDATE atendimento_tickets 
SET contato_telefone = '5562996689991'
WHERE contato_telefone = '556296689991';

-- 3. Verificar se a correção funcionou
SELECT 
    id,
    numero,
    contato_nome,
    contato_telefone,
    'CORRIGIDO ✅' as status
FROM atendimento_tickets 
WHERE contato_telefone = '5562996689991';

-- ========================================
-- RESULTADO ESPERADO:
-- ========================================
-- Antes: 556296689991  (10 dígitos + DDD = ERRADO)
-- Depois: 5562996689991 (11 dígitos + DDD = CORRETO)
-- ========================================
