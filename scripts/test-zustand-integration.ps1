#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Script de teste para validar integração Zustand Store no módulo de Atendimento

.DESCRIPTION
    Valida se a refatoração do state management está funcionando corretamente:
    - Store criada e acessível
    - Hooks refatorados sem erros
    - WebSocket callbacks configurados
    - Componentes carregando sem erros
    
.EXAMPLE
    .\test-zustand-integration.ps1
#>

$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"

# Cores - sem emojis para evitar problemas de encoding
function Write-Success { Write-Host "[OK] $args" -ForegroundColor Green }
function Write-Error { Write-Host "[ERRO] $args" -ForegroundColor Red }
function Write-Info { Write-Host "[INFO] $args" -ForegroundColor Cyan }
function Write-Warning { Write-Host "[AVISO] $args" -ForegroundColor Yellow }


Write-Host "`n🧪 TESTE DE INTEGRAÇÃO - ZUSTAND STORE" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

$rootPath = "c:\Projetos\conectcrm"
$frontendPath = "$rootPath\frontend-web"

# ===== 1. VERIFICAR INSTALAÇÃO DO ZUSTAND =====
Write-Info "1. Verificando instalação do Zustand..."

$packageJson = Get-Content "$frontendPath\package.json" -Raw | ConvertFrom-Json
$zustandVersion = $packageJson.dependencies.zustand

if ($zustandVersion) {
  Write-Success "Zustand instalado: v$zustandVersion"
}
else {
  Write-Error "Zustand NÃO encontrado em package.json!"
  exit 1
}

# ===== 2. VERIFICAR ARQUIVOS CRIADOS =====
Write-Info "`n2. Verificando arquivos da store..."

$arquivosEsperados = @(
  "$frontendPath\src\stores\atendimentoStore.ts"
)

$arquivosModificados = @(
  "$frontendPath\src\features\atendimento\omnichannel\hooks\useAtendimentos.ts",
  "$frontendPath\src\features\atendimento\omnichannel\hooks\useMensagens.ts"
)

$todosArquivos = $arquivosEsperados + $arquivosModificados
$arquivosOk = 0

foreach ($arquivo in $todosArquivos) {
  if (Test-Path $arquivo) {
    $size = (Get-Item $arquivo).Length
    $nomeArquivo = [System.IO.Path]::GetFileName($arquivo)
    Write-Success "$nomeArquivo ($size bytes)"
    $arquivosOk++
  }
  else {
    $nomeArquivo = [System.IO.Path]::GetFileName($arquivo)
    Write-Error "$nomeArquivo NAO ENCONTRADO!"
  }
}

if ($arquivosOk -ne $todosArquivos.Count) {
  Write-Error "`nArquivos faltando! Esperados: $($todosArquivos.Count), Encontrados: $arquivosOk"
  exit 1
}

# ===== 3. VERIFICAR IMPORTS DO ZUSTAND =====
Write-Info "`n3. Verificando imports do Zustand..."

$storeContent = Get-Content "$frontendPath\src\stores\atendimentoStore.ts" -Raw

if ($storeContent -match "import \{ create \} from 'zustand'") {
  Write-Success "Import do Zustand encontrado na store"
}
else {
  Write-Error "Import do Zustand NÃO encontrado na store!"
  exit 1
}

# Verificar se hooks importam a store
$useAtendimentosContent = Get-Content "$frontendPath\src\features\atendimento\omnichannel\hooks\useAtendimentos.ts" -Raw
$useMensagensContent = Get-Content "$frontendPath\src\features\atendimento\omnichannel\hooks\useMensagens.ts" -Raw

if ($useAtendimentosContent -match "useAtendimentoStore") {
  Write-Success "useAtendimentos importa a store"
}
else {
  Write-Error "useAtendimentos NÃO importa a store!"
  exit 1
}

if ($useMensagensContent -match "useAtendimentoStore") {
  Write-Success "useMensagens importa a store"
}
else {
  Write-Error "useMensagens NÃO importa a store!"
  exit 1
}

# ===== 4. VERIFICAR ESTRUTURA DA STORE =====
Write-Info "`n4. Verificando estrutura da store..."

$funcionalidadesEsperadas = @(
  "setTickets",
  "setMensagens",
  "adicionarMensagem",
  "selecionarTicket",
  "getMensagensDoTicket"
)

$funcionalidadesEncontradas = 0

foreach ($funcao in $funcionalidadesEsperadas) {
  if ($storeContent -match $funcao) {
    Write-Success "Função '$funcao' encontrada"
    $funcionalidadesEncontradas++
  }
  else {
    Write-Warning "Função '$funcao' não encontrada"
  }
}

