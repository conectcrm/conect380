# Script de Teste - Integracao Propostas e Oportunidades
# Data: 02/12/2025

Write-Host ""
Write-Host "===========================================================" -ForegroundColor Cyan
Write-Host "  TESTE DE INTEGRACAO - PROPOSTAS <-> OPORTUNIDADES" -ForegroundColor Cyan
Write-Host "===========================================================" -ForegroundColor Cyan
Write-Host ""

# Configuracoes
$baseUrl = "http://localhost:3001"
$email = "admin@conectsuite.com.br"
$password = "admin123"

# Teste 1: Backend
Write-Host "1. Verificando Backend..." -ForegroundColor Yellow
try {
  $health = Invoke-RestMethod -Uri "$baseUrl/health" -Method Get -ErrorAction Stop
  Write-Host "   [OK] Backend esta respondendo" -ForegroundColor Green
}
catch {
  Write-Host "   [ERRO] Backend nao esta respondendo" -ForegroundColor Red
  Write-Host "   Mensagem: $($_.Exception.Message)" -ForegroundColor Yellow
  exit 1
}

# Teste 2: Login
Write-Host ""
Write-Host "2. Testando Autenticacao..." -ForegroundColor Yellow
try {
  $loginBody = @{
    email    = $email
    password = $password
  } | ConvertTo-Json

  $loginResponse = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body $loginBody -ContentType "application/json" -ErrorAction Stop
  $token = $loginResponse.access_token
    
  if ($token) {
    Write-Host "   [OK] Login bem-sucedido" -ForegroundColor Green
  }
  else {
    Write-Host "   [ERRO] Token nao retornado" -ForegroundColor Red
    exit 1
  }
}
catch {
  Write-Host "   [ERRO] Falha no login" -ForegroundColor Red
  Write-Host "   Mensagem: $($_.Exception.Message)" -ForegroundColor Yellow
  exit 1
}

# Headers
$headers = @{
  "Authorization" = "Bearer $token"
  "Content-Type"  = "application/json"
}

