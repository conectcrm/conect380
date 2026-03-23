param(
  [string]$BaseUrl = 'http://localhost:3001',
  [string]$Token = '',
  [string]$Email = '',
  [string]$Senha = '',
  [string]$CohortFile = 'docs/features/GDN-401_COHORT_PILOTO_GUARDIAN_2026-03-07.csv',
  [switch]$DryRun = $false,
  [string]$OutputFile = ''
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$normalizedBaseUrl = $BaseUrl.TrimEnd('/')

if (-not [System.IO.Path]::IsPathRooted($CohortFile)) {
  $CohortFile = Join-Path $repoRoot $CohortFile
}

if ([string]::IsNullOrWhiteSpace($OutputFile)) {
  $runId = Get-Date -Format 'yyyyMMdd-HHmmss'
  $OutputFile = Join-Path $repoRoot "docs/features/evidencias/GDN401_PILOTO_COHORT_SMOKE_$runId.md"
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
      Step = (New-StepResult -Id 'PILOT-000' -Nome 'Authenticate' -Method 'POST' -Url "$ApiBaseUrl/auth/login")
    }
  }

  if (-not [string]::IsNullOrWhiteSpace($CurrentToken)) {
    return [PSCustomObject]@{
      AccessToken = $CurrentToken
      Step = (New-StepResult -Id 'PILOT-000' -Nome 'Authenticate (manual token)' -Method 'TOKEN' -Url '(manual)' -Resultado 'PASS' -StatusCode 200)
    }
  }

  if ([string]::IsNullOrWhiteSpace($LoginEmail) -or [string]::IsNullOrWhiteSpace($LoginSenha)) {
    return [PSCustomObject]@{
      AccessToken = ''
      Step = (New-StepResult -Id 'PILOT-000' -Nome 'Authenticate' -Method 'POST' -Url "$ApiBaseUrl/auth/login" -Resultado 'FAIL' -Erro 'Informe -Token ou -Email/-Senha.')
    }
  }

  $body = @{ email = $LoginEmail; senha = $LoginSenha } | ConvertTo-Json -Depth 5
  $sw = [System.Diagnostics.Stopwatch]::StartNew()
  $statusCode = 0
  $result = 'PASS'
  $errorMessage = ''
  $resolvedToken = ''

  try {
    $response = Invoke-WebRequest -Uri "$ApiBaseUrl/auth/login" -Method Post -Body $body -ContentType 'application/json' -UseBasicParsing -ErrorAction Stop
    $statusCode = [int]$response.StatusCode
    $json = $response.Content | ConvertFrom-Json -ErrorAction Stop
    $resolvedToken = $json.data.access_token
    if ([string]::IsNullOrWhiteSpace($resolvedToken)) {
      $result = 'FAIL'
      $errorMessage = 'Login nao retornou access_token; usar -Token quando houver MFA.'
    }
  } catch {
    $result = 'FAIL'
    $errorMessage = $_.Exception.Message
    if ($_.Exception.Response -and $_.Exception.Response.StatusCode) {
      try { $statusCode = [int]$_.Exception.Response.StatusCode.value__ } catch { $statusCode = 0 }
    }
  } finally {
    $sw.Stop()
  }

  return [PSCustomObject]@{
    AccessToken = $resolvedToken
    Step = (New-StepResult -Id 'PILOT-000' -Nome 'Authenticate' -Method 'POST' -Url "$ApiBaseUrl/auth/login" -Resultado $result -StatusCode $statusCode -DuracaoSegundos ([Math]::Round($sw.Elapsed.TotalSeconds, 2)) -Erro $errorMessage)
  }
}

function Invoke-ApiStep {
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
  $responseData = $null

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
      try { $statusCode = [int]$_.Exception.Response.StatusCode.value__ } catch { $statusCode = 0 }
    }
  } finally {
    $sw.Stop()
  }

  return New-StepResult -Id $Id -Nome $Nome -Method $Method -Url $Url -Resultado $result -StatusCode $statusCode -DuracaoSegundos ([Math]::Round($sw.Elapsed.TotalSeconds, 2)) -Erro $errorMessage -ResponseData $responseData
}

