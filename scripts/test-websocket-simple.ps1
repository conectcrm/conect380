# ============================================================================
# Script de Validação WebSocket - ConectHelp
# ============================================================================

Write-Host "`n"
Write-Host "================================================================================" -ForegroundColor Cyan
Write-Host " VALIDAÇÃO WEBSOCKET TEMPO REAL - ConectHelp" -ForegroundColor Cyan
Write-Host "================================================================================" -ForegroundColor Cyan
Write-Host "`n"

$results = @{}

# ============================================================================
# TESTE 1: Backend Health
# ============================================================================
Write-Host "TESTE 1: Verificando Backend..." -ForegroundColor Yellow

try {
  $response = Invoke-WebRequest -Uri "http://localhost:3001/health" -Method GET -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop
    
  if ($response.StatusCode -eq 200) {
    Write-Host "OK Backend esta rodando" -ForegroundColor Green
    $results["1. Backend Health"] = $true
  }
}
catch {
  Write-Host "ERRO Backend NAO esta acessivel" -ForegroundColor Red
  Write-Host "Execute: cd backend && npm run start:prod" -ForegroundColor Yellow
  $results["1. Backend Health"] = $false
}

Write-Host "`n"

# ============================================================================
# TESTE 2: Gateway Registration
# ============================================================================
Write-Host "TESTE 2: Verificando Gateway no Modulo..." -ForegroundColor Yellow

$moduleFile = "C:\Projetos\conectcrm\backend\src\modules\atendimento\atendimento.module.ts"

if (Test-Path $moduleFile) {
  $content = Get-Content $moduleFile -Raw
    
  if (($content -match "AtendimentoGateway") -and ($content -match "providers:\s*\[")) {
    Write-Host "OK Gateway registrado no modulo" -ForegroundColor Green
    $results["2. Gateway Registration"] = $true
  }
  else {
    Write-Host "ERRO Gateway NAO esta registrado" -ForegroundColor Red
    $results["2. Gateway Registration"] = $false
  }
}
else {
  Write-Host "ERRO Arquivo nao encontrado" -ForegroundColor Red
  $results["2. Gateway Registration"] = $false
}

Write-Host "`n"

# ============================================================================
# TESTE 3: Webhook Service Integration
# ============================================================================
Write-Host "TESTE 3: Verificando Webhook Service..." -ForegroundColor Yellow

$webhookFile = "C:\Projetos\conectcrm\backend\src\modules\atendimento\services\whatsapp-webhook.service.ts"

if (Test-Path $webhookFile) {
  $content = Get-Content $webhookFile -Raw
    
  $checks = @{
    "Gateway injetado"           = ($content -match "atendimentoGateway:\s*AtendimentoGateway")
    "Notificacao chamada"        = ($content -match "atendimentoGateway\.notificarNovaMensagem")
    "Transformacao implementada" = ($content -match "mensagemFormatada")
  }
    
  $allPassed = $true
  foreach ($check in $checks.GetEnumerator()) {
    if ($check.Value) {
      Write-Host "  OK $($check.Key)" -ForegroundColor Green
    }
    else {
      Write-Host "  ERRO $($check.Key)" -ForegroundColor Red
      $allPassed = $false
    }
  }
    
  $results["3. Webhook Service"] = $allPassed
}
else {
  Write-Host "ERRO Arquivo nao encontrado" -ForegroundColor Red
  $results["3. Webhook Service"] = $false
}

Write-Host "`n"

# ============================================================================
# TESTE 4: Mensagem Service Integration
# ============================================================================
Write-Host "TESTE 4: Verificando Mensagem Service..." -ForegroundColor Yellow

$mensagemFile = "C:\Projetos\conectcrm\backend\src\modules\atendimento\services\mensagem.service.ts"

if (Test-Path $mensagemFile) {
  $content = Get-Content $mensagemFile -Raw
    
  $checks = @{
    "Gateway injetado"           = ($content -match "atendimentoGateway:\s*AtendimentoGateway")
    "Notificacao chamada"        = ($content -match "atendimentoGateway\.notificarNovaMensagem")
    "Transformacao implementada" = ($content -match "mensagemFormatada")
  }
    
  $allPassed = $true
  foreach ($check in $checks.GetEnumerator()) {
    if ($check.Value) {
      Write-Host "  OK $($check.Key)" -ForegroundColor Green
    }
    else {
      Write-Host "  ERRO $($check.Key)" -ForegroundColor Red
      $allPassed = $false
    }
  }
    
  $results["4. Mensagem Service"] = $allPassed
}
else {
  Write-Host "ERRO Arquivo nao encontrado" -ForegroundColor Red
  $results["4. Mensagem Service"] = $false
}

