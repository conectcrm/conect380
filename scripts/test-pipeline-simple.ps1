# Script de teste das melhorias do pipeline
Write-Host "Teste iniciando..." -ForegroundColor Cyan

$BackendUrl = "http://localhost:3001"
$testsPassed = 0
$testsFailed = 0
$testsTotal = 0

function Test-Step {
  param([string]$Description, [scriptblock]$Test)
  $script:testsTotal++
  Write-Host ""
  Write-Host "[$script:testsTotal] $Description" -ForegroundColor Yellow
  try {
    & $Test
    Write-Host "   OK PASSOU" -ForegroundColor Green
    $script:testsPassed++
  }
  catch {
    Write-Host "   ERRO FALHOU: $($_.Exception.Message)" -ForegroundColor Red
    $script:testsFailed++
  }
}

# Teste 1: Backend responde
Test-Step "Backend esta respondendo" {
  $response = Invoke-WebRequest -Uri "$BackendUrl/health" -Method GET -TimeoutSec 5 -UseBasicParsing
  if ($response.StatusCode -ne 200) { throw "Backend nao respondeu" }
}

# Teste 2: Login
$token = $null
Test-Step "Login no sistema" {
  $loginBody = @{ email = "admin@conectsuite.com.br"; senha = "admin123" } | ConvertTo-Json
  $response = Invoke-RestMethod -Uri "$BackendUrl/auth/login" -Method POST -Body $loginBody -ContentType "application/json"
  if (-not $response.data.access_token) { throw "Token nao retornado" }
  $script:token = $response.data.access_token
  Write-Host "   Token obtido" -ForegroundColor Gray
}

# Teste 3: Criar oportunidade
$novaOportunidadeId = $null
Test-Step "Criar nova oportunidade" {
  $headers = @{ "Authorization" = "Bearer $script:token"; "Content-Type" = "application/json" }
  $usuarios = Invoke-RestMethod -Uri "$BackendUrl/usuarios" -Method GET -Headers $headers
  $responsavelId = $usuarios[0].id
    
  $novaOportunidade = @{
    titulo         = "Teste Motivo Perda"
    valor          = 50000
    probabilidade  = 50
    estagio        = "proposal"
    prioridade     = "high"
    origem         = "website"
    responsavel_id = $responsavelId
    nomeContato    = "Cliente Teste"
  } | ConvertTo-Json
    
  $response = Invoke-RestMethod -Uri "$BackendUrl/oportunidades" -Method POST -Headers $headers -Body $novaOportunidade
  if (-not $response.id) { throw "ID nao retornado" }
  $script:novaOportunidadeId = $response.id
  Write-Host "   Oportunidade criada: $script:novaOportunidadeId" -ForegroundColor Gray
}

# Teste 4: Tentar marcar como PERDIDO SEM motivo (deve falhar)
Test-Step "Tentar marcar PERDIDO sem motivo (deve rejeitar)" {
  $headers = @{ "Authorization" = "Bearer $script:token"; "Content-Type" = "application/json" }
  $body = @{ estagio = "lost" } | ConvertTo-Json
    
  try {
    $response = Invoke-RestMethod -Uri "$BackendUrl/oportunidades/$script:novaOportunidadeId/estagio" -Method PATCH -Headers $headers -Body $body
    throw "Backend deveria ter rejeitado, mas aceitou"
  }
  catch {
    if ($_.Exception.Message -like "*400*" -or $_.Exception.Message -like "*motivo*") {
      Write-Host "   Backend corretamente rejeitou" -ForegroundColor Gray
    }
    else {
      throw "Erro inesperado: $($_.Exception.Message)"
    }
  }
}

# Teste 5: Marcar como PERDIDO COM motivo (deve passar)
Test-Step "Marcar PERDIDO com motivo PRECO (deve passar)" {
  $headers = @{ "Authorization" = "Bearer $script:token"; "Content-Type" = "application/json" }
  $body = @{
    estagio             = "lost"
    motivoPerda         = "PRECO"
    motivoPerdaDetalhes = "Cliente achou valor alto"
  } | ConvertTo-Json
    
  $response = Invoke-RestMethod -Uri "$BackendUrl/oportunidades/$script:novaOportunidadeId/estagio" -Method PATCH -Headers $headers -Body $body
    
  if ($response.estagio -ne "lost") { throw "Estagio esperado: lost" }
  if ($response.motivoPerda -ne "PRECO") { throw "Motivo esperado: PRECO" }
  if ($response.probabilidade -ne 0) { throw "Probabilidade esperada: 0" }
    
  Write-Host "   Motivo: $($response.motivoPerda)" -ForegroundColor Gray
  Write-Host "   Probabilidade: 0% (ajustada automaticamente)" -ForegroundColor Gray
}

# Teste 6: Verificar campos SLA
Test-Step "Verificar campos SLA foram salvos" {
  $headers = @{ "Authorization" = "Bearer $script:token" }
  $oportunidade = Invoke-RestMethod -Uri "$BackendUrl/oportunidades/$script:novaOportunidadeId" -Method GET -Headers $headers
    
  if (-not $oportunidade.dataUltimaMudancaEstagio) { throw "dataUltimaMudancaEstagio nao salvo" }
  if ($null -eq $oportunidade.diasNoEstagioAtual) { throw "diasNoEstagioAtual nao calculado" }
    
  Write-Host "   diasNoEstagioAtual: $($oportunidade.diasNoEstagioAtual) dias" -ForegroundColor Gray
  Write-Host "   precisaAtencao: $($oportunidade.precisaAtencao)" -ForegroundColor Gray
}

Write-Host ""
Write-Host "=============================" -ForegroundColor Cyan
Write-Host "RESUMO DOS TESTES" -ForegroundColor Cyan
Write-Host "=============================" -ForegroundColor Cyan
Write-Host "Total: $testsTotal" -ForegroundColor White
Write-Host "Aprovados: $testsPassed" -ForegroundColor Green
Write-Host "Falharam: $testsFailed" -ForegroundColor Red
Write-Host ""

if ($testsFailed -eq 0) {
  Write-Host "TODOS OS TESTES PASSARAM!" -ForegroundColor Green
  Write-Host ""
  Write-Host "Loss Reason Tracking - OK" -ForegroundColor Green
  Write-Host "SLA Calculation - OK" -ForegroundColor Green
  Write-Host "Auto-Probability - OK" -ForegroundColor Green
}
