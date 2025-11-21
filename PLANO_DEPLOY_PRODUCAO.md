# 🚀 PLANO COMPLETO DE DEPLOY EM PRODUÇÃO

**Data**: 19 de novembro de 2025  
**Branch**: consolidacao-atendimento  
**Módulo**: Sistema de Atendimento Completo

---

## 🎯 OBJETIVO

Fazer deploy do módulo de atendimento em produção de forma **SEGURA** e **SEM DOWNTIME**.

---

## ⚠️ PRÉ-REQUISITOS CRÍTICOS

### ✅ O Que JÁ Está Pronto:
- [x] Banco DEV sincronizado (49/51 migrations aplicadas)
- [x] Backend funcionando localmente
- [x] Frontend funcionando localmente
- [x] Todas as migrations críticas de atendimento aplicadas
- [x] WebSocket funcionando
- [x] Testes manuais realizados

### 🔴 O Que PRECISA SER FEITO:
- [ ] Verificar banco PROD (CRÍTICO!)
- [ ] Sincronizar migrations PROD = DEV
- [ ] Configurar variáveis de ambiente PROD
- [ ] Fazer backup do banco PROD
- [ ] Testar em staging (se disponível)

---

## 📋 ETAPAS DO DEPLOY

### FASE 1️⃣: PRÉ-DEPLOY (30-60 min)

#### 1.1 Obter Acesso ao Banco PROD
**Responsável**: DevOps / Infra  
**Prazo**: Antes de tudo

**Informações necessárias:**
```env
DATABASE_HOST_PROD=<ip-ou-dominio>
DATABASE_PORT_PROD=<porta-geralmente-5432>
DATABASE_NAME_PROD=<nome-banco>
DATABASE_USERNAME_PROD=<usuario>
DATABASE_PASSWORD_PROD=<senha>
```

**Checklist:**
- [ ] Credenciais obtidas
- [ ] Conexão testada (pg_isready ou psql)
- [ ] Permissões de leitura/escrita confirmadas

---

#### 1.2 Verificar Estado do Banco PROD
**Comando:**
```powershell
# Configurar variáveis
$env:DATABASE_HOST="<prod-host>"
$env:DATABASE_PORT="<prod-port>"
$env:DATABASE_NAME="<prod-db>"
$env:DATABASE_USERNAME="<prod-user>"
$env:DATABASE_PASSWORD="<prod-pass>"

# Verificar migrations
cd C:\Projetos\conectcrm\backend
npx typeorm migration:show -d ormconfig.js
```

**Salvar resultado em**: `MIGRATIONS_PROD_ATUAL.txt`

**Checklist:**
- [ ] Comando executado com sucesso
- [ ] Lista de migrations salva
- [ ] Comparação com DEV feita

---

#### 1.3 Fazer Backup do Banco PROD ⚠️ OBRIGATÓRIO!
**Comando:**
```bash
# No servidor PROD (ou via SSH):
pg_dump -h <host> -U <user> -d <database> -F c -b -v -f backup_prod_20251119_pre_deploy.dump

# Verificar tamanho:
ls -lh backup_prod_20251119_pre_deploy.dump
```

**Checklist:**
- [ ] Backup criado
- [ ] Tamanho do backup > 0 bytes
- [ ] Backup testado (pg_restore --list)
- [ ] Backup copiado para local seguro (S3, Azure Blob, etc.)

**Rollback (se necessário):**
```bash
# Restaurar backup:
pg_restore -h <host> -U <user> -d <database> -c backup_prod_20251119_pre_deploy.dump
```

---

#### 1.4 Sincronizar Migrations PROD
**SE o banco PROD estiver desatualizado:**

```powershell
# Aplicar migrations faltantes
cd C:\Projetos\conectcrm\backend
npx typeorm migration:run -d ormconfig.js
```

**Checklist:**
- [ ] Migrations aplicadas com sucesso
- [ ] Nenhum erro retornado
- [ ] Validar: `npx typeorm migration:show` mostra todas [X]

