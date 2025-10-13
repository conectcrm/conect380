-- ============================================
-- Script para Atualizar Token do WhatsApp
-- ============================================
-- 
-- COMO USAR:
-- 1. Substitua 'SEU_NOVO_TOKEN_AQUI' pelo token real do WhatsApp
-- 2. Execute este script no banco de dados
-- 
-- OU use o comando PowerShell no final deste arquivo
-- ============================================

-- Verificar token atual
SELECT 
    id,
    tipo,
    ativo,
    configuracao->'credenciais'->>'whatsapp_api_token' as token_atual,
    configuracao->'credenciais'->>'whatsapp_phone_number_id' as phone_id
FROM canais 
WHERE tipo = 'whatsapp';

-- ============================================
-- ATUALIZAR TOKEN (execute após verificar)
-- ============================================

UPDATE canais
SET configuracao = jsonb_set(
    configuracao,
    '{credenciais,whatsapp_api_token}',
    '"SEU_NOVO_TOKEN_AQUI"'
)
WHERE tipo = 'whatsapp';

-- ============================================
-- Verificar se foi atualizado
-- ============================================

SELECT 
    id,
    tipo,
    ativo,
    configuracao->'credenciais'->>'whatsapp_api_token' as token_novo,
    configuracao->'credenciais'->>'whatsapp_phone_number_id' as phone_id,
    "updatedAt"
FROM canais 
WHERE tipo = 'whatsapp';

-- ============================================
-- COMANDO POWERSHELL ALTERNATIVO:
-- ============================================
-- 
-- Execute no PowerShell (substitua o token):
-- 
-- $newToken = "SEU_NOVO_TOKEN_AQUI"
-- $query = "UPDATE canais SET configuracao = jsonb_set(configuracao, '{credenciais,whatsapp_api_token}', '`"$newToken`"') WHERE tipo = 'whatsapp'; SELECT configuracao->'credenciais'->>'whatsapp_api_token' as token FROM canais WHERE tipo = 'whatsapp';"
-- docker exec -it conectcrm-postgres psql -U conectcrm -d conectcrm_db -c "$query"
-- 
-- ============================================
