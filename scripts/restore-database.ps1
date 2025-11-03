# 🔄 Restore do Banco de Dados - ConectCRM
# Restaura backup do PostgreSQL

param(
    [Parameter(Mandatory=$true)]
    [string]$BackupFile,              # Arquivo de backup (.sql ou .sql.gz)
    [string]$ContainerName = "postgres", # Nome do container Docker
    [string]$Database = "conectcrm",  # Nome do banco de dados
    [string]$Username = "postgres",   # Usuário do banco
    [switch]$Force,                   # Não pedir confirmação
    [switch]$Verbose                  # Modo verbose
)

# Cores
$ColorSuccess = "Green"
$ColorError = "Red"
$ColorInfo = "Cyan"
$ColorWarning = "Yellow"

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════════" -ForegroundColor White
Write-Host "  🔄 RESTORE DO BANCO DE DADOS - ConectCRM" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════════" -ForegroundColor White
Write-Host ""

# Verificar se arquivo existe
if (-not (Test-Path $BackupFile)) {
    Write-Host "❌ Arquivo de backup não encontrado: $BackupFile" -ForegroundColor $ColorError
    exit 1
}

$fileInfo = Get-Item $BackupFile
$fileSizeMB = [math]::Round($fileInfo.Length / 1MB, 2)

Write-Host "📁 Arquivo de backup: $BackupFile" -ForegroundColor $ColorInfo
Write-Host "📊 Tamanho: $fileSizeMB MB" -ForegroundColor $ColorInfo
Write-Host "📅 Data: $($fileInfo.LastWriteTime)" -ForegroundColor $ColorInfo
Write-Host ""

# Verificar se Docker está rodando
Write-Host "🔍 Verificando Docker..." -ForegroundColor $ColorInfo
docker ps 2>&1 | Out-Null

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Docker não está rodando" -ForegroundColor $ColorError
    Write-Host "💡 Solução: Inicie o Docker Desktop" -ForegroundColor $ColorInfo
    exit 1
}

# Verificar se container PostgreSQL está rodando
Write-Host "🔍 Verificando container '$ContainerName'..." -ForegroundColor $ColorInfo
$containerStatus = docker ps --filter "name=$ContainerName" --format "{{.Status}}" 2>&1

if ([string]::IsNullOrEmpty($containerStatus)) {
    Write-Host "❌ Container '$ContainerName' não está rodando" -ForegroundColor $ColorError
    Write-Host "💡 Solução: docker-compose up -d postgres" -ForegroundColor $ColorInfo
    exit 1
}

Write-Host "✅ Container '$ContainerName' está rodando" -ForegroundColor $ColorSuccess
Write-Host ""

# Aviso de perda de dados
if (-not $Force) {
    Write-Host "⚠️  ATENÇÃO: Esta operação irá SOBRESCREVER todos os dados do banco '$Database'" -ForegroundColor $ColorWarning
    Write-Host ""
    $confirmation = Read-Host "Deseja continuar? Digite 'CONFIRMAR' para prosseguir"
    
    if ($confirmation -ne "CONFIRMAR") {
        Write-Host "❌ Operação cancelada pelo usuário" -ForegroundColor $ColorError
        exit 0
    }
}

# Descompactar se necessário
$sqlFile = $BackupFile

if ($BackupFile -like "*.gz") {
    Write-Host "🗜️  Descompactando backup..." -ForegroundColor $ColorInfo
    
    $gitBashGunzip = "C:\Program Files\Git\usr\bin\gunzip.exe"
    $tempSqlFile = $BackupFile -replace '\.gz$', ''
    
    if (Test-Path $gitBashGunzip) {
        # Copiar para não modificar o original
        Copy-Item $BackupFile "$BackupFile.temp.gz" -Force
        & $gitBashGunzip -f "$BackupFile.temp.gz" 2>&1 | Out-Null
        $sqlFile = "$BackupFile.temp"
    } else {
        Write-Host "⚠️  gunzip não encontrado, tentando Expand-Archive..." -ForegroundColor $ColorWarning
        Expand-Archive -Path $BackupFile -DestinationPath (Split-Path $BackupFile) -Force
        $sqlFile = $tempSqlFile
    }
    
    if (Test-Path $sqlFile) {
        Write-Host "✅ Arquivo descompactado" -ForegroundColor $ColorSuccess
    } else {
        Write-Host "❌ Erro ao descompactar arquivo" -ForegroundColor $ColorError
        exit 1
    }
}

# Fazer backup de segurança antes do restore
Write-Host ""
Write-Host "💾 Criando backup de segurança antes do restore..." -ForegroundColor $ColorInfo
$safetyBackupPath = ".\backups\database\pre_restore_backup_$(Get-Date -Format 'yyyyMMdd_HHmmss').sql"
$safetyBackupDir = Split-Path $safetyBackupPath

