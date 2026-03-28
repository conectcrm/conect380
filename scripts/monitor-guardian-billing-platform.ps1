param(
  [string]$BaseUrl = 'http://localhost:3001',
  [string]$Token = '',
  [string]$Email = '',
  [string]$Senha = '',
  [int]$IntervalSeconds = 300,
  [int]$DurationHours = 24,
  [int]$MaxCycles = 0,
  [switch]$DryRun = $false,
  [switch]$FailOnAnomaly = $false,
  [string]$OutputCsv = '',
  [string]$OutputSummary = ''
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$normalizedBaseUrl = $BaseUrl.TrimEnd('/')
$runId = Get-Date -Format 'yyyyMMdd-HHmmss'

if ([string]::IsNullOrWhiteSpace($OutputCsv)) {
  $OutputCsv = Join-Path $repoRoot "docs/features/evidencias/GDN402_GUARDIAN_MONITOR_$runId.csv"
} elseif (-not [System.IO.Path]::IsPathRooted($OutputCsv)) {
  $OutputCsv = Join-Path $repoRoot $OutputCsv
}

if ([string]::IsNullOrWhiteSpace($OutputSummary)) {
  $OutputSummary = Join-Path $repoRoot "docs/features/evidencias/GDN402_GUARDIAN_MONITOR_$runId.md"
} elseif (-not [System.IO.Path]::IsPathRooted($OutputSummary)) {
  $OutputSummary = Join-Path $repoRoot $OutputSummary
}

function New-RequestResult {
  param(
    [string]$Name,
    [string]$Method,
    [string]$Url,
    [string]$Result = 'SKIPPED',
    [int]$StatusCode = 0,
    [double]$DurationMs = 0,
    [string]$Error = '',
    [object]$Payload = $null
  )

  return [PSCustomObject]@{
    Name = $Name
    Method = $Method
    Url = $Url
    Result = $Result
    StatusCode = $StatusCode
    DurationMs = $DurationMs
    Error = $Error
    Payload = $Payload
  }
}

function Invoke-TimedRequest {
  param(
    [string]$Name,
    [string]$Method,
    [string]$Url,
    [hashtable]$Headers = @{},
    [object]$Body = $null,
    [switch]$SkipNetwork
  )

  if ($SkipNetwork) {
    return New-RequestResult -Name $Name -Method $Method -Url $Url
  }

  $sw = [System.Diagnostics.Stopwatch]::StartNew()
  $statusCode = 0
  $result = 'PASS'
  $error = ''
  $payload = $null

  try {
    $params = @{
      Uri = $Url
      Method = $Method
      UseBasicParsing = $true
      ErrorAction = 'Stop'
    }

    if ($Headers.Count -gt 0) {
      $params['Headers'] = $Headers
    }

    if ($null -ne $Body) {
      $params['Body'] = ($Body | ConvertTo-Json -Depth 10)
      $params['ContentType'] = 'application/json'
    }

    $response = Invoke-WebRequest @params
    $statusCode = [int]$response.StatusCode
    if (-not [string]::IsNullOrWhiteSpace($response.Content)) {
      try {
        $payload = $response.Content | ConvertFrom-Json -ErrorAction Stop
      } catch {
        $payload = $response.Content
      }
    }
  } catch {
    $result = 'FAIL'
    $error = $_.Exception.Message
    if ($_.Exception.Response -and $_.Exception.Response.StatusCode) {
      try {
        $statusCode = [int]$_.Exception.Response.StatusCode.value__
      } catch {
        $statusCode = 0
      }
    }
  } finally {
    $sw.Stop()
  }

  return New-RequestResult -Name $Name -Method $Method -Url $Url -Result $result -StatusCode $statusCode -DurationMs ([Math]::Round($sw.Elapsed.TotalMilliseconds, 2)) -Error $error -Payload $payload
}

function Resolve-AuthContext {
  param(
    [string]$CurrentToken,
    [string]$ApiBaseUrl,
    [string]$LoginEmail,
    [string]$LoginSenha,
    [switch]$SkipNetwork
  )

  if ($SkipNetwork) {
    return [PSCustomObject]@{
      AccessToken = ''
      Step = (New-RequestResult -Name 'auth' -Method 'POST' -Url "$ApiBaseUrl/auth/login")
    }
  }

  if (-not [string]::IsNullOrWhiteSpace($CurrentToken)) {
    return [PSCustomObject]@{
      AccessToken = $CurrentToken
      Step = (New-RequestResult -Name 'auth-manual-token' -Method 'TOKEN' -Url '(manual)' -Result 'PASS' -StatusCode 200)
    }
  }

  if ([string]::IsNullOrWhiteSpace($LoginEmail) -or [string]::IsNullOrWhiteSpace($LoginSenha)) {
    return [PSCustomObject]@{
      AccessToken = ''
      Step = (New-RequestResult -Name 'auth' -Method 'POST' -Url "$ApiBaseUrl/auth/login" -Result 'FAIL' -Error 'Informe -Token ou -Email/-Senha para autenticacao.')
    }
  }

  $body = @{ email = $LoginEmail; senha = $LoginSenha }
  $loginStep = Invoke-TimedRequest -Name 'auth' -Method 'POST' -Url "$ApiBaseUrl/auth/login" -Body $body

  if ($loginStep.Result -ne 'PASS') {
    return [PSCustomObject]@{
      AccessToken = ''
      Step = $loginStep
    }
  }

  $accessToken = Resolve-TokenFromPayload -Payload $loginStep.Payload
  if ([string]::IsNullOrWhiteSpace($accessToken)) {
    $action = ''
    if ($loginStep.Payload -and $loginStep.Payload.PSObject.Properties.Name -contains 'action') {
      $action = [string]$loginStep.Payload.action
    }

    if ($action -eq 'MFA_REQUIRED' -and $loginStep.Payload.PSObject.Properties.Name -contains 'data' -and $null -ne $loginStep.Payload.data) {
      $challengeId = ''
      $codigo = ''
      $challengeData = $loginStep.Payload.data

      if ($challengeData.PSObject.Properties.Name -contains 'challengeId') {
        $challengeId = [string]$challengeData.challengeId
      }
      if ($challengeData.PSObject.Properties.Name -contains 'devCode') {
        $codigo = [string]$challengeData.devCode
      }

      if (-not [string]::IsNullOrWhiteSpace($challengeId) -and -not [string]::IsNullOrWhiteSpace($codigo)) {
        $verifyStep = Invoke-TimedRequest -Name 'auth-mfa-verify' -Method 'POST' -Url "$ApiBaseUrl/auth/mfa/verify" -Body @{
          challengeId = $challengeId
          codigo = $codigo
        }

        if ($verifyStep.Result -eq 'PASS') {
          $accessToken = Resolve-TokenFromPayload -Payload $verifyStep.Payload
          if (-not [string]::IsNullOrWhiteSpace($accessToken)) {
            return [PSCustomObject]@{
              AccessToken = $accessToken
              Step = $verifyStep
            }
          }

          $loginStep.Result = 'FAIL'
          $loginStep.Error = 'MFA verify executado, mas sem token reconhecido.'
        } else {
          $loginStep.Result = 'FAIL'
          $loginStep.Error = "MFA verify falhou: status=$($verifyStep.StatusCode) erro=$($verifyStep.Error)"
        }
      }
    }
  }

  if ([string]::IsNullOrWhiteSpace($accessToken)) {
    $loginStep.Result = 'FAIL'
    if ([string]::IsNullOrWhiteSpace($loginStep.Error)) {
      $loginStep.Error = 'Login sem token reconhecido (access_token/accessToken/token). Use -Token manual quando houver MFA.'
    }
  }

  return [PSCustomObject]@{
    AccessToken = $accessToken
    Step = $loginStep
  }
}

function Resolve-TokenFromPayload {
  param([object]$Payload)

  if ($null -eq $Payload) { return '' }

  $keys = @('access_token', 'accessToken', 'token')
  foreach ($key in $keys) {
    if ($Payload.PSObject.Properties.Name -contains $key) {
      $value = [string]$Payload.$key
      if (-not [string]::IsNullOrWhiteSpace($value)) { return $value }
    }
  }

  if ($Payload.PSObject.Properties.Name -contains 'data' -and $null -ne $Payload.data) {
    $data = $Payload.data
    foreach ($key in $keys) {
      if ($data.PSObject.Properties.Name -contains $key) {
        $value = [string]$data.$key
        if (-not [string]::IsNullOrWhiteSpace($value)) { return $value }
      }
    }

    if ($data.PSObject.Properties.Name -contains 'tokens' -and $null -ne $data.tokens) {
      $tokens = $data.tokens
      foreach ($key in $keys) {
        if ($tokens.PSObject.Properties.Name -contains $key) {
          $value = [string]$tokens.$key
          if (-not [string]::IsNullOrWhiteSpace($value)) { return $value }
        }
      }
    }
  }

  return Find-JwtTokenInValue -Value $Payload
}

function Find-JwtTokenInValue {
  param([object]$Value)

  if ($null -eq $Value) { return '' }

  if ($Value -is [string]) {
    if ($Value -match '^[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+$') {
      return $Value
    }
    return ''
  }

  if ($Value -is [System.Collections.IDictionary]) {
    foreach ($key in $Value.Keys) {
      $found = Find-JwtTokenInValue -Value $Value[$key]
      if (-not [string]::IsNullOrWhiteSpace($found)) { return $found }
    }
    return ''
  }

  if ($Value -is [System.Collections.IEnumerable] -and -not ($Value -is [string])) {
    foreach ($item in $Value) {
      $found = Find-JwtTokenInValue -Value $item
      if (-not [string]::IsNullOrWhiteSpace($found)) { return $found }
    }
    return ''
  }

  foreach ($prop in @($Value.PSObject.Properties)) {
    $found = Find-JwtTokenInValue -Value $prop.Value
    if (-not [string]::IsNullOrWhiteSpace($found)) { return $found }
  }

  return ''
}

function Get-ArrayFromPayload {
  param(
    [object]$Payload,
    [string]$PropertyName = 'data'
  )

  if ($null -eq $Payload) {
    return @()
  }

  if ($Payload -is [array]) {
    return $Payload
  }

  $props = @($Payload.PSObject.Properties.Name)
  if ($props -contains $PropertyName -and $Payload.$PropertyName -is [array]) {
    return $Payload.$PropertyName
  }

  return @()
}

function Get-NestedValue {
  param(
    [object]$Source,
    [string[]]$Path,
    $Default = $null
  )

  $current = $Source
  foreach ($part in $Path) {
    if ($null -eq $current) {
      return $Default
    }

    $props = @($current.PSObject.Properties.Name)
    if ($props -notcontains $part) {
      return $Default
    }

    $current = $current.$part
  }

  if ($null -eq $current) {
    return $Default
  }

  return $current
}

$startedAt = Get-Date
$deadline = $startedAt.AddHours($DurationHours)

$requestLog = @()
$cycleRows = @()

Write-Host ''
Write-Host '===============================================' -ForegroundColor Cyan
Write-Host ' GDN-402 - Monitor billing/platform Guardian' -ForegroundColor Cyan
Write-Host '===============================================' -ForegroundColor Cyan
Write-Host "RunId: $runId"
Write-Host "BaseUrl: $normalizedBaseUrl"
Write-Host "DryRun: $($DryRun.IsPresent)"
Write-Host "DurationHours: $DurationHours"
Write-Host "IntervalSeconds: $IntervalSeconds"
Write-Host ''

$authContext = Resolve-AuthContext -CurrentToken $Token -ApiBaseUrl $normalizedBaseUrl -LoginEmail $Email -LoginSenha $Senha -SkipNetwork:$DryRun
$requestLog += $authContext.Step

$headers = @{}
if (-not [string]::IsNullOrWhiteSpace($authContext.AccessToken)) {
  $headers['Authorization'] = "Bearer $($authContext.AccessToken)"
}

$monitorStartIso = (Get-Date).ToString('o')
$cycle = 0

while ($true) {
  if ($MaxCycles -gt 0 -and $cycle -ge $MaxCycles) {
    break
  }

  if ((Get-Date) -gt $deadline) {
    break
  }

  $cycle++
  $cycleTime = Get-Date
  $cycleIso = $cycleTime.ToString('o')

  $healthStep = Invoke-TimedRequest -Name 'health' -Method 'GET' -Url "$normalizedBaseUrl/health" -SkipNetwork:$DryRun
  $healthDetailedStep = Invoke-TimedRequest -Name 'health-detailed' -Method 'GET' -Url "$normalizedBaseUrl/health/detailed" -SkipNetwork:$DryRun
  $overviewStep = Invoke-TimedRequest -Name 'guardian-overview' -Method 'GET' -Url "$normalizedBaseUrl/core-admin/bff/overview" -Headers $headers -SkipNetwork:$DryRun
  $billingStep = Invoke-TimedRequest -Name 'guardian-billing-subscriptions' -Method 'GET' -Url "$normalizedBaseUrl/core-admin/bff/billing/subscriptions" -Headers $headers -SkipNetwork:$DryRun

  $auditSince = [Uri]::EscapeDataString($monitorStartIso)
  $auditUntil = [Uri]::EscapeDataString($cycleIso)
  $auditUrl = "$normalizedBaseUrl/core-admin/bff/audit/critical?target_type=billing_subscription&limit=200&data_inicio=$auditSince&data_fim=$auditUntil"
  $auditStep = Invoke-TimedRequest -Name 'guardian-audit-critical-billing' -Method 'GET' -Url $auditUrl -Headers $headers -SkipNetwork:$DryRun

  $requestLog += @($healthStep, $healthDetailedStep, $overviewStep, $billingStep, $auditStep)

  $billingItems = Get-ArrayFromPayload -Payload $billingStep.Payload -PropertyName 'data'
  $auditItems = Get-ArrayFromPayload -Payload $auditStep.Payload -PropertyName 'data'

  $statusTrial = 0
  $statusActive = 0
  $statusPastDue = 0
  $statusSuspended = 0
  $statusCanceled = 0
  $statusUnknown = 0
  $statusNoSubscription = 0

  foreach ($item in $billingItems) {
    $assinatura = Get-NestedValue -Source $item -Path @('assinatura') -Default $null
    if ($null -eq $assinatura) {
      $statusNoSubscription++
      continue
    }

    $status = [string](Get-NestedValue -Source $assinatura -Path @('status_canonico') -Default '')
    switch ($status) {
      'trial' { $statusTrial++ }
      'active' { $statusActive++ }
      'past_due' { $statusPastDue++ }
      'suspended' { $statusSuspended++ }
      'canceled' { $statusCanceled++ }
      default { $statusUnknown++ }
    }
  }

  $suspendSuccess = 0
  $suspendError = 0
  $reactivateSuccess = 0
  $reactivateError = 0
  $billingAuditErrors = 0

  foreach ($audit in $auditItems) {
    $route = [string](Get-NestedValue -Source $audit -Path @('route') -Default '')
    $outcome = [string](Get-NestedValue -Source $audit -Path @('outcome') -Default '')
    if ($outcome -eq 'error') {
      $billingAuditErrors++
    }

    if ($route -like '*/suspend*') {
      if ($outcome -eq 'success') { $suspendSuccess++ } else { $suspendError++ }
      continue
    }

    if ($route -like '*/reactivate*') {
      if ($outcome -eq 'success') { $reactivateSuccess++ } else { $reactivateError++ }
      continue
    }
  }

  $latencies = @(@($overviewStep.DurationMs, $billingStep.DurationMs, $auditStep.DurationMs) | Where-Object { $_ -gt 0 })
  $avgLatency = 0
  $maxLatency = 0
  if ($latencies.Count -gt 0) {
    $avgLatency = [Math]::Round((($latencies | Measure-Object -Average).Average), 2)
    $maxLatency = [Math]::Round((($latencies | Measure-Object -Maximum).Maximum), 2)
  }

  $cycleRequests = @($healthStep, $healthDetailedStep, $overviewStep, $billingStep, $auditStep)
  $failedRequests = @($cycleRequests | Where-Object { $_.Result -eq 'FAIL' })
  $cycleResult = if ($failedRequests.Count -eq 0) { 'PASS' } else { 'PARTIAL' }

  $appHealthStatus = [string](Get-NestedValue -Source $healthStep.Payload -Path @('status') -Default '')
  $dbConnected = [string](Get-NestedValue -Source $healthDetailedStep.Payload -Path @('database', 'connected') -Default '')
  $dbResponseTime = [string](Get-NestedValue -Source $healthDetailedStep.Payload -Path @('database', 'responseTime') -Default '')

  $cycleRows += [PSCustomObject]@{
    timestamp_utc = $cycleIso
    cycle = $cycle
    cycle_result = $cycleResult
    failed_requests = @($failedRequests).Count
    app_health_status = $appHealthStatus
    db_connected = $dbConnected
    db_response_time_ms = $dbResponseTime
    guardian_overview_latency_ms = $overviewStep.DurationMs
    guardian_billing_latency_ms = $billingStep.DurationMs
    guardian_audit_latency_ms = $auditStep.DurationMs
    guardian_avg_latency_ms = $avgLatency
    guardian_max_latency_ms = $maxLatency
    subscriptions_total = @($billingItems).Count
    status_trial = $statusTrial
    status_active = $statusActive
    status_past_due = $statusPastDue
    status_suspended = $statusSuspended
    status_canceled = $statusCanceled
    status_unknown = $statusUnknown
    status_no_subscription = $statusNoSubscription
    payment_failure_indicators = ($statusPastDue + $statusSuspended)
    daily_transition_total = @($auditItems).Count
    daily_suspend_success = $suspendSuccess
    daily_suspend_error = $suspendError
    daily_reactivate_success = $reactivateSuccess
    daily_reactivate_error = $reactivateError
    daily_billing_audit_errors = $billingAuditErrors
  }

  Write-Host "[GDN-402] Ciclo ${cycle}: result=$cycleResult subscriptions=$(@($billingItems).Count) payment_failure_indicators=$($statusPastDue + $statusSuspended) avg_latency_ms=$avgLatency"

  if ($MaxCycles -gt 0 -and $cycle -ge $MaxCycles) {
    break
  }

  if ((Get-Date).AddSeconds($IntervalSeconds) -gt $deadline) {
    break
  }

  if ($IntervalSeconds -gt 0) {
    Start-Sleep -Seconds $IntervalSeconds
  }
}

$outputDirCsv = Split-Path -Path $OutputCsv -Parent
if (-not (Test-Path $outputDirCsv)) {
  New-Item -Path $outputDirCsv -ItemType Directory -Force | Out-Null
}

$outputDirMd = Split-Path -Path $OutputSummary -Parent
if (-not (Test-Path $outputDirMd)) {
  New-Item -Path $outputDirMd -ItemType Directory -Force | Out-Null
}

$cycleRows | Export-Csv -Path $OutputCsv -NoTypeInformation -Encoding UTF8

$totalCycles = $cycleRows.Count
$passCycles = @($cycleRows | Where-Object { $_.cycle_result -eq 'PASS' }).Count
$partialCycles = @($cycleRows | Where-Object { $_.cycle_result -eq 'PARTIAL' }).Count

$latest = $null
if ($totalCycles -gt 0) {
  $latest = $cycleRows[-1]
}

$firstPaymentFailures = 0
$lastPaymentFailures = 0
if ($totalCycles -gt 0) {
  $firstPaymentFailures = [int]$cycleRows[0].payment_failure_indicators
  $lastPaymentFailures = [int]$latest.payment_failure_indicators
}

$avgGuardianLatency = 0
if ($totalCycles -gt 0) {
  $avgGuardianLatency = [Math]::Round((($cycleRows | Measure-Object -Property guardian_avg_latency_ms -Average).Average), 2)
}

$totalBillingErrors = 0
if ($totalCycles -gt 0) {
  $totalBillingErrors = [int](($cycleRows | Measure-Object -Property daily_billing_audit_errors -Maximum).Maximum)
}

$anomalies = @()
if ($partialCycles -gt 0) {
  $anomalies += "Ciclos parciais detectados: $partialCycles"
}
if ($totalBillingErrors -gt 0) {
  $anomalies += "Auditoria critica billing com erros detectada: max_daily_errors=$totalBillingErrors"
}
if ($lastPaymentFailures -gt 0) {
  $anomalies += "Indicador de falha de pagamento acima de zero no ultimo ciclo: $lastPaymentFailures"
}

$summary = @()
$summary += '# GDN-402 - Monitoramento diario billing e plataforma Guardian'
$summary += ''
$summary += "- RunId: $runId"
$summary += "- Inicio: $($startedAt.ToString('yyyy-MM-dd HH:mm:ss'))"
$summary += "- Fim: $((Get-Date).ToString('yyyy-MM-dd HH:mm:ss'))"
$summary += "- BaseUrl: $normalizedBaseUrl"
$summary += "- DryRun: $(if ($DryRun) { 'true' } else { 'false' })"
$summary += "- IntervalSeconds: $IntervalSeconds"
$summary += "- DurationHours: $DurationHours"
$summary += "- MaxCycles: $MaxCycles"
$summary += "- Ciclos: $totalCycles (PASS=$passCycles, PARTIAL=$partialCycles)"
$summary += "- CSV: $OutputCsv"
$summary += ''
$summary += '## Indicadores principais'
$summary += ''
$summary += "- Payment failure indicators (past_due + suspended): inicio=$firstPaymentFailures fim=$lastPaymentFailures"
$summary += "- Latencia media Guardian (overview+billing+audit): ${avgGuardianLatency}ms"
$summary += "- Billing audit errors (max no periodo): $totalBillingErrors"

if ($null -ne $latest) {
  $summary += "- Subscriptions total (ultimo ciclo): $($latest.subscriptions_total)"
  $summary += "- Status ativos (ultimo ciclo): $($latest.status_active)"
  $summary += "- Status past_due (ultimo ciclo): $($latest.status_past_due)"
  $summary += "- Status suspended (ultimo ciclo): $($latest.status_suspended)"
  $summary += "- Transitions day total (ultimo ciclo): $($latest.daily_transition_total)"
}

$summary += ''
$summary += '## Anomalias'
$summary += ''
if ($anomalies.Count -eq 0) {
  $summary += '- Nenhuma anomalia detectada pelos criterios automatizados.'
} else {
  foreach ($line in $anomalies) {
    $summary += "- $line"
  }
}

$summary += ''
$summary += '## Falhas de requisicao'
$summary += ''
$failedRequestsAll = @($requestLog | Where-Object { $_.Result -eq 'FAIL' })
if ($failedRequestsAll.Count -eq 0) {
  $summary += '- Nenhuma falha de requisicao registrada.'
} else {
  foreach ($req in $failedRequestsAll) {
    $summary += "- $($req.Name) [$($req.Method)] status=$($req.StatusCode) erro=$($req.Error)"
  }
}

Set-Content -Path $OutputSummary -Value $summary -Encoding UTF8

Write-Host ''
Write-Host "[GDN-402] CSV salvo em: $OutputCsv"
Write-Host "[GDN-402] Resumo salvo em: $OutputSummary"

if ($FailOnAnomaly -and $anomalies.Count -gt 0 -and -not $DryRun) {
  Write-Error "Monitoramento detectou anomalias: $($anomalies -join '; ')"
  exit 1
}

exit 0

