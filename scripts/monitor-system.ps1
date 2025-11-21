# 📊 Script de Monitoramento - ConectCRM Performance
# 
# Monitora health checks, rate limiting e cache do sistema
# Uso: .\scripts\monitor-system.ps1 [-Interval 30]

param(
  [int]$Interval = 30  # Intervalo em segundos entre checks
)

$ErrorActionPreference = "SilentlyContinue"
$BackendURL = "http://localhost:3001"

Write-Host "🚀 Iniciando monitoramento do ConectCRM..." -ForegroundColor Cyan
Write-Host "   Backend: $BackendURL" -ForegroundColor Gray
Write-Host "   Intervalo: $Interval segundos" -ForegroundColor Gray
Write-Host "   Pressione Ctrl+C para parar`n" -ForegroundColor Gray

# Função para formatar números
function Format-Number {
  param([long]$Number)
  if ($Number -ge 1000000) {
    return "{0:N2}M" -f ($Number / 1000000)
  }
  elseif ($Number -ge 1000) {
    return "{0:N2}K" -f ($Number / 1000)
  }
  else {
    return $Number
  }
}

# Função para formatar percentual
function Format-Percent {
  param([double]$Value)
  $color = "Green"
  if ($Value -gt 80) { $color = "Yellow" }
  if ($Value -gt 90) { $color = "Red" }
  return @{Value = "{0:N1}%" -f $Value; Color = $color }
}

# Loop de monitoramento
$iteration = 0
while ($true) {
  $iteration++
  $timestamp = Get-Date -Format "HH:mm:ss"
    
  Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
  Write-Host "🕐 $timestamp - Check #$iteration" -ForegroundColor Cyan
  Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
    
  # 1. Health Check Detalhado
  try {
    Write-Host "`n🏥 Health Check:" -ForegroundColor Yellow
    $health = Invoke-RestMethod -Uri "$BackendURL/health/detailed" -Method Get -TimeoutSec 5
        
    # Database
    $dbStatus = if ($health.database.connected) { "✅" } else { "❌" }
    $dbTime = $health.database.responseTime
    $dbColor = if ($dbTime -lt 10) { "Green" } elseif ($dbTime -lt 50) { "Yellow" } else { "Red" }
    Write-Host "   Database:  $dbStatus Connected " -NoNewline
    Write-Host "($dbTime ms)" -ForegroundColor $dbColor
    Write-Host "   Tables:    $($health.database.tables)" -ForegroundColor Gray
    Write-Host "   Connections: Active=$($health.database.connections.active) Idle=$($health.database.connections.idle)" -ForegroundColor Gray
        
    # Memory
    $memPercent = Format-Percent -Value $health.memory.percentage
    Write-Host "   Memory:    $($health.memory.used)MB / $($health.memory.total)MB " -NoNewline
    Write-Host "($($memPercent.Value))" -ForegroundColor $memPercent.Color
    Write-Host "   Heap:      $($health.memory.heapUsed)MB / $($health.memory.heapTotal)MB" -ForegroundColor Gray
        
    # Uptime
    Write-Host "   Uptime:    $($health.uptime.formatted)" -ForegroundColor Gray
        
  }
  catch {
    Write-Host "   ❌ ERRO: Backend não está respondendo" -ForegroundColor Red
    Write-Host "   Detalhes: $($_.Exception.Message)" -ForegroundColor DarkRed
  }
    
  # 2. Rate Limiting Stats
  try {
    Write-Host "`n🛡️  Rate Limiting:" -ForegroundColor Yellow
    $rateLimit = Invoke-RestMethod -Uri "$BackendURL/rate-limit/stats" -Method Get -TimeoutSec 5
        
    $totalReqs = Format-Number -Number $rateLimit.totalRequests
    $blockedReqs = Format-Number -Number $rateLimit.blockedRequests
    $blockRate = [double]($rateLimit.blockRate -replace '%', '')
    $blockColor = if ($blockRate -lt 0.5) { "Green" } elseif ($blockRate -lt 2) { "Yellow" } else { "Red" }
        
    Write-Host "   Total Requests:   $totalReqs" -ForegroundColor Gray
    Write-Host "   Blocked:          $blockedReqs " -NoNewline
    Write-Host "($($rateLimit.blockRate))" -ForegroundColor $blockColor
    Write-Host "   Active IPs:       $($rateLimit.activeIPs)" -ForegroundColor Gray
    Write-Host "   Active Empresas:  $($rateLimit.activeEmpresas)" -ForegroundColor Gray
        
    # Alertas
    if ($blockRate -gt 5) {
      Write-Host "   ⚠️  ALERTA: Taxa de bloqueio alta ($($rateLimit.blockRate))!" -ForegroundColor Red
    }
    elseif ($blockRate -gt 2) {
      Write-Host "   ⚠️  Atenção: Taxa de bloqueio elevada" -ForegroundColor Yellow
    }
        
  }
  catch {
    Write-Host "   ⚠️  Estatísticas de rate limiting não disponíveis" -ForegroundColor Yellow
  }
    
  # 3. Performance Indexes (verifica se estão sendo usados)
  try {
    Write-Host "`n📊 Performance:" -ForegroundColor Yellow
        
    # Simular query para ver se usa index
    $startTime = Get-Date
    $response = Invoke-RestMethod -Uri "$BackendURL/health" -Method Get -TimeoutSec 5
    $endTime = Get-Date
    $responseTime = ($endTime - $startTime).TotalMilliseconds
        
    $perfColor = if ($responseTime -lt 50) { "Green" } elseif ($responseTime -lt 200) { "Yellow" } else { "Red" }
    Write-Host "   Health Response:  " -NoNewline
    Write-Host ("{0:N2} ms" -f $responseTime) -ForegroundColor $perfColor
        
    if ($responseTime -lt 50) {
      Write-Host "   Status: ✅ Excelente" -ForegroundColor Green
    }
    elseif ($responseTime -lt 200) {
      Write-Host "   Status: ⚠️  Aceitável" -ForegroundColor Yellow
    }
    else {
      Write-Host "   Status: ❌ Lento" -ForegroundColor Red
    }
        
  }
  catch {
    Write-Host "   ❌ Erro ao testar performance" -ForegroundColor Red
  }
    
  # 4. Resumo e Recomendações
  Write-Host "`n💡 Status Geral:" -ForegroundColor Yellow
  $allOk = $true
    
  if ($health.database.responseTime -gt 100) {
    Write-Host "   ⚠️  Database lento (>100ms) - Verificar queries" -ForegroundColor Yellow
    $allOk = $false
  }
  if ($health.memory.percentage -gt 90) {
    Write-Host "   ⚠️  Memória alta (>90%) - Considerar restart" -ForegroundColor Yellow
    $allOk = $false
  }
  if ($blockRate -gt 2) {
    Write-Host "   ⚠️  Taxa de bloqueio alta - Verificar IPs suspeitos" -ForegroundColor Yellow
    $allOk = $false
  }
    
  if ($allOk) {
    Write-Host "   ✅ Todos os sistemas operacionais" -ForegroundColor Green
  }
    
  # Aguardar próximo check
  Write-Host "`n⏳ Próximo check em $Interval segundos..." -ForegroundColor DarkGray
  Start-Sleep -Seconds $Interval
}
