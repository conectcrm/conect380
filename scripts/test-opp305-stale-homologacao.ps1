param(
  [Parameter(Mandatory = $false)]
  [string]$BaseUrl = 'http://localhost:3001',

  [Parameter(Mandatory = $false)]
  [string]$Token = '',

  [Parameter(Mandatory = $false)]
  [string]$Email = '',

  [Parameter(Mandatory = $false)]
  [string]$Senha = '',

  [Parameter(Mandatory = $false)]
  [int]$StaleLimit = 50,

  [Parameter(Mandatory = $false)]
  [switch]$ApplyPolicyPatch = $false,

  [Parameter(Mandatory = $false)]
  [bool]$PolicyEnabled = $true,

  [Parameter(Mandatory = $false)]
  [int]$ThresholdDays = 30,

  [Parameter(Mandatory = $false)]
  [bool]$AutoArchiveEnabled = $false,

  [Parameter(Mandatory = $false)]
  [int]$AutoArchiveAfterDays = 60,

  [Parameter(Mandatory = $false)]
  [bool]$RestoreAfterPatch = $true,

  [Parameter(Mandatory = $false)]
  [switch]$DryRun = $false,

  [Parameter(Mandatory = $false)]
  [string]$OutputFile = ''
)

$ErrorActionPreference = 'Stop'
$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$normalizedBaseUrl = $BaseUrl.TrimEnd('/')

if ([string]::IsNullOrWhiteSpace($OutputFile)) {
  $timestamp = Get-Date -Format 'yyyyMMdd-HHmmss'
  $OutputFile = Join-Path $repoRoot "docs/features/evidencias/OPP305_HOMOLOG_API_SMOKE_$timestamp.md"
} elseif (-not [System.IO.Path]::IsPathRooted($OutputFile)) {
  $OutputFile = Join-Path $repoRoot $OutputFile
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
      Step = [PSCustomObject]@{
        Id = 'SMOKE-000'
        Nome = 'Authenticate'
        Method = 'POST'
        Url = "$ApiBaseUrl/auth/login"
        Resultado = 'SKIPPED'
        StatusCode = 0
        DuracaoSegundos = 0
        Erro = ''
        ResponseData = $null
      }
    }
  }

  if (-not [string]::IsNullOrWhiteSpace($CurrentToken)) {
    return [PSCustomObject]@{
      AccessToken = $CurrentToken
      Step = [PSCustomObject]@{
        Id = 'SMOKE-000'
        Nome = 'Authenticate (manual token)'
        Method = 'TOKEN'
        Url = '(manual)'
        Resultado = 'PASS'
        StatusCode = 200
        DuracaoSegundos = 0
        Erro = ''
        ResponseData = $null
      }
    }
  }

  if ([string]::IsNullOrWhiteSpace($LoginEmail) -or [string]::IsNullOrWhiteSpace($LoginSenha)) {
    return [PSCustomObject]@{
      AccessToken = ''
      Step = [PSCustomObject]@{
        Id = 'SMOKE-000'
        Nome = 'Authenticate'
        Method = 'POST'
        Url = "$ApiBaseUrl/auth/login"
        Resultado = 'FAIL'
        StatusCode = 0
        DuracaoSegundos = 0
        Erro = 'Token nao informado. Use -Token ou informe -Email e -Senha para login automatico.'
        ResponseData = $null
      }
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
    Step = [PSCustomObject]@{
      Id = 'SMOKE-000'
      Nome = 'Authenticate'
      Method = 'POST'
      Url = "$ApiBaseUrl/auth/login"
      Resultado = $result
      StatusCode = $statusCode
      DuracaoSegundos = [Math]::Round($sw.Elapsed.TotalSeconds, 2)
      Erro = $errorMessage
      ResponseData = $null
    }
  }
}

