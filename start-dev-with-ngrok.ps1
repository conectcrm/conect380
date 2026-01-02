# Script para iniciar ambiente de desenvolvimento com ngrok
# Uso: .\start-dev-with-ngrok.ps1

param(
  [switch]$SkipBackend,
  [switch]$SkipFrontend,
  [int]$BackendPort = 3001,
  [int]$FrontendPort = 3000
)

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  🚀 ConectCRM - Ambiente de Desenvolvimento" -ForegroundColor White
Write-Host "========================================`n" -ForegroundColor Cyan

$ErrorActionPreference = "Continue"

# Verificar se ngrok está instalado
Write-Host "🔍 Verificando ngrok..." -ForegroundColor Yellow
try {
  $ngrokVersion = & ngrok version 2>&1
  Write-Host "✅ ngrok instalado: $ngrokVersion" -ForegroundColor Green
}
catch {
  Write-Host "❌ ngrok não encontrado!" -ForegroundColor Red
  Write-Host "📥 Baixe em: https://ngrok.com/download" -ForegroundColor Yellow
  Write-Host "📚 Ou siga o guia: docs/GUIA_NGROK_WEBHOOKS.md" -ForegroundColor Yellow
  exit 1
}

# Verificar se o backend já está rodando
Write-Host "`n🔍 Verificando porta $BackendPort..." -ForegroundColor Yellow
$backendRunning = Get-NetTCPConnection -LocalPort $BackendPort -ErrorAction SilentlyContinue

if ($backendRunning -and -not $SkipBackend) {
  Write-Host "⚠️  Backend já está rodando na porta $BackendPort" -ForegroundColor Yellow
  $response = Read-Host "Deseja reiniciar? (s/N)"
  if ($response -eq 's' -or $response -eq 'S') {
    Write-Host "🛑 Parando processos Node.js..." -ForegroundColor Red
    Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force
    Start-Sleep -Seconds 2
  }
  else {
    $SkipBackend = $true
  }
}

# 1. Iniciar Backend
if (-not $SkipBackend) {
  Write-Host "`n1️⃣ Iniciando Backend NestJS (porta $BackendPort)..." -ForegroundColor Green
  Write-Host "📂 Diretório: C:\Projetos\conectcrm\backend" -ForegroundColor Gray
    
  $backendPath = "C:\Projetos\conectcrm\backend"
  if (Test-Path $backendPath) {
    Start-Process powershell -ArgumentList @(
      "-NoExit",
      "-Command",
      "cd '$backendPath'; Write-Host '🟢 Backend NestJS' -ForegroundColor Green; npm run start:dev"
    )
    Write-Host "✅ Backend iniciado em nova janela" -ForegroundColor Green
    Write-Host "⏳ Aguardando inicialização (15 segundos)..." -ForegroundColor Yellow
    Start-Sleep -Seconds 15
  }
  else {
    Write-Host "❌ Diretório do backend não encontrado: $backendPath" -ForegroundColor Red
    exit 1
  }
}
else {
  Write-Host "`n1️⃣ Backend: Pulando (já está rodando)" -ForegroundColor Yellow
}

# 2. Iniciar Frontend (Opcional)
if (-not $SkipFrontend) {
  Write-Host "`n2️⃣ Iniciando Frontend React (porta $FrontendPort)..." -ForegroundColor Green
  Write-Host "📂 Diretório: C:\Projetos\conectcrm\frontend-web" -ForegroundColor Gray
    
  $frontendPath = "C:\Projetos\conectcrm\frontend-web"
  if (Test-Path $frontendPath) {
    Start-Process powershell -ArgumentList @(
      "-NoExit",
      "-Command",
      "cd '$frontendPath'; Write-Host '🟢 Frontend React' -ForegroundColor Cyan; npm start"
    )
    Write-Host "✅ Frontend iniciado em nova janela" -ForegroundColor Green
    Write-Host "⏳ Aguardando inicialização (10 segundos)..." -ForegroundColor Yellow
    Start-Sleep -Seconds 10
  }
  else {
    Write-Host "⚠️  Diretório do frontend não encontrado: $frontendPath" -ForegroundColor Yellow
    Write-Host "Frontend será pulado" -ForegroundColor Yellow
  }
}

# 3. Verificar se backend está respondendo
Write-Host "`n3️⃣ Verificando conectividade do backend..." -ForegroundColor Green
$maxAttempts = 5
$attempt = 0
$backendReady = $false

while ($attempt -lt $maxAttempts -and -not $backendReady) {
  $attempt++
  Write-Host "   Tentativa $attempt/$maxAttempts..." -ForegroundColor Gray
  try {
    $response = Invoke-WebRequest -Uri "http://localhost:$BackendPort" -TimeoutSec 3 -UseBasicParsing -ErrorAction SilentlyContinue
    $backendReady = $true
    Write-Host "✅ Backend respondendo!" -ForegroundColor Green
  }
  catch {
    if ($attempt -lt $maxAttempts) {
      Start-Sleep -Seconds 3
    }
  }
}

if (-not $backendReady) {
  Write-Host "⚠️  Backend não está respondendo ainda" -ForegroundColor Yellow
  Write-Host "   Continuando mesmo assim (pode estar inicializando)..." -ForegroundColor Gray
}

# 4. Iniciar ngrok
Write-Host "`n4️⃣ Iniciando ngrok..." -ForegroundColor Green

