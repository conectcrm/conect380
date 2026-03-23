param(
  [string]$BaseUrl = $env:GUARDIAN_RELEASE_BASE_URL,
  [string]$Token = $env:GUARDIAN_RELEASE_TOKEN,
  [string]$Email = $env:GUARDIAN_RELEASE_EMAIL,
  [string]$Senha = $env:GUARDIAN_RELEASE_SENHA,
  [string]$TargetEmpresaId = $env:GUARDIAN_RELEASE_TARGET_EMPRESA_ID,
  [string]$OutputFile = ''
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

if ([string]::IsNullOrWhiteSpace($BaseUrl)) {
  throw 'Informe BaseUrl via -BaseUrl ou GUARDIAN_RELEASE_BASE_URL.'
}

$hasToken = -not [string]::IsNullOrWhiteSpace($Token)
$hasUserPass = (-not [string]::IsNullOrWhiteSpace($Email) -and -not [string]::IsNullOrWhiteSpace($Senha))
if (-not $hasToken -and -not $hasUserPass) {
  throw 'Modo real exige Token ou Email/Senha (parametros ou variaveis GUARDIAN_RELEASE_*).'
}

$runId = Get-Date -Format 'yyyyMMdd-HHmmss'
if ([string]::IsNullOrWhiteSpace($OutputFile)) {
  $OutputFile = "docs/features/evidencias/GUARDIAN_PRODUCTION_READINESS_REAL_$runId.md"
}

$args = @(
  '-ExecutionPolicy', 'Bypass',
  '-File', 'scripts/release/guardian-production-readiness.ps1',
  '-Mode', 'real',
  '-BaseUrl', $BaseUrl,
  '-OutputFile', $OutputFile
)

if ($hasToken) {
  $args += @('-Token', $Token)
} else {
  $args += @('-Email', $Email, '-Senha', $Senha)
}

if (-not [string]::IsNullOrWhiteSpace($TargetEmpresaId)) {
  $args += @('-TargetEmpresaId', $TargetEmpresaId)
}

Write-Host '[Guardian Readiness] Executando orchestrator consolidado em REAL mode...' -ForegroundColor Cyan
& powershell @args

if ($LASTEXITCODE -ne 0) {
  throw "Guardian production readiness real mode retornou codigo $LASTEXITCODE"
}

if (-not (Test-Path -Path $OutputFile)) {
  throw "Relatorio consolidado real mode nao encontrado: $OutputFile"
}

$content = Get-Content -Path $OutputFile -Raw
if ($content -notmatch [regex]::Escape('- Status: PASS')) {
  throw "Relatorio real mode sem status PASS: $OutputFile"
}

Write-Host '[Guardian Readiness] Real mode validado com sucesso.' -ForegroundColor Green
Write-Host " - Relatorio: $OutputFile" -ForegroundColor Cyan
