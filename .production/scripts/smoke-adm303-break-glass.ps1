param(
  [string]$BaseUrl = "http://localhost:3001",
  [string]$RequesterEmail = "admin@conectsuite.com.br",
  [string]$RequesterPassword = "admin123",
  [string]$RequesterMfaCode,
  [string]$ApproverEmail = "superadmin@conectsuite.com.br",
  [string]$ApproverPassword = "admin123",
  [string]$ApproverMfaCode,
  [string]$TargetEmail = "mvp.manager.dashboard@conectsuite.com.br",
  [string]$TargetPassword = "Mvp#2026Pass!",
  [string]$TargetMfaCode,
  [string]$Permission = "admin.empresas.manage",
  [int]$DurationMinutes = 20,
  [string]$RequestReason = "Smoke ADM-303: validacao de acesso emergencial temporario",
  [string]$ApproveReason = "Smoke ADM-303: aprovacao de segundo responsavel",
  [string]$RevokeReason = "Smoke ADM-303: encerramento controlado de acesso emergencial",
  [switch]$SkipTargetAccessCheck,
  [switch]$DryRun
)

$ErrorActionPreference = "Stop"
$results = @()
$requestId = $null
$runStartedAt = Get-Date
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
$evidenceDir = Join-Path $repoRoot "docs\features\evidencias"
$evidenceJsonPath = Join-Path $evidenceDir "ADM303_SMOKE_$timestamp.json"
$evidenceMdPath = Join-Path $evidenceDir "ADM303_SMOKE_$timestamp.md"
$dryRunState = [ordered]@{
  request_created = $false
  approved = $false
  revoked = $false
  request_id = "dryrun-breakglass-0001"
  target_user_id = "dryrun-target-user-0001"
}

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

function Convert-JsonSafe {
  param([string]$Content)

  if ([string]::IsNullOrWhiteSpace($Content)) {
    return $null
  }

  try {
    return $Content | ConvertFrom-Json
  }
  catch {
    return $Content
  }
}

