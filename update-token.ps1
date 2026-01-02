#!/usr/bin/env pwsh
# Script rápido para atualizar token WhatsApp

param(
  [Parameter(Mandatory = $true, HelpMessage = "Cole o novo token da Meta aqui")]
  [string]$Token
)

Write-Host "`n🔑 ATUALIZAÇÃO RÁPIDA DE TOKEN" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════" -ForegroundColor Cyan

# Validar token
if ($Token.Length -lt 50) {
  Write-Host "❌ Token muito curto! Um token válido tem 200+ caracteres" -ForegroundColor Red
  exit 1
}

Write-Host "`n1️⃣ Testando token com Meta API..." -ForegroundColor Yellow
try {
  $test = Invoke-RestMethod "https://graph.facebook.com/v18.0/me?access_token=$Token" -TimeoutSec 10
  Write-Host "  ✅ Token válido! App: $($test.id)" -ForegroundColor Green
}
catch {
  Write-Host "  ❌ Token inválido: $($_.Exception.Message)" -ForegroundColor Red
  exit 1
}

Write-Host "`n2️⃣ Atualizando no banco..." -ForegroundColor Yellow
$sql = "UPDATE atendimento_integracoes_config SET whatsapp_api_token='$Token', credenciais=jsonb_set(COALESCE(credenciais,'{}')::jsonb,'{whatsapp_api_token}','`"$Token`"'), atualizado_em=NOW() WHERE empresa_id='11111111-1111-1111-1111-111111111111' AND tipo='whatsapp_business_api';"

docker exec conectcrm-postgres psql -U conectcrm -d conectcrm_db -c $sql

Write-Host "`n✅ CONCLUÍDO! Token atualizado." -ForegroundColor Green
Write-Host "   Tente enviar mensagem novamente.`n" -ForegroundColor Cyan
