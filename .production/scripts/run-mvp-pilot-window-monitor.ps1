param(
  [string]$RunDir = "",
  [int]$WindowHours = 48,
  [int]$IntervalMinutes = 120,
  [int]$MaxCycles = 0,
  [ValidateSet("Applied", "NotApplied", "Unknown")][string]$BranchProtectionStatus = "Applied",
  [switch]$SkipDockerLogs,
  [switch]$StopOnFailure
)

$ErrorActionPreference = "Stop"
$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
$pilotRoot = Join-Path $repoRoot ".production\pilot-runs"
$cycleScript = Join-Path $PSScriptRoot "run-mvp-pilot-cycle.ps1"
$readinessScript = Join-Path $PSScriptRoot "assess-mvp-pilot-readiness.ps1"

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

function Get-LatestCycleDir {
  param(
    [string]$PilotRunDir
  )

  $cyclesRoot = Join-Path $PilotRunDir "cycles"
  if (-not (Test-Path $cyclesRoot)) {
    return ""
  }

  $latestCycle = Get-ChildItem $cyclesRoot -Directory | Sort-Object LastWriteTime -Descending | Select-Object -First 1
  if ($null -eq $latestCycle) {
    return ""
  }

  return $latestCycle.FullName
}

if ($WindowHours -lt 1) {
  throw "WindowHours deve ser maior ou igual a 1."
}
if ($IntervalMinutes -lt 1) {
  throw "IntervalMinutes deve ser maior ou igual a 1."
}

$resolvedRunDir = Resolve-RunDir -ProvidedRunDir $RunDir
$monitorId = Get-Date -Format "yyyyMMdd-HHmmss"
$monitorRoot = Join-Path (Join-Path $resolvedRunDir "monitor-runs") $monitorId
New-Item -ItemType Directory -Path $monitorRoot -Force | Out-Null

$cyclesPlanned = [math]::Ceiling(($WindowHours * 60) / $IntervalMinutes)
if ($MaxCycles -gt 0 -and $MaxCycles -lt $cyclesPlanned) {
  $cyclesPlanned = $MaxCycles
}

$records = @()

Write-Host "Monitoramento MVP iniciado."
Write-Host "Sessao: $resolvedRunDir"
Write-Host "Janela: ${WindowHours}h"
Write-Host "Intervalo: ${IntervalMinutes}min"
Write-Host "Ciclos planejados: $cyclesPlanned"
Write-Host ""

for ($i = 1; $i -le $cyclesPlanned; $i++) {
  $iterationStart = Get-Date
  $iterationId = "{0:00}" -f $i
  $logPath = Join-Path $monitorRoot "cycle-$iterationId.log"

  $args = @("-RunDir", $resolvedRunDir)
  if ($SkipDockerLogs) {
    $args += "-SkipDockerLogs"
  }

  Write-Host ">> Ciclo $i/$cyclesPlanned"
  $invoke = Invoke-PowerShellFile -ScriptPath $cycleScript -ScriptArguments $args -LogPath $logPath
  $latestCycleDir = Get-LatestCycleDir -PilotRunDir $resolvedRunDir
  $result = if ($invoke.ExitCode -eq 0) { "PASS" } else { "FAIL" }

  $records += [pscustomobject]@{
    ciclo = $i
    inicio = $iterationStart.ToString("yyyy-MM-dd HH:mm:ss")
    resultado = $result
    exit_code = $invoke.ExitCode
    cycle_dir = $latestCycleDir
    log = $invoke.LogPath
  }

  if ($invoke.ExitCode -ne 0 -and $StopOnFailure) {
    Write-Host "Falha no ciclo $i com StopOnFailure habilitado."
    break
  }

  if ($i -lt $cyclesPlanned) {
    Write-Host "Aguardando $IntervalMinutes minuto(s) para proximo ciclo..."
    Start-Sleep -Seconds ($IntervalMinutes * 60)
  }
}

$readinessLog = Join-Path $monitorRoot "readiness.log"
$readinessArgs = @(
  "-RunDir", $resolvedRunDir,
  "-BranchProtectionStatus", $BranchProtectionStatus
)
$readinessExec = Invoke-PowerShellFile -ScriptPath $readinessScript -ScriptArguments $readinessArgs -LogPath $readinessLog

$latestReadiness = ""
$latestReadinessDecision = "UNKNOWN"
$readinessFiles = Get-ChildItem $resolvedRunDir -File -Filter "readiness-*.md" | Sort-Object LastWriteTime -Descending
if ($readinessFiles.Count -gt 0) {
  $latestReadiness = $readinessFiles[0].FullName
  $decisionLine = Select-String -Path $latestReadiness -Pattern "^- Resultado:\s*(.+)$" | Select-Object -First 1
  if ($null -ne $decisionLine) {
    $latestReadinessDecision = $decisionLine.Matches[0].Groups[1].Value.Trim()
  }
}

$passCount = @($records | Where-Object { $_.resultado -eq "PASS" }).Count
$failCount = @($records | Where-Object { $_.resultado -eq "FAIL" }).Count
$endTime = Get-Date

$table = $records | Format-Table -AutoSize | Out-String
$reportPath = Join-Path $monitorRoot "summary.md"
$report = @"
# MVP Pilot Window Monitor

Data inicio: $(Get-Date -Date $records[0].inicio -Format "yyyy-MM-dd HH:mm:ss")
Data fim: $($endTime.ToString("yyyy-MM-dd HH:mm:ss"))
Sessao: $resolvedRunDir

## Configuracao
- Janela alvo: ${WindowHours}h
- Intervalo: ${IntervalMinutes}min
- Ciclos planejados: $cyclesPlanned
- Ciclos executados: $($records.Count)
- StopOnFailure: $StopOnFailure
- SkipDockerLogs: $SkipDockerLogs

## Resultado de ciclos
- PASS: $passCount
- FAIL: $failCount

## Detalhamento
$table

## Readiness final
- Exit code: $($readinessExec.ExitCode)
- Decisao: $latestReadinessDecision
- Relatorio: $latestReadiness
- Log: $readinessLog
"@

Set-Content -Path $reportPath -Value $report -Encoding UTF8

$statusPath = Join-Path $resolvedRunDir "status.md"
if (Test-Path $statusPath) {
  $statusBlock = @"

## Window monitor $monitorId
- Relatorio: $reportPath
- PASS: $passCount
- FAIL: $failCount
- Readiness: $latestReadinessDecision
"@
  Add-Content -Path $statusPath -Value $statusBlock -Encoding UTF8
}

Write-Host ""
Write-Host "Monitoramento concluido."
Write-Host "Relatorio: $reportPath"
Write-Host "PASS=$passCount FAIL=$failCount"
Write-Host "Readiness final: $latestReadinessDecision"

if ($failCount -gt 0 -or $readinessExec.ExitCode -ne 0) {
  exit 1
}

exit 0
