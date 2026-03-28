Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$runId = Get-Date -Format 'yyyyMMdd-HHmmss'
$reportPath = "docs/features/evidencias/GDN504_LEGACY_DECOMMISSION_CHECK_$runId.md"

Write-Host '[GDN-504] Executando decommission legado em fases controladas...' -ForegroundColor Cyan
powershell -ExecutionPolicy Bypass -File scripts/test-guardian-legacy-decommission-phases.ps1 `
  -DryRun `
  -OutputFile $reportPath

if ($LASTEXITCODE -ne 0) {
  throw "Legacy decommission phases check retornou codigo $LASTEXITCODE"
}

if (-not (Test-Path -Path $reportPath)) {
  throw "Relatorio de decommission nao encontrado: $reportPath"
}

$content = Get-Content -Path $reportPath -Raw
if ($content -notmatch [regex]::Escape('- Status: PASS')) {
  throw "Relatorio sem status PASS: $reportPath"
}
if ($content -notmatch [regex]::Escape('phase3_core_admin_only')) {
  throw "Relatorio sem evidencia da fase core_admin_only: $reportPath"
}

Write-Host '[GDN-504] Decommission legado validado com sucesso.' -ForegroundColor Green
Write-Host " - Relatorio: $reportPath" -ForegroundColor Cyan
