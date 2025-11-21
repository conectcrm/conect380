# Script de Teste dos Endpoints de Filas
# Consolidação Equipe -> Fila - Validação de API

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  TESTE DE ENDPOINTS - GESTAO DE FILAS" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$baseUrl = "http://localhost:3001"

# Função para exibir resultado
function Show-Result {
  param(
    [string]$Test,
    [bool]$Success,
    [string]$Message
  )
    
  if ($Success) {
    Write-Host "[OK] " -ForegroundColor Green -NoNewline
    Write-Host "$Test"
    if ($Message) {
      Write-Host "     $Message" -ForegroundColor Gray
    }
  }
  else {
    Write-Host "[ERRO] " -ForegroundColor Red -NoNewline
    Write-Host "$Test"
    if ($Message) {
      Write-Host "     $Message" -ForegroundColor Yellow
    }
  }
}

# Função para fazer requisição HTTP
function Invoke-ApiRequest {
  param(
    [string]$Method,
    [string]$Endpoint,
    [object]$Body = $null,
    [hashtable]$Headers = @{}
  )
    
  try {
    $params = @{
      Uri         = "$baseUrl$Endpoint"
      Method      = $Method
      ContentType = "application/json"
    }
        
    # Adicionar headers se fornecidos
    if ($Headers.Count -gt 0) {
      $params.Headers = $Headers
    }
        
    if ($Body) {
      $params.Body = ($Body | ConvertTo-Json -Depth 10)
    }
        
    $response = Invoke-RestMethod @params
    return @{ Success = $true; Data = $response }
  }
  catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    $errorMessage = $_.Exception.Message
        
    return @{ 
      Success    = $false
      StatusCode = $statusCode
      Error      = $errorMessage 
    }
  }
}

# ETAPA 1: Autenticação
Write-Host "ETAPA 1: Autenticacao" -ForegroundColor Yellow
Write-Host "----------------------------------------" -ForegroundColor Gray

Write-Host ""
Write-Host "AVISO: Este script requer credenciais de admin." -ForegroundColor Yellow
Write-Host "Digite o email e senha do usuário administrador:" -ForegroundColor Yellow
Write-Host ""

$email = Read-Host "Email"
$password = Read-Host "Senha" -AsSecureString
$passwordPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
  [Runtime.InteropServices.Marshal]::SecureStringToBSTR($password)
)

$loginBody = @{
  email = $email
  senha = $passwordPlain  # Backend usa "senha" não "password"
}

Write-Host ""
Write-Host "Tentando fazer login..." -ForegroundColor Cyan

$loginResult = Invoke-ApiRequest -Method "POST" -Endpoint "/auth/login" -Body $loginBody

if (-not $loginResult.Success) {
  Show-Result -Test "Login" -Success $false -Message "Erro: $($loginResult.Error)"
  Write-Host ""
  Write-Host "Nao foi possivel autenticar. Encerrando testes." -ForegroundColor Red
  exit 1
}

$token = $loginResult.Data.access_token
Show-Result -Test "Login" -Success $true -Message "Token obtido com sucesso"

# Headers com autenticação
$authHeaders = @{
  "Authorization" = "Bearer $token"
}

Write-Host ""

# ETAPA 2: Obter empresaId
Write-Host "ETAPA 2: Obtendo empresaId" -ForegroundColor Yellow
Write-Host "----------------------------------------" -ForegroundColor Gray

$userResult = Invoke-ApiRequest -Method "GET" -Endpoint "/auth/me" -Headers $authHeaders

if (-not $userResult.Success) {
  Show-Result -Test "Obter usuario" -Success $false -Message "Erro: $($userResult.Error)"
  exit 1
}

$empresaId = $userResult.Data.empresa.id
Show-Result -Test "Obter empresaId" -Success $true -Message "empresaId: $empresaId"

Write-Host ""

# ETAPA 3: Testar GET /api/filas
Write-Host "ETAPA 3: GET /api/filas?empresaId=$empresaId" -ForegroundColor Yellow
Write-Host "----------------------------------------" -ForegroundColor Gray

$filasResult = Invoke-ApiRequest -Method "GET" -Endpoint "/filas?empresaId=$empresaId" -Headers $authHeaders

