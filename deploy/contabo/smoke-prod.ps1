param(
  [string]$ProfileName = 'production',
  [string]$ProfilePath,
  [string]$ApiBaseUrl,
  [string]$AppBaseUrl,
  [string]$GuardianBaseUrl,
  [string]$SuperAdminEmail,
  [string]$SuperAdminPassword,
  [string]$SuperAdminMfaCode,
  [string]$ExpectedOwnerEmpresaId,
  [switch]$SkipAuthChecks
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

$scriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
. (Join-Path $scriptRoot 'contabo-deploy-common.ps1')

function Get-TextValue {
  param([string]$Primary, [string]$Fallback)
  if (-not [string]::IsNullOrWhiteSpace($Primary)) { return $Primary }
  return $Fallback
}

function Get-OptionalPropertyValue {
  param(
    $Object,
    [Parameter(Mandatory = $true)][string]$PropertyName,
    [string]$Fallback = ''
  )

  if ($null -eq $Object) { return $Fallback }
  if ($Object.PSObject.Properties.Name -contains $PropertyName) {
    return [string]$Object.$PropertyName
  }
  return $Fallback
}

$repoRoot = Get-RepositoryRoot -ScriptRoot $scriptRoot
$resolvedProfilePath = Resolve-ProfilePath -ScriptRoot $scriptRoot -ProfilePath $ProfilePath
$profile = Load-ContaboProfile -ProfilePath $resolvedProfilePath -ProfileName $ProfileName

$urlProfile = if ($profile.PSObject.Properties.Name -contains 'Urls') { $profile.Urls } else { $null }
$resolvedApiBaseUrl = Get-TextValue -Primary $ApiBaseUrl -Fallback (Get-TextValue -Primary (Get-OptionalPropertyValue -Object $urlProfile -PropertyName 'Api') -Fallback 'https://api.conect360.com')
$resolvedAppBaseUrl = Get-TextValue -Primary $AppBaseUrl -Fallback (Get-TextValue -Primary (Get-OptionalPropertyValue -Object $urlProfile -PropertyName 'App') -Fallback 'https://conect360.com')
$resolvedGuardianBaseUrl = Get-TextValue -Primary $GuardianBaseUrl -Fallback (Get-TextValue -Primary (Get-OptionalPropertyValue -Object $urlProfile -PropertyName 'Guardian') -Fallback 'https://guardian.conect360.com')

if ([string]::IsNullOrWhiteSpace($SuperAdminEmail) -and $profile.PSObject.Properties.Name -contains 'Smoke') {
  $SuperAdminEmail = [string]$profile.Smoke.SuperAdminEmail
}
if ([string]::IsNullOrWhiteSpace($SuperAdminPassword) -and $profile.PSObject.Properties.Name -contains 'Smoke') {
  $SuperAdminPassword = [string]$profile.Smoke.SuperAdminPassword
}
if ([string]::IsNullOrWhiteSpace($SuperAdminMfaCode) -and $profile.PSObject.Properties.Name -contains 'Smoke') {
  $SuperAdminMfaCode = [string]$profile.Smoke.SuperAdminMfaCode
}
if ([string]::IsNullOrWhiteSpace($ExpectedOwnerEmpresaId) -and $profile.PSObject.Properties.Name -contains 'Smoke') {
  $ExpectedOwnerEmpresaId = [string]$profile.Smoke.ExpectedOwnerEmpresaId
}

$smokeScriptPath = Join-Path $repoRoot '.production\scripts\smoke-production-owner-admin.ps1'
if (-not (Test-Path $smokeScriptPath)) {
  throw "Script de smoke nao encontrado: $smokeScriptPath"
}

$smokeParams = @{
  ApiBaseUrl = $resolvedApiBaseUrl
  AppBaseUrl = $resolvedAppBaseUrl
  GuardianBaseUrl = $resolvedGuardianBaseUrl
}

if ($SkipAuthChecks) {
  $smokeParams.SkipAuthChecks = $true
}
else {
  if ([string]::IsNullOrWhiteSpace($SuperAdminEmail) -or [string]::IsNullOrWhiteSpace($SuperAdminPassword)) {
    throw "Para smoke autenticado informe SuperAdminEmail e SuperAdminPassword (argumento ou profile)."
  }

  $smokeParams.SuperAdminEmail = $SuperAdminEmail
  $smokeParams.SuperAdminPassword = $SuperAdminPassword

  if (-not [string]::IsNullOrWhiteSpace($SuperAdminMfaCode)) {
    $smokeParams.SuperAdminMfaCode = $SuperAdminMfaCode
  }
  if (-not [string]::IsNullOrWhiteSpace($ExpectedOwnerEmpresaId)) {
    $smokeParams.ExpectedOwnerEmpresaId = $ExpectedOwnerEmpresaId
  }
}

Write-Host "Executando smoke de producao..."
Write-Host "API: $resolvedApiBaseUrl"
Write-Host "App: $resolvedAppBaseUrl"
Write-Host "Guardian: $resolvedGuardianBaseUrl"
Write-Host "SkipAuthChecks: $SkipAuthChecks"

& $smokeScriptPath @smokeParams
exit $LASTEXITCODE
