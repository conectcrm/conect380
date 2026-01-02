# 🚀 Scripts de Validação ConectCRM

## 📋 Visão Geral

Scripts de validação automática para garantir qualidade e consistência do código.

---

## 🔍 validate-multi-tenant.js

### Propósito
Valida se todas as entities e migrations seguem o padrão multi-tenant obrigatório.

### O Que Valida

#### 1. Entities (*.entity.ts)
- ✅ Tem campo `empresaId` ou `empresa_id`
- ✅ Tem relação `@ManyToOne(() => Empresa)`
- ⚪ Skip para entities globais (empresas, planos)

#### 2. Migrations (*.ts)
- ✅ Tabelas com `empresa_id` habilitam RLS
- ✅ Tem `CREATE POLICY tenant_isolation_*`
- ✅ Tem `CREATE INDEX` em `empresa_id`

#### 3. Database (PostgreSQL)
- ✅ Verifica se RLS está ativo em todas as tabelas
- ✅ Detecta tabelas vulneráveis (sem RLS)

### Como Usar

#### Manualmente
```bash
cd c:\Projetos\conectcrm
node scripts/validate-multi-tenant.js
```

#### No CI/CD
```yaml
# .github/workflows/validate.yml
- name: Validar Multi-Tenant
  run: node scripts/validate-multi-tenant.js
```

#### No Git Hook (pre-commit)
```bash
# .husky/pre-commit
node scripts/validate-multi-tenant.js || exit 1
```

### Exit Codes
- **0**: ✅ Validação passou (permite commit/merge)
- **1**: ❌ Validação falhou (bloqueia commit/merge)

### Saída de Exemplo

```
🔍 VALIDAÇÃO MULTI-TENANT

═══════════════════════════════════════════════

1️⃣  VALIDANDO ENTITIES...

   ✅ src/modules/atendimento/entities/ticket.entity.ts
   ✅ src/modules/crm/entities/cliente.entity.ts
   ❌ src/modules/produtos/entities/produto.entity.ts
      → FALTA empresaId ou empresa_id!
   ⚪ src/modules/empresas/entities/empresa.entity.ts (global, skip)

   Resumo: 2/3 OK
   ⚠️  1 entities com problemas!

2️⃣  VALIDANDO MIGRATIONS...

   ✅ src/migrations/1234567890-CreateTickets.ts (atendimento_tickets)
   ❌ src/migrations/1234567891-CreateProdutos.ts (produtos)
      → FALTA ENABLE ROW LEVEL SECURITY
      → FALTA CREATE POLICY tenant_isolation_*
      → FALTA CREATE INDEX em empresa_id

   Resumo: 1/2 OK
   ⚠️  1 migrations com problemas!

3️⃣  VALIDANDO DATABASE (RLS ATIVO)...

   ✅ Todas as tabelas do database têm RLS ativo!

═══════════════════════════════════════════════

📊 RELATÓRIO FINAL

   Erros críticos: 4
   Avisos: 0

❌ VALIDAÇÃO FALHOU!

   Corrija os erros acima antes de fazer commit.

   Consulte:
   - backend/templates/_TemplateEntity.ts
   - backend/templates/_TemplateMigration.ts
   - docs/ARQUITETURA.md
```

---

## 🔧 Configuração de Ambiente

### Requisitos
- Node.js 22.16+
- PostgreSQL rodando (opcional, para validação de database)

### Variáveis de Ambiente
Script usa credenciais padrão:
```env
POSTGRES_HOST=localhost
POSTGRES_PORT=5434
POSTGRES_USER=conectcrm
POSTGRES_PASSWORD=conectcrm123
POSTGRES_DB=conectcrm_db
```

Se suas credenciais forem diferentes, ajuste o script ou configure variáveis de ambiente.

---

## 🎯 Casos de Uso

### 1. Desenvolvedor Local
Antes de fazer commit:
```bash
npm run validate:multi-tenant
# ou
node scripts/validate-multi-tenant.js
```

### 2. Code Review
Reviewer pode rodar script para verificar se PR segue padrões:
```bash
git checkout branch-do-pr
node scripts/validate-multi-tenant.js
```

