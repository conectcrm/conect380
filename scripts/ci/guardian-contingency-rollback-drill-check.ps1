Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$runId = Get-Date -Format 'yyyyMMdd-HHmmss'
$reportPath = "docs/features/evidencias/GDN403_DRILL_DRYRUN_$runId.md"

Write-Host '[GDN-403] Executando contingency/rollback drill em dry-run...' -ForegroundColor Cyan
powershell -ExecutionPolicy Bypass -File scripts/test-guardian-contingency-rollback-drill.ps1 `
  -DryRun `
  -OutputFile $reportPath

if ($LASTEXITCODE -ne 0) {
  throw "Drill dry-run retornou codigo $LASTEXITCODE"
}

if (-not (Test-Path -Path $reportPath)) {
  throw "Relatorio do drill nao encontrado: $reportPath"
}

$content = Get-Content -Path $reportPath -Raw
if ($content -notmatch [regex]::Escape('Rollback completed: transicao para modo seguro validada.')) {
  throw "Relatorio do drill sem confirmacao de rollback completo: $reportPath"
}

Write-Host '[GDN-403] Drill contingency/rollback validado com sucesso.' -ForegroundColor Green
Write-Host " - Relatorio: $reportPath" -ForegroundColor Cyan
