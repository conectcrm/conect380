# Script de Limpeza em Massa - ConectCRM
# Remove arquivos temporários, de teste e desenvolvimento
# 
# IMPORTANTE: Execute este script periodicamente para manter o projeto limpo
# Recomendado: Mensal ou antes de releases importantes

param(
    [switch]$AutoCopilot = $false,  # Incluir auto-limpeza do Copilot
    [switch]$DryRun = $false        # Apenas simular sem remover
)

Write-Host "🧹 INICIANDO LIMPEZA EM MASSA DO CONECTCRM" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Green

$basePath = "C:\Projetos\conectcrm"

# Verificar se estamos no diretório correto
if (-not (Test-Path "$basePath\package.json")) {
    Write-Host "❌ ERRO: Não foi possível encontrar o projeto ConectCRM em $basePath" -ForegroundColor Red
    Write-Host "Verifique se o caminho está correto." -ForegroundColor Red
    exit 1
}

# Executar auto-limpeza do Copilot se solicitado
if ($AutoCopilot) {
    Write-Host "`n🤖 Executando Auto-Limpeza do Copilot..." -ForegroundColor Cyan
    & "$basePath\auto-limpeza-copilot.ps1" -DryRun:$DryRun
    Write-Host "`n🔄 Continuando com limpeza geral..." -ForegroundColor Yellow
}

if ($DryRun) {
    Write-Host "`n🔍 MODO DRY-RUN ATIVADO - Apenas simulação" -ForegroundColor Blue
}

# Contador de arquivos removidos
$removedCount = 0

# Função para remover arquivos com padrão
function Remove-FilesByPattern {
    param(
        [string]$Path,
        [array]$Patterns,
        [string]$Description
    )
    
    Write-Host "`n📁 $Description..." -ForegroundColor Yellow
    $localCount = 0
    
    foreach ($pattern in $Patterns) {
        $files = Get-ChildItem -Path $Path -Filter $pattern -ErrorAction SilentlyContinue
        foreach ($file in $files) {
            if ($DryRun) {
                Write-Host "  🔍 Seria removido: $($file.Name)" -ForegroundColor Blue
            } else {
                Write-Host "  ❌ Removendo: $($file.Name)" -ForegroundColor Red
                Remove-Item $file.FullName -Force
                $script:removedCount++
            }
            $localCount++
        }
    }
    
    if ($localCount -eq 0) {
        Write-Host "  ✅ Nenhum arquivo encontrado" -ForegroundColor Green
    } else {
        if ($DryRun) {
            Write-Host "  📊 $localCount arquivo(s) seriam removido(s)" -ForegroundColor Blue
        } else {
            Write-Host "  📊 $localCount arquivo(s) removido(s)" -ForegroundColor Cyan
        }
    }
}

# 1. ARQUIVOS DE TESTE E DEBUG - BACKEND
Write-Host "`n📁 Limpando Backend..." -ForegroundColor Yellow
$backendTestFiles = @(
    "test-*.js",
    "debug-*.js", 
    "check-*.js",
    "create-test-*.js",
    "create-demo-*.sql",
    "simular-*.js",
    "demonstrar-*.js"
)

foreach ($pattern in $backendTestFiles) {
    $files = Get-ChildItem -Path "$basePath\backend" -Filter $pattern -ErrorAction SilentlyContinue
    foreach ($file in $files) {
        Write-Host "  ❌ Removendo: $($file.Name)" -ForegroundColor Red
        Remove-Item $file.FullName -Force
    }
}

# 2. SCRIPTS BATCH E POWERSHELL TEMPORÁRIOS - BACKEND
Write-Host "`n📁 Limpando Scripts Backend..." -ForegroundColor Yellow
$backendScripts = @(
    "fix-*.bat",
    "setup-*.bat", 
    "test-*.bat",
    "test-*.ps1",
    "manage-*.bat",
    "resolve-*.bat",
    "start-*.bat"
)

foreach ($pattern in $backendScripts) {
    $files = Get-ChildItem -Path "$basePath\backend" -Filter $pattern -ErrorAction SilentlyContinue
    foreach ($file in $files) {
        Write-Host "  ❌ Removendo: $($file.Name)" -ForegroundColor Red
        Remove-Item $file.FullName -Force
    }
}

# 3. DOCUMENTAÇÃO TEMPORÁRIA - BACKEND
Write-Host "`n📁 Limpando Docs Backend..." -ForegroundColor Yellow
$backendDocs = @(
    "README-*.md",
    "EXEMPLO_*.md"
)

foreach ($pattern in $backendDocs) {
    $files = Get-ChildItem -Path "$basePath\backend" -Filter $pattern -ErrorAction SilentlyContinue
    foreach ($file in $files) {
        Write-Host "  ❌ Removendo: $($file.Name)" -ForegroundColor Red
        Remove-Item $file.FullName -Force
    }
}

# 4. ARQUIVOS DE TESTE - FRONTEND-WEB
Write-Host "`n📁 Limpando Frontend-Web..." -ForegroundColor Yellow
$frontendTestFiles = @(
    "test-*.js",
    "*EXEMPLO*.md",
    "*PADRAO*.md",
    "*DEPENDENCIAS*.md"
)

