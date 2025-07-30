@echo off
echo 🚀 Iniciando Sistema ConectCRM Completo
echo.

REM Parar processos existentes na porta 3001
echo 📌 Verificando porta 3001...
for /f "tokens=5" %%i in ('netstat -ano ^| findstr :3001') do (
    echo ⚠️  Encerrando processo na porta 3001: %%i
    taskkill /PID %%i /F > nul 2>&1
)

REM Ir para pasta do backend
cd /d "%~dp0backend"

echo 📦 Compilando backend...
call npx nest build

if errorlevel 1 (
    echo ❌ Erro na compilação. Verifique os logs acima.
    pause
    exit /b 1
)

echo 🎯 Iniciando backend com email integrado na porta 3001...
start "ConectCRM Backend" cmd /k "node dist/main.js"

echo.
echo ✅ Sistema iniciado com sucesso!
echo.
echo 📋 Serviços disponíveis:
echo    🌐 Backend: http://localhost:3001
echo    📖 API Docs: http://localhost:3001/api-docs  
echo    📧 Email: Integrado no backend
echo    🎯 Portal: http://localhost:3900/portal/proposta/[numero]/[token]
echo.
echo 🔧 Endpoints de Email:
echo    POST /email/notificar-aceite
echo    POST /email/enviar-proposta
echo    GET  /email/testar
echo    GET  /email/status
echo.
echo ⚡ Agora você precisa rodar apenas 1 servidor!
echo.
pause
