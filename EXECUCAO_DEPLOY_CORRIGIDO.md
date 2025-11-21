# 🚀 GUIA DE EXECUÇÃO - CORREÇÃO DE DEPLOY PRODUÇÃO

**Data**: 20 de novembro de 2025  
**Objetivo**: Remover deploy quebrado (banco dev) e subir deploy correto (banco produção)  
**Tempo estimado**: 45-60 minutos

---

## 📋 RESUMO DO PROBLEMA

- ❌ **Sistema atual**: Conectado ao banco `.dev` (localhost:5434)
- ✅ **Sistema correto**: Deve conectar ao banco `conectcrm_production` (porta 5432)
- 🎯 **Solução**: Limpar deploy + configurar corretamente + re-deploy

---

## 🔧 FERRAMENTAS CRIADAS

1. ✅ **GUIA_REMOVER_DEPLOY_QUEBRADO.md** - Documentação completa (500+ linhas)
2. ✅ **remover-deploy-quebrado.ps1** - Script automatizado de limpeza
3. ✅ **validar-config-producao.ps1** - Validação pré-deploy (10 checks)
4. ✅ **backend/.env.production** - Arquivo de configuração criado e validado

---

## ⚡ EXECUÇÃO RÁPIDA (30 min)

### FASE 1: Conectar no Servidor AWS (2 min)

```bash
# SSH para instância AWS
ssh -i sua-chave.pem ubuntu@seu-ip-aws

# Navegar para projeto
cd /home/ubuntu/conectcrm  # ou /var/www/conectcrm (ajuste conforme sua instalação)
```

---

### FASE 2: Backup de Segurança (5 min)

```bash
# Fazer backup do banco atual (se tiver dados importantes)
docker-compose exec postgres pg_dump -U conectcrm conectcrm_db > backup-antes-correcao.sql

# Confirmar backup
ls -lh backup-antes-correcao.sql
```

---

### FASE 3: Remover Deploy Quebrado (5 min)

```bash
# Opção 1: Com confirmações (recomendado na primeira vez)
.\remover-deploy-quebrado.ps1

# Opção 2: Sem confirmações (mais rápido)
.\remover-deploy-quebrado.ps1 -Force

# Opção 3: Manual (se script não funcionar)
docker-compose -f docker-compose.prod.yml down
docker-compose down --remove-orphans
docker ps -a  # Deve estar vazio
```

**Resultado esperado**: Nenhum container conectcrm rodando

---

### FASE 4: Configurar Ambiente de Produção (10 min)

#### 4.1. Copiar arquivo .env.production do repositório

```bash
cd backend

# O arquivo já foi criado localmente, você precisa:
# 1. Copiar do seu PC local para o servidor AWS
# 2. OU editar manualmente no servidor

# Método 1: SCP do Windows para AWS
# (executar no PowerShell local, não no SSH)
scp -i sua-chave.pem backend\.env.production ubuntu@seu-ip-aws:/home/ubuntu/conectcrm/backend/

# Método 2: Criar manualmente no servidor
nano .env.production
# Cole o conteúdo do arquivo
```

#### 4.2. Editar valores PLACEHOLDER

No arquivo `backend/.env.production`, substitua:

```bash
# Editar arquivo
nano backend/.env.production

# Valores que PRECISAM ser editados:
DATABASE_HOST=<SEU_IP_PRODUCAO_OU_RDS_ENDPOINT>   # Ex: 10.0.1.50 ou RDS endpoint
DATABASE_PASSWORD=<SENHA_SEGURA_PRODUCAO>          # Senha real do PostgreSQL
SMTP_USER=<EMAIL_PRODUCAO>                        # Email real
SMTP_PASS=<SENHA_APP_GMAIL_PRODUCAO>              # Senha de app Gmail
GMAIL_USER=<EMAIL_PRODUCAO>                       # Email real
GMAIL_PASSWORD=<SENHA_APP_GMAIL_PRODUCAO>         # Senha de app Gmail
WHATSAPP_ACCESS_TOKEN=<TOKEN_PRODUCAO_WHATSAPP>   # Token real WhatsApp
WHATSAPP_PHONE_NUMBER_ID=<PHONE_ID_PRODUCAO>      # Phone ID real
OPENAI_API_KEY=<SUA_CHAVE_OPENAI>                 # API key real (se usar)
ANTHROPIC_API_KEY=<SUA_CHAVE_ANTHROPIC>           # API key real (se usar)

# ⚠️ JWT_SECRET e JWT_REFRESH_SECRET já estão preenchidos!
# Não precisa alterar (foram gerados automaticamente)
```

