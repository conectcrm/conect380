param(
  [string]$RunDir = "",
  [string]$BackendHealthUrl = "http://localhost:3001/health",
  [string]$FrontendUrl = "http://localhost:3000",
  [string]$AdminEmail = "admin@conectsuite.com.br",
  [string]$AdminPassword = "admin123",
  [string]$Responsavel = "time-oncall",
  [switch]$SkipCoreSmoke,
  [switch]$SkipUiSmoke,
  [switch]$SkipDockerLogs
)

$ErrorActionPreference = "Stop"
$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
$pilotRoot = Join-Path $repoRoot ".production\pilot-runs"
$recordEvidenceScript = Join-Path $PSScriptRoot "record-mvp-pilot-evidence.ps1"

function Resolve-RunDirectory {
  param(
    [string]$ProvidedRunDir,
    [string]$PilotRunsRoot
  )

  if (-not [string]::IsNullOrWhiteSpace($ProvidedRunDir)) {
    if (-not (Test-Path $ProvidedRunDir)) {
      throw "RunDir nao encontrado: $ProvidedRunDir"
    }
    return (Resolve-Path $ProvidedRunDir).Path
  }

  if (-not (Test-Path $PilotRunsRoot)) {
    throw "Nenhuma pasta de piloto encontrada em $PilotRunsRoot."
  }

  $latest = Get-ChildItem $PilotRunsRoot -Directory | Sort-Object LastWriteTime -Descending | Select-Object -First 1
  if ($null -eq $latest) {
    throw "Nenhuma sessao de piloto encontrada em $PilotRunsRoot."
  }

  return $latest.FullName
}

function Add-Result {
  param(
    [string]$Step,
    [string]$Status,
    [string]$Details = "",
    [string]$Artifact = ""
  )

  $script:results += [pscustomobject]@{
    Step = $Step
    Status = $Status
    Details = $Details
    Artifact = $Artifact
  }
}

function Get-EvidenceResult {
  param(
    [string]$StepStatus
  )

  if ($StepStatus -eq "PASS") {
    return "PASS"
  }

  if ($StepStatus -eq "FAIL") {
    return "FAIL"
  }

  return "BLOCKED"
}

