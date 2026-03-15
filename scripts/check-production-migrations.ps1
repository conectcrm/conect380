# Production migration presence check.
# Usage: powershell -File .\scripts\check-production-migrations.ps1

param(
  [string]$Environment = "production"
)

$ErrorActionPreference = "Stop"

function Write-Rule {
  Write-Host ("-" * 68) -ForegroundColor DarkGray
}

Write-Host ("[check-migrations] Environment: {0}" -f $Environment) -ForegroundColor Yellow
Write-Rule

if (-not (Test-Path "backend/src/migrations")) {
  Write-Host "[FAIL] Run this script from repository root." -ForegroundColor Red
  exit 1
}

$totalMigrations = (Get-ChildItem "backend/src/migrations/*.ts" -ErrorAction SilentlyContinue).Count
Write-Host ("[INFO] Total migrations found: {0}" -f $totalMigrations) -ForegroundColor Cyan

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
Write-Host "[INFO] Critical migrations required:" -ForegroundColor Yellow
Write-Rule

$missing = New-Object System.Collections.Generic.List[string]

foreach ($migration in $criticalMigrations) {
  $path = "backend/src/migrations/$migration"
  if (Test-Path $path) {
    Write-Host ("  [OK] {0}" -f $migration) -ForegroundColor Green
  }
  else {
    Write-Host ("  [MISSING] {0}" -f $migration) -ForegroundColor Red
    $missing.Add($migration)
  }
}

Write-Host ""
Write-Rule

if ($missing.Count -gt 0) {
  Write-Host ("[FAIL] Missing {0} critical migrations." -f $missing.Count) -ForegroundColor Red
  foreach ($item in $missing) {
    Write-Host ("  - {0}" -f $item) -ForegroundColor Red
  }
  exit 1
}

Write-Host "[OK] All critical migrations are present." -ForegroundColor Green

if (Test-Path "backend/.env.production") {
  Write-Host "[OK] backend/.env.production found." -ForegroundColor Green
}
else {
  Write-Host "[WARN] backend/.env.production not found." -ForegroundColor Yellow
  Write-Host "       Copy from backend/.env.production.example and set real values." -ForegroundColor White
}

Write-Host ""
Write-Host "[check-migrations] Completed." -ForegroundColor Green
exit 0
