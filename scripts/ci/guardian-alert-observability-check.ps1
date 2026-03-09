Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$runId = Get-Date -Format 'yyyyMMdd-HHmmss'
$reportPath = "docs/features/evidencias/GDN408_ALERT_OBSERVABILITY_CHECK_$runId.md"

Write-Host '[GDN-408] Executando validacao de alert observability...' -ForegroundColor Cyan
powershell -ExecutionPolicy Bypass -File scripts/test-guardian-alert-observability.ps1 `
  -DryRun `
  -OutputFile $reportPath

if ($LASTEXITCODE -ne 0) {
  throw "Validacao de observabilidade retornou codigo $LASTEXITCODE"
}

if (-not (Test-Path -Path $reportPath)) {
  throw "Relatorio nao encontrado: $reportPath"
}

$content = Get-Content -Path $reportPath -Raw
if ($content -notmatch [regex]::Escape('- Status: PASS')) {
  throw "Relatorio sem status PASS: $reportPath"
}
if ($content -notmatch [regex]::Escape('TotalAlertsTriggered:')) {
  throw "Relatorio sem total de alertas acionados: $reportPath"
}

Write-Host '[GDN-408] Validacao de alert observability concluida com sucesso.' -ForegroundColor Green
Write-Host " - Relatorio: $reportPath" -ForegroundColor Cyan
