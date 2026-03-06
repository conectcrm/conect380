param(
  [Parameter(Mandatory = $false)]
  [string]$BaseUrl = 'http://localhost:3001',

  [Parameter(Mandatory = $false)]
  [int]$IntervalSeconds = 300,

  [Parameter(Mandatory = $false)]
  [int]$DurationHours = 48,

  [Parameter(Mandatory = $false)]
  [int]$MaxCycles = 0,

  [Parameter(Mandatory = $false)]
  [string]$Token = '',

  [Parameter(Mandatory = $false)]
  [string]$Email = '',

  [Parameter(Mandatory = $false)]
  [string]$Senha = '',

  [Parameter(Mandatory = $false)]
  [switch]$RunLifecycleActions = $false,

  [Parameter(Mandatory = $false)]
  [string]$OportunidadeId = '',

  [Parameter(Mandatory = $false)]
  [string]$ClosedOportunidadeId = '',

  [Parameter(Mandatory = $false)]
  [string]$OutputDir = 'docs/features/evidencias',

  [Parameter(Mandatory = $false)]
  [switch]$DryRun = $false
)

$ErrorActionPreference = 'Stop'
$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$normalizedBaseUrl = $BaseUrl.TrimEnd('/')

if (-not [System.IO.Path]::IsPathRooted($OutputDir)) {
  $OutputDir = Join-Path $repoRoot $OutputDir
}

if (-not (Test-Path $OutputDir)) {
  New-Item -Path $OutputDir -ItemType Directory -Force | Out-Null
}

if ($DryRun -and $MaxCycles -le 0) {
  $MaxCycles = 1
}

function New-StepResult {
  param(
    [string]$Id,
    [string]$Nome,
    [string]$Method,
    [string]$Url,
    [string]$Resultado = 'SKIPPED',
    [int]$StatusCode = 0,
    [double]$DuracaoSegundos = 0,
    [string]$Erro = ''
  )

  return [PSCustomObject]@{
    Id = $Id
    Nome = $Nome
    Method = $Method
    Url = $Url
    Resultado = $Resultado
    StatusCode = $StatusCode
    DuracaoSegundos = $DuracaoSegundos
    Erro = $Erro
  }
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
      Step = (New-StepResult -Id 'AUTH-000' -Nome 'Authenticate' -Method 'POST' -Url "$ApiBaseUrl/auth/login")
    }
  }

  if (-not [string]::IsNullOrWhiteSpace($CurrentToken)) {
    return [PSCustomObject]@{
      AccessToken = $CurrentToken
      Step = (New-StepResult -Id 'AUTH-000' -Nome 'Authenticate (manual token)' -Method 'TOKEN' -Url '(manual)' -Resultado 'PASS' -StatusCode 200)
    }
  }

  if ([string]::IsNullOrWhiteSpace($LoginEmail) -or [string]::IsNullOrWhiteSpace($LoginSenha)) {
    return [PSCustomObject]@{
      AccessToken = ''
      Step = (New-StepResult -Id 'AUTH-000' -Nome 'Authenticate' -Method 'POST' -Url "$ApiBaseUrl/auth/login" -Resultado 'FAIL' -Erro 'Token nao informado. Use -Token ou informe -Email e -Senha para login automatico.')
    }
  }

  $loginBody = @{
    email = $LoginEmail
    senha = $LoginSenha
  } | ConvertTo-Json -Depth 5

  $sw = [System.Diagnostics.Stopwatch]::StartNew()
  $statusCode = 0
  $result = 'PASS'
  $errorMessage = ''
  $resolvedToken = ''
  try {
    $response = Invoke-WebRequest -Uri "$ApiBaseUrl/auth/login" -Method Post -Body $loginBody -ContentType 'application/json' -UseBasicParsing -ErrorAction Stop
    $statusCode = [int]$response.StatusCode
    $responseJson = $response.Content | ConvertFrom-Json -ErrorAction Stop
    $resolvedToken = $responseJson.data.access_token
    if ([string]::IsNullOrWhiteSpace($resolvedToken)) {
      $result = 'FAIL'
      $errorMessage = 'Login nao retornou access_token. Se houver MFA, use -Token manualmente.'
    }
  } catch {
    $result = 'FAIL'
    $errorMessage = $_.Exception.Message
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

  return [PSCustomObject]@{
    AccessToken = $resolvedToken
    Step = (New-StepResult -Id 'AUTH-000' -Nome 'Authenticate' -Method 'POST' -Url "$ApiBaseUrl/auth/login" -Resultado $result -StatusCode $statusCode -DuracaoSegundos ([Math]::Round($sw.Elapsed.TotalSeconds, 2)) -Erro $errorMessage)
  }
}

