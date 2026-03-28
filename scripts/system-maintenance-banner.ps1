param(
  [Parameter(Mandatory = $true)]
  [ValidateSet('status', 'enable', 'disable')]
  [string]$Action,

  [string]$BaseUrl = 'http://localhost:3001',

  [string]$Token = '',
  [string]$Email = '',
  [string]$Senha = '',

  [string]$Title = 'Manutencao programada',
  [string]$Message = 'O sistema pode apresentar indisponibilidade temporaria durante o deploy.',
  [ValidateSet('info', 'warning', 'critical')]
  [string]$Severity = 'warning',
  [string]$StartsAt = '',
  [string]$ExpectedEndAt = '',

  [switch]$ClearContent
)

$ErrorActionPreference = 'Stop'

function Write-Step {
  param([string]$Text)
  Write-Host "[maintenance-banner] $Text" -ForegroundColor Cyan
}

function Normalize-BaseUrl {
  param([string]$Url)
  if (-not $Url) {
    return 'http://localhost:3001'
  }

  if ($Url.EndsWith('/')) {
    return $Url.TrimEnd('/')
  }

  return $Url
}

function Invoke-JsonRequest {
  param(
    [string]$Method,
    [string]$Url,
    [hashtable]$Headers = @{},
    [object]$Body = $null
  )

  if ($null -ne $Body) {
    $jsonBody = $Body | ConvertTo-Json -Depth 8
    return Invoke-RestMethod -Method $Method -Uri $Url -Headers $Headers -ContentType 'application/json' -Body $jsonBody
  }

  return Invoke-RestMethod -Method $Method -Uri $Url -Headers $Headers
}

function Resolve-AccessToken {
  param(
    [string]$CurrentToken,
    [string]$BaseUrlResolved,
    [string]$LoginEmail,
    [string]$LoginSenha
  )

  if ($CurrentToken) {
    return $CurrentToken
  }

  if (-not $LoginEmail -or -not $LoginSenha) {
    throw 'Token nao informado. Para enable/disable informe -Token ou (-Email e -Senha).'
  }

  Write-Step "Realizando login para obter token em $BaseUrlResolved/auth/login"
  $loginBody = @{
    email = $LoginEmail
    senha = $LoginSenha
  }

  try {
    $loginResponse = Invoke-JsonRequest -Method 'POST' -Url "$BaseUrlResolved/auth/login" -Body $loginBody
  }
  catch {
    throw "Falha no login: $($_.Exception.Message)"
  }

  $accessToken = $loginResponse.data.access_token
  if (-not $accessToken) {
    throw 'Login nao retornou access_token. Se houver MFA obrigatorio, use -Token manualmente.'
  }

  return $accessToken
}

function Format-BannerOutput {
  param([object]$Banner)

  if ($null -eq $Banner) {
    Write-Host "Banner: (sem configuracao)" -ForegroundColor Yellow
    return
  }

  Write-Host "enabled     : $($Banner.enabled)"
  Write-Host "title       : $($Banner.title)"
  Write-Host "message     : $($Banner.message)"
  Write-Host "severity    : $($Banner.severity)"
  Write-Host "startsAt    : $($Banner.startsAt)"
  Write-Host "expectedEnd : $($Banner.expectedEndAt)"
}

$BaseUrl = Normalize-BaseUrl -Url $BaseUrl

if ($Action -eq 'status') {
  Write-Step "Consultando status publico em $BaseUrl/system-branding/public"
  $publicBranding = Invoke-JsonRequest -Method 'GET' -Url "$BaseUrl/system-branding/public"
  Format-BannerOutput -Banner $publicBranding.maintenanceBanner
  exit 0
}

$resolvedToken = Resolve-AccessToken -CurrentToken $Token -BaseUrlResolved $BaseUrl -LoginEmail $Email -LoginSenha $Senha
$headers = @{
  Authorization = "Bearer $resolvedToken"
}

if ($Action -eq 'enable') {
  $payload = @{
    maintenanceEnabled = $true
    maintenanceTitle = $Title
    maintenanceMessage = $Message
    maintenanceSeverity = $Severity
    maintenanceStartsAt = $(if ($StartsAt) { $StartsAt } else { $null })
    maintenanceExpectedEndAt = $(if ($ExpectedEndAt) { $ExpectedEndAt } else { $null })
  }

  Write-Step "Ativando aviso de manutencao em $BaseUrl/core-admin/system-branding"
  [void](Invoke-JsonRequest -Method 'PUT' -Url "$BaseUrl/core-admin/system-branding" -Headers $headers -Body $payload)
}
elseif ($Action -eq 'disable') {
  $payload = @{
    maintenanceEnabled = $false
  }

  if ($ClearContent) {
    $payload.maintenanceTitle = $null
    $payload.maintenanceMessage = $null
    $payload.maintenanceStartsAt = $null
    $payload.maintenanceExpectedEndAt = $null
    $payload.maintenanceSeverity = 'warning'
  }

  Write-Step "Desativando aviso de manutencao em $BaseUrl/core-admin/system-branding"
  [void](Invoke-JsonRequest -Method 'PUT' -Url "$BaseUrl/core-admin/system-branding" -Headers $headers -Body $payload)
}

Write-Step "Validando status atual"
$updatedPublicBranding = Invoke-JsonRequest -Method 'GET' -Url "$BaseUrl/system-branding/public"
Format-BannerOutput -Banner $updatedPublicBranding.maintenanceBanner
