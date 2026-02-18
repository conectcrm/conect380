param(
  [string]$RunDir = "",
  [string]$Owner = "time-comercial",
  [int]$DefaultFollowupHours = 4,
  [string]$UpdatesCsvPath = "",
  [switch]$SkipImport,
  [switch]$ImportDryRun,
  [switch]$SkipIfAlreadyFinal,
  [int]$MinAcceptedClients = 1
)

$ErrorActionPreference = "Stop"
$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
$pilotRoot = Join-Path $repoRoot ".production\pilot-runs"

$followupScript = Join-Path $PSScriptRoot "prepare-mvp-pilot-outreach-followup.ps1"
$importScript = Join-Path $PSScriptRoot "import-mvp-pilot-outreach-updates.ps1"
$closeScript = Join-Path $PSScriptRoot "close-mvp-pilot-wave.ps1"
$snapshotScript = Join-Path $PSScriptRoot "snapshot-mvp-wave-status.ps1"

function Resolve-RunDir {
  param(
    [string]$ProvidedRunDir
  )

  if (-not [string]::IsNullOrWhiteSpace($ProvidedRunDir)) {
    if (-not (Test-Path $ProvidedRunDir)) {
      throw "RunDir nao encontrado: $ProvidedRunDir"
    }
    return (Resolve-Path $ProvidedRunDir).Path
  }

  if (-not (Test-Path $pilotRoot)) {
    throw "Nenhuma pasta de piloto encontrada em $pilotRoot."
  }

  $latest = Get-ChildItem $pilotRoot -Directory | Sort-Object LastWriteTime -Descending | Select-Object -First 1
  if ($null -eq $latest) {
    throw "Nenhuma sessao de piloto encontrada em $pilotRoot."
  }

  return $latest.FullName
}

function Parse-MetricLine {
  param(
    [string[]]$Lines,
    [string]$Prefix
  )

  $match = $Lines | Where-Object { $_ -like "$Prefix*" } | Select-Object -First 1
  if ($null -eq $match) {
    return ""
  }

  return $match.Substring($Prefix.Length).Trim()
}

