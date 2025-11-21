# 🚨 PROBLEMA CRÍTICO COM MIGRATIONS

**Data**: 19 de novembro de 2025  
**Status**: ⚠️ **BLOQUEADO - Migrations Destrutivas**

---

## ❌ Erro Detectado

### Migration Problemática:
```
AddPendenteStatusToCotacao1763405981614
```

### Erro:
```
column "empresa_id" of relation "faturas" contains null values
```

### Causa Raiz:
A migration tenta **dropar e recriar** a coluna `empresa_id` da tabela `faturas`:

```typescript
// Linha 103-105 da migration
await queryRunner.query(`ALTER TABLE "faturas" DROP COLUMN "empresa_id"`);
await queryRunner.query(`ALTER TABLE "faturas" ADD "empresa_id" uuid NOT NULL`);
```

**Problema**: Há registros existentes na tabela `faturas` que serão perdidos!

---

## ✅ Solução Implementada

### 1. Migration Revertida
```powershell
npm run migration:revert
# ✅ AddContatoEmailToTicket1763561367642 revertida com sucesso
```

### 2. Script SQL Criado
```
backend/scripts/fix-faturas-empresa-id.sql
```

Este script:
- Verifica faturas sem `empresa_id`
- Associa faturas à empresa do contrato relacionado
- Associa faturas órfãs à primeira empresa disponível
- Valida que todas faturas têm `empresa_id` ao final

---

## 🎯 Plano de Ação Corrigido

### **Opção 1: Corrigir Dados e Re-executar** (Recomendado)

#### Passo 1: Conectar no Banco DEV
```powershell
# Ajustar credenciais conforme seu .env
$env:PGPASSWORD='sua-senha'
psql -h localhost -p 5434 -U postgres -d conectcrm
```

#### Passo 2: Executar Script de Correção
```sql
\i backend/scripts/fix-faturas-empresa-id.sql
```

#### Passo 3: Verificar Resultado
```sql
SELECT COUNT(*) FROM faturas WHERE empresa_id IS NULL;
-- Resultado esperado: 0
```

#### Passo 4: Executar Migrations
```powershell
cd backend
npm run migration:run
```

**Validação**: Todas as 2 migrations devem executar com sucesso.

---

### **Opção 2: Desabilitar Migrations Problemáticas** (Deploy Emergencial)

Se você precisa fazer deploy URGENTE sem essas features:

#### Passo 1: Renomear Migrations
```powershell
cd backend/src/migrations

# Desabilitar temporariamente
Rename-Item "1763405981614-AddPendenteStatusToCotacao.ts" "_DISABLED_1763405981614-AddPendenteStatusToCotacao.ts"
Rename-Item "1763406000000-AddPendenteToStatusEnum.ts" "_DISABLED_1763406000000-AddPendenteToStatusEnum.ts"
```

#### Passo 2: Recompilar Backend
```powershell
npm run build
```

#### Passo 3: Verificar Migrations Ativas
```powershell
npx typeorm migration:show -d ormconfig.js
# Não deve mostrar as migrations desabilitadas
```

#### Passo 4: Fazer Deploy Sem Essas Features
- Deploy funcionará normalmente
- Status "PENDENTE" em cotações NÃO estará disponível
- Gestão de Equipes NÃO estará disponível

**⚠️ Importante**: Re-habilitar essas migrations depois de corrigir os dados!

---

## 📊 Análise das Migrations Problemáticas

### AddPendenteStatusToCotacao1763405981614

**O que faz**:
1. ✅ Cria tabelas de Equipes (novas, sem problema)
2. ✅ Adiciona status "pendente" ao enum de cotações (sem problema)
3. ❌ **DESTRÓI e RECRIA** coluna `empresa_id` em `faturas` (PROBLEMA!)

**Impacto de Desabilitar**:
- ❌ Sem Gestão de Equipes
- ❌ Sem status "PENDENTE" em cotações
- ❌ Sem atribuição de atendentes a equipes