**Salvar**: `Ctrl+O`, `Enter`, `Ctrl+X`

#### 4.3. Validar configuração

```bash
# Voltar para raiz do projeto
cd ..

# Executar validação
.\validar-config-producao.ps1

# ✅ Deve mostrar: "TUDO OK! Configuração pronta para produção!"
# ❌ Se mostrar erros: corrija conforme indicado e execute novamente
```

---

### FASE 5: Preparar Banco de Produção (8 min)

#### 5.1. Criar banco de dados

```bash
# Conectar ao PostgreSQL
psql -h SEU_IP_BANCO -U postgres

# Ou se for local:
docker-compose exec postgres psql -U postgres
```

**Executar no psql**:

```sql
-- Criar usuário de produção
CREATE USER conectcrm_prod WITH PASSWORD 'SUA_SENHA_SEGURA';

-- Criar banco de produção
CREATE DATABASE conectcrm_production WITH OWNER = conectcrm_prod;

-- Dar privilégios
GRANT ALL PRIVILEGES ON DATABASE conectcrm_production TO conectcrm_prod;

-- Verificar criação
\l

-- Sair
\q
```

#### 5.2. Executar migrations

```bash
cd backend

# Verificar conexão (deve conectar ao banco de PRODUÇÃO)
npm run migration:show

# Executar todas as migrations
npm run migration:run

# ✅ Sucesso se mostrar: "51 migrations executadas"
```

---

### FASE 6: Deploy com Configuração Correta (5 min)

```bash
# Voltar para raiz
cd ..

# Rebuild (garantir que usa .env.production)
docker-compose -f docker-compose.prod.yml build --no-cache

# Subir containers
docker-compose -f docker-compose.prod.yml up -d

# Verificar logs (aguardar 30s)
docker-compose logs -f

# Pressionar Ctrl+C quando ver "Nest application successfully started"
```

---

### FASE 7: VALIDAÇÃO CRÍTICA (10 min)

#### ✅ Check 1: Containers rodando

```bash
docker ps

# ✅ Deve mostrar:
# - conectcrm-nginx
# - conectcrm-backend
# - conectcrm-frontend
# - conectcrm-postgres (ou não, se usar RDS externo)
```

#### ✅ Check 2: Health Check

```bash
curl http://localhost:3001/health

# ✅ Deve retornar: {"status":"ok"}
```

#### ✅ Check 3: CRÍTICO - Banco de Dados Correto

```bash
docker-compose exec backend env | grep DATABASE

# ✅ DEVE MOSTRAR:
# DATABASE_HOST=<SEU_IP_PRODUCAO>  # NÃO localhost!
# DATABASE_PORT=5432               # NÃO 5434!
# DATABASE_NAME=conectcrm_production

# ❌ SE MOSTRAR localhost:5434 = AINDA ESTÁ ERRADO!
```

#### ✅ Check 4: Testar Login

```bash
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@empresa.com","password":"senha123"}'

# ✅ Deve retornar token JWT ou erro de credenciais (normal se usuário não existe)
# ❌ Se retornar erro de conexão = problema no banco
```

#### ✅ Check 5: Frontend Acessível

```bash
# No navegador ou curl
curl -I http://seu-ip-aws

# ✅ Deve retornar: 200 OK ou 301/302 redirect
```

#### ✅ Check 6: Logs sem erros

```bash
# Backend
docker-compose logs backend | grep -i error

# ✅ Não deve ter erros críticos de conexão

# Postgres (se local)
docker-compose logs postgres | grep -i error
```

#### ✅ Check 7: NODE_ENV

```bash
docker-compose exec backend env | grep NODE_ENV

# ✅ Deve mostrar: NODE_ENV=production
```

#### ✅ Check 8: Testar endpoint de listagem

```bash
# Exemplo: listar empresas (ajuste conforme seu sistema)
curl http://localhost:3001/empresas

# ✅ Deve retornar array (mesmo que vazio: [])
# ❌ Se erro 500 = problema no backend/banco
```

---

## 🎯 CRITÉRIOS DE SUCESSO

Checklist final (TODOS devem estar ✅):

- [ ] Containers rodando sem restart contínuo
- [ ] Health check retorna `{"status":"ok"}`
- [ ] **DATABASE_HOST ≠ localhost** (CRÍTICO!)
- [ ] **DATABASE_PORT = 5432** (NÃO 5434!)
- [ ] **DATABASE_NAME = conectcrm_production**
- [ ] **NODE_ENV = production**
- [ ] Login funciona (retorna token ou erro esperado)
- [ ] Frontend carrega (código 200 ou 301/302)
- [ ] Logs sem erros críticos de conexão
- [ ] Migrations executadas (51 migrations)

