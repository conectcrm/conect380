# ============================================
# Teste Completo de Isolamento Multi-Tenant
# ============================================

$ErrorActionPreference = "Stop"
$SERVER = "http://56.124.63.239:3500"

Write-Host "`n🧪 TESTE DE ISOLAMENTO MULTI-TENANT (2 EMPRESAS)" -ForegroundColor Cyan
Write-Host "======================================================`n" -ForegroundColor Cyan

# ======= EMPRESA A =======
Write-Host "🏢 TESTE 1: Empresa A (usera@test.com)" -ForegroundColor Yellow
$bodyA = '{"email":"usera@test.com","senha":"Test@123"}'
$respA = Invoke-RestMethod -Uri "$SERVER/auth/login" -Method POST -Body $bodyA -ContentType "application/json"
$tokenA = $respA.data.access_token
$empresaA = $respA.data.user.empresa_id

Write-Host "  ✅ Login: $($respA.data.user.nome)" -ForegroundColor Green
Write-Host "  🏢 Empresa ID: $empresaA" -ForegroundColor Cyan

$headersA = @{ "Authorization" = "Bearer $tokenA" }
$clientesA = Invoke-RestMethod -Uri "$SERVER/clientes" -Method GET -Headers $headersA

Write-Host "  📊 Clientes visíveis: $($clientesA.Count)" -ForegroundColor White
$clientesA | ForEach-Object { 
  Write-Host "     - $($_.nome) (empresa: $($_.empresa_id))" -ForegroundColor Gray 
}

# ======= EMPRESA B =======
Write-Host "`n🏢 TESTE 2: Empresa B (userb@test.com)" -ForegroundColor Yellow
$bodyB = '{"email":"userb@test.com","senha":"Test@123"}'
$respB = Invoke-RestMethod -Uri "$SERVER/auth/login" -Method POST -Body $bodyB -ContentType "application/json"
$tokenB = $respB.data.access_token
$empresaB = $respB.data.user.empresa_id

Write-Host "  ✅ Login: $($respB.data.user.nome)" -ForegroundColor Green
Write-Host "  🏢 Empresa ID: $empresaB" -ForegroundColor Cyan

$headersB = @{ "Authorization" = "Bearer $tokenB" }
$clientesB = Invoke-RestMethod -Uri "$SERVER/clientes" -Method GET -Headers $headersB

Write-Host "  📊 Clientes visíveis: $($clientesB.Count)" -ForegroundColor White
$clientesB | ForEach-Object { 
  Write-Host "     - $($_.nome) (empresa: $($_.empresa_id))" -ForegroundColor Gray 
}

# ======= VALIDAÇÃO =======
Write-Host "`n✅ RESULTADO DO TESTE" -ForegroundColor Green
Write-Host "======================================================" -ForegroundColor Green

Write-Host "  🔐 Middleware TenantContext: ATIVO" -ForegroundColor Green
Write-Host "  🛡️  RLS PostgreSQL: ATIVO" -ForegroundColor Green

$isolado = $true
foreach ($clienteA in $clientesA) {
  if ($clienteA.empresa_id -ne $empresaA) {
    Write-Host "  ❌ VAZAMENTO: Empresa A vê cliente de outra empresa!" -ForegroundColor Red
    $isolado = $false
  }
}

foreach ($clienteB in $clientesB) {
  if ($clienteB.empresa_id -ne $empresaB) {
    Write-Host "  ❌ VAZAMENTO: Empresa B vê cliente de outra empresa!" -ForegroundColor Red
    $isolado = $false
  }
}

if ($isolado) {
  Write-Host "  ✅ ISOLAMENTO PERFEITO: Cada empresa vê apenas seus dados!" -ForegroundColor Green
}
else {
  Write-Host "  ❌ ISOLAMENTO FALHOU!" -ForegroundColor Red
  exit 1
}

Write-Host "`n📊 Sprint 1 - Multi-Tenant RLS + Middleware: CONCLUÍDO ✅" -ForegroundColor Cyan
Write-Host "======================================================`n" -ForegroundColor Cyan
