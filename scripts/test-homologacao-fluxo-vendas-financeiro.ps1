param(
  [Parameter(Mandatory = $false)]
  [string]$EmpresaId = '',

  [Parameter(Mandatory = $false)]
  [string]$WebhookSecret = '',

  [Parameter(Mandatory = $false)]
  [string]$ReferenciaGatewayAprovado = '',

  [Parameter(Mandatory = $false)]
  [string]$ReferenciaGatewayRejeitado = '',

  [Parameter(Mandatory = $false)]
  [ValidateSet('mercado_pago', 'stripe', 'pagseguro')]
  [string]$Gateway = 'pagseguro',

  [Parameter(Mandatory = $false)]
  [string]$BaseUrl = 'http://localhost:3001',

  [Parameter(Mandatory = $false)]
  [switch]$ColetarEvidenciasSql = $false,

  [Parameter(Mandatory = $false)]
  [string]$PostgresContainer = '',

  [Parameter(Mandatory = $false)]
  [string]$PostgresUser = 'postgres',

  [Parameter(Mandatory = $false)]
  [string]$PostgresDatabase = 'conectcrm',

  [Parameter(Mandatory = $false)]
  [switch]$SkipAp301 = $false,

  [Parameter(Mandatory = $false)]
  [switch]$SkipRegressao = $false,

  [Parameter(Mandatory = $false)]
  [switch]$DryRun = $false,

  [Parameter(Mandatory = $false)]
  [string]$OutputDir = 'docs/features/evidencias'
)

$ErrorActionPreference = 'Stop'
$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path

if (-not [System.IO.Path]::IsPathRooted($OutputDir)) {
  $OutputDir = Join-Path $repoRoot $OutputDir
}

if (-not (Test-Path $OutputDir)) {
  New-Item -Path $OutputDir -ItemType Directory -Force | Out-Null
}

$runId = Get-Date -Format 'yyyyMMdd-HHmmss'
$startedAt = Get-Date

$ap301EvidenceFile = Join-Path $OutputDir "AP301_HOMOLOGACAO_ASSISTIDA_$runId.md"
$regressaoEvidenceFile = Join-Path $OutputDir "REGRESSAO_FLUXO_VENDAS_FINANCEIRO_$runId.md"
$consolidadoFile = Join-Path $OutputDir "HOMOLOGACAO_FLUXO_VENDAS_FINANCEIRO_$runId.md"

function Invoke-StepProcess {
  param(
    [string]$Id,
    [string]$Nome,
    [string]$FilePath,
    [string[]]$CommandArgs,
    [string]$WorkingDirectory
  )

  $sw = [System.Diagnostics.Stopwatch]::StartNew()
  $exitCode = 0
  $erro = ''

  try {
    $proc = Start-Process -FilePath $FilePath -ArgumentList $CommandArgs -WorkingDirectory $WorkingDirectory -NoNewWindow -Wait -PassThru
    $exitCode = $proc.ExitCode
  } catch {
    $exitCode = 1
    $erro = $_.Exception.Message
  } finally {
    $sw.Stop()
  }

  return [PSCustomObject]@{
    Id = $Id
    Nome = $Nome
    Resultado = if ($exitCode -eq 0) { 'PASS' } else { 'FAIL' }
    ExitCode = $exitCode
    DuracaoSegundos = [Math]::Round($sw.Elapsed.TotalSeconds, 2)
    Erro = $erro
  }
}

function Build-SafeCommandLine {
  param(
    [string]$FilePath,
    [string[]]$CommandArgs
  )

  if (-not $CommandArgs) {
    return $FilePath
  }

  $safeArgs = New-Object System.Collections.Generic.List[string]
  for ($i = 0; $i -lt $CommandArgs.Count; $i++) {
    $arg = [string]$CommandArgs[$i]
    $safeArgs.Add($arg)

    if ($arg -eq '-WebhookSecret') {
      if ($i + 1 -lt $CommandArgs.Count) {
        $safeArgs.Add('***')
        $i++
      }
    }
  }

  return "$FilePath $($safeArgs -join ' ')"
}

