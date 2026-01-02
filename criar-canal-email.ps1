# ============================================
# Script para criar canal de e-mail via API
# ============================================

Write-Host "`n📧 Criando Canal de E-mail no Sistema..." -ForegroundColor Cyan
Write-Host "============================================`n" -ForegroundColor Cyan

# 1. Fazer login para obter token
Write-Host "🔐 Etapa 1: Fazendo login..." -ForegroundColor Yellow

$loginBody = @{
  email = "admin@conectsuite.com.br"
  senha = "Admin123"
} | ConvertTo-Json

try {
  $loginResponse = Invoke-RestMethod -Uri "http://localhost:3001/auth/login" `
    -Method POST `
    -Body $loginBody `
    -ContentType "application/json"
    
  $token = $loginResponse.access_token
    
  if ($token) {
    Write-Host "✅ Login realizado com sucesso!" -ForegroundColor Green
    Write-Host "   Token: $($token.Substring(0, 20))..." -ForegroundColor Gray
  }
  else {
    throw "Token não retornado no login"
  }
}
catch {
  Write-Host "❌ Erro ao fazer login:" $_.Exception.Message -ForegroundColor Red
  Write-Host "`n💡 Certifique-se de que:" -ForegroundColor Yellow
  Write-Host "   - Backend está rodando (http://localhost:3001)" -ForegroundColor Gray
  Write-Host "   - Credenciais estão corretas (admin@conectsuite.com.br / Admin123)" -ForegroundColor Gray
  exit 1
}

# 2. Criar canal de e-mail
Write-Host "`n📧 Etapa 2: Criando canal de e-mail..." -ForegroundColor Yellow

$headers = @{
  "Authorization" = "Bearer $token"
  "Content-Type"  = "application/json"
}

try {
  $canalResponse = Invoke-RestMethod -Uri "http://localhost:3001/api/atendimento/canais/criar-canal-email" `
    -Method POST `
    -Headers $headers
    
  if ($canalResponse.success) {
    Write-Host "✅ Canal de e-mail criado com sucesso!" -ForegroundColor Green
        
    if ($canalResponse.alreadyExists) {
      Write-Host "   ℹ️  Canal já existia anteriormente" -ForegroundColor Cyan
    }
        
    Write-Host "`n📊 Detalhes do Canal:" -ForegroundColor Cyan
    Write-Host "   ID: $($canalResponse.data.id)" -ForegroundColor Gray
    Write-Host "   Nome: $($canalResponse.data.nome)" -ForegroundColor Gray
    Write-Host "   Tipo: $($canalResponse.data.tipo)" -ForegroundColor Gray
    Write-Host "   Provedor: $($canalResponse.data.provedor)" -ForegroundColor Gray
    Write-Host "   Status: $($canalResponse.data.status)" -ForegroundColor Gray
  }
  else {
    throw $canalResponse.message
  }
}
catch {
  Write-Host "❌ Erro ao criar canal:" $_.Exception.Message -ForegroundColor Red
  exit 1
}

# 3. Verificar canais disponíveis
Write-Host "`n🔍 Etapa 3: Verificando canais disponíveis..." -ForegroundColor Yellow

try {
  $canaisResponse = Invoke-RestMethod -Uri "http://localhost:3001/api/atendimento/canais" `
    -Method GET `
    -Headers $headers
    
  Write-Host "✅ Canais encontrados: $($canaisResponse.total)" -ForegroundColor Green
    
  foreach ($canal in $canaisResponse.data) {
    $emoji = switch ($canal.tipo) {
      "whatsapp" { "📱" }
      "email" { "📧" }
      "telegram" { "✈️" }
      "chat" { "💬" }
      default { "📞" }
    }
        
    Write-Host "   $emoji $($canal.nome) ($($canal.tipo))" -ForegroundColor Gray
  }
}
catch {
  Write-Host "⚠️  Erro ao listar canais:" $_.Exception.Message -ForegroundColor Yellow
}

Write-Host "`n============================================" -ForegroundColor Cyan
Write-Host "✅ Processo concluído!" -ForegroundColor Green
Write-Host "`n💡 Próximos passos:" -ForegroundColor Cyan
Write-Host "   1. Acesse: http://localhost:3000/nuclei/atendimento/canais/email" -ForegroundColor Gray
Write-Host "   2. Configure suas credenciais SendGrid" -ForegroundColor Gray
Write-Host "   3. Teste o envio de e-mail" -ForegroundColor Gray
Write-Host "   4. Crie um atendimento por e-mail no modal`n" -ForegroundColor Gray
