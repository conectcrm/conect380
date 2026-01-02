# Script de Debug WhatsApp Meta
# Testa envio direto para API da Meta com diferentes números

Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "🔍 DEBUG WHATSAPP META - TESTE DE NÚMEROS" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# 1. Buscar credenciais do banco
Write-Host "📂 1. Buscando credenciais do banco de dados..." -ForegroundColor Yellow

$env:PGPASSWORD = "conectcrm123"
$query = @"
SELECT 
    credenciais->>'whatsapp_api_token' as token,
    credenciais->>'whatsapp_phone_number_id' as phone_id
FROM atendimento_integracoes_config
WHERE tipo = 'whatsapp_business_api' AND ativo = true
LIMIT 1;
"@

$result = psql -h localhost -p 5434 -U conectcrm -d conectcrm_db -t -A -c $query

if (!$result) {
  Write-Host "❌ ERRO: Não foi possível buscar credenciais do banco" -ForegroundColor Red
  exit 1
}

$parts = $result.Split('|')
$token = $parts[0].Trim()
$phoneId = $parts[1].Trim()

Write-Host "   ✅ Token: $($token.Substring(0,20))..." -ForegroundColor Green
Write-Host "   ✅ Phone ID: $phoneId" -ForegroundColor Green
Write-Host ""

# 2. Teste com número OFICIAL da Meta (sempre funciona)
Write-Host "📱 2. Testando com número OFICIAL da Meta (+1 555 025-3788)..." -ForegroundColor Yellow

$bodyOficial = @{
  messaging_product = "whatsapp"
  to                = "+15550253788"
  type              = "text"
  text              = @{
    body = "✅ Teste ConectCRM - Número Oficial Meta - $(Get-Date -Format 'HH:mm:ss')"
  }
} | ConvertTo-Json -Depth 10

$headers = @{
  "Authorization" = "Bearer $token"
  "Content-Type"  = "application/json"
}

try {
  $response = Invoke-RestMethod `
    -Uri "https://graph.facebook.com/v23.0/$phoneId/messages" `
    -Method Post `
    -Headers $headers `
    -Body $bodyOficial
    
  Write-Host "   ✅ SUCESSO com número oficial!" -ForegroundColor Green
  Write-Host "   📨 Message ID: $($response.messages[0].id)" -ForegroundColor Cyan
  Write-Host ""
    
  $oficiallFunciona = $true
    
}
catch {
  Write-Host "   ❌ ERRO com número oficial:" -ForegroundColor Red
  Write-Host "   $($_.Exception.Message)" -ForegroundColor Red
  Write-Host ""
    
  $oficiallFunciona = $false
}

# 3. Teste com número BRASILEIRO (5562996689991)
Write-Host "📱 3. Testando com número BRASILEIRO (+55 62 99668-9991)..." -ForegroundColor Yellow

$bodyBrasil = @{
  messaging_product = "whatsapp"
  to                = "+5562996689991"
  type              = "text"
  text              = @{
    body = "✅ Teste ConectCRM - Número Brasil - $(Get-Date -Format 'HH:mm:ss')"
  }
} | ConvertTo-Json -Depth 10

try {
  $response = Invoke-RestMethod `
    -Uri "https://graph.facebook.com/v23.0/$phoneId/messages" `
    -Method Post `
    -Headers $headers `
    -Body $bodyBrasil
    
  Write-Host "   ✅ SUCESSO com número brasileiro!" -ForegroundColor Green
  Write-Host "   📨 Message ID: $($response.messages[0].id)" -ForegroundColor Cyan
  Write-Host ""
    
  $brasilFunciona = $true
    
}
catch {
  $errorResponse = $_.ErrorDetails.Message | ConvertFrom-Json
  Write-Host "   ❌ ERRO com número brasileiro:" -ForegroundColor Red
  Write-Host "   Código: $($errorResponse.error.code)" -ForegroundColor Red
  Write-Host "   Mensagem: $($errorResponse.error.message)" -ForegroundColor Red
  Write-Host ""
    
  $brasilFunciona = $false
}

# 4. CONCLUSÃO
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "📊 RESULTADO DO DIAGNÓSTICO" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

if ($oficiallFunciona -and $brasilFunciona) {
  Write-Host "✅ AMBOS OS NÚMEROS FUNCIONAM!" -ForegroundColor Green
  Write-Host "   O problema estava no código (já corrigido)." -ForegroundColor Green
  Write-Host ""
    
}
elseif ($oficiallFunciona -and !$brasilFunciona) {
  Write-Host "⚠️ APENAS NÚMERO OFICIAL FUNCIONA" -ForegroundColor Yellow
  Write-Host ""
  Write-Host "📋 Credenciais estão CORRETAS, mas o número +5562996689991" -ForegroundColor Cyan
  Write-Host "   NÃO está REALMENTE autorizado no Meta Business Manager." -ForegroundColor Cyan
  Write-Host ""
  Write-Host "🔧 SOLUÇÕES:" -ForegroundColor Yellow
  Write-Host "   1. Acesse: https://business.facebook.com/" -ForegroundColor White
  Write-Host "   2. WhatsApp Manager > Phone Numbers" -ForegroundColor White
  Write-Host "   3. Clique no número +1 555 159 7121" -ForegroundColor White
  Write-Host "   4. Aba 'Test Numbers' ou 'Números de Teste'" -ForegroundColor White
  Write-Host "   5. VERIFIQUE se +5562996689991 aparece na lista" -ForegroundColor White
  Write-Host "   6. Se NÃO aparecer, clique 'Add Test Number'" -ForegroundColor White
  Write-Host "   7. Digite: +55 62 99668-9991" -ForegroundColor White
  Write-Host "   8. Clique 'Save' ou 'Salvar'" -ForegroundColor White
  Write-Host "   9. AGUARDE 1-2 minutos para propagação" -ForegroundColor White
  Write-Host "  10. Execute este script novamente" -ForegroundColor White
  Write-Host ""
  Write-Host "💡 ALTERNATIVA: Use o número oficial +15550253788 para testes" -ForegroundColor Cyan
  Write-Host ""
    
}
elseif (!$oficiallFunciona) {
  Write-Host "❌ PROBLEMA NAS CREDENCIAIS" -ForegroundColor Red
  Write-Host ""
  Write-Host "   Nem o número oficial funcionou." -ForegroundColor Yellow
  Write-Host "   Isso indica problema no token ou Phone Number ID." -ForegroundColor Yellow
  Write-Host ""
  Write-Host "🔧 VERIFIQUE:" -ForegroundColor Yellow
  Write-Host "   1. Token não expirou?" -ForegroundColor White
  Write-Host "   2. Phone Number ID está correto?" -ForegroundColor White
  Write-Host "   3. Token tem permissões whatsapp_business_messaging?" -ForegroundColor White
  Write-Host ""
}

Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
