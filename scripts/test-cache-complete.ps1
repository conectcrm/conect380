# ============================================================================
# Script de Teste Completo de Cache - ConectCRM
# ============================================================================
# 
# Objetivo: Testar todos os 8 endpoints com cache implementado
# Tempo estimado: 15-20 minutos
# 
# Pré-requisito: Token JWT válido
# 
# Uso:
#   .\scripts\test-cache-complete.ps1 -Token "seu_token_jwt_aqui"
#   .\scripts\test-cache-complete.ps1 -Email "user@example.com" -Password "senha"
# ============================================================================

param(
  [Parameter(Mandatory = $false)]
  [string]$Token,
    
  [Parameter(Mandatory = $false)]
  [string]$Email,
    
  [Parameter(Mandatory = $false)]
  [string]$Password,
    
  [Parameter(Mandatory = $false)]
  [string]$BaseUrl = "http://localhost:3001",
    
  [Parameter(Mandatory = $false)]
  [switch]$Detailed
)

# Cores e formatação
$script:TotalTests = 0
$script:PassedTests = 0
$script:FailedTests = 0
$script:Results = @()

function Write-Header {
  param([string]$Text)
  Write-Host "`n╔══════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
  Write-Host "║  $($Text.PadRight(60))║" -ForegroundColor Cyan
  Write-Host "╚══════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
}

function Write-Section {
  param([string]$Text)
  Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
  Write-Host "  $Text" -ForegroundColor Yellow
  Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
}

function Write-TestResult {
  param(
    [string]$Name,
    [double]$Miss,
    [double]$Hit,
    [double]$Improvement,
    [bool]$Passed
  )
    
  $script:TotalTests++
  if ($Passed) { $script:PassedTests++ } else { $script:FailedTests++ }
    
  $status = if ($Passed) { "✅" } else { "❌" }
  $color = if ($Passed) { "Green" } else { "Red" }
    
  Write-Host "`n  $status $Name" -ForegroundColor $color
  Write-Host "     MISS: $([math]::Round($Miss, 2))ms" -ForegroundColor White
  Write-Host "     HIT:  $([math]::Round($Hit, 2))ms" -ForegroundColor White
  Write-Host "     Melhoria: $([math]::Round($Improvement, 1))%" -ForegroundColor $(if ($Improvement -gt 80) { 'Green' }elseif ($Improvement -gt 50) { 'Yellow' }else { 'Red' })
    
  $script:Results += [PSCustomObject]@{
    Endpoint    = $Name
    MISS_ms     = [math]::Round($Miss, 2)
    HIT_ms      = [math]::Round($Hit, 2)
    Improvement = [math]::Round($Improvement, 1)
    Passed      = $Passed
  }
}

function Get-AuthToken {
  param([string]$Email, [string]$Password)
    
  Write-Host "`n🔐 Autenticando..." -ForegroundColor Yellow
    
  try {
    $body = @{
      email = $Email
      senha = $Password
    } | ConvertTo-Json
        
    $response = Invoke-RestMethod -Uri "$BaseUrl/auth/login" `
      -Method Post `
      -Body $body `
      -ContentType "application/json" `
      -ErrorAction Stop
        
    Write-Host "✅ Login bem-sucedido!" -ForegroundColor Green
    return $response.data.access_token
  }
  catch {
    Write-Host "❌ Falha no login: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
  }
}

function Test-CacheEndpoint {
  param(
    [string]$Name,
    [string]$Endpoint,
    [hashtable]$Headers,
    [int]$ExpectedImprovement = 80
  )
    
  try {
    # Primeira requisição (MISS)
    $time1 = Measure-Command {
      $response1 = Invoke-RestMethod -Uri "$BaseUrl$Endpoint" `
        -Headers $Headers `
        -Method Get `
        -ErrorAction Stop
    }
        
    Start-Sleep -Milliseconds 200
        
    # Segunda requisição (HIT)
    $time2 = Measure-Command {
      $response2 = Invoke-RestMethod -Uri "$BaseUrl$Endpoint" `
        -Headers $Headers `
        -Method Get `
        -ErrorAction Stop
    }
        
    $miss = $time1.TotalMilliseconds
    $hit = $time2.TotalMilliseconds
    $improvement = if ($miss -gt 0) { (1 - $hit / $miss) * 100 } else { 0 }
        
    $passed = $improvement -ge $ExpectedImprovement
        
    Write-TestResult -Name $Name -Miss $miss -Hit $hit -Improvement $improvement -Passed $passed
        
    if ($Detailed) {
      Write-Host "     Dados: $($response1.count) itens" -ForegroundColor Gray
    }
  }
  catch {
    Write-Host "`n  ❌ $Name - ERRO" -ForegroundColor Red
    Write-Host "     $($_.Exception.Message)" -ForegroundColor Red
    $script:TotalTests++
    $script:FailedTests++
  }
}

# ============================================================================
# INÍCIO DO SCRIPT
# ============================================================================

Write-Header "TESTE COMPLETO DE CACHE - ConectCRM"

