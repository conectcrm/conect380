param(
  [string]$RunDir = "",
  [string]$BackendBaseUrl = "http://localhost:3001",
  [string[]]$PasswordCandidates = @("admin123", "123456", "senha123"),
  [switch]$ProvisionMissingUsers,
  [string]$ProvisionUserPassword = "admin123",
  [string]$Responsavel = "time-oncall",
  [string]$DbContainerName = "conectcrm-postgres",
  [string]$DbUser = "conectcrm",
  [string]$DbName = "conectcrm_db",
  [switch]$SkipCoverageCheck
)

$ErrorActionPreference = "Stop"
$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
$pilotRoot = Join-Path $repoRoot ".production\pilot-runs"
$recordFunctionalScript = Join-Path $PSScriptRoot "record-mvp-pilot-functional-result.ps1"
$coverageScript = Join-Path $PSScriptRoot "check-mvp-pilot-functional-coverage.ps1"

function Resolve-RunDir {
  param(
    [string]$ProvidedRunDir
  )

  if (-not [string]::IsNullOrWhiteSpace($ProvidedRunDir)) {
    if (-not (Test-Path $ProvidedRunDir)) {
      throw "RunDir nao encontrado: $ProvidedRunDir"
    }
    return (Resolve-Path $ProvidedRunDir).Path
  }

  if (-not (Test-Path $pilotRoot)) {
    throw "Nenhuma pasta de piloto encontrada em $pilotRoot."
  }

  $latest = Get-ChildItem $pilotRoot -Directory | Sort-Object LastWriteTime -Descending | Select-Object -First 1
  if ($null -eq $latest) {
    throw "Nenhuma sessao de piloto encontrada em $pilotRoot."
  }

  return $latest.FullName
}

function Is-NotBlank {
  param(
    [string]$Value
  )

  return -not [string]::IsNullOrWhiteSpace($Value)
}

function Get-ObjectValue {
  param(
    [object]$Object,
    [string]$Name
  )

  if ($null -eq $Object) {
    return $null
  }

  $property = $Object.PSObject.Properties[$Name]
  if ($null -eq $property) {
    return $null
  }

  return $property.Value
}

function Get-EmailFromContactField {
  param(
    [string]$ContactField
  )

  if (-not (Is-NotBlank $ContactField)) {
    return ""
  }

  $value = $ContactField.Trim()
  if ($value -match "<([^>]+)>") {
    return $matches[1].Trim().ToLowerInvariant()
  }

  if ($value -match "^[^@\s]+@[^@\s]+\.[^@\s]+$") {
    return $value.ToLowerInvariant()
  }

  return ""
}

function Get-JwtPayload {
  param(
    [string]$Token
  )

  if (-not (Is-NotBlank $Token)) {
    return $null
  }

  $parts = $Token.Split(".")
  if ($parts.Count -lt 2) {
    return $null
  }

  $payload = $parts[1].Replace("-", "+").Replace("_", "/")
  switch ($payload.Length % 4) {
    2 { $payload += "==" }
    3 { $payload += "=" }
    1 { $payload += "===" }
  }

  try {
    $json = [System.Text.Encoding]::UTF8.GetString([Convert]::FromBase64String($payload))
    return $json | ConvertFrom-Json
  }
  catch {
    return $null
  }
}

