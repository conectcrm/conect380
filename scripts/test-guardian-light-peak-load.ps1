param(
  [string]$BaseUrl = 'http://localhost:3001',
  [string]$Token = '',
  [string]$Email = '',
  [string]$Senha = '',
  [int]$Iterations = 40,
  [int]$IntervalMs = 250,
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
  $OutputCsv = Join-Path $repoRoot "docs/features/evidencias/GDN406_LIGHT_PEAK_LOAD_$runId.csv"
} elseif (-not [System.IO.Path]::IsPathRooted($OutputCsv)) {
  $OutputCsv = Join-Path $repoRoot $OutputCsv
}

if ([string]::IsNullOrWhiteSpace($OutputSummary)) {
  $OutputSummary = Join-Path $repoRoot "docs/features/evidencias/GDN406_LIGHT_PEAK_LOAD_$runId.md"
} elseif (-not [System.IO.Path]::IsPathRooted($OutputSummary)) {
  $OutputSummary = Join-Path $repoRoot $OutputSummary
}

function New-RequestResult {
  param(
    [string]$Endpoint,
    [string]$Method,
    [string]$Url,
    [string]$Result = 'SKIPPED',
    [int]$StatusCode = 0,
    [double]$DurationMs = 0,
    [string]$Error = ''
  )

  return [PSCustomObject]@{
    endpoint = $Endpoint
    method = $Method
    url = $Url
    result = $Result
    status_code = $StatusCode
    duration_ms = $DurationMs
    error = $Error
  }
}

function Invoke-TimedRequest {
  param(
    [string]$Endpoint,
    [string]$Method,
    [string]$Url,
    [hashtable]$Headers = @{},
    [switch]$SkipNetwork
  )

  if ($SkipNetwork) {
    return New-RequestResult -Endpoint $Endpoint -Method $Method -Url $Url
  }

  $sw = [System.Diagnostics.Stopwatch]::StartNew()
  $statusCode = 0
  $result = 'PASS'
  $error = ''

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

    $resp = Invoke-WebRequest @params
    $statusCode = [int]$resp.StatusCode
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

  return New-RequestResult -Endpoint $Endpoint -Method $Method -Url $Url -Result $result -StatusCode $statusCode -DurationMs ([Math]::Round($sw.Elapsed.TotalMilliseconds, 2)) -Error $error
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
      Step = (New-RequestResult -Endpoint 'auth' -Method 'POST' -Url "$ApiBaseUrl/auth/login")
    }
  }

  if (-not [string]::IsNullOrWhiteSpace($CurrentToken)) {
    return [PSCustomObject]@{
      AccessToken = $CurrentToken
      Step = (New-RequestResult -Endpoint 'auth-manual-token' -Method 'TOKEN' -Url '(manual)' -Result 'PASS' -StatusCode 200)
    }
  }

  if ([string]::IsNullOrWhiteSpace($LoginEmail) -or [string]::IsNullOrWhiteSpace($LoginSenha)) {
    return [PSCustomObject]@{
      AccessToken = ''
      Step = (New-RequestResult -Endpoint 'auth' -Method 'POST' -Url "$ApiBaseUrl/auth/login" -Result 'FAIL' -Error 'Informe -Token ou -Email/-Senha.')
    }
  }

  $body = @{ email = $LoginEmail; senha = $LoginSenha } | ConvertTo-Json -Depth 5
  $sw = [System.Diagnostics.Stopwatch]::StartNew()
  $statusCode = 0
  $result = 'PASS'
  $error = ''
  $accessToken = ''

  try {
    $resp = Invoke-WebRequest -Uri "$ApiBaseUrl/auth/login" -Method Post -Body $body -ContentType 'application/json' -UseBasicParsing -ErrorAction Stop
    $statusCode = [int]$resp.StatusCode
    $json = $resp.Content | ConvertFrom-Json -ErrorAction Stop
    $accessToken = [string]$json.data.access_token
    if ([string]::IsNullOrWhiteSpace($accessToken)) {
      $result = 'FAIL'
      $error = 'Login sem access_token; usar -Token quando houver MFA.'
    }
  } catch {
    $result = 'FAIL'
    $error = $_.Exception.Message
    if ($_.Exception.Response -and $_.Exception.Response.StatusCode) {
      try { $statusCode = [int]$_.Exception.Response.StatusCode.value__ } catch { $statusCode = 0 }
    }
  } finally {
    $sw.Stop()
  }

  return [PSCustomObject]@{
    AccessToken = $accessToken
    Step = (New-RequestResult -Endpoint 'auth' -Method 'POST' -Url "$ApiBaseUrl/auth/login" -Result $result -StatusCode $statusCode -DurationMs ([Math]::Round($sw.Elapsed.TotalMilliseconds, 2)) -Error $error)
  }
}

