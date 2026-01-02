# 📐 Decisões Técnicas (ADRs)

**Architecture Decision Records - ConectCRM**

**Última Atualização**: 1º de janeiro de 2026

---

## O Que São ADRs?

Architecture Decision Records (ADRs) documentam decisões arquiteturais importantes, incluindo:
- **Contexto**: Por que a decisão foi necessária
- **Decisão**: O que foi decidido
- **Razão**: Por que esta solução foi escolhida
- **Alternativas**: O que foi considerado e rejeitado
- **Consequências**: Impactos positivos e negativos

---

## ADR-001: Multi-Tenant via Row Level Security (RLS)

**Status**: ✅ ACEITO e IMPLEMENTADO (100%)

**Data**: Dezembro 2025

### Contexto
ConectCRM é um SaaS multi-tenant onde cada empresa (tenant) deve ter isolamento TOTAL de dados. Precisamos garantir que:
- Empresa A nunca veja dados da Empresa B
- Isolamento funcione mesmo com bugs no código
- Performance não seja comprometida

### Decisão
Usar **Row Level Security (RLS)** do PostgreSQL como última linha de defesa.

### Implementação
```sql
-- Para CADA tabela:
ALTER TABLE tabela ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_tabela ON tabela
  FOR ALL USING (empresa_id = get_current_tenant());
CREATE INDEX idx_tabela_empresa_id ON tabela(empresa_id);
```

### Arquitetura 3-Layer
1. **Layer 1**: JWT contém `empresa_id`
2. **Layer 2**: Middleware chama `set_current_tenant(empresa_id)`
3. **Layer 3**: RLS filtra automaticamente no PostgreSQL

### Razão
- ✅ **Impossível bypassar**: Mesmo com bug no código, RLS protege
- ✅ **Performance**: Índice em empresa_id otimiza queries
- ✅ **Nativo**: PostgreSQL é robusto e testado
- ✅ **Simplicidade**: Não precisa adicionar WHERE em todo lugar

### Alternativas Rejeitadas

#### Alternativa 1: Filtro no Código
```typescript
// ❌ Vulnerável a esquecimento
find({ where: { empresa_id: user.empresa_id } })
```
**Rejeição**: Depende do desenvolvedor lembrar sempre. Um esquecimento = vazamento de dados!

#### Alternativa 2: Database por Tenant
```
empresa_a_db
empresa_b_db
empresa_c_db
```
**Rejeição**: Custo operacional alto, complexidade de migrations, difícil de escalar.

#### Alternativa 3: Schema por Tenant
```sql
CREATE SCHEMA empresa_a;
CREATE SCHEMA empresa_b;
```
**Rejeição**: Menos custoso que database separada, mas ainda complexo para migrations e queries cross-tenant (analytics).

### Consequências

**Positivas**:
- ✅ Segurança máxima (última linha de defesa)
- ✅ Performance boa (índices otimizam)
- ✅ Código mais limpo (não precisa WHERE empresa_id sempre)
- ✅ Auditável (policies são rastreáveis)

**Negativas**:
- ⚠️ Precisa lembrar de habilitar RLS em TODA nova tabela
- ⚠️ Debugging mais complexo (RLS oculta dados)
- ⚠️ Analytics cross-tenant precisa bypass (superuser)

### Status Atual
- 61/61 tabelas com RLS ativo (100%)
- 0 vulnerabilidades detectadas
- CI/CD valida automaticamente

### Lições Aprendidas
1. **Documentar ANTES**: Criar diretrizes claras desde o início
2. **Templates**: Fornecer templates de migration com RLS
3. **Validação Automática**: Script de CI/CD para detectar tabelas sem RLS
4. **Code Review**: Checklist obrigatório em PRs

---

## ADR-002: Tema Único (Crevasse) para Todo o Sistema

**Status**: ✅ ACEITO e IMPLEMENTADO

**Data**: Dezembro 2025

### Contexto
Sistema tem múltiplos módulos (Atendimento, CRM, Financeiro). Precisamos definir:
- Um tema por módulo? Ou tema único?
- Como garantir consistência visual?

### Decisão
**Tema ÚNICO (Crevasse Professional)** para TODO o sistema.

