Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$runId = Get-Date -Format 'yyyyMMdd-HHmmss'
$csvPath = "docs/features/evidencias/GDN406_LIGHT_LOAD_DRYRUN_$runId.csv"
$summaryPath = "docs/features/evidencias/GDN406_LIGHT_LOAD_DRYRUN_$runId.md"

Write-Host '[GDN-406] Executando light peak load em dry-run...' -ForegroundColor Cyan
powershell -ExecutionPolicy Bypass -File scripts/test-guardian-light-peak-load.ps1 `
  -DryRun `
  -Iterations 3 `
  -IntervalMs 1 `
  -OutputCsv $csvPath `
  -OutputSummary $summaryPath

if ($LASTEXITCODE -ne 0) {
  throw "Light load dry-run retornou codigo $LASTEXITCODE"
}

if (-not (Test-Path -Path $csvPath)) {
  throw "CSV nao encontrado: $csvPath"
}

if (-not (Test-Path -Path $summaryPath)) {
  throw "Resumo nao encontrado: $summaryPath"
}

$rows = @((Import-Csv -Path $csvPath))
if ($rows.Count -lt 4) {
  throw "CSV de carga leve sem volume minimo de requests: $csvPath"
}

$summaryContent = Get-Content -Path $summaryPath -Raw
if ($summaryContent -notmatch [regex]::Escape('## Resultado por endpoint')) {
  throw "Resumo sem secao obrigatoria: $summaryPath"
}

Write-Host '[GDN-406] Validacao de carga leve concluida com sucesso.' -ForegroundColor Green
Write-Host " - CSV: $csvPath" -ForegroundColor Cyan
Write-Host " - Resumo: $summaryPath" -ForegroundColor Cyan
