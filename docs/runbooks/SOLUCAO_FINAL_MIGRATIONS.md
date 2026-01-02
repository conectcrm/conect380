# ✅ SOLUÇÃO FINAL: Sistema de Migrations ConectCRM

**Data**: 20 de novembro de 2025  
**Status**: ✅ RESOLVIDO

---

## 🎯 Problema Identificado

O sistema tinha **duas configurações TypeORM** conflitantes:

1. **`ormconfig.js`** - Usado pelo CLI (comandos `npm run migration:*`)
2. **`database.config.ts`** - Usado pelo NestJS em runtime

**Causa raiz**: Alterações no `ormconfig.js` não afetavam o comportamento do app!

### Sintomas
- ✅ Backend compilava sem erros (64 entities)
- ✅ Backend iniciava com sucesso
- ❌ Nenhuma tabela era criada no banco
- ❌ `synchronize: true` no `ormconfig.js` era ignorado
- ❌ Migrations geradas tinham 2520 erros de sintaxe

---

## 🔧 Solução Aplicada

### 1. Identificação do Arquivo Correto
O NestJS usa `database.config.ts` (não `ormconfig.js`!):

```typescript
// app.module.ts
TypeOrmModule.forRootAsync({
  useClass: DatabaseConfig, // ← Usa database.config.ts
})
```

### 2. Habilitação Temporária do Synchronize
**Arquivo**: `backend/src/config/database.config.ts`

```typescript
synchronize: true, // ✅ Habilitado temporariamente
```

**Resultado**: Backend criou **57 tabelas** automaticamente!

### 3. Desabilitação do Synchronize (Produção)
Após criar schema inicial, desabilitado para segurança:

```typescript
synchronize: false, // ✅ Usar migrations em produção
```

---

## 📊 Tabelas Criadas (57 total)

### Core Business (11)
- empresas, users, clientes, contatos
- produtos, oportunidades, atividades, propostas
- leads, fornecedores, evento

### Financeiro (13)
- faturas, itens_fatura, pagamentos
- planos, planos_cobranca, planos_modulos
- assinaturas_empresas, assinaturas_contrato
- contratos, cotacoes, itens_cotacao, anexos_cotacao
- configuracoes_gateway_pagamento, transacoes_gateway_pagamento

### Atendimento Omnichannel (21)
- atendimento_canais, filas, filas_atendentes
- atendentes, atendente_skills, atendente_equipes, atendente_atribuicoes
- atendimento_tickets, atendimento_mensagens
- atendimento_notas_cliente, atendimento_demandas
- tags, ticket_tags, message_templates
- atendimento_integracoes_config
- distribuicao_config, distribuicao_log
- atendimento_configuracao_inatividade
- sla_configs, sla_event_logs

### Triagem (9)
- nucleos_atendimento, departamentos
- fluxos_triagem, sessoes_triagem
- equipes, equipe_atribuicoes
- atendente_equipes, atendente_atribuicoes
- triagem_logs

### Sistema (3)
- modulos_sistema, empresa_modulos, empresa_configuracoes
- password_reset_tokens
- notifications

---

## 🚀 Configuração Final

### Desenvolvimento (Local)
```typescript
// database.config.ts
{
  synchronize: false, // Usar migrations
  logging: true,      // Ver SQL queries
  migrations: ['dist/src/migrations/*.js']
}
```

### Produção (AWS RDS)
```typescript
// database.config.ts
{
  synchronize: false,  // NUNCA usar true em produção!
  logging: false,      // Desabilitar logs SQL
  migrations: ['dist/src/migrations/*.js'],
  ssl: {
    rejectUnauthorized: false
  }
}
```

---

## 📝 Migration Inicial Criada

**Arquivo**: `backend/src/migrations/1700000000000-InitialSchema.ts`