### Paleta de Cores
```css
--primary: #159A9C      /* Teal - Cor principal */
--primary-hover: #0F7B7D
--text: #002333          /* Texto escuro */
--text-secondary: #B4BEC9
--background: #FFFFFF
--background-secondary: #DEEFE7
--border: #B4BEC9
```

### Razão
- ✅ **Consistência**: Usuário navega entre módulos sem confusão
- ✅ **Identidade Única**: ConectCRM tem identidade visual forte
- ✅ **Simplicidade**: Uma paleta para manter, não 5
- ✅ **Profissional**: Sistemas enterprise têm tema único

### Alternativas Rejeitadas

#### Alternativa 1: Tema por Módulo
```
Atendimento: Azul (#3B82F6)
CRM: Verde (#16A34A)
Financeiro: Dourado (#F59E0B)
```
**Rejeição**: Confuso! Usuário não sabe onde está. Parece sistema fragmentado.

#### Alternativa 2: Cores Contextuais Dominantes
```
Cada módulo usa contextuais (success/warning/error) como primária
```
**Rejeição**: Cores contextuais são para STATUS (sucesso, erro), não para identidade de módulo.

### Consequências

**Positivas**:
- ✅ Identidade visual forte
- ✅ Fácil de manter
- ✅ Consistência em todo sistema
- ✅ Profissional e clean

**Negativas**:
- ⚠️ Menos "colorido" (mas é feature, não bug!)
- ⚠️ Precisa usar ícones/ilustrações para diferenciar módulos

### Implementação
- Todas as páginas usam `text-[#159A9C]` para ícones principais
- Botões primários: `bg-[#159A9C] hover:bg-[#0F7B7D]`
- Cores contextuais APENAS para badges de status

### Validação
- Design Guidelines documenta uso correto
- Code review valida se mantém paleta

---

## ADR-003: Documentação Única em `.github/copilot-instructions.md`

**Status**: ✅ ACEITO e IMPLEMENTADO

**Data**: Dezembro 2025 / Janeiro 2026

### Contexto
Desenvolvimento assistido por IA (GitHub Copilot) precisa de diretrizes claras. Como garantir que Copilot:
- Não esqueça padrões?
- Mantenha consistência?
- Siga boas práticas?

### Decisão
**Documentação única** em `.github/copilot-instructions.md`, lido AUTOMATICAMENTE pelo Copilot em cada sessão.

### Razão
- ✅ **Lido Automaticamente**: Copilot carrega este arquivo sem precisar pedir
- ✅ **Contexto Persistente**: Mesmo entre sessões, regras estão sempre disponíveis
- ✅ **Evolução Contínua**: Um arquivo para atualizar
- ✅ **Governança**: Regras aplicadas consistentemente

### Alternativas Rejeitadas

#### Alternativa 1: Múltiplos README.md
```
backend/README.md
frontend-web/README.md
docs/BACKEND_GUIDE.md
docs/FRONTEND_GUIDE.md
```
**Rejeição**: Copilot não lê TODOS os arquivos automaticamente. Regras fragmentadas.

#### Alternativa 2: Wiki Externa
```
Confluence, Notion, Google Docs
```
**Rejeição**: Copilot não tem acesso. Desenvolvedor precisa consultar manualmente.

#### Alternativa 3: Apenas Comentários no Código
```typescript
// SEMPRE adicionar empresa_id...
```
**Rejeição**: Disperso, difícil de manter, não é referência única.

### Estrutura do Arquivo
```markdown
1. PROPÓSITO DO SISTEMA (O que é ConectCRM)
2. ARQUITETURA DE MÓDULOS (Como módulos se relacionam)
3. ANTI-PADRÕES (O que NUNCA fazer)
4. REGRAS ESPECÍFICAS (Multi-tenant, Design, etc.)
5. TEMPLATES E EXEMPLOS (Código pronto para copiar)
```

### Consequências

**Positivas**:
- ✅ Copilot sempre "lembra" das regras
- ✅ Consistência entre sessões
- ✅ Onboarding rápido (um arquivo para ler)
- ✅ Evolução rastreável (Git history)

**Negativas**:
- ⚠️ Arquivo pode ficar muito grande (2600+ linhas atualmente)
- ⚠️ Precisa manter atualizado (mas é única fonte de verdade)

