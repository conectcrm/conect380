#!/usr/bin/env pwsh
# Script PowerShell para executar todo o processo de deploy em produção
# Uso: .\scripts\deploy-to-production.ps1

param(
  [switch]$SkipBackup,
  [switch]$DryRun,
  [switch]$Force
)

$ErrorActionPreference = "Stop"

function Write-Header {
  param([string]$Text)
  Write-Host ""
  Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor DarkCyan
  Write-Host "  $Text" -ForegroundColor Yellow
  Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor DarkCyan
  Write-Host ""
}

function Write-Step {
  param([string]$Text)
  Write-Host "📋 $Text" -ForegroundColor Cyan
}

function Write-Success {
  param([string]$Text)
  Write-Host "✅ $Text" -ForegroundColor Green
}

function Write-Warning {
  param([string]$Text)
  Write-Host "⚠️  $Text" -ForegroundColor Yellow
}

function Write-Error-Message {
  param([string]$Text)
  Write-Host "❌ $Text" -ForegroundColor Red
}

function Confirm-Action {
  param([string]$Message)
    
  if ($Force) {
    return $true
  }
    
  $response = Read-Host "$Message (s/N)"
  return $response -eq "s" -or $response -eq "S"
}

# ═══════════════════════════════════════════════════════════════
# INÍCIO DO SCRIPT
# ═══════════════════════════════════════════════════════════════

Write-Header "🚀 DEPLOY PARA PRODUÇÃO - ConectCRM"

if ($DryRun) {
  Write-Warning "Modo DRY RUN - Nenhuma alteração será feita"
  Write-Host ""
}

# ═══════════════════════════════════════════════════════════════
# PASSO 1: Verificações Pré-Deploy
# ═══════════════════════════════════════════════════════════════

Write-Header "PASSO 1: Verificações Pré-Deploy"

Write-Step "Verificando migrations críticas..."
.\scripts\check-production-migrations.ps1
if ($LASTEXITCODE -ne 0) {
  Write-Error-Message "Migrations incompletas! Resolva antes de continuar."
  exit 1
}

Write-Step "Verificando arquivo .env.production..."
if (-not (Test-Path "backend\.env.production")) {
  Write-Error-Message "Arquivo backend\.env.production não encontrado!"
  Write-Host ""
  Write-Host "Crie o arquivo copiando do template:"
  Write-Host "  cp backend\.env.production.example backend\.env.production" -ForegroundColor White
  Write-Host ""
  exit 1
}
Write-Success "Arquivo .env.production encontrado"

Write-Step "Verificando seed data SQL..."
if (-not (Test-Path "backend\seed-production-data.sql")) {
  Write-Error-Message "Arquivo seed-production-data.sql não encontrado!"
  exit 1
}
Write-Success "Script SQL encontrado"

Write-Host ""

# ═══════════════════════════════════════════════════════════════
# PASSO 2: Teste de Conexão
# ═══════════════════════════════════════════════════════════════

Write-Header "PASSO 2: Teste de Conexão com Banco"

if (-not $DryRun) {
  Write-Step "Testando conexão com banco de produção..."
  Set-Location backend
  node scripts\test-db-connection.js
  if ($LASTEXITCODE -ne 0) {
    Write-Error-Message "Falha na conexão com banco!"
    Set-Location ..
    exit 1
  }
  Set-Location ..
  Write-Success "Conexão OK"
}

Write-Host ""

# ═══════════════════════════════════════════════════════════════
# PASSO 3: Backup
# ═══════════════════════════════════════════════════════════════

if (-not $SkipBackup) {
  Write-Header "PASSO 3: Backup do Banco"
    
  Write-Warning "IMPORTANTE: Crie um backup/snapshot do banco ANTES de continuar!"
  Write-Host ""
  Write-Host "Para AWS RDS:" -ForegroundColor Cyan
  Write-Host "  aws rds create-db-snapshot --db-instance-identifier conectcrm-production --db-snapshot-identifier backup-$(Get-Date -Format 'yyyyMMdd-HHmmss')" -ForegroundColor White
  Write-Host ""
  Write-Host "Para PostgreSQL local:" -ForegroundColor Cyan
  Write-Host "  pg_dump -h HOST -U USER -d conectcrm_production -F c -f backup_$(Get-Date -Format 'yyyyMMdd_HHmmss').dump" -ForegroundColor White
  Write-Host ""
    
  if (-not (Confirm-Action "Backup foi criado?")) {
    Write-Warning "Deploy cancelado pelo usuário"
    exit 0
  }
    
  Write-Success "Backup confirmado"
  Write-Host ""
}

# ═══════════════════════════════════════════════════════════════
# PASSO 4: Executar Migrations
# ═══════════════════════════════════════════════════════════════

