# 🗑️ Script de Limpeza Completa do Sistema
# Remove páginas demo, código duplicado e arquivos legados
# Data: Dezembro 2025

param(
  [switch]$DryRun,      # Simula sem deletar
  [switch]$Verbose,     # Mostra mais detalhes
  [switch]$Backup       # Cria backup antes de deletar
)

$ErrorActionPreference = "Stop"
$workspaceRoot = Split-Path -Parent $PSScriptRoot

Write-Host "`n╔══════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  🧹 LIMPEZA COMPLETA DO SISTEMA OMNICHANNEL             ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════════════════╝" -ForegroundColor Cyan

if ($DryRun) {
  Write-Host "⚠️  MODO SIMULAÇÃO (nada será deletado)" -ForegroundColor Yellow
}

# ========================================
# FASE 1: ANÁLISE
# ========================================
Write-Host "`n📊 FASE 1: Analisando arquivos para remoção..." -ForegroundColor Yellow

$filesToRemove = @(
  # Páginas Demo/Debug
  @{
    Path     = "frontend-web\src\pages\UploadDemoPage.tsx"
    Reason   = "Página demo de upload - não deve estar em produção"
    Category = "Demo/Debug"
    Severity = "CRÍTICO"
  },
  @{
    Path     = "frontend-web\src\pages\TestePortalPage.tsx"
    Reason   = "Página de teste do portal - não deve estar em produção"
    Category = "Demo/Debug"
    Severity = "CRÍTICO"
  },
  @{
    Path     = "frontend-web\src\pages\GoogleEventDemo.tsx"
    Reason   = "Demo de eventos Google - não deve estar em produção"
    Category = "Demo/Debug"
    Severity = "CRÍTICO"
  },
  @{
    Path     = "frontend-web\src\components\DebugContratos.tsx"
    Reason   = "Componente de debug - não deve estar em produção"
    Category = "Demo/Debug"
    Severity = "CRÍTICO"
  },
  @{
    Path     = "frontend-web\src\components\LoginDebug.tsx"
    Reason   = "Debug de login - RISCO DE SEGURANÇA"
    Category = "Demo/Debug"
    Severity = "CRÍTICO"
  },
    
  # Código Duplicado
  @{
    Path     = "frontend-web\src\features\atendimento\omnichannel\contexts\SocketContext.tsx"
    Reason   = "Duplicado - já existe useWebSocket hook"
    Category = "Duplicação"
    Severity = "ALTO"
  },
  @{
    Path     = "frontend-web\src\features\atendimento\omnichannel\contexts\ToastContext.tsx"
    Reason   = "Duplicado - já existe toast global (react-hot-toast)"
    Category = "Duplicação"
    Severity = "ALTO"
  },
  @{
    Path     = "frontend-web\src\features\atendimento\omnichannel\mockData.ts"
    Reason   = "DADOS FAKE - risco de misturar com dados reais em produção"
    Category = "Duplicação"
    Severity = "CRÍTICO"
  },
    
  # Páginas Legadas
  @{
    Path     = "frontend-web\src\pages\FunilVendas.jsx"
    Reason   = "Versão antiga JSX - substituída por PipelinePage.tsx"
    Category = "Legado"
    Severity = "MÉDIO"
  },
  @{
    Path     = "frontend-web\src\pages\FunilVendasAPI.jsx"
    Reason   = "Versão com API antiga - substituída por PipelinePage.tsx"
    Category = "Legado"
    Severity = "MÉDIO"
  },
  @{
    Path     = "frontend-web\src\pages\CentralOperacoesPage.tsx"
    Reason   = "Nome genérico - renomear para AtendimentoDashboard ou remover"
    Category = "Legado"
    Severity = "BAIXO"
  }
)

# Contadores
$totalFiles = $filesToRemove.Count
$existingFiles = 0
$totalLines = 0
$criticalFiles = ($filesToRemove | Where-Object { $_.Severity -eq "CRÍTICO" }).Count

Write-Host "`n📋 Arquivos identificados para remoção: $totalFiles" -ForegroundColor Cyan
Write-Host "   🔴 Críticos: $criticalFiles" -ForegroundColor Red

# Tabela de arquivos
Write-Host "`n┌────────────────────────────────────────────────────────────────────────────┐" -ForegroundColor Gray
Write-Host "│ SEVERIDADE │ CATEGORIA      │ ARQUIVO                                       │" -ForegroundColor Gray
Write-Host "├────────────────────────────────────────────────────────────────────────────┤" -ForegroundColor Gray

