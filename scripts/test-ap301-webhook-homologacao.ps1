param(
  [Parameter(Mandatory = $true)]
  [string]$EmpresaId,

  [Parameter(Mandatory = $true)]
  [string]$WebhookSecret,

  [Parameter(Mandatory = $true)]
  [string]$ReferenciaGatewayAprovado,

  [Parameter(Mandatory = $false)]
  [string]$ReferenciaGatewayRejeitado = '',

  [Parameter(Mandatory = $false)]
  [ValidateSet('mercado_pago', 'stripe', 'pagseguro')]
  [string]$Gateway = 'pagseguro',

  [Parameter(Mandatory = $false)]
  [string]$BaseUrl = 'http://localhost:3001',

  [Parameter(Mandatory = $false)]
  [string]$OutputFile = '',

  [Parameter(Mandatory = $false)]
  [switch]$ColetarEvidenciasSql = $false,

  [Parameter(Mandatory = $false)]
  [string]$PostgresContainer = '',

  [Parameter(Mandatory = $false)]
  [string]$PostgresUser = 'postgres',

  [Parameter(Mandatory = $false)]
  [string]$PostgresDatabase = 'conectcrm'
)

$ErrorActionPreference = 'Stop'

if ([string]::IsNullOrWhiteSpace($ReferenciaGatewayRejeitado)) {
  $ReferenciaGatewayRejeitado = $ReferenciaGatewayAprovado
}

$runId = Get-Date -Format 'yyyyMMddHHmmss'
$baseEndpoint = "$BaseUrl/pagamentos/gateways/webhooks/$Gateway/$EmpresaId"

function New-HmacSha256Hex {
  param(
    [string]$Secret,
    [string]$PayloadJson
  )

  $hmac = New-Object System.Security.Cryptography.HMACSHA256
  try {
    $hmac.Key = [System.Text.Encoding]::UTF8.GetBytes($Secret)
    $hash = $hmac.ComputeHash([System.Text.Encoding]::UTF8.GetBytes($PayloadJson))
    return ([System.BitConverter]::ToString($hash)).Replace('-', '').ToLowerInvariant()
  } finally {
    $hmac.Dispose()
  }
}

function Escape-SqlLiteral {
  param([string]$Value)
  return "'" + (($Value -replace "'", "''")) + "'"
}

function Resolve-PostgresContainerName {
  param([string]$PreferredName)

  if (-not [string]::IsNullOrWhiteSpace($PreferredName)) {
    return $PreferredName
  }

  $running = @()
  try {
    $running = & docker ps --format '{{.Names}}' 2>$null
  } catch {
    return ''
  }

  if (-not $running -or $running.Count -eq 0) {
    return ''
  }

  $candidates = @('conectsuite-postgres', 'conectcrm-postgres', 'postgres')
  foreach ($candidate in $candidates) {
    if ($running -contains $candidate) {
      return $candidate
    }
  }

  foreach ($name in $running) {
    if ($name -match 'postgres') {
      return $name
    }
  }

  return ''
}

function Invoke-PsqlQueryInDocker {
  param(
    [string]$Container,
    [string]$User,
    [string]$Database,
    [string]$Sql
  )

  if ([string]::IsNullOrWhiteSpace($Container)) {
    throw "Container Postgres nao informado ou nao encontrado."
  }

  $args = @(
    'exec',
    $Container,
    'psql',
    '-U', $User,
    '-d', $Database,
    '-v', 'ON_ERROR_STOP=1',
    '-P', 'pager=off',
    '-c', $Sql
  )

  $output = @()
  $exitCode = 0
  try {
    $output = & docker @args 2>&1
    $exitCode = $LASTEXITCODE
  } catch {
    $exitCode = 1
    $output = @($_.Exception.Message)
  }

  return [PSCustomObject]@{
    ExitCode = $exitCode
    Output = (($output | ForEach-Object { "$_" }) -join [Environment]::NewLine)
  }
}

function Invoke-PsqlQueryWithFallback {
  param(
    [string]$Container,
    [string]$User,
    [string]$Database,
    [string[]]$Queries
  )

  $last = $null
  foreach ($query in $Queries) {
    $result = Invoke-PsqlQueryInDocker -Container $Container -User $User -Database $Database -Sql $query
    $last = $result
    if ($result.ExitCode -eq 0) {
      return $result
    }
  }

  return $last
}

