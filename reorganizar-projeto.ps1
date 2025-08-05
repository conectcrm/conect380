# Script de Reorganização do Projeto ConectCRM
# Execute como: .\reorganizar-projeto.ps1

param(
  [switch]$DryRun = $false,  # Simula a execução sem mover arquivos
  [switch]$Force = $false    # Força a execução sem confirmação
)

$RootPath = Get-Location
Write-Host "🔧 Iniciando reorganização do projeto ConectCRM" -ForegroundColor Cyan
Write-Host "📁 Diretório: $RootPath" -ForegroundColor Gray

if ($DryRun) {
  Write-Host "⚠️  MODO SIMULAÇÃO - Nenhum arquivo será movido" -ForegroundColor Yellow
}

# Função para mover arquivos com log
function Move-FileWithLog {
  param($Source, $Destination, $Description)
    
  if ($DryRun) {
    Write-Host "    [SIMULAR] $Source → $Destination" -ForegroundColor Yellow
    return
  }
    
  try {
    if (Test-Path $Source) {
      $destDir = Split-Path $Destination
      if (!(Test-Path $destDir)) {
        New-Item -ItemType Directory -Path $destDir -Force | Out-Null
      }
      Move-Item -Path $Source -Destination $Destination -Force
      Write-Host "    ✅ $Description" -ForegroundColor Green
    }
    else {
      Write-Host "    ⚠️  Arquivo não encontrado: $Source" -ForegroundColor Yellow
    }
  }
  catch {
    Write-Host "    ❌ Erro ao mover $Source`: $($_.Exception.Message)" -ForegroundColor Red
  }
}

# Função para listar arquivos por padrão
function Get-FilesByPattern {
  param($Pattern, $Description)
    
  $files = Get-ChildItem -Name $Pattern -ErrorAction SilentlyContinue
  if ($files) {
    Write-Host "📋 $Description ($($files.Count) arquivos):" -ForegroundColor White
    return $files
  }
  else {
    Write-Host "📋 $Description`: Nenhum arquivo encontrado" -ForegroundColor Gray
    return @()
  }
}

if (!$Force) {
  Write-Host "`n⚠️  Esta operação irá reorganizar centenas de arquivos!" -ForegroundColor Yellow
  Write-Host "   Certifique-se de ter um backup ou controle de versão ativo." -ForegroundColor Yellow
  $confirm = Read-Host "Deseja continuar? (s/N)"
  if ($confirm -ne "s" -and $confirm -ne "S") {
    Write-Host "❌ Operação cancelada pelo usuário" -ForegroundColor Red
    exit
  }
}

Write-Host "`n🗂️  FASE 1: Reorganizando arquivos de teste e debug" -ForegroundColor Cyan

# Mover arquivos de teste
$testFiles = Get-FilesByPattern "test-*.js" "Arquivos de teste (test-)"
foreach ($file in $testFiles) {
  Move-FileWithLog $file "tests\integration\$file" "Teste de integração: $file"
}

$testeFiles = Get-FilesByPattern "teste-*.js" "Arquivos de teste (teste-)"
foreach ($file in $testeFiles) {
  Move-FileWithLog $file "tests\integration\$file" "Teste de integração: $file"
}

$debugFiles = Get-FilesByPattern "debug-*.js" "Arquivos de debug"
foreach ($file in $debugFiles) {
  Move-FileWithLog $file "tests\debug\$file" "Script de debug: $file"
}

Write-Host "`n🗂️  FASE 2: Reorganizando scripts de sistema" -ForegroundColor Cyan

# Scripts de inicialização
$startupScripts = @(
  @{ Pattern = "iniciar-*.ps1"; Dest = "scripts\build"; Desc = "Script de inicialização" },
  @{ Pattern = "iniciar-*.bat"; Dest = "scripts\build"; Desc = "Script de inicialização (legado)" },
  @{ Pattern = "start-*.bat"; Dest = "scripts\build"; Desc = "Script de inicialização" },
  @{ Pattern = "executar-*.ps1"; Dest = "scripts\utils"; Desc = "Script utilitário" },
  @{ Pattern = "executar-*.bat"; Dest = "scripts\utils"; Desc = "Script utilitário" },
  @{ Pattern = "setup-*.ps1"; Dest = "scripts\setup"; Desc = "Script de configuração" },
  @{ Pattern = "instalar-*.ps1"; Dest = "scripts\setup"; Desc = "Script de instalação" },
  @{ Pattern = "otimizar-*.ps1"; Dest = "scripts\utils"; Desc = "Script de otimização" },
  @{ Pattern = "limpar-*.ps1"; Dest = "scripts\utils"; Desc = "Script de limpeza" },
  @{ Pattern = "desabilitar-*.ps1"; Dest = "scripts\utils"; Desc = "Script de configuração" },
  @{ Pattern = "migrate-*.bat"; Dest = "scripts\utils"; Desc = "Script de migração" },
  @{ Pattern = "migrate-*.js"; Dest = "scripts\utils"; Desc = "Script de migração" }
)

foreach ($scriptGroup in $startupScripts) {
  $files = Get-FilesByPattern $scriptGroup.Pattern $scriptGroup.Desc
  foreach ($file in $files) {
    Move-FileWithLog $file "$($scriptGroup.Dest)\$file" "$($scriptGroup.Desc): $file"
  }
}

