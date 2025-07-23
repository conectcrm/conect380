@echo off
setlocal enabledelayedexpansion

echo ========================================
echo  TESTE DIRETO POSTGRESQL
echo ========================================
echo.

echo PostgreSQL 17 detectado. Testando conexões...
echo.

REM Teste direto com senhas comuns
set "senhas=postgres 123456 admin root password"

echo Testando porta 5433 com senhas comuns...
for %%s in (%senhas%) do (
    echo Tentando senha: %%s
    echo %%s | psql -h localhost -p 5433 -U postgres -c "SELECT 'OK' as test;" 2>nul | findstr "OK" >nul
    if !ERRORLEVEL! EQU 0 (
        echo ✅ SUCESSO! Senha postgres = %%s na porta 5433
        set PGPASSWORD=%%s
        goto :criar_usuario_5433
    )
)

echo.
echo Testando porta 5432 com senhas comuns...
for %%s in (%senhas%) do (
    echo Tentando senha: %%s
    echo %%s | psql -h localhost -p 5432 -U postgres -c "SELECT 'OK' as test;" 2>nul | findstr "OK" >nul
    if !ERRORLEVEL! EQU 0 (
        echo ✅ SUCESSO! Senha postgres = %%s na porta 5432
        set PGPASSWORD=%%s
        goto :criar_usuario_5432
    )
)

echo.
echo Tentando sem senha (trust authentication)...
psql -h localhost -p 5433 -U postgres -w -c "SELECT 'OK' as test;" 2>nul | findstr "OK" >nul
if %ERRORLEVEL% EQU 0 (
    echo ✅ SUCESSO! PostgreSQL configurado para trust na porta 5433
    set PGPASSWORD=
    goto :criar_usuario_5433
)

psql -h localhost -p 5432 -U postgres -w -c "SELECT 'OK' as test;" 2>nul | findstr "OK" >nul
if %ERRORLEVEL% EQU 0 (
    echo ✅ SUCESSO! PostgreSQL configurado para trust na porta 5432
    set PGPASSWORD=
    goto :criar_usuario_5432
)

REM Se chegou aqui, pedir senha manualmente
echo.
echo ⚠️  Nenhuma senha automática funcionou.
echo Digite a senha do usuario postgres:
set /p SENHA_MANUAL="Senha: "

echo %SENHA_MANUAL% | psql -h localhost -p 5433 -U postgres -c "SELECT 'OK' as test;" 2>nul | findstr "OK" >nul
if %ERRORLEVEL% EQU 0 (
    echo ✅ Senha manual funciona na porta 5433!
    set PGPASSWORD=%SENHA_MANUAL%
    goto :criar_usuario_5433
)

echo %SENHA_MANUAL% | psql -h localhost -p 5432 -U postgres -c "SELECT 'OK' as test;" 2>nul | findstr "OK" >nul
if %ERRORLEVEL% EQU 0 (
    echo ✅ Senha manual funciona na porta 5432!
    set PGPASSWORD=%SENHA_MANUAL%
    goto :criar_usuario_5432
)

echo ❌ Senha manual não funciona. Veja soluções no final.
goto :instrucoes_manuais

:criar_usuario_5433
echo.
echo ========================================
echo Criando usuario na porta 5433...
echo ========================================

psql -h localhost -p 5433 -U postgres -c "DROP USER IF EXISTS conectcrm;" 2>nul
psql -h localhost -p 5433 -U postgres -c "CREATE USER conectcrm WITH PASSWORD 'conectcrm123' CREATEDB;"
psql -h localhost -p 5433 -U postgres -c "CREATE DATABASE conectcrm_db OWNER conectcrm;" 2>nul
psql -h localhost -p 5433 -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE conectcrm_db TO conectcrm;"

echo Testando acesso do usuario conectcrm...
echo conectcrm123 | psql -h localhost -p 5433 -U conectcrm -d conectcrm_db -c "SELECT 'Usuario OK!' as status;"

if %ERRORLEVEL% EQU 0 (
    echo ✅ PERFEITO! Usuario conectcrm funcionando na porta 5433
    
    echo Atualizando .env para porta 5433...
    powershell -Command "(Get-Content .env) -replace 'DATABASE_PORT=\d+', 'DATABASE_PORT=5433' | Set-Content .env"
    
    goto :sucesso
) else (
    echo ❌ Problema no acesso do usuario conectcrm
)
goto :end

:criar_usuario_5432
echo.
echo ========================================
echo Criando usuario na porta 5432...
echo ========================================

psql -h localhost -p 5432 -U postgres -c "DROP USER IF EXISTS conectcrm;" 2>nul
psql -h localhost -p 5432 -U postgres -c "CREATE USER conectcrm WITH PASSWORD 'conectcrm123' CREATEDB;"
psql -h localhost -p 5432 -U postgres -c "CREATE DATABASE conectcrm_db OWNER conectcrm;" 2>nul
psql -h localhost -p 5432 -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE conectcrm_db TO conectcrm;"

echo Testando acesso do usuario conectcrm...
echo conectcrm123 | psql -h localhost -p 5432 -U conectcrm -d conectcrm_db -c "SELECT 'Usuario OK!' as status;"

if %ERRORLEVEL% EQU 0 (
    echo ✅ PERFEITO! Usuario conectcrm funcionando na porta 5432
    
    echo Atualizando .env para porta 5432...
    powershell -Command "(Get-Content .env) -replace 'DATABASE_PORT=\d+', 'DATABASE_PORT=5432' | Set-Content .env"
    
    goto :sucesso
) else (
    echo ❌ Problema no acesso do usuario conectcrm
)
goto :end

:sucesso
echo.
echo ========================================
echo ✅ POSTGRESQL CONFIGURADO COM SUCESSO!
echo ========================================
echo.
echo O backend do ConectCRM agora deve conectar perfeitamente!
echo.
echo Configurações finais:
type .env | findstr DATABASE_
echo.
echo Agora você pode iniciar o backend sem problemas de conexão.
goto :end

:instrucoes_manuais
echo.
echo ========================================
echo 📋 INSTRUÇÕES MANUAIS
echo ========================================
echo.
echo Como não conseguimos acesso automático, siga estas opções:
echo.
echo OPÇÃO 1 - pgAdmin:
echo 1. Abra pgAdmin
echo 2. Conecte no servidor PostgreSQL
echo 3. Vá em Login/Group Roles
echo 4. Clique direito ^> Create ^> Login/Group Role
echo 5. Nome: conectcrm
echo 6. Definition ^> Password: conectcrm123
echo 7. Privileges ^> Can login: Yes, Create databases: Yes
echo 8. Save
echo 9. Databases ^> Create Database
echo 10. Nome: conectcrm_db, Owner: conectcrm
echo.
echo OPÇÃO 2 - Linha de comando:
echo psql -U postgres
echo CREATE USER conectcrm WITH PASSWORD 'conectcrm123' CREATEDB;
echo CREATE DATABASE conectcrm_db OWNER conectcrm;
echo \q
echo.

:end
echo.
pause
