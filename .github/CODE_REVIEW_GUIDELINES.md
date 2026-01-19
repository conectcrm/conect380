# 🔍 Code Review Guidelines - ConectCRM

## 🎯 Objetivo

Garantir qualidade, segurança e consistência no código, com foco especial na **arquitetura multi-tenant** (crítica para o negócio).

---

## ✅ Checklist do Revisor

### 1. 🔐 Arquitetura Multi-Tenant (CRÍTICO!)

**⚠️ SE PR modifica backend (entities, services, controllers, migrations):**

#### Entity Review:
- [ ] Entity tem campo `empresaId: string` (type: 'uuid')?
- [ ] Entity tem relação `@ManyToOne(() => Empresa)` com `@JoinColumn`?
- [ ] Entity NÃO tem queries que ignoram empresa_id?

**Código Esperado**:
```typescript
@Entity('minha_tabela')
export class MinhaEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'empresa_id' })  // ✅ OBRIGATÓRIO
  empresaId: string;

  @ManyToOne(() => Empresa)  // ✅ OBRIGATÓRIO
  @JoinColumn({ name: 'empresa_id' })
  empresa: Empresa;
  
  // ... demais campos
}
```

#### Migration Review:
- [ ] Migration cria coluna `empresa_id UUID NOT NULL`?
- [ ] Migration habilita `ALTER TABLE ... ENABLE ROW LEVEL SECURITY`?
- [ ] Migration cria política `CREATE POLICY tenant_isolation_*`?
- [ ] Migration cria índice `CREATE INDEX idx_*_empresa_id`?
- [ ] Down migration remove política com `CASCADE`?

**Template Esperado**:
```typescript
export class CreateMinhaTabela implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Criar tabela com empresa_id
    await queryRunner.query(`
      CREATE TABLE minha_tabela (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        empresa_id UUID NOT NULL REFERENCES empresas(id),
        nome VARCHAR(100) NOT NULL
      );
    `);

    // 2. ✅ OBRIGATÓRIO: Habilitar RLS
    await queryRunner.query(`
      ALTER TABLE minha_tabela ENABLE ROW LEVEL SECURITY;
    `);

    // 3. ✅ OBRIGATÓRIO: Criar política
    await queryRunner.query(`
      CREATE POLICY tenant_isolation_minha_tabela ON minha_tabela
      FOR ALL USING (empresa_id = get_current_tenant());
    `);

    // 4. Criar índice
    await queryRunner.query(`
      CREATE INDEX idx_minha_tabela_empresa_id ON minha_tabela(empresa_id);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP POLICY IF EXISTS tenant_isolation_minha_tabela ON minha_tabela CASCADE;`);
    await queryRunner.query(`DROP TABLE minha_tabela;`);
  }
}
```

#### Controller Review:
- [ ] Controller usa `@UseGuards(JwtAuthGuard)`?
- [ ] Service NÃO faz queries que pulam RLS?
- [ ] Sem `queryRunner.query()` raw que ignore `get_current_tenant()`?

#### 🧪 Teste Rápido de RLS (Execute localmente):
```sql
-- Conectar como test_tenant (sem BYPASSRLS)
psql -U test_tenant -d conectcrm_db

-- 1. Verificar RLS ativo
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'minha_tabela';
-- ✅ Esperado: rowsecurity = true

-- 2. Verificar política existe
SELECT policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'minha_tabela';
-- ✅ Esperado: tenant_isolation_minha_tabela

-- 3. Testar isolamento
BEGIN;
SELECT set_current_tenant('empresa-a-uuid');
SELECT COUNT(*) FROM minha_tabela;  -- Retorna registros da Empresa A
SELECT set_current_tenant('empresa-b-uuid');
SELECT COUNT(*) FROM minha_tabela;  -- Retorna registros da Empresa B
ROLLBACK;
```

**🚨 BLOQUEADORES (Rejeitar PR imediatamente se)**:
- ❌ Entity multi-tenant sem `empresa_id`
- ❌ Migration sem `ENABLE ROW LEVEL SECURITY`
- ❌ Migration sem política `tenant_isolation_*`
- ❌ Controller sem `JwtAuthGuard`
- ❌ Query raw que ignora `get_current_tenant()`

