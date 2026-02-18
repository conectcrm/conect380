param(
  [string]$RunDir = "",
  [string]$NextPilotName = "piloto-comercial-next-wave",
  [string]$Owner = "time-comercial",
  [datetime]$WindowStart = (Get-Date).Date.AddDays(1).AddHours(9),
  [int]$WindowHours = 48,
  [switch]$RunKickoffChecks,
  [switch]$Force,
  [switch]$DryRun
)

$ErrorActionPreference = "Stop"
$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
$pilotRoot = Join-Path $repoRoot ".production\pilot-runs"

$startScript = Join-Path $PSScriptRoot "start-mvp-pilot.ps1"
$recommendScript = Join-Path $PSScriptRoot "recommend-mvp-pilot-clients.ps1"
$finalizeScript = Join-Path $PSScriptRoot "finalize-mvp-pilot-clients.ps1"
$outreachScript = Join-Path $PSScriptRoot "prepare-mvp-pilot-outreach.ps1"
$followupScript = Join-Path $PSScriptRoot "prepare-mvp-pilot-outreach-followup.ps1"

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

function Resolve-LatestWaveClosure {
  param(
    [string]$PilotRunDir
  )

  $files = @(Get-ChildItem $PilotRunDir -File -Filter "wave-closure-*.md" | Sort-Object LastWriteTime -Descending)
  if ($files.Count -eq 0) {
    return [pscustomobject]@{
      Path = ""
      Decision = "UNKNOWN"
    }
  }

  $latest = $files[0]
  $decision = Parse-MetricLine -Lines (Get-Content $latest.FullName) -Prefix "- Resultado:"
  if ([string]::IsNullOrWhiteSpace($decision)) {
    $decision = "UNKNOWN"
  }

  return [pscustomobject]@{
    Path = $latest.FullName
    Decision = $decision
  }
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
$closureInfo = Resolve-LatestWaveClosure -PilotRunDir $resolvedRunDir
$roundId = Get-Date -Format "yyyyMMdd-HHmmss"
$reportPath = Join-Path $resolvedRunDir "next-wave-prep-$roundId.md"
$logsRoot = Join-Path $resolvedRunDir "next-wave-runs"
$runLogsDir = Join-Path $logsRoot $roundId
New-Item -ItemType Directory -Path $runLogsDir -Force | Out-Null

$steps = @()
$shouldProceed = $true
if ($closureInfo.Decision -ne "GO_NEXT_WAVE" -and -not $Force) {
  $shouldProceed = $false
}

Write-Host "Preparacao da proxima wave: $roundId"
Write-Host "Sessao atual: $resolvedRunDir"
Write-Host "Decisao atual: $($closureInfo.Decision)"

if (-not $shouldProceed) {
  Add-Step -Step "Gate de decisao" -Status "BLOCKED" -Details "Decisao atual nao e GO_NEXT_WAVE. Use -Force para continuar."
}
else {
  Add-Step -Step "Gate de decisao" -Status "PASS" -Details "Apto para preparar proxima wave."
}

$newRunDir = ""

if ($DryRun -or -not $shouldProceed) {
  $kickoffSkipReason = if ($DryRun) { "DryRun habilitado." } else { "Gate bloqueado." }
  Add-Step -Step "Kickoff nova sessao" -Status "SKIP" -Details $kickoffSkipReason
  Add-Step -Step "Recomendacao de clientes" -Status "SKIP" -Details "Kickoff nao executado."
  Add-Step -Step "Finalizacao de janela" -Status "SKIP" -Details "Kickoff nao executado."
  Add-Step -Step "Outreach inicial" -Status "SKIP" -Details "Kickoff nao executado."
  Add-Step -Step "Fila de follow-up" -Status "SKIP" -Details "Kickoff nao executado."
}
else {
  $existingRuns = @(Get-ChildItem $pilotRoot -Directory | Select-Object -ExpandProperty FullName)

  Write-Host ""
  Write-Host ">> Kickoff da nova sessao"
  $startArgs = @("-PilotName", $NextPilotName)
  if (-not $RunKickoffChecks) {
    $startArgs += "-SkipPreflight"
    $startArgs += "-SkipSmokes"
  }
  $startExec = Invoke-PowerShellFile -ScriptPath $startScript -ScriptArguments $startArgs -LogPath (Join-Path $runLogsDir "01-start.log")
  if ($startExec.ExitCode -eq 0) {
    $newRunDir = @(
      Get-ChildItem $pilotRoot -Directory |
        Where-Object { $existingRuns -notcontains $_.FullName } |
        Sort-Object LastWriteTime -Descending
    )[0].FullName

    Add-Step -Step "Kickoff nova sessao" -Status "PASS" -Artifact $newRunDir
  }
  else {
    Add-Step -Step "Kickoff nova sessao" -Status "FAIL" -Details "Falha no start-mvp-pilot.ps1." -Artifact $startExec.LogPath
  }

  if (-not [string]::IsNullOrWhiteSpace($newRunDir)) {
    Write-Host ""
    Write-Host ">> Recomendar clientes da nova wave"
    $recommendExec = Invoke-PowerShellFile -ScriptPath $recommendScript -ScriptArguments @("-RunDir", $newRunDir) -LogPath (Join-Path $runLogsDir "02-recommend.log")
    if ($recommendExec.ExitCode -eq 0) {
      Add-Step -Step "Recomendacao de clientes" -Status "PASS" -Artifact (Join-Path $newRunDir "clients-suggested.csv")
    }
    else {
      Add-Step -Step "Recomendacao de clientes" -Status "FAIL" -Details "Falha em recommend-mvp-pilot-clients.ps1." -Artifact $recommendExec.LogPath
    }

    $hasFailure = @($steps | Where-Object { $_.Status -eq "FAIL" }).Count -gt 0
    if (-not $hasFailure) {
      Write-Host ""
      Write-Host ">> Finalizar janela e contatos"
      $finalizeArgs = @(
        "-RunDir", $newRunDir,
        "-WindowStart", $WindowStart.ToString("yyyy-MM-dd HH:mm"),
        "-WindowHours", "$WindowHours"
      )
      $finalizeExec = Invoke-PowerShellFile -ScriptPath $finalizeScript -ScriptArguments $finalizeArgs -LogPath (Join-Path $runLogsDir "03-finalize.log")
      if ($finalizeExec.ExitCode -eq 0) {
        Add-Step -Step "Finalizacao de janela" -Status "PASS" -Artifact (Join-Path $newRunDir "clients.csv")
      }
      else {
        Add-Step -Step "Finalizacao de janela" -Status "FAIL" -Details "Falha em finalize-mvp-pilot-clients.ps1." -Artifact $finalizeExec.LogPath
      }
    }
    else {
      Add-Step -Step "Finalizacao de janela" -Status "SKIP" -Details "Existe falha em etapa anterior."
    }

    $hasFailure = @($steps | Where-Object { $_.Status -eq "FAIL" }).Count -gt 0
    if (-not $hasFailure) {
      Write-Host ""
      Write-Host ">> Gerar outreach inicial"
      $outreachExec = Invoke-PowerShellFile -ScriptPath $outreachScript -ScriptArguments @("-RunDir", $newRunDir, "-Owner", $Owner) -LogPath (Join-Path $runLogsDir "04-outreach.log")
      if ($outreachExec.ExitCode -eq 0) {
        Add-Step -Step "Outreach inicial" -Status "PASS" -Artifact (Join-Path $newRunDir "outreach.csv")
      }
      else {
        Add-Step -Step "Outreach inicial" -Status "FAIL" -Details "Falha em prepare-mvp-pilot-outreach.ps1." -Artifact $outreachExec.LogPath
      }
    }
    else {
      Add-Step -Step "Outreach inicial" -Status "SKIP" -Details "Existe falha em etapa anterior."
    }

    $hasFailure = @($steps | Where-Object { $_.Status -eq "FAIL" }).Count -gt 0
    if (-not $hasFailure) {
      Write-Host ""
      Write-Host ">> Gerar fila de follow-up"
      $followupExec = Invoke-PowerShellFile -ScriptPath $followupScript -ScriptArguments @("-RunDir", $newRunDir, "-Owner", $Owner) -LogPath (Join-Path $runLogsDir "05-followup.log")
      if ($followupExec.ExitCode -eq 0) {
        $latestFollowup = @(Get-ChildItem $newRunDir -File -Filter "outreach-followup-*.csv" | Sort-Object LastWriteTime -Descending | Select-Object -First 1)
        Add-Step -Step "Fila de follow-up" -Status "PASS" -Artifact (if ($latestFollowup.Count -gt 0) { $latestFollowup[0].FullName } else { Join-Path $newRunDir "outreach-followup-*.csv" })
      }
      else {
        Add-Step -Step "Fila de follow-up" -Status "FAIL" -Details "Falha em prepare-mvp-pilot-outreach-followup.ps1." -Artifact $followupExec.LogPath
      }
    }
    else {
      Add-Step -Step "Fila de follow-up" -Status "SKIP" -Details "Existe falha em etapa anterior."
    }
  }
  else {
    Add-Step -Step "Recomendacao de clientes" -Status "SKIP" -Details "Nova sessao nao identificada."
    Add-Step -Step "Finalizacao de janela" -Status "SKIP" -Details "Nova sessao nao identificada."
    Add-Step -Step "Outreach inicial" -Status "SKIP" -Details "Nova sessao nao identificada."
    Add-Step -Step "Fila de follow-up" -Status "SKIP" -Details "Nova sessao nao identificada."
  }
}

$table = $steps | Format-Table -AutoSize | Out-String
$nextCommands = @(
  ".\scripts\run-mvp-pilot-commercial-round.ps1 -RunDir `"$resolvedRunDir`" -ImportDryRun",
  ".\scripts\close-mvp-pilot-wave.ps1 -RunDir `"$resolvedRunDir`" -MinAcceptedClients 1"
)
if (-not [string]::IsNullOrWhiteSpace($newRunDir)) {
  $nextCommands += ".\scripts\run-mvp-pilot-commercial-round.ps1 -RunDir `"$newRunDir`" -ImportDryRun"
}

$report = @"
# MVP Next Wave Preparation

Data: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
Sessao atual: $resolvedRunDir
Wave closure atual: $($closureInfo.Path)
Decisao atual: $($closureInfo.Decision)
Modo: $(if ($DryRun) { "DryRun" } else { "Apply" })
Force: $Force

## Resultado da preparacao
- Nova sessao criada: $(if ([string]::IsNullOrWhiteSpace($newRunDir)) { "N/A" } else { $newRunDir })
- WindowStart: $($WindowStart.ToString("yyyy-MM-dd HH:mm"))
- WindowHours: $WindowHours
- Owner: $Owner

## Etapas
$table

## Comandos recomendados
$(@($nextCommands | ForEach-Object { "- $_" }) -join "`n")
"@

Set-Content -Path $reportPath -Value $report -Encoding UTF8

$statusPath = Join-Path $resolvedRunDir "status.md"
if (Test-Path $statusPath) {
  $statusBlock = @"

## Next wave prep $roundId
- Relatorio: $reportPath
- Decisao atual: $($closureInfo.Decision)
- Nova sessao: $(if ([string]::IsNullOrWhiteSpace($newRunDir)) { "N/A" } else { $newRunDir })
"@
  Add-Content -Path $statusPath -Value $statusBlock -Encoding UTF8
}

Write-Host ""
Write-Host "Preparacao de proxima wave concluida."
Write-Host "Relatorio: $reportPath"
if (-not [string]::IsNullOrWhiteSpace($newRunDir)) {
  Write-Host "Nova sessao: $newRunDir"
}

$failCount = @($steps | Where-Object { $_.Status -eq "FAIL" }).Count
$blockedCount = @($steps | Where-Object { $_.Status -eq "BLOCKED" }).Count
if ($failCount -gt 0) {
  exit 1
}
if ($blockedCount -gt 0 -and -not $DryRun) {
  exit 1
}

exit 0
