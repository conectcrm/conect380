# Script de Auto-Limpeza Inteligente - ConectCRM
# Remove automaticamente arquivos criados pelo Copilot que não são mais utilizados
# Baseado no registro .copilot-registry.md e análise de uso

param(
  [switch]$DryRun = $false,  # Apenas simular sem remover
  [switch]$Interactive = $false,  # Modo interativo para confirmação
  [int]$DaysOld = 7  # Arquivos temporários mais antigos que X dias
)

Write-Host "🤖 AUTO-LIMPEZA INTELIGENTE - CONECTCRM" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan

$basePath = "C:\Projetos\conectcrm"
$registryFile = "$basePath\.copilot-registry.md"
$removedCount = 0
$currentDate = Get-Date

# Verificar se estamos no diretório correto
if (-not (Test-Path "$basePath\package.json")) {
  Write-Host "❌ ERRO: Projeto ConectCRM não encontrado em $basePath" -ForegroundColor Red
  exit 1
}

# Verificar se existe o arquivo de registro
if (-not (Test-Path $registryFile)) {
  Write-Host "⚠️ AVISO: Arquivo de registro .copilot-registry.md não encontrado" -ForegroundColor Yellow
  Write-Host "Executando limpeza baseada em padrões..." -ForegroundColor Yellow
    
  # Fallback para limpeza baseada em padrões
  & "$basePath\limpeza-massa.ps1"
  exit 0
}

Write-Host "`n📋 Analisando registro de arquivos do Copilot..." -ForegroundColor Yellow

# Função para verificar se arquivo está sendo usado
function Test-FileInUse {
  param([string]$FilePath)
    
  if (-not (Test-Path $FilePath)) {
    return $false
  }
    
  $fileName = Split-Path $FilePath -Leaf
  $fileNameWithoutExt = [System.IO.Path]::GetFileNameWithoutExtension($fileName)
    
  # Buscar referências no código
  $references = Get-ChildItem -Path $basePath -Recurse -File -Include "*.js", "*.ts", "*.tsx", "*.jsx", "*.json", "*.md" | 
  Where-Object { $_.FullName -notmatch "node_modules|\.git" -and $_.FullName -ne $FilePath } |
  Select-String -Pattern $fileName, $fileNameWithoutExt -SimpleMatch -ErrorAction SilentlyContinue
    
  return ($references.Count -gt 0)
}

# Função para verificar idade do arquivo
function Get-FileAge {
  param([string]$FilePath)
    
  if (-not (Test-Path $FilePath)) {
    return 999  # Arquivo não existe
  }
    
  try {
    $fileItem = Get-Item $FilePath -Force
    $fileDate = $fileItem.CreationTime
    $ageInDays = [math]::Floor(($currentDate - $fileDate).TotalDays)
    return $ageInDays
  }
  catch {
    return 999
  }
}

# Analisar registro e identificar arquivos para remoção
$registryContent = Get-Content $registryFile
$filesToRemove = @()

foreach ($line in $registryContent) {
  # Processar linhas do registro (formato: DATA TIPO ARQUIVO STATUS DESCRIÇÃO)
  if ($line -match '^\d{4}-\d{2}-\d{2}\s+(\w+)\s+([^\s]+)\s+(\w+)\s+"([^"]+)"') {
    $fileType = $Matches[1]
    $fileName = $Matches[2]
    $status = $Matches[3]
    $description = $Matches[4]
        
    $fullPath = "$basePath\$fileName"
        
    # Critérios para remoção
    $shouldRemove = $false
    $reason = ""
        
    # 1. Arquivos marcados como OBSOLETO
    if ($status -eq "OBSOLETO") {
      $shouldRemove = $true
      $reason = "Marcado como OBSOLETO no registro"
    }
        
    # 2. Arquivos TEMP mais antigos que X dias
    elseif ($fileType -eq "TEMP" -and (Get-FileAge $fullPath) -gt $DaysOld) {
      $shouldRemove = $true
      $reason = "Arquivo temporário com mais de $DaysOld dias"
    }
        
    # 3. Arquivos TEST não referenciados
    elseif ($fileType -eq "TEST" -and -not (Test-FileInUse $fullPath)) {
      $shouldRemove = $true
      $reason = "Arquivo de teste sem referências no código"
    }
        
    # 4. Arquivos DEBUG sem uso
    elseif ($fileType -eq "DEBUG" -and -not (Test-FileInUse $fullPath)) {
      $shouldRemove = $true
      $reason = "Arquivo de debug sem uso aparente"
    }
        
    # 5. Arquivos EXAMPLE não utilizados
    elseif ($fileType -eq "EXAMPLE" -and -not (Test-FileInUse $fullPath)) {
      $shouldRemove = $true
      $reason = "Arquivo de exemplo não utilizado"
    }
        
    if ($shouldRemove -and (Test-Path $fullPath)) {
      $filesToRemove += @{
        Path        = $fullPath
        Name        = $fileName
        Type        = $fileType
        Reason      = $reason
        Description = $description
      }
    }
  }
}

