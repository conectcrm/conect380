param(
  [string]$OutputFile = ''
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$runId = Get-Date -Format 'yyyyMMdd-HHmmss'

if ([string]::IsNullOrWhiteSpace($OutputFile)) {
  $OutputFile = Join-Path $repoRoot "docs/features/evidencias/GDN514_E2E_CRITICAL_ACCEPTANCE_$runId.md"
} elseif (-not [System.IO.Path]::IsPathRooted($OutputFile)) {
  $OutputFile = Join-Path $repoRoot $OutputFile
}

function Invoke-Step {
  param(
    [string]$Name,
    [string]$ScriptPath
  )

  $args = @('-ExecutionPolicy', 'Bypass', '-File', $ScriptPath)
  $output = & powershell @args 2>&1
  $exitCode = $LASTEXITCODE
  return [PSCustomObject]@{
    Name = $Name
    Pass = ($exitCode -eq 0)
    ExitCode = $exitCode
    Output = ($output | Out-String).Trim()
  }
}

$startedAt = Get-Date
$steps = @()
$steps += Invoke-Step -Name 'critical_smoke_flow' -ScriptPath 'scripts/ci/guardian-daily-smoke-production-check.ps1'
$steps += Invoke-Step -Name 'critical_financial_consistency' -ScriptPath 'scripts/ci/guardian-daily-financial-consistency-check.ps1'
$steps += Invoke-Step -Name 'critical_audit_checks' -ScriptPath 'scripts/ci/guardian-critical-audit-daily-checks-check.ps1'
$steps += Invoke-Step -Name 'critical_rollback_simulation' -ScriptPath 'scripts/ci/guardian-production-rollback-simulation-check.ps1'
$steps += Invoke-Step -Name 'critical_legacy_decommission' -ScriptPath 'scripts/ci/guardian-legacy-decommission-phases-check.ps1'

$status = 'PASS'
foreach ($step in $steps) {
  if (-not $step.Pass) {
    $status = 'FAIL'
  }
}

$finishedAt = Get-Date
$durationSeconds = [Math]::Round(($finishedAt - $startedAt).TotalSeconds, 2)

$md = @()
$md += '# GDN-514 - Final acceptance e2e critical suite'
$md += ''
$md += "- RunId: $runId"
$md += "- Inicio: $($startedAt.ToString('yyyy-MM-dd HH:mm:ss'))"
$md += "- Fim: $($finishedAt.ToString('yyyy-MM-dd HH:mm:ss'))"
$md += "- DuracaoSegundos: $durationSeconds"
$md += "- Status: $status"
$md += ''
$md += '## Steps'
foreach ($step in $steps) {
  $md += "- [$(if ($step.Pass) { 'PASS' } else { 'FAIL' })] $($step.Name) :: exitCode=$($step.ExitCode)"
}
$md += ''

$md += '## Evidencias'
foreach ($step in $steps) {
  $md += ''
  $md += "### $($step.Name)"
  $md += '```text'
  $md += $step.Output
  $md += '```'
}
$md += ''

$md += '## Resultado'
if ($status -eq 'PASS') {
  $md += '- Suite critica de release pipeline validada com sucesso.'
} else {
  $md += '- Suite critica de release pipeline com falhas.'
}

$outDir = Split-Path -Path $OutputFile -Parent
if (-not (Test-Path -Path $outDir)) {
  New-Item -Path $outDir -ItemType Directory -Force | Out-Null
}

Set-Content -Path $OutputFile -Value $md -Encoding UTF8
Write-Host "Relatorio salvo em: $OutputFile"

if ($status -ne 'PASS') {
  exit 1
}

exit 0