if (-not (Test-Path $safetyBackupDir)) {
    New-Item -ItemType Directory -Path $safetyBackupDir -Force | Out-Null
}

$dumpCommand = "docker exec $ContainerName pg_dump -U $Username -d $Database --no-owner --no-acl"
Invoke-Expression "$dumpCommand > '$safetyBackupPath'" 2>&1 | Out-Null

if (Test-Path $safetyBackupPath) {
    $safetySize = [math]::Round((Get-Item $safetyBackupPath).Length / 1MB, 2)
    Write-Host "✅ Backup de segurança criado: $safetyBackupPath ($safetySize MB)" -ForegroundColor $ColorSuccess
} else {
    Write-Host "⚠️  Não foi possível criar backup de segurança" -ForegroundColor $ColorWarning
}

# Restaurar backup
Write-Host ""
Write-Host "🔄 Restaurando backup..." -ForegroundColor $ColorInfo

try {
    # 1. Dropar conexões existentes
    Write-Host "   1/4 Fechando conexões ativas..." -ForegroundColor Gray
    $killConnectionsSQL = @"
SELECT pg_terminate_backend(pg_stat_activity.pid)
FROM pg_stat_activity
WHERE pg_stat_activity.datname = '$Database'
AND pid <> pg_backend_pid();
"@
    
    docker exec $ContainerName psql -U $Username -d postgres -c $killConnectionsSQL 2>&1 | Out-Null
    
    # 2. Dropar e recriar banco
    Write-Host "   2/4 Recriando banco de dados..." -ForegroundColor Gray
    docker exec $ContainerName psql -U $Username -d postgres -c "DROP DATABASE IF EXISTS $Database;" 2>&1 | Out-Null
    docker exec $ContainerName psql -U $Username -d postgres -c "CREATE DATABASE $Database;" 2>&1 | Out-Null
    
    # 3. Copiar arquivo SQL para dentro do container
    Write-Host "   3/4 Copiando arquivo para container..." -ForegroundColor Gray
    docker cp $sqlFile "${ContainerName}:/tmp/restore.sql" 2>&1 | Out-Null
    
    if ($LASTEXITCODE -ne 0) {
        throw "Erro ao copiar arquivo para container"
    }
    
    # 4. Executar restore
    Write-Host "   4/4 Executando restore..." -ForegroundColor Gray
    $restoreCommand = "docker exec $ContainerName psql -U $Username -d $Database -f /tmp/restore.sql"
    
    if ($Verbose) {
        Write-Host "      Comando: $restoreCommand" -ForegroundColor DarkGray
    }
    
    Invoke-Expression $restoreCommand 2>&1 | Out-Null
    
    if ($LASTEXITCODE -ne 0) {
        throw "Erro ao executar restore"
    }
    
    # Limpar arquivo temporário do container
    docker exec $ContainerName rm /tmp/restore.sql 2>&1 | Out-Null
    
    Write-Host ""
    Write-Host "✅ Restore concluído com sucesso!" -ForegroundColor $ColorSuccess
    
} catch {
    Write-Host ""
    Write-Host "❌ Erro durante restore: $_" -ForegroundColor $ColorError
    Write-Host ""
    Write-Host "💡 Você pode restaurar o backup de segurança:" -ForegroundColor $ColorInfo
    Write-Host "   .\scripts\restore-database.ps1 -BackupFile '$safetyBackupPath' -Force" -ForegroundColor Gray
    exit 1
}

# Limpar arquivo temporário descompactado
if ($BackupFile -like "*.gz" -and $sqlFile -ne $BackupFile) {
    Remove-Item $sqlFile -Force -ErrorAction SilentlyContinue
}

# Verificar integridade
Write-Host ""
Write-Host "🔍 Verificando integridade do banco..." -ForegroundColor $ColorInfo

$tableCount = docker exec $ContainerName psql -U $Username -d $Database -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>&1
$tableCount = $tableCount.Trim()

Write-Host "   Tabelas encontradas: $tableCount" -ForegroundColor Gray

if ([int]$tableCount -gt 0) {
    Write-Host "✅ Banco restaurado e íntegro!" -ForegroundColor $ColorSuccess
} else {
    Write-Host "⚠️  Banco restaurado mas nenhuma tabela encontrada" -ForegroundColor $ColorWarning
}

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════════" -ForegroundColor White
Write-Host "  ✅ RESTORE CONCLUÍDO" -ForegroundColor $ColorSuccess
Write-Host "═══════════════════════════════════════════════════════════════════" -ForegroundColor White
Write-Host ""
Write-Host "💡 Próximo passo: Reinicie o backend para aplicar mudanças" -ForegroundColor $ColorInfo
Write-Host "   cd backend && npm run start:dev" -ForegroundColor Gray
Write-Host ""