Write-Header "PASSO 4: Executar Migrations"

if (-not (Confirm-Action "Executar migrations em PRODUÇÃO?")) {
  Write-Warning "Deploy cancelado pelo usuário"
  exit 0
}

if (-not $DryRun) {
  Write-Step "Definindo ambiente de produção..."
  $env:NODE_ENV = "production"
    
  Write-Step "Executando migrations..."
  Set-Location backend
  npm run migration:run
  if ($LASTEXITCODE -ne 0) {
    Write-Error-Message "Erro ao executar migrations!"
    Set-Location ..
        
    Write-Host ""
    Write-Warning "Para reverter:"
    Write-Host "  cd backend && npm run migration:revert" -ForegroundColor White
    Write-Host ""
    exit 1
  }
  Set-Location ..
  Write-Success "Migrations executadas com sucesso"
}

Write-Host ""

# ═══════════════════════════════════════════════════════════════
# PASSO 5: Aplicar Seed Data
# ═══════════════════════════════════════════════════════════════

Write-Header "PASSO 5: Aplicar Seed Data"

if (-not (Confirm-Action "Aplicar dados iniciais (seed data)?")) {
  Write-Warning "Seed data ignorado"
}
else {
  if (-not $DryRun) {
    Write-Step "Aplicando seed data..."
        
    # Verificar se psql está disponível
    $psqlAvailable = Get-Command psql -ErrorAction SilentlyContinue
        
    if ($psqlAvailable) {
      # Usar psql se disponível
      Write-Host "Usando psql..." -ForegroundColor DarkGray
      # Usuário deve executar manualmente com credenciais
      Write-Warning "Execute manualmente:"
      Write-Host "  psql -h HOST -U USER -d conectcrm_production < backend\seed-production-data.sql" -ForegroundColor White
    }
    else {
      # Usar Node.js como fallback
      Write-Host "psql não encontrado, usando Node.js..." -ForegroundColor DarkGray
      Set-Location backend
            
      $seedScript = @"
const fs = require('fs');
const { Client } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env.production') });

const client = new Client({
  host: process.env.DATABASE_HOST,
  port: parseInt(process.env.DATABASE_PORT || '5432'),
  user: process.env.DATABASE_USERNAME,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
  ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

client.connect().then(() => {
  const sql = fs.readFileSync('seed-production-data.sql', 'utf8');
  return client.query(sql);
}).then(() => {
  console.log('✅ Seed data aplicado com sucesso!');
  return client.end();
}).catch((err) => {
  console.error('❌ Erro:', err.message);
  client.end();
  process.exit(1);
});
"@
            
      $seedScript | Out-File -FilePath "temp-seed.js" -Encoding UTF8
      node temp-seed.js
      Remove-Item temp-seed.js -Force
            
      Set-Location ..
    }
        
    Write-Success "Seed data processado"
  }
}

Write-Host ""

# ═══════════════════════════════════════════════════════════════
# PASSO 6: Criar Usuário Admin
# ═══════════════════════════════════════════════════════════════

Write-Header "PASSO 6: Criar Usuário Admin"

if (-not (Confirm-Action "Criar usuário admin?")) {
  Write-Warning "Criação de admin ignorada"
}
else {
  if (-not $DryRun) {
    Set-Location backend
    node scripts\create-admin-user.js
    Set-Location ..
  }
}

Write-Host ""

# ═══════════════════════════════════════════════════════════════
# PASSO 7: Validação Final
# ═══════════════════════════════════════════════════════════════

Write-Header "PASSO 7: Validação Final"

Write-Step "Checklist de validação:"
Write-Host "  [ ] Migrations executadas sem erros" -ForegroundColor White
Write-Host "  [ ] Seed data aplicado" -ForegroundColor White
Write-Host "  [ ] Usuário admin criado" -ForegroundColor White
Write-Host "  [ ] Backend inicia sem erros" -ForegroundColor White
Write-Host "  [ ] Login funciona" -ForegroundColor White
Write-Host ""

Write-Success "Deploy em produção concluído!"
Write-Host ""
Write-Host "🚀 Próximos passos:" -ForegroundColor Yellow
Write-Host "   1. Inicie o backend: cd backend && npm run start:prod" -ForegroundColor White
Write-Host "   2. Teste o login via API" -ForegroundColor White
Write-Host "   3. Verifique os logs" -ForegroundColor White
Write-Host "   4. Deploy do frontend" -ForegroundColor White
Write-Host ""
Write-Host "📖 Documentação completa: ESTRATEGIA_DEPLOY_PRODUCAO.md" -ForegroundColor Cyan
Write-Host ""
