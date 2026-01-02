#!/bin/bash

#####################################################
# Setup SSL/HTTPS - ConectHelp.com.br
# Certificado Let's Encrypt via Certbot
#####################################################

set -e

# Cores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

DOMAIN="conecthelp.com.br"
WWW_DOMAIN="www.conecthelp.com.br"
EMAIL="admin@conecthelp.com.br"  # ⚠️ Alterar para seu email

echo "🔐 Setup SSL/HTTPS - ConectHelp.com.br"
echo "================================================"

# ============================================
# 1. Verificar se está rodando como root
# ============================================
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}❌ Por favor, execute como root: sudo ./setup-ssl.sh${NC}"
    exit 1
fi

# ============================================
# 2. Verificar se Docker está rodando
# ============================================
echo -e "${YELLOW}🐳 Verificando Docker...${NC}"
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker não está rodando!${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Docker OK${NC}"

# ============================================
# 3. Verificar se DNS está configurado
# ============================================
echo -e "${YELLOW}🌐 Verificando DNS de $DOMAIN...${NC}"
CURRENT_IP=$(dig +short $DOMAIN | tail -n1)
SERVER_IP=$(curl -s ifconfig.me)

if [ -z "$CURRENT_IP" ]; then
    echo -e "${RED}❌ DNS não está configurado!${NC}"
    echo -e "${RED}   Configure o registro A no seu provedor de domínio:${NC}"
    echo -e "${RED}   Tipo: A${NC}"
    echo -e "${RED}   Nome: @${NC}"
    echo -e "${RED}   Valor: $SERVER_IP${NC}"
    echo -e "${RED}   TTL: 3600${NC}"
    exit 1
fi

if [ "$CURRENT_IP" != "$SERVER_IP" ]; then
    echo -e "${RED}❌ DNS está apontando para $CURRENT_IP${NC}"
    echo -e "${RED}   Mas seu servidor está em $SERVER_IP${NC}"
    echo -e "${YELLOW}⚠️  Aguarde a propagação do DNS (pode levar até 48h)${NC}"
    exit 1
fi

echo -e "${GREEN}✅ DNS configurado corretamente: $CURRENT_IP${NC}"

# ============================================
# 4. Criar diretórios para Certbot
# ============================================
echo -e "${YELLOW}📁 Criando diretórios...${NC}"
mkdir -p certbot/conf
mkdir -p certbot/www
echo -e "${GREEN}✅ Diretórios criados${NC}"

# ============================================
# 5. Parar containers (se estiverem rodando)
# ============================================
echo -e "${YELLOW}🛑 Parando containers...${NC}"
docker-compose -f docker-compose.prod.yml down 2>/dev/null || true

# ============================================
# 6. Subir apenas Nginx para validação Certbot
# ============================================
echo -e "${YELLOW}🚀 Iniciando Nginx temporário...${NC}"
docker-compose -f docker-compose.prod.yml up -d nginx

# Aguardar Nginx iniciar
sleep 5

# ============================================
# 7. Obter certificado SSL via Certbot
# ============================================
echo -e "${YELLOW}🔐 Obtendo certificado SSL...${NC}"
echo -e "${BLUE}   Domínios: $DOMAIN, $WWW_DOMAIN${NC}"
echo -e "${BLUE}   Email: $EMAIL${NC}"

docker run --rm \
    -v "$(pwd)/certbot/conf:/etc/letsencrypt" \
    -v "$(pwd)/certbot/www:/var/www/certbot" \
    certbot/certbot certonly \
    --webroot \
    --webroot-path=/var/www/certbot \
    --email $EMAIL \
    --agree-tos \
    --no-eff-email \
    --non-interactive \
    -d $DOMAIN \
    -d $WWW_DOMAIN

# Verificar se certificado foi obtido
if [ ! -f "certbot/conf/live/$DOMAIN/fullchain.pem" ]; then
    echo -e "${RED}❌ Falha ao obter certificado SSL!${NC}"
    docker compose -f docker-compose.prod.yml down
    exit 1
fi

echo -e "${GREEN}✅ Certificado SSL obtido com sucesso!${NC}"

# ============================================
# 8. Configurar renovação automática
# ============================================
echo -e "${YELLOW}🔄 Configurando renovação automática...${NC}"

# Criar script de renovação
cat > /etc/cron.daily/certbot-renew << 'EOF'
#!/bin/bash
cd /home/ubuntu/conectcrm
docker run --rm \
    -v "$(pwd)/certbot/conf:/etc/letsencrypt" \
    -v "$(pwd)/certbot/www:/var/www/certbot" \
    certbot/certbot renew --quiet

# Recarregar Nginx após renovação
docker-compose -f docker-compose.prod.yml exec nginx nginx -s reload
EOF

chmod +x /etc/cron.daily/certbot-renew
echo -e "${GREEN}✅ Renovação automática configurada${NC}"

# ============================================
# 9. Reiniciar containers com SSL
# ============================================
echo -e "${YELLOW}🔄 Reiniciando containers com SSL...${NC}"
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up -d

echo ""
echo -e "${GREEN}================================================${NC}"
echo -e "${GREEN}✅ SSL/HTTPS Configurado com Sucesso!${NC}"
echo -e "${GREEN}================================================${NC}"
echo ""
echo -e "${BLUE}🌐 Seu site está disponível em:${NC}"
echo -e "${GREEN}   https://conecthelp.com.br${NC}"
echo -e "${GREEN}   https://www.conecthelp.com.br${NC}"
echo ""
echo -e "${BLUE}📋 Próximos passos:${NC}"
echo "   1. Testar acesso: https://conecthelp.com.br"
echo "   2. Verificar redirecionamento HTTP → HTTPS"
echo "   3. Atualizar webhook WhatsApp: https://conecthelp.com.br/webhook/whatsapp"
echo ""
echo -e "${YELLOW}ℹ️  Certificado válido por 90 dias${NC}"
echo -e "${YELLOW}   Renovação automática configurada via cron${NC}"
echo ""
