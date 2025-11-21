# 🚀 Plano de Deploy Limpo na AWS

**Data**: 20 de novembro de 2025  
**Objetivo**: Remover deploy anterior e realizar novo deploy completo  
**Status**: ✅ **MIGRATIONS RESOLVIDAS - PRONTO PARA DEPLOY**

---

## ✅ ATUALIZAÇÃO: Problema de Migrations RESOLVIDO!

**Data da solução**: 20/11/2025

### 🎯 Causa Raiz Identificada
O NestJS usa `database.config.ts` em runtime, **não** `ormconfig.js`!  
Alterações no `ormconfig.js` eram ignoradas pelo aplicativo.

### 🔧 Solução Implementada
1. ✅ Habilitado `synchronize: true` no **arquivo correto** (`database.config.ts`)
2. ✅ Backend criou **57 tabelas** automaticamente
3. ✅ Criada migration inicial: `1700000000000-InitialSchema.ts`
4. ✅ Desabilitado `synchronize` para produção (usar migrations)

### 📊 Resultado
- **57 tabelas criadas** com sucesso
- **Schema completo** pronto para produção
- **Migrations funcionando** corretamente
- **Documentação completa** em `SOLUCAO_FINAL_MIGRATIONS.md`

**👉 Ver detalhes técnicos em: `SOLUCAO_FINAL_MIGRATIONS.md`**

---

## 🚨 ~~PROBLEMA CRÍTICO COM MIGRATIONS DESCOBERTO~~ (RESOLVIDO)

### ❌ ~~Situação Anterior~~:

1. **FALTAM MIGRATIONS BÁSICAS**: Não há migration que cria tabelas fundamentais (empresas, users, clientes, etc.)
2. **MIGRATIONS FORA DE ORDEM**: Várias migrations tentam criar foreign keys para tabelas que não existem
3. **MIGRATIONS DESTRUTIVAS**: AddPendenteStatusToCotacao tenta dropar/recriar colunas com dados

### ✅ **Migrations Desabilitadas** (movidas para `src/migrations_disabled/`):
```
_DISABLED_1691234567890-CreateEventosTable.ts (depende de users que não existe)
_DISABLED_1763405981614-AddPendenteStatusToCotacao.ts (destrutiva)
_DISABLED_1763406000000-AddPendenteToStatusEnum.ts (depende da anterior)
```

### 🎯 **Solução Implementada**:

O banco de desenvolvimento usa **synchronize: true** do TypeORM para criar as tabelas básicas.
Para produção, há duas opções:

**Opção A: Synchronize na Primeira Vez** (RECOMENDADO para deploy limpo):
1. Habilitar synchronize: true TEMPORARIAMENTE em produção
2. Iniciar backend uma vez (cria todas as tabelas)
3. Desabilitar synchronize e usar migrations daqui pra frente

**Opção B: Export do Schema DEV**:
1. Exportar schema completo do banco DEV
2. Aplicar no banco de produção
3. Marcar todas migrations como executadas manualmente

---

## 📋 Status Atual das Migrations

### Total de Migrations: **52**

<details>
<summary>✅ <strong>50 Migrations Executadas</strong> (clique para expandir)</summary>