Write-Host "`n🗂️  FASE 3: Reorganizando documentação" -ForegroundColor Cyan

# Categorizar documentação por prefixo/conteúdo
$docCategories = @{
  "API|ENDPOINT|BACKEND_|FRONTEND_"            = "api"
  "SISTEMA_|MODULO_|IMPLEMENTACAO_|INTERFACE_" = "features" 
  "GUIA_|CHECKLIST_|COMO_|MANUAL_"             = "guides"
  "CORRECAO_|PROBLEMA_|ERRO_|DEBUG_|SOLUCAO_"  = "troubleshooting"
}

$markdownFiles = Get-FilesByPattern "*.md" "Arquivos de documentação"
foreach ($file in $markdownFiles) {
  $fileName = $file.ToUpper()
  $moved = $false
    
  foreach ($pattern in $docCategories.Keys) {
    $patterns = $pattern -split '\|'
    foreach ($p in $patterns) {
      if ($fileName.Contains($p)) {
        $category = $docCategories[$pattern]
        Move-FileWithLog $file "docs\organized\$category\$file" "Documentação ($category): $file"
        $moved = $true
        break
      }
    }
    if ($moved) { break }
  }
    
  # Se não encontrou categoria, deixa na raiz docs
  if (!$moved -and $file -ne "README.md" -and $file -ne "PLANO_REORGANIZACAO_PROJETO.md") {
    Move-FileWithLog $file "docs\organized\$file" "Documentação geral: $file"
  }
}

Write-Host "`n🗂️  FASE 4: Limpando arquivos duplicados/obsoletos" -ForegroundColor Cyan

# Identificar scripts .bat que têm equivalente .ps1
$batFiles = Get-ChildItem -Name "*.bat" -ErrorAction SilentlyContinue
foreach ($batFile in $batFiles) {
  $psFile = $batFile -replace '\.bat$', '.ps1'
  if (Test-Path $psFile) {
    if ($DryRun) {
      Write-Host "    [SIMULAR] Remover duplicado: $batFile (existe $psFile)" -ForegroundColor Yellow
    }
    else {
      Remove-Item $batFile -Force
      Write-Host "    🗑️  Removido duplicado: $batFile" -ForegroundColor Red
    }
  }
}

Write-Host "`n📊 RESUMO DA REORGANIZAÇÃO" -ForegroundColor Green
Write-Host "=" * 50 -ForegroundColor Green

# Contar arquivos nas novas pastas
if (!$DryRun) {
  $testsCount = (Get-ChildItem "tests" -Recurse -File -ErrorAction SilentlyContinue).Count
  $scriptsCount = (Get-ChildItem "scripts" -Recurse -File -ErrorAction SilentlyContinue).Count
  $docsCount = (Get-ChildItem "docs\organized" -Recurse -File -ErrorAction SilentlyContinue).Count
    
  Write-Host "✅ Testes/Debug movidos: $testsCount arquivos" -ForegroundColor Green
  Write-Host "✅ Scripts organizados: $scriptsCount arquivos" -ForegroundColor Green
  Write-Host "✅ Documentação organizada: $docsCount arquivos" -ForegroundColor Green
}
else {
  Write-Host "⚠️  Execute sem -DryRun para aplicar as mudanças" -ForegroundColor Yellow
}

# Criar arquivo de índice da nova estrutura
$indexContent = @"
# Nova Estrutura do Projeto ConectCRM

## 📁 Estrutura Reorganizada

### /tests/
- **integration/**: Testes de API e integração entre módulos
- **debug/**: Scripts de debug e diagnóstico
- **e2e/**: Testes end-to-end (quando implementados)

### /scripts/
- **setup/**: Scripts de configuração inicial e instalação
- **build/**: Scripts de build, inicialização e deploy
- **utils/**: Utilitários, limpeza e otimização

### /docs/organized/
- **api/**: Documentação técnica de APIs e backend
- **features/**: Documentação de funcionalidades implementadas
- **guides/**: Guias de uso, checklists e manuais
- **troubleshooting/**: Correções, soluções e debugging

## 🎯 Benefícios

- ✅ Raiz do projeto limpa e organizada
- ✅ Facilita navegação e manutenção
- ✅ Melhora onboarding de novos desenvolvedores
- ✅ Estrutura profissional e escalável

## 📝 Próximos Passos

1. Atualizar scripts que referenciam caminhos antigos
2. Atualizar documentação com novos caminhos
3. Configurar VS Code tasks com novos caminhos
4. Atualizar CI/CD se houver

Reorganizado em: $(Get-Date -Format "dd/MM/yyyy HH:mm")
"@

if (!$DryRun) {
  $indexContent | Out-File -FilePath "NOVA_ESTRUTURA_README.md" -Encoding UTF8
  Write-Host "`n📄 Criado: NOVA_ESTRUTURA_README.md" -ForegroundColor Blue
}

Write-Host "`n🎉 Reorganização concluída!" -ForegroundColor Green
Write-Host "💡 Dica: Revise os novos diretórios e atualize referências conforme necessário" -ForegroundColor Blue