function Invoke-ApiStep {
  param(
    [string]$Id,
    [string]$Nome,
    [string]$Method,
    [string]$Url,
    [hashtable]$Headers = @{},
    [object]$Body,
    [switch]$SkipNetwork
  )

  if ($SkipNetwork) {
    return [PSCustomObject]@{
      Id = $Id
      Nome = $Nome
      Method = $Method
      Url = $Url
      Resultado = 'SKIPPED'
      StatusCode = 0
      DuracaoSegundos = 0
      Erro = ''
      ResponseData = $null
    }
  }

  $sw = [System.Diagnostics.Stopwatch]::StartNew()
  $statusCode = 0
  $result = 'PASS'
  $errorMessage = ''
  $responseData = $null

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

    $resp = Invoke-WebRequest @params
    $statusCode = [int]$resp.StatusCode
    if (-not [string]::IsNullOrWhiteSpace($resp.Content)) {
      try {
        $responseData = $resp.Content | ConvertFrom-Json -ErrorAction Stop
      } catch {
        $responseData = $resp.Content
      }
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
    Id = $Id
    Nome = $Nome
    Method = $Method
    Url = $Url
    Resultado = $result
    StatusCode = $statusCode
    DuracaoSegundos = [Math]::Round($sw.Elapsed.TotalSeconds, 2)
    Erro = $errorMessage
    ResponseData = $responseData
  }
}

$runId = Get-Date -Format 'yyyyMMdd-HHmmss'
$startedAt = Get-Date
$steps = @()
$policySnapshot = $null

Write-Host ''
Write-Host '===============================================' -ForegroundColor Cyan
Write-Host ' OPP-305 - Homologacao API smoke (stale)' -ForegroundColor Cyan
Write-Host '===============================================' -ForegroundColor Cyan
Write-Host "RunId: $runId"
Write-Host "BaseUrl: $normalizedBaseUrl"
Write-Host "DryRun: $($DryRun.IsPresent)"
Write-Host ''

$authContext = Resolve-AuthContext -CurrentToken $Token -ApiBaseUrl $normalizedBaseUrl -LoginEmail $Email -LoginSenha $Senha -SkipNetwork:$DryRun
$steps += $authContext.Step
$accessToken = $authContext.AccessToken
$headers = @{}
if (-not [string]::IsNullOrWhiteSpace($accessToken)) {
  $headers['Authorization'] = "Bearer $accessToken"
}

$steps += Invoke-ApiStep -Id 'SMOKE-001' -Nome 'Health check' -Method 'GET' -Url "$normalizedBaseUrl/health" -Headers $headers -Body $null -SkipNetwork:$DryRun
$steps += Invoke-ApiStep -Id 'SMOKE-002' -Nome 'Get stale policy' -Method 'GET' -Url "$normalizedBaseUrl/oportunidades/lifecycle/stale-policy" -Headers $headers -Body $null -SkipNetwork:$DryRun
$steps += Invoke-ApiStep -Id 'SMOKE-003' -Nome 'List stale deals' -Method 'GET' -Url "$normalizedBaseUrl/oportunidades/stale?limit=$StaleLimit" -Headers $headers -Body $null -SkipNetwork:$DryRun
$steps += Invoke-ApiStep -Id 'SMOKE-004' -Nome 'Run dry-run auto archive' -Method 'POST' -Url "$normalizedBaseUrl/oportunidades/stale/auto-archive/run?dry_run=true" -Headers $headers -Body $null -SkipNetwork:$DryRun

