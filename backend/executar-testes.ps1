# ==========================================
# 🧪 EXECUTAR TESTES DE INTEGRAÇÃO WEBHOOK
# ==========================================
#
# Este script facilita a execução dos testes
# de integração do sistema de tickets
#

param(
  [Parameter(Mandatory = $false)]
  [ValidateSet('Todos', 'Integracao', 'WebSocket', 'Database', 'Resumo')]
  [string]$Teste = 'Resumo'
)

$ErrorActionPreference = 'Stop'
$BackendPath = "$PSScriptRoot"

# Cores
function Write-ColorOutput($ForegroundColor) {
  $fc = $host.UI.RawUI.ForegroundColor
  $host.UI.RawUI.ForegroundColor = $ForegroundColor
  if ($args) {
    Write-Output $args
  }
  $host.UI.RawUI.ForegroundColor = $fc
}

function Write-Success { Write-ColorOutput Green "✅ $args" }
function Write-Error-Custom { Write-ColorOutput Red "❌ $args" }
function Write-Info { Write-ColorOutput Cyan "ℹ️  $args" }
function Write-Warning-Custom { Write-ColorOutput Yellow "⚠️  $args" }
function Write-Title { 
  Write-Host ""
  Write-ColorOutput Cyan "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  Write-ColorOutput Cyan "  $args"
  Write-ColorOutput Cyan "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  Write-Host ""
}

# Verificar se backend está rodando
function Test-BackendRunning {
  Write-Info "Verificando se backend está rodando..."
  try {
    $response = Invoke-WebRequest -Uri "http://localhost:3001/api/health" -Method GET -TimeoutSec 5 -ErrorAction SilentlyContinue
    if ($response.StatusCode -eq 200) {
      Write-Success "Backend está rodando na porta 3001"
      return $true
    }
  }
  catch {
    # Se /health não existe, tentar outra rota
    try {
      $response = Invoke-WebRequest -Uri "http://localhost:3001/api/auth/login" -Method POST -TimeoutSec 5 -ErrorAction SilentlyContinue
      Write-Success "Backend está rodando na porta 3001"
      return $true
    }
    catch {
      Write-Error-Custom "Backend não está rodando!"
      Write-Warning-Custom "Execute: npm run start:dev"
      return $false
    }
  }
  return $false
}

# Verificar PostgreSQL
function Test-PostgreSQL {
  Write-Info "Verificando PostgreSQL..."
  try {
    $containers = docker ps --filter "name=conectcrm-postgres" --format "{{.Names}}"
    if ($containers -like "*conectcrm-postgres*") {
      Write-Success "PostgreSQL está rodando (Docker)"
      return $true
    }
    else {
      Write-Error-Custom "Container PostgreSQL não está rodando!"
      Write-Warning-Custom "Execute: docker-compose up -d"
      return $false
    }
  }
  catch {
    Write-Warning-Custom "Não foi possível verificar Docker"
    return $true # Continuar mesmo assim
  }
}

# Teste de Integração
function Start-IntegrationTest {
  Write-Title "🤖 TESTE DE INTEGRAÇÃO - WEBHOOK → TICKETS"
    
  if (-not (Test-Path "$BackendPath\test-webhook-integration.js")) {
    Write-Error-Custom "Arquivo test-webhook-integration.js não encontrado!"
    return
  }

  Write-Info "Executando teste de integração..."
  Write-Host ""
    
  try {
    Push-Location $BackendPath
    node test-webhook-integration.js
    Pop-Location
  }
  catch {
    Write-Error-Custom "Erro ao executar teste: $_"
    Pop-Location
  }
}

# Teste de WebSocket
function Start-WebSocketTest {
  Write-Title "🔌 TESTE DE WEBSOCKET - NOTIFICAÇÕES EM TEMPO REAL"
    
  if (-not (Test-Path "$BackendPath\test-webhook-websocket.js")) {
    Write-Error-Custom "Arquivo test-webhook-websocket.js não encontrado!"
    return
  }

  Write-Warning-Custom "Este teste ficará aguardando notificações."
  Write-Warning-Custom "Pressione CTRL+C para interromper."
  Write-Host ""
  Start-Sleep -Seconds 2
    
  try {
    Push-Location $BackendPath
    node test-webhook-websocket.js
    Pop-Location
  }
  catch {
    Write-Error-Custom "Erro ao executar teste: $_"
    Pop-Location
  }
}

