# 🔧 Script de Configuração Automática do Webhook WhatsApp
# Uso: .\setup-webhook.ps1

param(
  [switch]$SkipNgrok,
  [switch]$TestOnly
)

$ErrorActionPreference = "Stop"

Write-Host "`n🚀 Configuração do Webhook WhatsApp - ConectCRM`n" -ForegroundColor Cyan

# Função para verificar se um comando existe
function Test-Command {
  param($Command)
  try {
    if (Get-Command $Command -ErrorAction SilentlyContinue) {
      return $true
    }
  }
  catch {
    return $false
  }
  return $false
}

# 1. Verificar pré-requisitos
Write-Host "📋 Verificando pré-requisitos..." -ForegroundColor Yellow

# Verificar Node.js
if (-not (Test-Command "node")) {
  Write-Host "❌ Node.js não encontrado! Instale de: https://nodejs.org" -ForegroundColor Red
  exit 1
}
$nodeVersion = node --version
Write-Host "  ✅ Node.js $nodeVersion" -ForegroundColor Green

# Verificar npm
if (-not (Test-Command "npm")) {
  Write-Host "❌ npm não encontrado!" -ForegroundColor Red
  exit 1
}
Write-Host "  ✅ npm instalado" -ForegroundColor Green

# Verificar ngrok
if (-not $SkipNgrok) {
  if (-not (Test-Command "ngrok")) {
    Write-Host "  ⚠️  ngrok não encontrado!" -ForegroundColor Yellow
    Write-Host "     Instalando ngrok via Chocolatey..." -ForegroundColor Yellow
        
    if (Test-Command "choco") {
      choco install ngrok -y
      Write-Host "  ✅ ngrok instalado com sucesso!" -ForegroundColor Green
    }
    else {
      Write-Host "`n  📥 Por favor, instale o ngrok manualmente:" -ForegroundColor Cyan
      Write-Host "     1. Acesse: https://ngrok.com/download" -ForegroundColor White
      Write-Host "     2. Baixe e extraia o executável" -ForegroundColor White
      Write-Host "     3. Adicione ao PATH ou execute deste diretório" -ForegroundColor White
      Write-Host "`n  Execute novamente este script após instalar.`n" -ForegroundColor Yellow
      exit 1
    }
  }
  else {
    Write-Host "  ✅ ngrok instalado" -ForegroundColor Green
  }
}

# 2. Verificar arquivo .env
Write-Host "`n🔐 Verificando configuração do .env..." -ForegroundColor Yellow

$envPath = ".\backend\.env"
if (-not (Test-Path $envPath)) {
  Write-Host "  ⚠️  Arquivo .env não encontrado!" -ForegroundColor Yellow
  Write-Host "     Criando .env a partir do .env.example..." -ForegroundColor Yellow
    
  if (Test-Path ".\backend\.env.example") {
    Copy-Item ".\backend\.env.example" $envPath
    Write-Host "  ✅ Arquivo .env criado!" -ForegroundColor Green
  }
  else {
    Write-Host "  ❌ .env.example não encontrado!" -ForegroundColor Red
    exit 1
  }
}

# Verificar variáveis obrigatórias
$envContent = Get-Content $envPath -Raw
$requiredVars = @(
  "WHATSAPP_TOKEN",
  "WHATSAPP_APP_SECRET",
  "WHATSAPP_PHONE_NUMBER_ID"
)

$missingVars = @()
foreach ($var in $requiredVars) {
  if ($envContent -notmatch "$var=\w+") {
    $missingVars += $var
  }
}

if ($missingVars.Count -gt 0) {
  Write-Host "`n  ⚠️  Variáveis faltando no .env:" -ForegroundColor Yellow
  foreach ($var in $missingVars) {
    Write-Host "     ❌ $var" -ForegroundColor Red
  }
    
  Write-Host "`n  📝 Por favor, edite o arquivo backend\.env e adicione:" -ForegroundColor Cyan
  Write-Host "     WHATSAPP_TOKEN=seu_token_permanente_aqui" -ForegroundColor White
  Write-Host "     WHATSAPP_APP_SECRET=seu_app_secret_aqui" -ForegroundColor White
  Write-Host "     WHATSAPP_PHONE_NUMBER_ID=123456789012345" -ForegroundColor White
    
  Write-Host "`n  📚 Consulte o guia: CONFIGURACAO_WEBHOOK_WHATSAPP.md" -ForegroundColor Cyan
  Write-Host "     para saber onde encontrar essas informações.`n" -ForegroundColor Cyan
    
  if (-not $TestOnly) {
    exit 1
  }
}
else {
  Write-Host "  ✅ Todas as variáveis obrigatórias configuradas" -ForegroundColor Green
}

# 3. Iniciar backend (se não estiver rodando)
Write-Host "`n🔧 Verificando backend..." -ForegroundColor Yellow

$backendRunning = $false
try {
  $response = Invoke-WebRequest -Uri "http://localhost:3001/health" -UseBasicParsing -TimeoutSec 2 -ErrorAction SilentlyContinue
  if ($response.StatusCode -eq 200) {
    $backendRunning = $true
    Write-Host "  ✅ Backend já está rodando na porta 3001" -ForegroundColor Green
  }
}
catch {
  # Backend não está rodando
}

