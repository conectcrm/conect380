param(
  [string]$RunDir = "",
  [string]$UpdatesCsvPath = "",
  [switch]$SkipIfAlreadyFinal,
  [switch]$AllowNoChanges,
  [switch]$DryRun
)

$ErrorActionPreference = "Stop"
$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
$pilotRoot = Join-Path $repoRoot ".production\pilot-runs"
$validStatuses = @("PENDENTE", "EM_CONTATO", "ACEITO", "AGENDADO", "RECUSADO", "BLOQUEADO", "SEM_RESPOSTA")
$finalStatuses = @("ACEITO", "AGENDADO", "RECUSADO", "BLOQUEADO")

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
    return ""
  }

  return $Value.Trim().ToUpperInvariant()
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

function Build-MatchKey {
  param(
    [pscustomobject]$Row
  )

  if (Is-NotBlank $Row.empresa_id) {
    return "empresa:$($Row.empresa_id.Trim().ToLowerInvariant())"
  }
  if (Is-NotBlank $Row.cliente) {
    return "cliente:$($Row.cliente.Trim().ToLowerInvariant())"
  }
  return ""
}

$resolvedRunDir = Resolve-RunDir -ProvidedRunDir $RunDir
$outreachPath = Join-Path $resolvedRunDir "outreach.csv"
if (-not (Test-Path $outreachPath)) {
  throw "Arquivo outreach.csv nao encontrado em $resolvedRunDir."
}

if ([string]::IsNullOrWhiteSpace($UpdatesCsvPath)) {
  throw "Informe -UpdatesCsvPath com a planilha de atualizacoes."
}
if (-not [System.IO.Path]::IsPathRooted($UpdatesCsvPath)) {
  $UpdatesCsvPath = Join-Path $resolvedRunDir $UpdatesCsvPath
}
if (-not (Test-Path $UpdatesCsvPath)) {
  throw "Arquivo de atualizacoes nao encontrado: $UpdatesCsvPath"
}

$outreachRows = @(Import-Csv $outreachPath)
$updatesRows = @(Import-Csv $UpdatesCsvPath)
if ($updatesRows.Count -eq 0) {
  throw "Planilha de atualizacoes esta vazia: $UpdatesCsvPath"
}

$requiredColumns = @("status_convite")
$firstUpdate = $updatesRows[0]
foreach ($column in $requiredColumns) {
  if (-not ($firstUpdate.PSObject.Properties.Name -contains $column)) {
    throw "Coluna obrigatoria ausente em updates CSV: $column"
  }
}

$index = @{}
foreach ($row in $outreachRows) {
  $key = Build-MatchKey -Row $row
  if (-not [string]::IsNullOrWhiteSpace($key)) {
    $index[$key] = $row
  }
}

$errors = @()
$applied = 0
$skippedFinal = 0
$notFound = 0
$unchanged = 0
$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"

foreach ($update in $updatesRows) {
  $updateKey = Build-MatchKey -Row $update
  if ([string]::IsNullOrWhiteSpace($updateKey)) {
    $errors += "Linha sem identificador (empresa_id/cliente)."
    continue
  }

  if (-not $index.ContainsKey($updateKey)) {
    $notFound++
    $errors += "Registro nao encontrado no outreach para chave '$updateKey'."
    continue
  }

  $target = $index[$updateKey]
  $newStatus = Normalize-Status -Value $update.status_convite
  if (-not $validStatuses.Contains($newStatus)) {
    $errors += "Status invalido para '$updateKey': '$($update.status_convite)'."
    continue
  }

  $currentStatus = Normalize-Status -Value $target.status_convite
  if ([string]::IsNullOrWhiteSpace($currentStatus)) {
    $currentStatus = "SEM_STATUS"
  }

  if ($SkipIfAlreadyFinal -and $finalStatuses.Contains($currentStatus)) {
    $skippedFinal++
    continue
  }

  if ($currentStatus -eq $newStatus) {
    $unchanged++
    continue
  }

  $target.status_convite = $newStatus
  if (Is-NotBlank $update.observacao) {
    $target.observacoes = Append-Obs -Current $target.observacoes -Extra $update.observacao
  }
  $target.observacoes = Append-Obs -Current $target.observacoes -Extra "status_convite:${currentStatus}->${newStatus}@$timestamp"

  if (Is-NotBlank $update.owner) {
    $target.owner = $update.owner.Trim()
  }

  $applied++
}

if ($errors.Count -gt 0) {
  $errorPath = Join-Path $resolvedRunDir "outreach-import-errors-$(Get-Date -Format 'yyyyMMdd-HHmmss').md"
  $errorReport = @"
# Outreach Import Errors

Data: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
Arquivo: $UpdatesCsvPath

## Erros
$($errors | ForEach-Object { "- $_" } | Out-String)
"@
  Set-Content -Path $errorPath -Value $errorReport -Encoding UTF8
  throw "Falha na importacao. Erros encontrados: $($errors.Count). Verifique: $errorPath"
}

if ($DryRun) {
  Write-Host "DryRun concluido. Nenhuma alteracao gravada."
  Write-Host "Atualizacoes aplicaveis: $applied"
  Write-Host "Sem mudanca: $unchanged"
  Write-Host "Ignorados (status final): $skippedFinal"
  Write-Host "Nao encontrados: $notFound"
  if ($applied -eq 0) {
    Write-Host "Aviso: nenhuma alteracao efetiva detectada no arquivo de updates."
  }
  exit 0
}

if ($applied -eq 0 -and -not $AllowNoChanges) {
  throw "Nenhuma alteracao efetiva encontrada em APPLY (applied=0). Revise o CSV ou use -AllowNoChanges."
}

$outreachRows | Export-Csv -Path $outreachPath -NoTypeInformation -Encoding UTF8

$statusPath = Join-Path $resolvedRunDir "status.md"
if (Test-Path $statusPath) {
  $statusBlock = @"

## Outreach import $(Get-Date -Format "yyyyMMdd-HHmmss")
- Arquivo: $UpdatesCsvPath
- Atualizacoes aplicadas: $applied
- Sem mudanca: $unchanged
- Ignorados (status final): $skippedFinal
- Nao encontrados: $notFound
"@
  Add-Content -Path $statusPath -Value $statusBlock -Encoding UTF8
}

Write-Host "Importacao de outreach concluida: $outreachPath"
Write-Host "Arquivo de origem: $UpdatesCsvPath"
Write-Host "Atualizacoes aplicadas: $applied"
Write-Host "Sem mudanca: $unchanged"
Write-Host "Ignorados (status final): $skippedFinal"
Write-Host "Nao encontrados: $notFound"

exit 0
