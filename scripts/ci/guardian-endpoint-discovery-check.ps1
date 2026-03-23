param(
  [string[]]$BaseUrls = @(
    'http://localhost:3001',
    'http://192.168.200.44:3000',
    'http://192.168.200.44:3001'
  ),
  [string]$Email = '',
  [string]$Senha = '',
  [string]$OutputFile = ''
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

if ([string]::IsNullOrWhiteSpace($Email) -or [string]::IsNullOrWhiteSpace($Senha)) {
  throw 'Informe Email e Senha para discovery de endpoints guardian.'
}

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
$runId = Get-Date -Format 'yyyyMMdd-HHmmss'
if ([string]::IsNullOrWhiteSpace($OutputFile)) {
  $OutputFile = Join-Path $repoRoot "docs/features/evidencias/GUARDIAN_ENDPOINT_DISCOVERY_$runId.md"
} elseif (-not [System.IO.Path]::IsPathRooted($OutputFile)) {
  $OutputFile = Join-Path $repoRoot $OutputFile
}

function Invoke-Req {
  param(
    [string]$Method,
    [string]$Url,
    [object]$Body = $null,
    [hashtable]$Headers = @{}
  )

  try {
    $params = @{ Uri = $Url; Method = $Method; UseBasicParsing = $true; ErrorAction = 'Stop' }
    if ($Headers.Count -gt 0) { $params.Headers = $Headers }
    if ($null -ne $Body) {
      $params.Body = ($Body | ConvertTo-Json -Depth 10)
      $params.ContentType = 'application/json'
    }
    $r = Invoke-WebRequest @params
    return [PSCustomObject]@{ success = $true; statusCode = [int]$r.StatusCode; content = $r.Content }
  } catch {
    $statusCode = 0
    if ($_.Exception.Response -and $_.Exception.Response.StatusCode) {
      try { $statusCode = [int]$_.Exception.Response.StatusCode.value__ } catch { $statusCode = 0 }
    }
    return [PSCustomObject]@{ success = $false; statusCode = $statusCode; content = $_.Exception.Message }
  }
}

$mfaVerifyPath = '/auth/mfa/verify'

function Try-ResolveAccessToken {
  param(
    [string]$BaseUrl,
    [string]$LoginContent
  )

  if ([string]::IsNullOrWhiteSpace($LoginContent)) {
    return [PSCustomObject]@{
      token = ''
      mfaStep = 'none'
      mfaVerifyStatus = 0
    }
  }

  $parsed = $null
  try {
    $parsed = $LoginContent | ConvertFrom-Json -ErrorAction Stop
  } catch {
    return [PSCustomObject]@{
      token = ''
      mfaStep = 'invalid_login_payload'
      mfaVerifyStatus = 0
    }
  }

  $data = $null
  $dataProp = $parsed.PSObject.Properties['data']
  if ($null -ne $dataProp) {
    $data = $dataProp.Value
  }

  $directTokenProp = $null
  if ($null -ne $data) {
    $directTokenProp = $data.PSObject.Properties['access_token']
  }
  $directToken = if ($null -ne $directTokenProp) { [string]$directTokenProp.Value } else { '' }
  if (-not [string]::IsNullOrWhiteSpace($directToken)) {
    return [PSCustomObject]@{
      token = $directToken
      mfaStep = 'not_required'
      mfaVerifyStatus = 0
    }
  }

  $actionProp = $parsed.PSObject.Properties['action']
  $action = if ($null -ne $actionProp) { [string]$actionProp.Value } else { '' }
  if ($action -ne 'MFA_REQUIRED') {
    return [PSCustomObject]@{
      token = ''
      mfaStep = 'unsupported_action'
      mfaVerifyStatus = 0
    }
  }

  $challengeIdProp = $null
  if ($null -ne $data) {
    $challengeIdProp = $data.PSObject.Properties['challengeId']
  }
  $challengeId = if ($null -ne $challengeIdProp) { [string]$challengeIdProp.Value } else { '' }

  $devCodeProp = $null
  if ($null -ne $data) {
    $devCodeProp = $data.PSObject.Properties['devCode']
  }
  $devCode = if ($null -ne $devCodeProp) { [string]$devCodeProp.Value } else { '' }

  $deliveryChannelProp = $null
  if ($null -ne $data) {
    $deliveryChannelProp = $data.PSObject.Properties['deliveryChannel']
  }
  $deliveryChannel = if ($null -ne $deliveryChannelProp) { [string]$deliveryChannelProp.Value } else { '' }

  if ([string]::IsNullOrWhiteSpace($challengeId) -or [string]::IsNullOrWhiteSpace($devCode)) {
    return [PSCustomObject]@{
      token = ''
      mfaStep = 'required_without_dev_code'
      mfaVerifyStatus = 0
    }
  }

  if ($deliveryChannel -ne 'dev_fallback') {
    return [PSCustomObject]@{
      token = ''
      mfaStep = 'required_non_dev_channel'
      mfaVerifyStatus = 0
    }
  }

  $verify = Invoke-Req -Method 'POST' -Url "$BaseUrl$mfaVerifyPath" -Body @{
    challengeId = $challengeId
    codigo = $devCode
  }

  if (-not $verify.success) {
    return [PSCustomObject]@{
      token = ''
      mfaStep = 'verify_failed'
      mfaVerifyStatus = $verify.statusCode
    }
  }

  $verifyParsed = $null
  try {
    $verifyParsed = $verify.content | ConvertFrom-Json -ErrorAction Stop
  } catch {
    return [PSCustomObject]@{
      token = ''
      mfaStep = 'verify_invalid_payload'
      mfaVerifyStatus = $verify.statusCode
    }
  }

  $verifyData = $null
  $verifyDataProp = $verifyParsed.PSObject.Properties['data']
  if ($null -ne $verifyDataProp) {
    $verifyData = $verifyDataProp.Value
  }

  $verifiedTokenProp = $null
  if ($null -ne $verifyData) {
    $verifiedTokenProp = $verifyData.PSObject.Properties['access_token']
  }
  $verifiedToken = if ($null -ne $verifiedTokenProp) { [string]$verifiedTokenProp.Value } else { '' }
  if ([string]::IsNullOrWhiteSpace($verifiedToken)) {
    return [PSCustomObject]@{
      token = ''
      mfaStep = 'verify_without_token'
      mfaVerifyStatus = $verify.statusCode
    }
  }

  return [PSCustomObject]@{
    token = $verifiedToken
    mfaStep = 'verified_with_dev_code'
    mfaVerifyStatus = $verify.statusCode
  }
}

$rows = @()
$foundGuardian = $false

foreach ($base in $BaseUrls) {
  $normalizedBase = $base.TrimEnd('/')

  $login = Invoke-Req -Method 'POST' -Url "$normalizedBase/auth/login" -Body @{ email = $Email; senha = $Senha }
  $authState = [PSCustomObject]@{
    token = ''
    mfaStep = 'login_failed'
    mfaVerifyStatus = 0
  }
  if ($login.success) {
    $authState = Try-ResolveAccessToken -BaseUrl $normalizedBase -LoginContent $login.content
  }
  $token = [string]$authState.token

  $overviewRoot = [PSCustomObject]@{ success = $false; statusCode = 0; content = 'skipped: sem token' }
  $overviewApi = [PSCustomObject]@{ success = $false; statusCode = 0; content = 'skipped: sem token' }

  if (-not [string]::IsNullOrWhiteSpace($token)) {
    $headers = @{ Authorization = "Bearer $token" }
    $overviewRoot = Invoke-Req -Method 'GET' -Url "$normalizedBase/guardian/bff/overview" -Headers $headers
    $overviewApi = Invoke-Req -Method 'GET' -Url "$normalizedBase/api/guardian/bff/overview" -Headers $headers
  }

  if ($overviewRoot.success -or $overviewApi.success) {
    $foundGuardian = $true
  }

  $rows += [PSCustomObject]@{
    base_url = $normalizedBase
    login_status = $login.statusCode
    mfa_step = $authState.mfaStep
    mfa_verify_status = $authState.mfaVerifyStatus
    guardian_overview_status = $overviewRoot.statusCode
    api_guardian_overview_status = $overviewApi.statusCode
    guardian_available = if ($overviewRoot.success -or $overviewApi.success) { 'yes' } else { 'no' }
  }
}

$outDir = Split-Path -Path $OutputFile -Parent
if (-not (Test-Path -Path $outDir)) {
  New-Item -Path $outDir -ItemType Directory -Force | Out-Null
}

$md = @()
$md += '# Guardian endpoint discovery report'
$md += ''
$md += "- RunId: $runId"
$md += "- GeneratedAt: $((Get-Date).ToString('yyyy-MM-dd HH:mm:ss'))"
$md += "- Status: $(if ($foundGuardian) { 'PASS' } else { 'FAIL' })"
$md += ''
$md += '| BaseUrl | LoginStatus | MfaStep | MfaVerifyStatus | /guardian/bff/overview | /api/guardian/bff/overview | GuardianAvailable |'
$md += '| --- | ---: | --- | ---: | ---: | ---: | --- |'
foreach ($row in $rows) {
  $md += "| $($row.base_url) | $($row.login_status) | $($row.mfa_step) | $($row.mfa_verify_status) | $($row.guardian_overview_status) | $($row.api_guardian_overview_status) | $($row.guardian_available) |"
}
$md += ''
$md += '## Resultado'
if ($foundGuardian) {
  $md += '- Ao menos um endpoint Guardian encontrado com sucesso.'
} else {
  $md += '- Nenhum endpoint Guardian encontrado. Backoffice Guardian nao esta publicado no ambiente consultado.'
}

Set-Content -Path $OutputFile -Value $md -Encoding UTF8
Write-Host "Relatorio salvo em: $OutputFile"

if (-not $foundGuardian) {
  exit 1
}

exit 0
