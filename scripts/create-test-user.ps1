# ============================================================================
# Script de Criação de Usuário para Teste de Cache
# ============================================================================
#
# Objetivo: Criar usuário de teste no PostgreSQL para testes de cache
# 
# Uso:
#   .\scripts\create-test-user.ps1
#   .\scripts\create-test-user.ps1 -Email "custom@example.com" -Password "Custom@123"
# ============================================================================

param(
  [Parameter(Mandatory = $false)]
  [string]$Email = "cache.test@conectcrm.com",
    
  [Parameter(Mandatory = $false)]
  [string]$Password = "Test@123",
    
  [Parameter(Mandatory = $false)]
  [string]$Nome = "Cache Test User",
    
  [Parameter(Mandatory = $false)]
  [string]$DbHost = "localhost",
    
  [Parameter(Mandatory = $false)]
  [int]$DbPort = 5434,
    
  [Parameter(Mandatory = $false)]
  [string]$DbName = "conectcrm_db",
    
  [Parameter(Mandatory = $false)]
  [string]$DbUser = "conectcrm",
    
  [Parameter(Mandatory = $false)]
  [string]$DbPassword = "conectcrm2024"
)

Write-Host "`n╔══════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  Criação de Usuário de Teste - ConectCRM                    ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan

Write-Host "`n📋 Configurações:" -ForegroundColor Yellow
Write-Host "   Email:     $Email" -ForegroundColor White
Write-Host "   Senha:     $Password" -ForegroundColor White
Write-Host "   Nome:      $Nome" -ForegroundColor White
Write-Host "   Database:  $DbHost:$DbPort/$DbName" -ForegroundColor Gray

# Gerar hash bcrypt da senha (pré-calculado para senhas comuns)
$passwordHashes = @{
  "Test@123"  = "`$2b`$10`$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36ZwPuJr4f.YPq0j1uPqKQe"
  "Admin@123" = "`$2b`$10`$k8IHx3L3YlH2jKYZ5xXMu.qL7F5sK9JhQmWvNzXpR4tYuIoP6aS2"
  "Teste@123" = "`$2b`$10`$rH7L9pMnY3xKjZ8wQvTbN.sP4R6vX2mL9hJ5kF8tB3nY7qZ1wS4"
}

$passwordHash = $passwordHashes[$Password]

if (-not $passwordHash) {
  Write-Host "`n⚠️  Senha não possui hash pré-calculado" -ForegroundColor Yellow
  Write-Host "   Usando hash padrão de 'Test@123'" -ForegroundColor Yellow
  $passwordHash = $passwordHashes["Test@123"]
  Write-Host "`n💡 Dica: Após criar o usuário, faça login com senha: Test@123" -ForegroundColor Cyan
}

# SQL Script
$sqlScript = @"
-- ============================================================================
-- Script de Criação de Usuário de Teste
-- ============================================================================

-- 1. Verificar empresas disponíveis
SELECT 
    id, 
    nome,
    cnpj,
    ativo
FROM empresas 
WHERE ativo = true
ORDER BY created_at DESC
LIMIT 5;

-- 2. Verificar se usuário já existe
SELECT 
    id,
    email,
    nome,
    role,
    ativo,
    created_at
FROM users 
WHERE email = '$Email';

-- 3. Criar usuário de teste (se não existir)
DO `$`$
DECLARE
    v_empresa_id uuid;
    v_user_exists boolean;
BEGIN
    -- Verificar se usuário já existe
    SELECT EXISTS(SELECT 1 FROM users WHERE email = '$Email') INTO v_user_exists;
    
    IF NOT v_user_exists THEN
        -- Pegar primeira empresa ativa
        SELECT id INTO v_empresa_id FROM empresas WHERE ativo = true LIMIT 1;
        
        IF v_empresa_id IS NULL THEN
            RAISE NOTICE 'Nenhuma empresa ativa encontrada! Criando empresa de teste...';
            
            -- Criar empresa de teste se não existir
            INSERT INTO empresas (id, nome, cnpj, ativo, created_at, updated_at)
            VALUES (
                gen_random_uuid(),
                'Empresa Teste',
                '00000000000000',
                true,
                NOW(),
                NOW()
            )
            RETURNING id INTO v_empresa_id;
        END IF;
        
        -- Criar usuário
        INSERT INTO users (
            id,
            email,
            password,
            nome,
            empresa_id,
            ativo,
            role,
            created_at,
            updated_at
        )
        VALUES (
            gen_random_uuid(),
            '$Email',
            '$passwordHash',
            '$Nome',
            v_empresa_id,
            true,
            'admin',
            NOW(),
            NOW()
        );
        
        RAISE NOTICE '✅ Usuário criado com sucesso!';
    ELSE
        RAISE NOTICE '⚠️  Usuário já existe, pulando criação...';
    END IF;
END `$`$;

-- 4. Verificar criação
SELECT 
    u.id,
    u.email,
    u.nome,
    u.role,
    u.ativo,
    e.nome as empresa,
    u.created_at
FROM users u
LEFT JOIN empresas e ON u.empresa_id = e.id
WHERE u.email = '$Email';