function Invoke-ApiRequest {
  param(
    [ValidateSet("GET", "POST", "PUT", "PATCH", "DELETE")]
    [string]$Method,
    [string]$Url,
    [string]$Token,
    $Body,
    [int[]]$ExpectedStatusCodes = @(200, 201)
  )

  if ($DryRun) {
    $urlLower = $Url.ToLowerInvariant()

    if ($Method -eq "POST" -and $urlLower -like "*/auth/login") {
      $email = if ($Body -and $Body.email) { [string]$Body.email } else { "dryrun@example.com" }
      $role = "admin"
      if ($email -eq $TargetEmail) {
        $role = "gerente"
      }
      elseif ($email -eq $ApproverEmail) {
        $role = "superadmin"
      }

      return [pscustomobject]@{
        StatusCode = 201
        Body = [pscustomobject]@{
          success = $true
          data = [pscustomobject]@{
            access_token = "dryrun-token::$email"
            user = [pscustomobject]@{
              id = "dryrun-user-$role"
              email = $email
              role = $role
            }
          }
        }
        RawBody = ""
      }
    }

    if ($Method -eq "GET" -and $urlLower -like "*/admin/bff/users*") {
      return [pscustomobject]@{
        StatusCode = 200
        Body = [pscustomobject]@{
          success = $true
          data = [pscustomobject]@{
            items = @(
              [pscustomobject]@{
                id = $dryRunState.target_user_id
                nome = "DryRun Target"
                email = $TargetEmail
                role = "gerente"
                ativo = $true
              }
            )
          }
        }
        RawBody = ""
      }
    }

    if ($Method -eq "POST" -and $urlLower -like "*/admin/bff/break-glass/requests" -and $urlLower -notlike "*/approve" -and $urlLower -notlike "*/reject") {
      $dryRunState.request_created = $true
      $dryRunState.approved = $false
      $dryRunState.revoked = $false

      return [pscustomobject]@{
        StatusCode = 201
        Body = [pscustomobject]@{
          success = $true
          data = [pscustomobject]@{
            id = $dryRunState.request_id
            status = "REQUESTED"
          }
        }
        RawBody = ""
      }
    }

    if ($Method -eq "POST" -and $urlLower -like "*/admin/bff/break-glass/requests/*/approve") {
      $dryRunState.approved = $true
      $dryRunState.revoked = $false

      return [pscustomobject]@{
        StatusCode = 201
        Body = [pscustomobject]@{
          success = $true
          data = [pscustomobject]@{
            id = $dryRunState.request_id
            status = "APPROVED"
          }
        }
        RawBody = ""
      }
    }

    if ($Method -eq "POST" -and $urlLower -like "*/admin/bff/break-glass/*/revoke") {
      $dryRunState.revoked = $true
      $dryRunState.approved = $false

      return [pscustomobject]@{
        StatusCode = 201
        Body = [pscustomobject]@{
          success = $true
          data = [pscustomobject]@{
            id = $dryRunState.request_id
            status = "REVOKED"
          }
        }
        RawBody = ""
      }
    }

    if ($Method -eq "GET" -and $urlLower -like "*/admin/bff/break-glass/active*") {
      $items = @()
      if ($dryRunState.approved -and -not $dryRunState.revoked) {
        $items = @(
          [pscustomobject]@{
            id = $dryRunState.request_id
            status = "APPROVED"
          }
        )
      }

      return [pscustomobject]@{
        StatusCode = 200
        Body = [pscustomobject]@{
          success = $true
          data = $items
        }
        RawBody = ""
      }
    }

    if ($Method -eq "GET" -and $urlLower -like "*/admin/bff/companies*") {
      $isTargetCall = $Token -and $Token.Contains($TargetEmail)
      $statusCode = 200

      if ($isTargetCall) {
        if ($dryRunState.approved -and -not $dryRunState.revoked) {
          $statusCode = 200
        }
        else {
          $statusCode = 403
        }
      }

      return [pscustomobject]@{
        StatusCode = $statusCode
        Body = [pscustomobject]@{
          success = ($statusCode -eq 200)
          data = @()
        }
        RawBody = ""
      }
    }

    if ($Method -eq "GET" -and $urlLower -like "*/admin/bff/audit/activities*") {
      return [pscustomobject]@{
        StatusCode = 200
        Body = [pscustomobject]@{
          success = $true
          data = @(
            [pscustomobject]@{
              categoria = "admin_break_glass"
              evento = "break_glass_revoke"
            }
          )
        }
        RawBody = ""
      }
    }

    $mockStatus = $ExpectedStatusCodes[0]
    return [pscustomobject]@{
      StatusCode = $mockStatus
      Body = [pscustomobject]@{
        success = ($mockStatus -lt 400)
        dry_run = $true
        method = $Method
        url = $Url
      }
      RawBody = ""
    }
  }

  $headers = @{}
  if ($Token) {
    $headers["Authorization"] = "Bearer $Token"
  }

  $params = @{
    Method = $Method
    Uri = $Url
    Headers = $headers
    ErrorAction = "Stop"
  }

  if ($null -ne $Body) {
    $params["ContentType"] = "application/json"
    $params["Body"] = ($Body | ConvertTo-Json -Depth 30)
  }

  try {
    $responseBody = Invoke-RestMethod @params
    # Windows PowerShell 5.1 nao expoe status code em sucesso no Invoke-RestMethod.
    # O backend usa 200/201 para fluxos positivos, portanto padronizamos como 200.
    $statusCode = 200

    if ($ExpectedStatusCodes -notcontains $statusCode -and $ExpectedStatusCodes -contains 201) {
      $statusCode = 201
    }

    if ($ExpectedStatusCodes -notcontains $statusCode) {
      throw "HTTP $statusCode em $Method $Url (esperado: $($ExpectedStatusCodes -join ', '))."
    }

    return [pscustomobject]@{
      StatusCode = $statusCode
      Body = $responseBody
      RawBody = ""
    }
  }
  catch {
    $statusCode = $null
    $rawContent = $null

    if ($_.Exception.Response) {
      try {
        $statusCode = [int]$_.Exception.Response.StatusCode
      }
      catch {}

      try {
        $stream = $_.Exception.Response.GetResponseStream()
        if ($stream) {
          $reader = New-Object System.IO.StreamReader($stream)
          $rawContent = $reader.ReadToEnd()
          $reader.Dispose()
        }
      }
      catch {}
    }

    if ($null -ne $statusCode -and $ExpectedStatusCodes -contains $statusCode) {
      return [pscustomobject]@{
        StatusCode = $statusCode
        Body = (Convert-JsonSafe -Content $rawContent)
        RawBody = $rawContent
      }
    }

    if ($null -ne $statusCode) {
      throw "HTTP $statusCode em $Method $Url. $rawContent"
    }

    throw
  }
}

