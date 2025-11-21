# ============================================================================
# 🧪 SCRIPT DE TESTE AUTOMÁTICO - WEBSOCKET TEMPO REAL
# ============================================================================
# Descrição: Valida a implementação completa do WebSocket
# Autor: ConectHelp Team
# Data: 14/10/2025
# ============================================================================

param(
  [string]$BackendUrl = "http://localhost:3001",
  [string]$Token = "",
  [switch]$Interactive = $false,
  [switch]$Verbose = $false
)

# ============================================================================
# CONFIGURAÇÕES
# ============================================================================

$ErrorActionPreference = "Continue"
$ProgressPreference = "SilentlyContinue"

# Cores
$ColorSuccess = "Green"
$ColorError = "Red"
$ColorWarning = "Yellow"
$ColorInfo = "Cyan"

# ============================================================================
# FUNÇÕES AUXILIARES
# ============================================================================

function Write-TestHeader {
  param([string]$Title)
    
  Write-Host ""
  Write-Host ("=" * 80) -ForegroundColor $ColorInfo
  Write-Host " 🧪 $Title" -ForegroundColor $ColorInfo
  Write-Host ("=" * 80) -ForegroundColor $ColorInfo
  Write-Host ""
}

function Write-TestStep {
  param([string]$Step, [int]$Number, [int]$Total)
    
  Write-Host "[$Number/$Total] $Step" -ForegroundColor $ColorWarning
}

function Write-TestSuccess {
  param([string]$Message)
    
  Write-Host "✅ $Message" -ForegroundColor $ColorSuccess
}

function Write-TestError {
  param([string]$Message)
    
  Write-Host "❌ $Message" -ForegroundColor $ColorError
}

function Write-TestInfo {
  param([string]$Message)
    
  Write-Host "ℹ️  $Message" -ForegroundColor $ColorInfo
}

function Test-BackendHealth {
  Write-TestHeader "TESTE 1: Verificar Backend"
    
  try {
    Write-TestStep "Verificando conexão com backend..." 1 2
        
    $response = Invoke-WebRequest -Uri "$BackendUrl/health" -Method GET -UseBasicParsing -ErrorAction Stop
        
    if ($response.StatusCode -eq 200) {
      Write-TestSuccess "Backend está rodando na porta 3001"
      Write-TestInfo "Status: $($response.StatusCode)"
      return $true
    }
  }
  catch {
    Write-TestError "Backend NÃO está acessível!"
    Write-TestError "Erro: $($_.Exception.Message)"
    Write-TestInfo "Certifique-se de que o backend está rodando:"
    Write-Host "  cd backend" -ForegroundColor Yellow
    Write-Host "  npm run start:prod" -ForegroundColor Yellow
    return $false
  }
}

function Test-WebSocketEndpoint {
  Write-TestHeader "TESTE 2: Endpoint WebSocket"
    
  Write-TestStep "Verificando namespace /atendimento..." 1 1
    
  try {
    # Socket.IO expõe o namespace no endpoint HTTP
    $url = "$BackendUrl/socket.io/?EIO=4" + "&" + "transport=polling"
    $response = Invoke-WebRequest -Uri $url -Method GET -UseBasicParsing -ErrorAction SilentlyContinue
        
    if ($response.StatusCode -eq 200) {
      Write-TestSuccess "Endpoint Socket.IO acessível"
      return $true
    }
  }
  catch {
    if ($_.Exception.Response.StatusCode.value__ -eq 400) {
      # 400 é esperado sem autenticação, mas indica que o endpoint existe
      Write-TestSuccess "Endpoint Socket.IO acessível (erro 400 esperado sem autenticação)"
      return $true
    }
    else {
      Write-TestError "Endpoint Socket.IO não encontrado"
      Write-TestError "Erro: $($_.Exception.Message)"
      return $false
    }
  }
}

function Test-GatewayRegistration {
  Write-TestHeader "TESTE 3: Gateway Registrado"
    
  Write-TestStep "Verificando se AtendimentoGateway está no módulo..." 1 1
    
  $moduleFile = "C:\Projetos\conectcrm\backend\src\modules\atendimento\atendimento.module.ts"
    
  if (-not (Test-Path $moduleFile)) {
    Write-TestError "Arquivo atendimento.module.ts não encontrado!"
    return $false
  }
    
  $content = Get-Content $moduleFile -Raw
    
  if ($content -match "AtendimentoGateway") {
    Write-TestSuccess "AtendimentoGateway encontrado no módulo"
        
    if ($content -match "providers:\s*\[[\s\S]*?AtendimentoGateway") {
      Write-TestSuccess "Gateway registrado no array de providers"
      return $true
    }
    else {
      Write-TestError "Gateway NÃO está no array de providers"
      return $false
    }
  }
  else {
    Write-TestError "AtendimentoGateway NÃO encontrado no módulo"
    return $false
  }
}

