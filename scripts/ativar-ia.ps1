#!/usr/bin/env pwsh
# ============================================
# SCRIPT: Ativar IA no ConectCRM
# ============================================
# Data: 19/12/2025
# Objetivo: Inserir configuração OpenAI no banco de dados

param(
  [switch]$DryRun = $false
)

$ErrorActionPreference = "Stop"

Write-Host "`n╔════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║                                                        ║" -ForegroundColor Cyan
Write-Host "║         🤖 ATIVAÇÃO IA - ConectCRM                    ║" -ForegroundColor Cyan
Write-Host "║                                                        ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════╝" -ForegroundColor Cyan

# ============================================
# 1. Ler .env para pegar DB_PASSWORD
# ============================================
Write-Host "`n📋 1. Lendo configuração do banco..." -ForegroundColor Yellow

$envFile = "backend\.env"
if (-not (Test-Path $envFile)) {
  Write-Host "   ❌ Arquivo .env não encontrado em backend/" -ForegroundColor Red
  exit 1
}

$env = Get-Content $envFile -Raw
$dbHost = if ($env -match 'DATABASE_HOST=(.+)') { $matches[1].Trim() } else { 'localhost' }
$dbPort = if ($env -match 'DATABASE_PORT=(.+)') { $matches[1].Trim() } else { '5432' }
$dbName = if ($env -match 'DATABASE_NAME=(.+)') { $matches[1].Trim() } else { 'conectcrm' }
$dbUser = if ($env -match 'DATABASE_USERNAME=(.+)') { $matches[1].Trim() } else { 'postgres' }
$dbPass = if ($env -match 'DATABASE_PASSWORD=(.+)') { $matches[1].Trim() } else { '' }
$apiKey = if ($env -match 'OPENAI_API_KEY=(.+)') { 
  $matches[1].Trim().Replace("`n", "").Replace("`r", "") 
}
else { 
  '' 
}

Write-Host "   ✅ Host: $dbHost" -ForegroundColor Green
Write-Host "   ✅ Porta: $dbPort" -ForegroundColor Green
Write-Host "   ✅ Banco: $dbName" -ForegroundColor Green
Write-Host "   ✅ Usuário: $dbUser" -ForegroundColor Green

if (-not $apiKey -or $apiKey -eq '') {
  Write-Host "   ❌ OPENAI_API_KEY não encontrada no .env" -ForegroundColor Red
  exit 1
}

Write-Host "   ✅ API Key: $($apiKey.Substring(0, 20))..." -ForegroundColor Green

# ============================================
# 2. Preparar SQL
# ============================================
Write-Host "`n📋 2. Preparando SQL..." -ForegroundColor Yellow

$sql = @"
-- Verificar se já existe
DO `$`$
DECLARE
  v_count INTEGER;
  v_id UUID;
BEGIN
  -- Contar registros existentes
  SELECT COUNT(*) INTO v_count
  FROM atendimento_integracoes_config
  WHERE tipo = 'openai' AND empresa_id = '11111111-1111-1111-1111-111111111111';

  IF v_count = 0 THEN
    -- Inserir novo
    RAISE NOTICE '➕ Inserindo nova integração OpenAI...';
    
    INSERT INTO atendimento_integracoes_config (
      id, empresa_id, tipo, ativo, credenciais, whatsapp_ativo, criado_em, atualizado_em
    ) VALUES (
      gen_random_uuid(),
      '11111111-1111-1111-1111-111111111111',
      'openai',
      true,
      jsonb_build_object(
        'apiKey', '$apiKey',
        'model', 'gpt-4o-mini',
        'temperature', 0.7,
        'maxTokens', 500,
        'systemPrompt', 'Você é um assistente virtual inteligente e prestativo. Responda de forma clara, objetiva e profissional.'
      ),
      true,
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    )
    RETURNING id INTO v_id;
    
    RAISE NOTICE '✅ Integração criada: %', v_id;
  ELSE
    -- Atualizar existente
    RAISE NOTICE '♻️ Atualizando integração existente...';
    
    UPDATE atendimento_integracoes_config
    SET 
      ativo = true,
      whatsapp_ativo = true,
      credenciais = jsonb_build_object(
        'apiKey', '$apiKey',
        'model', 'gpt-4o-mini',
        'temperature', 0.7,
        'maxTokens', 500,
        'systemPrompt', 'Você é um assistente virtual inteligente e prestativo. Responda de forma clara, objetiva e profissional.'
      ),
      atualizado_em = CURRENT_TIMESTAMP
    WHERE tipo = 'openai' AND empresa_id = '11111111-1111-1111-1111-111111111111'
    RETURNING id INTO v_id;
    
    RAISE NOTICE '✅ Integração atualizada: %', v_id;
  END IF;
