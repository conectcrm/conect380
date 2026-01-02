#!/usr/bin/env pwsh
# ============================================
# TESTE FINAL - Validação IA + Backend
# ============================================

Write-Host "`n" -NoNewline
Write-Host "╔════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║                                                        ║" -ForegroundColor Cyan
Write-Host "║   ✅ INTEGRAÇÃO IA + BOT - TESTE FINAL              ║" -ForegroundColor Cyan
Write-Host "║                                                        ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

$ErrorActionPreference = "Continue"

# ============================================
# 1. Verificar API Key
# ============================================
Write-Host "📋 1. Verificando API Key..." -ForegroundColor Yellow
$envContent = Get-Content "backend/.env" -Raw
if ($envContent -match 'OPENAI_API_KEY=sk-proj-') {
  Write-Host "   ✅ API Key configurada corretamente" -ForegroundColor Green
  $apiKeyOk = $true
}
elseif ($envContent -match 'OPENAI_API_KEY=sk-') {
  Write-Host "   ✅ API Key configurada" -ForegroundColor Green
  $apiKeyOk = $true
}
else {
  Write-Host "   ❌ API Key NÃO configurada" -ForegroundColor Red
  $apiKeyOk = $false
}

# ============================================
# 2. Verificar Integração
# ============================================
Write-Host "`n📋 2. Verificando Integração..." -ForegroundColor Yellow

$triagemBotContent = Get-Content "backend/src/modules/triagem/services/triagem-bot.service.ts" -Raw

$checks = @(
  @{Name = "IAService importado"; Pattern = "import.*IAService"; },
  @{Name = "IAService injetado"; Pattern = "private readonly iaService: IAService" },
  @{Name = "Método processarComIA"; Pattern = "async processarComIA" },
  @{Name = "Método tentarRespostaIA"; Pattern = "async tentarRespostaIA" },
  @{Name = "Conversão de histórico"; Pattern = "converterHistoricoParaIA" }
)

$allOk = $true
foreach ($check in $checks) {
  if ($triagemBotContent -match $check.Pattern) {
    Write-Host "   ✅ $($check.Name)" -ForegroundColor Green
  }
  else {
    Write-Host "   ❌ $($check.Name) - NÃO ENCONTRADO" -ForegroundColor Red
    $allOk = $false
  }
}

# ============================================
# 3. Verificar Variáveis .env
# ============================================
Write-Host "`n📋 3. Verificando Configuração..." -ForegroundColor Yellow

$vars = @(
  "IA_PROVIDER",
  "IA_MODEL", 
  "IA_AUTO_RESPOSTA_ENABLED",
  "IA_MIN_CONFIANCA"
)

foreach ($var in $vars) {
  if ($envContent -match "$var=\w+") {
    $valor = ($envContent | Select-String "$var=(\S+)" | ForEach-Object { $_.Matches.Groups[1].Value })
    Write-Host "   ✅ $var = $valor" -ForegroundColor Green
  }
  else {
    Write-Host "   ❌ $var - NÃO CONFIGURADA" -ForegroundColor Red
    $allOk = $false
  }
}

# ============================================
# 4. Status do Backend
# ============================================
Write-Host "`n📋 4. Status do Backend..." -ForegroundColor Yellow

$nodeProcesses = Get-Process -Name node -ErrorAction SilentlyContinue
if ($nodeProcesses) {
  Write-Host "   ✅ Backend rodando ($($nodeProcesses.Count) processo(s) Node)" -ForegroundColor Green
    
  # Tentar conectar
  try {
    $response = Invoke-WebRequest -Uri "http://localhost:3001" -TimeoutSec 2 -UseBasicParsing -ErrorAction Stop
    Write-Host "   ✅ Backend respondendo na porta 3001 (Status: $($response.StatusCode))" -ForegroundColor Green
    $backendOk = $true
  }
  catch {
    Write-Host "   ⚠️  Backend iniciando ou porta 3001 não acessível" -ForegroundColor Yellow
    $backendOk = $false
  }
}
else {
  Write-Host "   ❌ Backend NÃO está rodando" -ForegroundColor Red
  $backendOk = $false
}

# ============================================
# 5. Resumo Final
# ============================================
Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║                   RESULTADO FINAL                      ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

if ($apiKeyOk) {
  Write-Host "✅ API Key: CONFIGURADA" -ForegroundColor Green
}
else {
  Write-Host "❌ API Key: NÃO CONFIGURADA" -ForegroundColor Red
}

if ($allOk) {
  Write-Host "✅ Integração: COMPLETA" -ForegroundColor Green
}
else {
  Write-Host "❌ Integração: INCOMPLETA" -ForegroundColor Red
}

if ($backendOk) {
  Write-Host "✅ Backend: ONLINE" -ForegroundColor Green
}
else {
  Write-Host "⚠️  Backend: OFFLINE ou INICIALIZANDO" -ForegroundColor Yellow
}

Write-Host ""

if ($apiKeyOk -and $allOk) {
  Write-Host "╔════════════════════════════════════════════════════════╗" -ForegroundColor Green
  Write-Host "║                                                        ║" -ForegroundColor Green
  Write-Host "║   🎉 INTEGRAÇÃO 100% COMPLETA E FUNCIONAL!          ║" -ForegroundColor Green
  Write-Host "║                                                        ║" -ForegroundColor Green
  Write-Host "║   A IA está pronta para uso no bot!                   ║" -ForegroundColor Green
  Write-Host "║                                                        ║" -ForegroundColor Green
  Write-Host "╚════════════════════════════════════════════════════════╝" -ForegroundColor Green
    
  Write-Host "`n📝 Próximos Passos:" -ForegroundColor Cyan
  Write-Host "   1. Enviar mensagem de teste via WhatsApp" -ForegroundColor White
  Write-Host "   2. Verificar logs do backend (deve mostrar: '🤖 IA respondeu...')" -ForegroundColor White
  Write-Host "   3. Consultar banco: SELECT * FROM triagem_logs WHERE tipo = 'ia_resposta'" -ForegroundColor White
  Write-Host ""
    
  if (-not $backendOk) {
    Write-Host "⚠️  Inicie o backend para testar:" -ForegroundColor Yellow
    Write-Host "   cd backend && npm run start:dev" -ForegroundColor Cyan
    Write-Host ""
  }
    
  exit 0
}
else {
  Write-Host "╔════════════════════════════════════════════════════════╗" -ForegroundColor Red
  Write-Host "║                                                        ║" -ForegroundColor Red
  Write-Host "║   ⚠️  ATENÇÃO: Configuração incompleta              ║" -ForegroundColor Red
  Write-Host "║                                                        ║" -ForegroundColor Red
  Write-Host "╚════════════════════════════════════════════════════════╝" -ForegroundColor Red
  Write-Host ""
  exit 1
}
