param(
  [string]$RunDir = "",
  [Parameter(Mandatory = $true)][string]$Cliente,
  [Parameter(Mandatory = $true)][ValidateSet("LoginContexto", "CriacaoLead", "MovimentarPipeline", "Proposta", "AtendimentoTicket")][string]$Cenario,
  [Parameter(Mandatory = $true)][ValidateSet("PASS", "FAIL", "BLOCKED")][string]$Resultado,
  [string]$Evidencia = "",
  [string]$Erro = "",
  [string]$Responsavel = ""
)

$ErrorActionPreference = "Stop"
$recordScript = Join-Path $PSScriptRoot "record-mvp-pilot-evidence.ps1"

if (-not (Test-Path $recordScript)) {
  throw "Script de evidencia nao encontrado: $recordScript"
}

$scenarioMap = @{
  "LoginContexto" = "Login e contexto da empresa"
  "CriacaoLead" = "Criacao de lead"
  "MovimentarPipeline" = "Movimentar pipeline"
  "Proposta" = "Criar e consultar proposta"
  "AtendimentoTicket" = "Abrir ticket, responder, alterar status"
}

$scenarioName = $scenarioMap[$Cenario]
if ([string]::IsNullOrWhiteSpace($scenarioName)) {
  throw "Cenario invalido: $Cenario"
}

& $recordScript `
  -RunDir $RunDir `
  -Cliente $Cliente `
  -Cenario $scenarioName `
  -Resultado $Resultado `
  -Evidencia $Evidencia `
  -Erro $Erro `
  -Responsavel $Responsavel

exit $LASTEXITCODE
