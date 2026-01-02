# Script para atualizar credenciais do WhatsApp
# Uso: .\atualizar-credenciais-whatsapp.ps1 -Token "EAA..." -PhoneNumberId "704423209430762"

param(
  [Parameter(Mandatory = $true)]
  [string]$Token,
    
  [Parameter(Mandatory = $false)]
  [string]$PhoneNumberId = "704423209430762",
    
  [Parameter(Mandatory = $false)]
  [string]$BusinessAccountId = "1922786558561358"
)

Write-Host "`n🔑 Atualizando Credenciais WhatsApp..." -ForegroundColor Cyan
Write-Host "   Token: $($Token.Substring(0,20))..." -ForegroundColor Gray
Write-Host "   Phone Number ID: $PhoneNumberId" -ForegroundColor Gray
Write-Host "   Business Account ID: $BusinessAccountId`n" -ForegroundColor Gray

# 1. Atualizar no banco de dados
Write-Host "📊 Atualizando banco de dados..." -ForegroundColor Yellow

$sql = @"
UPDATE atendimento_integracoes_config 
SET credenciais = jsonb_set(
    jsonb_set(
        jsonb_set(
            credenciais,
            '{whatsapp_api_token}',
            '"$Token"'
        ),
        '{whatsapp_phone_number_id}',
        '"$PhoneNumberId"'
    ),
    '{whatsapp_business_account_id}',
    '"$BusinessAccountId"'
)
WHERE tipo = 'whatsapp_business_api';

-- Verificar
SELECT id, tipo, 
    credenciais->>'whatsapp_phone_number_id' as phone_id,
    substring(credenciais->>'whatsapp_api_token', 1, 20) || '...' as token_preview
FROM atendimento_integracoes_config 
WHERE tipo = 'whatsapp_business_api';
"@

$env:PGPASSWORD = 'conectcrm123'
$result = $sql | psql -U conectcrm -d conectcrm_db -h localhost -p 5434

if ($LASTEXITCODE -eq 0) {
  Write-Host "✅ Banco de dados atualizado!" -ForegroundColor Green
}
else {
  Write-Host "❌ Erro ao atualizar banco!" -ForegroundColor Red
  exit 1
}

# 2. Atualizar .env (backup)
Write-Host "`n📝 Atualizando .env..." -ForegroundColor Yellow

$envPath = "backend\.env"
$envContent = Get-Content $envPath -Raw

$envContent = $envContent -replace 'WHATSAPP_ACCESS_TOKEN=.*', "WHATSAPP_ACCESS_TOKEN=$Token"
$envContent = $envContent -replace 'WHATSAPP_PHONE_NUMBER_ID=.*', "WHATSAPP_PHONE_NUMBER_ID=$PhoneNumberId"
$envContent = $envContent -replace 'WHATSAPP_BUSINESS_ACCOUNT_ID=.*', "WHATSAPP_BUSINESS_ACCOUNT_ID=$BusinessAccountId"

Set-Content $envPath -Value $envContent -NoNewline

Write-Host "✅ .env atualizado!" -ForegroundColor Green

# 3. Testar credenciais
Write-Host "`n🧪 Testando credenciais..." -ForegroundColor Yellow

$headers = @{
  "Authorization" = "Bearer $Token"
  "Content-Type"  = "application/json"
}

$body = @{
  messaging_product = "whatsapp"
  to                = "15550253788"  # Número de teste oficial da Meta
  type              = "template"
  template          = @{
    name     = "hello_world"
    language = @{
      code = "en_US"
    }
  }
} | ConvertTo-Json

try {
  $response = Invoke-RestMethod -Uri "https://graph.facebook.com/v23.0/$PhoneNumberId/messages" -Method POST -Headers $headers -Body $body
  Write-Host "✅ Credenciais válidas! Mensagem enviada com sucesso!" -ForegroundColor Green
  Write-Host "   Message ID: $($response.messages[0].id)" -ForegroundColor Gray
}
catch {
  Write-Host "❌ Erro ao testar: $_" -ForegroundColor Red
  Write-Host "⚠️  Verifique se o token e Phone Number ID estão corretos!" -ForegroundColor Yellow
}

Write-Host "`n🔄 Próximo passo: Reinicie o backend para carregar novas credenciais!" -ForegroundColor Cyan
Write-Host "   Comando: cd backend && npm run start:dev`n" -ForegroundColor Gray
