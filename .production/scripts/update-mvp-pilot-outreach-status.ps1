param(
  [string]$RunDir = "",
  [string]$EmpresaId = "",
  [string]$Cliente = "",
  [ValidateSet("PENDENTE", "EM_CONTATO", "ACEITO", "AGENDADO", "RECUSADO", "BLOQUEADO", "SEM_RESPOSTA")][string]$StatusConvite,
  [string]$Observacao = "",
  [switch]$DryRun
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

function Append-Obs {
  param(
    [string]$Current,
    [string]$Extra
  )

  if ([string]::IsNullOrWhiteSpace($Extra)) {
    return $Current
  }

  if ([string]::IsNullOrWhiteSpace($Current)) {
    return $Extra
  }

  if ($Current -like "*$Extra*") {
    return $Current
  }

  return "$Current; $Extra"
}

function Matches-Filter {
  param(
    [pscustomobject]$Row,
    [string]$FilterEmpresaId,
    [string]$FilterCliente
  )

  $hasEmpresaFilter = Is-NotBlank $FilterEmpresaId
  $hasClienteFilter = Is-NotBlank $FilterCliente

  if (-not $hasEmpresaFilter -and -not $hasClienteFilter) {
    throw "Informe ao menos um filtro: -EmpresaId ou -Cliente."
  }

  $empresaMatch = $true
  if ($hasEmpresaFilter) {
    $empresaMatch = (($Row.empresa_id + "") -eq $FilterEmpresaId)
  }

  $clienteMatch = $true
  if ($hasClienteFilter) {
    $clienteMatch = (($Row.cliente + "").Trim().ToLowerInvariant() -eq $FilterCliente.Trim().ToLowerInvariant())
  }

  return ($empresaMatch -and $clienteMatch)
}

$resolvedRunDir = Resolve-RunDir -ProvidedRunDir $RunDir
$outreachPath = Join-Path $resolvedRunDir "outreach.csv"
if (-not (Test-Path $outreachPath)) {
  throw "Arquivo outreach.csv nao encontrado em $resolvedRunDir."
}

$rows = @(Import-Csv $outreachPath)
if ($rows.Count -eq 0) {
  throw "outreach.csv esta vazio em $resolvedRunDir."
}

$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
$changed = 0
$matched = 0

foreach ($row in $rows) {
  if (-not (Matches-Filter -Row $row -FilterEmpresaId $EmpresaId -FilterCliente $Cliente)) {
    continue
  }

  $matched++
  $currentStatus = if ([string]::IsNullOrWhiteSpace($row.status_convite)) { "SEM_STATUS" } else { $row.status_convite.Trim().ToUpperInvariant() }
  if ($currentStatus -ne $StatusConvite) {
    $changed++
  }

  $row.status_convite = $StatusConvite
  $row.observacoes = Append-Obs -Current $row.observacoes -Extra "status_convite:${currentStatus}->${StatusConvite}@$timestamp"
  if (Is-NotBlank $Observacao) {
    $row.observacoes = Append-Obs -Current $row.observacoes -Extra $Observacao
  }
}

if ($matched -eq 0) {
  throw "Nenhum registro encontrado com os filtros informados."
}

if ($DryRun) {
  Write-Host "DryRun concluido. Nenhuma alteracao gravada."
  Write-Host "Registros encontrados: $matched"
  Write-Host "Status alterado em: $changed"
  exit 0
}

$rows | Export-Csv -Path $outreachPath -NoTypeInformation -Encoding UTF8

$statusPath = Join-Path $resolvedRunDir "status.md"
if (Test-Path $statusPath) {
  $statusBlock = @"

## Outreach update $(Get-Date -Format "yyyyMMdd-HHmmss")
- Filtro empresa_id: $(if (Is-NotBlank $EmpresaId) { $EmpresaId } else { "N/A" })
- Filtro cliente: $(if (Is-NotBlank $Cliente) { $Cliente } else { "N/A" })
- Novo status convite: $StatusConvite
- Registros encontrados: $matched
- Registros com mudanca efetiva: $changed
"@
  Add-Content -Path $statusPath -Value $statusBlock -Encoding UTF8
}

Write-Host "Outreach atualizado: $outreachPath"
Write-Host "Registros encontrados: $matched"
Write-Host "Registros com mudanca efetiva: $changed"

exit 0
