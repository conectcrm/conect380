param(
  [int]$Days = 7,
  [string]$BaseUrl = 'http://localhost:3001',
  [string]$Token = '',
  [switch]$DryRun = $false,
  [string]$OutputFile = ''
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

if ($Days -lt 1 -or $Days -gt 30) {
  throw 'Parametro Days invalido. Use entre 1 e 30.'
}

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$runId = Get-Date -Format 'yyyyMMdd-HHmmss'

if ([string]::IsNullOrWhiteSpace($OutputFile)) {
  $OutputFile = Join-Path $repoRoot "docs/features/evidencias/GDN502_HYPERCARE_7D_$runId.md"
} elseif (-not [System.IO.Path]::IsPathRooted($OutputFile)) {
  $OutputFile = Join-Path $repoRoot $OutputFile
}

$monitorScript = Join-Path $repoRoot 'scripts/monitor-guardian-billing-platform.ps1'
$alertScript = Join-Path $repoRoot 'scripts/test-guardian-alert-observability.ps1'

$startedAt = Get-Date
$results = @()

for ($day = 1; $day -le $Days; $day++) {
  Write-Host "[GDN-502] Dia $day/$Days - executando monitor de hypercare..." -ForegroundColor Cyan

  $monitorCsv = "docs/features/evidencias/GDN502_DAY${day}_MONITOR_$runId.csv"
  $monitorMd = "docs/features/evidencias/GDN502_DAY${day}_MONITOR_$runId.md"
  $alertMd = "docs/features/evidencias/GDN502_DAY${day}_ALERTS_$runId.md"

  $monitorArgs = @(
    '-ExecutionPolicy', 'Bypass',
    '-File', $monitorScript,
    '-BaseUrl', $BaseUrl,
    '-MaxCycles', '1',
    '-IntervalSeconds', '1',
    '-OutputCsv', $monitorCsv,
    '-OutputSummary', $monitorMd
  )

  if ($DryRun) {
    $monitorArgs += '-DryRun'
  } elseif (-not [string]::IsNullOrWhiteSpace($Token)) {
    $monitorArgs += @('-Token', $Token)
  }

  $monitorOutput = & powershell @monitorArgs 2>&1
  $monitorExit = $LASTEXITCODE

  $alertArgs = @(
    '-ExecutionPolicy', 'Bypass',
    '-File', $alertScript,
    '-InputCsv', $monitorCsv,
    '-OutputFile', $alertMd
  )
  if ($DryRun) {
    $alertArgs += '-DryRun'
  }

  $alertOutput = & powershell @alertArgs 2>&1
  $alertExit = $LASTEXITCODE

  $dayStatus = if ($monitorExit -eq 0 -and $alertExit -eq 0) { 'PASS' } else { 'FAIL' }

  $results += [PSCustomObject]@{
    day = $day
    status = $dayStatus
    monitor_report = $monitorMd
    alert_report = $alertMd
    monitor_exit = $monitorExit
    alert_exit = $alertExit
    monitor_output = (($monitorOutput | Out-String).Trim())
    alert_output = (($alertOutput | Out-String).Trim())
  }
}

$finishedAt = Get-Date
$passCount = @($results | Where-Object { $_.status -eq 'PASS' }).Count
$failCount = @($results | Where-Object { $_.status -eq 'FAIL' }).Count
$overallStatus = if ($failCount -eq 0) { 'PASS' } else { 'FAIL' }

$outputDir = Split-Path -Path $OutputFile -Parent
if (-not (Test-Path $outputDir)) {
  New-Item -Path $outputDir -ItemType Directory -Force | Out-Null
}

$md = @()
$md += '# GDN-502 - Hypercare 7 days'
$md += ''
$md += "- RunId: $runId"
$md += "- Inicio: $($startedAt.ToString('yyyy-MM-dd HH:mm:ss'))"
$md += "- Fim: $($finishedAt.ToString('yyyy-MM-dd HH:mm:ss'))"
$md += "- DryRun: $(if ($DryRun) { 'true' } else { 'false' })"
$md += "- Days: $Days"
$md += "- PASS: $passCount"
$md += "- FAIL: $failCount"
$md += "- OverallStatus: $overallStatus"
$md += ''
$md += '| Day | Status | MonitorReport | AlertReport |'
$md += '| ---: | --- | --- | --- |'
foreach ($row in $results) {
  $md += "| $($row.day) | $($row.status) | $($row.monitor_report) | $($row.alert_report) |"
}

$md += ''
$md += '## Detalhes por dia'
$md += ''
foreach ($row in $results) {
  $md += "### Day $($row.day)"
  $md += "- Status: $($row.status)"
  $md += "- MonitorExit: $($row.monitor_exit)"
  $md += "- AlertExit: $($row.alert_exit)"
  $md += ''
}

Set-Content -Path $OutputFile -Value $md -Encoding UTF8
Write-Host "Relatorio salvo em: $OutputFile"

if ($overallStatus -ne 'PASS') {
  exit 1
}

exit 0
