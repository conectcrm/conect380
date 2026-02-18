param(
  [string]$RunDir = "",
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

  $value = $match.Substring($Prefix.Length).Trim()
  return $value
}

$resolvedRunDir = Resolve-RunDir -ProvidedRunDir $RunDir
$runName = Split-Path $resolvedRunDir -Leaf

if ([string]::IsNullOrWhiteSpace($OutputPath)) {
  $stamp = Get-Date -Format "yyyyMMdd-HHmmss"
  $OutputPath = Join-Path $resolvedRunDir "wave-status-$stamp.md"
}
elseif (-not [System.IO.Path]::IsPathRooted($OutputPath)) {
  $OutputPath = Join-Path $resolvedRunDir $OutputPath
}

$outreachPath = Join-Path $resolvedRunDir "outreach.csv"
$readinessPath = ""
$coveragePath = ""
$cycleSummaryPath = ""

$outreachRows = @()
if (Test-Path $outreachPath) {
  $outreachRows = @(Import-Csv $outreachPath)
}

$readinessFiles = @(Get-ChildItem $resolvedRunDir -File -Filter "readiness-*.md" | Sort-Object LastWriteTime -Descending)
if ($readinessFiles.Count -gt 0) {
  $readinessPath = $readinessFiles[0].FullName
}

$coverageFiles = @(Get-ChildItem $resolvedRunDir -File -Filter "functional-coverage-*.md" | Sort-Object LastWriteTime -Descending)
if ($coverageFiles.Count -gt 0) {
  $coveragePath = $coverageFiles[0].FullName
}

$cyclesRoot = Join-Path $resolvedRunDir "cycles"
if (Test-Path $cyclesRoot) {
  $latestCycle = Get-ChildItem $cyclesRoot -Directory | Sort-Object LastWriteTime -Descending | Select-Object -First 1
  if ($null -ne $latestCycle) {
    $candidate = Join-Path $latestCycle.FullName "summary.md"
    if (Test-Path $candidate) {
      $cycleSummaryPath = $candidate
    }
  }
}

$readinessDecision = "UNKNOWN"
if (-not [string]::IsNullOrWhiteSpace($readinessPath)) {
  $readinessLines = Get-Content $readinessPath
  $readinessDecision = Parse-MetricLine -Lines $readinessLines -Prefix "- Resultado:"
}

$coverageDecision = "UNKNOWN"
$coveragePass = ""
$coverageFail = ""
$coverageBlocked = ""
$coverageMissing = ""
if (-not [string]::IsNullOrWhiteSpace($coveragePath)) {
  $coverageLines = Get-Content $coveragePath
  $coverageDecision = Parse-MetricLine -Lines $coverageLines -Prefix "- Decisao:"
  $coveragePass = Parse-MetricLine -Lines $coverageLines -Prefix "- PASS:"
  $coverageFail = Parse-MetricLine -Lines $coverageLines -Prefix "- FAIL:"
  $coverageBlocked = Parse-MetricLine -Lines $coverageLines -Prefix "- BLOCKED:"
  $coverageMissing = Parse-MetricLine -Lines $coverageLines -Prefix "- MISSING:"
}

$outreachTotal = @($outreachRows).Count
$statusMap = @{}
foreach ($row in $outreachRows) {
  $status = if ([string]::IsNullOrWhiteSpace($row.status_convite)) { "SEM_STATUS" } else { $row.status_convite }
  if (-not $statusMap.ContainsKey($status)) {
    $statusMap[$status] = 0
  }
  $statusMap[$status]++
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

$monitorProcess = Get-CimInstance Win32_Process -Filter "Name='powershell.exe'" |
  Where-Object { $_.CommandLine -like "*run-mvp-pilot-window-monitor.ps1*" -and $_.CommandLine -like "*$runName*" } |
  Select-Object -First 1

$monitorState = "NOT_RUNNING"
$monitorPid = ""
if ($null -ne $monitorProcess) {
  $monitorState = "RUNNING"
  $monitorPid = "$($monitorProcess.ProcessId)"
}

$nextDecision = "GO"
if ($readinessDecision -ne "GO") {
  $nextDecision = "GO_CONDICIONAL"
}
if ($coverageDecision -ne "COVERAGE_OK") {
  $nextDecision = "GO_CONDICIONAL"
}

$report = @"
# MVP Wave Status Snapshot

Data: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
Sessao: $resolvedRunDir

## Operacional comercial
- outreach total: $outreachTotal
$($statusLines -join "`n")

## Operacional tecnico
- monitor: $monitorState
- monitor pid: $(if ([string]::IsNullOrWhiteSpace($monitorPid)) { "N/A" } else { $monitorPid })
- ultimo ciclo: $(if ([string]::IsNullOrWhiteSpace($cycleSummaryPath)) { "N/A" } else { $cycleSummaryPath })

## Qualidade
- readiness: $readinessDecision
- readiness relatorio: $(if ([string]::IsNullOrWhiteSpace($readinessPath)) { "N/A" } else { $readinessPath })
- cobertura funcional: $coverageDecision
- coverage relatorio: $(if ([string]::IsNullOrWhiteSpace($coveragePath)) { "N/A" } else { $coveragePath })
- coverage PASS: $(if ([string]::IsNullOrWhiteSpace($coveragePass)) { "N/A" } else { $coveragePass })
- coverage FAIL: $(if ([string]::IsNullOrWhiteSpace($coverageFail)) { "N/A" } else { $coverageFail })
- coverage BLOCKED: $(if ([string]::IsNullOrWhiteSpace($coverageBlocked)) { "N/A" } else { $coverageBlocked })
- coverage MISSING: $(if ([string]::IsNullOrWhiteSpace($coverageMissing)) { "N/A" } else { $coverageMissing })

## Decisao recomendada
- $nextDecision
"@

Set-Content -Path $OutputPath -Value $report -Encoding UTF8

$statusPath = Join-Path $resolvedRunDir "status.md"
if (Test-Path $statusPath) {
  $statusBlock = @"

## Snapshot $(Get-Date -Format "yyyyMMdd-HHmmss")
- Relatorio: $OutputPath
- Readiness: $readinessDecision
- Coverage: $coverageDecision
- Monitor: $monitorState
"@
  Add-Content -Path $statusPath -Value $statusBlock -Encoding UTF8
}

Write-Host "Snapshot gerado: $OutputPath"
Write-Host "Readiness: $readinessDecision"
Write-Host "Coverage: $coverageDecision"
Write-Host "Monitor: $monitorState"
Write-Host "Decisao recomendada: $nextDecision"

exit 0
