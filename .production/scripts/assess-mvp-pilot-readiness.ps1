param(
  [string]$RunDir = "",
  [ValidateSet("Applied", "NotApplied", "Unknown")][string]$BranchProtectionStatus = "Unknown",
  [int]$MinClients = 3,
  [decimal]$MinSuccessRate = 95,
  [switch]$Simulation
)

$ErrorActionPreference = "Stop"
$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
$pilotRoot = Join-Path $repoRoot ".production\pilot-runs"

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

function Get-Count {
  param(
    [object]$Value
  )

  return @($Value).Count
}

function Is-NotBlank {
  param(
    [string]$Value
  )

  return -not [string]::IsNullOrWhiteSpace($Value)
}

function Get-LatestCycleId {
  param(
    [object[]]$EvidenceRows
  )

  $cycleIds = @()
  foreach ($row in $EvidenceRows) {
    if ($row.cenario -match "Ciclo tecnico ([0-9]{8}-[0-9]{6})") {
      $cycleIds += $matches[1]
    }
  }

  if ($cycleIds.Count -eq 0) {
    return ""
  }

  return ($cycleIds | Sort-Object -Descending | Select-Object -First 1)
}

$RunDir = Resolve-RunDir -ProvidedRunDir $RunDir
$clientsPath = Join-Path $RunDir "clients.csv"
$evidencePath = Join-Path $RunDir "evidence.csv"

if (-not (Test-Path $clientsPath)) {
  throw "Arquivo clients.csv nao encontrado em $RunDir."
}
if (-not (Test-Path $evidencePath)) {
  throw "Arquivo evidence.csv nao encontrado em $RunDir."
}

$clients = @(Import-Csv $clientsPath)
$evidence = @(Import-Csv $evidencePath)
$blockers = @()
$warnings = @()

$clientRows = @($clients | Where-Object { Is-NotBlank $_.empresa_id })
$clientCount = Get-Count -Value $clientRows
$pendingClientRows = @($clients | Where-Object { -not (Is-NotBlank $_.empresa_id) })
$pendingClientCount = Get-Count -Value $pendingClientRows

$missingBusinessContactRows = @($clientRows | Where-Object { -not (Is-NotBlank $_.contato_negocio) })
$missingBusinessContactCount = Get-Count -Value $missingBusinessContactRows
$missingTechContactRows = @($clientRows | Where-Object { -not (Is-NotBlank $_.contato_tecnico) })
$missingTechContactCount = Get-Count -Value $missingTechContactRows
$missingWindowRows = @($clientRows | Where-Object { -not (Is-NotBlank $_.janela_inicio) -or -not (Is-NotBlank $_.janela_fim) })
$missingWindowCount = Get-Count -Value $missingWindowRows
$reviewStatusRows = @($clientRows | Where-Object { $_.status -like "REVISAR_*" })
$reviewStatusCount = Get-Count -Value $reviewStatusRows

$evidenceCount = Get-Count -Value $evidence
$passCount = Get-Count -Value @($evidence | Where-Object { $_.resultado -eq "PASS" })
$failCount = Get-Count -Value @($evidence | Where-Object { $_.resultado -eq "FAIL" })
$blockedCount = Get-Count -Value @($evidence | Where-Object { $_.resultado -eq "BLOCKED" })

$successRate = 0
if ($evidenceCount -gt 0) {
  $successRate = [math]::Round(($passCount / $evidenceCount) * 100, 2)
}

$latestCycleId = Get-LatestCycleId -EvidenceRows $evidence
$latestCycleRows = @()
if (Is-NotBlank $latestCycleId) {
  $latestCycleRows = @($evidence | Where-Object { $_.cenario -like "*$latestCycleId*" })
}

$requiredCycleSteps = @(
  "Backend health check",
  "Frontend availability check",
  "Docker logs snapshot",
  "Smoke MVP core",
  "Smoke MVP UI"
)

$cycleMissingSteps = @()
$cycleFailedSteps = @()

foreach ($requiredStep in $requiredCycleSteps) {
  $match = $latestCycleRows | Where-Object { $_.cenario -like "*$requiredStep" } | Select-Object -First 1
  if ($null -eq $match) {
    $cycleMissingSteps += $requiredStep
    continue
  }

  if ($match.resultado -ne "PASS") {
    $cycleFailedSteps += "$requiredStep ($($match.resultado))"
  }
}

if ($clientCount -lt $MinClients) {
  $blockers += "Clientes piloto insuficientes: atual=$clientCount, minimo=$MinClients."
}

