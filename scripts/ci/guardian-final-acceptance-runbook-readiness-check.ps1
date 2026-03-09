Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$runId = Get-Date -Format 'yyyyMMdd-HHmmss'
$reportPath = "docs/features/evidencias/GDN515_RUNBOOK_READINESS_ACCEPTANCE_CHECK_$runId.md"

Write-Host '[GDN-515] Executando aceite final de prontidao de runbook...' -ForegroundColor Cyan
powershell -ExecutionPolicy Bypass -File scripts/test-guardian-final-acceptance-runbook-readiness.ps1 `
  -OutputFile $reportPath

if ($LASTEXITCODE -ne 0) {
  throw "Final acceptance runbook readiness retornou codigo $LASTEXITCODE"
}

if (-not (Test-Path -Path $reportPath)) {
  throw "Relatorio de runbook readiness nao encontrado: $reportPath"
}

$content = Get-Content -Path $reportPath -Raw
if ($content -notmatch [regex]::Escape('- Status: PASS')) {
  throw "Relatorio sem status PASS: $reportPath"
}
if ($content -notmatch [regex]::Escape('support_training_pack_integrity')) {
  throw "Relatorio sem evidencia de treinamento/runbook: $reportPath"
}

Write-Host '[GDN-515] Aceite final de prontidao de runbook validado com sucesso.' -ForegroundColor Green
Write-Host " - Relatorio: $reportPath" -ForegroundColor Cyan
