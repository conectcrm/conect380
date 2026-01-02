# ============================================
# SYNC START - Iniciar trabalho em qualquer máquina
# ============================================
# Este script sincroniza o ambiente ao COMEÇAR o trabalho
# Execute ao chegar em qualquer máquina antes de começar

param(
  [switch]$SkipTests,
  [switch]$Verbose
)

$ErrorActionPreference = "Continue"

Write-Host "`n" -NoNewline
Write-Host "🔄 SYNC START - Sincronizando Ambiente" -ForegroundColor Cyan
Write-Host "=" * 60 -ForegroundColor DarkCyan
Write-Host ""

# ============================================
# 1. Verificar Node.js
# ============================================
Write-Host "📦 1/7 Verificando Node.js..." -ForegroundColor Yellow

$nodeVersion = node --version
if ($nodeVersion -match "v(\d+)\.(\d+)\.(\d+)") {
  $major = [int]$matches[1]
  if ($major -lt 22) {
    Write-Host "❌ Node.js $nodeVersion detectado. Requer v22.16+" -ForegroundColor Red
    Write-Host "   Instale com: nvm install 22.16.0 && nvm use 22.16.0" -ForegroundColor Yellow
    exit 1
  }
  else {
    Write-Host "   ✅ Node.js $nodeVersion (OK)" -ForegroundColor Green
  }
}
else {
  Write-Host "   ⚠️ Não foi possível verificar versão do Node.js" -ForegroundColor Yellow
}

# ============================================
# 2. Git Pull
# ============================================
Write-Host "`n📥 2/7 Atualizando código do repositório..." -ForegroundColor Yellow

$branch = git branch --show-current
Write-Host "   Branch atual: $branch" -ForegroundColor Cyan

# Verificar se há mudanças não commitadas
$gitStatus = git status --porcelain
if ($gitStatus) {
  Write-Host "   ⚠️ ATENÇÃO: Você tem mudanças não commitadas!" -ForegroundColor Red
  Write-Host ""
  git status --short
  Write-Host ""
  $response = Read-Host "   Deseja fazer stash das mudanças e continuar? (s/N)"
  if ($response -eq 's' -or $response -eq 'S') {
    git stash push -m "auto-stash antes de sync-start em $(Get-Date -Format 'yyyy-MM-dd HH:mm')"
    Write-Host "   ✅ Mudanças salvas no stash" -ForegroundColor Green
  }
  else {
    Write-Host "   ❌ Sincronização cancelada. Commite suas mudanças primeiro." -ForegroundColor Red
    exit 1
  }
}

git fetch origin
$pullResult = git pull origin $branch 2>&1

if ($LASTEXITCODE -eq 0) {
  Write-Host "   ✅ Código atualizado com sucesso" -ForegroundColor Green
  if ($Verbose) {
    Write-Host "   $pullResult" -ForegroundColor DarkGray
  }
}
else {
  Write-Host "   ❌ Erro ao fazer pull:" -ForegroundColor Red
  Write-Host "   $pullResult" -ForegroundColor Red
  exit 1
}

# ============================================
# 3. Verificar mudanças em package.json
# ============================================
Write-Host "`n📋 3/7 Verificando mudanças em dependências..." -ForegroundColor Yellow

$lastCommit = git log -1 --name-only --pretty=format:""
$packageJsonChanged = $lastCommit -match "package\.json"

if ($packageJsonChanged) {
  Write-Host "   ⚠️ package.json foi modificado - dependências serão atualizadas" -ForegroundColor Yellow
  $updateDeps = $true
}
else {
  Write-Host "   ✅ Sem mudanças em package.json" -ForegroundColor Green
  $updateDeps = $false
}

# ============================================
# 4. Atualizar dependências Backend
# ============================================
Write-Host "`n📦 4/7 Verificando dependências do Backend..." -ForegroundColor Yellow

Push-Location backend

if ($updateDeps -or !(Test-Path "node_modules")) {
  Write-Host "   🔄 Instalando dependências..." -ForegroundColor Cyan
  npm install --silent 2>&1 | Out-Null
  if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✅ Dependências do backend atualizadas" -ForegroundColor Green
  }
  else {
    Write-Host "   ❌ Erro ao instalar dependências do backend" -ForegroundColor Red
    Pop-Location
    exit 1
  }
}
else {
  Write-Host "   ✅ Dependências do backend OK (sem mudanças)" -ForegroundColor Green
}

