# ========================================================================
# 🔑 CONFIGURAÇÃO DO TOKEN NGROK
# ========================================================================
#
# Este script ajuda a configurar o authtoken do ngrok
#
# Uso: .\configure-ngrok-token.ps1
#
# ========================================================================

$SuccessColor = "Green"
$ErrorColor = "Red"
$InfoColor = "Cyan"
$WarningColor = "Yellow"

Write-Host "`n╔═══════════════════════════════════════════════════════════════╗" -ForegroundColor $InfoColor
Write-Host "║  🔑 CONFIGURAÇÃO DO AUTHTOKEN NGROK                        ║" -ForegroundColor White
Write-Host "╚═══════════════════════════════════════════════════════════════╝`n" -ForegroundColor $InfoColor

Write-Host "📝 Para obter seu authtoken:`n" -ForegroundColor $WarningColor
Write-Host "   1. Acesse: https://dashboard.ngrok.com/get-started/your-authtoken" -ForegroundColor White
Write-Host "   2. Faça login (ou crie uma conta gratuita)" -ForegroundColor White
Write-Host "   3. Copie o token que aparece na página`n" -ForegroundColor White

Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor Gray

# Solicitar token
$token = Read-Host "Cole seu authtoken aqui"

if ([string]::IsNullOrWhiteSpace($token)) {
  Write-Host "`n❌ Token não pode estar vazio!" -ForegroundColor $ErrorColor
  exit 1
}

Write-Host "`n🔄 Configurando token..." -ForegroundColor $InfoColor

try {
  # Executar comando ngrok authtoken
  $result = & ngrok authtoken $token 2>&1
    
  if ($LASTEXITCODE -eq 0) {
    Write-Host "`n╔═══════════════════════════════════════════════════════════════╗" -ForegroundColor $SuccessColor
    Write-Host "║                                                               ║" -ForegroundColor $SuccessColor
    Write-Host "║        ✅ AUTHTOKEN CONFIGURADO COM SUCESSO! ✅              ║" -ForegroundColor White
    Write-Host "║                                                               ║" -ForegroundColor $SuccessColor
    Write-Host "╚═══════════════════════════════════════════════════════════════╝" -ForegroundColor $SuccessColor
        
    Write-Host "`n🎉 Token ngrok autenticado e salvo!" -ForegroundColor $WarningColor
        
    Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
        
    Write-Host "`n🚀 PRÓXIMO PASSO - ESCOLHA UMA OPÇÃO:" -ForegroundColor $WarningColor
        
    Write-Host "`n   OPÇÃO 1: INICIAR AUTOMATICAMENTE (Recomendado) 🎯`n" -ForegroundColor $InfoColor
    Write-Host "   " -NoNewline
    Write-Host ".\start-dev-with-ngrok.ps1" -ForegroundColor Black -BackgroundColor Green
        
    Write-Host "`n   O que vai acontecer:" -ForegroundColor $WarningColor
    Write-Host "   • Backend NestJS iniciado (porta 3001)" -ForegroundColor White
    Write-Host "   • Frontend React iniciado (porta 3000)" -ForegroundColor White
    Write-Host "   • ngrok conectado" -ForegroundColor White
    Write-Host "   • URL pública obtida e copiada" -ForegroundColor White
    Write-Host "   • Dashboard aberto (http://127.0.0.1:4040)" -ForegroundColor White
    Write-Host "   • Instruções de webhooks exibidas`n" -ForegroundColor White
        
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
        
    Write-Host "`n   OPÇÃO 2: INICIAR APENAS BACKEND + NGROK 🔧`n" -ForegroundColor $InfoColor
    Write-Host "   " -NoNewline
    Write-Host ".\start-dev-with-ngrok.ps1 -SkipFrontend" -ForegroundColor White -BackgroundColor DarkBlue
        
    Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
        
    Write-Host "`n   OPÇÃO 3: MANUAL (Você controla tudo) 🛠️`n" -ForegroundColor $InfoColor
    Write-Host "   # Terminal 1:" -ForegroundColor $WarningColor
    Write-Host "   cd backend" -ForegroundColor White
    Write-Host "   npm run start:dev`n" -ForegroundColor White
    Write-Host "   # Terminal 2:" -ForegroundColor $WarningColor
    Write-Host "   ngrok http 3001`n" -ForegroundColor White
        
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
        
    Write-Host "`n💡 RECOMENDAÇÃO:" -ForegroundColor $SuccessColor
    Write-Host "   Execute a OPÇÃO 1 para iniciar tudo automaticamente!`n" -ForegroundColor White
        
  }
  else {
    throw "Erro ao configurar token"
  }
}
catch {
  Write-Host "`n❌ ERRO ao configurar token!" -ForegroundColor $ErrorColor
  Write-Host "   Mensagem: $($_.Exception.Message)" -ForegroundColor $ErrorColor
  Write-Host "`n   Tente executar manualmente:" -ForegroundColor $WarningColor
  Write-Host "   ngrok authtoken SEU_TOKEN`n" -ForegroundColor White
  exit 1
}
