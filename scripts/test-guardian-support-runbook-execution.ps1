param(
  [string]$OutputFile = ''
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$runId = Get-Date -Format 'yyyyMMdd-HHmmss'

if ([string]::IsNullOrWhiteSpace($OutputFile)) {
  $OutputFile = Join-Path $repoRoot "docs/features/evidencias/GDN409_SUPPORT_RUNBOOK_EXECUTION_$runId.md"
} elseif (-not [System.IO.Path]::IsPathRooted($OutputFile)) {
  $OutputFile = Join-Path $repoRoot $OutputFile
}

$checks = @(
  @{
    id = 'RUNBOOK-001'
    name = 'Incident runbook integrity check'
    script = 'scripts/ci/guardian-incident-runbook-check.ps1'
  },
  @{
    id = 'RUNBOOK-002'
    name = 'Billing/platform monitor operational check'
    script = 'scripts/ci/guardian-billing-platform-monitor-check.ps1'
  },
  @{
    id = 'RUNBOOK-003'
    name = 'Contingency and rollback drill check'
    script = 'scripts/ci/guardian-contingency-rollback-drill-check.ps1'
  },
  @{
    id = 'RUNBOOK-004'
    name = 'Support training pack check'
    script = 'scripts/ci/guardian-support-training-pack-check.ps1'
  }
)

$startedAt = Get-Date
$results = @()

foreach ($check in $checks) {
  $scriptPath = Join-Path $repoRoot $check.script
  Write-Host "[GDN-409] Executando $($check.id): $($check.name)" -ForegroundColor Cyan

  if (-not (Test-Path -Path $scriptPath)) {
    $results += [PSCustomObject]@{
      id = $check.id
      name = $check.name
      status = 'FAIL'
      detail = "Script nao encontrado: $scriptPath"
    }
    continue
  }

  $output = & powershell -ExecutionPolicy Bypass -File $scriptPath 2>&1
  $exitCode = $LASTEXITCODE

  if ($exitCode -eq 0) {
    $results += [PSCustomObject]@{
      id = $check.id
      name = $check.name
      status = 'PASS'
      detail = (($output | Out-String).Trim())
    }
  } else {
    $results += [PSCustomObject]@{
      id = $check.id
      name = $check.name
      status = 'FAIL'
      detail = (($output | Out-String).Trim())
    }
  }
}

$finishedAt = Get-Date
$passCount = @($results | Where-Object { $_.status -eq 'PASS' }).Count
$failCount = @($results | Where-Object { $_.status -eq 'FAIL' }).Count
$overallStatus = if ($failCount -eq 0) { 'PASS' } else { 'FAIL' }

$outDir = Split-Path -Path $OutputFile -Parent
if (-not (Test-Path $outDir)) {
  New-Item -Path $outDir -ItemType Directory -Force | Out-Null
}

$md = @()
$md += '# GDN-409 - Support runbook execution test'
$md += ''
$md += "- RunId: $runId"
$md += "- Inicio: $($startedAt.ToString('yyyy-MM-dd HH:mm:ss'))"
$md += "- Fim: $($finishedAt.ToString('yyyy-MM-dd HH:mm:ss'))"
$md += "- PASS: $passCount"
$md += "- FAIL: $failCount"
$md += "- OverallStatus: $overallStatus"
$md += ''
$md += '## Resultado por check'
$md += ''
$md += '| ID | Check | Status |'
$md += '| --- | --- | --- |'
foreach ($row in $results) {
  $md += "| $($row.id) | $($row.name) | $($row.status) |"
}

$md += ''
$md += '## Detalhes'
$md += ''
foreach ($row in $results) {
  $md += "### $($row.id) - $($row.name)"
  $md += ''
  $detail = if ([string]::IsNullOrWhiteSpace($row.detail)) { '(sem detalhe)' } else { $row.detail }
  $md += $detail
  $md += ''
}

$md += '## Conclusao'
if ($overallStatus -eq 'PASS') {
  $md += '- Execucao do runbook por suporte validada sem bloqueios.'
  $md += '- Fluxo operacional pode seguir para gate da sprint 4.'
} else {
  $md += '- Execucao do runbook apresentou falhas.'
  $md += '- Corrigir checks FAIL antes de liberar gate da sprint 4.'
}

Set-Content -Path $OutputFile -Value $md -Encoding UTF8
Write-Host "Relatorio salvo em: $OutputFile"

if ($overallStatus -ne 'PASS') {
  exit 1
}

exit 0
