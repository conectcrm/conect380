param(
  [string]$RunbookPath = 'docs/runbooks/PLANO_GUARDIAN_INCIDENT_RESPONSE_PILOTO.md'
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

if (-not (Test-Path -Path $RunbookPath)) {
  Write-Error "Runbook Guardian nao encontrado: $RunbookPath"
  exit 1
}

$content = Get-Content -Path $RunbookPath -Raw
if ([string]::IsNullOrWhiteSpace($content)) {
  Write-Error "Runbook Guardian vazio: $RunbookPath"
  exit 1
}

$requiredPatterns = @(
  '## 3. Severidade e SLA operacional',
  '## 4. Matriz de escalonamento N1/N2/N3',
  '## 5. Playbooks por tipo de incidente',
  '## 6. Procedimento de mitigacao e rollback',
  '## 7. Comunicacao de incidente',
  '## 8. Checklist de encerramento'
)

$missing = @()
foreach ($pattern in $requiredPatterns) {
  if ($content -notmatch [regex]::Escape($pattern)) {
    $missing += $pattern
  }
}

if ($missing.Count -gt 0) {
  Write-Error "Runbook Guardian incompleto. Secoes ausentes: $($missing -join '; ')"
  exit 1
}

Write-Host '[GDN-404] Runbook Guardian validado com sucesso.' -ForegroundColor Green
Write-Host " - Arquivo: $RunbookPath" -ForegroundColor Cyan