### AddPendenteToStatusEnum1763406000000

**O que faz**:
- Provavelmente complementa a migration anterior
- Detalhes precisam ser verificados

---

## 🔍 Análise de Dados Atual

### Verificar Faturas Órfãs

```sql
-- Quantas faturas sem empresa_id?
SELECT COUNT(*) FROM faturas WHERE empresa_id IS NULL;

-- Detalhes das faturas órfãs
SELECT 
    id, 
    numero_fatura, 
    valor, 
    contrato_id,
    created_at 
FROM faturas 
WHERE empresa_id IS NULL 
LIMIT 10;

-- Contratos das faturas órfãs
SELECT 
    f.numero_fatura,
    c.id as contrato_id,
    c.empresa_id as empresa_contrato
FROM faturas f
LEFT JOIN contratos c ON c.id = f.contrato_id
WHERE f.empresa_id IS NULL;
```

### Se Não Houver Dados:
```sql
-- Se a tabela está vazia ou com apenas dados de teste:
TRUNCATE TABLE faturas CASCADE;
TRUNCATE TABLE contratos CASCADE;
TRUNCATE TABLE pagamentos CASCADE;

-- Então pode executar migration sem problemas:
-- npm run migration:run
```

---

## 🎯 Recomendação Final

### Para Deploy em Produção (AWS):

**Cenário 1**: Banco de Produção VAZIO ou DADOS DE TESTE
```powershell
# Solução simples: Limpar banco e rodar migrations
psql -h PROD_HOST -U postgres -d conectcrm_prod -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
cd backend
npm run migration:run
# ✅ Todas as 52 migrations executam limpo
```

**Cenário 2**: Banco de Produção com DADOS REAIS
```powershell
# 1. Backup COMPLETO do banco
pg_dump -h PROD_HOST -U postgres -d conectcrm_prod -F c -f backup-antes-migration.dump

# 2. Executar script de correção SQL
psql -h PROD_HOST -U postgres -d conectcrm_prod -f fix-faturas-empresa-id.sql

# 3. Executar migrations
npm run migration:run

# 4. Se falhar, restaurar backup:
# pg_restore -h PROD_HOST -U postgres -d conectcrm_prod backup-antes-migration.dump
```

---

## 📝 Próximos Passos

### Agora (Desenvolvimento):
1. ✅ Decidir: Corrigir dados OU Desabilitar migrations?
2. ⏳ Executar solução escolhida
3. ⏳ Validar migrations executadas
4. ⏳ Atualizar PLANO_DEPLOY_LIMPO_AWS.md

### Depois (Produção):
1. ⏳ Analisar banco de produção (tem dados reais?)
2. ⏳ Fazer backup COMPLETO
3. ⏳ Aplicar mesma solução em produção
4. ⏳ Executar deploy limpo

---

## 🔧 Comandos Úteis

### Verificar Estado Atual
```powershell
# Migrations executadas
npx typeorm migration:show -d ormconfig.js

# Listar tabelas do banco
psql -h localhost -p 5434 -U postgres -d conectcrm -c "\dt"

# Ver estrutura de uma tabela
psql -h localhost -p 5434 -U postgres -d conectcrm -c "\d faturas"
```

### Limpar Banco DEV (CUIDADO!)
```powershell
# APENAS EM DESENVOLVIMENTO!
# Apaga TUDO e recria do zero
psql -h localhost -p 5434 -U postgres -d conectcrm -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"

# Executar TODAS as migrations
npm run migration:run
```

---

**Status**: ⏸️ **AGUARDANDO DECISÃO DO USUÁRIO**

Escolha:
- **Opção 1**: Corrigir dados e executar migrations (deploy completo com todas features)
- **Opção 2**: Desabilitar migrations problemáticas (deploy rápido sem Equipes/Status Pendente)
- **Opção 3**: Limpar banco DEV e recriar do zero (se não houver dados importantes)
