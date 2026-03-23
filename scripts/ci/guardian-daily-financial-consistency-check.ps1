Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$runId = Get-Date -Format 'yyyyMMdd-HHmmss'
$reportPath = "docs/features/evidencias/GDN507_FINANCIAL_CONSISTENCY_CHECK_$runId.md"

Write-Host '[GDN-507] Executando validacao de consistencia financeira diaria...' -ForegroundColor Cyan
powershell -ExecutionPolicy Bypass -File scripts/test-guardian-daily-financial-consistency.ps1 `
  -DryRun `
  -OutputFile $reportPath

if ($LASTEXITCODE -ne 0) {
  throw "Daily financial consistency check retornou codigo $LASTEXITCODE"
}

if (-not (Test-Path -Path $reportPath)) {
  throw "Relatorio de consistencia financeira nao encontrado: $reportPath"
}

$content = Get-Content -Path $reportPath -Raw
if ($content -notmatch [regex]::Escape('- Status: PASS')) {
  throw "Relatorio sem status PASS: $reportPath"
}
if ($content -notmatch [regex]::Escape('subscriptions_total igual a soma dos status')) {
  throw "Relatorio sem check de reconciliacao de assinaturas: $reportPath"
}

Write-Host '[GDN-507] Consistencia financeira diaria validada com sucesso.' -ForegroundColor Green
Write-Host " - Relatorio: $reportPath" -ForegroundColor Cyan
