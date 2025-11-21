#!/usr/bin/env pwsh
# ============================================
# Script: Validar Configuração de Produção
# ============================================
# Verifica se todas as configurações estão corretas
# ANTES de fazer o deploy
#
# Uso: .\validar-config-producao.ps1
# ============================================

$ErrorActionPreference = "Continue"

# ═══════════════════════════════════════════════════════════════
# FUNÇÕES AUXILIARES
# ═══════════════════════════════════════════════════════════════

function Write-Header {
    param([string]$Text)
    Write-Host ""
    Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor DarkCyan
    Write-Host "  $Text" -ForegroundColor Yellow
    Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor DarkCyan
    Write-Host ""
}

function Write-Check {
    param([string]$Text)
    Write-Host "🔍 $Text" -ForegroundColor Cyan
}

function Write-Pass {
    param([string]$Text)
    Write-Host "✅ $Text" -ForegroundColor Green
}

function Write-Fail {
    param([string]$Text)
    Write-Host "❌ $Text" -ForegroundColor Red
}

function Write-Warning {
    param([string]$Text)
    Write-Host "⚠️  $Text" -ForegroundColor Yellow
}

function Write-Info {
    param([string]$Text)
    Write-Host "ℹ️  $Text" -ForegroundColor Gray
}

# ═══════════════════════════════════════════════════════════════
# VARIÁVEIS GLOBAIS
# ═══════════════════════════════════════════════════════════════

$script:errorCount = 0
$script:warningCount = 0
$script:checkCount = 0

function Add-Error {
    $script:errorCount++
}

function Add-Warning {
    $script:warningCount++
}

function Add-Check {
    $script:checkCount++
}

# ═══════════════════════════════════════════════════════════════
# INÍCIO DO SCRIPT
# ═══════════════════════════════════════════════════════════════

Write-Header "🔍 VALIDAÇÃO DE CONFIGURAÇÃO DE PRODUÇÃO"

# ═══════════════════════════════════════════════════════════════
# CHECK 1: Arquivo .env.production existe
# ═══════════════════════════════════════════════════════════════

Write-Header "CHECK 1: Arquivo .env.production"

Write-Check "Verificando existência do arquivo..."
Add-Check

