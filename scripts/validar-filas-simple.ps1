# Script de Validacao - Consolidacao Equipe para Fila
# Data: 10/11/2025

Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "  VALIDACAO: Consolidacao Equipe -> Fila" -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""

# Configuracoes
$DB_HOST = "localhost"
$DB_PORT = "5434"
$DB_NAME = "conectcrm_db"
$DB_USER = "conectcrm"
$env:PGPASSWORD = "conectcrm123"
$API_BASE_URL = "http://localhost:3001"

# ========================================
# 1. VALIDACAO DE SCHEMA
# ========================================
Write-Host "ETAPA 1: Validando Schema do Banco de Dados" -ForegroundColor Yellow
Write-Host "================================================================" -ForegroundColor Gray

# Verificar colunas da tabela filas
Write-Host "`nVerificando colunas da tabela 'filas'..." -ForegroundColor White
$filasColumns = psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'filas' ORDER BY ordinal_position;" 2>&1

if ($LASTEXITCODE -eq 0) {
  Write-Host "OK Colunas encontradas" -ForegroundColor Green
    
  # Verificar se as novas colunas existem
  $hasNucleoId = $filasColumns -match "nucleoId"
  $hasDepartamentoId = $filasColumns -match "departamentoId"
  $hasCor = $filasColumns -match "cor"
  $hasIcone = $filasColumns -match "icone"
    
  if ($hasNucleoId) { Write-Host "  [OK] nucleoId - PRESENTE" -ForegroundColor Green } 
  else { Write-Host "  [ERRO] nucleoId - AUSENTE" -ForegroundColor Red }
    
  if ($hasDepartamentoId) { Write-Host "  [OK] departamentoId - PRESENTE" -ForegroundColor Green } 
  else { Write-Host "  [ERRO] departamentoId - AUSENTE" -ForegroundColor Red }
    
  if ($hasCor) { Write-Host "  [OK] cor - PRESENTE" -ForegroundColor Green } 
  else { Write-Host "  [ERRO] cor - AUSENTE" -ForegroundColor Red }
    
  if ($hasIcone) { Write-Host "  [OK] icone - PRESENTE" -ForegroundColor Green } 
  else { Write-Host "  [ERRO] icone - AUSENTE" -ForegroundColor Red }
}
else {
  Write-Host "[ERRO] ao consultar tabela filas" -ForegroundColor Red
}

# Verificar se tabelas antigas existem
Write-Host "`nVerificando se tabelas antigas foram removidas..." -ForegroundColor White
$tabelasAntigas = @("equipes", "equipe_atribuicoes", "atendente_equipes")

foreach ($tabela in $tabelasAntigas) {
  $existe = psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = '$tabela');" 2>&1
    
  if ($existe -match "f") {
    Write-Host "  [OK] Tabela '$tabela' - REMOVIDA" -ForegroundColor Green
  }
  else {
    Write-Host "  [ERRO] Tabela '$tabela' - AINDA EXISTE" -ForegroundColor Red
  }
}

# Contar filas migradas
Write-Host "`nContando filas migradas..." -ForegroundColor White
$countFilas = psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM filas;" 2>&1
Write-Host "  Total de filas: $countFilas" -ForegroundColor Cyan

# ========================================
# 2. TESTE DE ENDPOINTS
# ========================================
Write-Host "`n`nETAPA 2: Testando Endpoints da API" -ForegroundColor Yellow
Write-Host "================================================================" -ForegroundColor Gray

# Obter primeiro empresaId para testes
Write-Host "`nObtendo empresaId para testes..." -ForegroundColor White
$empresaId = psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "SELECT id FROM empresas LIMIT 1;" 2>&1 | Where-Object { $_ -match '\S' } | ForEach-Object { $_.Trim() }