function Invoke-JsonRequest {
  param(
    [string]$Method,
    [string]$Path,
    [string]$Token = "",
    [object]$Body = $null
  )

  $uri = "$BackendBaseUrl$Path"
  $headers = @{}
  if (Is-NotBlank $Token) {
    $headers["Authorization"] = "Bearer $Token"
  }

  $payload = $null
  if ($null -ne $Body) {
    $payload = $Body | ConvertTo-Json -Depth 12
  }

  $requestParams = @{ Uri = $uri; Method = $Method; Headers = $headers; ErrorAction = "Stop" }
  if ($null -ne $payload) {
    $requestParams["ContentType"] = "application/json"
    $requestParams["Body"] = $payload
  }

  try {
    $responseData = Invoke-RestMethod @requestParams
    $rawContent = ""
    if ($null -ne $responseData) {
      try {
        $rawContent = $responseData | ConvertTo-Json -Depth 25 -Compress
      }
      catch {
        $rawContent = ""
      }
    }

    return [pscustomobject]@{
      StatusCode = 200
      Data = $responseData
      Raw = $rawContent
      Error = ""
    }
  }
  catch {
    $statusCode = 0
    if ($null -ne $_.Exception.Response) {
      try {
        $statusCode = [int]$_.Exception.Response.StatusCode
      }
      catch {
        $statusCode = 0
      }
    }

    $rawContent = ""
    if (Is-NotBlank $_.ErrorDetails.Message) {
      $rawContent = $_.ErrorDetails.Message
    }
    elseif ($null -ne $_.Exception.Response) {
      try {
        $stream = $_.Exception.Response.GetResponseStream()
        if ($null -ne $stream) {
          $reader = New-Object System.IO.StreamReader($stream)
          $rawContent = $reader.ReadToEnd()
          $reader.Dispose()
          $stream.Dispose()
        }
      }
      catch {
        $rawContent = ""
      }
    }

    $contentObject = $null
    if (Is-NotBlank $rawContent) {
      try {
        $contentObject = $rawContent | ConvertFrom-Json -Depth 25
      }
      catch {
        $contentObject = $null
      }
    }

    return [pscustomobject]@{
      StatusCode = $statusCode
      Data = $contentObject
      Raw = $rawContent
      Error = $_.Exception.Message
    }
  }
}

function Invoke-DbQueryLines {
  param(
    [string]$Sql
  )

  $lines = @(& docker exec $DbContainerName psql -U $DbUser -d $DbName -t -A -F "|" -c $Sql 2>$null)
  if ($LASTEXITCODE -ne 0) {
    throw "Falha ao executar query no banco via docker exec."
  }

  return @($lines | ForEach-Object { "$_".Trim() } | Where-Object { Is-NotBlank $_ })
}