function Invoke-PowerShellFile {
  param(
    [string]$ScriptPath,
    [string[]]$ScriptArguments,
    [string]$LogPath
  )

  $shell = (Get-Command pwsh -ErrorAction SilentlyContinue | Select-Object -First 1).Source
  if ([string]::IsNullOrWhiteSpace($shell)) {
    $shell = (Get-Command powershell -ErrorAction SilentlyContinue | Select-Object -First 1).Source
  }
  if ([string]::IsNullOrWhiteSpace($shell)) {
    throw "Nao foi possivel localizar pwsh/powershell."
  }

  $stdoutPath = "$LogPath.stdout"
  $stderrPath = "$LogPath.stderr"
  $argList = @("-NoProfile", "-ExecutionPolicy", "Bypass", "-File", $ScriptPath) + $ScriptArguments

  $proc = Start-Process `
    -FilePath $shell `
    -ArgumentList $argList `
    -Wait `
    -PassThru `
    -NoNewWindow `
    -RedirectStandardOutput $stdoutPath `
    -RedirectStandardError $stderrPath

  $combined = @()
  if (Test-Path $stdoutPath) {
    $combined += Get-Content $stdoutPath
  }
  if (Test-Path $stderrPath) {
    $combined += Get-Content $stderrPath
  }

  $combined | Set-Content -Path $LogPath -Encoding UTF8
  Remove-Item $stdoutPath -ErrorAction SilentlyContinue
  Remove-Item $stderrPath -ErrorAction SilentlyContinue

  return [pscustomobject]@{
    ExitCode = $proc.ExitCode
    LogPath = $LogPath
  }
}

function Add-Step {
  param(
    [string]$Step,
    [string]$Status,
    [string]$Details = "",
    [string]$Artifact = ""
  )

  $script:steps += [pscustomobject]@{
    Step = $Step
    Status = $Status
    Details = $Details
    Artifact = $Artifact
  }
}

$resolvedRunDir = Resolve-RunDir -ProvidedRunDir $RunDir
$roundId = Get-Date -Format "yyyyMMdd-HHmmss"
$logsDir = Join-Path $resolvedRunDir "commercial-round-runs"
$runLogsDir = Join-Path $logsDir $roundId
New-Item -ItemType Directory -Path $runLogsDir -Force | Out-Null

$followupCsvPath = Join-Path $resolvedRunDir "outreach-followup-$roundId.csv"
$followupMdPath = Join-Path $resolvedRunDir "outreach-followup-$roundId.md"
$closurePath = Join-Path $resolvedRunDir "wave-closure-$roundId.md"
$snapshotPath = Join-Path $resolvedRunDir "wave-status-$roundId.md"
$roundSummaryPath = Join-Path $runLogsDir "summary.md"

$steps = @()

Write-Host "Rodada comercial MVP: $roundId"
Write-Host "Sessao: $resolvedRunDir"
Write-Host ""

Write-Host ">> Preparando fila de follow-up"
$followupArgs = @(
  "-RunDir", $resolvedRunDir,
  "-Owner", $Owner,
  "-DefaultFollowupHours", "$DefaultFollowupHours",
  "-OutputCsvPath", $followupCsvPath,
  "-OutputMdPath", $followupMdPath
)
$followupExec = Invoke-PowerShellFile -ScriptPath $followupScript -ScriptArguments $followupArgs -LogPath (Join-Path $runLogsDir "01-followup.log")
if ($followupExec.ExitCode -eq 0) {
  Add-Step -Step "Preparar follow-up" -Status "PASS" -Artifact "$followupMdPath; $followupCsvPath"
}
else {
  Add-Step -Step "Preparar follow-up" -Status "FAIL" -Details "Falha ao gerar fila de follow-up." -Artifact $followupExec.LogPath
}

if (-not $SkipImport -and $followupExec.ExitCode -eq 0) {
  $importSource = $UpdatesCsvPath
  if ([string]::IsNullOrWhiteSpace($importSource)) {
    $importSource = $followupCsvPath
  }

  Write-Host ""
  Write-Host ">> Importando atualizacoes de convite"
  $importArgs = @(
    "-RunDir", $resolvedRunDir,
    "-UpdatesCsvPath", $importSource
  )
  if ($ImportDryRun) {
    $importArgs += "-DryRun"
  }
  if ($SkipIfAlreadyFinal) {
    $importArgs += "-SkipIfAlreadyFinal"
  }

  $importExec = Invoke-PowerShellFile -ScriptPath $importScript -ScriptArguments $importArgs -LogPath (Join-Path $runLogsDir "02-import.log")
  if ($importExec.ExitCode -eq 0) {
    $importMode = if ($ImportDryRun) { "DRYRUN" } else { "APPLY" }
    Add-Step -Step "Importar atualizacoes" -Status "PASS" -Details "Modo: $importMode" -Artifact $importExec.LogPath
  }
  else {
    Add-Step -Step "Importar atualizacoes" -Status "FAIL" -Details "Falha na importacao de atualizacoes." -Artifact $importExec.LogPath
  }
}
else {
  if ($SkipImport) {
    Add-Step -Step "Importar atualizacoes" -Status "SKIP" -Details "SkipImport habilitado."
  }
  else {
    Add-Step -Step "Importar atualizacoes" -Status "SKIP" -Details "Etapa anterior falhou."
  }
}

$hasFailure = @($steps | Where-Object { $_.Status -eq "FAIL" }).Count -gt 0

if (-not $hasFailure) {
  Write-Host ""
  Write-Host ">> Recalculando fechamento da wave"
  $closeArgs = @(
    "-RunDir", $resolvedRunDir,
    "-MinAcceptedClients", "$MinAcceptedClients",
    "-OutputPath", $closurePath
  )
  $closeExec = Invoke-PowerShellFile -ScriptPath $closeScript -ScriptArguments $closeArgs -LogPath (Join-Path $runLogsDir "03-close.log")
  if ($closeExec.ExitCode -eq 0) {
    Add-Step -Step "Fechar wave" -Status "PASS" -Artifact $closurePath
  }
  else {
    Add-Step -Step "Fechar wave" -Status "FAIL" -Details "Falha no fechamento da wave." -Artifact $closeExec.LogPath
  }
}
else {
  Add-Step -Step "Fechar wave" -Status "SKIP" -Details "Existe falha em etapa anterior."
}

$hasFailure = @($steps | Where-Object { $_.Status -eq "FAIL" }).Count -gt 0
if (-not $hasFailure) {
  Write-Host ""
  Write-Host ">> Gerando snapshot da wave"
  $snapshotArgs = @(
    "-RunDir", $resolvedRunDir,
    "-OutputPath", $snapshotPath
  )
  $snapshotExec = Invoke-PowerShellFile -ScriptPath $snapshotScript -ScriptArguments $snapshotArgs -LogPath (Join-Path $runLogsDir "04-snapshot.log")
  if ($snapshotExec.ExitCode -eq 0) {
    Add-Step -Step "Gerar snapshot" -Status "PASS" -Artifact $snapshotPath
  }
  else {
    Add-Step -Step "Gerar snapshot" -Status "FAIL" -Details "Falha ao gerar snapshot." -Artifact $snapshotExec.LogPath
  }
}
else {
  Add-Step -Step "Gerar snapshot" -Status "SKIP" -Details "Existe falha em etapa anterior."
}

$closureDecision = "UNKNOWN"
if (Test-Path $closurePath) {
  $closureLines = Get-Content $closurePath
  $closureDecision = Parse-MetricLine -Lines $closureLines -Prefix "- Resultado:"
}

$table = $steps | Format-Table -AutoSize | Out-String
$summary = @"
# MVP Commercial Round Summary

Data: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
Sessao: $resolvedRunDir
Round ID: $roundId

## Resultado
- Decisao de fechamento: $closureDecision
- Follow-up CSV: $followupCsvPath
- Follow-up MD: $followupMdPath
- Fechamento: $closurePath
- Snapshot: $snapshotPath

## Etapas
$table
"@

Set-Content -Path $roundSummaryPath -Value $summary -Encoding UTF8

$statusPath = Join-Path $resolvedRunDir "status.md"
if (Test-Path $statusPath) {
  $statusBlock = @"

## Commercial round $roundId
- Relatorio: $roundSummaryPath
- Decisao: $closureDecision
- Follow-up CSV: $followupCsvPath
- Fechamento: $closurePath
- Snapshot: $snapshotPath
"@
  Add-Content -Path $statusPath -Value $statusBlock -Encoding UTF8
}

Write-Host ""
Write-Host "Rodada comercial concluida."
Write-Host "Resumo: $roundSummaryPath"
Write-Host "Decisao: $closureDecision"

$finalFailures = @($steps | Where-Object { $_.Status -eq "FAIL" }).Count
if ($finalFailures -gt 0) {
  exit 1
}

exit 0
