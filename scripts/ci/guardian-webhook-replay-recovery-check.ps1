Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$runId = Get-Date -Format 'yyyyMMdd-HHmmss'
$reportPath = "docs/features/evidencias/GDN407_WEBHOOK_REPLAY_RECOVERY_CHECK_$runId.md"

Write-Host '[GDN-407] Executando validacao de webhook replay/recovery...' -ForegroundColor Cyan
powershell -ExecutionPolicy Bypass -File scripts/test-guardian-webhook-replay-recovery.ps1 -OutputFile $reportPath

if ($LASTEXITCODE -ne 0) {
  throw "Validacao de webhook replay/recovery retornou codigo $LASTEXITCODE"
}

if (-not (Test-Path -Path $reportPath)) {
  throw "Relatorio da validacao nao encontrado: $reportPath"
}

$content = Get-Content -Path $reportPath -Raw
if ($content -notmatch [regex]::Escape('- Status: PASS')) {
  throw "Relatorio sem status PASS: $reportPath"
}

Write-Host '[GDN-407] Validacao de webhook replay/recovery concluida com sucesso.' -ForegroundColor Green
Write-Host " - Relatorio: $reportPath" -ForegroundColor Cyan
