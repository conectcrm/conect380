param(
  [string]$RunDir = "",
  [Parameter(Mandatory = $true)][string]$Cliente,
  [Parameter(Mandatory = $true)][string]$Cenario,
  [Parameter(Mandatory = $true)][ValidateSet("PASS", "FAIL", "BLOCKED")][string]$Resultado,
  [string]$Evidencia = "",
  [string]$Erro = "",
  [string]$Responsavel = ""
)

$ErrorActionPreference = "Stop"
$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
$pilotRoot = Join-Path $repoRoot ".production\pilot-runs"

if ([string]::IsNullOrWhiteSpace($RunDir)) {
  $latest = Get-ChildItem $pilotRoot -Directory | Sort-Object LastWriteTime -Descending | Select-Object -First 1
  if ($null -eq $latest) {
    throw "Nenhuma sessao de piloto encontrada em $pilotRoot."
  }
  $RunDir = $latest.FullName
}

$evidencePath = Join-Path $RunDir "evidence.csv"
if (-not (Test-Path $evidencePath)) {
  throw "Arquivo evidence.csv nao encontrado em $RunDir."
}

$row = [pscustomobject]@{
  timestamp = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
  cliente = $Cliente
  cenario = $Cenario
  resultado = $Resultado
  evidencia = $Evidencia
  erro = $Erro
  responsavel = $Responsavel
}

$saved = $false
$csvLine = ($row | ConvertTo-Csv -NoTypeInformation)[1]

for ($attempt = 1; $attempt -le 5; $attempt++) {
  try {
    Add-Content -Path $evidencePath -Value $csvLine -Encoding UTF8
    $saved = $true
    break
  }
  catch {
    if ($attempt -eq 5) {
      throw
    }
    Start-Sleep -Milliseconds 250
  }
}

if (-not $saved) {
  throw "Falha ao salvar evidence.csv apos multiplas tentativas."
}

Write-Host "Evidencia registrada em: $evidencePath"
Write-Host " - cliente: $Cliente"
Write-Host " - cenario: $Cenario"
Write-Host " - resultado: $Resultado"

exit 0
