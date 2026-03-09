param(
  [switch]$DryRun = $false,
  [string]$OutputFile = ''
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$runId = Get-Date -Format 'yyyyMMdd-HHmmss'

if ([string]::IsNullOrWhiteSpace($OutputFile)) {
  $OutputFile = Join-Path $repoRoot "docs/features/evidencias/GDN511_ENTITLEMENT_ACCEPTANCE_$runId.md"
} elseif (-not [System.IO.Path]::IsPathRooted($OutputFile)) {
  $OutputFile = Join-Path $repoRoot $OutputFile
}

$startedAt = Get-Date
$status = 'PASS'
$checks = @()
$notes = @()

$middlewarePath = Join-Path $repoRoot 'backend/src/modules/common/assinatura.middleware.ts'
$testCommand = 'npm --prefix backend run test -- modules/common/assinatura.middleware.spec.ts modules/planos/subscription-state-machine.spec.ts modules/planos/assinaturas.controller.spec.ts'

if (-not (Test-Path -Path $middlewarePath)) {
  $status = 'FAIL'
  $notes += "Arquivo de middleware nao encontrado: $middlewarePath"
} else {
  $content = Get-Content -Path $middlewarePath -Raw
  foreach ($token in @('NO_SUBSCRIPTION', 'SUBSCRIPTION_INACTIVE', 'MODULE_NOT_INCLUDED', 'SUBSCRIPTION_CHECK_FAILED')) {
    $pass = $content -match [regex]::Escape($token)
    $checks += [PSCustomObject]@{
      Name = "entitlement error code presente: $token"
      Pass = $pass
      Detail = if ($pass) { 'ok' } else { 'missing' }
    }
    if (-not $pass) {
      $status = 'FAIL'
      $notes += "Codigo de erro ausente no middleware: $token"
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
    Name = 'suite de testes entitlement backend'
    Pass = $pass
    Detail = "exitCode=$exitCode"
  }
  if (-not $pass) {
    $status = 'FAIL'
    $notes += "Suite entitlement falhou com exitCode=$exitCode"
  }
} elseif ($DryRun) {
  $notes += 'Dry-run habilitado: suite de testes nao executada.'
}

$finishedAt = Get-Date
$durationSeconds = [Math]::Round(($finishedAt - $startedAt).TotalSeconds, 2)

$md = @()
$md += '# GDN-511 - Final acceptance entitlement backend'
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
  $md += '- Aceite final de entitlement backend validado com sucesso.'
} else {
  $md += '- Aceite final de entitlement backend com falhas.'
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