function Get-CredentialMap {
  param(
    [string[]]$EmpresaIds
  )

  $map = @{}
  if ($EmpresaIds.Count -eq 0) {
    return $map
  }

  $quotedIds = $EmpresaIds | ForEach-Object { "'$($_.Replace("'", "''"))'" }
  $idSql = $quotedIds -join ","

  $caseParts = @()
  foreach ($password in $PasswordCandidates) {
    $pwdEscaped = $password.Replace("'", "''")
    $caseParts += "WHEN senha = crypt('$pwdEscaped', senha) THEN '$pwdEscaped'"
  }
  $caseSql = $caseParts -join " "

  $sql = @"
select empresa_id, email,
  case
    $caseSql
    else null
  end as senha_match
from users
where ativo = true
  and empresa_id in ($idSql)
order by empresa_id, email;
"@

  $rows = Invoke-DbQueryLines -Sql $sql
  foreach ($row in $rows) {
    $parts = $row.Split("|")
    if ($parts.Count -lt 3) {
      continue
    }

    $empresaId = $parts[0].Trim()
    $email = $parts[1].Trim().ToLowerInvariant()
    $password = $parts[2].Trim()
    if (-not (Is-NotBlank $empresaId) -or -not (Is-NotBlank $email) -or -not (Is-NotBlank $password)) {
      continue
    }

    if (-not $map.ContainsKey($empresaId)) {
      $map[$empresaId] = @()
    }

    $map[$empresaId] += [pscustomobject]@{
      email = $email
      password = $password
      source = "db-hash-match"
    }
  }

  return $map
}

function Ensure-ProvisionedUser {
  param(
    [string]$EmpresaId,
    [string]$ClientName
  )

  $companyToken = $EmpresaId.Substring(0, 8).ToLowerInvariant()
  $email = "pilot.$companyToken@conectcrm.local"
  $nameSafe = ("Piloto MVP " + $ClientName).Replace("'", "''")
  $emailSafe = $email.Replace("'", "''")
  $passwordSafe = $ProvisionUserPassword.Replace("'", "''")
  $empresaSafe = $EmpresaId.Replace("'", "''")
  $userId = [guid]::NewGuid().ToString()

  $sql = @"
update users
set
  empresa_id = '$empresaSafe',
  senha = crypt('$passwordSafe', gen_salt('bf')),
  role = 'admin',
  ativo = true,
  updated_at = now(),
  atualizado_em = now()
where lower(email) = lower('$emailSafe');

insert into users (id, nome, email, senha, empresa_id, role, ativo)
select '$userId', '$nameSafe', '$emailSafe', crypt('$passwordSafe', gen_salt('bf')), '$empresaSafe', 'admin', true
where not exists (
  select 1
  from users
  where lower(email) = lower('$emailSafe')
);
"@

  $null = Invoke-DbQueryLines -Sql $sql

  return [pscustomobject]@{
    email = $email
    password = $ProvisionUserPassword
    source = "provisioned"
  }
}

function Resolve-ClientCredential {
  param(
    [pscustomobject]$ClientRow,
    [hashtable]$CredentialMap
  )

  $empresaId = $ClientRow.empresa_id
  $candidates = @()

  $contactTechEmail = Get-EmailFromContactField -ContactField $ClientRow.contato_tecnico
  $contactBusinessEmail = Get-EmailFromContactField -ContactField $ClientRow.contato_negocio
  if (Is-NotBlank $contactTechEmail) {
    $candidates += $contactTechEmail
  }
  if (Is-NotBlank $contactBusinessEmail) {
    $candidates += $contactBusinessEmail
  }

  $credentialRows = @()
  if ($CredentialMap.ContainsKey($empresaId)) {
    $credentialRows = @($CredentialMap[$empresaId])
  }

  foreach ($row in $credentialRows) {
    if (Is-NotBlank $row.email -and ($candidates -notcontains $row.email)) {
      $candidates += $row.email
    }
  }

  $orderedCredentials = @()
  foreach ($email in $candidates) {
    $matched = $credentialRows | Where-Object { $_.email -eq $email } | Select-Object -First 1
    if ($null -ne $matched) {
      $orderedCredentials += $matched
    }
  }

  foreach ($row in $credentialRows) {
    if ($orderedCredentials -notcontains $row) {
      $orderedCredentials += $row
    }
  }

  foreach ($credential in $orderedCredentials) {
    $login = Invoke-JsonRequest -Method "POST" -Path "/auth/login" -Body @{
      email = $credential.email
      senha = $credential.password
    }

    if ($login.StatusCode -notin @(200, 201)) {
      continue
    }

    $token = Get-ObjectValue -Object (Get-ObjectValue -Object $login.Data -Name "data") -Name "access_token"
    if (-not (Is-NotBlank $token)) {
      $token = Get-ObjectValue -Object $login.Data -Name "access_token"
    }
    if (-not (Is-NotBlank $token)) {
      continue
    }

    $payload = Get-JwtPayload -Token $token
    $tokenEmpresaId = Get-ObjectValue -Object $payload -Name "empresa_id"
    $userId = Get-ObjectValue -Object $payload -Name "sub"

    if ($tokenEmpresaId -ne $empresaId) {
      continue
    }

    return [pscustomobject]@{
      email = $credential.email
      password = $credential.password
      token = $token
      empresa_id = $tokenEmpresaId
      user_id = $userId
      source = $credential.source
    }
  }

  if ($ProvisionMissingUsers) {
    $provisioned = Ensure-ProvisionedUser -EmpresaId $empresaId -ClientName $ClientRow.cliente

    $loginProvisioned = Invoke-JsonRequest -Method "POST" -Path "/auth/login" -Body @{
      email = $provisioned.email
      senha = $provisioned.password
    }

    if ($loginProvisioned.StatusCode -in @(200, 201)) {
      $token = Get-ObjectValue -Object (Get-ObjectValue -Object $loginProvisioned.Data -Name "data") -Name "access_token"
      if (-not (Is-NotBlank $token)) {
        $token = Get-ObjectValue -Object $loginProvisioned.Data -Name "access_token"
      }
      if (Is-NotBlank $token) {
        $payload = Get-JwtPayload -Token $token
        $tokenEmpresaId = Get-ObjectValue -Object $payload -Name "empresa_id"
        $userId = Get-ObjectValue -Object $payload -Name "sub"
        if ($tokenEmpresaId -eq $empresaId) {
          return [pscustomobject]@{
            email = $provisioned.email
            password = $provisioned.password
            token = $token
            empresa_id = $tokenEmpresaId
            user_id = $userId
            source = "provisioned"
          }
        }
      }
    }
  }

  return $null
}

function Write-ClientLog {
  param(
    [string]$Path,
    [string]$Scenario,
    [string]$Step,
    [object]$Data
  )

  $entry = [pscustomobject]@{
    timestamp = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
    scenario = $Scenario
    step = $Step
    data = $Data
  }

  Add-Content -Path $Path -Value ($entry | ConvertTo-Json -Depth 15 -Compress) -Encoding UTF8
}

function Record-FunctionalResult {
  param(
    [string]$RunPath,
    [string]$ClientName,
    [string]$ScenarioKey,
    [string]$Result,
    [string]$Evidence,
    [string]$ErrorText
  )

  & $recordFunctionalScript `
    -RunDir $RunPath `
    -Cliente $ClientName `
    -Cenario $ScenarioKey `
    -Resultado $Result `
    -Evidencia $Evidence `
    -Erro $ErrorText `
    -Responsavel $Responsavel | Out-Null
}

function Test-SuccessStatus {
  param(
    [int]$StatusCode
  )

  return $StatusCode -ge 200 -and $StatusCode -lt 300
}

$RunDir = Resolve-RunDir -ProvidedRunDir $RunDir
$clientsPath = Join-Path $RunDir "clients.csv"
if (-not (Test-Path $clientsPath)) {
  throw "Arquivo clients.csv nao encontrado em $RunDir."
}

if (-not (Test-Path $recordFunctionalScript)) {
  throw "Script de registro funcional nao encontrado: $recordFunctionalScript"
}

$clients = @(Import-Csv $clientsPath)
$clientRows = @($clients | Where-Object { Is-NotBlank $_.empresa_id -and $_.status -eq "SUGERIDO" })
if ($clientRows.Count -eq 0) {
  throw "Nenhum cliente SUGERIDO encontrado para execucao funcional."
}

$cycleId = Get-Date -Format "yyyyMMdd-HHmmss"
$cycleDir = Join-Path (Join-Path $RunDir "functional-cycles") $cycleId
New-Item -ItemType Directory -Path $cycleDir -Force | Out-Null

$empresaIds = @($clientRows | ForEach-Object { $_.empresa_id } | Sort-Object -Unique)
$credentialMap = Get-CredentialMap -EmpresaIds $empresaIds

$scenarioStats = @()

foreach ($client in $clientRows) {
  $clientName = $client.cliente
  $empresaId = $client.empresa_id
  $clientSlug = ($clientName.ToLower() -replace "[^a-z0-9]+", "-").Trim("-")
  if (-not (Is-NotBlank $clientSlug)) {
    $clientSlug = $empresaId.Substring(0, 8)
  }
  $clientLogPath = Join-Path $cycleDir "$clientSlug.jsonl"

  Write-Host ""
  Write-Host "Cliente: $clientName ($empresaId)"

  $credential = Resolve-ClientCredential -ClientRow $client -CredentialMap $credentialMap
  if ($null -eq $credential) {
    Write-Host " - Sem credencial valida. Marcando cenarios como BLOCKED."

    foreach ($scenarioKey in @("LoginContexto", "CriacaoLead", "MovimentarPipeline", "Proposta", "AtendimentoTicket")) {
      Record-FunctionalResult -RunPath $RunDir -ClientName $clientName -ScenarioKey $scenarioKey -Result "BLOCKED" -Evidence $clientLogPath -ErrorText "Credencial nao encontrada para empresa_id=$empresaId"
      $scenarioStats += [pscustomobject]@{ cliente = $clientName; cenario = $scenarioKey; resultado = "BLOCKED" }
    }

    continue
  }

  Write-Host " - Credencial valida: $($credential.email) [$($credential.source)]"
  Write-ClientLog -Path $clientLogPath -Scenario "Credencial" -Step "resolved" -Data @{
    email = $credential.email
    source = $credential.source
  }

  $token = $credential.token
  $userId = $credential.user_id

  # 1) Login e contexto da empresa
  $scenario = "LoginContexto"
  $switchResp = Invoke-JsonRequest -Method "POST" -Path "/minhas-empresas/switch" -Token $token -Body @{ empresaId = $empresaId }
  Write-ClientLog -Path $clientLogPath -Scenario $scenario -Step "switch" -Data $switchResp

  if ((Test-SuccessStatus -StatusCode $switchResp.StatusCode) -and ((Get-ObjectValue -Object $switchResp.Data -Name "empresaId") -eq $empresaId)) {
    Record-FunctionalResult -RunPath $RunDir -ClientName $clientName -ScenarioKey $scenario -Result "PASS" -Evidence $clientLogPath -ErrorText ""
    $scenarioStats += [pscustomobject]@{ cliente = $clientName; cenario = $scenario; resultado = "PASS" }
  }
  else {
    $errorText = "Falha ao confirmar contexto da empresa (status=$($switchResp.StatusCode))."
    Record-FunctionalResult -RunPath $RunDir -ClientName $clientName -ScenarioKey $scenario -Result "FAIL" -Evidence $clientLogPath -ErrorText $errorText
    $scenarioStats += [pscustomobject]@{ cliente = $clientName; cenario = $scenario; resultado = "FAIL" }
  }

  # 2) Criacao de lead
  $scenario = "CriacaoLead"
  $leadBody = @{
    nome = "Lead Piloto $($clientName) $(Get-Date -Format 'HHmmss')"
    email = "lead.$($clientSlug).$(Get-Date -Format 'HHmmss')@conectcrm.local"
    telefone = "+55119$(Get-Random -Minimum 10000000 -Maximum 99999999)"
    empresa_nome = $clientName
    origem = "manual"
    observacoes = "execucao automatizada piloto mvp"
  }
  $leadResp = Invoke-JsonRequest -Method "POST" -Path "/leads" -Token $token -Body $leadBody
  Write-ClientLog -Path $clientLogPath -Scenario $scenario -Step "create-lead" -Data $leadResp

  $leadId = Get-ObjectValue -Object $leadResp.Data -Name "id"
  if (-not (Is-NotBlank $leadId)) {
    $leadData = Get-ObjectValue -Object $leadResp.Data -Name "data"
    $leadId = Get-ObjectValue -Object $leadData -Name "id"
  }

  if ((Test-SuccessStatus -StatusCode $leadResp.StatusCode) -and (Is-NotBlank $leadId)) {
    Record-FunctionalResult -RunPath $RunDir -ClientName $clientName -ScenarioKey $scenario -Result "PASS" -Evidence $clientLogPath -ErrorText ""
    $scenarioStats += [pscustomobject]@{ cliente = $clientName; cenario = $scenario; resultado = "PASS" }
  }
  else {
    $errorText = "Falha ao criar lead (status=$($leadResp.StatusCode))."
    Record-FunctionalResult -RunPath $RunDir -ClientName $clientName -ScenarioKey $scenario -Result "FAIL" -Evidence $clientLogPath -ErrorText $errorText
    $scenarioStats += [pscustomobject]@{ cliente = $clientName; cenario = $scenario; resultado = "FAIL" }
  }

  # 3) Movimentar pipeline
  $scenario = "MovimentarPipeline"
  $leadMoveResp = $null
  $leadMoveStatus = ""
  if (Is-NotBlank "$leadId") {
    $leadMoveResp = Invoke-JsonRequest -Method "PATCH" -Path "/leads/$leadId" -Token $token -Body @{
      status = "qualificado"
      observacoes = "movimentacao automatizada do pipeline MVP"
    }
    Write-ClientLog -Path $clientLogPath -Scenario $scenario -Step "move-lead-status" -Data $leadMoveResp

    $leadMoveStatus = Get-ObjectValue -Object $leadMoveResp.Data -Name "status"
    if (-not (Is-NotBlank "$leadMoveStatus")) {
      $leadMoveStatus = Get-ObjectValue -Object (Get-ObjectValue -Object $leadMoveResp.Data -Name "data") -Name "status"
    }
  }

  if ($null -ne $leadMoveResp -and (Test-SuccessStatus -StatusCode $leadMoveResp.StatusCode) -and ($leadMoveStatus -eq "qualificado")) {
    Record-FunctionalResult -RunPath $RunDir -ClientName $clientName -ScenarioKey $scenario -Result "PASS" -Evidence $clientLogPath -ErrorText ""
    $scenarioStats += [pscustomobject]@{ cliente = $clientName; cenario = $scenario; resultado = "PASS" }
  }
  else {
    $errorText = "Falha ao movimentar pipeline via lead (update=$(if ($null -eq $leadMoveResp) { 'N/A' } else { $leadMoveResp.StatusCode }), status=$(if ([string]::IsNullOrWhiteSpace($leadMoveStatus)) { 'N/A' } else { $leadMoveStatus }))."
    Record-FunctionalResult -RunPath $RunDir -ClientName $clientName -ScenarioKey $scenario -Result "FAIL" -Evidence $clientLogPath -ErrorText $errorText
    $scenarioStats += [pscustomobject]@{ cliente = $clientName; cenario = $scenario; resultado = "FAIL" }
  }

  # 4) Criar e consultar proposta
  $scenario = "Proposta"
  $proposalBody = @{
    titulo = "Proposta Piloto $($clientName) $(Get-Date -Format 'HHmmss')"
    cliente = $clientName
    valor = 2000
    total = 2000
    source = "pilot-functional-auto"
    observacoes = "execucao automatizada"
  }
  $proposalCreateResp = Invoke-JsonRequest -Method "POST" -Path "/propostas" -Token $token -Body $proposalBody
  Write-ClientLog -Path $clientLogPath -Scenario $scenario -Step "create-proposta" -Data $proposalCreateResp

  $proposalId = Get-ObjectValue -Object (Get-ObjectValue -Object $proposalCreateResp.Data -Name "proposta") -Name "id"
  if (-not (Is-NotBlank "$proposalId")) {
    $proposalId = Get-ObjectValue -Object $proposalCreateResp.Data -Name "id"
  }

  $proposalGetResp = $null
  if (Is-NotBlank "$proposalId") {
    $proposalGetResp = Invoke-JsonRequest -Method "GET" -Path "/propostas/$proposalId" -Token $token
    Write-ClientLog -Path $clientLogPath -Scenario $scenario -Step "get-proposta" -Data $proposalGetResp
  }

  if ((Test-SuccessStatus -StatusCode $proposalCreateResp.StatusCode) -and (Is-NotBlank "$proposalId") -and $null -ne $proposalGetResp -and (Test-SuccessStatus -StatusCode $proposalGetResp.StatusCode)) {
    Record-FunctionalResult -RunPath $RunDir -ClientName $clientName -ScenarioKey $scenario -Result "PASS" -Evidence $clientLogPath -ErrorText ""
    $scenarioStats += [pscustomobject]@{ cliente = $clientName; cenario = $scenario; resultado = "PASS" }
  }
  else {
    $errorText = "Falha no fluxo de proposta (create=$($proposalCreateResp.StatusCode), get=$(if ($null -eq $proposalGetResp) { 'N/A' } else { $proposalGetResp.StatusCode }))."
    Record-FunctionalResult -RunPath $RunDir -ClientName $clientName -ScenarioKey $scenario -Result "FAIL" -Evidence $clientLogPath -ErrorText $errorText
    $scenarioStats += [pscustomobject]@{ cliente = $clientName; cenario = $scenario; resultado = "FAIL" }
  }

  # 5) Abrir ticket, responder e alterar status
  $scenario = "AtendimentoTicket"
  $ticketBody = @{
    clienteNumero = "+55119$(Get-Random -Minimum 10000000 -Maximum 99999999)"
    clienteNome = $clientName
    assunto = "Ticket piloto $($clientName) $(Get-Date -Format 'HHmmss')"
    prioridade = "MEDIA"
    tipo = "suporte"
    descricao = "Ticket gerado automaticamente para validacao MVP"
  }
  $ticketCreateResp = Invoke-JsonRequest -Method "POST" -Path "/api/atendimento/tickets" -Token $token -Body $ticketBody
  Write-ClientLog -Path $clientLogPath -Scenario $scenario -Step "create-ticket" -Data $ticketCreateResp

  $ticketId = Get-ObjectValue -Object (Get-ObjectValue -Object $ticketCreateResp.Data -Name "data") -Name "id"
  if (-not (Is-NotBlank "$ticketId")) {
    $ticketId = Get-ObjectValue -Object $ticketCreateResp.Data -Name "id"
  }

  $messageResp = $null
  $statusResp = $null
  if (Is-NotBlank "$ticketId") {
    $messageResp = Invoke-JsonRequest -Method "POST" -Path "/api/atendimento/tickets/$ticketId/mensagens" -Token $token -Body @{
      conteudo = "Mensagem automatizada de validacao do piloto."
      tipoRemetente = "ATENDENTE"
    }
    Write-ClientLog -Path $clientLogPath -Scenario $scenario -Step "send-message" -Data $messageResp

    $statusResp = Invoke-JsonRequest -Method "PATCH" -Path "/api/atendimento/tickets/$ticketId/status" -Token $token -Body @{
      status = "EM_ATENDIMENTO"
    }
    Write-ClientLog -Path $clientLogPath -Scenario $scenario -Step "update-status" -Data $statusResp
  }

  if ((Test-SuccessStatus -StatusCode $ticketCreateResp.StatusCode) -and (Is-NotBlank "$ticketId") -and $null -ne $messageResp -and (Test-SuccessStatus -StatusCode $messageResp.StatusCode) -and $null -ne $statusResp -and (Test-SuccessStatus -StatusCode $statusResp.StatusCode)) {
    Record-FunctionalResult -RunPath $RunDir -ClientName $clientName -ScenarioKey $scenario -Result "PASS" -Evidence $clientLogPath -ErrorText ""
    $scenarioStats += [pscustomobject]@{ cliente = $clientName; cenario = $scenario; resultado = "PASS" }
  }
  else {
    $errorText = "Falha no fluxo de atendimento (create=$($ticketCreateResp.StatusCode), msg=$(if ($null -eq $messageResp) { 'N/A' } else { $messageResp.StatusCode }), status=$(if ($null -eq $statusResp) { 'N/A' } else { $statusResp.StatusCode }))."
    Record-FunctionalResult -RunPath $RunDir -ClientName $clientName -ScenarioKey $scenario -Result "FAIL" -Evidence $clientLogPath -ErrorText $errorText
    $scenarioStats += [pscustomobject]@{ cliente = $clientName; cenario = $scenario; resultado = "FAIL" }
  }
}

$total = @($scenarioStats).Count
$pass = @($scenarioStats | Where-Object { $_.resultado -eq "PASS" }).Count
$fail = @($scenarioStats | Where-Object { $_.resultado -eq "FAIL" }).Count
$blocked = @($scenarioStats | Where-Object { $_.resultado -eq "BLOCKED" }).Count

$summaryPath = Join-Path $cycleDir "summary.md"
$table = $scenarioStats | Sort-Object cliente, cenario | Format-Table -AutoSize | Out-String
$summary = @"
# MVP Pilot Functional Scenario Run

Data: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
Sessao: $RunDir
Cycle ID: $cycleId

## Resultado
- Total cenarios: $total
- PASS: $pass
- FAIL: $fail
- BLOCKED: $blocked
- Logs por cliente: $cycleDir

## Detalhamento
$table
"@
Set-Content -Path $summaryPath -Value $summary -Encoding UTF8

Write-Host ""
Write-Host "Functional scenario run summary: $summaryPath"
Write-Host "PASS=$pass FAIL=$fail BLOCKED=$blocked TOTAL=$total"

if (-not $SkipCoverageCheck) {
  try {
    & $coverageScript -RunDir $RunDir | Out-Null
  }
  catch {
    # O script de coverage pode retornar exit 1 quando houver gaps.
  }
}

if ($fail -gt 0 -or $blocked -gt 0) {
  exit 1
}

exit 0
