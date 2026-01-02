# 🧪 Script de Testes Automatizados - Núcleos e Departamentos
# Data: 28 de outubro de 2025

param(
  [string]$BackendUrl = "http://localhost:3001",
  [string]$Email = "admin@conectsuite.com.br",
  [string]$Password = "admin123"
)

Write-Host "🚀 Iniciando Testes Automatizados" -ForegroundColor Cyan
Write-Host "Backend: $BackendUrl" -ForegroundColor Gray
Write-Host ""

# Cores para output
$Success = "Green"
$ErrorColor = "Red"
$Info = "Yellow"
$Detail = "Gray"

# Contadores
$TotalTests = 0
$PassedTests = 0
$FailedTests = 0

# Função para fazer requisições
function Invoke-ApiRequest {
  param(
    [string]$Method,
    [string]$Endpoint,
    [hashtable]$Headers = @{},
    [object]$Body = $null
  )
    
  $url = "$BackendUrl$Endpoint"
    
  try {
    $params = @{
      Method      = $Method
      Uri         = $url
      Headers     = $Headers
      ContentType = "application/json"
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
        
    try {
      $errorResponse = $_.ErrorDetails.Message | ConvertFrom-Json
      $errorMessage = $errorResponse.message
    }
    catch {}
        
    return @{ 
      Success    = $false
      StatusCode = $statusCode
      Message    = $errorMessage
    }
  }
}

# Função para registrar resultado de teste
function Test-Result {
  param(
    [string]$TestName,
    [bool]$Passed,
    [string]$Message = ""
  )
    
  $script:TotalTests++
    
  if ($Passed) {
    $script:PassedTests++
    Write-Host "  ✅ $TestName" -ForegroundColor $Success
    if ($Message) {
      Write-Host "     $Message" -ForegroundColor $Detail
    }
  }
  else {
    $script:FailedTests++
    Write-Host "  ❌ $TestName" -ForegroundColor $ErrorColor
    if ($Message) {
      Write-Host "     $Message" -ForegroundColor $ErrorColor
    }
  }
}

# =============================================================================
# TESTE 0: Verificar se Backend está rodando
# =============================================================================
Write-Host "📡 Verificando Backend..." -ForegroundColor $Info

$healthCheck = Invoke-ApiRequest -Method GET -Endpoint "/"
# 404 é normal para / (significa que está online)
if (-not $healthCheck.Success -and $healthCheck.StatusCode -ne 404) {
  Write-Host "❌ Backend não está respondendo em $BackendUrl" -ForegroundColor $ErrorColor
  Write-Host "   Execute: cd backend; npm run start:dev" -ForegroundColor $Info
  exit 1
}

Write-Host "✅ Backend está online!" -ForegroundColor $Success
Write-Host ""

# =============================================================================
# TESTE 1: Login
# =============================================================================
Write-Host "🔐 TESTE 1: Autenticação" -ForegroundColor $Info

$loginBody = @{
  email    = $Email
  password = $Password
}

$loginResult = Invoke-ApiRequest -Method POST -Endpoint "/auth/login" -Body $loginBody

if ($loginResult.Success) {
  $token = $loginResult.Data.accessToken
  $headers = @{
    "Authorization" = "Bearer $token"
  }
  Test-Result -TestName "Login com credenciais válidas" -Passed $true -Message "Token obtido"
}
else {
  Test-Result -TestName "Login com credenciais válidas" -Passed $false -Message $loginResult.Message
  Write-Host ""
  Write-Host "❌ Não foi possível fazer login. Verifique as credenciais." -ForegroundColor $ErrorColor
  Write-Host "   Email: $Email" -ForegroundColor $Info
  Write-Host "   Password: $Password" -ForegroundColor $Info
  exit 1
}

Write-Host ""

# =============================================================================
# TESTE 2: Listar Núcleos
# =============================================================================
Write-Host "📋 TESTE 2: Listar Núcleos" -ForegroundColor $Info

$nucleosResult = Invoke-ApiRequest -Method GET -Endpoint "/nucleos" -Headers $headers

if ($nucleosResult.Success) {
  $nucleos = $nucleosResult.Data
  Test-Result -TestName "GET /nucleos" -Passed $true -Message "Encontrados $($nucleos.Count) núcleos"
    
  if ($nucleos.Count -eq 0) {
    Write-Host "  ⚠️  Nenhum núcleo encontrado. Alguns testes serão pulados." -ForegroundColor $Info
  }
  else {
    $primeiroNucleo = $nucleos[0]
    Write-Host "     Primeiro núcleo: $($primeiroNucleo.nome) (ID: $($primeiroNucleo.id))" -ForegroundColor $Detail
  }
}
else {
  Test-Result -TestName "GET /nucleos" -Passed $false -Message $nucleosResult.Message
}

Write-Host ""

# =============================================================================
# TESTE 3: Listar Departamentos
# =============================================================================
Write-Host "📋 TESTE 3: Listar Departamentos" -ForegroundColor $Info

$departamentosResult = Invoke-ApiRequest -Method GET -Endpoint "/departamentos" -Headers $headers

if ($departamentosResult.Success) {
  $departamentos = $departamentosResult.Data
  Test-Result -TestName "GET /departamentos" -Passed $true -Message "Encontrados $($departamentos.Count) departamentos"
    
  $departamentosAtivos = $departamentos | Where-Object { $_.ativo -eq $true }
  $departamentosInativos = $departamentos | Where-Object { $_.ativo -eq $false }
    
  Write-Host "     Ativos: $($departamentosAtivos.Count)" -ForegroundColor $Detail
  Write-Host "     Inativos: $($departamentosInativos.Count)" -ForegroundColor $Detail
}
else {
  Test-Result -TestName "GET /departamentos" -Passed $false -Message $departamentosResult.Message
}

Write-Host ""

# =============================================================================
# TESTE 4: Criar Departamento SEM Núcleo (TC001)
# =============================================================================
Write-Host "📝 TESTE 4: Criar Departamento SEM Núcleo (TC001)" -ForegroundColor $Info

$novoDepartamento = @{
  nome      = "Departamento Teste TC001 - $(Get-Date -Format 'HHmmss')"
  descricao = "Departamento criado via script de teste automatizado"
  ativo     = $true
}

$criarResult = Invoke-ApiRequest -Method POST -Endpoint "/departamentos" -Headers $headers -Body $novoDepartamento

if ($criarResult.Success) {
  $departamentoCriado = $criarResult.Data
  $departamentoId = $departamentoCriado.id
    
  # Verificar se nucleoId é null
  if ($null -eq $departamentoCriado.nucleoId) {
    Test-Result -TestName "Criar departamento sem núcleo" -Passed $true -Message "ID: $departamentoId, nucleoId: null ✓"
  }
  else {
    Test-Result -TestName "Criar departamento sem núcleo" -Passed $false -Message "nucleoId deveria ser null, mas é: $($departamentoCriado.nucleoId)"
  }
}
else {
  Test-Result -TestName "Criar departamento sem núcleo" -Passed $false -Message $criarResult.Message
}

Write-Host ""

# =============================================================================
# TESTE 5: Criar Departamento COM Núcleo (TC002)
# =============================================================================
Write-Host "📝 TESTE 5: Criar Departamento COM Núcleo (TC002)" -ForegroundColor $Info

if ($nucleos.Count -gt 0) {
  $nucleoParaTeste = $nucleos[0].id
    
  $novoDepartamentoComNucleo = @{
    nome      = "Departamento Teste TC002 - $(Get-Date -Format 'HHmmss')"
    descricao = "Departamento vinculado a núcleo via script"
    ativo     = $true
    nucleoId  = $nucleoParaTeste
  }
    
  $criarComNucleoResult = Invoke-ApiRequest -Method POST -Endpoint "/departamentos" -Headers $headers -Body $novoDepartamentoComNucleo
    
  if ($criarComNucleoResult.Success) {
    $deptComNucleo = $criarComNucleoResult.Data
        
    if ($deptComNucleo.nucleoId -eq $nucleoParaTeste) {
      Test-Result -TestName "Criar departamento com núcleo" -Passed $true -Message "nucleoId: $($deptComNucleo.nucleoId) ✓"
    }
    else {
      Test-Result -TestName "Criar departamento com núcleo" -Passed $false -Message "nucleoId esperado: $nucleoParaTeste, obtido: $($deptComNucleo.nucleoId)"
    }
  }
  else {
    Test-Result -TestName "Criar departamento com núcleo" -Passed $false -Message $criarComNucleoResult.Message
  }
}
else {
  Write-Host "  ⏭️  TESTE PULADO: Nenhum núcleo disponível" -ForegroundColor $Info
}

Write-Host ""

# =============================================================================
# TESTE 6: Validação - Nome Obrigatório (TC003)
# =============================================================================
Write-Host "🔒 TESTE 6: Validação de Campos Obrigatórios (TC003)" -ForegroundColor $Info

$departamentoInvalido = @{
  descricao = "Sem nome"
  ativo     = $true
}

$validacaoResult = Invoke-ApiRequest -Method POST -Endpoint "/departamentos" -Headers $headers -Body $departamentoInvalido

if (-not $validacaoResult.Success -and $validacaoResult.StatusCode -eq 400) {
  Test-Result -TestName "Validação: nome obrigatório" -Passed $true -Message "Retornou 400 Bad Request ✓"
}
else {
  Test-Result -TestName "Validação: nome obrigatório" -Passed $false -Message "Deveria retornar 400, mas retornou: $($validacaoResult.StatusCode)"
}

Write-Host ""

# =============================================================================
# TESTE 7: Editar Departamento (TC004)
# =============================================================================
Write-Host "✏️  TESTE 7: Editar Departamento (TC004)" -ForegroundColor $Info

if ($departamentoId) {
  $atualizacao = @{
    nome      = "Departamento TC001 EDITADO - $(Get-Date -Format 'HHmmss')"
    descricao = "Descrição atualizada pelo script"
  }
    
  $editarResult = Invoke-ApiRequest -Method PUT -Endpoint "/departamentos/$departamentoId" -Headers $headers -Body $atualizacao
    
  if ($editarResult.Success) {
    $deptAtualizado = $editarResult.Data
        
    if ($deptAtualizado.nome -eq $atualizacao.nome) {
      Test-Result -TestName "Editar departamento (PUT)" -Passed $true -Message "Nome atualizado ✓"
    }
    else {
      Test-Result -TestName "Editar departamento (PUT)" -Passed $false -Message "Nome não foi atualizado"
    }
  }
  else {
    Test-Result -TestName "Editar departamento (PUT)" -Passed $false -Message $editarResult.Message
  }
}
else {
  Write-Host "  ⏭️  TESTE PULADO: Nenhum departamento criado anteriormente" -ForegroundColor $Info
}

Write-Host ""

# =============================================================================
# TESTE 8: Alterar Status (TC005)
# =============================================================================
Write-Host "🔄 TESTE 8: Alterar Status do Departamento (TC005)" -ForegroundColor $Info

if ($departamentoId) {
  # Buscar estado atual
  $deptAtualResult = Invoke-ApiRequest -Method GET -Endpoint "/departamentos/$departamentoId" -Headers $headers
    
  if ($deptAtualResult.Success) {
    $statusAtual = $deptAtualResult.Data.ativo
    $novoStatus = -not $statusAtual
        
    # Alternar status
    $statusResult = Invoke-ApiRequest -Method PATCH -Endpoint "/departamentos/$departamentoId/status" -Headers $headers
        
    if ($statusResult.Success) {
      $deptDepoisStatus = $statusResult.Data
            
      if ($deptDepoisStatus.ativo -eq $novoStatus) {
        Test-Result -TestName "Alterar status (PATCH)" -Passed $true -Message "Status: $statusAtual → $novoStatus ✓"
      }
      else {
        Test-Result -TestName "Alterar status (PATCH)" -Passed $false -Message "Status não mudou"
      }
    }
    else {
      Test-Result -TestName "Alterar status (PATCH)" -Passed $false -Message $statusResult.Message
    }
  }
}
else {
  Write-Host "  ⏭️  TESTE PULADO: Nenhum departamento disponível" -ForegroundColor $Info
}

Write-Host ""

# =============================================================================
# TESTE 9: Reordenar Departamentos (TC008)
# =============================================================================
Write-Host "🔀 TESTE 9: Reordenar Departamentos (TC008)" -ForegroundColor $Info

$todosDeptos = Invoke-ApiRequest -Method GET -Endpoint "/departamentos" -Headers $headers

if ($todosDeptos.Success -and $todosDeptos.Data.Count -ge 2) {
  $deptos = $todosDeptos.Data
  $idsOriginais = $deptos | ForEach-Object { $_.id }
    
  # Inverter ordem (último vai para primeiro)
  $idsReordenados = @($idsOriginais[-1]) + $idsOriginais[0..($idsOriginais.Count - 2)]
    
  $reordenarBody = @{
    departamentosIds = $idsReordenados
  }
    
  $reordenarResult = Invoke-ApiRequest -Method PUT -Endpoint "/departamentos/reordenar" -Headers $headers -Body $reordenarBody
    
  if ($reordenarResult.Success) {
    Test-Result -TestName "Reordenar departamentos (drag-and-drop)" -Passed $true -Message "Ordem alterada ✓"
  }
  else {
    Test-Result -TestName "Reordenar departamentos (drag-and-drop)" -Passed $false -Message $reordenarResult.Message
  }
}
else {
  Write-Host "  ⏭️  TESTE PULADO: Menos de 2 departamentos disponíveis" -ForegroundColor $Info
}

Write-Host ""

# =============================================================================
# TESTE 10: Buscar Núcleo com Departamentos (TC019)
# =============================================================================
Write-Host "🔍 TESTE 10: Buscar Núcleo com Departamentos (TC019)" -ForegroundColor $Info

if ($nucleos.Count -gt 0) {
  $nucleoId = $nucleos[0].id
    
  $nucleoDetalheResult = Invoke-ApiRequest -Method GET -Endpoint "/nucleos/$nucleoId" -Headers $headers
    
  if ($nucleoDetalheResult.Success) {
    $nucleoDetalhe = $nucleoDetalheResult.Data
        
    # Verificar estrutura da resposta
    $temNucleo = $null -ne $nucleoDetalhe.nucleo
    $temDepartamentosOuAgentes = ($null -ne $nucleoDetalhe.departamentos) -or ($null -ne $nucleoDetalhe.agentesDestinados)
        
    if ($temNucleo -and $temDepartamentosOuAgentes) {
      $qtdDepts = if ($nucleoDetalhe.departamentos) { $nucleoDetalhe.departamentos.Count } else { 0 }
      $qtdAgentes = if ($nucleoDetalhe.agentesDestinados) { $nucleoDetalhe.agentesDestinados.Count } else { 0 }
            
      Test-Result -TestName "GET /nucleos/:id (cenários de roteamento)" -Passed $true -Message "Departamentos: $qtdDepts, Agentes: $qtdAgentes ✓"
    }
    else {
      Test-Result -TestName "GET /nucleos/:id (cenários de roteamento)" -Passed $false -Message "Estrutura da resposta incorreta"
    }
  }
  else {
    Test-Result -TestName "GET /nucleos/:id (cenários de roteamento)" -Passed $false -Message $nucleoDetalheResult.Message
  }
}
else {
  Write-Host "  ⏭️  TESTE PULADO: Nenhum núcleo disponível" -ForegroundColor $Info
}

Write-Host ""

# =============================================================================
# TESTE 11: Deletar Departamento (TC011)
# =============================================================================
Write-Host "🗑️  TESTE 11: Deletar Departamento (TC011)" -ForegroundColor $Info

if ($departamentoId) {
  $deletarResult = Invoke-ApiRequest -Method DELETE -Endpoint "/departamentos/$departamentoId" -Headers $headers
    
  if ($deletarResult.Success) {
    # Verificar se realmente foi deletado
    $verificarResult = Invoke-ApiRequest -Method GET -Endpoint "/departamentos/$departamentoId" -Headers $headers
        
    if (-not $verificarResult.Success -and $verificarResult.StatusCode -eq 404) {
      Test-Result -TestName "Deletar departamento" -Passed $true -Message "Departamento removido (404 ao buscar) ✓"
    }
    else {
      Test-Result -TestName "Deletar departamento" -Passed $false -Message "Departamento ainda existe após deleção"
    }
  }
  else {
    Test-Result -TestName "Deletar departamento" -Passed $false -Message $deletarResult.Message
  }
}
else {
  Write-Host "  ⏭️  TESTE PULADO: Nenhum departamento para deletar" -ForegroundColor $Info
}

Write-Host ""

# =============================================================================
# RELATÓRIO FINAL
# =============================================================================
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "📊 RELATÓRIO FINAL DE TESTES" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "Total de Testes:    $TotalTests" -ForegroundColor White
Write-Host "✅ Passaram:        $PassedTests" -ForegroundColor $Success
Write-Host "❌ Falharam:        $FailedTests" -ForegroundColor $ErrorColor
Write-Host ""

if ($TotalTests -gt 0) {
  $percentual = [math]::Round(($PassedTests / $TotalTests) * 100, 2)
  Write-Host "📈 Taxa de Sucesso: $percentual%" -ForegroundColor $(if ($percentual -ge 90) { $Success } elseif ($percentual -ge 70) { $Info } else { $Error })
}

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Retornar código de saída baseado nos resultados
if ($FailedTests -eq 0) {
  Write-Host "🎉 Todos os testes passaram!" -ForegroundColor $Success
  exit 0
}
else {
  Write-Host "⚠️  Alguns testes falharam. Verifique os detalhes acima." -ForegroundColor $ErrorColor
  exit 1
}
