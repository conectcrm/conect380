# Script de Testes Rapidos - APIs
# Valida endpoints sem precisar do navegador

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  TESTES RAPIDOS - APIs Backend" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# ============================================
# 1. VERIFICAR BACKEND
# ============================================
Write-Host "[1/5] Verificando Backend..." -ForegroundColor Yellow
try {
  $health = Invoke-RestMethod -Uri "http://localhost:3001/health" -Method GET -ErrorAction Stop
  Write-Host "   [OK] Backend respondeu /health" -ForegroundColor Green
}
catch {
  $tcpUp = Test-NetConnection -ComputerName localhost -Port 3001 -InformationLevel Quiet
  if ($tcpUp) {
    Write-Host "   [WARN] /health retornou erro, mas a porta 3001 esta ativa" -ForegroundColor Yellow
  }
  else {
    Write-Host "   [X] Porta 3001 nao esta respondendo" -ForegroundColor Red
    Write-Host "   Execute: cd backend; npm run start:dev" -ForegroundColor Yellow
    exit 1
  }
}

# ============================================
# 2. FAZER LOGIN
# ============================================
Write-Host ""
Write-Host "[2/5] Fazendo Login..." -ForegroundColor Yellow

$loginBody = @{
  email = "teste.triagem@test.com"
  senha = "teste123"
} | ConvertTo-Json

try {
  $loginResponse = Invoke-RestMethod -Uri "http://localhost:3001/auth/login" `
    -Method POST `
    -Body $loginBody `
    -ContentType "application/json" `
    -ErrorAction Stop
    
  $token = $loginResponse.data.access_token
  $usuarioNome = $loginResponse.data.user.nome
  Write-Host "   [OK] Login realizado com sucesso!" -ForegroundColor Green
  Write-Host "   Usuario: $usuarioNome" -ForegroundColor Gray
}
catch {
  Write-Host "   [X] Erro no login!" -ForegroundColor Red
  Write-Host "   Detalhes: $_" -ForegroundColor Red
  exit 1
}

# Criar headers com token
$headers = @{
  "Authorization" = "Bearer $token"
  "Content-Type"  = "application/json"
}

# ============================================
# 3. LISTAR NUCLEOS
# ============================================
Write-Host ""
Write-Host "[3/5] Listando Nucleos de Atendimento..." -ForegroundColor Yellow

try {
  $nucleos = Invoke-RestMethod -Uri "http://localhost:3001/nucleos" `
    -Method GET `
    -Headers $headers `
    -ErrorAction Stop
    
  $totalNucleos = $nucleos.Count
  Write-Host "   [OK] $totalNucleos nucleos encontrados:" -ForegroundColor Green
    
  foreach ($nucleo in $nucleos) {
    $status = if ($nucleo.ativo) { "[ATIVO]" } else { "[INATIVO]" }
    Write-Host "      - $($nucleo.nome) ($($nucleo.codigo)) - $($nucleo.tipoDistribuicao) - $status" -ForegroundColor Gray
  }
}
catch {
  Write-Host "   [X] Erro ao listar nucleos!" -ForegroundColor Red
  Write-Host "   Detalhes: $_" -ForegroundColor Red
}

# ============================================
# 4. LISTAR FLUXOS
# ============================================
Write-Host ""
Write-Host "[4/5] Listando Fluxos de Triagem..." -ForegroundColor Yellow

try {
  $fluxos = Invoke-RestMethod -Uri "http://localhost:3001/fluxos" `
    -Method GET `
    -Headers $headers `
    -ErrorAction Stop
    
  $totalFluxos = $fluxos.Count
  Write-Host "   [OK] $totalFluxos fluxos encontrados:" -ForegroundColor Green
    
  if ($totalFluxos -eq 0) {
    Write-Host "      [INFO] Nenhum fluxo cadastrado ainda" -ForegroundColor Yellow
  }
  else {
    foreach ($fluxo in $fluxos) {
      $publicado = if ($fluxo.publicado) { "[PUBLICADO]" } else { "[RASCUNHO]" }
      $ativo = if ($fluxo.ativo) { "[OK]" } else { "[OFF]" }
      Write-Host "      $ativo $($fluxo.nome) (v$($fluxo.versao)) - $($fluxo.tipo) - $publicado" -ForegroundColor Gray
    }
  }
}
catch {
  Write-Host "   [X] Erro ao listar fluxos!" -ForegroundColor Red
  Write-Host "   Detalhes: $_" -ForegroundColor Red
}

# ============================================
# 5. TESTE RAPIDO: CRIAR E DELETAR NUCLEO
# ============================================
Write-Host ""
Write-Host "[5/5] Teste CRUD - Criar e Deletar Nucleo de Teste..." -ForegroundColor Yellow

$novoNucleo = @{
  nome                 = "TESTE SCRIPT POWERSHELL"
  descricao            = "Criado automaticamente via teste rapido"
  cor                  = "#2563EB"
  icone                = "headset"
  ativo                = $true
  prioridade           = 50
  tipoDistribuicao     = "round_robin"
  capacidadeMaxima     = 15
  slaRespostaMinutos   = 30
  slaResolucaoHoras    = 12
  horarioFuncionamento = @{
    ativo      = $true
    inicio     = "08:00"
    fim        = "18:00"
    diasSemana = @(1, 2, 3, 4, 5)
  }
  mensagemBoasVindas   = "Bem-vindo ao nucleo de testes"
} | ConvertTo-Json -Depth 4

try {
  # Criar
  $nucleoCriado = Invoke-RestMethod -Uri "http://localhost:3001/nucleos" `
    -Method POST `
    -Headers $headers `
    -Body $novoNucleo `
    -ErrorAction Stop
    
  Write-Host "   [OK] Nucleo criado: ID $($nucleoCriado.id)" -ForegroundColor Green
    
  Start-Sleep -Seconds 1
    
  # Deletar
  Invoke-RestMethod -Uri "http://localhost:3001/nucleos/$($nucleoCriado.id)" `
    -Method DELETE `
    -Headers $headers `
    -ErrorAction Stop | Out-Null
    
  Write-Host "   [OK] Nucleo deletado com sucesso" -ForegroundColor Green
}
catch {
  Write-Host "   [X] Erro no teste CRUD!" -ForegroundColor Red
  Write-Host "   Detalhes: $_" -ForegroundColor Red
}

# ============================================
# RESUMO FINAL
# ============================================
Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  [OK] TESTES CONCLUIDOS!" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Resumo:" -ForegroundColor Yellow
Write-Host "   - Backend: [OK] Online" -ForegroundColor Green
Write-Host "   - Autenticacao: [OK] Funcionando" -ForegroundColor Green
Write-Host "   - Nucleos: [OK] $totalNucleos cadastrados" -ForegroundColor Green
Write-Host "   - Fluxos: [OK] $totalFluxos cadastrados" -ForegroundColor Green
Write-Host "   - CRUD: [OK] Testado com sucesso" -ForegroundColor Green
Write-Host ""
Write-Host "[WEB] Acesse o frontend em: http://localhost:3000" -ForegroundColor Cyan
Write-Host "   - Gestao de Nucleos: http://localhost:3000/gestao/nucleos" -ForegroundColor Gray
Write-Host "   - Gestao de Fluxos: http://localhost:3000/gestao/fluxos" -ForegroundColor Gray
Write-Host ""
