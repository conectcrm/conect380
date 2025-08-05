# Script para Identificar Arquivos Duplicados no ConectCRM
# Execute como: .\identificar-duplicados.ps1

Write-Host "🔍 Analisando duplicações no projeto ConectCRM..." -ForegroundColor Cyan

# Função para calcular hash de arquivo
function Get-FileHashContent {
    param($FilePath)
    try {
        $content = Get-Content $FilePath -Raw -ErrorAction Stop
        $hash = [System.Security.Cryptography.SHA256]::Create().ComputeHash([System.Text.Encoding]::UTF8.GetBytes($content))
        return [System.BitConverter]::ToString($hash).Replace("-", "")
    } catch {
        return $null
    }
}

# Função para comparar arquivos similares
function Find-SimilarFiles {
    param($Pattern, $Description)
    
    Write-Host "`n📋 $Description" -ForegroundColor Yellow
    $files = Get-ChildItem -Name $Pattern -ErrorAction SilentlyContinue
    
    if ($files.Count -eq 0) {
        Write-Host "   Nenhum arquivo encontrado" -ForegroundColor Gray
        return
    }
    
    Write-Host "   Encontrados $($files.Count) arquivos:" -ForegroundColor White
    
    # Agrupar por conteúdo similar
    $fileGroups = @{}
    foreach ($file in $files) {
        $hash = Get-FileHashContent $file
        if ($hash) {
            if (!$fileGroups[$hash]) {
                $fileGroups[$hash] = @()
            }
            $fileGroups[$hash] += $file
        }
    }
    
    # Mostrar duplicados
    $duplicateGroups = $fileGroups.Values | Where-Object { $_.Count -gt 1 }
    if ($duplicateGroups) {
        Write-Host "   🔴 DUPLICADOS ENCONTRADOS:" -ForegroundColor Red
        foreach ($group in $duplicateGroups) {
            Write-Host "      Conteúdo idêntico:" -ForegroundColor Red
            foreach ($file in $group) {
                Write-Host "        - $file" -ForegroundColor Red
            }
        }
    } else {
        Write-Host "   ✅ Nenhum duplicado de conteúdo encontrado" -ForegroundColor Green
    }
    
    # Mostrar arquivos com nomes similares
    $nameGroups = @{}
    foreach ($file in $files) {
        # Extrair base do nome (sem números/datas)
        $baseName = $file -replace '\d+', '' -replace '-\w+\.js$', '.js'
        if (!$nameGroups[$baseName]) {
            $nameGroups[$baseName] = @()
        }
        $nameGroups[$baseName] += $file
    }
    
    $similarNames = $nameGroups.Values | Where-Object { $_.Count -gt 1 }
    if ($similarNames) {
        Write-Host "   🟡 NOMES SIMILARES (possíveis versões):" -ForegroundColor Yellow
        foreach ($group in $similarNames) {
            Write-Host "      Grupo similar:" -ForegroundColor Yellow
            foreach ($file in $group) {
                $fileInfo = Get-Item $file
                $sizeBytes = $fileInfo.Length
                $modifiedDate = $fileInfo.LastWriteTime.ToString("dd/MM/yyyy HH:mm")
                Write-Host "        - $file ($sizeBytes bytes, $modifiedDate)" -ForegroundColor Yellow
            }
        }
    }
}

# Analisar diferentes categorias de arquivos
Find-SimilarFiles "test-*.js" "Arquivos de Teste (test-)"
Find-SimilarFiles "teste-*.js" "Arquivos de Teste (teste-)"
Find-SimilarFiles "debug-*.js" "Arquivos de Debug"

Write-Host "`n📋 Analisando Scripts de Sistema..." -ForegroundColor Yellow

# Verificar scripts .bat vs .ps1
$batFiles = Get-ChildItem -Name "*.bat" -ErrorAction SilentlyContinue
$ps1Files = Get-ChildItem -Name "*.ps1" -ErrorAction SilentlyContinue

