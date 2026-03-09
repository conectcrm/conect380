param(
  [string]$OutputFile = ''
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
$runId = Get-Date -Format 'yyyyMMdd-HHmmss'

if ([string]::IsNullOrWhiteSpace($OutputFile)) {
  $OutputFile = Join-Path $repoRoot "docs/features/evidencias/GDN501_GO_LIVE_PREFLIGHT_$runId.md"
} elseif (-not [System.IO.Path]::IsPathRooted($OutputFile)) {
  $OutputFile = Join-Path $repoRoot $OutputFile
}

$checks = @(
  @{ id = 'PREFLIGHT-001'; name = 'Legacy transition flags'; script = 'scripts/ci/guardian-transition-flags-check.ps1' },
  @{ id = 'PREFLIGHT-002'; name = 'Incident runbook integrity'; script = 'scripts/ci/guardian-incident-runbook-check.ps1' },
  @{ id = 'PREFLIGHT-003'; name = 'Billing/platform monitor'; script = 'scripts/ci/guardian-billing-platform-monitor-check.ps1' },
  @{ id = 'PREFLIGHT-004'; name = 'Light peak load'; script = 'scripts/ci/guardian-light-peak-load-check.ps1' },
  @{ id = 'PREFLIGHT-005'; name = 'Webhook replay recovery'; script = 'scripts/ci/guardian-webhook-replay-recovery-check.ps1' },
  @{ id = 'PREFLIGHT-006'; name = 'Alert observability'; script = 'scripts/ci/guardian-alert-observability-check.ps1' },
  @{ id = 'PREFLIGHT-007'; name = 'Support runbook execution'; script = 'scripts/ci/guardian-support-runbook-execution-check.ps1' }
)

$startedAt = Get-Date
$results = @()

foreach ($check in $checks) {
  $scriptPath = Join-Path $repoRoot $check.script
  Write-Host "[GDN-501] Executando $($check.id): $($check.name)" -ForegroundColor Cyan

  if (-not (Test-Path -Path $scriptPath)) {
    $results += [PSCustomObject]@{
      id = $check.id
      name = $check.name
      status = 'FAIL'
      detail = "Script nao encontrado: $scriptPath"
    }
    continue
  }

  $output = & powershell -ExecutionPolicy Bypass -File $scriptPath 2>&1
  $exitCode = $LASTEXITCODE
  $detail = (($output | Out-String).Trim())

  $results += [PSCustomObject]@{
    id = $check.id
    name = $check.name
    status = if ($exitCode -eq 0) { 'PASS' } else { 'FAIL' }
    detail = $detail
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
$md += '# GDN-501 - Go live preflight check'
$md += ''
$md += "- RunId: $runId"
$md += "- Inicio: $($startedAt.ToString('yyyy-MM-dd HH:mm:ss'))"
$md += "- Fim: $($finishedAt.ToString('yyyy-MM-dd HH:mm:ss'))"
$md += "- PASS: $passCount"
$md += "- FAIL: $failCount"
$md += "- OverallStatus: $overallStatus"
$md += ''
$md += '| ID | Check | Status |'
$md += '| --- | --- | --- |'
foreach ($row in $results) {
  $md += "| $($row.id) | $($row.name) | $($row.status) |"
}
$md += ''
$md += '## Detalhes'
$md += ''
foreach ($row in $results) {
  $md += "### $($row.id) - $($row.name)"
  $md += ''
  $detail = if ([string]::IsNullOrWhiteSpace($row.detail)) { '(sem detalhe)' } else { $row.detail }
  $md += $detail
  $md += ''
}

Set-Content -Path $OutputFile -Value $md -Encoding UTF8
Write-Host "Relatorio salvo em: $OutputFile"

if ($overallStatus -ne 'PASS') {
  exit 1
}

exit 0