foreach ($file in $filesToRemove) {
  $fullPath = Join-Path $workspaceRoot $file.Path
  $exists = Test-Path $fullPath
    
  if ($exists) {
    $existingFiles++
    $lines = (Get-Content $fullPath | Measure-Object -Line).Lines
    $totalLines += $lines
        
    $severityColor = switch ($file.Severity) {
      "CRÍTICO" { "Red" }
      "ALTO" { "Yellow" }
      "MÉDIO" { "Cyan" }
      "BAIXO" { "Gray" }
    }
        
    $fileName = Split-Path $file.Path -Leaf
    $paddedSeverity = $file.Severity.PadRight(10)
    $paddedCategory = $file.Category.PadRight(14)
    $paddedFile = $fileName.PadRight(45)
        
    Write-Host "│ " -NoNewline -ForegroundColor Gray
    Write-Host "$paddedSeverity" -NoNewline -ForegroundColor $severityColor
    Write-Host " │ " -NoNewline -ForegroundColor Gray
    Write-Host "$paddedCategory" -NoNewline -ForegroundColor Cyan
    Write-Host " │ " -NoNewline -ForegroundColor Gray
    Write-Host "$paddedFile" -NoNewline -ForegroundColor White
    Write-Host " │" -ForegroundColor Gray
        
    if ($Verbose) {
      Write-Host "   └─ $($file.Reason)" -ForegroundColor DarkGray
      Write-Host "   └─ Linhas: $lines" -ForegroundColor DarkGray
    }
  }
  else {
    if ($Verbose) {
      Write-Host "   ⚠️  Arquivo não encontrado: $($file.Path)" -ForegroundColor DarkYellow
    }
  }
}

Write-Host "└────────────────────────────────────────────────────────────────────────────┘" -ForegroundColor Gray

Write-Host "`n📊 Estatísticas:" -ForegroundColor Cyan
Write-Host "   • Arquivos existentes: $existingFiles de $totalFiles" -ForegroundColor White
Write-Host "   • Total de linhas a remover: ~$totalLines" -ForegroundColor White

# ========================================
# FASE 2: BUSCAR DEPENDÊNCIAS
# ========================================
Write-Host "`n🔍 FASE 2: Buscando dependências (imports)..." -ForegroundColor Yellow

$dependencies = @()

foreach ($file in $filesToRemove) {
  $fileName = Split-Path $file.Path -Leaf
  $fileNameNoExt = [System.IO.Path]::GetFileNameWithoutExtension($fileName)
    
  # Buscar imports deste arquivo
  $searchPattern = "import.*$fileNameNoExt"
  $foundImports = Get-ChildItem -Path "$workspaceRoot\frontend-web\src" -Recurse -Include *.tsx, *.ts, *.jsx, *.js -ErrorAction SilentlyContinue |
  Select-String -Pattern $searchPattern -ErrorAction SilentlyContinue
    
  if ($foundImports) {
    $dependencies += @{
      File    = $fileName
      Imports = $foundImports
    }
  }
}

if ($dependencies.Count -gt 0) {
  Write-Host "`n⚠️  ATENÇÃO: Encontradas $($dependencies.Count) dependências!" -ForegroundColor Red
    
  foreach ($dep in $dependencies) {
    Write-Host "`n   📄 $($dep.File):" -ForegroundColor Yellow
    foreach ($import in $dep.Imports) {
      Write-Host "      • $($import.Path):$($import.LineNumber)" -ForegroundColor DarkYellow
      Write-Host "        $($import.Line.Trim())" -ForegroundColor DarkGray
    }
  }
    
  Write-Host "`n⚠️  Você precisará atualizar estes imports manualmente!" -ForegroundColor Yellow
}
else {
  Write-Host "   ✅ Nenhuma dependência encontrada!" -ForegroundColor Green
}

# ========================================
# FASE 3: CONFIRMAÇÃO
# ========================================
if (-not $DryRun) {
  Write-Host "`n⚠️  CONFIRMAÇÃO NECESSÁRIA" -ForegroundColor Red
  Write-Host "   Você está prestes a DELETAR $existingFiles arquivos (~$totalLines linhas)." -ForegroundColor Yellow
    
  if ($dependencies.Count -gt 0) {
    Write-Host "   ⚠️  ATENÇÃO: Há $($dependencies.Count) arquivos com imports que precisarão ser corrigidos!" -ForegroundColor Red
  }
    
  Write-Host "`n   Digite 'DELETAR' para confirmar: " -NoNewline -ForegroundColor Yellow
  $confirmation = Read-Host
    
  if ($confirmation -ne "DELETAR") {
    Write-Host "`n❌ Operação cancelada pelo usuário." -ForegroundColor Red
    exit 0
  }
}

# ========================================
# FASE 4: BACKUP (OPCIONAL)
# ========================================
if ($Backup -and -not $DryRun) {
  Write-Host "`n💾 FASE 4: Criando backup..." -ForegroundColor Yellow
    
  $timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
  $backupDir = Join-Path $workspaceRoot "backup_cleanup_$timestamp"
  New-Item -ItemType Directory -Path $backupDir -Force | Out-Null
    
  foreach ($file in $filesToRemove) {
    $fullPath = Join-Path $workspaceRoot $file.Path
        
    if (Test-Path $fullPath) {
      $relativePath = $file.Path
      $backupFilePath = Join-Path $backupDir $relativePath
      $backupFileDir = Split-Path $backupFilePath -Parent
            
      New-Item -ItemType Directory -Path $backupFileDir -Force -ErrorAction SilentlyContinue | Out-Null
      Copy-Item $fullPath $backupFilePath -Force
            
      Write-Host "   ✅ Backup: $relativePath" -ForegroundColor Green
    }
  }
    
  Write-Host "`n💾 Backup criado em: $backupDir" -ForegroundColor Cyan
}

