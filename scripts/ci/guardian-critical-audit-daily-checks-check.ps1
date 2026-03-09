Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$runId = Get-Date -Format 'yyyyMMdd-HHmmss'
$reportPath = "docs/features/evidencias/GDN508_CRITICAL_AUDIT_CHECKS_CHECK_$runId.md"

Write-Host '[GDN-508] Executando validacao de checks diarios de auditoria critica...' -ForegroundColor Cyan
powershell -ExecutionPolicy Bypass -File scripts/test-guardian-critical-audit-daily-checks.ps1 `
  -DryRun `
  -OutputFile $reportPath

if ($LASTEXITCODE -ne 0) {
  throw "Critical audit daily checks retornou codigo $LASTEXITCODE"
}

if (-not (Test-Path -Path $reportPath)) {
  throw "Relatorio de audit checks nao encontrado: $reportPath"
}

$content = Get-Content -Path $reportPath -Raw
if ($content -notmatch [regex]::Escape('- Status: PASS')) {
  throw "Relatorio sem status PASS: $reportPath"
}
if ($content -notmatch [regex]::Escape('guardian_billing_audit_errors')) {
  throw "Relatorio sem evidencia de alerta de auditoria critica: $reportPath"
}

Write-Host '[GDN-508] Checks diarios de auditoria critica validados com sucesso.' -ForegroundColor Green
Write-Host " - Relatorio: $reportPath" -ForegroundColor Cyan
