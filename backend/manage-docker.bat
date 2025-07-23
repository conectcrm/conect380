@echo off
echo ========================================
echo  GERENCIADOR DOCKER CONECTCRM
echo ========================================
echo.

:menu
echo Escolha uma opção:
echo.
echo 1. Iniciar containers
echo 2. Parar containers  
echo 3. Reiniciar containers
echo 4. Ver status dos containers
echo 5. Ver logs do PostgreSQL
echo 6. Acessar PostgreSQL via terminal
echo 7. Backup do banco
echo 8. Restaurar backup
echo 9. Remover tudo (cuidado!)
echo 0. Sair
echo.
set /p opcao="Digite a opção (0-9): "

if "%opcao%"=="1" goto :start
if "%opcao%"=="2" goto :stop
if "%opcao%"=="3" goto :restart
if "%opcao%"=="4" goto :status
if "%opcao%"=="5" goto :logs
if "%opcao%"=="6" goto :terminal
if "%opcao%"=="7" goto :backup
if "%opcao%"=="8" goto :restore
if "%opcao%"=="9" goto :remove
if "%opcao%"=="0" goto :end
goto :menu

:start
echo Iniciando containers...
docker-compose up -d
goto :status

:stop
echo Parando containers...
docker-compose down
goto :menu

:restart
echo Reiniciando containers...
docker-compose restart
goto :status

:status
echo.
echo Status dos containers:
docker-compose ps
echo.
echo Testando conexão...
docker exec conectcrm-postgres pg_isready -U conectcrm -d conectcrm_db 2>nul
if %ERRORLEVEL% EQU 0 (
    echo ✅ PostgreSQL: FUNCIONANDO
) else (
    echo ❌ PostgreSQL: PROBLEMA
)
echo.
goto :menu

:logs
echo.
echo Logs do PostgreSQL (últimas 50 linhas):
echo ========================================
docker-compose logs --tail=50 postgres
echo.
goto :menu

:terminal
echo.
echo Conectando ao PostgreSQL...
echo (Digite \q para sair)
docker exec -it conectcrm-postgres psql -U conectcrm -d conectcrm_db
goto :menu

:backup
echo.
set /p backup_name="Nome do arquivo de backup (sem extensão): "
if "%backup_name%"=="" set backup_name=backup_%date:~-4,4%%date:~-10,2%%date:~-7,2%
echo Criando backup: %backup_name%.sql
docker exec conectcrm-postgres pg_dump -U conectcrm conectcrm_db > %backup_name%.sql
echo ✅ Backup criado: %backup_name%.sql
goto :menu

:restore
echo.
echo Arquivos de backup disponíveis:
dir *.sql /b 2>nul
echo.
set /p restore_file="Nome do arquivo para restaurar (com .sql): "
if exist "%restore_file%" (
    echo Restaurando backup: %restore_file%
    docker exec -i conectcrm-postgres psql -U conectcrm -d conectcrm_db < %restore_file%
    echo ✅ Backup restaurado
) else (
    echo ❌ Arquivo não encontrado
)
goto :menu

:remove
echo.
echo ⚠️  ATENÇÃO: Isso removerá TODOS os dados!
set /p confirm="Tem certeza? Digite 'CONFIRMO' para continuar: "
if "%confirm%"=="CONFIRMO" (
    echo Removendo containers e dados...
    docker-compose down -v
    docker volume rm conectcrm_postgres_data 2>nul
    echo ✅ Tudo removido
) else (
    echo Operação cancelada
)
goto :menu

:end
echo.
echo Até logo!
