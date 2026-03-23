param(
  [ValidateSet('legacy', 'dual', 'canary', 'guardian_only')]
  [string]$BaselineMode = 'canary',
  [int]$BaselineCanaryPercent = 100,
  [ValidateSet('legacy', 'dual', 'canary', 'guardian_only')]
  [string]$RollbackMode = 'dual',
  [int]$RollbackCanaryPercent = 0,
  [ValidateSet('legacy', 'dual', 'canary', 'guardian_only')]
  [string]$FinalFallbackMode = 'legacy',
  [int]$FinalFallbackCanaryPercent = 0,
  [string]$SimulatedIncident = 'billing_latency_high',
  [switch]$DryRun = $false,
  [string]$OutputFile = ''
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$runId = Get-Date -Format 'yyyyMMdd-HHmmss'

if ([string]::IsNullOrWhiteSpace($OutputFile)) {
  $OutputFile = Join-Path $repoRoot "docs/features/evidencias/GDN403_CONTINGENCY_ROLLBACK_DRILL_$runId.md"
} elseif (-not [System.IO.Path]::IsPathRooted($OutputFile)) {
  $OutputFile = Join-Path $repoRoot $OutputFile
}

$runbookPath = Join-Path $repoRoot 'docs/runbooks/PLANO_GUARDIAN_INCIDENT_RESPONSE_PILOTO.md'
$transitionCheckScript = Join-Path $repoRoot 'scripts/ci/guardian-transition-flags-check.ps1'
$monitorScript = Join-Path $repoRoot 'scripts/monitor-guardian-billing-platform.ps1'

function New-Step {
  param(
    [string]$Id,
    [string]$Name,
    [string]$Status = 'PENDING',
    [string]$Detail = ''
  )

  return [PSCustomObject]@{
    id = $Id
    name = $Name
    status = $Status
    detail = $Detail
  }
}

function Invoke-TransitionValidation {
  param(
    [string]$Mode,
    [int]$CanaryPercent
  )

  $modeArg = if ([string]::IsNullOrWhiteSpace($Mode)) { 'legacy' } else { $Mode }
  $canaryArg = [string]$CanaryPercent

  $output = & powershell -ExecutionPolicy Bypass -File $transitionCheckScript -Mode $modeArg -CanaryPercent $canaryArg 2>&1
  $exitCode = $LASTEXITCODE

  return [PSCustomObject]@{
    exitCode = $exitCode
    output = ($output | Out-String).Trim()
  }
}

function Assert-FileContains {
  param(
    [string]$Path,
    [string[]]$Patterns
  )

  if (-not (Test-Path -Path $Path)) {
    throw "Arquivo nao encontrado: $Path"
  }

  $content = Get-Content -Path $Path -Raw
  foreach ($pattern in $Patterns) {
    if ($content -notmatch [regex]::Escape($pattern)) {
      throw "Arquivo '$Path' sem trecho obrigatorio: $pattern"
    }
  }
}

$startedAt = Get-Date
$steps = @()
$steps += New-Step -Id 'DRILL-001' -Name 'Pre-check runbook de incidente'
$steps += New-Step -Id 'DRILL-002' -Name 'Baseline transition mode validation'
$steps += New-Step -Id 'DRILL-003' -Name 'Simulacao de incidente'
$steps += New-Step -Id 'DRILL-004' -Name 'Execucao de rollback (modo mitigado)'
$steps += New-Step -Id 'DRILL-005' -Name 'Fallback final para modo seguro'
$steps += New-Step -Id 'DRILL-006' -Name 'Snapshot de monitoramento apos rollback'

Write-Host ''
Write-Host '===============================================' -ForegroundColor Cyan
Write-Host ' GDN-403 - Contingency and rollback drill' -ForegroundColor Cyan
Write-Host '===============================================' -ForegroundColor Cyan
Write-Host "RunId: $runId"
Write-Host "DryRun: $($DryRun.IsPresent)"
Write-Host "IncidentScenario: $SimulatedIncident"
Write-Host ''

try {
  Assert-FileContains -Path $runbookPath -Patterns @(
    '## 6. Procedimento de mitigacao e rollback',
    '## 7. Comunicacao de incidente',
    '## 8. Checklist de encerramento'
  )
  $steps[0].status = 'PASS'
  $steps[0].detail = 'Runbook de incidente validado.'
} catch {
  $steps[0].status = 'FAIL'
  $steps[0].detail = $_.Exception.Message
}

if ($steps[0].status -eq 'PASS') {
  $baselineResult = Invoke-TransitionValidation -Mode $BaselineMode -CanaryPercent $BaselineCanaryPercent
  if ($baselineResult.exitCode -eq 0) {
    $steps[1].status = 'PASS'
    $steps[1].detail = "Baseline validado: mode=$BaselineMode canary=$BaselineCanaryPercent."
  } else {
    $steps[1].status = 'FAIL'
    $steps[1].detail = "Falha baseline: $($baselineResult.output)"
  }
} else {
  $steps[1].status = 'SKIPPED'
  $steps[1].detail = 'Pre-check runbook falhou.'
}

if ($steps[1].status -eq 'PASS') {
  $incidentAt = (Get-Date).ToString('o')
  $steps[2].status = 'PASS'
  $steps[2].detail = "Incidente simulado: '$SimulatedIncident' em $incidentAt."
} else {
  $steps[2].status = 'SKIPPED'
  $steps[2].detail = 'Baseline nao validado.'
}

if ($steps[2].status -eq 'PASS') {
  $rollbackResult = Invoke-TransitionValidation -Mode $RollbackMode -CanaryPercent $RollbackCanaryPercent
  if ($rollbackResult.exitCode -eq 0) {
    $steps[3].status = 'PASS'
    $steps[3].detail = "Rollback mitigado aplicado: mode=$RollbackMode canary=$RollbackCanaryPercent."
  } else {
    $steps[3].status = 'FAIL'
    $steps[3].detail = "Falha rollback mitigado: $($rollbackResult.output)"
  }
} else {
  $steps[3].status = 'SKIPPED'
  $steps[3].detail = 'Incidente nao simulado.'
}

if ($steps[3].status -eq 'PASS') {
  $fallbackResult = Invoke-TransitionValidation -Mode $FinalFallbackMode -CanaryPercent $FinalFallbackCanaryPercent
  if ($fallbackResult.exitCode -eq 0) {
    $steps[4].status = 'PASS'
    $steps[4].detail = "Fallback final aplicado: mode=$FinalFallbackMode canary=$FinalFallbackCanaryPercent."
  } else {
    $steps[4].status = 'FAIL'
    $steps[4].detail = "Falha fallback final: $($fallbackResult.output)"
  }
} else {
  $steps[4].status = 'SKIPPED'
  $steps[4].detail = 'Rollback mitigado nao concluiu.'
}

if ($steps[4].status -eq 'PASS') {
  $monitorOutputSummary = "docs/features/evidencias/GDN403_MONITOR_POST_ROLLBACK_$runId.md"
  $monitorOutputCsv = "docs/features/evidencias/GDN403_MONITOR_POST_ROLLBACK_$runId.csv"

  $monitorArgs = @(
    '-ExecutionPolicy', 'Bypass',
    '-File', $monitorScript,
    '-DryRun',
    '-MaxCycles', '1',
    '-IntervalSeconds', '1',
    '-OutputCsv', $monitorOutputCsv,
    '-OutputSummary', $monitorOutputSummary
  )

  $monitorOutput = & powershell @monitorArgs 2>&1
  $monitorExit = $LASTEXITCODE

  if ($monitorExit -eq 0) {
    $steps[5].status = 'PASS'
    $steps[5].detail = "Monitor pos-rollback validado (dry-run). Arquivos: $monitorOutputCsv e $monitorOutputSummary"
  } else {
    $steps[5].status = 'FAIL'
    $steps[5].detail = "Falha monitor pos-rollback: $($monitorOutput | Out-String)"
  }
} else {
  $steps[5].status = 'SKIPPED'
  $steps[5].detail = 'Fallback final nao aplicado.'
}

$finishedAt = Get-Date
$passCount = @($steps | Where-Object { $_.status -eq 'PASS' }).Count
$failCount = @($steps | Where-Object { $_.status -eq 'FAIL' }).Count
$skippedCount = @($steps | Where-Object { $_.status -eq 'SKIPPED' }).Count

$outputDir = Split-Path -Path $OutputFile -Parent
if (-not (Test-Path $outputDir)) {
  New-Item -Path $outputDir -ItemType Directory -Force | Out-Null
}

$lines = @()
$lines += '# GDN-403 - Contingency and rollback drill'
$lines += ''
$lines += "- RunId: $runId"
$lines += "- Inicio: $($startedAt.ToString('yyyy-MM-dd HH:mm:ss'))"
$lines += "- Fim: $($finishedAt.ToString('yyyy-MM-dd HH:mm:ss'))"
$lines += "- DryRun: $(if ($DryRun) { 'true' } else { 'false' })"
$lines += "- SimulatedIncident: $SimulatedIncident"
$lines += "- Baseline: mode=$BaselineMode canary=$BaselineCanaryPercent"
$lines += "- Rollback: mode=$RollbackMode canary=$RollbackCanaryPercent"
$lines += "- FinalFallback: mode=$FinalFallbackMode canary=$FinalFallbackCanaryPercent"
$lines += "- PASS: $passCount | FAIL: $failCount | SKIPPED: $skippedCount"
$lines += ''
$lines += '| ID | Etapa | Status | Detalhe |'
$lines += '| --- | --- | --- | --- |'
foreach ($step in $steps) {
  $detail = ($step.detail -replace '\|', '/')
  $lines += "| $($step.id) | $($step.name) | $($step.status) | $detail |"
}

$lines += ''
$lines += '## Resultado'
$lines += ''
if ($failCount -eq 0) {
  $lines += '- Drill de contingencia e rollback concluido com sucesso.'
  $lines += '- Rollback completed: transicao para modo seguro validada.'
} else {
  $lines += '- Drill com falhas. Revisar etapas marcadas como FAIL antes de seguir para validacoes de sprint.'
}

Set-Content -Path $OutputFile -Value $lines -Encoding UTF8

Write-Host "Relatorio salvo em: $OutputFile"

if ($failCount -gt 0 -and -not $DryRun) {
  exit 1
}

if ($failCount -gt 0 -and $DryRun) {
  exit 1
}

exit 0
