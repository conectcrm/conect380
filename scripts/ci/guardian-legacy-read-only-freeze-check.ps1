Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$runId = Get-Date -Format 'yyyyMMdd-HHmmss'
$reportPath = "docs/features/evidencias/GDN503_LEGACY_READ_ONLY_CHECK_$runId.md"

Write-Host '[GDN-503] Executando freeze read-only do backoffice legado...' -ForegroundColor Cyan
powershell -ExecutionPolicy Bypass -File scripts/test-guardian-legacy-read-only-freeze.ps1 -OutputFile $reportPath

if ($LASTEXITCODE -ne 0) {
  throw "Freeze read-only check retornou codigo $LASTEXITCODE"
}

if (-not (Test-Path -Path $reportPath)) {
  throw "Relatorio da validacao nao encontrado: $reportPath"
}

$content = Get-Content -Path $reportPath -Raw
if ($content -notmatch [regex]::Escape('- Status: PASS')) {
  throw "Relatorio sem status PASS: $reportPath"
}

Write-Host '[GDN-503] Freeze read-only validado com sucesso.' -ForegroundColor Green
Write-Host " - Relatorio: $reportPath" -ForegroundColor Cyan