# Verificar backend
Write-Host "`n🔍 Verificando backend..." -ForegroundColor Yellow
try {
  $health = Invoke-RestMethod -Uri "$BaseUrl/health" -Method Get
  Write-Host "✅ Backend operacional (uptime: $([math]::Round($health.uptime/60, 1)) min)" -ForegroundColor Green
}
catch {
  Write-Host "❌ Backend não está respondendo!" -ForegroundColor Red
  Write-Host "   Execute: cd backend && npm run start:dev" -ForegroundColor Yellow
  exit 1
}

# Obter token JWT
if (-not $Token) {
  if ($Email -and $Password) {
    $Token = Get-AuthToken -Email $Email -Password $Password
  }
  else {
    Write-Host "`n❌ Token JWT não fornecido!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Opções de uso:" -ForegroundColor Yellow
    Write-Host "  1. Com token direto:" -ForegroundColor White
    Write-Host "     .\scripts\test-cache-complete.ps1 -Token 'eyJhbGc...'" -ForegroundColor Gray
    Write-Host ""
    Write-Host "  2. Com credenciais:" -ForegroundColor White
    Write-Host "     .\scripts\test-cache-complete.ps1 -Email 'user@example.com' -Password 'senha'" -ForegroundColor Gray
    Write-Host ""
    Write-Host "  3. Obter token manualmente:" -ForegroundColor White
    Write-Host "     `$creds = @{email='user@example.com'; password='senha'} | ConvertTo-Json" -ForegroundColor Gray
    Write-Host "     `$response = Invoke-RestMethod -Uri '$BaseUrl/auth/login' -Method Post -Body `$creds -ContentType 'application/json'" -ForegroundColor Gray
    Write-Host "     `$token = `$response.access_token" -ForegroundColor Gray
    Write-Host "     .\scripts\test-cache-complete.ps1 -Token `$token" -ForegroundColor Gray
    Write-Host ""
    exit 1
  }
}

$headers = @{
  Authorization = "Bearer $Token"
}

Write-Host "`n✅ Token configurado" -ForegroundColor Green
Write-Host "   Endpoint: $BaseUrl" -ForegroundColor Gray

# ============================================================================
# TESTES - PRODUTOS CONTROLLER (3 endpoints)
# ============================================================================

Write-Section "📦 PRODUTOS CONTROLLER (3 endpoints)"

Test-CacheEndpoint -Name "GET /produtos" -Endpoint "/produtos" -Headers $headers -ExpectedImprovement 80
Test-CacheEndpoint -Name "GET /produtos/estatisticas" -Endpoint "/produtos/estatisticas" -Headers $headers -ExpectedImprovement 80

# Teste individual de produto (precisa de um ID)
try {
  $produtos = Invoke-RestMethod -Uri "$BaseUrl/produtos" -Headers $headers
  if ($produtos.count -gt 0) {
    $produtoId = $produtos[0].id
    Test-CacheEndpoint -Name "GET /produtos/:id" -Endpoint "/produtos/$produtoId" -Headers $headers -ExpectedImprovement 80
  }
  else {
    Write-Host "`n  ⚠️  GET /produtos/:id - SKIP (nenhum produto para testar)" -ForegroundColor Yellow
  }
}
catch {
  Write-Host "`n  ⚠️  GET /produtos/:id - SKIP (erro ao buscar produtos)" -ForegroundColor Yellow
}

# ============================================================================
# TESTES - CLIENTES CONTROLLER (2 endpoints)
# ============================================================================

Write-Section "👥 CLIENTES CONTROLLER (2 endpoints)"

Test-CacheEndpoint -Name "GET /clientes" -Endpoint "/clientes" -Headers $headers -ExpectedImprovement 80
Test-CacheEndpoint -Name "GET /clientes/estatisticas" -Endpoint "/clientes/estatisticas" -Headers $headers -ExpectedImprovement 80

# ============================================================================
# TESTES - DASHBOARD CONTROLLER (3 endpoints)
# ============================================================================

Write-Section "📊 DASHBOARD CONTROLLER (3 endpoints)"

Test-CacheEndpoint -Name "GET /dashboard/kpis" -Endpoint "/dashboard/kpis" -Headers $headers -ExpectedImprovement 70
Test-CacheEndpoint -Name "GET /dashboard/vendedores-ranking" -Endpoint "/dashboard/vendedores-ranking" -Headers $headers -ExpectedImprovement 80
Test-CacheEndpoint -Name "GET /dashboard/alertas" -Endpoint "/dashboard/alertas" -Headers $headers -ExpectedImprovement 70

# ============================================================================
# TESTE DE TTL (Time To Live)
# ============================================================================

Write-Section "⏱️  TESTE DE TTL - GET /dashboard/kpis (30s)"

Write-Host "`n  1️⃣  Primeira requisição (MISS)..." -ForegroundColor Cyan
$time1 = Measure-Command {
  $kpis1 = Invoke-RestMethod -Uri "$BaseUrl/dashboard/kpis" -Headers $headers
}
Write-Host "     Tempo: $([math]::Round($time1.TotalMilliseconds, 2))ms" -ForegroundColor White

