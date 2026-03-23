Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$runId = Get-Date -Format 'yyyyMMdd-HHmmss'
$reportPath = "docs/features/evidencias/GDN506_DAILY_SMOKE_CHECK_$runId.md"

Write-Host '[GDN-506] Executando validacao da suite diaria de smoke...' -ForegroundColor Cyan
powershell -ExecutionPolicy Bypass -File scripts/test-guardian-daily-smoke-production.ps1 `
  -DryRun `
  -OutputFile $reportPath

if ($LASTEXITCODE -ne 0) {
  throw "Daily smoke check retornou codigo $LASTEXITCODE"
}

if (-not (Test-Path -Path $reportPath)) {
  throw "Relatorio de smoke nao encontrado: $reportPath"
}

$content = Get-Content -Path $reportPath -Raw
if ($content -notmatch [regex]::Escape('- Status: PASS')) {
  throw "Relatorio sem status PASS: $reportPath"
}
if ($content -notmatch [regex]::Escape('billing_suspend_reactivate_flow')) {
  throw "Relatorio sem evidencia de billing suspend/reactivate: $reportPath"
}

Write-Host '[GDN-506] Validacao da suite diaria de smoke concluida com sucesso.' -ForegroundColor Green
Write-Host " - Relatorio: $reportPath" -ForegroundColor Cyan
