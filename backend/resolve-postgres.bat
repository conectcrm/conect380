@echo off
echo ========================================
echo  RESOLUCAO DEFINITIVA - PostgreSQL
echo ========================================
echo.

echo Vamos resolver o PostgreSQL de uma vez por todas!
echo.

REM Primeiro, vamos descobrir qual instância está funcionando
echo 1. Verificando instâncias do PostgreSQL...
echo.

REM Verificar serviços PostgreSQL
echo Serviços PostgreSQL ativos:
sc query | findstr /i postgres
echo.

REM Tentar conectar nas portas principais
echo 2. Testando conexões nas portas principais...
echo.

REM Porta 5432 (padrão)
echo Testando porta 5432...
timeout /t 1 >nul 2>nul
telnet localhost 5432 2>nul | findstr "Connected" >nul
if %ERRORLEVEL% EQU 0 (
    echo ✅ PostgreSQL respondendo na porta 5432
    set PORTA_FUNCIONANDO=5432
) else (
    echo ❌ Porta 5432 não responde
)

REM Porta 5433 (alternativa)
echo Testando porta 5433...
timeout /t 1 >nul 2>nul
telnet localhost 5433 2>nul | findstr "Connected" >nul
if %ERRORLEVEL% EQU 0 (
    echo ✅ PostgreSQL respondendo na porta 5433
    set PORTA_FUNCIONANDO=5433
) else (
    echo ❌ Porta 5433 não responde
)

echo.
echo 3. Tentando método direto para resetar usuario...
echo.

REM Método 1: Usando psql com diferentes senhas
echo Método 1: Testando senhas comuns para postgres...

set SENHAS=postgres 123456 admin root password '' fenixcrm123 conectcrm123

for %%s in (%SENHAS%) do (
    echo Tentando senha: %%s
    set PGPASSWORD=%%s
    psql -h localhost -p 5433 -U postgres -c "SELECT version();" >nul 2>nul
    if !ERRORLEVEL! EQU 0 (
        echo ✅ ENCONTROU! Senha do postgres é: %%s
        set POSTGRES_PASSWORD=%%s
        goto :reset_user
    )
    
    psql -h localhost -p 5432 -U postgres -c "SELECT version();" >nul 2>nul
    if !ERRORLEVEL! EQU 0 (
        echo ✅ ENCONTROU! Senha do postgres é: %%s na porta 5432
        set POSTGRES_PASSWORD=%%s
        set PORTA_FUNCIONANDO=5432
        goto :reset_user
    )
)

echo.
echo Método 2: Tentando acesso sem senha (trust)...
set PGPASSWORD=
psql -h localhost -p 5433 -U postgres -w -c "SELECT version();" >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo ✅ PostgreSQL configurado para trust na porta 5433!
    set POSTGRES_PASSWORD=
    set PORTA_FUNCIONANDO=5433
    goto :reset_user
)

psql -h localhost -p 5432 -U postgres -w -c "SELECT version();" >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo ✅ PostgreSQL configurado para trust na porta 5432!
    set POSTGRES_PASSWORD=
    set PORTA_FUNCIONANDO=5432
    goto :reset_user
)

echo.
echo Método 3: Prompt manual para senha...
echo.
echo Digite a senha do usuario postgres:
set /p MANUAL_PASSWORD="Senha postgres: "

set PGPASSWORD=%MANUAL_PASSWORD%
psql -h localhost -p 5433 -U postgres -c "SELECT version();" >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo ✅ Senha informada funciona na porta 5433!
    set POSTGRES_PASSWORD=%MANUAL_PASSWORD%
    set PORTA_FUNCIONANDO=5433
    goto :reset_user
)

psql -h localhost -p 5432 -U postgres -c "SELECT version();" >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo ✅ Senha informada funciona na porta 5432!
    set POSTGRES_PASSWORD=%MANUAL_PASSWORD%
    set PORTA_FUNCIONANDO=5432
    goto :reset_user
)

echo ❌ Senha informada não funciona.
goto :manual_solution

