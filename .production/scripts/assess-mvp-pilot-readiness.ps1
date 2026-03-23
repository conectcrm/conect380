param(
  [string]$RunDir = "",
  [ValidateSet("Applied", "NotApplied", "Unknown")][string]$BranchProtectionStatus = "Unknown",
  [ValidateSet("Auto", "COVERAGE_OK", "COVERAGE_GAP", "UNKNOWN")][string]$FunctionalCoverageStatus = "Auto",
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

function Get-LatestFunctionalCoverage {
  param(
    [string]$PilotRunDir
  )

  $coverageFiles = @(Get-ChildItem $PilotRunDir -File -Filter "functional-coverage-*.md" | Sort-Object LastWriteTime -Descending)
  if ($coverageFiles.Count -eq 0) {
    return [pscustomobject]@{
      Status = "UNKNOWN"
      Path = ""
    }
  }

  $latestFile = $coverageFiles[0]
  $status = "UNKNOWN"

  try {
    $decisionLine = Select-String -Path $latestFile.FullName -Pattern "^- Decisao:\s*(.+)$" | Select-Object -First 1
    if ($null -ne $decisionLine) {
      $value = $decisionLine.Matches[0].Groups[1].Value.Trim().ToUpperInvariant()
      if ($value -eq "COVERAGE_OK" -or $value -eq "COVERAGE_GAP") {
        $status = $value
      }
    }
  }
  catch {
    $status = "UNKNOWN"
  }

  return [pscustomobject]@{
    Status = $status
    Path = $latestFile.FullName
  }
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
$passRows = @($evidence | Where-Object { $_.resultado -eq "PASS" })
$failRows = @($evidence | Where-Object { $_.resultado -eq "FAIL" })
$blockedRows = @($evidence | Where-Object { $_.resultado -eq "BLOCKED" })

$passCount = Get-Count -Value $passRows
$failCount = Get-Count -Value $failRows
$blockedCount = Get-Count -Value $blockedRows

$nonCycleRows = @($evidence | Where-Object { $_.cenario -notlike "Ciclo tecnico *" })
$latestNonCycleRows = @()
if ($nonCycleRows.Count -gt 0) {
  $seenNonCycle = @{}
  foreach ($row in @($nonCycleRows | Sort-Object timestamp -Descending)) {
    $key = "$($row.cliente)|$($row.cenario)"
    if (-not $seenNonCycle.ContainsKey($key)) {
      $seenNonCycle[$key] = $true
      $latestNonCycleRows += $row
    }
  }
}

$nonCycleFailCount = Get-Count -Value @($latestNonCycleRows | Where-Object { $_.resultado -eq "FAIL" })
$nonCycleBlockedCount = Get-Count -Value @($latestNonCycleRows | Where-Object { $_.resultado -eq "BLOCKED" })

$latestCycleId = Get-LatestCycleId -EvidenceRows $evidence
$latestCycleRows = @()
if (Is-NotBlank $latestCycleId) {
  $latestCycleRows = @($evidence | Where-Object { $_.cenario -like "*$latestCycleId*" })
}

$functionalCoverageInfo = Get-LatestFunctionalCoverage -PilotRunDir $RunDir
$functionalCoverageResolvedStatus = $FunctionalCoverageStatus
if ($functionalCoverageStatus -eq "Auto") {
  $functionalCoverageResolvedStatus = $functionalCoverageInfo.Status
}

$qualityRows = @()
$qualityRows += @($latestNonCycleRows)
if (Is-NotBlank $latestCycleId) {
  $qualityRows += @($latestCycleRows)
}

$qualityEvidenceCount = Get-Count -Value $qualityRows
$qualityPassCount = Get-Count -Value @($qualityRows | Where-Object { $_.resultado -eq "PASS" })
$successRate = 0
if ($qualityEvidenceCount -gt 0) {
  $successRate = [math]::Round(($qualityPassCount / $qualityEvidenceCount) * 100, 2)
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

if ($nonCycleFailCount -gt 0 -or $nonCycleBlockedCount -gt 0) {
  $blockers += "Evidencias funcionais com falha/bloqueio: fail=$nonCycleFailCount, blocked=$nonCycleBlockedCount."
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

switch ($functionalCoverageResolvedStatus) {
  "COVERAGE_OK" { }
  "COVERAGE_GAP" { $blockers += "Cobertura funcional do piloto com gaps (informar COVERAGE_OK apos concluir a janela)." }
  "UNKNOWN" { $warnings += "Cobertura funcional em status desconhecido (executar check-mvp-pilot-functional-coverage.ps1)." }
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
- Cobertura funcional: $functionalCoverageResolvedStatus
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
- FAIL (total): $failCount
- BLOCKED (total): $blockedCount
- FAIL (nao ciclo tecnico): $nonCycleFailCount
- BLOCKED (nao ciclo tecnico): $nonCycleBlockedCount
- Evidencias no escopo da taxa: $qualityEvidenceCount
- Taxa de sucesso (escopo de gating): $successRate%
- Ultimo ciclo tecnico: $(if (Is-NotBlank $latestCycleId) { $latestCycleId } else { "nao identificado" })
- Relatorio de cobertura funcional: $(if (Is-NotBlank $functionalCoverageInfo.Path) { $functionalCoverageInfo.Path } else { "nao encontrado" })

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