---

## 🚨 TROUBLESHOOTING

### Problema 1: Container reiniciando continuamente

```bash
# Ver logs para identificar erro
docker-compose logs backend --tail=100

# Causas comuns:
# - Banco não acessível (verificar DATABASE_HOST)
# - Senha incorreta (verificar DATABASE_PASSWORD)
# - Migrations faltando
```

**Solução**:
```bash
# Verificar conexão com banco
docker-compose exec backend ping -c 3 SEU_IP_BANCO

# Re-executar migrations
docker-compose exec backend npm run migration:run
```

---

### Problema 2: Ainda conectando no banco dev

```bash
# Verificar qual .env está sendo usado
docker-compose exec backend cat .env | head -10

# Verificar env_file no docker-compose.prod.yml
cat docker-compose.prod.yml | grep -A 3 "env_file"
```

**Solução**:
```bash
# Garantir que docker-compose.prod.yml usa .env.production
# Rebuild forçado
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml build --no-cache
docker-compose -f docker-compose.prod.yml up -d
```

---

### Problema 3: Erro 502 Bad Gateway (nginx)

**Causa**: Backend não iniciou ou não está acessível

```bash
# Verificar se backend está rodando
docker ps | grep backend

# Verificar logs do backend
docker-compose logs backend | tail -50

# Verificar porta do backend
docker-compose exec nginx wget -O- http://backend:3001/health
```

**Solução**:
```bash
# Reiniciar backend
docker-compose restart backend

# Aguardar 30s e testar novamente
```

---

### Problema 4: Migration error "relation already exists"

**Causa**: Tabelas já existem no banco (de tentativa anterior)

```bash
# Opção 1: Limpar banco e reexecutar
psql -h SEU_IP_BANCO -U conectcrm_prod -d conectcrm_production

# No psql:
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO conectcrm_prod;
\q

# Re-executar migrations
docker-compose exec backend npm run migration:run
```

---

## 📊 MONITORAMENTO PÓS-DEPLOY

### Primeira hora (crítica)

```bash
# Watch logs em tempo real
docker-compose logs -f backend

# Monitor de health (executar em outro terminal)
watch -n 30 'curl -s http://localhost:3001/health'

# Monitor de recursos
docker stats
```

### Métricas a observar

- **CPU**: < 50% em idle
- **Memória**: < 2GB em idle
- **Logs**: Sem erros recorrentes
- **Response time**: < 500ms para /health

---

## 📝 REVERTER SE NECESSÁRIO

Se algo der muito errado:

```bash
# Parar deploy novo
docker-compose -f docker-compose.prod.yml down

# Restaurar backup (se fez)
psql -h SEU_IP_BANCO -U conectcrm_prod -d conectcrm_production < backup-antes-correcao.sql

# Voltar configuração antiga (NÃO recomendado, mas como emergência)
cd backend
mv .env.production .env.production.bak
cp .env .env.production
cd ..

# Re-deploy
docker-compose -f docker-compose.prod.yml up -d
```

---

## ✅ FINALIZAÇÃO

Após validação completa:

1. **Documentar**: Anote as credenciais em local seguro (ex: 1Password, Bitwarden)
2. **Backup**: Agendar backups automáticos do banco de produção
3. **Monitoramento**: Configurar alertas (Sentry, CloudWatch, etc)
4. **Teste E2E**: Fazer teste completo de fluxo (criar ticket, enviar WhatsApp, etc)

---

## 📚 ARQUIVOS DE REFERÊNCIA

- **Guia Completo**: `GUIA_REMOVER_DEPLOY_QUEBRADO.md`
- **Script Limpeza**: `remover-deploy-quebrado.ps1`
- **Script Validação**: `validar-config-producao.ps1`
- **Config Produção**: `backend/.env.production` (NÃO commitar!)
- **Docker Compose**: `docker-compose.prod.yml`

---

## 🆘 SUPORTE

Se encontrar problemas não documentados:

1. Verificar logs: `docker-compose logs backend --tail=200`
2. Verificar variáveis: `docker-compose exec backend env | grep DATABASE`
3. Testar conexão manual: `psql -h HOST -U USER -d DATABASE`
4. Consultar documentação: `GUIA_REMOVER_DEPLOY_QUEBRADO.md`

---

**✅ Deploy Correto = DATABASE_HOST ≠ localhost && DATABASE_PORT = 5432 && NODE_ENV = production**
