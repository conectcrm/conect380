# 🚀 Script de Instalação Automática do Chatwoot para Windows
# Execute: .\instalar-chatwoot.ps1

Write-Host "🎯 INSTALANDO CHATWOOT PARA WHATSAPP..." -ForegroundColor Cyan
Write-Host ""

# Verificar se Docker está instalado
try {
    docker --version | Out-Null
    Write-Host "✅ Docker encontrado" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker não encontrado. Instale Docker Desktop primeiro:" -ForegroundColor Red
    Write-Host "   Download: https://desktop.docker.com/win/main/amd64/Docker%20Desktop%20Installer.exe" -ForegroundColor Yellow
    Read-Host "Pressione Enter para sair"
    exit 1
}

# Verificar se Git está instalado
try {
    git --version | Out-Null
    Write-Host "✅ Git encontrado" -ForegroundColor Green
} catch {
    Write-Host "❌ Git não encontrado. Instale Git primeiro:" -ForegroundColor Red
    Write-Host "   Download: https://git-scm.com/download/win" -ForegroundColor Yellow
    Read-Host "Pressione Enter para sair"
    exit 1
}

# Criar diretório para Chatwoot
if (!(Test-Path "chatwoot-setup")) {
    New-Item -ItemType Directory -Name "chatwoot-setup"
}
Set-Location "chatwoot-setup"

Write-Host "📥 Baixando Chatwoot..." -ForegroundColor Cyan

# Clonar repositório se não existir
if (!(Test-Path "chatwoot")) {
    git clone https://github.com/chatwoot/chatwoot.git
}

Set-Location "chatwoot"

Write-Host "⚙️ Configurando variáveis de ambiente..." -ForegroundColor Cyan

# Copiar arquivo de exemplo
if (!(Test-Path ".env")) {
    Copy-Item ".env.example" ".env"
}

# Gerar chave secreta
$secretKey = -join ((1..128) | ForEach {Get-Random -input ([char[]](48..57 + 65..90 + 97..122))})

# Configurar variáveis básicas
(Get-Content ".env") -replace "SECRET_KEY_BASE=.*", "SECRET_KEY_BASE=$secretKey" | Set-Content ".env"
(Get-Content ".env") -replace "FRONTEND_URL=.*", "FRONTEND_URL=http://localhost:3000" | Set-Content ".env"

Write-Host "🚀 Iniciando Chatwoot com Docker..." -ForegroundColor Cyan

# Executar docker-compose
docker-compose up -d

Write-Host ""
Write-Host "⏳ Aguardando Chatwoot inicializar (isso pode levar 2-3 minutos)..." -ForegroundColor Yellow
Write-Host "   Logs: docker-compose logs -f" -ForegroundColor Gray

# Aguardar serviços subirem
Start-Sleep 30

Write-Host ""
Write-Host "🎉 CHATWOOT INSTALADO COM SUCESSO!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 PRÓXIMOS PASSOS:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. 🌐 Acesse: http://localhost:3000" -ForegroundColor White
Write-Host "2. 👤 Crie sua conta de administrador" -ForegroundColor White
Write-Host "3. 🏢 Configure sua empresa" -ForegroundColor White
Write-Host "4. 📱 Adicione Inbox do WhatsApp:" -ForegroundColor White
Write-Host "   - Settings > Inboxes > Add Inbox" -ForegroundColor Gray
Write-Host "   - Escolha 'WhatsApp'" -ForegroundColor Gray
Write-Host "   - Configure com Meta Business ou 360Dialog" -ForegroundColor Gray
Write-Host ""
Write-Host "5. 🔑 Obtenha tokens:" -ForegroundColor White
Write-Host "   - Profile Settings > Access Token (copie o token)" -ForegroundColor Gray
Write-Host "   - Account ID (da URL: /app/accounts/{ID})" -ForegroundColor Gray
Write-Host "   - Inbox ID (Settings > Inboxes > WhatsApp)" -ForegroundColor Gray
Write-Host ""
Write-Host "6. ⚙️ Configure no ConectCRM:" -ForegroundColor White
Write-Host "   Edite backend\.env:" -ForegroundColor Gray
Write-Host "   CHATWOOT_BASE_URL=http://localhost:3000" -ForegroundColor Yellow
Write-Host "   CHATWOOT_ACCESS_TOKEN=seu_token_aqui" -ForegroundColor Yellow
Write-Host "   CHATWOOT_ACCOUNT_ID=1" -ForegroundColor Yellow
Write-Host "   CHATWOOT_INBOX_ID=id_da_inbox" -ForegroundColor Yellow
Write-Host ""
Write-Host "7. 🔄 Reinicie o backend do ConectCRM" -ForegroundColor White
Write-Host ""
Write-Host "🆘 Ajuda: Get-Content setup-chatwoot.md" -ForegroundColor Cyan
Write-Host ""
Write-Host "🎯 Status: docker-compose ps" -ForegroundColor Cyan
Write-Host "📊 Logs: docker-compose logs -f" -ForegroundColor Cyan

Write-Host ""
Read-Host "Pressione Enter para continuar"
