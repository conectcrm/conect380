# 🚀 Estratégia de Deploy para Produção

**Data de Criação**: 05 de Novembro de 2025  
**Situação Atual**: Sistema desenvolvido e testado em ambiente DEV  
**Problema Identificado**: Banco de produção não possui estrutura implementada

---

## ⚠️ SITUAÇÃO ATUAL

### Ambiente de Desenvolvimento (DEV)
- ✅ Todas as migrations aplicadas
- ✅ Estrutura completa de atendimento, triagem, bot
- ✅ Tabelas: contatos, tickets, fluxos, equipes, atribuições, etc.
- ✅ Funcionalidades testadas e validadas

### Ambiente de Produção (PROD)
- ❌ **Banco vazio ou com estrutura desatualizada**
- ❌ Migrations não aplicadas
- ❌ Dados de configuração ausentes
- ❌ Sem fluxos padrão, núcleos, departamentos

---

## 📋 ESTRATÉGIA DE DEPLOY - PASSO A PASSO

### 🎯 Fase 1: Preparação e Validação (ANTES DO DEPLOY)

#### 1.1. Documentar Migrations Críticas

**Migrations Essenciais para Produção:**

```bash
# Estrutura Base de Atendimento (Outubro 2025)
1728518400000-CreateAtendimentoTables.ts

# Contatos e Tickets
1744690800000-CreateContatosTable.ts
1744828200000-AddContatoFotoToAtendimentoTickets.ts

# Triagem Bot e Núcleos
1745017600000-CreateTriagemBotNucleosTables.ts

# Equipes e Atribuições
1745022000000-CreateEquipesAtribuicoesTable.ts

# Notas e Demandas
1761180000000-CreateNotasClienteClean.ts
1761180100000-CreateDemandasClean.ts

# Histórico de Versões de Fluxos
1761582305362-AddHistoricoVersoes.ts
1761582400000-AddHistoricoVersoesFluxo.ts

# Configurações de Usuários
1762190000000-AddStatusAtendenteToUsers.ts
1762216500000-AddDeveTrocarSenhaFlagToUsers.ts
1762220000000-CreatePasswordResetTokens.ts

# Configurações de Empresa (FASE 1)
1762211047321-CreateEmpresaConfiguracoes.ts
1762212773553-AddPhase1ConfigFields.ts

# Melhorias e Correções
1762214400000-UpdateOportunidadeClienteIdToUuid.ts
1762305000000-RemoveChatwootFromAtendimento.ts
```

#### 1.2. Criar Script de Verificação

```bash
# Criar: backend/scripts/check-production-migrations.js
```

```javascript
// Verificar quais migrations estão pendentes em produção
const { execSync } = require('child_process');

console.log('🔍 Verificando migrations pendentes em produção...\n');

try {
  const result = execSync('npm run migration:show', { encoding: 'utf-8' });
  console.log(result);
  
  // Contar migrations pendentes
  const pending = (result.match(/pending/gi) || []).length;
  const executed = (result.match(/executed/gi) || []).length;
  
  console.log(`\n📊 Resumo:`);
  console.log(`   ✅ Executadas: ${executed}`);
  console.log(`   ⏳ Pendentes: ${pending}`);
  
  if (pending > 0) {
    console.log(`\n⚠️  ATENÇÃO: ${pending} migrations precisam ser executadas!`);
    process.exit(1);
  }
  
  console.log('\n✅ Todas as migrations estão aplicadas!');
} catch (error) {
  console.error('❌ Erro ao verificar migrations:', error.message);
  process.exit(1);
}
```

#### 1.3. Criar Backup do Banco DEV

```bash
# Backup completo do banco de desenvolvimento
cd scripts
./backup-database.ps1 -Environment dev -BackupType full
```

#### 1.4. Gerar SQL de Dados Essenciais (Seed Data)

