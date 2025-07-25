@echo off
REM ==========================================
REM SCRIPT DE MIGRAÇÃO COMPLETA - CONECT CRM
REM ==========================================
REM Script para executar a migração completa de domínios

echo 🚀 Iniciando migração de domínios Fênix → Conect CRM...

REM Verificar se o PostgreSQL está rodando
docker ps | findstr "conectcrm-postgres" >nul
if %errorlevel% neq 0 (
    echo ❌ PostgreSQL não está rodando. Execute setup-docker-postgres.bat primeiro.
    pause
    exit /b 1
)

echo 📊 Executando script de atualização de domínios...

REM Copiar script para o container e executar
docker cp update-domains.sql conectcrm-postgres:/tmp/update-domains.sql
docker exec -i conectcrm-postgres psql -U conectcrm -d conectcrm_db -f /tmp/update-domains.sql

echo ✅ Migração de domínios concluída!

echo.
echo 📋 CREDENCIAIS ATUALIZADAS:
echo ==========================================
echo Email: admin@conectcrm.com     ^| Senha: admin123
echo Email: maria@conectcrm.com     ^| Senha: manager123
echo Email: joao@conectcrm.com      ^| Senha: vendedor123
echo ==========================================
echo.
echo 🏢 EMPRESA ATUALIZADA:
echo ==========================================
echo Nome: Conect Tecnologia
echo Email: contato@conectcrm.com.br
echo Slug: conect-tecnologia
echo ==========================================

pause
