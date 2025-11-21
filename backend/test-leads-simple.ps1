# Teste API Leads - Versao Simplificada
$baseUrl = "http://localhost:3001"

Write-Host "=== TESTE API LEADS ===" -ForegroundColor Cyan
Write-Host ""

# 1. Login
Write-Host "1. Testando Login..." -ForegroundColor Yellow
$loginBody = @{
  email    = "admin@conectcrm.com"
  password = "Admin@123"
} | ConvertTo-Json

try {
  $loginResponse = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method POST -Body $loginBody -ContentType "application/json"
  $token = $loginResponse.access_token
  $empresaId = $loginResponse.user.empresa_id
  Write-Host "OK - Token obtido" -ForegroundColor Green
  Write-Host "Empresa ID: $empresaId" -ForegroundColor Gray
}
catch {
  Write-Host "ERRO no login: $_" -ForegroundColor Red
  exit 1
}

Write-Host ""

# 2. Criar Lead
Write-Host "2. Criando Lead..." -ForegroundColor Yellow
$headers = @{
  "Authorization" = "Bearer $token"
  "Content-Type"  = "application/json"
}

$createBody = @{
  nome         = "Teste API Lead"
  email        = "teste@example.com"
  telefone     = "(11) 98765-4321"
  empresa_nome = "Empresa Teste"
  origem       = "site"
} | ConvertTo-Json

try {
  $createResponse = Invoke-RestMethod -Uri "$baseUrl/leads" -Method POST -Headers $headers -Body $createBody
  $leadId = $createResponse.id
  Write-Host "OK - Lead criado: $leadId" -ForegroundColor Green
  Write-Host "Score: $($createResponse.score)" -ForegroundColor Gray
}
catch {
  Write-Host "ERRO: $_" -ForegroundColor Red
  exit 1
}

Write-Host ""

# 3. Listar Leads
Write-Host "3. Listando Leads..." -ForegroundColor Yellow
try {
  $listResponse = Invoke-RestMethod -Uri "$baseUrl/leads" -Method GET -Headers $headers
  Write-Host "OK - Total: $($listResponse.Count) leads" -ForegroundColor Green
}
catch {
  Write-Host "ERRO: $_" -ForegroundColor Red
}

Write-Host ""

# 4. Buscar por ID
Write-Host "4. Buscando Lead $leadId..." -ForegroundColor Yellow
try {
  $getResponse = Invoke-RestMethod -Uri "$baseUrl/leads/$leadId" -Method GET -Headers $headers
  Write-Host "OK - Nome: $($getResponse.nome)" -ForegroundColor Green
}
catch {
  Write-Host "ERRO: $_" -ForegroundColor Red
}

Write-Host ""

# 5. Atualizar
Write-Host "5. Atualizando Lead..." -ForegroundColor Yellow
$updateBody = @{
  status = "contatado"
} | ConvertTo-Json

try {
  $updateResponse = Invoke-RestMethod -Uri "$baseUrl/leads/$leadId" -Method PATCH -Headers $headers -Body $updateBody
  Write-Host "OK - Status: $($updateResponse.status)" -ForegroundColor Green
  Write-Host "Score recalculado: $($updateResponse.score)" -ForegroundColor Gray
}
catch {
  Write-Host "ERRO: $_" -ForegroundColor Red
}

Write-Host ""

# 6. Estatisticas
Write-Host "6. Obtendo Estatisticas..." -ForegroundColor Yellow
try {
  $statsResponse = Invoke-RestMethod -Uri "$baseUrl/leads/estatisticas" -Method GET -Headers $headers
  Write-Host "OK - Total: $($statsResponse.total)" -ForegroundColor Green
  Write-Host "Taxa Conversao: $($statsResponse.taxaConversao)%" -ForegroundColor Gray
}
catch {
  Write-Host "ERRO: $_" -ForegroundColor Red
}

Write-Host ""

# 7. Deletar
Write-Host "7. Deletando Lead..." -ForegroundColor Yellow
try {
  Invoke-RestMethod -Uri "$baseUrl/leads/$leadId" -Method DELETE -Headers $headers | Out-Null
  Write-Host "OK - Lead removido" -ForegroundColor Green
}
catch {
  Write-Host "ERRO: $_" -ForegroundColor Red
}

Write-Host ""
Write-Host "=== TESTES CONCLUIDOS ===" -ForegroundColor Cyan
