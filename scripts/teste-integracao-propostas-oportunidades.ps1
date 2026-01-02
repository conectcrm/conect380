# Script de Teste - Integração Propostas ↔ Oportunidades
# Data: 02/12/2025

Write-Host "`n🧪 TESTE DE INTEGRAÇÃO - PROPOSTAS ↔ OPORTUNIDADES" -ForegroundColor Cyan
Write-Host "=" * 60 -ForegroundColor Gray

# Configurações
$baseUrl = "http://localhost:3001"
$email = "admin@conectsuite.com.br"
$password = "admin123"

# Função auxiliar para exibir resultados
function Show-TestResult {
  param(
    [string]$TestName,
    [bool]$Success,
    [string]$Message = ""
  )
    
  if ($Success) {
    Write-Host "✅ $TestName" -ForegroundColor Green
    if ($Message) {
      Write-Host "   └─ $Message" -ForegroundColor Gray
    }
  }
  else {
    Write-Host "❌ $TestName" -ForegroundColor Red
    if ($Message) {
      Write-Host "   └─ $Message" -ForegroundColor Yellow
    }
  }
}

# Teste 1: Verificar se backend está respondendo
Write-Host "`n📡 1. Verificando Backend..." -ForegroundColor Yellow
try {
  $health = Invoke-RestMethod -Uri "$baseUrl/health" -Method Get -ErrorAction Stop
  Show-TestResult -TestName "Backend respondendo" -Success $true -Message "Status: OK"
}
catch {
  Show-TestResult -TestName "Backend respondendo" -Success $false -Message $_.Exception.Message
  exit 1
}

# Teste 2: Login e obter token
Write-Host "`n🔑 2. Autenticação..." -ForegroundColor Yellow
try {
  $loginBody = @{
    email    = $email
    password = $password
  } | ConvertTo-Json

  $loginResponse = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body $loginBody -ContentType "application/json" -ErrorAction Stop
  $token = $loginResponse.access_token
    
  if ($token) {
    Show-TestResult -TestName "Login bem-sucedido" -Success $true -Message "Token obtido"
  }
  else {
    Show-TestResult -TestName "Login bem-sucedido" -Success $false -Message "Token não retornado"
    exit 1
  }
}
catch {
  Show-TestResult -TestName "Login bem-sucedido" -Success $false -Message $_.Exception.Message
  exit 1
}

# Headers com autenticação
$headers = @{
  "Authorization" = "Bearer $token"
  "Content-Type"  = "application/json"
}

# Teste 3: Listar oportunidades
Write-Host "`n📊 3. Verificando Oportunidades..." -ForegroundColor Yellow
try {
  $oportunidades = Invoke-RestMethod -Uri "$baseUrl/oportunidades" -Method Get -Headers $headers -ErrorAction Stop
    
  if ($oportunidades -and $oportunidades.Count -gt 0) {
    Show-TestResult -TestName "Oportunidades encontradas" -Success $true -Message "Total: $($oportunidades.Count)"
    $oportunidadeTeste = $oportunidades[0]
    Write-Host "   └─ Usando oportunidade: ID=$($oportunidadeTeste.id), Título=$($oportunidadeTeste.titulo)" -ForegroundColor Gray
  }
  else {
    Show-TestResult -TestName "Oportunidades encontradas" -Success $false -Message "Nenhuma oportunidade disponível para teste"
        
    # Criar oportunidade de teste
    Write-Host "`n   ⚙️  Criando oportunidade de teste..." -ForegroundColor Cyan
    $novaOportunidade = @{
      titulo          = "Oportunidade Teste Integração"
      descricao       = "Criada automaticamente para teste de integração"
      valor           = 5000.00
      probabilidade   = 75
      estagio         = "QUALIFICACAO"
      prioridade      = "media"
      origem          = "site"
      nomeContato     = "Cliente Teste"
      emailContato    = "teste@exemplo.com"
      telefoneContato = "(11) 99999-9999"
      empresaContato  = "Empresa Teste Ltda"
      responsavel_id  = 1
    } | ConvertTo-Json
        
    try {
      $oportunidadeTeste = Invoke-RestMethod -Uri "$baseUrl/oportunidades" -Method Post -Headers $headers -Body $novaOportunidade -ErrorAction Stop
      Show-TestResult -TestName "Oportunidade de teste criada" -Success $true -Message "ID: $($oportunidadeTeste.id)"
    }
    catch {
      Show-TestResult -TestName "Oportunidade de teste criada" -Success $false -Message $_.Exception.Message
      exit 1
    }
  }
}
catch {
  Show-TestResult -TestName "Listar oportunidades" -Success $false -Message $_.Exception.Message
  exit 1
}