function Invoke-PowerShellScript {
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
    throw "Nao foi possivel localizar pwsh/powershell para executar scripts de smoke."
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

$resolvedRunDir = Resolve-RunDirectory -ProvidedRunDir $RunDir -PilotRunsRoot $pilotRoot
$clientsPath = Join-Path $resolvedRunDir "clients.csv"
$evidencePath = Join-Path $resolvedRunDir "evidence.csv"
if (-not (Test-Path $clientsPath)) {
  throw "Arquivo clients.csv nao encontrado em $resolvedRunDir."
}
if (-not (Test-Path $evidencePath)) {
  throw "Arquivo evidence.csv nao encontrado em $resolvedRunDir."
}

$cycleId = Get-Date -Format "yyyyMMdd-HHmmss"
$cycleDir = Join-Path (Join-Path $resolvedRunDir "cycles") $cycleId
New-Item -ItemType Directory -Path $cycleDir -Force | Out-Null

$results = @()

Write-Host ""
Write-Host "MVP pilot cycle: $cycleId"
Write-Host "Run directory: $resolvedRunDir"

Write-Host ""
Write-Host ">> Backend health check"
try {
  $backendStatusCode = (Invoke-WebRequest -Uri $BackendHealthUrl -UseBasicParsing -TimeoutSec 10).StatusCode
  if ($backendStatusCode -ne 200) {
    throw "backend health retornou status $backendStatusCode"
  }

  $backendHealthArtifact = Join-Path $cycleDir "backend-health.txt"
  @(
    "timestamp=$(Get-Date -Format "yyyy-MM-dd HH:mm:ss")"
    "url=$BackendHealthUrl"
    "status_code=$backendStatusCode"
  ) | Set-Content -Path $backendHealthArtifact -Encoding UTF8

  Add-Result -Step "Backend health check" -Status "PASS" -Artifact $backendHealthArtifact
}
catch {
  Add-Result -Step "Backend health check" -Status "FAIL" -Details $_.Exception.Message
}

Write-Host ""
Write-Host ">> Frontend availability check"
try {
  $frontendStatusCode = (Invoke-WebRequest -Uri $FrontendUrl -UseBasicParsing -TimeoutSec 10).StatusCode
  if ($frontendStatusCode -ne 200) {
    throw "frontend retornou status $frontendStatusCode"
  }

  $frontendArtifact = Join-Path $cycleDir "frontend-availability.txt"
  @(
    "timestamp=$(Get-Date -Format "yyyy-MM-dd HH:mm:ss")"
    "url=$FrontendUrl"
    "status_code=$frontendStatusCode"
  ) | Set-Content -Path $frontendArtifact -Encoding UTF8

  Add-Result -Step "Frontend availability check" -Status "PASS" -Artifact $frontendArtifact
}
catch {
  Add-Result -Step "Frontend availability check" -Status "FAIL" -Details $_.Exception.Message
}

if (-not $SkipDockerLogs) {
  Write-Host ""
  Write-Host ">> Docker logs snapshot"
  try {
    $composeFile = Join-Path $repoRoot ".production\docker-compose.yml"
    $backendDockerLog = Join-Path $cycleDir "docker-backend.log"
    $frontendDockerLog = Join-Path $cycleDir "docker-frontend.log"

    docker compose -f $composeFile logs --tail 400 backend | Set-Content -Path $backendDockerLog -Encoding UTF8
    if ($LASTEXITCODE -ne 0) {
      throw "falha ao coletar logs do backend"
    }

    docker compose -f $composeFile logs --tail 400 frontend | Set-Content -Path $frontendDockerLog -Encoding UTF8
    if ($LASTEXITCODE -ne 0) {
      throw "falha ao coletar logs do frontend"
    }

    Add-Result -Step "Docker logs snapshot" -Status "PASS" -Artifact "$backendDockerLog; $frontendDockerLog"
  }
  catch {
    Add-Result -Step "Docker logs snapshot" -Status "FAIL" -Details $_.Exception.Message
  }
}
else {
  Add-Result -Step "Docker logs snapshot" -Status "SKIP" -Details "SkipDockerLogs enabled"
}

Push-Location $repoRoot
try {
  if (-not $SkipCoreSmoke) {
    Write-Host ""
    Write-Host ">> Smoke MVP core"
    try {
      $coreSmokeLog = Join-Path $cycleDir "smoke-mvp-core.log"
      $coreScriptPath = Join-Path $repoRoot ".production\scripts\smoke-mvp-core.ps1"
      $coreExec = Invoke-PowerShellScript -ScriptPath $coreScriptPath -ScriptArguments @() -LogPath $coreSmokeLog
      if ($coreExec.ExitCode -ne 0) {
        throw "smoke-mvp-core.ps1 failed (log: $coreSmokeLog)"
      }

      Add-Result -Step "Smoke MVP core" -Status "PASS" -Artifact $coreSmokeLog
    }
    catch {
      Add-Result -Step "Smoke MVP core" -Status "FAIL" -Details $_.Exception.Message
    }
  }
  else {
    Add-Result -Step "Smoke MVP core" -Status "SKIP" -Details "SkipCoreSmoke enabled"
  }

  if (-not $SkipUiSmoke) {
    Write-Host ""
    Write-Host ">> Smoke MVP UI"
    try {
      $uiSmokeLog = Join-Path $cycleDir "smoke-mvp-ui.log"
      $uiScriptPath = Join-Path $repoRoot ".production\scripts\smoke-mvp-ui.ps1"
      $uiArgs = @(
        "-FrontendUrl", $FrontendUrl,
        "-BackendHealthUrl", $BackendHealthUrl,
        "-AdminEmail", $AdminEmail,
        "-AdminPassword", $AdminPassword
      )
      $uiExec = Invoke-PowerShellScript -ScriptPath $uiScriptPath -ScriptArguments $uiArgs -LogPath $uiSmokeLog
      if ($uiExec.ExitCode -ne 0) {
        throw "smoke-mvp-ui.ps1 failed (log: $uiSmokeLog)"
      }

      Add-Result -Step "Smoke MVP UI" -Status "PASS" -Artifact $uiSmokeLog
    }
    catch {
      Add-Result -Step "Smoke MVP UI" -Status "FAIL" -Details $_.Exception.Message
    }
  }
  else {
    Add-Result -Step "Smoke MVP UI" -Status "SKIP" -Details "SkipUiSmoke enabled"
  }
}
finally {
  Pop-Location
}

$attempted = @($results | Where-Object { $_.Status -eq "PASS" -or $_.Status -eq "FAIL" })
$passed = @($attempted | Where-Object { $_.Status -eq "PASS" })
$failed = @($attempted | Where-Object { $_.Status -eq "FAIL" })
$successRate = 0
if ($attempted.Count -gt 0) {
  $successRate = [math]::Round(($passed.Count / $attempted.Count) * 100, 2)
}

$cycleResult = "PASS"
if ($failed.Count -gt 0) {
  $cycleResult = "FAIL"
}

$summaryPath = Join-Path $cycleDir "summary.md"
$resultTable = $results | Format-Table -AutoSize | Out-String
$summary = @"
# MVP Pilot Cycle Summary

Cycle ID: $cycleId
Data: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
Sessao: $resolvedRunDir

## Resultado do ciclo
- Resultado geral: $cycleResult
- Etapas tentadas: $($attempted.Count)
- Etapas aprovadas: $($passed.Count)
- Etapas com falha: $($failed.Count)
- Taxa de sucesso: $successRate%

## Detalhamento
$resultTable
"@
Set-Content -Path $summaryPath -Value $summary -Encoding UTF8

Write-Host ""
Write-Host ">> Registro de evidencias (automatico)"
foreach ($item in $results) {
  $evidenceResult = Get-EvidenceResult -StepStatus $item.Status
  $details = $item.Details
  if ([string]::IsNullOrWhiteSpace($details) -and $item.Status -eq "SKIP") {
    $details = "Etapa marcada como skip"
  }

  try {
    & $recordEvidenceScript `
      -RunDir $resolvedRunDir `
      -Cliente "SESSAO PILOTO" `
      -Cenario "Ciclo tecnico $cycleId - $($item.Step)" `
      -Resultado $evidenceResult `
      -Evidencia $item.Artifact `
      -Erro $details `
      -Responsavel $Responsavel | Out-Null
  }
  catch {
    Write-Host "Falha ao registrar evidencia da etapa '$($item.Step)': $($_.Exception.Message)"
  }
}

$statusPath = Join-Path $resolvedRunDir "status.md"
if (Test-Path $statusPath) {
  $statusUpdate = @"

## Ciclo tecnico $cycleId
- Resultado geral: $cycleResult
- Taxa de sucesso: $successRate%
- Artefatos: $cycleDir
"@
  Add-Content -Path $statusPath -Value $statusUpdate -Encoding UTF8
}

Write-Host ""
Write-Host "Pilot cycle summary:"
$results | Format-Table -AutoSize
Write-Host ""
Write-Host "Summary: $summaryPath"
Write-Host "Artifacts: $cycleDir"

if ($failed.Count -gt 0) {
  Write-Host "Pilot cycle result: FAIL"
  exit 1
}

Write-Host "Pilot cycle result: PASS"
exit 0