Write-Host "`n🔄 Scripts com Possível Duplicação (.bat vs .ps1):" -ForegroundColor Cyan
foreach ($batFile in $batFiles) {
    $baseName = [System.IO.Path]::GetFileNameWithoutExtension($batFile)
    $correspondingPs1 = "$baseName.ps1"
    
    if ($correspondingPs1 -in $ps1Files) {
        Write-Host "   🔴 $batFile ↔ $correspondingPs1" -ForegroundColor Red
        
        # Comparar tamanhos e datas
        $batInfo = Get-Item $batFile
        $ps1Info = Get-Item $correspondingPs1
        
        Write-Host "      $batFile`: $($batInfo.Length) bytes, $($batInfo.LastWriteTime.ToString('dd/MM/yyyy HH:mm'))" -ForegroundColor Gray
        Write-Host "      $correspondingPs1`: $($ps1Info.Length) bytes, $($ps1Info.LastWriteTime.ToString('dd/MM/yyyy HH:mm'))" -ForegroundColor Gray
        
        if ($ps1Info.LastWriteTime -gt $batInfo.LastWriteTime) {
            Write-Host "      💡 Recomendação: Manter $correspondingPs1 (mais recente)" -ForegroundColor Green
        } elseif ($batInfo.LastWriteTime -gt $ps1Info.LastWriteTime) {
            Write-Host "      ⚠️  $batFile é mais recente que $correspondingPs1" -ForegroundColor Yellow
        }
    }
}

Write-Host "`n📋 Analisando Documentação..." -ForegroundColor Yellow

# Analisar documentação por categorias
$mdFiles = Get-ChildItem -Name "*.md" -ErrorAction SilentlyContinue | Where-Object { $_ -ne "README.md" }

$docCategories = @{
    "CORRECAO_" = @()
    "SISTEMA_" = @()
    "GUIA_" = @()
    "IMPLEMENTACAO_" = @()
    "MELHORIAS_" = @()
    "ANALISE_" = @()
}

foreach ($file in $mdFiles) {
    $categorized = $false
    foreach ($prefix in $docCategories.Keys) {
        if ($file.StartsWith($prefix)) {
            $docCategories[$prefix] += $file
            $categorized = $true
            break
        }
    }
    if (!$categorized) {
        if (!$docCategories["OUTROS"]) { $docCategories["OUTROS"] = @() }
        $docCategories["OUTROS"] += $file
    }
}

foreach ($category in $docCategories.Keys) {
    $files = $docCategories[$category]
    if ($files.Count -gt 0) {
        Write-Host "`n   📁 $category ($($files.Count) arquivos):" -ForegroundColor White
        foreach ($file in $files | Sort-Object) {
            $info = Get-Item $file
            Write-Host "      - $file ($($info.Length) bytes)" -ForegroundColor Gray
        }
    }
}

# Análise de espaço em disco
Write-Host "`n📊 RESUMO DE ESPAÇO EM DISCO" -ForegroundColor Green
Write-Host "=" * 50 -ForegroundColor Green

$categories = @{
    "Testes (test-*.js)" = "test-*.js"
    "Testes (teste-*.js)" = "teste-*.js" 
    "Debug (debug-*.js)" = "debug-*.js"
    "Scripts (.bat)" = "*.bat"
    "Scripts (.ps1)" = "*.ps1"
    "Documentação (.md)" = "*.md"
}

$totalSize = 0
foreach ($cat in $categories.Keys) {
    $pattern = $categories[$cat]
    $files = Get-ChildItem -Name $pattern -ErrorAction SilentlyContinue
    $size = ($files | ForEach-Object { (Get-Item $_).Length } | Measure-Object -Sum).Sum
    $sizeKB = [math]::Round($size / 1024, 2)
    $totalSize += $size
    
    Write-Host "$cat`: $($files.Count) arquivos, $sizeKB KB" -ForegroundColor Cyan
}

$totalKB = [math]::Round($totalSize / 1024, 2)
$totalMB = [math]::Round($totalSize / 1024 / 1024, 2)

Write-Host "`nTotal analisado: $totalKB KB ($totalMB MB)" -ForegroundColor Yellow

Write-Host "`n💡 RECOMENDAÇÕES:" -ForegroundColor Blue
Write-Host "1. Executar reorganizar-projeto.ps1 para organizar estrutura" -ForegroundColor White
Write-Host "2. Remover scripts .bat duplicados (manter .ps1)" -ForegroundColor White  
Write-Host "3. Revisar arquivos de teste antigos para possível remoção" -ForegroundColor White
Write-Host "4. Consolidar documentação similar" -ForegroundColor White
