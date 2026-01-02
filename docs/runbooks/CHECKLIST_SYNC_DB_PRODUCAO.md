# ✅ CHECKLIST: Sincronização Banco DEV → PROD

**Data**: 19 de novembro de 2025  
**Objetivo**: Garantir que banco de PRODUÇÃO tenha todas as implementações do DEV

---

## 🚨 CRÍTICO: Por Que Isso É Necessário?

**Situação atual:**
- ✅ Desenvolvimento foi feito no banco LOCAL (porta 5434)
- ⚠️ Banco de PRODUÇÃO pode estar DESATUALIZADO
- 🔥 Deploy sem sync = ERRO 500 em produção!

**O que pode quebrar sem sync:**
- ❌ Telas de atendimento (tabelas ausentes)
- ❌ Sistema de equipes (equipes não existe)
- ❌ Notificações (notifications não existe)
- ❌ Templates de mensagens (message_templates não existe)
- ❌ Sistema de tags (tags/ticket_tags não existe)

---

## 📊 Migrations Totais no Código

**Total**: **53 migrations** (até 19/11/2025)

### Migrations Críticas para Atendimento (últimas 15):

1. `1762781002951-ConsolidacaoEquipeFila.ts` - Sistema de equipes/filas ⚡
2. `1762600100000-CreateTicketTagsTable.ts` - Sistema de tags ⚡
3. `1762600000000-CreateTagsTable.ts` - Tabela de tags ⚡
4. `1762546700000-CreateMessageTemplatesTable.ts` - Templates ⚡
5. `1762531500000-CreateDistribuicaoAutomaticaTables.ts` - Distribuição ⚡
6. `1762305000000-RemoveChatwootFromAtendimento.ts` - Limpeza ⚡
7. `1762220000000-CreatePasswordResetTokens.ts` - Reset de senha
8. `1762216500000-AddDeveTrocarSenhaFlagToUsers.ts` - Segurança
9. `1762214400000-UpdateOportunidadeClienteIdToUuid.ts` - Comercial
10. `1762212773553-AddPhase1ConfigFields.ts` - Configurações ⚡
11. `1762211047321-CreateEmpresaConfiguracoes.ts` - Multi-tenant
12. `1762201500000-CreateEmpresaConfiguracoes.ts` - Configurações empresa
13. `1762201484633-CreateEmpresaConfiguracoesTable.ts` - Tabela config
14. `1762190000000-AddStatusAtendenteToUsers.ts` - Status atendente ⚡
15. `1761582400000-AddHistoricoVersoesFluxo.ts` - Versionamento

**⚡ = CRÍTICO para módulo de atendimento funcionar**

---

## 🔍 ETAPA 1: Verificar Banco de Desenvolvimento

### Comando:
```powershell
cd backend
npm run migration:show
```

### O que você DEVE ver:
```
[X] CreateEventosTable1691234567890
[X] CreateSubscriptionTables1704396800000
[X] CreateAtendimentoTables1728518400000
[X] CreateDepartamentos1729180000000
[X] CreateTriagemLogsTable1730224800000
[X] EnableRowLevelSecurity1730476887000
...
[X] ConsolidacaoEquipeFila1762781002951
[X] CreateLeadsTable1762962000000
[X] AddEmpresaIdToContratosEFaturas1763062900000
...
```

**Legenda:**
- `[X]` = Migration EXECUTADA ✅
- `[ ]` = Migration PENDENTE ❌

### ✅ Checklist DEV:
- [ ] Comando executado com sucesso
- [ ] Todas as 53 migrations mostram `[X]`
- [ ] Nenhuma migration pendente `[ ]`
- [ ] Não há erros de conexão

**Se houver migrations pendentes no DEV:**
```powershell
npm run migration:run
```

---

## 🔍 ETAPA 2: Acessar Banco de Produção

### ⚠️ Informações Necessárias:

Você precisa obter do responsável pela infra:

```env
DATABASE_HOST_PROD=<IP ou domínio>
DATABASE_PORT_PROD=<porta, geralmente 5432>
DATABASE_NAME_PROD=<nome do banco>
DATABASE_USERNAME_PROD=<usuário>
DATABASE_PASSWORD_PROD=<senha>
```

### Opção 1: Via Variáveis de Ambiente

```powershell
$env:DATABASE_HOST="<host-prod>"
$env:DATABASE_PORT="<porta-prod>"
$env:DATABASE_NAME="<banco-prod>"
$env:DATABASE_USERNAME="<user-prod>"
$env:DATABASE_PASSWORD="<senha-prod>"

cd backend
npm run migration:show
```

### Opção 2: Via Arquivo .env.production

Criar arquivo `backend/.env.production`:
```env
DATABASE_HOST=<host-prod>
DATABASE_PORT=<porta-prod>
DATABASE_NAME=<banco-prod>
DATABASE_USERNAME=<user-prod>
DATABASE_PASSWORD=<senha-prod>
```

Executar:
```powershell
cd backend
$env:NODE_ENV="production"
npm run migration:show
```

### ✅ Checklist PROD:
- [ ] Credenciais obtidas
- [ ] Conexão com banco PROD testada
- [ ] Comando `migration:show` executado
- [ ] Lista de migrations do PROD salva

---

## 📊 ETAPA 3: Comparar DEV x PROD

### Criar tabela de comparação:

| Migration | DEV | PROD | Status |
|-----------|-----|------|--------|
| ConsolidacaoEquipeFila | [X] | [?] | ⚠️ Verificar |
| CreateTicketTagsTable | [X] | [?] | ⚠️ Verificar |
| CreateTagsTable | [X] | [?] | ⚠️ Verificar |
| CreateMessageTemplatesTable | [X] | [?] | ⚠️ Verificar |
| CreateDistribuicaoAutomaticaTables | [X] | [?] | ⚠️ Verificar |
| AddStatusAtendenteToUsers | [X] | [?] | ⚠️ Verificar |
| ... | ... | ... | ... |

### ⚠️ Se PROD tiver `[ ]` em qualquer migration crítica:

**PROD ESTÁ DESATUALIZADO** = Precisa rodar migrations!

---

## 🔧 ETAPA 4: Sincronizar PROD (se necessário)

### ⚠️ BACKUP OBRIGATÓRIO ANTES!

```bash
# No servidor de produção:
pg_dump -h <host> -U <user> -d <banco> > backup_prod_20251119.sql

# Verificar tamanho do backup:
ls -lh backup_prod_20251119.sql
```

### Aplicar migrations em PROD:

```powershell
# Configurar ambiente para PROD
$env:NODE_ENV="production"
$env:DATABASE_HOST="<host-prod>"
$env:DATABASE_PORT="<porta-prod>"
$env:DATABASE_NAME="<banco-prod>"
$env:DATABASE_USERNAME="<user-prod>"
$env:DATABASE_PASSWORD="<senha-prod>"

cd backend

# Executar migrations
npm run migration:run
```

### ✅ Validar sincronização:

```powershell
npm run migration:show
```

**Agora DEVE mostrar TODAS as migrations com [X]**

---

## 🧪 ETAPA 5: Validar Estrutura do Banco

### Verificar tabelas críticas existem:

```sql
-- Conectar no banco PROD e executar:

-- 1. Tabelas de atendimento
SELECT tablename FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename LIKE 'atendimento_%'
ORDER BY tablename;

-- Esperado:
-- atendimento_atribuicoes
-- atendimento_configuracao_inatividade
-- atendimento_equipe_membros
-- atendimento_equipes
-- atendimento_mensagens
-- atendimento_tickets

-- 2. Tabelas auxiliares
SELECT tablename FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('notifications', 'message_templates', 'tags', 'ticket_tags')
ORDER BY tablename;

-- Esperado:
-- message_templates
-- notifications
-- tags
-- ticket_tags

-- 3. Verificar colunas novas em users
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' 
  AND column_name IN ('status_atendente', 'capacidade_maxima', 'tickets_ativos')
ORDER BY column_name;

-- Esperado:
-- capacidade_maxima | integer
-- status_atendente | character varying
-- tickets_ativos | integer
```

