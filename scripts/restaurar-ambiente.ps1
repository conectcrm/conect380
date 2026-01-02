# Script de Restauração Automática do Ambiente ConectCRM
# Execute este script na nova máquina após copiar a pasta de backup

param(
    [Parameter(Mandatory=$false)]
    [string]$BackupPath = "",
    [switch]$AutoInstall = $false
)

# Cores para output
$ErrorColor = "Red"
$SuccessColor = "Green"
$WarningColor = "Yellow"
$InfoColor = "Cyan"
$HighlightColor = "Magenta"

function Write-Step {
    param([string]$Message, [string]$Color = "Green")
    Write-Host "🔸 $Message" -ForegroundColor $Color
}

function Write-Error-Step {
    param([string]$Message)
    Write-Host "❌ $Message" -ForegroundColor $ErrorColor
}

function Write-Success-Step {
    param([string]$Message)
    Write-Host "✅ $Message" -ForegroundColor $SuccessColor
}

function Write-Warning-Step {
    param([string]$Message)
    Write-Host "⚠️  $Message" -ForegroundColor $WarningColor
}

Write-Host @"
🔄 ============================================
   RESTAURAÇÃO DO AMBIENTE CONECTCRM
   Migração completa de ambiente de desenvolvimento
============================================
"@ -ForegroundColor $HighlightColor

# Se BackupPath não foi fornecido, solicitar
if (-not $BackupPath) {
    Write-Host "📁 Informe o caminho da pasta de backup:" -ForegroundColor $InfoColor
    $BackupPath = Read-Host "Caminho do backup"
}

# Verificar se o backup existe
Write-Step "Verificando backup em: $BackupPath"
if (-not (Test-Path "$BackupPath\conectcrm")) {
    Write-Error-Step "Backup não encontrado em: $BackupPath"
    Write-Host "💡 Certifique-se de ter copiado a pasta de backup para esta máquina" -ForegroundColor $InfoColor
    Write-Host "💡 O backup deve conter uma pasta 'conectcrm' dentro" -ForegroundColor $InfoColor
    exit 1
}
Write-Success-Step "Backup encontrado e válido"

# Verificar se está executando como administrador
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")
if ($isAdmin) {
    Write-Success-Step "Executando como administrador"
} else {
    Write-Warning-Step "Não está executando como administrador. Algumas operações podem falhar."
}

# 1. Verificar softwares necessários
Write-Host "`n🔍 VERIFICANDO SOFTWARES NECESSÁRIOS..." -ForegroundColor $HighlightColor

$softwareStatus = @{}

# Node.js
try {
    $nodeVersion = & node --version 2>$null
    $softwareStatus.Node = $nodeVersion
    Write-Success-Step "Node.js $nodeVersion encontrado"
} catch {
    $softwareStatus.Node = $null
    Write-Error-Step "Node.js não encontrado"
}

# NPM
try {
    $npmVersion = & npm --version 2>$null
    $softwareStatus.NPM = $npmVersion
    Write-Success-Step "NPM $npmVersion encontrado"
} catch {
    $softwareStatus.NPM = $null
    Write-Error-Step "NPM não encontrado"
}

# Docker
try {
    $dockerVersion = & docker --version 2>$null
    $softwareStatus.Docker = $dockerVersion
    Write-Success-Step "Docker encontrado: $dockerVersion"
} catch {
    $softwareStatus.Docker = $null
    Write-Error-Step "Docker não encontrado"
}

# Git
try {
    $gitVersion = & git --version 2>$null
    $softwareStatus.Git = $gitVersion
    Write-Success-Step "Git encontrado: $gitVersion"
} catch {
    $softwareStatus.Git = $null
    Write-Warning-Step "Git não encontrado (opcional)"
}

# VS Code
try {
    $codeVersion = & code --version 2>$null | Select-Object -First 1
    $softwareStatus.VSCode = $codeVersion
    Write-Success-Step "VS Code encontrado: $codeVersion"
} catch {
    $softwareStatus.VSCode = $null
    Write-Warning-Step "VS Code não encontrado no PATH"
}

# Verificar se softwares críticos estão instalados
$criticalMissing = @()
if (-not $softwareStatus.Node) { $criticalMissing += "Node.js" }
if (-not $softwareStatus.NPM) { $criticalMissing += "NPM" }
if (-not $softwareStatus.Docker) { $criticalMissing += "Docker" }

