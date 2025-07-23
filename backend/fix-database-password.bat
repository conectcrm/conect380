@echo off
echo ========================================
echo  Resetar Senha do Usuario ConectCRM
echo ========================================
echo.

echo Este script vai resetar a senha do usuario conectcrm no PostgreSQL.
echo Vamos tentar diferentes abordagens...
echo.

echo 1. Tentando acessar como postgres sem senha na porta 5433...
psql -h localhost -p 5433 -U postgres -w -c "ALTER USER conectcrm WITH PASSWORD 'conectcrm123';" 2>nul
if %ERRORLEVEL% EQU 0 (
    echo ✅ Senha resetada com sucesso na porta 5433!
    goto :test_connection
)

echo 2. Tentando acessar como postgres sem senha na porta 5432...
psql -h localhost -p 5432 -U postgres -w -c "ALTER USER conectcrm WITH PASSWORD 'conectcrm123';" 2>nul
if %ERRORLEVEL% EQU 0 (
    echo ✅ Senha resetada com sucesso na porta 5432!
    echo 📝 Atualizando .env para porta 5432...
    powershell -Command "(Get-Content .env) -replace 'DATABASE_PORT=5433', 'DATABASE_PORT=5432' | Set-Content .env"
    goto :test_connection
)

echo 3. Tentando com trust authentication local...
echo.
echo Se o PostgreSQL estiver configurado para trust local, vamos tentar:

REM Verificar se existe arquivo pg_hba.conf local
for /f "tokens=*" %%i in ('psql -h localhost -p 5433 -U postgres -t -c "SHOW hba_file;" 2^>nul') do set HBA_FILE=%%i
if defined HBA_FILE (
    echo Arquivo pg_hba.conf encontrado: %HBA_FILE%
    echo Para resolver definitivamente, edite o arquivo e mude:
    echo   host all all 127.0.0.1/32 md5
    echo Para:
    echo   host all all 127.0.0.1/32 trust
    echo Depois execute: pg_ctl reload
)

echo.
echo 4. Tentando criar novo usuario com senha conhecida...
psql -h localhost -p 5433 -U postgres -w -c "DROP USER IF EXISTS conectcrm; CREATE USER conectcrm WITH PASSWORD 'conectcrm123' CREATEDB;" 2>nul
if %ERRORLEVEL% EQU 0 (
    echo ✅ Usuario recriado com sucesso na porta 5433!
    psql -h localhost -p 5433 -U postgres -w -c "CREATE DATABASE conectcrm_db OWNER conectcrm;" 2>nul
    goto :test_connection
)

psql -h localhost -p 5432 -U postgres -w -c "DROP USER IF EXISTS conectcrm; CREATE USER conectcrm WITH PASSWORD 'conectcrm123' CREATEDB;" 2>nul
if %ERRORLEVEL% EQU 0 (
    echo ✅ Usuario recriado com sucesso na porta 5432!
    echo 📝 Atualizando .env para porta 5432...
    powershell -Command "(Get-Content .env) -replace 'DATABASE_PORT=5433', 'DATABASE_PORT=5432' | Set-Content .env"
    psql -h localhost -p 5432 -U postgres -w -c "CREATE DATABASE conectcrm_db OWNER conectcrm;" 2>nul
    goto :test_connection
)

echo.
echo ❌ Não conseguimos acessar automaticamente.
echo.
echo SOLUÇÕES MANUAIS:
echo.
echo OPÇÃO 1 - pgAdmin:
echo 1. Abra o pgAdmin
echo 2. Conecte no servidor PostgreSQL
echo 3. Vá em Login/Group Roles
echo 4. Clique com botão direito em 'conectcrm'
echo 5. Properties ^> Definition ^> Password: conectcrm123
echo.
echo OPÇÃO 2 - Linha de comando (manual):
echo Digite a senha do postgres quando solicitado:
echo psql -h localhost -p 5433 -U postgres
echo ALTER USER conectcrm WITH PASSWORD 'conectcrm123';
echo \q
echo.
echo OPÇÃO 3 - Usar usuário diferente:
echo Podemos configurar para usar o usuario postgres temporariamente.
echo.
set /p escolha="Deseja usar o usuario postgres temporariamente? (s/n): "
if /i "%escolha%"=="s" goto :use_postgres

goto :end

:use_postgres
echo.
echo 📝 Configurando para usar usuario postgres...
set /p postgres_password="Digite a senha do usuario postgres: "

powershell -Command "(Get-Content .env) -replace 'DATABASE_USERNAME=conectcrm', 'DATABASE_USERNAME=postgres' | Set-Content .env"
powershell -Command "(Get-Content .env) -replace 'DATABASE_PASSWORD=conectcrm123', 'DATABASE_PASSWORD=%postgres_password%' | Set-Content .env"

echo ✅ Configuração atualizada para usar postgres!
echo Teste a aplicação agora.
goto :end

:test_connection
echo.
echo Testando nova configuração...
set PGPASSWORD=conectcrm123
psql -h localhost -p 5433 -U conectcrm -d postgres -c "SELECT 'Conexão OK!' as status;" 2>nul
if %ERRORLEVEL% EQU 0 (
    echo ✅ Conexão funcionando na porta 5433!
    goto :create_database
)

psql -h localhost -p 5432 -U conectcrm -d postgres -c "SELECT 'Conexão OK!' as status;" 2>nul
if %ERRORLEVEL% EQU 0 (
    echo ✅ Conexão funcionando na porta 5432!
    goto :create_database
)

echo ❌ Ainda há problemas na conexão.
goto :end

:create_database
echo.
echo Verificando se o banco conectcrm_db existe...
psql -h localhost -p 5433 -U conectcrm -d conectcrm_db -c "SELECT 'Banco OK!' as status;" 2>nul
if %ERRORLEVEL% EQU 0 (
    echo ✅ Banco conectcrm_db já existe e está acessível!
    goto :success
)

psql -h localhost -p 5432 -U conectcrm -d conectcrm_db -c "SELECT 'Banco OK!' as status;" 2>nul
if %ERRORLEVEL% EQU 0 (
    echo ✅ Banco conectcrm_db já existe e está acessível!
    goto :success
)

echo Criando banco conectcrm_db...
psql -h localhost -p 5433 -U conectcrm -d postgres -c "CREATE DATABASE conectcrm_db;" 2>nul
if %ERRORLEVEL% EQU 0 (
    echo ✅ Banco conectcrm_db criado na porta 5433!
    goto :success
)

psql -h localhost -p 5432 -U conectcrm -d postgres -c "CREATE DATABASE conectcrm_db;" 2>nul
if %ERRORLEVEL% EQU 0 (
    echo ✅ Banco conectcrm_db criado na porta 5432!
    goto :success
)

goto :end

:success
echo.
echo ========================================
echo ✅ CONFIGURAÇÃO CONCLUÍDA COM SUCESSO!
echo ========================================
echo.
echo O banco está configurado e pronto para uso.
echo Agora você pode iniciar a aplicação backend.

:end
echo.
pause
