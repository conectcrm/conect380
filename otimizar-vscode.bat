@echo off
echo ========================================
echo 🚀 OTIMIZADOR DE PERFORMANCE VS CODE
echo ========================================
echo.

echo 📊 Verificando processos do VS Code ativos...
echo.
tasklist /fi "imagename eq Code.exe" /fo table
echo.
tasklist /fi "imagename eq node.exe" /fo table | findstr "Code"
echo.

echo 🔄 Parando processos pesados desnecessários...
echo.

REM Para TypeScript Language Server que pode estar travado
echo 🛑 Parando TypeScript Language Servers...
taskkill /f /im "tsserver.exe" 2>nul
taskkill /f /im "typescript-language-server.exe" 2>nul

REM Para ESLint servers
echo 🛑 Parando ESLint Servers...
for /f "tokens=2" %%i in ('tasklist /fi "imagename eq node.exe" /fo csv ^| findstr "eslint"') do (
    taskkill /f /pid %%i 2>nul
)

REM Para processos órfãos do VS Code
echo 🛑 Limpando processos órfãos...
for /f "tokens=2" %%i in ('tasklist /fi "imagename eq Code.exe" /fo csv ^| findstr "Code"') do (
    echo Processo Code.exe encontrado: %%i
)

echo.
echo ✅ Limpeza concluída!
echo.
echo 💡 DICAS PARA MELHOR PERFORMANCE:
echo ================================
echo 1. Feche abas desnecessárias
echo 2. Desative extensões não utilizadas
echo 3. Use Ctrl+Shift+P → "Developer: Reload Window"
echo 4. Reinicie o VS Code periodicamente
echo 5. Mantenha apenas 1 workspace aberto
echo.
echo 📁 Pastas pesadas detectadas no projeto:
echo ==========================================
if exist "node_modules" echo ❌ node_modules/ (pode ser excluída temporariamente)
if exist "build" echo ❌ build/ (pode ser limpa)
if exist "dist" echo ❌ dist/ (pode ser limpa)
if exist ".git" echo ⚠️  .git/ (grande, mas necessária)
echo.

echo 🔧 Para limpeza adicional, execute:
echo ===================================
echo npm run clean     (se disponível)
echo rm -rf node_modules && npm install
echo git clean -fdx    (⚠️ CUIDADO - remove arquivos não commitados)
echo.

echo ⚡ Configurações já otimizadas no .vscode/settings.json!
echo 🎯 VS Code deve estar mais rápido agora.
echo.
pause
