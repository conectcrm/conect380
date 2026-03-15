param(
  [string]$InputCsv = '',
  [int]$PaymentFailureThreshold = 3,
  [int]$LatencyThresholdMs = 1500,
  [switch]$DryRun = $false,
  [string]$OutputFile = ''
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$runId = Get-Date -Format 'yyyyMMdd-HHmmss'

if (-not [string]::IsNullOrWhiteSpace($InputCsv) -and -not [System.IO.Path]::IsPathRooted($InputCsv)) {
  $InputCsv = Join-Path $repoRoot $InputCsv
}

if ([string]::IsNullOrWhiteSpace($OutputFile)) {
  $OutputFile = Join-Path $repoRoot "docs/features/evidencias/GDN408_ALERT_OBSERVABILITY_$runId.md"
} elseif (-not [System.IO.Path]::IsPathRooted($OutputFile)) {
  $OutputFile = Join-Path $repoRoot $OutputFile
}

function New-Alert {
  param(
    [string]$Code,
    [string]$Severity,
    [string]$Routing,
    [string]$Description
  )

  return [PSCustomObject]@{
    code = $Code
    severity = $Severity
    routing = $Routing
    description = $Description
  }
}

function Resolve-MonitorRow {
  param(
    [string]$CsvPath,
    [switch]$UseSynthetic
  )

  if (-not [string]::IsNullOrWhiteSpace($CsvPath) -and (Test-Path -Path $CsvPath)) {
    $rows = @((Import-Csv -Path $CsvPath))
    if ($rows.Count -gt 0) {
      return $rows[-1]
    }
  }

  if ($UseSynthetic) {
    return [PSCustomObject]@{
      cycle_result = 'PARTIAL'
      app_health_status = 'degraded'
      guardian_avg_latency_ms = 2100
      payment_failure_indicators = 5
      daily_billing_audit_errors = 2
      failed_requests = 1
    }
  }

  return [PSCustomObject]@{
    cycle_result = 'PASS'
    app_health_status = 'ok'
    guardian_avg_latency_ms = 300
    payment_failure_indicators = 0
    daily_billing_audit_errors = 0
    failed_requests = 0
  }
}

$monitorRow = Resolve-MonitorRow -CsvPath $InputCsv -UseSynthetic:$DryRun
$alerts = @()

$cycleResult = [string]$monitorRow.cycle_result
$healthStatus = [string]$monitorRow.app_health_status
$avgLatency = [double]($monitorRow.guardian_avg_latency_ms)
$paymentFailures = [int]($monitorRow.payment_failure_indicators)
$billingErrors = [int]($monitorRow.daily_billing_audit_errors)
$failedRequests = [int]($monitorRow.failed_requests)

if ($healthStatus -ne 'ok') {
  $alerts += New-Alert -Code 'guardian_health_unavailable' -Severity 'P0' -Routing 'N1,N2,N3' -Description "Health status '$healthStatus'"
}

if ($cycleResult -ne 'PASS' -or $failedRequests -gt 0) {
  $alerts += New-Alert -Code 'guardian_partial_cycle' -Severity 'P2' -Routing 'N1,N2' -Description "cycle_result=$cycleResult failed_requests=$failedRequests"
}

if ($avgLatency -ge $LatencyThresholdMs) {
  $alerts += New-Alert -Code 'guardian_latency_high' -Severity 'P2' -Routing 'N1,N2' -Description "avg_latency_ms=$avgLatency threshold_ms=$LatencyThresholdMs"
}

if ($paymentFailures -ge $PaymentFailureThreshold) {
  $alerts += New-Alert -Code 'guardian_payment_failure_indicator_high' -Severity 'P1' -Routing 'N1,N2' -Description "payment_failure_indicators=$paymentFailures threshold=$PaymentFailureThreshold"
}

if ($billingErrors -gt 0) {
  $alerts += New-Alert -Code 'guardian_billing_audit_errors' -Severity 'P1' -Routing 'N1,N2,N3' -Description "daily_billing_audit_errors=$billingErrors"
}

$status = 'PASS'
if ($alerts.Count -eq 0 -and $DryRun) {
  $status = 'FAIL'
}

$missingRouting = @($alerts | Where-Object { [string]::IsNullOrWhiteSpace($_.routing) })
if ($missingRouting.Count -gt 0) {
  $status = 'FAIL'
}

$startedAt = Get-Date
$outputDir = Split-Path -Path $OutputFile -Parent
if (-not (Test-Path $outputDir)) {
  New-Item -Path $outputDir -ItemType Directory -Force | Out-Null
}

$md = @()
$md += '# GDN-408 - Alert observability validation'
$md += ''
$md += "- RunId: $runId"
$md += "- DryRun: $(if ($DryRun) { 'true' } else { 'false' })"
$md += "- InputCsv: $(if ([string]::IsNullOrWhiteSpace($InputCsv)) { '(synthetic/default)' } else { $InputCsv })"
$md += "- PaymentFailureThreshold: $PaymentFailureThreshold"
$md += "- LatencyThresholdMs: $LatencyThresholdMs"
$md += "- Status: $status"
$md += "- GeneratedAt: $($startedAt.ToString('yyyy-MM-dd HH:mm:ss'))"
$md += ''
$md += '## Snapshot avaliado'
$md += ''
$md += "| cycle_result | app_health_status | guardian_avg_latency_ms | payment_failure_indicators | daily_billing_audit_errors | failed_requests |"
$md += "| --- | --- | ---: | ---: | ---: | ---: |"
$md += "| $cycleResult | $healthStatus | $avgLatency | $paymentFailures | $billingErrors | $failedRequests |"
$md += ''
$md += '## Alertas acionados'
$md += ''
$md += "- TotalAlertsTriggered: $($alerts.Count)"
$md += ''
$md += '| Code | Severity | Routing | Description |'
$md += '| --- | --- | --- | --- |'
foreach ($alert in $alerts) {
  $desc = ($alert.description -replace '\|', '/')
  $md += "| $($alert.code) | $($alert.severity) | $($alert.routing) | $desc |"
}

if ($alerts.Count -eq 0) {
  $md += '| (none) | - | - | Nenhum alerta acionado |'
}

Set-Content -Path $OutputFile -Value $md -Encoding UTF8
Write-Host "Relatorio salvo em: $OutputFile"

if ($status -ne 'PASS') {
  exit 1
}

exit 0