---

### 2. 💻 Code Quality

#### TypeScript:
- [ ] Tipos explícitos (evitar `any`, usar `unknown` se necessário)
- [ ] Interfaces bem definidas (DTOs, responses)
- [ ] Nenhum erro no `tsc --noEmit`
- [ ] Imports organizados (framework → libs → internal)

**Bom**:
```typescript
interface CreateUserDto {
  nome: string;
  email: string;
}

async function criar(dto: CreateUserDto): Promise<User> {
  // ...
}
```

**Ruim**:
```typescript
async function criar(data: any) {  // ❌ any
  // ...
}
```

#### Nomenclatura:
- [ ] Variáveis descritivas (evitar `x`, `data`, `temp`)
- [ ] Funções verbais (`buscarPorId`, `criarUsuario`)
- [ ] Componentes React em PascalCase (`UserPage`, `ConfirmationModal`)
- [ ] Services em camelCase (`userService`, `equipeService`)

#### Estrutura:
- [ ] Funções pequenas (< 50 linhas idealmente)
- [ ] Single Responsibility Principle
- [ ] Sem código duplicado (DRY)
- [ ] Sem código comentado (deletar!)
- [ ] Sem console.log (usar logger em prod)

---

### 3. ⚡ Performance

#### Backend:
- [ ] Queries otimizadas (usar `relations: [...]` para evitar N+1)
- [ ] Paginação em listagens (`skip`, `take`)
- [ ] Índices criados em colunas filtradas/ordenadas
- [ ] Eager loading apropriado (não lazy em loops)

**N+1 Problem (Ruim)**:
```typescript
const equipes = await this.equipeRepo.find();
for (const equipe of equipes) {
  equipe.membros = await this.membroRepo.find({ equipeId: equipe.id });  // ❌
}
```

**Solução**:
```typescript
const equipes = await this.equipeRepo.find({
  relations: ['membros'],  // ✅ 1 query com JOIN
});
```

#### Frontend:
- [ ] `useMemo` para cálculos pesados
- [ ] `useCallback` para funções passadas como props
- [ ] Debounce em buscas (300-500ms)
- [ ] Lazy loading de rotas/componentes grandes
- [ ] Virtualização para listas grandes (>1000 itens)

---

### 4. 🔒 Segurança

- [ ] Validação de entrada (backend **E** frontend)
- [ ] DTOs com `class-validator` decorators
- [ ] Sanitização de dados (strip HTML, SQL injection)
- [ ] Autenticação verificada (`@UseGuards`)
- [ ] Autorização verificada (usuário pode acessar recurso?)
- [ ] Sem credenciais no código (usar `.env`)
- [ ] Sem informações sensíveis em logs
- [ ] CORS configurado corretamente

**Exemplo Validação DTO**:
```typescript
export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  nome: string;

  @IsEmail()
  email: string;

  @MinLength(8)
  senha: string;
}
```

---

### 5. 🧪 Testes

- [ ] Testes unitários para lógica de negócio
- [ ] Coverage ≥ 70% (backend), ≥ 60% (frontend)
- [ ] Testes passando localmente
- [ ] Casos de sucesso **E** erro cobertos
- [ ] Edge cases testados (null, undefined, empty)
- [ ] Mocks apropriados (repository, services externos)

**Exemplo Backend**:
```typescript
describe('UserService', () => {
  it('deve criar usuário', async () => {
    // Happy path
  });

  it('deve lançar erro se email duplicado', async () => {
    // Error case ✅
  });

  it('deve lidar com usuário inexistente', async () => {
    // Edge case ✅
  });
});
```

---

### 6. 🎨 Frontend (SE APLICÁVEL)