if ($pendingClientCount -gt 0) {
  $warnings += "Existem $pendingClientCount slot(s) de cliente ainda pendentes em clients.csv."
}

if ($missingBusinessContactCount -gt 0) {
  $blockers += "Clientes sem contato de negocio confirmado: $missingBusinessContactCount."
}

if ($missingWindowCount -gt 0) {
  $blockers += "Clientes sem janela de observacao completa (inicio/fim): $missingWindowCount."
}

if ($missingTechContactCount -gt 0) {
  $warnings += "Clientes sem contato tecnico preenchido: $missingTechContactCount."
}

if ($reviewStatusCount -gt 0) {
  $warnings += "Clientes ainda em status de revisao (REVISAR_*): $reviewStatusCount."
}

if ($evidenceCount -eq 0) {
  $blockers += "Nenhuma evidencia registrada no evidence.csv."
}

if ($failCount -gt 0 -or $blockedCount -gt 0) {
  $blockers += "Evidencias com falha/bloqueio: fail=$failCount, blocked=$blockedCount."
}

if ($successRate -lt $MinSuccessRate) {
  $blockers += "Taxa de sucesso abaixo do minimo: atual=$successRate%, minimo=$MinSuccessRate%."
}

if (-not (Is-NotBlank $latestCycleId)) {
  $blockers += "Nenhum ciclo tecnico encontrado em evidence.csv."
}
else {
  if ($cycleMissingSteps.Count -gt 0) {
    $blockers += "Ciclo tecnico $latestCycleId incompleto. Etapas ausentes: $($cycleMissingSteps -join ', ')."
  }
  if ($cycleFailedSteps.Count -gt 0) {
    $blockers += "Ciclo tecnico $latestCycleId com etapas nao aprovadas: $($cycleFailedSteps -join ', ')."
  }
}

switch ($BranchProtectionStatus) {
  "Applied" { }
  "NotApplied" { $blockers += "Branch protection marcada como nao aplicada." }
  "Unknown" { $blockers += "Branch protection em status desconhecido (informar -BranchProtectionStatus Applied quando confirmado)." }
}

$decision = "GO_CONDICIONAL"
if ($blockers.Count -eq 0) {
  $decision = "GO"
}

$timestamp = Get-Date -Format "yyyyMMdd-HHmmss-fff"
$reportPath = Join-Path $RunDir "readiness-$timestamp.md"
$modeLabel = if ($Simulation) { "Simulacao" } else { "Real" }

$blockerLines = if ($blockers.Count -gt 0) { ($blockers | ForEach-Object { "- [ ] $_" }) -join "`n" } else { "- [x] Sem blockers tecnicos/operacionais." }
$warningLines = if ($warnings.Count -gt 0) { ($warnings | ForEach-Object { "- [ ] $_" }) -join "`n" } else { "- [x] Sem alertas complementares." }

$report = @"
# MVP Pilot Readiness

Data: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
Sessao: $RunDir

## Decisao automatizada
- Resultado: $decision
- Branch protection: $BranchProtectionStatus
- Modo: $modeLabel

## Metricas
- Clientes com empresa_id: $clientCount
- Slots pendentes: $pendingClientCount
- Clientes sem contato de negocio: $missingBusinessContactCount
- Clientes sem contato tecnico: $missingTechContactCount
- Clientes sem janela inicio/fim: $missingWindowCount
- Clientes em status de revisao: $reviewStatusCount
- Evidencias totais: $evidenceCount
- PASS: $passCount
- FAIL: $failCount
- BLOCKED: $blockedCount
- Taxa de sucesso: $successRate%
- Ultimo ciclo tecnico: $(if (Is-NotBlank $latestCycleId) { $latestCycleId } else { "nao identificado" })

## Blockers
$blockerLines

## Alertas
$warningLines
"@

Set-Content -Path $reportPath -Value $report -Encoding UTF8

$statusPath = Join-Path $RunDir "status.md"
if (Test-Path $statusPath) {
  $statusBlock = @"

## Readiness $timestamp
- Resultado: $decision
- Branch protection: $BranchProtectionStatus
- Modo: $modeLabel
- Blockers: $($blockers.Count)
- Alertas: $($warnings.Count)
- Relatorio: $reportPath
"@
  Add-Content -Path $statusPath -Value $statusBlock -Encoding UTF8
}

Write-Host "Readiness report gerado: $reportPath"
Write-Host "Decisao: $decision"
Write-Host "Blockers: $($blockers.Count)"
Write-Host "Alertas: $($warnings.Count)"

if ($blockers.Count -gt 0) {
  exit 1
}

exit 0