Write-Host ''
Write-Host '====================================================' -ForegroundColor Cyan
Write-Host ' Homologacao Integrada - Fluxo Vendas -> Financeiro' -ForegroundColor Cyan
Write-Host '====================================================' -ForegroundColor Cyan
Write-Host "RunId: $runId"
Write-Host "OutputDir: $OutputDir"
Write-Host ''

$steps = @()

if (-not $SkipAp301) {
  if ([string]::IsNullOrWhiteSpace($EmpresaId) -or [string]::IsNullOrWhiteSpace($WebhookSecret) -or [string]::IsNullOrWhiteSpace($ReferenciaGatewayAprovado)) {
    if (-not $DryRun) {
      throw 'Para executar AP-301 sem -DryRun, informe: -EmpresaId, -WebhookSecret e -ReferenciaGatewayAprovado.'
    }
  }

  $ap301Args = @(
    '-ExecutionPolicy', 'Bypass',
    '-File', (Join-Path $repoRoot 'scripts/test-ap301-webhook-homologacao.ps1'),
    '-EmpresaId', $EmpresaId,
    '-WebhookSecret', $WebhookSecret,
    '-ReferenciaGatewayAprovado', $ReferenciaGatewayAprovado,
    '-Gateway', $Gateway,
    '-BaseUrl', $BaseUrl,
    '-OutputFile', $ap301EvidenceFile
  )

  if (-not [string]::IsNullOrWhiteSpace($ReferenciaGatewayRejeitado)) {
    $ap301Args += @('-ReferenciaGatewayRejeitado', $ReferenciaGatewayRejeitado)
  }

  if ($ColetarEvidenciasSql) {
    $ap301Args += '-ColetarEvidenciasSql'
    if (-not [string]::IsNullOrWhiteSpace($PostgresContainer)) {
      $ap301Args += @('-PostgresContainer', $PostgresContainer)
    }
    if (-not [string]::IsNullOrWhiteSpace($PostgresUser)) {
      $ap301Args += @('-PostgresUser', $PostgresUser)
    }
    if (-not [string]::IsNullOrWhiteSpace($PostgresDatabase)) {
      $ap301Args += @('-PostgresDatabase', $PostgresDatabase)
    }
  }

    $steps += [PSCustomObject]@{
      Id = 'HOMO-001'
      Nome = 'AP-301 webhook homologacao assistida'
      FilePath = 'powershell.exe'
      CommandArgs = $ap301Args
      WorkingDirectory = $repoRoot
      EvidenceFile = $ap301EvidenceFile
    }
}

if (-not $SkipRegressao) {
  $regArgs = @(
    '-ExecutionPolicy', 'Bypass',
    '-File', (Join-Path $repoRoot 'scripts/test-fluxo-vendas-financeiro-regressao.ps1'),
    '-OutputFile', $regressaoEvidenceFile
  )

  $steps += [PSCustomObject]@{
    Id = 'HOMO-002'
    Nome = 'Regressao integrada Vendas -> Financeiro'
    FilePath = 'powershell.exe'
    CommandArgs = $regArgs
    WorkingDirectory = $repoRoot
    EvidenceFile = $regressaoEvidenceFile
  }
}

$results = @()

