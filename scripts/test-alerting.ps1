# ==============================================================================
# Script de Teste de Alertas - ConectCRM
# ==============================================================================
# 
# Testa o sistema de alertas enviando alertas fictícios para o Alertmanager
# e verificando se são roteados corretamente para os canais configurados.

param(
  [Parameter(Mandatory = $false)]
  [ValidateSet('critical', 'warning', 'info', 'slo', 'all')]
  [string]$Severity = 'all',
    
  [Parameter(Mandatory = $false)]
  [string]$AlertmanagerUrl = 'http://localhost:9093'
)

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "   TESTE DE ALERTAS - CONECTCRM" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Função para enviar alerta
function Send-TestAlert {
  param(
    [string]$AlertName,
    [string]$Severity,
    [string]$Summary,
    [hashtable]$Labels = @{},
    [hashtable]$Annotations = @{}
  )
    
  Write-Host "📤 Enviando alerta: $AlertName ($Severity)" -ForegroundColor Yellow
    
  $alert = @{
    labels      = @{
      alertname   = $AlertName
      severity    = $Severity
      instance    = "localhost:3001"
      job         = "conectcrm-backend"
      environment = "development"
    } + $Labels
    annotations = @{
      summary     = $Summary
      description = "Alerta de teste gerado via script PowerShell"
      action      = "Verificar se alerta chegou nos canais configurados"
    } + $Annotations
    startsAt    = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
  }
    
  try {
    $json = $alert | ConvertTo-Json -Depth 10
    $response = Invoke-RestMethod `
      -Uri "$AlertmanagerUrl/api/v2/alerts" `
      -Method Post `
      -Body "[$json]" `
      -ContentType "application/json"
        
    Write-Host "   ✅ Alerta enviado com sucesso!" -ForegroundColor Green
    return $true
  }
  catch {
    Write-Host "   ❌ Erro ao enviar alerta: $($_.Exception.Message)" -ForegroundColor Red
    return $false
  }
}

# Verificar se Alertmanager está rodando
Write-Host "🔍 Verificando Alertmanager em $AlertmanagerUrl..." -ForegroundColor Cyan
try {
  $health = Invoke-RestMethod -Uri "$AlertmanagerUrl/-/healthy" -Method Get
  Write-Host "   ✅ Alertmanager está saudável!`n" -ForegroundColor Green
}
catch {
  Write-Host "   ❌ Alertmanager não está respondendo!" -ForegroundColor Red
  Write-Host "   💡 Execute: docker-compose up -d alertmanager`n" -ForegroundColor Yellow
  exit 1
}

# Enviar alertas de teste
$success = 0
$total = 0

if ($Severity -eq 'all' -or $Severity -eq 'critical') {
  Write-Host "`n🔴 ALERTAS CRÍTICOS (Email + Slack + PagerDuty)" -ForegroundColor Red
  Write-Host "─────────────────────────────────────────────────" -ForegroundColor DarkGray
    
  $total++
  if (Send-TestAlert `
      -AlertName "APIDown" `
      -Severity "critical" `
      -Summary "API ConectCRM está fora do ar (TESTE)" `
      -Labels @{ component = "api" } `
      -Annotations @{ runbook = "https://docs.conectcrm.com/runbooks/api-down" }
  ) { $success++ }
    
  Start-Sleep -Seconds 2
    
  $total++
  if (Send-TestAlert `
      -AlertName "DatabaseConnectionPoolExhausted" `
      -Severity "critical" `
      -Summary "Pool de conexões do banco está esgotado (TESTE)" `
      -Labels @{ component = "database" } `
      -Annotations @{ runbook = "https://docs.conectcrm.com/runbooks/db-pool-exhausted" }
  ) { $success++ }
    
  Start-Sleep -Seconds 2
}

if ($Severity -eq 'all' -or $Severity -eq 'warning') {
  Write-Host "`n🟡 ALERTAS DE WARNING (Email + Slack)" -ForegroundColor Yellow
  Write-Host "─────────────────────────────────────────────────" -ForegroundColor DarkGray
    
  $total++
  if (Send-TestAlert `
      -AlertName "HighLatencyP95" `
      -Severity "warning" `
      -Summary "Latência P95 acima de 2 segundos (TESTE)" `
      -Labels @{ component = "api"; route = "/api/tickets" } `
      -Annotations @{ 
      runbook       = "https://docs.conectcrm.com/runbooks/high-latency"
      current_value = "2.5s"
      threshold     = "2s"
    }
  ) { $success++ }
    
  Start-Sleep -Seconds 2
    
  $total++
  if (Send-TestAlert `
      -AlertName "HighCPUUsage" `
      -Severity "warning" `
      -Summary "Uso de CPU acima de 80% (TESTE)" `
      -Labels @{ component = "system" } `
      -Annotations @{ 
      current_value = "85%"
      threshold     = "80%"
    }
  ) { $success++ }
    
  Start-Sleep -Seconds 2
}