**⚠️ CRÍTICO: Verificar essas 10 migrations estão no PROD:**
```
[X] CreateAtendimentoTables1728518400000
[X] AddContatoFotoToAtendimentoTickets1744828200000
[X] CreateEquipesAtribuicoesTables1745022000000
[X] RemoveChatwootFromAtendimento1762305000000
[X] CreateDistribuicaoAutomaticaTables1762531500000
[X] CreateMessageTemplatesTable1762546700000
[X] CreateTagsTable1762600000000
[X] CreateTicketTagsTable1762600100000
[X] ConsolidacaoEquipeFila1762781002951
[X] AddContatoEmailToTicket1763561367642
```

---

### FASE 2️⃣: PREPARAÇÃO DO CÓDIGO (15-30 min)

#### 2.1 Atualizar Código no Servidor PROD
**Via Git:**
```bash
# No servidor PROD:
cd /path/to/conectcrm

# Fazer backup do código atual
cp -r . ../conectcrm_backup_$(date +%Y%m%d_%H%M%S)

# Atualizar código
git fetch origin
git checkout consolidacao-atendimento
git pull origin consolidacao-atendimento
```

**Checklist:**
- [ ] Branch consolidacao-atendimento ativa
- [ ] Código atualizado
- [ ] Backup do código anterior feito

---

#### 2.2 Instalar Dependências
```bash
# Backend
cd backend
npm ci --production

# Frontend
cd ../frontend-web
npm ci --production
```

**Checklist:**
- [ ] Dependências instaladas sem erros
- [ ] `node_modules` atualizado
- [ ] Verificar versões críticas (socket.io, typeorm, etc.)

---

#### 2.3 Configurar Variáveis de Ambiente PROD
**Criar/Atualizar `backend/.env.production`:**
```env
# Banco de Dados
DATABASE_HOST=<prod-host>
DATABASE_PORT=<prod-port>
DATABASE_NAME=<prod-db>
DATABASE_USERNAME=<prod-user>
DATABASE_PASSWORD=<prod-pass>

# Aplicação
APP_ENV=production
APP_PORT=3001
NODE_ENV=production

# JWT
JWT_SECRET=<secret-forte-prod>
JWT_EXPIRATION=7d

# Redis
REDIS_HOST=<redis-prod-host>
REDIS_PORT=6379
REDIS_PASSWORD=<redis-pass>

# URLs
FRONTEND_URL=https://<dominio-frontend-prod>
BACKEND_URL=https://<dominio-backend-prod>

# Observability (opcional, mas recomendado)
OTEL_EXPORTER_OTLP_ENDPOINT=http://jaeger:4318
ENABLE_OPENTELEMETRY=true
ENABLE_PROMETHEUS=true

# WhatsApp (se aplicável)
WHATSAPP_API_KEY=<key-prod>

# OpenAI (se aplicável)
OPENAI_API_KEY=<key-prod>
```

**Checklist:**
- [ ] Arquivo `.env.production` criado
- [ ] TODAS as variáveis preenchidas
- [ ] Secrets diferentes de DEV
- [ ] URLs apontando para PROD

---

#### 2.4 Build da Aplicação
```bash
# Backend
cd backend
npm run build

# Frontend
cd ../frontend-web
npm run build
```

**Checklist:**
- [ ] Backend compilado (`dist/` criado)
- [ ] Frontend buildado (`build/` criado)
- [ ] Sem erros de TypeScript
- [ ] Sem warnings críticos

---

### FASE 3️⃣: DEPLOY (20-40 min)

#### 3.1 Parar Aplicação Atual (se rodando)
```bash
# Método 1: PM2
pm2 stop backend
pm2 stop frontend

# Método 2: Docker
docker-compose down

# Método 3: Systemd
sudo systemctl stop conectcrm-backend
sudo systemctl stop conectcrm-frontend
```

**Checklist:**
- [ ] Backend parado
- [ ] Frontend parado
- [ ] Processos verificados (`ps aux | grep node`)

---

#### 3.2 Iniciar Backend
```bash
cd backend

# Método 1: PM2 (RECOMENDADO)
pm2 start dist/src/main.js --name "conectcrm-backend" --env production

# Método 2: Docker
docker-compose -f docker-compose.production.yml up -d backend

# Método 3: Node direto
NODE_ENV=production node dist/src/main.js
```

