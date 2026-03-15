Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$runId = Get-Date -Format 'yyyyMMdd-HHmmss'
$csvPath = "docs/features/evidencias/GDN402_MONITOR_DRYRUN_$runId.csv"
$summaryPath = "docs/features/evidencias/GDN402_MONITOR_DRYRUN_$runId.md"

Write-Host '[GDN-402] Executando monitor billing/platform em dry-run...' -ForegroundColor Cyan
powershell -ExecutionPolicy Bypass -File scripts/monitor-guardian-billing-platform.ps1 `
  -DryRun `
  -MaxCycles 1 `
  -IntervalSeconds 1 `
  -OutputCsv $csvPath `
  -OutputSummary $summaryPath

if ($LASTEXITCODE -ne 0) {
  throw "Monitor dry-run retornou codigo $LASTEXITCODE"
}

if (-not (Test-Path -Path $csvPath)) {
  throw "CSV de saida nao encontrado: $csvPath"
}

if (-not (Test-Path -Path $summaryPath)) {
  throw "Resumo de saida nao encontrado: $summaryPath"
}

$rows = @((Import-Csv -Path $csvPath))
if ($rows.Count -lt 1) {
  throw "CSV de monitoramento sem linhas de ciclo: $csvPath"
}

$summaryContent = Get-Content -Path $summaryPath -Raw
if ($summaryContent -notmatch [regex]::Escape('## Indicadores principais')) {
  throw "Resumo sem secao obrigatoria de indicadores: $summaryPath"
}

Write-Host '[GDN-402] Validacao de monitor billing/platform concluida com sucesso.' -ForegroundColor Green
Write-Host " - CSV: $csvPath" -ForegroundColor Cyan
Write-Host " - Resumo: $summaryPath" -ForegroundColor Cyan