if ($Severity -eq 'all' -or $Severity -eq 'info') {
  Write-Host "`n🔵 ALERTAS INFORMATIVOS (Slack apenas)" -ForegroundColor Cyan
  Write-Host "─────────────────────────────────────────────────" -ForegroundColor DarkGray
    
  $total++
  if (Send-TestAlert `
      -AlertName "TrafficDropDetected" `
      -Severity "info" `
      -Summary "Queda de 30% no tráfego detectada (TESTE)" `
      -Labels @{ component = "api"; type = "business" } `
      -Annotations @{ 
      current_value   = "70 req/min"
      previous_value  = "100 req/min"
      drop_percentage = "30%"
    }
  ) { $success++ }
    
  Start-Sleep -Seconds 2
}

if ($Severity -eq 'all' -or $Severity -eq 'slo') {
  Write-Host "`n📊 ALERTAS DE SLO (Canal #slo-violations)" -ForegroundColor Magenta
  Write-Host "─────────────────────────────────────────────────" -ForegroundColor DarkGray
    
  $total++
  if (Send-TestAlert `
      -AlertName "SLOAvailabilityViolation" `
      -Severity "critical" `
      -Summary "SLO de disponibilidade violado (TESTE)" `
      -Labels @{ 
      component = "slo"
      slo_name  = "availability"
      type      = "slo"
    } `
      -Annotations @{ 
      slo_target             = "99.9%"
      current_value          = "99.85%"
      window                 = "30d"
      error_budget_remaining = "15%"
    }
  ) { $success++ }
    
  Start-Sleep -Seconds 2
    
  $total++
  if (Send-TestAlert `
      -AlertName "ErrorBudgetExhausted" `
      -Severity "critical" `
      -Summary "Error Budget esgotado em 85% (TESTE)" `
      -Labels @{ 
      component = "slo"
      slo_name  = "availability"
      type      = "slo"
    } `
      -Annotations @{ 
      error_budget_consumed  = "85%"
      error_budget_remaining = "15%"
      warning                = "⚠️ DEPLOY FREEZE - Apenas correções críticas"
    }
  ) { $success++ }
    
  Start-Sleep -Seconds 2
}

# Resumo
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "           RESUMO DOS TESTES" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Total de alertas enviados: $total" -ForegroundColor White
Write-Host "Sucesso: $success" -ForegroundColor Green
Write-Host "Falhas: $($total - $success)" -ForegroundColor Red

if ($success -eq $total) {
  Write-Host "`n✅ TODOS OS ALERTAS FORAM ENVIADOS!" -ForegroundColor Green
}
else {
  Write-Host "`n⚠️ ALGUNS ALERTAS FALHARAM!" -ForegroundColor Yellow
}

# Instruções pós-teste
Write-Host "`n📋 PRÓXIMOS PASSOS:" -ForegroundColor Cyan
Write-Host "─────────────────────────────────────────────────" -ForegroundColor DarkGray
Write-Host "1. Verificar UI do Alertmanager:" -ForegroundColor White
Write-Host "   http://localhost:9093/#/alerts" -ForegroundColor Blue
Write-Host "`n2. Verificar canais configurados:" -ForegroundColor White
Write-Host "   • Email: Inbox de $env:SMTP_USERNAME" -ForegroundColor Gray
Write-Host "   • Slack: Canais #alerts-critical, #alerts-warning, #alerts-info" -ForegroundColor Gray
Write-Host "   • PagerDuty: Incidents dashboard" -ForegroundColor Gray
Write-Host "`n3. Verificar silences (se necessário):" -ForegroundColor White
Write-Host "   http://localhost:9093/#/silences" -ForegroundColor Blue
Write-Host "`n4. Visualizar métricas no Prometheus:" -ForegroundColor White
Write-Host "   http://localhost:9090/alerts" -ForegroundColor Blue
Write-Host ""

# Pergunta se deseja visualizar alertas ativos
$view = Read-Host "Deseja abrir o Alertmanager no browser? (S/N)"
if ($view -eq 'S' -or $view -eq 's') {
  Start-Process "$AlertmanagerUrl/#/alerts"
}
