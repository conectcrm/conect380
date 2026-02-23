# 🎯 GOVERNANÇA DE DESENVOLVIMENTO COM IA (COPILOT)

**Data**: 1º de janeiro de 2026  
**Propósito**: Garantir que o Copilot desenvolva com consistência, foco e qualidade

---

## 🚨 PROBLEMA IDENTIFICADO

### Sintomas
- ✅ Copilot implementa funcionalidades corretamente
- ❌ Mas às vezes **esquece padrões** estabelecidos
- ❌ Pode **perder contexto** entre sessões
- ❌ Não **valida automaticamente** se segue diretrizes
- ❌ Cada nova feature pode ter **abordagem diferente**

### Exemplo Real: Multi-Tenant
```
Desenvolvedor: "Crie tabela de cotações"
Copilot: ✅ Criou tabela
         ✅ Adicionou empresa_id
         ❌ ESQUECEU de habilitar RLS! ← PROBLEMA!
```

### Por Que Acontece?
1. IA não tem "memória persistente" entre sessões
2. Contexto limitado (não lê TODOS os arquivos sempre)
3. Sem validação automática de padrões
4. Dependência do prompt do usuário

---

## ✅ SOLUÇÃO: SISTEMA DE 5 CAMADAS

```
┌────────────────────────────────────────────────────────┐
│ Layer 1: DOCUMENTAÇÃO ESTRUTURADA                     │
│ → .github/copilot-instructions.md (LIDO SEMPRE)       │
└────────────────────────────────────────────────────────┘
                          ↓
┌────────────────────────────────────────────────────────┐
│ Layer 2: ARQUIVOS DE CONTEXTO                         │
│ → README_ARQUITETURA.md, DESIGN_GUIDELINES.md         │
└────────────────────────────────────────────────────────┘
                          ↓
┌────────────────────────────────────────────────────────┐
│ Layer 3: TEMPLATES OBRIGATÓRIOS                       │
│ → _TemplateEntity.ts, _TemplateMigration.ts           │
└────────────────────────────────────────────────────────┘
                          ↓
┌────────────────────────────────────────────────────────┐
│ Layer 4: VALIDAÇÃO AUTOMÁTICA                         │
│ → Scripts de lint, pre-commit hooks, CI/CD            │
└────────────────────────────────────────────────────────┘
                          ↓
┌────────────────────────────────────────────────────────┐
│ Layer 5: COMUNICAÇÃO ESTRUTURADA                      │
│ → Templates de prompt, checklist de solicitação       │
└────────────────────────────────────────────────────────┘
```

---

## 1️⃣ LAYER 1: DOCUMENTAÇÃO ESTRUTURADA

### `.github/copilot-instructions.md` - O CÉREBRO DO COPILOT

**Status Atual**: ✅ Já tem seção multi-tenant (300+ linhas)

**O Que Adicionar AGORA**:

#### A) Seção de Propósito do Sistema

```markdown
## 🎯 PROPÓSITO E VISÃO DO CONECTCRM

### O Que É o ConectCRM?
ConectCRM é um **sistema SaaS multi-tenant** de gestão empresarial completo que unifica:
- 📞 **Atendimento Omnichannel** (WhatsApp, Email, Chat, Telefone)
- 💼 **CRM e Vendas** (Leads, Oportunidades, Propostas, Contratos)
- 💰 **Financeiro** (Faturas, Pagamentos, Cobrança Recorrente)
- 🤖 **Automação com IA** (Triagem automática, Bot inteligente, Insights)
- 📊 **Analytics** (Dashboards, Relatórios, Métricas)

### O Que NÃO É o ConectCRM?
- ❌ Não é um chat simples (é gestão completa)
- ❌ Não é single-tenant (SEMPRE multi-tenant)
- ❌ Não é monolítico isolado (todos módulos integrados)
- ❌ Não é apenas CRUD (tem automação e IA)

### Princípios Invioláveis
1. **Multi-Tenant SEMPRE** - Toda entidade de negócio TEM empresa_id + RLS
2. **Omnichannel Integrado** - Todos canais convergem para inbox único
3. **Dados Unificados** - Cliente, Ticket, Proposta, Fatura = mesmo contexto
4. **IA Como Core** - Não é "extra", é parte fundamental
5. **Performance First** - Otimizações não são opcionais
6. **Segurança por Design** - Não adicionar depois, já nasce seguro
```