function Invoke-Probe {
  param(
    [string]$Id,
    [string]$Nome,
    [string]$Method,
    [string]$Url,
    [hashtable]$Headers = @{},
    [object]$Body = $null,
    [switch]$SkipNetwork
  )

  if ($SkipNetwork) {
    return New-StepResult -Id $Id -Nome $Nome -Method $Method -Url $Url
  }

  $sw = [System.Diagnostics.Stopwatch]::StartNew()
  $statusCode = 0
  $result = 'PASS'
  $errorMessage = ''

  try {
    $params = @{
      Uri = $Url
      Method = $Method
      UseBasicParsing = $true
      ErrorAction = 'Stop'
    }

    if ($null -ne $Headers -and $Headers.Count -gt 0) {
      $params['Headers'] = $Headers
    }

    if ($null -ne $Body) {
      $params['Body'] = ($Body | ConvertTo-Json -Depth 10)
      $params['ContentType'] = 'application/json'
    }

    $response = Invoke-WebRequest @params
    $statusCode = [int]$response.StatusCode
    if ($statusCode -lt 200 -or $statusCode -ge 300) {
      $result = 'FAIL'
    }
  } catch {
    $result = 'FAIL'
    $errorMessage = $_.Exception.Message
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

  return New-StepResult -Id $Id -Nome $Nome -Method $Method -Url $Url -Resultado $result -StatusCode $statusCode -DuracaoSegundos ([Math]::Round($sw.Elapsed.TotalSeconds, 2)) -Erro $errorMessage
}

$runId = Get-Date -Format 'yyyyMMdd-HHmmss'
$startedAt = Get-Date
$finishBy = $startedAt.AddHours($DurationHours)
$csvFile = Join-Path $OutputDir "OPP304_PILOTO_MONITOR_48H_$runId.csv"
$summaryFile = Join-Path $OutputDir "OPP304_PILOTO_MONITOR_48H_$runId.md"
$rows = @()
$allSteps = @()

$http400 = 0
$http401 = 0
$http403 = 0
$failedRequests = 0

Write-Host ''
Write-Host '===============================================' -ForegroundColor Cyan
Write-Host ' OPP-304 - Monitoramento piloto lifecycle' -ForegroundColor Cyan
Write-Host '===============================================' -ForegroundColor Cyan
Write-Host "RunId: $runId"
Write-Host "BaseUrl: $normalizedBaseUrl"
Write-Host "IntervalSeconds: $IntervalSeconds"
Write-Host "DurationHours: $DurationHours"
Write-Host "MaxCycles: $MaxCycles"
Write-Host "DryRun: $($DryRun.IsPresent)"
Write-Host ''

$authContext = Resolve-AuthContext -CurrentToken $Token -ApiBaseUrl $normalizedBaseUrl -LoginEmail $Email -LoginSenha $Senha -SkipNetwork:$DryRun
$allSteps += $authContext.Step

$headers = @{}
if (-not [string]::IsNullOrWhiteSpace($authContext.AccessToken)) {
  $headers['Authorization'] = "Bearer $($authContext.AccessToken)"
}

$shouldReauthenticateEveryCycle =
  (-not $DryRun) -and
  [string]::IsNullOrWhiteSpace($Token) -and
  (-not [string]::IsNullOrWhiteSpace($Email)) -and
  (-not [string]::IsNullOrWhiteSpace($Senha))

$cycle = 0
while ($true) {
  $now = Get-Date
  if ($now -ge $finishBy) {
    break
  }
  if ($MaxCycles -gt 0 -and $cycle -ge $MaxCycles) {
    break
  }

  $cycle++
  $cycleStartedAt = Get-Date
  $cycleSteps = @()

  if ($shouldReauthenticateEveryCycle) {
    $cycleAuth = Resolve-AuthContext -CurrentToken '' -ApiBaseUrl $normalizedBaseUrl -LoginEmail $Email -LoginSenha $Senha -SkipNetwork:$false
    $cycleAuthStep = New-StepResult -Id "AUTH-CYCLE-$cycle" -Nome "Authenticate cycle $cycle" -Method $cycleAuth.Step.Method -Url $cycleAuth.Step.Url -Resultado $cycleAuth.Step.Resultado -StatusCode $cycleAuth.Step.StatusCode -DuracaoSegundos $cycleAuth.Step.DuracaoSegundos -Erro $cycleAuth.Step.Erro
    $allSteps += $cycleAuthStep
    if ($cycleAuth.Step.Resultado -eq 'PASS' -and -not [string]::IsNullOrWhiteSpace($cycleAuth.AccessToken)) {
      $headers['Authorization'] = "Bearer $($cycleAuth.AccessToken)"
    }
  }

  $cycleSteps += Invoke-Probe -Id 'CYCLE-001' -Nome 'Health check' -Method 'GET' -Url "$normalizedBaseUrl/health" -Headers @{} -SkipNetwork:$DryRun
  $cycleSteps += Invoke-Probe -Id 'CYCLE-002' -Nome 'Get lifecycle feature flag' -Method 'GET' -Url "$normalizedBaseUrl/oportunidades/lifecycle/feature-flag" -Headers $headers -SkipNetwork:$DryRun
  $cycleSteps += Invoke-Probe -Id 'CYCLE-003' -Nome 'List open opportunities' -Method 'GET' -Url "$normalizedBaseUrl/oportunidades?lifecycle_view=open" -Headers $headers -SkipNetwork:$DryRun
  $cycleSteps += Invoke-Probe -Id 'CYCLE-004' -Nome 'Get pipeline data open view' -Method 'GET' -Url "$normalizedBaseUrl/oportunidades/pipeline?lifecycle_view=open" -Headers $headers -SkipNetwork:$DryRun

  if ($RunLifecycleActions -and -not [string]::IsNullOrWhiteSpace($OportunidadeId)) {
    $transitionPayload = @{
      comentario = 'Monitoramento OPP-304'
      motivo = 'Monitoramento OPP-304'
    }
    $cycleSteps += Invoke-Probe -Id 'CYCLE-010' -Nome 'Arquivar oportunidade' -Method 'POST' -Url "$normalizedBaseUrl/oportunidades/$OportunidadeId/arquivar" -Headers $headers -Body $transitionPayload -SkipNetwork:$DryRun
    $cycleSteps += Invoke-Probe -Id 'CYCLE-011' -Nome 'Restaurar oportunidade' -Method 'POST' -Url "$normalizedBaseUrl/oportunidades/$OportunidadeId/restaurar" -Headers $headers -Body $transitionPayload -SkipNetwork:$DryRun
    $cycleSteps += Invoke-Probe -Id 'CYCLE-012' -Nome 'Excluir para lixeira (soft delete)' -Method 'DELETE' -Url "$normalizedBaseUrl/oportunidades/$OportunidadeId" -Headers $headers -SkipNetwork:$DryRun
    $cycleSteps += Invoke-Probe -Id 'CYCLE-013' -Nome 'Restaurar apos lixeira' -Method 'POST' -Url "$normalizedBaseUrl/oportunidades/$OportunidadeId/restaurar" -Headers $headers -Body $transitionPayload -SkipNetwork:$DryRun
  }

  if ($RunLifecycleActions -and -not [string]::IsNullOrWhiteSpace($ClosedOportunidadeId)) {
    $reopenPayload = @{
      comentario = 'Monitoramento OPP-304'
      motivo = 'Monitoramento OPP-304'
    }
    $cycleSteps += Invoke-Probe -Id 'CYCLE-014' -Nome 'Reabrir oportunidade fechada' -Method 'POST' -Url "$normalizedBaseUrl/oportunidades/$ClosedOportunidadeId/reabrir" -Headers $headers -Body $reopenPayload -SkipNetwork:$DryRun
  }

  $allSteps += $cycleSteps

  $cyclePass = @($cycleSteps | Where-Object { $_.Resultado -eq 'PASS' }).Count
  $cycleFail = @($cycleSteps | Where-Object { $_.Resultado -eq 'FAIL' }).Count
  $cycleSkipped = @($cycleSteps | Where-Object { $_.Resultado -eq 'SKIPPED' }).Count

  $cycleStatuses = @($cycleSteps | ForEach-Object { "$($_.Id)=$($_.StatusCode)" }) -join '; '
  $cycleResult = if ($cycleFail -eq 0 -and $cyclePass -gt 0) {
    'PASS'
  } elseif ($cycleFail -gt 0 -and $cyclePass -gt 0) {
    'PARTIAL'
  } elseif ($cycleSkipped -eq $cycleSteps.Count) {
    'SKIPPED'
  } else {
    'FAIL'
  }

  $http400 += @($cycleSteps | Where-Object { $_.StatusCode -eq 400 }).Count
  $http401 += @($cycleSteps | Where-Object { $_.StatusCode -eq 401 }).Count
  $http403 += @($cycleSteps | Where-Object { $_.StatusCode -eq 403 }).Count
  $failedRequests += $cycleFail

  $rows += [PSCustomObject]@{
    ciclo = $cycle
    started_at = $cycleStartedAt.ToString('yyyy-MM-dd HH:mm:ss')
    resultado = $cycleResult
    pass = $cyclePass
    fail = $cycleFail
    skipped = $cycleSkipped
    status_codes = $cycleStatuses
  }

  Write-Host ("Ciclo {0}: {1} (PASS={2} FAIL={3} SKIPPED={4})" -f $cycle, $cycleResult, $cyclePass, $cycleFail, $cycleSkipped)

  if ($DryRun) {
    break
  }

  $shouldStopByMaxCycles = $MaxCycles -gt 0 -and $cycle -ge $MaxCycles
  if ($shouldStopByMaxCycles) {
    break
  }

  $sleepUntil = (Get-Date).AddSeconds($IntervalSeconds)
  if ($sleepUntil -gt $finishBy) {
    break
  }

  Start-Sleep -Seconds $IntervalSeconds
}

$finishedAt = Get-Date

if ($rows.Count -gt 0) {
  $rows | Export-Csv -Path $csvFile -NoTypeInformation -Encoding UTF8
} else {
  @([PSCustomObject]@{
      ciclo = 0
      started_at = $startedAt.ToString('yyyy-MM-dd HH:mm:ss')
      resultado = 'NO_CYCLES'
      pass = 0
      fail = 0
      skipped = 0
      status_codes = ''
    }) | Export-Csv -Path $csvFile -NoTypeInformation -Encoding UTF8
}

$totalCycles = $rows.Count
$passCycles = @($rows | Where-Object { $_.resultado -eq 'PASS' }).Count
$partialCycles = @($rows | Where-Object { $_.resultado -eq 'PARTIAL' }).Count
$failCycles = @($rows | Where-Object { $_.resultado -eq 'FAIL' }).Count
$skippedCycles = @($rows | Where-Object { $_.resultado -eq 'SKIPPED' }).Count

$md = @()
$md += '# OPP-304 - Monitoramento piloto lifecycle (48h)'
$md += ''
$md += "- RunId: $runId"
$md += "- Inicio: $($startedAt.ToString('yyyy-MM-dd HH:mm:ss'))"
$md += "- Fim: $($finishedAt.ToString('yyyy-MM-dd HH:mm:ss'))"
$md += "- BaseUrl: $normalizedBaseUrl"
$md += "- IntervalSeconds: $IntervalSeconds"
$md += "- DurationHours: $DurationHours"
$md += "- MaxCycles: $MaxCycles"
$md += "- DryRun: $(if ($DryRun) { 'true' } else { 'false' })"
$md += "- RunLifecycleActions: $(if ($RunLifecycleActions) { 'true' } else { 'false' })"
$md += "- Auth step result: $($authContext.Step.Resultado) (status: $($authContext.Step.StatusCode))"
$md += "- Total cycles: $totalCycles"
$md += "- PASS cycles: $passCycles"
$md += "- PARTIAL cycles: $partialCycles"
$md += "- FAIL cycles: $failCycles"
$md += "- SKIPPED cycles: $skippedCycles"
$md += "- Failed requests: $failedRequests"
$md += "- HTTP 400 count: $http400"
$md += "- HTTP 401 count: $http401"
$md += "- HTTP 403 count: $http403"
$md += "- CSV: $csvFile"
$md += ''
$md += '## Ciclos'
$md += ''
$md += '| Ciclo | Inicio | Resultado | PASS | FAIL | SKIPPED | Status Codes |'
$md += '| ---: | --- | --- | ---: | ---: | ---: | --- |'
foreach ($row in $rows) {
  $md += "| $($row.ciclo) | $($row.started_at) | $($row.resultado) | $($row.pass) | $($row.fail) | $($row.skipped) | $($row.status_codes) |"
}

$md += ''
$md += '## Resultado'
$md += ''
if ($DryRun) {
  $md += 'Monitoramento executado em dry-run. Nenhuma chamada HTTP real foi realizada.'
} elseif ($failedRequests -eq 0) {
  $md += 'Monitoramento concluido sem falhas nas probes configuradas.'
} else {
  $md += 'Monitoramento concluiu com falhas. Revisar autenticacao, permissoes e status HTTP registrados.'
}

$md += ''
$md += '## Observacoes'
$md += ''
if ($authContext.Step.Resultado -eq 'FAIL') {
  $md += "- Autenticacao falhou: $($authContext.Step.Erro)"
} elseif ($authContext.Step.Resultado -eq 'SKIPPED') {
  $md += '- Autenticacao nao executada por estar em modo dry-run.'
} else {
  $md += '- Autenticacao concluida para probes protegidas.'
}

Set-Content -Path $summaryFile -Value $md -Encoding UTF8

Write-Host ''
Write-Host "Resumo: cycles=$totalCycles pass=$passCycles partial=$partialCycles fail=$failCycles skipped=$skippedCycles"
Write-Host "HTTP: 400=$http400 401=$http401 403=$http403"
Write-Host "CSV: $csvFile"
Write-Host "Markdown: $summaryFile"

if (-not $DryRun -and ($failedRequests -gt 0 -or $authContext.Step.Resultado -eq 'FAIL')) {
  exit 1
}

exit 0
