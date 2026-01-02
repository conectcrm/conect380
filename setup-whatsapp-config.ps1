#!/usr/bin/env pwsh
# Script para criar/atualizar configuração WhatsApp via API

$ErrorActionPreference = "Continue"

Write-Host "`n🔧 CONFIGURAÇÃO WHATSAPP BUSINESS API" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════" -ForegroundColor Cyan

# 1. Login
Write-Host "`n[1/3] Fazendo login..." -ForegroundColor Yellow
$loginBody = @{
  email = "admin@conectsuite.com.br"
  senha = "admin123"
} | ConvertTo-Json

try {
  $login = Invoke-RestMethod `
    -Uri "http://localhost:3001/auth/login" `
    -Method Post `
    -ContentType "application/json" `
    -Body $loginBody
    
  $token = $login.data.access_token
  Write-Host "  ✅ Login OK" -ForegroundColor Green
}
catch {
  Write-Host "  ❌ Erro no login: $($_.Exception.Message)" -ForegroundColor Red
  exit 1
}

# 2. Verificar se já existe configuração
Write-Host "`n[2/3] Verificando configuração existente..." -ForegroundColor Yellow
try {
  $configs = Invoke-RestMethod `
    -Uri "http://localhost:3001/integracoes" `
    -Method Get `
    -Headers @{Authorization = "Bearer $token" } `
    -ErrorAction SilentlyContinue
    
  $whatsappConfig = $configs | Where-Object { 
    $_.tipo -eq 'whatsapp_business_api' -and 
    $_.empresaId -eq '11111111-1111-1111-1111-111111111111' 
  }
    
  if ($whatsappConfig) {
    Write-Host "  ℹ️  Configuração já existe: $($whatsappConfig.id)" -ForegroundColor Cyan
    Write-Host "  Status: $($whatsappConfig.ativo ? 'Ativo' : 'Inativo')" -ForegroundColor White
    $configId = $whatsappConfig.id
    $metodo = "PUT"
  }
  else {
    Write-Host "  ⚠️  Configuração não existe, será criada" -ForegroundColor Yellow
    $configId = $null
    $metodo = "POST"
  }
}
catch {
  Write-Host "  ⚠️  Não foi possível verificar configurações existentes" -ForegroundColor Yellow
  Write-Host "  Tentando criar nova..." -ForegroundColor Yellow
  $metodo = "POST"
}

# 3. Criar/Atualizar configuração
Write-Host "`n[3/3] $($metodo -eq 'POST' ? 'Criando' : 'Atualizando') configuração..." -ForegroundColor Yellow

# IMPORTANTE: Substitua estes valores pelos reais!
$configBody = @{
  empresaId    = "11111111-1111-1111-1111-111111111111"
  tipo         = "whatsapp_business_api"
  nome         = "WhatsApp Business API - Principal"
  ativo        = $true
  credenciais  = @{
    whatsapp_api_token            = "SEU_TOKEN_REAL_AQUI"  # ← TROCAR!
    whatsapp_phone_number_id      = "704423209430762"
    whatsapp_business_account_id  = "1922786558561358"
    whatsapp_webhook_verify_token = "conectcrm_webhook_token_123"
    whatsapp_app_secret           = "seu_app_secret_aqui"  # ← TROCAR!
  }
  configuracao = @{
    webhook_url = "https://7d426fa6a31b.ngrok-free.app/api/atendimento/webhooks/whatsapp/11111111-1111-1111-1111-111111111111"
    auto_reply  = $true
    use_ai      = $true
  }
} | ConvertTo-Json -Depth 10

try {
  if ($metodo -eq "POST") {
    $result = Invoke-RestMethod `
      -Uri "http://localhost:3001/integracoes" `
      -Method Post `
      -ContentType "application/json" `
      -Headers @{Authorization = "Bearer $token" } `
      -Body $configBody
        
    Write-Host "  ✅ Configuração CRIADA com sucesso!" -ForegroundColor Green
    Write-Host "  ID: $($result.id)" -ForegroundColor Cyan
  }
  else {
    $result = Invoke-RestMethod `
      -Uri "http://localhost:3001/integracoes/$configId" `
      -Method Put `
      -ContentType "application/json" `
      -Headers @{Authorization = "Bearer $token" } `
      -Body $configBody
        
    Write-Host "  ✅ Configuração ATUALIZADA com sucesso!" -ForegroundColor Green
  }
    
  Write-Host "`n📋 Detalhes:" -ForegroundColor Cyan
  Write-Host "  ID: $($result.id)" -ForegroundColor White
  Write-Host "  Tipo: $($result.tipo)" -ForegroundColor White
  Write-Host "  Ativo: $($result.ativo)" -ForegroundColor White
  Write-Host "  Phone Number ID: $($result.credenciais.whatsapp_phone_number_id)" -ForegroundColor White
    
}
catch {
  Write-Host "  ❌ Erro ao criar/atualizar: $($_.Exception.Message)" -ForegroundColor Red
  Write-Host "  Response: $($_.ErrorDetails.Message)" -ForegroundColor Yellow
    
  # Se falhar via API, tentar via SQL direto
  Write-Host "`n  ⚠️  Tentando via SQL direto..." -ForegroundColor Yellow
    
  $sqlCommand = @"
INSERT INTO integracoes_config (
    id, empresa_id, tipo, nome, ativo, credenciais, configuracao, created_at, updated_at
) VALUES (
    gen_random_uuid(),
    '11111111-1111-1111-1111-111111111111',
    'whatsapp_business_api',
    'WhatsApp Business API - Principal',
    true,
    '{"whatsapp_api_token":"SEU_TOKEN_AQUI","whatsapp_phone_number_id":"704423209430762","whatsapp_business_account_id":"1922786558561358","whatsapp_webhook_verify_token":"conectcrm_webhook_token_123","whatsapp_app_secret":"seu_app_secret_aqui"}'::jsonb,
    '{"webhook_url":"https://7d426fa6a31b.ngrok-free.app/api/atendimento/webhooks/whatsapp/11111111-1111-1111-1111-111111111111","auto_reply":true,"use_ai":true}'::jsonb,
    NOW(), NOW()
);
"@
    
  try {
    docker exec conectcrm-postgres psql -U postgres -d conectcrm_db -c $sqlCommand
    Write-Host "  ✅ Configuração criada via SQL!" -ForegroundColor Green
  }
  catch {
    Write-Host "  ❌ Falhou também via SQL: $_" -ForegroundColor Red
  }
}

Write-Host "`n═══════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "🏁 Processo concluído!" -ForegroundColor Green
Write-Host ""
Write-Host "⚠️  ATENÇÃO: Não esqueça de substituir os placeholders:" -ForegroundColor Yellow
Write-Host "   - SEU_TOKEN_REAL_AQUI" -ForegroundColor White
Write-Host "   - seu_app_secret_aqui" -ForegroundColor White
Write-Host ""
