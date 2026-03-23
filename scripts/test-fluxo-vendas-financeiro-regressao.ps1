param(
  [Parameter(Mandatory = $false)]
  [string]$OutputFile = '',

  [Parameter(Mandatory = $false)]
  [switch]$SkipConciliacao = $false,

  [Parameter(Mandatory = $false)]
  [switch]$SkipFrontend = $false,

  [Parameter(Mandatory = $false)]
  [switch]$StopOnFailure = $false
)

$ErrorActionPreference = 'Stop'
$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path

if ([string]::IsNullOrWhiteSpace($OutputFile)) {
  $timestamp = Get-Date -Format 'yyyyMMdd-HHmmss'
  $OutputFile = Join-Path $repoRoot "docs/features/RELATORIO_REGRESSAO_FLUXO_VENDAS_FINANCEIRO_$timestamp.md"
} elseif (-not [System.IO.Path]::IsPathRooted($OutputFile)) {
  $OutputFile = Join-Path $repoRoot $OutputFile
}

function Invoke-NpmStep {
  param(
    [string]$Id,
    [string]$Nome,
    [string]$Workdir,
    [string[]]$CommandArgs,
    [hashtable]$EnvVars
  )

  $envBackup = @{}
  if ($null -ne $EnvVars) {
    foreach ($key in $EnvVars.Keys) {
      $existing = Get-Item -Path "Env:$key" -ErrorAction SilentlyContinue
      $envBackup[$key] = if ($null -eq $existing) { $null } else { $existing.Value }
      Set-Item -Path "Env:$key" -Value $EnvVars[$key]
    }
  }

  $stopwatch = [System.Diagnostics.Stopwatch]::StartNew()
  $exitCode = 0
  $errorMessage = ''
  $nativePrefVar = Get-Variable -Name PSNativeCommandUseErrorActionPreference -ErrorAction SilentlyContinue
  $nativePrefBackup = $null
  if ($null -ne $nativePrefVar) {
    $nativePrefBackup = $PSNativeCommandUseErrorActionPreference
    $PSNativeCommandUseErrorActionPreference = $false
  }

  try {
    $process = Start-Process -FilePath 'npm.cmd' -ArgumentList $CommandArgs -WorkingDirectory $Workdir -NoNewWindow -Wait -PassThru
    $exitCode = $process.ExitCode
  } catch {
    $exitCode = 1
    $errorMessage = $_.Exception.Message
  } finally {
    if ($null -ne $nativePrefVar) {
      $PSNativeCommandUseErrorActionPreference = $nativePrefBackup
    }
    if ($null -ne $EnvVars) {
      foreach ($key in $EnvVars.Keys) {
        if ($null -eq $envBackup[$key]) {
          Remove-Item -Path "Env:$key" -ErrorAction SilentlyContinue
        } else {
          Set-Item -Path "Env:$key" -Value $envBackup[$key]
        }
      }
    }
    $stopwatch.Stop()
  }

  return [PSCustomObject]@{
    Id = $Id
    Nome = $Nome
    Workdir = $Workdir
    Comando = "npm $($CommandArgs -join ' ')"
    Resultado = if ($exitCode -eq 0) { 'PASS' } else { 'FAIL' }
    ExitCode = $exitCode
    DuracaoSegundos = [Math]::Round($stopwatch.Elapsed.TotalSeconds, 2)
    Erro = $errorMessage
  }
}

$backendDir = Join-Path $repoRoot 'backend'
$frontendDir = Join-Path $repoRoot 'frontend-web'
$steps = @(
  [PSCustomObject]@{
    Id = 'REG-001'
    Nome = 'E2E vendas/faturamento/webhook gateway'
    Workdir = $backendDir
    CommandArgs = @('run', 'test:e2e', '--', './propostas/faturamento-pagamentos-gateway.e2e-spec.ts')
    EnvVars = $null
  }
  [PSCustomObject]@{
    Id = 'REG-002'
    Nome = 'E2E financeiro contas a pagar/exportacao'
    Workdir = $backendDir
    CommandArgs = @('run', 'test:e2e', '--', './financeiro/contas-pagar.e2e-spec.ts')
    EnvVars = $null
  }
  [PSCustomObject]@{
    Id = 'REG-003'
    Nome = 'Unit webhook gateway'
    Workdir = $backendDir
    CommandArgs = @('run', 'test', '--', 'gateway-webhook.service.spec.ts', 'gateway-webhook.controller.spec.ts', '--runInBand')
    EnvVars = $null
  }
  [PSCustomObject]@{
    Id = 'REG-004'
    Nome = 'Unit monitor/alertas financeiros'
    Workdir = $backendDir
    CommandArgs = @('run', 'test', '--', 'alerta-operacional-financeiro.service.spec.ts', 'alerta-operacional-financeiro.controller.spec.ts', 'alerta-operacional-financeiro-monitor.service.spec.ts', '--runInBand')
    EnvVars = $null
  }
)