END `$`$;

-- Mostrar resultado
SELECT 
  id,
  tipo,
  ativo,
  whatsapp_ativo,
  credenciais->>'model' as modelo,
  LEFT(credenciais->>'apiKey', 20) || '...' as api_key,
  criado_em,
  atualizado_em
FROM atendimento_integracoes_config
WHERE tipo = 'openai' AND empresa_id = '11111111-1111-1111-1111-111111111111';
"@

if ($DryRun) {
  Write-Host "`n🔍 Modo DRY-RUN - SQL que seria executado:" -ForegroundColor Magenta
  Write-Host $sql -ForegroundColor Gray
  exit 0
}

# ============================================
# 3. Executar SQL
# ============================================
Write-Host "`n📋 3. Executando SQL no banco..." -ForegroundColor Yellow

$env:PGPASSWORD = $dbPass

try {
  $result = & psql -h $dbHost -p $dbPort -U $dbUser -d $dbName -c $sql 2>&1
    
  if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✅ SQL executado com sucesso!" -ForegroundColor Green
    Write-Host $result -ForegroundColor White
  }
  else {
    Write-Host "`n❌ Erro ao executar SQL:" -ForegroundColor Red
    Write-Host $result -ForegroundColor Red
    exit 1
  }
}
catch {
  Write-Host "`n❌ Erro: $_" -ForegroundColor Red
  exit 1
}

# ============================================
# 4. Verificar
# ============================================
Write-Host "`n📋 4. Verificando integração..." -ForegroundColor Yellow

$checkSql = "SELECT tipo, ativo, whatsapp_ativo, credenciais->>'model' as modelo FROM atendimento_integracoes_config WHERE tipo = 'openai' AND empresa_id = '11111111-1111-1111-1111-111111111111';"

$checkResult = & psql -h $dbHost -p $dbPort -U $dbUser -d $dbName -c $checkSql 2>&1

if ($checkResult -match 'openai.*true.*true.*gpt-4o-mini') {
  Write-Host "`n╔════════════════════════════════════════════════════════╗" -ForegroundColor Green
  Write-Host "║                                                        ║" -ForegroundColor Green
  Write-Host "║         ✅ IA ATIVADA COM SUCESSO!                    ║" -ForegroundColor Green
  Write-Host "║                                                        ║" -ForegroundColor Green
  Write-Host "╚════════════════════════════════════════════════════════╝" -ForegroundColor Green
    
  Write-Host "`n📝 Próximos passos:" -ForegroundColor Cyan
  Write-Host "   1. Reiniciar backend: cd backend && npm run start:dev" -ForegroundColor White
  Write-Host "   2. Enviar mensagem de teste via WhatsApp" -ForegroundColor White
  Write-Host "   3. Verificar logs: deve aparecer '🤖 Gerando resposta com IA...'" -ForegroundColor White
  Write-Host ""
}
else {
  Write-Host "`n❌ Integração não foi ativada corretamente" -ForegroundColor Red
  Write-Host $checkResult -ForegroundColor Red
  exit 1
}