```sql
-- seed-production-data.sql
-- Dados essenciais que precisam existir em produção

-- 1. Fluxo Padrão de Triagem
INSERT INTO fluxo_triagem (id, nome, descricao, estrutura, ativo, visivel_bot)
VALUES (
  'uuid-fluxo-padrao',
  'Atendimento Padrão',
  'Fluxo padrão de atendimento inicial',
  '{"etapas": [...]}',
  true,
  true
);

-- 2. Núcleo Padrão
INSERT INTO nucleos (id, nome, descricao, ativo)
VALUES (
  'uuid-nucleo-padrao',
  'Atendimento Geral',
  'Núcleo padrão para atendimentos',
  true
);

-- 3. Departamento Padrão
INSERT INTO departamentos (id, nome, nucleoId, tipo_distribuicao)
VALUES (
  'uuid-departamento-padrao',
  'Suporte',
  'uuid-nucleo-padrao',
  'ROUND_ROBIN'
);

-- Adicionar mais dados essenciais...
```

---

### 🎯 Fase 2: Configuração do Ambiente de Produção

#### 2.1. Configurar Variáveis de Ambiente (.env.production)

```bash
# Copiar e configurar
cp backend/.env.production.example backend/.env.production

# Configurar valores reais:
DATABASE_HOST=<RDS_ENDPOINT>
DATABASE_PASSWORD=<SENHA_SEGURA>
JWT_SECRET=<GERAR_NOVO>
```

#### 2.2. Configurar AWS Secrets Manager

```bash
# Armazenar secrets no AWS Secrets Manager
aws secretsmanager create-secret \
  --name conectcrm/production/database \
  --secret-string '{"password":"SENHA_REAL"}'

aws secretsmanager create-secret \
  --name conectcrm/production/jwt \
  --secret-string '{"secret":"JWT_SECRET_REAL"}'
```

#### 2.3. Verificar Conexão com Banco de Produção

```bash
# Testar conexão antes de aplicar migrations
cd backend
npm run test:db-connection
```

---

### 🎯 Fase 3: Aplicação de Migrations em Produção

#### 3.1. Criar Snapshot do Banco de Produção (ANTES)

```bash
# AWS RDS - Criar snapshot manual
aws rds create-db-snapshot \
  --db-instance-identifier conectcrm-production \
  --db-snapshot-identifier pre-migration-backup-$(date +%Y%m%d-%H%M%S)
```

#### 3.2. Executar Migrations em Ordem

```bash
# MODO 1: Executar todas as migrations pendentes de uma vez
cd backend
npm run migration:run

# MODO 2: Executar uma por uma (mais seguro)
npm run typeorm migration:run -- -t 1
# Verificar se funcionou
npm run migration:show
# Repetir até aplicar todas
```

#### 3.3. Validar Estrutura do Banco

```bash
# Verificar se todas as tabelas foram criadas
npm run db:check-schema

# Verificar integridade
npm run db:check-integrity
```

---

### 🎯 Fase 4: Seed Data e Configurações Iniciais

#### 4.1. Aplicar Dados Essenciais

```bash
# Executar seed de produção
npm run seed:production

# Ou manualmente:
psql -h <RDS_ENDPOINT> -U <USER> -d conectcrm_production < seed-production-data.sql
```

#### 4.2. Criar Usuário Admin Inicial

```bash
# Script para criar primeiro usuário
npm run create-admin-user
# Seguir prompts para email, senha, etc.
```

#### 4.3. Configurar Empresa Padrão

```bash
# Criar configurações da primeira empresa
npm run seed:empresa-config
```

---

### 🎯 Fase 5: Deploy da Aplicação

#### 5.1. Build do Frontend

```bash
cd frontend-web
npm run build

# Resultado: pasta build/ pronta para deploy
```

#### 5.2. Build do Backend

```bash
cd backend
npm run build

# Resultado: pasta dist/ pronta para deploy
```

#### 5.3. Deploy para AWS

```bash
# Opção A: Deploy manual via SSH
scp -r dist/ ubuntu@<EC2_IP>:/var/www/conectcrm/backend/
scp -r build/ ubuntu@<EC2_IP>:/var/www/conectcrm/frontend/

# Opção B: Deploy via CI/CD (GitHub Actions)
git push origin main
# Actions irá fazer deploy automaticamente

# Opção C: Deploy via AWS CodeDeploy
aws deploy create-deployment \
  --application-name ConectCRM \
  --deployment-group-name production
```

