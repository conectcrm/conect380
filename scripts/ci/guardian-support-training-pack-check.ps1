Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$planPath = 'docs/features/GDN-405_TRAINING_PLAN_N1_N2_N3_2026-03-07.md'
$exercisesPath = 'docs/features/GDN-405_EXERCICIOS_PRACTICOS_GUARDIAN_2026-03-07.md'
$templatePath = 'docs/features/GDN-405_REGISTRO_TREINAMENTO_TEMPLATE_2026-03-07.md'

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
      throw "Arquivo '$Path' sem trecho obrigatorio: $pattern"
    }
  }
}

Assert-FileText -Path $planPath -RequiredPatterns @(
  '## Estrutura do treinamento',
  '### Bloco 2 - Runbook e escalacao',
  '### Bloco 4 - Simulacao pratica',
  '## Criterio de aprovacao por nivel'
)

Assert-FileText -Path $exercisesPath -RequiredPatterns @(
  '## Exercicio 1 - Falha de billing',
  '## Exercicio 2 - Auditoria critica indisponivel',
  '## Exercicio 3 - Rollback de transicao legado'
)

Assert-FileText -Path $templatePath -RequiredPatterns @(
  '## Presenca',
  '## Exercicios executados',
  '## Resultado por nivel',
  '## Assinatura de aceite'
)

Write-Host '[GDN-405] Pacote de treinamento N1/N2/N3 validado com sucesso.' -ForegroundColor Green
Write-Host " - Plano: $planPath" -ForegroundColor Cyan
Write-Host " - Exercicios: $exercisesPath" -ForegroundColor Cyan
Write-Host " - Template: $templatePath" -ForegroundColor Cyan
