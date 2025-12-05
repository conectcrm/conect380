# ============================================
# SYNC STATUS - Verificar estado da sincronização
# ============================================
# Este script verifica o estado de sincronização entre máquinas
# Execute quando quiser saber se está tudo OK

param(
    [switch]$Detailed
)

$ErrorActionPreference = "Continue"

Write-Host "`n" -NoNewline
Write-Host "🔍 SYNC STATUS - Estado da Sincronização" -ForegroundColor Cyan
Write-Host "=" * 60 -ForegroundColor DarkCyan
Write-Host ""

# ============================================
# Informações do Sistema
# ============================================
Write-Host "💻 Sistema:" -ForegroundColor Yellow
$computerName = $env:COMPUTERNAME
$userName = $env:USERNAME
Write-Host "   Máquina: $computerName" -ForegroundColor White
Write-Host "   Usuário: $userName" -ForegroundColor White
Write-Host ""

# ============================================
# Git Status
# ============================================
Write-Host "📊 Git Status:" -ForegroundColor Yellow

$branch = git branch --show-current
Write-Host "   Branch: $branch" -ForegroundColor Cyan

# Mudanças locais
$gitStatus = git status --porcelain
if ($gitStatus) {
    $changedFiles = ($gitStatus | Measure-Object).Count
    Write-Host "   ⚠️ Mudanças não commitadas: $changedFiles arquivo(s)" -ForegroundColor Yellow
    
    if ($Detailed) {
        Write-Host ""
        git status --short | ForEach-Object {
            Write-Host "      $_" -ForegroundColor White
        }
    }
} else {
    Write-Host "   ✅ Sem mudanças locais" -ForegroundColor Green
}

# Comparar local vs remoto
git fetch origin --quiet 2>&1 | Out-Null

$localCommit = git rev-parse HEAD
$remoteCommit = git rev-parse origin/$branch 2>$null

if ($remoteCommit) {
    if ($localCommit -eq $remoteCommit) {
        Write-Host "   ✅ Sincronizado com remoto" -ForegroundColor Green
    } else {
        $behind = git rev-list HEAD..origin/$branch --count
        $ahead = git rev-list origin/$branch..HEAD --count
        
        if ($behind -gt 0) {
            Write-Host "   ⚠️ $behind commit(s) atrás do remoto" -ForegroundColor Yellow
            Write-Host "      Execute: git pull origin $branch" -ForegroundColor White
        }
        
        if ($ahead -gt 0) {
            Write-Host "   ⚠️ $ahead commit(s) à frente do remoto" -ForegroundColor Yellow
            Write-Host "      Execute: git push origin $branch" -ForegroundColor White
        }
    }
} else {
    Write-Host "   ⚠️ Não foi possível verificar remoto" -ForegroundColor Yellow
}

Write-Host ""

# ============================================
# Último Commit
# ============================================
Write-Host "📝 Último Commit:" -ForegroundColor Yellow

$lastCommitMsg = git log -1 --pretty=format:"%s"
$lastCommitDate = git log -1 --pretty=format:"%ar"
$lastCommitAuthor = git log -1 --pretty=format:"%an"

Write-Host "   Mensagem: $lastCommitMsg" -ForegroundColor White
Write-Host "   Quando: $lastCommitDate" -ForegroundColor White
Write-Host "   Autor: $lastCommitAuthor" -ForegroundColor White

if ($Detailed) {
    $lastCommitHash = git log -1 --pretty=format:"%h"
    Write-Host "   Hash: $lastCommitHash" -ForegroundColor DarkGray
}

Write-Host ""

# ============================================
# Node.js e Dependências
# ============================================
Write-Host "📦 Ambiente:" -ForegroundColor Yellow

$nodeVersion = node --version
Write-Host "   Node.js: $nodeVersion" -ForegroundColor White

# Backend
if (Test-Path "backend/node_modules") {
    $backendPackageJson = Get-Content "backend/package.json" | ConvertFrom-Json
    $backendDepsCount = ($backendPackageJson.dependencies.PSObject.Properties | Measure-Object).Count
    Write-Host "   ✅ Backend: $backendDepsCount dependências instaladas" -ForegroundColor Green
} else {
    Write-Host "   ❌ Backend: node_modules NÃO encontrado" -ForegroundColor Red
    Write-Host "      Execute: cd backend && npm install" -ForegroundColor White
}

# Frontend
if (Test-Path "frontend-web/node_modules") {
    $frontendPackageJson = Get-Content "frontend-web/package.json" | ConvertFrom-Json
    $frontendDepsCount = ($frontendPackageJson.dependencies.PSObject.Properties | Measure-Object).Count
    Write-Host "   ✅ Frontend: $frontendDepsCount dependências instaladas" -ForegroundColor Green
} else {
    Write-Host "   ❌ Frontend: node_modules NÃO encontrado" -ForegroundColor Red
    Write-Host "      Execute: cd frontend-web && npm install" -ForegroundColor White
}

