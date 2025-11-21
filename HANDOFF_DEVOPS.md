# 📦 Handoff para DevOps/DBA - Deploy Atendimento

**Data**: 19 de novembro de 2025  
**Branch**: `consolidacao-atendimento`  
**Desenvolvedor**: [Seu Nome]  
**Contato**: [Seu Email/Slack]

---

## 🎯 RESUMO EXECUTIVO

Módulo de **Atendimento** completo e testado em DEV.  
Necessário **verificar e sincronizar banco PROD** antes do deploy.

**Tempo estimado total**: 3-4 horas  
**Janela recomendada**: Segunda/Terça 08:00-12:00  
**Risco**: 🟡 Médio (banco PROD pode estar desatualizado)

---

## ✅ O QUE ESTÁ PRONTO

### Código:
- ✅ Backend NestJS funcionando 100%
- ✅ Frontend React funcionando 100%
- ✅ WebSocket em tempo real ativo
- ✅ Testes manuais completos
- ✅ Branch estável e pronta para merge

### Banco de Dados DEV:
- ✅ **49/51 migrations aplicadas** (96%)
- ✅ **TODAS as 10 migrations críticas de atendimento OK**
- ✅ Estrutura validada
- ✅ Dados de teste funcionando

### Documentação:
- ✅ Plano de deploy completo (`PLANO_DEPLOY_PRODUCAO.md`)
- ✅ Checklist de sincronização (`CHECKLIST_SYNC_DB_PRODUCAO.md`)
- ✅ Relatório de migrations DEV (`RELATORIO_MIGRATIONS_DEV.md`)
- ✅ Scripts de verificação (`scripts/sync-db-check.ps1`)

---

## 🔴 AÇÃO IMEDIATA NECESSÁRIA (BLOQUEADOR)

### 1️⃣ Verificar Estado do Banco PROD

**Por quê?**  
Todo desenvolvimento foi feito em DEV. PROD pode estar desatualizado, causando falha no deploy.

**Como fazer:**

```bash
# 1. Conectar no servidor de PROD (SSH/RDP)
ssh usuario@servidor-prod

# 2. Navegar até diretório do backend
cd /caminho/para/conectcrm/backend

# 3. Executar verificação de migrations
npx typeorm migration:show -d ormconfig.js

# 4. Salvar output em arquivo
npx typeorm migration:show -d ormconfig.js > migrations_prod_19nov2025.txt

# 5. Enviar arquivo para o dev
```

**Output esperado:**
```
[X] CreateAtendimentoTables1728518400000
[X] CreateEquipesAtribuicoesTables1745022000000
...
[ ] AlgumaMigrationPendente  ← ATENÇÃO: Migrations pendentes!
```

**⚠️ IMPORTANTE:**
- Se houver `[ ]` (migrations pendentes), PROD está desatualizado
- Precisa sincronizar ANTES do deploy
- Ver seção "3️⃣ Sincronizar Migrations" abaixo

---

### 2️⃣ Fazer Backup do Banco PROD

**OBRIGATÓRIO antes de qualquer alteração!**

```bash
# 1. Criar diretório de backup
mkdir -p /backups/conectcrm/$(date +%Y%m%d)

# 2. Executar pg_dump
pg_dump \
  -h localhost \
  -p 5432 \
  -U postgres \
  -d conectcrm_db \
  -F c \
  -b \
  -v \
  -f /backups/conectcrm/$(date +%Y%m%d)/backup_pre_deploy_atendimento.dump

# 3. Verificar tamanho do backup (deve ser > 0)
ls -lh /backups/conectcrm/$(date +%Y%m%d)/

# 4. Testar integridade do backup
pg_restore --list /backups/conectcrm/$(date +%Y%m%d)/backup_pre_deploy_atendimento.dump | head -20

# 5. Copiar backup para local seguro (S3/Azure/etc)
# [Adaptar conforme infraestrutura]
```

**Validação:**
- ✅ Backup criado com sucesso
- ✅ Tamanho > 100MB (ou conforme esperado)
- ✅ `pg_restore --list` mostra tabelas
- ✅ Cópia em local seguro (fora do servidor)

---

### 3️⃣ Sincronizar Migrations (se necessário)

**Executar SOMENTE se houver `[ ]` no passo 1️⃣**

```bash
# 1. Garantir que backup foi feito (passo 2️⃣)
# 2. Executar migrations pendentes
cd /caminho/para/conectcrm/backend
npx typeorm migration:run -d ormconfig.js

# 3. Verificar se todas foram aplicadas
npx typeorm migration:show -d ormconfig.js

# 4. Validar que não há mais [ ] pendentes
# Espera: Todas com [X]
```

**⚠️ ATENÇÃO:**
- Migrations são **irreversíveis** (não use `migration:revert` sem orientação)
- Se der erro, **PARAR imediatamente** e contactar desenvolvedor
- Não prosseguir para deploy se migrations falharem

---

### 4️⃣ Executar Deploy

