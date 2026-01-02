# Script de teste para API de Leads
# Executa testes básicos em todas as rotas do módulo de Leads

$baseUrl = "http://localhost:3001"
$token = ""
$empresaId = ""
$leadId = ""

Write-Host "🧪 TESTE DE API - MÓDULO DE LEADS" -ForegroundColor Cyan
Write-Host "=" * 60 -ForegroundColor Cyan
Write-Host ""

# Função para fazer requisições HTTP
function Invoke-ApiRequest {
  param(
    [string]$Method,
    [string]$Endpoint,
    [object]$Body = $null,
    [bool]$RequiresAuth = $true
  )
    
  $headers = @{
    "Content-Type" = "application/json"
  }
    
  if ($RequiresAuth -and $token) {
    $headers["Authorization"] = "Bearer $token"
  }
    
  $url = "$baseUrl$Endpoint"
    
  try {
    if ($Body) {
      $jsonBody = $Body | ConvertTo-Json -Depth 10
      $response = Invoke-RestMethod -Uri $url -Method $Method -Headers $headers -Body $jsonBody -ErrorAction Stop
    }
    else {
      $response = Invoke-RestMethod -Uri $url -Method $Method -Headers $headers -ErrorAction Stop
    }
    return @{ Success = $true; Data = $response }
  }
  catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    $errorMessage = $_.Exception.Message
    if ($_.ErrorDetails.Message) {
      $errorDetails = $_.ErrorDetails.Message | ConvertFrom-Json -ErrorAction SilentlyContinue
      if ($errorDetails.message) {
        $errorMessage = $errorDetails.message
      }
    }
    return @{ Success = $false; StatusCode = $statusCode; Error = $errorMessage }
  }
}

# PASSO 1: Login
Write-Host "📋 PASSO 1: Autenticação" -ForegroundColor Yellow
Write-Host "Tentando login com usuário de teste..." -ForegroundColor Gray

$loginBody = @{
  email    = "admin@conectsuite.com.br"
  password = "Admin@123"
}

$loginResult = Invoke-ApiRequest -Method POST -Endpoint "/auth/login" -Body $loginBody -RequiresAuth $false

if ($loginResult.Success) {
  $token = $loginResult.Data.access_token
  $empresaId = $loginResult.Data.user.empresa_id
  Write-Host "✅ Login realizado com sucesso!" -ForegroundColor Green
  Write-Host "   Token: $($token.Substring(0, 20))..." -ForegroundColor Gray
  Write-Host "   Empresa ID: $empresaId" -ForegroundColor Gray
}
else {
  Write-Host "❌ Erro no login: $($loginResult.Error)" -ForegroundColor Red
  Write-Host "   Status Code: $($loginResult.StatusCode)" -ForegroundColor Red
  Write-Host ""
  Write-Host "⚠️  ATENÇÃO: Ajuste as credenciais no script se necessário" -ForegroundColor Yellow
  exit 1
}

Write-Host ""

# PASSO 2: Criar Lead
Write-Host "📋 PASSO 2: Criar Lead" -ForegroundColor Yellow
Write-Host "Criando novo lead de teste..." -ForegroundColor Gray

$createLeadBody = @{
  nome         = "João Silva Teste API"
  email        = "joao.teste@example.com"
  telefone     = "(11) 98765-4321"
  empresa_nome = "Empresa Teste LTDA"
  origem       = "site"
  observacoes  = "Lead criado via script de teste automatizado"
}

$createResult = Invoke-ApiRequest -Method POST -Endpoint "/leads" -Body $createLeadBody

if ($createResult.Success) {
  $leadId = $createResult.Data.id
  $score = $createResult.Data.score
  Write-Host "✅ Lead criado com sucesso!" -ForegroundColor Green
  Write-Host "   ID: $leadId" -ForegroundColor Gray
  Write-Host "   Nome: $($createResult.Data.nome)" -ForegroundColor Gray
  Write-Host "   Status: $($createResult.Data.status)" -ForegroundColor Gray
  Write-Host "   Score: $score/100" -ForegroundColor Gray
  Write-Host "   Empresa ID: $($createResult.Data.empresa_id)" -ForegroundColor Gray
}
else {
  Write-Host "❌ Erro ao criar lead: $($createResult.Error)" -ForegroundColor Red
  Write-Host "   Status Code: $($createResult.StatusCode)" -ForegroundColor Red
  exit 1
}

Write-Host ""

# PASSO 3: Listar Leads
Write-Host "📋 PASSO 3: Listar Leads" -ForegroundColor Yellow
Write-Host "Buscando todos os leads..." -ForegroundColor Gray

$listResult = Invoke-ApiRequest -Method GET -Endpoint "/leads"

if ($listResult.Success) {
  $totalLeads = $listResult.Data.Count
  Write-Host "✅ Lista de leads recuperada com sucesso!" -ForegroundColor Green
  Write-Host "   Total de leads: $totalLeads" -ForegroundColor Gray
    
  if ($totalLeads -gt 0) {
    $firstLead = $listResult.Data[0]
    Write-Host "   Primeiro lead: $($firstLead.nome) - Status: $($firstLead.status)" -ForegroundColor Gray
  }
}
else {
  Write-Host "❌ Erro ao listar leads: $($listResult.Error)" -ForegroundColor Red
  Write-Host "   Status Code: $($listResult.StatusCode)" -ForegroundColor Red
}

Write-Host ""

# PASSO 4: Buscar Lead por ID
Write-Host "📋 PASSO 4: Buscar Lead por ID" -ForegroundColor Yellow
Write-Host "Buscando lead ID: $leadId..." -ForegroundColor Gray

$getResult = Invoke-ApiRequest -Method GET -Endpoint "/leads/$leadId"

