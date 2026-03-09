Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$runId = Get-Date -Format 'yyyyMMdd-HHmmss'
$reportPath = "docs/features/evidencias/GDN514_E2E_CRITICAL_ACCEPTANCE_CHECK_$runId.md"

Write-Host '[GDN-514] Executando aceite final da suite critica de release...' -ForegroundColor Cyan
powershell -ExecutionPolicy Bypass -File scripts/test-guardian-final-acceptance-e2e-critical-suite.ps1 `
  -OutputFile $reportPath

if ($LASTEXITCODE -ne 0) {
  throw "Final acceptance e2e critical suite retornou codigo $LASTEXITCODE"
}

if (-not (Test-Path -Path $reportPath)) {
  throw "Relatorio da suite critica nao encontrado: $reportPath"
}

$content = Get-Content -Path $reportPath -Raw
if ($content -notmatch [regex]::Escape('- Status: PASS')) {
  throw "Relatorio sem status PASS: $reportPath"
}
if ($content -notmatch [regex]::Escape('critical_smoke_flow')) {
  throw "Relatorio sem evidencia da suite critica: $reportPath"
}

Write-Host '[GDN-514] Aceite final da suite critica validado com sucesso.' -ForegroundColor Green
Write-Host " - Relatorio: $reportPath" -ForegroundColor Cyan
