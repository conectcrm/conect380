@echo off
echo ============================================
echo SETUP DO SERVIDOR DE E-MAIL - CONECTCRM
echo ============================================
echo.

echo 📦 Instalando dependencias do servidor de e-mail...
cd /d "%~dp0"
npm install express cors nodemailer @sendgrid/mail aws-sdk dotenv nodemon

echo.
echo ✅ Dependencias instaladas com sucesso!
echo.

echo 📝 Configurando arquivos...
if not exist ".env" (
    copy ".env.email" ".env"
    echo ✅ Arquivo .env criado com base no .env.email
) else (
    echo ⚠️  Arquivo .env já existe
)

echo.
echo 🚀 Para iniciar o servidor de e-mail:
echo    npm run start
echo.
echo 🛠️  Para rodar em modo desenvolvimento:
echo    npm run dev
echo.
echo ⚙️  Para configurar o e-mail:
echo    1. Edite o arquivo .env com suas credenciais
echo    2. Acesse http://localhost:3000/configuracao-email no frontend
echo    3. Teste a configuração
echo.

pause
