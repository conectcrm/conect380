#!/bin/bash

# ==============================================================================
# Script de Setup Automatizado - ConectSuite
# ==============================================================================
# Este script configura o servidor do zero para rodar o ConectSuite
# Uso: ./setup-server.sh
# ==============================================================================

set -e  # Parar em caso de erro

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Funções auxiliares
print_header() {
    echo -e "\n${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}\n"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Verificar se está rodando como root
if [ "$EUID" -eq 0 ]; then 
    print_error "Não rode este script como root. Use um usuário normal com sudo."
    exit 1
fi

print_header "ConectSuite - Setup Automatizado v1.0.0"

# ==============================================================================
# 1. Atualizar Sistema
# ==============================================================================
print_header "1. Atualizando Sistema"
sudo apt update
sudo apt upgrade -y
print_success "Sistema atualizado"

# ==============================================================================
# 2. Instalar Node.js 20
# ==============================================================================
print_header "2. Instalando Node.js 20"
if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v)
    print_info "Node.js já instalado: $NODE_VERSION"
else
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt install -y nodejs
    print_success "Node.js $(node -v) instalado"
fi

# ==============================================================================
# 3. Instalar PostgreSQL 15
# ==============================================================================
print_header "3. Instalando PostgreSQL 15"
if command -v psql &> /dev/null; then
    PSQL_VERSION=$(psql --version)
    print_info "PostgreSQL já instalado: $PSQL_VERSION"
else
    sudo sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'
    wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo apt-key add -
    sudo apt update
    sudo apt install -y postgresql-15
    print_success "PostgreSQL $(psql --version | awk '{print $3}') instalado"
fi

# ==============================================================================
# 4. Instalar Redis
# ==============================================================================
print_header "4. Instalando Redis"
if command -v redis-cli &> /dev/null; then
    REDIS_VERSION=$(redis-cli --version)
    print_info "Redis já instalado: $REDIS_VERSION"
else
    sudo apt install -y redis-server
    print_success "Redis $(redis-cli --version) instalado"
fi

# ==============================================================================
# 5. Instalar PM2
# ==============================================================================
print_header "5. Instalando PM2"
if command -v pm2 &> /dev/null; then
    PM2_VERSION=$(pm2 -v)
    print_info "PM2 já instalado: v$PM2_VERSION"
else
    sudo npm install -g pm2
    print_success "PM2 v$(pm2 -v) instalado"
fi

# ==============================================================================
# 6. Instalar Nginx
# ==============================================================================
print_header "6. Instalando Nginx"
if command -v nginx &> /dev/null; then
    NGINX_VERSION=$(nginx -v 2>&1 | awk '{print $3}')
    print_info "Nginx já instalado: $NGINX_VERSION"
else
    sudo apt install -y nginx
    print_success "Nginx $(nginx -v 2>&1 | awk '{print $3}') instalado"
fi

# ==============================================================================
# 7. Configurar PostgreSQL
# ==============================================================================
print_header "7. Configurando PostgreSQL"
read -p "Nome do banco de dados [conectcrm]: " DB_NAME
DB_NAME=${DB_NAME:-conectcrm}

read -p "Usuário do banco de dados [conectcrm_user]: " DB_USER
DB_USER=${DB_USER:-conectcrm_user}

read -sp "Senha do banco de dados: " DB_PASS
echo

if [ -z "$DB_PASS" ]; then
    print_error "Senha não pode ser vazia!"
    exit 1
fi

# Criar banco e usuário
sudo -u postgres psql -c "CREATE DATABASE $DB_NAME;" 2>/dev/null || print_warning "Banco $DB_NAME já existe"
sudo -u postgres psql -c "CREATE USER $DB_USER WITH ENCRYPTED PASSWORD '$DB_PASS';" 2>/dev/null || print_warning "Usuário $DB_USER já existe"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;"
sudo -u postgres psql -d $DB_NAME -c "GRANT ALL ON SCHEMA public TO $DB_USER;"
sudo -u postgres psql -d $DB_NAME -c "GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO $DB_USER;"
sudo -u postgres psql -d $DB_NAME -c "GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO $DB_USER;"
sudo -u postgres psql -d $DB_NAME -c "ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO $DB_USER;"

