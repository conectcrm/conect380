# 💾 Backup Automático do Banco de Dados - ConectCRM
# Cria backup do PostgreSQL com rotação automática

param(
  [string]$BackupDir = ".\backups\database",
  [int]$RetentionDays = 7,          # Manter backups dos últimos 7 dias
  [switch]$Compress,                # Compactar backup com gzip
  [switch]$Verbose,                 # Modo verbose
  [string]$ContainerName = "postgres", # Nome do container Docker
  [string]$Database = "conectcrm",  # Nome do banco de dados
  [string]$Username = "postgres"    # Usuário do banco
)

# Cores
$ColorSuccess = "Green"
$ColorError = "Red"
$ColorInfo = "Cyan"
$ColorWarning = "Yellow"

# Timestamp para nome do arquivo
$timestamp = Get-Date -Format "yyyy-MM-dd_HHmmss"
$backupFileName = "conectcrm_backup_$timestamp.sql"
$backupFilePath = Join-Path $BackupDir $backupFileName

# Criar diretório de backup se não existir
if (-not (Test-Path $BackupDir)) {
  New-Item -ItemType Directory -Path $BackupDir -Force | Out-Null
  Write-Host "✅ Diretório de backup criado: $BackupDir" -ForegroundColor $ColorSuccess
}

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════════" -ForegroundColor White
Write-Host "  💾 BACKUP DO BANCO DE DADOS - ConectCRM" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════════" -ForegroundColor White
Write-Host ""

# Verificar se Docker está rodando
Write-Host "🔍 Verificando Docker..." -ForegroundColor $ColorInfo
$dockerRunning = docker ps 2>&1

if ($LASTEXITCODE -ne 0) {
  Write-Host "❌ Docker não está rodando ou não está instalado" -ForegroundColor $ColorError
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

# Criar backup
Write-Host ""
Write-Host "📦 Criando backup do banco '$Database'..." -ForegroundColor $ColorInfo

try {
  # Executar pg_dump dentro do container Docker
  $dumpCommand = "docker exec $ContainerName pg_dump -U $Username -d $Database --no-owner --no-acl"
    
  if ($Verbose) {
    Write-Host "   Comando: $dumpCommand" -ForegroundColor Gray
  }
    
  # Executar dump e salvar em arquivo
  Invoke-Expression "$dumpCommand > '$backupFilePath'" 2>&1 | Out-Null
    
  if ($LASTEXITCODE -ne 0) {
    throw "Erro ao executar pg_dump"
  }
    
  # Verificar se arquivo foi criado
  if (-not (Test-Path $backupFilePath)) {
    throw "Arquivo de backup não foi criado"
  }
    
  $fileSize = (Get-Item $backupFilePath).Length
  $fileSizeMB = [math]::Round($fileSize / 1MB, 2)
    
  Write-Host "✅ Backup criado com sucesso!" -ForegroundColor $ColorSuccess
  Write-Host "   📁 Arquivo: $backupFilePath" -ForegroundColor Gray
  Write-Host "   📊 Tamanho: $fileSizeMB MB" -ForegroundColor Gray
    
  # Compactar se solicitado
  if ($Compress) {
    Write-Host ""
    Write-Host "🗜️  Compactando backup..." -ForegroundColor $ColorInfo
        
    $gzipPath = "$backupFilePath.gz"
        
    # Usar gzip nativo do Git Bash se disponível, senão usar PowerShell
    $gitBashGzip = "C:\Program Files\Git\usr\bin\gzip.exe"
        
    if (Test-Path $gitBashGzip) {
      & $gitBashGzip -f $backupFilePath 2>&1 | Out-Null
      $compressedPath = "$backupFilePath.gz"
    }
    else {
      # Fallback: Usar Compress-Archive (menos eficiente que gzip)
      Compress-Archive -Path $backupFilePath -DestinationPath "$backupFilePath.zip" -Force
      Remove-Item $backupFilePath -Force
      $compressedPath = "$backupFilePath.zip"
    }
        
    if (Test-Path $compressedPath) {
      $compressedSize = (Get-Item $compressedPath).Length
      $compressedSizeMB = [math]::Round($compressedSize / 1MB, 2)
      $compressionRatio = [math]::Round((1 - ($compressedSize / $fileSize)) * 100, 2)
            
      Write-Host "✅ Backup compactado com sucesso!" -ForegroundColor $ColorSuccess
      Write-Host "   📁 Arquivo: $compressedPath" -ForegroundColor Gray
      Write-Host "   📊 Tamanho: $compressedSizeMB MB (redução de $compressionRatio%)" -ForegroundColor Gray
    }
    else {
      Write-Host "⚠️  Não foi possível compactar o backup" -ForegroundColor $ColorWarning
    }
  }
    
}
catch {
  Write-Host "❌ Erro ao criar backup: $_" -ForegroundColor $ColorError
  exit 1
}

# Rotação de backups antigos
Write-Host ""
Write-Host "🔄 Verificando backups antigos..." -ForegroundColor $ColorInfo

$cutoffDate = (Get-Date).AddDays(-$RetentionDays)
$oldBackups = Get-ChildItem -Path $BackupDir -Filter "conectcrm_backup_*.sql*" | 
Where-Object { $_.LastWriteTime -lt $cutoffDate }

if ($oldBackups) {
  Write-Host "🗑️  Removendo backups com mais de $RetentionDays dias:" -ForegroundColor $ColorWarning
    
  foreach ($oldBackup in $oldBackups) {
    $age = ((Get-Date) - $oldBackup.LastWriteTime).Days
    Write-Host "   ❌ $($oldBackup.Name) ($age dias)" -ForegroundColor Gray
    Remove-Item $oldBackup.FullName -Force
  }
    
  Write-Host "✅ $($oldBackups.Count) backup(s) antigo(s) removido(s)" -ForegroundColor $ColorSuccess
}
else {
  Write-Host "✅ Nenhum backup antigo para remover" -ForegroundColor $ColorSuccess
}

# Estatísticas finais
Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════════" -ForegroundColor White

$allBackups = Get-ChildItem -Path $BackupDir -Filter "conectcrm_backup_*.sql*"
$totalBackups = $allBackups.Count
$totalSize = ($allBackups | Measure-Object -Property Length -Sum).Sum
$totalSizeMB = [math]::Round($totalSize / 1MB, 2)

Write-Host "  📊 ESTATÍSTICAS DE BACKUP" -ForegroundColor Cyan
Write-Host "     Total de backups: $totalBackups" -ForegroundColor White
Write-Host "     Espaço total: $totalSizeMB MB" -ForegroundColor White
Write-Host "     Retenção: $RetentionDays dias" -ForegroundColor White
Write-Host "     Diretório: $BackupDir" -ForegroundColor Gray

Write-Host "═══════════════════════════════════════════════════════════════════" -ForegroundColor White
Write-Host ""
Write-Host "✅ Backup concluído com sucesso!" -ForegroundColor $ColorSuccess
Write-Host ""

# Retornar caminho do backup criado (útil para scripts)
return $backupFilePath
