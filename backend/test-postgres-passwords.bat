@echo off
echo Testando senhas comuns para postgres...

echo 1. Testando: postgres
set PGPASSWORD=postgres
psql -h localhost -p 5433 -U postgres -c "SELECT 'OK' as status;" 2>nul
if %ERRORLEVEL% EQU 0 (
    echo ✅ Senha 'postgres' funciona!
    goto :success
)

echo 2. Testando: 123456
set PGPASSWORD=123456
psql -h localhost -p 5433 -U postgres -c "SELECT 'OK' as status;" 2>nul
if %ERRORLEVEL% EQU 0 (
    echo ✅ Senha '123456' funciona!
    powershell -Command "(Get-Content .env) -replace 'DATABASE_PASSWORD=postgres', 'DATABASE_PASSWORD=123456' | Set-Content .env"
    goto :success
)

echo 3. Testando: admin
set PGPASSWORD=admin
psql -h localhost -p 5433 -U postgres -c "SELECT 'OK' as status;" 2>nul
if %ERRORLEVEL% EQU 0 (
    echo ✅ Senha 'admin' funciona!
    powershell -Command "(Get-Content .env) -replace 'DATABASE_PASSWORD=postgres', 'DATABASE_PASSWORD=admin' | Set-Content .env"
    goto :success
)

echo 4. Testando sem senha
set PGPASSWORD=
psql -h localhost -p 5433 -U postgres -w -c "SELECT 'OK' as status;" 2>nul
if %ERRORLEVEL% EQU 0 (
    echo ✅ Postgres sem senha funciona!
    powershell -Command "(Get-Content .env) -replace 'DATABASE_PASSWORD=postgres', 'DATABASE_PASSWORD=' | Set-Content .env"
    goto :success
)

echo 5. Testando porta 5432...
set PGPASSWORD=postgres
psql -h localhost -p 5432 -U postgres -c "SELECT 'OK' as status;" 2>nul
if %ERRORLEVEL% EQU 0 (
    echo ✅ Senha 'postgres' funciona na porta 5432!
    powershell -Command "(Get-Content .env) -replace 'DATABASE_PORT=5433', 'DATABASE_PORT=5432' | Set-Content .env"
    goto :success
)

echo ❌ Nenhuma senha comum funcionou.
echo Digite manualmente: set PGPASSWORD=SUA_SENHA_POSTGRES
goto :end

:success
echo.
echo ✅ Conexão com postgres configurada!
echo Agora criando usuario conectcrm...

psql -h localhost -p 5433 -U postgres -c "DROP USER IF EXISTS conectcrm;"
psql -h localhost -p 5433 -U postgres -c "CREATE USER conectcrm WITH PASSWORD 'conectcrm123' CREATEDB;"
psql -h localhost -p 5433 -U postgres -c "CREATE DATABASE conectcrm_db OWNER conectcrm;"

echo.
echo Restaurando configuração original...
powershell -Command "(Get-Content .env) -replace 'DATABASE_USERNAME=postgres', 'DATABASE_USERNAME=conectcrm' | Set-Content .env"
powershell -Command "(Get-Content .env) -replace 'DATABASE_PASSWORD=.*', 'DATABASE_PASSWORD=conectcrm123' | Set-Content .env"

echo ✅ Usuario conectcrm criado e configurado!

:end
pause
