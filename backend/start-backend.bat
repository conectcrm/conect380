@echo off
title Conect CRM - Backend Server
color 0A

echo ======================================
echo   🚀 CONECT CRM - BACKEND SERVER
echo ======================================
echo.

echo 📂 Diretório: %CD%
echo 🕐 Horário: %DATE% %TIME%
echo.

echo ⚡ Iniciando servidor em modo desenvolvimento...
echo 📡 URL: http://localhost:3001
echo 📚 Docs: http://localhost:3001/api
echo.

echo ⏹️  Para parar: Ctrl+C
echo 🔄 Para reiniciar: Digite 'rs' + Enter
echo.

npm run start:dev

pause
