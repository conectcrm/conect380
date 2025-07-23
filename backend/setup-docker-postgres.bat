@echo off
echo ========================================
echo  CONFIGURACAO DOCKER POSTGRESQL
echo ========================================
echo.

echo Verificando se o Docker está rodando...
docker --version >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Docker não está instalado ou não está rodando!
    echo.
    echo Para instalar o Docker:
    echo 1. Baixe Docker Desktop em: https://www.docker.com/products/docker-desktop
    echo 2. Instale e reinicie o computador
    echo 3. Execute este script novamente
    pause
    exit /b 1
)

echo ✅ Docker detectado!
echo.

echo Parando containers existentes do ConectCRM...
docker-compose down 2>nul

echo.
echo Criando e iniciando PostgreSQL + pgAdmin...
docker-compose up -d

echo.
echo Aguardando PostgreSQL inicializar...
timeout /t 10 >nul

echo Verificando status dos containers...
docker-compose ps

echo.
echo Testando conexão com o banco...
timeout /t 5 >nul

docker exec conectcrm-postgres pg_isready -U conectcrm -d conectcrm_db
if %ERRORLEVEL% EQU 0 (
    echo ✅ PostgreSQL está funcionando perfeitamente!
    
    echo.
    echo ========================================
    echo ✅ CONFIGURAÇÃO CONCLUÍDA COM SUCESSO!
    echo ========================================
    echo.
    echo 📊 INFORMAÇÕES DE CONEXÃO:
    echo.
    echo PostgreSQL:
    echo   Host: localhost
    echo   Porta: 5434
    echo   Banco: conectcrm_db
    echo   Usuario: conectcrm
    echo   Senha: conectcrm123
    echo.
    echo pgAdmin (interface web):
    echo   URL: http://localhost:5050
    echo   Email: admin@conectcrm.com
    echo   Senha: admin123
    echo.
    echo Para conectar no pgAdmin:
    echo   Host: conectcrm-postgres
    echo   Porta: 5432
    echo   Usuario: conectcrm
    echo   Senha: conectcrm123
    echo.
    echo 🚀 O backend ConectCRM agora pode ser iniciado!
    
) else (
    echo ❌ Problema na inicialização do PostgreSQL
    echo.
    echo Verificando logs...
    docker-compose logs postgres
)

echo.
echo Comandos úteis:
echo   docker-compose up -d          ^| Iniciar containers
echo   docker-compose down           ^| Parar containers
echo   docker-compose logs postgres  ^| Ver logs do PostgreSQL
echo   docker-compose restart        ^| Reiniciar containers
echo.
pause
