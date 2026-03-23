param(
  [string]$RunDir = "",
  [string[]]$RequiredScenarios = @(
    "Login e contexto da empresa",
    "Criacao de lead",
    "Movimentar pipeline",
    "Criar e consultar proposta",
    "Abrir ticket, responder, alterar status"
  ),
  [switch]$IncludeNonSuggested
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

function Is-NotBlank {
  param(
    [string]$Value
  )

  return -not [string]::IsNullOrWhiteSpace($Value)
}

function Get-ScenarioStatus {
  param(
    [object[]]$EvidenceRows,
    [string]$ClientName,
    [string]$ScenarioName
  )

  $matches = @($EvidenceRows | Where-Object {
      $_.cliente -eq $ClientName -and $_.cenario -like "*$ScenarioName*"
    })

  if ($matches.Count -eq 0) {
    return [pscustomobject]@{
      Status = "MISSING"
      Timestamp = ""
      Evidence = ""
      Error = ""
    }
  }

  $latest = $matches | Sort-Object timestamp -Descending | Select-Object -First 1

  return [pscustomobject]@{
    Status = $latest.resultado
    Timestamp = $latest.timestamp
    Evidence = $latest.evidencia
    Error = $latest.erro
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

$clientRows = @($clients | Where-Object { Is-NotBlank $_.empresa_id })
if (-not $IncludeNonSuggested) {
  $clientRows = @($clientRows | Where-Object { $_.status -eq "SUGERIDO" })
}

if ($clientRows.Count -eq 0) {
  throw "Nenhum cliente piloto elegivel encontrado para cobertura funcional."
}

$matrix = @()
foreach ($client in $clientRows) {
  foreach ($scenario in $RequiredScenarios) {
    $scenarioStatus = Get-ScenarioStatus -EvidenceRows $evidence -ClientName $client.cliente -ScenarioName $scenario
    $matrix += [pscustomobject]@{
      cliente = $client.cliente
      empresa_id = $client.empresa_id
      cenario = $scenario
      status = $scenarioStatus.Status
      timestamp = $scenarioStatus.Timestamp
      evidencia = $scenarioStatus.Evidence
      erro = $scenarioStatus.Error
    }
  }
}

$totalChecks = @($matrix).Count
$passCount = @($matrix | Where-Object { $_.status -eq "PASS" }).Count
$failCount = @($matrix | Where-Object { $_.status -eq "FAIL" }).Count
$blockedCount = @($matrix | Where-Object { $_.status -eq "BLOCKED" }).Count
$missingCount = @($matrix | Where-Object { $_.status -eq "MISSING" }).Count

$doneCount = $passCount + $failCount + $blockedCount
$coveragePercent = 0
if ($totalChecks -gt 0) {
  $coveragePercent = [math]::Round(($doneCount / $totalChecks) * 100, 2)
}

$decision = "COVERAGE_OK"
if ($missingCount -gt 0 -or $failCount -gt 0 -or $blockedCount -gt 0) {
  $decision = "COVERAGE_GAP"
}

$timestamp = Get-Date -Format "yyyyMMdd-HHmmss-fff"
$reportPath = Join-Path $RunDir "functional-coverage-$timestamp.md"

$clientSections = @()
foreach ($client in $clientRows) {
  $rows = @($matrix | Where-Object { $_.cliente -eq $client.cliente })
  $lines = @()
  foreach ($row in $rows) {
    $detail = ""
    if (Is-NotBlank $row.timestamp) {
      $detail = " (ultimo: $($row.timestamp))"
    }
    $lines += "- [$($row.status)] $($row.cenario)$detail"
  }

  $clientSection = @"
### $($client.cliente) ($($client.empresa_id))
$($lines -join "`n")
"@
  $clientSections += $clientSection
}

$report = @"
# MVP Pilot Functional Coverage

Data: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
Sessao: $RunDir

## Resultado
- Decisao: $decision
- Checks totais: $totalChecks
- PASS: $passCount
- FAIL: $failCount
- BLOCKED: $blockedCount
- MISSING: $missingCount
- Cobertura registrada: $coveragePercent%

## Matriz por cliente
$($clientSections -join "`n`n")
"@

Set-Content -Path $reportPath -Value $report -Encoding UTF8

$statusPath = Join-Path $RunDir "status.md"
if (Test-Path $statusPath) {
  $statusBlock = @"

## Functional coverage $timestamp
- Decisao: $decision
- Cobertura: $coveragePercent%
- PASS: $passCount
- FAIL: $failCount
- BLOCKED: $blockedCount
- MISSING: $missingCount
- Relatorio: $reportPath
"@
  Add-Content -Path $statusPath -Value $statusBlock -Encoding UTF8
}

Write-Host "Functional coverage report: $reportPath"
Write-Host "Decisao: $decision"
Write-Host "Cobertura: $coveragePercent%"
Write-Host "PASS=$passCount FAIL=$failCount BLOCKED=$blockedCount MISSING=$missingCount"

if ($decision -ne "COVERAGE_OK") {
  exit 1
}

exit 0