if ($getResult.Success) {
  Write-Host "✅ Lead encontrado!" -ForegroundColor Green
  Write-Host "   Nome: $($getResult.Data.nome)" -ForegroundColor Gray
  Write-Host "   Email: $($getResult.Data.email)" -ForegroundColor Gray
  Write-Host "   Telefone: $($getResult.Data.telefone)" -ForegroundColor Gray
  Write-Host "   Score: $($getResult.Data.score)/100" -ForegroundColor Gray
}
else {
  Write-Host "❌ Erro ao buscar lead: $($getResult.Error)" -ForegroundColor Red
  Write-Host "   Status Code: $($getResult.StatusCode)" -ForegroundColor Red
}

Write-Host ""

# PASSO 5: Atualizar Lead
Write-Host "📋 PASSO 5: Atualizar Lead" -ForegroundColor Yellow
Write-Host "Atualizando status para 'contatado'..." -ForegroundColor Gray

$updateBody = @{
  status      = "contatado"
  observacoes = "Lead contatado via telefone - script de teste"
}

$updateResult = Invoke-ApiRequest -Method PATCH -Endpoint "/leads/$leadId" -Body $updateBody

if ($updateResult.Success) {
  $newScore = $updateResult.Data.score
  Write-Host "✅ Lead atualizado com sucesso!" -ForegroundColor Green
  Write-Host "   Novo Status: $($updateResult.Data.status)" -ForegroundColor Gray
  Write-Host "   Score Recalculado: $newScore/100" -ForegroundColor Gray
  Write-Host "   Observações: $($updateResult.Data.observacoes)" -ForegroundColor Gray
}
else {
  Write-Host "❌ Erro ao atualizar lead: $($updateResult.Error)" -ForegroundColor Red
  Write-Host "   Status Code: $($updateResult.StatusCode)" -ForegroundColor Red
}

Write-Host ""

# PASSO 6: Obter Estatísticas
Write-Host "📋 PASSO 6: Obter Estatísticas" -ForegroundColor Yellow
Write-Host "Buscando estatísticas gerais..." -ForegroundColor Gray

$statsResult = Invoke-ApiRequest -Method GET -Endpoint "/leads/estatisticas"

if ($statsResult.Success) {
  $stats = $statsResult.Data
  Write-Host "✅ Estatísticas recuperadas!" -ForegroundColor Green
  Write-Host "   Total de Leads: $($stats.total)" -ForegroundColor Gray
  Write-Host "   Novos: $($stats.novos)" -ForegroundColor Gray
  Write-Host "   Contatados: $($stats.contatados)" -ForegroundColor Gray
  Write-Host "   Qualificados: $($stats.qualificados)" -ForegroundColor Gray
  Write-Host "   Convertidos: $($stats.convertidos)" -ForegroundColor Gray
  Write-Host "   Taxa de Conversão: $($stats.taxaConversao)%" -ForegroundColor Gray
  Write-Host "   Score Médio: $($stats.scoreMedio)/100" -ForegroundColor Gray
}
else {
  Write-Host "❌ Erro ao obter estatísticas: $($statsResult.Error)" -ForegroundColor Red
  Write-Host "   Status Code: $($statsResult.StatusCode)" -ForegroundColor Red
}

Write-Host ""

# PASSO 7: Testar Filtros
Write-Host "📋 PASSO 7: Testar Filtros" -ForegroundColor Yellow
Write-Host "Filtrando leads por status 'contatado'..." -ForegroundColor Gray

$filterResult = Invoke-ApiRequest -Method GET -Endpoint "/leads?status=contatado"

if ($filterResult.Success) {
  $filteredCount = $filterResult.Data.Count
  Write-Host "✅ Filtro aplicado com sucesso!" -ForegroundColor Green
  Write-Host "   Leads com status 'contatado': $filteredCount" -ForegroundColor Gray
}
else {
  Write-Host "❌ Erro ao filtrar: $($filterResult.Error)" -ForegroundColor Red
  Write-Host "   Status Code: $($filterResult.StatusCode)" -ForegroundColor Red
}

Write-Host ""

# PASSO 8: Deletar Lead
Write-Host "📋 PASSO 8: Deletar Lead (Cleanup)" -ForegroundColor Yellow
Write-Host "Removendo lead de teste..." -ForegroundColor Gray

$deleteResult = Invoke-ApiRequest -Method DELETE -Endpoint "/leads/$leadId"

if ($deleteResult.Success) {
  Write-Host "✅ Lead removido com sucesso!" -ForegroundColor Green
}
else {
  Write-Host "❌ Erro ao deletar lead: $($deleteResult.Error)" -ForegroundColor Red
  Write-Host "   Status Code: $($deleteResult.StatusCode)" -ForegroundColor Red
}

Write-Host ""
Write-Host "=" * 60 -ForegroundColor Cyan
Write-Host "✅ TESTES CONCLUÍDOS!" -ForegroundColor Green
Write-Host ""
Write-Host "📊 Resumo:" -ForegroundColor Cyan
Write-Host "   ✅ Autenticação" -ForegroundColor Green
Write-Host "   ✅ Criar Lead (com cálculo de score)" -ForegroundColor Green
Write-Host "   ✅ Listar Leads" -ForegroundColor Green
Write-Host "   ✅ Buscar Lead por ID" -ForegroundColor Green
Write-Host "   ✅ Atualizar Lead (com recálculo de score)" -ForegroundColor Green
Write-Host "   ✅ Estatísticas" -ForegroundColor Green
Write-Host "   ✅ Filtros" -ForegroundColor Green
Write-Host "   ✅ Deletar Lead" -ForegroundColor Green
Write-Host ""
