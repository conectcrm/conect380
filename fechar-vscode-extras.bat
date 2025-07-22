@echo off
echo 🚀 SCRIPT DE OTIMIZACAO DO VS CODE
echo ===================================
echo.
echo 📊 Verificando processos do VS Code...
tasklist /FI "IMAGENAME eq Code.exe" /FO TABLE
echo.
echo ⚠️  AVISO: Vou fechar TODAS as instancias do VS Code!
echo    Certifique-se de salvar seus arquivos antes de continuar.
echo.
pause

echo.
echo 🛑 Fechando todas as instancias do VS Code...
taskkill /F /IM "Code.exe" /T >nul 2>&1
taskkill /F /IM "Code - Insiders.exe" /T >nul 2>&1

echo ⏳ Aguardando 3 segundos...
timeout /t 3 /nobreak >nul

echo.
echo ✅ Processos finalizados! Verificando...
tasklist /FI "IMAGENAME eq Code.exe" /FO TABLE 2>nul | find /I "Code.exe" >nul
if %errorlevel%==0 (
    echo ⚠️  Ainda existem processos do VS Code rodando
) else (
    echo ✅ Todos os processos do VS Code foram fechados
)

echo.
echo 🎯 DICAS PARA EVITAR LENTIDAO:
echo ================================
echo 1. ✅ Use apenas 1-2 janelas do VS Code por vez
echo 2. ✅ Feche abas desnecessarias regularmente  
echo 3. ✅ Reinicie o VS Code a cada 2-3 horas
echo 4. ✅ Use Ctrl+Shift+P ^> "Developer: Reload Window"
echo 5. ✅ Monitore a memoria no Task Manager
echo.
echo 🚀 Agora voce pode abrir o VS Code normalmente!
echo    Recomendo abrir apenas a pasta do projeto atual.
echo.
pause