### 3. CI/CD (GitHub Actions)
```yaml
name: Validação

on: [pull_request]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm install
      - run: node scripts/validate-multi-tenant.js
```

### 4. Git Hook (Automático)
Instalar Husky:
```bash
npm install husky --save-dev
npx husky install
npx husky add .husky/pre-commit "node scripts/validate-multi-tenant.js"
```

Agora o script roda automaticamente antes de cada commit!

---

## 📋 Checklist de Correção

Se o script detectar erros, use este checklist:

### Entity Sem empresaId
1. [ ] Abrir entity (ex: `produto.entity.ts`)
2. [ ] Adicionar:
   ```typescript
   @Column({ type: 'uuid', name: 'empresa_id' })
   empresaId: string;
   
   @ManyToOne(() => Empresa)
   @JoinColumn({ name: 'empresa_id' })
   empresa: Empresa;
   ```
3. [ ] Criar migration: `npm run migration:generate -- src/migrations/AddEmpresaIdToProdutos`
4. [ ] Rodar migration: `npm run migration:run`

### Migration Sem RLS
1. [ ] Abrir migration
2. [ ] Adicionar após `CREATE TABLE`:
   ```typescript
   await queryRunner.query(`
     ALTER TABLE produtos ENABLE ROW LEVEL SECURITY;
   `);
   
   await queryRunner.query(`
     CREATE POLICY tenant_isolation_produtos ON produtos
       FOR ALL USING (empresa_id = get_current_tenant());
   `);
   
   await queryRunner.query(`
     CREATE INDEX idx_produtos_empresa_id ON produtos(empresa_id);
   `);
   ```
3. [ ] Rodar migration: `npm run migration:run`

### Database com Tabelas Vulneráveis
1. [ ] Conectar no PostgreSQL: `psql -h localhost -p 5434 -U conectcrm -d conectcrm_db`
2. [ ] Verificar tabelas: `SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';`
3. [ ] Para cada tabela sem RLS, rodar:
   ```sql
   ALTER TABLE nome_tabela ENABLE ROW LEVEL SECURITY;
   CREATE POLICY tenant_isolation_nome_tabela ON nome_tabela
     FOR ALL USING (empresa_id = get_current_tenant());
   CREATE INDEX idx_nome_tabela_empresa_id ON nome_tabela(empresa_id);
   ```

---

## 🚨 Troubleshooting

### Erro: "psql: command not found"
Script não consegue conectar no PostgreSQL. Isso é OK se você:
- Não tem PostgreSQL instalado localmente
- Está em ambiente que não precisa validar database

Script vai mostrar aviso mas não vai falhar.

### Erro: "cannot connect to database"
PostgreSQL não está rodando ou credenciais estão erradas.
- Verificar se PostgreSQL está rodando: `docker ps` (se usar Docker)
- Verificar credenciais no `.env`

### Falso Positivo: Entity Global Sendo Validada
Se script validar entity que não deveria (ex: `empresas`, `planos`):
1. Abrir `scripts/validate-multi-tenant.js`
2. Adicionar na lista `GLOBAL_ENTITIES`:
   ```javascript
   const GLOBAL_ENTITIES = [
     'empresas',
     'planos',
     'modulos_sistema',
     'sua_nova_entity_global', // Adicionar aqui
   ];
   ```

---

## 📚 Referências

- **Templates**: `backend/templates/`
- **Arquitetura**: `docs/ARQUITETURA.md`
- **Multi-Tenant**: `SISTEMA_100_MULTI_TENANT_FINAL.md`
- **Governança**: `GOVERNANCA_DESENVOLVIMENTO_IA.md`

---

## 🔄 Próximos Scripts (Roadmap)

- [ ] `validate-frontend.js` - Validar páginas têm BackToNucleus, estados, etc.
- [ ] `validate-design.js` - Validar uso de cores da paleta Crevasse
- [ ] `validate-tests.js` - Validar cobertura de testes mínima
- [ ] `validate-dependencies.js` - Detectar dependências obsoletas/vulneráveis

---

**Elaborado por**: Equipe ConectCRM  
**Revisão**: GitHub Copilot Agent
