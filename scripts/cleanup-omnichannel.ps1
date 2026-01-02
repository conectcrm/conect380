# 🧹 Script de Limpeza do Omnichannel
# Remove arquivos duplicados e código legado
# Data: 2025-12-09

Write-Host "`n🧹 LIMPEZA DO SISTEMA OMNICHANNEL" -ForegroundColor Cyan
Write-Host "=" * 60 -ForegroundColor Cyan

$baseDir = "c:\Projetos\conectcrm\frontend-web\src\features\atendimento\omnichannel"

# ========================================
# FASE 1: ANÁLISE (não deleta nada)
# ========================================

Write-Host "`n📊 FASE 1: ANALISANDO ARQUIVOS..." -ForegroundColor Yellow

$arquivosParaDeletar = @(
  @{
    Path       = "$baseDir\mockData.ts"
    Motivo     = "Dados fake - RISCO em produção"
    Prioridade = "CRÍTICA"
  },
  @{
    Path       = "$baseDir\contexts\SocketContext.tsx"
    Motivo     = "Duplicado - useWebSocket.ts já existe"
    Prioridade = "ALTA"
  },
  @{
    Path       = "$baseDir\contexts\ToastContext.tsx"
    Motivo     = "Duplicado - usar ToastContext global"
    Prioridade = "ALTA"
  }
)

Write-Host "`n📋 Arquivos identificados para remoção:`n" -ForegroundColor White

foreach ($arquivo in $arquivosParaDeletar) {
  $existe = Test-Path $arquivo.Path
  $status = if ($existe) { "✅ EXISTE" } else { "❌ NÃO ENCONTRADO" }
  $cor = if ($existe) { "Yellow" } else { "Gray" }
    
  Write-Host "  $status - " -ForegroundColor $cor -NoNewline
  Write-Host "$($arquivo.Path)" -ForegroundColor White
  Write-Host "    └─ Motivo: $($arquivo.Motivo)" -ForegroundColor DarkGray
  Write-Host "    └─ Prioridade: $($arquivo.Prioridade)" -ForegroundColor DarkGray
    
  if ($existe) {
    $linhas = (Get-Content $arquivo.Path | Measure-Object -Line).Lines
    Write-Host "    └─ Tamanho: $linhas linhas" -ForegroundColor DarkGray
  }
  Write-Host ""
}

# ========================================
# FASE 2: BUSCAR DEPENDÊNCIAS
# ========================================

Write-Host "`n🔍 FASE 2: BUSCANDO DEPENDÊNCIAS...`n" -ForegroundColor Yellow

function Find-Dependencies {
  param($filePath, $searchPattern)
    
  $fileName = Split-Path $filePath -Leaf
  $imports = @()
    
  Get-ChildItem -Path "$baseDir" -Recurse -Filter "*.tsx", "*.ts" | ForEach-Object {
    $content = Get-Content $_.FullName -Raw
    if ($content -match $searchPattern) {
      $imports += $_.FullName
    }
  }
    
  return $imports
}

$todasDependencias = @{}

foreach ($arquivo in $arquivosParaDeletar) {
  if (Test-Path $arquivo.Path) {
    $fileName = Split-Path $arquivo.Path -Leaf -Replace '\.\w+$', ''
    $pattern = "from ['\`"].*$fileName"
        
    $deps = Find-Dependencies -filePath $arquivo.Path -searchPattern $pattern
        
    if ($deps.Count -gt 0) {
      Write-Host "  ⚠️  $fileName tem $($deps.Count) dependência(s):" -ForegroundColor Red
      $todasDependencias[$arquivo.Path] = $deps
      foreach ($dep in $deps) {
        Write-Host "    └─ $dep" -ForegroundColor DarkGray
      }
    }
    else {
      Write-Host "  ✅ $fileName não tem dependências" -ForegroundColor Green
    }
    Write-Host ""
  }
}

# ========================================
# FASE 3: CONFIRMAR AÇÃO
# ========================================

Write-Host "`n⚠️  FASE 3: CONFIRMAÇÃO" -ForegroundColor Yellow
Write-Host "=" * 60 -ForegroundColor Yellow

$arquivosExistentes = $arquivosParaDeletar | Where-Object { Test-Path $_.Path }

if ($arquivosExistentes.Count -eq 0) {
  Write-Host "`n✅ Nenhum arquivo para deletar!" -ForegroundColor Green
  exit 0
}

