# ============================================
# Script para Atualizar Token do WhatsApp
# ============================================

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "  🔄 ATUALIZAR TOKEN DO WHATSAPP" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""

# Verificar token atual
Write-Host "🔍 Verificando token atual..." -ForegroundColor Yellow
Write-Host ""

$query = "SELECT id, tipo, ativo, configuracao->'credenciais'->>'whatsapp_api_token' as token_atual, configuracao->'credenciais'->>'whatsapp_phone_number_id' as phone_id FROM canais WHERE tipo = 'whatsapp';"
$result = docker exec -it conectcrm-postgres psql -U conectcrm -d conectcrm_db -c "$query" 2>&1

if ($LASTEXITCODE -eq 0) {
  Write-Host $result
  Write-Host ""
    
  # Extrair token atual (primeiros 20 caracteres)
  $tokenLine = $result | Select-String "EAA"
  if ($tokenLine) {
    $currentToken = $tokenLine.ToString().Trim().Split('|')[0].Trim()
    $tokenPreview = $currentToken.Substring(0, [Math]::Min(30, $currentToken.Length)) + "..."
    Write-Host "📋 Token atual: $tokenPreview" -ForegroundColor Gray
  }
}
else {
  Write-Host "❌ Erro ao conectar no banco de dados" -ForegroundColor Red
  Write-Host "   Certifique-se que o Docker está rodando" -ForegroundColor Yellow
  exit 1
}

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host ""

# Solicitar novo token
Write-Host "📝 Cole o NOVO TOKEN do WhatsApp abaixo:" -ForegroundColor Yellow
Write-Host "   (Token deve começar com EAA...)" -ForegroundColor Gray
Write-Host ""
$newToken = Read-Host "Token"

# Validar token
if ([string]::IsNullOrWhiteSpace($newToken)) {
  Write-Host ""
  Write-Host "❌ Token não pode estar vazio!" -ForegroundColor Red
  exit 1
}

if (-not $newToken.StartsWith("EAA")) {
  Write-Host ""
  Write-Host "⚠️  ATENÇÃO: Token não começa com 'EAA'" -ForegroundColor Yellow
  Write-Host "   Tem certeza que é um token válido do WhatsApp Business API?" -ForegroundColor Yellow
  Write-Host ""
  $continue = Read-Host "Continuar mesmo assim? (s/N)"
  if ($continue -ne "s" -and $continue -ne "S") {
    Write-Host "❌ Operação cancelada" -ForegroundColor Red
    exit 1
  }
}

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host ""

# Atualizar token no banco
Write-Host "🔄 Atualizando token no banco de dados..." -ForegroundColor Yellow
Write-Host ""

$updateQuery = "UPDATE canais SET configuracao = jsonb_set(configuracao, '{credenciais,whatsapp_api_token}', '`"$newToken`"') WHERE tipo = 'whatsapp';"
$updateResult = docker exec -it conectcrm-postgres psql -U conectcrm -d conectcrm_db -c "$updateQuery" 2>&1

if ($LASTEXITCODE -eq 0) {
  Write-Host "✅ Token atualizado com sucesso!" -ForegroundColor Green
}
else {
  Write-Host "❌ Erro ao atualizar token:" -ForegroundColor Red
  Write-Host $updateResult
  exit 1
}

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host ""

# Verificar novo token
Write-Host "🔍 Verificando novo token salvo..." -ForegroundColor Yellow
Write-Host ""

$verifyQuery = "SELECT id, tipo, ativo, configuracao->'credenciais'->>'whatsapp_api_token' as token_novo, `"updatedAt`" FROM canais WHERE tipo = 'whatsapp';"
$verifyResult = docker exec -it conectcrm-postgres psql -U conectcrm -d conectcrm_db -c "$verifyQuery" 2>&1

Write-Host $verifyResult
Write-Host ""

# Testar token na API do WhatsApp
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host ""
Write-Host "🧪 Testando token na API do WhatsApp..." -ForegroundColor Yellow
Write-Host ""

# Pegar phone_number_id
$phoneIdQuery = "SELECT configuracao->'credenciais'->>'whatsapp_phone_number_id' as phone_id FROM canais WHERE tipo = 'whatsapp';"
$phoneIdResult = docker exec -it conectcrm-postgres psql -U conectcrm -d conectcrm_db -t -c "$phoneIdQuery" 2>&1
$phoneId = $phoneIdResult.Trim()

if ($phoneId) {
  Write-Host "📞 Phone Number ID: $phoneId" -ForegroundColor Gray
  Write-Host ""
    
  $headers = @{
    "Authorization" = "Bearer $newToken"
    "Content-Type"  = "application/json"
  }
    
  try {
    $response = Invoke-WebRequest `
      -Uri "https://graph.facebook.com/v21.0/$phoneId?fields=display_phone_number,verified_name,quality_rating" `
      -Headers $headers `
      -Method GET `
      -TimeoutSec 10 `
      -ErrorAction Stop
        
    Write-Host "✅ TOKEN VÁLIDO!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📊 Dados da conta:" -ForegroundColor Cyan
    $data = $response.Content | ConvertFrom-Json
    Write-Host "   Nome verificado: $($data.verified_name)" -ForegroundColor White
    Write-Host "   Número: $($data.display_phone_number)" -ForegroundColor White
    Write-Host "   Qualidade: $($data.quality_rating)" -ForegroundColor White
        
  }
  catch {
    Write-Host "❌ TOKEN INVÁLIDO!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Erro: $($_.Exception.Message)" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "⚠️  Possíveis causas:" -ForegroundColor Yellow
    Write-Host "   • Token expirado" -ForegroundColor Gray
    Write-Host "   • Token sem permissões corretas" -ForegroundColor Gray
    Write-Host "   • Phone Number ID incorreto" -ForegroundColor Gray
    Write-Host ""
    Write-Host "💡 Solução:" -ForegroundColor Cyan
    Write-Host "   Gere um novo token em:" -ForegroundColor Gray
    Write-Host "   https://business.facebook.com/settings/whatsapp-business-accounts" -ForegroundColor White
  }
}
else {
  Write-Host "⚠️  Não foi possível obter o Phone Number ID" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host ""
Write-Host "✨ Processo concluído!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Próximos passos:" -ForegroundColor Yellow
Write-Host "   1. Reinicie o backend (se estiver rodando)" -ForegroundColor Gray
Write-Host "   2. Teste enviando uma mensagem pelo sistema" -ForegroundColor Gray
Write-Host "   3. Verifique os logs do backend" -ForegroundColor Gray
Write-Host ""