#### Design System:
- [ ] Tema Crevasse (#159A9C, #002333, #DEEFE7, #B4BEC9, #FFFFFF)?
- [ ] Copiou template correto (_TemplatePage.tsx)?
- [ ] BackToNucleus no header?
- [ ] Botões primários com `bg-[#159A9C]` e `hover:bg-[#0F7B7D]`?

#### Estados:
- [ ] Loading state (`<Loading />` ou spinner)?
- [ ] Error state (`<Error message={error} />`)?
- [ ] Empty state (`<Empty />`)?
- [ ] Success state (dados renderizados)?

#### Responsividade:
- [ ] Grid responsivo (`grid-cols-1 md:grid-cols-2 lg:grid-cols-3`)?
- [ ] Mobile-first approach?
- [ ] Testado em 375px (mobile), 768px (tablet), 1920px (desktop)?

#### Acessibilidade:
- [ ] Labels em inputs (`<label htmlFor="...">`)?
- [ ] Aria-labels em ícones/botões?
- [ ] Navegação por teclado funciona?
- [ ] Contraste adequado (WCAG 2.1)?
- [ ] Foco visível em elementos interativos?

#### Componentes Padrão:
- [ ] Usa `ConfirmationModal` + `useConfirmation` (não `window.confirm`)?
- [ ] Usa `toast` do `react-hot-toast` (não toast manual)?
- [ ] Usa `BackToNucleus` para navegação?

---

### 7. 📚 Documentação

- [ ] README atualizado (se nova feature)
- [ ] Comentários JSDoc em funções públicas
- [ ] CHANGELOG.md atualizado
- [ ] `.env.example` atualizado (se novas vars)
- [ ] Swagger/OpenAPI atualizado (se nova rota)
- [ ] Copilot instructions atualizadas (se novo padrão)

**Exemplo JSDoc**:
```typescript
/**
 * Busca usuário por ID
 * @param id - UUID do usuário
 * @returns Dados do usuário
 * @throws NotFoundException se usuário não existe
 */
async buscarPorId(id: string): Promise<User> {
  // ...
}
```

---

## ⏱️ Tempo de Review

- **Pequeno PR** (< 200 linhas): 15-30 min
- **Médio PR** (200-500 linhas): 30-60 min
- **Grande PR** (> 500 linhas): **Sugerir quebrar em PRs menores** 🚨

---

## 💬 Comunicação

### Feedback Construtivo:
- ✅ **Bom**: "Sugestão: Extrair essa lógica para um helper para reusar"
- ❌ **Ruim**: "Esse código está péssimo"

### Bloqueadores vs Sugestões:
- 🚨 **Bloqueador** (Rejeitar PR):
  - Erro de segurança crítico
  - Falta RLS em entity multi-tenant
  - Testes falhando
  - Credenciais no código
  - console.log em produção

- 💡 **Sugestão** (Aprovar com comentário):
  - Refatoração para melhor legibilidade
  - Melhoria de performance não crítica
  - Sugestão de nomenclatura

---

## 🏆 O Que Aprovar

✅ Código funciona como esperado  
✅ Testes passam (unit + E2E)  
✅ Segue padrões do projeto  
✅ Multi-tenant se aplicável  
✅ Documentação adequada  
✅ CI/CD verde  
✅ Sem bloqueadores críticos  

---

## 🔴 O Que Bloquear (SEMPRE)

❌ Falta RLS em entity que deveria ser multi-tenant  
❌ Testes falhando ou inexistentes  
❌ Vulnerabilidades de segurança  
❌ TypeScript com `any` excessivo (>3 por arquivo)  
❌ console.log não removidos  
❌ Credenciais/secrets no código  
❌ Queries N+1 óbvias  
❌ Código duplicado extenso  

---

## 📊 Métricas de Review

**Objetivo**:
- Tempo médio de review: < 48h
- Taxa de aprovação no 1º round: > 70%
- Bugs encontrados em review: Rastrear e reduzir

---

## 🔗 Referências

- [CONTRIBUTING.md](../CONTRIBUTING.md) - Padrões de código
- [.github/copilot-instructions.md](../.github/copilot-instructions.md) - Arquitetura multi-tenant
- [DESIGN_GUIDELINES.md](../frontend-web/DESIGN_GUIDELINES.md) - Design system
- [MULTI_TENANT_README.md](../MULTI_TENANT_README.md) - Docs multi-tenant

---

**Última atualização**: Janeiro 2026  
**Versão**: 1.0  
**Mantenedores**: Equipe ConectCRM
