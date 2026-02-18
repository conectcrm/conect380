param(
  [string]$RunDir = "",
  [string]$Owner = "time-comercial",
  [int]$DefaultFollowupHours = 4,
  [string]$OutputCsvPath = "",
  [string]$OutputMdPath = ""
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

function Parse-DateSafe {
  param(
    [string]$Value
  )

  if ([string]::IsNullOrWhiteSpace($Value)) {
    return $null
  }

  $parsed = [datetime]::MinValue
  $ok = [datetime]::TryParse($Value, [ref]$parsed)
  if ($ok) {
    return $parsed
  }

  return $null
}

function Resolve-ActionPlan {
  param(
    [string]$Status,
    [datetime]$Now,
    [datetime]$DueDate,
    [int]$FallbackHours
  )

  $priority = "ALTA"
  $category = "FOLLOWUP_COMERCIAL"
  $action = "Atualizar contato com cliente e registrar retorno."
  $followupAt = $Now.AddHours($FallbackHours)
  $include = $true

  switch ($Status) {
    "PENDENTE" {
      $priority = "CRITICA"
      $action = "Executar primeiro contato e propor horario da janela."
      $followupAt = $Now.AddHours(2)
      break
    }
    "EM_CONTATO" {
      $priority = "ALTA"
      $action = "Cobrar retorno e confirmar aceite/agendamento."
      $followupAt = $Now.AddHours($FallbackHours)
      break
    }
    "SEM_RESPOSTA" {
      $priority = "CRITICA"
      $action = "Enviar ultimo lembrete e escalar internamente em seguida."
      $followupAt = $Now.AddHours(1)
      break
    }
    "BLOQUEADO" {
      $priority = "CRITICA"
      $category = "ESCALACAO_TECNICA"
      $action = "Escalar bloqueio tecnico/comercial com responsavel de on-call."
      $followupAt = $Now.AddHours(1)
      break
    }
    "ACEITO" {
      $priority = "BAIXA"
      $category = "ENCERRADO"
      $action = "Convite aceito. Seguir para onboarding."
      $include = $false
      break
    }
    "AGENDADO" {
      $priority = "BAIXA"
      $category = "ENCERRADO"
      $action = "Convite agendado. Confirmar horario combinado."
      $include = $false
      break
    }
    "RECUSADO" {
      $priority = "MEDIA"
      $category = "ENCERRADO"
      $action = "Registrar motivo da recusa e substituir cliente do lote."
      $include = $false
      break
    }
    default {
      $priority = "ALTA"
      $action = "Revisar status do convite e registrar avancos."
      $followupAt = $Now.AddHours($FallbackHours)
      break
    }
  }

  if ($null -ne $DueDate -and $include) {
    if ($DueDate.Date -lt $Now.Date) {
      $priority = "CRITICA"
      $followupAt = $Now.AddHours(1)
    }
    elseif ($DueDate.Date -eq $Now.Date -and $priority -ne "CRITICA") {
      $priority = "ALTA"
      $candidate = $Now.AddHours(2)
      if ($candidate -lt $followupAt) {
        $followupAt = $candidate
      }
    }
  }

  return [pscustomobject]@{
    Include = $include
    Priority = $priority
    Category = $category
    Action = $action
    FollowupAt = $followupAt
  }
}

function Priority-Rank {
  param(
    [string]$Priority
  )

  switch ($Priority) {
    "CRITICA" { return 1 }
    "ALTA" { return 2 }
    "MEDIA" { return 3 }
    "BAIXA" { return 4 }
    default { return 5 }
  }
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

$stamp = Get-Date -Format "yyyyMMdd-HHmmss"
if ([string]::IsNullOrWhiteSpace($OutputCsvPath)) {
  $OutputCsvPath = Join-Path $resolvedRunDir "outreach-followup-$stamp.csv"
}
elseif (-not [System.IO.Path]::IsPathRooted($OutputCsvPath)) {
  $OutputCsvPath = Join-Path $resolvedRunDir $OutputCsvPath
}

if ([string]::IsNullOrWhiteSpace($OutputMdPath)) {
  $OutputMdPath = Join-Path $resolvedRunDir "outreach-followup-$stamp.md"
}
elseif (-not [System.IO.Path]::IsPathRooted($OutputMdPath)) {
  $OutputMdPath = Join-Path $resolvedRunDir $OutputMdPath
}

$now = Get-Date
$statusMap = @{}
$followupRows = @()

foreach ($row in $rows) {
  $status = Normalize-Status -Value $row.status_convite
  if (-not $statusMap.ContainsKey($status)) {
    $statusMap[$status] = 0
  }
  $statusMap[$status]++

  $dueDate = Parse-DateSafe -Value $row.prazo
  $plan = Resolve-ActionPlan -Status $status -Now $now -DueDate $dueDate -FallbackHours $DefaultFollowupHours
  if (-not $plan.Include) {
    continue
  }

  $assignedOwner = if (Is-NotBlank $row.owner) { $row.owner } else { $Owner }
  $followupRows += [pscustomobject]@{
    cliente = $row.cliente
    empresa_id = $row.empresa_id
    owner = $assignedOwner
    status_convite = $status
    prioridade_followup = $plan.Priority
    categoria = $plan.Category
    proxima_acao = $plan.Action
    prazo_original = $row.prazo
    followup_ate = $plan.FollowupAt.ToString("yyyy-MM-dd HH:mm")
    contato_negocio = $row.contato_negocio
    contato_tecnico = $row.contato_tecnico
    observacoes = $row.observacoes
  }
}

$sortedRows = @($followupRows | Sort-Object @{ Expression = { Priority-Rank $_.prioridade_followup } }, followup_ate, cliente)
$sortedRows | Export-Csv -Path $OutputCsvPath -NoTypeInformation -Encoding UTF8

$statusLines = @()
foreach ($k in @($statusMap.Keys | Sort-Object)) {
  $statusLines += "- ${k}: $($statusMap[$k])"
}
if ($statusLines.Count -eq 0) {
  $statusLines += "- sem status registrados"
}

$queueCount = $sortedRows.Count
$criticalCount = @($sortedRows | Where-Object { $_.prioridade_followup -eq "CRITICA" }).Count
$highCount = @($sortedRows | Where-Object { $_.prioridade_followup -eq "ALTA" }).Count

$report = @"
# MVP Outreach Follow-up Queue

Data: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
Sessao: $resolvedRunDir

## Status atual dos convites
$($statusLines -join "`n")

## Fila de follow-up
- Itens em aberto: $queueCount
- Prioridade CRITICA: $criticalCount
- Prioridade ALTA: $highCount
- Planilha: $OutputCsvPath

## Ordem de execucao sugerida
1. Tratar itens CRITICA primeiro (prazo vencido, sem resposta ou bloqueio).
2. Tratar itens ALTA no mesmo turno comercial.
3. Atualizar status apos cada retorno com `update-mvp-pilot-outreach-status.ps1`.
4. Reexecutar fechamento com `close-mvp-pilot-wave.ps1` ao fim da rodada.
"@

Set-Content -Path $OutputMdPath -Value $report -Encoding UTF8

$statusPath = Join-Path $resolvedRunDir "status.md"
if (Test-Path $statusPath) {
  $statusBlock = @"

## Outreach follow-up $(Get-Date -Format "yyyyMMdd-HHmmss")
- Relatorio: $OutputMdPath
- Planilha: $OutputCsvPath
- Itens em aberto: $queueCount
- CRITICA: $criticalCount
- ALTA: $highCount
"@
  Add-Content -Path $statusPath -Value $statusBlock -Encoding UTF8
}

Write-Host "Follow-up gerado:"
Write-Host " - Relatorio: $OutputMdPath"
Write-Host " - Planilha: $OutputCsvPath"
Write-Host " - Itens em aberto: $queueCount"
Write-Host " - CRITICA: $criticalCount"
Write-Host " - ALTA: $highCount"

exit 0
