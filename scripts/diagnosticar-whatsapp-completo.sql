-- 🔍 DIAGNÓSTICO COMPLETO: Configuração WhatsApp
-- Execute este script para verificar o estado atual das credenciais

-- ========================================
-- 1. VERIFICAR CONFIGURAÇÕES EXISTENTES
-- ========================================

SELECT 
  '📋 CONFIGURAÇÕES WHATSAPP EXISTENTES' as diagnostico;

SELECT 
  id,
  "empresaId",
  tipo,
  ativo,
  "createdAt",
  "updatedAt",
  -- Credenciais (preview seguro)
  CASE 
    WHEN credenciais IS NOT NULL THEN
      jsonb_build_object(
        'whatsapp_api_token_length', LENGTH(credenciais->>'whatsapp_api_token'),
        'whatsapp_api_token_preview', LEFT(credenciais->>'whatsapp_api_token', 20) || '...',
        'whatsapp_phone_number_id', credenciais->>'whatsapp_phone_number_id',
        'whatsapp_business_account_id', credenciais->>'whatsapp_business_account_id',
        'has_webhook_verify_token', (credenciais->>'whatsapp_webhook_verify_token' IS NOT NULL)
      )::text
    ELSE 'NULL'
  END as credenciais_info,
  -- Colunas legadas
  "whatsappPhoneNumberId" as coluna_legada_phone,
  LENGTH("whatsappApiToken") as coluna_legada_token_length
FROM atendimento_canais_configuracao
WHERE tipo = 'whatsapp_business_api'
ORDER BY "updatedAt" DESC;

-- ========================================
-- 2. VERIFICAR SE HÁ MÚLTIPLAS CONFIGS
-- ========================================

SELECT 
  '⚠️ VERIFICAR DUPLICAÇÃO' as diagnostico;

SELECT 
  "empresaId",
  COUNT(*) as total_configs,
  COUNT(*) FILTER (WHERE ativo = true) as configs_ativas,
  STRING_AGG(id::text, ', ') as config_ids
FROM atendimento_canais_configuracao
WHERE tipo = 'whatsapp_business_api'
GROUP BY "empresaId"
HAVING COUNT(*) > 1;

-- ========================================
-- 3. VERIFICAR EMPRESA DEFAULT
-- ========================================

SELECT 
  '🏢 EMPRESA DEFAULT' as diagnostico;

SELECT 
  e.id as empresa_id,
  e."nomeFantasia" as nome_empresa,
  e."cnpj",
  e.ativo as empresa_ativa,
  (
    SELECT COUNT(*)
    FROM atendimento_canais_configuracao c
    WHERE c."empresaId" = e.id 
    AND c.tipo = 'whatsapp_business_api'
    AND c.ativo = true
  ) as whatsapp_configs_ativas
FROM empresas e
ORDER BY e."createdAt" ASC
LIMIT 1;

-- ========================================
-- 4. VERIFICAR TOKENS VAZIOS/INVÁLIDOS
-- ========================================

SELECT 
  '❌ PROBLEMAS IDENTIFICADOS' as diagnostico;

-- Config com credenciais vazias
SELECT 
  'Credenciais vazias ou incompletas' as problema,
  id,
  "empresaId",
  ativo
FROM atendimento_canais_configuracao
WHERE tipo = 'whatsapp_business_api'
AND (
  credenciais IS NULL 
  OR credenciais->>'whatsapp_api_token' IS NULL
  OR credenciais->>'whatsapp_phone_number_id' IS NULL
  OR LENGTH(credenciais->>'whatsapp_api_token') < 50
);

-- ========================================
-- 5. RECOMENDAÇÕES
-- ========================================

SELECT 
  '💡 PRÓXIMOS PASSOS' as diagnostico;

SELECT 
  CASE 
    WHEN COUNT(*) = 0 THEN '❌ NENHUMA configuração encontrada! Criar nova config via UI.'
    WHEN COUNT(*) FILTER (WHERE ativo = true) = 0 THEN '⚠️ Configs existem mas estão INATIVAS. Ativar uma config.'
    WHEN COUNT(*) FILTER (
      WHERE credenciais->>'whatsapp_api_token' IS NOT NULL 
      AND LENGTH(credenciais->>'whatsapp_api_token') > 50
    ) = 0 THEN '❌ Token inválido ou vazio. Atualizar token via UI (Integrações).'
    ELSE '✅ Config parece OK. Verificar se token/phone_number_id estão corretos na Meta.'
  END as recomendacao
FROM atendimento_canais_configuracao
WHERE tipo = 'whatsapp_business_api';

-- ========================================
-- 6. TEMPLATE PARA ATUALIZAR (SE NECESSÁRIO)
-- ========================================

SELECT 
  '📝 TEMPLATE UPDATE' as diagnostico;

SELECT 
  'UPDATE atendimento_canais_configuracao SET credenciais = jsonb_build_object(
    ''whatsapp_api_token'', ''SEU_TOKEN_AQUI'',
    ''whatsapp_phone_number_id'', ''SEU_PHONE_NUMBER_ID_AQUI'',
    ''whatsapp_business_account_id'', ''SEU_BUSINESS_ACCOUNT_ID_AQUI'',
    ''whatsapp_webhook_verify_token'', ''seu_webhook_token_aqui''
  ), ativo = true, "updatedAt" = NOW()
  WHERE id = ''' || id || ''';' as query_para_executar
FROM atendimento_canais_configuracao
WHERE tipo = 'whatsapp_business_api'
ORDER BY "updatedAt" DESC
LIMIT 1;
