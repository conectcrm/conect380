#!/usr/bin/env pwsh
# Teste Simplificado - Verificar Implementação do Sistema

Write-Host "`n🔍 ============================================" -ForegroundColor Cyan
Write-Host "   VALIDAÇÃO DA IMPLEMENTAÇÃO" -ForegroundColor Cyan
Write-Host "============================================`n" -ForegroundColor Cyan

$baseDir = "c:\Projetos\conectcrm"
$passed = 0
$failed = 0

# Função para verificar arquivo
function Test-FileExists {
  param([string]$Path, [string]$Description)
    
  if (Test-Path $Path) {
    Write-Host "✅ $Description" -ForegroundColor Green
    return $true
  }
  else {
    Write-Host "❌ $Description" -ForegroundColor Red
    return $false
  }
}

# Função para verificar conteúdo
function Test-FileContent {
  param([string]$Path, [string]$Pattern, [string]$Description)
    
  if (Test-Path $Path) {
    $content = Get-Content $Path -Raw
    if ($content -match $Pattern) {
      Write-Host "✅ $Description" -ForegroundColor Green
      return $true
    }
    else {
      Write-Host "❌ $Description" -ForegroundColor Red
      return $false
    }
  }
  else {
    Write-Host "❌ Arquivo não encontrado: $Path" -ForegroundColor Red
    return $false
  }
}

Write-Host "📦 VERIFICANDO ARQUIVOS BACKEND...`n" -ForegroundColor Yellow

# Entity
if (Test-FileExists "$baseDir\backend\src\modules\atendimento\entities\configuracao-inatividade.entity.ts" "Entity ConfiguracaoInatividade") { $passed++ } else { $failed++ }

# Service
if (Test-FileExists "$baseDir\backend\src\modules\atendimento\services\inactivity-monitor.service.ts" "Service InactivityMonitorService") { $passed++ } else { $failed++ }

# Controller
if (Test-FileExists "$baseDir\backend\src\modules\atendimento\controllers\configuracao-inatividade.controller.ts" "Controller ConfiguracaoInactividadeController") { $passed++ } else { $failed++ }

# Migration
if (Test-FileExists "$baseDir\backend\src\migrations\1730854800000-CriarTabelaConfiguracaoInatividade.ts" "Migration CriarTabelaConfiguracaoInatividade") { $passed++ } else { $failed++ }

Write-Host "`n📋 VERIFICANDO INTEGRAÇÕES...`n" -ForegroundColor Yellow

# Database config
if (Test-FileContent "$baseDir\backend\src\config\database.config.ts" "ConfiguracaoInatividade" "Entity registrada em database.config.ts") { $passed++ } else { $failed++ }

# Module
if (Test-FileContent "$baseDir\backend\src\modules\atendimento\atendimento.module.ts" "ConfiguracaoInatividade" "Entity registrada em atendimento.module.ts") { $passed++ } else { $failed++ }

if (Test-FileContent "$baseDir\backend\src\modules\atendimento\atendimento.module.ts" "InactivityMonitorService" "Service registrado em atendimento.module.ts") { $passed++ } else { $failed++ }

if (Test-FileContent "$baseDir\backend\src\modules\atendimento\atendimento.module.ts" "ConfiguracaoInactividadeController" "Controller registrado em atendimento.module.ts") { $passed++ } else { $failed++ }

# WhatsApp integration
if (Test-FileContent "$baseDir\backend\src\modules\atendimento\services\inactivity-monitor.service.ts" "WhatsAppSenderService" "WhatsAppSenderService injetado") { $passed++ } else { $failed++ }

if (Test-FileContent "$baseDir\backend\src\modules\atendimento\services\inactivity-monitor.service.ts" "enviarAvisoFechamento" "Método enviarAvisoFechamento implementado") { $passed++ } else { $failed++ }

