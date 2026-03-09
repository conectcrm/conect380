Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$runId = Get-Date -Format 'yyyyMMdd-HHmmss'
$reportPath = "docs/features/evidencias/GDN509_ROLLBACK_SIMULATION_CHECK_$runId.md"

Write-Host '[GDN-509] Executando validacao de simulacao documentada de rollback...' -ForegroundColor Cyan
powershell -ExecutionPolicy Bypass -File scripts/test-guardian-production-rollback-simulation.ps1 `
  -DryRun `
  -OutputFile $reportPath

if ($LASTEXITCODE -ne 0) {
  throw "Rollback simulation check retornou codigo $LASTEXITCODE"
}

if (-not (Test-Path -Path $reportPath)) {
  throw "Relatorio de rollback simulation nao encontrado: $reportPath"
}

$content = Get-Content -Path $reportPath -Raw
if ($content -notmatch [regex]::Escape('- Status: PASS')) {
  throw "Relatorio sem status PASS: $reportPath"
}

$drillReportPath = ''
if ($content -match '(?m)^- DrillReport: (.+)$') {
  $drillReportPath = $Matches[1].Trim()
}

if ([string]::IsNullOrWhiteSpace($drillReportPath)) {
  throw "Relatorio sem referencia para DrillReport: $reportPath"
}

if (-not [System.IO.Path]::IsPathRooted($drillReportPath)) {
  $drillReportPath = Join-Path (Get-Location) $drillReportPath
}

if (-not (Test-Path -Path $drillReportPath)) {
  throw "DrillReport nao encontrado: $drillReportPath"
}

$drillContent = Get-Content -Path $drillReportPath -Raw
if ($drillContent -notmatch [regex]::Escape('| DRILL-005 |')) {
  throw "DrillReport sem evidencia da etapa DRILL-005: $drillReportPath"
}

Write-Host '[GDN-509] Simulacao documentada de rollback validada com sucesso.' -ForegroundColor Green
Write-Host " - Relatorio: $reportPath" -ForegroundColor Cyan