if ($DryRun) {
  Write-Host 'Modo DryRun ativo: nenhum teste foi executado.' -ForegroundColor Yellow
  foreach ($step in $steps) {
    $results += [PSCustomObject]@{
      Id = $step.Id
      Nome = $step.Nome
      Resultado = 'SKIPPED'
      ExitCode = 0
      DuracaoSegundos = 0
      Erro = ''
      EvidenceFile = $step.EvidenceFile
      CommandLine = Build-SafeCommandLine -FilePath $step.FilePath -CommandArgs $step.CommandArgs
    }
  }
} else {
  foreach ($step in $steps) {
    Write-Host "[$($step.Id)] $($step.Nome)" -ForegroundColor Yellow
    $res = Invoke-StepProcess -Id $step.Id -Nome $step.Nome -FilePath $step.FilePath -CommandArgs $step.CommandArgs -WorkingDirectory $step.WorkingDirectory
    $results += [PSCustomObject]@{
      Id = $res.Id
      Nome = $res.Nome
      Resultado = $res.Resultado
      ExitCode = $res.ExitCode
      DuracaoSegundos = $res.DuracaoSegundos
      Erro = $res.Erro
      EvidenceFile = $step.EvidenceFile
      CommandLine = Build-SafeCommandLine -FilePath $step.FilePath -CommandArgs $step.CommandArgs
    }

    if ($res.Resultado -eq 'PASS') {
      Write-Host "  PASS ($($res.DuracaoSegundos)s)"
    } else {
      Write-Host "  FAIL (exit=$($res.ExitCode), $($res.DuracaoSegundos)s)" -ForegroundColor Red
      if (-not [string]::IsNullOrWhiteSpace($res.Erro)) {
        Write-Host "  Erro: $($res.Erro)" -ForegroundColor Red
      }
    }
  }
}

$finishedAt = Get-Date
$total = $results.Count
$pass = @($results | Where-Object { $_.Resultado -eq 'PASS' }).Count
$fail = @($results | Where-Object { $_.Resultado -eq 'FAIL' }).Count
$skipped = @($results | Where-Object { $_.Resultado -eq 'SKIPPED' }).Count

$md = @()
$md += '# Relatorio consolidado - Homologacao Fluxo Vendas -> Financeiro'
$md += ''
$md += "- RunId: $runId"
$md += "- Inicio: $($startedAt.ToString('yyyy-MM-dd HH:mm:ss'))"
$md += "- Fim: $($finishedAt.ToString('yyyy-MM-dd HH:mm:ss'))"
$md += "- Ambiente base: $BaseUrl"
$md += "- EmpresaId: $(if ([string]::IsNullOrWhiteSpace($EmpresaId)) { '-' } else { $EmpresaId })"
$md += "- DryRun: $(if ($DryRun) { 'true' } else { 'false' })"
$md += "- Total steps: $total"
$md += "- PASS: $pass"
$md += "- FAIL: $fail"
$md += "- SKIPPED: $skipped"
$md += ''
$md += '| ID | Etapa | Resultado | Duracao (s) | ExitCode | Evidencia |'
$md += '| --- | --- | --- | ---: | ---: | --- |'

foreach ($item in $results) {
  $evidenceRel = if ([string]::IsNullOrWhiteSpace($item.EvidenceFile)) { '-' } else { $item.EvidenceFile.Replace($repoRoot + '\', '') }
  $md += "| $($item.Id) | $($item.Nome) | $($item.Resultado) | $($item.DuracaoSegundos) | $($item.ExitCode) | $evidenceRel |"
}

$md += ''
$md += '## Comandos executados'
$md += ''
foreach ($item in $results) {
  $md += "- $($item.Id): $($item.CommandLine)"
}

$md += ''
$md += '## Resultado final'
$md += ''
if ($DryRun) {
  $md += 'Pacote de homologacao pronto para execucao real em sandbox/real.'
} elseif ($fail -eq 0) {
  $md += 'Homologacao automatizada concluida sem falhas nas etapas executadas.'
} else {
  $md += 'Homologacao com falhas. Revisar etapas FAIL e repetir execucao apos correcao.'
}

Set-Content -Path $consolidadoFile -Value $md -Encoding UTF8

Write-Host ''
Write-Host "Relatorio consolidado: $consolidadoFile"
Write-Host "Resumo: PASS=$pass FAIL=$fail SKIPPED=$skipped TOTAL=$total"
Write-Host ''

if (-not $DryRun -and $fail -gt 0) {
  exit 1
}

exit 0