print_success "PostgreSQL configurado"

# ==============================================================================
# 8. Clonar Repositório
# ==============================================================================
print_header "8. Clonando Repositório"
read -p "Diretório de instalação [/var/www/conectsuite]: " INSTALL_DIR
INSTALL_DIR=${INSTALL_DIR:-/var/www/conectsuite}

if [ -d "$INSTALL_DIR" ]; then
    print_warning "Diretório $INSTALL_DIR já existe"
    read -p "Deseja remover e clonar novamente? (s/N): " REMOVE
    if [ "$REMOVE" = "s" ] || [ "$REMOVE" = "S" ]; then
        sudo rm -rf $INSTALL_DIR
    else
        print_info "Pulando clone do repositório"
    fi
fi

if [ ! -d "$INSTALL_DIR" ]; then
    sudo mkdir -p $(dirname $INSTALL_DIR)
    sudo chown -R $USER:$USER $(dirname $INSTALL_DIR)
    git clone https://github.com/Dhonleno/conectsuite.git $INSTALL_DIR
    cd $INSTALL_DIR
    git checkout consolidacao-atendimento
    print_success "Repositório clonado"
fi

cd $INSTALL_DIR

# ==============================================================================
# 9. Configurar Backend
# ==============================================================================
print_header "9. Configurando Backend"
cd backend

if [ ! -f .env ]; then
    cp .env.example .env
    
    # Substituir valores no .env
    sed -i "s/DATABASE_HOST=.*/DATABASE_HOST=localhost/" .env
    sed -i "s/DATABASE_PORT=.*/DATABASE_PORT=5432/" .env
    sed -i "s/DATABASE_USERNAME=.*/DATABASE_USERNAME=$DB_USER/" .env
    sed -i "s/DATABASE_PASSWORD=.*/DATABASE_PASSWORD=$DB_PASS/" .env
    sed -i "s/DATABASE_NAME=.*/DATABASE_NAME=$DB_NAME/" .env
    
    # Gerar JWT_SECRET
    JWT_SECRET=$(openssl rand -base64 32)
    sed -i "s/JWT_SECRET=.*/JWT_SECRET=$JWT_SECRET/" .env
    
    print_success "Arquivo .env criado"
    print_warning "IMPORTANTE: Edite backend/.env e configure:"
    print_warning "  - WHATSAPP_API_TOKEN"
    print_warning "  - ANTHROPIC_API_KEY"
    print_warning "  - URLs de produção (FRONTEND_URL, BACKEND_URL)"
fi

# Instalar dependências
npm ci --production=false
print_success "Dependências instaladas"

# Build
npm run build
print_success "Backend compilado"

# Rodar migrations
npm run migration:run
print_success "Migrations executadas"

# ==============================================================================
# 10. Configurar Frontend
# ==============================================================================
print_header "10. Configurando Frontend"
cd $INSTALL_DIR/frontend-web

if [ ! -f .env ]; then
    cp .env.example .env
    print_success "Arquivo .env criado"
    print_warning "IMPORTANTE: Edite frontend-web/.env e configure:"
    print_warning "  - REACT_APP_API_URL (URL do backend em produção)"
fi

# Instalar dependências
npm ci --production=false
print_success "Dependências instaladas"

# Build
npm run build
print_success "Frontend compilado"

# ==============================================================================
# 11. Configurar PM2
# ==============================================================================
print_header "11. Configurando PM2"
cd $INSTALL_DIR/backend

# Criar ecosystem.config.js se não existir
if [ ! -f ecosystem.config.js ]; then
    cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'conectsuite-backend',
    script: './dist/src/main.js',
    instances: 2,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
    merge_logs: true,
    watch: false,
    max_memory_restart: '1G',
    autorestart: true,
    restart_delay: 4000
  }]
};
EOF
fi

mkdir -p logs

# Iniciar aplicação
pm2 start ecosystem.config.js
pm2 save
pm2 startup | tail -n 1 | sudo bash