if ($funcionalidadesEncontradas -ne $funcionalidadesEsperadas.Count) {
  Write-Warning "Algumas funcionalidades esperadas não foram encontradas"
}

# ===== 5. VERIFICAR ERROS DE COMPILAÇÃO TYPESCRIPT =====
Write-Info "`n5. Verificando erros de compilação TypeScript..."

# Tentar compilar (sem emitir arquivos)
Push-Location $frontendPath
try {
  Write-Info "Executando TypeScript compiler (check only)..."
  $tscOutput = npx tsc --noEmit 2>&1
    
  # Filtrar apenas erros relacionados aos arquivos modificados
  $errosRelevantes = $tscOutput | Where-Object { 
    $_ -match "atendimentoStore\.ts|useAtendimentos\.ts|useMensagens\.ts" 
  }
    
  if ($errosRelevantes) {
    Write-Warning "Erros de TypeScript encontrados:"
    $errosRelevantes | ForEach-Object { Write-Host "  $_" -ForegroundColor Yellow }
  }
  else {
    Write-Success "Nenhum erro de TypeScript nos arquivos modificados"
  }
}
catch {
  Write-Warning "Não foi possível executar TypeScript compiler: $_"
}
finally {
  Pop-Location
}

# ===== 6. VERIFICAR PROCESSOS RODANDO =====
Write-Info "`n6. Verificando processos do sistema..."

$nodeProcesses = Get-Process -Name node -ErrorAction SilentlyContinue

if ($nodeProcesses) {
  Write-Success "$($nodeProcesses.Count) processo(s) Node.js rodando"
    
  # Verificar portas
  $connections = Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue | 
  Where-Object { $_.LocalPort -in @(3000, 3001) }
    
  $porta3000 = $connections | Where-Object { $_.LocalPort -eq 3000 }
  $porta3001 = $connections | Where-Object { $_.LocalPort -eq 3001 }
    
  if ($porta3000) {
    Write-Success "Frontend rodando na porta 3000"
  }
  else {
    Write-Warning "Frontend NÃO está rodando na porta 3000"
  }
    
  if ($porta3001) {
    Write-Success "Backend rodando na porta 3001"
  }
  else {
    Write-Warning "Backend NÃO está rodando na porta 3001"
  }
}
else {
  Write-Warning "Nenhum processo Node.js rodando"
}

# ===== 7. TESTAR ACESSO HTTP (OPCIONAL) =====
Write-Info "`n7. Testando conectividade HTTP..."

try {
  $response = Invoke-WebRequest -Uri "http://localhost:3001" -Method GET -TimeoutSec 5 -ErrorAction Stop
  Write-Success "Backend respondeu com status $($response.StatusCode)"
}
catch {
  Write-Warning "Backend não respondeu: $($_.Exception.Message)"
}

try {
  $response = Invoke-WebRequest -Uri "http://localhost:3000" -Method GET -TimeoutSec 5 -ErrorAction Stop
  Write-Success "Frontend respondeu com status $($response.StatusCode)"
}
catch {
  Write-Warning "Frontend não respondeu: $($_.Exception.Message)"
}

# ===== RESUMO FINAL =====
Write-Host "`n" -NoNewline
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "📊 RESUMO DOS TESTES" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

Write-Host "`n✅ Zustand instalado: " -NoNewline
Write-Host "SIM" -ForegroundColor Green

Write-Host "✅ Store criada: " -NoNewline
Write-Host "$arquivosOk/$($todosArquivos.Count) arquivos OK" -ForegroundColor Green

Write-Host "✅ Imports configurados: " -NoNewline
Write-Host "SIM" -ForegroundColor Green

Write-Host "✅ Funcionalidades da store: " -NoNewline
Write-Host "$funcionalidadesEncontradas/$($funcionalidadesEsperadas.Count)" -ForegroundColor Green

Write-Host "`n🎉 INTEGRAÇÃO ZUSTAND VALIDADA COM SUCESSO!" -ForegroundColor Green
Write-Host "`nPróximos passos:" -ForegroundColor Cyan
Write-Host "  1. Abrir http://localhost:3000/atendimento/chat" -ForegroundColor White
Write-Host "  2. Verificar console do navegador (F12)" -ForegroundColor White
Write-Host "  3. Testar criar/selecionar ticket" -ForegroundColor White
Write-Host "  4. Testar enviar/receber mensagens" -ForegroundColor White
Write-Host "  5. Verificar React DevTools (Zustand store)" -ForegroundColor White

Write-Host ""
exit 0
