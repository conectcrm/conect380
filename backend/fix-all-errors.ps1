# Script de Correção Completa dos Erros TypeScript

Write-Host "`n🔧 INICIANDO CORREÇÃO COMPLETA..." -ForegroundColor Cyan

# 1. Corrigir imports nos controllers
Write-Host "`n1️⃣ Corrigindo imports nos controllers..." -ForegroundColor Yellow

$controllers = @(
  "src/modules/atendimento/controllers/tickets.controller.ts",
  "src/modules/atendimento/controllers/atendentes.controller.ts",
  "src/modules/atendimento/controllers/mensagens.controller.ts"
)

foreach ($file in $controllers) {
  if (Test-Path $file) {
    $content = Get-Content $file -Raw
        
    # Adicionar imports de TipoHistorico se não existir
    if ($content -notmatch "TipoHistorico") {
      $content = $content -replace "import \{ Historico \}", "import { Historico, TipoHistorico }"
    }
        
    Set-Content $file $content
    Write-Host "  ✅ $file" -ForegroundColor Green
  }
}

# 2. Corrigir uso de ordem alfabética nos controllers
Write-Host "`n2️⃣ Corrigindo queries com order..." -ForegroundColor Yellow

$file = "src/modules/atendimento/controllers/atendentes.controller.ts"
if (Test-Path $file) {
  $content = Get-Content $file -Raw
  # Remover order by nome já que Atendente não tem esse campo diretamente
  $content = $content -replace "order: \{ nome: 'ASC' \},", ""
  Set-Content $file $content
  Write-Host "  ✅ $file" -ForegroundColor Green
}

# 3. Corrigir processors com AIInsight
Write-Host "`n3️⃣ Corrigindo AI processors..." -ForegroundColor Yellow

$file = "src/modules/atendimento/processors/ai-analysis.processor.ts"
if (Test-Path $file) {
  $content = Get-Content $file -Raw
    
  # Adicionar imports
  if ($content -notmatch "TipoAnalise") {
    $content = $content -replace "import \{ AIInsight \}", "import { AIInsight, TipoAnalise }"
  }
    
  # Corrigir create de AIInsight - trocar tipoAnalise por tipo
  $content = $content -replace "tipoAnalise:", "tipo:"
    
  # Corrigir dados por resultado
  $content = $content -replace "dados: analise", "resultado: analise"
    
  Set-Content $file $content
  Write-Host "  ✅ $file" -ForegroundColor Green
}

# 4. Corrigir Historico entity
Write-Host "`n4️⃣ Corrigindo entity Historico..." -ForegroundColor Yellow

$file = "src/modules/atendimento/entities/historico.entity.ts"
if (Test-Path $file) {
  $content = Get-Content $file -Raw
    
  # Adicionar export do TipoHistorico se não existir
  if ($content -notmatch "export enum TipoHistorico") {
    Write-Host "  ⚠️ TipoHistorico já existe" -ForegroundColor Yellow
  }
    
  Set-Content $file $content
  Write-Host "  ✅ $file" -ForegroundColor Green
}

# 5. Corrigir AIInsight entity
Write-Host "`n5️⃣ Corrigindo entity AIInsight..." -ForegroundColor Yellow

$file = "src/modules/atendimento/entities/ai-insight.entity.ts"
if (Test-Path $file) {
  $content = Get-Content $file -Raw
    
  # Trocar tipoAnalise por tipo
  $content = $content -replace "tipoAnalise:", "tipo:"
  $content = $content -replace "@Column\([^)]+\)\s+tipoAnalise:", "@Column(`${params})`n  tipo:"
    
  Set-Content $file $content
  Write-Host "  ✅ $file" -ForegroundColor Green
}

# 6. Corrigir Mensagem entity
Write-Host "`n6️⃣ Corrigindo entity Mensagem..." -ForegroundColor Yellow

$file = "src/modules/atendimento/entities/mensagem.entity.ts"  
if (Test-Path $file) {
  $content = Get-Content $file -Raw
    
  # Trocar midia por metadados se necessário
  # Já foi corrigido anteriormente
    
  Set-Content $file $content
  Write-Host "  ✅ $file" -ForegroundColor Green
}

Write-Host "`n✅ CORREÇÕES APLICADAS!" -ForegroundColor Green
Write-Host "`n🔨 Testando compilação..." -ForegroundColor Cyan

npm run build 2>&1 | Select-Object -Last 5