# Parar ngrok existentes
$existingNgrok = Get-Process -Name ngrok -ErrorAction SilentlyContinue
if ($existingNgrok) {
  Write-Host "🛑 Parando ngrok existente..." -ForegroundColor Yellow
  $existingNgrok | Stop-Process -Force
  Start-Sleep -Seconds 2
}

# Iniciar ngrok em nova janela
Start-Process powershell -ArgumentList @(
  "-NoExit",
  "-Command",
  "Write-Host '🌐 ngrok - Túnel HTTP' -ForegroundColor Magenta; Write-Host 'Dashboard: http://127.0.0.1:4040' -ForegroundColor Cyan; ngrok http $BackendPort"
)

Write-Host "✅ ngrok iniciado em nova janela" -ForegroundColor Green
Write-Host "⏳ Aguardando túnel estabelecer (5 segundos)..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# 5. Obter URL do ngrok
Write-Host "`n5️⃣ Obtendo URL pública do ngrok..." -ForegroundColor Green
$maxAttempts = 10
$attempt = 0
$ngrokUrl = $null

while ($attempt -lt $maxAttempts -and -not $ngrokUrl) {
  $attempt++
  try {
    $ngrokApi = Invoke-RestMethod -Uri "http://127.0.0.1:4040/api/tunnels" -ErrorAction SilentlyContinue
    $ngrokUrl = $ngrokApi.tunnels | Where-Object { $_.proto -eq "https" } | Select-Object -First 1 -ExpandProperty public_url
        
    if ($ngrokUrl) {
      Write-Host "✅ URL pública obtida!" -ForegroundColor Green
      Write-Host "`n🔗 URL do ngrok:" -ForegroundColor Cyan
      Write-Host "   $ngrokUrl" -ForegroundColor White -BackgroundColor DarkBlue
    }
  }
  catch {
    if ($attempt -lt $maxAttempts) {
      Start-Sleep -Seconds 2
    }
  }
}

if (-not $ngrokUrl) {
  Write-Host "⚠️  Não foi possível obter a URL automaticamente" -ForegroundColor Yellow
  Write-Host "   Acesse http://127.0.0.1:4040 para ver a URL" -ForegroundColor Gray
  $ngrokUrl = "https://SEU_DOMINIO.ngrok-free.app"
}

# 6. Abrir dashboard ngrok
Write-Host "`n6️⃣ Abrindo dashboard ngrok..." -ForegroundColor Green
Start-Sleep -Seconds 2
Start-Process "http://127.0.0.1:4040"
Write-Host "✅ Dashboard aberto no navegador" -ForegroundColor Green

# 7. Resumo e instruções
Write-Host "`n========================================" -ForegroundColor Green
Write-Host "  ✅ AMBIENTE INICIADO COM SUCESSO!" -ForegroundColor White
Write-Host "========================================`n" -ForegroundColor Green

Write-Host "📋 URLs Disponíveis:" -ForegroundColor Cyan
Write-Host "   🟢 Backend Local:     http://localhost:$BackendPort" -ForegroundColor White
if (-not $SkipFrontend) {
  Write-Host "   🔵 Frontend Local:    http://localhost:$FrontendPort" -ForegroundColor White
}
Write-Host "   🌐 Backend Público:   $ngrokUrl" -ForegroundColor White
Write-Host "   📊 Dashboard ngrok:   http://127.0.0.1:4040`n" -ForegroundColor White

Write-Host "🔗 Webhooks para Configurar:" -ForegroundColor Yellow
Write-Host "   📱 WhatsApp: $ngrokUrl/api/atendimento/webhooks/whatsapp/<ID_EMPRESA>" -ForegroundColor Gray
Write-Host "   💬 Telegram: $ngrokUrl/api/atendimento/webhooks/telegram" -ForegroundColor Gray
Write-Host "   📞 Twilio:   $ngrokUrl/api/atendimento/webhooks/twilio`n" -ForegroundColor Gray

Write-Host "📚 Documentação:" -ForegroundColor Cyan
Write-Host "   📖 Guia ngrok:        docs/GUIA_NGROK_WEBHOOKS.md" -ForegroundColor Gray
Write-Host "   📖 API Docs:          docs/API_DOCUMENTATION.md" -ForegroundColor Gray
Write-Host "   📖 Testes:            docs/TESTES_INTEGRACOES.md`n" -ForegroundColor Gray

Write-Host "⚠️  IMPORTANTE:" -ForegroundColor Red
Write-Host "   • A URL do ngrok muda a cada reinicialização (plano gratuito)" -ForegroundColor Yellow
Write-Host "   • Atualize os webhooks nas plataformas sempre que reiniciar" -ForegroundColor Yellow
Write-Host "   • Túneis gratuitos expiram após 2 horas de inatividade`n" -ForegroundColor Yellow

Write-Host "🛑 Para parar tudo:" -ForegroundColor Red
Write-Host "   .\stop-dev-environment.ps1`n" -ForegroundColor White

# Copiar URL para clipboard (opcional)
try {
  $ngrokUrl | Set-Clipboard
  Write-Host "📋 URL do ngrok copiada para área de transferência!" -ForegroundColor Green
}
catch {
  # Silenciosamente ignora se clipboard não estiver disponível
}

Write-Host "`nPressione qualquer tecla para sair..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