**Checklist:**
- [ ] Backend iniciado
- [ ] Logs sem erros
- [ ] Health check: `curl http://localhost:3001/health` retorna 200

---

#### 3.3 Verificar Backend Funcionando
```bash
# 1. Health Check
curl http://localhost:3001/health
# Espera: {"status":"ok"}

# 2. Verificar migrations
cd backend
npx typeorm migration:show -d ormconfig.js
# Espera: Todas [X]

# 3. Testar rota de login
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"senha123"}'
# Espera: { "access_token": "..." }
```

**Checklist:**
- [ ] Health check OK
- [ ] Migrations OK
- [ ] Login funciona
- [ ] Logs estáveis (sem erros)

---

#### 3.4 Iniciar Frontend
```bash
cd frontend-web

# Método 1: Serve estático (RECOMENDADO)
pm2 start serve --name "conectcrm-frontend" -- build -p 3000

# Método 2: Nginx (melhor para produção)
# Copiar build/ para /var/www/conectcrm/
# Configurar nginx para servir

# Método 3: Docker
docker-compose -f docker-compose.production.yml up -d frontend
```

**Checklist:**
- [ ] Frontend servindo
- [ ] Acessível via browser
- [ ] Assets carregando (CSS, JS)

---

### FASE 4️⃣: VALIDAÇÃO (30-60 min)

#### 4.1 Smoke Tests Automatizados
**Executar script de verificação:**
```powershell
# Rodar smoke tests
.\scripts\verify-backend.ps1
```

**Checklist:**
- [ ] Login funciona
- [ ] Rotas de atendimento funcionam
- [ ] WebSocket conecta
- [ ] Notificações funcionam

---

#### 4.2 Testes Manuais na UI

**Módulo de Atendimento:**
1. **Login**
   - [ ] Login com usuário válido funciona
   - [ ] JWT é retornado
   - [ ] Redirecionamento correto

2. **Dashboard**
   - [ ] KPIs carregam
   - [ ] Sem erros no console

3. **Gestão de Equipes**
   - [ ] Lista de equipes carrega
   - [ ] Criar nova equipe funciona
   - [ ] Editar equipe funciona
   - [ ] Atribuir membros funciona

4. **Tickets de Atendimento**
   - [ ] Lista de tickets carrega
   - [ ] Criar novo ticket funciona
   - [ ] Transferir ticket funciona
   - [ ] Encerrar ticket funciona

5. **Chat/Mensagens**
   - [ ] Chat carrega
   - [ ] Enviar mensagem funciona
   - [ ] Receber mensagem funciona
   - [ ] WebSocket conectado

6. **Notificações**
   - [ ] Notificações aparecem
   - [ ] Badge count atualiza
   - [ ] Clicar na notificação funciona

7. **Templates de Mensagens**
   - [ ] Lista de templates carrega
   - [ ] Criar template funciona
   - [ ] Usar template no chat funciona

8. **Sistema de Tags**
   - [ ] Tags carregam
   - [ ] Adicionar tag a ticket funciona
   - [ ] Filtrar por tag funciona

**Outros Módulos (verificação rápida):**
- [ ] Módulo Comercial funciona
- [ ] Módulo Financeiro funciona
- [ ] Módulo Clientes funciona

---

#### 4.3 Testes de Performance
```bash
# 1. Verificar uso de CPU/Memória
pm2 monit

# 2. Verificar conexões de banco
psql -h <host> -U <user> -d <db> -c "SELECT count(*) FROM pg_stat_activity WHERE state = 'active';"

# 3. Verificar Redis
redis-cli ping
redis-cli info stats
```

**Checklist:**
- [ ] CPU < 70%
- [ ] Memória < 80%
- [ ] Conexões de banco < 50
- [ ] Redis respondendo

---

#### 4.4 Monitoramento (se disponível)
**Verificar:**
- [ ] Prometheus coletando métricas
- [ ] Grafana mostrando dashboards
- [ ] Jaeger rastreando requests
- [ ] Logs centralizados (Winston)

---

### FASE 5️⃣: PÓS-DEPLOY (15-30 min)

