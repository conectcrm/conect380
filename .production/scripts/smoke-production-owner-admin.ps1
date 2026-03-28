param(
  [string]$ApiBaseUrl = "https://api.conect360.com",
  [string]$AppBaseUrl = "https://conect360.com",
  [string]$GuardianBaseUrl = "",
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

function Get-ErrorMessage {
  param(
    [Parameter(Mandatory = $true)]$ErrorRecord
  )

  $messages = New-Object System.Collections.Generic.List[string]

  if ($null -ne $ErrorRecord) {
    $exceptionValue = $null
    if ($ErrorRecord.PSObject.Properties.Name -contains 'Exception') {
      $exceptionValue = $ErrorRecord.Exception
    }

    if ($null -ne $exceptionValue) {
      if ($exceptionValue -is [System.Exception]) {
        if (-not [string]::IsNullOrWhiteSpace([string]$exceptionValue.Message)) {
          $messages.Add([string]$exceptionValue.Message)
        }
      }
      else {
        $rawException = [string]$exceptionValue
        if (-not [string]::IsNullOrWhiteSpace($rawException)) {
          $messages.Add($rawException)
        }
      }
    }

    if ($ErrorRecord.PSObject.Properties.Name -contains 'ErrorDetails') {
      $errorDetailsValue = $ErrorRecord.ErrorDetails
      if ($null -ne $errorDetailsValue) {
        if ($errorDetailsValue -is [System.Management.Automation.ErrorDetails]) {
          if (-not [string]::IsNullOrWhiteSpace([string]$errorDetailsValue.Message)) {
            $messages.Add([string]$errorDetailsValue.Message)
          }
        }
        else {
          $rawErrorDetails = [string]$errorDetailsValue
          if (-not [string]::IsNullOrWhiteSpace($rawErrorDetails)) {
            $messages.Add($rawErrorDetails)
          }
        }
      }
    }

    $recordAsString = [string]$ErrorRecord
    if (-not [string]::IsNullOrWhiteSpace($recordAsString)) {
      $messages.Add($recordAsString)
    }
  }

  if ($messages.Count -eq 0) {
    return 'Unknown error'
  }

  return ($messages | Select-Object -Unique) -join ' | '
}

function Get-HttpStatusCodeFromError {
  param(
    [Parameter(Mandatory = $true)]$ErrorRecord
  )

  $candidateMessages = @(
    Get-ErrorMessage -ErrorRecord $ErrorRecord
  ) | Where-Object { -not [string]::IsNullOrWhiteSpace($_) }

  foreach ($message in $candidateMessages) {
    if ($message -match 'Status inesperado em .*: (?<status>\d{3})') {
      return [int]$Matches.status
    }

    if ($message -match 'status code does not indicate success:\s*(?<status>\d{3})') {
      return [int]$Matches.status
    }
  }

  return $null
}

function Test-IsTransientNetworkError {
  param(
    [Parameter(Mandatory = $true)]$ErrorRecord
  )

  $message = Get-ErrorMessage -ErrorRecord $ErrorRecord

  if ([string]::IsNullOrWhiteSpace($message)) {
    return $false
  }

  return $message -match 'timed out|timeout|temporarily unavailable|connection was closed|connection reset|connection refused|name resolution'
}

function Test-IsRetryableStatusCode {
  param(
    [Parameter(Mandatory = $true)][int]$StatusCode
  )

  if ($StatusCode -ge 500 -and $StatusCode -le 599) {
    return $true
  }

  return $StatusCode -in @(408, 409, 425, 429)
}

function Run-Step {
  param(
    [string]$Name,
    [scriptblock]$Action,
    [int]$MaxAttempts = 1,
    [int]$BaseRetryDelaySeconds = 2
  )

  Write-Host ""
  Write-Host ">> $Name"

  $attempts = [Math]::Max(1, $MaxAttempts)

  for ($attempt = 1; $attempt -le $attempts; $attempt++) {
    try {
      & $Action
      Add-Result -Step $Name -Status "PASS"
      return
    }
    catch {
      $statusCode = Get-HttpStatusCodeFromError -ErrorRecord $_
      $isTransientNetworkError = Test-IsTransientNetworkError -ErrorRecord $_
      $retryableStatus = $null -ne $statusCode -and (Test-IsRetryableStatusCode -StatusCode $statusCode)
      $shouldRetry = $attempt -lt $attempts -and ($retryableStatus -or $isTransientNetworkError)

      if ($shouldRetry) {
        $delaySeconds = [Math]::Max(1, $BaseRetryDelaySeconds * $attempt)
        if ($null -ne $statusCode) {
          Write-Host "Falha transiente em '$Name' (status $statusCode). Tentando novamente em $delaySeconds s..." -ForegroundColor Yellow
        }
        else {
          Write-Host "Falha transiente em '$Name'. Tentando novamente em $delaySeconds s..." -ForegroundColor Yellow
        }
        Start-Sleep -Seconds $delaySeconds
        continue
      }

      Add-Result -Step $Name -Status "FAIL" -Details (Get-ErrorMessage -ErrorRecord $_)
      return
    }
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

  $invokeWebRequestCommand = Get-Command Invoke-WebRequest -ErrorAction SilentlyContinue
  if ($null -ne $invokeWebRequestCommand -and $invokeWebRequestCommand.Parameters.ContainsKey('SkipHttpErrorCheck')) {
    # Em pwsh (GitHub Actions), evita excecao para 4xx/5xx e permite validar status esperado no fluxo abaixo.
    $requestParams.SkipHttpErrorCheck = $true
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
  catch {
    $exceptionValue = $null
    if ($_.PSObject.Properties.Name -contains 'Exception') {
      $exceptionValue = $_.Exception
    }

    $httpResponse = $null
    if ($null -ne $exceptionValue -and $exceptionValue.PSObject.Properties.Name -contains 'Response') {
      $httpResponse = $exceptionValue.Response
    }

    if ($null -eq $httpResponse) {
      throw
    }

    if ($httpResponse.PSObject.Properties.Name -notcontains 'StatusCode') {
      throw
    }

    $statusCode = [int]$httpResponse.StatusCode

    $rawBody = ''
    if ($null -ne $httpResponse -and $httpResponse.PSObject.Properties.Name -contains 'Content') {
      try {
        $rawBody = [string]$httpResponse.Content.ReadAsStringAsync().GetAwaiter().GetResult()
      }
      catch {
        $rawBody = ''
      }
    }

    if ([string]::IsNullOrWhiteSpace($rawBody) -and $null -ne $httpResponse.PSObject.Methods['GetResponseStream']) {
      $responseStream = $httpResponse.GetResponseStream()
      if ($null -ne $responseStream) {
        $streamReader = New-Object System.IO.StreamReader($responseStream)
        $rawBody = $streamReader.ReadToEnd()
        $streamReader.Close()
      }
    }

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

Write-Host "Smoke producao owner/admin"
Write-Host "API: $normalizedApiBase"
Write-Host "App: $normalizedAppBase"
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

Run-Step -Name "CORS app -> core-admin/system-branding" -Action {
  $corsHeaders = @{
    Origin = $normalizedAppBase
    "Access-Control-Request-Method" = "PUT"
    "Access-Control-Request-Headers" = "authorization,content-type"
  }

  $response = Invoke-JsonRequest -Method "OPTIONS" -Url "$normalizedApiBase/core-admin/system-branding" -Headers $corsHeaders -ExpectedStatusCodes @(200, 204)
  $allowOrigin = $response.Headers["Access-Control-Allow-Origin"]
  if ([string]::IsNullOrWhiteSpace($allowOrigin)) {
    throw "Header Access-Control-Allow-Origin ausente para origem app"
  }
  if ($allowOrigin -ne $normalizedAppBase) {
    throw "CORS inesperado para app: $allowOrigin"
  }
}

Run-Step -Name "Branding publico" -Action {
  $response = Invoke-JsonRequest -Method "GET" -Url "$normalizedApiBase/system-branding/public" -ExpectedStatusCodes @(200)
  if ($null -eq $response.Body) {
    throw "Resposta vazia em system-branding/public"
  }
}

if (-not $SkipAuthChecks) {
  Run-Step -Name "Login superadmin" -MaxAttempts 4 -Action {
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

  Run-Step -Name "Core Admin branding autenticado" -MaxAttempts 6 -Action {
    if ([string]::IsNullOrWhiteSpace($script:accessToken)) {
      throw "Token ausente para rota core-admin/system-branding"
    }

    $headers = @{
      Authorization = "Bearer $($script:accessToken)"
    }

    $authenticatedRole = ''
    if ($null -ne $script:authenticatedUser -and $null -ne $script:authenticatedUser.role) {
      $authenticatedRole = [string]$script:authenticatedUser.role
    }

    $response = Invoke-JsonRequest -Method "GET" -Url "$normalizedApiBase/core-admin/system-branding" -Headers $headers -ExpectedStatusCodes @(200, 403)
    if ($response.StatusCode -eq 403) {
      if ([string]::IsNullOrWhiteSpace($authenticatedRole)) {
        throw "Rota core-admin/system-branding retornou 403 e o papel do usuario autenticado nao foi identificado."
      }
      if ($authenticatedRole -eq 'superadmin') {
        throw "Rota core-admin/system-branding retornou 403 para superadmin."
      }

      Write-Host "Rota core-admin/system-branding bloqueada para role '$authenticatedRole' (esperado para perfis nao-superadmin)." -ForegroundColor Yellow
      return
    }

    if ($null -eq $response.Body) {
      throw "Resposta vazia em admin/system-branding"
    }

    $propertyNames = @($response.Body.PSObject.Properties.Name)
    $hasSuccess = ($propertyNames -contains "success") -and ($response.Body.success -eq $true)
    $hasData = ($propertyNames -contains "data") -and ($null -ne $response.Body.data)

    if (-not ($hasSuccess -or $hasData)) {
      throw "Resposta invalida em core-admin/system-branding"
    }
  }

  Run-Step -Name "Core Admin bff companies autenticado" -MaxAttempts 4 -Action {
    if ([string]::IsNullOrWhiteSpace($script:accessToken)) {
      throw "Token ausente para rota core-admin/bff/companies"
    }

    $headers = @{
      Authorization = "Bearer $($script:accessToken)"
    }

    $response = Invoke-JsonRequest -Method "GET" -Url "$normalizedApiBase/core-admin/bff/companies?page=1&limit=1" -Headers $headers -ExpectedStatusCodes @(200)
    if ($null -eq $response.Body -or $response.Body.success -ne $true) {
      throw "Resposta invalida em core-admin/bff/companies"
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
  Add-Result -Step "Core Admin branding autenticado" -Status "SKIP" -Details "SkipAuthChecks enabled"
  Add-Result -Step "Core Admin bff companies autenticado" -Status "SKIP" -Details "SkipAuthChecks enabled"
  Add-Result -Step "Owner tenant esperado (opcional)" -Status "SKIP" -Details "SkipAuthChecks enabled"
}

Write-Host ""
Write-Host "Smoke summary:"
$results | Format-Table -AutoSize

$failed = @($results | Where-Object { $_.Status -eq "FAIL" })
if ($failed.Count -gt 0) {
  Write-Host ""
  Write-Host "Smoke failures (detalhes):"
  foreach ($item in $failed) {
    Write-Host "- $($item.Step): $($item.Details)"
  }

  Write-Host ""
  Write-Host "Smoke result: FAIL"
  exit 1
}

Write-Host ""
Write-Host "Smoke result: PASS"
exit 0