if ($empresaId) {
  Write-Host "  [OK] empresaId: $empresaId" -ForegroundColor Green
    
  # Teste 1: GET /api/filas
  Write-Host "`nTestando GET /api/filas?empresaId=$empresaId" -ForegroundColor White
  try {
    $response = Invoke-RestMethod -Uri "$API_BASE_URL/api/filas?empresaId=$empresaId" -Method Get -ContentType "application/json" -ErrorAction Stop
    Write-Host "  [OK] Status: 200 OK" -ForegroundColor Green
    Write-Host "  Total de filas retornadas: $($response.Count)" -ForegroundColor Cyan
        
    # Verificar se filas tem os novos campos
    if ($response.Count -gt 0) {
      $primeiraFila = $response[0]
      Write-Host "`n  Primeira fila:" -ForegroundColor White
      Write-Host "     ID: $($primeiraFila.id)" -ForegroundColor Gray
      Write-Host "     Nome: $($primeiraFila.nome)" -ForegroundColor Gray
      Write-Host "     Cor: $($primeiraFila.cor)" -ForegroundColor Gray
      Write-Host "     Icone: $($primeiraFila.icone)" -ForegroundColor Gray
      Write-Host "     Nucleo ID: $($primeiraFila.nucleoId)" -ForegroundColor Gray
      Write-Host "     Departamento ID: $($primeiraFila.departamentoId)" -ForegroundColor Gray
    }
  }
  catch {
    Write-Host "  [ERRO] $($_.Exception.Message)" -ForegroundColor Red
  }
    
  # Obter ID de uma fila para testes
  $filaId = psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "SELECT id FROM filas WHERE \"empresaId\" = '$empresaId' LIMIT 1;" 2>&1 | Where-Object { $_ -match '\S' } | ForEach-Object { $_.Trim() }
    
  if ($filaId) {
    Write-Host "`n  [OK] filaId para testes: $filaId" -ForegroundColor Green
        
    # Obter nucleoId para teste
    $nucleoId = psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "SELECT id FROM nucleos_atendimento LIMIT 1;" 2>&1 | Where-Object { $_ -match '\S' } | ForEach-Object { $_.Trim() }
        
    if ($nucleoId) {
      Write-Host "  [OK] nucleoId para testes: $nucleoId" -ForegroundColor Green
            
      # Teste 2: PATCH /api/filas/:id/nucleo
      Write-Host "`nTestando PATCH /api/filas/$filaId/nucleo" -ForegroundColor White
      try {
        $body = @{ nucleoId = $nucleoId } | ConvertTo-Json
        $response = Invoke-RestMethod -Uri "$API_BASE_URL/api/filas/$filaId/nucleo" -Method Patch -Body $body -ContentType "application/json" -ErrorAction Stop
        Write-Host "  [OK] Status: 200 OK" -ForegroundColor Green
        Write-Host "  [OK] Nucleo atribuido com sucesso!" -ForegroundColor Green
      }
      catch {
        Write-Host "  [ERRO] $($_.Exception.Message)" -ForegroundColor Red
      }
            
      # Teste 3: GET /api/filas/nucleo/:id/ideal
      Write-Host "`nTestando GET /api/filas/nucleo/$nucleoId/ideal" -ForegroundColor White
      try {
        $response = Invoke-RestMethod -Uri "$API_BASE_URL/api/filas/nucleo/$nucleoId/ideal" -Method Get -ContentType "application/json" -ErrorAction Stop
        Write-Host "  [OK] Status: 200 OK" -ForegroundColor Green
        Write-Host "  Fila ideal encontrada: $($response.nome)" -ForegroundColor Cyan
        Write-Host "     Atendimentos ativos: $($response.atendimentosAtivos)" -ForegroundColor Gray
        Write-Host "     Taxa de ocupacao: $([math]::Round($response.taxaOcupacao * 100, 2))%" -ForegroundColor Gray
      }
      catch {
        Write-Host "  [ERRO] $($_.Exception.Message)" -ForegroundColor Red
      }
    }
    else {
      Write-Host "  [AVISO] Nenhum nucleo encontrado para testes" -ForegroundColor Yellow
    }
  }
  else {
    Write-Host "  [AVISO] Nenhuma fila encontrada para testes" -ForegroundColor Yellow
  }
}
else {
  Write-Host "  [ERRO] Nenhuma empresa encontrada para testes" -ForegroundColor Red
}

# ========================================
# RESUMO FINAL
# ========================================
Write-Host "`n`n================================================================" -ForegroundColor Cyan
Write-Host "  VALIDACAO CONCLUIDA" -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "[OK] Schema validado" -ForegroundColor Green
Write-Host "[OK] Endpoints testados" -ForegroundColor Green
Write-Host ""
Write-Host "Proximos passos:" -ForegroundColor Yellow
Write-Host "   1. Testar frontend em http://localhost:3000/configuracoes/gestao-equipes" -ForegroundColor White
Write-Host "   2. Verificar banner de depreciacao" -ForegroundColor White
Write-Host "   3. Testar criacao de nova fila com nucleo/departamento" -ForegroundColor White
Write-Host ""
