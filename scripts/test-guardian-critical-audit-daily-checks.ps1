param(
  [string]$InputCsv = '',
  [switch]$DryRun = $false,
  [string]$OutputFile = ''
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$runId = Get-Date -Format 'yyyyMMdd-HHmmss'

if ([string]::IsNullOrWhiteSpace($OutputFile)) {
  $OutputFile = Join-Path $repoRoot "docs/features/evidencias/GDN508_CRITICAL_AUDIT_CHECKS_$runId.md"
} elseif (-not [System.IO.Path]::IsPathRooted($OutputFile)) {
  $OutputFile = Join-Path $repoRoot $OutputFile
}

$startedAt = Get-Date
$status = 'PASS'
$checks = @()
$notes = @()

$requiredFiles = @(
  (Join-Path $repoRoot 'backend/src/modules/guardian/entities/guardian-critical-audit.entity.ts'),
  (Join-Path $repoRoot 'backend/src/modules/guardian/interceptors/guardian-critical-audit.interceptor.ts'),
  (Join-Path $repoRoot 'backend/src/migrations/1808106000000-CreateGuardianCriticalAudits.ts')
)

foreach ($file in $requiredFiles) {
  $exists = Test-Path -Path $file
  $checks += [PSCustomObject]@{
    Name = "arquivo presente: $file"
    Pass = $exists
    Detail = if ($exists) { 'ok' } else { 'missing' }
  }
  if (-not $exists) {
    $status = 'FAIL'
    $notes += "Arquivo obrigatorio ausente: $file"
  }
}

if ($status -eq 'PASS') {
  $migrationPath = $requiredFiles[2]
  $migrationContent = Get-Content -Path $migrationPath -Raw
  $immutabilityCheck = ($migrationContent -match 'trg_guardian_critical_audits_immutable') -and ($migrationContent -match 'BEFORE UPDATE OR DELETE')
  $checks += [PSCustomObject]@{
    Name = 'migration garante imutabilidade de audit critical'
    Pass = $immutabilityCheck
    Detail = if ($immutabilityCheck) { 'trigger immutable encontrado' } else { 'trigger immutable nao encontrado' }
  }
  if (-not $immutabilityCheck) {
    $status = 'FAIL'
    $notes += 'Migration sem evidencias de trigger de imutabilidade para audit critical.'
  }
}

$alertReport = "docs/features/evidencias/GDN508_ALERT_OBSERVABILITY_$runId.md"
$alertArgs = @(
  '-ExecutionPolicy', 'Bypass',
  '-File', 'scripts/test-guardian-alert-observability.ps1',
  '-OutputFile', $alertReport
)
if ($DryRun) {
  $alertArgs += '-DryRun'
}
if (-not [string]::IsNullOrWhiteSpace($InputCsv)) {
  $alertArgs += @('-InputCsv', $InputCsv)
}

Write-Host '[GDN-508] Executando validacao de alertas/auditoria critica...' -ForegroundColor Cyan
$alertOutput = & powershell @alertArgs 2>&1
$alertExitCode = $LASTEXITCODE

if ($alertExitCode -ne 0) {
  $status = 'FAIL'
  $notes += "Script de alert observability retornou exitCode=$alertExitCode"
  $checks += [PSCustomObject]@{
    Name = 'alert observability script'
    Pass = $false
    Detail = "exitCode=$alertExitCode"
  }
} else {
  $checks += [PSCustomObject]@{
    Name = 'alert observability script'
    Pass = $true
    Detail = "report=$alertReport"
  }

  if (-not (Test-Path -Path $alertReport)) {
    $status = 'FAIL'
    $notes += "Relatorio de alertas nao encontrado: $alertReport"
  } else {
    $alertContent = Get-Content -Path $alertReport -Raw
    $hasBillingAuditAlert = $alertContent -match 'guardian_billing_audit_errors'
    $alertScriptPath = Join-Path $repoRoot 'scripts/test-guardian-alert-observability.ps1'
    $hasAlertMapping = $false
    if (Test-Path -Path $alertScriptPath) {
      $alertScriptContent = Get-Content -Path $alertScriptPath -Raw
      $hasAlertMapping =
        ($alertScriptContent -match [regex]::Escape("New-Alert -Code 'guardian_billing_audit_errors'")) -or
        ($alertScriptContent -match [regex]::Escape('guardian_billing_audit_errors'))
    }

    $billingAlertCheckPass = $hasBillingAuditAlert -or $hasAlertMapping
    $checks += [PSCustomObject]@{
      Name = 'alerta de auditoria critica billing mapeado'
      Pass = $billingAlertCheckPass
      Detail = if ($hasBillingAuditAlert) {
        'guardian_billing_audit_errors acionado no relatorio'
      } elseif ($hasAlertMapping) {
        'guardian_billing_audit_errors mapeado no script de observabilidade'
      } else {
        'guardian_billing_audit_errors ausente'
      }
    }
    if (-not $billingAlertCheckPass) {
      $status = 'FAIL'
      $notes += 'Sem evidencia de mapeamento do alerta guardian_billing_audit_errors.'
    }
  }
}

$finishedAt = Get-Date
$durationSeconds = [Math]::Round(($finishedAt - $startedAt).TotalSeconds, 2)

$md = @()
$md += '# GDN-508 - Critical audit event checks validation'
$md += ''
$md += "- RunId: $runId"
$md += "- Inicio: $($startedAt.ToString('yyyy-MM-dd HH:mm:ss'))"
$md += "- Fim: $($finishedAt.ToString('yyyy-MM-dd HH:mm:ss'))"
$md += "- DuracaoSegundos: $durationSeconds"
$md += "- DryRun: $(if ($DryRun) { 'true' } else { 'false' })"
$md += "- Status: $status"
$md += ''
$md += '## Checks'
foreach ($check in $checks) {
  $md += "- [$(if ($check.Pass) { 'PASS' } else { 'FAIL' })] $($check.Name) :: $($check.Detail)"
}
$md += ''

if ($notes.Count -gt 0) {
  $md += '## Observacoes'
  foreach ($note in $notes) {
    $md += "- $note"
  }
  $md += ''
}

if ($alertOutput) {
  $md += '## Evidencia do alert observability'
  $md += ''
  $md += '```text'
  $md += ($alertOutput | Out-String).Trim()
  $md += '```'
  $md += ''
}

$md += '## Resultado'
if ($status -eq 'PASS') {
  $md += '- Checks diarios de eventos criticos de auditoria validados com sucesso.'
} else {
  $md += '- Checks diarios de eventos criticos com falhas. Revisar observacoes.'
}

$outDir = Split-Path -Path $OutputFile -Parent
if (-not (Test-Path -Path $outDir)) {
  New-Item -Path $outDir -ItemType Directory -Force | Out-Null
}

Set-Content -Path $OutputFile -Value $md -Encoding UTF8
Write-Host "Relatorio salvo em: $OutputFile"

if ($status -ne 'PASS') {
  exit 1
}

exit 0
