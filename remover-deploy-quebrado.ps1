#!/usr/bin/env pwsh
# ============================================
# Script: Remover Deploy Quebrado
# ============================================
# Remove deploy problemático que conectou ao banco .dev
# em vez do banco de produção
#
# Uso: .\remover-deploy-quebrado.ps1 [-KeepImages] [-Force]
# ============================================

param(
    [switch]$KeepImages,
    [switch]$Force,
    [switch]$Help
)

$ErrorActionPreference = "Stop"

# ═══════════════════════════════════════════════════════════════
# FUNÇÕES AUXILIARES
# ═══════════════════════════════════════════════════════════════

function Write-Header {
    param([string]$Text)
    Write-Host ""
    Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor DarkCyan
    Write-Host "  $Text" -ForegroundColor Yellow
    Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor DarkCyan
    Write-Host ""
}

function Write-Step {
    param([string]$Text)
    Write-Host "📋 $Text" -ForegroundColor Cyan
}

function Write-Success {
    param([string]$Text)
    Write-Host "✅ $Text" -ForegroundColor Green
}

function Write-Warning {
    param([string]$Text)
    Write-Host "⚠️  $Text" -ForegroundColor Yellow
}

function Write-Error-Message {
    param([string]$Text)
    Write-Host "❌ $Text" -ForegroundColor Red
}

function Confirm-Action {
    param([string]$Message)
    
    if ($Force) {
        return $true
    }
    
    $response = Read-Host "$Message (s/N)"
    return $response -eq "s" -or $response -eq "S"
}

function Show-Help {
    Write-Host ""
    Write-Host "🔧 REMOVER DEPLOY QUEBRADO - ConectCRM" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "USO:" -ForegroundColor Cyan
    Write-Host "  .\remover-deploy-quebrado.ps1 [opções]"
    Write-Host ""
    Write-Host "OPÇÕES:" -ForegroundColor Cyan
    Write-Host "  -KeepImages    Não remove imagens Docker (mais rápido para rebuild)"
    Write-Host "  -Force         Não pede confirmação (use com cuidado!)"
    Write-Host "  -Help          Mostra esta ajuda"
    Write-Host ""
    Write-Host "EXEMPLOS:" -ForegroundColor Cyan
    Write-Host "  .\remover-deploy-quebrado.ps1"
    Write-Host "  .\remover-deploy-quebrado.ps1 -KeepImages"
    Write-Host "  .\remover-deploy-quebrado.ps1 -Force"
    Write-Host ""
    exit 0
}

# ═══════════════════════════════════════════════════════════════
# VERIFICAÇÕES INICIAIS
# ═══════════════════════════════════════════════════════════════

if ($Help) {
    Show-Help
}

Write-Header "🔧 REMOVER DEPLOY QUEBRADO - ConectCRM"

Write-Host "Este script vai:" -ForegroundColor Yellow
Write-Host "  1. Parar todos os containers do deploy atual"
Write-Host "  2. Remover containers e networks"
Write-Host "  3. Limpar recursos órfãos"
if (-not $KeepImages) {
    Write-Host "  4. Remover imagens antigas (para rebuild limpo)"
}
Write-Host ""

if (-not (Confirm-Action "Deseja continuar?")) {
    Write-Warning "Operação cancelada pelo usuário."
    exit 0
}

# ═══════════════════════════════════════════════════════════════
# PASSO 1: Verificar Estado Atual
# ═══════════════════════════════════════════════════════════════

Write-Header "PASSO 1: Verificando Estado Atual"

Write-Step "Verificando containers rodando..."
$containers = docker ps --filter "name=conectcrm" --format "{{.Names}}"

if ($containers) {
    Write-Host ""
    Write-Host "Containers encontrados:" -ForegroundColor Yellow
    $containers | ForEach-Object { Write-Host "  - $_" -ForegroundColor White }
    Write-Host ""
} else {
    Write-Warning "Nenhum container ConectCRM rodando."
}

