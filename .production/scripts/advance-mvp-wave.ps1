param(
  [string]$RunDir = "",
  [string]$UpdatesCsvPath = "",
  [switch]$ImportDryRun,
  [string]$Owner = "time-comercial",
  [int]$DefaultFollowupHours = 4,
  [int]$MinAcceptedClients = 1,
  [string]$NextPilotName = "piloto-comercial-next-wave",
  [datetime]$WindowStart = (Get-Date).Date.AddDays(1).AddHours(9),
  [int]$WindowHours = 48,
  [switch]$RunKickoffChecks,
  [switch]$ForceNextWavePrep
)

$ErrorActionPreference = "Stop"
$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
$pilotRoot = Join-Path $repoRoot ".production\pilot-runs"

$commercialRoundScript = Join-Path $PSScriptRoot "run-mvp-pilot-commercial-round.ps1"
$nextWaveScript = Join-Path $PSScriptRoot "prepare-mvp-next-wave.ps1"

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

function Resolve-LatestFile {
  param(
    [string]$DirectoryPath,
    [string]$Filter
  )

  $files = @(Get-ChildItem $DirectoryPath -File -Filter $Filter | Sort-Object LastWriteTime -Descending)
  if ($files.Count -eq 0) {
    return ""
  }

  return $files[0].FullName
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
$advanceId = Get-Date -Format "yyyyMMdd-HHmmss"
$logsRoot = Join-Path $resolvedRunDir "wave-advance-runs"
$runLogsDir = Join-Path $logsRoot $advanceId
New-Item -ItemType Directory -Path $runLogsDir -Force | Out-Null

$reportPath = Join-Path $runLogsDir "summary.md"
$steps = @()
$commercialDecision = "UNKNOWN"
$nextWavePrepReport = ""
$nextWaveRunDir = ""

Write-Host "Avanco de wave MVP: $advanceId"
Write-Host "Sessao: $resolvedRunDir"

Write-Host ""
Write-Host ">> Executando rodada comercial"
$commercialArgs = @(
  "-RunDir", $resolvedRunDir,
  "-Owner", $Owner,
  "-DefaultFollowupHours", "$DefaultFollowupHours",
  "-MinAcceptedClients", "$MinAcceptedClients"
)
if ($ImportDryRun) {
  $commercialArgs += "-ImportDryRun"
}
if (-not [string]::IsNullOrWhiteSpace($UpdatesCsvPath)) {
  $commercialArgs += "-UpdatesCsvPath"
  $commercialArgs += $UpdatesCsvPath
}

$commercialExec = Invoke-PowerShellFile -ScriptPath $commercialRoundScript -ScriptArguments $commercialArgs -LogPath (Join-Path $runLogsDir "01-commercial-round.log")
if ($commercialExec.ExitCode -eq 0) {
  $latestClosure = Resolve-LatestFile -DirectoryPath $resolvedRunDir -Filter "wave-closure-*.md"
  if (-not [string]::IsNullOrWhiteSpace($latestClosure)) {
    $commercialDecision = Parse-MetricLine -Lines (Get-Content $latestClosure) -Prefix "- Resultado:"
  }
  Add-Step -Step "Rodada comercial" -Status "PASS" -Details "Decisao: $commercialDecision" -Artifact $commercialExec.LogPath
}
else {
  Add-Step -Step "Rodada comercial" -Status "FAIL" -Details "Falha ao executar rodada comercial." -Artifact $commercialExec.LogPath
}

$hasFailure = @($steps | Where-Object { $_.Status -eq "FAIL" }).Count -gt 0
if (-not $hasFailure) {
  if ($commercialDecision -eq "GO_NEXT_WAVE") {
    Write-Host ""
    Write-Host ">> Preparando proxima wave (GO_NEXT_WAVE)"
    $nextArgs = @(
      "-RunDir", $resolvedRunDir,
      "-NextPilotName", $NextPilotName,
      "-Owner", $Owner,
      "-WindowStart", $WindowStart.ToString("yyyy-MM-dd HH:mm"),
      "-WindowHours", "$WindowHours"
    )
    if ($RunKickoffChecks) {
      $nextArgs += "-RunKickoffChecks"
    }
    if ($ForceNextWavePrep) {
      $nextArgs += "-Force"
    }

    $nextExec = Invoke-PowerShellFile -ScriptPath $nextWaveScript -ScriptArguments $nextArgs -LogPath (Join-Path $runLogsDir "02-next-wave.log")
    if ($nextExec.ExitCode -eq 0) {
      $nextWavePrepReport = Resolve-LatestFile -DirectoryPath $resolvedRunDir -Filter "next-wave-prep-*.md"
      if (-not [string]::IsNullOrWhiteSpace($nextWavePrepReport)) {
        $newRunLine = Parse-MetricLine -Lines (Get-Content $nextWavePrepReport) -Prefix "- Nova sessao criada:"
        if (-not [string]::IsNullOrWhiteSpace($newRunLine) -and $newRunLine -ne "N/A") {
          $nextWaveRunDir = $newRunLine
        }
      }

      Add-Step -Step "Preparar proxima wave" -Status "PASS" -Artifact $nextExec.LogPath
    }
    else {
      Add-Step -Step "Preparar proxima wave" -Status "FAIL" -Details "Falha ao preparar proxima wave." -Artifact $nextExec.LogPath
    }
  }
  else {
    Add-Step -Step "Preparar proxima wave" -Status "SKIP" -Details "Decisao atual '$commercialDecision' ainda nao libera transicao."
  }
}
else {
  Add-Step -Step "Preparar proxima wave" -Status "SKIP" -Details "Rodada comercial falhou."
}

$table = $steps | Format-Table -AutoSize | Out-String
$recommendedCommands = @()
if ($commercialDecision -eq "GO_NEXT_WAVE") {
  if ([string]::IsNullOrWhiteSpace($nextWaveRunDir)) {
    $recommendedCommands += ".\scripts\prepare-mvp-next-wave.ps1 -RunDir `"$resolvedRunDir`" -NextPilotName `"$NextPilotName`""
  }
  else {
    $recommendedCommands += ".\scripts\run-mvp-pilot-commercial-round.ps1 -RunDir `"$nextWaveRunDir`" -ImportDryRun"
  }
}
else {
  $recommendedCommands += ".\scripts\run-mvp-pilot-commercial-round.ps1 -RunDir `"$resolvedRunDir`" -ImportDryRun"
  $recommendedCommands += ".\scripts\run-mvp-pilot-commercial-round.ps1 -RunDir `"$resolvedRunDir`" -UpdatesCsvPath `"<outreach-updates-template-<timestamp>.csv>`""
}

$summary = @"
# MVP Wave Advance Summary

Data: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
Sessao atual: $resolvedRunDir
Advance ID: $advanceId

## Resultado
- Decisao apos rodada comercial: $commercialDecision
- Next wave prep report: $(if ([string]::IsNullOrWhiteSpace($nextWavePrepReport)) { "N/A" } else { $nextWavePrepReport })
- Nova sessao (se criada): $(if ([string]::IsNullOrWhiteSpace($nextWaveRunDir)) { "N/A" } else { $nextWaveRunDir })

## Etapas
$table

## Comandos recomendados
$(@($recommendedCommands | ForEach-Object { "- $_" }) -join "`n")
"@

Set-Content -Path $reportPath -Value $summary -Encoding UTF8

$statusPath = Join-Path $resolvedRunDir "status.md"
if (Test-Path $statusPath) {
  $statusBlock = @"

## Wave advance $advanceId
- Relatorio: $reportPath
- Decisao apos rodada: $commercialDecision
- Next wave prep: $(if ([string]::IsNullOrWhiteSpace($nextWavePrepReport)) { "N/A" } else { $nextWavePrepReport })
- Nova sessao: $(if ([string]::IsNullOrWhiteSpace($nextWaveRunDir)) { "N/A" } else { $nextWaveRunDir })
"@
  Add-Content -Path $statusPath -Value $statusBlock -Encoding UTF8
}

Write-Host ""
Write-Host "Avanco de wave concluido."
Write-Host "Relatorio: $reportPath"
Write-Host "Decisao: $commercialDecision"

$failCount = @($steps | Where-Object { $_.Status -eq "FAIL" }).Count
if ($failCount -gt 0) {
  exit 1
}

exit 0