if (-not $filasResult.Success) {
  Show-Result -Test "GET /api/filas" -Success $false -Message "Erro HTTP $($filasResult.StatusCode): $($filasResult.Error)"
}
else {
  $filas = $filasResult.Data
  $totalFilas = $filas.Count
    
  Show-Result -Test "GET /api/filas" -Success $true -Message "Retornou $totalFilas fila(s)"
    
  # Verificar se as filas têm os novos campos
  $filasComNucleo = ($filas | Where-Object { $_.nucleoId }).Count
  $filasComDepartamento = ($filas | Where-Object { $_.departamentoId }).Count
  $filasComCor = ($filas | Where-Object { $_.cor }).Count
  $filasComIcone = ($filas | Where-Object { $_.icone }).Count
    
  Write-Host ""
  Write-Host "   Analise dos campos novos:" -ForegroundColor Cyan
  Write-Host "   - Filas com nucleoId: $filasComNucleo de $totalFilas" -ForegroundColor Gray
  Write-Host "   - Filas com departamentoId: $filasComDepartamento de $totalFilas" -ForegroundColor Gray
  Write-Host "   - Filas com cor: $filasComCor de $totalFilas" -ForegroundColor Gray
  Write-Host "   - Filas com icone: $filasComIcone de $totalFilas" -ForegroundColor Gray
    
  # Exibir primeiras 3 filas como exemplo
  if ($totalFilas -gt 0) {
    Write-Host ""
    Write-Host "   Exemplo de filas:" -ForegroundColor Cyan
    $filas | Select-Object -First 3 | ForEach-Object {
      Write-Host "   - ID: $($_.id)" -ForegroundColor Gray
      Write-Host "     Nome: $($_.nome)" -ForegroundColor Gray
      Write-Host "     Cor: $($_.cor)" -ForegroundColor Gray
      Write-Host "     Icone: $($_.icone)" -ForegroundColor Gray
      Write-Host "     NucleoId: $($_.nucleoId)" -ForegroundColor Gray
      Write-Host "     DepartamentoId: $($_.departamentoId)" -ForegroundColor Gray
      Write-Host ""
    }
  }
    
  # Guardar ID da primeira fila para testes seguintes
  $global:primeiraFilaId = $filas[0].id
}

Write-Host ""

# ETAPA 4: Testar GET /api/nucleos (para obter nucleoId válido)
Write-Host "ETAPA 4: GET /api/nucleos?empresaId=$empresaId" -ForegroundColor Yellow
Write-Host "----------------------------------------" -ForegroundColor Gray

$nucleosResult = Invoke-ApiRequest -Method "GET" -Endpoint "/nucleos-atendimento?empresaId=$empresaId" -Headers $authHeaders

if (-not $nucleosResult.Success) {
  Show-Result -Test "GET /api/nucleos" -Success $false -Message "Erro HTTP $($nucleosResult.StatusCode): $($nucleosResult.Error)"
  $nucleoIdParaTeste = $null
}
else {
  $nucleos = $nucleosResult.Data
  $totalNucleos = $nucleos.Count
    
  Show-Result -Test "GET /api/nucleos" -Success $true -Message "Retornou $totalNucleos nucleo(s)"
    
  if ($totalNucleos -gt 0) {
    $nucleoIdParaTeste = $nucleos[0].id
    Write-Host "   Usando nucleoId para testes: $nucleoIdParaTeste" -ForegroundColor Gray
  }
  else {
    Write-Host "   AVISO: Nenhum nucleo encontrado. Testes de atribuicao serao pulados." -ForegroundColor Yellow
    $nucleoIdParaTeste = $null
  }
}

Write-Host ""

# ETAPA 5: Testar PATCH /api/filas/:id/nucleo
if ($global:primeiraFilaId -and $nucleoIdParaTeste) {
  Write-Host "ETAPA 5: PATCH /api/filas/$($global:primeiraFilaId)/nucleo" -ForegroundColor Yellow
  Write-Host "----------------------------------------" -ForegroundColor Gray
    
  $atribuirNucleoBody = @{
    nucleoId = $nucleoIdParaTeste
  }
    
  $atribuirResult = Invoke-ApiRequest -Method "PATCH" -Endpoint "/filas/$($global:primeiraFilaId)/nucleo" -Body $atribuirNucleoBody -Headers $authHeaders
    
  if (-not $atribuirResult.Success) {
    Show-Result -Test "PATCH /api/filas/:id/nucleo" -Success $false -Message "Erro HTTP $($atribuirResult.StatusCode): $($atribuirResult.Error)"
  }
  else {
    $filaAtualizada = $atribuirResult.Data
    Show-Result -Test "PATCH /api/filas/:id/nucleo" -Success $true -Message "Nucleo atribuido com sucesso"
    Write-Host "   Fila: $($filaAtualizada.nome)" -ForegroundColor Gray
    Write-Host "   NucleoId atribuido: $($filaAtualizada.nucleoId)" -ForegroundColor Gray
  }
}
else {
  Write-Host "ETAPA 5: PATCH /api/filas/:id/nucleo - PULADO" -ForegroundColor Yellow
  Write-Host "   Motivo: Sem filas ou nucleos disponiveis para teste" -ForegroundColor Gray
}