function Login-Session {
  param(
    [string]$Email,
    [string]$Password,
    [string]$MfaCode
  )

  $response = Invoke-ApiRequest -Method "POST" -Url "$BaseUrl/auth/login" -Body @{
    email = $Email
    senha = $Password
  } -ExpectedStatusCodes @(200, 201)

  $body = $response.Body
  if ($null -eq $body) {
    throw "Login sem resposta para $Email"
  }

  if ($body.success -and $body.data -and $body.data.access_token) {
    return [pscustomobject]@{
      Token = [string]$body.data.access_token
      User = $body.data.user
      Email = $Email
      Mfa = $false
    }
  }

  if ([string]$body.action -eq "MFA_REQUIRED") {
    $challengeId = [string]$body.data.challengeId
    if ([string]::IsNullOrWhiteSpace($challengeId)) {
      throw "Login MFA sem challengeId para $Email"
    }

    if ([string]::IsNullOrWhiteSpace($MfaCode)) {
      $deliveryChannel = [string]$body.data.deliveryChannel
      $devCode = [string]$body.data.devCode

      if ($deliveryChannel -eq "dev_fallback" -and -not [string]::IsNullOrWhiteSpace($devCode)) {
        $MfaCode = $devCode
        Write-Host "   [MFA] Fallback de desenvolvimento detectado para $Email (codigo obtido automaticamente)."
      }
    }

    if ([string]::IsNullOrWhiteSpace($MfaCode)) {
      throw "MFA obrigatorio para $Email. Informe parametro de codigo MFA correspondente."
    }

    $verify = Invoke-ApiRequest -Method "POST" -Url "$BaseUrl/auth/mfa/verify" -Body @{
      challengeId = $challengeId
      codigo = $MfaCode
    } -ExpectedStatusCodes @(200, 201)

    $verifyBody = $verify.Body
    if (-not $verifyBody.success -or -not $verifyBody.data -or -not $verifyBody.data.access_token) {
      throw "Falha no MFA para $Email"
    }

    return [pscustomobject]@{
      Token = [string]$verifyBody.data.access_token
      User = $verifyBody.data.user
      Email = $Email
      Mfa = $true
    }
  }

  $message = if ($body.message) { [string]$body.message } else { "resposta invalida" }
  throw "Falha no login para ${Email}: $message"
}

function Assert-True {
  param(
    [bool]$Condition,
    [string]$Message
  )

  if (-not $Condition) {
    throw $Message
  }
}

function Assert-NotNull {
  param(
    $Value,
    [string]$Message
  )

  if ($null -eq $Value) {
    throw $Message
  }
}

function Save-Evidence {
  param(
    [string]$RequestIdValue,
    [string]$TargetUserId,
    [int]$BeforeStatus,
    [int]$AfterApproveStatus,
    [int]$AfterRevokeStatus
  )

  if (-not (Test-Path $evidenceDir)) {
    New-Item -Path $evidenceDir -ItemType Directory -Force | Out-Null
  }

  $runSummary = [pscustomobject]@{
    started_at = $runStartedAt.ToString("s")
    finished_at = (Get-Date).ToString("s")
    base_url = $BaseUrl
    requester_email = $RequesterEmail
    approver_email = $ApproverEmail
    target_email = $TargetEmail
    target_user_id = $TargetUserId
    request_id = $RequestIdValue
    permission = $Permission
    duration_minutes = $DurationMinutes
    target_companies_status_before = $BeforeStatus
    target_companies_status_after_approve = $AfterApproveStatus
    target_companies_status_after_revoke = $AfterRevokeStatus
    dry_run = [bool]$DryRun
    results = $results
  }

  $runSummary | ConvertTo-Json -Depth 40 | Set-Content -Path $evidenceJsonPath -Encoding UTF8

  $lines = @()
  $lines += "# ADM-303 Smoke Report ($timestamp)"
  $lines += ""
  $lines += "- Base URL: $BaseUrl"
  $lines += "- Request ID: $RequestIdValue"
  $lines += "- Target User ID: $TargetUserId"
  $lines += "- Permission: $Permission"
  $lines += "- Duration Minutes: $DurationMinutes"
  $lines += "- Target status before approve: $BeforeStatus"
  $lines += "- Target status after approve: $AfterApproveStatus"
  $lines += "- Target status after revoke: $AfterRevokeStatus"
  $lines += ""
  $lines += "## Steps"
  $lines += ""
  $lines += "| Step | Status | Details |"
  $lines += "| --- | --- | --- |"

  foreach ($item in $results) {
    $step = ([string]$item.Step).Replace("|", "\|")
    $status = ([string]$item.Status).Replace("|", "\|")
    $details = ([string]$item.Details).Replace("|", "\|")
    $lines += "| $step | $status | $details |"
  }

  Set-Content -Path $evidenceMdPath -Value $lines -Encoding UTF8
}

