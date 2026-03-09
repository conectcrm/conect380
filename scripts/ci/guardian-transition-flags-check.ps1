param(
  [string]$Mode = $env:GUARDIAN_LEGACY_TRANSITION_MODE,
  [string]$CanaryPercent = $env:GUARDIAN_LEGACY_CANARY_PERCENT
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$allowedModes = @('legacy', 'dual', 'canary', 'guardian_only')
$normalizedMode = if ([string]::IsNullOrWhiteSpace($Mode)) { 'legacy' } else { $Mode.Trim().ToLowerInvariant() }

if ($allowedModes -notcontains $normalizedMode) {
  Write-Error "GUARDIAN_LEGACY_TRANSITION_MODE invalido: '$Mode'. Valores aceitos: $($allowedModes -join ', ')"
  exit 1
}

$canary = 0
if (-not [string]::IsNullOrWhiteSpace($CanaryPercent)) {
  $parsed = 0
  if (-not [int]::TryParse($CanaryPercent, [ref]$parsed)) {
    Write-Error "GUARDIAN_LEGACY_CANARY_PERCENT invalido: '$CanaryPercent'."
    exit 1
  }
  if ($parsed -lt 0 -or $parsed -gt 100) {
    Write-Error "GUARDIAN_LEGACY_CANARY_PERCENT fora do intervalo 0-100: '$CanaryPercent'."
    exit 1
  }
  $canary = $parsed
}

if ($normalizedMode -ne 'canary' -and $canary -gt 0) {
  Write-Warning "Canary percentual informado ($canary) sera ignorado porque o modo atual e '$normalizedMode'."
}

Write-Host "Guardian transition flags validadas com sucesso." -ForegroundColor Green
Write-Host " - Mode: $normalizedMode" -ForegroundColor Cyan
Write-Host " - CanaryPercent: $canary" -ForegroundColor Cyan

switch ($normalizedMode) {
  'legacy' {
    Write-Host ' - Resultado: todo tráfego legado /admin/* permanece ativo.' -ForegroundColor Yellow
  }
  'dual' {
    Write-Host ' - Resultado: /admin/* permanece ativo com sinalização de transição.' -ForegroundColor Yellow
  }
  'canary' {
    Write-Host " - Resultado: $canary% do tráfego legado será bloqueado para migração /guardian/*." -ForegroundColor Yellow
  }
  'guardian_only' {
    Write-Host ' - Resultado: todo /admin/* bloqueado; somente /guardian/* permitido.' -ForegroundColor Yellow
  }
}
