param(
  [string]$RunDir = "",
  [int]$MinAcceptedClients = 1,
  [string]$OutputPath = ""
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

function Parse-MetricLine {
  param(
    [string[]]$Lines,
    [string]$Prefix
  )

  $match = $Lines | Where-Object { $_ -like "$Prefix*" } | Select-Object -First 1
  if ($null -eq $match) {
    return ""
  }

  return $match.Substring($Prefix.Length).Trim()
}

function Is-NotBlank {
  param(
    [string]$Value
  )

  return -not [string]::IsNullOrWhiteSpace($Value)
}

function Normalize-InviteStatus {
  param(
    [string]$Value
  )

  if ([string]::IsNullOrWhiteSpace($Value)) {
    return "SEM_STATUS"
  }

  return $Value.Trim().ToUpperInvariant()
}

$resolvedRunDir = Resolve-RunDir -ProvidedRunDir $RunDir
$runName = Split-Path $resolvedRunDir -Leaf

if ([string]::IsNullOrWhiteSpace($OutputPath)) {
  $stamp = Get-Date -Format "yyyyMMdd-HHmmss"
  $OutputPath = Join-Path $resolvedRunDir "wave-closure-$stamp.md"
}
elseif (-not [System.IO.Path]::IsPathRooted($OutputPath)) {
  $OutputPath = Join-Path $resolvedRunDir $OutputPath
}

$outreachPath = Join-Path $resolvedRunDir "outreach.csv"
if (-not (Test-Path $outreachPath)) {
  throw "Arquivo outreach.csv nao encontrado em $resolvedRunDir."
}

$outreachRows = @(Import-Csv $outreachPath)
$statusMap = @{}
foreach ($row in $outreachRows) {
  $status = Normalize-InviteStatus -Value $row.status_convite
  if (-not $statusMap.ContainsKey($status)) {
    $statusMap[$status] = 0
  }
  $statusMap[$status]++
}

$totalOutreach = $outreachRows.Count
$acceptedStatuses = @("ACEITO", "AGENDADO")
$rejectedStatuses = @("RECUSADO", "BLOQUEADO")

$acceptedCount = 0
foreach ($status in $acceptedStatuses) {
  if ($statusMap.ContainsKey($status)) {
    $acceptedCount += [int]$statusMap[$status]
  }
}

$rejectedCount = 0
foreach ($status in $rejectedStatuses) {
  if ($statusMap.ContainsKey($status)) {
    $rejectedCount += [int]$statusMap[$status]
  }
}

$openCount = $totalOutreach - $acceptedCount - $rejectedCount
if ($openCount -lt 0) {
  $openCount = 0
}

$acceptanceRate = 0
if ($totalOutreach -gt 0) {
  $acceptanceRate = [math]::Round(($acceptedCount / $totalOutreach) * 100, 2)
}

$statusLines = @()
if ($statusMap.Keys.Count -eq 0) {
  $statusLines += "- sem dados de outreach"
}
else {
  foreach ($k in @($statusMap.Keys | Sort-Object)) {
    $statusLines += "- ${k}: $($statusMap[$k])"
  }
}

$readinessDecision = "UNKNOWN"
$readinessPath = ""
$readinessFiles = @(Get-ChildItem $resolvedRunDir -File -Filter "readiness-*.md" | Sort-Object LastWriteTime -Descending)
if ($readinessFiles.Count -gt 0) {
  $readinessPath = $readinessFiles[0].FullName
  $readinessDecision = Parse-MetricLine -Lines (Get-Content $readinessPath) -Prefix "- Resultado:"
}

$coverageDecision = "UNKNOWN"
$coveragePath = ""
$coverageFiles = @(Get-ChildItem $resolvedRunDir -File -Filter "functional-coverage-*.md" | Sort-Object LastWriteTime -Descending)
if ($coverageFiles.Count -gt 0) {
  $coveragePath = $coverageFiles[0].FullName
  $coverageDecision = Parse-MetricLine -Lines (Get-Content $coveragePath) -Prefix "- Decisao:"
}

$incidentsPath = Join-Path $resolvedRunDir "incidents.md"
$p0Count = 0
if (Test-Path $incidentsPath) {
  $p0Count = @(
    Get-Content $incidentsPath |
      Where-Object { $_ -match "(?i)\bP0\b" -and $_ -notmatch "^\s*#" }
  ).Count
}

$monitorState = "NOT_RUNNING"
$monitorPid = ""
$monitorProcess = Get-CimInstance Win32_Process |
  Where-Object {
    ($_.Name -eq "powershell.exe" -or $_.Name -eq "pwsh.exe") -and
    $_.CommandLine -like "*run-mvp-pilot-window-monitor.ps1*" -and
    $_.CommandLine -like "*$runName*"
  } |
  Select-Object -First 1
if ($null -ne $monitorProcess) {
  $monitorState = "RUNNING"
  $monitorPid = "$($monitorProcess.ProcessId)"
}

$decision = "GO_CONDICIONAL"
$decisionReasons = @()

if ($totalOutreach -eq 0) {
  $decision = "PAUSE"
  $decisionReasons += "Sem clientes no outreach da wave."
}

if ($readinessDecision -ne "GO") {
  $decision = "PAUSE"
  $decisionReasons += "Readiness tecnico diferente de GO."
}

if ($coverageDecision -ne "COVERAGE_OK") {
  $decision = "PAUSE"
  $decisionReasons += "Cobertura funcional diferente de COVERAGE_OK."
}

if ($p0Count -gt 0) {
  $decision = "PAUSE"
  $decisionReasons += "Incidentes P0 registrados na sessao."
}

if ($decision -ne "PAUSE") {
  if ($acceptedCount -ge $MinAcceptedClients) {
    if ($openCount -eq 0) {
      $decision = "GO_NEXT_WAVE"
      $decisionReasons += "Meta minima de aceite atingida e sem pendencias abertas."
    }
    else {
      $decision = "GO_CONDICIONAL"
      $decisionReasons += "Meta minima de aceite atingida, mas ainda existem convites em aberto."
    }
  }
  else {
    if ($openCount -gt 0) {
      $decision = "GO_CONDICIONAL"
      $decisionReasons += "Convites ainda em andamento; aguardar retorno comercial."
    }
    else {
      $decision = "PAUSE"
      $decisionReasons += "Meta minima de aceite nao atingida e sem convites em aberto."
    }
  }
}

if ($decisionReasons.Count -eq 0) {
  $decisionReasons += "Sem justificativa calculada."
}

$nextActions = @()
switch ($decision) {
  "GO_NEXT_WAVE" {
    $nextActions += "Liberar proxima onda comercial com lote controlado."
    $nextActions += "Manter monitoramento tecnico da sessao atual ate o fim da janela."
  }
  "GO_CONDICIONAL" {
    $nextActions += "Concluir follow-up comercial dos convites em aberto."
    $nextActions += "Atualizar outreach.csv e rerodar o fechamento ao fim do dia."
  }
  default {
    $nextActions += "Pausar novas ativacoes comerciais da proxima onda."
    $nextActions += "Resolver blockers tecnicos/comerciais e reavaliar readiness."
  }
}

$decisionReasonLines = @($decisionReasons | ForEach-Object { "- Motivo: $_" }) -join "`n"
$nextActionLines = @($nextActions | ForEach-Object { "- $_" }) -join "`n"

$report = @"
# MVP Wave Closure

Data: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
Sessao: $resolvedRunDir

## Comercial
- Outreach total: $totalOutreach
- Aceites (ACEITO/AGENDADO): $acceptedCount
- Recusados/Bloqueados: $rejectedCount
- Em aberto: $openCount
- Taxa de aceite: $acceptanceRate%
$($statusLines -join "`n")

## Tecnico
- Readiness: $readinessDecision
- Readiness relatorio: $(if (Is-NotBlank $readinessPath) { $readinessPath } else { "N/A" })
- Cobertura funcional: $coverageDecision
- Coverage relatorio: $(if (Is-NotBlank $coveragePath) { $coveragePath } else { "N/A" })
- Incidentes P0 (heuristica): $p0Count
- Monitor da janela: $monitorState
- Monitor PID: $(if (Is-NotBlank $monitorPid) { $monitorPid } else { "N/A" })

## Decisao final da wave
- Resultado: $decision
- Minimo de aceites configurado: $MinAcceptedClients
$decisionReasonLines

## Proximas acoes recomendadas
$nextActionLines
"@

Set-Content -Path $OutputPath -Value $report -Encoding UTF8

$statusPath = Join-Path $resolvedRunDir "status.md"
if (Test-Path $statusPath) {
  $statusBlock = @"

## Wave closure $(Get-Date -Format "yyyyMMdd-HHmmss")
- Relatorio: $OutputPath
- Resultado: $decision
- Aceites: $acceptedCount/$totalOutreach
- Readiness: $readinessDecision
- Coverage: $coverageDecision
- P0: $p0Count
"@
  Add-Content -Path $statusPath -Value $statusBlock -Encoding UTF8
}

Write-Host "Fechamento da wave gerado: $OutputPath"
Write-Host "Decisao: $decision"
Write-Host "Aceites: $acceptedCount/$totalOutreach ($acceptanceRate`%)"
Write-Host "Readiness: $readinessDecision"
Write-Host "Coverage: $coverageDecision"
Write-Host "P0: $p0Count"

if ($decision -eq "PAUSE") {
  exit 1
}

exit 0