$requesterSession = $null
$approverSession = $null
$targetSession = $null
$targetUserId = $null
$beforeStatus = -1
$afterApproveStatus = -1
$afterRevokeStatus = -1

Run-Step -Name "Login requester" -Action {
  $script:requesterSession = Login-Session -Email $RequesterEmail -Password $RequesterPassword -MfaCode $RequesterMfaCode
  Assert-NotNull -Value $script:requesterSession.Token -Message "Token do requester nao retornado"
}

Run-Step -Name "Login approver" -Action {
  $script:approverSession = Login-Session -Email $ApproverEmail -Password $ApproverPassword -MfaCode $ApproverMfaCode
  Assert-NotNull -Value $script:approverSession.Token -Message "Token do approver nao retornado"
}

if (-not $SkipTargetAccessCheck) {
  Run-Step -Name "Login target" -Action {
    $script:targetSession = Login-Session -Email $TargetEmail -Password $TargetPassword -MfaCode $TargetMfaCode
    Assert-NotNull -Value $script:targetSession.Token -Message "Token do target nao retornado"
  }
}

Run-Step -Name "Resolver target_user_id pelo admin-bff/users" -Action {
  $usersResponse = Invoke-ApiRequest -Method "GET" -Url "$BaseUrl/admin/bff/users?limite=200&pagina=1" -Token $script:requesterSession.Token -ExpectedStatusCodes @(200)
  $items = @()
  if ($usersResponse.Body -and $usersResponse.Body.data -and $usersResponse.Body.data.items) {
    $items = @($usersResponse.Body.data.items)
  }

  $target = $items | Where-Object { [string]$_.email -eq $TargetEmail } | Select-Object -First 1
  Assert-NotNull -Value $target -Message "Usuario alvo nao encontrado por email: $TargetEmail"
  $script:targetUserId = [string]$target.id
  Assert-True -Condition (-not [string]::IsNullOrWhiteSpace($script:targetUserId)) -Message "target_user_id vazio"
}

if (-not $SkipTargetAccessCheck) {
  Run-Step -Name "Validar acesso alvo antes do break-glass (esperado 403)" -Action {
    $before = Invoke-ApiRequest -Method "GET" -Url "$BaseUrl/admin/bff/companies?page=1&limit=10" -Token $script:targetSession.Token -ExpectedStatusCodes @(200, 403)
    $script:beforeStatus = [int]$before.StatusCode
    Assert-True -Condition ($script:beforeStatus -eq 403) -Message "Usuario alvo ja possui acesso a /admin/bff/companies antes do break-glass (status=$($script:beforeStatus))."
  }
}

Run-Step -Name "Criar solicitacao break-glass" -Action {
  $create = Invoke-ApiRequest -Method "POST" -Url "$BaseUrl/admin/bff/break-glass/requests" -Token $script:requesterSession.Token -Body @{
    target_user_id = $script:targetUserId
    permissions = @($Permission)
    duration_minutes = $DurationMinutes
    reason = $RequestReason
  } -ExpectedStatusCodes @(200, 201)

  Assert-True -Condition ([bool]$create.Body.success) -Message "Criacao de solicitacao retornou success=false"
  $script:requestId = [string]$create.Body.data.id
  Assert-True -Condition (-not [string]::IsNullOrWhiteSpace($script:requestId)) -Message "Solicitacao sem id"
  Assert-True -Condition ([string]$create.Body.data.status -eq "REQUESTED") -Message "Status inesperado apos criacao: $($create.Body.data.status)"
}

Run-Step -Name "Aprovar solicitacao break-glass com segundo responsavel" -Action {
  $approve = Invoke-ApiRequest -Method "POST" -Url "$BaseUrl/admin/bff/break-glass/requests/$($script:requestId)/approve" -Token $script:approverSession.Token -Body @{
    reason = $ApproveReason
  } -ExpectedStatusCodes @(200, 201)

  Assert-True -Condition ([bool]$approve.Body.success) -Message "Aprovacao retornou success=false"
  Assert-True -Condition ([string]$approve.Body.data.status -eq "APPROVED") -Message "Status inesperado apos aprovacao: $($approve.Body.data.status)"
}