if (Test-Path "backend\.env.production") {
    Write-Pass "Arquivo backend\.env.production encontrado"
    
    # Ler arquivo
    $envContent = Get-Content "backend\.env.production" -Raw
    
    # ═══════════════════════════════════════════════════════════════
    # CHECK 2: Banco de Dados NÃO é localhost:5434
    # ═══════════════════════════════════════════════════════════════
    
    Write-Header "CHECK 2: Configuração de Banco de Dados"
    
    Write-Check "Verificando DATABASE_HOST..."
    Add-Check
    if ($envContent -match 'DATABASE_HOST=(.+)') {
        $dbHost = $matches[1].Trim()
        Write-Info "DATABASE_HOST = $dbHost"
        
        if ($dbHost -eq "localhost" -or $dbHost -match "5434") {
            Write-Fail "❌ CRÍTICO: DATABASE_HOST aponta para banco de DEV!"
            Write-Host "   Atual: $dbHost" -ForegroundColor Red
            Write-Host "   Esperado: IP/hostname do banco de PRODUÇÃO" -ForegroundColor Yellow
            Add-Error
        } else {
            Write-Pass "DATABASE_HOST configurado para produção"
        }
    } else {
        Write-Fail "DATABASE_HOST não encontrado"
        Add-Error
    }
    
    Write-Check "Verificando DATABASE_PORT..."
    Add-Check
    if ($envContent -match 'DATABASE_PORT=(.+)') {
        $dbPort = $matches[1].Trim()
        Write-Info "DATABASE_PORT = $dbPort"
        
        if ($dbPort -eq "5434") {
            Write-Fail "❌ CRÍTICO: DATABASE_PORT é 5434 (porta de DEV)!"
            Write-Host "   Esperado: 5432 (porta padrão PostgreSQL)" -ForegroundColor Yellow
            Add-Error
        } else {
            Write-Pass "DATABASE_PORT correto"
        }
    } else {
        Write-Fail "DATABASE_PORT não encontrado"
        Add-Error
    }
    
    Write-Check "Verificando DATABASE_NAME..."
    Add-Check
    if ($envContent -match 'DATABASE_NAME=(.+)') {
        $dbName = $matches[1].Trim()
        Write-Info "DATABASE_NAME = $dbName"
        
        if ($dbName -match "_db$" -or $dbName -match "dev" -or $dbName -match "test") {
            Write-Warning "DATABASE_NAME parece ser de desenvolvimento"
            Write-Host "   Atual: $dbName" -ForegroundColor Yellow
            Write-Host "   Sugerido: conectcrm_production" -ForegroundColor Cyan
            Add-Warning
        } else {
            Write-Pass "DATABASE_NAME adequado para produção"
        }
    } else {
        Write-Fail "DATABASE_NAME não encontrado"
        Add-Error
    }
    
    # ═══════════════════════════════════════════════════════════════
    # CHECK 3: NODE_ENV e APP_ENV
    # ═══════════════════════════════════════════════════════════════
    
    Write-Header "CHECK 3: Ambiente da Aplicação"
    
    Write-Check "Verificando NODE_ENV..."
    Add-Check
    if ($envContent -match 'NODE_ENV=(.+)') {
        $nodeEnv = $matches[1].Trim()
        Write-Info "NODE_ENV = $nodeEnv"
        
        if ($nodeEnv -ne "production") {
            Write-Fail "NODE_ENV deve ser 'production'"
            Write-Host "   Atual: $nodeEnv" -ForegroundColor Red
            Add-Error
        } else {
            Write-Pass "NODE_ENV correto"
        }
    } else {
        Write-Fail "NODE_ENV não encontrado"
        Add-Error
    }
    
    Write-Check "Verificando APP_ENV..."
    Add-Check
    if ($envContent -match 'APP_ENV=(.+)') {
        $appEnv = $matches[1].Trim()
        Write-Info "APP_ENV = $appEnv"
        
        if ($appEnv -ne "production") {
            Write-Fail "APP_ENV deve ser 'production'"
            Write-Host "   Atual: $appEnv" -ForegroundColor Red
            Add-Error
        } else {
            Write-Pass "APP_ENV correto"
        }
    } else {
        Write-Warning "APP_ENV não encontrado (opcional)"
        Add-Warning
    }
    
    # ═══════════════════════════════════════════════════════════════
    # CHECK 4: JWT Secrets
    # ═══════════════════════════════════════════════════════════════
    
    Write-Header "CHECK 4: JWT Secrets"
    
    Write-Check "Verificando JWT_SECRET..."
    Add-Check
    if ($envContent -match 'JWT_SECRET=(.+)') {
        $jwtSecret = $matches[1].Trim()
        
        if ($jwtSecret -match "seu_jwt_secret" -or $jwtSecret -match "GERAR" -or $jwtSecret.Length -lt 32) {
            Write-Fail "JWT_SECRET fraco ou não gerado!"
            Write-Host "   Use: [Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))" -ForegroundColor Yellow
            Add-Error
        } else {
            Write-Pass "JWT_SECRET configurado (comprimento: $($jwtSecret.Length))"
        }
    } else {
        Write-Fail "JWT_SECRET não encontrado"
        Add-Error
    }
    
    Write-Check "Verificando JWT_REFRESH_SECRET..."
    Add-Check
    if ($envContent -match 'JWT_REFRESH_SECRET=(.+)') {
        $jwtRefreshSecret = $matches[1].Trim()
        
        if ($jwtRefreshSecret -match "seu_refresh_secret" -or $jwtRefreshSecret -match "GERAR" -or $jwtRefreshSecret.Length -lt 32) {
            Write-Fail "JWT_REFRESH_SECRET fraco ou não gerado!"
            Add-Error
        } else {
            Write-Pass "JWT_REFRESH_SECRET configurado"
        }
    } else {
        Write-Fail "JWT_REFRESH_SECRET não encontrado"
        Add-Error
    }
    
    # ═══════════════════════════════════════════════════════════════
    # CHECK 5: CORS Origins
    # ═══════════════════════════════════════════════════════════════
    
    Write-Header "CHECK 5: CORS Origins"
    
    Write-Check "Verificando CORS_ORIGINS..."
    Add-Check
    if ($envContent -match 'CORS_ORIGINS=(.+)') {
        $corsOrigins = $matches[1].Trim()
        Write-Info "CORS_ORIGINS = $corsOrigins"
        
        if ($corsOrigins -match "localhost") {
            Write-Warning "CORS_ORIGINS contém 'localhost'"
            Write-Host "   Em produção, use apenas URLs públicas (https://)" -ForegroundColor Yellow
            Add-Warning
        } else {
            Write-Pass "CORS_ORIGINS sem localhost"
        }
        
        if ($corsOrigins -notmatch "https://") {
            Write-Warning "CORS_ORIGINS não usa HTTPS"
            Add-Warning
        }
    } else {
        Write-Fail "CORS_ORIGINS não encontrado"
        Add-Error
    }
    
    # ═══════════════════════════════════════════════════════════════
    # CHECK 6: Frontend URL
    # ═══════════════════════════════════════════════════════════════
    
    Write-Header "CHECK 6: Frontend URL"
    
    Write-Check "Verificando FRONTEND_URL..."
    Add-Check
    if ($envContent -match 'FRONTEND_URL=(.+)') {
        $frontendUrl = $matches[1].Trim()
        Write-Info "FRONTEND_URL = $frontendUrl"
        
        if ($frontendUrl -match "localhost") {
            Write-Fail "FRONTEND_URL aponta para localhost!"
            Write-Host "   Use a URL pública de produção (https://)" -ForegroundColor Red
            Add-Error
        } else {
            Write-Pass "FRONTEND_URL configurado para produção"
        }
    } else {
        Write-Fail "FRONTEND_URL não encontrado"
        Add-Error
    }
    
    # ═══════════════════════════════════════════════════════════════
    # CHECK 7: Email Configuration
    # ═══════════════════════════════════════════════════════════════
    
    Write-Header "CHECK 7: Configuração de Email"
    
    Write-Check "Verificando SMTP_HOST..."
    Add-Check
    if ($envContent -match 'SMTP_HOST=(.+)') {
        $smtpHost = $matches[1].Trim()
        Write-Info "SMTP_HOST = $smtpHost"
        Write-Pass "SMTP_HOST configurado"
    } else {
        Write-Warning "SMTP_HOST não encontrado (email pode não funcionar)"
        Add-Warning
    }
    
    # ═══════════════════════════════════════════════════════════════
    # CHECK 8: WhatsApp Configuration
    # ═══════════════════════════════════════════════════════════════
    
    Write-Header "CHECK 8: Configuração de WhatsApp"
    
    Write-Check "Verificando WHATSAPP_ACCESS_TOKEN..."
    Add-Check
    if ($envContent -match 'WHATSAPP_ACCESS_TOKEN=(.+)') {
        $waToken = $matches[1].Trim()
        if ($waToken.Length -gt 50) {
            Write-Pass "WHATSAPP_ACCESS_TOKEN configurado"
        } else {
            Write-Warning "WHATSAPP_ACCESS_TOKEN parece incompleto"
            Add-Warning
        }
    } else {
        Write-Warning "WHATSAPP_ACCESS_TOKEN não encontrado"
        Add-Warning
    }
    
} else {
    Write-Fail "❌ CRÍTICO: Arquivo backend\.env.production NÃO ENCONTRADO!"
    Write-Host ""
    Write-Host "Crie o arquivo:" -ForegroundColor Yellow
    Write-Host "  cd backend"
    Write-Host "  cp .env.production.example .env.production"
    Write-Host "  # Edite o arquivo com as configurações de produção"
    Write-Host ""
    Add-Error
}