function Invoke-WebhookRequest {
  param(
    [string]$Url,
    [hashtable]$Payload,
    [string]$Secret,
    [bool]$TamperSignature = $false
  )

  $payloadJson = $Payload | ConvertTo-Json -Depth 10 -Compress
  $eventId = [string]$Payload.eventId
  $signatureHex = New-HmacSha256Hex -Secret $Secret -PayloadJson $payloadJson

  if ($TamperSignature -and $signatureHex.Length -gt 0) {
    $lastChar = $signatureHex.Substring($signatureHex.Length - 1, 1)
    $replacement = if ($lastChar -eq '0') { '1' } else { '0' }
    $signatureHex = $signatureHex.Substring(0, $signatureHex.Length - 1) + $replacement
  }

  $payloadFile = [System.IO.Path]::GetTempFileName()
  $bodyFile = [System.IO.Path]::GetTempFileName()

  try {
    Set-Content -Path $payloadFile -Value $payloadJson -Encoding UTF8

    $curlArgs = @(
      '-sS',
      '-o', $bodyFile,
      '-w', '%{http_code}',
      '-X', 'POST', $Url,
      '-H', 'Content-Type: application/json',
      '-H', "x-signature: sha256=$signatureHex",
      '-H', "x-event-id: $eventId",
      '--data-binary', "@$payloadFile"
    )

    $statusRaw = & curl.exe @curlArgs
    $statusCode = 0
    if ($statusRaw -match '^\d{3}$') {
      $statusCode = [int]$statusRaw
    }

    $body = ''
    if (Test-Path $bodyFile) {
      $body = Get-Content -Path $bodyFile -Raw
    }

    return [PSCustomObject]@{
      EventId = $eventId
      ReferenciaGateway = if ($Payload.ContainsKey('referenciaGateway')) { [string]$Payload.referenciaGateway } else { '' }
      StatusCode = $statusCode
      Body = $body
      PayloadJson = $payloadJson
      Signature = "sha256=$signatureHex"
    }
  } finally {
    if (Test-Path $payloadFile) { Remove-Item -Path $payloadFile -Force -ErrorAction SilentlyContinue }
    if (Test-Path $bodyFile) { Remove-Item -Path $bodyFile -Force -ErrorAction SilentlyContinue }
  }
}

function Try-GetJsonProperty {
  param(
    [string]$Body,
    [string]$PropertyName
  )

  try {
    $obj = $Body | ConvertFrom-Json -ErrorAction Stop
    return $obj.$PropertyName
  } catch {
    return $null
  }
}

function Evaluate-Scenario {
  param(
    [string]$ScenarioId,
    [string]$Descricao,
    [pscustomobject]$Response,
    [int]$ExpectedStatusCode,
    [Nullable[bool]]$ExpectedDuplicate,
    [string]$ExpectedBodyContains = ''
  )

  $duplicateValue = Try-GetJsonProperty -Body $Response.Body -PropertyName 'duplicate'
  $isOk = ($Response.StatusCode -eq $ExpectedStatusCode)
  $expectedDuplicateValue = $null

  if ($ExpectedDuplicate -ne $null) {
    $expectedDuplicateValue = [bool]$ExpectedDuplicate
  }

  if ($expectedDuplicateValue -ne $null) {
    $isOk = $isOk -and ($duplicateValue -eq $expectedDuplicateValue)
  }

  if (-not [string]::IsNullOrWhiteSpace($ExpectedBodyContains)) {
    $isOk = $isOk -and ($Response.Body -like "*$ExpectedBodyContains*")
  }

  return [PSCustomObject]@{
    Cenario = $ScenarioId
    Descricao = $Descricao
    StatusEsperado = $ExpectedStatusCode
    StatusRecebido = $Response.StatusCode
    DuplicateEsperado = if ($expectedDuplicateValue -eq $null) { '-' } else { [string]$expectedDuplicateValue }
    DuplicateRecebido = if ($duplicateValue -eq $null) { '-' } else { [string]$duplicateValue }
    Resultado = if ($isOk) { 'PASS' } else { 'FAIL' }
    EventId = $Response.EventId
    ReferenciaGateway = $Response.ReferenciaGateway
    Body = $Response.Body
  }
}

Write-Host ''
Write-Host '===============================================' -ForegroundColor Cyan
Write-Host ' AP-301 - TESTE ASSISTIDO DE HOMOLOGACAO WEBHOOK' -ForegroundColor Cyan
Write-Host '===============================================' -ForegroundColor Cyan
Write-Host "Endpoint: $baseEndpoint"
Write-Host "RunId: $runId"
Write-Host ''