```
[X] 67 CreateSlaTables20251108074147
[X] 2 CreateEventosTable1691234567890
[X] 8 CreateAtendimentoTables1728518400000
[X] 12 CreateDepartamentos1729180000000
[X] 44 CreateTriagemLogsTable1730224800000
[X] 47 EnableRowLevelSecurity1730476887000
[X] 50 CreateEmpresaModulosTable1730678400000
[X] 59 CriarTabelaConfiguracaoInatividade1730854800000
[X] 60 AdicionarDepartamentoConfiguracaoInatividade1730860000000
[X] 61 AdicionarDepartamentoIdTicket1730861000000
[X] 71 AddEmpresaIdToOportunidades1731513600000
[X] 3 CreateEventoTable1733080800000
[X] 5 AlterFaturaContratoIdNullable1733356800000
[X] 6 AlterDatetimeToTimestampOrquestrador1733356801000
[X] 7 AlterContratoPropostaIdToUuid1733500000000
[X] 62 CreateSistemaFilas1736380000000
[X] 9 CreateContatosTable1744690800000
[X] 10 AddContatoFotoToAtendimentoTickets1744828200000
[X] 11 CreateTriagemBotNucleosTables1745017600000
[X] 13 CreateEquipesAtribuicoesTables1745022000000
[X] 16 AddPrimeiraSenhaToUsers1760816700000
[X] 17 CreateNotasClienteClean1761180000000
[X] 18 CreateDemandasClean1761180100000
[X] 45 AddHistoricoVersoes1761582305362
[X] 48 AddHistoricoVersoesFluxo1761582400000
[X] 49 AddStatusAtendenteToUsers1762190000000
[X] 51 CreateEmpresaConfiguracoesTable1762201484633
[X] 52 CreateEmpresaConfiguracoes1762201500000
[X] 53 CreateEmpresaConfiguracoes1762211047321
[X] 54 AddPhase1ConfigFields1762212773553
[X] 57 UpdateOportunidadeClienteIdToUuid1762214400000
[X] 55 AddDeveTrocarSenhaFlagToUsers1762216500000
[X] 56 CreatePasswordResetTokens1762220000000
[X] 58 RemoveChatwootFromAtendimento1762305000000
[X] 63 CreateDistribuicaoAutomaticaTables1762531500000
[X] 66 CreateMessageTemplatesTable1762546700000
[X] 64 CreateTagsTable1762600000000
[X] 65 CreateTicketTagsTable1762600100000
[X] 68 ConsolidacaoEquipeFila1762781002951
[X] 69 CreateLeadsTable1762962000000
[X] 72 AddEmpresaIdToContratosEFaturas1763062900000
[X] 77 AddCamposAprovacaoCotacaoManual1763219200000
[X] 73 AddEmpresaIdToPagamentos1763275000000
[X] 78 CreateNotificationsTable1763334700000
[X] 79 AddContatoEmailToTicket1763561367642
[X] 74 AddEmpresaIdToAtividades1773770000000
[X] 75 AddEmpresaIdToProdutos1774100000000
[X] 76 CreatePagamentosGatewayTables1774300000000
```
</details>

### ⚠️ **2 Migrations Pendentes**:
```
[ ] AddPendenteStatusToCotacao1763405981614
[ ] AddPendenteToStatusEnum1763406000000
```

**Descrição**:
- Adiciona status "PENDENTE" ao enum de status de cotação
- Permite rastrear cotações aguardando aprovação

---

## 🎯 Plano de Ação Completo

### **Fase 1: Preparação Local** (15 minutos)

#### 1.1. Executar Migrations Pendentes no DEV
```powershell
cd C:\Projetos\conectcrm\backend
npm run migration:run
```

**Validação**:
```powershell
npx typeorm migration:show -d ormconfig.js | Select-String "\[ \]"
```
**Resultado esperado**: Nenhuma linha (todas migrations executadas)

#### 1.2. Criar Backup do Banco DEV
```powershell
# Variáveis (ajustar conforme seu .env)
$DB_HOST = "localhost"
$DB_PORT = "5434"
$DB_NAME = "conectcrm"
$DB_USER = "postgres"
$BACKUP_FILE = "backup-dev-$(Get-Date -Format 'yyyyMMdd-HHmmss').sql"

# Backup
$env:PGPASSWORD = "sua-senha-aqui"
pg_dump -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -F p -f $BACKUP_FILE

Write-Host "✅ Backup criado: $BACKUP_FILE"
```

#### 1.3. Testar Build Local
```powershell
# Backend
cd C:\Projetos\conectcrm\backend
npm run build
npm run lint

# Frontend
cd C:\Projetos\conectcrm\frontend-web
npm run build
```

**Validação**: Zero erros de compilação

#### 1.4. Commit das Alterações Multi-Tenant
```powershell
cd C:\Projetos\conectcrm
git status
git add .
git commit -m "feat: implementação completa multi-tenant - 20 vulnerabilidades corrigidas"
git push origin consolidacao-atendimento
```

---

### **Fase 2: Preparação AWS** (20 minutos)

#### 2.1. Conectar na Instância EC2 Atual
```powershell
# Ajustar com seu .pem e IP da instância
ssh -i "caminho\para\sua-chave.pem" ubuntu@IP-DA-INSTANCIA-AWS
```

#### 2.2. Backup do Banco de Produção Atual (CRÍTICO!)
```bash
# Na instância AWS
cd ~

# Variáveis
DB_HOST="localhost"  # ou endpoint RDS se usar
DB_PORT="5432"
DB_NAME="conectcrm_prod"
DB_USER="postgres"
BACKUP_FILE="backup-prod-$(date +%Y%m%d-%H%M%S).sql"

# Criar backup COMPLETO
PGPASSWORD='sua-senha-prod' pg_dump \
  -h $DB_HOST \
  -p $DB_PORT \
  -U $DB_USER \
  -d $DB_NAME \
  -F c \
  -f $BACKUP_FILE

# Criar backup SQL (legível)
PGPASSWORD='sua-senha-prod' pg_dump \
  -h $DB_HOST \
  -p $DB_PORT \
  -U $DB_USER \
  -d $DB_NAME \
  -F p \
  -f $BACKUP_FILE.sql

# Comprimir
tar -czf $BACKUP_FILE.tar.gz $BACKUP_FILE $BACKUP_FILE.sql

# Upload para S3 (opcional mas recomendado)
aws s3 cp $BACKUP_FILE.tar.gz s3://seu-bucket/backups/

echo "✅ Backup criado: $BACKUP_FILE.tar.gz"
```