# Teste 4: Verificar se endpoint gerar-proposta existe
Write-Host "`n🔧 4. Testando Endpoint 'Gerar Proposta'..." -ForegroundColor Yellow
try {
  # Obter UUID da empresa (necessário para criar proposta)
  # Para o teste, vamos usar um UUID mock ou o primeiro disponível
  $empresaId = "00000000-0000-0000-0000-000000000001" # UUID padrão de teste
    
  $body = @{
    empresaId = $empresaId
  } | ConvertTo-Json
    
  $resultado = Invoke-RestMethod -Uri "$baseUrl/oportunidades/$($oportunidadeTeste.id)/gerar-proposta" -Method Post -Headers $headers -Body $body -ErrorAction Stop
    
  if ($resultado.success -and $resultado.proposta) {
    Show-TestResult -TestName "Endpoint 'gerar-proposta' funcional" -Success $true -Message "Proposta ID: $($resultado.proposta.id)"
    $propostaGerada = $resultado.proposta
        
    # Verificar se proposta tem oportunidade_id vinculado
    if ($propostaGerada.oportunidade_id -eq $oportunidadeTeste.id) {
      Show-TestResult -TestName "Proposta vinculada à oportunidade" -Success $true -Message "oportunidade_id: $($propostaGerada.oportunidade_id)"
    }
    else {
      Show-TestResult -TestName "Proposta vinculada à oportunidade" -Success $false -Message "oportunidade_id não corresponde"
    }
  }
  else {
    Show-TestResult -TestName "Endpoint 'gerar-proposta' funcional" -Success $false -Message "Resposta inesperada"
  }
}
catch {
  $errorDetails = $_.ErrorDetails.Message | ConvertFrom-Json
  Show-TestResult -TestName "Endpoint 'gerar-proposta' funcional" -Success $false -Message $errorDetails.message
    
  if ($errorDetails.message -like "*empresaId*") {
    Write-Host "   ⚠️  Nota: É necessário criar uma empresa no sistema primeiro" -ForegroundColor Yellow
  }
}

# Teste 5: Verificar sincronização de status (se proposta foi gerada)
if ($propostaGerada) {
  Write-Host "`n🔄 5. Testando Sincronização de Status..." -ForegroundColor Yellow
    
  try {
    # Buscar oportunidade atualizada
    $oportunidadeAtualizada = Invoke-RestMethod -Uri "$baseUrl/oportunidades/$($oportunidadeTeste.id)" -Method Get -Headers $headers -ErrorAction Stop
        
    if ($oportunidadeAtualizada.estagio -eq "PROPOSTA") {
      Show-TestResult -TestName "Oportunidade movida para estágio PROPOSTA" -Success $true -Message "Estágio: $($oportunidadeAtualizada.estagio)"
    }
    else {
      Show-TestResult -TestName "Oportunidade movida para estágio PROPOSTA" -Success $false -Message "Estágio atual: $($oportunidadeAtualizada.estagio)"
    }
        
    # Verificar se atividade foi criada
    try {
      $atividades = Invoke-RestMethod -Uri "$baseUrl/oportunidades/$($oportunidadeTeste.id)/atividades" -Method Get -Headers $headers -ErrorAction Stop
      $atividadeProposta = $atividades | Where-Object { $_.descricao -like "*Proposta*gerada*" }
            
      if ($atividadeProposta) {
        Show-TestResult -TestName "Atividade de histórico criada" -Success $true -Message "Registrado no timeline"
      }
      else {
        Show-TestResult -TestName "Atividade de histórico criada" -Success $false -Message "Atividade não encontrada"
      }
    }
    catch {
      Show-TestResult -TestName "Atividade de histórico criada" -Success $false -Message "Erro ao buscar atividades"
    }
  }
  catch {
    Show-TestResult -TestName "Verificar sincronização" -Success $false -Message $_.Exception.Message
  }
}

# Teste 6: Verificar estrutura do banco de dados
Write-Host "`n🗄️  6. Verificando Estrutura do Banco..." -ForegroundColor Yellow
try {
  # Verificar se coluna oportunidade_id existe em propostas
  $query = "SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = 'propostas' AND column_name = 'oportunidade_id'"
    
  # Nota: Este teste requer acesso direto ao banco, que pode não estar disponível via API
  # Para um teste completo, seria necessário configurar uma conexão PostgreSQL
    
  Write-Host "   ⚠️  Teste de estrutura do banco requer acesso direto ao PostgreSQL" -ForegroundColor Yellow
  Write-Host "   └─ Verificação manual recomendada com pgAdmin ou psql" -ForegroundColor Gray
}
catch {
  Write-Host "   ⚠️  Não foi possível verificar estrutura do banco via API" -ForegroundColor Yellow
}

# Resumo Final
Write-Host "`n" + ("=" * 60) -ForegroundColor Gray
Write-Host "📋 RESUMO DO TESTE" -ForegroundColor Cyan
Write-Host ("=" * 60) -ForegroundColor Gray

Write-Host "`n✅ Testes Concluídos!" -ForegroundColor Green
Write-Host "   Backend: ONLINE" -ForegroundColor Green
Write-Host "   Autenticação: OK" -ForegroundColor Green
Write-Host "   Integração: " -NoNewline
if ($propostaGerada) {
  Write-Host "FUNCIONAL ✅" -ForegroundColor Green
}
else {
  Write-Host "PARCIAL ⚠️" -ForegroundColor Yellow
  Write-Host "`n   Nota: Crie uma empresa no sistema para teste completo" -ForegroundColor Yellow
}

Write-Host "`n📌 Proximos Passos:" -ForegroundColor Cyan
Write-Host "   1. Acesse: http://localhost:3000/comercial/pipeline" -ForegroundColor White
Write-Host "   2. Clique no botao 'Proposta' em uma oportunidade" -ForegroundColor White
Write-Host "   3. Verifique se a proposta foi criada com vinculo" -ForegroundColor White
Write-Host "   4. Aprove/Rejeite a proposta e veja a sincronizacao automatica" -ForegroundColor White

Write-Host "`n" + ("=" * 60) -ForegroundColor Gray
Write-Host ""