### Manutenção
- Revisar mensalmente
- Adicionar lições aprendidas
- Remover seções obsoletas
- Exemplos devem ser código real (testado)

---

## ADR-004: Templates Obrigatórios (Não Criar do Zero)

**Status**: ✅ ACEITO e EM IMPLEMENTAÇÃO

**Data**: Janeiro 2026

### Contexto
Ao criar nova entity, migration ou página, desenvolvedores (e Copilot) podem:
- Esquecer multi-tenant
- Não habilitar RLS
- Criar layout diferente
- Esquecer estados de loading/error

### Decisão
**Templates obrigatórios** para copiar, não criar do zero.

### Templates Criados
1. `backend/templates/_TemplateEntity.ts` (com empresaId)
2. `backend/templates/_TemplateMigration.ts` (com RLS)
3. `frontend-web/templates/_TemplatePageWithKPIs.tsx` (com estados)

### Razão
- ✅ **Consistência Garantida**: Template já tem tudo certo
- ✅ **Menos Erros**: Impossível esquecer RLS se copiar template
- ✅ **Produtividade**: Mais rápido copiar e ajustar que criar do zero
- ✅ **Onboarding**: Desenvolvedor novo vê exemplo completo

### Alternativas Rejeitadas

#### Alternativa 1: CLI Generator
```bash
nest g module produtos --multi-tenant
```
**Rejeição**: CLI não existe nativamente, precisaria criar e manter. Template é mais simples.

#### Alternativa 2: Snippets do VS Code
```json
{
  "Multi-Tenant Entity": {
    "prefix": "entity-mt",
    "body": ["..."]
  }
}
```
**Rejeição**: Snippets são limitados, não mostram arquivo completo. Template é mais didático.

### Consequências

**Positivas**:
- ✅ 0% de esquecimento de RLS (se usar template)
- ✅ Consistência visual (frontend)
- ✅ Código autodocumentado (comentários no template)

**Negativas**:
- ⚠️ Precisa disciplina para usar (validação de CI/CD ajuda)
- ⚠️ Templates precisam evoluir com sistema

### Implementação
- Templates em `backend/templates/` e `frontend-web/templates/`
- Documentação aponta para templates
- Code review valida se foi usado

---

## ADR-005: Validação Automática de Multi-Tenant (CI/CD)

**Status**: 🟡 PLANEJADO (próxima implementação)

**Data**: Janeiro 2026

### Contexto
Descobrimos em testes que 46 tabelas foram criadas SEM RLS ativo. Como prevenir no futuro?

### Decisão
**Script de validação automática** em CI/CD que bloqueia merge se detectar:
- Entity com empresa_id mas SEM RLS
- Migration que cria tabela mas esquece RLS
- Frontend sem estados de loading/error

### Implementação Proposta
```javascript
// scripts/validate-multi-tenant.js
// Verifica:
// 1. Entities têm empresaId
// 2. Migrations habilitam RLS
// 3. Queries de verificação passam
// Exit 1 se falhar → bloqueia CI/CD
```

### Razão
- ✅ **Prevenção**: Detecta erro ANTES de produção
- ✅ **Automático**: Não depende de lembrar
- ✅ **Educativo**: Desenvolvedor vê erro e aprende
- ✅ **Confiança**: Sistema não vai para produção vulnerável

### Alternativas Rejeitadas

#### Alternativa 1: Apenas Code Review Manual
**Rejeição**: Humanos erram. Revisor pode não notar RLS faltando.

#### Alternativa 2: Testes E2E Apenas
**Rejeição**: E2E é lento, caro. Validação estática é mais rápida.

### Consequências

**Positivas**:
- ✅ NUNCA mais esquecer RLS
- ✅ Feedback imediato (no PR)
- ✅ Documentação viva (script mostra o que validar)

**Negativas**:
- ⚠️ CI/CD fica mais lento (mas <1 minuto)
- ⚠️ Falso positivo se tabela for global (empresas, planos)

### Próximos Passos
1. Criar `scripts/validate-multi-tenant.js`
2. Testar localmente
3. Adicionar em `.github/workflows/validate.yml`
4. Documentar em README

---

## ADR-006: TypeScript Strict Mode

**Status**: ✅ ACEITO e IMPLEMENTADO

**Data**: Início do projeto

### Contexto
TypeScript pode ser configurado como "leniente" ou "strict". Qual usar?

