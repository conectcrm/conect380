# =====================================================
# Script: Check-ErrorBudget.ps1
# Descrição: Verifica status do error budget no Prometheus
# Retorna: Status e percentual de budget restante
# =====================================================

param(
  [string]$PrometheusUrl = "http://localhost:9090",
  [double]$SloTarget = 99.9,
  [string]$TimeWindow = "30d",
  [int]$FreezeThreshold = 20,
  [int]$WarningThreshold = 50,
  [int]$CautionThreshold = 80,
  [switch]$SaveJson,
  [string]$OutputFile = "$env:TEMP\error-budget-status.json"
)

# ==============================
# FUNÇÕES AUXILIARES
# ==============================

function Write-Log {
  param([string]$Message, [string]$Level = "INFO")
    
  $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
  $color = switch ($Level) {
    "ERROR" { "Red" }
    "WARNING" { "Yellow" }
    "SUCCESS" { "Green" }
    default { "White" }
  }
    
  Write-Host "[$timestamp] " -NoNewline
  Write-Host $Message -ForegroundColor $color
}

# ==============================
# QUERY PROMETHEUS
# ==============================

function Invoke-PrometheusQuery {
  param([string]$Query)
    
  Write-Log "Querying Prometheus: $Query"
    
  $encodedQuery = [System.Web.HttpUtility]::UrlEncode($Query)
  $url = "$PrometheusUrl/api/v1/query?query=$encodedQuery"
    
  try {
    $response = Invoke-RestMethod -Uri $url -Method Get -ErrorAction Stop
        
    if ($response.status -ne "success") {
      Write-Log "Prometheus query failed: $($response | ConvertTo-Json)" -Level ERROR
      return $null
    }
        
    $value = $response.data.result[0].value[1]
        
    if ($null -eq $value) {
      Write-Log "No data returned from Prometheus" -Level ERROR
      return $null
    }
        
    return [double]$value
  }
  catch {
    Write-Log "Error querying Prometheus: $_" -Level ERROR
    return $null
  }
}

# ==============================
# CALCULAR ERROR BUDGET
# ==============================

function Get-ErrorBudget {
  Write-Log "Calculating error budget for $TimeWindow window..."
    
  # Query: (1 - (sum(rate(http_requests_total{status=~"5.."}[30d])) / sum(rate(http_requests_total[30d])))) * 100
  $query = "(1 - (sum(rate(http_requests_total{status=~`"5..`"}[$TimeWindow])) / sum(rate(http_requests_total[$TimeWindow])))) * 100"
    
  $availability = Invoke-PrometheusQuery -Query $query
    
  if ($null -eq $availability) {
    Write-Log "Failed to calculate availability" -Level ERROR
    return $null
  }
    
  # Calcular percentual de budget restante
  $sloMargin = 100 - $SloTarget
  $currentMargin = $availability - $SloTarget
  $budgetRemaining = ($currentMargin / $sloMargin) * 100
    
  # Se availability < SLO, budget é negativo
  if ($availability -lt $SloTarget) {
    $budgetRemaining = -100
  }
    
  return [PSCustomObject]@{
    Availability    = $availability
    BudgetRemaining = [Math]::Round($budgetRemaining, 2)
  }
}

# ==============================
# DETERMINAR STATUS
# ==============================

function Get-DeployStatus {
  param([double]$Budget)
    
  if ($Budget -lt 0) {
    return "EXHAUSTED"
  }
  elseif ($Budget -lt $FreezeThreshold) {
    return "FREEZE"
  }
  elseif ($Budget -lt $WarningThreshold) {
    return "WARNING"
  }
  elseif ($Budget -lt $CautionThreshold) {
    return "CAUTION"
  }
  else {
    return "NORMAL"
  }
}

# ==============================
# CALCULAR DIAS ATÉ ESGOTAMENTO
# ==============================

function Get-DaysToExhaustion {
  param([double]$Budget)
    
  $query = "sum(rate(http_requests_total{status=~`"5..`"}[1h])) / sum(rate(http_requests_total[1h]))"
  $burnRate = Invoke-PrometheusQuery -Query $query
    
  if ($null -eq $burnRate -or $burnRate -eq 0) {
    return "∞"
  }
    
  $days = ($Budget / 100) / ($burnRate * 24)
  return [Math]::Round($days, 1)
}

# ==============================
# EXIBIR RESULTADO
# ==============================

