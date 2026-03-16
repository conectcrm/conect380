param(
  [string]$ApiBaseUrl = "https://api.conect360.com",
  [string]$AppBaseUrl = "https://conect360.com",
  [string]$GuardianBaseUrl = "https://guardian.conect360.com",
  [string]$SuperAdminEmail,
  [string]$SuperAdminPassword,
  [string]$SuperAdminMfaCode,
  [string]$ExpectedOwnerEmpresaId,
  [switch]$SkipAuthChecks
)

$ErrorActionPreference = "Stop"
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
    Timestamp = (Get-Date).ToString("s")
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

function Invoke-JsonRequest {
  param(
    [ValidateSet("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS")]
    [string]$Method,
    [string]$Url,
    [hashtable]$Headers,
    $Body,
    [int[]]$ExpectedStatusCodes = @(200, 201, 204)
  )

  $requestParams = @{
    Method = $Method
    Uri = $Url
    UseBasicParsing = $true
    TimeoutSec = 25
    Headers = @{}
  }

  if ($Headers) {
    $requestParams.Headers = $Headers
  }

  if ($null -ne $Body) {
    $requestParams.ContentType = "application/json"
    $requestParams.Body = ($Body | ConvertTo-Json -Depth 10)
  }

  try {
    $response = Invoke-WebRequest @requestParams
    $statusCode = [int]$response.StatusCode
    if ($ExpectedStatusCodes -notcontains $statusCode) {
      throw "Status inesperado em ${Url}: $statusCode (esperado: $($ExpectedStatusCodes -join ', '))"
    }

    $parsed = $null
    if (-not [string]::IsNullOrWhiteSpace($response.Content)) {
      try {
        $parsed = $response.Content | ConvertFrom-Json
      }
      catch {
        $parsed = $response.Content
      }
    }

    return [pscustomobject]@{
      StatusCode = $statusCode
      Headers = $response.Headers
      Body = $parsed
      RawBody = $response.Content
    }
  }
  catch [System.Net.WebException] {
    $httpResponse = $_.Exception.Response
    if ($null -eq $httpResponse) {
      throw
    }

    $statusCode = [int]$httpResponse.StatusCode
    $streamReader = New-Object System.IO.StreamReader($httpResponse.GetResponseStream())
    $rawBody = $streamReader.ReadToEnd()
    $streamReader.Close()

    if ($ExpectedStatusCodes -notcontains $statusCode) {
      throw "Status inesperado em ${Url}: $statusCode (esperado: $($ExpectedStatusCodes -join ', ')). Body: $rawBody"
    }

    $parsed = $null
    if (-not [string]::IsNullOrWhiteSpace($rawBody)) {
      try {
        $parsed = $rawBody | ConvertFrom-Json
      }
      catch {
        $parsed = $rawBody
      }
    }

    return [pscustomobject]@{
      StatusCode = $statusCode
      Headers = $httpResponse.Headers
      Body = $parsed
      RawBody = $rawBody
    }
  }
}

function Require-String {
  param(
    [string]$Name,
    [string]$Value
  )

  if ([string]::IsNullOrWhiteSpace($Value)) {
    throw "Parametro obrigatorio ausente: $Name"
  }
}

$normalizedApiBase = $ApiBaseUrl.TrimEnd('/')
$normalizedAppBase = $AppBaseUrl.TrimEnd('/')
$normalizedGuardianBase = $GuardianBaseUrl.TrimEnd('/')

Write-Host "Smoke producao owner/admin"
Write-Host "API: $normalizedApiBase"
Write-Host "App: $normalizedAppBase"
Write-Host "Guardian: $normalizedGuardianBase"
Write-Host "SkipAuthChecks: $SkipAuthChecks"

$accessToken = $null
$authenticatedUser = $null

Run-Step -Name "API health" -Action {
  $response = Invoke-JsonRequest -Method "GET" -Url "$normalizedApiBase/health" -ExpectedStatusCodes @(200)
  if ($response.StatusCode -ne 200) {
    throw "Health inesperado: $($response.StatusCode)"
  }
}

