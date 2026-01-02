-- ========================================
-- 🔍 VERIFICAR CONFIGURAÇÃO DO WHATSAPP
-- ========================================

-- 1. Ver todas as configurações do WhatsApp
SELECT 
    id,
    empresa_id,
    canal,
    ativo,
    credenciais->>'phoneNumberId' as phone_number_id,
    credenciais->>'businessAccountId' as business_account_id,
    LEFT(credenciais->>'accessToken', 50) || '...' as token_preview,
    created_at,
    updated_at
FROM atendimento_canais_configuracao
WHERE canal = 'whatsapp_business_api'
ORDER BY created_at DESC;

-- 2. Ver empresa associada
SELECT 
    e.id,
    e.nome_fantasia,
    e.razao_social,
    e.ativo
FROM empresas e
WHERE e.id IN (
    SELECT empresa_id 
    FROM atendimento_canais_configuracao 
    WHERE canal = 'whatsapp_business_api'
);
