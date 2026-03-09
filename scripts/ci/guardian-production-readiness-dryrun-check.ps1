Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$runId = Get-Date -Format 'yyyyMMdd-HHmmss'
$reportPath = "docs/features/evidencias/GUARDIAN_PRODUCTION_READINESS_CHECK_$runId.md"

Write-Host '[Guardian Readiness] Executando orchestrator consolidado em dry-run...' -ForegroundColor Cyan
powershell -ExecutionPolicy Bypass -File scripts/release/guardian-production-readiness.ps1 `
  -Mode dry-run `
  -OutputFile $reportPath

if ($LASTEXITCODE -ne 0) {
  throw "Guardian production readiness dry-run retornou codigo $LASTEXITCODE"
}

if (-not (Test-Path -Path $reportPath)) {
  throw "Relatorio consolidado nao encontrado: $reportPath"
}

$content = Get-Content -Path $reportPath -Raw
if ($content -notmatch [regex]::Escape('- Status: PASS')) {
  throw "Relatorio consolidado sem status PASS: $reportPath"
}
if ($content -notmatch [regex]::Escape('GDN516_final_acceptance_legacy_decommission')) {
  throw "Relatorio consolidado sem step final GDN516: $reportPath"
}

Write-Host '[Guardian Readiness] Dry-run consolidado validado com sucesso.' -ForegroundColor Green
Write-Host " - Relatorio: $reportPath" -ForegroundColor Cyan