Run-Step -Name "Validar listagem de break-glass ativo" -Action {
  $active = Invoke-ApiRequest -Method "GET" -Url "$BaseUrl/admin/bff/break-glass/active?limit=20&target_user_id=$($script:targetUserId)" -Token $script:requesterSession.Token -ExpectedStatusCodes @(200)
  $items = @()
  if ($active.Body -and $active.Body.data) {
    $items = @($active.Body.data)
  }

  $match = $items | Where-Object { [string]$_.id -eq $script:requestId } | Select-Object -First 1
  Assert-NotNull -Value $match -Message "Solicitacao aprovada nao aparece na listagem de ativos"
}

if (-not $SkipTargetAccessCheck) {
  Run-Step -Name "Validar acesso alvo durante vigencia (esperado 200)" -Action {
    $afterApprove = Invoke-ApiRequest -Method "GET" -Url "$BaseUrl/admin/bff/companies?page=1&limit=10" -Token $script:targetSession.Token -ExpectedStatusCodes @(200, 403)
    $script:afterApproveStatus = [int]$afterApprove.StatusCode
    Assert-True -Condition ($script:afterApproveStatus -eq 200) -Message "Acesso alvo nao foi elevado apos aprovacao (status=$($script:afterApproveStatus))."
  }
}

Run-Step -Name "Revogar acesso break-glass ativo" -Action {
  $revoke = Invoke-ApiRequest -Method "POST" -Url "$BaseUrl/admin/bff/break-glass/$($script:requestId)/revoke" -Token $script:approverSession.Token -Body @{
    reason = $RevokeReason
  } -ExpectedStatusCodes @(200, 201)

  Assert-True -Condition ([bool]$revoke.Body.success) -Message "Revogacao retornou success=false"
  Assert-True -Condition ([string]$revoke.Body.data.status -eq "REVOKED") -Message "Status inesperado apos revogacao: $($revoke.Body.data.status)"
}

Run-Step -Name "Validar remocao de break-glass ativo" -Action {
  $active = Invoke-ApiRequest -Method "GET" -Url "$BaseUrl/admin/bff/break-glass/active?limit=20&target_user_id=$($script:targetUserId)" -Token $script:requesterSession.Token -ExpectedStatusCodes @(200)
  $items = @()
  if ($active.Body -and $active.Body.data) {
    $items = @($active.Body.data)
  }

  $match = $items | Where-Object { [string]$_.id -eq $script:requestId } | Select-Object -First 1
  Assert-True -Condition ($null -eq $match) -Message "Solicitacao ainda aparece como ativa apos revogacao"
}

if (-not $SkipTargetAccessCheck) {
  Run-Step -Name "Validar acesso alvo apos revogacao (esperado 403)" -Action {
    $afterRevoke = Invoke-ApiRequest -Method "GET" -Url "$BaseUrl/admin/bff/companies?page=1&limit=10" -Token $script:targetSession.Token -ExpectedStatusCodes @(200, 403)
    $script:afterRevokeStatus = [int]$afterRevoke.StatusCode
    Assert-True -Condition ($script:afterRevokeStatus -eq 403) -Message "Acesso alvo permaneceu elevado apos revogacao (status=$($script:afterRevokeStatus))."
  }
}

Run-Step -Name "Validar trilha de auditoria admin_break_glass" -Action {
  $audit = Invoke-ApiRequest -Method "GET" -Url "$BaseUrl/admin/bff/audit/activities?admin_only=true&limit=150" -Token $script:requesterSession.Token -ExpectedStatusCodes @(200)
  $items = @()
  if ($audit.Body -and $audit.Body.data) {
    $items = @($audit.Body.data)
  }

  $targetAudit = $items | Where-Object { [string]$_.categoria -eq "admin_break_glass" } | Select-Object -First 1
  Assert-NotNull -Value $targetAudit -Message "Nao encontrou evento admin_break_glass na auditoria"
}

Save-Evidence -RequestIdValue $requestId -TargetUserId $targetUserId -BeforeStatus $beforeStatus -AfterApproveStatus $afterApproveStatus -AfterRevokeStatus $afterRevokeStatus

Write-Host ""
Write-Host "ADM-303 smoke summary:"
$results | Format-Table -AutoSize
Write-Host ""
Write-Host "Evidence JSON: $evidenceJsonPath"
Write-Host "Evidence MD:   $evidenceMdPath"

$failed = @($results | Where-Object { $_.Status -eq "FAIL" })
if ($failed.Count -gt 0) {
  Write-Host ""
  Write-Host "ADM-303 smoke result: FAIL"
  exit 1
}

Write-Host ""
Write-Host "ADM-303 smoke result: PASS"
exit 0
