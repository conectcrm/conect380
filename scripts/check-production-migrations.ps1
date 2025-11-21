# ========================================
# Script de Verificação de Migrations
# ========================================
# Uso: ./check-production-migrations.ps1

param(
  [string]$Environment = "production"
)

Write-Host "🔍 Verificando Migrations - Ambiente: $Environment" -ForegroundColor Yellow
Write-Host "═══════════════════════════════════════════════════" -ForegroundColor DarkGray
Write-Host ""

# Verificar se está no diretório correto
if (-not (Test-Path "backend/src/migrations")) {
  Write-Host "❌ Erro: Execute este script da raiz do projeto!" -ForegroundColor Red
  exit 1
}

# Contar migrations existentes
$totalMigrations = (Get-ChildItem "backend/src/migrations/*.ts").Count
Write-Host "📦 Total de migrations no projeto: $totalMigrations" -ForegroundColor Cyan

# Migrations críticas que DEVEM estar em produção
$criticalMigrations = @(
  "1728518400000-CreateAtendimentoTables.ts",
  "1744690800000-CreateContatosTable.ts",
  "1744828200000-AddContatoFotoToAtendimentoTickets.ts",
  "1745017600000-CreateTriagemBotNucleosTables.ts",
  "1745022000000-CreateEquipesAtribuicoesTables.ts",
  "1761180000000-CreateNotasClienteClean.ts",
  "1761180100000-CreateDemandasClean.ts",
  "1761582305362-AddHistoricoVersoes.ts",
  "1761582400000-AddHistoricoVersoesFluxo.ts",
  "1762190000000-AddStatusAtendenteToUsers.ts",
  "1762216500000-AddDeveTrocarSenhaFlagToUsers.ts",
  "1762220000000-CreatePasswordResetTokens.ts",
  "1762211047321-CreateEmpresaConfiguracoes.ts",
  "1762212773553-AddPhase1ConfigFields.ts",
  "1762214400000-UpdateOportunidadeClienteIdToUuid.ts",
  "1762305000000-RemoveChatwootFromAtendimento.ts"
)

Write-Host ""
Write-Host "⚠️  MIGRATIONS CRÍTICAS PARA PRODUÇÃO:" -ForegroundColor Yellow
Write-Host "═══════════════════════════════════════════════════" -ForegroundColor DarkGray

$missing = @()
foreach ($migration in $criticalMigrations) {
  $exists = Test-Path "backend/src/migrations/$migration"
    
  if ($exists) {
    Write-Host "   ✅ $migration" -ForegroundColor Green
  }
  else {
    Write-Host "   ❌ $migration (FALTANDO!)" -ForegroundColor Red
    $missing += $migration
  }
}

Write-Host ""
Write-Host "═══════════════════════════════════════════════════" -ForegroundColor DarkGray

if ($missing.Count -gt 0) {
  Write-Host ""
  Write-Host "🚨 ATENÇÃO: $($missing.Count) migrations críticas estão faltando!" -ForegroundColor Red
  Write-Host ""
  Write-Host "Migrations faltando:" -ForegroundColor Yellow
  foreach ($m in $missing) {
    Write-Host "   • $m" -ForegroundColor Red
  }
  Write-Host ""
  Write-Host "⚠️  NÃO FAÇA DEPLOY PARA PRODUÇÃO ATÉ RESOLVER ISSO!" -ForegroundColor Red
  exit 1
}
else {
  Write-Host ""
  Write-Host "✅ Todas as migrations críticas estão presentes!" -ForegroundColor Green
  Write-Host ""
  Write-Host "📋 Próximos passos:" -ForegroundColor Yellow
  Write-Host "   1. Configurar .env.production" -ForegroundColor Cyan
  Write-Host "   2. Criar backup do banco de produção" -ForegroundColor Cyan
  Write-Host "   3. Executar: npm run migration:run" -ForegroundColor Cyan
  Write-Host "   4. Validar estrutura do banco" -ForegroundColor Cyan
  Write-Host "   5. Aplicar seed data" -ForegroundColor Cyan
  Write-Host ""
}

# Verificar se há arquivo .env.production
if (Test-Path "backend/.env.production") {
  Write-Host "✅ Arquivo .env.production encontrado" -ForegroundColor Green
}
else {
  Write-Host "⚠️  Arquivo .env.production NÃO encontrado!" -ForegroundColor Yellow
  Write-Host "   Copie de: backend/.env.production.example" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "═══════════════════════════════════════════════════" -ForegroundColor DarkGray
Write-Host "✅ Verificação concluída!" -ForegroundColor Green
Write-Host ""