Write-Host ""

# ============================================
# Configurações (.env)
# ============================================
Write-Host "⚙️  Configurações:" -ForegroundColor Yellow

if (Test-Path "backend/.env") {
    $envSize = (Get-Item "backend/.env").Length
    Write-Host "   ✅ backend/.env encontrado ($envSize bytes)" -ForegroundColor Green
} else {
    Write-Host "   ❌ backend/.env NÃO encontrado" -ForegroundColor Red
    Write-Host "      Copie de .env.template e preencha" -ForegroundColor White
}

if (Test-Path "frontend-web/.env") {
    Write-Host "   ✅ frontend-web/.env encontrado" -ForegroundColor Green
} else {
    Write-Host "   ℹ️  frontend-web/.env não encontrado (opcional)" -ForegroundColor DarkGray
}

Write-Host ""

# ============================================
# Migrations
# ============================================
Write-Host "🗄️  Banco de Dados:" -ForegroundColor Yellow

$migrations = Get-ChildItem -Path "backend/src/migrations" -Filter "*.ts" -ErrorAction SilentlyContinue
if ($migrations) {
    $migrationsCount = $migrations.Count
    Write-Host "   📊 $migrationsCount migration(s) disponível(is)" -ForegroundColor Cyan
    
    if ($Detailed) {
        $migrations | ForEach-Object {
            Write-Host "      • $($_.Name)" -ForegroundColor DarkGray
        }
    }
} else {
    Write-Host "   ℹ️  Sem migrations encontradas" -ForegroundColor DarkGray
}

Write-Host ""

# ============================================
# Processos Ativos
# ============================================
Write-Host "🚀 Processos Ativos:" -ForegroundColor Yellow

$nodeProcesses = Get-Process -Name node -ErrorAction SilentlyContinue
if ($nodeProcesses) {
    $nodeCount = ($nodeProcesses | Measure-Object).Count
    Write-Host "   🟢 $nodeCount processo(s) Node.js rodando" -ForegroundColor Green
    
    if ($Detailed) {
        $nodeProcesses | ForEach-Object {
            $startTime = $_.StartTime.ToString("HH:mm:ss")
            $workingSet = [math]::Round($_.WorkingSet64 / 1MB, 2)
            Write-Host "      • PID $($_.Id) | Início: $startTime | RAM: ${workingSet}MB" -ForegroundColor DarkGray
        }
    }
} else {
    Write-Host "   ⚪ Nenhum processo Node.js rodando" -ForegroundColor DarkGray
}

# Verificar portas
$port3001 = Get-NetTCPConnection -LocalPort 3001 -State Listen -ErrorAction SilentlyContinue
$port3000 = Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue

if ($port3001) {
    Write-Host "   🟢 Backend rodando (porta 3001)" -ForegroundColor Green
} else {
    Write-Host "   ⚪ Backend não está rodando" -ForegroundColor DarkGray
}

if ($port3000) {
    Write-Host "   🟢 Frontend rodando (porta 3000)" -ForegroundColor Green
} else {
    Write-Host "   ⚪ Frontend não está rodando" -ForegroundColor DarkGray
}

Write-Host ""

# ============================================
# Resumo e Recomendações
# ============================================
Write-Host "=" * 60 -ForegroundColor DarkCyan

$issues = @()

if ($gitStatus) {
    $issues += "Há mudanças não commitadas"
}

if ($localCommit -ne $remoteCommit) {
    $issues += "Não sincronizado com remoto"
}

if (!(Test-Path "backend/node_modules")) {
    $issues += "Dependências do backend não instaladas"
}

if (!(Test-Path "frontend-web/node_modules")) {
    $issues += "Dependências do frontend não instaladas"
}

if (!(Test-Path "backend/.env")) {
    $issues += "Arquivo .env do backend não encontrado"
}

if ($issues.Count -eq 0) {
    Write-Host "✅ TUDO OK! Ambiente sincronizado e pronto." -ForegroundColor Green
} else {
    Write-Host "⚠️ ATENÇÃO: $($issues.Count) problema(s) detectado(s):" -ForegroundColor Yellow
    Write-Host ""
    $issues | ForEach-Object {
        Write-Host "   • $_" -ForegroundColor Yellow
    }
    Write-Host ""
    Write-Host "💡 Recomendações:" -ForegroundColor Cyan
    Write-Host "   • Execute: .\scripts\sync-start.ps1 (para sincronizar)" -ForegroundColor White
    Write-Host "   • Execute: .\scripts\sync-end.ps1 (para commitar mudanças)" -ForegroundColor White
}

Write-Host "=" * 60 -ForegroundColor DarkCyan
Write-Host ""
