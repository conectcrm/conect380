# ==========================================
# 🤖 AUTO-EXECUTAR TESTES QUANDO BACKEND FICAR PRONTO
# ==========================================

$ErrorActionPreference = 'Continue'
$BackendPath = "C:\Projetos\conectcrm\backend"

# Cores
function Write-Success { Write-Host "✅ $args" -ForegroundColor Green }
function Write-Error-Custom { Write-Host "❌ $args" -ForegroundColor Red }
function Write-Info { Write-Host "ℹ️  $args" -ForegroundColor Cyan }
function Write-Warning-Custom { Write-Host "⚠️  $args" -ForegroundColor Yellow }

Write-Host ""
Write-Host "╔═══════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║   🤖 AGUARDANDO BACKEND E EXECUTANDO TESTES AUTOMÁTICO   ║" -ForegroundColor Cyan
Write-Host "╚═══════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

$maxTentativas = 30
$tentativa = 0
$backendPronto = $false

Write-Info "Aguardando backend ficar pronto..."
Write-Host "Verificando a cada 5 segundos (máximo: 2.5 minutos)`n"

while ($tentativa -lt $maxTentativas -and -not $backendPronto) {
  $tentativa++
    
  Write-Host "[$tentativa/$maxTentativas] Tentando conectar ao backend..." -ForegroundColor Gray
    
  try {
    $response = Invoke-WebRequest -Uri "http://localhost:3001/api/auth/login" `
      -Method POST `
      -Body '{"email":"test","password":"test"}' `
      -ContentType "application/json" `
      -TimeoutSec 3 `
      -ErrorAction Stop
        
    Write-Host ""
    Write-Success "Backend está ONLINE na porta 3001!"
    $backendPronto = $true
    break
        
  }
  catch {
    if ($tentativa -eq 1) {
      Write-Warning-Custom "Backend ainda não está respondendo..."
    }
    Start-Sleep -Seconds 5
  }
}

if (-not $backendPronto) {
  Write-Host ""
  Write-Error-Custom "Timeout: Backend não ficou pronto em 2.5 minutos"
  Write-Warning-Custom "Verifique o terminal do backend para ver se há erros"
  Write-Host ""
  Write-Info "Para executar manualmente depois:"
  Write-Host "  cd $BackendPath" -ForegroundColor Gray
  Write-Host "  .\executar-testes.ps1 -Teste Integracao" -ForegroundColor Gray
  Write-Host ""
  exit 1
}

# Backend está pronto! Executar testes
Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
Write-Host "  🚀 INICIANDO TESTES DE INTEGRAÇÃO" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
Write-Host ""

Start-Sleep -Seconds 2

# Mudar para diretório do backend
Push-Location $BackendPath

try {
  # Executar testes
  Write-Info "Executando: node test-webhook-integration.js"
  Write-Host ""
    
  node test-webhook-integration.js
    
  Write-Host ""
  Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
  Write-Host "  ✅ TESTES CONCLUÍDOS!" -ForegroundColor Green
  Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
  Write-Host ""
    
  Write-Info "Próximos passos:"
  Write-Host "  1. Revisar resultados acima" -ForegroundColor White
  Write-Host "  2. Testar WebSocket: .\executar-testes.ps1 -Teste WebSocket" -ForegroundColor White
  Write-Host "  3. Ver dados no banco: .\executar-testes.ps1 -Teste Database" -ForegroundColor White
  Write-Host ""
    
}
catch {
  Write-Error-Custom "Erro ao executar testes: $_"
}
finally {
  Pop-Location
}

Write-Host ""
