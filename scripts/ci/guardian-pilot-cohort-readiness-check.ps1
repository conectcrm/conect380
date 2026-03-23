param(
  [string]$RunbookPath = 'docs/features/GDN-401_ROTEIRO_PILOTO_CONTROLADO_GUARDIAN_2026-03-07.md',
  [string]$ChecklistPath = 'docs/features/GDN-401_CHECKLIST_PILOTO_48H_GUARDIAN_2026-03-07.md',
  [string]$CohortPath = 'docs/features/GDN-401_COHORT_PILOTO_GUARDIAN_2026-03-07.csv'
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Assert-FileText {
  param(
    [string]$Path,
    [string[]]$RequiredPatterns
  )

  if (-not (Test-Path -Path $Path)) {
    throw "Arquivo nao encontrado: $Path"
  }

  $content = Get-Content -Path $Path -Raw
  if ([string]::IsNullOrWhiteSpace($content)) {
    throw "Arquivo vazio: $Path"
  }

  foreach ($pattern in $RequiredPatterns) {
    if ($content -notmatch [regex]::Escape($pattern)) {
      throw "Arquivo '$Path' sem secao obrigatoria: $pattern"
    }
  }
}

Assert-FileText -Path $RunbookPath -RequiredPatterns @(
  '## Estrategia de coorte',
  '## Janela de execucao',
  '## Criticos de monitoramento no piloto',
  '## Regras de NO-GO imediato'
)

Assert-FileText -Path $ChecklistPath -RequiredPatterns @(
  '## 2. Preparacao pre-piloto',
  '## 3. Smoke inicial (T+30 min)',
  '## 4. Janela de monitoramento',
  '## 5. Decisao GO/NO-GO'
)

if (-not (Test-Path -Path $CohortPath)) {
  throw "Arquivo de coorte nao encontrado: $CohortPath"
}

$rows = Import-Csv -Path $CohortPath
if ($rows.Count -lt 3) {
  throw "Cohort deve conter ao menos 3 linhas de planejamento: $CohortPath"
}

$requiredColumns = @('empresa_id', 'nome_empresa', 'owner_operacional', 'owner_comercial', 'janela_inicio_utc', 'janela_fim_utc', 'status', 'observacoes')
foreach ($column in $requiredColumns) {
  if (-not ($rows[0].PSObject.Properties.Name -contains $column)) {
    throw "Coluna obrigatoria ausente no cohort: $column"
  }
}

Write-Host '[GDN-401] Readiness de piloto controlado validada com sucesso.' -ForegroundColor Green
Write-Host " - Runbook: $RunbookPath" -ForegroundColor Cyan
Write-Host " - Checklist: $ChecklistPath" -ForegroundColor Cyan
Write-Host " - Cohort: $CohortPath" -ForegroundColor Cyan
