param(
  [string]$PilotName = "mvp-pilot",
  [string]$BackendHealthUrl = "http://localhost:3001/health",
  [string]$FrontendUrl = "http://localhost:3000",
  [string]$AdminEmail = "admin@conectsuite.com.br",
  [string]$AdminPassword = "admin123",
  [switch]$SkipPreflight,
  [switch]$SkipSmokes
)

$ErrorActionPreference = "Stop"
$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
$pilotRoot = Join-Path $repoRoot ".production\pilot-runs"
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$slug = ($PilotName.ToLower() -replace "[^a-z0-9\-]", "-").Trim("-")
if ([string]::IsNullOrWhiteSpace($slug)) {
  $slug = "pilot"
}
$runId = "$timestamp-$slug"
$runDir = Join-Path $pilotRoot $runId
$results = @()

function Add-Result {
  param(
    [string]$Step,
    [string]$Status,
    [string]$Details = ""
  )

  $script:results += [pscustomobject]@{
    Step = $Step
    Status = $Status
    Details = $Details
  }
}

function Run-Step {
  param(
    [string]$Name,
    [scriptblock]$Action
  )

  Write-Host ""
  Write-Host ">> $Name"
  try {
    & $Action
    Add-Result -Step $Name -Status "PASS"
  }
  catch {
    Add-Result -Step $Name -Status "FAIL" -Details $_.Exception.Message
  }
}

function Write-TemplateFiles {
  param(
    [string]$TargetDir
  )

  $clientsCsv = @"
cliente,empresa_id,contato_tecnico,contato_negocio,janela_inicio,janela_fim,status,observacoes
Cliente Piloto A,,,,,,, 
Cliente Piloto B,,,,,,, 
Cliente Piloto C,,,,,,, 
"@

  $evidenceCsv = @"
timestamp,cliente,cenario,resultado,evidencia,erro,responsavel
"@

  $incidentsMd = @"
# Incidentes - $runId

## Regras de registro
- Registrar horario em UTC e local.
- Linkar logs, screenshot, trace e payload.
- Indicar impacto por cliente.

## Itens

### INCIDENT-001
- Severidade:
- Cliente:
- Cenario:
- Sintoma:
- Evidencias:
- Mitigacao:
- Proxima acao:
"@

  $sessionMd = @"
# Sessao do Piloto MVP - $runId

## Dados da janela
- Inicio:
- Fim:
- Responsavel tecnico:
- Responsavel negocio:

## Escopo validado
- Login e contexto de empresa
- Leads
- Pipeline
- Propostas
- Atendimento inbox

## Resultado por cliente
- Cliente:
  - Status:
  - Bloqueios:

## Resumo final
- Incidentes P0:
- Taxa de sucesso:
- Decisao:
"@

  Set-Content -Path (Join-Path $TargetDir "clients.csv") -Value $clientsCsv -Encoding UTF8
  Set-Content -Path (Join-Path $TargetDir "evidence.csv") -Value $evidenceCsv -Encoding UTF8
  Set-Content -Path (Join-Path $TargetDir "incidents.md") -Value $incidentsMd -Encoding UTF8
  Set-Content -Path (Join-Path $TargetDir "session.md") -Value $sessionMd -Encoding UTF8
}

if (-not (Test-Path $pilotRoot)) {
  New-Item -ItemType Directory -Path $pilotRoot | Out-Null
}
New-Item -ItemType Directory -Path $runDir | Out-Null

Write-TemplateFiles -TargetDir $runDir
Copy-Item (Join-Path $repoRoot ".production\MVP_PILOT_CHECKLIST_2026-02-17.md") (Join-Path $runDir "pilot-checklist.md")
Copy-Item (Join-Path $repoRoot ".production\MVP_GO_NO_GO_2026-02-17.md") (Join-Path $runDir "go-no-go-baseline.md")
Copy-Item (Join-Path $repoRoot ".production\MVP_SMOKE_REPORT_2026-02-17.md") (Join-Path $runDir "smoke-baseline.md")

Push-Location $repoRoot
try {
  Run-Step -Name "Backend health check" -Action {
    $statusCode = (Invoke-WebRequest -Uri $BackendHealthUrl -UseBasicParsing -TimeoutSec 10).StatusCode
    if ($statusCode -ne 200) { throw "health retornou status $statusCode" }
  }

  Run-Step -Name "Frontend availability check" -Action {
    $statusCode = (Invoke-WebRequest -Uri $FrontendUrl -UseBasicParsing -TimeoutSec 10).StatusCode
    if ($statusCode -ne 200) { throw "frontend retornou status $statusCode" }
  }

  if (-not $SkipPreflight) {
    Run-Step -Name "Preflight MVP go-live" -Action {
      & ".\.production\scripts\preflight-mvp-go-live.ps1"
      if ($LASTEXITCODE -ne 0) { throw "preflight-mvp-go-live.ps1 failed" }
    }
  }
  else {
    Add-Result -Step "Preflight MVP go-live" -Status "SKIP" -Details "SkipPreflight enabled"
  }

  if (-not $SkipSmokes) {
    Run-Step -Name "Smoke MVP core" -Action {
      & ".\.production\scripts\smoke-mvp-core.ps1"
      if ($LASTEXITCODE -ne 0) { throw "smoke-mvp-core.ps1 failed" }
    }

    Run-Step -Name "Smoke MVP UI" -Action {
      & ".\.production\scripts\smoke-mvp-ui.ps1" -FrontendUrl $FrontendUrl -BackendHealthUrl $BackendHealthUrl -AdminEmail $AdminEmail -AdminPassword $AdminPassword
      if ($LASTEXITCODE -ne 0) { throw "smoke-mvp-ui.ps1 failed" }
    }
  }
  else {
    Add-Result -Step "Smoke MVP core" -Status "SKIP" -Details "SkipSmokes enabled"
    Add-Result -Step "Smoke MVP UI" -Status "SKIP" -Details "SkipSmokes enabled"
  }
}
finally {
  Pop-Location
}

$statusPath = Join-Path $runDir "status.md"
$summaryHeader = @"
# Status da Sessao - $runId

Data de abertura: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
Backend health: $BackendHealthUrl
Frontend URL: $FrontendUrl
"@

$table = $results | Format-Table -AutoSize | Out-String
$statusBody = @"

## Resultado de readiness
$table
---

## Arquivos da sessao
- clients.csv
- evidence.csv
- incidents.md
- session.md
- pilot-checklist.md
- go-no-go-baseline.md
- smoke-baseline.md
"@

Set-Content -Path $statusPath -Value ($summaryHeader + $statusBody) -Encoding UTF8

Write-Host ""
Write-Host "Pilot kickoff summary:"
$results | Format-Table -AutoSize
Write-Host ""
Write-Host "Pilot run directory: $runDir"

$failed = $results | Where-Object { $_.Status -eq "FAIL" }
if ($failed.Count -gt 0) {
  Write-Host "Pilot kickoff result: FAIL"
  exit 1
}

Write-Host "Pilot kickoff result: PASS"
exit 0
