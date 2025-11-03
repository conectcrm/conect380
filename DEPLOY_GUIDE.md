# 🚀 Guia Completo de Deploy - ConectSuite

Este guia cobre todas as formas de fazer deploy do ConectSuite em diferentes ambientes.

## 📋 Pré-requisitos

### Servidor/Infraestrutura
- [ ] Servidor Linux (Ubuntu 20.04+ recomendado)
- [ ] Node.js 20.x instalado
- [ ] PostgreSQL 15+ instalado
- [ ] Redis 7+ instalado
- [ ] Nginx (para proxy reverso)
- [ ] SSL/HTTPS (Let's Encrypt recomendado)
- [ ] PM2 (para gerenciar processos Node.js)

### Domínios
- [ ] Domínio para backend (ex: `api.conectsuite.com`)
- [ ] Domínio para frontend (ex: `app.conectsuite.com` ou `conectsuite.com`)
- [ ] DNS configurado apontando para o servidor

### Credenciais Necessárias
- [ ] WhatsApp API (Meta Business)
- [ ] Anthropic API Key (Claude)
- [ ] SMTP (para emails)
- [ ] Chaves SSH para GitHub
- [ ] Secrets configurados no GitHub Actions

---

## 🎯 Opções de Deploy

### 1️⃣ Deploy Manual (EC2, VPS, Servidor Próprio)
### 2️⃣ Deploy Automatizado (GitHub Actions)
### 3️⃣ Deploy com Docker
### 4️⃣ Deploy Backend em PaaS (Azure App Service, Heroku)
### 5️⃣ Deploy Frontend em CDN (Vercel, Netlify, S3+CloudFront)

---

## 1️⃣ Deploy Manual (Passo a Passo)

### 🔧 Preparação do Servidor

```bash
# 1. Conectar ao servidor
ssh -i conectcrm-key.pem ubuntu@SEU_IP

# 2. Atualizar sistema
sudo apt update && sudo apt upgrade -y

# 3. Instalar Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# 4. Instalar PostgreSQL 15
sudo sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'
wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo apt-key add -
sudo apt update
sudo apt install -y postgresql-15

# 5. Instalar Redis
sudo apt install -y redis-server

# 6. Instalar PM2
sudo npm install -g pm2

# 7. Instalar Nginx
sudo apt install -y nginx

# 8. Verificar instalações
node --version    # v20.x.x
npm --version     # 10.x.x
psql --version    # 15.x
redis-cli --version
nginx -v
pm2 --version
```

### 🗄️ Configurar Banco de Dados

```bash
# 1. Acessar PostgreSQL
sudo -u postgres psql

# 2. Criar banco e usuário
CREATE DATABASE conectcrm;
CREATE USER conectcrm_user WITH ENCRYPTED PASSWORD 'sua_senha_forte_aqui';
GRANT ALL PRIVILEGES ON DATABASE conectcrm TO conectcrm_user;

# Dar permissões no schema public
\c conectcrm
GRANT ALL ON SCHEMA public TO conectcrm_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO conectcrm_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO conectcrm_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO conectcrm_user;

\q

# 3. Configurar PostgreSQL para aceitar conexões locais
sudo nano /etc/postgresql/15/main/pg_hba.conf
# Adicionar linha:
# local   all             conectcrm_user                          md5

sudo systemctl restart postgresql
```

### 📦 Clonar e Configurar Aplicação

```bash
# 1. Criar diretório
sudo mkdir -p /var/www/conectsuite
sudo chown -R $USER:$USER /var/www/conectsuite
cd /var/www/conectsuite

# 2. Clonar repositório
git clone https://github.com/Dhonleno/conectsuite.git .
git checkout consolidacao-atendimento  # ou main

# 3. Backend - Configurar .env
cd backend
cp .env.example .env
nano .env
```

**Configurar backend/.env**:
```bash
# Database
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USERNAME=conectcrm_user
DATABASE_PASSWORD=sua_senha_forte_aqui
DATABASE_NAME=conectcrm

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=  # deixar vazio se não configurou senha

# JWT
JWT_SECRET=gere_uma_chave_secreta_forte_32_caracteres_minimo
JWT_EXPIRATION=7d

# URLs
FRONTEND_URL=https://app.conectsuite.com
BACKEND_URL=https://api.conectsuite.com

# WhatsApp
WHATSAPP_API_URL=https://graph.facebook.com/v18.0
WHATSAPP_API_TOKEN=seu_token_whatsapp_aqui
WHATSAPP_PHONE_NUMBER_ID=seu_phone_number_id

# Anthropic
ANTHROPIC_API_KEY=sk-ant-api03-sua-chave-aqui
ANTHROPIC_MODEL=claude-3-5-sonnet-20241022

# SMTP (opcional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=seu-email@gmail.com
SMTP_PASS=sua-senha-app

# Ambiente
NODE_ENV=production
PORT=3001
```

```bash
# 4. Instalar dependências e build backend
npm ci --production=false
npm run build

# 5. Rodar migrations
npm run migration:run

# 6. Frontend - Configurar .env
cd ../frontend-web
cp .env.example .env
nano .env
```

**Configurar frontend-web/.env**:
```bash
REACT_APP_API_URL=https://api.conectsuite.com
REACT_APP_WS_URL=wss://api.conectsuite.com
```

```bash
# 7. Instalar dependências e build frontend
npm ci --production=false
npm run build
```

### 🔄 Configurar PM2 (Backend)

```bash
# 1. Criar arquivo ecosystem
cd /var/www/conectsuite/backend
nano ecosystem.config.js
```

**ecosystem.config.js**:
```javascript
module.exports = {
  apps: [{
    name: 'conectsuite-backend',
    script: './dist/src/main.js',
    instances: 2,  // ou 'max' para usar todos os CPUs
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
```

```bash
# 2. Criar pasta de logs
mkdir -p logs

# 3. Iniciar aplicação
pm2 start ecosystem.config.js

# 4. Verificar status
pm2 status
pm2 logs conectsuite-backend

# 5. Configurar PM2 para iniciar no boot
pm2 startup
pm2 save
```

### 🌐 Configurar Nginx

```bash
# 1. Criar configuração do backend
sudo nano /etc/nginx/sites-available/conectsuite-backend
```

**Nginx - Backend (api.conectsuite.com)**:
```nginx
upstream backend {
    least_conn;
    server 127.0.0.1:3001;
}

server {
    listen 80;
    server_name api.conectsuite.com;

    # Redirecionar para HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.conectsuite.com;

    # SSL (configurar após obter certificado)
    ssl_certificate /etc/letsencrypt/live/api.conectsuite.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.conectsuite.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Logs
    access_log /var/log/nginx/conectsuite-backend-access.log;
    error_log /var/log/nginx/conectsuite-backend-error.log;

    # Proxy para backend
    location / {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        
        # Headers
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        
        # Cache bypass
        proxy_cache_bypass $http_upgrade;
    }

    # WebSocket
    location /socket.io/ {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Limite de upload
    client_max_body_size 50M;
}
```

```bash
# 2. Criar configuração do frontend
sudo nano /etc/nginx/sites-available/conectsuite-frontend
```

**Nginx - Frontend (app.conectsuite.com)**:
```nginx
server {
    listen 80;
    server_name app.conectsuite.com conectsuite.com www.conectsuite.com;

    # Redirecionar para HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name app.conectsuite.com conectsuite.com www.conectsuite.com;

    # SSL
    ssl_certificate /etc/letsencrypt/live/app.conectsuite.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/app.conectsuite.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Root
    root /var/www/conectsuite/frontend-web/build;
    index index.html;

    # Logs
    access_log /var/log/nginx/conectsuite-frontend-access.log;
    error_log /var/log/nginx/conectsuite-frontend-error.log;

    # Gzip
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json;

    # React Router (SPA)
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache de assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Limite de upload
    client_max_body_size 50M;
}
```

```bash
# 3. Habilitar sites
sudo ln -s /etc/nginx/sites-available/conectsuite-backend /etc/nginx/sites-enabled/
sudo ln -s /etc/nginx/sites-available/conectsuite-frontend /etc/nginx/sites-enabled/

# 4. Testar configuração
sudo nginx -t

# 5. Recarregar Nginx
sudo systemctl reload nginx
```

### 🔒 Configurar SSL (Let's Encrypt)

```bash
# 1. Instalar Certbot
sudo apt install -y certbot python3-certbot-nginx

# 2. Obter certificados
sudo certbot --nginx -d api.conectsuite.com
sudo certbot --nginx -d app.conectsuite.com -d conectsuite.com -d www.conectsuite.com

# 3. Renovação automática (já configurado)
sudo systemctl status certbot.timer

# 4. Testar renovação
sudo certbot renew --dry-run
```

### ✅ Verificar Deploy

```bash
# 1. Backend
curl https://api.conectsuite.com/health
# Deve retornar: {"status":"ok"}

# 2. Frontend
curl -I https://app.conectsuite.com
# Deve retornar: 200 OK

# 3. WebSocket
# Testar no navegador: https://app.conectsuite.com

# 4. PM2
pm2 status
pm2 logs conectsuite-backend --lines 50

# 5. Nginx
sudo nginx -t
sudo systemctl status nginx

# 6. PostgreSQL
sudo systemctl status postgresql

# 7. Redis
redis-cli ping
# Deve retornar: PONG
```

---

## 2️⃣ Deploy Automatizado (GitHub Actions)

**Já está configurado!** Veja `.github/workflows/deploy.yml`

### Configurar Secrets

1. Acesse: https://github.com/Dhonleno/conectsuite/settings/secrets/actions
2. Adicione os secrets conforme `.github/GITHUB_SECRETS.md`

### Trigger Deploy

```powershell
# Push para main (deploy automático)
git push origin consolidacao-atendimento:main

# OU criar tag (release)
git tag -a v1.0.1 -m "Release v1.0.1"
git push origin v1.0.1

# OU trigger manual
# GitHub → Actions → "CD - Deploy para Produção" → "Run workflow"
```

---

## 3️⃣ Deploy com Docker

```bash
# 1. Build imagens
docker-compose build

# 2. Subir containers
docker-compose up -d

# 3. Verificar logs
docker-compose logs -f

# 4. Rodar migrations
docker-compose exec backend npm run migration:run

# 5. Parar containers
docker-compose down
```

---

## 📊 Monitoramento Pós-Deploy

### Logs
```bash
# PM2
pm2 logs conectsuite-backend --lines 100

# Nginx
sudo tail -f /var/log/nginx/conectsuite-backend-access.log
sudo tail -f /var/log/nginx/conectsuite-backend-error.log

# PostgreSQL
sudo tail -f /var/log/postgresql/postgresql-15-main.log

# Sistema
sudo journalctl -u nginx -f
```

### Performance
```bash
# CPU/Memória
pm2 monit

# Conexões
pm2 show conectsuite-backend

# Banco de dados
sudo -u postgres psql conectcrm -c "SELECT count(*) FROM pg_stat_activity;"
```

---

## 🔄 Atualização da Aplicação

```bash
cd /var/www/conectsuite

# 1. Baixar atualizações
git pull origin consolidacao-atendimento

# 2. Backend
cd backend
npm ci --production=false
npm run build
npm run migration:run

# 3. Reiniciar backend
pm2 restart conectsuite-backend

# 4. Frontend
cd ../frontend-web
npm ci --production=false
npm run build

# 5. Nginx já serve o novo build automaticamente
```

---

## 🐛 Troubleshooting

### Backend não inicia
```bash
# Verificar logs
pm2 logs conectsuite-backend

# Verificar variáveis de ambiente
pm2 env 0

# Testar manualmente
cd /var/www/conectsuite/backend
node dist/src/main.js
```

### Frontend 404
```bash
# Verificar build
ls -la /var/www/conectsuite/frontend-web/build

# Testar Nginx
sudo nginx -t

# Recarregar Nginx
sudo systemctl reload nginx
```

### Banco de dados
```bash
# Conectar
sudo -u postgres psql conectcrm

# Ver tabelas
\dt

# Ver conexões
SELECT * FROM pg_stat_activity;
```

---

## 📞 Suporte

Problemas? Veja:
- **SUPPORT.md**: Recursos de ajuda
- **TROUBLESHOOTING.md**: Problemas comuns
- **Issues**: https://github.com/Dhonleno/conectsuite/issues

---

**Última atualização**: Novembro 2025  
**Versão**: 1.0.0
