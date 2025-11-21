# 🚀 Guia de Deployment - ConectCRM Backend

## 📋 Índice

1. [Preparação do Servidor](#preparação-do-servidor)
2. [Configuração de Ambiente](#configuração-de-ambiente)
3. [Deploy do Backend](#deploy-do-backend)
4. [Backup Automático](#backup-automático)
5. [Monitoramento](#monitoramento)
6. [Troubleshooting](#troubleshooting)

---

## 1. Preparação do Servidor

### 1.1. Requisitos Mínimos

| Recurso | Desenvolvimento | Produção (Pequeno) | Produção (Médio) |
|---------|----------------|-------------------|------------------|
| CPU | 2 vCPU | 2 vCPU | 4 vCPU |
| RAM | 2 GB | 4 GB | 8 GB |
| Disco | 20 GB | 50 GB | 100 GB |
| OS | Ubuntu 20.04+ | Ubuntu 22.04 LTS | Ubuntu 22.04 LTS |

### 1.2. Instalação de Dependências

```bash
# Atualiza sistema
sudo apt update && sudo apt upgrade -y

# Node.js 20.x (LTS)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# PostgreSQL 15
sudo sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'
wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo apt-key add -
sudo apt update
sudo apt install -y postgresql-15 postgresql-client-15

# PM2 (Process Manager)
sudo npm install -g pm2

# Nginx (Reverse Proxy)
sudo apt install -y nginx

# Git
sudo apt install -y git

# Build essentials
sudo apt install -y build-essential
```

### 1.3. Configuração PostgreSQL

```bash
# Acessa PostgreSQL
sudo -u postgres psql

-- Cria banco e usuário
CREATE DATABASE conectcrm;
CREATE USER conectcrm_user WITH ENCRYPTED PASSWORD 'SUA_SENHA_SUPER_FORTE_AQUI';
GRANT ALL PRIVILEGES ON DATABASE conectcrm TO conectcrm_user;

-- Sai
\q

# Testa conexão
psql -h localhost -U conectcrm_user -d conectcrm
```

---

## 2. Configuração de Ambiente

### 2.1. Clone do Repositório

```bash
# Cria diretório para aplicação
sudo mkdir -p /var/www/conectcrm
sudo chown -R $USER:$USER /var/www/conectcrm

# Clone
cd /var/www
git clone https://github.com/seu-usuario/conectcrm.git
cd conectcrm/backend

# Instala dependências
npm install --production
```

### 2.2. Configuração .env

```bash
# Copia exemplo
cp .env.example .env

# Edita variáveis (use nano ou vim)
nano .env
```

**Variáveis críticas para produção:**

```bash
# ============================================
# AMBIENTE
# ============================================
NODE_ENV=production

# ============================================
# BANCO DE DADOS
# ============================================
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=conectcrm_user
DB_PASSWORD=SUA_SENHA_SUPER_FORTE_AQUI
DB_DATABASE=conectcrm

# ============================================
# JWT & AUTENTICAÇÃO
# ============================================
JWT_SECRET=gere-uma-chave-super-segura-aqui-64-caracteres-no-minimo
JWT_EXPIRATION=7d

# ============================================
# SERVIDOR
# ============================================
PORT=3001
APP_PORT=3001

# ============================================
# SSL/HTTPS
# ============================================
SSL_ENABLED=true
SSL_CERT_PATH=/etc/letsencrypt/live/api.seudominio.com.br/fullchain.pem
SSL_KEY_PATH=/etc/letsencrypt/live/api.seudominio.com.br/privkey.pem
FORCE_HTTPS=true

# ============================================
# CORS
# ============================================
CORS_ORIGINS=https://app.seudominio.com.br,https://www.seudominio.com.br

# ============================================
# BACKUP
# ============================================
ENABLE_BACKUP=true
BACKUP_RETENTION_DAILY=7
BACKUP_RETENTION_WEEKLY=4
BACKUP_RETENTION_MONTHLY=12

ENABLE_S3_UPLOAD=true
S3_BUCKET=conectcrm-backups-producao
S3_REGION=us-east-1

# ============================================
# SENTRY (Error Tracking)
# ============================================
ENABLE_SENTRY=true
SENTRY_DSN=https://seu-dsn@sentry.io/projeto-id

# ============================================
# SLACK (Notificações)
# ============================================
ENABLE_SLACK_NOTIFICATIONS=true
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/SEU/WEBHOOK/URL

# ============================================
# UPTIME MONITORING
# ============================================
ENABLE_UPTIME_MONITORING=true
UPTIME_CHECK_URL=https://uptime-monitor.com/check/conectcrm
```

### 2.3. Gerar JWT Secret Forte

```bash
# Gera secret de 64 caracteres
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 2.4. Build do Backend

```bash
# Compila TypeScript
npm run build

# Verifica se dist/ foi criado
ls -la dist/
```

---

## 3. Deploy do Backend

### 3.1. Configuração PM2

```bash
# Cria arquivo de configuração PM2
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [
    {
      name: 'conectcrm-backend',
      script: 'dist/src/main.js',
      instances: 2, // 2 instâncias (cluster mode)
      exec_mode: 'cluster',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
      },
      error_file: '/var/log/conectcrm-backend-error.log',
      out_file: '/var/log/conectcrm-backend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    },
  ],
};
EOF

# Inicia com PM2
pm2 start ecosystem.config.js

# Salva configuração para auto-start
pm2 save
pm2 startup

# Verifica status
pm2 status
pm2 logs conectcrm-backend --lines 50
```

### 3.2. Executa Migrations

```bash
# Antes de iniciar, roda migrations
npm run migration:run

# Verifica migrations aplicadas
npm run migration:show
```

### 3.3. Configuração Nginx (Reverse Proxy)

```bash
# Cria configuração Nginx
sudo nano /etc/nginx/sites-available/conectcrm-backend
```

**Conteúdo do arquivo:**

```nginx
# ConectCRM Backend - Reverse Proxy
server {
    listen 80;
    listen [::]:80;
    server_name api.seudominio.com.br;

    # Redireciona HTTP para HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name api.seudominio.com.br;

    # SSL Certificates (Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/api.seudominio.com.br/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.seudominio.com.br/privkey.pem;
    ssl_trusted_certificate /etc/letsencrypt/live/api.seudominio.com.br/chain.pem;

    # SSL Configuration (Mozilla Intermediate)
    ssl_session_timeout 1d;
    ssl_session_cache shared:MozSSL:10m;
    ssl_session_tickets off;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    # HSTS (31536000 seconds = 1 year)
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;

    # Logs
    access_log /var/log/nginx/conectcrm-backend-access.log;
    error_log /var/log/nginx/conectcrm-backend-error.log;

    # Proxy para Backend
    location / {
        proxy_pass http://localhost:3001;
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
        
        # Buffer
        proxy_buffering off;
        proxy_cache_bypass $http_upgrade;
    }

    # WebSocket (Socket.io)
    location /socket.io/ {
        proxy_pass http://localhost:3001/socket.io/;
        proxy_http_version 1.1;
        
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        proxy_buffering off;
    }

    # Rate Limiting (protege contra DDoS)
    limit_req_zone $binary_remote_addr zone=api_limit:10m rate=30r/s;
    limit_req zone=api_limit burst=50 nodelay;
}
```

**Ativa configuração:**

```bash
# Link simbólico
sudo ln -s /etc/nginx/sites-available/conectcrm-backend /etc/nginx/sites-enabled/

# Testa configuração
sudo nginx -t

# Recarrega Nginx
sudo systemctl reload nginx
```

### 3.4. Setup SSL (Let's Encrypt)

```bash
# Executa script automático
cd /var/www/conectcrm/backend
chmod +x ssl-setup.sh
sudo ./ssl-setup.sh

# Ou manualmente:
sudo certbot certonly --standalone \
  --non-interactive --agree-tos \
  --email seu-email@empresa.com \
  --domains api.seudominio.com.br

# Copia certificados para backend
sudo mkdir -p certs
sudo cp /etc/letsencrypt/live/api.seudominio.com.br/fullchain.pem certs/cert.pem
sudo cp /etc/letsencrypt/live/api.seudominio.com.br/privkey.pem certs/key.pem
sudo chown -R www-data:www-data certs/
sudo chmod 600 certs/key.pem
sudo chmod 644 certs/cert.pem

# Reinicia backend
pm2 restart conectcrm-backend
```

---

## 4. Backup Automático

### 4.1. Permissões do Script

```bash
cd /var/www/conectcrm/backend/scripts
chmod +x backup-database.sh
chmod +x restore-backup.sh
```

### 4.2. Teste Manual

```bash
# Teste de backup
./backup-database.sh

# Verifica backup criado
ls -lh ../backups/daily/

# Verifica integridade
gzip -t ../backups/daily/conectcrm-backup_daily_*.sql.gz
```

### 4.3. Agendamento Cron (Diário às 3h da manhã)

```bash
# Edita crontab
crontab -e

# Adiciona linha:
0 3 * * * /var/www/conectcrm/backend/scripts/backup-database.sh >> /var/log/conectcrm-backup.log 2>&1
```

**Verificar logs de backup:**

```bash
# Logs do script
tail -f /var/www/conectcrm/backend/logs/backup_*.log

# Logs do cron
tail -f /var/log/conectcrm-backup.log
```

### 4.4. AWS S3 (Upload de Backups)

```bash
# Instala AWS CLI
sudo apt install -y awscli

# Configura credenciais
aws configure
# AWS Access Key ID: SUA_CHAVE
# AWS Secret Access Key: SUA_SECRET
# Default region name: us-east-1
# Default output format: json

# Cria bucket
aws s3 mb s3://conectcrm-backups-producao --region us-east-1

# Habilita versionamento
aws s3api put-bucket-versioning \
  --bucket conectcrm-backups-producao \
  --versioning-configuration Status=Enabled

# Configura lifecycle (deleta backups antigos após 90 dias)
cat > lifecycle.json << 'EOF'
{
  "Rules": [
    {
      "Id": "DeleteOldBackups",
      "Status": "Enabled",
      "ExpirationInDays": 90,
      "NoncurrentVersionExpirationInDays": 30
    }
  ]
}
EOF

aws s3api put-bucket-lifecycle-configuration \
  --bucket conectcrm-backups-producao \
  --lifecycle-configuration file://lifecycle.json

# Testa upload
aws s3 ls s3://conectcrm-backups-producao/
```

---

## 5. Monitoramento

### 5.1. Sentry (Error Tracking)

**Criação de Conta:**

1. Acesse https://sentry.io
2. Crie conta ou faça login
3. Create New Project → Node.js
4. Copie o DSN (Data Source Name)
5. Adicione no `.env`:

```bash
ENABLE_SENTRY=true
SENTRY_DSN=https://xxx@yyy.ingest.sentry.io/zzz
```

**Verificação:**

```bash
# Reinicia backend para aplicar Sentry
pm2 restart conectcrm-backend

# Verifica logs
pm2 logs conectcrm-backend | grep Sentry

# Deve aparecer: "📊 [Sentry] Error tracking habilitado"
```

### 5.2. UptimeRobot (Uptime Monitoring)

**Configuração:**

1. Acesse https://uptimerobot.com (plano gratuito: 50 monitores)
2. Add New Monitor:
   - Monitor Type: HTTP(s)
   - Friendly Name: ConectCRM Backend API
   - URL: https://api.seudominio.com.br/api-docs
   - Monitoring Interval: 5 minutes
3. Alert Contacts: Adicione email, Slack, Telegram
4. Copie Heartbeat URL (opcional)
5. Adicione no `.env`:

```bash
ENABLE_UPTIME_MONITORING=true
UPTIME_CHECK_URL=https://uptime-monitor.com/check/YOUR_KEY
```

### 5.3. PM2 Plus (Process Monitoring - Opcional)

```bash
# Link PM2 com dashboard web
pm2 link YOUR_SECRET_KEY YOUR_PUBLIC_KEY

# Dashboard: https://app.pm2.io
```

### 5.4. Logs Centralizados

```bash
# Logs do backend
pm2 logs conectcrm-backend

# Logs do Nginx
sudo tail -f /var/log/nginx/conectcrm-backend-access.log
sudo tail -f /var/log/nginx/conectcrm-backend-error.log

# Logs do PostgreSQL
sudo tail -f /var/log/postgresql/postgresql-15-main.log

# Logs do sistema
sudo journalctl -u nginx -f
```

---

## 6. Troubleshooting

### 6.1. Backend não inicia

```bash
# Verifica erros
pm2 logs conectcrm-backend --err --lines 100

# Verifica se porta 3001 está livre
sudo netstat -tulpn | grep :3001

# Verifica variáveis de ambiente
pm2 env 0

# Testa inicialização manual
cd /var/www/conectcrm/backend
npm run start:prod
```

### 6.2. Erro de conexão com banco

```bash
# Testa conexão PostgreSQL
psql -h localhost -U conectcrm_user -d conectcrm

# Verifica se PostgreSQL está rodando
sudo systemctl status postgresql

# Verifica logs do PostgreSQL
sudo tail -f /var/log/postgresql/postgresql-15-main.log

# Verifica configuração pg_hba.conf
sudo nano /etc/postgresql/15/main/pg_hba.conf
# Linha deve ter: local all all trust ou md5
```

### 6.3. CORS Errors

```bash
# Verifica variável CORS_ORIGINS no .env
cat .env | grep CORS_ORIGINS

# Testa CORS com curl
curl -H "Origin: https://app.seudominio.com.br" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: X-Requested-With" \
  -X OPTIONS --verbose \
  https://api.seudominio.com.br/auth/login

# Deve retornar: Access-Control-Allow-Origin: https://app.seudominio.com.br
```

### 6.4. SSL Certificate Errors

```bash
# Verifica certificados
sudo certbot certificates

# Testa SSL com OpenSSL
openssl s_client -connect api.seudominio.com.br:443 \
  -servername api.seudominio.com.br < /dev/null 2>/dev/null \
  | openssl x509 -noout -dates

# Renova certificados manualmente
sudo certbot renew --dry-run
sudo certbot renew --force-renewal

# Verifica SSL Labs (score A+)
# https://www.ssllabs.com/ssltest/analyze.html?d=api.seudominio.com.br
```

### 6.5. High Memory Usage

```bash
# Verifica uso de memória
pm2 monit

# Se >1GB, reduz instâncias no ecosystem.config.js
instances: 1  # Ao invés de 2

# Ou aumenta max_memory_restart
max_memory_restart: '2G'

# Reinicia
pm2 restart conectcrm-backend
```

### 6.6. Backup Failures

```bash
# Verifica logs de backup
tail -f /var/www/conectcrm/backend/logs/backup_*.log

# Testa backup manualmente
cd /var/www/conectcrm/backend/scripts
./backup-database.sh

# Verifica permissões
ls -la ../backups/

# Verifica espaço em disco
df -h
```

---

## 7. Checklist Final de Produção

Antes de considerar deploy completo, verifique:

### 7.1. Segurança

- [ ] JWT_SECRET forte (64+ caracteres)
- [ ] DATABASE_PASSWORD forte (16+ caracteres)
- [ ] SSL/HTTPS habilitado (certificados Let's Encrypt)
- [ ] CORS restritivo (apenas domínios autorizados)
- [ ] Helmet security headers ativados
- [ ] Rate limiting configurado
- [ ] Firewall (ufw) ativo:
  ```bash
  sudo ufw allow 22/tcp   # SSH
  sudo ufw allow 80/tcp   # HTTP
  sudo ufw allow 443/tcp  # HTTPS
  sudo ufw enable
  ```

### 7.2. Backup

- [ ] Cron job ativo (diário às 3h)
- [ ] Backups testados (restore funcionando)
- [ ] S3 upload habilitado (ou Azure Blob)
- [ ] Retenção configurada (7/4/12)

### 7.3. Monitoramento

- [ ] Sentry configurado (error tracking)
- [ ] UptimeRobot ativo (uptime 99.9%+)
- [ ] PM2 rodando (auto-restart)
- [ ] Slack notifications (backup + erros)

### 7.4. Performance

- [ ] PM2 cluster mode (2 instâncias)
- [ ] Nginx reverse proxy ativo
- [ ] Logs rotacionando (não cresce infinitamente)
- [ ] Database queries otimizadas (migrations aplicadas)

### 7.5. Documentação

- [ ] README.md atualizado
- [ ] Swagger acessível: https://api.seudominio.com.br/api-docs
- [ ] .env.example atualizado
- [ ] Equipe treinada (deploy + troubleshooting)

---

## 8. Comandos Úteis de Manutenção

```bash
# Reiniciar backend
pm2 restart conectcrm-backend

# Ver logs em tempo real
pm2 logs conectcrm-backend --lines 50

# Recarregar Nginx
sudo systemctl reload nginx

# Atualizar código (pull + rebuild)
cd /var/www/conectcrm/backend
git pull origin main
npm install --production
npm run build
npm run migration:run
pm2 restart conectcrm-backend

# Backup manual
./scripts/backup-database.sh

# Restaurar backup
./scripts/restore-backup.sh

# Verificar certificados SSL
sudo certbot certificates

# Renovar certificados
sudo certbot renew

# Ver uso de recursos
pm2 monit

# Limpar logs antigos (>7 dias)
pm2 flush
```

---

## 9. Support & Contatos

- **Documentação API**: https://api.seudominio.com.br/api-docs
- **Sentry Errors**: https://sentry.io/organizations/YOUR_ORG/issues/
- **PM2 Dashboard**: https://app.pm2.io
- **UptimeRobot**: https://uptimerobot.com

---

**Deploy Checklist Completo**: ✅

Última atualização: 2025-11-12  
Versão: 1.0.0
