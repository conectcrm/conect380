# 🚀 Guia de Deploy - Conect360 (Suite All-in-One)

> Escopo: guia de deploy da **suite Conect360**. Algumas seções citam integrações e realtime do módulo **Atendimento (Omnichannel)** quando aplicável.
>
> Documentação geral (índice): [docs/INDICE_DOCUMENTACAO.md](INDICE_DOCUMENTACAO.md)

## 📋 Índice
1. [Pré-requisitos](#pré-requisitos)
2. [Preparação do Ambiente](#preparação-do-ambiente)
3. [Configuração de Variáveis de Ambiente](#configuração-de-variáveis-de-ambiente)
4. [Build e Deploy](#build-e-deploy)
5. [Testes Pós-Deploy](#testes-pós-deploy)
6. [Monitoramento e Manutenção](#monitoramento-e-manutenção)
7. [Rollback](#rollback)

---

## 🔧 Pré-requisitos

### Infraestrutura Necessária

| Componente | Especificação Mínima | Recomendado |
|------------|---------------------|-------------|
| **Servidor** | 2 vCPU, 4GB RAM | 4 vCPU, 8GB RAM |
| **Node.js** | v18.x | v20.x LTS |
| **PostgreSQL** | v14.x | v16.x |
| **Redis** | v6.x | v7.x |
| **Disco** | 20GB SSD | 50GB SSD |

### Serviços Externos (Opcionais)

- **WhatsApp Business API** - Meta Business Suite
- **OpenAI API** - Platform OpenAI
- **Anthropic API** - Console Anthropic
- **Telegram Bot API** - Telegram BotFather
- **Twilio API** - Twilio Console

---

## 📦 Preparação do Ambiente

### 1. Configurar Servidor Linux (Ubuntu 22.04 LTS)

```bash
# Atualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar Node.js v20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verificar versão
node -v  # v20.x.x
npm -v   # 10.x.x

# Instalar PM2 (Process Manager)
sudo npm install -g pm2

# Instalar Nginx
sudo apt install -y nginx

# Instalar PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Instalar Redis
sudo apt install -y redis-server
```

---

### 2. Configurar PostgreSQL

```bash
# Acessar PostgreSQL
sudo -u postgres psql

# Criar database e usuário
CREATE DATABASE conectcrm_production;
CREATE USER conectcrm_user WITH ENCRYPTED PASSWORD 'sua_senha_super_segura';
GRANT ALL PRIVILEGES ON DATABASE conectcrm_production TO conectcrm_user;
ALTER DATABASE conectcrm_production OWNER TO conectcrm_user;
\q

# Testar conexão
psql -h localhost -U conectcrm_user -d conectcrm_production
```

**Executar Migrations:**

```bash
cd /var/www/conectcrm/backend

# Criar schema de atendimento
psql -h localhost -U conectcrm_user -d conectcrm_production < database/migrations/create-atendimento-schema.sql

# Criar tabelas de integrações
psql -h localhost -U conectcrm_user -d conectcrm_production < database/migrations/create-integracoes-config.sql
```

---

### 3. Configurar Redis

```bash
# Editar configuração
sudo nano /etc/redis/redis.conf

# Definir senha (procurar e descomentar):
requirepass sua_senha_redis_super_segura

# Reiniciar Redis
sudo systemctl restart redis-server
sudo systemctl enable redis-server

# Testar conexão
redis-cli -a sua_senha_redis_super_segura
PING  # Deve retornar: PONG
```

---

## 🔐 Configuração de Variáveis de Ambiente

### Backend (.env)

Criar arquivo em `/var/www/conectcrm/backend/.env`:

```bash
# === AMBIENTE ===
NODE_ENV=production
PORT=3001

# === DATABASE ===
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=conectcrm_user
DB_PASSWORD=sua_senha_super_segura
DB_DATABASE=conectcrm_production

# === JWT ===
JWT_SECRET=sua_chave_jwt_ultra_secreta_com_pelo_menos_32_caracteres
JWT_EXPIRES_IN=7d

# === REDIS ===
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=sua_senha_redis_super_segura

# === CORS ===
CORS_ORIGIN=https://seudominio.com.br,https://www.seudominio.com.br

# === INTEGRAÇÃO WHATSAPP (Opcional) ===
WHATSAPP_API_TOKEN=EAAxxxxxxxxxxxxxxxxxxxxxxxx
WHATSAPP_PHONE_NUMBER_ID=123456789012345
WHATSAPP_BUSINESS_ACCOUNT_ID=987654321098765
WHATSAPP_WEBHOOK_VERIFY_TOKEN=seu_token_webhook_seguro

# === INTEGRAÇÃO OPENAI (Opcional) ===
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
OPENAI_MODEL=gpt-4-turbo
OPENAI_MAX_TOKENS=1000

# === INTEGRAÇÃO ANTHROPIC (Opcional) ===
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
ANTHROPIC_MODEL=claude-3-5-sonnet-20241022
ANTHROPIC_MAX_TOKENS=1000

# === INTEGRAÇÃO TELEGRAM (Opcional) ===
TELEGRAM_BOT_TOKEN=1234567890:ABCdefGHIjklMNOpqrsTUVwxyz

# === INTEGRAÇÃO TWILIO (Opcional) ===
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_PHONE_NUMBER=+5511999999999
TWILIO_WHATSAPP_NUMBER=+5511888888888

# === LOGS ===
LOG_LEVEL=info
LOG_FILE=/var/log/conectcrm/backend.log

# === UPLOAD ===
UPLOAD_DIR=/var/www/conectcrm/uploads
MAX_FILE_SIZE=10485760  # 10MB

# === EMAIL (Opcional) ===
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=seu-email@gmail.com
SMTP_PASS=sua_senha_app
EMAIL_FROM=noreply@conectcrm.com.br
```

---

### Frontend (.env.production)

Criar arquivo em `/var/www/conectcrm/frontend-web/.env.production`:

```bash
# === API ===
REACT_APP_API_URL=https://api.seudominio.com.br
REACT_APP_WS_URL=wss://api.seudominio.com.br

# === AMBIENTE ===
REACT_APP_ENV=production

# === ANALYTICS (Opcional) ===
REACT_APP_GA_TRACKING_ID=G-XXXXXXXXXX

# === SENTRY (Opcional) ===
REACT_APP_SENTRY_DSN=https://xxxxx@sentry.io/xxxxx
```

---

## 🏗️ Build e Deploy

### 1. Clonar Repositório

```bash
# Criar diretório
sudo mkdir -p /var/www/conectcrm
sudo chown -R $USER:$USER /var/www/conectcrm

# Clonar projeto
cd /var/www
git clone https://github.com/Dhonleno/conectcrm.git
cd conectcrm
```

---

### 2. Deploy do Backend

```bash
cd /var/www/conectcrm/backend

# Instalar dependências
npm ci --production

# Copiar .env
cp .env.example .env
nano .env  # Editar variáveis

# Build
npm run build

# Testar build
node dist/src/main.js  # Ctrl+C para sair

# Configurar PM2
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup  # Seguir instruções

# Verificar logs
pm2 logs conectcrm-backend
```

**ecosystem.config.js:**

```javascript
module.exports = {
  apps: [{
    name: 'conectcrm-backend',
    script: 'dist/src/main.js',
    cwd: '/var/www/conectcrm/backend',
    instances: 2,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    error_file: '/var/log/conectcrm/backend-error.log',
    out_file: '/var/log/conectcrm/backend-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    max_memory_restart: '1G',
    autorestart: true,
    watch: false
  }]
};
```

---

### 3. Deploy do Frontend

```bash
cd /var/www/conectcrm/frontend-web

# Instalar dependências
npm ci

# Copiar .env.production
cp .env.example .env.production
nano .env.production  # Editar variáveis

# Build para produção
npm run build

# Verificar build
ls -lh build/  # Deve ter ~30MB
```

---

### 4. Configurar Nginx

**Arquivo:** `/etc/nginx/sites-available/conectcrm`

```nginx
# Backend (API + WebSocket)
server {
    listen 80;
    server_name api.seudominio.com.br;

    # Redirecionar para HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.seudominio.com.br;

    # SSL Certificates (Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/api.seudominio.com.br/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.seudominio.com.br/privkey.pem;

    # SSL Config
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Logs
    access_log /var/log/nginx/conectcrm-api-access.log;
    error_log /var/log/nginx/conectcrm-api-error.log;

    # Proxy para Backend
    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts para WebSocket
        proxy_read_timeout 86400s;
        proxy_send_timeout 86400s;
    }

    # WebSocket específico
    location /socket.io/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Uploads
    location /uploads/ {
        alias /var/www/conectcrm/uploads/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}

# Frontend
server {
    listen 80;
    server_name seudominio.com.br www.seudominio.com.br;

    # Redirecionar para HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name seudominio.com.br www.seudominio.com.br;

    # SSL Certificates
    ssl_certificate /etc/letsencrypt/live/seudominio.com.br/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/seudominio.com.br/privkey.pem;

    # SSL Config
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Logs
    access_log /var/log/nginx/conectcrm-frontend-access.log;
    error_log /var/log/nginx/conectcrm-frontend-error.log;

    # Root
    root /var/www/conectcrm/frontend-web/build;
    index index.html;

    # Gzip
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
    gzip_min_length 1000;

    # Cache estático
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # SPA - Todas as rotas para index.html
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
}
```

**Ativar configuração:**

```bash
# Criar link simbólico
sudo ln -s /etc/nginx/sites-available/conectcrm /etc/nginx/sites-enabled/

# Testar configuração
sudo nginx -t

# Recarregar Nginx
sudo systemctl reload nginx
```

---

### 5. Configurar SSL (Let's Encrypt)

```bash
# Instalar Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obter certificados
sudo certbot --nginx -d seudominio.com.br -d www.seudominio.com.br
sudo certbot --nginx -d api.seudominio.com.br

# Renovação automática (já configurado)
sudo certbot renew --dry-run
```

---

## ✅ Testes Pós-Deploy

### 1. Verificar Backend

```bash
# Status do PM2
pm2 status

# Logs em tempo real
pm2 logs conectcrm-backend --lines 100

# Health check
curl https://api.seudominio.com.br/health
# Esperado: { "status": "ok", "timestamp": "..." }

# Testar WebSocket
curl -i -N -H "Connection: Upgrade" -H "Upgrade: websocket" https://api.seudominio.com.br/socket.io/
```

---

### 2. Verificar Frontend

```bash
# Acessar no navegador
# https://seudominio.com.br

# Verificar console (F12):
# - Sem erros 404
# - WebSocket conectado
# - API respondendo
```

---

### 3. Testar Integrações

**WhatsApp:**
```bash
curl -X POST https://api.seudominio.com.br/atendimento/canais/validar \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN" \
  -d '{"tipo":"whatsapp","credenciais":{"whatsapp_api_token":"EAAxxxxx","whatsapp_phone_number_id":"123456789012345"}}'
```

**OpenAI:**
```bash
curl -X POST https://api.seudominio.com.br/atendimento/canais/validar \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN" \
  -d '{"tipo":"openai","credenciais":{"openai_api_key":"sk-proj-xxxxx","openai_model":"gpt-4"}}'
```

---

## 📊 Monitoramento e Manutenção

### 1. Monitoramento com PM2

```bash
# Dashboard interativo
pm2 monit

# Métricas
pm2 web  # http://localhost:9615

# Logs por data
pm2 logs --timestamp
```

---

### 2. Monitoramento de Recursos

```bash
# CPU e Memória
htop

# Disco
df -h

# Conexões PostgreSQL
sudo -u postgres psql -c "SELECT count(*) FROM pg_stat_activity;"

# Conexões Redis
redis-cli -a sua_senha info clients
```

---

### 3. Backup Automático

**Script:** `/var/scripts/backup-conectcrm.sh`

```bash
#!/bin/bash

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/var/backups/conectcrm"
mkdir -p $BACKUP_DIR

# Backup PostgreSQL
pg_dump -h localhost -U conectcrm_user conectcrm_production | gzip > $BACKUP_DIR/db_$DATE.sql.gz

# Backup Uploads
tar -czf $BACKUP_DIR/uploads_$DATE.tar.gz /var/www/conectcrm/uploads

# Manter apenas últimos 7 dias
find $BACKUP_DIR -name "*.gz" -mtime +7 -delete

echo "Backup concluído: $DATE"
```

**Cron diário (3h da manhã):**

```bash
crontab -e

# Adicionar linha:
0 3 * * * /var/scripts/backup-conectcrm.sh >> /var/log/conectcrm/backup.log 2>&1
```

---

### 4. Atualizações

```bash
# 1. Fazer backup

# 2. Pull do código
cd /var/www/conectcrm
git pull origin main

# 3. Backend
cd backend
npm ci --production
npm run build
pm2 restart conectcrm-backend

# 4. Frontend
cd ../frontend-web
npm ci
npm run build

# 5. Verificar
pm2 logs conectcrm-backend --lines 50
curl https://api.seudominio.com.br/health
```

---

## 🔄 Rollback

### Rollback do Backend

```bash
# 1. Parar aplicação
pm2 stop conectcrm-backend

# 2. Restaurar código anterior
cd /var/www/conectcrm/backend
git reset --hard HEAD~1

# 3. Reinstalar e rebuild
npm ci --production
npm run build

# 4. Restaurar database (se necessário)
gunzip < /var/backups/conectcrm/db_20250110_030000.sql.gz | psql -h localhost -U conectcrm_user -d conectcrm_production

# 5. Reiniciar
pm2 restart conectcrm-backend
pm2 logs conectcrm-backend
```

---

### Rollback do Frontend

```bash
# 1. Restaurar código anterior
cd /var/www/conectcrm/frontend-web
git reset --hard HEAD~1

# 2. Rebuild
npm ci
npm run build

# 3. Verificar
curl -I https://seudominio.com.br
```

---

## 📋 Checklist de Deploy

### Pré-Deploy
- [ ] Testes locais passando (E2E, Unit)
- [ ] Código revisado e aprovado
- [ ] Backup do banco de dados atual
- [ ] Variáveis de ambiente configuradas
- [ ] SSL certificados válidos

### Durante Deploy
- [ ] Backend buildado sem erros
- [ ] Frontend buildado sem erros
- [ ] Migrations executadas
- [ ] PM2 configurado e rodando
- [ ] Nginx configurado e reload feito

### Pós-Deploy
- [ ] Health check OK
- [ ] WebSocket conectando
- [ ] Frontend carregando
- [ ] Login funcionando
- [ ] Integrações testadas
- [ ] Logs sem erros críticos
- [ ] Monitoramento ativo

---

## 🆘 Suporte

**Documentação:** `/docs`  
**Logs Backend:** `/var/log/conectcrm/backend.log`  
**Logs Nginx:** `/var/log/nginx/conectcrm-*.log`  
**Logs PM2:** `pm2 logs conectcrm-backend`

---

**Data:** 11/10/2025  
**Versão:** 1.0.0  
**Autor:** Equipe Conect360