function Get-PercentileValue {
  param(
    [double[]]$Values,
    [double]$Percentile
  )

  if ($Values.Count -eq 0) {
    return 0
  }

  $sorted = @($Values | Sort-Object)
  $index = [Math]::Ceiling(($Percentile / 100) * $sorted.Count) - 1
  if ($index -lt 0) { $index = 0 }
  if ($index -ge $sorted.Count) { $index = $sorted.Count - 1 }
  return [Math]::Round([double]$sorted[$index], 2)
}

$startedAt = Get-Date

$requests = @()
$auth = Resolve-AuthContext -CurrentToken $Token -ApiBaseUrl $normalizedBaseUrl -LoginEmail $Email -LoginSenha $Senha -SkipNetwork:$DryRun
$requests += [PSCustomObject]@{
  timestamp_utc = (Get-Date).ToString('o')
  iteration = 0
  endpoint = $auth.Step.endpoint
  method = $auth.Step.method
  status_code = $auth.Step.status_code
  result = $auth.Step.result
  duration_ms = $auth.Step.duration_ms
  error = $auth.Step.error
}

$headers = @{}
if (-not [string]::IsNullOrWhiteSpace($auth.AccessToken)) {
  $headers['Authorization'] = "Bearer $($auth.AccessToken)"
}

$endpointDefs = @(
  @{ name = 'health'; method = 'GET'; path = '/health'; thresholdP95 = 800 },
  @{ name = 'guardian-overview'; method = 'GET'; path = '/guardian/bff/overview'; thresholdP95 = 1500 },
  @{ name = 'guardian-billing-subscriptions'; method = 'GET'; path = '/guardian/bff/billing/subscriptions'; thresholdP95 = 1800 },
  @{ name = 'guardian-audit-critical'; method = 'GET'; path = '/guardian/bff/audit/critical?page=1&limit=20'; thresholdP95 = 2000 }
)

Write-Host ''
Write-Host '===============================================' -ForegroundColor Cyan
Write-Host ' GDN-406 - Light peak load validation' -ForegroundColor Cyan
Write-Host '===============================================' -ForegroundColor Cyan
Write-Host "RunId: $runId"
Write-Host "BaseUrl: $normalizedBaseUrl"
Write-Host "DryRun: $($DryRun.IsPresent)"
Write-Host "Iterations: $Iterations"
Write-Host "IntervalMs: $IntervalMs"
Write-Host ''

for ($i = 1; $i -le $Iterations; $i++) {
  foreach ($def in $endpointDefs) {
    $url = "$normalizedBaseUrl$($def.path)"
    $result = Invoke-TimedRequest -Endpoint $def.name -Method $def.method -Url $url -Headers $headers -SkipNetwork:$DryRun

    $requests += [PSCustomObject]@{
      timestamp_utc = (Get-Date).ToString('o')
      iteration = $i
      endpoint = $result.endpoint
      method = $result.method
      status_code = $result.status_code
      result = $result.result
      duration_ms = $result.duration_ms
      error = $result.error
    }
  }

  if ($IntervalMs -gt 0 -and $i -lt $Iterations) {
    Start-Sleep -Milliseconds $IntervalMs
  }
}

$outputCsvDir = Split-Path -Path $OutputCsv -Parent
if (-not (Test-Path $outputCsvDir)) {
  New-Item -Path $outputCsvDir -ItemType Directory -Force | Out-Null
}

