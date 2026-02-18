param(
  [string]$RunDir = "",
  [string]$OutputPath = "",
  [string]$ResponsavelPadrao = "time-comercial",
  [switch]$IncludeNonSuggested,
  [switch]$Force
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

$scenarioRows = @(
  [pscustomobject]@{ cenario_key = "LoginContexto"; cenario = "Login e contexto da empresa" },
  [pscustomobject]@{ cenario_key = "CriacaoLead"; cenario = "Criacao de lead" },
  [pscustomobject]@{ cenario_key = "MovimentarPipeline"; cenario = "Movimentar pipeline" },
  [pscustomobject]@{ cenario_key = "Proposta"; cenario = "Criar e consultar proposta" },
  [pscustomobject]@{ cenario_key = "AtendimentoTicket"; cenario = "Abrir ticket, responder, alterar status" }
)

$RunDir = Resolve-RunDir -ProvidedRunDir $RunDir
$clientsPath = Join-Path $RunDir "clients.csv"
if (-not (Test-Path $clientsPath)) {
  throw "Arquivo clients.csv nao encontrado em $RunDir."
}

if ([string]::IsNullOrWhiteSpace($OutputPath)) {
  $OutputPath = Join-Path $RunDir "functional-sheet.csv"
}
else {
  if (-not [System.IO.Path]::IsPathRooted($OutputPath)) {
    $OutputPath = Join-Path $RunDir $OutputPath
  }

  $outputDir = Split-Path -Parent $OutputPath
  if (-not [string]::IsNullOrWhiteSpace($outputDir) -and -not (Test-Path $outputDir)) {
    New-Item -ItemType Directory -Path $outputDir -Force | Out-Null
  }
}

if ((Test-Path $OutputPath) -and -not $Force) {
  throw "Arquivo de saida ja existe: $OutputPath. Use -Force para sobrescrever."
}

$clients = @(Import-Csv $clientsPath)
$clientRows = @($clients | Where-Object { Is-NotBlank $_.empresa_id })
if (-not $IncludeNonSuggested) {
  $clientRows = @($clientRows | Where-Object { $_.status -eq "SUGERIDO" })
}

if ($clientRows.Count -eq 0) {
  throw "Nenhum cliente elegivel encontrado em clients.csv."
}

$sheetRows = @()
foreach ($client in $clientRows) {
  foreach ($scenario in $scenarioRows) {
    $sheetRows += [pscustomobject]@{
      cliente = $client.cliente
      empresa_id = $client.empresa_id
      janela_inicio = $client.janela_inicio
      janela_fim = $client.janela_fim
      cenario_key = $scenario.cenario_key
      cenario = $scenario.cenario
      resultado = ""
      evidencia = ""
      erro = ""
      responsavel = $ResponsavelPadrao
      observacoes = ""
    }
  }
}

$sheetRows | Export-Csv -Path $OutputPath -NoTypeInformation -Encoding UTF8

$reportPath = Join-Path $RunDir ("functional-sheet-report-" + (Get-Date -Format "yyyyMMdd-HHmmss-fff") + ".md")
$report = @"
# MVP Pilot Functional Sheet

Data: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
Sessao: $RunDir

## Resultado
- Arquivo: $OutputPath
- Clientes incluidos: $($clientRows.Count)
- Cenarios por cliente: $($scenarioRows.Count)
- Linhas geradas: $($sheetRows.Count)

## Instrucao
1. Preencher as colunas `resultado`, `evidencia`, `erro` (quando aplicavel) e ajustar `responsavel` por linha.
2. Valores aceitos em `resultado`: `PASS`, `FAIL`, `BLOCKED`.
3. Importar resultados com `import-mvp-pilot-functional-sheet.ps1`.
"@

Set-Content -Path $reportPath -Value $report -Encoding UTF8

Write-Host "Functional sheet gerada: $OutputPath"
Write-Host "Relatorio: $reportPath"
Write-Host "Linhas: $($sheetRows.Count)"

exit 0