if (-not $SkipConciliacao) {
  $steps += [PSCustomObject]@{
    Id = 'REG-005'
    Nome = 'E2E conciliacao bancaria'
    Workdir = $backendDir
    CommandArgs = @('run', 'test:e2e', '--', './financeiro/conciliacao-bancaria.e2e-spec.ts')
    EnvVars = $null
  }
}

if (-not $SkipFrontend) {
  $steps += [PSCustomObject]@{
    Id = 'REG-006'
    Nome = 'Frontend contratos/estado financeiro'
    Workdir = $frontendDir
    CommandArgs = @(
      'test',
      '--',
      '--watch=false',
      '--runInBand',
      'src/services/__tests__/contasPagarService.test.ts',
      'src/services/__tests__/alertasOperacionaisFinanceiroService.test.ts',
      'src/features/dashboard-v2/__tests__/financeiro-alertas-state.test.ts',
      'src/features/dashboard-v2/__tests__/financeiro-alertas-reprocessamento.test.ts'
    )
    EnvVars = @{ CI = 'true' }
  }
}

$runId = Get-Date -Format 'yyyyMMdd-HHmmss'
$startedAt = Get-Date
$results = @()

Write-Host ''
Write-Host '===============================================' -ForegroundColor Cyan
Write-Host ' Regressao Automatizada - Fluxo Vendas/Financeiro' -ForegroundColor Cyan
Write-Host '===============================================' -ForegroundColor Cyan
Write-Host "RunId: $runId"
Write-Host "Repositorio: $repoRoot"
Write-Host ''

foreach ($step in $steps) {
  Write-Host "[$($step.Id)] $($step.Nome)" -ForegroundColor Yellow
  $result = Invoke-NpmStep -Id $step.Id -Nome $step.Nome -Workdir $step.Workdir -CommandArgs $step.CommandArgs -EnvVars $step.EnvVars
  $results += $result

  if ($result.Resultado -eq 'PASS') {
    Write-Host "  PASS ($($result.DuracaoSegundos)s)"
  } else {
    Write-Host "  FAIL (exit=$($result.ExitCode), $($result.DuracaoSegundos)s)" -ForegroundColor Red
    if (-not [string]::IsNullOrWhiteSpace($result.Erro)) {
      Write-Host "  Erro: $($result.Erro)" -ForegroundColor Red
    }
    if ($StopOnFailure) {
      Write-Host 'Interrompido por -StopOnFailure.' -ForegroundColor Red
      break
    }
  }
}

$finishedAt = Get-Date
$total = $results.Count
$pass = ($results | Where-Object { $_.Resultado -eq 'PASS' }).Count
$fail = $total - $pass

Write-Host ''
Write-Host "Resumo: PASS=$pass FAIL=$fail TOTAL=$total"
Write-Host ''

$outputDir = Split-Path -Path $OutputFile -Parent
if (-not [string]::IsNullOrWhiteSpace($outputDir) -and -not (Test-Path $outputDir)) {
  New-Item -Path $outputDir -ItemType Directory -Force | Out-Null
}

$md = @()
$md += '# Relatorio de regressao - Fluxo Vendas -> Financeiro'
$md += ''
$md += "- RunId: $runId"
$md += "- Inicio: $($startedAt.ToString('yyyy-MM-dd HH:mm:ss'))"
$md += "- Fim: $($finishedAt.ToString('yyyy-MM-dd HH:mm:ss'))"
$md += "- Total: $total"
$md += "- PASS: $pass"
$md += "- FAIL: $fail"
$md += ''
$md += '| ID | Suite | Resultado | Duracao (s) | ExitCode |'
$md += '| --- | --- | --- | ---: | ---: |'

foreach ($item in $results) {
  $md += "| $($item.Id) | $($item.Nome) | $($item.Resultado) | $($item.DuracaoSegundos) | $($item.ExitCode) |"
}

$md += ''
$md += '## Comandos executados'
$md += ''
foreach ($item in $results) {
  $md += "- $($item.Id): cd $($item.Workdir) && $($item.Comando)"
}

$md += ''
$md += '## Resultado'
$md += ''
$md += if ($fail -eq 0) { 'Regressao automatizada concluida sem falhas.' } else { 'Regressao automatizada com falhas. Verificar suites com resultado FAIL.' }

Set-Content -Path $OutputFile -Value $md -Encoding UTF8
Write-Host "Relatorio salvo em: $OutputFile"

if ($fail -gt 0) {
  exit 1
}

exit 0