# ═══════════════════════════════════════════════════════════════
# CHECK 9: Docker Compose File
# ═══════════════════════════════════════════════════════════════

Write-Header "CHECK 9: Docker Compose"

Write-Check "Verificando docker-compose.prod.yml..."
Add-Check
if (Test-Path "docker-compose.prod.yml") {
    Write-Pass "docker-compose.prod.yml encontrado"
    
    $composeContent = Get-Content "docker-compose.prod.yml" -Raw
    
    # Verificar se usa .env.production
    if ($composeContent -match "\.env\.production") {
        Write-Pass "docker-compose configurado para usar .env.production"
    } else {
        Write-Warning "docker-compose pode não estar usando .env.production"
        Write-Host "   Verifique a linha 'env_file:' no arquivo" -ForegroundColor Yellow
        Add-Warning
    }
} else {
    Write-Warning "docker-compose.prod.yml não encontrado"
    Add-Warning
}

# ═══════════════════════════════════════════════════════════════
# CHECK 10: Migrations
# ═══════════════════════════════════════════════════════════════

Write-Header "CHECK 10: Migrations"

Write-Check "Verificando migrations..."
Add-Check
$migrationFiles = Get-ChildItem -Path "backend\src\migrations" -Filter "*.ts" -ErrorAction SilentlyContinue

