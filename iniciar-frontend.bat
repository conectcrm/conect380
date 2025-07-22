@echo off
echo 🌐 Iniciando Fênix CRM Frontend - Interface SaaS
echo.

echo 📂 Navegando para diretório do frontend...
cd /d "c:\Projetos\fenixcrm\frontend-web"

echo.
echo 📦 Verificando dependências...
if not exist "node_modules" (
    echo ⚠️ Dependências não encontradas. Instalando...
    npm install
) else (
    echo ✅ Dependências já instaladas
)

echo.
echo 🎨 Iniciando interface web...
echo 🌐 Frontend estará disponível em: http://localhost:3900
echo 📋 Página de registro: http://localhost:3900/registro
echo 🔐 Tela de login: http://localhost:3900/login
echo.
echo ⏹️ Para parar o servidor, pressione Ctrl+C
echo.

npm start