$eventC1 = "ap301-$runId-c1"
$eventC3 = "ap301-$runId-c3"
$eventC4 = "ap301-$runId-c4"
$eventC5 = "ap301-$runId-c5"

$payloadC1 = @{
  eventId = $eventC1
  referenciaGateway = $ReferenciaGatewayAprovado
  status = 'approved'
  amount = 100
  fee = 0
  method = 'pix'
}

$payloadC4 = @{
  eventId = $eventC4
  referenciaGateway = $ReferenciaGatewayRejeitado
  status = 'rejected'
  amount = 100
  fee = 0
  method = 'pix'
}

$payloadC3 = @{
  eventId = $eventC3
  referenciaGateway = "$ReferenciaGatewayAprovado-invalid-signature"
  status = 'approved'
  amount = 100
  fee = 0
  method = 'pix'
}

$payloadC5 = @{
  eventId = $eventC5
  status = 'approved'
  amount = 50
  fee = 0
  method = 'pix'
}

$r1 = Invoke-WebhookRequest -Url $baseEndpoint -Payload $payloadC1 -Secret $WebhookSecret
$r2 = Invoke-WebhookRequest -Url $baseEndpoint -Payload $payloadC1 -Secret $WebhookSecret
$r3 = Invoke-WebhookRequest -Url $baseEndpoint -Payload $payloadC3 -Secret $WebhookSecret -TamperSignature $true
$r4 = Invoke-WebhookRequest -Url $baseEndpoint -Payload $payloadC4 -Secret $WebhookSecret
$r5 = Invoke-WebhookRequest -Url $baseEndpoint -Payload $payloadC5 -Secret $WebhookSecret

$results = @(
  Evaluate-Scenario -ScenarioId 'C1' -Descricao 'Evento valido aprovado' -Response $r1 -ExpectedStatusCode 200 -ExpectedDuplicate $false
  Evaluate-Scenario -ScenarioId 'C2' -Descricao 'Evento duplicado' -Response $r2 -ExpectedStatusCode 200 -ExpectedDuplicate $true
  Evaluate-Scenario -ScenarioId 'C3' -Descricao 'Assinatura invalida' -Response $r3 -ExpectedStatusCode 401 -ExpectedDuplicate $null -ExpectedBodyContains 'Assinatura invalida'
  Evaluate-Scenario -ScenarioId 'C4' -Descricao 'Evento de rejeicao' -Response $r4 -ExpectedStatusCode 200 -ExpectedDuplicate $false
  Evaluate-Scenario -ScenarioId 'C5' -Descricao 'Falha controlada (payload sem referencia)' -Response $r5 -ExpectedStatusCode 500 -ExpectedDuplicate $null -ExpectedBodyContains 'referencia'
)

$results | Format-Table -AutoSize Cenario, Resultado, StatusEsperado, StatusRecebido, DuplicateEsperado, DuplicateRecebido, EventId, ReferenciaGateway

$total = $results.Count
$pass = ($results | Where-Object { $_.Resultado -eq 'PASS' }).Count
$fail = $total - $pass

Write-Host ''
Write-Host "Resumo: PASS=$pass FAIL=$fail TOTAL=$total"
Write-Host ''

