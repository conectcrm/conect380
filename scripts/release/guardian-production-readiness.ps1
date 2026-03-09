param(
  [string]$BaseUrl = 'http://localhost:3001',
  [string]$Token = '',
  [string]$Email = '',
  [string]$Senha = '',
  [string]$TargetEmpresaId = '',
  [ValidateSet('dry-run', 'real')]
  [string]$Mode = 'dry-run',
  [string]$OutputFile = ''
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
$normalizedBaseUrl = $BaseUrl.TrimEnd('/')
$runId = Get-Date -Format 'yyyyMMdd-HHmmss'
$isDryRun = ($Mode -eq 'dry-run')

if ([string]::IsNullOrWhiteSpace($OutputFile)) {
  $OutputFile = Join-Path $repoRoot "docs/features/evidencias/GUARDIAN_PRODUCTION_READINESS_$runId.md"
} elseif (-not [System.IO.Path]::IsPathRooted($OutputFile)) {
  $OutputFile = Join-Path $repoRoot $OutputFile
}

if (-not $isDryRun) {
  $hasToken = -not [string]::IsNullOrWhiteSpace($Token)
  $hasUserPass = (-not [string]::IsNullOrWhiteSpace($Email) -and -not [string]::IsNullOrWhiteSpace($Senha))
  if (-not $hasToken -and -not $hasUserPass) {
    throw 'Modo real exige -Token ou -Email/-Senha.'
  }
}

function Invoke-Step {
  param(
    [string]$Name,
    [string]$ScriptPath,
    [string[]]$Arguments = @()
  )

  $args = @('-ExecutionPolicy', 'Bypass', '-File', $ScriptPath) + $Arguments
  $output = & powershell @args 2>&1
  $exitCode = $LASTEXITCODE
  return [PSCustomObject]@{
    Name = $Name
    Pass = ($exitCode -eq 0)
    ExitCode = $exitCode
    Output = ($output | Out-String).Trim()
  }
}

$startedAt = Get-Date
$steps = @()

$smokeReport = "docs/features/evidencias/GUARDIAN_PRODUCTION_READINESS_GDN506_$runId.md"
$smokeArgs = @(
  '-BaseUrl', $normalizedBaseUrl,
  '-OutputFile', $smokeReport
)
if ($isDryRun) {
  $smokeArgs += '-DryRun'
} else {
  if (-not [string]::IsNullOrWhiteSpace($Token)) {
    $smokeArgs += @('-Token', $Token)
  } else {
    $smokeArgs += @('-Email', $Email, '-Senha', $Senha)
  }
  if (-not [string]::IsNullOrWhiteSpace($TargetEmpresaId)) {
    $smokeArgs += @('-TargetEmpresaId', $TargetEmpresaId)
  }
}
$steps += Invoke-Step -Name 'GDN506_daily_smoke' -ScriptPath 'scripts/test-guardian-daily-smoke-production.ps1' -Arguments $smokeArgs

$financialReport = "docs/features/evidencias/GUARDIAN_PRODUCTION_READINESS_GDN507_$runId.md"
$financialArgs = @(
  '-BaseUrl', $normalizedBaseUrl,
  '-OutputFile', $financialReport
)
if ($isDryRun) {
  $financialArgs += '-DryRun'
} else {
  if (-not [string]::IsNullOrWhiteSpace($Token)) {
    $financialArgs += @('-Token', $Token)
  } else {
    $financialArgs += @('-Email', $Email, '-Senha', $Senha)
  }
}
$steps += Invoke-Step -Name 'GDN507_daily_financial_consistency' -ScriptPath 'scripts/test-guardian-daily-financial-consistency.ps1' -Arguments $financialArgs

$auditReport = "docs/features/evidencias/GUARDIAN_PRODUCTION_READINESS_GDN508_$runId.md"
$auditArgs = @('-OutputFile', $auditReport)
if ($isDryRun) {
  $auditArgs += '-DryRun'
}
$steps += Invoke-Step -Name 'GDN508_critical_audit_checks' -ScriptPath 'scripts/test-guardian-critical-audit-daily-checks.ps1' -Arguments $auditArgs

$rollbackReport = "docs/features/evidencias/GUARDIAN_PRODUCTION_READINESS_GDN509_$runId.md"
$rollbackArgs = @('-OutputFile', $rollbackReport)
if ($isDryRun) {
  $rollbackArgs += '-DryRun'
}
$steps += Invoke-Step -Name 'GDN509_rollback_simulation' -ScriptPath 'scripts/test-guardian-production-rollback-simulation.ps1' -Arguments $rollbackArgs

$steps += Invoke-Step -Name 'GDN511_final_acceptance_entitlement' -ScriptPath 'scripts/ci/guardian-final-acceptance-entitlement-backend-check.ps1'
$steps += Invoke-Step -Name 'GDN512_final_acceptance_guardian_isolation' -ScriptPath 'scripts/ci/guardian-final-acceptance-guardian-isolation-check.ps1'
$steps += Invoke-Step -Name 'GDN513_final_acceptance_webhook_reliability' -ScriptPath 'scripts/ci/guardian-final-acceptance-webhook-reliability-check.ps1'
$steps += Invoke-Step -Name 'GDN514_final_acceptance_e2e_critical_suite' -ScriptPath 'scripts/ci/guardian-final-acceptance-e2e-critical-suite-check.ps1'
$steps += Invoke-Step -Name 'GDN515_final_acceptance_runbook_readiness' -ScriptPath 'scripts/ci/guardian-final-acceptance-runbook-readiness-check.ps1'
$steps += Invoke-Step -Name 'GDN516_final_acceptance_legacy_decommission' -ScriptPath 'scripts/ci/guardian-final-acceptance-legacy-decommission-check.ps1'

$status = 'PASS'
foreach ($step in $steps) {
  if (-not $step.Pass) {
    $status = 'FAIL'
  }
}

$finishedAt = Get-Date
$durationSeconds = [Math]::Round(($finishedAt - $startedAt).TotalSeconds, 2)

$outDir = Split-Path -Path $OutputFile -Parent
if (-not (Test-Path -Path $outDir)) {
  New-Item -Path $outDir -ItemType Directory -Force | Out-Null
}

$md = @()
$md += '# Guardian production readiness execution'
$md += ''
$md += "- RunId: $runId"
$md += "- BaseUrl: $normalizedBaseUrl"
$md += "- Mode: $Mode"
$md += "- Inicio: $($startedAt.ToString('yyyy-MM-dd HH:mm:ss'))"
$md += "- Fim: $($finishedAt.ToString('yyyy-MM-dd HH:mm:ss'))"
$md += "- DuracaoSegundos: $durationSeconds"
$md += "- Status: $status"
$md += ''
$md += '## Steps'
foreach ($step in $steps) {
  $md += "- [$(if ($step.Pass) { 'PASS' } else { 'FAIL' })] $($step.Name) :: exitCode=$($step.ExitCode)"
}
$md += ''
$md += '## Evidencias'
foreach ($step in $steps) {
  $md += ''
  $md += "### $($step.Name)"
  $md += '```text'
  $md += $step.Output
  $md += '```'
}
$md += ''
$md += '## Resultado'
if ($status -eq 'PASS') {
  $md += '- Readiness consolidado aprovado para o modo executado.'
} else {
  $md += '- Readiness consolidado com falhas. Revisar steps e relatorios individuais.'
}

Set-Content -Path $OutputFile -Value $md -Encoding UTF8
Write-Host "Relatorio salvo em: $OutputFile"

if ($status -ne 'PASS') {
  exit 1
}

exit 0