if ($criticalMissing.Count -gt 0) {
    Write-Error-Step "Softwares críticos não encontrados: $($criticalMissing -join ', ')"
    
    if ($AutoInstall) {
        Write-Step "Modo AutoInstall ativado, mas instalação automática não implementada" $WarningColor
        Write-Host "💡 Instale manualmente os softwares ausentes e execute novamente" -ForegroundColor $InfoColor
    } else {
        Write-Host "`n📋 INSTRUÇÕES DE INSTALAÇÃO:" -ForegroundColor $InfoColor
        Write-Host "1. Node.js: https://nodejs.org/ (versão LTS)" -ForegroundColor White
        Write-Host "2. Docker Desktop: https://www.docker.com/products/docker-desktop/" -ForegroundColor White
        Write-Host "3. VS Code: https://code.visualstudio.com/" -ForegroundColor White
        Write-Host "4. Git: https://git-scm.com/downloads" -ForegroundColor White
        
        $continue = Read-Host "`nDeseja continuar mesmo assim? (y/N)"
        if ($continue -ne "y" -and $continue -ne "Y") {
            Write-Host "Restauração cancelada. Instale os softwares necessários primeiro." -ForegroundColor $WarningColor
            exit 1
        }
    }
}

# 2. Criar estrutura de pastas
Write-Host "`n📁 CRIANDO ESTRUTURA DE PASTAS..." -ForegroundColor $HighlightColor
try {
    Write-Step "Criando C:\Projetos\"
    New-Item -ItemType Directory -Path "C:\Projetos" -Force | Out-Null
    Write-Success-Step "Estrutura de pastas criada"
} catch {
    Write-Error-Step "Erro ao criar estrutura: $($_.Exception.Message)"
    exit 1
}

# 3. Restaurar projeto
Write-Host "`n📂 RESTAURANDO PROJETO..." -ForegroundColor $HighlightColor
try {
    Write-Step "Copiando projeto de $BackupPath\conectcrm para C:\Projetos\"
    
    # Remover projeto existente se houver
    if (Test-Path "C:\Projetos\conectcrm") {
        Write-Warning-Step "Projeto existente encontrado, fazendo backup..."
        $timestamp = Get-Date -Format 'yyyyMMdd-HHmm'
        Move-Item -Path "C:\Projetos\conectcrm" -Destination "C:\Projetos\conectcrm-backup-$timestamp" -Force
    }
    
    Copy-Item -Path "$BackupPath\conectcrm" -Destination "C:\Projetos\" -Recurse -Force
    Write-Success-Step "Projeto restaurado com sucesso"
} catch {
    Write-Error-Step "Erro ao restaurar projeto: $($_.Exception.Message)"
    exit 1
}

# 4. Instalar dependências
Write-Host "`n📦 INSTALANDO DEPENDÊNCIAS..." -ForegroundColor $HighlightColor

# Backend
if (Test-Path "C:\Projetos\conectcrm\backend\package.json") {
    Write-Step "Instalando dependências do backend..."
    try {
        Set-Location "C:\Projetos\conectcrm\backend"
        if ($softwareStatus.NPM) {
            & npm install --silent
            Write-Success-Step "Dependências do backend instaladas"
        } else {
            Write-Warning-Step "NPM não disponível, pule a instalação de dependências"
        }
    } catch {
        Write-Error-Step "Erro ao instalar dependências do backend: $($_.Exception.Message)"
    }
} else {
    Write-Warning-Step "package.json do backend não encontrado"
}

# Frontend Web
if (Test-Path "C:\Projetos\conectcrm\frontend-web\package.json") {
    Write-Step "Instalando dependências do frontend..."
    try {
        Set-Location "C:\Projetos\conectcrm\frontend-web"
        if ($softwareStatus.NPM) {
            & npm install --silent
            Write-Success-Step "Dependências do frontend instaladas"
        } else {
            Write-Warning-Step "NPM não disponível, pule a instalação de dependências"
        }
    } catch {
        Write-Error-Step "Erro ao instalar dependências do frontend: $($_.Exception.Message)"
    }
} else {
    Write-Warning-Step "package.json do frontend não encontrado"
}