#### 5.4. Reiniciar Serviços

```bash
# Via SSH no servidor
ssh ubuntu@<EC2_IP>
sudo systemctl restart conectcrm-backend
sudo systemctl restart nginx
```

---

### 🎯 Fase 6: Validação Pós-Deploy

#### 6.1. Smoke Tests

```bash
# Verificar se backend está respondendo
curl https://api.conectcrm.com.br/health

# Verificar se frontend carrega
curl https://app.conectcrm.com.br

# Testar login
curl -X POST https://api.conectcrm.com.br/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@conectsuite.com.br","password":"senha"}'
```

#### 6.2. Verificar Logs

```bash
# Backend logs
tail -f /var/log/conectcrm/backend.log

# Nginx logs
tail -f /var/log/nginx/error.log
```

#### 6.3. Testar Funcionalidades Críticas

- [ ] Login funciona
- [ ] Dashboard carrega
- [ ] Criar contato funciona
- [ ] Enviar mensagem WhatsApp funciona
- [ ] Bot de triagem responde
- [ ] Atendente recebe tickets

---

## 🛡️ PLANO DE ROLLBACK

### Se algo der errado:

#### 1. Reverter Migrations

```bash
# Reverter última migration
npm run migration:revert

# Reverter múltiplas (se necessário)
npm run migration:revert
npm run migration:revert
# etc...
```

#### 2. Restaurar Snapshot do Banco

```bash
# AWS RDS - Restaurar snapshot
aws rds restore-db-instance-from-db-snapshot \
  --db-instance-identifier conectcrm-production-restored \
  --db-snapshot-identifier pre-migration-backup-YYYYMMDD-HHMMSS
```

#### 3. Reverter Deploy da Aplicação

```bash
# Deploy da versão anterior
git checkout <COMMIT_ANTERIOR>
npm run deploy:production
```

---

## 📊 CHECKLIST PRÉ-DEPLOY

### Antes de Executar em Produção:

- [ ] ✅ Todas as migrations testadas em DEV
- [ ] ✅ Backup do banco de produção criado
- [ ] ✅ Variáveis de ambiente configuradas
- [ ] ✅ Secrets no AWS Secrets Manager
- [ ] ✅ Conexão com banco de produção validada
- [ ] ✅ Frontend buildado sem erros
- [ ] ✅ Backend buildado sem erros
- [ ] ✅ Script de rollback preparado
- [ ] ✅ Equipe de suporte alertada
- [ ] ✅ Horário de deploy agendado (baixo tráfego)
- [ ] ✅ Monitoramento ativo (CloudWatch, Datadog, etc.)

### Pós-Deploy:

- [ ] ✅ Smoke tests passaram
- [ ] ✅ Logs sem erros críticos
- [ ] ✅ Funcionalidades críticas validadas
- [ ] ✅ Performance aceitável
- [ ] ✅ Usuários conseguem acessar
- [ ] ✅ Monitoramento sem alertas

---

## 🔐 SEGURANÇA

### Boas Práticas:

1. **NUNCA** commite arquivos `.env` com valores reais
2. **SEMPRE** use AWS Secrets Manager para credenciais em produção
3. **SEMPRE** crie backup antes de migrations
4. **SEMPRE** teste migrations em staging primeiro
5. **SEMPRE** monitore logs após deploy
6. **NUNCA** execute migrations diretamente em produção sem testar

---

## 📞 CONTATOS DE EMERGÊNCIA

- **DevOps Lead**: [contato]
- **DBA**: [contato]
- **AWS Support**: [ticket/phone]
- **Equipe de Desenvolvimento**: [slack/teams]

---

## 📝 HISTÓRICO DE DEPLOYS

| Data | Versão | Migrations | Status | Observações |
|------|--------|------------|--------|-------------|
| - | - | - | - | Primeiro deploy pendente |

---

**IMPORTANTE**: Este documento deve ser atualizado a cada deploy!

