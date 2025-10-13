# ========================================================================
# 🔧 CONFIGURAÇÃO RÁPIDA DE NGROK PARA WEBHOOKS WHATSAPP
# ========================================================================
#
# Este script verifica se o ngrok está instalado e configurado,
# depois orienta sobre os próximos passos.
#
# Uso: .\setup-ngrok-webhook.ps1
#
# ========================================================================

$SuccessColor = "Green"
$ErrorColor = "Red"
$InfoColor = "Cyan"
$WarningColor = "Yellow"

function Write-Header {
  param([string]$Text)
  Write-Host "`n╔═══════════════════════════════════════════════════════════════╗" -ForegroundColor $SuccessColor
  Write-Host "║  $Text" -ForegroundColor White
  Write-Host "╚═══════════════════════════════════════════════════════════════╝" -ForegroundColor $SuccessColor
}

Write-Header "🔧 CONFIGURAÇÃO WEBHOOK WHATSAPP"

# ========================================================================
# PASSO 1: VERIFICAR NGROK
# ========================================================================

Write-Host "`n📍 PASSO 1: Verificando ngrok..." -ForegroundColor $InfoColor

try {
  $ngrokVersion = & ngrok version 2>&1
  if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ ngrok instalado: $ngrokVersion" -ForegroundColor $SuccessColor
    $ngrokInstalado = $true
  }
  else {
    throw "ngrok não encontrado"
  }
}
catch {
  Write-Host "❌ ngrok não está instalado!" -ForegroundColor $ErrorColor
  Write-Host "`n📥 COMO INSTALAR O NGROK:`n" -ForegroundColor $WarningColor
  Write-Host "   1. Acesse: https://ngrok.com/download" -ForegroundColor White
  Write-Host "   2. Baixe o executável para Windows" -ForegroundColor White
  Write-Host "   3. Extraia para uma pasta (ex: C:\ngrok)" -ForegroundColor White
  Write-Host "   4. Adicione ao PATH ou copie para C:\Windows\System32`n" -ForegroundColor White
    
  $ngrokInstalado = $false
}

# ========================================================================
# PASSO 2: VERIFICAR AUTENTICAÇÃO DO NGROK
# ========================================================================

if ($ngrokInstalado) {
  Write-Host "`n📍 PASSO 2: Verificando autenticação..." -ForegroundColor $InfoColor
    
  # Verificar se o config existe
  $ngrokConfigPath = "$env:USERPROFILE\.ngrok2\ngrok.yml"
    
  if (Test-Path $ngrokConfigPath) {
    $configContent = Get-Content $ngrokConfigPath -Raw
    if ($configContent -match "authtoken:\s+\S+") {
      Write-Host "✅ ngrok autenticado!" -ForegroundColor $SuccessColor
      $ngrokAutenticado = $true
    }
    else {
      Write-Host "⚠️  Token não encontrado no config" -ForegroundColor $WarningColor
      $ngrokAutenticado = $false
    }
  }
  else {
    Write-Host "⚠️  Arquivo de config não encontrado" -ForegroundColor $WarningColor
    $ngrokAutenticado = $false
  }
    
  if (-not $ngrokAutenticado) {
    Write-Host "`n🔑 COMO AUTENTICAR O NGROK:`n" -ForegroundColor $WarningColor
    Write-Host "   1. Acesse: https://dashboard.ngrok.com/get-started/your-authtoken" -ForegroundColor White
    Write-Host "   2. Copie seu authtoken" -ForegroundColor White
    Write-Host "   3. Execute: ngrok authtoken SEU_TOKEN_AQUI`n" -ForegroundColor White
        
    Write-Host "📋 Ou execute este comando:`n" -ForegroundColor $InfoColor
    Write-Host "   .\configure-ngrok-token.ps1`n" -ForegroundColor Black -BackgroundColor White
  }
}

# ========================================================================
# PASSO 3: VERIFICAR BACKEND
# ========================================================================