function Show-Result {
  param(
    [double]$Budget,
    [string]$Status,
    $Days
  )
    
  Write-Host ""
  Write-Host "======================================" -ForegroundColor Cyan
  Write-Host "  ERROR BUDGET STATUS" -ForegroundColor Cyan
  Write-Host "======================================" -ForegroundColor Cyan
  Write-Host ""
    
  switch ($Status) {
    "EXHAUSTED" {
      Write-Host "Status: 🚫 BUDGET EXHAUSTED" -ForegroundColor Red
      Write-Host "Budget Remaining: $Budget% (NEGATIVE)" -ForegroundColor Red
    }
    "FREEZE" {
      Write-Host "Status: 🚫 DEPLOY FREEZE" -ForegroundColor Red
      Write-Host "Budget Remaining: $Budget%" -ForegroundColor Red
    }
    "WARNING" {
      Write-Host "Status: ⚠️  WARNING" -ForegroundColor DarkYellow
      Write-Host "Budget Remaining: $Budget%" -ForegroundColor DarkYellow
    }
    "CAUTION" {
      Write-Host "Status: ⚠️  CAUTION" -ForegroundColor Yellow
      Write-Host "Budget Remaining: $Budget%" -ForegroundColor Yellow
    }
    "NORMAL" {
      Write-Host "Status: ✅ NORMAL" -ForegroundColor Green
      Write-Host "Budget Remaining: $Budget%" -ForegroundColor Green
    }
  }
    
  Write-Host "Days to Exhaustion: $Days"
  Write-Host "SLO Target: ${SloTarget}%"
  Write-Host "Time Window: $TimeWindow"
  Write-Host ""
  Write-Host "======================================" -ForegroundColor Cyan
  Write-Host "  DEPLOY POLICY" -ForegroundColor Cyan
  Write-Host "======================================" -ForegroundColor Cyan
  Write-Host ""
    
  switch ($Status) {
    "EXHAUSTED" {
      Write-Host "🚫 NO DEPLOYS ALLOWED" -ForegroundColor Red
      Write-Host "Budget is EXHAUSTED. Only emergency fixes with CTO approval."
    }
    "FREEZE" {
      Write-Host "🚫 DEPLOY FREEZE ACTIVE" -ForegroundColor Red
      Write-Host "Only critical security/availability fixes allowed."
      Write-Host "All changes require CTO approval."
    }
    "WARNING" {
      Write-Host "⚠️  RELIABILITY FOCUS MODE" -ForegroundColor DarkYellow
      Write-Host "Emergency fixes only. No new features."
      Write-Host "Review ALL changes carefully."
    }
    "CAUTION" {
      Write-Host "⚠️  REDUCED DEPLOY FREQUENCY" -ForegroundColor Yellow
      Write-Host "Limit to 1-2 deploys/day."
      Write-Host "Extra caution required."
    }
    "NORMAL" {
      Write-Host "✅ NORMAL OPERATIONS" -ForegroundColor Green
      Write-Host "Multiple deploys/day allowed."
      Write-Host "Standard review process."
    }
  }
    
  Write-Host ""
}

# ==============================
# SALVAR JSON
# ==============================

function Save-Json {
  param(
    [double]$Budget,
    [string]$Status,
    $Days
  )
    
  $result = @{
    timestamp      = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
    error_budget   = @{
      remaining_percent  = $Budget
      status             = $Status
      days_to_exhaustion = $Days.ToString()
    }
    slo            = @{
      target_percent = $SloTarget
      time_window    = $TimeWindow
    }
    thresholds     = @{
      freeze  = $FreezeThreshold
      warning = $WarningThreshold
      caution = $CautionThreshold
    }
    deploy_allowed = ($Status -eq "NORMAL" -or $Status -eq "CAUTION")
  }
    
  $result | ConvertTo-Json -Depth 10 | Out-File -FilePath $OutputFile -Encoding UTF8
  Write-Log "Result saved to $OutputFile"
}

# ==============================
# MAIN
# ==============================

Write-Log "Starting error budget check..."

# Adicionar assembly para URL encoding
Add-Type -AssemblyName System.Web

# Calcular error budget
$budgetData = Get-ErrorBudget

if ($null -eq $budgetData) {
  Write-Log "Failed to calculate error budget" -Level ERROR
  exit 99
}

$budget = $budgetData.BudgetRemaining

# Determinar status
$status = Get-DeployStatus -Budget $budget

# Calcular dias até esgotamento
$days = Get-DaysToExhaustion -Budget $budget

# Exibir resultado
Show-Result -Budget $budget -Status $status -Days $days

# Salvar JSON (se solicitado)
if ($SaveJson) {
  Save-Json -Budget $budget -Status $status -Days $days
}

# Retornar exit code
$exitCode = switch ($status) {
  "EXHAUSTED" { 3 }
  "FREEZE" { 2 }
  "WARNING" { 1 }
  "CAUTION" { 0 }
  "NORMAL" { 0 }
  default { 99 }
}

exit $exitCode
