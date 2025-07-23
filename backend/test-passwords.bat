@echo off
echo ========================================
echo  Teste de Senhas - ConectCRM
echo ========================================
echo.

echo Testando senhas comuns para o usuario conectcrm...
echo.

echo 1. Testando senha: conectcrm123
echo conectcrm123 | psql -h localhost -p 5432 -U conectcrm -d postgres -c "SELECT 'Senha correta!' as status;" 2>nul
if %ERRORLEVEL% EQU 0 (
    echo ✅ Senha conectcrm123 funciona na porta 5432!
    goto :test_db_5432
)

echo conectcrm123 | psql -h localhost -p 5433 -U conectcrm -d postgres -c "SELECT 'Senha correta!' as status;" 2>nul
if %ERRORLEVEL% EQU 0 (
    echo ✅ Senha conectcrm123 funciona na porta 5433!
    goto :test_db_5433
)

echo 2. Testando senha: fenixcrm123
echo fenixcrm123 | psql -h localhost -p 5432 -U conectcrm -d postgres -c "SELECT 'Senha correta!' as status;" 2>nul
if %ERRORLEVEL% EQU 0 (
    echo ✅ Senha fenixcrm123 funciona na porta 5432!
    echo 📝 Atualizando .env com senha correta...
    powershell -Command "(Get-Content .env) -replace 'DATABASE_PASSWORD=\"conectcrm123\"', 'DATABASE_PASSWORD=\"fenixcrm123\"' | Set-Content .env"
    goto :test_db_5432
)

echo fenixcrm123 | psql -h localhost -p 5433 -U conectcrm -d postgres -c "SELECT 'Senha correta!' as status;" 2>nul
if %ERRORLEVEL% EQU 0 (
    echo ✅ Senha fenixcrm123 funciona na porta 5433!
    echo 📝 Atualizando .env com senha correta...
    powershell -Command "(Get-Content .env) -replace 'DATABASE_PASSWORD=\"conectcrm123\"', 'DATABASE_PASSWORD=\"fenixcrm123\"' | Set-Content .env"
    powershell -Command "(Get-Content .env) -replace 'DATABASE_PORT=5432', 'DATABASE_PORT=5433' | Set-Content .env"
    goto :test_db_5433
)

echo 3. Testando senha: 123456
echo 123456 | psql -h localhost -p 5432 -U conectcrm -d postgres -c "SELECT 'Senha correta!' as status;" 2>nul
if %ERRORLEVEL% EQU 0 (
    echo ✅ Senha 123456 funciona na porta 5432!
    echo 📝 Atualizando .env com senha correta...
    powershell -Command "(Get-Content .env) -replace 'DATABASE_PASSWORD=\"conectcrm123\"', 'DATABASE_PASSWORD=\"123456\"' | Set-Content .env"
    goto :test_db_5432
)

echo 123456 | psql -h localhost -p 5433 -U conectcrm -d postgres -c "SELECT 'Senha correta!' as status;" 2>nul
if %ERRORLEVEL% EQU 0 (
    echo ✅ Senha 123456 funciona na porta 5433!
    echo 📝 Atualizando .env com senha correta...
    powershell -Command "(Get-Content .env) -replace 'DATABASE_PASSWORD=\"conectcrm123\"', 'DATABASE_PASSWORD=\"123456\"' | Set-Content .env"
    powershell -Command "(Get-Content .env) -replace 'DATABASE_PORT=5432', 'DATABASE_PORT=5433' | Set-Content .env"
    goto :test_db_5433
)

echo.
echo ❌ Nenhuma senha comum funcionou.
echo Vamos resetar a senha do usuario conectcrm...
goto :reset_password

:test_db_5432
echo.
echo Testando acesso ao banco conectcrm_db na porta 5432...
psql -h localhost -p 5432 -U conectcrm -d conectcrm_db -c "SELECT 'Banco OK!' as status;"
if %ERRORLEVEL% EQU 0 (
    echo ✅ Banco conectcrm_db acessivel na porta 5432!
    echo 📝 .env configurado corretamente.
) else (
    echo ❌ Banco conectcrm_db nao existe. Criando...
    psql -h localhost -p 5432 -U conectcrm -d postgres -c "CREATE DATABASE conectcrm_db;"
)
goto :end

:test_db_5433
echo.
echo Testando acesso ao banco conectcrm_db na porta 5433...
psql -h localhost -p 5433 -U conectcrm -d conectcrm_db -c "SELECT 'Banco OK!' as status;"
if %ERRORLEVEL% EQU 0 (
    echo ✅ Banco conectcrm_db acessivel na porta 5433!
    echo 📝 .env configurado corretamente.
) else (
    echo ❌ Banco conectcrm_db nao existe. Criando...
    psql -h localhost -p 5433 -U conectcrm -d postgres -c "CREATE DATABASE conectcrm_db;"
)
goto :end

:reset_password
echo.
echo Para resetar a senha, precisamos acessar como superusuario.
echo Se voce tem acesso ao postgres, execute:
echo ALTER USER conectcrm WITH PASSWORD 'conectcrm123';
echo.
echo Ou use pgAdmin para alterar a senha do usuario conectcrm.

:end
echo.
echo ========================================
echo Verificacao concluida!
echo ========================================
pause
