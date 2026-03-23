param(
  [string]$OutputFile = ''
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$runId = Get-Date -Format 'yyyyMMdd-HHmmss'

if ([string]::IsNullOrWhiteSpace($OutputFile)) {
  $OutputFile = Join-Path $repoRoot "docs/features/evidencias/GDN516_LEGACY_DECOMMISSION_ACCEPTANCE_$runId.md"
} elseif (-not [System.IO.Path]::IsPathRooted($OutputFile)) {
  $OutputFile = Join-Path $repoRoot $OutputFile
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
$status = 'PASS'
$steps = @()

$steps += Invoke-Step -Name 'legacy_decommission_phases' -ScriptPath 'scripts/ci/guardian-legacy-decommission-phases-check.ps1'
$steps += Invoke-Step -Name 'guardian_only_transition_mode' -ScriptPath 'scripts/ci/guardian-transition-flags-check.ps1' -Arguments @('-Mode', 'guardian_only', '-CanaryPercent', '0')
$steps += Invoke-Step -Name 'guardian_operational_smoke' -ScriptPath 'scripts/ci/guardian-daily-smoke-production-check.ps1'

$guardianRefsOutput = & rg -n "/admin|admin/" guardian-web deploy/guardian-web.host-nginx.conf docker-compose.guardian-web.yml 2>&1
$guardianRefsExit = $LASTEXITCODE
$guardianRefStep = [PSCustomObject]@{
  Name = 'guardian_surface_without_admin_routes'
  Pass = ($guardianRefsExit -eq 1)
  ExitCode = $guardianRefsExit
  Output = ($guardianRefsOutput | Out-String).Trim()
}
$steps += $guardianRefStep

$legacyBackupPageExists = Test-Path -Path (Join-Path $repoRoot 'frontend-web/src/pages/empresas/BackupSincronizacaoPage.tsx')
$backupStep = [PSCustomObject]@{
  Name = 'legacy_backup_page_removed'
  Pass = (-not $legacyBackupPageExists)
  ExitCode = if ($legacyBackupPageExists) { 1 } else { 0 }
  Output = if ($legacyBackupPageExists) { 'Arquivo legado ainda presente.' } else { 'Arquivo legado removido.' }
}
$steps += $backupStep

foreach ($step in $steps) {
  if (-not $step.Pass) {
    $status = 'FAIL'
  }
}

$finishedAt = Get-Date
$durationSeconds = [Math]::Round(($finishedAt - $startedAt).TotalSeconds, 2)

$md = @()
$md += '# GDN-516 - Final acceptance legacy decommission'
$md += ''
$md += "- RunId: $runId"
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
  $md += '- Aceite final de descomissionamento legado validado com sucesso.'
} else {
  $md += '- Aceite final de descomissionamento legado com falhas.'
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
