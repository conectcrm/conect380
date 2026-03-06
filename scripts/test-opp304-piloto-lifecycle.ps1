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
  [switch]$ApplyFlagPatch = $false,

  [Parameter(Mandatory = $false)]
  [bool]$FlagEnabled = $true,

  [Parameter(Mandatory = $false)]
  [int]$RolloutPercentage = 0,

  [Parameter(Mandatory = $false)]
  [bool]$RestoreAfterPatch = $true,

  [Parameter(Mandatory = $false)]
  [switch]$RunLifecycleActions = $false,

  [Parameter(Mandatory = $false)]
  [string]$OportunidadeId = '',

  [Parameter(Mandatory = $false)]
  [string]$ClosedOportunidadeId = '',

  [Parameter(Mandatory = $false)]
  [string]$TransitionComment = 'Smoke OPP-304',

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
  $OutputFile = Join-Path $repoRoot "docs/features/evidencias/OPP304_PILOTO_API_SMOKE_$timestamp.md"
} elseif (-not [System.IO.Path]::IsPathRooted($OutputFile)) {
  $OutputFile = Join-Path $repoRoot $OutputFile
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
    [string]$Erro = '',
    [object]$ResponseData = $null
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
    ResponseData = $ResponseData
  }
}

function Resolve-ResponsePayload {
  param([object]$ResponseData)

  if ($null -eq $ResponseData) {
    return $null
  }

  if ($ResponseData -is [System.Collections.IEnumerable] -and -not ($ResponseData -is [string])) {
    if ($ResponseData -is [array]) {
      return $ResponseData
    }
  }

  $propertyNames = @($ResponseData.PSObject.Properties.Name)
  if ($propertyNames -contains 'data') {
    return $ResponseData.data
  }

  return $ResponseData
}