# ========================================
# FASE 5: REMOÇÃO
# ========================================
Write-Host "`n🗑️  FASE 5: Removendo arquivos..." -ForegroundColor Yellow

$removedCount = 0
$failedCount = 0

foreach ($file in $filesToRemove) {
  $fullPath = Join-Path $workspaceRoot $file.Path
    
  if (Test-Path $fullPath) {
    if ($DryRun) {
      Write-Host "   [SIMULAÇÃO] Removeria: $($file.Path)" -ForegroundColor Cyan
      $removedCount++
    }
    else {
      try {
        Remove-Item $fullPath -Force -ErrorAction Stop
        Write-Host "   ✅ Removido: $($file.Path)" -ForegroundColor Green
        $removedCount++
      }
      catch {
        Write-Host "   ❌ ERRO ao remover: $($file.Path)" -ForegroundColor Red
        Write-Host "      $($_.Exception.Message)" -ForegroundColor DarkRed
        $failedCount++
      }
    }
  }
}

# ========================================
# FASE 6: RELATÓRIO FINAL
# ========================================
Write-Host "`n╔══════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  📊 RELATÓRIO FINAL                                      ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════════════════╝" -ForegroundColor Cyan

if ($DryRun) {
  Write-Host "`n✅ SIMULAÇÃO CONCLUÍDA!" -ForegroundColor Green
  Write-Host "   • Arquivos que seriam removidos: $removedCount" -ForegroundColor White
  Write-Host "   • Total de linhas: ~$totalLines" -ForegroundColor White
  Write-Host "`n   Execute sem -DryRun para realizar a limpeza real." -ForegroundColor Cyan
}
else {
  Write-Host "`n✅ LIMPEZA CONCLUÍDA!" -ForegroundColor Green
  Write-Host "   • Arquivos removidos: $removedCount" -ForegroundColor Green
  Write-Host "   • Falhas: $failedCount" -ForegroundColor $(if ($failedCount -gt 0) { "Red" } else { "Green" })
  Write-Host "   • Linhas de código removidas: ~$totalLines" -ForegroundColor White
    
  if ($Backup) {
    Write-Host "`n💾 Backup disponível em: $backupDir" -ForegroundColor Cyan
  }
}

# ========================================
# PRÓXIMOS PASSOS
# ========================================
Write-Host "`n📋 PRÓXIMOS PASSOS:" -ForegroundColor Yellow

if ($dependencies.Count -gt 0) {
  Write-Host "`n   1️⃣  Corrigir imports ($($dependencies.Count) arquivos afetados)" -ForegroundColor Yellow
  Write-Host "      Ver lista de dependências acima" -ForegroundColor DarkGray
}

Write-Host "`n   2️⃣  Atualizar App.tsx - Remover rotas:" -ForegroundColor Yellow
Write-Host "      • /upload-demo" -ForegroundColor DarkGray
Write-Host "      • /teste-portal" -ForegroundColor DarkGray
Write-Host "      • /debug-contratos" -ForegroundColor DarkGray
Write-Host "      • /debug-login" -ForegroundColor DarkGray
Write-Host "      • /funil-vendas (redirect)" -ForegroundColor DarkGray
Write-Host "      • /oportunidades (redirect)" -ForegroundColor DarkGray

Write-Host "`n   3️⃣  Migrar imports de código duplicado:" -ForegroundColor Yellow
Write-Host "      • SocketContext → useWebSocket hook" -ForegroundColor DarkGray
Write-Host "      • ToastContext (local) → react-hot-toast (global)" -ForegroundColor DarkGray
Write-Host "      • mockData → dados reais do backend" -ForegroundColor DarkGray

Write-Host "`n   4️⃣  Testar aplicação:" -ForegroundColor Yellow
Write-Host "      npm run build && npm test" -ForegroundColor DarkGray

Write-Host "`n   5️⃣  Reorganizar menu (menuConfig.ts):" -ForegroundColor Yellow
Write-Host "      Ver OMNICHANNEL_O_QUE_REMOVER.md (estrutura ideal)" -ForegroundColor DarkGray

Write-Host "`n   6️⃣  Commit das mudanças:" -ForegroundColor Yellow
Write-Host "      git add ." -ForegroundColor DarkGray
Write-Host "      git commit -m 'chore: limpeza completa - remover demo/debug/duplicados'" -ForegroundColor DarkGray

Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "✅ Script finalizado!" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor Cyan

# Retornar código de saída
if ($failedCount -gt 0) {
  exit 1
}
else {
  exit 0
}