Write-Host "`n📍 PASSO 3: Verificando backend..." -ForegroundColor $InfoColor

$backendRunning = Get-NetTCPConnection -LocalPort 3001 -State Listen -ErrorAction SilentlyContinue

if ($backendRunning) {
  Write-Host "✅ Backend rodando na porta 3001" -ForegroundColor $SuccessColor
}
else {
  Write-Host "⚠️  Backend NÃO está rodando" -ForegroundColor $WarningColor
  Write-Host "`n🚀 Para iniciar o backend:`n" -ForegroundColor $InfoColor
  Write-Host "   cd backend" -ForegroundColor White
  Write-Host "   npm run start:dev`n" -ForegroundColor White
}

# ========================================================================
# RESUMO E PRÓXIMOS PASSOS
# ========================================================================

Write-Host "`n" -NoNewline
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray

Write-Host "`n📊 RESUMO DA VERIFICAÇÃO:`n" -ForegroundColor $WarningColor

if ($ngrokInstalado) {
  Write-Host "   ✅ ngrok instalado" -ForegroundColor $SuccessColor
}
else {
  Write-Host "   ❌ ngrok NÃO instalado" -ForegroundColor $ErrorColor
}

if ($ngrokAutenticado) {
  Write-Host "   ✅ ngrok autenticado" -ForegroundColor $SuccessColor
}
else {
  Write-Host "   ⚠️  ngrok NÃO autenticado" -ForegroundColor $WarningColor
}

if ($backendRunning) {
  Write-Host "   ✅ Backend rodando" -ForegroundColor $SuccessColor
}
else {
  Write-Host "   ⚠️  Backend NÃO rodando" -ForegroundColor $WarningColor
}

Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray

# ========================================================================
# PRÓXIMOS PASSOS
# ========================================================================

if ($ngrokInstalado -and $ngrokAutenticado -and $backendRunning) {
  Write-Host "`n🎯 TUDO PRONTO! Próximos passos:`n" -ForegroundColor $SuccessColor
    
  Write-Host "   OPÇÃO 1: Iniciar tudo automaticamente (RECOMENDADO) 🚀`n" -ForegroundColor $InfoColor
  Write-Host "   .\start-dev-with-ngrok.ps1`n" -ForegroundColor Black -BackgroundColor Green
    
  Write-Host "   Isso vai:" -ForegroundColor White
  Write-Host "   • Iniciar backend (se não estiver rodando)" -ForegroundColor Gray
  Write-Host "   • Iniciar frontend" -ForegroundColor Gray
  Write-Host "   • Iniciar ngrok" -ForegroundColor Gray
  Write-Host "   • Mostrar URL pública para configurar webhook" -ForegroundColor Gray
  Write-Host "   • Fornecer instruções completas`n" -ForegroundColor Gray
    
  Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
    
  Write-Host "`n   OPÇÃO 2: Iniciar apenas ngrok (manual) 🔧`n" -ForegroundColor $InfoColor
  Write-Host "   ngrok http 3001`n" -ForegroundColor White
    
  Write-Host "   Depois acesse: http://127.0.0.1:4040" -ForegroundColor Gray
  Write-Host "   Para ver a URL pública e configurar o webhook manualmente`n" -ForegroundColor Gray
    
}
else {
  Write-Host "`n⚠️  ATENÇÃO: Alguns requisitos não foram atendidos!`n" -ForegroundColor $WarningColor
    
  if (-not $ngrokInstalado) {
    Write-Host "   ❌ Instale o ngrok primeiro" -ForegroundColor $ErrorColor
  }
    
  if (-not $ngrokAutenticado) {
    Write-Host "   ⚠️  Autentique o ngrok (veja instruções acima)" -ForegroundColor $WarningColor
  }
    
  if (-not $backendRunning) {
    Write-Host "   ⚠️  Inicie o backend (veja instruções acima)" -ForegroundColor $WarningColor
  }
    
  Write-Host "`n   Corrija os itens acima e execute este script novamente.`n" -ForegroundColor White
}

Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor Gray
