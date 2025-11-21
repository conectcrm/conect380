# 🔧 Guia: Remover Deploy Quebrado e Preparar Novo Deploy

**Data**: 20 de novembro de 2025  
**Problema**: Sistema deployado conectando ao banco `.dev` em vez de produção  
**Solução**: Remover deploy atual e preparar novo com configurações corretas

---

## 📋 Índice

1. [Parar e Remover Deploy Atual](#1-parar-e-remover-deploy-atual)
2. [Verificar Estado dos Dados](#2-verificar-estado-dos-dados)
3. [Configurar Ambiente de Produção](#3-configurar-ambiente-de-produção)
4. [Preparar Banco de Produção](#4-preparar-banco-de-produção)
5. [Novo Deploy Correto](#5-novo-deploy-correto)
6. [Validação Pós-Deploy](#6-validação-pós-deploy)

---

## 1️⃣ Parar e Remover Deploy Atual

### 🎯 Objetivo
Parar todos os containers e limpar o deploy problemático.

### 📝 Comandos

```powershell
# 1. Conectar à instância AWS (ajuste com seu método)
ssh -i sua-chave.pem ubuntu@seu-ip-aws

# 2. Verificar containers rodando
docker ps

# 3. Parar todos os containers do ConectCRM
docker-compose -f docker-compose.prod.yml down

# 4. Remover containers órfãos
docker-compose down --remove-orphans

# 5. Verificar se parou tudo
docker ps -a | grep conectcrm

# 6. (OPCIONAL) Remover volumes se quiser limpar dados
# ⚠️ CUIDADO: Isso apaga o banco PostgreSQL local!
docker-compose down -v

# 7. Limpar imagens antigas (opcional)
docker image prune -a --filter "label=project=conectcrm"
```

### ✅ Validação
```powershell
# Nenhum container deve estar rodando
docker ps | grep conectcrm  # Deve retornar vazio
```

---

## 2️⃣ Verificar Estado dos Dados

### 🎯 Objetivo
Entender quais dados foram criados no banco errado e se precisam ser migrados.

### 📝 Comandos

```powershell
# 1. Conectar ao banco .dev (se ainda acessível)
psql -h localhost -p 5434 -U conectcrm -d conectcrm_db

# 2. Verificar tabelas com dados
\dt

# 3. Contar registros importantes
SELECT 'empresas' as tabela, COUNT(*) as total FROM empresas
UNION ALL
SELECT 'usuarios', COUNT(*) FROM usuarios
UNION ALL
SELECT 'tickets', COUNT(*) FROM tickets
UNION ALL
SELECT 'leads', COUNT(*) FROM leads;

# 4. Exportar dados importantes (se houver dados reais)
pg_dump -h localhost -p 5434 -U conectcrm -d conectcrm_db \
  -t empresas -t usuarios -t clientes -t tickets \
  -F c -f backup_dados_dev.dump

# 5. Sair
\q
```

### ⚠️ Importante
- Se houver **dados de teste apenas**: pode ignorar
- Se houver **dados reais de clientes**: fazer backup antes!

---

## 3️⃣ Configurar Ambiente de Produção

### 🎯 Objetivo
Criar e configurar arquivo `.env.production` com credenciais corretas.

### 📝 Passo a Passo

#### A. Criar arquivo de produção

```powershell
# No diretório local (antes de fazer deploy)
cd backend
cp .env.production.example .env.production
```

#### B. Editar `.env.production`

Abra o arquivo e configure:

```bash
# ============================================
# Banco de Dados - PRODUÇÃO
# ============================================
DATABASE_HOST=SEU_HOST_RDS_OU_IP_PRODUCAO
DATABASE_PORT=5432
DATABASE_USERNAME=conectcrm_prod
DATABASE_PASSWORD=SENHA_SEGURA_PRODUCAO
DATABASE_NAME=conectcrm_production

# ============================================
# JWT - GERAR NOVOS SECRETS!
# ============================================
JWT_SECRET=<GERAR_NOVO_256_BITS>
JWT_EXPIRES_IN=24h
JWT_REFRESH_SECRET=<GERAR_NOVO_256_BITS>
JWT_REFRESH_EXPIRES_IN=7d

# ============================================
# Aplicação
# ============================================
APP_PORT=3001
APP_ENV=production
NODE_ENV=production

# ============================================
# CORS - URLs de Produção
# ============================================
CORS_ORIGINS=https://conecthelp.com.br,https://app.conecthelp.com.br

# ============================================
# Frontend URL
# ============================================
FRONTEND_URL=https://app.conecthelp.com.br

# ============================================
# Email - AWS SES ou SMTP
# ============================================
SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_USER=SEU_SMTP_USER
SMTP_PASS=SEU_SMTP_PASS
EMAIL_FROM=noreply@conecthelp.com.br
EMAIL_FROM_NAME=ConectCRM

# ============================================
# WhatsApp Business (PRODUÇÃO)
# ============================================
WHATSAPP_ACCESS_TOKEN=SEU_TOKEN_PRODUCAO
WHATSAPP_PHONE_NUMBER_ID=SEU_PHONE_ID
WHATSAPP_BUSINESS_ACCOUNT_ID=SEU_BUSINESS_ID
WHATSAPP_WEBHOOK_VERIFY_TOKEN=TOKEN_WEBHOOK_SEGURO

# ============================================
# OpenAI (opcional)
# ============================================
OPENAI_API_KEY=SUA_CHAVE_OPENAI
OPENAI_MODEL=gpt-4o-mini

# ============================================
# Anthropic Claude (opcional)
# ============================================
ANTHROPIC_API_KEY=SUA_CHAVE_ANTHROPIC
ANTHROPIC_MODEL=claude-3-5-sonnet-20241022
```

#### C. Gerar JWT Secrets

```powershell
# PowerShell - Gerar secrets aleatórios
# JWT_SECRET
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))

# JWT_REFRESH_SECRET  
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))

# Copie e cole no .env.production
```

#### D. Copiar para servidor

```powershell
# Enviar .env.production para o servidor AWS
scp -i sua-chave.pem backend/.env.production ubuntu@seu-ip-aws:/home/ubuntu/conectcrm/backend/

# OU usar AWS Systems Manager Parameter Store (recomendado)
```

---

## 4️⃣ Preparar Banco de Produção

### 🎯 Objetivo
Criar banco de dados de produção e rodar migrations.

### 📝 Comandos

#### A. Conectar ao banco de produção

```powershell
# Se PostgreSQL local no servidor
psql -h localhost -U postgres

# Se RDS AWS
psql -h seu-rds-endpoint.amazonaws.com -U master_user -d postgres
```

#### B. Criar banco e usuário

```sql
-- Criar usuário
CREATE USER conectcrm_prod WITH PASSWORD 'SENHA_SEGURA_PRODUCAO';

-- Criar banco
CREATE DATABASE conectcrm_production
  WITH OWNER = conectcrm_prod
  ENCODING = 'UTF8'
  LC_COLLATE = 'en_US.UTF-8'
  LC_CTYPE = 'en_US.UTF-8';

-- Dar permissões
GRANT ALL PRIVILEGES ON DATABASE conectcrm_production TO conectcrm_prod;

-- Conectar ao banco
\c conectcrm_production

-- Dar permissão no schema
GRANT ALL ON SCHEMA public TO conectcrm_prod;

-- Sair
\q
```

#### C. Rodar migrations

```powershell
# No servidor, dentro do diretório do projeto
cd /home/ubuntu/conectcrm/backend

# Carregar variáveis de ambiente
export $(cat .env.production | xargs)

# Verificar migrations pendentes
npm run migration:show

# Rodar migrations
npm run migration:run

# Verificar se rodou tudo
npm run migration:show
```

#### D. Seed de dados iniciais (OPCIONAL)

```powershell
# Se tiver script de seed
psql -h $DATABASE_HOST -U $DATABASE_USERNAME -d $DATABASE_NAME \
  -f seed-production-data.sql
```

---

## 5️⃣ Novo Deploy Correto

### 🎯 Objetivo
Fazer deploy com configurações corretas de produção.

### 📝 Método 1: Docker Compose (Simples)

```powershell
# 1. No servidor AWS
cd /home/ubuntu/conectcrm

# 2. Verificar se .env.production está no lugar certo
ls -la backend/.env.production

# 3. Ajustar docker-compose.prod.yml para usar .env.production
# (Verificar se env_file aponta para o arquivo correto)

# 4. Build das imagens
docker-compose -f docker-compose.prod.yml build --no-cache

# 5. Subir containers
docker-compose -f docker-compose.prod.yml up -d

# 6. Ver logs
docker-compose -f docker-compose.prod.yml logs -f
```

### 📝 Método 2: Script Automatizado

```powershell
# Usar script de deploy existente
cd /home/ubuntu/conectcrm

# Modo dry-run (teste)
./scripts/deploy-to-production.ps1 -DryRun

# Deploy real
./scripts/deploy-to-production.ps1

# Ou forçar sem confirmações
./scripts/deploy-to-production.ps1 -Force
```

### 📝 Método 3: GitHub Actions (CI/CD)

Se configurado, apenas fazer push:

```powershell
# Local
git push origin consolidacao-atendimento

# GitHub Actions vai:
# 1. Build da aplicação
# 2. Rodar testes
# 3. Deploy automático na AWS
# 4. Rodar migrations
```

---

## 6️⃣ Validação Pós-Deploy

### 🎯 Objetivo
Garantir que sistema subiu corretamente.

### 📝 Checklist de Validação

```powershell
# ═══════════════════════════════════════
# 1. CONTAINERS RODANDO
# ═══════════════════════════════════════
docker ps
# Deve mostrar: nginx, backend, frontend, postgres (se local)

# ═══════════════════════════════════════
# 2. HEALTH CHECKS
# ═══════════════════════════════════════
# Backend
curl http://localhost:3001/health
# Espera: { "status": "ok", "database": "connected" }

# Frontend (via nginx)
curl http://localhost/
# Espera: HTML da aplicação React

# ═══════════════════════════════════════
# 3. BANCO DE DADOS
# ═══════════════════════════════════════
docker-compose exec postgres psql -U conectcrm_prod -d conectcrm_production -c "\dt"
# Deve listar todas as tabelas

# Verificar migrations
docker-compose exec postgres psql -U conectcrm_prod -d conectcrm_production \
  -c "SELECT * FROM migrations ORDER BY timestamp DESC LIMIT 5;"

# ═══════════════════════════════════════
# 4. LOGS SEM ERROS
# ═══════════════════════════════════════
docker-compose logs backend | grep -i error
# Não deve ter erros críticos

docker-compose logs frontend | grep -i error
# Não deve ter erros de build

# ═══════════════════════════════════════
# 5. TESTE DE ENDPOINTS
# ═══════════════════════════════════════
# Login
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@empresa.com","password":"senha123"}'
# Espera: { "access_token": "...", "user": {...} }

# Empresas
curl http://localhost:3001/empresas \
  -H "Authorization: Bearer SEU_TOKEN"
# Espera: Lista de empresas

# ═══════════════════════════════════════
# 6. FRONTEND FUNCIONANDO
# ═══════════════════════════════════════
# Acessar no browser
open https://conecthelp.com.br
# ou
curl -I https://conecthelp.com.br
# Espera: HTTP/1.1 200 OK

# ═══════════════════════════════════════
# 7. WEBSOCKET FUNCIONANDO
# ═══════════════════════════════════════
# Ver logs de conexão websocket
docker-compose logs backend | grep -i websocket

# ═══════════════════════════════════════
# 8. VARIÁVEIS DE AMBIENTE CORRETAS
# ═══════════════════════════════════════
docker-compose exec backend env | grep DATABASE_HOST
# Deve mostrar HOST de produção (NÃO localhost:5434!)

docker-compose exec backend env | grep NODE_ENV
# Deve mostrar: production
```

### ✅ Critérios de Sucesso

- [ ] Todos os containers rodando sem restart contínuo
- [ ] Health checks retornando OK
- [ ] Banco de produção conectado (verificar DATABASE_HOST)
- [ ] Migrations rodadas com sucesso
- [ ] Login funcionando
- [ ] Frontend carregando
- [ ] Logs sem erros críticos
- [ ] Teste E2E: criar empresa → criar usuário → fazer login

---

## 🚨 Troubleshooting

### Problema 1: Backend não conecta no banco

```powershell
# Verificar variáveis de ambiente
docker-compose exec backend env | grep DATABASE

# Verificar conectividade
docker-compose exec backend ping $DATABASE_HOST

# Ver logs detalhados
docker-compose logs backend --tail 100

# Testar conexão manual
docker-compose exec backend node -e "
const { Client } = require('pg');
const client = new Client({
  host: process.env.DATABASE_HOST,
  port: process.env.DATABASE_PORT,
  user: process.env.DATABASE_USERNAME,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME
});
client.connect().then(() => console.log('✅ Conectado!')).catch(e => console.error('❌', e));
"
```

### Problema 2: Migrations falham

```powershell
# Ver migrations pendentes
npm run migration:show

# Reverter última migration
npm run migration:revert

# Rodar novamente
npm run migration:run

# Se falhar, ver erro específico
npm run migration:run 2>&1 | tee migration-error.log
```

### Problema 3: Frontend não carrega

```powershell
# Verificar build
docker-compose logs frontend

# Rebuild do frontend
docker-compose build --no-cache frontend
docker-compose up -d frontend

# Verificar variáveis de ambiente
docker-compose exec frontend env | grep REACT_APP
```

### Problema 4: Erro 502 Bad Gateway

```powershell
# Verificar nginx
docker-compose logs nginx

# Verificar se backend está respondendo
docker-compose exec nginx wget -O- http://backend:3001/health

# Reiniciar nginx
docker-compose restart nginx
```

---

## 📝 Script Rápido de Remoção

Salve como `remover-deploy-quebrado.ps1`:

```powershell
#!/usr/bin/env pwsh
# Script para remover deploy quebrado

$ErrorActionPreference = "Stop"

Write-Host "🔧 Removendo deploy quebrado..." -ForegroundColor Yellow

# 1. Parar containers
Write-Host "1️⃣ Parando containers..." -ForegroundColor Cyan
docker-compose -f docker-compose.prod.yml down

# 2. Remover containers órfãos
Write-Host "2️⃣ Removendo containers órfãos..." -ForegroundColor Cyan
docker-compose down --remove-orphans

# 3. Verificar
Write-Host "3️⃣ Verificando..." -ForegroundColor Cyan
$running = docker ps | Select-String "conectcrm"
if ($running) {
    Write-Host "⚠️  Ainda há containers rodando!" -ForegroundColor Red
    docker ps | Select-String "conectcrm"
} else {
    Write-Host "✅ Todos os containers parados!" -ForegroundColor Green
}

# 4. Limpar imagens antigas (opcional)
$response = Read-Host "Deseja remover imagens antigas? (s/N)"
if ($response -eq "s" -or $response -eq "S") {
    Write-Host "4️⃣ Removendo imagens antigas..." -ForegroundColor Cyan
    docker image prune -a -f
    Write-Host "✅ Imagens removidas!" -ForegroundColor Green
}

Write-Host ""
Write-Host "🎉 Deploy quebrado removido com sucesso!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Próximos passos:" -ForegroundColor Yellow
Write-Host "  1. Configure backend/.env.production"
Write-Host "  2. Prepare o banco de produção"
Write-Host "  3. Rode: docker-compose -f docker-compose.prod.yml up -d"
Write-Host ""
```

---

## 🎯 Resumo Executivo

### O que fazer AGORA:

1. **Parar deploy atual**:
   ```powershell
   docker-compose -f docker-compose.prod.yml down
   ```

2. **Configurar produção**:
   - Criar `backend/.env.production` com banco de PRODUÇÃO
   - Gerar novos JWT secrets
   - Configurar CORS com URLs de produção

3. **Preparar banco**:
   - Criar banco `conectcrm_production`
   - Rodar migrations: `npm run migration:run`

4. **Novo deploy**:
   ```powershell
   docker-compose -f docker-compose.prod.yml up -d
   ```

5. **Validar**:
   - Verificar DATABASE_HOST (NÃO pode ser localhost:5434!)
   - Testar login
   - Verificar logs

---

## 📚 Documentos Relacionados

- `PLANO_DEPLOY_PRODUCAO.md` - Planejamento completo de deploy
- `CHECKLIST_PRE_DEPLOY_AWS.md` - Checklist detalhado
- `ESTRATEGIA_DEPLOY_PRODUCAO.md` - Estratégia de deploy
- `backend/DEPLOYMENT_GUIDE.md` - Guia de deployment

---

**Última atualização**: 20/11/2025  
**Status**: Pronto para execução  
**Autor**: GitHub Copilot
