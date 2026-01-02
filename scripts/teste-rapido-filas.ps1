# Teste Rápido de Endpoints - Gestão de Filas
# Email: admin@conectsuite.com.br | Senha: admin123

Write-Host "========================================" -ForegroundColor Cyan
Write-Host " TESTE RAPIDO - ENDPOINTS DE FILAS" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Login
Write-Host "[1/5] Fazendo login..." -ForegroundColor Yellow
$loginBody = @{
  email = "admin@conectsuite.com.br"
  senha = "admin123"
} | ConvertTo-Json

try {
  $loginResponse = Invoke-RestMethod -Uri "http://localhost:3001/auth/login" -Method POST -Body $loginBody -ContentType "application/json"
  $token = $loginResponse.data.access_token
  Write-Host "      [OK] Token obtido" -ForegroundColor Green
}
catch {
  Write-Host "      [ERRO] Falha no login: $($_.Exception.Message)" -ForegroundColor Red
  exit 1
}

$headers = @{
  "Authorization" = "Bearer $token"
}

Write-Host ""

# Usar empresaId fixo (obtido do banco de dados)
Write-Host "[2/5] Usando empresaId do banco..." -ForegroundColor Yellow
$empresaId = "f47ac10b-58cc-4372-a567-0e02b2c3d479"
Write-Host "      [OK] empresaId: $empresaId" -ForegroundColor Green

Write-Host ""

# GET /api/filas
Write-Host "[3/5] Testando GET /api/filas..." -ForegroundColor Yellow
try {
  $filas = Invoke-RestMethod -Uri "http://localhost:3001/api/filas?empresaId=$empresaId" -Headers $headers
  $totalFilas = $filas.Count
    
  Write-Host "      [OK] Retornou $totalFilas fila(s)" -ForegroundColor Green
    
  # Análise de campos novos
  $comCor = ($filas | Where-Object { $_.cor }).Count
  $comIcone = ($filas | Where-Object { $_.icone }).Count
  $comNucleo = ($filas | Where-Object { $_.nucleoId }).Count
  $comDepartamento = ($filas | Where-Object { $_.departamentoId }).Count
    
  Write-Host ""
  Write-Host "      Campos novos:" -ForegroundColor Cyan
  Write-Host "      - Com cor: $comCor de $totalFilas" -ForegroundColor Gray
  Write-Host "      - Com icone: $comIcone de $totalFilas" -ForegroundColor Gray
  Write-Host "      - Com nucleoId: $comNucleo de $totalFilas" -ForegroundColor Gray
  Write-Host "      - Com departamentoId: $comDepartamento de $totalFilas" -ForegroundColor Gray
    
  Write-Host ""
  Write-Host "      Exemplo (primeira fila):" -ForegroundColor Cyan
  $fila1 = $filas[0]
  Write-Host "      - Nome: $($fila1.nome)" -ForegroundColor Gray
  Write-Host "      - Cor: $($fila1.cor)" -ForegroundColor Gray
  Write-Host "      - Icone: $($fila1.icone)" -ForegroundColor Gray
  Write-Host "      - NucleoId: $($fila1.nucleoId)" -ForegroundColor Gray
  Write-Host "      - DepartamentoId: $($fila1.departamentoId)" -ForegroundColor Gray
    
  $global:primeiraFilaId = $fila1.id
    
}
catch {
  Write-Host "      [ERRO] Falha ao listar filas: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# GET /nucleos
Write-Host "[4/5] Testando GET /nucleos-atendimento..." -ForegroundColor Yellow
try {
  $nucleos = Invoke-RestMethod -Uri "http://localhost:3001/nucleos?empresaId=$empresaId" -Headers $headers
  $totalNucleos = $nucleos.Count
    
  Write-Host "      [OK] Retornou $totalNucleos nucleo(s)" -ForegroundColor Green
    
  if ($totalNucleos -gt 0) {
    $global:nucleoIdTeste = $nucleos[0].id
    Write-Host "      - Nucleo para teste: $($nucleos[0].nome) (ID: $global:nucleoIdTeste)" -ForegroundColor Gray
  }
    
}
catch {
  Write-Host "      [ERRO] Falha ao listar nucleos: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# PATCH /filas/:id/nucleo
if ($global:primeiraFilaId -and $global:nucleoIdTeste) {
  Write-Host "[5/5] Testando PATCH /filas/:id/nucleo..." -ForegroundColor Yellow
    
  $atribuirBody = @{
    nucleoId = $global:nucleoIdTeste
  } | ConvertTo-Json
    
  try {
    $filaAtualizada = Invoke-RestMethod -Uri "http://localhost:3001/api/filas/$global:primeiraFilaId/nucleo" -Method PATCH -Body $atribuirBody -ContentType "application/json" -Headers $headers
        
    Write-Host "      [OK] Nucleo atribuido com sucesso" -ForegroundColor Green
    Write-Host "      - Fila: $($filaAtualizada.nome)" -ForegroundColor Gray
    Write-Host "      - NucleoId: $($filaAtualizada.nucleoId)" -ForegroundColor Gray
        
  }
  catch {
    Write-Host "      [ERRO] Falha ao atribuir nucleo: $($_.Exception.Message)" -ForegroundColor Red
  }
}
else {
  Write-Host "[5/5] PATCH /filas/:id/nucleo - PULADO (sem dados para teste)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host " TESTES CONCLUIDOS" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Proximos passos:" -ForegroundColor Yellow
Write-Host "  1. Abrir http://localhost:3000/configuracoes/gestao-equipes" -ForegroundColor White
Write-Host "  2. Abrir http://localhost:3000/configuracoes/gestao-filas" -ForegroundColor White
Write-Host "  3. Verificar console do navegador (F12)" -ForegroundColor White
Write-Host ""