function Resolve-Companies {
  param([object]$ResponseData)

  if ($null -eq $ResponseData) {
    return @()
  }

  if ($ResponseData.PSObject.Properties.Name -contains 'data') {
    if ($ResponseData.data -is [array]) {
      return $ResponseData.data
    }
  }

  if ($ResponseData -is [array]) {
    return $ResponseData
  }

  return @()
}

$startedAt = Get-Date
$runId = Get-Date -Format 'yyyyMMdd-HHmmss'
$steps = @()

if (-not (Test-Path $CohortFile)) {
  throw "Arquivo de coorte nao encontrado: $CohortFile"
}

$cohortRows = Import-Csv -Path $CohortFile
$selectedStatuses = @('selected', 'active', 'pilot_enabled')
$selectedRows = @(
  $cohortRows | Where-Object {
    $status = if ($_.status) { $_.status.Trim().ToLowerInvariant() } else { '' }
    $selectedStatuses -contains $status
  }
)

$auth = Resolve-AuthContext -CurrentToken $Token -ApiBaseUrl $normalizedBaseUrl -LoginEmail $Email -LoginSenha $Senha -SkipNetwork:$DryRun
$steps += $auth.Step

$headers = @{}
if (-not [string]::IsNullOrWhiteSpace($auth.AccessToken)) {
  $headers['Authorization'] = "Bearer $($auth.AccessToken)"
}

$steps += Invoke-ApiStep -Id 'PILOT-001' -Nome 'Health check' -Method 'GET' -Url "$normalizedBaseUrl/health" -Headers $headers -SkipNetwork:$DryRun
$steps += Invoke-ApiStep -Id 'PILOT-002' -Nome 'Guardian overview' -Method 'GET' -Url "$normalizedBaseUrl/guardian/bff/overview" -Headers $headers -SkipNetwork:$DryRun
$steps += Invoke-ApiStep -Id 'PILOT-003' -Nome 'Guardian companies' -Method 'GET' -Url "$normalizedBaseUrl/guardian/bff/companies" -Headers $headers -SkipNetwork:$DryRun
$steps += Invoke-ApiStep -Id 'PILOT-004' -Nome 'Guardian billing subscriptions' -Method 'GET' -Url "$normalizedBaseUrl/guardian/bff/billing/subscriptions" -Headers $headers -SkipNetwork:$DryRun
$steps += Invoke-ApiStep -Id 'PILOT-005' -Nome 'Guardian critical audit list' -Method 'GET' -Url "$normalizedBaseUrl/guardian/bff/audit/critical?page=1&limit=10" -Headers $headers -SkipNetwork:$DryRun

if ($DryRun) {
  $steps += New-StepResult -Id 'PILOT-100' -Nome 'Cohort selection check' -Method 'CHECK' -Url $CohortFile -Resultado 'PASS' -StatusCode 200 -Erro 'Dry-run: validacao de coorte real nao aplicada.'
} else {
  if ($selectedRows.Count -eq 0) {
    $steps += New-StepResult -Id 'PILOT-100' -Nome 'Cohort selection check' -Method 'CHECK' -Url $CohortFile -Resultado 'FAIL' -StatusCode 0 -Erro 'Nenhuma conta com status selected/active/pilot_enabled na coorte.'
  } else {
    $companiesStep = $steps | Where-Object { $_.Id -eq 'PILOT-003' } | Select-Object -First 1
    $companies = @()
    if ($companiesStep -and $companiesStep.Resultado -eq 'PASS') {
      $companies = Resolve-Companies -ResponseData $companiesStep.ResponseData
    }

    $matches = 0
    foreach ($entry in $selectedRows) {
      $match = $false
      if ($companies.Count -gt 0) {
        $entryId = if ($entry.empresa_id) { $entry.empresa_id.Trim() } else { '' }
        $entryName = if ($entry.nome_empresa) { $entry.nome_empresa.Trim().ToLowerInvariant() } else { '' }
        $match = @(
          $companies | Where-Object {
            (($_.id -as [string]) -eq $entryId -and -not [string]::IsNullOrWhiteSpace($entryId)) -or
            (($_.nome -as [string]).Trim().ToLowerInvariant() -eq $entryName -and -not [string]::IsNullOrWhiteSpace($entryName))
          }
        ).Count -gt 0
      }

      if ($match) {
        $matches++
      }
    }

    if ($matches -eq $selectedRows.Count) {
      $steps += New-StepResult -Id 'PILOT-100' -Nome 'Cohort selection check' -Method 'CHECK' -Url $CohortFile -Resultado 'PASS' -StatusCode 200
    } else {
      $steps += New-StepResult -Id 'PILOT-100' -Nome 'Cohort selection check' -Method 'CHECK' -Url $CohortFile -Resultado 'FAIL' -StatusCode 0 -Erro "Cohort parcial: $matches de $($selectedRows.Count) contas encontradas no Guardian."
    }
  }
}