if (Test-FileContent "$baseDir\backend\src\modules\atendimento\services\inactivity-monitor.service.ts" "fecharPorInatividade" "Método fecharPorInatividade implementado") { $passed++ } else { $failed++ }

Write-Host "`n📚 VERIFICANDO DOCUMENTAÇÃO...`n" -ForegroundColor Yellow

# Documentação
if (Test-FileExists "$baseDir\CONSOLIDACAO_FECHAMENTO_AUTOMATICO.md" "CONSOLIDACAO_FECHAMENTO_AUTOMATICO.md") { $passed++ } else { $failed++ }

if (Test-FileExists "$baseDir\STATUS_FECHAMENTO_AUTOMATICO.md" "STATUS_FECHAMENTO_AUTOMATICO.md") { $passed++ } else { $failed++ }

if (Test-FileExists "$baseDir\TESTE_FECHAMENTO_AUTOMATICO.md" "TESTE_FECHAMENTO_AUTOMATICO.md") { $passed++ } else { $failed++ }

if (Test-FileExists "$baseDir\QUICKSTART_TESTE_INATIVIDADE.md" "QUICKSTART_TESTE_INATIVIDADE.md") { $passed++ } else { $failed++ }

if (Test-FileExists "$baseDir\CHECKLIST_FINAL_FECHAMENTO_AUTOMATICO.md" "CHECKLIST_FINAL_FECHAMENTO_AUTOMATICO.md") { $passed++ } else { $failed++ }

Write-Host "`n🛠️ VERIFICANDO SCRIPTS...`n" -ForegroundColor Yellow

# Scripts
if (Test-FileExists "$baseDir\scripts\test-inactivity-system.ps1" "test-inactivity-system.ps1") { $passed++ } else { $failed++ }

if (Test-FileExists "$baseDir\scripts\test-inactivity-queries.sql" "test-inactivity-queries.sql") { $passed++ } else { $failed++ }

# Resumo
Write-Host "`n📊 ============================================" -ForegroundColor Cyan
Write-Host "   RESULTADO DA VALIDAÇÃO" -ForegroundColor Cyan
Write-Host "============================================`n" -ForegroundColor Cyan

$total = $passed + $failed
$percentage = [math]::Round(($passed / $total) * 100, 2)

Write-Host "Total de testes: $total" -ForegroundColor White
Write-Host "Passou: $passed" -ForegroundColor Green
Write-Host "Falhou: $failed" -ForegroundColor $(if ($failed -eq 0) { "Green" } else { "Red" })
Write-Host "Percentual: $percentage%" -ForegroundColor $(if ($percentage -eq 100) { "Green" } elseif ($percentage -ge 80) { "Yellow" } else { "Red" })

if ($failed -eq 0) {
  Write-Host "`n✅ SISTEMA COMPLETAMENTE IMPLEMENTADO!" -ForegroundColor Green
  Write-Host "`n🚀 Próximos passos:" -ForegroundColor Yellow
  Write-Host "   1. Verificar se backend está rodando:" -ForegroundColor White
  Write-Host "      Get-Process -Name node" -ForegroundColor Gray
  Write-Host "`n   2. Verificar se migration foi executada:" -ForegroundColor White
  Write-Host "      SELECT * FROM atendimento_configuracao_inatividade LIMIT 1;" -ForegroundColor Gray
  Write-Host "`n   3. Testar API manualmente:" -ForegroundColor White
  Write-Host "      GET http://localhost:3001/atendimento/configuracao-inatividade/{{EMPRESA_ID}}" -ForegroundColor Gray
  Write-Host "`n   4. Ou executar teste completo:" -ForegroundColor White
  Write-Host "      .\scripts\test-inactivity-system.ps1" -ForegroundColor Gray
}
else {
  Write-Host "`n⚠️ Alguns componentes não foram encontrados!" -ForegroundColor Yellow
  Write-Host "Verifique os itens marcados com ❌ acima." -ForegroundColor Yellow
}

Write-Host "`n============================================`n" -ForegroundColor Cyan
