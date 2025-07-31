#!/bin/bash

# 🚀 Script de Instalação Automática do Chatwoot
# Executa: bash instalar-chatwoot.sh

echo "🎯 INSTALANDO CHATWOOT PARA WHATSAPP..."
echo ""

# Verificar se Docker está instalado
if ! command -v docker &> /dev/null; then
    echo "❌ Docker não encontrado. Instale Docker primeiro:"
    echo "   Windows: https://desktop.docker.com/win/main/amd64/Docker%20Desktop%20Installer.exe"
    echo "   Mac: https://desktop.docker.com/mac/main/amd64/Docker.dmg"
    echo "   Linux: sudo apt install docker.io docker-compose"
    exit 1
fi

echo "✅ Docker encontrado"

# Criar diretório para Chatwoot
mkdir -p chatwoot-setup
cd chatwoot-setup

echo "📥 Baixando Chatwoot..."

# Clonar repositório
if [ ! -d "chatwoot" ]; then
    git clone https://github.com/chatwoot/chatwoot.git
fi

cd chatwoot

echo "⚙️ Configurando variáveis de ambiente..."

# Copiar arquivo de exemplo
cp .env.example .env

# Configurar variáveis básicas
sed -i 's/SECRET_KEY_BASE=.*/SECRET_KEY_BASE='$(openssl rand -hex 64)'/' .env
sed -i 's/FRONTEND_URL=.*/FRONTEND_URL=http:\/\/localhost:3000/' .env

echo "🚀 Iniciando Chatwoot com Docker..."

# Executar docker-compose
docker-compose up -d

echo ""
echo "⏳ Aguardando Chatwoot inicializar (isso pode levar 2-3 minutos)..."
echo "   Logs: docker-compose logs -f"

# Aguardar serviços subirem
sleep 30

echo ""
echo "🎉 CHATWOOT INSTALADO COM SUCESSO!"
echo ""
echo "📋 PRÓXIMOS PASSOS:"
echo ""
echo "1. 🌐 Acesse: http://localhost:3000"
echo "2. 👤 Crie sua conta de administrador"
echo "3. 🏢 Configure sua empresa"
echo "4. 📱 Adicione Inbox do WhatsApp:"
echo "   - Settings > Inboxes > Add Inbox"
echo "   - Escolha 'WhatsApp'"
echo "   - Configure com Meta Business ou 360Dialog"
echo ""
echo "5. 🔑 Obtenha tokens:"
echo "   - Profile Settings > Access Token (copie o token)"
echo "   - Account ID (da URL: /app/accounts/{ID})"
echo "   - Inbox ID (Settings > Inboxes > WhatsApp)"
echo ""
echo "6. ⚙️ Configure no ConectCRM:"
echo "   Edite backend/.env:"
echo "   CHATWOOT_BASE_URL=http://localhost:3000"
echo "   CHATWOOT_ACCESS_TOKEN=seu_token_aqui"
echo "   CHATWOOT_ACCOUNT_ID=1"
echo "   CHATWOOT_INBOX_ID=id_da_inbox"
echo ""
echo "7. 🔄 Reinicie o backend do ConectCRM"
echo ""
echo "🆘 Ajuda: cat setup-chatwoot.md"
echo ""
echo "🎯 Status: docker-compose ps"
echo "📊 Logs: docker-compose logs -f"
