Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$runId = Get-Date -Format 'yyyyMMdd-HHmmss'
$reportPath = "docs/features/evidencias/GDN516_LEGACY_DECOMMISSION_ACCEPTANCE_CHECK_$runId.md"

Write-Host '[GDN-516] Executando aceite final de descomissionamento legado...' -ForegroundColor Cyan
powershell -ExecutionPolicy Bypass -File scripts/test-guardian-final-acceptance-legacy-decommission.ps1 `
  -OutputFile $reportPath

if ($LASTEXITCODE -ne 0) {
  throw "Final acceptance legacy decommission retornou codigo $LASTEXITCODE"
}

if (-not (Test-Path -Path $reportPath)) {
  throw "Relatorio de legacy decommission nao encontrado: $reportPath"
}

$content = Get-Content -Path $reportPath -Raw
if ($content -notmatch [regex]::Escape('- Status: PASS')) {
  throw "Relatorio sem status PASS: $reportPath"
}
if ($content -notmatch [regex]::Escape('guardian_surface_without_admin_routes')) {
  throw "Relatorio sem evidencia de ausencia de /admin no Guardian: $reportPath"
}

Write-Host '[GDN-516] Aceite final de descomissionamento legado validado com sucesso.' -ForegroundColor Green
Write-Host " - Relatorio: $reportPath" -ForegroundColor Cyan