foreach ($pattern in $frontendTestFiles) {
    $files = Get-ChildItem -Path "$basePath\frontend-web" -Filter $pattern -ErrorAction SilentlyContinue
    foreach ($file in $files) {
        Write-Host "  ❌ Removendo: $($file.Name)" -ForegroundColor Red
        Remove-Item $file.FullName -Force
    }
}

# 5. DOCUMENTAÇÃO TEMPORÁRIA - RAIZ
Write-Host "`n📁 Limpando Documentação Temporária..." -ForegroundColor Yellow
$tempDocs = @(
    "*_IMPLEMENTADO*.md",
    "*_COMPLETA*.md", 
    "*_CONCLUIDA*.md",
    "CORRECAO_*.md",
    "CORRECOES_*.md",
    "CAMPO_*.md",
    "COLUNA_*.md",
    "LAYOUT_*.md",
    "NOVA_*.md",
    "OTIMIZACAO_*.md",
    "EXPLICACAO_*.md",
    "REMOCAO_*.md"
)

foreach ($pattern in $tempDocs) {
    $files = Get-ChildItem -Path $basePath -Filter $pattern -ErrorAction SilentlyContinue
    foreach ($file in $files) {
        Write-Host "  ❌ Removendo: $($file.Name)" -ForegroundColor Red
        Remove-Item $file.FullName -Force
    }
}

# 6. SCRIPTS TEMPORÁRIOS - RAIZ
Write-Host "`n📁 Limpando Scripts Temporários..." -ForegroundColor Yellow
$tempScripts = @(
    "assistente-*.js",
    "correcao-*.js",
    "fix-*.js",
    "script-teste-*.js",
    "teste-*.js",
    "teste-*.html"
)

foreach ($pattern in $tempScripts) {
    $files = Get-ChildItem -Path $basePath -Filter $pattern -ErrorAction SilentlyContinue
    foreach ($file in $files) {
        Write-Host "  ❌ Removendo: $($file.Name)" -ForegroundColor Red
        Remove-Item $file.FullName -Force
    }
}

# 7. ARQUIVOS SQL TEMPORÁRIOS
Write-Host "`n📁 Limpando SQLs Temporários..." -ForegroundColor Yellow
$tempSqls = @(
    "create-test-*.sql",
    "insert-eventos-teste.sql",
    "debug-*.sql"
)

foreach ($pattern in $tempSqls) {
    $files = Get-ChildItem -Path $basePath -Filter $pattern -ErrorAction SilentlyContinue
    foreach ($file in $files) {
        Write-Host "  ❌ Removendo: $($file.Name)" -ForegroundColor Red
        Remove-Item $file.FullName -Force
    }
}

# 8. SCRIPTS POWERSHELL E BATCH - RAIZ  
Write-Host "`n📁 Limpando Scripts Sistema..." -ForegroundColor Yellow
$systemScripts = @(
    "test-*.ps1",
    "executar-*.bat",
    "executar-*.ps1"
)

foreach ($pattern in $systemScripts) {
    $files = Get-ChildItem -Path $basePath -Filter $pattern -ErrorAction SilentlyContinue
    foreach ($file in $files) {
        Write-Host "  ❌ Removendo: $($file.Name)" -ForegroundColor Red
        Remove-Item $file.FullName -Force
    }
}

Write-Host "`n✅ LIMPEZA CONCLUÍDA!" -ForegroundColor Green
if ($DryRun) {
    Write-Host "🔍 Modo simulação - Nenhum arquivo foi removido" -ForegroundColor Blue
    Write-Host "Execute sem -DryRun para remover os arquivos realmente" -ForegroundColor Blue
} else {
    Write-Host "Projeto organizado e pronto para produção! 🚀" -ForegroundColor Green
}

# Mostrar estatísticas finais
Write-Host "`n📊 ESTATÍSTICAS FINAIS:" -ForegroundColor Cyan
if ($DryRun) {
    Write-Host "  📄 Arquivos que seriam removidos: $removedCount" -ForegroundColor Blue
} else {
    Write-Host "  📄 Arquivos removidos: $removedCount" -ForegroundColor White
}

$totalFiles = (Get-ChildItem -Path $basePath -Recurse -File | Where-Object { $_.FullName -notmatch "node_modules" } | Measure-Object).Count
$totalFolders = (Get-ChildItem -Path $basePath -Recurse -Directory | Where-Object { $_.FullName -notmatch "node_modules" } | Measure-Object).Count
Write-Host "  📄 Total de arquivos do projeto: $totalFiles" -ForegroundColor White
Write-Host "  📁 Total de pastas do projeto: $totalFolders" -ForegroundColor White

# Sugestões finais
if (-not $AutoCopilot -and -not $DryRun) {
    Write-Host "`n💡 DICA: Execute com -AutoCopilot para incluir limpeza inteligente do Copilot" -ForegroundColor Yellow
    Write-Host "   Exemplo: .\limpeza-massa.ps1 -AutoCopilot" -ForegroundColor Gray
}

if (-not $DryRun) {
    Write-Host "`n💡 DICA: Use -DryRun para simular antes de executar" -ForegroundColor Yellow
    Write-Host "   Exemplo: .\limpeza-massa.ps1 -DryRun" -ForegroundColor Gray
}
