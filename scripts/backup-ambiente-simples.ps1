# Backup Automatizado do Ambiente ConectCRM
Write-Host "Iniciando backup do ambiente ConectCRM..." -ForegroundColor Yellow

# 1. Criar pasta de backup com timestamp
$timestamp = Get-Date -Format 'yyyyMMdd-HHmm'
$backupPath = "C:\Backup\ConectCRM-$timestamp"
Write-Host "Criando pasta de backup: $backupPath" -ForegroundColor Green

try {
    New-Item -ItemType Directory -Path $backupPath -Force | Out-Null
    Write-Host "Pasta de backup criada com sucesso" -ForegroundColor Green
} catch {
    Write-Host "Erro ao criar pasta de backup: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# 2. Copiar projeto completo
Write-Host "Copiando projeto completo..." -ForegroundColor Green
try {
    if (Test-Path "C:\Projetos\conectcrm") {
        Copy-Item -Path "C:\Projetos\conectcrm" -Destination "$backupPath\conectcrm" -Recurse -Force
        Write-Host "Projeto copiado com sucesso" -ForegroundColor Green
    } else {
        Write-Host "Pasta do projeto nao encontrada em C:\Projetos\conectcrm" -ForegroundColor Red
    }
} catch {
    Write-Host "Erro ao copiar projeto: $($_.Exception.Message)" -ForegroundColor Red
}

# 3. Backup do banco de dados PostgreSQL
Write-Host "Fazendo backup do banco de dados..." -ForegroundColor Green
try {
    $dockerRunning = docker ps -q --filter "name=conectcrm-postgres" 2>$null
    
    if ($dockerRunning) {
        docker exec conectcrm-postgres pg_dump -U conectcrm -d conectcrm_db | Out-File -FilePath "$backupPath\backup_conectcrm.sql" -Encoding UTF8
        Write-Host "Backup do banco via Docker concluido" -ForegroundColor Green
    } else {
        Write-Host "Docker nao esta rodando. Pule este passo se nao usar banco." -ForegroundColor Yellow
    }
} catch {
    Write-Host "Erro no backup do banco: $($_.Exception.Message)" -ForegroundColor Yellow
}

# 4. Exportar extensoes do VS Code
Write-Host "Exportando extensoes do VS Code..." -ForegroundColor Green
try {
    & code --list-extensions | Out-File -FilePath "$backupPath\vscode-extensions.txt" -Encoding UTF8
    Write-Host "Lista de extensoes exportada" -ForegroundColor Green
} catch {
    Write-Host "VS Code nao encontrado no PATH" -ForegroundColor Yellow
}

# 5. Copiar configuracoes do VS Code
Write-Host "Copiando configuracoes do VS Code..." -ForegroundColor Green
try {
    $vsCodeSettings = "$env:APPDATA\Code\User\settings.json"
    if (Test-Path $vsCodeSettings) {
        Copy-Item -Path $vsCodeSettings -Destination "$backupPath\vscode-settings.json" -Force
        Write-Host "Settings.json copiado" -ForegroundColor Green
    }
    
    $vsCodeKeybindings = "$env:APPDATA\Code\User\keybindings.json"
    if (Test-Path $vsCodeKeybindings) {
        Copy-Item -Path $vsCodeKeybindings -Destination "$backupPath\vscode-keybindings.json" -Force
        Write-Host "Keybindings.json copiado" -ForegroundColor Green
    }
} catch {
    Write-Host "Erro ao copiar configuracoes VS Code: $($_.Exception.Message)" -ForegroundColor Yellow
}

# 6. Salvar informacoes de versoes
Write-Host "Salvando informacoes do ambiente..." -ForegroundColor Green
try {
    $envInfo = @"
=== INFORMACOES DO AMBIENTE CONECTCRM ===
Data do Backup: $(Get-Date)
Sistema Operacional: $($env:OS)
Usuario: $($env:USERNAME)
Computador: $($env:COMPUTERNAME)

=== VERSOES DE SOFTWARE ===
"@

    try {
        $nodeVersion = & node --version 2>$null
        $envInfo += "`nNode.js: $nodeVersion"
    } catch {
        $envInfo += "`nNode.js: NAO INSTALADO"
    }

    try {
        $npmVersion = & npm --version 2>$null
        $envInfo += "`nNPM: $npmVersion"
    } catch {
        $envInfo += "`nNPM: NAO INSTALADO"
    }

    try {
        $dockerVersion = & docker --version 2>$null
        $envInfo += "`nDocker: $dockerVersion"
    } catch {
        $envInfo += "`nDocker: NAO INSTALADO"
    }

    try {
        $gitVersion = & git --version 2>$null
        $envInfo += "`nGit: $gitVersion"
    } catch {
        $envInfo += "`nGit: NAO INSTALADO"
    }

    $envInfo += @"

=== ESTRUTURA DO PROJETO ===
Backend: $(if (Test-Path "C:\Projetos\conectcrm\backend") { "Presente" } else { "Ausente" })
Frontend: $(if (Test-Path "C:\Projetos\conectcrm\frontend-web") { "Presente" } else { "Ausente" })
Mobile: $(if (Test-Path "C:\Projetos\conectcrm\mobile") { "Presente" } else { "Ausente" })

=== CONFIGURACOES IMPORTANTES ===
Porta Backend: 3001
Porta Frontend: 3000
Porta PostgreSQL: 5434
Database: conectcrm_db
Usuario DB: conectcrm

=== INSTRUCOES DE RESTAURACAO ===
1. Instale Node.js, Docker, Git, VS Code na nova maquina
2. Copie a pasta 'conectcrm' para C:\Projetos\
3. Execute: cd backend && npm install
4. Execute: cd frontend-web && npm install
5. Execute: docker-compose up -d (backend)
6. Restaure o banco: psql < backup_conectcrm.sql
7. Instale extensoes: code --install-extension < vscode-extensions.txt

=== COMANDOS PARA TESTAR ===
Backend: cd backend && npm run start:dev
Frontend: cd frontend-web && npm start
Acesso: http://localhost:3000
Login: admin@conectcrm.com / password
"@

    $envInfo | Out-File -FilePath "$backupPath\INFORMACOES_AMBIENTE.txt" -Encoding UTF8
    Write-Host "Informacoes do ambiente salvas" -ForegroundColor Green
} catch {
    Write-Host "Erro ao salvar informacoes: $($_.Exception.Message)" -ForegroundColor Yellow
}

# 7. Resumo final
Write-Host ""
Write-Host "BACKUP CONCLUIDO COM SUCESSO!" -ForegroundColor Green
Write-Host "Local do backup: $backupPath" -ForegroundColor Cyan
Write-Host ""
Write-Host "Conteudo do backup:" -ForegroundColor Yellow
Write-Host "  Projeto completo (conectcrm/)" -ForegroundColor White
Write-Host "  Configuracoes VS Code" -ForegroundColor White
Write-Host "  Lista de extensoes VS Code" -ForegroundColor White
Write-Host "  Informacoes do ambiente" -ForegroundColor White

if (Test-Path "$backupPath\backup_conectcrm.sql") {
    Write-Host "  Backup do banco de dados" -ForegroundColor White
} else {
    Write-Host "  Backup do banco (verifique se necessario)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "PROXIMOS PASSOS:" -ForegroundColor Cyan
Write-Host "1. Copie a pasta '$backupPath' para a nova maquina" -ForegroundColor White
Write-Host "2. Na nova maquina, execute o script: restaurar-ambiente.ps1" -ForegroundColor White
Write-Host "3. Siga as instrucoes no arquivo: INFORMACOES_AMBIENTE.txt" -ForegroundColor White
Write-Host ""

# Abrir pasta do backup
try {
    Start-Process "explorer.exe" -ArgumentList $backupPath
    Write-Host "Pasta de backup aberta no Explorer" -ForegroundColor Green
} catch {
    Write-Host "Abra manualmente: $backupPath" -ForegroundColor Cyan
}

Write-Host "Backup salvo e pronto para migracao!" -ForegroundColor Green
