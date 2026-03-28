param(
  [switch]$DryRun = $false,
  [string]$OutputFile = ''
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$runId = Get-Date -Format 'yyyyMMdd-HHmmss'

if ([string]::IsNullOrWhiteSpace($OutputFile)) {
  $OutputFile = Join-Path $repoRoot "docs/features/evidencias/GDN504_LEGACY_DECOMMISSION_$runId.md"
} elseif (-not [System.IO.Path]::IsPathRooted($OutputFile)) {
  $OutputFile = Join-Path $repoRoot $OutputFile
}

function New-StepResult {
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

function Invoke-ScriptStep {
  param(
    [string]$ScriptPath,
    [string[]]$Arguments = @()
  )

  $args = @('-ExecutionPolicy', 'Bypass', '-File', $ScriptPath) + $Arguments
  $output = & powershell @args 2>&1
  $exitCode = $LASTEXITCODE
  return [PSCustomObject]@{
    exitCode = $exitCode
    output = ($output | Out-String).Trim()
  }
}

$startedAt = Get-Date
$steps = @()
$steps += New-StepResult -Id 'DCP-001' -Name 'phase1_read_only_freeze'
$steps += New-StepResult -Id 'DCP-002' -Name 'phase2_canary_cutover_100'
$steps += New-StepResult -Id 'DCP-003' -Name 'phase3_guardian_only'
$steps += New-StepResult -Id 'DCP-004' -Name 'phase4_legacy_route_protection_tests'
$steps += New-StepResult -Id 'DCP-005' -Name 'phase5_retire_legacy_infra_checks'

$transitionCheckScript = Join-Path $repoRoot 'scripts/ci/guardian-transition-flags-check.ps1'
$readOnlyCheckScript = Join-Path $repoRoot 'scripts/ci/guardian-legacy-read-only-freeze-check.ps1'
$guardSpecCommand = 'npm --prefix backend run test -- common/guards/core-admin-legacy-transition.guard.spec.ts'
$nginxConfigPath = Join-Path $repoRoot 'deploy/guardian-web.host-nginx.conf'
$guardianComposePath = Join-Path $repoRoot 'docker-compose.guardian-web.yml'

Write-Host ''
Write-Host '===============================================' -ForegroundColor Cyan
Write-Host ' GDN-504 - Legacy decommission phased execution' -ForegroundColor Cyan
Write-Host '===============================================' -ForegroundColor Cyan
Write-Host "RunId: $runId"
Write-Host "DryRun: $($DryRun.IsPresent)"
Write-Host ''

# Phase 1: read-only freeze validated
$phase1Result = Invoke-ScriptStep -ScriptPath $readOnlyCheckScript
if ($phase1Result.exitCode -eq 0) {
  $steps[0].status = 'PASS'
  $steps[0].detail = 'Read-only freeze validado (GDN-503 check).'
} else {
  $steps[0].status = 'FAIL'
  $steps[0].detail = "Falha read-only freeze: $($phase1Result.output)"
}

# Phase 2: canary 100
if ($steps[0].status -eq 'PASS') {
  $phase2Result = Invoke-ScriptStep -ScriptPath $transitionCheckScript -Arguments @('-Mode', 'canary', '-CanaryPercent', '100')
  if ($phase2Result.exitCode -eq 0) {
    $steps[1].status = 'PASS'
    $steps[1].detail = 'Canary 100% validado para corte controlado.'
  } else {
    $steps[1].status = 'FAIL'
    $steps[1].detail = "Falha canary 100%: $($phase2Result.output)"
  }
} else {
  $steps[1].status = 'SKIPPED'
  $steps[1].detail = 'Dependencia da fase 1 nao concluida.'
}

# Phase 3: guardian only
if ($steps[1].status -eq 'PASS') {
  $phase3Result = Invoke-ScriptStep -ScriptPath $transitionCheckScript -Arguments @('-Mode', 'guardian_only', '-CanaryPercent', '0')
  if ($phase3Result.exitCode -eq 0) {
    $steps[2].status = 'PASS'
    $steps[2].detail = 'Guardian only validado; legado pode ser desligado.'
  } else {
    $steps[2].status = 'FAIL'
    $steps[2].detail = "Falha guardian_only: $($phase3Result.output)"
  }
} else {
  $steps[2].status = 'SKIPPED'
  $steps[2].detail = 'Dependencia da fase 2 nao concluida.'
}

# Phase 4: backend protection tests
if ($steps[2].status -eq 'PASS') {
  $testStdout = New-TemporaryFile
  $testStderr = New-TemporaryFile
  try {
    $proc = Start-Process `
      -FilePath 'cmd.exe' `
      -ArgumentList '/d', '/c', $guardSpecCommand `
      -NoNewWindow `
      -Wait `
      -PassThru `
      -RedirectStandardOutput $testStdout.FullName `
      -RedirectStandardError $testStderr.FullName
    $testOutput = @(
      @((Get-Content -Path $testStdout.FullName -ErrorAction SilentlyContinue)),
      @((Get-Content -Path $testStderr.FullName -ErrorAction SilentlyContinue))
    ) | Out-String
    $testExitCode = $proc.ExitCode
  } finally {
    Remove-Item -Path $testStdout.FullName, $testStderr.FullName -ErrorAction SilentlyContinue
  }

  if ($testExitCode -eq 0) {
    $steps[3].status = 'PASS'
    $steps[3].detail = 'Spec do guard legado PASS.'
  } else {
    $steps[3].status = 'FAIL'
    $steps[3].detail = "Falha na suite do guard legado: exitCode=$testExitCode; output=$testOutput"
  }
} else {
  $steps[3].status = 'SKIPPED'
  $steps[3].detail = 'Dependencia da fase 3 nao concluida.'
}

# Phase 5: infra checks
if ($steps[3].status -eq 'PASS') {
  $infraIssues = @()

  if (-not (Test-Path -Path $nginxConfigPath)) {
    $infraIssues += "Arquivo nginx nao encontrado: $nginxConfigPath"
  } else {
    $nginxContent = Get-Content -Path $nginxConfigPath -Raw
    if ($nginxContent -match '/admin') {
      $infraIssues += 'Config nginx guardian ainda contem rota /admin.'
    }
  }

  if (-not (Test-Path -Path $guardianComposePath)) {
    $infraIssues += "Arquivo compose guardian nao encontrado: $guardianComposePath"
  } else {
    $composeContent = Get-Content -Path $guardianComposePath -Raw
    if ($composeContent -match 'admin-web') {
      $infraIssues += 'Compose guardian ainda referencia admin-web.'
    }
  }

  if ($infraIssues.Count -eq 0) {
    $steps[4].status = 'PASS'
    $steps[4].detail = 'Checks de infraestrutura sem dependencias do legado.'
  } else {
    $steps[4].status = 'FAIL'
    $steps[4].detail = ($infraIssues -join ' | ')
  }
} else {
  $steps[4].status = 'SKIPPED'
  $steps[4].detail = 'Dependencia da fase 4 nao concluida.'
}

$finishedAt = Get-Date
$passCount = @($steps | Where-Object { $_.status -eq 'PASS' }).Count
$failCount = @($steps | Where-Object { $_.status -eq 'FAIL' }).Count
$skippedCount = @($steps | Where-Object { $_.status -eq 'SKIPPED' }).Count
$finalStatus = if ($failCount -eq 0) { 'PASS' } else { 'FAIL' }

$outDir = Split-Path -Path $OutputFile -Parent
if (-not (Test-Path -Path $outDir)) {
  New-Item -Path $outDir -ItemType Directory -Force | Out-Null
}

$lines = @()
$lines += '# GDN-504 - Legacy decommission by controlled phases'
$lines += ''
$lines += "- RunId: $runId"
$lines += "- Inicio: $($startedAt.ToString('yyyy-MM-dd HH:mm:ss'))"
$lines += "- Fim: $($finishedAt.ToString('yyyy-MM-dd HH:mm:ss'))"
$lines += "- DryRun: $(if ($DryRun) { 'true' } else { 'false' })"
$lines += "- Status: $finalStatus"
$lines += "- PASS: $passCount | FAIL: $failCount | SKIPPED: $skippedCount"
$lines += ''
$lines += '| ID | Phase | Status | Detail |'
$lines += '| --- | --- | --- | --- |'
foreach ($step in $steps) {
  $detail = ($step.detail -replace '\|', '/')
  $lines += "| $($step.id) | $($step.name) | $($step.status) | $detail |"
}
$lines += ''
$lines += '## Resultado'
if ($finalStatus -eq 'PASS') {
  $lines += '- Decommission legado validado por fases com seguranca operacional.'
} else {
  $lines += '- Decommission legado com falhas. Revisar fases marcadas como FAIL.'
}

Set-Content -Path $OutputFile -Value $lines -Encoding UTF8
Write-Host "Relatorio salvo em: $OutputFile"

if ($finalStatus -ne 'PASS') {
  exit 1
}

exit 0