# Buscar arquivos órfãos (criados pelo Copilot mas não no registro)
Write-Host "`n🔍 Buscando arquivos órfãos..." -ForegroundColor Yellow

$orphanPatterns = @(
  "temp-*.js", "test-*.js", "debug-*.js", "exemplo-*.js",
  "script-*.js", "assistente-*.js", "correcao-*.js",
  "TEMP_*.md", "DEBUG_*.md", "EXEMPLO_*.md"
)

foreach ($pattern in $orphanPatterns) {
  $orphanFiles = Get-ChildItem -Path $basePath -Filter $pattern -ErrorAction SilentlyContinue
  foreach ($file in $orphanFiles) {
    # Verificar se não está no registro
    $inRegistry = $registryContent | Where-Object { $_ -match [regex]::Escape($file.Name) }
        
    if (-not $inRegistry -and -not (Test-FileInUse $file.FullName)) {
      $filesToRemove += @{
        Path        = $file.FullName
        Name        = $file.Name
        Type        = "ORPHAN"
        Reason      = "Arquivo órfão sem registro e sem uso"
        Description = "Arquivo temporário não registrado"
      }
    }
  }
}

# Mostrar arquivos que serão removidos
if ($filesToRemove.Count -eq 0) {
  Write-Host "`n✅ Nenhum arquivo para remoção encontrado!" -ForegroundColor Green
  Write-Host "Projeto já está limpo. 🎉" -ForegroundColor Green
  exit 0
}

Write-Host "`n📋 ARQUIVOS IDENTIFICADOS PARA REMOÇÃO:" -ForegroundColor Yellow
Write-Host "=======================================" -ForegroundColor Yellow

foreach ($file in $filesToRemove) {
  Write-Host "`n📄 $($file.Name)" -ForegroundColor White
  Write-Host "   📁 Caminho: $($file.Path)" -ForegroundColor Gray
  Write-Host "   🏷️ Tipo: $($file.Type)" -ForegroundColor Cyan
  Write-Host "   💭 Motivo: $($file.Reason)" -ForegroundColor Yellow
  Write-Host "   📝 Descrição: $($file.Description)" -ForegroundColor Gray
}

Write-Host "`n📊 Total: $($filesToRemove.Count) arquivo(s)" -ForegroundColor Cyan

# Confirmação ou execução
if ($DryRun) {
  Write-Host "`n🔍 MODO DRY-RUN: Nenhum arquivo foi removido." -ForegroundColor Blue
  Write-Host "Execute sem -DryRun para remover os arquivos." -ForegroundColor Blue
  exit 0
}

if ($Interactive) {
  $response = Read-Host "`n❓ Deseja remover estes arquivos? (s/N)"
  if ($response -ne "s" -and $response -ne "S" -and $response -ne "sim") {
    Write-Host "❌ Operação cancelada pelo usuário." -ForegroundColor Yellow
    exit 0
  }
}

# Remover arquivos
Write-Host "`n🗑️ Removendo arquivos..." -ForegroundColor Red

foreach ($file in $filesToRemove) {
  try {
    Remove-Item $file.Path -Force
    Write-Host "  ✅ Removido: $($file.Name)" -ForegroundColor Green
    $removedCount++
        
    # Atualizar registro
    $registryContent = $registryContent -replace "$($file.Name)\s+ATIVO", "$($file.Name) REMOVIDO"
    $registryContent = $registryContent -replace "$($file.Name)\s+OBSOLETO", "$($file.Name) REMOVIDO"
  }
  catch {
    Write-Host "  ❌ Erro ao remover: $($file.Name) - $($_.Exception.Message)" -ForegroundColor Red
  }
}

# Atualizar arquivo de registro
Set-Content -Path $registryFile -Value $registryContent

Write-Host "`n✅ AUTO-LIMPEZA CONCLUÍDA!" -ForegroundColor Green
Write-Host "📊 $removedCount arquivo(s) removido(s)" -ForegroundColor Cyan
Write-Host "📝 Registro atualizado em .copilot-registry.md" -ForegroundColor Blue
Write-Host "`n🚀 Projeto otimizado automaticamente!" -ForegroundColor Green
