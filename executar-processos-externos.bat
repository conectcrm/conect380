@echo off
echo ========================================
echo 🚀 EXECUTANDO PROCESSOS EXTERNOS
echo ========================================
echo.

echo 📁 Navegando para o diretório do projeto...
cd /d "c:\Projetos\fenixcrm"

echo.
echo 🔧 OPÇÕES DE EXECUÇÃO:
echo ======================
echo [1] Frontend React (frontend-web)
echo [2] Backend NestJS (backend)  
echo [3] Ambos (Frontend + Backend)
echo [4] TypeScript Compiler Watch
echo [5] ESLint Watch
echo [6] Todos os processos
echo [Q] Sair
echo.

set /p choice="Escolha uma opção (1-6 ou Q): "

if /i "%choice%"=="1" goto frontend
if /i "%choice%"=="2" goto backend
if /i "%choice%"=="3" goto ambos
if /i "%choice%"=="4" goto tsc
if /i "%choice%"=="5" goto eslint
if /i "%choice%"=="6" goto todos
if /i "%choice%"=="q" goto sair
goto sair

:frontend
echo.
echo 🌐 Iniciando Frontend React (porta 3000)...
echo ==========================================
cd frontend-web
start "Frontend React" cmd /k "npm start"
goto menu

:backend
echo.
echo ⚙️ Iniciando Backend NestJS (porta 3001)...
echo ============================================
cd backend
start "Backend NestJS" cmd /k "npm run start:dev"
goto menu

:ambos
echo.
echo 🔄 Iniciando Frontend + Backend...
echo ==================================
cd frontend-web
start "Frontend React" cmd /k "npm start"
cd ../backend
start "Backend NestJS" cmd /k "npm run start:dev"
goto menu

:tsc
echo.
echo 📝 Iniciando TypeScript Compiler Watch...
echo ==========================================
start "TypeScript Watch" cmd /k "npx tsc --watch --noEmit"
goto menu

:eslint
echo.
echo 🔍 Iniciando ESLint Watch...
echo =============================
start "ESLint Watch" cmd /k "npx eslint . --ext .ts,.tsx,.js,.jsx --watch"
goto menu

:todos
echo.
echo 🚀 Iniciando TODOS os processos...
echo ==================================
cd frontend-web
start "Frontend React" cmd /k "npm start"
cd ../backend  
start "Backend NestJS" cmd /k "npm run start:dev"
cd ..
start "TypeScript Watch" cmd /k "npx tsc --watch --noEmit"
start "ESLint Watch" cmd /k "npx eslint . --ext .ts,.tsx,.js,.jsx --watch"
goto menu

:menu
echo.
echo ✅ Processos iniciados em janelas separadas!
echo.
echo 💡 DICAS:
echo =========
echo • Agora o VS Code funciona apenas como editor
echo • TypeScript e ESLint rodam externamente  
echo • Frontend: http://localhost:3000
echo • Backend: http://localhost:3001
echo • Use Ctrl+C nas janelas para parar processos
echo.
goto sair

:sair
echo.
echo 👋 Script finalizado. Processos externos continuam rodando.
echo.
pause