$finishedAt = Get-Date
$total = $steps.Count
$pass = @($steps | Where-Object { $_.Resultado -eq 'PASS' }).Count
$fail = @($steps | Where-Object { $_.Resultado -eq 'FAIL' }).Count
$skipped = @($steps | Where-Object { $_.Resultado -eq 'SKIPPED' }).Count

$outputDir = Split-Path -Path $OutputFile -Parent
if (-not (Test-Path $outputDir)) {
  New-Item -Path $outputDir -ItemType Directory -Force | Out-Null
}

$lines = @()
$lines += '# GDN-401 - Guardian piloto cohort smoke'
$lines += ''
$lines += "- RunId: $runId"
$lines += "- Inicio: $($startedAt.ToString('yyyy-MM-dd HH:mm:ss'))"
$lines += "- Fim: $($finishedAt.ToString('yyyy-MM-dd HH:mm:ss'))"
$lines += "- BaseUrl: $normalizedBaseUrl"
$lines += "- CohortFile: $CohortFile"
$lines += "- DryRun: $(if ($DryRun) { 'true' } else { 'false' })"
$lines += "- Cohort selected rows: $($selectedRows.Count)"
$lines += "- Total: $total"
$lines += "- PASS: $pass"
$lines += "- FAIL: $fail"
$lines += "- SKIPPED: $skipped"
$lines += ''
$lines += '| ID | Etapa | Metodo | Status | Resultado | Duracao (s) |'
$lines += '| --- | --- | --- | ---: | --- | ---: |'
foreach ($item in $steps) {
  $lines += "| $($item.Id) | $($item.Nome) | $($item.Method) | $($item.StatusCode) | $($item.Resultado) | $($item.DuracaoSegundos) |"
}

$lines += ''
$lines += '## Resultado'
$lines += ''
if ($DryRun) {
  $lines += 'Execucao dry-run concluida. Sem chamadas reais de API.'
} elseif ($fail -eq 0) {
  $lines += 'Smoke do piloto Guardian concluido sem falhas.'
} else {
  $lines += 'Smoke do piloto Guardian com falhas. Revisar autenticacao, disponibilidade e coorte selecionada.'
}

$lines += ''
$lines += '## Erros'
$lines += ''
$errorSteps = @($steps | Where-Object { $_.Resultado -eq 'FAIL' })
if ($errorSteps.Count -eq 0) {
  $lines += '- Nenhum erro registrado.'
} else {
  foreach ($row in $errorSteps) {
    $lines += "- $($row.Id): $($row.Erro)"
  }
}

Set-Content -Path $OutputFile -Value $lines -Encoding UTF8

Write-Host "Resumo: PASS=$pass FAIL=$fail SKIPPED=$skipped TOTAL=$total"
Write-Host "Relatorio salvo em: $OutputFile"

if (-not $DryRun -and $fail -gt 0) {
  exit 1
}

exit 0
