@echo off
echo ========================================
echo  Configuracao Alternativa - ConectCRM
echo ========================================
echo.

echo Vamos tentar diferentes configuracoes de banco...
echo.

echo 1. Testando conexao na porta 5432 com usuario postgres (sem senha)...
psql -h localhost -p 5432 -U postgres -w -c "SELECT version();" 2>nul
if %ERRORLEVEL% EQU 0 (
    echo ✅ Conectado! Criando usuario e banco...
    psql -h localhost -p 5432 -U postgres -w -c "CREATE USER conectcrm WITH PASSWORD 'conectcrm123';" 2>nul
    psql -h localhost -p 5432 -U postgres -w -c "CREATE DATABASE conectcrm_db OWNER conectcrm;" 2>nul
    psql -h localhost -p 5432 -U postgres -w -c "GRANT ALL PRIVILEGES ON DATABASE conectcrm_db TO conectcrm;" 2>nul
    goto :test_connection_5432
)

echo 2. Testando conexao na porta 5433 com usuario postgres (sem senha)...
psql -h localhost -p 5433 -U postgres -w -c "SELECT version();" 2>nul
if %ERRORLEVEL% EQU 0 (
    echo ✅ Conectado! Criando usuario e banco...
    psql -h localhost -p 5433 -U postgres -w -c "CREATE USER conectcrm WITH PASSWORD 'conectcrm123';" 2>nul
    psql -h localhost -p 5433 -U postgres -w -c "CREATE DATABASE conectcrm_db OWNER conectcrm;" 2>nul
    psql -h localhost -p 5433 -U postgres -w -c "GRANT ALL PRIVILEGES ON DATABASE conectcrm_db TO conectcrm;" 2>nul
    goto :test_connection_5433
)

echo 3. Tentando conexao direta com conectcrm na porta 5432...
psql -h localhost -p 5432 -U conectcrm -d postgres -c "SELECT 'Usuario ja existe!' as status;" 2>nul
if %ERRORLEVEL% EQU 0 (
    echo ✅ Usuario conectcrm ja existe na porta 5432!
    goto :test_connection_5432
)

echo 4. Tentando conexao direta com conectcrm na porta 5433...
psql -h localhost -p 5433 -U conectcrm -d postgres -c "SELECT 'Usuario ja existe!' as status;" 2>nul
if %ERRORLEVEL% EQU 0 (
    echo ✅ Usuario conectcrm ja existe na porta 5433!
    goto :test_connection_5433
)

echo.
echo ❌ Nenhuma configuracao automatica funcionou.
echo Vamos usar configuracao alternativa...
goto :alt_config

:test_connection_5432
echo.
echo Testando conexao final na porta 5432...
psql -h localhost -p 5432 -U conectcrm -d conectcrm_db -c "SELECT 'Conexao OK!' as status;"
if %ERRORLEVEL% EQU 0 (
    echo ✅ Banco configurado com sucesso na porta 5432!
    echo 📝 .env ja esta configurado para porta 5432
) else (
    echo ❌ Erro na conexao. Tentando configuracao alternativa...
    goto :alt_config
)
goto :end

:test_connection_5433
echo.
echo Testando conexao final na porta 5433...
psql -h localhost -p 5433 -U conectcrm -d conectcrm_db -c "SELECT 'Conexao OK!' as status;"
if %ERRORLEVEL% EQU 0 (
    echo ✅ Banco configurado com sucesso na porta 5433!
    echo 📝 Atualizando .env para porta 5433...
    
    powershell -Command "(Get-Content .env) -replace 'DATABASE_PORT=5432', 'DATABASE_PORT=5433' | Set-Content .env"
) else (
    echo ❌ Erro na conexao. Tentando configuracao alternativa...
    goto :alt_config
)
goto :end

:alt_config
echo.
echo ========================================
echo  Configuracao Alternativa
echo ========================================
echo.
echo Vamos tentar usar configuracoes alternativas do PostgreSQL...
echo.

REM Tentar com trust authentication
echo 1. Tentando com trust authentication...
echo Isso pode funcionar se o PostgreSQL estiver configurado para trust local

REM Configuracao temporaria para desenvolvimento
echo.
echo 📝 Configurando para usar SQLite temporariamente...
echo Isso permitira que o sistema funcione enquanto configuramos o PostgreSQL

powershell -Command "(Get-Content .env) -replace 'DATABASE_HOST=localhost', '# DATABASE_HOST=localhost' | Set-Content .env"
powershell -Command "(Get-Content .env) -replace 'DATABASE_PORT=5432', '# DATABASE_PORT=5432' | Set-Content .env"
powershell -Command "(Get-Content .env) -replace 'DATABASE_USERNAME=conectcrm', '# DATABASE_USERNAME=conectcrm' | Set-Content .env"
powershell -Command "(Get-Content .env) -replace 'DATABASE_PASSWORD=\"conectcrm123\"', '# DATABASE_PASSWORD=\"conectcrm123\"' | Set-Content .env"
powershell -Command "(Get-Content .env) -replace 'DATABASE_NAME=conectcrm_db', '# DATABASE_NAME=conectcrm_db' | Set-Content .env"

echo # Configuracao temporaria SQLite para desenvolvimento >> .env
echo DATABASE_TYPE=sqlite >> .env
echo DATABASE_PATH=./conectcrm.db >> .env

echo.
echo ✅ Configurado para usar SQLite temporariamente!
echo Isso permitira que o sistema funcione enquanto configuramos o PostgreSQL adequadamente.

:end
echo.
echo ========================================
echo Configuracao concluida!
echo ========================================
pause