# Verificação no Database
function Start-DatabaseVerification {
  Write-Title "🗄️  VERIFICAÇÃO NO BANCO DE DADOS"
    
  Write-Info "Conectando ao PostgreSQL..."
    
  $queries = @"
-- Status geral do sistema
SELECT 
    '🎫 Tickets WhatsApp' as metrica,
    COUNT(*)::text as valor
FROM atendimento_tickets
WHERE origem = 'WHATSAPP'
UNION ALL
SELECT 
    '📨 Total de Mensagens' as metrica,
    COUNT(*)::text as valor
FROM atendimento_mensagens m
JOIN atendimento_tickets t ON m.ticket_id = t.id
WHERE t.origem = 'WHATSAPP'
UNION ALL
SELECT 
    '👥 Mensagens de Clientes' as metrica,
    COUNT(*)::text as valor
FROM atendimento_mensagens m
JOIN atendimento_tickets t ON m.ticket_id = t.id
WHERE t.origem = 'WHATSAPP' AND m.remetente = 'CLIENTE'
UNION ALL
SELECT 
    '🤖 Mensagens do Bot' as metrica,
    COUNT(*)::text as valor
FROM atendimento_mensagens m
JOIN atendimento_tickets t ON m.ticket_id = t.id
WHERE t.origem = 'WHATSAPP' AND m.remetente = 'BOT'
UNION ALL
SELECT 
    '📱 Canais WhatsApp Ativos' as metrica,
    COUNT(*)::text as valor
FROM canais
WHERE tipo = 'whatsapp' AND ativo = true;
"@

  try {
    # Tentar via docker
    Write-Host ""
    docker exec -it conectcrm-postgres psql -U postgres -d conectcrm -c "$queries"
    Write-Host ""
  }
  catch {
    Write-Warning-Custom "Erro ao executar query via Docker"
    Write-Info "Tente manualmente: psql -h localhost -p 5432 -U postgres -d conectcrm"
  }
}

# Resumo Rápido
function Show-QuickSummary {
  Write-Title "📊 RESUMO RÁPIDO DO SISTEMA"
    
  $allOk = $true
    
  # Backend
  if (Test-BackendRunning) {
    Write-Success "Backend: OK"
  }
  else {
    Write-Error-Custom "Backend: OFF"
    $allOk = $false
  }
    
  # PostgreSQL
  if (Test-PostgreSQL) {
    Write-Success "PostgreSQL: OK"
  }
  else {
    Write-Error-Custom "PostgreSQL: OFF"
    $allOk = $false
  }
    
  # Arquivos de teste
  $testFiles = @(
    "test-webhook-integration.js",
    "test-webhook-websocket.js",
    "test-verificacao-tickets.sql",
    "GUIA_TESTES_TICKETS.md"
  )
    
  $filesOk = $true
  foreach ($file in $testFiles) {
    if (Test-Path "$BackendPath\$file") {
      # OK, não precisa printar
    }
    else {
      Write-Error-Custom "Arquivo de teste não encontrado: $file"
      $filesOk = $false
      $allOk = $false
    }
  }
    
  if ($filesOk) {
    Write-Success "Arquivos de Teste: OK"
  }
    
  Write-Host ""
  Write-Title "📋 PRÓXIMOS PASSOS"
    
  if (-not $allOk) {
    Write-Host ""
    Write-Warning-Custom "Sistema não está pronto para testes!"
    Write-Host ""
    Write-Info "Para iniciar o backend:"
    Write-Host "  cd backend"
    Write-Host "  npm run start:dev"
    Write-Host ""
    Write-Info "Para iniciar o PostgreSQL:"
    Write-Host "  docker-compose up -d"
    Write-Host ""
  }
  else {
    Write-Host ""
    Write-Success "Sistema está pronto para testes!"
    Write-Host ""
    Write-Info "Executar testes:"
    Write-Host "  .\executar-testes.ps1 -Teste Integracao    # Teste completo"
    Write-Host "  .\executar-testes.ps1 -Teste WebSocket     # Monitor WebSocket"
    Write-Host "  .\executar-testes.ps1 -Teste Database      # Verificar banco"
    Write-Host ""
    Write-Info "Consultar documentação:"
    Write-Host "  code GUIA_TESTES_TICKETS.md"
    Write-Host "  code INTEGRACAO_WEBHOOK_TICKETS_COMPLETA.md"
    Write-Host ""
  }
}

# ==========================================
# EXECUTAR TESTE SELECIONADO
# ==========================================

Write-Host ""
Write-ColorOutput Cyan "╔═══════════════════════════════════════════════════════════╗"
Write-ColorOutput Cyan "║   🧪 SISTEMA DE TESTES - WEBHOOK WHATSAPP → TICKETS     ║"
Write-ColorOutput Cyan "╚═══════════════════════════════════════════════════════════╝"
Write-Host ""

switch ($Teste) {
  'Todos' {
    Write-Info "Executando todos os testes..."
    Show-QuickSummary
    Start-IntegrationTest
    Write-Host ""
    Write-Info "Teste de WebSocket será executado separadamente (modo interativo)"
    Write-Info "Execute: .\executar-testes.ps1 -Teste WebSocket"
  }
  'Integracao' {
    if (Test-BackendRunning) {
      Start-IntegrationTest
    }
  }
  'WebSocket' {
    if (Test-BackendRunning) {
      Start-WebSocketTest
    }
  }
  'Database' {
    if (Test-PostgreSQL) {
      Start-DatabaseVerification
    }
  }
  'Resumo' {
    Show-QuickSummary
  }
}

Write-Host ""
Write-ColorOutput Green "╔═══════════════════════════════════════════════════════════╗"
Write-ColorOutput Green "║                    ✅ CONCLUÍDO                          ║"
Write-ColorOutput Green "╚═══════════════════════════════════════════════════════════╝"
Write-Host ""