#### 2.3. Exportar Dados Críticos (se necessário)
```bash
# Empresas
PGPASSWORD='sua-senha' psql -h $DB_HOST -U $DB_USER -d $DB_NAME \
  -c "\COPY empresas TO 'empresas-export.csv' CSV HEADER"

# Usuários
PGPASSWORD='sua-senha' psql -h $DB_HOST -U $DB_USER -d $DB_NAME \
  -c "\COPY users TO 'users-export.csv' CSV HEADER"

# Compactar exports
tar -czf exports-$(date +%Y%m%d).tar.gz *.csv
```

---

### **Fase 3: Limpeza da Instância Atual** (10 minutos)

#### 3.1. Parar Serviços
```bash
# Parar backend
pm2 stop all
pm2 delete all

# Parar Nginx
sudo systemctl stop nginx

# Parar PostgreSQL (se estiver na instância)
sudo systemctl stop postgresql
```

#### 3.2. Remover Aplicação Anterior
```bash
# Backup de configs importantes
mkdir ~/backup-configs
cp ~/.env ~/backup-configs/ 2>/dev/null || true
cp /etc/nginx/sites-available/conectcrm ~/backup-configs/ 2>/dev/null || true

# Remover aplicação
cd ~
rm -rf conectcrm
rm -rf conectcrm-*

# Limpar PM2
pm2 kill
pm2 flush
```

#### 3.3. Limpar Banco de Dados (CUIDADO!)
```bash
# Opção A: Dropar e recriar banco (LIMPO TOTAL)
PGPASSWORD='sua-senha' psql -h localhost -U postgres -c "DROP DATABASE IF EXISTS conectcrm_prod;"
PGPASSWORD='sua-senha' psql -h localhost -U postgres -c "CREATE DATABASE conectcrm_prod;"

# Opção B: Manter banco atual (se quiser preservar dados)
# (Neste caso, apenas rodar migrations novas)
```

---

### **Fase 4: Deploy Limpo** (30 minutos)

#### 4.1. Clonar Repositório Atualizado
```bash
cd ~

# Clone com branch específica
git clone -b consolidacao-atendimento https://github.com/seu-usuario/conectcrm.git

cd conectcrm
```

#### 4.2. Configurar Backend
```bash
cd backend

# Instalar dependências
npm install --production

# Configurar .env
cat > .env << 'EOF'
# ============================================
# BANCO DE DADOS POSTGRESQL (PRODUÇÃO)
# ============================================
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=SUA_SENHA_SEGURA_AQUI
DATABASE_NAME=conectcrm_prod

# ============================================
# JWT & AUTENTICAÇÃO
# ============================================
JWT_SECRET=GERAR_CHAVE_SUPER_SEGURA_AQUI_64_CARACTERES_MIN
JWT_EXPIRATION=7d

# ============================================
# SERVIDOR
# ============================================
PORT=3001
NODE_ENV=production

# ============================================
# CORS
# ============================================
CORS_ORIGINS=https://seudominio.com,https://app.seudominio.com

# ============================================
# SMTP (SendGrid, Gmail, etc)
# ============================================
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
SMTP_FROM=noreply@seudominio.com

# ============================================
# WHATSAPP (Meta API)
# ============================================
WHATSAPP_TOKEN=seu_token_aqui
WHATSAPP_PHONE_ID=seu_phone_id_aqui
WHATSAPP_VERIFY_TOKEN=token_verificacao_webhook

# ============================================
# OPENAI / ANTHROPIC (IA)
# ============================================
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxxxxxxxxxxxxx

# ============================================
# STRIPE (Pagamentos - opcional)
# ============================================
STRIPE_SECRET_KEY=sk_live_xxxxxxxxxxxxxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxxxxx

# ============================================
# LOGS & MONITORING
# ============================================
ENABLE_BACKUP=true
LOG_LEVEL=info

EOF

# ⚠️ EDITAR .env com valores reais
nano .env
```

