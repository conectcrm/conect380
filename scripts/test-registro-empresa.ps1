<#
.SYNOPSIS
Testa registro de empresa e verifica módulos habilitados

.DESCRIPTION
Registra empresa de teste e verifica se os módulos corretos foram ativados baseado no plano escolhido

.PARAMETER Plano
Plano a testar: starter, business, enterprise

.EXAMPLE
.\scripts\test-registro-empresa.ps1 -Plano "enterprise"
#>

param(
  [Parameter(Mandatory = $false)]
  [ValidateSet('starter', 'business', 'enterprise')]
  [string]$Plano = 'enterprise',
    
  [Parameter(Mandatory = $false)]
  [string]$BaseUrl = 'http://localhost:3001'
)

$ErrorActionPreference = 'Stop'

Write-Host "`n╔══════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  TESTE DE REGISTRO DE EMPRESA - ConectCRM                    ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

# Dados de teste
$timestamp = Get-Date -Format "yyyyMMddHHmmss"

# Gerar CNPJ válido (sem divisão por zero)
$cnpjParte1 = "{0:D2}" -f (Get-Random -Minimum 10 -Maximum 99)
$cnpjParte2 = "{0:D3}" -f (Get-Random -Minimum 100 -Maximum 999)
$cnpjParte3 = "{0:D3}" -f (Get-Random -Minimum 100 -Maximum 999)
$cnpjParte4 = "{0:D2}" -f (Get-Random -Minimum 10 -Maximum 99)
$cnpjCompleto = "$cnpjParte1.$cnpjParte2.$cnpjParte3/0001-$cnpjParte4"

$empresaData = @{
  empresa       = @{
    nome     = "Empresa Teste $timestamp"
    cnpj     = $cnpjCompleto
    email    = "empresa$timestamp@teste.com"
    telefone = "(11) 9$(Get-Random -Minimum 1000 -Maximum 9999)-$(Get-Random -Minimum 1000 -Maximum 9999)"
    endereco = "Rua Teste, 123"
    cidade   = "São Paulo"
    estado   = "SP"
    cep      = "01310-100"
  }
  usuario       = @{
    nome     = "Admin Teste"
    email    = "admin$timestamp@teste.com"
    senha    = "Test@123"
    telefone = "(11) 9$(Get-Random -Minimum 1000 -Maximum 9999)-$(Get-Random -Minimum 1000 -Maximum 9999)"
  }
  plano         = $Plano
  aceitarTermos = $true
} | ConvertTo-Json -Depth 10

Write-Host "📋 Dados da Empresa:" -ForegroundColor Yellow
Write-Host "   Nome: $($empresaData | ConvertFrom-Json | Select-Object -ExpandProperty empresa | Select-Object -ExpandProperty nome)" -ForegroundColor White
Write-Host "   Plano: $Plano" -ForegroundColor White
Write-Host ""

# 1. Verificar se backend está online
Write-Host "🔍 Verificando backend..." -ForegroundColor Yellow
try {
  $health = Invoke-RestMethod -Uri "$BaseUrl/health" -Method Get
  Write-Host "✅ Backend online!" -ForegroundColor Green
}
catch {
  Write-Host "❌ Backend offline. Inicie com: cd backend && npm run start:dev" -ForegroundColor Red
  exit 1
}