Run-Step -Name "App url responde" -Action {
  $response = Invoke-JsonRequest -Method "GET" -Url $normalizedAppBase -ExpectedStatusCodes @(200)
  if ($response.StatusCode -ne 200) {
    throw "App nao respondeu 200"
  }
}

Run-Step -Name "Guardian url responde" -Action {
  $response = Invoke-JsonRequest -Method "GET" -Url $normalizedGuardianBase -ExpectedStatusCodes @(200)
  if ($response.StatusCode -ne 200) {
    throw "Guardian nao respondeu 200"
  }
}

Run-Step -Name "CORS app -> admin/system-branding" -Action {
  $corsHeaders = @{
    Origin = $normalizedAppBase
    "Access-Control-Request-Method" = "PUT"
    "Access-Control-Request-Headers" = "authorization,content-type"
  }

  $response = Invoke-JsonRequest -Method "OPTIONS" -Url "$normalizedApiBase/admin/system-branding" -Headers $corsHeaders -ExpectedStatusCodes @(200, 204)
  $allowOrigin = $response.Headers["Access-Control-Allow-Origin"]
  if ([string]::IsNullOrWhiteSpace($allowOrigin)) {
    throw "Header Access-Control-Allow-Origin ausente para origem app"
  }
  if ($allowOrigin -ne $normalizedAppBase) {
    throw "CORS inesperado para app: $allowOrigin"
  }
}

Run-Step -Name "CORS guardian -> admin/system-branding" -Action {
  $corsHeaders = @{
    Origin = $normalizedGuardianBase
    "Access-Control-Request-Method" = "PUT"
    "Access-Control-Request-Headers" = "authorization,content-type"
  }

  $response = Invoke-JsonRequest -Method "OPTIONS" -Url "$normalizedApiBase/admin/system-branding" -Headers $corsHeaders -ExpectedStatusCodes @(200, 204)
  $allowOrigin = $response.Headers["Access-Control-Allow-Origin"]
  if ([string]::IsNullOrWhiteSpace($allowOrigin)) {
    throw "Header Access-Control-Allow-Origin ausente para origem guardian"
  }
  if ($allowOrigin -ne $normalizedGuardianBase) {
    throw "CORS inesperado para guardian: $allowOrigin"
  }
}

Run-Step -Name "Branding publico" -Action {
  $response = Invoke-JsonRequest -Method "GET" -Url "$normalizedApiBase/system-branding/public" -ExpectedStatusCodes @(200)
  if ($null -eq $response.Body) {
    throw "Resposta vazia em system-branding/public"
  }
}

