param(
  [switch]$DryRun = $false,
  [string]$OutputFile = ''
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$runId = Get-Date -Format 'yyyyMMdd-HHmmss'

if ([string]::IsNullOrWhiteSpace($OutputFile)) {
  $OutputFile = Join-Path $repoRoot "docs/features/evidencias/GDN512_GUARDIAN_ISOLATION_ACCEPTANCE_$runId.md"
} elseif (-not [System.IO.Path]::IsPathRooted($OutputFile)) {
  $OutputFile = Join-Path $repoRoot $OutputFile
}

$startedAt = Get-Date
$status = 'PASS'
$checks = @()
$notes = @()

$controllerPath = Join-Path $repoRoot 'backend/src/modules/core-admin/core-admin-bff.controller.ts'
$guardPath = Join-Path $repoRoot 'backend/src/modules/core-admin/guards/core-admin-mfa.guard.ts'
$coreAdminTransitionGuardPath = Join-Path $repoRoot 'backend/src/common/guards/core-admin-legacy-transition.guard.ts'
$coreAdminTransitionGuardSpecPath = Join-Path $repoRoot 'backend/src/common/guards/core-admin-legacy-transition.guard.spec.ts'
$testCommand = 'npm --prefix backend run test -- modules/core-admin/core-admin-bff.controller.spec.ts modules/core-admin/core-admin.controller.spec.ts common/guards/core-admin-legacy-transition.guard.spec.ts'

foreach ($file in @($controllerPath, $guardPath, $coreAdminTransitionGuardPath, $coreAdminTransitionGuardSpecPath)) {
  $exists = Test-Path -Path $file
  $checks += [PSCustomObject]@{
    Name = "arquivo presente: $file"
    Pass = $exists
    Detail = if ($exists) { 'ok' } else { 'missing' }
  }
  if (-not $exists) {
    $status = 'FAIL'
    $notes += "Arquivo ausente para validacao de isolamento: $file"
  }
}

if ($status -eq 'PASS') {
  $controllerContent = Get-Content -Path $controllerPath -Raw
  $guardContent = Get-Content -Path $guardPath -Raw
  $coreAdminTransitionGuardContent = Get-Content -Path $coreAdminTransitionGuardPath -Raw

  $staticChecks = @(
    [PSCustomObject]@{
      Name = 'core-admin namespace usa path core-admin/bff'
      Pass = ($controllerContent -match [regex]::Escape("Controller('core-admin/bff')"))
      Detail = 'path core-admin/bff'
    },
    [PSCustomObject]@{
      Name = 'core-admin exige role SUPERADMIN'
      Pass = ($controllerContent -match [regex]::Escape('@Roles(UserRole.SUPERADMIN)'))
      Detail = 'role superadmin'
    },
    [PSCustomObject]@{
      Name = 'core-admin aplica CoreAdminMfaGuard'
      Pass = ($controllerContent -match [regex]::Escape('CoreAdminMfaGuard'))
      Detail = 'mfa guard no controller'
    },
    [PSCustomObject]@{
      Name = 'CoreAdminMfaGuard valida mfa_verified'
      Pass = ($guardContent -match [regex]::Escape('mfa_verified'))
      Detail = 'mfa_verified check'
    },
    [PSCustomObject]@{
      Name = 'core-admin transition guard possui modo guardian_only'
      Pass = ($coreAdminTransitionGuardContent -match [regex]::Escape('guardian_only'))
      Detail = 'transition guard guardian_only'
    }
  )

  foreach ($item in $staticChecks) {
    $checks += $item
    if (-not $item.Pass) {
      $status = 'FAIL'
      $notes += "Falha de isolamento: $($item.Name)"
    }
  }
}

$testOutput = ''
if (-not $DryRun -and $status -eq 'PASS') {
  $tmpOut = New-TemporaryFile
  $tmpErr = New-TemporaryFile
  try {
    $proc = Start-Process `
      -FilePath 'cmd.exe' `
      -ArgumentList '/d', '/c', $testCommand `
      -NoNewWindow `
      -Wait `
      -PassThru `
      -RedirectStandardOutput $tmpOut.FullName `
      -RedirectStandardError $tmpErr.FullName

    $testOutput = @(
      @((Get-Content -Path $tmpOut.FullName -ErrorAction SilentlyContinue)),
      @((Get-Content -Path $tmpErr.FullName -ErrorAction SilentlyContinue))
    ) | Out-String
    $exitCode = $proc.ExitCode
  } finally {
    Remove-Item -Path $tmpOut.FullName, $tmpErr.FullName -ErrorAction SilentlyContinue
  }

  $pass = ($exitCode -eq 0)
  $checks += [PSCustomObject]@{
    Name = 'suite de isolamento RBAC+MFA'
    Pass = $pass
    Detail = "exitCode=$exitCode"
  }
  if (-not $pass) {
    $status = 'FAIL'
    $notes += "Suite de isolamento falhou com exitCode=$exitCode"
  }
} elseif ($DryRun) {
  $notes += 'Dry-run habilitado: suite de testes nao executada.'
}

$finishedAt = Get-Date
$durationSeconds = [Math]::Round(($finishedAt - $startedAt).TotalSeconds, 2)

$md = @()
$md += '# GDN-512 - Final acceptance guardian isolation'
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

if ($testOutput) {
  $md += '## Evidencia da suite'
  $md += ''
  $md += '```text'
  $md += $testOutput.Trim()
  $md += '```'
  $md += ''
}

$md += '## Resultado'
if ($status -eq 'PASS') {
  $md += '- Aceite final de isolamento Guardian (RBAC+MFA) validado com sucesso.'
} else {
  $md += '- Aceite final de isolamento Guardian com falhas.'
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
