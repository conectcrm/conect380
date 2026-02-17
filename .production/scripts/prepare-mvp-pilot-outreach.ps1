param(
  [string]$RunDir = "",
  [string]$Owner = "time-comercial",
  [int]$DaysToContact = 1
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

function Get-ActionByStatus {
  param(
    [string]$Status
  )

  switch ($Status) {
    "SUGERIDO" {
      return [pscustomobject]@{
        prioridade = "ALTA"
        acao = "Convidar para janela piloto imediatamente"
      }
    }
    "REVISAR_CONTATO" {
      return [pscustomobject]@{
        prioridade = "ALTA"
        acao = "Validar contato de negocio e confirmar canal de convite"
      }
    }
    "REVISAR_PERFIL" {
      return [pscustomobject]@{
        prioridade = "MEDIA"
        acao = "Validar perfil da conta antes de confirmar piloto"
      }
    }
    default {
      return [pscustomobject]@{
        prioridade = "CRITICA"
        acao = "Definir cliente real para completar lote minimo"
      }
    }
  }
}

$RunDir = Resolve-RunDir -ProvidedRunDir $RunDir
$clientsPath = Join-Path $RunDir "clients.csv"
if (-not (Test-Path $clientsPath)) {
  throw "Arquivo clients.csv nao encontrado em $RunDir."
}

$clients = @(Import-Csv $clientsPath)
$dueDate = (Get-Date).Date.AddDays($DaysToContact).ToString("yyyy-MM-dd")
$outreachPath = Join-Path $RunDir "outreach.csv"

$outreachRows = @()
foreach ($client in $clients) {
  $status = if ([string]::IsNullOrWhiteSpace($client.status)) { "PENDENTE" } else { $client.status }
  $actionData = Get-ActionByStatus -Status $status

  $outreachRows += [pscustomobject]@{
    cliente = $client.cliente
    empresa_id = $client.empresa_id
    status_cliente = $status
    prioridade = $actionData.prioridade
    acao = $actionData.acao
    contato_negocio = $client.contato_negocio
    contato_tecnico = $client.contato_tecnico
    owner = $Owner
    prazo = $dueDate
    status_convite = "PENDENTE"
    observacoes = $client.observacoes
  }
}

$outreachRows | Export-Csv -Path $outreachPath -NoTypeInformation -Encoding UTF8

Write-Host "Plano de outreach gerado em: $outreachPath"
Write-Host "Itens: $($outreachRows.Count)"
Write-Host "Prazo sugerido: $dueDate"

exit 0
