#!/usr/bin/env pwsh
# Deploy helper for production rollout.
# Usage:
#   .\scripts\deploy-to-production.ps1
#   .\scripts\deploy-to-production.ps1 -DryRun -Force

param(
  [switch]$SkipBackup,
  [switch]$DryRun,
  [switch]$Force
)

$ErrorActionPreference = "Stop"

function Write-Header {
  param([string]$Text)
  Write-Host ""
  Write-Host ("=" * 72) -ForegroundColor DarkCyan
  Write-Host ("  {0}" -f $Text) -ForegroundColor Yellow
  Write-Host ("=" * 72) -ForegroundColor DarkCyan
  Write-Host ""
}

function Write-Step {
  param([string]$Text)
  Write-Host ("[STEP] {0}" -f $Text) -ForegroundColor Cyan
}

function Write-Success {
  param([string]$Text)
  Write-Host ("[OK] {0}" -f $Text) -ForegroundColor Green
}

function Write-Warn {
  param([string]$Text)
  Write-Host ("[WARN] {0}" -f $Text) -ForegroundColor Yellow
}

function Write-Fail {
  param([string]$Text)
  Write-Host ("[FAIL] {0}" -f $Text) -ForegroundColor Red
}

function Confirm-Action {
  param([string]$Message)

  if ($Force -or $DryRun) {
    return $true
  }

  $response = Read-Host ("{0} (s/N)" -f $Message)
  return $response -eq "s" -or $response -eq "S"
}

function Invoke-Step {
  param(
    [string]$Description,
    [scriptblock]$Action
  )

  Write-Step $Description
  & $Action
}

function Assert-Exists {
  param(
    [string]$Path,
    [string]$Message
  )

  if (-not (Test-Path $Path)) {
    Write-Fail $Message
    exit 1
  }
}

Write-Header "DEPLOY PARA PRODUCAO - Conect360"

if ($DryRun) {
  Write-Warn "DryRun ativo. Nenhuma alteracao de banco sera aplicada."
}

Write-Header "PASSO 1 - PRECHECKS"

Invoke-Step "Validar migrations criticas" {
  & .\scripts\check-production-migrations.ps1
  if ($LASTEXITCODE -ne 0) {
    Write-Fail "Migrations incompletas. Corrija antes do deploy."
    exit 1
  }
}

if (Test-Path "backend\.env.production") {
  Write-Success "backend\.env.production encontrado"
}
elseif ($DryRun) {
  Write-Warn "DryRun: backend\.env.production ausente (bloqueia apenas deploy real)."
}
else {
  Write-Fail "Arquivo backend\.env.production nao encontrado."
  exit 1
}

if (Test-Path "backend\seed-production-data.sql") {
  Write-Success "backend\seed-production-data.sql encontrado"
}
elseif ($DryRun) {
  Write-Warn "DryRun: backend\seed-production-data.sql ausente (verificar no go-live real)."
}
else {
  Write-Fail "Arquivo backend\seed-production-data.sql nao encontrado."
  exit 1
}

Write-Header "PASSO 2 - CONEXAO COM BANCO"

if (-not $DryRun) {
  Invoke-Step "Testar conexao do backend com banco de producao" {
    Push-Location backend
    try {
      node scripts\check-db-connection.js
      if ($LASTEXITCODE -ne 0) {
        Write-Fail "Falha na conexao com banco."
        exit 1
      }
    }
    finally {
      Pop-Location
    }
  }
  Write-Success "Conexao com banco validada"
}
else {
  Write-Warn "DryRun: teste de conexao ignorado."
}

if (-not $SkipBackup) {
  Write-Header "PASSO 3 - BACKUP"
  Write-Warn "Crie backup/snapshot ANTES de continuar."
  Write-Host ""
  Write-Host "AWS RDS exemplo:" -ForegroundColor Cyan
  Write-Host "  aws rds create-db-snapshot --db-instance-identifier conectcrm-production --db-snapshot-identifier backup-$(Get-Date -Format 'yyyyMMdd-HHmmss')" -ForegroundColor White
  Write-Host ""
  Write-Host "PostgreSQL exemplo:" -ForegroundColor Cyan
  Write-Host "  pg_dump -h HOST -U USER -d conectcrm_production -F c -f backup_$(Get-Date -Format 'yyyyMMdd_HHmmss').dump" -ForegroundColor White
  Write-Host ""

  if (-not (Confirm-Action "Backup concluido")) {
    Write-Warn "Deploy cancelado pelo usuario."
    exit 0
  }
  Write-Success "Backup confirmado"
}

Write-Header "PASSO 4 - MIGRATIONS"

if (-not (Confirm-Action "Executar migrations em PRODUCAO")) {
  Write-Warn "Deploy cancelado pelo usuario."
  exit 0
}

if (-not $DryRun) {
  Invoke-Step "Executar migrations" {
    $env:NODE_ENV = "production"
    Push-Location backend
    try {
      npm run migration:run
      if ($LASTEXITCODE -ne 0) {
        Write-Fail "Falha ao executar migrations."
        Write-Host "Rollback sugerido: cd backend; npm run migration:revert" -ForegroundColor White
        exit 1
      }
    }
    finally {
      Pop-Location
    }
  }
  Write-Success "Migrations aplicadas"
}
else {
  Write-Warn "DryRun: migrations nao executadas."
}

Write-Header "PASSO 5 - SEED"

if (Confirm-Action "Aplicar seed data") {
  if (-not $DryRun) {
    $psql = Get-Command psql -ErrorAction SilentlyContinue

    if ($psql) {
      Write-Warn "psql encontrado. Execute com credenciais de producao:"
      Write-Host '  psql -h HOST -U USER -d conectcrm_production -f backend\seed-production-data.sql' -ForegroundColor White
    }
    else {
      Write-Warn "psql nao encontrado. Seed deve ser aplicado manualmente."
      Write-Host '  Use um cliente SQL e rode backend\seed-production-data.sql no banco alvo.' -ForegroundColor White
    }

    Write-Success "Passo de seed orientado"
  }
  else {
    Write-Warn "DryRun: seed nao aplicado."
  }
}
else {
  Write-Warn "Seed ignorado."
}

Write-Header "PASSO 6 - ADMIN"

if (Confirm-Action "Executar script de criacao/ajuste de admin") {
  if (-not $DryRun) {
    Push-Location backend
    try {
      node scripts\create-admin-user.js
      if ($LASTEXITCODE -ne 0) {
        Write-Fail "Falha ao executar create-admin-user.js"
        exit 1
      }
    }
    finally {
      Pop-Location
    }
  }
  else {
    Write-Warn "DryRun: script de admin nao executado."
  }
}
else {
  Write-Warn "Passo de admin ignorado."
}

Write-Header "PASSO 7 - CHECKLIST FINAL"
Write-Host "  [ ] Migrations aplicadas sem erro" -ForegroundColor White
Write-Host "  [ ] Seed aplicado (se necessario)" -ForegroundColor White
Write-Host "  [ ] Admin validado" -ForegroundColor White
Write-Host "  [ ] Backend sobe sem erro" -ForegroundColor White
Write-Host "  [ ] Login funcional" -ForegroundColor White
Write-Host ""

Write-Success "Fluxo de deploy finalizado."
Write-Host ""
Write-Host "Proximos passos operacionais:" -ForegroundColor Yellow
Write-Host "  1. cd backend; npm run start:prod" -ForegroundColor White
Write-Host "  2. validar /health e /auth/login" -ForegroundColor White
Write-Host "  3. publicar frontend no ambiente alvo" -ForegroundColor White
Write-Host ""
