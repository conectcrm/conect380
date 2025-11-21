# Teste Simplificado de Integracao Zustand
# Sem caracteres especiais para evitar problemas de encoding

$ErrorActionPreference = "Continue"
$workspaceRoot = "c:\Projetos\conectcrm"
$frontendPath = "$workspaceRoot\frontend-web"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "TESTE DE INTEGRACAO ZUSTAND" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$totalTestes = 0
$testesPassaram = 0

# TESTE 1: Verificar package.json
Write-Host "[1/7] Verificando instalacao do Zustand..." -ForegroundColor Yellow
$packageJson = Get-Content "$frontendPath\package.json" | ConvertFrom-Json
if ($packageJson.dependencies.zustand) {
  Write-Host "[OK] Zustand instalado: versao $($packageJson.dependencies.zustand)" -ForegroundColor Green
  $testesPassaram++
}
else {
  Write-Host "[ERRO] Zustand nao encontrado em package.json!" -ForegroundColor Red
}
$totalTestes++

# TESTE 2: Verificar arquivos criados
Write-Host ""
Write-Host "[2/7] Verificando arquivos..." -ForegroundColor Yellow
$arquivos = @(
  "$frontendPath\src\stores\atendimentoStore.ts",
  "$frontendPath\src\features\atendimento\omnichannel\hooks\useAtendimentos.ts",
  "$frontendPath\src\features\atendimento\omnichannel\hooks\useMensagens.ts"
)

$arquivosOk = 0
foreach ($arquivo in $arquivos) {
  $nome = Split-Path $arquivo -Leaf
  if (Test-Path $arquivo) {
    Write-Host "[OK] $nome" -ForegroundColor Green
    $arquivosOk++
  }
  else {
    Write-Host "[ERRO] $nome NAO ENCONTRADO!" -ForegroundColor Red
  }
}

if ($arquivosOk -eq $arquivos.Count) {
  $testesPassaram++
}
$totalTestes++

# TESTE 3: Verificar imports do Zustand
Write-Host ""
Write-Host "[3/7] Verificando imports..." -ForegroundColor Yellow
$storeContent = Get-Content "$frontendPath\src\stores\atendimentoStore.ts" -Raw
if ($storeContent -match "import.*create.*from.*zustand") {
  Write-Host "[OK] Store importa create do zustand" -ForegroundColor Green
  $testesPassaram++
}
else {
  Write-Host "[ERRO] Import do zustand nao encontrado!" -ForegroundColor Red
}
$totalTestes++

# TESTE 4: Verificar uso do store nos hooks
Write-Host ""
Write-Host "[4/7] Verificando uso do store..." -ForegroundColor Yellow
$useAtendimentosContent = Get-Content "$frontendPath\src\features\atendimento\omnichannel\hooks\useAtendimentos.ts" -Raw
if ($useAtendimentosContent -match "useAtendimentoStore") {
  Write-Host "[OK] useAtendimentos usa o store" -ForegroundColor Green
  $testesPassaram++
}
else {
  Write-Host "[ERRO] useAtendimentos nao usa store!" -ForegroundColor Red
}
$totalTestes++

# TESTE 5: Compilacao TypeScript
Write-Host ""
Write-Host "[5/7] Compilando TypeScript..." -ForegroundColor Yellow
Push-Location $frontendPath
try {
  $tscOutput = npx tsc --noEmit 2>&1
  if ($LASTEXITCODE -eq 0) {
    Write-Host "[OK] TypeScript compila sem erros" -ForegroundColor Green
    $testesPassaram++
  }
  else {
    Write-Host "[ERRO] Erros de compilacao TypeScript:" -ForegroundColor Red
    Write-Host $tscOutput -ForegroundColor Red
  }
}
catch {
  Write-Host "[ERRO] Falha ao executar tsc: $_" -ForegroundColor Red
}
$totalTestes++
Pop-Location

# TESTE 6: Verificar processos Node
Write-Host ""
Write-Host "[6/7] Verificando processos Node.js..." -ForegroundColor Yellow
$nodeProcesses = Get-Process -Name node -ErrorAction SilentlyContinue
if ($nodeProcesses) {
  Write-Host "[OK] $($nodeProcesses.Count) processos Node.js rodando" -ForegroundColor Green
  $testesPassaram++
}
else {
  Write-Host "[AVISO] Nenhum processo Node.js encontrado" -ForegroundColor Yellow
}
$totalTestes++

# TESTE 7: Testar conectividade HTTP
Write-Host ""
Write-Host "[7/7] Testando conectividade..." -ForegroundColor Yellow
try {
  $backendResponse = Invoke-WebRequest -Uri "http://localhost:3001" -UseBasicParsing -TimeoutSec 5 -ErrorAction SilentlyContinue
  if ($backendResponse.StatusCode -eq 200 -or $backendResponse.StatusCode -eq 404) {
    Write-Host "[OK] Backend respondeu (porta 3001)" -ForegroundColor Green
  }
}
catch {
  Write-Host "[AVISO] Backend nao respondeu na porta 3001" -ForegroundColor Yellow
}

try {
  $frontendResponse = Invoke-WebRequest -Uri "http://localhost:3000" -UseBasicParsing -TimeoutSec 5 -ErrorAction SilentlyContinue
  if ($frontendResponse.StatusCode -eq 200) {
    Write-Host "[OK] Frontend respondeu (porta 3000)" -ForegroundColor Green
    $testesPassaram++
  }
}
catch {
  Write-Host "[AVISO] Frontend nao respondeu na porta 3000" -ForegroundColor Yellow
}
$totalTestes++

# RESUMO
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "RESUMO DOS TESTES" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Testes passaram: $testesPassaram de $totalTestes" -ForegroundColor $(if ($testesPassaram -eq $totalTestes) { "Green" } else { "Yellow" })

if ($testesPassaram -eq $totalTestes) {
  Write-Host ""
  Write-Host "[SUCESSO] Todos os testes passaram!" -ForegroundColor Green
  Write-Host ""
  Write-Host "Proximos passos manuais:" -ForegroundColor Cyan
  Write-Host "  1. Abrir http://localhost:3000/atendimento/chat" -ForegroundColor White
  Write-Host "  2. Verificar console do navegador (F12)" -ForegroundColor White
  Write-Host "  3. Testar criar/selecionar ticket" -ForegroundColor White
  Write-Host "  4. Testar enviar/receber mensagens" -ForegroundColor White
  Write-Host "  5. Verificar React DevTools (Zustand store)" -ForegroundColor White
  Write-Host ""
  exit 0
}
else {
  Write-Host ""
  Write-Host "[FALHA] Alguns testes falharam. Revisar acima." -ForegroundColor Red
  Write-Host ""
  exit 1
}
