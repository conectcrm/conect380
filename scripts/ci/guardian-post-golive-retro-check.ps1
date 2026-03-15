Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$retroPath = 'docs/features/GDN-505_POST_GO_LIVE_RETROSPECTIVE_2026-03-07.md'
$backlogPath = 'docs/features/GDN-505_POST_GO_LIVE_FOLLOWUP_BACKLOG_2026-03-07.csv'

if (-not (Test-Path -Path $retroPath)) {
  throw "Retrospectiva nao encontrada: $retroPath"
}
if (-not (Test-Path -Path $backlogPath)) {
  throw "Backlog de follow-up nao encontrado: $backlogPath"
}

$retroContent = Get-Content -Path $retroPath -Raw
$requiredSections = @(
  '## O que funcionou bem',
  '## Pontos de atencao',
  '## Acoes de melhoria aprovadas',
  '## Riscos residuais',
  '## Decisoes'
)

foreach ($section in $requiredSections) {
  if ($retroContent -notmatch [regex]::Escape($section)) {
    throw "Retrospectiva sem secao obrigatoria: $section"
  }
}

$rows = @(Import-Csv -Path $backlogPath)
if ($rows.Count -lt 5) {
  throw "Backlog de follow-up com itens insuficientes: $($rows.Count)"
}

$highPriority = @($rows | Where-Object { $_.Priority -eq 'High' }).Count
if ($highPriority -lt 3) {
  throw "Backlog de follow-up sem massa critica de prioridades High (atual=$highPriority)."
}

Write-Host '[GDN-505] Retrospectiva e backlog de follow-up validados com sucesso.' -ForegroundColor Green
Write-Host " - Retro: $retroPath" -ForegroundColor Cyan
Write-Host " - Backlog: $backlogPath (itens=$($rows.Count), high=$highPriority)" -ForegroundColor Cyan