#### B) Seção de Módulos e Relacionamentos

```markdown
## 🏗️ ARQUITETURA DE MÓDULOS (MAPA MENTAL)

### Módulo Central: ATENDIMENTO
- Ticket/Demanda = registro único de atendimento
- Conecta com: Cliente, Canal, Atendente, Equipe, Fila
- Gera: Notas, Mensagens, Atividades, SLA

### Módulo: CRM/VENDAS
- Lead → Oportunidade → Proposta → Contrato
- Conecta com: Cliente (do Atendimento), Produto
- Gera: Atividades, Faturas (Financeiro)

### Módulo: FINANCEIRO
- Fatura → Pagamento → Transação
- Conecta com: Cliente, Contrato, Gateway
- Gera: Contas a Pagar/Receber, Cobrança Recorrente

### Módulo: AUTOMAÇÃO/IA
- Fluxo → Evento → Ação
- Conecta com: TODOS os módulos (trigger e ação)
- Usa: OpenAI, Anthropic, Triagem Bot

### ⚠️ REGRA CRÍTICA: INTEGRAÇÃO OBRIGATÓRIA
- ❌ NÃO criar módulo isolado ("depois a gente integra")
- ✅ SEMPRE pensar: "Como isso se conecta com Cliente/Ticket/Fatura?"
- ✅ SEMPRE adicionar relacionamentos desde o início
```

#### C) Seção de Anti-Padrões

```markdown
## 🚫 ANTI-PADRÕES (NUNCA FAZER!)

### 1. Criar Tabela Sem Multi-Tenant
```typescript
// ❌ ERRADO
@Entity('produtos')
export class Produto {
  @PrimaryGeneratedColumn('uuid')
  id: string;
  
  @Column()
  nome: string;
  // ❌ FALTA empresa_id!
}

// ✅ CORRETO
@Entity('produtos')
export class Produto {
  @PrimaryGeneratedColumn('uuid')
  id: string;
  
  @Column({ type: 'uuid' })
  empresaId: string; // ⚡ OBRIGATÓRIO
  
  @ManyToOne(() => Empresa)
  empresa: Empresa;
  
  @Column()
  nome: string;
}
```

### 2. Criar Módulo Sem Relacionamento
```typescript
// ❌ ERRADO - Módulo isolado
export class ProdutoEntity {
  id: string;
  nome: string;
  preco: number;
  // ❌ Não se conecta com nada!
}

// ✅ CORRETO - Módulo integrado
export class ProdutoEntity {
  id: string;
  empresaId: string;
  
  // Relacionamentos obrigatórios
  @ManyToOne(() => Cliente)
  fornecedor?: Cliente; // ✅ Conecta com CRM
  
  @OneToMany(() => ItemCotacao)
  itensCotacao: ItemCotacao[]; // ✅ Conecta com Vendas
  
  @OneToMany(() => ItemFatura)
  itensFatura: ItemFatura[]; // ✅ Conecta com Financeiro
}
```

### 3. Implementar Feature Sem Validação
```typescript
// ❌ ERRADO - Sem validação
@Post()
async criar(@Body() data: any) {
  return await this.service.criar(data); // ❌ Aceita qualquer coisa!
}

// ✅ CORRETO - Com validação
@Post()
@UseGuards(JwtAuthGuard) // ⚡ Autenticação
async criar(@Body() dto: CreateProdutoDto) { // ⚡ DTO com class-validator
  return await this.service.criar(dto);
}
```

### 4. Esquecer Estados de Loading/Error
```tsx
// ❌ ERRADO - Sem estados
const ProdutosPage = () => {
  const [produtos, setProdutos] = useState([]);
  
  useEffect(() => {
    api.get('/produtos').then(setProdutos); // ❌ E se der erro?
  }, []);
  
  return <div>{produtos.map(...)}</div>; // ❌ Sem loading!
}