#### 4.3. Executar Migrations no Banco de Produção
```bash
# Verificar migrations pendentes
npx typeorm migration:show -d ormconfig.js

# Executar TODAS as migrations (incluindo as 2 pendentes)
npm run migration:run

# Validar que TODAS foram executadas
npx typeorm migration:show -d ormconfig.js | grep "\[ \]"
```

**Resultado esperado**: Nenhuma migration pendente `[ ]`

#### 4.4. Build Backend
```bash
npm run build

# Validar build
ls -la dist/src/main.js
```

#### 4.5. Configurar Frontend
```bash
cd ~/conectcrm/frontend-web

# Instalar dependências
npm install

# Configurar .env.production
cat > .env.production << 'EOF'
REACT_APP_API_URL=https://api.seudominio.com
REACT_APP_WS_URL=wss://api.seudominio.com
REACT_APP_ENV=production
EOF

# Build
npm run build

# Validar build
ls -la build/index.html
```

---

### **Fase 5: Configuração Nginx** (15 minutos)

#### 5.1. Instalar Nginx (se não estiver)
```bash
sudo apt update
sudo apt install -y nginx certbot python3-certbot-nginx
```

#### 5.2. Configurar Site
```bash
sudo tee /etc/nginx/sites-available/conectcrm << 'EOF'
# Backend API
server {
    listen 80;
    server_name api.seudominio.com;

    # Redirecionar para HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.seudominio.com;

    # SSL (será configurado pelo Certbot)
    ssl_certificate /etc/letsencrypt/live/api.seudominio.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.seudominio.com/privkey.pem;

    # Headers de segurança
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

    # Proxy para backend
    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Timeouts
        proxy_connect_timeout 600;
        proxy_send_timeout 600;
        proxy_read_timeout 600;
        send_timeout 600;
    }

    # Websockets
    location /socket.io/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Frontend
server {
    listen 80;
    server_name app.seudominio.com seudominio.com;

    # Redirecionar para HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name app.seudominio.com seudominio.com;

    # SSL (será configurado pelo Certbot)
    ssl_certificate /etc/letsencrypt/live/app.seudominio.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/app.seudominio.com/privkey.pem;

    # Headers de segurança
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;

    root /home/ubuntu/conectcrm/frontend-web/build;
    index index.html;

    # Servir React App
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache para assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Gzip
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/javascript application/json;
}
EOF

# Habilitar site
sudo ln -sf /etc/nginx/sites-available/conectcrm /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default

# Testar configuração
sudo nginx -t

# Recarregar Nginx
sudo systemctl reload nginx
```

#### 5.3. Configurar SSL com Let's Encrypt
```bash
# Certificado para API
sudo certbot --nginx -d api.seudominio.com

# Certificado para Frontend
sudo certbot --nginx -d app.seudominio.com -d seudominio.com

# Testar renovação automática
sudo certbot renew --dry-run
```

---

### **Fase 6: PM2 e Inicialização** (10 minutos)

#### 6.1. Instalar PM2 (se não estiver)
```bash
sudo npm install -g pm2
```

#### 6.2. Criar Ecosystem PM2
```bash
cd ~/conectcrm

cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [
    {
      name: 'conectcrm-backend',
      cwd: './backend',
      script: 'dist/src/main.js',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      error_file: './logs/err.log',
      out_file: './logs/out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G'
    }
  ]
};
EOF
```

#### 6.3. Iniciar Backend com PM2
```bash
# Criar diretório de logs
mkdir -p ~/conectcrm/backend/logs

# Iniciar
pm2 start ecosystem.config.js

# Salvar configuração
pm2 save

# Configurar inicialização automática
pm2 startup
# (Executar comando que o PM2 mostrar)

# Verificar status
pm2 status
pm2 logs conectcrm-backend --lines 50
```

---

### **Fase 7: Validação Final** (15 minutos)

#### 7.1. Testar Backend
```bash
# Health check
curl https://api.seudominio.com/health

# Swagger
curl https://api.seudominio.com/api/docs
```

#### 7.2. Testar Frontend
```bash
# Abrir no navegador
xdg-open https://app.seudominio.com

# Ou via curl
curl -I https://app.seudominio.com
```

#### 7.3. Testar Registro de Nova Empresa
1. Acesse: https://app.seudominio.com/registro
2. Preencha formulário completo
3. Valide que empresa é criada
4. Faça login imediatamente (verificação de email desabilitada)
5. Valide que dashboard carrega

#### 7.4. Testar Multi-Tenant
1. Criar Empresa A
2. Criar dados de teste
3. Logout
4. Criar Empresa B
5. **Validar**: Zero dados de Empresa A visíveis ✅

