param(
  [string]$ProfileName = 'production',
  [string]$ProfilePath,
  [string]$ApiBaseUrl,
  [string]$AppBaseUrl,
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

function Has-OptionalProperty {
  param(
    $Object,
    [Parameter(Mandatory = $true)][string]$PropertyName
  )

  if ($null -eq $Object) { return $false }
  if ($Object -is [System.Collections.IDictionary]) {
    return $Object.Contains($PropertyName)
  }

  return $Object.PSObject.Properties.Name -contains $PropertyName
}

function Get-OptionalPropertyValue {
  param(
    $Object,
    [Parameter(Mandatory = $true)][string]$PropertyName,
    [string]$Fallback = ''
  )

  if ($null -eq $Object) { return $Fallback }
  if (Has-OptionalProperty -Object $Object -PropertyName $PropertyName) {
    if ($Object -is [System.Collections.IDictionary]) {
      return [string]$Object[$PropertyName]
    }

    return [string]$Object.$PropertyName
  }
  return $Fallback
}

$repoRoot = Get-RepositoryRoot -ScriptRoot $scriptRoot
$resolvedProfilePath = Resolve-ProfilePath -ScriptRoot $scriptRoot -ProfilePath $ProfilePath
$profile = Load-ContaboProfile -ProfilePath $resolvedProfilePath -ProfileName $ProfileName

$urlProfile = if (Has-OptionalProperty -Object $profile -PropertyName 'Urls') { $profile.Urls } else { $null }
$resolvedApiBaseUrl = Get-TextValue -Primary $ApiBaseUrl -Fallback (Get-TextValue -Primary (Get-OptionalPropertyValue -Object $urlProfile -PropertyName 'Api') -Fallback 'https://api.conect360.com')
$resolvedAppBaseUrl = Get-TextValue -Primary $AppBaseUrl -Fallback (Get-TextValue -Primary (Get-OptionalPropertyValue -Object $urlProfile -PropertyName 'App') -Fallback 'https://conect360.com')

$smokeProfile = if (Has-OptionalProperty -Object $profile -PropertyName 'Smoke') { $profile.Smoke } else { $null }

if ([string]::IsNullOrWhiteSpace($SuperAdminEmail) -and $null -ne $smokeProfile) {
  $SuperAdminEmail = [string]$smokeProfile.SuperAdminEmail
}
if ([string]::IsNullOrWhiteSpace($SuperAdminPassword) -and $null -ne $smokeProfile) {
  $SuperAdminPassword = [string]$smokeProfile.SuperAdminPassword
}
if ([string]::IsNullOrWhiteSpace($SuperAdminMfaCode) -and $null -ne $smokeProfile) {
  $SuperAdminMfaCode = [string]$smokeProfile.SuperAdminMfaCode
}
if ([string]::IsNullOrWhiteSpace($ExpectedOwnerEmpresaId) -and $null -ne $smokeProfile) {
  $ExpectedOwnerEmpresaId = [string]$smokeProfile.ExpectedOwnerEmpresaId
}

$smokeScriptPath = Join-Path $repoRoot '.production\scripts\smoke-production-owner-admin.ps1'
if (-not (Test-Path $smokeScriptPath)) {
  throw "Script de smoke nao encontrado: $smokeScriptPath"
}

$smokeParams = @{
  ApiBaseUrl = $resolvedApiBaseUrl
  AppBaseUrl = $resolvedAppBaseUrl
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
Write-Host "SkipAuthChecks: $SkipAuthChecks"

& $smokeScriptPath @smokeParams
exit $LASTEXITCODE