**Pré-requisitos:**
- ✅ Migrations sincronizadas (passo 3️⃣)
- ✅ Backup realizado (passo 2️⃣)
- ✅ Janela de manutenção confirmada
- ✅ Equipe disponível para suporte

**Processo:**

```bash
# 1. Fazer merge da branch (GitHub/GitLab)
git checkout main
git pull origin main
git merge consolidacao-atendimento
git push origin main

# 2. No servidor PROD, atualizar código
cd /caminho/para/conectcrm
git pull origin main

# 3. Instalar dependências (backend)
cd backend
npm ci --production

# 4. Compilar TypeScript
npm run build

# 5. Instalar dependências (frontend)
cd ../frontend-web
npm ci --production

# 6. Compilar frontend
npm run build

# 7. Reiniciar backend (PM2/systemd/Docker)
# Opção PM2:
pm2 restart conectcrm-backend

# Opção systemd:
sudo systemctl restart conectcrm-backend

# Opção Docker:
docker-compose restart backend

# 8. Reiniciar frontend (se necessário)
# [Adaptar conforme infraestrutura]
```

---

### 5️⃣ Validação Pós-Deploy (CRÍTICO)

**Executar IMEDIATAMENTE após deploy:**

```bash
# 1. Verificar se backend subiu
curl http://localhost:3001/health
# Espera: {"status":"ok"}

# 2. Verificar logs (últimas 50 linhas)
# PM2:
pm2 logs conectcrm-backend --lines 50

# systemd:
sudo journalctl -u conectcrm-backend -n 50

# Docker:
docker-compose logs --tail=50 backend

# 3. Verificar se não há erros críticos
# Procurar por: ERROR, FATAL, Exception
```

**Smoke Tests (Manual):**

1. **Login**:
   - Acessar: `https://app.conectcrm.com`
   - Fazer login com usuário teste
   - ✅ Login bem-sucedido

2. **Atendimento - Tickets**:
   - Navegar: `/atendimento`
   - Verificar lista de tickets carrega
   - ✅ Lista visível, sem erros

3. **Atendimento - Chat**:
   - Abrir um ticket
   - Enviar mensagem de teste
   - ✅ Mensagem enviada e aparece na tela

4. **Notificações Desktop**:
   - Permitir notificações no browser
   - Criar novo ticket (ou usar outro usuário)
   - ✅ Notificação aparece

5. **Gestão de Equipes**:
   - Navegar: `/nuclei/configuracoes/atendimento/equipes`
   - Verificar lista de equipes
   - ✅ Lista carrega sem erros

6. **Gestão de Filas**:
   - Navegar: `/nuclei/configuracoes/atendimento/filas`
   - Verificar lista de filas
   - ✅ Lista carrega sem erros

**Se TUDO OK:** ✅ Deploy bem-sucedido!  
**Se ALGUM ERRO:** 🚨 Ver seção "Rollback" abaixo

---

## 🚨 ROLLBACK (Se algo der errado)

### Opção 1: Rollback de Código (Rápido - 5 min)

```bash
# 1. Voltar para commit anterior
cd /caminho/para/conectcrm
git log --oneline -5  # Ver últimos commits
git checkout <commit-anterior-ao-merge>

# 2. Reinstalar dependências antigas
cd backend && npm ci --production && npm run build
cd ../frontend-web && npm ci --production && npm run build

# 3. Reiniciar serviços
pm2 restart all  # ou systemctl/docker-compose
```

### Opção 2: Rollback de Banco (Médio - 20-30 min)

**⚠️ ATENÇÃO: Só usar se migrations causaram problema!**

```bash
# 1. Parar backend (para não corromper dados)
pm2 stop conectcrm-backend

# 2. Dropar banco atual
psql -U postgres -c "DROP DATABASE conectcrm_db;"

# 3. Recriar banco vazio
psql -U postgres -c "CREATE DATABASE conectcrm_db;"

# 4. Restaurar backup
pg_restore \
  -U postgres \
  -d conectcrm_db \
  -v \
  /backups/conectcrm/YYYYMMDD/backup_pre_deploy_atendimento.dump

# 5. Validar restauração
psql -U postgres -d conectcrm_db -c "\dt" | wc -l
# Espera: Número de tabelas igual ao backup

# 6. Reiniciar backend
pm2 start conectcrm-backend
```

### Opção 3: Rollback Completo (Longo - 1h)

1. Rollback de código (Opção 1)
2. Rollback de banco (Opção 2)
3. Validar que sistema voltou ao estado anterior
4. Notificar stakeholders

---

## 📊 MIGRATIONS CRÍTICAS (Referência Rápida)

**Estas 10 migrations DEVEM estar em PROD:**