### ✅ Checklist de Tabelas:
- [ ] 6 tabelas `atendimento_*` existem
- [ ] 4 tabelas auxiliares existem
- [ ] 3 colunas novas em `users` existem
- [ ] Todas as tabelas têm dados compatíveis

---

## ⚡ ETAPA 6: Teste de Smoke em PROD

### Após deploy, testar:

1. **Login**
   ```
   POST /auth/login
   ```
   - [ ] Login funciona
   - [ ] JWT retorna

2. **Listar tickets**
   ```
   GET /atendimento/tickets
   ```
   - [ ] Rota não dá 500
   - [ ] Retorna array (vazio ou com dados)

3. **Listar equipes**
   ```
   GET /atendimento/equipes
   ```
   - [ ] Rota não dá 500
   - [ ] Retorna array

4. **Notificações**
   ```
   GET /notifications
   ```
   - [ ] Rota não dá 500
   - [ ] Retorna array

5. **Templates**
   ```
   GET /message-templates
   ```
   - [ ] Rota não dá 500
   - [ ] Retorna array

---

## 📋 Resumo de Comandos

### DEV:
```powershell
cd backend
npm run migration:show
```

### PROD:
```powershell
# 1. Configurar env
$env:DATABASE_HOST="<prod>"
$env:DATABASE_PORT="<porta>"
$env:DATABASE_NAME="<banco>"
$env:DATABASE_USERNAME="<user>"
$env:DATABASE_PASSWORD="<senha>"

# 2. Verificar
cd backend
npm run migration:show

# 3. Backup (se necessário sync)
pg_dump > backup.sql

# 4. Aplicar migrations (se PROD desatualizado)
npm run migration:run

# 5. Validar
npm run migration:show
```

---

## 🚨 Erros Comuns

### Erro: "relation does not exist"
**Causa**: Tabela não existe no PROD  
**Solução**: Rodar `npm run migration:run` no PROD

### Erro: "column does not exist"
**Causa**: Coluna não existe no PROD  
**Solução**: Rodar `npm run migration:run` no PROD

### Erro: "Connection refused"
**Causa**: Credenciais erradas ou firewall  
**Solução**: Verificar host/porta/user/senha e liberar firewall

### Erro: "Migration already exists"
**Causa**: Migration parcialmente aplicada  
**Solução**: 
```sql
-- Ver migrations:
SELECT * FROM migrations ORDER BY timestamp DESC;

-- Se necessário, reverter última:
DELETE FROM migrations WHERE timestamp = <timestamp-com-problema>;
```

---

## ✅ Checklist Final

### Antes do Deploy:
- [ ] Banco DEV com todas migrations aplicadas
- [ ] Banco PROD acessível
- [ ] Backup do PROD realizado
- [ ] Migrations sincronizadas (DEV = PROD)
- [ ] Estrutura de tabelas validada

### Após Deploy:
- [ ] API responde (Health Check)
- [ ] Login funciona
- [ ] Rotas de atendimento funcionam
- [ ] WebSocket conecta
- [ ] Frontend carrega sem erros

---

## 📞 Em Caso de Problemas

1. **NÃO faça deploy se PROD não estiver sincronizado!**
2. **SEMPRE faça backup antes de rodar migrations em PROD**
3. **Teste em staging antes de produção (se possível)**
4. **Tenha plano de rollback pronto**

---

**Data de Criação**: 19/11/2025  
**Última Atualização**: 19/11/2025  
**Status**: ⚠️ VERIFICAÇÃO PENDENTE

**Próximo passo**: Executar ETAPA 1 (verificar DEV)