# Teste 3: Oportunidades
Write-Host ""
Write-Host "3. Verificando Oportunidades..." -ForegroundColor Yellow
try {
  $oportunidades = Invoke-RestMethod -Uri "$baseUrl/oportunidades" -Method Get -Headers $headers -ErrorAction Stop
    
  if ($oportunidades -and $oportunidades.Count -gt 0) {
    Write-Host "   [OK] Total de oportunidades: $($oportunidades.Count)" -ForegroundColor Green
    $oportunidadeTeste = $oportunidades[0]
    Write-Host "   Usando oportunidade ID: $($oportunidadeTeste.id)" -ForegroundColor Gray
  }
  else {
    Write-Host "   [AVISO] Nenhuma oportunidade encontrada" -ForegroundColor Yellow
    Write-Host "   Criando oportunidade de teste..." -ForegroundColor Cyan
        
    $novaOportunidade = @{
      titulo          = "Teste Integracao - $(Get-Date -Format 'HH:mm:ss')"
      descricao       = "Criada automaticamente para teste"
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
        
    $oportunidadeTeste = Invoke-RestMethod -Uri "$baseUrl/oportunidades" -Method Post -Headers $headers -Body $novaOportunidade -ErrorAction Stop
    Write-Host "   [OK] Oportunidade criada: ID=$($oportunidadeTeste.id)" -ForegroundColor Green
  }
}
catch {
  Write-Host "   [ERRO] Falha ao acessar oportunidades" -ForegroundColor Red
  Write-Host "   Mensagem: $($_.Exception.Message)" -ForegroundColor Yellow
  exit 1
}

# Teste 4: Endpoint gerar-proposta
Write-Host ""
Write-Host "4. Testando Endpoint 'Gerar Proposta'..." -ForegroundColor Yellow
try {
  # Buscar empresas para obter um empresaId valido
  try {
    $empresas = Invoke-RestMethod -Uri "$baseUrl/empresas" -Method Get -Headers $headers -ErrorAction Stop
    if ($empresas -and $empresas.Count -gt 0) {
      $empresaId = $empresas[0].id
      Write-Host "   Usando empresa ID: $empresaId" -ForegroundColor Gray
    }
    else {
      # Tentar UUID padrao
      $empresaId = "00000000-0000-0000-0000-000000000001"
      Write-Host "   Usando empresa ID padrao (teste)" -ForegroundColor Gray
    }
  }
  catch {
    $empresaId = "00000000-0000-0000-0000-000000000001"
    Write-Host "   Usando empresa ID padrao (teste)" -ForegroundColor Gray
  }
    
  $body = @{
    empresaId = $empresaId
  } | ConvertTo-Json
    
  $resultado = Invoke-RestMethod -Uri "$baseUrl/oportunidades/$($oportunidadeTeste.id)/gerar-proposta" -Method Post -Headers $headers -Body $body -ErrorAction Stop
    
  if ($resultado.success -and $resultado.proposta) {
    Write-Host "   [OK] Proposta gerada com sucesso!" -ForegroundColor Green
    Write-Host "   Proposta ID: $($resultado.proposta.id)" -ForegroundColor Gray
    Write-Host "   Numero: $($resultado.proposta.numero)" -ForegroundColor Gray
    $propostaGerada = $resultado.proposta
        
    # Verificar vinculo
    if ($propostaGerada.oportunidade_id -eq $oportunidadeTeste.id) {
      Write-Host "   [OK] Proposta vinculada a oportunidade" -ForegroundColor Green
    }
    else {
      Write-Host "   [AVISO] Vinculo nao confirmado" -ForegroundColor Yellow
    }
  }
  else {
    Write-Host "   [ERRO] Resposta inesperada do endpoint" -ForegroundColor Red
  }
}
catch {
  Write-Host "   [ERRO] Falha ao gerar proposta" -ForegroundColor Red
  $errorMsg = ""
  try {
    $errorDetails = $_.ErrorDetails.Message | ConvertFrom-Json
    $errorMsg = $errorDetails.message
  }
  catch {
    $errorMsg = $_.Exception.Message
  }
  Write-Host "   Mensagem: $errorMsg" -ForegroundColor Yellow
    
  if ($errorMsg -like "*empresa*") {
    Write-Host ""
    Write-Host "   NOTA: E necessario criar uma empresa no sistema" -ForegroundColor Cyan
    Write-Host "   Acesse: http://localhost:3000/nuclei/configuracoes/empresas" -ForegroundColor Cyan
  }
}

# Teste 5: Sincronizacao
if ($propostaGerada) {
  Write-Host ""
  Write-Host "5. Verificando Sincronizacao..." -ForegroundColor Yellow
    
  try {
    $oportunidadeAtualizada = Invoke-RestMethod -Uri "$baseUrl/oportunidades/$($oportunidadeTeste.id)" -Method Get -Headers $headers -ErrorAction Stop
        
    if ($oportunidadeAtualizada.estagio -eq "PROPOSTA") {
      Write-Host "   [OK] Oportunidade movida para estagio PROPOSTA" -ForegroundColor Green
    }
    else {
      Write-Host "   [AVISO] Estagio atual: $($oportunidadeAtualizada.estagio)" -ForegroundColor Yellow
    }
        
    # Verificar atividades
    try {
      $atividades = Invoke-RestMethod -Uri "$baseUrl/oportunidades/$($oportunidadeTeste.id)/atividades" -Method Get -Headers $headers -ErrorAction Stop
      $atividadeProposta = $atividades | Where-Object { $_.descricao -like "*Proposta*gerada*" }
            
      if ($atividadeProposta) {
        Write-Host "   [OK] Atividade de historico criada" -ForegroundColor Green
      }
      else {
        Write-Host "   [AVISO] Atividade nao encontrada no historico" -ForegroundColor Yellow
      }
    }
    catch {
      Write-Host "   [ERRO] Falha ao buscar atividades" -ForegroundColor Red
    }
  }
  catch {
    Write-Host "   [ERRO] Falha ao verificar sincronizacao" -ForegroundColor Red
  }
}

# Resumo
Write-Host ""
Write-Host "===========================================================" -ForegroundColor Cyan
Write-Host "  RESUMO DO TESTE" -ForegroundColor Cyan
Write-Host "===========================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Backend: ONLINE" -ForegroundColor Green
Write-Host "Autenticacao: OK" -ForegroundColor Green
Write-Host "Integracao: " -NoNewline
if ($propostaGerada) {
  Write-Host "FUNCIONAL" -ForegroundColor Green
}
else {
  Write-Host "NECESSITA CONFIGURACAO" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Proximos Passos:" -ForegroundColor Cyan
Write-Host "  1. Acesse: http://localhost:3000/comercial/pipeline"
Write-Host "  2. Clique no botao verde 'Proposta' em uma oportunidade"
Write-Host "  3. Verifique se a proposta tem badge da oportunidade"
Write-Host "  4. Aprove/Rejeite e veja a sincronizacao automatica"
Write-Host ""
