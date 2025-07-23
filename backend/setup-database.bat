@echo off
echo ====================================
echo  Configuracao do Banco ConectCRM
echo ====================================
echo.

echo Tentando conectar na porta 5432...
psql -h localhost -p 5432 -U postgres -f setup-database.sql
if %ERRORLEVEL% EQU 0 (
    echo.
    echo ✅ Banco configurado com sucesso na porta 5432!
    echo.
    echo Testando conexao com o usuario conectcrm...
    psql -h localhost -p 5432 -U conectcrm -d conectcrm_db -c "SELECT 'Conexao funcionando!' as status;"
    goto :update_env_5432
)

echo.
echo Tentando conectar na porta 5433...
psql -h localhost -p 5433 -U postgres -f setup-database.sql
if %ERRORLEVEL% EQU 0 (
    echo.
    echo ✅ Banco configurado com sucesso na porta 5433!
    echo.
    echo Testando conexao com o usuario conectcrm...
    psql -h localhost -p 5433 -U conectcrm -d conectcrm_db -c "SELECT 'Conexao funcionando!' as status;"
    goto :end
)

echo.
echo ❌ Nao foi possivel conectar em nenhuma porta.
echo Verifique se o PostgreSQL esta rodando e se voce tem a senha do usuario postgres.
goto :end

:update_env_5432
echo.
echo 📝 Atualizando .env para usar porta 5432...
echo Isso corrigira o problema de conexao.
pause

:end
echo.
echo Configuracao concluida!
pause