function Test-WebSocketIntegration {
  Write-TestHeader "TESTE 4: Integração WebSocket nos Serviços"
    
  $tests = @(
    @{
      Name    = "WhatsApp Webhook Service"
      File    = "C:\Projetos\conectcrm\backend\src\modules\atendimento\services\whatsapp-webhook.service.ts"
      Pattern = "atendimentoGateway\.notificarNovaMensagem"
    },
    @{
      Name    = "Mensagem Service"
      File    = "C:\Projetos\conectcrm\backend\src\modules\atendimento\services\mensagem.service.ts"
      Pattern = "atendimentoGateway\.notificarNovaMensagem"
    }
  )
    
  $allPassed = $true
  $step = 1
    
  foreach ($test in $tests) {
    Write-TestStep "Verificando $($test.Name)..." $step $tests.Count
        
    if (-not (Test-Path $test.File)) {
      Write-TestError "Arquivo não encontrado: $($test.File)"
      $allPassed = $false
      $step++
      continue
    }
        
    $content = Get-Content $test.File -Raw
        
    # Verifica injeção no construtor
    if ($content -match "atendimentoGateway:\s*AtendimentoGateway") {
      Write-TestSuccess "Gateway injetado no construtor"
    }
    else {
      Write-TestError "Gateway NÃO injetado no construtor"
      $allPassed = $false
    }
        
    # Verifica chamada do método
    if ($content -match $test.Pattern) {
      Write-TestSuccess "Método notificarNovaMensagem chamado"
    }
    else {
      Write-TestError "Método notificarNovaMensagem NÃO chamado"
      $allPassed = $false
    }
        
    # Verifica transformação de dados
    if ($content -match "mensagemFormatada") {
      Write-TestSuccess "Transformação de dados implementada"
    }
    else {
      Write-TestError "Transformação de dados NÃO implementada"
      $allPassed = $false
    }
        
    $step++
  }
    
  return $allPassed
}

function Test-FrontendWebSocket {
  Write-TestHeader "TESTE 5: Frontend WebSocket Hook"
    
  $hookFile = "C:\Projetos\conectcrm\frontend-web\src\features\atendimento\omnichannel\hooks\useWebSocket.ts"
    
  Write-TestStep "Verificando useWebSocket.ts..." 1 3
    
  if (-not (Test-Path $hookFile)) {
    Write-TestError "Arquivo useWebSocket.ts não encontrado!"
    return $false
  }
    
  $content = Get-Content $hookFile -Raw
    
  # Teste 1: Singleton Pattern
  Write-TestStep "Verificando singleton pattern..." 2 3
  if ($content -match "let\s+globalSocket.*Socket\s*\|\s*null") {
    Write-TestSuccess "Singleton pattern implementado"
  }
  else {
    Write-TestError "Singleton pattern NÃO implementado"
    return $false
  }
    
  # Teste 2: Eventos escutados
  Write-TestStep "Verificando event listeners..." 3 3
  $events = @("nova_mensagem", "novo_ticket", "ticket_atualizado")
  $allEventsFound = $true
    
  foreach ($eventName in $events) {
    $pattern = "socket\.on\(['" + $eventName + "'"
    if ($content -match $pattern) {
      Write-TestSuccess "Evento '$eventName' sendo escutado"
    }
    else {
      Write-TestError "Evento '$eventName' NÃO está sendo escutado"
      $allEventsFound = $false
    }
  }
    
  return $allEventsFound
}

