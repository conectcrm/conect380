param(
  [switch]$DryRun = $false,
  [string]$OutputFile = ''
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$runId = Get-Date -Format 'yyyyMMdd-HHmmss'

if ([string]::IsNullOrWhiteSpace($OutputFile)) {
  $OutputFile = Join-Path $repoRoot "docs/features/evidencias/GDN509_ROLLBACK_SIMULATION_$runId.md"
} elseif (-not [System.IO.Path]::IsPathRooted($OutputFile)) {
  $OutputFile = Join-Path $repoRoot $OutputFile
}

$startedAt = Get-Date
$status = 'PASS'
$notes = @()

$drillReport = "docs/features/evidencias/GDN509_ROLLBACK_DRILL_$runId.md"
$drillArgs = @(
  '-ExecutionPolicy', 'Bypass',
  '-File', 'scripts/test-guardian-contingency-rollback-drill.ps1',
  '-BaselineMode', 'canary',
  '-BaselineCanaryPercent', '100',
  '-RollbackMode', 'dual',
  '-RollbackCanaryPercent', '0',
  '-FinalFallbackMode', 'legacy',
  '-FinalFallbackCanaryPercent', '0',
  '-SimulatedIncident', 'production_window_documented_rollback',
  '-OutputFile', $drillReport
)

if ($DryRun) {
  $drillArgs += '-DryRun'
}

Write-Host '[GDN-509] Executando simulacao documentada de rollback...' -ForegroundColor Cyan
$drillOutput = & powershell @drillArgs 2>&1
$drillExitCode = $LASTEXITCODE

if ($drillExitCode -ne 0) {
  $status = 'FAIL'
  $notes += "Rollback drill retornou exitCode=$drillExitCode"
}

if (-not (Test-Path -Path $drillReport)) {
  $status = 'FAIL'
  $notes += "Relatorio do drill nao encontrado: $drillReport"
}

if ($status -eq 'PASS') {
  $drillContent = Get-Content -Path $drillReport -Raw
  if ($drillContent -notmatch [regex]::Escape('Rollback completed: transicao para modo seguro validada.')) {
    $status = 'FAIL'
    $notes += 'Relatorio do drill sem confirmacao de rollback completed.'
  }
  if ($drillContent -notmatch [regex]::Escape('| DRILL-005 |')) {
    $status = 'FAIL'
    $notes += 'Relatorio do drill sem etapa DRILL-005 (fallback final).'
  }
}

$finishedAt = Get-Date
$durationSeconds = [Math]::Round(($finishedAt - $startedAt).TotalSeconds, 2)

$md = @()
$md += '# GDN-509 - Documented rollback simulation validation'
$md += ''
$md += "- RunId: $runId"
$md += "- Inicio: $($startedAt.ToString('yyyy-MM-dd HH:mm:ss'))"
$md += "- Fim: $($finishedAt.ToString('yyyy-MM-dd HH:mm:ss'))"
$md += "- DuracaoSegundos: $durationSeconds"
$md += "- DryRun: $(if ($DryRun) { 'true' } else { 'false' })"
$md += "- Status: $status"
$md += "- DrillReport: $drillReport"
$md += ''

if ($notes.Count -gt 0) {
  $md += '## Observacoes'
  foreach ($note in $notes) {
    $md += "- $note"
  }
  $md += ''
}

if ($drillOutput) {
  $md += '## Evidencia da execucao'
  $md += ''
  $md += '```text'
  $md += ($drillOutput | Out-String).Trim()
  $md += '```'
  $md += ''
}

$md += '## Resultado'
if ($status -eq 'PASS') {
  $md += '- Simulacao documentada de rollback validada com sucesso.'
} else {
  $md += '- Simulacao documentada de rollback com falhas. Revisar observacoes.'
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