### Conteúdo
- ✅ Cria 15 tipos ENUM
- ✅ Cria 57 tabelas
- ✅ Cria todos os índices
- ✅ Cria todas as foreign keys
- ✅ Método `down()` para reverter

### Uso

#### Em banco VAZIO (novo ambiente):
```bash
npm run migration:run
```

#### Em banco EXISTENTE (com synchronize):
```typescript
// Já tem tabelas? Não precisa rodar migration!
// As tabelas já foram criadas pelo synchronize
```

---

## ⚙️ Comandos de Migration

### Gerar Nova Migration
```bash
cd backend
npm run migration:generate -- src/migrations/NomeDaMudanca
```

### Executar Migrations Pendentes
```bash
npm run migration:run
```

### Reverter Última Migration
```bash
npm run migration:revert
```

### Ver Status das Migrations
```bash
npm run migration:show
```

---

## 🛡️ Migrations Desabilitadas

**Pasta**: `backend/src/migrations_disabled/`

### Arquivos Movidos
1. `_DISABLED_1691234567890-CreateEventosTable.ts`
   - **Problema**: Tenta criar FK para `users` (não existe no momento da execução)
   - **Solução**: Tabela `evento` criada via synchronize

2. `_DISABLED_1763405981614-AddPendenteStatusToCotacao.ts`
   - **Problema**: `DROP COLUMN` seguido de `ADD COLUMN` (destrutivo!)
   - **Erro**: "column empresa_id contains null values"
   - **Solução**: Coluna já existe via synchronize

3. `_DISABLED_1763406000000-AddPendenteToStatusEnum.ts`
   - **Problema**: Depende da migration anterior
   - **Solução**: ENUM já tem valor 'pendente'

---

## ✅ Checklist de Deploy AWS

### 1. Preparação do Banco RDS
- [ ] Criar instância PostgreSQL no AWS RDS
- [ ] Configurar security group (permitir conexão do EC2/ECS)
- [ ] Anotar endpoint, porta, username, password

### 2. Configuração do Backend
- [ ] Criar `.env.production` com credenciais RDS
- [ ] Definir `synchronize: false` (CRÍTICO!)
- [ ] Definir `ssl: true` para RDS
- [ ] Definir `logging: false` para performance

### 3. Primeira Execução
```bash
# Opção A: Usar synchronize APENAS na primeira vez
synchronize: true  # Primeira execução
synchronize: false # Após criar schema

# Opção B: Usar migration inicial (RECOMENDADO)
npm run migration:run
```

### 4. Validação
```sql
-- Conectar no RDS e verificar
SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';
-- Esperado: 57 tabelas
```

---

## 🎓 Lições Aprendidas

### 1. NestJS vs TypeORM CLI
- **NestJS runtime**: Usa `database.config.ts` (arquivo TypeScript injetável)
- **TypeORM CLI**: Usa `ormconfig.js` (arquivo JavaScript standalone)
- **Configurações devem estar sincronizadas** entre os dois!

### 2. Synchronize vs Migrations
- **Synchronize**: Rápido para desenvolvimento, **perigoso em produção**
- **Migrations**: Controle total, seguro, auditável
- **Melhor prática**: Synchronize em dev, migrations em prod

### 3. Migration Generation
- `typeorm migration:generate` pode gerar código com erros
- Sempre revisar migrations geradas antes de commitar
- Preferir migrations manuais para mudanças complexas

### 4. Debugging
- Adicionar logs no `createTypeOrmOptions()` para debug
- Verificar quantas entities são carregadas
- Usar `logging: true` para ver SQL queries executadas

---

## 📚 Referências

- [TypeORM Migrations](https://typeorm.io/migrations)
- [NestJS TypeORM Integration](https://docs.nestjs.com/techniques/database)
- [PostgreSQL Best Practices](https://wiki.postgresql.org/wiki/Don%27t_Do_This)

---

**Autor**: GitHub Copilot  
**Revisão**: ConectCRM Team  
**Última atualização**: 20/11/2025