#### 5.1 Documentar Deploy
**Criar arquivo `DEPLOY_LOG_20251119.md`:**
```markdown
# Deploy Log - 19/11/2025

## Versão Deployada
- Branch: consolidacao-atendimento
- Commit: <hash>
- Data: 19/11/2025 HH:MM

## Migrations Aplicadas
- Total: 49
- Novas: <listar se houver>

## Testes Realizados
- [x] Smoke tests
- [x] Testes manuais
- [x] Performance

## Problemas Encontrados
- Nenhum / <listar se houver>

## Rollback Plan
- Backup: backup_prod_20251119_pre_deploy.dump
- Código anterior: ../conectcrm_backup_<timestamp>
```

---

#### 5.2 Notificar Stakeholders
**E-mail/Slack:**
```
🚀 Deploy Concluído - Módulo de Atendimento

✅ Status: Sucesso
📅 Data: 19/11/2025
🕐 Horário: <horário>
⏱️ Duração: <tempo total>

Novas funcionalidades:
- Sistema completo de atendimento
- Gestão de equipes e filas
- Chat em tempo real
- Notificações desktop
- Templates de mensagens
- Sistema de tags

URL: https://<dominio-prod>

Qualquer problema, reportar imediatamente.
```

---

#### 5.3 Monitorar por 24h
**Checklist de monitoramento:**
- [ ] Verificar logs a cada 2 horas
- [ ] Verificar métricas no Grafana
- [ ] Responder tickets de suporte
- [ ] Coletar feedback inicial

---

## 🚨 PLANO DE ROLLBACK

**SE algo der errado durante o deploy:**

### Rollback do Banco
```bash
# 1. Parar aplicação
pm2 stop all

# 2. Restaurar backup
pg_restore -h <host> -U <user> -d <db> -c backup_prod_20251119_pre_deploy.dump

# 3. Reverter migrations específicas (se necessário)
cd backend
npx typeorm migration:revert -d ormconfig.js
# Repetir até voltar ao estado anterior
```

### Rollback do Código
```bash
# 1. Restaurar código anterior
cd /path/to
rm -rf conectcrm
cp -r conectcrm_backup_<timestamp> conectcrm

# 2. Reinstalar dependências
cd conectcrm/backend
npm ci

# 3. Rebuild
npm run build

# 4. Reiniciar
pm2 restart all
```

### Rollback do Git
```bash
# Se já commitado:
git revert <commit-hash>
git push

# Se não commitado:
git reset --hard origin/main
```

---

## 📊 MÉTRICAS DE SUCESSO

**Deploy é considerado bem-sucedido se:**
- ✅ Todos os smoke tests passam
- ✅ Uptime > 99% nas primeiras 24h
- ✅ Tempo de resposta < 500ms (p95)
- ✅ Taxa de erro < 1%
- ✅ Nenhum bug crítico reportado
- ✅ Feedback positivo dos usuários

---

## 📞 CONTATOS DE EMERGÊNCIA

**Em caso de problemas críticos:**
- **DevOps**: <contato>
- **DBA**: <contato>
- **Backend Lead**: <contato>
- **Frontend Lead**: <contato>
- **Product Owner**: <contato>

---

## ✅ CHECKLIST FINAL PRÉ-DEPLOY

### Banco de Dados:
- [ ] Backup realizado
- [ ] Migrations sincronizadas
- [ ] Conexão validada

### Código:
- [ ] Branch correta
- [ ] Build sem erros
- [ ] Dependências atualizadas
- [ ] Variáveis de ambiente configuradas

### Infraestrutura:
- [ ] Servidores preparados
- [ ] Redis funcionando
- [ ] Monitoramento ativo

### Testes:
- [ ] Smoke tests preparados
- [ ] Plano de testes manual pronto
- [ ] Rollback plan documentado

### Comunicação:
- [ ] Stakeholders notificados
- [ ] Janela de manutenção agendada (se necessário)
- [ ] Equipe de suporte alertada

---

**Aprovação para Deploy**: ⚠️ PENDENTE

**Responsável pelo Deploy**: <nome>  
**Data Planejada**: <data>  
**Horário**: <horário> (fora do horário de pico)

---

**Última atualização**: 19/11/2025 13:40  
**Próxima revisão**: Antes do deploy
