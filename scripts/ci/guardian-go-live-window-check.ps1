Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$runId = Get-Date -Format 'yyyyMMdd-HHmmss'
$reportPath = "docs/features/evidencias/GDN501_GO_LIVE_WINDOW_CHECK_$runId.md"

Write-Host '[GDN-501] Executando janela de go-live (check)...' -ForegroundColor Cyan
powershell -ExecutionPolicy Bypass -File scripts/test-guardian-go-live-window.ps1 -OutputFile $reportPath

if ($LASTEXITCODE -ne 0) {
  throw "Go-live window check retornou codigo $LASTEXITCODE"
}

if (-not (Test-Path -Path $reportPath)) {
  throw "Relatorio de decisao nao encontrado: $reportPath"
}

$content = Get-Content -Path $reportPath -Raw
if ($content -notmatch [regex]::Escape('- ReleaseDecision: GO')) {
  throw "Relatorio sem decisao GO: $reportPath"
}

Write-Host '[GDN-501] Go-live window validado com sucesso.' -ForegroundColor Green
Write-Host " - Relatorio: $reportPath" -ForegroundColor Cyan
