param(
  [switch]$DryRun = $false,
  [string]$OutputFile = ''
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$runId = Get-Date -Format 'yyyyMMdd-HHmmss'

if ([string]::IsNullOrWhiteSpace($OutputFile)) {
  $OutputFile = Join-Path $repoRoot "docs/features/evidencias/GDN503_LEGACY_READ_ONLY_$runId.md"
} elseif (-not [System.IO.Path]::IsPathRooted($OutputFile)) {
  $OutputFile = Join-Path $repoRoot $OutputFile
}

$startedAt = Get-Date
$status = 'PASS'
$notes = @()
$checks = New-Object System.Collections.Generic.List[object]
$commandEvidence = @()

$guardPath = Join-Path $repoRoot 'backend/src/common/guards/core-admin-legacy-transition.guard.ts'
$specPath = Join-Path $repoRoot 'backend/src/common/guards/core-admin-legacy-transition.guard.spec.ts'
$envPath = Join-Path $repoRoot 'backend/.env.example'

foreach ($path in @($guardPath, $specPath, $envPath)) {
  if (-not (Test-Path -Path $path)) {
    $status = 'FAIL'
    $notes += "Arquivo obrigatorio nao encontrado: $path"
  }
}

if ($status -eq 'PASS') {
  $guardContent = Get-Content -Path $guardPath -Raw
  $specContent = Get-Content -Path $specPath -Raw
  $envContent = Get-Content -Path $envPath -Raw

  $guardChecks = @(
    @{ Name = 'guard usa flag CORE_ADMIN_LEGACY_READ_ONLY'; Result = ($guardContent -match 'CORE_ADMIN_LEGACY_READ_ONLY') },
    @{ Name = 'guard retorna codigo LEGACY_ADMIN_READ_ONLY'; Result = ($guardContent -match 'LEGACY_ADMIN_READ_ONLY') },
    @{ Name = 'guard sinaliza header read-only'; Result = ($guardContent -match 'x-core-admin-legacy-read-only') }
  )
  foreach ($check in $guardChecks) {
    [void]$checks.Add([pscustomobject]@{
        Name = $check.Name
        Status = if ($check.Result) { 'PASS' } else { 'FAIL' }
      })
    if (-not $check.Result) {
      $status = 'FAIL'
      $notes += "Falha de validacao estatica no guard: $($check.Name)"
    }
  }

  $specChecks = @(
    @{ Name = 'spec cobre MethodNotAllowedException'; Result = ($specContent -match 'MethodNotAllowedException') },
    @{ Name = 'spec cobre cenarios read-only'; Result = ($specContent -match 'read-only') }
  )
  foreach ($check in $specChecks) {
    [void]$checks.Add([pscustomobject]@{
        Name = $check.Name
        Status = if ($check.Result) { 'PASS' } else { 'FAIL' }
      })
    if (-not $check.Result) {
      $status = 'FAIL'
      $notes += "Falha de validacao estatica no spec: $($check.Name)"
    }
  }

  $envCheck = ($envContent -match '(?m)^CORE_ADMIN_LEGACY_READ_ONLY=')
  [void]$checks.Add([pscustomobject]@{
      Name = 'env example declara CORE_ADMIN_LEGACY_READ_ONLY'
      Status = if ($envCheck) { 'PASS' } else { 'FAIL' }
    })
  if (-not $envCheck) {
    $status = 'FAIL'
    $notes += 'Flag CORE_ADMIN_LEGACY_READ_ONLY ausente em backend/.env.example'
  }
}

if (-not $DryRun -and $status -eq 'PASS') {
  $cmd = 'npm --prefix backend run test -- common/guards/core-admin-legacy-transition.guard.spec.ts'
  Write-Host "[GDN-503] Executando: $cmd" -ForegroundColor Cyan
  $tempStdout = New-TemporaryFile
  $tempStderr = New-TemporaryFile
  try {
    $proc = Start-Process `
      -FilePath 'cmd.exe' `
      -ArgumentList '/d', '/c', $cmd `
      -NoNewWindow `
      -Wait `
      -PassThru `
      -RedirectStandardOutput $tempStdout.FullName `
      -RedirectStandardError $tempStderr.FullName

    $out = @(
      @((Get-Content -Path $tempStdout.FullName -ErrorAction SilentlyContinue)),
      @((Get-Content -Path $tempStderr.FullName -ErrorAction SilentlyContinue))
    )
    $exitCode = $proc.ExitCode
  } finally {
    Remove-Item -Path $tempStdout.FullName, $tempStderr.FullName -ErrorAction SilentlyContinue
  }

  $commandEvidence += @(
    '### Comando',
    $cmd,
    '',
    '### Saida resumida',
    (($out | Out-String).Trim()),
    ''
  )

  if ($exitCode -ne 0) {
    $status = 'FAIL'
    $notes += "Teste do guard retornou exitCode=$exitCode"
  }
} elseif ($DryRun) {
  $notes += 'Dry-run habilitado: execucao real dos testes nao realizada.'
}

$finishedAt = Get-Date
$durationSeconds = [Math]::Round(($finishedAt - $startedAt).TotalSeconds, 2)

$md = @()
$md += '# GDN-503 - Legacy backoffice read-only freeze validation'
$md += ''
$md += "- RunId: $runId"
$md += "- Inicio: $($startedAt.ToString('yyyy-MM-dd HH:mm:ss'))"
$md += "- Fim: $($finishedAt.ToString('yyyy-MM-dd HH:mm:ss'))"
$md += "- DuracaoSegundos: $durationSeconds"
$md += "- DryRun: $(if ($DryRun) { 'true' } else { 'false' })"
$md += "- Status: $status"
$md += ''
$md += '## Checklist de validacao'
foreach ($item in $checks) {
  $md += "- [$($item.Status)] $($item.Name)"
}
$md += ''

if ($notes.Count -gt 0) {
  $md += '## Observacoes'
  foreach ($note in $notes) {
    $md += "- $note"
  }
  $md += ''
}

if ($commandEvidence.Count -gt 0) {
  $md += '## Evidencias de execucao'
  $md += ''
  $md += $commandEvidence
}

$md += '## Resultado'
if ($status -eq 'PASS') {
  $md += '- Freeze read-only do legado validado com sucesso.'
} else {
  $md += '- Freeze read-only do legado com falhas. Revisar observacoes.'
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