if (-not $SkipAuthChecks) {
  Run-Step -Name "Login superadmin" -Action {
    Require-String -Name "SuperAdminEmail" -Value $SuperAdminEmail
    Require-String -Name "SuperAdminPassword" -Value $SuperAdminPassword

    $loginResponse = Invoke-JsonRequest -Method "POST" -Url "$normalizedApiBase/auth/login" -Body @{
      email = $SuperAdminEmail
      senha = $SuperAdminPassword
    } -ExpectedStatusCodes @(200, 201)

    $loginBody = $loginResponse.Body
    if ($null -eq $loginBody) {
      throw "Login sem body"
    }

    if ($loginBody.success -eq $true) {
      $script:accessToken = $loginBody.data.access_token
      $script:authenticatedUser = $loginBody.data.user
      if ([string]::IsNullOrWhiteSpace($script:accessToken)) {
        throw "Login retornou sucesso sem access_token"
      }
      return
    }

    if ($loginBody.action -ne "MFA_REQUIRED") {
      throw "Login nao autenticado e sem MFA_REQUIRED. Action: $($loginBody.action)"
    }

    if ([string]::IsNullOrWhiteSpace($SuperAdminMfaCode)) {
      throw "MFA requerido. Informe -SuperAdminMfaCode para concluir o smoke autenticado."
    }

    $challengeId = $loginBody.data.challengeId
    if ([string]::IsNullOrWhiteSpace($challengeId)) {
      throw "MFA_REQUIRED sem challengeId"
    }

    $mfaResponse = Invoke-JsonRequest -Method "POST" -Url "$normalizedApiBase/auth/mfa/verify" -Body @{
      challengeId = $challengeId
      codigo = $SuperAdminMfaCode
    } -ExpectedStatusCodes @(200, 201)

    $mfaBody = $mfaResponse.Body
    if ($null -eq $mfaBody -or $mfaBody.success -ne $true) {
      throw "Falha ao validar MFA"
    }

    $script:accessToken = $mfaBody.data.access_token
    $script:authenticatedUser = $mfaBody.data.user
    if ([string]::IsNullOrWhiteSpace($script:accessToken)) {
      throw "MFA validado sem access_token"
    }
  }

  Run-Step -Name "Admin branding autenticado" -Action {
    if ([string]::IsNullOrWhiteSpace($script:accessToken)) {
      throw "Token ausente para rota admin/system-branding"
    }

    $headers = @{
      Authorization = "Bearer $($script:accessToken)"
    }

    $response = Invoke-JsonRequest -Method "GET" -Url "$normalizedApiBase/admin/system-branding" -Headers $headers -ExpectedStatusCodes @(200)
    if ($null -eq $response.Body -or $response.Body.success -ne $true) {
      throw "Resposta invalida em admin/system-branding"
    }
  }

  Run-Step -Name "Admin bff companies autenticado" -Action {
    if ([string]::IsNullOrWhiteSpace($script:accessToken)) {
      throw "Token ausente para rota admin/bff/companies"
    }

    $headers = @{
      Authorization = "Bearer $($script:accessToken)"
    }

    $response = Invoke-JsonRequest -Method "GET" -Url "$normalizedApiBase/admin/bff/companies?page=1&limit=1" -Headers $headers -ExpectedStatusCodes @(200)
    if ($null -eq $response.Body -or $response.Body.success -ne $true) {
      throw "Resposta invalida em admin/bff/companies"
    }
  }

  Run-Step -Name "Owner tenant esperado (opcional)" -Action {
    if ([string]::IsNullOrWhiteSpace($ExpectedOwnerEmpresaId)) {
      Write-Host "ExpectedOwnerEmpresaId nao informado. Check skipped."
      return
    }

    if ($null -eq $script:authenticatedUser) {
      throw "Usuario autenticado indisponivel para validar owner tenant"
    }

    $actualOwnerEmpresaId = $script:authenticatedUser.empresa.id
    if ([string]::IsNullOrWhiteSpace($actualOwnerEmpresaId)) {
      throw "Login sem empresa.id no payload de user"
    }

    if ($actualOwnerEmpresaId -ne $ExpectedOwnerEmpresaId) {
      throw "Empresa do usuario autenticado divergente. Atual=$actualOwnerEmpresaId Esperado=$ExpectedOwnerEmpresaId"
    }
  }
}
else {
  Add-Result -Step "Login superadmin" -Status "SKIP" -Details "SkipAuthChecks enabled"
  Add-Result -Step "Admin branding autenticado" -Status "SKIP" -Details "SkipAuthChecks enabled"
  Add-Result -Step "Admin bff companies autenticado" -Status "SKIP" -Details "SkipAuthChecks enabled"
  Add-Result -Step "Owner tenant esperado (opcional)" -Status "SKIP" -Details "SkipAuthChecks enabled"
}

Write-Host ""
Write-Host "Smoke summary:"
$results | Format-Table -AutoSize

$failed = @($results | Where-Object { $_.Status -eq "FAIL" })
if ($failed.Count -gt 0) {
  Write-Host ""
  Write-Host "Smoke result: FAIL"
  exit 1
}

Write-Host ""
Write-Host "Smoke result: PASS"
exit 0