if ($migrationFiles) {
    Write-Pass "$($migrationFiles.Count) migrations encontradas"
    Write-Info "Lembre-se de rodar: npm run migration:run no ambiente de produção"
} else {
    Write-Warning "Nenhuma migration encontrada"
    Add-Warning
}

# ═══════════════════════════════════════════════════════════════
# RESUMO FINAL
# ═══════════════════════════════════════════════════════════════

Write-Header "RESUMO DA VALIDAÇÃO"

Write-Host "Total de verificações: $script:checkCount" -ForegroundColor Cyan
Write-Host ""

if ($script:errorCount -gt 0) {
    Write-Host "❌ ERROS CRÍTICOS: $script:errorCount" -ForegroundColor Red
    Write-Host "   🚫 NÃO FAÇA DEPLOY ATÉ CORRIGIR OS ERROS!" -ForegroundColor Red
    Write-Host ""
}

if ($script:warningCount -gt 0) {
    Write-Host "⚠️  Avisos: $script:warningCount" -ForegroundColor Yellow
    Write-Host "   Revise os avisos antes de fazer deploy" -ForegroundColor Yellow
    Write-Host ""
}

if ($script:errorCount -eq 0 -and $script:warningCount -eq 0) {
    Write-Host "✅ TUDO OK! Configuração pronta para produção!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Próximos passos:" -ForegroundColor Cyan
    Write-Host "  1. Preparar banco de produção (criar database + migrations)"
    Write-Host "  2. Fazer deploy: docker-compose -f docker-compose.prod.yml up -d"
    Write-Host "  3. Validar: docker-compose logs -f"
    Write-Host ""
} elseif ($script:errorCount -eq 0) {
    Write-Host "⚠️  Configuração OK, mas há avisos para revisar" -ForegroundColor Yellow
    Write-Host ""
} else {
    Write-Host "❌ Corrija os erros críticos antes de prosseguir!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Checklist de correção:" -ForegroundColor Yellow
    Write-Host "  [ ] DATABASE_HOST = IP/hostname de PRODUÇÃO (não localhost)"
    Write-Host "  [ ] DATABASE_PORT = 5432 (não 5434)"
    Write-Host "  [ ] DATABASE_NAME = conectcrm_production (ou similar)"
    Write-Host "  [ ] NODE_ENV = production"
    Write-Host "  [ ] APP_ENV = production"
    Write-Host "  [ ] JWT_SECRET gerado (32+ caracteres)"
    Write-Host "  [ ] JWT_REFRESH_SECRET gerado"
    Write-Host "  [ ] CORS_ORIGINS sem localhost"
    Write-Host "  [ ] FRONTEND_URL sem localhost"
    Write-Host ""
    exit 1
}

Write-Host "📚 Guia completo: GUIA_REMOVER_DEPLOY_QUEBRADO.md" -ForegroundColor Cyan
Write-Host ""