$outputSummaryDir = Split-Path -Path $OutputSummary -Parent
if (-not (Test-Path $outputSummaryDir)) {
  New-Item -Path $outputSummaryDir -ItemType Directory -Force | Out-Null
}

$requests | Export-Csv -Path $OutputCsv -NoTypeInformation -Encoding UTF8

$workloadRows = @($requests | Where-Object { $_.iteration -gt 0 })
$summaryRows = @()
$anomalies = @()

foreach ($def in $endpointDefs) {
  $rows = @($workloadRows | Where-Object { $_.endpoint -eq $def.name })
  $total = $rows.Count
  $fails = @($rows | Where-Object { $_.result -eq 'FAIL' }).Count
  $passes = @($rows | Where-Object { $_.result -eq 'PASS' }).Count
  $durations = @(@($rows | Where-Object { $_.duration_ms -gt 0 } | ForEach-Object { [double]$_.duration_ms }))

  $avg = 0
  $max = 0
  $p95 = 0
  if ($durations.Count -gt 0) {
    $avg = [Math]::Round((($durations | Measure-Object -Average).Average), 2)
    $max = [Math]::Round((($durations | Measure-Object -Maximum).Maximum), 2)
    $p95 = Get-PercentileValue -Values $durations -Percentile 95
  }

  $errorRate = 0
  if ($total -gt 0) {
    $errorRate = [Math]::Round(($fails / $total) * 100, 2)
  }

  if ($fails -gt 0) {
    $anomalies += "$($def.name): erro em $fails de $total requests"
  }
  if ($p95 -gt $def.thresholdP95) {
    $anomalies += "$($def.name): p95=${p95}ms acima do limite ${($def.thresholdP95)}ms"
  }

  $summaryRows += [PSCustomObject]@{
    endpoint = $def.name
    total_requests = $total
    pass_requests = $passes
    fail_requests = $fails
    error_rate_pct = $errorRate
    avg_latency_ms = $avg
    p95_latency_ms = $p95
    max_latency_ms = $max
    threshold_p95_ms = $def.thresholdP95
  }
}

$finishedAt = Get-Date

$summary = @()
$summary += '# GDN-406 - Light peak load validation'
$summary += ''
$summary += "- RunId: $runId"
$summary += "- Inicio: $($startedAt.ToString('yyyy-MM-dd HH:mm:ss'))"
$summary += "- Fim: $($finishedAt.ToString('yyyy-MM-dd HH:mm:ss'))"
$summary += "- BaseUrl: $normalizedBaseUrl"
$summary += "- DryRun: $(if ($DryRun) { 'true' } else { 'false' })"
$summary += "- Iterations: $Iterations"
$summary += "- IntervalMs: $IntervalMs"
$summary += "- CSV: $OutputCsv"
$summary += ''
$summary += '## Resultado por endpoint'
$summary += ''
$summary += '| Endpoint | Total | PASS | FAIL | Error % | Avg ms | P95 ms | Max ms | Limite P95 ms |'
$summary += '| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |'
foreach ($row in $summaryRows) {
  $summary += "| $($row.endpoint) | $($row.total_requests) | $($row.pass_requests) | $($row.fail_requests) | $($row.error_rate_pct) | $($row.avg_latency_ms) | $($row.p95_latency_ms) | $($row.max_latency_ms) | $($row.threshold_p95_ms) |"
}

$summary += ''
$summary += '## Anomalias'
$summary += ''
if ($anomalies.Count -eq 0) {
  $summary += '- Nenhuma anomalia detectada pelos limites configurados.'
} else {
  foreach ($line in $anomalies) {
    $summary += "- $line"
  }
}

Set-Content -Path $OutputSummary -Value $summary -Encoding UTF8

Write-Host "[GDN-406] CSV salvo em: $OutputCsv"
Write-Host "[GDN-406] Resumo salvo em: $OutputSummary"

if ($FailOnAnomaly -and $anomalies.Count -gt 0 -and -not $DryRun) {
  Write-Error "Anomalias detectadas: $($anomalies -join '; ')"
  exit 1
}

exit 0