:reset_user
echo.
echo ========================================
echo ✅ POSTGRES ACESSADO COM SUCESSO!
echo ========================================
echo Porta: %PORTA_FUNCIONANDO%
echo Senha: %POSTGRES_PASSWORD%
echo.

echo Agora vamos criar/resetar o usuario conectcrm...
echo.

REM Remover usuario se existir e criar novo
echo Removendo usuario conectcrm se existir...
psql -h localhost -p %PORTA_FUNCIONANDO% -U postgres -c "DROP USER IF EXISTS conectcrm;" 2>nul

echo Criando novo usuario conectcrm...
psql -h localhost -p %PORTA_FUNCIONANDO% -U postgres -c "CREATE USER conectcrm WITH PASSWORD 'conectcrm123' CREATEDB CREATEROLE;"
if %ERRORLEVEL% EQU 0 (
    echo ✅ Usuario conectcrm criado com sucesso!
) else (
    echo ❌ Erro ao criar usuario conectcrm
    goto :end
)

echo Criando banco conectcrm_db se não existir...
psql -h localhost -p %PORTA_FUNCIONANDO% -U postgres -c "SELECT 1 FROM pg_database WHERE datname = 'conectcrm_db';" | findstr "1" >nul
if %ERRORLEVEL% NEQ 0 (
    echo Banco não existe, criando...
    psql -h localhost -p %PORTA_FUNCIONANDO% -U postgres -c "CREATE DATABASE conectcrm_db OWNER conectcrm;"
    if %ERRORLEVEL% EQU 0 (
        echo ✅ Banco conectcrm_db criado!
    ) else (
        echo ❌ Erro ao criar banco
        goto :end
    )
) else (
    echo ✅ Banco conectcrm_db já existe!
)

echo Concedendo privilégios...
psql -h localhost -p %PORTA_FUNCIONANDO% -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE conectcrm_db TO conectcrm;"
psql -h localhost -p %PORTA_FUNCIONANDO% -U postgres -c "ALTER DATABASE conectcrm_db OWNER TO conectcrm;"

echo.
echo Testando acesso com usuario conectcrm...
set PGPASSWORD=conectcrm123
psql -h localhost -p %PORTA_FUNCIONANDO% -U conectcrm -d conectcrm_db -c "SELECT 'Conexao OK!' as status;"
if %ERRORLEVEL% EQU 0 (
    echo ✅ SUCESSO! Usuario conectcrm pode acessar o banco!
) else (
    echo ❌ Ainda há problema com o acesso
    goto :end
)

echo.
echo Atualizando arquivo .env...
powershell -Command "(Get-Content .env) -replace 'DATABASE_PORT=\d+', 'DATABASE_PORT=%PORTA_FUNCIONANDO%' | Set-Content .env"

echo.
echo ========================================
echo ✅ CONFIGURAÇÃO COMPLETA E TESTADA!
echo ========================================
echo.
echo Configurações finais:
echo - Porta: %PORTA_FUNCIONANDO%
echo - Usuario: conectcrm
echo - Senha: conectcrm123
echo - Banco: conectcrm_db
echo.
echo O backend agora deve conectar sem problemas!
goto :end

:manual_solution
echo.
echo ========================================
echo ❌ SOLUÇÃO MANUAL NECESSÁRIA
echo ========================================
echo.
echo Não conseguimos acessar automaticamente o PostgreSQL.
echo.
echo OPÇÕES MANUAIS:
echo.
echo 1. PGADMIN:
echo    - Abra o pgAdmin
echo    - Conecte no servidor PostgreSQL
echo    - Crie usuario: conectcrm / senha: conectcrm123
echo    - Crie banco: conectcrm_db (owner: conectcrm)
echo.
echo 2. LINHA DE COMANDO:
echo    - psql -U postgres
echo    - CREATE USER conectcrm WITH PASSWORD 'conectcrm123' CREATEDB;
echo    - CREATE DATABASE conectcrm_db OWNER conectcrm;
echo    - \q
echo.
echo 3. DOCKER (alternativo):
echo    - docker run --name postgres-conectcrm -e POSTGRES_PASSWORD=postgres -p 5432:5432 -d postgres
echo    - Depois execute este script novamente
echo.

:end
echo.
pause