Write-Host "`n  2️⃣  Segunda requisição imediata (HIT esperado)..." -ForegroundColor Cyan
$time2 = Measure-Command {
  $kpis2 = Invoke-RestMethod -Uri "$BaseUrl/dashboard/kpis" -Headers $headers
}
Write-Host "     Tempo: $([math]::Round($time2.TotalMilliseconds, 2))ms" -ForegroundColor White

Write-Host "`n  ⏳ Aguardando 35 segundos (TTL: 30s)..." -ForegroundColor Yellow
for ($i = 35; $i -gt 0; $i--) {
  Write-Progress -Activity "Aguardando expiração do cache" -SecondsRemaining $i -PercentComplete ((35 - $i) / 35 * 100)
  Start-Sleep -Seconds 1
}
Write-Progress -Activity "Aguardando expiração do cache" -Completed

Write-Host "`n  3️⃣  Terceira requisição após TTL (MISS esperado)..." -ForegroundColor Cyan
$time3 = Measure-Command {
  $kpis3 = Invoke-RestMethod -Uri "$BaseUrl/dashboard/kpis" -Headers $headers
}
Write-Host "     Tempo: $([math]::Round($time3.TotalMilliseconds, 2))ms" -ForegroundColor White

$ttlWorking = $time3.TotalMilliseconds -gt ($time2.TotalMilliseconds * 2)
$ttlStatus = if ($ttlWorking) { "✅" } else { "⚠️ " }
$ttlColor = if ($ttlWorking) { "Green" } else { "Yellow" }

Write-Host "`n  $ttlStatus TTL: " -ForegroundColor $ttlColor -NoNewline
Write-Host $(if ($ttlWorking) { "Funcionando corretamente" } else { "Pode não estar expirando" }) -ForegroundColor $ttlColor

# ============================================================================
# RESUMO FINAL
# ============================================================================

Write-Header "RESUMO DOS TESTES"

Write-Host "`n📊 ESTATÍSTICAS:" -ForegroundColor Cyan
Write-Host "   Total de testes:  $script:TotalTests" -ForegroundColor White
Write-Host "   Passou:           $script:PassedTests" -ForegroundColor Green
Write-Host "   Falhou:           $script:FailedTests" -ForegroundColor $(if ($script:FailedTests -eq 0) { 'Green' }else { 'Red' })
Write-Host "   Taxa de sucesso:  $([math]::Round($script:PassedTests/$script:TotalTests*100, 1))%" -ForegroundColor $(if ($script:PassedTests -eq $script:TotalTests) { 'Green' }else { 'Yellow' })

Write-Host "`n📋 RESULTADOS DETALHADOS:" -ForegroundColor Cyan
$script:Results | Format-Table -AutoSize

# Calcular médias
$avgMiss = ($script:Results | Measure-Object -Property MISS_ms -Average).Average
$avgHit = ($script:Results | Measure-Object -Property HIT_ms -Average).Average
$avgImprovement = ($script:Results | Measure-Object -Property Improvement -Average).Average

Write-Host "`n📈 MÉDIAS GERAIS:" -ForegroundColor Cyan
Write-Host "   MISS médio:       $([math]::Round($avgMiss, 2))ms" -ForegroundColor White
Write-Host "   HIT médio:        $([math]::Round($avgHit, 2))ms" -ForegroundColor White
Write-Host "   Melhoria média:   $([math]::Round($avgImprovement, 1))%" -ForegroundColor $(if ($avgImprovement -gt 80) { 'Green' }elseif ($avgImprovement -gt 50) { 'Yellow' }else { 'Red' })

# Veredicto final
Write-Host "`n🎯 VEREDICTO FINAL:" -ForegroundColor Yellow

if ($script:PassedTests -eq $script:TotalTests -and $avgImprovement -ge 80) {
  Write-Host "   ✅ CACHE FUNCIONANDO PERFEITAMENTE!" -ForegroundColor Green
  Write-Host "   Sistema aprovado para produção." -ForegroundColor Green
}
elseif ($script:PassedTests -ge ($script:TotalTests * 0.8) -and $avgImprovement -ge 50) {
  Write-Host "   ⚠️  CACHE FUNCIONANDO COM RESSALVAS" -ForegroundColor Yellow
  Write-Host "   Revisar endpoints com baixa performance antes de produção." -ForegroundColor Yellow
}
else {
  Write-Host "   ❌ CACHE NÃO FUNCIONANDO ADEQUADAMENTE" -ForegroundColor Red
  Write-Host "   Correções necessárias antes de produção." -ForegroundColor Red
}

Write-Host "`n📚 DOCUMENTAÇÃO:" -ForegroundColor Cyan
Write-Host "   Ver: GUIA_TESTE_CACHE_COMPLETO.md" -ForegroundColor White
Write-Host "   Ver: STATUS_FINAL_MELHORIAS.md" -ForegroundColor White

Write-Host ""
