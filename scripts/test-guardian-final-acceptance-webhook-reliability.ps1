param(
  [switch]$DryRun = $false,
  [string]$OutputFile = ''
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$runId = Get-Date -Format 'yyyyMMdd-HHmmss'

if ([string]::IsNullOrWhiteSpace($OutputFile)) {
  $OutputFile = Join-Path $repoRoot "docs/features/evidencias/GDN513_WEBHOOK_RELIABILITY_ACCEPTANCE_$runId.md"
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
$status = 'PASS'
$steps = @()

$steps += Invoke-Step -Name 'webhook_replay_recovery_check' -ScriptPath 'scripts/ci/guardian-webhook-replay-recovery-check.ps1'
$steps += Invoke-Step -Name 'daily_financial_consistency_check' -ScriptPath 'scripts/ci/guardian-daily-financial-consistency-check.ps1'

foreach ($step in $steps) {
  if (-not $step.Pass) {
    $status = 'FAIL'
  }
}

$finishedAt = Get-Date
$durationSeconds = [Math]::Round(($finishedAt - $startedAt).TotalSeconds, 2)

$md = @()
$md += '# GDN-513 - Final acceptance webhook reliability'
$md += ''
$md += "- RunId: $runId"
$md += "- Inicio: $($startedAt.ToString('yyyy-MM-dd HH:mm:ss'))"
$md += "- Fim: $($finishedAt.ToString('yyyy-MM-dd HH:mm:ss'))"
$md += "- DuracaoSegundos: $durationSeconds"
$md += "- DryRun: $(if ($DryRun) { 'true' } else { 'false' })"
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
  $md += '- Aceite final de confiabilidade de webhook e reconciliacao validado com sucesso.'
} else {
  $md += '- Aceite final de webhook com falhas. Revisar steps.'
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
