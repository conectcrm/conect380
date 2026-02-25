param(
  [string]$BaseUrl = "http://localhost:3001",
  [string]$AdminEmail = "admin@conectsuite.com.br",
  [string]$AdminPassword = "admin123",
  [string]$ManagerEmail = "mvp.manager.dashboard@conectsuite.com.br",
  [string]$VendedorEmail = "mvp.vendedor.dashboard@conectsuite.com.br",
  [string]$UserEmail = "mvp.user.dashboard@conectsuite.com.br",
  [string]$DefaultPassword = "Mvp#2026Pass!"
)

$ErrorActionPreference = "Stop"
$results = @()

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

function Invoke-JsonRequest {
  param(
    [ValidateSet("GET", "POST", "PUT", "PATCH", "DELETE")]
    [string]$Method,
    [string]$Url,
    [string]$Token,
    $Body
  )

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
    $params["Body"] = ($Body | ConvertTo-Json -Depth 20)
  }

  try {
    return Invoke-RestMethod @params
  }
  catch {
    $statusCode = $null
    $responseBody = $null

    if ($_.Exception.Response) {
      try {
        $statusCode = [int]$_.Exception.Response.StatusCode
      }
      catch {}

      try {
        $stream = $_.Exception.Response.GetResponseStream()
        if ($stream) {
          $reader = New-Object System.IO.StreamReader($stream)
          $responseBody = $reader.ReadToEnd()
          $reader.Dispose()
        }
      }
      catch {}
    }

    if ($statusCode) {
      throw "HTTP $statusCode em $Method $Url. $responseBody"
    }

    throw
  }
}

function Login {
  param(
    [string]$ApiBaseUrl,
    [string]$Email,
    [string]$Password
  )

  $response = Invoke-JsonRequest -Method "POST" -Url "$ApiBaseUrl/auth/login" -Body @{
    email = $Email
    senha = $Password
  }

  if (-not $response.success) {
    throw "Login sem sucesso para $Email. action=$($response.action) message=$($response.message)"
  }

  return [pscustomobject]@{
    Token = $response.data.access_token
    User = $response.data.user
  }
}

function Get-Users {
  param(
    [string]$ApiBaseUrl,
    [string]$AdminToken
  )

  $response = Invoke-JsonRequest -Method "GET" -Url "$ApiBaseUrl/users?pagina=1&limite=200" -Token $AdminToken
  return @($response.data.items)
}

function Ensure-TestUser {
  param(
    [string]$ApiBaseUrl,
    [string]$AdminToken,
    [string]$Role,
    [string]$Email,
    [string]$Nome,
    [string]$KnownPassword,
    [ref]$UsersCache
  )

  $existing = $UsersCache.Value | Where-Object { $_.email -eq $Email } | Select-Object -First 1

  if ($null -eq $existing) {
    $createResponse = $null
    $emailToCreate = $Email

    for ($attempt = 1; $attempt -le 3; $attempt++) {
      try {
        $createResponse = Invoke-JsonRequest -Method "POST" -Url "$ApiBaseUrl/users" -Token $AdminToken -Body @{
          nome = $Nome
          email = $emailToCreate
          senha = $KnownPassword
          role = $Role
          ativo = $true
          deve_trocar_senha = $false
        }
        break
      }
      catch {
        $message = $_.Exception.Message
        $isEmailConflict = ($message -match "email") -or ($message -match "23505") -or ($message -match "duplicate")

        if (-not $isEmailConflict -or $attempt -eq 3) {
          throw
        }

        $parts = $Email.Split("@")
        if ($parts.Count -ne 2) {
          throw
        }

        $suffix = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()
        $emailToCreate = "$($parts[0]).$suffix.$attempt@$($parts[1])"
      }
    }

    if ($null -eq $createResponse) {
      throw "Falha ao criar usuario de teste $Email."
    }

    $newUserId = $createResponse.data.id
    if (-not $newUserId) {
      throw "Criacao de usuario $emailToCreate nao retornou ID."
    }

    $UsersCache.Value = Get-Users -ApiBaseUrl $ApiBaseUrl -AdminToken $AdminToken
    $existing = $UsersCache.Value | Where-Object { $_.id -eq $newUserId } | Select-Object -First 1
    if ($null -eq $existing) {
      $existing = [pscustomobject]@{
        id = $newUserId
        email = $emailToCreate
        role = $Role
        ativo = $true
      }
    }
  }
  else {
    $updatePayload = @{}
    if ($existing.role -ne $Role) {
      $updatePayload["role"] = $Role
    }
    if ($existing.ativo -ne $true) {
      $updatePayload["ativo"] = $true
    }

    if ($updatePayload.Count -gt 0) {
      Invoke-JsonRequest -Method "PUT" -Url "$ApiBaseUrl/users/$($existing.id)" -Token $AdminToken -Body $updatePayload | Out-Null
    }

    $resetResponse = Invoke-JsonRequest -Method "PUT" -Url "$ApiBaseUrl/users/$($existing.id)/reset-senha" -Token $AdminToken
    $temporaryPassword = $resetResponse.data.novaSenha
    if (-not $temporaryPassword) {
      throw "Reset de senha para $Email nao retornou senha temporaria."
    }

    Invoke-JsonRequest -Method "POST" -Url "$ApiBaseUrl/auth/trocar-senha" -Body @{
      userId = $existing.id
      senhaAntiga = $temporaryPassword
      senhaNova = $KnownPassword
    } | Out-Null
  }

  return [pscustomobject]@{
    id = $existing.id
    email = $existing.email
    role = $Role
    nome = $Nome
  }
}