Write-Host "`n📝 Resumo:" -ForegroundColor White
Write-Host "  • Total de arquivos: $($arquivosExistentes.Count)" -ForegroundColor White
Write-Host "  • Total de dependências: $($todasDependencias.Count)" -ForegroundColor White

if ($todasDependencias.Count -gt 0) {
  Write-Host "`n⚠️  ATENÇÃO: Há dependências!" -ForegroundColor Red
  Write-Host "  Você precisará atualizar os imports primeiro." -ForegroundColor Red
  Write-Host "`n  Sugestão:" -ForegroundColor Yellow
  Write-Host "    1. Execute script de migração de imports" -ForegroundColor Yellow
  Write-Host "    2. Execute este script novamente" -ForegroundColor Yellow
    
  $resposta = Read-Host "`n  Continuar mesmo assim? (s/N)"
  if ($resposta -ne 's' -and $resposta -ne 'S') {
    Write-Host "`n❌ Operação cancelada pelo usuário." -ForegroundColor Red
    exit 1
  }
}

Write-Host "`n⚠️  ESTA AÇÃO NÃO PODE SER DESFEITA!" -ForegroundColor Red
$confirmar = Read-Host "`n  Tem certeza que deseja DELETAR os arquivos? (Digite 'DELETAR' para confirmar)"

if ($confirmar -ne 'DELETAR') {
  Write-Host "`n❌ Operação cancelada. Nenhum arquivo foi deletado." -ForegroundColor Red
  exit 1
}

# ========================================
# FASE 4: BACKUP
# ========================================

Write-Host "`n💾 FASE 4: CRIANDO BACKUP..." -ForegroundColor Yellow

$backupDir = "c:\Projetos\conectcrm\backups\omnichannel-cleanup-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
New-Item -ItemType Directory -Path $backupDir -Force | Out-Null

Write-Host "  Backup em: $backupDir" -ForegroundColor DarkGray

foreach ($arquivo in $arquivosExistentes) {
  if (Test-Path $arquivo.Path) {
    $relativePath = $arquivo.Path -replace [regex]::Escape($baseDir), ""
    $backupPath = Join-Path $backupDir $relativePath
    $backupFolder = Split-Path $backupPath -Parent
        
    if (-not (Test-Path $backupFolder)) {
      New-Item -ItemType Directory -Path $backupFolder -Force | Out-Null
    }
        
    Copy-Item -Path $arquivo.Path -Destination $backupPath -Force
    Write-Host "  ✅ Backup: $(Split-Path $arquivo.Path -Leaf)" -ForegroundColor Green
  }
}

# ========================================
# FASE 5: DELETAR
# ========================================

Write-Host "`n🗑️  FASE 5: DELETANDO ARQUIVOS..." -ForegroundColor Yellow

$deletados = 0
$erros = 0

foreach ($arquivo in $arquivosExistentes) {
  try {
    Remove-Item -Path $arquivo.Path -Force
    Write-Host "  ✅ Deletado: $(Split-Path $arquivo.Path -Leaf)" -ForegroundColor Green
    $deletados++
  }
  catch {
    Write-Host "  ❌ Erro ao deletar: $(Split-Path $arquivo.Path -Leaf)" -ForegroundColor Red
    Write-Host "     $($_.Exception.Message)" -ForegroundColor Red
    $erros++
  }
}

# ========================================
# FASE 6: RELATÓRIO FINAL
# ========================================

Write-Host "`n📊 FASE 6: RELATÓRIO FINAL" -ForegroundColor Yellow
Write-Host "=" * 60 -ForegroundColor Yellow

Write-Host "`n✅ Arquivos deletados: $deletados" -ForegroundColor Green
if ($erros -gt 0) {
  Write-Host "❌ Erros: $erros" -ForegroundColor Red
}

Write-Host "`n💾 Backup salvo em:" -ForegroundColor Cyan
Write-Host "   $backupDir" -ForegroundColor White

if ($todasDependencias.Count -gt 0) {
  Write-Host "`n⚠️  PRÓXIMOS PASSOS:" -ForegroundColor Yellow
  Write-Host "   1. Atualizar imports nos arquivos dependentes" -ForegroundColor White
  Write-Host "   2. Executar testes: npm test" -ForegroundColor White
  Write-Host "   3. Verificar se frontend compila: npm run build" -ForegroundColor White
}

Write-Host "`n🎉 Limpeza concluída!" -ForegroundColor Green
Write-Host ""