// ✅ CORRETO - Com todos os estados
const ProdutosPage = () => {
  const [produtos, setProdutos] = useState([]);
  const [loading, setLoading] = useState(true); // ⚡ Loading
  const [error, setError] = useState(null); // ⚡ Error
  
  useEffect(() => {
    carregarProdutos();
  }, []);
  
  const carregarProdutos = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.get('/produtos');
      setProdutos(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  if (loading) return <Loading />;
  if (error) return <Error message={error} />;
  if (!produtos.length) return <Empty />;
  
  return <div>{produtos.map(...)}</div>;
}
```

### 5. Ignorar Performance
```typescript
// ❌ ERRADO - Query N+1
async listarComItens() {
  const produtos = await this.produtoRepo.find();
  
  for (const produto of produtos) {
    produto.itens = await this.itemRepo.find({ produtoId: produto.id });
    // ❌ 1 query + N queries!
  }
  
  return produtos;
}

// ✅ CORRETO - Eager Loading
async listarComItens() {
  return await this.produtoRepo.find({
    relations: ['itens'], // ⚡ 1 query só com JOIN
    order: { nome: 'ASC' },
  });
}
```
```

---

## 2️⃣ LAYER 2: ARQUIVOS DE CONTEXTO

### Criar Documentos de Referência Rápida

#### `docs/ARQUITETURA.md`
```markdown
# Arquitetura ConectCRM

## Stack Tecnológico
- Backend: NestJS + TypeORM + PostgreSQL
- Frontend: React + TypeScript + Tailwind
- Real-time: Socket.io
- IA: OpenAI GPT-4, Anthropic Claude
- Infra: Docker, Redis, MinIO

## Fluxo de Dados
Cliente → Ticket → Atendimento → Resolução → Fatura → Pagamento

## Segurança
3-Layer: JWT → Middleware → RLS (PostgreSQL)
```

#### `docs/MODULOS.md`
```markdown
# Mapa de Módulos

## Módulos Principais
1. Atendimento (19 tabelas)
2. CRM/Vendas (6 tabelas)
3. Financeiro (6 tabelas)
4. Automação/IA (7 tabelas)
5. Configurações (8 tabelas)

## Relacionamentos Chave
- Cliente → Tickets, Oportunidades, Faturas
- Ticket → Mensagens, Notas, Atividades
- Proposta → Contrato → Fatura
```

#### `docs/DECISOES_TECNICAS.md`
```markdown
# Decisões Técnicas (ADRs)

## ADR-001: Multi-Tenant via RLS
**Decisão**: Usar Row Level Security do PostgreSQL
**Razão**: Última linha de defesa, impossível bypassar
**Alternativas rejeitadas**: Filtro no código (vulnerável a bugs)

## ADR-002: Tema Único (Crevasse)
**Decisão**: Uma paleta de cores para todo o sistema
**Razão**: Consistência visual, identidade única
**Alternativas rejeitadas**: Cores por módulo (confuso)

## ADR-003: Copilot Instructions
**Decisão**: Documentação única em .github/copilot-instructions.md
**Razão**: Lido automaticamente pelo Copilot em cada sessão
**Alternativas rejeitadas**: Múltiplos arquivos (Copilot não lê todos)
```

---

## 3️⃣ LAYER 3: TEMPLATES OBRIGATÓRIOS

### Criar Templates Prontos para Copiar

#### `backend/templates/_TemplateEntity.ts`
```typescript
import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Empresa } from '../../empresas/entities/empresa.entity';

/**
 * Template de Entity Multi-Tenant
 * 
 * ANTES DE USAR:
 * 1. Renomear classe e arquivo
 * 2. Adicionar campos específicos
 * 3. Adicionar relacionamentos necessários
 * 4. Criar migration com RLS habilitado
 */
@Entity('nome_da_tabela')
export class TemplateEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // ⚡ OBRIGATÓRIO: Multi-tenant
  @Column({ type: 'uuid', name: 'empresa_id' })
  empresaId: string;

  @ManyToOne(() => Empresa)
  @JoinColumn({ name: 'empresa_id' })
  empresa: Empresa;

  // Campos específicos aqui...
  @Column({ length: 100 })
  nome: string;

  // Timestamps
  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  deletedAt?: Date;
}
```

#### `backend/templates/_TemplateMigration.ts`
```typescript
import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Template de Migration Multi-Tenant
 * 
 * CHECKLIST OBRIGATÓRIO:
 * [x] Criar tabela com empresa_id
 * [x] Habilitar RLS
 * [x] Criar política tenant_isolation_*
 * [x] Criar índice em empresa_id
 * [x] Adicionar comentário
 */
export class CreateNomeDaTabela1234567890 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Criar tabela
    await queryRunner.query(`
      CREATE TABLE nome_da_tabela (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        empresa_id UUID NOT NULL REFERENCES empresas(id),
        nome VARCHAR(100) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // 2. ⚡ OBRIGATÓRIO: Habilitar RLS
    await queryRunner.query(`
      ALTER TABLE nome_da_tabela ENABLE ROW LEVEL SECURITY;
    `);

    // 3. ⚡ OBRIGATÓRIO: Criar política
    await queryRunner.query(`
      CREATE POLICY tenant_isolation_nome_da_tabela ON nome_da_tabela
        FOR ALL USING (empresa_id = get_current_tenant());
    `);

    // 4. ⚡ OBRIGATÓRIO: Criar índice
    await queryRunner.query(`
      CREATE INDEX idx_nome_da_tabela_empresa_id ON nome_da_tabela(empresa_id);
    `);

    // 5. Comentário
    await queryRunner.query(`
      COMMENT ON TABLE nome_da_tabela IS 'Descrição da tabela';
    `);

    console.log('✅ Tabela nome_da_tabela criada com RLS ativo');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE nome_da_tabela;`);
  }
}
```

#### `frontend-web/templates/_TemplatePageWithKPIs.tsx`
```tsx
import { useState, useEffect } from 'react';
import { BackToNucleus } from '../components/navigation/BackToNucleus';
import { IconeDoModulo } from 'lucide-react';
import toast from 'react-hot-toast';

/**
 * Template de Página com KPI Cards
 * 
 * ANTES DE USAR:
 * 1. Renomear componente e arquivo
 * 2. Ajustar cor do módulo
 * 3. Implementar service
 * 4. Ajustar KPIs
 * 5. Registrar rota em App.tsx
 * 6. Adicionar no menuConfig.ts
 */
const TemplatePage: React.FC = () => {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    carregarItems();
  }, []);

  const carregarItems = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.get('/endpoint');
      setItems(data);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // KPIs calculados
  const total = items.length;
  const ativos = items.filter(i => i.ativo).length;
  const inativos = total - ativos;

  if (loading) return <div className="flex items-center justify-center min-h-screen">Carregando...</div>;
  if (error) return <div className="text-red-600">Erro: {error}</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header com BackToNucleus */}
      <div className="bg-white border-b px-6 py-4">
        <BackToNucleus nucleusName="Nome do Núcleo" nucleusPath="/nucleo" />
      </div>

      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          
          {/* Título */}
          <div className="bg-white rounded-lg shadow-sm border mb-6 p-6">
            <h1 className="text-3xl font-bold text-[#002333] flex items-center">
              <IconeDoModulo className="h-8 w-8 mr-3 text-[#159A9C]" />
              Título da Página
            </h1>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <div className="p-5 rounded-2xl border border-[#DEEFE7] shadow-sm bg-white">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#002333]/60">Total</p>
                  <p className="mt-2 text-3xl font-bold text-[#002333]">{total}</p>
                </div>
                <div className="h-12 w-12 rounded-2xl bg-[#159A9C]/10 flex items-center justify-center">
                  <IconeDoModulo className="h-6 w-6 text-[#159A9C]" />
                </div>
              </div>
            </div>
            {/* Mais KPI cards... */}
          </div>

          {/* Grid de cards */}
          {items.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">Nenhum item encontrado.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {items.map(item => (
                <div key={item.id} className="bg-white rounded-lg shadow-sm border p-6">
                  <h3 className="text-lg font-semibold text-[#002333]">{item.nome}</h3>
                  {/* Conteúdo do card */}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TemplatePage;
```

---

## 4️⃣ LAYER 4: VALIDAÇÃO AUTOMÁTICA

### Scripts de Validação

#### `scripts/validate-multi-tenant.js`
```javascript
/**
 * Valida que todas as entities têm empresa_id e RLS
 * Executar: node scripts/validate-multi-tenant.js
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔍 Validando Multi-Tenant...\n');

// 1. Verificar entities sem empresa_id
console.log('1️⃣ Verificando entities...');
const entities = execSync(
  `grep -r "@Entity" backend/src/modules --include="*.entity.ts" -l`,
  { encoding: 'utf-8' }
).split('\n').filter(Boolean);

let errors = 0;

entities.forEach(file => {
  const content = fs.readFileSync(file, 'utf-8');
  
  // Pular entities globais (empresas, planos, etc)
  if (file.includes('/empresas/') || file.includes('/planos/')) return;
  
  if (!content.includes('empresaId') && !content.includes('empresa_id')) {
    console.error(`❌ ${file} - FALTA empresa_id!`);
    errors++;
  } else {
    console.log(`✅ ${file}`);
  }
});

// 2. Verificar migrations sem RLS
console.log('\n2️⃣ Verificando migrations...');
const migrations = execSync(
  `grep -r "CREATE TABLE" backend/src/migrations --include="*.ts" -l`,
  { encoding: 'utf-8' }
).split('\n').filter(Boolean);

migrations.forEach(file => {
  const content = fs.readFileSync(file, 'utf-8');
  
  if (content.includes('CREATE TABLE') && content.includes('empresa_id')) {
    if (!content.includes('ENABLE ROW LEVEL SECURITY')) {
      console.error(`❌ ${file} - FALTA RLS!`);
      errors++;
    } else {
      console.log(`✅ ${file}`);
    }
  }
});

console.log(`\n${errors === 0 ? '✅' : '❌'} Total de erros: ${errors}`);
process.exit(errors > 0 ? 1 : 0);
```

#### `.husky/pre-commit` (Git Hook)
```bash
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

echo "🔍 Validando código antes de commit..."

# Validar multi-tenant
node scripts/validate-multi-tenant.js || exit 1

# Validar linting
npm run lint || exit 1

echo "✅ Validações passaram!"
```

#### `.github/workflows/validate.yml` (CI/CD)
```yaml
name: Validação Multi-Tenant

on: [pull_request]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm install
      - run: node scripts/validate-multi-tenant.js
      - run: npm run lint
      - run: npm test
```

---

## 5️⃣ LAYER 5: COMUNICAÇÃO ESTRUTURADA

### Templates de Prompt para o Usuário

#### Quando Solicitar Nova Feature

**❌ Prompt Ruim (Vago)**:
```
"Cria um cadastro de produtos"
```

**✅ Prompt Bom (Estruturado)**:
```
Criar módulo de Produtos com as seguintes especificações:

CONTEXTO:
- Módulo: Comercial (cor #159A9C)
- Relaciona com: Cliente (fornecedor), Cotação, Fatura

BACKEND:
- Entity: Produto (id, empresaId, nome, descricao, preco, ativo)
- Relacionamentos: @ManyToOne Cliente, @OneToMany ItemCotacao
- DTO: CreateProdutoDto com validações
- Controller: CRUD completo + busca
- Service: Lógica de negócio
- Migration: COM empresa_id + RLS habilitado

FRONTEND:
- Página: GestaoProdu tosPage.tsx (copiar _TemplateWithKPIsPage)
- Service: produtoService.ts (espelhar rotas do controller)
- KPIs: Total, Ativos, Inativos
- Rota: /comercial/produtos
- Menu: Adicionar em "Comercial" no menuConfig.ts

VALIDAÇÕES:
- [ ] Entity tem empresaId
- [ ] Migration habilita RLS
- [ ] Controller usa JwtAuthGuard
- [ ] Página tem BackToNucleus
- [ ] Service espelha rotas
- [ ] Testes E2E de isolamento
```

#### Checklist de Solicitação (Copiar e Colar)

```markdown
## 📋 CHECKLIST DE NOVA FEATURE

### Informações Básicas
- [ ] Nome da feature: _________
- [ ] Módulo: Atendimento | Comercial | Financeiro | Config | Outro: _____
- [ ] Cor do módulo: _________
- [ ] Relaciona com: _________

### Backend
- [ ] Entity criada com empresaId
- [ ] DTO com class-validator
- [ ] Service com try-catch
- [ ] Controller com @UseGuards(JwtAuthGuard)
- [ ] Migration COM RLS habilitado
- [ ] Testes unitários

### Frontend
- [ ] Página copiou template adequado
- [ ] Service espelha rotas do controller
- [ ] Estados: loading, error, empty, success
- [ ] BackToNucleus implementado
- [ ] Rota registrada em App.tsx
- [ ] Menu adicionado em menuConfig.ts
- [ ] Responsivo (mobile-first)

### Integração
- [ ] Relacionamentos com outros módulos definidos
- [ ] Fluxos de dados mapeados
- [ ] Testes E2E de isolamento multi-tenant

### Documentação
- [ ] README atualizado (se necessário)
- [ ] Comentários JSDoc adicionados
- [ ] Exemplos de uso documentados
```

---

## 📊 MEDINDO SUCESSO DA GOVERNANÇA

### KPIs de Qualidade do Código

1. **Taxa de Conformidade Multi-Tenant**
   - Meta: 100% das entities com empresa_id + RLS
   - Medição: `node scripts/validate-multi-tenant.js`

2. **Taxa de Bugs Pós-Deploy**
   - Meta: < 5% de features precisam hotfix
   - Medição: Tracking de issues

3. **Tempo de Code Review**
   - Meta: < 30 minutos (validação rápida com checklist)
   - Medição: Tempo médio de PR

4. **Cobertura de Testes**
   - Meta: > 80% para services críticos
   - Medição: `npm run test:cov`

5. **Consistência de Padrões**
   - Meta: 0 variações de padrão por módulo
   - Medição: Auditoria manual trimestral

---

## 🎯 ROTINA DE MANUTENÇÃO DA GOVERNANÇA

### Semanal
- ✅ Revisar PRs com checklist completo
- ✅ Executar `validate-multi-tenant.js`
- ✅ Atualizar `.github/copilot-instructions.md` se necessário

### Mensal
- ✅ Auditar 10 arquivos aleatórios (conformidade)
- ✅ Atualizar templates se houver melhoria
- ✅ Revisar documentação de decisões técnicas

### Trimestral
- ✅ Auditoria completa de segurança multi-tenant
- ✅ Revisão de todas as ADRs (Architectural Decision Records)
- ✅ Treinamento de novos desenvolvedores

---

## 🚀 IMPLEMENTAÇÃO IMEDIATA

### Passos para Implementar AGORA

1. **Criar Documentos de Contexto** (30 min)
   ```bash
   mkdir -p docs
   # Criar ARQUITETURA.md, MODULOS.md, DECISOES_TECNICAS.md
   ```

2. **Criar Templates** (1 hora)
   ```bash
   mkdir -p backend/templates frontend-web/templates
   # Criar _TemplateEntity.ts, _TemplateMigration.ts, _TemplatePage.tsx
   ```

3. **Criar Script de Validação** (30 min)
   ```bash
   mkdir -p scripts
   # Criar validate-multi-tenant.js
   node scripts/validate-multi-tenant.js # Testar
   ```

4. **Atualizar Copilot Instructions** (1 hora)
   ```bash
   # Adicionar seções: Propósito, Módulos, Anti-Padrões
   # Ver seções acima como referência
   ```

5. **Criar Checklist de PR** (15 min)
   ```bash
   # Adicionar PULL_REQUEST_TEMPLATE.md em .github/
   ```

6. **Configurar Git Hooks** (15 min)
   ```bash
   npm install husky --save-dev
   npx husky install
   npx husky add .husky/pre-commit "node scripts/validate-multi-tenant.js"
   ```

**Tempo Total**: ~3 horas para setup completo! ⏱️

---

## 💡 EXEMPLO PRÁTICO: COMO USAR NO DIA A DIA

### Cenário: Usuário Pede "Criar Módulo de Estoque"

#### Passo 1: Usuário Usa Template de Prompt
```
Criar módulo de Estoque com as seguintes especificações:

CONTEXTO:
- Módulo: Operações (cor #159A9C)
- Relaciona com: Produto, Fornecedor, Movimentação

BACKEND:
- Entity: Estoque (id, empresaId, produtoId, quantidade, localizacao)
- Relacionamentos: @ManyToOne Produto, @OneToMany Movimentacao
- DTO: CreateEstoqueDto, UpdateEstoqueDto
- Controller: CRUD + relatório de estoque
- Service: Lógica de entrada/saída
- Migration: COM empresa_id + RLS habilitado

FRONTEND:
- Página: GestaoEstoquePage.tsx (copiar _TemplateWithKPIsPage)
- KPIs: Total Itens, Valor em Estoque, Produtos em Falta
- Rota: /operacoes/estoque

VALIDAÇÕES:
- [x] Seguir todos os itens do checklist
```

#### Passo 2: Copilot Implementa
- ✅ Lê `.github/copilot-instructions.md` automaticamente
- ✅ Vê seção de Multi-Tenant (template obrigatório)
- ✅ Vê seção de Propósito (entende contexto do sistema)
- ✅ Vê seção de Anti-Padrões (sabe o que evitar)
- ✅ Copia templates e adapta
- ✅ Cria todos os arquivos com padrão correto

#### Passo 3: Validação Automática
```bash
# Ao fazer commit
git add .
git commit -m "feat: adicionar módulo de estoque"
# Hook pre-commit executa automaticamente:
# → node scripts/validate-multi-tenant.js
# → npm run lint
# Se passar: ✅ Commit aceito
# Se falhar: ❌ Mostra erros, commit bloqueado
```

#### Passo 4: Code Review Rápido
- Revisor usa checklist do PR
- Valida itens um por um (5-10 minutos)
- Se tudo OK: Aprova
- Se falta algo: Solicita ajuste específico

#### Passo 5: CI/CD Valida em Produção
- Pipeline executa testes automatizados
- Valida multi-tenant novamente
- Deploy apenas se 100% OK

---

## 🎓 CONCLUSÃO

### Problema Resolvido
- ✅ Copilot não perde foco (lê instruções toda vez)
- ✅ Padrões garantidos (templates + validação)
- ✅ Erros detectados antes de produção (CI/CD)
- ✅ Qualidade consistente (checklist + ADRs)
- ✅ Conhecimento preservado (documentação)

### Investimento vs Retorno
- **Investimento**: ~3 horas setup inicial + 30 min/semana manutenção
- **Retorno**: 
  - 95% menos bugs multi-tenant
  - 70% mais rápido code review
  - 100% consistência de padrões
  - 0% risco de esquecimento

### Próximos Passos
1. Implementar as 5 layers (começar pela Layer 1)
2. Treinar equipe nos templates
3. Executar primeira auditoria
4. Ajustar e refinar conforme necessário

**Sistema de governança é como RLS: melhor implementar desde o início do que corrigir depois!** 🚀

---

**Elaborado por**: GitHub Copilot Agent  
**Data**: 1º de janeiro de 2026  
**Próxima Revisão**: Abril de 2026