# Mobile (se existir)
if (Test-Path "C:\Projetos\conectcrm\mobile\package.json") {
    Write-Step "Instalando dependências do mobile..."
    try {
        Set-Location "C:\Projetos\conectcrm\mobile"
        if ($softwareStatus.NPM) {
            & npm install --silent
            Write-Success-Step "Dependências do mobile instaladas"
        } else {
            Write-Warning-Step "NPM não disponível, pule a instalação de dependências"
        }
    } catch {
        Write-Error-Step "Erro ao instalar dependências do mobile: $($_.Exception.Message)"
    }
}

# 5. Configurar VS Code
Write-Host "`n🔌 CONFIGURANDO VS CODE..." -ForegroundColor $HighlightColor

# Restaurar configurações
if (Test-Path "$BackupPath\vscode-settings.json") {
    try {
        $vsCodeUserPath = "$env:APPDATA\Code\User"
        if (-not (Test-Path $vsCodeUserPath)) {
            New-Item -ItemType Directory -Path $vsCodeUserPath -Force | Out-Null
        }
        Copy-Item -Path "$BackupPath\vscode-settings.json" -Destination "$vsCodeUserPath\settings.json" -Force
        Write-Success-Step "Configurações do VS Code restauradas"
    } catch {
        Write-Warning-Step "Erro ao restaurar configurações do VS Code"
    }
}

# Restaurar keybindings
if (Test-Path "$BackupPath\vscode-keybindings.json") {
    try {
        Copy-Item -Path "$BackupPath\vscode-keybindings.json" -Destination "$env:APPDATA\Code\User\keybindings.json" -Force
        Write-Success-Step "Keybindings do VS Code restaurados"
    } catch {
        Write-Warning-Step "Erro ao restaurar keybindings do VS Code"
    }
}

# Instalar extensões
if (Test-Path "$BackupPath\vscode-extensions.txt" -and $softwareStatus.VSCode) {
    Write-Step "Instalando extensões do VS Code..."
    try {
        $extensions = Get-Content "$BackupPath\vscode-extensions.txt"
        $installedCount = 0
        foreach ($extension in $extensions) {
            if ($extension.Trim()) {
                try {
                    & code --install-extension $extension.Trim() --force | Out-Null
                    $installedCount++
                } catch {
                    Write-Warning-Step "Falha ao instalar extensão: $extension"
                }
            }
        }
        Write-Success-Step "$installedCount extensões do VS Code instaladas"
    } catch {
        Write-Warning-Step "Erro ao instalar extensões do VS Code"
    }
} else {
    Write-Warning-Step "Lista de extensões não encontrada ou VS Code não disponível"
}

# 6. Configurar Docker e Banco
Write-Host "`n🐳 CONFIGURANDO DOCKER E BANCO..." -ForegroundColor $HighlightColor

if ($softwareStatus.Docker) {
    Write-Step "Iniciando containers Docker..."
    try {
        Set-Location "C:\Projetos\conectcrm\backend"
        
        # Verificar se Docker está rodando
        & docker info | Out-Null
        
        # Parar containers existentes
        & docker-compose down 2>$null | Out-Null
        
        # Iniciar containers
        & docker-compose up -d
        
        Write-Success-Step "Containers Docker iniciados"
        
        # Aguardar PostgreSQL inicializar
        Write-Step "Aguardando PostgreSQL inicializar (60 segundos)..."
        Start-Sleep -Seconds 60
        
        # Restaurar banco se backup existir
        if (Test-Path "$BackupPath\backup_conectcrm.sql") {
            Write-Step "Restaurando backup do banco de dados..."
            try {
                Get-Content "$BackupPath\backup_conectcrm.sql" | & docker exec -i conectcrm-postgres psql -U conectcrm -d conectcrm_db
                Write-Success-Step "Banco de dados restaurado"
            } catch {
                Write-Warning-Step "Erro ao restaurar banco. Execute manualmente se necessário."
            }
        } else {
            Write-Warning-Step "Backup do banco não encontrado"
        }
        
    } catch {
        Write-Error-Step "Erro com Docker: $($_.Exception.Message)"
        Write-Host "💡 Certifique-se que Docker Desktop está rodando" -ForegroundColor $InfoColor
    }
} else {
    Write-Warning-Step "Docker não disponível. Configure manualmente:"
    Write-Host "1. Instale Docker Desktop" -ForegroundColor White
    Write-Host "2. Execute: cd C:\Projetos\conectcrm\backend" -ForegroundColor White
    Write-Host "3. Execute: docker-compose up -d" -ForegroundColor White
    if (Test-Path "$BackupPath\backup_conectcrm.sql") {
        Write-Host "4. Restaure banco: Get-Content '$BackupPath\backup_conectcrm.sql' | docker exec -i conectcrm-postgres psql -U conectcrm -d conectcrm_db" -ForegroundColor White
    }
}