$sqlEvidence = @{}
if ($ColetarEvidenciasSql) {
  $resolvedContainer = Resolve-PostgresContainerName -PreferredName $PostgresContainer
  $eventIds = @($eventC1, $eventC3, $eventC4, $eventC5) | Where-Object { -not [string]::IsNullOrWhiteSpace($_) }
  $referencias = @($ReferenciaGatewayAprovado, $ReferenciaGatewayRejeitado) | Select-Object -Unique
  $refsSql = ($referencias | ForEach-Object { Escape-SqlLiteral -Value $_ }) -join ', '
  $eventsSql = ($eventIds | ForEach-Object { Escape-SqlLiteral -Value $_ }) -join ', '

  if ([string]::IsNullOrWhiteSpace($resolvedContainer)) {
    Write-Host 'Aviso: nao foi possivel detectar container Postgres para coleta de evidencias SQL.' -ForegroundColor Yellow
    $sqlEvidence['_erro'] = 'Container Postgres nao encontrado.'
  } else {
    Write-Host "Coletando evidencias SQL no container: $resolvedContainer"

    $querySpecs = @(
      @{
        Nome = 'webhooks_gateway_eventos'
        Queries = @(@"
SELECT id, gateway, idempotency_key, event_id, status, referencia_gateway, erro, processado_em, created_at
FROM webhooks_gateway_eventos
WHERE empresa_id = $(Escape-SqlLiteral -Value $EmpresaId)
  AND (event_id IN ($eventsSql) OR idempotency_key IN ($eventsSql))
ORDER BY created_at DESC;
"@)
      }
      @{
        Nome = 'transacoes_gateway_pagamento'
        Queries = @(@"
SELECT id, referencia_gateway, status, tipo_operacao, origem, processado_em, updated_at
FROM transacoes_gateway_pagamento
WHERE empresa_id = $(Escape-SqlLiteral -Value $EmpresaId)
  AND referencia_gateway IN ($refsSql)
ORDER BY updated_at DESC;
"@)
      }
      @{
        Nome = 'pagamentos'
        Queries = @(
@"
SELECT id, empresa_id, status, gateway, tipo, valor
FROM pagamentos
WHERE empresa_id = $(Escape-SqlLiteral -Value $EmpresaId)
LIMIT 20;
"@,
@"
SELECT id, empresa_id, status, gateway, tipo, valor
FROM pagamentos
WHERE empresa_id = $(Escape-SqlLiteral -Value $EmpresaId)
LIMIT 20;
"@
        )
      }
      @{
        Nome = 'faturas_relacionadas'
        Queries = @(
@"
SELECT id, empresa_id, numero, status
FROM faturas
WHERE empresa_id = $(Escape-SqlLiteral -Value $EmpresaId)
LIMIT 20;
"@,
@"
SELECT id, empresa_id, numero, status
FROM faturas
WHERE empresa_id = $(Escape-SqlLiteral -Value $EmpresaId)
LIMIT 20;
"@
        )
      }
    )

    foreach ($spec in $querySpecs) {
      $result = Invoke-PsqlQueryWithFallback `
        -Container $resolvedContainer `
        -User $PostgresUser `
        -Database $PostgresDatabase `
        -Queries $spec.Queries

      if ($result.ExitCode -ne 0) {
        $sqlEvidence[$spec.Nome] = "ERRO (exit=$($result.ExitCode))`n$($result.Output)"
      } else {
        $sqlEvidence[$spec.Nome] = $result.Output
      }
    }
  }
}

if (-not [string]::IsNullOrWhiteSpace($OutputFile)) {
  $dir = Split-Path -Path $OutputFile -Parent
  if (-not [string]::IsNullOrWhiteSpace($dir) -and -not (Test-Path $dir)) {
    New-Item -Path $dir -ItemType Directory -Force | Out-Null
  }

  $md = @()
  $md += "# AP-301 - Resultado execucao assistida webhook"
  $md += ""
  $md += "- Data/hora: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
  $md += "- Endpoint: $baseEndpoint"
  $md += "- Gateway: $Gateway"
  $md += "- EmpresaId: $EmpresaId"
  $md += "- RunId: $runId"
  $md += ""
  $md += "| Cenario | Resultado | HTTP esperado | HTTP recebido | duplicate esperado | duplicate recebido | eventId | referenciaGateway |"
  $md += "| --- | --- | --- | --- | --- | --- | --- | --- |"

  foreach ($item in $results) {
    $md += "| $($item.Cenario) | $($item.Resultado) | $($item.StatusEsperado) | $($item.StatusRecebido) | $($item.DuplicateEsperado) | $($item.DuplicateRecebido) | $($item.EventId) | $($item.ReferenciaGateway) |"
  }

  $md += ""
  $md += "## Payloads/Respostas"
  $md += ""
  foreach ($item in $results) {
    $md += "### $($item.Cenario) - $($item.Descricao)"
    $md += ""
    $md += '```json'
    $md += $item.Body
    $md += '```'
    $md += ""
  }

  if ($ColetarEvidenciasSql) {
    $md += "## Evidencias SQL automaticas"
    $md += ""
    if ($sqlEvidence.ContainsKey('_erro')) {
      $md += $sqlEvidence['_erro']
      $md += ""
    } else {
      foreach ($tableName in @('webhooks_gateway_eventos', 'transacoes_gateway_pagamento', 'pagamentos', 'faturas_relacionadas')) {
        if (-not $sqlEvidence.ContainsKey($tableName)) { continue }
        $md += "### $tableName"
        $md += ""
        $md += '```text'
        $md += $sqlEvidence[$tableName]
        $md += '```'
        $md += ""
      }
    }
  }

  Set-Content -Path $OutputFile -Value $md -Encoding UTF8
  Write-Host "Evidencia salva em: $OutputFile"
}

if ($fail -gt 0) {
  exit 1
}

exit 0
