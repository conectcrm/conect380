param(
  [string]$RunDir = "",
  [datetime]$WindowStart = (Get-Date).Date.AddDays(1).AddHours(9),
  [int]$WindowHours = 48
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

function Is-SuspiciousEmail {
  param(
    [string]$Email
  )

  if ([string]::IsNullOrWhiteSpace($Email)) {
    return $true
  }

  $normalized = $Email.Trim().ToLower()
  return ($normalized -like "*@test.*" -or $normalized -like "*@teste.*" -or $normalized -like "*example.*" -or $normalized -like "*mailinator*")
}

function Extract-EmailFromContact {
  param(
    [string]$Contact
  )

  if ([string]::IsNullOrWhiteSpace($Contact)) {
    return ""
  }

  if ($Contact -match "<([^>]+)>") {
    return $matches[1].Trim()
  }

  return $Contact.Trim()
}

function Append-Obs {
  param(
    [string]$Current,
    [string]$Extra
  )

  if ([string]::IsNullOrWhiteSpace($Current)) {
    return $Extra
  }

  if ($Current -like "*$Extra*") {
    return $Current
  }

  return "$Current; $Extra"
}

$RunDir = Resolve-RunDir -ProvidedRunDir $RunDir
$clientsPath = Join-Path $RunDir "clients.csv"
if (-not (Test-Path $clientsPath)) {
  throw "Arquivo clients.csv nao encontrado em $RunDir."
}

$windowEnd = $WindowStart.AddHours($WindowHours)
$windowStartText = $WindowStart.ToString("yyyy-MM-dd HH:mm")
$windowEndText = $windowEnd.ToString("yyyy-MM-dd HH:mm")

$rows = @(Import-Csv $clientsPath)
$updated = @()

$changes = 0
$upgradedContacts = 0
$filledTechContacts = 0
$scheduledWindows = 0
$statusUpgraded = 0

foreach ($row in $rows) {
  $item = [pscustomobject]@{
    cliente = $row.cliente
    empresa_id = $row.empresa_id
    contato_tecnico = $row.contato_tecnico
    contato_negocio = $row.contato_negocio
    janela_inicio = $row.janela_inicio
    janela_fim = $row.janela_fim
    status = $row.status
    observacoes = $row.observacoes
  }

  if ([string]::IsNullOrWhiteSpace($item.empresa_id)) {
    $updated += $item
    continue
  }

  $rowChanged = $false
  $bizEmail = Extract-EmailFromContact -Contact $item.contato_negocio
  $techEmail = Extract-EmailFromContact -Contact $item.contato_tecnico

  if (Is-SuspiciousEmail -Email $bizEmail) {
    if (-not (Is-SuspiciousEmail -Email $techEmail)) {
      $item.contato_negocio = $techEmail
      $item.observacoes = Append-Obs -Current $item.observacoes -Extra "contato_negocio_ajustado_por_contato_tecnico"
      $rowChanged = $true
      $upgradedContacts++
      $bizEmail = $techEmail
    }
  }

  if ([string]::IsNullOrWhiteSpace($item.contato_tecnico) -and -not [string]::IsNullOrWhiteSpace($bizEmail)) {
    $item.contato_tecnico = "Contato negocio <$bizEmail>"
    $item.observacoes = Append-Obs -Current $item.observacoes -Extra "contato_tecnico_preenchido_com_contato_negocio"
    $rowChanged = $true
    $filledTechContacts++
  }

  if ([string]::IsNullOrWhiteSpace($item.janela_inicio)) {
    $item.janela_inicio = $windowStartText
    $rowChanged = $true
    $scheduledWindows++
  }

  if ([string]::IsNullOrWhiteSpace($item.janela_fim)) {
    $item.janela_fim = $windowEndText
    $rowChanged = $true
  }

  if ($item.status -eq "REVISAR_CONTATO" -and -not (Is-SuspiciousEmail -Email $bizEmail)) {
    $item.status = "SUGERIDO"
    $item.observacoes = Append-Obs -Current $item.observacoes -Extra "status_atualizado_para_sugerido"
    $rowChanged = $true
    $statusUpgraded++
  }

  if ($rowChanged) {
    $changes++
  }

  $updated += $item
}

$updated | Export-Csv -Path $clientsPath -NoTypeInformation -Encoding UTF8

Write-Host "Clientes finalizados em: $clientsPath"
Write-Host "Janela definida: $windowStartText ate $windowEndText"
Write-Host "Linhas alteradas: $changes"
Write-Host "Contato de negocio ajustado: $upgradedContacts"
Write-Host "Contato tecnico preenchido: $filledTechContacts"
Write-Host "Status promovido para SUGERIDO: $statusUpgraded"

exit 0