function Resolve-OportunidadesArray {
  param([object]$ResponseData)

  $payload = Resolve-ResponsePayload -ResponseData $ResponseData
  if ($null -eq $payload) {
    return @()
  }

  if ($payload -is [array]) {
    return $payload
  }

  $propertyNames = @($payload.PSObject.Properties.Name)
  if (($propertyNames -contains 'oportunidades') -and ($payload.oportunidades -is [array])) {
    return $payload.oportunidades
  }

  if (($propertyNames -contains 'items') -and ($payload.items -is [array])) {
    return $payload.items
  }

  return @()
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
      Step = (New-StepResult -Id 'SMOKE-000' -Nome 'Authenticate' -Method 'POST' -Url "$ApiBaseUrl/auth/login")
    }
  }

  if (-not [string]::IsNullOrWhiteSpace($CurrentToken)) {
    return [PSCustomObject]@{
      AccessToken = $CurrentToken
      Step = (New-StepResult -Id 'SMOKE-000' -Nome 'Authenticate (manual token)' -Method 'TOKEN' -Url '(manual)' -Resultado 'PASS' -StatusCode 200)
    }
  }

  if ([string]::IsNullOrWhiteSpace($LoginEmail) -or [string]::IsNullOrWhiteSpace($LoginSenha)) {
    return [PSCustomObject]@{
      AccessToken = ''
      Step = (New-StepResult -Id 'SMOKE-000' -Nome 'Authenticate' -Method 'POST' -Url "$ApiBaseUrl/auth/login" -Resultado 'FAIL' -Erro 'Token nao informado. Use -Token ou informe -Email e -Senha para login automatico.')
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
    Step = (New-StepResult -Id 'SMOKE-000' -Nome 'Authenticate' -Method 'POST' -Url "$ApiBaseUrl/auth/login" -Resultado $result -StatusCode $statusCode -DuracaoSegundos ([Math]::Round($sw.Elapsed.TotalSeconds, 2)) -Erro $errorMessage)
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
    return New-StepResult -Id $Id -Nome $Nome -Method $Method -Url $Url
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

  return New-StepResult -Id $Id -Nome $Nome -Method $Method -Url $Url -Resultado $result -StatusCode $statusCode -DuracaoSegundos ([Math]::Round($sw.Elapsed.TotalSeconds, 2)) -Erro $errorMessage -ResponseData $responseData
}

$runId = Get-Date -Format 'yyyyMMdd-HHmmss'
$startedAt = Get-Date
$steps = @()
$featureFlagSnapshot = $null

Write-Host ''
Write-Host '===============================================' -ForegroundColor Cyan
Write-Host ' OPP-304 - Piloto API smoke (lifecycle)' -ForegroundColor Cyan
Write-Host '===============================================' -ForegroundColor Cyan
Write-Host "RunId: $runId"
Write-Host "BaseUrl: $normalizedBaseUrl"
Write-Host "DryRun: $($DryRun.IsPresent)"
Write-Host "RunLifecycleActions: $($RunLifecycleActions.IsPresent)"
Write-Host ''

$authContext = Resolve-AuthContext -CurrentToken $Token -ApiBaseUrl $normalizedBaseUrl -LoginEmail $Email -LoginSenha $Senha -SkipNetwork:$DryRun
$steps += $authContext.Step
$accessToken = $authContext.AccessToken

$headers = @{}
if (-not [string]::IsNullOrWhiteSpace($accessToken)) {
  $headers['Authorization'] = "Bearer $accessToken"
}

$steps += Invoke-ApiStep -Id 'SMOKE-001' -Nome 'Health check' -Method 'GET' -Url "$normalizedBaseUrl/health" -Headers $headers -Body $null -SkipNetwork:$DryRun
$steps += Invoke-ApiStep -Id 'SMOKE-002' -Nome 'Get lifecycle feature flag' -Method 'GET' -Url "$normalizedBaseUrl/oportunidades/lifecycle/feature-flag" -Headers $headers -Body $null -SkipNetwork:$DryRun
$steps += Invoke-ApiStep -Id 'SMOKE-003' -Nome 'List open opportunities' -Method 'GET' -Url "$normalizedBaseUrl/oportunidades?lifecycle_view=open" -Headers $headers -Body $null -SkipNetwork:$DryRun

if ($ApplyFlagPatch) {
  $featureStep = $steps | Where-Object { $_.Id -eq 'SMOKE-002' } | Select-Object -First 1
  if ($featureStep -and $featureStep.Resultado -eq 'PASS' -and $featureStep.ResponseData) {
    $featurePayload = Resolve-ResponsePayload -ResponseData $featureStep.ResponseData
    if ($featurePayload) {
      $featureFlagSnapshot = @{
        enabled = [bool]$featurePayload.enabled
        rolloutPercentage = [int]$featurePayload.rolloutPercentage
      }
    }
  }

  $patchPayload = @{
    enabled = [bool]$FlagEnabled
    rolloutPercentage = [int]$RolloutPercentage
  }

  $steps += Invoke-ApiStep -Id 'SMOKE-004' -Nome 'Patch lifecycle feature flag' -Method 'PATCH' -Url "$normalizedBaseUrl/oportunidades/lifecycle/feature-flag" -Headers $headers -Body $patchPayload -SkipNetwork:$DryRun
  $steps += Invoke-ApiStep -Id 'SMOKE-005' -Nome 'Recheck lifecycle feature flag' -Method 'GET' -Url "$normalizedBaseUrl/oportunidades/lifecycle/feature-flag" -Headers $headers -Body $null -SkipNetwork:$DryRun

  if ($RestoreAfterPatch -and $null -ne $featureFlagSnapshot) {
    $steps += Invoke-ApiStep -Id 'SMOKE-006' -Nome 'Restore lifecycle feature flag' -Method 'PATCH' -Url "$normalizedBaseUrl/oportunidades/lifecycle/feature-flag" -Headers $headers -Body $featureFlagSnapshot -SkipNetwork:$DryRun
    $steps += Invoke-ApiStep -Id 'SMOKE-007' -Nome 'Recheck restored feature flag' -Method 'GET' -Url "$normalizedBaseUrl/oportunidades/lifecycle/feature-flag" -Headers $headers -Body $null -SkipNetwork:$DryRun
  }
}

if ($RunLifecycleActions) {
  $resolvedOpportunityId = $OportunidadeId
  if ([string]::IsNullOrWhiteSpace($resolvedOpportunityId)) {
    $openStep = $steps | Where-Object { $_.Id -eq 'SMOKE-003' } | Select-Object -First 1
    if ($openStep -and $openStep.Resultado -eq 'PASS') {
      $openItems = Resolve-OportunidadesArray -ResponseData $openStep.ResponseData
      if ($openItems.Count -gt 0) {
        $resolvedOpportunityId = [string]$openItems[0].id
      }
    }
  }

  if ([string]::IsNullOrWhiteSpace($resolvedOpportunityId)) {
    $steps += New-StepResult -Id 'SMOKE-010' -Nome 'Lifecycle actions target resolution' -Method 'INFO' -Url '' -Resultado 'FAIL' -Erro 'Nao foi possivel resolver OportunidadeId para executar acoes de lifecycle.'
  } else {
    $transitionPayload = @{
      comentario = $TransitionComment
      motivo = 'Smoke operacional OPP-304'
    }

    $steps += Invoke-ApiStep -Id 'SMOKE-010' -Nome 'Arquivar oportunidade' -Method 'POST' -Url "$normalizedBaseUrl/oportunidades/$resolvedOpportunityId/arquivar" -Headers $headers -Body $transitionPayload -SkipNetwork:$DryRun
    $steps += Invoke-ApiStep -Id 'SMOKE-011' -Nome 'Restaurar oportunidade' -Method 'POST' -Url "$normalizedBaseUrl/oportunidades/$resolvedOpportunityId/restaurar" -Headers $headers -Body $transitionPayload -SkipNetwork:$DryRun
    $steps += Invoke-ApiStep -Id 'SMOKE-012' -Nome 'Excluir para lixeira (soft delete)' -Method 'DELETE' -Url "$normalizedBaseUrl/oportunidades/$resolvedOpportunityId" -Headers $headers -Body $null -SkipNetwork:$DryRun
    $steps += Invoke-ApiStep -Id 'SMOKE-013' -Nome 'Restaurar apos lixeira' -Method 'POST' -Url "$normalizedBaseUrl/oportunidades/$resolvedOpportunityId/restaurar" -Headers $headers -Body $transitionPayload -SkipNetwork:$DryRun
  }

  if (-not [string]::IsNullOrWhiteSpace($ClosedOportunidadeId)) {
    $reopenPayload = @{
      comentario = $TransitionComment
      motivo = 'Smoke operacional OPP-304'
    }
    $steps += Invoke-ApiStep -Id 'SMOKE-014' -Nome 'Reabrir oportunidade fechada' -Method 'POST' -Url "$normalizedBaseUrl/oportunidades/$ClosedOportunidadeId/reabrir" -Headers $headers -Body $reopenPayload -SkipNetwork:$DryRun
  } else {
    $steps += New-StepResult -Id 'SMOKE-014' -Nome 'Reabrir oportunidade fechada' -Method 'POST' -Url "$normalizedBaseUrl/oportunidades/{closed-id}/reabrir" -Resultado 'SKIPPED' -Erro 'ClosedOportunidadeId nao informado.'
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
$md += '# OPP-304 - Piloto API smoke (lifecycle)'
$md += ''
$md += "- RunId: $runId"
$md += "- Inicio: $($startedAt.ToString('yyyy-MM-dd HH:mm:ss'))"
$md += "- Fim: $($finishedAt.ToString('yyyy-MM-dd HH:mm:ss'))"
$md += "- BaseUrl: $normalizedBaseUrl"
$md += "- DryRun: $(if ($DryRun) { 'true' } else { 'false' })"
$md += "- RunLifecycleActions: $(if ($RunLifecycleActions) { 'true' } else { 'false' })"
$md += "- OportunidadeId informado: $(if ([string]::IsNullOrWhiteSpace($OportunidadeId)) { '(nao informado)' } else { $OportunidadeId })"
$md += "- ClosedOportunidadeId informado: $(if ([string]::IsNullOrWhiteSpace($ClosedOportunidadeId)) { '(nao informado)' } else { $ClosedOportunidadeId })"
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
  $md += 'Smoke de API lifecycle concluido sem falhas.'
} else {
  $md += 'Smoke de API lifecycle com falhas. Revisar etapas FAIL e permissoes do usuario/token.'
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
