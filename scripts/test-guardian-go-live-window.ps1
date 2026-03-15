param(
  [string]$ChecklistPath = 'docs/features/GDN-501_GO_LIVE_CHECKLIST_2026-03-07.md',
  [string]$OutputFile = ''
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$runId = Get-Date -Format 'yyyyMMdd-HHmmss'

if (-not [System.IO.Path]::IsPathRooted($ChecklistPath)) {
  $ChecklistPath = Join-Path $repoRoot $ChecklistPath
}

if ([string]::IsNullOrWhiteSpace($OutputFile)) {
  $OutputFile = Join-Path $repoRoot "docs/features/evidencias/GDN501_GO_LIVE_DECISION_$runId.md"
} elseif (-not [System.IO.Path]::IsPathRooted($OutputFile)) {
  $OutputFile = Join-Path $repoRoot $OutputFile
}

$preflightReport = "docs/features/evidencias/GDN501_GO_LIVE_PREFLIGHT_FOR_DECISION_$runId.md"

function Assert-Checklist {
  param([string]$Path)

  if (-not (Test-Path -Path $Path)) {
    throw "Checklist de go-live nao encontrado: $Path"
  }

  $content = Get-Content -Path $Path -Raw
  $required = @(
    '## 1. Preparacao pre-janela',
    '## 2. Preflight tecnico',
    '## 3. Janela de go-live',
    '## 4. Criterio de GO',
    '## 5. Criterio de NO-GO'
  )
  foreach ($item in $required) {
    if ($content -notmatch [regex]::Escape($item)) {
      throw "Checklist sem secao obrigatoria: $item"
    }
  }
}

$startedAt = Get-Date
$decision = 'NO-GO'
$decisionReason = ''
$preflightStatus = 'FAIL'

try {
  Assert-Checklist -Path $ChecklistPath
  $checklistStatus = 'PASS'
} catch {
  $checklistStatus = 'FAIL'
  $decisionReason = $_.Exception.Message
}

if ($checklistStatus -eq 'PASS') {
  $output = & powershell -ExecutionPolicy Bypass -File (Join-Path $repoRoot 'scripts/ci/guardian-go-live-preflight-check.ps1') -OutputFile $preflightReport 2>&1
  $exitCode = $LASTEXITCODE
  $preflightStatus = if ($exitCode -eq 0) { 'PASS' } else { 'FAIL' }

  if ($preflightStatus -eq 'PASS') {
    $decision = 'GO'
    $decisionReason = 'Checklist e preflight tecnico aprovados.'
  } else {
    $decision = 'NO-GO'
    $decisionReason = 'Preflight tecnico com falhas.'
  }
}

$finishedAt = Get-Date
$outputDir = Split-Path -Path $OutputFile -Parent
if (-not (Test-Path $outputDir)) {
  New-Item -Path $outputDir -ItemType Directory -Force | Out-Null
}

$md = @()
$md += '# GDN-501 - Go live release decision'
$md += ''
$md += "- RunId: $runId"
$md += "- Inicio: $($startedAt.ToString('yyyy-MM-dd HH:mm:ss'))"
$md += "- Fim: $($finishedAt.ToString('yyyy-MM-dd HH:mm:ss'))"
$md += "- ChecklistStatus: $checklistStatus"
$md += "- PreflightStatus: $preflightStatus"
$md += "- ReleaseDecision: $decision"
$md += "- Reason: $decisionReason"
$md += "- ChecklistPath: $ChecklistPath"
$md += "- PreflightReport: $preflightReport"
$md += ''
$md += '## Resultado'
if ($decision -eq 'GO') {
  $md += '- Janela de go-live aprovada para execucao controlada.'
} else {
  $md += '- Janela de go-live bloqueada ate correcoes necessarias.'
}

Set-Content -Path $OutputFile -Value $md -Encoding UTF8
Write-Host "Relatorio salvo em: $OutputFile"

if ($decision -ne 'GO') {
  exit 1
}

exit 0
