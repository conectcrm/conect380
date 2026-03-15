Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$runId = Get-Date -Format 'yyyyMMdd-HHmmss'
$reportPath = "docs/features/evidencias/GDN511_ENTITLEMENT_ACCEPTANCE_CHECK_$runId.md"

Write-Host '[GDN-511] Executando aceite final de entitlement backend...' -ForegroundColor Cyan
powershell -ExecutionPolicy Bypass -File scripts/test-guardian-final-acceptance-entitlement-backend.ps1 `
  -OutputFile $reportPath

if ($LASTEXITCODE -ne 0) {
  throw "Final acceptance entitlement backend retornou codigo $LASTEXITCODE"
}

if (-not (Test-Path -Path $reportPath)) {
  throw "Relatorio de entitlement nao encontrado: $reportPath"
}

$content = Get-Content -Path $reportPath -Raw
if ($content -notmatch [regex]::Escape('- Status: PASS')) {
  throw "Relatorio sem status PASS: $reportPath"
}
if ($content -notmatch [regex]::Escape('SUBSCRIPTION_INACTIVE')) {
  throw "Relatorio sem evidencia das regras de entitlement: $reportPath"
}

Write-Host '[GDN-511] Aceite final de entitlement backend validado com sucesso.' -ForegroundColor Green
Write-Host " - Relatorio: $reportPath" -ForegroundColor Cyan