print_success "PM2 configurado e aplicação iniciada"

# ==============================================================================
# 12. Configurar Nginx
# ==============================================================================
print_header "12. Configurando Nginx"

read -p "Domínio do backend [api.conectsuite.com]: " BACKEND_DOMAIN
BACKEND_DOMAIN=${BACKEND_DOMAIN:-api.conectsuite.com}

read -p "Domínio do frontend [app.conectsuite.com]: " FRONTEND_DOMAIN
FRONTEND_DOMAIN=${FRONTEND_DOMAIN:-app.conectsuite.com}

print_warning "IMPORTANTE: Configure DNS apontando:"
print_warning "  $BACKEND_DOMAIN → IP do servidor"
print_warning "  $FRONTEND_DOMAIN → IP do servidor"
read -p "Pressione ENTER quando DNS estiver configurado..."

# Criar configuração Nginx backend
sudo tee /etc/nginx/sites-available/conectsuite-backend > /dev/null << EOF
server {
    listen 80;
    server_name $BACKEND_DOMAIN;

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

# Criar configuração Nginx frontend
sudo tee /etc/nginx/sites-available/conectsuite-frontend > /dev/null << EOF
server {
    listen 80;
    server_name $FRONTEND_DOMAIN;

    root $INSTALL_DIR/frontend-web/build;
    index index.html;

    location / {
        try_files \$uri \$uri/ /index.html;
    }
}
EOF

# Habilitar sites
sudo ln -sf /etc/nginx/sites-available/conectsuite-backend /etc/nginx/sites-enabled/
sudo ln -sf /etc/nginx/sites-available/conectsuite-frontend /etc/nginx/sites-enabled/

# Testar e recarregar
sudo nginx -t
sudo systemctl reload nginx

print_success "Nginx configurado"

# ==============================================================================
# 13. Configurar SSL (Let's Encrypt)
# ==============================================================================
print_header "13. Configurando SSL"

read -p "Instalar SSL com Let's Encrypt? (S/n): " INSTALL_SSL
if [ "$INSTALL_SSL" != "n" ] && [ "$INSTALL_SSL" != "N" ]; then
    sudo apt install -y certbot python3-certbot-nginx
    sudo certbot --nginx -d $BACKEND_DOMAIN -d $FRONTEND_DOMAIN --non-interactive --agree-tos --email admin@$FRONTEND_DOMAIN || print_warning "Erro ao configurar SSL. Configure manualmente depois."
    print_success "SSL configurado"
else
    print_warning "SSL não configurado. Configure manualmente depois com: sudo certbot --nginx"
fi

# ==============================================================================
# Finalização
# ==============================================================================
print_header "🎉 Setup Concluído!"

print_success "ConectSuite instalado com sucesso!"
echo ""
print_info "Próximos passos:"
echo "  1. Edite backend/.env e configure:"
echo "     - WHATSAPP_API_TOKEN"
echo "     - ANTHROPIC_API_KEY"
echo "     - SMTP (se necessário)"
echo ""
echo "  2. Edite frontend-web/.env:"
echo "     - REACT_APP_API_URL=https://$BACKEND_DOMAIN"
echo "     - REACT_APP_WS_URL=wss://$BACKEND_DOMAIN"
echo ""
echo "  3. Rebuild frontend: cd $INSTALL_DIR/frontend-web && npm run build"
echo ""
echo "  4. Reinicie backend: pm2 restart conectsuite-backend"
echo ""
print_info "URLs:"
echo "  Backend:  http://$BACKEND_DOMAIN (ou https:// se SSL configurado)"
echo "  Frontend: http://$FRONTEND_DOMAIN (ou https:// se SSL configurado)"
echo ""
print_info "Comandos úteis:"
echo "  pm2 status                    # Ver status da aplicação"
echo "  pm2 logs conectsuite-backend  # Ver logs"
echo "  pm2 restart all               # Reiniciar aplicação"
echo "  sudo systemctl status nginx   # Status do Nginx"
echo ""
print_success "Documentação completa em: $INSTALL_DIR/DEPLOY_GUIDE.md"
