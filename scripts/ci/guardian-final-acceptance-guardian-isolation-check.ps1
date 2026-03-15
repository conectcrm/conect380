Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$runId = Get-Date -Format 'yyyyMMdd-HHmmss'
$reportPath = "docs/features/evidencias/GDN512_GUARDIAN_ISOLATION_ACCEPTANCE_CHECK_$runId.md"

Write-Host '[GDN-512] Executando aceite final de isolamento Guardian...' -ForegroundColor Cyan
powershell -ExecutionPolicy Bypass -File scripts/test-guardian-final-acceptance-guardian-isolation.ps1 `
  -OutputFile $reportPath

if ($LASTEXITCODE -ne 0) {
  throw "Final acceptance guardian isolation retornou codigo $LASTEXITCODE"
}

if (-not (Test-Path -Path $reportPath)) {
  throw "Relatorio de isolamento guardian nao encontrado: $reportPath"
}

$content = Get-Content -Path $reportPath -Raw
if ($content -notmatch [regex]::Escape('- Status: PASS')) {
  throw "Relatorio sem status PASS: $reportPath"
}
if ($content -notmatch [regex]::Escape('GuardianMfaGuard')) {
  throw "Relatorio sem evidencia de MFA guard: $reportPath"
}

Write-Host '[GDN-512] Aceite final de isolamento Guardian validado com sucesso.' -ForegroundColor Green
Write-Host " - Relatorio: $reportPath" -ForegroundColor Cyan