```sql
-- 1. CreateAtendimentoTables1728518400000
--    Cria tabelas base: atendimento_tickets, atendimento_mensagens, etc.

-- 2. AddContatoFotoToAtendimentoTickets1744828200000
--    Adiciona campo foto do contato

-- 3. CreateEquipesAtribuicoesTables1745022000000
--    Cria tabelas: equipes, atribuicoes_atendente_equipe

-- 4. RemoveChatwootFromAtendimento1762305000000
--    Remove referências antigas do Chatwoot

-- 5. CreateDistribuicaoAutomaticaTables1762531500000
--    Cria tabelas: filas, distribuicao_automatica

-- 6. CreateMessageTemplatesTable1762546700000
--    Cria tabela: message_templates

-- 7. CreateTagsTable1762600000000
--    Cria tabela: tags

-- 8. CreateTicketTagsTable1762600100000
--    Cria tabela: ticket_tags (many-to-many)

-- 9. ConsolidacaoEquipeFila1762781002951
--    Consolida relacionamento equipe-fila

-- 10. AddContatoEmailToTicket1763561367642
--     Adiciona campo email do contato

-- 11. AddStatusAtendenteToUsers1762190000000
--     Adiciona status_atendente à tabela users
```

**Comando para verificar:**
```sql
-- Verificar se tabelas existem
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE '%atendimento%' 
OR table_name IN ('equipes', 'filas', 'tags', 'message_templates');
```

---

## 📞 CONTATOS DE EMERGÊNCIA

**Desenvolvedor:**
- Nome: [Seu Nome]
- Email: [Seu Email]
- Slack: [Seu @]
- Celular: [Seu Telefone] (disponível 24/7 durante deploy)

**Backup (se dev indisponível):**
- Nome: [Backup Dev]
- Email: [Backup Email]
- Slack: [Backup @]

**Horários de Disponibilidade:**
- Segunda-Sexta: 08:00 - 18:00
- Deploy Day: 06:00 - 22:00 (dedicação total)

---

## 📂 ARQUIVOS DE REFERÊNCIA

**No repositório (`consolidacao-atendimento` branch):**

1. **`PLANO_DEPLOY_PRODUCAO.md`**
   - Plano completo de deploy (5 fases, 600+ linhas)
   - Checklist detalhado de cada etapa
   - Testes de validação

2. **`CHECKLIST_SYNC_DB_PRODUCAO.md`**
   - 6 fases de sincronização do banco
   - Queries SQL de validação
   - Erros comuns e soluções

3. **`RELATORIO_MIGRATIONS_DEV.md`**
   - Estado completo do banco DEV
   - 49 migrations aplicadas listadas
   - 2 migrations pendentes (não críticas)

4. **`RESUMO_EXECUCAO_ATENDIMENTO.md`**
   - Funcionalidades implementadas
   - Testes realizados
   - Validações concluídas

5. **`scripts/sync-db-check.ps1`**
   - Script PowerShell de verificação
   - Gera relatório automático

---

## ✅ CHECKLIST RÁPIDO (Imprimir e Usar)

### Pré-Deploy:
- [ ] Backup do banco PROD realizado
- [ ] Backup copiado para local seguro
- [ ] Migrations de PROD verificadas
- [ ] Migrations sincronizadas (se necessário)
- [ ] Equipe de suporte notificada
- [ ] Janela de manutenção confirmada

### Deploy:
- [ ] Branch merged para main
- [ ] Código atualizado em PROD (git pull)
- [ ] Dependências instaladas (npm ci)
- [ ] Backend compilado (npm run build)
- [ ] Frontend compilado (npm run build)
- [ ] Backend reiniciado
- [ ] Frontend reiniciado (se necessário)

### Pós-Deploy:
- [ ] Backend respondendo (/health = OK)
- [ ] Logs sem erros críticos
- [ ] Login funciona
- [ ] Lista de tickets carrega
- [ ] Chat envia mensagens
- [ ] Notificações funcionam
- [ ] Gestão de equipes carrega
- [ ] Gestão de filas carrega
- [ ] Stakeholders notificados

### Se Erro:
- [ ] Rollback executado (código ou banco)
- [ ] Sistema voltou ao estado anterior
- [ ] Desenvolvedor contactado
- [ ] Incidente documentado
- [ ] Post-mortem agendado

---

## 🎯 DECISÃO FINAL

**Status atual:** ⏸️ **AGUARDANDO VERIFICAÇÃO DE PROD**

**Opções:**

1. **Deploy Esta Semana** (Rápido):
   - Hoje (19/11): Verificar PROD (2-3h)
   - Quinta (21/11): Deploy (3-4h)
   - Risco: 🟡 Médio

2. **Deploy Semana Que Vem** (Seguro):
   - Hoje (19/11): Verificar PROD
   - Sexta (22/11): Testar em staging
   - Segunda (25/11): Deploy
   - Risco: 🟢 Baixo

**Recomendação:** Opção 2 (deploy 25/11)

---

**Próxima ação:** DevOps executar **Passo 1️⃣** (Verificar Banco PROD) e reportar resultado.

**Gerado em:** 19/11/2025 13:50  
**Válido até:** Deploy concluído  
**Versão:** 1.0