Write-Host ""

# ETAPA 6: Testar GET /api/filas/nucleo/:id/ideal
if ($nucleoIdParaTeste) {
  Write-Host "ETAPA 6: GET /api/filas/nucleo/$nucleoIdParaTeste/ideal" -ForegroundColor Yellow
  Write-Host "----------------------------------------" -ForegroundColor Gray
    
  $filaIdealResult = Invoke-ApiRequest -Method "GET" -Endpoint "/filas/nucleo/$nucleoIdParaTeste/ideal" -Headers $authHeaders
    
  if (-not $filaIdealResult.Success) {
    Show-Result -Test "GET /api/filas/nucleo/:id/ideal" -Success $false -Message "Erro HTTP $($filaIdealResult.StatusCode): $($filaIdealResult.Error)"
  }
  else {
    $filaIdeal = $filaIdealResult.Data
    Show-Result -Test "GET /api/filas/nucleo/:id/ideal" -Success $true -Message "Fila ideal calculada com sucesso"
    Write-Host "   Fila ideal: $($filaIdeal.nome)" -ForegroundColor Gray
    Write-Host "   Atendimentos ativos: $($filaIdeal.atendimentosAtivos)" -ForegroundColor Gray
  }
}
else {
  Write-Host "ETAPA 6: GET /api/filas/nucleo/:id/ideal - PULADO" -ForegroundColor Yellow
  Write-Host "   Motivo: Nenhum nucleo disponivel para teste" -ForegroundColor Gray
}

Write-Host ""

# ETAPA 7: Testar GET /api/filas/estatisticas
Write-Host "ETAPA 7: GET /api/filas/estatisticas?empresaId=$empresaId" -ForegroundColor Yellow
Write-Host "----------------------------------------" -ForegroundColor Gray

$estatisticasResult = Invoke-ApiRequest -Method "GET" -Endpoint "/filas/estatisticas?empresaId=$empresaId" -Headers $authHeaders

if (-not $estatisticasResult.Success) {
  Show-Result -Test "GET /api/filas/estatisticas" -Success $false -Message "Erro HTTP $($estatisticasResult.StatusCode): $($estatisticasResult.Error)"
}
else {
  $stats = $estatisticasResult.Data
  Show-Result -Test "GET /api/filas/estatisticas" -Success $true -Message "Estatisticas obtidas com sucesso"
  Write-Host ""
  Write-Host "   Estatisticas:" -ForegroundColor Cyan
  Write-Host "   - Total de filas: $($stats.totalFilas)" -ForegroundColor Gray
  Write-Host "   - Filas ativas: $($stats.filasAtivas)" -ForegroundColor Gray
  Write-Host "   - Taxa de ocupacao media: $($stats.taxaOcupacaoMedia)%" -ForegroundColor Gray
  Write-Host "   - Tickets em atendimento: $($stats.ticketsEmAtendimento)" -ForegroundColor Gray
  Write-Host "   - Capacidade total: $($stats.capacidadeTotal)" -ForegroundColor Gray
  Write-Host "   - Capacidade utilizada: $($stats.capacidadeUtilizada)" -ForegroundColor Gray
}

Write-Host ""

# RESUMO FINAL
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  RESUMO DOS TESTES" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Proximos passos:" -ForegroundColor Yellow
Write-Host "  1. Abrir http://localhost:3000/configuracoes/gestao-equipes" -ForegroundColor White
Write-Host "     - Verificar banner de depreciacao" -ForegroundColor Gray
Write-Host ""
Write-Host "  2. Abrir http://localhost:3000/configuracoes/gestao-filas" -ForegroundColor White
Write-Host "     - Criar nova fila com nucleoId/departamentoId" -ForegroundColor Gray
Write-Host "     - Editar fila existente e verificar novos campos" -ForegroundColor Gray
Write-Host ""
Write-Host "  3. Verificar console do navegador (F12)" -ForegroundColor White
Write-Host "     - Nao deve haver erros no console" -ForegroundColor Gray
Write-Host ""
