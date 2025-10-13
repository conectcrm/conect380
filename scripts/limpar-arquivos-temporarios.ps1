# Script de Limpeza de Arquivos Temporários - ConectCRM
# Autor: Sistema de Consolidação
# Data: Janeiro 2025
# Versão: 1.0

param(
  [switch]$DryRun = $false,  # Simular sem deletar
  [switch]$Force = $false,    # Forçar sem confirmação
  [switch]$Verbose = $false   # Modo verboso
)

# Configurações
$RootPath = $PSScriptRoot | Split-Path -Parent
$LogFile = Join-Path $RootPath "limpeza-temporarios.log"

# Padrões de arquivos temporários a remover
$PatternsToRemove = @(
  "*_backup.*",
  "*_temp.*",
  "*_BACKUP.*",
  "*_TEMP.*",
  "*OLD.*",
  "*old.*",
  "*IMPLEMENTADO_SUCESSO.md",
  "*_IMPLEMENTADO.md",
  "*_CONCLUIDA.md",
  "*_FINALIZADO.md",
  "test-*.html",
  "teste-*.html",
  "debug-*.html",
  "*_old_*",
  "*_backup_*",
  "*.backup",
  "*.temp"
)

# Diretórios a ignorar
$IgnoreDirs = @(
  "node_modules",
  ".git",
  ".vs",
  "dist",
  "build",
  "coverage",
  "archived"  # Não mexer em arquivos já arquivados
)

# Função para log
function Write-Log {
  param([string]$Message, [string]$Level = "INFO")
    
  $Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
  $LogMessage = "[$Timestamp] [$Level] $Message"
    
  # Console com cores
  switch ($Level) {
    "ERROR" { Write-Host $LogMessage -ForegroundColor Red }
    "WARNING" { Write-Host $LogMessage -ForegroundColor Yellow }
    "SUCCESS" { Write-Host $LogMessage -ForegroundColor Green }
    default { Write-Host $LogMessage -ForegroundColor White }
  }
    
  # Arquivo de log
  Add-Content -Path $LogFile -Value $LogMessage
}

# Função para verificar se caminho deve ser ignorado
function Should-IgnorePath {
  param([string]$Path)
    
  foreach ($IgnoreDir in $IgnoreDirs) {
    if ($Path -like "*\$IgnoreDir\*") {
      return $true
    }
  }
  return $false
}

# Banner inicial
Write-Host "`n╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  🧹 LIMPEZA DE ARQUIVOS TEMPORÁRIOS - CONECTCRM              ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

if ($DryRun) {
  Write-Log "🔍 MODO SIMULAÇÃO - Nenhum arquivo será deletado" "WARNING"
}

Write-Log "📂 Diretório raiz: $RootPath" "INFO"
Write-Log "📄 Log será salvo em: $LogFile" "INFO"

# Inicializar contadores
$TotalFound = 0
$TotalDeleted = 0
$TotalErrors = 0
$FilesToDelete = @()

# Buscar arquivos temporários
Write-Host "`n🔍 Buscando arquivos temporários...`n" -ForegroundColor Yellow

foreach ($Pattern in $PatternsToRemove) {
  Write-Log "Buscando padrão: $Pattern" "INFO"
    
  try {
    $Files = Get-ChildItem -Path $RootPath -Recurse -File -Filter $Pattern -ErrorAction SilentlyContinue | 
    Where-Object { -not (Should-IgnorePath $_.FullName) }
        
    foreach ($File in $Files) {
      $TotalFound++
      $RelativePath = $File.FullName.Replace($RootPath, ".")
            
      if ($Verbose) {
        Write-Log "  Encontrado: $RelativePath" "INFO"
      }
            
      $FilesToDelete += @{
        Path         = $File.FullName
        RelativePath = $RelativePath
        Size         = $File.Length
        Pattern      = $Pattern
      }
    }
  }
  catch {
    Write-Log "Erro ao buscar padrão $Pattern : $_" "ERROR"
    $TotalErrors++
  }
}

# Exibir resumo dos arquivos encontrados
Write-Host "`n📊 RESUMO DOS ARQUIVOS ENCONTRADOS`n" -ForegroundColor Cyan