### Decisão
**Strict Mode** habilitado em `tsconfig.json`:
```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true
  }
}
```

### Razão
- ✅ **Menos Bugs**: Catch erros em compile-time
- ✅ **Código Mais Seguro**: Null checks obrigatórios
- ✅ **Manutenibilidade**: Tipos explícitos documentam código
- ✅ **Performance**: TypeScript otimiza melhor

### Alternativas Rejeitadas

#### Alternativa 1: Strict Desabilitado
```json
{ "strict": false }
```
**Rejeição**: Permite `any` em todo lugar, perde benefício do TypeScript.

### Consequências

**Positivas**:
- ✅ Menos runtime errors
- ✅ Refactoring mais seguro
- ✅ IDE autocomplete melhor

**Negativas**:
- ⚠️ Curva de aprendizado (iniciantes sofrem)
- ⚠️ Integrações com JS legado são chatas

---

## ADR-007: React Hook Form + class-validator (Frontend)

**Status**: ✅ ACEITO e IMPLEMENTADO

**Data**: Início do projeto

### Contexto
Como validar formulários no frontend?

### Decisão
**React Hook Form** para gestão de formulários + **class-validator** para DTOs espelhados do backend.

### Razão
- ✅ **Performance**: React Hook Form não re-renderiza demais
- ✅ **Consistência**: class-validator = mesmas regras do backend
- ✅ **Developer Experience**: Código limpo e declarativo

### Alternativas Rejeitadas

#### Alternativa 1: Formik
**Rejeição**: Mais pesado, re-renderiza mais.

#### Alternativa 2: Yup para Validação
**Rejeição**: Duplica validações (backend tem class-validator).

### Consequências

**Positivas**:
- ✅ Validação cliente = validação servidor
- ✅ Performance ótima

**Negativas**:
- ⚠️ Duas bibliotecas para aprender

---

## ADR-008: Tailwind CSS (Não CSS-in-JS)

**Status**: ✅ ACEITO e IMPLEMENTADO

**Data**: Início do projeto

### Contexto
Como estilizar componentes?

### Decisão
**Tailwind CSS** com utility-first classes.

### Razão
- ✅ **Produtividade**: Não sair do HTML para estilizar
- ✅ **Consistência**: Design system embutido
- ✅ **Performance**: CSS é purgado (bundle pequeno)
- ✅ **Manutenibilidade**: Sem CSS órfão

### Alternativas Rejeitadas

#### Alternativa 1: Styled Components (CSS-in-JS)
**Rejeição**: Runtime overhead, bundle maior.

#### Alternativa 2: CSS Modules
**Rejeição**: Muitos arquivos, naming é chato.

#### Alternativa 3: SASS/SCSS
**Rejeição**: Menos produtivo, precisa pensar em nomes.

### Consequências

**Positivas**:
- ✅ Velocidade de desenvolvimento
- ✅ Bundle pequeno
- ✅ Sem CSS não usado

**Negativas**:
- ⚠️ HTML fica "poluído" (mas é trade-off aceito)

---

## 📋 Template para Novas ADRs

```markdown
## ADR-XXX: [Título da Decisão]

**Status**: 🟡 PROPOSTO | ✅ ACEITO | ❌ REJEITADO | 🔄 DEPRECADO

**Data**: [Data]

### Contexto
[Por que esta decisão é necessária?]

### Decisão
[O que foi decidido?]

### Razão
- ✅ [Razão 1]
- ✅ [Razão 2]

### Alternativas Rejeitadas
#### Alternativa 1: [Nome]
**Rejeição**: [Por que não]

### Consequências
**Positivas**:
- ✅ [Benefício 1]

**Negativas**:
- ⚠️ [Trade-off 1]

### Implementação
[Como será implementado?]
```

---

## 📚 Referências

- **Arquitetura**: `docs/ARQUITETURA.md`
- **Módulos**: `docs/MODULOS.md`
- **Multi-Tenant**: `SISTEMA_100_MULTI_TENANT_FINAL.md`
- **Governança**: `GOVERNANCA_DESENVOLVIMENTO_IA.md`

---

**Elaborado por**: Equipe ConectCRM  
**Revisão**: GitHub Copilot Agent  
**Próxima Revisão**: Abril 2026
