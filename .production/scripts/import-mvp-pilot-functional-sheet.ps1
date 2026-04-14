param(
  [string]$RunDir = "",
  [string]$SheetPath = "",
  [switch]$Strict,
  [switch]$SkipIfAlreadyRecorded,
  [switch]$DryRun
)

$ErrorActionPreference = "Stop"
$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
$pilotRoot = Join-Path $repoRoot ".production\pilot-runs"
$recordScript = Join-Path $PSScriptRoot "record-mvp-pilot-functional-result.ps1"

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

$scenarioMap = @{
  "LoginContexto" = "Login e contexto da empresa"
  "CriacaoLead" = "Criacao de lead"
  "MovimentarPipeline" = "Movimentar pipeline"
  "Proposta" = "Criar e consultar proposta"
  "AtendimentoTicket" = "Abrir ticket, responder, alterar status"
}

$validResultSet = @("PASS", "FAIL", "BLOCKED")

if (-not (Test-Path $recordScript)) {
  throw "Script de registro funcional nao encontrado: $recordScript"
}

$RunDir = Resolve-RunDir -ProvidedRunDir $RunDir
$evidencePath = Join-Path $RunDir "evidence.csv"
if (-not (Test-Path $evidencePath)) {
  throw "Arquivo evidence.csv nao encontrado em $RunDir."
}

if ([string]::IsNullOrWhiteSpace($SheetPath)) {
  $SheetPath = Join-Path $RunDir "functional-sheet.csv"
}
elseif (-not [System.IO.Path]::IsPathRooted($SheetPath)) {
  $candidateRunDirPath = Join-Path $RunDir $SheetPath
  $candidateRepoPath = Join-Path $repoRoot $SheetPath

  if (Test-Path $candidateRunDirPath) {
    $SheetPath = $candidateRunDirPath
  }
  elseif (Test-Path $candidateRepoPath) {
    $SheetPath = $candidateRepoPath
  }
}

if (-not (Test-Path $SheetPath)) {
  throw "Planilha funcional nao encontrada: $SheetPath"
}

$sheetRows = @(Import-Csv $SheetPath)
if ($sheetRows.Count -eq 0) {
  throw "Planilha funcional vazia: $SheetPath"
}

$evidenceRows = @(Import-Csv $evidencePath)
$importedCount = 0
$skippedCount = 0
$pendingCount = 0
$invalidCount = 0
$invalidLines = @()

foreach ($row in $sheetRows) {
  $cliente = $row.cliente
  $scenarioKey = $row.cenario_key
  $resultRaw = $row.resultado
  $result = ""
  if (Is-NotBlank $resultRaw) {
    $result = $resultRaw.Trim().ToUpperInvariant()
  }

  if (-not (Is-NotBlank $cliente)) {
    $invalidCount++
    $invalidLines += "Linha invalida: cliente vazio (cenario_key=$scenarioKey)"
    continue
  }

  if (-not (Is-NotBlank $scenarioKey) -or -not $scenarioMap.ContainsKey($scenarioKey)) {
    $invalidCount++
    $invalidLines += "Linha invalida: cenario_key desconhecido para cliente '$cliente' (cenario_key=$scenarioKey)"
    continue
  }

  if (-not (Is-NotBlank $result)) {
    $pendingCount++
    continue
  }

  if ($validResultSet -notcontains $result) {
    $invalidCount++
    $invalidLines += "Linha invalida: resultado '$resultRaw' para cliente '$cliente' (cenario_key=$scenarioKey)"
    continue
  }

  $scenarioName = $scenarioMap[$scenarioKey]
  if ($SkipIfAlreadyRecorded) {
    $already = $evidenceRows | Where-Object { $_.cliente -eq $cliente -and $_.cenario -eq $scenarioName } | Select-Object -First 1
    if ($null -ne $already) {
      $skippedCount++
      continue
    }
  }

  if (-not $DryRun) {
    & $recordScript `
      -RunDir $RunDir `
      -Cliente $cliente `
      -Cenario $scenarioKey `
      -Resultado $result `
      -Evidencia $row.evidencia `
      -Erro $row.erro `
      -Responsavel $row.responsavel | Out-Null
  }

  $importedCount++
}

$decision = "IMPORT_OK"
if ($invalidCount -gt 0) {
  $decision = "IMPORT_INVALID"
}
elseif ($Strict -and $pendingCount -gt 0) {
  $decision = "IMPORT_PENDING"
}

$timestamp = Get-Date -Format "yyyyMMdd-HHmmss-fff"
$reportPath = Join-Path $RunDir "functional-import-$timestamp.md"

$invalidSection = if ($invalidLines.Count -gt 0) {
  ($invalidLines | ForEach-Object { "- $_" }) -join "`n"
}
else {
  "- sem linhas invalidas"
}

$report = @"
# MVP Pilot Functional Sheet Import

Data: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
Sessao: $RunDir

## Resultado
- Decisao: $decision
- Planilha: $SheetPath
- DryRun: $DryRun
- Strict: $Strict
- SkipIfAlreadyRecorded: $SkipIfAlreadyRecorded
- Linhas importadas: $importedCount
- Linhas pendentes (resultado vazio): $pendingCount
- Linhas puladas por duplicidade: $skippedCount
- Linhas invalidas: $invalidCount

## Detalhes de invalidacao
$invalidSection
"@

Set-Content -Path $reportPath -Value $report -Encoding UTF8

$statusPath = Join-Path $RunDir "status.md"
if (Test-Path $statusPath) {
  $statusBlock = @"

## Functional import $timestamp
- Decisao: $decision
- Importadas: $importedCount
- Pendentes: $pendingCount
- Puladas: $skippedCount
- Invalidas: $invalidCount
- Relatorio: $reportPath
"@
  Add-Content -Path $statusPath -Value $statusBlock -Encoding UTF8
}

Write-Host "Functional import report: $reportPath"
Write-Host "Decisao: $decision"
Write-Host "Importadas=$importedCount Pendentes=$pendingCount Puladas=$skippedCount Invalidas=$invalidCount"

if ($decision -ne "IMPORT_OK") {
  exit 1
}

exit 0
