param(
  [string]$RunDir = "",
  [string]$SourceCsvPath = "",
  [string]$OutputCsvPath = "",
  [string]$Owner = "time-comercial"
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

function Normalize-Status {
  param(
    [string]$Value
  )

  if ([string]::IsNullOrWhiteSpace($Value)) {
    return "SEM_STATUS"
  }

  return $Value.Trim().ToUpperInvariant()
}

$resolvedRunDir = Resolve-RunDir -ProvidedRunDir $RunDir
$outreachPath = Join-Path $resolvedRunDir "outreach.csv"
if (-not (Test-Path $outreachPath)) {
  throw "Arquivo outreach.csv nao encontrado em $resolvedRunDir."
}

if ([string]::IsNullOrWhiteSpace($SourceCsvPath)) {
  $latestFollowup = @(Get-ChildItem $resolvedRunDir -File -Filter "outreach-followup-*.csv" | Sort-Object LastWriteTime -Descending | Select-Object -First 1)
  if ($latestFollowup.Count -gt 0) {
    $SourceCsvPath = $latestFollowup[0].FullName
  }
  else {
    $SourceCsvPath = $outreachPath
  }
}
elseif (-not [System.IO.Path]::IsPathRooted($SourceCsvPath)) {
  $SourceCsvPath = Join-Path $resolvedRunDir $SourceCsvPath
}

if (-not (Test-Path $SourceCsvPath)) {
  throw "SourceCsvPath nao encontrado: $SourceCsvPath"
}

$stamp = Get-Date -Format "yyyyMMdd-HHmmss"
if ([string]::IsNullOrWhiteSpace($OutputCsvPath)) {
  $OutputCsvPath = Join-Path $resolvedRunDir "outreach-updates-template-$stamp.csv"
}
elseif (-not [System.IO.Path]::IsPathRooted($OutputCsvPath)) {
  $OutputCsvPath = Join-Path $resolvedRunDir $OutputCsvPath
}

$rows = @(Import-Csv $SourceCsvPath)
if ($rows.Count -eq 0) {
  throw "Arquivo de origem sem linhas: $SourceCsvPath"
}

$templateRows = @()
foreach ($row in $rows) {
  $statusAtual = Normalize-Status -Value $row.status_convite
  $templateRows += [pscustomobject]@{
    empresa_id = $row.empresa_id
    cliente = $row.cliente
    status_atual = $statusAtual
    status_convite = $statusAtual
    observacao = ""
    owner = if (Is-NotBlank $row.owner) { $row.owner } else { $Owner }
  }
}

$templateRows | Export-Csv -Path $OutputCsvPath -NoTypeInformation -Encoding UTF8

$statusPath = Join-Path $resolvedRunDir "status.md"
if (Test-Path $statusPath) {
  $statusBlock = @"

## Outreach updates template $(Get-Date -Format "yyyyMMdd-HHmmss")
- Origem: $SourceCsvPath
- Template: $OutputCsvPath
- Linhas: $($templateRows.Count)
"@
  Add-Content -Path $statusPath -Value $statusBlock -Encoding UTF8
}

Write-Host "Template de updates gerado: $OutputCsvPath"
Write-Host "Origem: $SourceCsvPath"
Write-Host "Linhas: $($templateRows.Count)"

exit 0