# 7. Teste final
Write-Host "`n✅ TESTE DE FUNCIONAMENTO..." -ForegroundColor $HighlightColor

$testResults = @{}

# Teste build backend
if ($softwareStatus.NPM) {
    Write-Step "Testando build do backend..."
    try {
        Set-Location "C:\Projetos\conectcrm\backend"
        $buildOutput = & npm run build 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Success-Step "Backend compila corretamente"
            $testResults.Backend = $true
        } else {
            Write-Warning-Step "Backend com problemas de compilação"
            $testResults.Backend = $false
        }
    } catch {
        Write-Warning-Step "Erro ao testar backend"
        $testResults.Backend = $false
    }
}

# Verificar estrutura frontend
if (Test-Path "C:\Projetos\conectcrm\frontend-web\src") {
    Write-Success-Step "Estrutura do frontend verificada"
    $testResults.Frontend = $true
} else {
    Write-Warning-Step "Estrutura do frontend incompleta"
    $testResults.Frontend = $false
}

# Resumo final
Write-Host "`n🎉 RESTAURAÇÃO CONCLUÍDA!" -ForegroundColor $SuccessColor
Write-Host "📊 RESUMO DA RESTAURAÇÃO:" -ForegroundColor $HighlightColor

Write-Host "`n✅ Componentes Restaurados:" -ForegroundColor $SuccessColor
Write-Host "  📂 Projeto: C:\Projetos\conectcrm" -ForegroundColor White
Write-Host "  📦 Dependências: Instaladas" -ForegroundColor White
Write-Host "  ⚙️  Configurações VS Code: Restauradas" -ForegroundColor White

if ($softwareStatus.Docker) {
    Write-Host "  🐳 Docker: Configurado e rodando" -ForegroundColor White
} else {
    Write-Host "  🐳 Docker: Requer configuração manual" -ForegroundColor $WarningColor
}

Write-Host "`n🚀 PRÓXIMOS PASSOS:" -ForegroundColor $InfoColor
Write-Host "1. Abra VS Code: code C:\Projetos\conectcrm" -ForegroundColor White
Write-Host "2. Terminal backend: cd backend && npm run start:dev" -ForegroundColor White
Write-Host "3. Terminal frontend: cd frontend-web && npm start" -ForegroundColor White
Write-Host "4. Acesse: http://localhost:3000" -ForegroundColor White
Write-Host "5. Login: admin@conectsuite.com.br / password" -ForegroundColor White

if (-not $softwareStatus.Docker) {
    Write-Host "`n⚠️  Configure Docker manualmente:" -ForegroundColor $WarningColor
    Write-Host "1. Instale Docker Desktop" -ForegroundColor White
    Write-Host "2. cd C:\Projetos\conectcrm\backend" -ForegroundColor White
    Write-Host "3. docker-compose up -d" -ForegroundColor White
}

Write-Host "`n🎯 Ambiente restaurado com sucesso!" -ForegroundColor $SuccessColor

# Abrir projeto no VS Code se disponível
if ($softwareStatus.VSCode) {
    $openVSCode = Read-Host "`nDeseja abrir o projeto no VS Code agora? (Y/n)"
    if ($openVSCode -ne "n" -and $openVSCode -ne "N") {
        try {
            & code "C:\Projetos\conectcrm"
            Write-Success-Step "VS Code aberto com o projeto"
        } catch {
            Write-Warning-Step "Erro ao abrir VS Code"
        }
    }
}

# Voltar ao diretório original
Set-Location $PSScriptRoot
