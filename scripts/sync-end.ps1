# ============================================
# SYNC END - Finalizar trabalho em qualquer máquina
# ============================================
# Este script faz commit e push ao FINALIZAR o trabalho
# Execute ao sair de qualquer máquina

param(
    [string]$Message = "",
    [switch]$SkipPush,
    [switch]$Verbose
)

$ErrorActionPreference = "Continue"

Write-Host "`n" -NoNewline
Write-Host "🔄 SYNC END - Finalizando Trabalho" -ForegroundColor Cyan
Write-Host "=" * 60 -ForegroundColor DarkCyan
Write-Host ""

# ============================================
# 1. Verificar mudanças
# ============================================
Write-Host "📋 1/5 Verificando mudanças..." -ForegroundColor Yellow

$gitStatus = git status --porcelain

if (!$gitStatus) {
    Write-Host "   ℹ️  Nenhuma mudança para commitar" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "   Tudo já está sincronizado! ✅" -ForegroundColor Green
    Write-Host ""
    exit 0
}

Write-Host "   📝 Mudanças detectadas:" -ForegroundColor Cyan
Write-Host ""
git status --short | ForEach-Object {
    Write-Host "      $_" -ForegroundColor White
}
Write-Host ""

# ============================================
# 2. Solicitar mensagem de commit (se não fornecida)
# ============================================
Write-Host "💬 2/5 Preparando commit..." -ForegroundColor Yellow

if ($Message -eq "") {
    Write-Host ""
    Write-Host "   📝 Digite a mensagem do commit:" -ForegroundColor Cyan
    Write-Host "      (ex: feat: implementar gestão de equipes)" -ForegroundColor DarkGray
    Write-Host "      (ex: fix: corrigir erro de autenticação)" -ForegroundColor DarkGray
    Write-Host "      (ex: wip: trabalho em progresso - módulo X)" -ForegroundColor DarkGray
    Write-Host ""
    $Message = Read-Host "   Mensagem"
    
    if ($Message -eq "") {
        Write-Host "   ⚠️ Mensagem vazia. Usando mensagem padrão." -ForegroundColor Yellow
        $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm"
        $Message = "wip: trabalho do dia ($timestamp)"
    }
}

Write-Host "   ✅ Mensagem: $Message" -ForegroundColor Green

# ============================================
# 3. Adicionar arquivos
# ============================================
Write-Host "`n📦 3/5 Adicionando arquivos..." -ForegroundColor Yellow

git add . 2>&1 | Out-Null

if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✅ Arquivos adicionados ao staging" -ForegroundColor Green
} else {
    Write-Host "   ❌ Erro ao adicionar arquivos" -ForegroundColor Red
    exit 1
}

# ============================================
# 4. Fazer commit
# ============================================
Write-Host "`n💾 4/5 Fazendo commit..." -ForegroundColor Yellow

$commitResult = git commit -m "$Message" 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✅ Commit realizado com sucesso" -ForegroundColor Green
    if ($Verbose) {
        Write-Host "   $commitResult" -ForegroundColor DarkGray
    }
} else {
    Write-Host "   ❌ Erro ao fazer commit:" -ForegroundColor Red
    Write-Host "   $commitResult" -ForegroundColor Red
    exit 1
}

# ============================================
# 5. Push para repositório remoto
# ============================================
if (!$SkipPush) {
    Write-Host "`n📤 5/5 Enviando para repositório remoto..." -ForegroundColor Yellow
    
    $branch = git branch --show-current
    Write-Host "   Branch: $branch" -ForegroundColor Cyan
    
    Write-Host "   🔄 Fazendo push..." -ForegroundColor Cyan
    $pushResult = git push origin $branch 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ Push realizado com sucesso!" -ForegroundColor Green
        if ($Verbose) {
            Write-Host "   $pushResult" -ForegroundColor DarkGray
        }
    } else {
        Write-Host "   ❌ Erro ao fazer push:" -ForegroundColor Red
        Write-Host "   $pushResult" -ForegroundColor Red
        Write-Host ""
        Write-Host "   💡 Possíveis soluções:" -ForegroundColor Yellow
        Write-Host "      • Verificar conexão com internet" -ForegroundColor White
        Write-Host "      • git pull origin $branch (se houver mudanças remotas)" -ForegroundColor White
        Write-Host "      • Verificar permissões do repositório" -ForegroundColor White
        exit 1
    }
} else {
    Write-Host "`n⏭️  5/5 Push pulado (--SkipPush ativo)" -ForegroundColor DarkGray
    Write-Host "   ⚠️ LEMBRE-SE de fazer push manualmente!" -ForegroundColor Yellow
}

# ============================================
# Verificar sincronização
# ============================================
Write-Host "`n🔍 Verificando sincronização..." -ForegroundColor Yellow

$branch = git branch --show-current
$localCommit = git rev-parse HEAD
$remoteCommit = git rev-parse origin/$branch

if ($localCommit -eq $remoteCommit) {
    Write-Host "   ✅ Local e remoto estão sincronizados" -ForegroundColor Green
} else {
    Write-Host "   ⚠️ Local e remoto NÃO estão sincronizados" -ForegroundColor Yellow
    Write-Host "      Local:  $localCommit" -ForegroundColor White
    Write-Host "      Remoto: $remoteCommit" -ForegroundColor White
}

# ============================================
# Resumo Final
# ============================================
Write-Host "`n" -NoNewline
Write-Host "=" * 60 -ForegroundColor DarkCyan
Write-Host "✅ TRABALHO SINCRONIZADO!" -ForegroundColor Green
Write-Host "=" * 60 -ForegroundColor DarkCyan
Write-Host ""
Write-Host "📌 Último commit:" -ForegroundColor Cyan
Write-Host "   $Message" -ForegroundColor White
Write-Host ""
Write-Host "💡 Próximos passos:" -ForegroundColor Cyan
Write-Host "   1. Na outra máquina, execute: .\scripts\sync-start.ps1" -ForegroundColor White
Write-Host "   2. Continue trabalhando normalmente" -ForegroundColor White
Write-Host ""
Write-Host "🎯 Dica: Para ver o commit no GitHub:" -ForegroundColor DarkGray
Write-Host "   https://github.com/Dhonleno/conectsuite/commits/$branch" -ForegroundColor DarkGray
Write-Host ""