Write-Host "`n"

# ============================================================================
# TESTE 5: Frontend Hook
# ============================================================================
Write-Host "TESTE 5: Verificando Frontend Hook..." -ForegroundColor Yellow

$hookFile = "C:\Projetos\conectcrm\frontend-web\src\features\atendimento\omnichannel\hooks\useWebSocket.ts"

if (Test-Path $hookFile) {
  $content = Get-Content $hookFile -Raw
    
  $checks = @{
    "Singleton pattern"       = ($content -match "let\s+globalSocket")
    "Event nova_mensagem"     = ($content -match "nova_mensagem")
    "Event novo_ticket"       = ($content -match "novo_ticket")
    "Event ticket_atualizado" = ($content -match "ticket_atualizado")
  }
    
  $allPassed = $true
  foreach ($check in $checks.GetEnumerator()) {
    if ($check.Value) {
      Write-Host "  OK $($check.Key)" -ForegroundColor Green
    }
    else {
      Write-Host "  ERRO $($check.Key)" -ForegroundColor Red
      $allPassed = $false
    }
  }
    
  $results["5. Frontend Hook"] = $allPassed
}
else {
  Write-Host "ERRO Arquivo nao encontrado" -ForegroundColor Red
  $results["5. Frontend Hook"] = $false
}

Write-Host "`n"

# ============================================================================
# TESTE 6: ChatOmnichannel Integration
# ============================================================================
Write-Host "TESTE 6: Verificando ChatOmnichannel..." -ForegroundColor Yellow

$chatFile = "C:\Projetos\conectcrm\frontend-web\src\features\atendimento\omnichannel\ChatOmnichannel.tsx"

if (Test-Path $chatFile) {
  $content = Get-Content $chatFile -Raw
    
  $checks = @{
    "Hook inicializado"       = ($content -match "useWebSocket")
    "Callback onNovaMensagem" = ($content -match "onNovaMensagem")
    "Callback onNovoTicket"   = ($content -match "onNovoTicket")
  }
    
  $allPassed = $true
  foreach ($check in $checks.GetEnumerator()) {
    if ($check.Value) {
      Write-Host "  OK $($check.Key)" -ForegroundColor Green
    }
    else {
      Write-Host "  ERRO $($check.Key)" -ForegroundColor Red
      $allPassed = $false
    }
  }
    
  $results["6. ChatOmnichannel"] = $allPassed
}
else {
  Write-Host "ERRO Arquivo nao encontrado" -ForegroundColor Red
  $results["6. ChatOmnichannel"] = $false
}

Write-Host "`n"

# ============================================================================
# RESUMO
# ============================================================================
Write-Host "================================================================================" -ForegroundColor Cyan
Write-Host " RESUMO DOS TESTES" -ForegroundColor Cyan
Write-Host "================================================================================" -ForegroundColor Cyan
Write-Host "`n"

$total = $results.Count
$passed = ($results.Values | Where-Object { $_ -eq $true }).Count
$failed = $total - $passed

foreach ($key in $results.Keys | Sort-Object) {
  if ($results[$key]) {
    Write-Host "  $key : PASSOU" -ForegroundColor Green
  }
  else {
    Write-Host "  $key : FALHOU" -ForegroundColor Red
  }
}

Write-Host "`n"
Write-Host "--------------------------------------------------------------------------------" -ForegroundColor Cyan
Write-Host "  Total: $total testes" -ForegroundColor Cyan
Write-Host "  Passou: $passed testes" -ForegroundColor Green
Write-Host "  Falhou: $failed testes" -ForegroundColor Red
Write-Host "--------------------------------------------------------------------------------" -ForegroundColor Cyan
Write-Host "`n"

if ($failed -eq 0) {
  Write-Host "SUCESSO! TODOS OS TESTES PASSARAM!" -ForegroundColor Green
  Write-Host "`n"
  Write-Host "Proximos passos:" -ForegroundColor Cyan
  Write-Host "  1. Abra http://localhost:3000/atendimento" -ForegroundColor Yellow
  Write-Host "  2. Abra DevTools -> Console" -ForegroundColor Yellow
  Write-Host "  3. Procure por: 'WebSocket conectado!'" -ForegroundColor Yellow
  Write-Host "  4. Envie uma mensagem e observe o tempo real" -ForegroundColor Yellow
  Write-Host "`n"
}
else {
  Write-Host "ATENCAO! ALGUNS TESTES FALHARAM!" -ForegroundColor Red
  Write-Host "Por favor, revise os erros acima" -ForegroundColor Yellow
  Write-Host "`n"
}

# Retorna código de saída
exit $failed
