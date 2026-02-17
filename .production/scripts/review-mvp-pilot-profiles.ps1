param(
  [string]$RunDir = "",
  [string]$Reviewer = "time-comercial",
  [int]$MinScore = 1,
  [switch]$ApproveAll
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

function Extract-Score {
  param(
    [string]$Observacoes
  )

  if ([string]::IsNullOrWhiteSpace($Observacoes)) {
    return 0
  }

  if ($Observacoes -match "score=([0-9]+)") {
    return [int]$matches[1]
  }

  return 0
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

$clients = @(Import-Csv $clientsPath)
$updated = @()
$approved = @()
$keptInReview = @()

foreach ($client in $clients) {
  $row = [pscustomobject]@{
    cliente = $client.cliente
    empresa_id = $client.empresa_id
    contato_tecnico = $client.contato_tecnico
    contato_negocio = $client.contato_negocio
    janela_inicio = $client.janela_inicio
    janela_fim = $client.janela_fim
    status = $client.status
    observacoes = $client.observacoes
  }

  if ($row.status -ne "REVISAR_PERFIL") {
    $updated += $row
    continue
  }

  $score = Extract-Score -Observacoes $row.observacoes
  $emailSuspicious = Is-SuspiciousEmail -Email $row.contato_negocio
  $decision = "MANTER_REVISAO"
  $reason = ""

  if ($ApproveAll) {
    $decision = "APROVAR"
    $reason = "forcado_por_aprove_all"
  }
  elseif ($score -ge $MinScore -and -not $emailSuspicious) {
    $decision = "APROVAR"
    $reason = "score_ok_e_contato_valido"
  }
  else {
    $decision = "MANTER_REVISAO"
    if ($emailSuspicious) {
      $reason = "contato_suspeito"
    }
    else {
      $reason = "score_abaixo_minimo"
    }
  }

  if ($decision -eq "APROVAR") {
    $row.status = "SUGERIDO"
    $row.observacoes = Append-Obs -Current $row.observacoes -Extra "perfil_revisado_aprovado_por=$Reviewer"
    $row.observacoes = Append-Obs -Current $row.observacoes -Extra "perfil_revisado_motivo=$reason"
    $approved += "$($row.cliente) (score=$score)"
  }
  else {
    $row.observacoes = Append-Obs -Current $row.observacoes -Extra "perfil_revisado_pendente_por=$Reviewer"
    $row.observacoes = Append-Obs -Current $row.observacoes -Extra "perfil_revisado_motivo=$reason"
    $keptInReview += "$($row.cliente) (score=$score)"
  }

  $updated += $row
}

$updated | Export-Csv -Path $clientsPath -NoTypeInformation -Encoding UTF8

$timestamp = Get-Date -Format "yyyyMMdd-HHmmss-fff"
$reportPath = Join-Path $RunDir "profile-review-$timestamp.md"
$approvedLines = if ($approved.Count -gt 0) { ($approved | ForEach-Object { "- $_" }) -join "`n" } else { "- nenhum" }
$pendingLines = if ($keptInReview.Count -gt 0) { ($keptInReview | ForEach-Object { "- $_" }) -join "`n" } else { "- nenhum" }

$report = @"
# Revisao de Perfil do Piloto

Data: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
Sessao: $RunDir
Revisor: $Reviewer

## Resultado
- Aprovados: $($approved.Count)
- Mantidos em revisao: $($keptInReview.Count)

## Clientes aprovados
$approvedLines

## Clientes mantidos em revisao
$pendingLines
"@
Set-Content -Path $reportPath -Value $report -Encoding UTF8

Write-Host "Revisao de perfil concluida."
Write-Host " - clients.csv atualizado: $clientsPath"
Write-Host " - relatorio: $reportPath"
Write-Host " - aprovados: $($approved.Count)"
Write-Host " - mantidos em revisao: $($keptInReview.Count)"

exit 0
