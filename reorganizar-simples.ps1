# Script Simples de Reorganização do ConectCRM
param([switch]$Execute = $false)

$rootPath = Get-Location
Write-Host "=== ANÁLISE DO PROJETO CONECTCRM ===" -ForegroundColor Cyan
Write-Host "Diretório: $rootPath" -ForegroundColor Gray

# Contadores
$testFiles = Get-ChildItem -Name "test-*.js" -ErrorAction SilentlyContinue
$testeFiles = Get-ChildItem -Name "teste-*.js" -ErrorAction SilentlyContinue  
$debugFiles = Get-ChildItem -Name "debug-*.js" -ErrorAction SilentlyContinue
$batFiles = Get-ChildItem -Name "*.bat" -ErrorAction SilentlyContinue
$ps1Files = Get-ChildItem -Name "*.ps1" -ErrorAction SilentlyContinue
$mdFiles = Get-ChildItem -Name "*.md" -ErrorAction SilentlyContinue

Write-Host "`n📊 RESUMO ATUAL:" -ForegroundColor Yellow
Write-Host "• Arquivos test-*.js: $($testFiles.Count)" -ForegroundColor White
Write-Host "• Arquivos teste-*.js: $($testeFiles.Count)" -ForegroundColor White
Write-Host "• Arquivos debug-*.js: $($debugFiles.Count)" -ForegroundColor White
Write-Host "• Scripts .bat: $($batFiles.Count)" -ForegroundColor White
Write-Host "• Scripts .ps1: $($ps1Files.Count)" -ForegroundColor White
Write-Host "• Documentos .md: $($mdFiles.Count)" -ForegroundColor White

$totalFiles = $testFiles.Count + $testeFiles.Count + $debugFiles.Count + $batFiles.Count + $ps1Files.Count + $mdFiles.Count
Write-Host "• TOTAL A REORGANIZAR: $totalFiles arquivos" -ForegroundColor Red

if (!$Execute) {
    Write-Host "`n💡 Para executar a reorganização, use: .\reorganizar-simples.ps1 -Execute" -ForegroundColor Blue
    Write-Host "⚠️  IMPORTANTE: Faça backup antes de executar!" -ForegroundColor Yellow
    exit
}

Write-Host "`n🔧 EXECUTANDO REORGANIZAÇÃO..." -ForegroundColor Green

# Criar diretórios
$dirs = @("tests\integration", "tests\debug", "scripts\setup", "scripts\build", "scripts\utils", "docs\organized")
foreach ($dir in $dirs) {
    if (!(Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
        Write-Host "✅ Criado: $dir" -ForegroundColor Green
    }
}

# Mover arquivos de teste
foreach ($file in $testFiles) {
    Move-Item $file "tests\integration\" -Force
    Write-Host "📁 $file → tests\integration\" -ForegroundColor Cyan
}

foreach ($file in $testeFiles) {
    Move-Item $file "tests\integration\" -Force
    Write-Host "📁 $file → tests\integration\" -ForegroundColor Cyan
}

foreach ($file in $debugFiles) {
    Move-Item $file "tests\debug\" -Force
    Write-Host "📁 $file → tests\debug\" -ForegroundColor Cyan
}

# Mover scripts
$scriptMappings = @{
    "iniciar-*.ps1" = "scripts\build"
    "iniciar-*.bat" = "scripts\build"
    "start-*.bat" = "scripts\build"
    "setup-*.ps1" = "scripts\setup"
    "instalar-*.ps1" = "scripts\setup"
    "otimizar-*.ps1" = "scripts\utils"
    "limpar-*.ps1" = "scripts\utils"
    "executar-*.ps1" = "scripts\utils"
    "desabilitar-*.ps1" = "scripts\utils"
}

foreach ($pattern in $scriptMappings.Keys) {
    $files = Get-ChildItem -Name $pattern -ErrorAction SilentlyContinue
    foreach ($file in $files) {
        $dest = $scriptMappings[$pattern]
        Move-Item $file "$dest\" -Force
        Write-Host "📁 $file → $dest\" -ForegroundColor Blue
    }
}

# Mover documentação (exceto README principal)
$docFiles = $mdFiles | Where-Object { $_ -ne "README.md" -and $_ -ne "PLANO_REORGANIZACAO_PROJETO.md" }
foreach ($file in $docFiles) {
    Move-Item $file "docs\organized\" -Force
    Write-Host "📁 $file → docs\organized\" -ForegroundColor Magenta
}

Write-Host "`n🎉 REORGANIZAÇÃO CONCLUÍDA!" -ForegroundColor Green
Write-Host "📊 Verifique as novas pastas:" -ForegroundColor White
Write-Host "• tests\integration\ - Testes de API" -ForegroundColor Gray
Write-Host "• tests\debug\ - Scripts de debug" -ForegroundColor Gray  
Write-Host "• scripts\build\ - Scripts de inicialização" -ForegroundColor Gray
Write-Host "• scripts\setup\ - Scripts de configuração" -ForegroundColor Gray
Write-Host "• scripts\utils\ - Scripts utilitários" -ForegroundColor Gray
Write-Host "• docs\organized\ - Documentação organizada" -ForegroundColor Gray