Write-Step "Verificando docker-compose files..."
$composeFiles = @()
if (Test-Path "docker-compose.prod.yml") {
    $composeFiles += "docker-compose.prod.yml"
    Write-Host "  ✓ docker-compose.prod.yml encontrado" -ForegroundColor Green
}
if (Test-Path "docker-compose.yml") {
    $composeFiles += "docker-compose.yml"
    Write-Host "  ✓ docker-compose.yml encontrado" -ForegroundColor Green
}

if ($composeFiles.Count -eq 0) {
    Write-Error-Message "Nenhum arquivo docker-compose encontrado!"
    exit 1
}

# ═══════════════════════════════════════════════════════════════
# PASSO 2: Parar Containers
# ═══════════════════════════════════════════════════════════════

Write-Header "PASSO 2: Parando Containers"

foreach ($composeFile in $composeFiles) {
    Write-Step "Parando containers de $composeFile..."
    try {
        docker-compose -f $composeFile down 2>&1 | Out-Null
        Write-Success "Containers de $composeFile parados"
    } catch {
        Write-Warning "Erro ao parar $composeFile (pode já estar parado)"
    }
}

# ═══════════════════════════════════════════════════════════════
# PASSO 3: Remover Containers Órfãos
# ═══════════════════════════════════════════════════════════════

Write-Header "PASSO 3: Removendo Containers Órfãos"

Write-Step "Removendo containers órfãos..."
docker-compose down --remove-orphans 2>&1 | Out-Null
Write-Success "Containers órfãos removidos"

# ═══════════════════════════════════════════════════════════════
# PASSO 4: Verificar Remoção
# ═══════════════════════════════════════════════════════════════

Write-Header "PASSO 4: Verificando Remoção"

Write-Step "Verificando se ainda há containers rodando..."
$stillRunning = docker ps --filter "name=conectcrm" --format "{{.Names}}"

if ($stillRunning) {
    Write-Warning "Ainda há containers rodando:"
    $stillRunning | ForEach-Object { 
        Write-Host "  - $_" -ForegroundColor Red
        
        if (Confirm-Action "Forçar remoção de $_?") {
            Write-Step "Forçando remoção de $_..."
            docker stop $_ 2>&1 | Out-Null
            docker rm -f $_ 2>&1 | Out-Null
            Write-Success "$_ removido"
        }
    }
} else {
    Write-Success "Nenhum container ConectCRM rodando!"
}

# ═══════════════════════════════════════════════════════════════
# PASSO 5: Remover Imagens (Opcional)
# ═══════════════════════════════════════════════════════════════

if (-not $KeepImages) {
    Write-Header "PASSO 5: Removendo Imagens Antigas"
    
    Write-Step "Listando imagens ConectCRM..."
    $images = docker images --filter "reference=*conectcrm*" --format "{{.Repository}}:{{.Tag}}"
    
    if ($images) {
        Write-Host ""
        Write-Host "Imagens encontradas:" -ForegroundColor Yellow
        $images | ForEach-Object { Write-Host "  - $_" -ForegroundColor White }
        Write-Host ""
        
        if (Confirm-Action "Remover essas imagens?") {
            Write-Step "Removendo imagens..."
            $images | ForEach-Object {
                try {
                    docker rmi $_ 2>&1 | Out-Null
                    Write-Host "  ✓ $_ removida" -ForegroundColor Green
                } catch {
                    Write-Warning "Não foi possível remover $_"
                }
            }
            Write-Success "Imagens removidas"
        } else {
            Write-Warning "Remoção de imagens cancelada"
        }
    } else {
        Write-Host "Nenhuma imagem ConectCRM encontrada." -ForegroundColor Gray
    }
    
    # Limpar imagens órfãs
    Write-Step "Limpando imagens órfãs..."
    docker image prune -f 2>&1 | Out-Null
    Write-Success "Imagens órfãs limpas"
} else {
    Write-Host ""
    Write-Host "⏭️  Pulando remoção de imagens (opção -KeepImages)" -ForegroundColor Gray
}

# ═══════════════════════════════════════════════════════════════
# PASSO 6: Limpar Volumes (Opcional)
# ═══════════════════════════════════════════════════════════════

