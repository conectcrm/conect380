@echo off
title Fênix CRM - Frontend Web
color 0B

echo ======================================
echo   🌐 FÊNIX CRM - FRONTEND WEB  
echo ======================================
echo.

cd /d "c:\Projetos\fenixcrm\frontend-web"

echo 📂 Diretório: %CD%
echo 🕐 Horário: %DATE% %TIME%
echo.

echo ⚡ Iniciando interface web...
echo 🌐 URL: http://localhost:3900
echo 🔐 Login: http://localhost:3900/login
echo 📝 Registro: http://localhost:3900/registro
echo.

echo ⏹️  Para parar: Ctrl+C
echo.

npm start

pause