if (-not $backendRunning -and -not $TestOnly) {
  Write-Host "  ⚠️  Backend não está rodando. Iniciando..." -ForegroundColor Yellow
    
  # Verificar se node_modules existe
  if (-not (Test-Path ".\backend\node_modules")) {
    Write-Host "     Instalando dependências do backend..." -ForegroundColor Yellow
    Push-Location .\backend
    npm install
    Pop-Location
  }
    
  Write-Host "     Iniciando backend em modo desenvolvimento..." -ForegroundColor Yellow
  Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\backend'; npm run start:dev" -WindowStyle Normal
    
  Write-Host "     Aguardando backend inicializar (30s)..." -ForegroundColor Yellow
  Start-Sleep -Seconds 30
    
  try {
    $response = Invoke-WebRequest -Uri "http://localhost:3001/health" -UseBasicParsing -TimeoutSec 5
    if ($response.StatusCode -eq 200) {
      Write-Host "  ✅ Backend iniciado com sucesso!" -ForegroundColor Green
    }
  }
  catch {
    Write-Host "  ❌ Falha ao iniciar backend. Verifique os logs." -ForegroundColor Red
    exit 1
  }
}

# 4. Iniciar ngrok
if (-not $SkipNgrok -and -not $TestOnly) {
  Write-Host "`n🌐 Iniciando ngrok..." -ForegroundColor Yellow
    
  Write-Host "     Abrindo túnel ngrok para porta 3001..." -ForegroundColor Yellow
  Start-Process powershell -ArgumentList "-NoExit", "-Command", "ngrok http 3001" -WindowStyle Normal
    
  Write-Host "     Aguardando ngrok inicializar (10s)..." -ForegroundColor Yellow
  Start-Sleep -Seconds 10
    
  # Tentar obter a URL do ngrok via API
  try {
    $ngrokApi = Invoke-RestMethod -Uri "http://localhost:4040/api/tunnels" -Method Get -ErrorAction SilentlyContinue
    $publicUrl = $ngrokApi.tunnels[0].public_url
        
    if ($publicUrl) {
      Write-Host "`n  ✅ ngrok iniciado com sucesso!" -ForegroundColor Green
      Write-Host "`n  📋 URL pública do webhook:" -ForegroundColor Cyan
      Write-Host "     $publicUrl/triagem/webhook/whatsapp" -ForegroundColor White -BackgroundColor DarkBlue
      Write-Host "`n  💡 Copie esta URL e configure no Meta Business Manager!" -ForegroundColor Yellow
    }
  }
  catch {
    Write-Host "  ⚠️  ngrok iniciado, mas não foi possível obter a URL automaticamente." -ForegroundColor Yellow
    Write-Host "     Verifique a janela do ngrok para copiar a URL." -ForegroundColor Yellow
  }
}

# 5. Verificar núcleos no banco de dados
Write-Host "`n📊 Verificando núcleos no banco de dados..." -ForegroundColor Yellow

try {
  $nucleosResponse = Invoke-RestMethod -Uri "http://localhost:3001/nucleos" -Method Get -Headers @{
    "Authorization" = "Bearer mock_token_for_test"
  } -ErrorAction SilentlyContinue
    
  if ($nucleosResponse -and $nucleosResponse.Count -gt 0) {
    Write-Host "  ✅ $($nucleosResponse.Count) núcleos encontrados:" -ForegroundColor Green
    foreach ($nucleo in $nucleosResponse) {
      Write-Host "     - $($nucleo.nome) ($($nucleo.codigo))" -ForegroundColor White
    }
  }
  else {
    Write-Host "  ⚠️  Nenhum núcleo encontrado. Execute as seeds:" -ForegroundColor Yellow
    Write-Host "     cd backend" -ForegroundColor White
    Write-Host "     npm run seed" -ForegroundColor White
  }
}
catch {
  Write-Host "  ⚠️  Não foi possível verificar núcleos (endpoint pode exigir autenticação)" -ForegroundColor Yellow
}

# 6. Resumo final
Write-Host "`n" -NoNewline
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  ✅ Configuração concluída!" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan

if (-not $TestOnly) {
  Write-Host "`n📋 Próximos passos:" -ForegroundColor Yellow
  Write-Host ""
  Write-Host "  1️⃣  Copie a URL do ngrok (janela aberta)" -ForegroundColor White
  Write-Host "  2️⃣  Acesse: https://developers.facebook.com/apps" -ForegroundColor White
  Write-Host "  3️⃣  Selecione seu App → WhatsApp → Configuration" -ForegroundColor White
  Write-Host "  4️⃣  Clique em 'Edit' na seção Webhook" -ForegroundColor White
  Write-Host "  5️⃣  Cole a URL: https://SEU_NGROK.ngrok-free.app/triagem/webhook/whatsapp" -ForegroundColor White
  Write-Host "  6️⃣  Verify Token: meu_token_verificacao_123" -ForegroundColor White
  Write-Host "  7️⃣  Clique em 'Verify and Save'" -ForegroundColor White
  Write-Host "  8️⃣  Marque 'messages' e clique em 'Subscribe'" -ForegroundColor White
  Write-Host "  9️⃣  Envie uma mensagem WhatsApp para seu número Business!" -ForegroundColor White
  Write-Host ""
}

Write-Host "📚 Documentação completa: CONFIGURACAO_WEBHOOK_WHATSAPP.md" -ForegroundColor Cyan
Write-Host ""
Write-Host "🔍 Monitorar logs:" -ForegroundColor Yellow
Write-Host "   Backend: Janela aberta pelo script" -ForegroundColor White
Write-Host "   ngrok:   http://localhost:4040 (Web UI)" -ForegroundColor White
Write-Host ""

if ($TestOnly) {
  Write-Host "ℹ️  Modo de teste - nenhum serviço foi iniciado." -ForegroundColor Cyan
}
else {
  Write-Host "✨ Sistema pronto para receber mensagens WhatsApp!" -ForegroundColor Green
}

Write-Host "`n"
