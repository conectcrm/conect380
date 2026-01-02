# 📊 STATUS ATUAL DO DEPLOY - 21/11/2025

## 🔍 Análise da Situação Atual

### ✅ O Que Já Temos:
- [x] Código consolidado na branch `consolidacao-atendimento`
- [x] `.env.production` criado com JWT secrets gerados
- [x] Plano de deploy documentado (../../runbooks/PLANO_DEPLOY_PRODUCAO.md)
- [x] Checklist de deploy corrigido
- [x] Scripts de validação e limpeza criados
- [x] Backend e frontend funcionando em DEV
- [x] Migrations todas aplicadas em DEV (51/51)

### 🔴 O Que Está Faltando:

#### 1. Informações de Produção (CRÍTICO)
- [ ] **Host do servidor de produção** (IP ou domínio AWS)
- [ ] **Credenciais do banco PROD** (host, user, password)
- [ ] **Chave SSH** para acesso ao servidor
- [ ] **Variáveis de ambiente PROD** completas (WhatsApp, OpenAI, SMTP, etc.)

#### 2. Preparação do Ambiente PROD
- [ ] Verificar se servidor está acessível
- [ ] Verificar se PostgreSQL está rodando
- [ ] Verificar se Redis está disponível
- [ ] Verificar espaço em disco

#### 3. Deploy Propriamente Dito
- [ ] Fazer backup do banco PROD (se já existir)
- [ ] Clonar/atualizar código no servidor
- [ ] Configurar variáveis de ambiente
- [ ] Aplicar migrations
- [ ] Build da aplicação
- [ ] Iniciar serviços

## 🎯 PRÓXIMAS AÇÕES NECESSÁRIAS

### Ação Imediata 1: Obter Informações de PROD
**O usuário precisa fornecer:**

```env
# Servidor de Produção
SERVIDOR_PROD=<IP_OU_DOMINIO_AWS>
SSH_KEY_PATH=<CAMINHO_CHAVE_PEM>
SSH_USER=ubuntu  # ou outro usuário

# Banco de Dados PROD
DATABASE_HOST_PROD=<IP_OU_RDS_ENDPOINT>
DATABASE_PORT_PROD=5432
DATABASE_NAME_PROD=conectcrm_production
DATABASE_USERNAME_PROD=conectcrm_prod
DATABASE_PASSWORD_PROD=<SENHA_SEGURA>

# Redis PROD (se aplicável)
REDIS_HOST_PROD=<IP_OU_ELASTICACHE>
REDIS_PORT_PROD=6379
REDIS_PASSWORD_PROD=<SENHA>

# URLs de Produção
FRONTEND_URL_PROD=https://app.conecthelp.com.br
BACKEND_URL_PROD=https://api.conecthelp.com.br

# Integações (se ativas)
WHATSAPP_ACCESS_TOKEN=<TOKEN_META>
OPENAI_API_KEY=<KEY> (se usar)
SMTP_USER=<EMAIL_GMAIL>
SMTP_PASS=<SENHA_APP_GMAIL>
```

### Ação Imediata 2: Verificar Acesso ao Servidor
**Comando para testar:**
```powershell
ssh -i <CAMINHO_CHAVE_PEM> ubuntu@<IP_SERVIDOR> "echo 'Acesso OK'"
```

### Ação Imediata 3: Verificar Banco PROD
**Comando para testar:**
```powershell
# Testar conexão com psql
psql -h <HOST_DB> -U conectcrm_prod -d conectcrm_production -c "SELECT version();"
```

## 📋 FLUXO DE DEPLOY RESUMIDO

Assim que tivermos as informações acima:

### Fase 1: Preparação (15 min)
1. ✅ Atualizar `.env.production` com valores reais
2. ✅ Validar configuração: `.\validar-config-producao.ps1`
3. ✅ Conectar no servidor: `ssh -i ...`
4. ✅ Verificar estado atual: `docker ps`, `psql -c "SELECT version();"`

### Fase 2: Backup (5 min)
1. ✅ Fazer backup do banco PROD (se existir)
2. ✅ Fazer backup do código atual no servidor (se existir)

### Fase 3: Deploy do Código (20 min)
1. ✅ Clonar/atualizar repositório no servidor
2. ✅ Copiar `.env.production` para o servidor
3. ✅ Instalar dependências: `npm ci`
4. ✅ Build: `npm run build`

### Fase 4: Banco de Dados (10 min)
1. ✅ Criar banco (se não existir)
2. ✅ Aplicar migrations: `npm run migration:run`
3. ✅ Verificar: `npm run migration:show` (51/51)

### Fase 5: Iniciar Aplicação (10 min)
1. ✅ Docker: `docker-compose -f docker-compose.prod.yml up -d`
   **OU** PM2: `pm2 start ecosystem.config.js --env production`
2. ✅ Verificar logs: `docker-compose logs -f` ou `pm2 logs`
3. ✅ Health check: `curl http://localhost:3001/health`

### Fase 6: Validação (20 min)
1. ✅ Smoke tests: `.\scripts\verify-backend.ps1`
2. ✅ Testes manuais na UI
3. ✅ Verificar métricas de performance

### Fase 7: Monitoramento (contínuo)
1. ✅ Observar logs por 2 horas
2. ✅ Monitorar métricas (CPU, memória, disco)
3. ✅ Responder issues se aparecerem

## ⚠️ RISCOS E MITIGAÇÕES

| Risco | Probabilidade | Impacto | Mitigação |
|-------|--------------|---------|-----------|
| Migrations falham | Média | Alto | Backup + Rollback plan |
| Credenciais erradas | Alta | Alto | Validar antes com psql/curl |
| Disco cheio | Baixa | Alto | Verificar `df -h` antes |
| Downtime longo | Média | Médio | Deploy fora do horário de pico |
| Porta 3001 ocupada | Baixa | Médio | `netstat -tulpn | grep 3001` |

## 🚨 PLANO DE ROLLBACK

Se algo der errado:

```bash
# 1. Parar aplicação
docker-compose down
# ou
pm2 stop all

# 2. Restaurar banco
pg_restore -c -d conectcrm_production backup_YYYYMMDD.dump

# 3. Restaurar código
cd /backup
cp -r conectcrm_backup_TIMESTAMP /home/ubuntu/conectcrm

# 4. Reiniciar versão anterior
docker-compose up -d
```

## ✅ CHECKLIST DE PRONTIDÃO

Marcar quando tiver:

- [ ] **IP/domínio do servidor AWS**
- [ ] **Chave SSH** (.pem) funcionando
- [ ] **Credenciais do banco PROD** validadas
- [ ] **Tokens de integração** (WhatsApp, OpenAI, SMTP)
- [ ] **URLs de produção** definidas
- [ ] **Janela de manutenção** agendada (se necessário)
- [ ] **Equipe disponível** para monitorar

## 🎬 QUANDO ESTIVER PRONTO

Diga: **"Tenho todas as informações, vamos começar o deploy"**

E eu vou guiar você passo a passo no processo completo!

---

**Status**: ⏸️ AGUARDANDO INFORMAÇÕES DE PRODUÇÃO  
**Última atualização**: 21/11/2025  
**Responsável**: Aguardando usuário