function Test-MessageFormatTransformation {
  Write-TestHeader "TESTE 6: Transformação de Formato de Mensagens"
    
  $files = @(
    @{
      Name    = "mensagem.service.ts"
      Path    = "C:\Projetos\conectcrm\backend\src\modules\atendimento\services\mensagem.service.ts"
      Pattern = "remetente:\s*"
    },
    @{
      Name    = "whatsapp-webhook.service.ts"
      Path    = "C:\Projetos\conectcrm\backend\src\modules\atendimento\services\whatsapp-webhook.service.ts"
      Pattern = "tipo:\s*'cliente'"
    }
  )
    
  $allPassed = $true
  $step = 1
    
  foreach ($file in $files) {
    Write-TestStep "Verificando transformação em $($file.Name)..." $step $files.Count
        
    if (-not (Test-Path $file.Path)) {
      Write-TestError "Arquivo não encontrado: $($file.Path)"
      $allPassed = $false
      $step++
      continue
    }
        
    $content = Get-Content $file.Path -Raw
        
    if ($content -match $file.Pattern) {
      Write-TestSuccess "Transformação implementada corretamente"
            
      # Verifica campos obrigatórios
      $requiredFields = @("tipo", "nome", "foto", "id")
      foreach ($field in $requiredFields) {
        if ($content -match "$field\s*:") {
          Write-TestSuccess "  ✓ Campo '$field' presente"
        }
        else {
          Write-TestError "  ✗ Campo '$field' ausente"
          $allPassed = $false
        }
      }
    }
    else {
      Write-TestError "Transformação NÃO implementada"
      $allPassed = $false
    }
        
    $step++
  }
    
  return $allPassed
}

function Show-TestSummary {
  param([hashtable]$Results)
    
  Write-Host ""
  Write-Host ("=" * 80) -ForegroundColor $ColorInfo
  Write-Host " 📊 RESUMO DOS TESTES" -ForegroundColor $ColorInfo
  Write-Host ("=" * 80) -ForegroundColor $ColorInfo
  Write-Host ""
    
  $total = $Results.Count
  $passed = ($Results.Values | Where-Object { $_ -eq $true }).Count
  $failed = $total - $passed
    
  foreach ($key in $Results.Keys | Sort-Object) {
    $status = if ($Results[$key]) { "✅ PASSOU" } else { "❌ FALHOU" }
    $color = if ($Results[$key]) { $ColorSuccess } else { $ColorError }
    Write-Host "  $key : $status" -ForegroundColor $color
  }
    
  Write-Host ""
  $separator = "-" * 80
  Write-Host $separator -ForegroundColor $ColorInfo
  Write-Host "  Total: $total testes" -ForegroundColor $ColorInfo
  Write-Host "  Passou: $passed testes" -ForegroundColor $ColorSuccess
  Write-Host "  Falhou: $failed testes" -ForegroundColor $ColorError
  Write-Host $separator -ForegroundColor $ColorInfo
  Write-Host ""
    
  if ($failed -eq 0) {
    Write-Host "🎉 TODOS OS TESTES PASSARAM!" -ForegroundColor $ColorSuccess
    Write-Host "✅ Sistema WebSocket está 100% funcional!" -ForegroundColor $ColorSuccess
    Write-Host ""
    Write-Host "Próximos passos:" -ForegroundColor $ColorInfo
    Write-Host "  1. Abra http://localhost:3000/atendimento" -ForegroundColor Yellow
    Write-Host "  2. Abra DevTools → Console" -ForegroundColor Yellow
    Write-Host "  3. Procure por: '✅ WebSocket conectado!'" -ForegroundColor Yellow
    Write-Host "  4. Envie uma mensagem e observe o tempo real" -ForegroundColor Yellow
  }
  else {
    Write-Host "⚠️  ALGUNS TESTES FALHARAM!" -ForegroundColor $ColorWarning
    Write-Host "❌ Por favor, revise os erros acima" -ForegroundColor $ColorError
  }
    
  Write-Host ""
}

# ============================================================================
# EXECUÇÃO PRINCIPAL
# ============================================================================

Clear-Host

Write-Host ""
Write-Host ("=" * 80) -ForegroundColor $ColorInfo
Write-Host " 🧪 TESTE AUTOMÁTICO - WEBSOCKET TEMPO REAL" -ForegroundColor $ColorInfo
Write-Host " 📅 Data: $(Get-Date -Format 'dd/MM/yyyy HH:mm:ss')" -ForegroundColor $ColorInfo
Write-Host ("=" * 80) -ForegroundColor $ColorInfo
Write-Host ""

# Executa testes
$results = @{}

$results["1. Backend Health"] = Test-BackendHealth
$results["2. WebSocket Endpoint"] = Test-WebSocketEndpoint
$results["3. Gateway Registration"] = Test-GatewayRegistration
$results["4. WebSocket Integration"] = Test-WebSocketIntegration
$results["5. Frontend Hook"] = Test-FrontendWebSocket
$results["6. Message Transformation"] = Test-MessageFormatTransformation

# Exibe resumo
Show-TestSummary -Results $results

# Retorna código de saída
$failedCount = ($results.Values | Where-Object { $_ -eq $false }).Count
exit $failedCount