if ($TotalFound -eq 0) {
  Write-Log "✅ Nenhum arquivo temporário encontrado! Projeto está limpo." "SUCCESS"
  exit 0
}

Write-Log "Total de arquivos temporários encontrados: $TotalFound" "WARNING"

# Agrupar por padrão
$GroupedFiles = $FilesToDelete | Group-Object -Property Pattern | Sort-Object Count -Descending

Write-Host "`nArquivos por padrão:" -ForegroundColor Yellow
foreach ($Group in $GroupedFiles) {
  Write-Host "  • $($Group.Name): $($Group.Count) arquivo(s)" -ForegroundColor White
}

# Calcular tamanho total
$TotalSize = ($FilesToDelete | Measure-Object -Property Size -Sum).Sum
$TotalSizeMB = [math]::Round($TotalSize / 1MB, 2)

Write-Host "`n💾 Espaço total a liberar: $TotalSizeMB MB`n" -ForegroundColor Cyan

# Listar arquivos (primeiros 20)
Write-Host "📋 Arquivos a remover (mostrando até 20):`n" -ForegroundColor Yellow
$FilesToDelete | Select-Object -First 20 | ForEach-Object {
  $SizeKB = [math]::Round($_.Size / 1KB, 2)
  Write-Host "  📄 $($_.RelativePath) ($SizeKB KB)" -ForegroundColor Gray
}

if ($TotalFound -gt 20) {
  Write-Host "  ... e mais $($TotalFound - 20) arquivo(s)" -ForegroundColor Gray
}

# Modo dry-run
if ($DryRun) {
  Write-Host "`n✅ SIMULAÇÃO CONCLUÍDA - Nenhum arquivo foi deletado" -ForegroundColor Green
  Write-Log "Simulação concluída. Use sem -DryRun para executar a limpeza." "SUCCESS"
  exit 0
}

# Confirmação do usuário
if (-not $Force) {
  Write-Host "`n⚠️  ATENÇÃO: Esta operação não pode ser desfeita!`n" -ForegroundColor Red
  $Confirmation = Read-Host "Deseja continuar com a remoção? (S/N)"
    
  if ($Confirmation -ne "S" -and $Confirmation -ne "s") {
    Write-Log "Operação cancelada pelo usuário." "WARNING"
    exit 0
  }
}

# Executar remoção
Write-Host "`n🗑️  Removendo arquivos...`n" -ForegroundColor Yellow

foreach ($FileInfo in $FilesToDelete) {
  try {
    Remove-Item -Path $FileInfo.Path -Force -ErrorAction Stop
    $TotalDeleted++
        
    if ($Verbose) {
      Write-Log "  ✓ Removido: $($FileInfo.RelativePath)" "SUCCESS"
    }
  }
  catch {
    Write-Log "  ✗ Erro ao remover $($FileInfo.RelativePath): $_" "ERROR"
    $TotalErrors++
  }
}

# Relatório final
Write-Host "`n╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  📊 RELATÓRIO FINAL                                           ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

Write-Log "Arquivos encontrados: $TotalFound" "INFO"
Write-Log "Arquivos removidos: $TotalDeleted" "SUCCESS"
Write-Log "Erros: $TotalErrors" $(if ($TotalErrors -gt 0) { "ERROR" } else { "INFO" })
Write-Log "Espaço liberado: $TotalSizeMB MB" "SUCCESS"

if ($TotalDeleted -eq $TotalFound -and $TotalErrors -eq 0) {
  Write-Host "`n✅ LIMPEZA CONCLUÍDA COM SUCESSO!`n" -ForegroundColor Green
  Write-Log "Limpeza concluída com 100% de sucesso." "SUCCESS"
  exit 0
}
elseif ($TotalErrors -gt 0) {
  Write-Host "`n⚠️  LIMPEZA CONCLUÍDA COM ERROS`n" -ForegroundColor Yellow
  Write-Log "Limpeza concluída, mas com $TotalErrors erro(s). Verifique o log." "WARNING"
  exit 1
}
else {
  Write-Host "`n✅ LIMPEZA CONCLUÍDA`n" -ForegroundColor Green
  Write-Log "Limpeza concluída." "SUCCESS"
  exit 0
}
