# Backup Automatizado do Ambiente ConectCRM
# Execute este script para criar um backup completo do ambiente

Write-Host "🔄 Iniciando backup do ambiente ConectCRM..." -ForegroundColor Yellow

# Verificar se é executado como administrador para acesso ao Docker
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")

if (-not $isAdmin) {
    Write-Host "⚠️  Recomendado executar como administrador para backup completo do Docker" -ForegroundColor Yellow
}

# 1. Criar pasta de backup com timestamp
$timestamp = Get-Date -Format 'yyyyMMdd-HHmm'
$backupPath = "C:\Backup\ConectCRM-$timestamp"
Write-Host "📁 Criando pasta de backup: $backupPath" -ForegroundColor Green

try {
    New-Item -ItemType Directory -Path $backupPath -Force | Out-Null
} catch {
    Write-Host "❌ Erro ao criar pasta de backup: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# 2. Copiar projeto completo
Write-Host "📂 Copiando projeto completo..." -ForegroundColor Green
try {
    if (Test-Path "C:\Projetos\conectcrm") {
        Copy-Item -Path "C:\Projetos\conectcrm" -Destination "$backupPath\conectcrm" -Recurse -Force
        Write-Host "✅ Projeto copiado com sucesso" -ForegroundColor Green
    } else {
        Write-Host "❌ Pasta do projeto não encontrada em C:\Projetos\conectcrm" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Erro ao copiar projeto: $($_.Exception.Message)" -ForegroundColor Red
}

# 3. Backup do banco de dados PostgreSQL
Write-Host "🗄️ Fazendo backup do banco de dados..." -ForegroundColor Green
try {
    # Verificar se Docker está rodando
    $dockerRunning = docker ps -q --filter "name=conectcrm-postgres" 2>$null
    
    if ($dockerRunning) {
        # Fazer backup via Docker
        docker exec conectcrm-postgres pg_dump -U conectcrm -d conectcrm_db | Out-File -FilePath "$backupPath\backup_conectcrm.sql" -Encoding UTF8
        Write-Host "✅ Backup do banco via Docker concluído" -ForegroundColor Green
    } else {
        # Tentar backup direto (se PostgreSQL estiver instalado localmente)
        try {
            pg_dump -h localhost -p 5434 -U conectcrm -d conectcrm_db | Out-File -FilePath "$backupPath\backup_conectcrm.sql" -Encoding UTF8
            Write-Host "✅ Backup do banco direto concluído" -ForegroundColor Green
        } catch {
            Write-Host "⚠️  Docker não está rodando e pg_dump não disponível. Pule este passo se não usar banco." -ForegroundColor Yellow
        }
    }
} catch {
    Write-Host "⚠️  Erro no backup do banco: $($_.Exception.Message)" -ForegroundColor Yellow
    Write-Host "💡 Certifique-se que o Docker está rodando ou PostgreSQL está acessível" -ForegroundColor Cyan
}

# 4. Exportar extensões do VS Code
Write-Host "🔌 Exportando extensões do VS Code..." -ForegroundColor Green
try {
    & code --list-extensions | Out-File -FilePath "$backupPath\vscode-extensions.txt" -Encoding UTF8
    Write-Host "✅ Lista de extensões exportada" -ForegroundColor Green
} catch {
    Write-Host "⚠️  VS Code não encontrado no PATH. Instale ou adicione ao PATH." -ForegroundColor Yellow
}

# 5. Copiar configurações do VS Code
Write-Host "⚙️ Copiando configurações do VS Code..." -ForegroundColor Green
try {
    # Settings.json
    $vsCodeSettings = "$env:APPDATA\Code\User\settings.json"
    if (Test-Path $vsCodeSettings) {
        Copy-Item -Path $vsCodeSettings -Destination "$backupPath\vscode-settings.json" -Force
        Write-Host "✅ Settings.json copiado" -ForegroundColor Green
    }
    
    # Keybindings.json
    $vsCodeKeybindings = "$env:APPDATA\Code\User\keybindings.json"
    if (Test-Path $vsCodeKeybindings) {
        Copy-Item -Path $vsCodeKeybindings -Destination "$backupPath\vscode-keybindings.json" -Force
        Write-Host "✅ Keybindings.json copiado" -ForegroundColor Green
    }
    
    # Snippets (se existir)
    $vsCodeSnippets = "$env:APPDATA\Code\User\snippets"
    if (Test-Path $vsCodeSnippets) {
        Copy-Item -Path $vsCodeSnippets -Destination "$backupPath\vscode-snippets" -Recurse -Force
        Write-Host "✅ Snippets copiados" -ForegroundColor Green
    }
} catch {
    Write-Host "⚠️  Erro ao copiar configurações VS Code: $($_.Exception.Message)" -ForegroundColor Yellow
}

# 6. Salvar informações de versões e configurações
Write-Host "📋 Salvando informações do ambiente..." -ForegroundColor Green
try {
    $envInfo = @"
=== INFORMAÇÕES DO AMBIENTE CONECTCRM ===
Data do Backup: $(Get-Date)
Sistema Operacional: $($env:OS)
Usuário: $($env:USERNAME)
Computador: $($env:COMPUTERNAME)

=== VERSÕES DE SOFTWARE ===
"@

    # Node.js
    try {
        $nodeVersion = & node --version 2>$null
        $envInfo += "`nNode.js: $nodeVersion"
    } catch {
        $envInfo += "`nNode.js: NÃO INSTALADO"
    }

    # NPM
    try {
        $npmVersion = & npm --version 2>$null
        $envInfo += "`nNPM: $npmVersion"
    } catch {
        $envInfo += "`nNPM: NÃO INSTALADO"
    }

    # Docker
    try {
        $dockerVersion = & docker --version 2>$null
        $envInfo += "`nDocker: $dockerVersion"
    } catch {
        $envInfo += "`nDocker: NÃO INSTALADO"
    }

    # Git
    try {
        $gitVersion = & git --version 2>$null
        $envInfo += "`nGit: $gitVersion"
    } catch {
        $envInfo += "`nGit: NÃO INSTALADO"
    }

    $envInfo += @"

=== ESTRUTURA DO PROJETO ===
Backend: $(if (Test-Path "C:\Projetos\conectcrm\backend") { "✅ Presente" } else { "❌ Ausente" })
Frontend: $(if (Test-Path "C:\Projetos\conectcrm\frontend-web") { "✅ Presente" } else { "❌ Ausente" })
Mobile: $(if (Test-Path "C:\Projetos\conectcrm\mobile") { "✅ Presente" } else { "❌ Ausente" })

=== CONFIGURAÇÕES IMPORTANTES ===
Porta Backend: 3001
Porta Frontend: 3000
Porta PostgreSQL: 5434
Database: conectcrm_db
Usuario DB: conectcrm

=== ARQUIVOS IMPORTANTES ===
- Projeto: conectcrm/
- Backup DB: backup_conectcrm.sql
- Extensões VS Code: vscode-extensions.txt
- Settings VS Code: vscode-settings.json
- Keybindings VS Code: vscode-keybindings.json

=== INSTRUÇÕES DE RESTAURAÇÃO ===
1. Instale Node.js, Docker, Git, VS Code na nova máquina
2. Copie a pasta 'conectcrm' para C:\Projetos\
3. Execute: cd backend && npm install
4. Execute: cd frontend-web && npm install
5. Execute: docker-compose up -d (backend)
6. Restaure o banco: psql < backup_conectcrm.sql
7. Instale extensões: code --install-extension < vscode-extensions.txt

=== COMANDOS PARA TESTAR ===
Backend: cd backend && npm run start:dev
Frontend: cd frontend-web && npm start
Acesso: http://localhost:3000
Login: admin@conectsuite.com.br / password
"@

    $envInfo | Out-File -FilePath "$backupPath\INFORMACOES_AMBIENTE.txt" -Encoding UTF8
    Write-Host "✅ Informações do ambiente salvas" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Erro ao salvar informações: $($_.Exception.Message)" -ForegroundColor Yellow
}

# 7. Criar script de restauração
Write-Host "📜 Criando script de restauração..." -ForegroundColor Green
$restoreScript = @"
# Script de Restauração do Ambiente ConectCRM
# Execute este script na nova máquina após copiar a pasta de backup

param(
    [string]`$BackupPath = "$backupPath"
)

Write-Host "🔄 Iniciando restauração do ConectCRM..." -ForegroundColor Yellow

# Verificar se backup existe
if (-not (Test-Path "`$BackupPath\conectcrm")) {
    Write-Host "❌ Backup não encontrado em: `$BackupPath" -ForegroundColor Red
    Write-Host "💡 Certifique-se de ter copiado a pasta de backup para esta máquina" -ForegroundColor Cyan
    exit 1
}

# Criar estrutura
Write-Host "📁 Criando estrutura de pastas..." -ForegroundColor Green
New-Item -ItemType Directory -Path "C:\Projetos" -Force | Out-Null

# Copiar projeto
Write-Host "📂 Restaurando projeto..." -ForegroundColor Green
Copy-Item -Path "`$BackupPath\conectcrm" -Destination "C:\Projetos\" -Recurse -Force

# Instalar dependências
Write-Host "📦 Instalando dependências backend..." -ForegroundColor Green
Set-Location "C:\Projetos\conectcrm\backend"
npm install

Write-Host "📦 Instalando dependências frontend..." -ForegroundColor Green
Set-Location "C:\Projetos\conectcrm\frontend-web"
npm install

# Docker e banco
Write-Host "🐳 Instruções finais:" -ForegroundColor Cyan
Write-Host "1. Instale Docker Desktop se ainda não instalou" -ForegroundColor White
Write-Host "2. Execute: cd C:\Projetos\conectcrm\backend" -ForegroundColor White
Write-Host "3. Execute: docker-compose up -d" -ForegroundColor White
Write-Host "4. Aguarde 1 minuto e restaure o banco:" -ForegroundColor White
Write-Host "   Get-Content '`$BackupPath\backup_conectcrm.sql' | docker exec -i conectcrm-postgres psql -U conectcrm -d conectcrm_db" -ForegroundColor White
Write-Host "5. Teste: npm run start:dev (backend) e npm start (frontend)" -ForegroundColor White

# Extensões VS Code
if (Test-Path "`$BackupPath\vscode-extensions.txt") {
    Write-Host "🔌 Instalar extensões VS Code:" -ForegroundColor Cyan
    Write-Host "Get-Content '`$BackupPath\vscode-extensions.txt' | ForEach-Object { code --install-extension `$_ }" -ForegroundColor White
}

Write-Host "✅ Restauração preparada!" -ForegroundColor Green
"@

$restoreScript | Out-File -FilePath "$backupPath\RESTAURAR_AMBIENTE.ps1" -Encoding UTF8

# 8. Resumo final
Write-Host ""
Write-Host "🎉 BACKUP CONCLUÍDO COM SUCESSO!" -ForegroundColor Green
Write-Host "📍 Local do backup: $backupPath" -ForegroundColor Cyan
Write-Host ""
Write-Host "📦 Conteúdo do backup:" -ForegroundColor Yellow
Write-Host "  ✅ Projeto completo (conectcrm/)" -ForegroundColor White
Write-Host "  ✅ Configurações VS Code" -ForegroundColor White
Write-Host "  ✅ Lista de extensões VS Code" -ForegroundColor White
Write-Host "  ✅ Informações do ambiente" -ForegroundColor White
Write-Host "  ✅ Script de restauração" -ForegroundColor White
if (Test-Path "$backupPath\backup_conectcrm.sql") {
    Write-Host "  ✅ Backup do banco de dados" -ForegroundColor White
} else {
    Write-Host "  ⚠️  Backup do banco (verifique se necessário)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🚀 PRÓXIMOS PASSOS:" -ForegroundColor Cyan
Write-Host "1. Copie a pasta '$backupPath' para a nova máquina" -ForegroundColor White
Write-Host "2. Na nova máquina, execute o script: RESTAURAR_AMBIENTE.ps1" -ForegroundColor White
Write-Host "3. Siga as instruções no arquivo: INFORMACOES_AMBIENTE.txt" -ForegroundColor White
Write-Host ""

# Abrir pasta do backup
try {
    Start-Process "explorer.exe" -ArgumentList $backupPath
} catch {
    Write-Host "💡 Abra manualmente: $backupPath" -ForegroundColor Cyan
}

Write-Host "Backup salvo e pronto para migracao!" -ForegroundColor Green