Write-Header "PASSO 6: Limpar Volumes (OPCIONAL)"

Write-Warning "Atenção: Remover volumes irá APAGAR DADOS do banco PostgreSQL local!"
Write-Host ""

if (Confirm-Action "Deseja remover volumes Docker?") {
    Write-Step "Listando volumes..."
    $volumes = docker volume ls --filter "name=conectcrm" --format "{{.Name}}"
    
    if ($volumes) {
        Write-Host ""
        Write-Host "Volumes encontrados:" -ForegroundColor Yellow
        $volumes | ForEach-Object { Write-Host "  - $_" -ForegroundColor White }
        Write-Host ""
        
        if (Confirm-Action "⚠️  CONFIRMAR remoção de volumes (DADOS SERÃO PERDIDOS)?") {
            Write-Step "Removendo volumes..."
            $volumes | ForEach-Object {
                docker volume rm $_ 2>&1 | Out-Null
                Write-Host "  ✓ $_ removido" -ForegroundColor Green
            }
            Write-Success "Volumes removidos"
        } else {
            Write-Warning "Remoção de volumes cancelada"
        }
    } else {
        Write-Host "Nenhum volume ConectCRM encontrado." -ForegroundColor Gray
    }
} else {
    Write-Host "Volumes preservados." -ForegroundColor Gray
}

# ═══════════════════════════════════════════════════════════════
# PASSO 7: Limpar Networks
# ═══════════════════════════════════════════════════════════════

Write-Header "PASSO 7: Limpando Networks"

Write-Step "Removendo networks órfãs..."
docker network prune -f 2>&1 | Out-Null
Write-Success "Networks limpas"

# ═══════════════════════════════════════════════════════════════
# RESUMO FINAL
# ═══════════════════════════════════════════════════════════════

Write-Header "RESUMO FINAL"

Write-Success "Deploy quebrado removido com sucesso!"
Write-Host ""

# Estatísticas
$finalContainers = docker ps -a --filter "name=conectcrm" --format "{{.Names}}"
$finalImages = docker images --filter "reference=*conectcrm*" --format "{{.Repository}}:{{.Tag}}"
$finalVolumes = docker volume ls --filter "name=conectcrm" --format "{{.Name}}"

Write-Host "Estado atual:" -ForegroundColor Cyan
Write-Host "  Containers: $($finalContainers.Count)" -ForegroundColor White
Write-Host "  Imagens: $($finalImages.Count)" -ForegroundColor White
Write-Host "  Volumes: $($finalVolumes.Count)" -ForegroundColor White
Write-Host ""

# ═══════════════════════════════════════════════════════════════
# PRÓXIMOS PASSOS
# ═══════════════════════════════════════════════════════════════

Write-Header "PRÓXIMOS PASSOS"

Write-Host "1️⃣  Configurar ambiente de produção:" -ForegroundColor Yellow
Write-Host "     cd backend"
Write-Host "     cp .env.production.example .env.production"
Write-Host "     # Editar .env.production com credenciais de PRODUÇÃO"
Write-Host ""

Write-Host "2️⃣  Gerar JWT secrets:" -ForegroundColor Yellow
Write-Host "     [Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))"
Write-Host ""

Write-Host "3️⃣  Preparar banco de produção:" -ForegroundColor Yellow
Write-Host "     # Criar banco conectcrm_production"
Write-Host "     # Rodar migrations: npm run migration:run"
Write-Host ""

Write-Host "4️⃣  Novo deploy:" -ForegroundColor Yellow
Write-Host "     docker-compose -f docker-compose.prod.yml build"
Write-Host "     docker-compose -f docker-compose.prod.yml up -d"
Write-Host ""

Write-Host "5️⃣  Validar:" -ForegroundColor Yellow
Write-Host "     docker-compose logs -f"
Write-Host "     curl http://localhost:3001/health"
Write-Host ""

Write-Host "📚 Guia completo: GUIA_REMOVER_DEPLOY_QUEBRADO.md" -ForegroundColor Cyan
Write-Host ""

Write-Success "Script concluído!"