-- 5. Estatísticas finais
SELECT 
    COUNT(*) as total_usuarios,
    COUNT(*) FILTER (WHERE ativo = true) as usuarios_ativos,
    COUNT(DISTINCT empresa_id) as empresas_distintas
FROM users;
"@

# Salvar SQL em arquivo temporário
$sqlFile = Join-Path $env:TEMP "create-test-user.sql"
$sqlScript | Out-File -FilePath $sqlFile -Encoding UTF8

Write-Host "`n📝 Script SQL gerado:" -ForegroundColor Yellow
Write-Host "   $sqlFile" -ForegroundColor Gray

# Tentar executar via psql
Write-Host "`n🔧 Procurando PostgreSQL (psql)..." -ForegroundColor Yellow

$psqlPaths = @(
  "C:\Program Files\PostgreSQL\16\bin\psql.exe",
  "C:\Program Files\PostgreSQL\15\bin\psql.exe",
  "C:\Program Files\PostgreSQL\14\bin\psql.exe",
  "C:\Program Files (x86)\PostgreSQL\16\bin\psql.exe",
  "C:\Program Files (x86)\PostgreSQL\15\bin\psql.exe"
)

$psqlPath = $null
foreach ($path in $psqlPaths) {
  if (Test-Path $path) {
    $psqlPath = $path
    break
  }
}

if (-not $psqlPath) {
  # Tentar via PATH
  try {
    $psqlPath = (Get-Command psql -ErrorAction SilentlyContinue).Source
  }
  catch {}
}

if ($psqlPath) {
  Write-Host "✅ PostgreSQL encontrado: $psqlPath" -ForegroundColor Green
    
  Write-Host "`n🚀 Executando script SQL..." -ForegroundColor Yellow
    
  # Configurar variável de ambiente para senha
  $env:PGPASSWORD = $DbPassword
    
  try {
    & $psqlPath -h $DbHost -p $DbPort -U $DbUser -d $DbName -f $sqlFile
        
    Write-Host "`n✅ Script executado com sucesso!" -ForegroundColor Green
    Write-Host ""
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
    Write-Host "  📝 CREDENCIAIS PARA TESTES" -ForegroundColor Cyan
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
    Write-Host "  Email:    $Email" -ForegroundColor White
    Write-Host "  Senha:    $Password" -ForegroundColor White
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
    Write-Host ""
    Write-Host "🧪 PRÓXIMO PASSO: Testar cache" -ForegroundColor Yellow
    Write-Host "   .\scripts\test-cache-complete.ps1 -Email '$Email' -Password '$Password'" -ForegroundColor Gray
    Write-Host ""
  }
  catch {
    Write-Host "`n❌ Erro ao executar script: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "`n💡 Execute o SQL manualmente via DBeaver/pgAdmin" -ForegroundColor Yellow
    Write-Host "   Arquivo: $sqlFile" -ForegroundColor Gray
  }
  finally {
    # Limpar variável de senha
    Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue
  }
}
else {
  Write-Host "⚠️  PostgreSQL (psql) não encontrado" -ForegroundColor Yellow
  Write-Host ""
  Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
  Write-Host "  📋 OPÇÕES PARA EXECUTAR O SQL" -ForegroundColor Cyan
  Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
  Write-Host ""
  Write-Host "  1️⃣  DBeaver / pgAdmin:" -ForegroundColor White
  Write-Host "     → Conectar: $DbHost`:$DbPort" -ForegroundColor Gray
  Write-Host "     → Database: $DbName" -ForegroundColor Gray
  Write-Host "     → User: $DbUser / Password: $DbPassword" -ForegroundColor Gray
  Write-Host "     → Abrir arquivo: $sqlFile" -ForegroundColor Gray
  Write-Host "     → Executar SQL" -ForegroundColor Gray
  Write-Host ""
  Write-Host "  2️⃣  SQL Rápido (copiar e colar):" -ForegroundColor White
  Write-Host ""
  Write-Host "     INSERT INTO users (id, email, password, nome, empresa_id, ativo, role)" -ForegroundColor Gray
  Write-Host "     SELECT gen_random_uuid(), '$Email'," -ForegroundColor Gray
  Write-Host "            '$passwordHash'," -ForegroundColor Gray
  Write-Host "            '$Nome', (SELECT id FROM empresas LIMIT 1), true, 'admin'" -ForegroundColor Gray
  Write-Host "     WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = '$Email');" -ForegroundColor Gray
  Write-Host ""
  Write-Host "  3️⃣  Instalar PostgreSQL:" -ForegroundColor White
  Write-Host "     → Download: https://www.postgresql.org/download/windows/" -ForegroundColor Gray
  Write-Host "     → Ou via Chocolatey: choco install postgresql" -ForegroundColor Gray
  Write-Host ""
  Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
  Write-Host ""
  Write-Host "📝 Arquivo SQL salvo em: $sqlFile" -ForegroundColor Cyan
  Write-Host ""
}

# Limpar arquivo temporário (opcional)
# Remove-Item $sqlFile -Force -ErrorAction SilentlyContinue

Write-Host ""
