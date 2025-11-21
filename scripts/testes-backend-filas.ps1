# 🧪 Script de Testes Automatizados - Sistema de Filas Backend
# Data: Novembro 2025
# Objetivo: Testar todos os endpoints do Sistema de Filas

param(
  [string]$BaseUrl = "http://localhost:3001",
  [switch]$Verbose
)

$ErrorActionPreference = "Continue"

# Cores para output
function Write-Success { param($Message) Write-Host "✅ $Message" -ForegroundColor Green }
function Write-Error { param($Message) Write-Host "❌ $Message" -ForegroundColor Red }
function Write-Info { param($Message) Write-Host "ℹ️  $Message" -ForegroundColor Cyan }
function Write-Test { param($Message) Write-Host "🧪 $Message" -ForegroundColor Yellow }

# Contadores
$script:TotalTests = 0
$script:PassedTests = 0
$script:FailedTests = 0

function Test-Endpoint {
  param(
    [string]$Method,
    [string]$Endpoint,
    [object]$Body = $null,
    [int]$ExpectedStatus,
    [string]$Description,
    [string]$Token = $null
  )
    
  $script:TotalTests++
  Write-Test "Teste #$script:TotalTests - $Description"
    
  try {
    $headers = @{
      "Content-Type" = "application/json"
    }
        
    if ($Token) {
      $headers["Authorization"] = "Bearer $Token"
    }
        
    $params = @{
      Uri             = "$BaseUrl$Endpoint"
      Method          = $Method
      Headers         = $headers
      UseBasicParsing = $true
    }
        
    if ($Body) {
      $params["Body"] = ($Body | ConvertTo-Json -Depth 10)
    }
        
    if ($Verbose) {
      Write-Info "  Request: $Method $Endpoint"
      if ($Body) {
        Write-Info "  Body: $($Body | ConvertTo-Json -Compress)"
      }
    }
        
    $response = Invoke-WebRequest @params -ErrorAction Stop
        
    if ($response.StatusCode -eq $ExpectedStatus) {
      Write-Success "  Status: $($response.StatusCode) (Esperado: $ExpectedStatus)"
      $script:PassedTests++
            
      if ($Verbose -and $response.Content) {
        Write-Info "  Response: $($response.Content | ConvertFrom-Json | ConvertTo-Json -Compress)"
      }
            
      return @{
        Success = $true
        Data    = $response.Content | ConvertFrom-Json
      }
    }
    else {
      Write-Error "  Status: $($response.StatusCode) (Esperado: $ExpectedStatus)"
      $script:FailedTests++
      return @{ Success = $false }
    }
  }
  catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
        
    if ($statusCode -eq $ExpectedStatus) {
      Write-Success "  Status: $statusCode (Esperado: $ExpectedStatus)"
      $script:PassedTests++
      return @{ Success = $true }
    }
    else {
      Write-Error "  Status: $statusCode (Esperado: $ExpectedStatus)"
      Write-Error "  Erro: $($_.Exception.Message)"
      $script:FailedTests++
      return @{ Success = $false }
    }
  }
    
  Write-Host ""
}

# ========== INÍCIO DOS TESTES ==========

Write-Host "`n🚀 INICIANDO TESTES DO SISTEMA DE FILAS" -ForegroundColor Magenta
Write-Host "=" * 60
Write-Host "Base URL: $BaseUrl" -ForegroundColor Cyan
Write-Host "=" * 60 -ForegroundColor Magenta
Write-Host ""

# ========== 1. TESTES SEM AUTENTICAÇÃO (Devem falhar com 401) ==========

Write-Host "`n📌 BLOCO 1: Testes de Autenticação JWT" -ForegroundColor Magenta
Write-Host "-" * 60

Test-Endpoint `
  -Method "GET" `
  -Endpoint "/api/filas" `
  -ExpectedStatus 401 `
  -Description "GET /api/filas sem token JWT (deve retornar 401)"

Test-Endpoint `
  -Method "POST" `
  -Endpoint "/api/filas" `
  -ExpectedStatus 401 `
  -Description "POST /api/filas sem token JWT (deve retornar 401)"

# ========== 2. SIMULAÇÃO DE LOGIN (Para testes autenticados) ==========

Write-Host "`n📌 BLOCO 2: Obter Token JWT (Mock)" -ForegroundColor Magenta
Write-Host "-" * 60

Write-Info "⚠️  NOTA: Testes autenticados requerem token JWT válido"
Write-Info "⚠️  Execute login manual ou configure variável `$Token"
Write-Host ""

# Você pode adicionar aqui a chamada de login real:
# $loginResult = Test-Endpoint -Method "POST" -Endpoint "/api/auth/login" -Body @{email="admin@example.com"; senha="senha123"} -ExpectedStatus 200 -Description "Login para obter token JWT"
# $Token = $loginResult.Data.token

# Por enquanto, vamos simular testes sem autenticação

# ========== 3. TESTES DE VALIDAÇÃO (Bad Requests) ==========

Write-Host "`n📌 BLOCO 3: Testes de Validação (400 Bad Request)" -ForegroundColor Magenta
Write-Host "-" * 60

Write-Info "⚠️  Pulando testes autenticados (requer token JWT)"
Write-Info "⚠️  Para testar com autenticação:"
Write-Info "     1. Faça login via Postman/Thunder Client"
Write-Info "     2. Copie o token JWT"
Write-Info "     3. Execute: .\testes-backend-filas.ps1 -Token 'seu-token-aqui'"
Write-Host ""

# ========== RESUMO DOS TESTES ==========

Write-Host "`n" + "=" * 60 -ForegroundColor Magenta
Write-Host "📊 RESUMO DOS TESTES" -ForegroundColor Magenta
Write-Host "=" * 60 -ForegroundColor Magenta
Write-Host ""
Write-Host "Total de testes:    $script:TotalTests" -ForegroundColor Cyan
Write-Success "Testes passados:    $script:PassedTests"
Write-Error "Testes falhados:    $script:FailedTests"
Write-Host ""

$successRate = if ($script:TotalTests -gt 0) { 
  [math]::Round(($script:PassedTests / $script:TotalTests) * 100, 2) 
}
else { 0 }

Write-Host "Taxa de sucesso:    $successRate%" -ForegroundColor $(if ($successRate -ge 80) { "Green" } elseif ($successRate -ge 50) { "Yellow" } else { "Red" })

if ($script:FailedTests -eq 0) {
  Write-Host "`n🎉 TODOS OS TESTES PASSARAM!" -ForegroundColor Green
  exit 0
}
else {
  Write-Host "`n⚠️  ALGUNS TESTES FALHARAM - Revise os logs acima" -ForegroundColor Yellow
  exit 1
}