# 2. Registrar empresa
Write-Host "`n📝 Registrando empresa..." -ForegroundColor Yellow
try {
  $response = Invoke-RestMethod -Uri "$BaseUrl/empresas/registro" `
    -Method Post `
    -Body $empresaData `
    -ContentType "application/json"
    
  Write-Host "✅ Empresa registrada com sucesso!" -ForegroundColor Green
  Write-Host "   ID: $($response.id)" -ForegroundColor White
  Write-Host "   Nome: $($response.nome)" -ForegroundColor White
  Write-Host "   Subdomínio: $($response.subdominio)" -ForegroundColor White
    
  $empresaId = $response.id
  $userEmail = ($empresaData | ConvertFrom-Json).usuario.email
  $userSenha = ($empresaData | ConvertFrom-Json).usuario.senha
    
}
catch {
  Write-Host "❌ Erro ao registrar empresa:" -ForegroundColor Red
  Write-Host $_.Exception.Message -ForegroundColor Red
  exit 1
}

# 3. Fazer login
Write-Host "`n🔐 Fazendo login..." -ForegroundColor Yellow
try {
  $loginData = @{
    email = $userEmail
    senha = $userSenha
  } | ConvertTo-Json
    
  $loginResponse = Invoke-RestMethod -Uri "$BaseUrl/auth/login" `
    -Method Post `
    -Body $loginData `
    -ContentType "application/json"
    
  $token = $loginResponse.data.access_token
  Write-Host "✅ Login realizado!" -ForegroundColor Green
    
}
catch {
  Write-Host "❌ Erro ao fazer login:" -ForegroundColor Red
  Write-Host $_.Exception.Message -ForegroundColor Red
  exit 1
}

# 4. Verificar módulos habilitados
Write-Host "`n📦 Verificando módulos habilitados..." -ForegroundColor Yellow
try {
  $headers = @{
    "Authorization" = "Bearer $token"
  }
    
  $modulosResponse = Invoke-RestMethod -Uri "$BaseUrl/empresas/modulos" `
    -Method Get `
    -Headers $headers
    
  # Extrair array de módulos (response pode ter .data)
  $modulos = if ($modulosResponse.data) { $modulosResponse.data } else { $modulosResponse }
    
  Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
  Write-Host "  MÓDULOS HABILITADOS (Plano: $Plano)" -ForegroundColor Cyan
  Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
    
  $modulosEsperados = @{
    'starter'    = @('CRM', 'ATENDIMENTO')
    'business'   = @('CRM', 'ATENDIMENTO', 'VENDAS', 'FINANCEIRO')
    'enterprise' = @('CRM', 'ATENDIMENTO', 'VENDAS', 'FINANCEIRO', 'BILLING', 'ADMINISTRACAO')
  }
    
  $esperados = $modulosEsperados[$Plano.ToLower()]
  $ativos = @()
    
  foreach ($modulo in $modulos) {
    if ($modulo.ativo) {
      $ativos += $modulo.modulo
      $icon = if ($esperados -contains $modulo.modulo) { "✅" } else { "⚠️" }
      Write-Host "  $icon $($modulo.modulo)" -ForegroundColor $(if ($esperados -contains $modulo.modulo) { 'Green' } else { 'Yellow' })
    }
  }
    
  Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
    
  # Validar resultado
  $faltantes = $esperados | Where-Object { $ativos -notcontains $_ }
  $extras = $ativos | Where-Object { $esperados -notcontains $_ }
    
  Write-Host "`n📊 Resultado:" -ForegroundColor Yellow
  Write-Host "   Total esperado: $($esperados.Count)" -ForegroundColor White
  Write-Host "   Total ativado:  $($ativos.Count)" -ForegroundColor White
    
  if ($faltantes.Count -eq 0 -and $extras.Count -eq 0) {
    Write-Host "`n✅ TESTE PASSOU! Módulos corretos para plano $Plano" -ForegroundColor Green
  }
  else {
    Write-Host "`n❌ TESTE FALHOU!" -ForegroundColor Red
    if ($faltantes.Count -gt 0) {
      Write-Host "   Faltantes: $($faltantes -join ', ')" -ForegroundColor Red
    }
    if ($extras.Count -gt 0) {
      Write-Host "   Extras: $($extras -join ', ')" -ForegroundColor Yellow
    }
    exit 1
  }
    
}
catch {
  Write-Host "❌ Erro ao verificar módulos:" -ForegroundColor Red
  Write-Host $_.Exception.Message -ForegroundColor Red
  if ($_.ErrorDetails.Message) {
    Write-Host $_.ErrorDetails.Message -ForegroundColor Red
  }
  exit 1
}

Write-Host "`n✅ Teste completo! Empresa criada com módulos corretos." -ForegroundColor Green
Write-Host "   Email: $userEmail" -ForegroundColor White
Write-Host "   Senha: $userSenha" -ForegroundColor White
Write-Host "   Empresa ID: $empresaId`n" -ForegroundColor White
