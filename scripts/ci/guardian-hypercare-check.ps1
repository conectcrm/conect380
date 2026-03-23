Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$runId = Get-Date -Format 'yyyyMMdd-HHmmss'
$reportPath = "docs/features/evidencias/GDN502_HYPERCARE_CHECK_$runId.md"

Write-Host '[GDN-502] Executando hypercare check (dry-run)...' -ForegroundColor Cyan
powershell -ExecutionPolicy Bypass -File scripts/monitor-guardian-hypercare-7d.ps1 `
  -Days 2 `
  -DryRun `
  -OutputFile $reportPath

if ($LASTEXITCODE -ne 0) {
  throw "Hypercare check retornou codigo $LASTEXITCODE"
}

if (-not (Test-Path -Path $reportPath)) {
  throw "Relatorio de hypercare nao encontrado: $reportPath"
}

$content = Get-Content -Path $reportPath -Raw
if ($content -notmatch [regex]::Escape('- OverallStatus: PASS')) {
  throw "Relatorio sem status geral PASS: $reportPath"
}

Write-Host '[GDN-502] Hypercare check validado com sucesso.' -ForegroundColor Green
Write-Host " - Relatorio: $reportPath" -ForegroundColor Cyan