if ($ApplyPolicyPatch) {
  $policyStep = $steps | Where-Object { $_.Id -eq 'SMOKE-002' } | Select-Object -First 1
  if ($policyStep -and $policyStep.Resultado -eq 'PASS' -and $policyStep.ResponseData) {
    $policySnapshot = @{
      enabled = [bool]$policyStep.ResponseData.enabled
      thresholdDays = [int]$policyStep.ResponseData.thresholdDays
      autoArchiveEnabled = [bool]$policyStep.ResponseData.autoArchiveEnabled
      autoArchiveAfterDays = [int]$policyStep.ResponseData.autoArchiveAfterDays
    }
  }

  $patchPayload = @{
    enabled = [bool]$PolicyEnabled
    thresholdDays = [int]$ThresholdDays
    autoArchiveEnabled = [bool]$AutoArchiveEnabled
    autoArchiveAfterDays = [int]$AutoArchiveAfterDays
  }

  $steps += Invoke-ApiStep -Id 'SMOKE-005' -Nome 'Patch stale policy' -Method 'PATCH' -Url "$normalizedBaseUrl/oportunidades/lifecycle/stale-policy" -Headers $headers -Body $patchPayload -SkipNetwork:$DryRun
  $steps += Invoke-ApiStep -Id 'SMOKE-006' -Nome 'Recheck stale policy' -Method 'GET' -Url "$normalizedBaseUrl/oportunidades/lifecycle/stale-policy" -Headers $headers -Body $null -SkipNetwork:$DryRun

  if ($RestoreAfterPatch -and $null -ne $policySnapshot) {
    $steps += Invoke-ApiStep -Id 'SMOKE-007' -Nome 'Restore stale policy' -Method 'PATCH' -Url "$normalizedBaseUrl/oportunidades/lifecycle/stale-policy" -Headers $headers -Body $policySnapshot -SkipNetwork:$DryRun
    $steps += Invoke-ApiStep -Id 'SMOKE-008' -Nome 'Recheck restored policy' -Method 'GET' -Url "$normalizedBaseUrl/oportunidades/lifecycle/stale-policy" -Headers $headers -Body $null -SkipNetwork:$DryRun
  }
}

$finishedAt = Get-Date
$total = $steps.Count
$pass = @($steps | Where-Object { $_.Resultado -eq 'PASS' }).Count
$fail = @($steps | Where-Object { $_.Resultado -eq 'FAIL' }).Count
$skipped = @($steps | Where-Object { $_.Resultado -eq 'SKIPPED' }).Count

$outputDir = Split-Path -Path $OutputFile -Parent
if (-not [string]::IsNullOrWhiteSpace($outputDir) -and -not (Test-Path $outputDir)) {
  New-Item -Path $outputDir -ItemType Directory -Force | Out-Null
}

$md = @()
$md += '# OPP-305 - Homologacao API smoke'
$md += ''
$md += "- RunId: $runId"
$md += "- Inicio: $($startedAt.ToString('yyyy-MM-dd HH:mm:ss'))"
$md += "- Fim: $($finishedAt.ToString('yyyy-MM-dd HH:mm:ss'))"
$md += "- BaseUrl: $normalizedBaseUrl"
$md += "- DryRun: $(if ($DryRun) { 'true' } else { 'false' })"
$md += "- Total: $total"
$md += "- PASS: $pass"
$md += "- FAIL: $fail"
$md += "- SKIPPED: $skipped"
$md += ''
$md += '| ID | Etapa | Metodo | Status | Resultado | Duracao (s) |'
$md += '| --- | --- | --- | ---: | --- | ---: |'

foreach ($item in $steps) {
  $md += "| $($item.Id) | $($item.Nome) | $($item.Method) | $($item.StatusCode) | $($item.Resultado) | $($item.DuracaoSegundos) |"
}

$md += ''
$md += '## Resultado'
$md += ''
if ($DryRun) {
  $md += 'Execucao em modo dry-run concluida. Nenhuma chamada HTTP real foi realizada.'
} elseif ($fail -eq 0) {
  $md += 'Smoke de API concluido sem falhas.'
} else {
  $md += 'Smoke de API com falhas. Revisar etapas FAIL e permissoes do usuario/token.'
}

$md += ''
$md += '## Observacoes de erro'
$md += ''
$errorRows = @($steps | Where-Object { $_.Resultado -eq 'FAIL' })
if ($errorRows.Count -eq 0) {
  $md += '- Nenhum erro registrado.'
} else {
  foreach ($row in $errorRows) {
    $md += "- $($row.Id): $($row.Erro)"
  }
}

Set-Content -Path $OutputFile -Value $md -Encoding UTF8

Write-Host "Resumo: PASS=$pass FAIL=$fail SKIPPED=$skipped TOTAL=$total"
Write-Host "Relatorio salvo em: $OutputFile"

if (-not $DryRun -and $fail -gt 0) {
  exit 1
}

exit 0
