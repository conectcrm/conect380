Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$runId = Get-Date -Format 'yyyyMMdd-HHmmss'
$reportPath = "docs/features/evidencias/GDN409_SUPPORT_RUNBOOK_EXECUTION_CHECK_$runId.md"

Write-Host '[GDN-409] Executando teste de execucao do runbook por suporte...' -ForegroundColor Cyan
powershell -ExecutionPolicy Bypass -File scripts/test-guardian-support-runbook-execution.ps1 -OutputFile $reportPath

if ($LASTEXITCODE -ne 0) {
  throw "Teste de execucao do runbook retornou codigo $LASTEXITCODE"
}

if (-not (Test-Path -Path $reportPath)) {
  throw "Relatorio nao encontrado: $reportPath"
}

$content = Get-Content -Path $reportPath -Raw
if ($content -notmatch [regex]::Escape('OverallStatus: PASS')) {
  throw "Relatorio sem status geral PASS: $reportPath"
}

Write-Host '[GDN-409] Execucao do runbook por suporte validada com sucesso.' -ForegroundColor Green
Write-Host " - Relatorio: $reportPath" -ForegroundColor Cyan