function Assert-Equals {
  param(
    [string]$Expected,
    [string]$Actual,
    [string]$Message
  )

  if ($Expected -ne $Actual) {
    throw "$Message. Esperado='$Expected', Atual='$Actual'"
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

$adminSession = $null
$users = @()
$manager = $null
$vendedor = $null
$usuario = $null
$managerSession = $null
$vendedorSession = $null
$usuarioSession = $null

Run-Step -Name "Login superadmin" -Action {
  $script:adminSession = Login -ApiBaseUrl $BaseUrl -Email $AdminEmail -Password $AdminPassword
  Assert-NotNull -Value $script:adminSession.Token -Message "Token do superadmin nao retornado."
  Write-Host "Superadmin autenticado: $($script:adminSession.User.email)"
}

Run-Step -Name "Provisionar perfis de teste (gerente, vendedor, suporte)" -Action {
  $script:users = Get-Users -ApiBaseUrl $BaseUrl -AdminToken $script:adminSession.Token

  $usersRef = [ref]$script:users
  $script:manager = Ensure-TestUser `
    -ApiBaseUrl $BaseUrl `
    -AdminToken $script:adminSession.Token `
    -Role "gerente" `
    -Email $ManagerEmail `
    -Nome "MVP Manager Dashboard" `
    -KnownPassword $DefaultPassword `
    -UsersCache $usersRef
  $script:users = $usersRef.Value

  $usersRef = [ref]$script:users
  $script:vendedor = Ensure-TestUser `
    -ApiBaseUrl $BaseUrl `
    -AdminToken $script:adminSession.Token `
    -Role "vendedor" `
    -Email $VendedorEmail `
    -Nome "MVP Vendedor Dashboard" `
    -KnownPassword $DefaultPassword `
    -UsersCache $usersRef
  $script:users = $usersRef.Value

  $usersRef = [ref]$script:users
  $script:usuario = Ensure-TestUser `
    -ApiBaseUrl $BaseUrl `
    -AdminToken $script:adminSession.Token `
    -Role "suporte" `
    -Email $UserEmail `
    -Nome "MVP User Dashboard" `
    -KnownPassword $DefaultPassword `
    -UsersCache $usersRef
  $script:users = $usersRef.Value

  Assert-NotNull -Value $script:manager.id -Message "Usuario gerente nao provisionado."
  Assert-NotNull -Value $script:vendedor.id -Message "Usuario vendedor nao provisionado."
  Assert-NotNull -Value $script:usuario.id -Message "Usuario suporte nao provisionado."
}

Run-Step -Name "Login perfis de teste" -Action {
  $script:managerSession = Login -ApiBaseUrl $BaseUrl -Email $script:manager.email -Password $DefaultPassword
  $script:vendedorSession = Login -ApiBaseUrl $BaseUrl -Email $script:vendedor.email -Password $DefaultPassword
  $script:usuarioSession = Login -ApiBaseUrl $BaseUrl -Email $script:usuario.email -Password $DefaultPassword

  Assert-Equals -Expected "gerente" -Actual "$($script:managerSession.User.role)" -Message "Role inesperado para gerente"
  Assert-Equals -Expected "vendedor" -Actual "$($script:vendedorSession.User.role)" -Message "Role inesperado para vendedor"
  Assert-Equals -Expected "suporte" -Actual "$($script:usuarioSession.User.role)" -Message "Role inesperado para suporte"
}

Run-Step -Name "Dashboard scope: superadmin pode usar filtro vendedor" -Action {
  $resumoAdmin = Invoke-JsonRequest `
    -Method "GET" `
    -Url "$BaseUrl/dashboard/resumo?periodo=mensal&vendedor=$($script:vendedor.id)" `
    -Token $script:adminSession.Token

  Assert-Equals `
    -Expected "$($script:vendedor.id)" `
    -Actual "$($resumoAdmin.metadata.vendedorId)" `
    -Message "superadmin nao recebeu escopo solicitado"
}

Run-Step -Name "Dashboard scope: gerente pode usar filtro vendedor" -Action {
  $resumoManager = Invoke-JsonRequest `
    -Method "GET" `
    -Url "$BaseUrl/dashboard/resumo?periodo=mensal&vendedor=$($script:vendedor.id)" `
    -Token $script:managerSession.Token

  Assert-Equals `
    -Expected "$($script:vendedor.id)" `
    -Actual "$($resumoManager.metadata.vendedorId)" `
    -Message "gerente nao recebeu escopo solicitado"
}

Run-Step -Name "Dashboard scope: vendedor e forzado ao proprio id" -Action {
  $resumoVendedor = Invoke-JsonRequest `
    -Method "GET" `
    -Url "$BaseUrl/dashboard/resumo?periodo=mensal&vendedor=$($script:manager.id)" `
    -Token $script:vendedorSession.Token

  Assert-Equals `
    -Expected "$($script:vendedor.id)" `
    -Actual "$($resumoVendedor.metadata.vendedorId)" `
    -Message "vendedor deveria ser restrito ao proprio id"
}

Run-Step -Name "Dashboard scope: suporte e forcado ao proprio id" -Action {
  $resumoUser = Invoke-JsonRequest `
    -Method "GET" `
    -Url "$BaseUrl/dashboard/resumo?periodo=mensal&vendedor=$($script:vendedor.id)" `
    -Token $script:usuarioSession.Token

  Assert-Equals `
    -Expected "$($script:usuario.id)" `
    -Actual "$($resumoUser.metadata.vendedorId)" `
    -Message "suporte deveria ser restrito ao proprio id"
}

Run-Step -Name "Dashboard endpoints secundarios por perfil (kpis, ranking, alertas)" -Action {
  $sessions = @(
    [pscustomobject]@{ Nome = "superadmin"; Token = $script:adminSession.Token; EsperadoScope = $script:vendedor.id; QueryScope = $script:vendedor.id },
    [pscustomobject]@{ Nome = "gerente"; Token = $script:managerSession.Token; EsperadoScope = $script:vendedor.id; QueryScope = $script:vendedor.id },
    [pscustomobject]@{ Nome = "vendedor"; Token = $script:vendedorSession.Token; EsperadoScope = $script:vendedor.id; QueryScope = $script:manager.id },
    [pscustomobject]@{ Nome = "suporte"; Token = $script:usuarioSession.Token; EsperadoScope = $script:usuario.id; QueryScope = $script:vendedor.id }
  )

  foreach ($session in $sessions) {
    $kpis = Invoke-JsonRequest `
      -Method "GET" `
      -Url "$BaseUrl/dashboard/kpis?periodo=mensal&vendedor=$($session.QueryScope)" `
      -Token $session.Token
    Assert-NotNull -Value $kpis.faturamentoTotal -Message "KPIs sem faturamentoTotal para $($session.Nome)"

    $ranking = Invoke-JsonRequest `
      -Method "GET" `
      -Url "$BaseUrl/dashboard/vendedores-ranking?periodo=mensal" `
      -Token $session.Token
    Assert-NotNull -Value $ranking -Message "Ranking nulo para $($session.Nome)"

    $alertas = Invoke-JsonRequest `
      -Method "GET" `
      -Url "$BaseUrl/dashboard/alertas" `
      -Token $session.Token
    Assert-NotNull -Value $alertas -Message "Alertas nulo para $($session.Nome)"

    $resumo = Invoke-JsonRequest `
      -Method "GET" `
      -Url "$BaseUrl/dashboard/resumo?periodo=mensal&vendedor=$($session.QueryScope)" `
      -Token $session.Token
    Assert-Equals `
      -Expected "$($session.EsperadoScope)" `
      -Actual "$($resumo.metadata.vendedorId)" `
      -Message "Escopo inconsistente no resumo para $($session.Nome)"
  }
}

Write-Host ""
Write-Host "Dashboard role smoke summary:"
$results | Format-Table -AutoSize

$failed = @($results | Where-Object { $_.Status -eq "FAIL" })
if ($failed.Count -gt 0) {
  Write-Host ""
  Write-Host "Dashboard role smoke result: FAIL"
  exit 1
}

Write-Host ""
Write-Host "Dashboard role smoke result: PASS"
exit 0
