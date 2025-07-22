@echo off
echo 🚀 Iniciando Fênix CRM Backend - Sistema SaaS
echo.

echo 📂 Navegando para diretório do backend...
cd /d "c:\Projetos\fenixcrm\backend"

echo.
echo 📦 Verificando dependências...
if not exist "node_modules" (
    echo ⚠️ Dependências não encontradas. Instalando...
    npm install
    npm install nodemailer @types/nodemailer
) else (
    echo ✅ Dependências já instaladas
)

echo.
echo 🗄️ Verificando configuração do banco...
if exist ".env" (
    echo ✅ Arquivo .env encontrado
) else (
    echo ❌ Arquivo .env não encontrado! Criando arquivo de exemplo...
    copy .env.example .env
    echo ⚠️ Configure as variáveis no arquivo .env antes de continuar
    pause
)

echo.
echo 🔥 Iniciando servidor em modo desenvolvimento...
echo 📡 Backend estará disponível em: http://localhost:3001
echo 📖 Documentação Swagger em: http://localhost:3001/api
echo.
echo ⏹️ Para parar o servidor, pressione Ctrl+C
echo.

npm run start:dev
