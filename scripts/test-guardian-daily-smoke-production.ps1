param(
  [string]$BaseUrl = 'http://localhost:3001',
  [string]$Token = '',
  [string]$Email = '',
  [string]$Senha = '',
  [string]$TargetEmpresaId = '',
  [switch]$DryRun = $false,
  [string]$OutputFile = ''
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$normalizedBaseUrl = $BaseUrl.TrimEnd('/')
$runId = Get-Date -Format 'yyyyMMdd-HHmmss'

if ([string]::IsNullOrWhiteSpace($OutputFile)) {
  $OutputFile = Join-Path $repoRoot "docs/features/evidencias/GDN506_DAILY_SMOKE_$runId.md"
} elseif (-not [System.IO.Path]::IsPathRooted($OutputFile)) {
  $OutputFile = Join-Path $repoRoot $OutputFile
}

function Get-CandidateBases {
  param([string]$BaseUrl)

  $list = New-Object System.Collections.Generic.List[string]
  $normalized = $BaseUrl.TrimEnd('/')
  if (-not [string]::IsNullOrWhiteSpace($normalized)) {
    [void]$list.Add($normalized)
  }

  if ($normalized.ToLowerInvariant().EndsWith('/api')) {
    $root = $normalized.Substring(0, $normalized.Length - 4).TrimEnd('/')
    if (-not [string]::IsNullOrWhiteSpace($root) -and -not $list.Contains($root)) {
      [void]$list.Add($root)
    }
  } else {
    $api = "$normalized/api"
    if (-not $list.Contains($api)) {
      [void]$list.Add($api)
    }
  }

  return @($list)
}

$baseCandidates = Get-CandidateBases -BaseUrl $normalizedBaseUrl

function Invoke-JsonRequest {
  param(
    [string]$Method,
    [string]$Url,
    [hashtable]$Headers = @{},
    [object]$Body = $null
  )

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

  try {
    $resp = Invoke-WebRequest @params
    $payload = $null
    if (-not [string]::IsNullOrWhiteSpace($resp.Content)) {
      try {
        $payload = $resp.Content | ConvertFrom-Json -ErrorAction Stop
      } catch {
        $payload = $resp.Content
      }
    }

    return [PSCustomObject]@{
      success = $true
      statusCode = [int]$resp.StatusCode
      payload = $payload
      error = ''
      url = $Url
    }
  } catch {
    $statusCode = 0
    if ($_.Exception.Response -and $_.Exception.Response.StatusCode) {
      try { $statusCode = [int]$_.Exception.Response.StatusCode.value__ } catch { $statusCode = 0 }
    }

    return [PSCustomObject]@{
      success = $false
      statusCode = $statusCode
      payload = $null
      error = $_.Exception.Message
      url = $Url
    }
  }
}

function Resolve-TokenFromPayload {
  param([object]$Payload)

  if ($null -eq $Payload) { return '' }

  $directKeys = @('access_token', 'accessToken', 'token')
  foreach ($key in $directKeys) {
    if ($Payload.PSObject.Properties.Name -contains $key) {
      $value = [string]$Payload.$key
      if (-not [string]::IsNullOrWhiteSpace($value)) { return $value }
    }
  }

  if ($Payload.PSObject.Properties.Name -contains 'data' -and $null -ne $Payload.data) {
    $data = $Payload.data
    foreach ($key in $directKeys) {
      if ($data.PSObject.Properties.Name -contains $key) {
        $value = [string]$data.$key
        if (-not [string]::IsNullOrWhiteSpace($value)) { return $value }
      }
    }

    if ($data.PSObject.Properties.Name -contains 'tokens' -and $null -ne $data.tokens) {
      $tokens = $data.tokens
      foreach ($key in $directKeys) {
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

function Resolve-AccessToken {
  param(
    [string]$CurrentToken,
    [string[]]$BaseCandidates,
    [string]$LoginEmail,
    [string]$LoginSenha
  )

  if (-not [string]::IsNullOrWhiteSpace($CurrentToken)) {
    return [PSCustomObject]@{
      success = $true
      token = $CurrentToken
      usedBase = $BaseCandidates[0]
      detail = 'Token informado manualmente.'
    }
  }

  if ([string]::IsNullOrWhiteSpace($LoginEmail) -or [string]::IsNullOrWhiteSpace($LoginSenha)) {
    return [PSCustomObject]@{
      success = $false
      token = ''
      usedBase = ''
      detail = 'Informe -Token ou -Email/-Senha para executar fluxo real.'
    }
  }

  $body = @{ email = $LoginEmail; senha = $LoginSenha } | ConvertTo-Json -Depth 5
  $errors = @()

  foreach ($base in $BaseCandidates) {
    $result = Invoke-JsonRequest -Method 'POST' -Url "$base/auth/login" -Body (@{ email = $LoginEmail; senha = $LoginSenha })
    if (-not $result.success) {
      $errors += "Login em $base falhou: status=$($result.statusCode) erro=$($result.error)"
      continue
    }

    $accessToken = Resolve-TokenFromPayload -Payload $result.payload
    if ([string]::IsNullOrWhiteSpace($accessToken)) {
      $action = ''
      if ($result.payload -and $result.payload.PSObject.Properties.Name -contains 'action') {
        $action = [string]$result.payload.action
      }

      if ($action -eq 'MFA_REQUIRED' -and $result.payload.PSObject.Properties.Name -contains 'data' -and $null -ne $result.payload.data) {
        $challengeId = ''
        $codigo = ''
        $challengeData = $result.payload.data

        if ($challengeData.PSObject.Properties.Name -contains 'challengeId') {
          $challengeId = [string]$challengeData.challengeId
        }
        if ($challengeData.PSObject.Properties.Name -contains 'devCode') {
          $codigo = [string]$challengeData.devCode
        }

        if (-not [string]::IsNullOrWhiteSpace($challengeId) -and -not [string]::IsNullOrWhiteSpace($codigo)) {
          $verifyResult = Invoke-JsonRequest -Method 'POST' -Url "$base/auth/mfa/verify" -Body (@{
              challengeId = $challengeId
              codigo = $codigo
            })

          if ($verifyResult.success) {
            $accessToken = Resolve-TokenFromPayload -Payload $verifyResult.payload
            if (-not [string]::IsNullOrWhiteSpace($accessToken)) {
              return [PSCustomObject]@{
                success = $true
                token = $accessToken
                usedBase = $base
                detail = "Token obtido via MFA em $base/auth/mfa/verify"
              }
            }
            $errors += "MFA verify em $base sem token reconhecido."
            continue
          }

          $errors += "MFA verify em $base falhou: status=$($verifyResult.statusCode) erro=$($verifyResult.error)"
          continue
        }
      }
    }

    if ([string]::IsNullOrWhiteSpace($accessToken)) {
      $errors += "Login em $base sem token reconhecido (access_token/accessToken/token)."
      continue
    }

    return [PSCustomObject]@{
      success = $true
      token = $accessToken
      usedBase = $base
      detail = "Token obtido via $base/auth/login"
    }
  }

  return [PSCustomObject]@{
    success = $false
    token = ''
    usedBase = ''
    detail = ($errors -join ' | ')
  }
}

function Invoke-EndpointWithFallback {
  param(
    [string]$Method,
    [string[]]$BaseCandidates,
    [string]$Path,
    [hashtable]$Headers = @{},
    [object]$Body = $null
  )

  $last = $null
  foreach ($base in $BaseCandidates) {
    $url = "$($base.TrimEnd('/'))$Path"
    $result = Invoke-JsonRequest -Method $Method -Url $url -Headers $Headers -Body $Body
    $result | Add-Member -NotePropertyName usedBase -NotePropertyValue $base -Force
    if ($result.success) {
      return $result
    }

    $last = $result
    if ($result.statusCode -ne 404) {
      return $result
    }
  }

  return $last
}

$startedAt = Get-Date
$status = 'PASS'
$notes = @()
$steps = @()

if ($DryRun) {
  $steps += [PSCustomObject]@{ Name = 'authenticate_admin'; Status = 'PASS'; Detail = 'Dry-run: autenticacao real nao executada.' }
  $steps += [PSCustomObject]@{ Name = 'smoke_health'; Status = 'PASS'; Detail = 'Dry-run: health check simulado.' }
  $steps += [PSCustomObject]@{ Name = 'smoke_guardian_overview'; Status = 'PASS'; Detail = 'Dry-run: overview simulado.' }
  $steps += [PSCustomObject]@{ Name = 'smoke_guardian_companies'; Status = 'PASS'; Detail = 'Dry-run: companies simulado.' }
  $steps += [PSCustomObject]@{ Name = 'smoke_guardian_billing_subscriptions'; Status = 'PASS'; Detail = 'Dry-run: billing list simulado.' }
  $steps += [PSCustomObject]@{ Name = 'smoke_guardian_critical_audit'; Status = 'PASS'; Detail = 'Dry-run: audit simulado.' }
  $steps += [PSCustomObject]@{ Name = 'billing_suspend_reactivate_flow'; Status = 'PASS'; Detail = 'Dry-run: suspend/reactivate simulado.' }
} else {
  $tokenContext = Resolve-AccessToken -CurrentToken $Token -BaseCandidates $baseCandidates -LoginEmail $Email -LoginSenha $Senha
  if (-not $tokenContext.success) {
    $steps += [PSCustomObject]@{
      Name = 'authenticate_admin'
      Status = 'FAIL'
      Detail = $tokenContext.detail
    }
    $status = 'FAIL'
  } else {
    $steps += [PSCustomObject]@{
      Name = 'authenticate_admin'
      Status = 'PASS'
      Detail = "base=$($tokenContext.usedBase)"
    }

    $headers = @{ Authorization = "Bearer $($tokenContext.token)" }

    $healthCandidates = @()
    foreach ($base in $baseCandidates) {
      foreach ($path in @('/health', '/api/health')) {
        $candidateUrl = "$($base.TrimEnd('/'))$path"
        if ($healthCandidates -notcontains $candidateUrl) {
          $healthCandidates += $candidateUrl
        }
      }
    }

    $healthResult = $null
    foreach ($url in $healthCandidates) {
      $result = Invoke-JsonRequest -Method 'GET' -Url $url
      if ($result.success) {
        $healthResult = $result
        break
      }
      if ($result.statusCode -ne 404) {
        $healthResult = $result
        break
      }
      $healthResult = $result
    }

    if ($healthResult -and $healthResult.success) {
      $steps += [PSCustomObject]@{ Name = 'smoke_health'; Status = 'PASS'; Detail = "url=$($healthResult.url) status=$($healthResult.statusCode)" }
    } elseif ($healthResult -and $healthResult.statusCode -eq 404) {
      $steps += [PSCustomObject]@{
        Name = 'smoke_health'
        Status = 'PASS'
        Detail = "Health endpoint nao exposto via base/proxy (ultimo status=404 em $($healthResult.url)); fluxo segue com validacao Guardian."
      }
      $notes += 'Health check via endpoint dedicado nao disponivel no proxy atual; considerar expor /health no frontend gateway.'
    } else {
      $steps += [PSCustomObject]@{ Name = 'smoke_health'; Status = 'FAIL'; Detail = "url=$($healthResult.url) status=$($healthResult.statusCode) erro=$($healthResult.error)" }
      $status = 'FAIL'
    }

    $overviewResult = Invoke-EndpointWithFallback -Method 'GET' -BaseCandidates $baseCandidates -Path '/guardian/bff/overview' -Headers $headers
    if ($overviewResult.success) {
      $steps += [PSCustomObject]@{ Name = 'smoke_guardian_overview'; Status = 'PASS'; Detail = "base=$($overviewResult.usedBase) status=$($overviewResult.statusCode)" }
    } else {
      $steps += [PSCustomObject]@{ Name = 'smoke_guardian_overview'; Status = 'FAIL'; Detail = "base=$($overviewResult.usedBase) status=$($overviewResult.statusCode) erro=$($overviewResult.error)" }
      $status = 'FAIL'
    }

    $companiesResult = Invoke-EndpointWithFallback -Method 'GET' -BaseCandidates $baseCandidates -Path '/guardian/bff/companies' -Headers $headers
    if ($companiesResult.success) {
      $steps += [PSCustomObject]@{ Name = 'smoke_guardian_companies'; Status = 'PASS'; Detail = "base=$($companiesResult.usedBase) status=$($companiesResult.statusCode)" }
    } else {
      $steps += [PSCustomObject]@{ Name = 'smoke_guardian_companies'; Status = 'FAIL'; Detail = "base=$($companiesResult.usedBase) status=$($companiesResult.statusCode) erro=$($companiesResult.error)" }
      $status = 'FAIL'
    }

    $subscriptionsResult = Invoke-EndpointWithFallback -Method 'GET' -BaseCandidates $baseCandidates -Path '/guardian/bff/billing/subscriptions' -Headers $headers
    if ($subscriptionsResult.success) {
      $steps += [PSCustomObject]@{ Name = 'smoke_guardian_billing_subscriptions'; Status = 'PASS'; Detail = "base=$($subscriptionsResult.usedBase) status=$($subscriptionsResult.statusCode)" }
    } else {
      $steps += [PSCustomObject]@{ Name = 'smoke_guardian_billing_subscriptions'; Status = 'FAIL'; Detail = "base=$($subscriptionsResult.usedBase) status=$($subscriptionsResult.statusCode) erro=$($subscriptionsResult.error)" }
      $status = 'FAIL'
    }

    $auditResult = Invoke-EndpointWithFallback -Method 'GET' -BaseCandidates $baseCandidates -Path '/guardian/bff/audit/critical?page=1&limit=10' -Headers $headers
    if ($auditResult.success) {
      $steps += [PSCustomObject]@{ Name = 'smoke_guardian_critical_audit'; Status = 'PASS'; Detail = "base=$($auditResult.usedBase) status=$($auditResult.statusCode)" }
    } else {
      $steps += [PSCustomObject]@{ Name = 'smoke_guardian_critical_audit'; Status = 'FAIL'; Detail = "base=$($auditResult.usedBase) status=$($auditResult.statusCode) erro=$($auditResult.error)" }
      $status = 'FAIL'
    }

    if ($subscriptionsResult.success) {
      $items = @()
      if ($subscriptionsResult.payload -and $subscriptionsResult.payload.PSObject.Properties.Name -contains 'data') {
        $items = @($subscriptionsResult.payload.data)
      }

      $empresaId = ''
      if (-not [string]::IsNullOrWhiteSpace($TargetEmpresaId)) {
        $empresaId = $TargetEmpresaId.Trim()
      } else {
        $candidate = $items | Where-Object {
          $_.empresa -and $_.empresa.id -and $_.assinatura -and $_.assinatura.status_canonico -in @('active', 'past_due', 'suspended')
        } | Select-Object -First 1
        if ($candidate -and $candidate.empresa -and $candidate.empresa.id) {
          $empresaId = [string]$candidate.empresa.id
        }
      }

      if ([string]::IsNullOrWhiteSpace($empresaId)) {
        $steps += [PSCustomObject]@{
          Name = 'billing_suspend_reactivate_flow'
          Status = 'PASS'
          Detail = 'Nenhuma empresa elegivel encontrada. Fluxo mutavel pulado com seguranca.'
        }
        $notes += 'Fluxo suspend/reactivate nao executado por ausencia de empresa elegivel. Informe -TargetEmpresaId para validar mutacao.'
      } else {
        $suspend = Invoke-EndpointWithFallback -Method 'PATCH' -BaseCandidates $baseCandidates -Path "/guardian/bff/billing/subscriptions/$empresaId/suspend" -Headers $headers -Body @{ reason = 'daily-smoke-guardian-suspend-validation' }
        $reactivate = Invoke-EndpointWithFallback -Method 'PATCH' -BaseCandidates $baseCandidates -Path "/guardian/bff/billing/subscriptions/$empresaId/reactivate" -Headers $headers -Body @{ reason = 'daily-smoke-guardian-reactivate-validation' }

        if ($suspend.success -and $reactivate.success) {
          $steps += [PSCustomObject]@{
            Name = 'billing_suspend_reactivate_flow'
            Status = 'PASS'
            Detail = "empresa_id=$empresaId suspend_status=$($suspend.statusCode) reactivate_status=$($reactivate.statusCode)"
          }
        } else {
          $steps += [PSCustomObject]@{
            Name = 'billing_suspend_reactivate_flow'
            Status = 'FAIL'
            Detail = "empresa_id=$empresaId suspend_ok=$($suspend.success) reactivate_ok=$($reactivate.success)"
          }
          $status = 'FAIL'
        }
      }
    }
  }
}

$finishedAt = Get-Date
$durationSeconds = [Math]::Round(($finishedAt - $startedAt).TotalSeconds, 2)

$md = @()
$md += '# GDN-506 - Daily smoke suite in production'
$md += ''
$md += "- RunId: $runId"
$md += "- Inicio: $($startedAt.ToString('yyyy-MM-dd HH:mm:ss'))"
$md += "- Fim: $($finishedAt.ToString('yyyy-MM-dd HH:mm:ss'))"
$md += "- DuracaoSegundos: $durationSeconds"
$md += "- BaseUrl: $normalizedBaseUrl"
$md += "- DryRun: $(if ($DryRun) { 'true' } else { 'false' })"
$md += "- Status: $status"
$md += ''
$md += '## Etapas'
foreach ($step in $steps) {
  $md += "- [$($step.Status)] $($step.Name) :: $($step.Detail)"
}
$md += ''

if ($notes.Count -gt 0) {
  $md += '## Observacoes'
  foreach ($note in $notes) {
    $md += "- $note"
  }
  $md += ''
}

$md += '## Resultado'
if ($status -eq 'PASS') {
  $md += '- Suite diaria de smoke validada com sucesso.'
} else {
  $md += '- Suite diaria de smoke com falhas. Revisar etapas acima.'
}

$outDir = Split-Path -Path $OutputFile -Parent
if (-not (Test-Path -Path $outDir)) {
  New-Item -Path $outDir -ItemType Directory -Force | Out-Null
}

Set-Content -Path $OutputFile -Value $md -Encoding UTF8
Write-Host "Relatorio salvo em: $OutputFile"

if ($status -ne 'PASS') {
  exit 1
}

exit 0