Pop-Location

# ============================================
# 5. Atualizar dependências Frontend
# ============================================
Write-Host "`n📦 5/7 Verificando dependências do Frontend..." -ForegroundColor Yellow

Push-Location frontend-web

if ($updateDeps -or !(Test-Path "node_modules")) {
  Write-Host "   🔄 Instalando dependências..." -ForegroundColor Cyan
  npm install --silent 2>&1 | Out-Null
  if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✅ Dependências do frontend atualizadas" -ForegroundColor Green
  }
  else {
    Write-Host "   ❌ Erro ao instalar dependências do frontend" -ForegroundColor Red
    Pop-Location
    exit 1
  }
}
else {
  Write-Host "   ✅ Dependências do frontend OK (sem mudanças)" -ForegroundColor Green
}

Pop-Location

# ============================================
# 6. Verificar e Rodar Migrations
# ============================================
Write-Host "`n🗄️  6/7 Verificando migrations do banco de dados..." -ForegroundColor Yellow

Push-Location backend

# Verificar se há migrations novas
$migrations = Get-ChildItem -Path "src/migrations" -Filter "*.ts" -ErrorAction SilentlyContinue

if ($migrations) {
  $migrationsCount = $migrations.Count
  Write-Host "   📊 $migrationsCount migration(s) encontrada(s)" -ForegroundColor Cyan
    
  Write-Host "   🔄 Executando migrations..." -ForegroundColor Cyan
  $migrationResult = npm run migration:run 2>&1
    
  if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✅ Migrations executadas com sucesso" -ForegroundColor Green
    if ($Verbose) {
      Write-Host "   $migrationResult" -ForegroundColor DarkGray
    }
  }
  else {
    Write-Host "   ⚠️ Erro ao executar migrations (pode ser normal se já rodaram)" -ForegroundColor Yellow
    if ($Verbose) {
      Write-Host "   $migrationResult" -ForegroundColor DarkGray
    }
  }
}
else {
  Write-Host "   ✅ Sem migrations para executar" -ForegroundColor Green
}

Pop-Location

# ============================================
# 7. Testes Rápidos (Opcional)
# ============================================
if (!$SkipTests) {
  Write-Host "`n🧪 7/7 Testes rápidos de ambiente..." -ForegroundColor Yellow
    
  # Verificar se backend compila
  Write-Host "   🔍 Verificando se backend compila..." -ForegroundColor Cyan
  Push-Location backend
  $buildResult = npm run build --silent 2>&1
  if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✅ Backend compila sem erros" -ForegroundColor Green
  }
  else {
    Write-Host "   ❌ Erro ao compilar backend" -ForegroundColor Red
    if ($Verbose) {
      Write-Host "   $buildResult" -ForegroundColor Red
    }
  }
  Pop-Location
    
  # Verificar se .env existe
  if (Test-Path "backend\.env") {
    Write-Host "   ✅ Arquivo .env encontrado" -ForegroundColor Green
  }
  else {
    Write-Host "   ⚠️ Arquivo backend\.env NÃO encontrado!" -ForegroundColor Red
    Write-Host "      Copie de .env.template e preencha as credenciais" -ForegroundColor Yellow
  }
}
else {
  Write-Host "`n⏭️  7/7 Testes pulados (--SkipTests ativo)" -ForegroundColor DarkGray
}

# ============================================
# Resumo Final
# ============================================
Write-Host "`n" -NoNewline
Write-Host "=" * 60 -ForegroundColor DarkCyan
Write-Host "✅ SINCRONIZAÇÃO COMPLETA!" -ForegroundColor Green
Write-Host "=" * 60 -ForegroundColor DarkCyan
Write-Host ""
Write-Host "📌 Próximos passos:" -ForegroundColor Cyan
Write-Host "   1. Iniciar backend:  cd backend && npm run start:dev" -ForegroundColor White
Write-Host "   2. Iniciar frontend: cd frontend-web && npm start" -ForegroundColor White
Write-Host "   3. Ao finalizar o dia: .\scripts\sync-end.ps1" -ForegroundColor White
Write-Host ""
Write-Host "💡 Dica: Use -Verbose para ver mais detalhes" -ForegroundColor DarkGray
Write-Host ""