#### 7.5. Monitorar Logs
```bash
# Logs backend
pm2 logs conectcrm-backend --lines 100

# Logs Nginx
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# Logs PostgreSQL
sudo tail -f /var/log/postgresql/postgresql-*.log
```

---

## 📊 Checklist Final de Validação

### ✅ Pré-Deploy
- [ ] 2 migrations pendentes executadas no DEV
- [ ] Backup do banco DEV criado
- [ ] Build local sem erros (backend + frontend)
- [ ] Código commitado e pushed

### ✅ AWS - Backup
- [ ] Backup COMPLETO do banco PROD criado
- [ ] Backup enviado para S3 (recomendado)
- [ ] Exports de dados críticos (empresas, users)

### ✅ AWS - Limpeza
- [ ] Serviços antigos parados (PM2, Nginx, PostgreSQL)
- [ ] Aplicação antiga removida
- [ ] Configs importantes backupeadas

### ✅ AWS - Deploy
- [ ] Repositório clonado (branch consolidacao-atendimento)
- [ ] .env backend configurado
- [ ] .env.production frontend configurado
- [ ] Migrations executadas no banco PROD (52/52)
- [ ] Backend build OK
- [ ] Frontend build OK

### ✅ AWS - Infraestrutura
- [ ] Nginx instalado e configurado
- [ ] SSL/TLS configurado (Let's Encrypt)
- [ ] PM2 configurado e rodando
- [ ] Firewall/Security Groups configurados

### ✅ Validação
- [ ] Backend respondendo (health check)
- [ ] Frontend carregando
- [ ] Registro de empresa funcionando
- [ ] Login imediato funcionando
- [ ] Multi-tenant isolado (zero vazamento)
- [ ] Logs sem erros críticos

---

## 🚨 Rollback (Se Necessário)

### Se algo der errado:

```bash
# 1. Parar serviços novos
pm2 stop all
sudo systemctl stop nginx

# 2. Restaurar banco
cd ~
tar -xzf backup-prod-YYYYMMDD-HHMMSS.sql.tar.gz
PGPASSWORD='senha' psql -h localhost -U postgres -d conectcrm_prod < backup-prod-*.sql

# 3. Restaurar aplicação anterior (se backupeou)
# ou
# Fazer rollback do código no git e re-deploy

# 4. Iniciar serviços
pm2 start all
sudo systemctl start nginx
```

---

## 📝 Notas Importantes

### ⚠️ Variáveis de Ambiente Críticas
```bash
# Gerar JWT Secret seguro
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Gerar WhatsApp Verify Token
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 🔐 Segurança
- ✅ HTTPS obrigatório em produção
- ✅ JWT_SECRET com 64+ caracteres
- ✅ Senhas de banco fortes
- ✅ CORS restrito a domínios específicos
- ✅ Rate limiting habilitado (Throttler)

### 📊 Monitoramento Recomendado
- **PM2**: `pm2 monit`
- **Logs**: `pm2 logs --lines 100`
- **Métricas**: Implementar Prometheus + Grafana (opcional)

### 🔄 Manutenção
- **Backups**: Diários automáticos (já configurado)
- **Atualizações**: Revisar deps mensalmente
- **SSL**: Renova automaticamente (certbot)
- **Logs**: Rotação com logrotate

---

## 🎯 Tempo Total Estimado

| Fase | Tempo |
|------|-------|
| 1. Preparação Local | 15 min |
| 2. Preparação AWS | 20 min |
| 3. Limpeza | 10 min |
| 4. Deploy | 30 min |
| 5. Nginx | 15 min |
| 6. PM2 | 10 min |
| 7. Validação | 15 min |
| **TOTAL** | **~2 horas** |

---

## 📞 Suporte

**Problemas?**
1. Verificar logs: `pm2 logs`
2. Verificar Nginx: `sudo nginx -t`
3. Verificar banco: `psql -h localhost -U postgres -d conectcrm_prod -c "\dt"`
4. Verificar migrations: `npx typeorm migration:show -d ormconfig.js`

**Documentos relacionados**:
- `GUIA_TESTE_MULTI_TENANT.md` - Testes de isolamento
- `SISTEMA_PRONTO_TESTE_MULTITENANT.md` - Status das alterações
- `ANALISE_FLUXO_REGISTRO_MULTITENANT.md` - Arquitetura multi-tenant

---

**Documento criado**: 19/11/2025 19:42  
**Versão**: 1.0  
**Status**: ✅ Pronto para execução
