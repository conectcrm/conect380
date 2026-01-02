<!-- Atualização: versão concisa e prática das instruções para agentes AI -->
# GitHub Copilot Instructions — ConectCRM (resumo prático)

Objetivo: orientar rapidamente agentes AI a serem produtivos no repositório ConectCRM com regras específicas do projeto, comandos essenciais e exemplos práticos.

---

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

---

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

---

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

### 6. Migration Sem RLS
```typescript
// ❌ ERRADO - Esqueceu RLS
export class CreateProdutos1234567890 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE produtos (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        empresa_id UUID NOT NULL REFERENCES empresas(id),
        nome VARCHAR(100) NOT NULL
      );
    `);
    // ❌ FALTA: ENABLE ROW LEVEL SECURITY!
    // ❌ FALTA: CREATE POLICY!
  }
}

// ✅ CORRETO - Com RLS completo
export class CreateProdutos1234567890 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Criar tabela
    await queryRunner.query(`
      CREATE TABLE produtos (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        empresa_id UUID NOT NULL REFERENCES empresas(id),
        nome VARCHAR(100) NOT NULL
      );
    `);

    // 2. ⚡ OBRIGATÓRIO: Habilitar RLS
    await queryRunner.query(`
      ALTER TABLE produtos ENABLE ROW LEVEL SECURITY;
    `);

    // 3. ⚡ OBRIGATÓRIO: Criar política
    await queryRunner.query(`
      CREATE POLICY tenant_isolation_produtos ON produtos
        FOR ALL USING (empresa_id = get_current_tenant());
    `);

    // 4. ⚡ OBRIGATÓRIO: Criar índice
    await queryRunner.query(`
      CREATE INDEX idx_produtos_empresa_id ON produtos(empresa_id);
    `);

    console.log('✅ Tabela produtos criada com RLS ativo');
  }
}
```

---

## 🚨 REGRA CRÍTICA: NUNCA PULAR ETAPAS

**SEMPRE obter consentimento explícito do usuário antes de:**
- ❌ Pular etapas de um plano/checklist
- ❌ Implementar múltiplas features de uma vez sem aprovação
- ❌ Avançar para próxima fase antes de validar a atual
- ❌ Fazer suposições sobre requisitos não especificados
- ❌ Executar comandos que modificam o sistema sem permissão
- ✅ Após QUALQUER implementação ou mudança que exija validação, execute testes adequados (backend: `npm test`, frontend: `npm run test` ou testes direcionados). Se não puder rodar, informe e peça autorização para o usuário.

**Fluxo Obrigatório:**
1. ✅ Apresentar plano detalhado com TODAS as etapas
2. ✅ Aguardar aprovação explícita do usuário
3. ✅ Executar SOMENTE a etapa aprovada
4. ✅ Validar resultado da etapa com o usuário
5. ✅ Perguntar se deve prosseguir para próxima etapa
6. ✅ Repetir ciclo até conclusão completa

**Regra extra para roadmaps/documentações:** ao executar um plano baseado em uma documentação/roadmap, mantenha as etapas marcadas (checkbox ou status) e informe o progresso ao usuário antes de avançar para a próxima.

**Regra extra de sequência:** só prossiga para a próxima etapa do plano se não houver pendências na etapa atual, a menos que o usuário peça explicitamente para pular.

**Exemplo Correto:**
```
Copilot: "Vou implementar a Semana 1 do plano (OpenTelemetry). 
         Posso prosseguir?"
Usuário: "Sim"
Copilot: [executa Semana 1]
Copilot: "Semana 1 concluída. Quer que eu valide o resultado 
         ou já posso prosseguir para Semana 2?"
```

**Exemplo ERRADO:**
```
❌ Copilot: "Vou implementar as Semanas 1, 2 e 3 de uma vez..."
❌ Copilot: "Pulando essa etapa porque presumo que..."
❌ Copilot: "Já implementei tudo do plano..."
```

### Comunicação
- Responda sempre em português brasileiro (pt-BR), mantendo termos técnicos em inglês apenas quando não houver tradução adequada.
- Ao reportar logs, comandos ou mensagens de erro, contextualize em português para manter a conversa padronizada.
- **SEMPRE pergunte antes de executar ações que modificam código, banco de dados ou infraestrutura.**
- Para questões de análise/revisão, não pergunte o óbvio: realize toda a análise disponível e só questione o usuário quando for necessário para mudanças ou decisões que dependam dele.

1) Onde olhar primeiro
- Frontend: `frontend-web/` (páginas em `frontend-web/src/pages` e features em `frontend-web/src/features`).
- Backend: `backend/src/modules/` (entidades, controllers, services).
- Design: `frontend-web/DESIGN_GUIDELINES.md` — **TEMA ÚNICO: Crevasse** (NÃO alterar cores em nenhuma tela).

2) **REGRA FUNDAMENTAL DE DESIGN**
- ✅ **Tema Crevasse**: ÚNICO para TODO o sistema (todas as telas, todos os módulos)
- ✅ **Layout/Template**: VARIA conforme contexto (dashboard, formulário, lista, etc)
- ❌ **NÃO existe**: "tema por módulo" ou "cores diferentes por núcleo"
- ❌ **NÃO mudar**: Cores da paleta Crevasse (#159A9C, #002333, #DEEFE7, #B4BEC9, #FFFFFF)

3) Comandos rápidos (dev)
- **Node obrigatório**: use Node 22.16+ (frontend só sobe com `NODE_OPTIONS=--max_old_space_size=4096`). Ajuste via `nvm use 22.16.0` ou `fnm use 22.16` antes de rodar qualquer comando.
- Iniciar backend em modo dev: `cd backend && npm run start:dev` (porta padrão 3001).
- Iniciar frontend: `cd frontend-web && npm start` (proxy para `http://localhost:3001`).
- Testes backend: `cd backend && npm test`. Frontend: `cd frontend-web && npm run test`.

4) Edição segura (regra forte do projeto)
- Sempre ler o arquivo completo antes de editar (use `read_file()` analogamente).
- Antes de adicionar rota/import/função, procurar com `grep_search("texto-chave")` para evitar duplicação.
- Ao usar operações de substituição, inclua 3–5 linhas de contexto únicas para evitar matches múltiplos.

Exemplo prático: antes de adicionar rota `/nuclei/configuracoes/xyz` - `grep_search("/nuclei/configuracoes/")` e editar o bloco de rotas com contexto.

5) Padrões e templates úteis
- Copiar página a partir de `frontend-web/src/pages/_TemplatePage.tsx` ou `_TemplateSimplePage.tsx` — NUNCA criar tela do zero.
- Services frontend ficam em `frontend-web/src/services` e devem espelhar rotas do backend (ver controllers em `backend/src/modules/*/controllers`).

6) Integrações e pontos sensíveis
- Websockets / realtime: socket.io usado no backend e `socket.io-client` no frontend — checar `backend/src/gateways` e `frontend-web/src/services/socket`.
- Integrações externas: OpenAI/Anthropic, WhatsApp (whatsapp-web.js), SendGrid, Stripe, Twilio — confira `backend/package.json` dependências e variáveis em `.env`.

7) Migrations & DB
- Comandos TypeORM no backend: `npm run migration:generate`, `npm run migration:run`, `npm run migration:revert` (ver `ormconfig.js`).

8) Convenções de naming (breve)
- Backend: entities `*.entity.ts`, controllers `*.controller.ts`, services `*.service.ts`, modules `*.module.ts`.
- Frontend: pages `*Page.tsx`, services `*Service.ts`, componentes em `src/components`.

9) Quando não souber: pesquise
- Use `grep_search()` para localizar strings, imports e rotas antes de editar.
- Ler `README.md` raiz e `frontend-web/README.md` ou `backend/README.md` se existirem.

```typescript
// ❌ PROBLEMA:
// Menu item "Usuários" aparece 2x (Configurações e Gestão)

// ✅ PREVENÇÃO:
// 1. Ler menuConfig completo
read_file("menuConfig.ts", 1, 500)

// 2. Buscar todas ocorrências
grep_search("id.*usuarios|title.*'Usuários'")

// 3. Analisar TODAS as ocorrências encontradas
// 4. SÓ ENTÃO editar com contexto do bloco correto
```

#### Exemplo 3: Imports Duplicados

```typescript
// ❌ PROBLEMA COMUM:
import { EmpresasListPage } from './pages/EmpresasListPage';
// ... 200 linhas depois ...
import { EmpresasListPage } from './pages/EmpresasListPage'; // DUPLICOU!

// ✅ PREVENÇÃO:
grep_search("import.*EmpresasListPage") // ANTES de adicionar
// Se retornar resultado = JÁ EXISTE, não adicionar!
```

### 🔧 Comandos de Verificação Pós-Edição

```bash
# Após editar App.tsx (rotas):
grep_search("Route path=\"/nuclei/configuracoes/empresas\"")
# Espera: 1 ocorrência ✅
# Se >1: DUPLICAÇÃO ❌ - reverter!

# Após editar menuConfig.ts:
grep_search("id: 'configuracoes-usuarios'")
# Espera: 1 ocorrência ✅

# Após adicionar import:
grep_search("import.*GestaoUsuariosPage")
# Espera: 1 ocorrência ✅
```

### 📋 Checklist Final Anti-Duplicação

Antes de **qualquer** `replace_string_in_file`:

1. ✅ **LER**: `read_file()` para ver arquivo completo
2. ✅ **BUSCAR**: `grep_search()` para verificar se já existe
3. ✅ **CONTEXTUALIZAR**: Incluir 3-5 linhas antes/depois no `oldString`
4. ✅ **VALIDAR**: Confirmar que `oldString` é ÚNICO no arquivo
5. ✅ **TESTAR**: Após edição, `grep_search()` novamente para contar ocorrências
6. ✅ **CONFIRMAR**: Se >1 ocorrência do mesmo elemento = REVERTER e refazer!

### 🚨 Sinais de Alerta de Duplicação

**PARE imediatamente** se você notar:

- ❌ Mesma rota aparecendo 2x no resultado de `grep_search`
- ❌ Mesmo import aparecendo 2x
- ❌ Mesmo menu item com IDs diferentes
- ❌ Código idêntico em blocos diferentes
- ❌ `replace_string_in_file` retornou "success" mas linha ainda existe 2x

**AÇÃO**: Reverter com git, ler arquivo completo, refazer com mais contexto!

---

## 🚀 Templates Base para Novas Telas

### Regra Principal
❗ **NUNCA crie uma página do zero** - sempre copie um dos templates como base.

### 🎯 Escolha o Template Correto

#### Template SIMPLES (sem KPIs)
**Arquivo**: `frontend-web/src/pages/_TemplateSimplePage.tsx`

**Use quando:**
- ✅ Cadastros básicos (categorias, tags, departamentos)
- ✅ Páginas de configuração
- ✅ Listagens simples sem métricas
- ✅ Páginas auxiliares/secundárias
- ✅ CRUD puro

```powershell
cp frontend-web/src/pages/_TemplateSimplePage.tsx frontend-web/src/pages/NomeDaPagina.tsx
```

#### Template COM KPIs (com métricas)
**Arquivo**: `frontend-web/src/pages/_TemplateWithKPIsPage.tsx`

**Use quando:**
- ✅ Dashboards com métricas
- ✅ Páginas principais de módulos
- ✅ Telas com estatísticas importantes
- ✅ Gestão com indicadores (total, ativos, inativos, etc)
- ✅ Overview/resumo

```powershell
cp frontend-web/src/pages/_TemplateWithKPIsPage.tsx frontend-web/src/pages/NomeDaPagina.tsx
```

### Fluxo de Criação de Telas

1. **Escolher template** → SIMPLES ou COM KPIs (ver `TEMPLATES_GUIDE.md`)
2. **Copiar template** → Usar comando correto acima
3. **Buscar marcadores** → Todos os `[PERSONALIZAR]` no código
4. **Consultar cores** → Ver paleta em `DESIGN_GUIDELINES.md`
5. **Implementar service** → Conectar com backend
6. **Ajustar métricas** → Se usar template COM KPIs, definir cálculos
7. **Testar estados** → Loading, error, empty, success

## 📋 Padrões Obrigatórios

### Tema e Cores do Sistema
```typescript
// TEMA ÚNICO: Crevasse Professional (TODO O SISTEMA)
const CREVASSE_THEME = {
  primary: '#159A9C',      // Teal - Cor principal de TODAS as telas
  primaryHover: '#0F7B7D', // Hover do primary
  text: '#002333',         // Texto principal (títulos, conteúdo)
  textSecondary: '#B4BEC9',// Texto secundário
  background: '#FFFFFF',   // Fundo principal
  backgroundSecondary: '#DEEFE7', // Fundos secundários
  border: '#B4BEC9',       // Bordas padrão
  borderLight: '#DEEFE7'   // Bordas claras
};

// ❌ NÃO EXISTE: "cor do módulo Comercial", "cor do módulo Atendimento"
// ✅ EXISTE: Tema único Crevasse para TODO o sistema
// ✅ O que varia: Layout, estrutura, componentes (não cores do tema)
```

### Cores Contextuais (Apenas para Ícones/Status Específicos)
```typescript
// Usar APENAS para ícones contextuais e badges de status
const CONTEXTUAL_COLORS = {
  success: '#16A34A',   // Verde - sucesso/confirmação
  warning: '#FBBF24',   // Amarelo - alerta/atenção
  error: '#DC2626',     // Vermelho - erro/crítico
  info: '#3B82F6'       // Azul - informativo
};

// Exemplo correto:
// ✅ Ícone de status: bg-green-500/10 text-green-600 (sucesso)
// ✅ Botão principal: bg-[#159A9C] text-white (tema Crevasse)
```

### Estrutura de Página (OBRIGATÓRIA)

```tsx
// 1. Background SEMPRE gray-50
<div className="min-h-screen bg-gray-50">

  // 2. Header com BackToNucleus (OBRIGATÓRIO)
  <div className="bg-white border-b px-6 py-4">
    <BackToNucleus nucleusName="..." nucleusPath="..." />
  </div>

  // 3. Container principal
  <div className="p-6">
    <div className="max-w-7xl mx-auto">
      
      // 4. Header da página
      <div className="bg-white rounded-lg shadow-sm border mb-6">
        <h1 className="text-3xl font-bold text-[#002333] flex items-center">
          <IconeDoModulo className="h-8 w-8 mr-3 text-[#159A9C]" />
          Título
        </h1>
      </div>

      // 5. Dashboard Cards (KPI cards limpos, sem gradientes)
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Cards com padrão Funil de Vendas (ver seção KPI Cards) */}
      </div>

      // 6. Barra de busca/filtros
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
        <input className="focus:ring-2 focus:ring-[#159A9C]" />
      </div>

      // 7. Grid de cards ou lista
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Cards com hover:shadow-lg */}
      </div>
    </div>
  </div>
</div>
```

## 🚫 O Que NUNCA Fazer

- ❌ Criar página sem BackToNucleus
- ❌ Usar cores diferentes da paleta Crevasse
- ❌ Usar componentes shadcn/ui (Button, Card, etc.) - usar Tailwind puro
- ❌ Usar botões com cores diferentes de Crevasse para ações principais
- ❌ Esquecer estado vazio com call-to-action
- ❌ Esquecer loading states
- ❌ Grid sem responsividade (mobile-first)
- ❌ Modal sem botão de fechar (X)
- ❌ Input sem `focus:ring-2 focus:ring-[#159A9C]`
- ❌ Botões sem estados disabled e loading

## ✅ O Que SEMPRE Fazer

- ✅ Copiar `_TemplatePage.tsx` ou `_TemplateWithKPIsPage.tsx` como base
- ✅ Consultar `DESIGN_GUIDELINES.md`
- ✅ Usar cores da paleta Crevasse exata
- ✅ Botões primários sempre `bg-[#159A9C]` e `hover:bg-[#0F7B7D]`
- ✅ Implementar todos os estados (loading, error, empty, success)
- ✅ Adicionar hover effects nos cards (`hover:shadow-lg`)
- ✅ Usar grid responsivo (`grid-cols-1 md:grid-cols-2 lg:grid-cols-3`)
- ✅ Incluir BackToNucleus no header
- ✅ KPI cards limpos (sem gradientes coloridos - padrão Funil de Vendas)
- ✅ Badges de status padronizados
- ✅ Botões com transições suaves (`transition-colors`)

## 📦 Componentes Permitidos

### Importar do projeto:
```typescript
import { BackToNucleus } from '../components/navigation/BackToNucleus';
```

### Importar do Lucide React:
```typescript
import { 
  Users, FileText, DollarSign, Settings,
  Plus, Edit2, Trash2, Search, X,
  CheckCircle, AlertCircle, RefreshCw
} from 'lucide-react';
```

### ❌ NÃO importar:
```typescript
// NUNCA use estes imports:
import { Button } from '../components/ui/button';        // ❌
import { Card } from '../components/ui/card';            // ❌
import { Dialog } from '../components/ui/dialog';        // ❌
```

## 🔔 Componentes Padrão OBRIGATÓRIOS do Sistema

### ⚠️ REGRA CRÍTICA: SEMPRE usar componentes oficiais do sistema!

**NUNCA crie modais de confirmação ou toast customizados manualmente!**

O sistema **JÁ POSSUI** componentes padronizados e testados que **DEVEM** ser usados:

### 1️⃣ Modal de Confirmação (Deleção, Cancelamento, etc.)

**Componente:** `ConfirmationModal` + hook `useConfirmation`

**Quando usar:**
- ✅ Deletar registros (tickets, produtos, usuários, etc.)
- ✅ Cancelar ações irreversíveis
- ✅ Confirmar operações críticas
- ✅ Qualquer ação que precisa confirmação do usuário

**Como usar:**

```typescript
// 1. Importar no topo do arquivo
import { useConfirmation } from '../hooks/useConfirmation';
import { ConfirmationModal } from '../components/common/ConfirmationModal';

// 2. No componente, adicionar o hook
const { confirmationState, showConfirmation } = useConfirmation();

// 3. Na função de deleção/cancelamento
const handleDeletar = (item: ItemType, e: React.MouseEvent) => {
  e.stopPropagation();

  showConfirmation({
    title: 'Deletar Item',
    message: `Deseja realmente deletar "${item.nome}"?\n\nEsta ação não pode ser desfeita.`,
    confirmText: 'Sim, Deletar',
    cancelText: 'Cancelar',
    icon: 'danger', // 'danger' | 'warning' | 'info' | 'success'
    confirmButtonClass: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
    onConfirm: async () => {
      try {
        await api.delete(`/endpoint/${item.id}`);
        toast.success('Item deletado com sucesso!');
        await recarregarLista();
      } catch (err) {
        toast.error('Erro ao deletar item');
      }
    },
  });
};

// 4. No JSX, adicionar o modal (ANTES do </div> de fechamento)
<ConfirmationModal confirmationState={confirmationState} />
```

**Ícones disponíveis:**
- `'danger'` - XCircle vermelho (deleções, ações destrutivas)
- `'warning'` - AlertTriangle amarelo (avisos, atenção)
- `'info'` - Info azul (informações)
- `'success'` - CheckCircle verde (confirmações positivas)

### 2️⃣ Sistema de Notificações (Toast)

**Biblioteca:** `react-hot-toast` (JÁ instalada e configurada)

**Quando usar:**
- ✅ Feedback de sucesso (criação, edição, deleção)
- ✅ Mensagens de erro (falhas em requisições)
- ✅ Avisos e informações ao usuário
- ✅ Qualquer notificação temporária

**Como usar:**

```typescript
// 1. Importar no topo do arquivo
import toast from 'react-hot-toast';

// 2. Usar nas funções
try {
  await api.post('/endpoint', data);
  toast.success('Registro criado com sucesso!'); // Verde, 3s
} catch (err) {
  const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
  toast.error(`Erro: ${errorMessage}`); // Vermelho, 5s
}

// Outras variações:
toast.loading('Salvando...'); // Spinner azul
toast('Informação simples'); // Neutro
toast.error('Erro crítico', { duration: 5000 }); // Customizar duração
```

**Configuração automática:**
- ✅ Posição: top-right
- ✅ Duração padrão: 3000ms (sucesso), 5000ms (erro)
- ✅ Estilo: Alinhado com tema Crevasse
- ✅ Animações: Fade in/out suaves

### ❌ O QUE NUNCA FAZER:

```typescript
// ❌ ERRADO - Modal customizado manual
const [showDeleteModal, setShowDeleteModal] = useState(false);
<div className="fixed inset-0 bg-black..."> {/* NÃO FAÇA ISSO! */}

// ❌ ERRADO - Toast manual com createElement
const toastDiv = document.createElement('div');
toastDiv.innerHTML = `<span>Sucesso!</span>`; // NÃO FAÇA ISSO!

// ❌ ERRADO - window.confirm do navegador
if (window.confirm('Deletar?')) { /* NÃO FAÇA ISSO! */ }

// ❌ ERRADO - alert do navegador  
alert('Erro ao salvar'); // NÃO FAÇA ISSO!
```

### ✅ CHECKLIST para TODA página com operações CRUD:

- [ ] Importei `useConfirmation` e `ConfirmationModal`?
- [ ] Importei `toast` do `react-hot-toast`?
- [ ] Adicionei `<ConfirmationModal confirmationState={confirmationState} />` no JSX?
- [ ] Usei `showConfirmation()` para confirmações ao invés de `window.confirm()`?
- [ ] Usei `toast.success()` e `toast.error()` ao invés de toast manual?
- [ ] Removi qualquer `useState` de modal customizado (`showDeleteModal`, etc.)?
- [ ] Removi qualquer `document.createElement('div')` para toast manual?

### 📚 Referências de Código

**Exemplos de uso correto:**
- `frontend-web/src/pages/GestaoTicketsPage.tsx` - ConfirmationModal + toast
- `frontend-web/src/features/atendimento/omnichannel/ChatOmnichannel.tsx` - toast
- `frontend-web/src/pages/GestaoTemplatesPage.tsx` - toast
- `frontend-web/src/components/common/ConfirmationModal.tsx` - Implementação do modal
- `frontend-web/src/hooks/useConfirmation.ts` - Hook do modal

**Sempre procure por estes padrões antes de criar algo novo!**

## 🎯 Botões - Padrão do Sistema

**REGRA CRÍTICA**: Tema Crevasse (#159A9C) para TODOS os botões primários do sistema!

**TAMANHO PADRÃO**: `px-4 py-2` (compacto e profissional - seguir padrão da tela de Produtos)

```tsx
// ✅ Botão Primário - Ações principais (criar, salvar, confirmar)
<button className="px-4 py-2 bg-[#159A9C] text-white rounded-lg hover:bg-[#0F7B7D] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm font-medium">
  <Plus className="h-4 w-4" />
  Novo Item
</button>

// ✅ Botão Secundário - Ações secundárias (cancelar, voltar)
<button className="px-4 py-2 bg-white text-[#002333] border border-[#B4BEC9] rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium">
  Cancelar
</button>

// ✅ Botão de Perigo - Ações destrutivas (deletar, remover)
<button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium">
  <Trash2 className="h-4 w-4" />
  Deletar
</button>

// ✅ Botão Ícone - Ações rápidas (editar, fechar)
<button className="p-2 text-[#159A9C] hover:bg-[#159A9C]/10 rounded-lg transition-colors">
  <Edit2 className="h-5 w-5" />
</button>

// ✅ Botão Minimal/Ghost - Ações terciárias
<button className="px-4 py-2 text-[#159A9C] hover:bg-[#159A9C]/10 rounded-lg transition-colors text-sm font-medium">
  Ver Detalhes
</button>
```

**Regras de Uso**:
- ❌ NUNCA use cores diferentes para botões primários (sempre #159A9C)
- ❌ NUNCA use `px-6 py-3` (botões grandes demais - usar `px-4 py-2`)
- ✅ Use `text-sm font-medium` para consistência visual
- ✅ Ícones devem ser `h-4 w-4` em botões de texto
- ✅ Use `disabled:opacity-50 disabled:cursor-not-allowed` em botões que podem desabilitar
- ✅ Use `transition-colors` para animações suaves
- ✅ Botões de loading devem mostrar spinner e desabilitar

## 🎯 Badges Padronizados

```tsx
// Status Ativo
<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
  Ativo
</span>

// Status Pendente
<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
  Pendente
</span>

// Status Inativo
<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
  Inativo
</span>
```

## 📱 Responsividade (OBRIGATÓRIO)

```tsx
// Grid padrão
className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"

// Dashboard cards
className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"

// Botões no header
className="flex flex-col sm:flex-row gap-3"
```

## 🔍 Referências de Código

Sempre que precisar de exemplo, consulte ESTAS páginas (nesta ordem):

1. **Templates Base**: 
   - `frontend-web/src/pages/_TemplateWithKPIsPage.tsx` (com KPI cards)
   - `frontend-web/src/pages/_TemplateSimplePage.tsx` (sem KPI cards)
2. **Funil de Vendas**: `frontend-web/src/pages/FunilVendas.jsx` (padrão de KPI cards)
3. **Comercial**: `frontend-web/src/pages/CotacaoPage.tsx`
4. **Atendimento**: `frontend-web/src/pages/GestaoEquipesPage.tsx`
5. **Guidelines**: `frontend-web/DESIGN_GUIDELINES.md`

## 📝 Checklist Automático

Quando criar uma página, SEMPRE verifique:

- [ ] Copiou `_TemplatePage.tsx` ou `_TemplateWithKPIsPage.tsx`?
- [ ] Substituiu todos os `[PERSONALIZAR]`?
- [ ] Cor do módulo correta?
- [ ] BackToNucleus implementado?
- [ ] KPI cards limpos (sem gradientes) se aplicável?
- [ ] Barra de busca com `focus:ring-2`?
- [ ] Grid responsivo?
- [ ] Estado vazio com CTA?
- [ ] Loading states?
- [ ] Error handling?
- [ ] Badges padronizados?
- [ ] Hover effects nos cards?
- [ ] Modal com botão X?
- [ ] TypeScript types definidos?
- [ ] Registrou rota em App.tsx?
- [ ] Adicionou no menuConfig.ts?

## 🎨 KPI Cards - Padrão Oficial (Funil de Vendas)

**IMPORTANTE**: KPI cards devem ser LIMPOS, sem gradientes coloridos.

```tsx
// ✅ CORRETO - Padrão Funil de Vendas
<div className="p-5 rounded-2xl border border-[#DEEFE7] shadow-sm text-[#002333] bg-[#FFFFFF]">
  <div className="flex items-start justify-between">
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-[#002333]/60">
        Label da Métrica
      </p>
      <p className="mt-2 text-3xl font-bold text-[#002333]">
        {valor}
      </p>
      <p className="mt-3 text-sm text-[#002333]/70">
        Descrição ou contexto da métrica.
      </p>
    </div>
    <div className="h-12 w-12 rounded-2xl bg-[#159A9C]/10 flex items-center justify-center shadow-sm">
      <IconeMetrica className="h-6 w-6 text-[#159A9C]" />
    </div>
  </div>
</div>

// ❌ ERRADO - NÃO usar gradientes coloridos
<div className="p-4 bg-gradient-to-br from-blue-100 to-blue-200">  // ❌ NÃO!
```

**Variações de ícone (quando necessário):**
- Padrão: `bg-[#159A9C]/10` + `text-[#159A9C]`
- Sucesso: `bg-green-500/10` + `text-green-600`
- Alerta: `bg-yellow-500/10` + `text-yellow-600`
- Erro: `bg-red-500/10` + `text-red-600`

## 🚨 Error Handling Padrão

```typescript
try {
  // operação
} catch (err: unknown) {
  console.error('Erro:', err);
  const responseMessage = (err as any)?.response?.data?.message;
  const normalizedMessage = Array.isArray(responseMessage)
    ? responseMessage.join('. ')
    : responseMessage;
  const fallbackMessage = err instanceof Error ? err.message : undefined;
  setError(normalizedMessage || fallbackMessage || 'Erro genérico');
}
```

---

## 📛 Nomenclatura e Convenções (CRITICAL)

### Padrões de Nomenclatura

#### Backend (NestJS + TypeORM)

```typescript
// Entity - singular, PascalCase
equipe.entity.ts → export class Equipe

// DTO - sufixo dto, kebab-case no arquivo
create-equipe.dto.ts → export class CreateEquipeDto
update-equipe.dto.ts → export class UpdateEquipeDto

// Service - singular, kebab-case no arquivo
equipe.service.ts → export class EquipeService

// Controller - singular, kebab-case no arquivo
equipe.controller.ts → export class EquipeController
  @Post('/equipes')           // ← rota no plural
  @Get('/equipes/:id')        // ← rota no plural
  
// Module - singular, kebab-case no arquivo
equipe.module.ts → export class EquipeModule
```

#### Frontend (React + TypeScript)

```typescript
// Service - singular, camelCase no arquivo
equipeService.ts → export const equipeService

// Page - sufixo Page, PascalCase
GestaoEquipesPage.tsx → export default GestaoEquipesPage

// Component - PascalCase
BackToNucleus.tsx → export const BackToNucleus

// Interface - PascalCase, prefixo I opcional
interface Equipe { ... }
interface CreateEquipeDto { ... }
```

### Consistência de Nomes Entre Backend e Frontend

**REGRA**: O nome da entidade deve ser CONSISTENTE em todo o sistema!

```typescript
// ✅ CORRETO - mesmo nome em todos os lugares
Backend:
  - equipe.entity.ts → class Equipe
  - equipe.service.ts → EquipeService
  - equipe.controller.ts → @Post('/equipes')
  
Frontend:
  - equipeService.ts → interface Equipe
  - GestaoEquipesPage.tsx → items: Equipe[]
  
// ❌ ERRADO - nomes diferentes confundem
Backend: class Team
Frontend: interface Equipe  // 🚫 NÃO FAÇA ISSO
```

### Rotas e Endpoints

```typescript
// SEMPRE plural nas rotas HTTP
POST   /equipes           // ✅ Criar
GET    /equipes           // ✅ Listar todos
GET    /equipes/:id       // ✅ Buscar um
PUT    /equipes/:id       // ✅ Atualizar
DELETE /equipes/:id       // ✅ Deletar
PATCH  /equipes/:id/...   // ✅ Ação específica

// ❌ NÃO use singular nas rotas
POST /equipe              // 🚫 ERRADO
```

### Estrutura de Módulos

```
backend/src/modules/
├── triagem/              # Nome do módulo (singular ou plural conforme domínio)
│   ├── entities/
│   │   ├── equipe.entity.ts
│   │   └── atendente.entity.ts
│   ├── dto/
│   │   ├── create-equipe.dto.ts
│   │   └── update-equipe.dto.ts
│   ├── services/
│   │   └── equipe.service.ts
│   ├── controllers/
│   │   └── equipe.controller.ts
│   └── triagem.module.ts
```

### Prefixos e Sufixos Obrigatórios

```typescript
// Backend
*.entity.ts    → Entidades do TypeORM
*.dto.ts       → Data Transfer Objects
*.service.ts   → Services com lógica de negócio
*.controller.ts → Controllers com rotas HTTP
*.module.ts    → Módulos do NestJS

// Frontend
*Page.tsx      → Páginas completas
*Service.ts    → Services de API
*Config.ts     → Arquivos de configuração
```

---

## 🔒 ARQUITETURA MULTI-TENANT (CRÍTICA)

### ⚠️ REGRA FUNDAMENTAL: SISTEMA É MULTI-TENANT COM ISOLAMENTO POR EMPRESA

ConectCRM é um sistema **multi-tenant SaaS** onde cada empresa (tenant) tem isolamento **total** de dados.

**TODA entity que pertence a uma empresa DEVE ter isolamento multi-tenant implementado.**

### 🚨 3-Layer Security Architecture (OBRIGATÓRIA)

```
┌─────────────────────────────────────────────────────────────┐
│ Layer 1: JWT Authentication                                │
│ → Token contém empresa_id do usuário autenticado          │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ Layer 2: TenantContextMiddleware (NestJS)                 │
│ → Extrai empresa_id do JWT                                │
│ → Chama set_current_tenant(empresa_id) no PostgreSQL      │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ Layer 3: Row Level Security (PostgreSQL)                  │
│ → TODAS as queries filtram por empresa_id automaticamente │
│ → Política: tenant_isolation_<tabela>                     │
└─────────────────────────────────────────────────────────────┘
```

### ✅ Quando Criar uma Nova Entity

**SEMPRE adicione empresa_id + RLS se a entity for:**
- Dados de clientes/usuários de uma empresa específica
- Registros de negócio (vendas, produtos, tickets, faturas)
- Configurações específicas de empresa
- Qualquer dado que não deve ser compartilhado entre empresas

#### ✅ Template de Entity Multi-Tenant:

```typescript
import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Empresa } from '../../empresas/entities/empresa.entity';

@Entity('minha_tabela')
export class MinhaEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // ⚡ OBRIGATÓRIO: Campo empresa_id para multi-tenant
  @Column({ type: 'uuid', name: 'empresa_id' })
  empresaId: string;

  // ⚡ OBRIGATÓRIO: Relação com Empresa
  @ManyToOne(() => Empresa)
  @JoinColumn({ name: 'empresa_id' })
  empresa: Empresa;

  @Column({ length: 100 })
  nome: string;

  // ... demais campos
}
```

#### ❌ NUNCA faça isso:

```typescript
// ❌ ERRADO - Entity sem empresa_id (dados vazam!)
@Entity('produtos')
export class Produto {
  @PrimaryGeneratedColumn('uuid')
  id: string;
  
  @Column()
  nome: string;
  // ❌ Falta empresa_id! Empresas verão produtos umas das outras!
}
```

### 🚨 Quando Criar uma Migration (OBRIGATÓRIO)

**SEMPRE habilite RLS** ao criar tabela com `empresa_id`:

```typescript
import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateMinhaTabela1234567890 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Criar tabela
    await queryRunner.query(`
      CREATE TABLE minha_tabela (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        empresa_id UUID NOT NULL REFERENCES empresas(id),
        nome VARCHAR(100) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // 2. ⚡ OBRIGATÓRIO: Habilitar RLS
    await queryRunner.query(`
      ALTER TABLE minha_tabela ENABLE ROW LEVEL SECURITY;
    `);

    // 3. ⚡ OBRIGATÓRIO: Criar política de isolamento
    await queryRunner.query(`
      CREATE POLICY tenant_isolation_minha_tabela ON minha_tabela
      FOR ALL USING (empresa_id = get_current_tenant());
    `);

    // 4. Criar índice para performance
    await queryRunner.query(`
      CREATE INDEX idx_minha_tabela_empresa_id ON minha_tabela(empresa_id);
    `);

    console.log('✅ Tabela criada com RLS habilitado');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP POLICY IF EXISTS tenant_isolation_minha_tabela ON minha_tabela;`);
    await queryRunner.query(`DROP TABLE minha_tabela;`);
  }
}
```

### 🔍 Verificar se Precisa de empresa_id

**✅ PRECISA de empresa_id:**
- ✅ Clientes, contatos, leads
- ✅ Produtos, propostas, cotações, contratos
- ✅ Tickets, demandas, atendimentos
- ✅ Faturas, pagamentos, transações
- ✅ Equipes, departamentos, usuários
- ✅ Configurações específicas da empresa
- ✅ Logs, auditorias, atividades

**❌ NÃO precisa de empresa_id:**
- ❌ Tabela `empresas` (é o tenant raiz)
- ❌ `planos`, `modulos_sistema` (configurações globais)
- ❌ `password_reset_tokens` (temporário, expira)
- ❌ Tabelas de referência compartilhadas (países, moedas)

### 📊 Tabelas JÁ Protegidas por RLS (Sprint 1 - Completo):

```
✅ clientes               ✅ user_activities
✅ atendentes             ✅ atendimento_tickets
✅ equipes                ✅ audit_logs
✅ departamentos          ✅ empresas (política especial)
✅ fluxos_triagem
✅ sessoes_triagem
✅ atendimento_demandas
✅ fornecedores
✅ contas_pagar
✅ canais
✅ nucleos_atendimento
✅ triagem_logs
```

### ⚠️ IMPORTANTE: Como TenantContextMiddleware Funciona

O middleware **já está ativo** no sistema:

```typescript
// backend/src/common/middleware/tenant-context.middleware.ts
@Injectable()
export class TenantContextMiddleware implements NestMiddleware {
  async use(req: any, res: any, next: () => void) {
    const user = req.user; // Vem do JwtAuthGuard
    
    if (user?.empresa_id) {
      // ⚡ Define contexto no PostgreSQL
      await queryRunner.query('SELECT set_current_tenant($1)', [user.empresa_id]);
      
      // Agora TODAS as queries filtram por empresa_id automaticamente!
    }
    
    next();
  }
}
```

**O que isso significa:**
- ✅ Você **não precisa** adicionar `where: { empresa_id }` em queries
- ✅ RLS filtra automaticamente no banco de dados
- ✅ É impossível (via SQL) acessar dados de outra empresa
- ⚠️ **MAS**: Se a tabela não tiver RLS, o filtro não funciona!

### 🧪 Como Testar Isolamento Multi-Tenant

```typescript
// Teste E2E - Verificar que Empresa A não vê dados da Empresa B
describe('Multi-Tenant Isolation', () => {
  it('Empresa A não deve ver produtos da Empresa B', async () => {
    // Login como Empresa A
    const tokenA = await loginAsEmpresa('empresa-a-id');
    
    // Criar produto para Empresa A
    const produtoA = await request(app.getHttpServer())
      .post('/produtos')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ nome: 'Produto A' });
    
    // Login como Empresa B
    const tokenB = await loginAsEmpresa('empresa-b-id');
    
    // Tentar listar produtos como Empresa B
    const response = await request(app.getHttpServer())
      .get('/produtos')
      .set('Authorization', `Bearer ${tokenB}`);
    
    // ✅ Empresa B não deve ver Produto A
    expect(response.body).not.toContainEqual(
      expect.objectContaining({ id: produtoA.body.id })
    );
  });
});
```

### 📝 Checklist Multi-Tenant (OBRIGATÓRIO)

Ao criar qualquer feature nova:

- [ ] Entity tem campo `empresa_id: string` (UUID)?
- [ ] Entity tem relação `@ManyToOne(() => Empresa)`?
- [ ] Migration habilita `ROW LEVEL SECURITY`?
- [ ] Migration cria política `tenant_isolation_*`?
- [ ] Controller usa `@UseGuards(JwtAuthGuard)`?
- [ ] Índice criado em `empresa_id` para performance?
- [ ] Testado isolamento (Empresa A não vê dados de B)?

### 🚨 O Que NUNCA Fazer

```typescript
// ❌ NUNCA: Desabilitar RLS em tabela multi-tenant
ALTER TABLE produtos DISABLE ROW LEVEL SECURITY; // 🚫 PROIBIDO!

// ❌ NUNCA: Consultar dados sem JwtAuthGuard
@Get('/produtos')  // ❌ Falta @UseGuards(JwtAuthGuard)
async listar() { ... }

// ❌ NUNCA: Criar entity de negócio sem empresa_id
@Entity('vendas')
export class Venda {
  id: string;
  valor: number;
  // ❌ Falta empresa_id! Vazamento de dados!
}

// ❌ NUNCA: Fazer query raw ignorando RLS
await queryRunner.query(`
  SELECT * FROM produtos WHERE id = $1
  -- ❌ Não usa get_current_tenant(), pode vazar dados!
`, [id]);
```

### 💡 Dicas Importantes

1. **RLS é sua última linha de defesa**: Mesmo se houver bug no código, RLS impede vazamento.

2. **Performance**: RLS adiciona filtro `WHERE empresa_id = X` automaticamente. Sempre crie índice!

3. **Migrations antigas**: Se encontrar entity com `empresa_id` sem RLS, **abra issue** imediatamente.

4. **Testes**: Sempre teste isolamento entre empresas em features críticas.

5. **Code Review**: Verifique se todo PR com nova entity tem RLS configurado.

### 🔗 Referências

- **Middleware**: `backend/src/common/middleware/tenant-context.middleware.ts`
- **Migration exemplo**: `backend/src/migrations/1730476887000-EnableRowLevelSecurity.ts`
- **Documentação completa**: `SPRINT1_100_COMPLETO.md`
- **Roadmap**: `docs/handbook/ROADMAP_MULTI_TENANT_PRODUCAO.md`

---

## 🎯 Este Arquivo é Lido Automaticamente

O GitHub Copilot lê este arquivo **automaticamente** quando você:
- Solicita criação de código
- Pede sugestões
- Usa chat do Copilot no VS Code

**Não precisa mencionar** - basta começar a codificar que o Copilot já seguirá estas regras!

---

## 🧠 Gestão de Contexto e Continuidade (IMPORTANTE)

### ⚠️ Problemas Comuns de IA

Agentes de IA podem:
- ❌ Esquecer qual etapa estava trabalhando
- ❌ Perder contexto entre requisições
- ❌ Repetir trabalho já feito
- ❌ Ignorar arquivos importantes criados anteriormente
- ❌ Não conectar backend com frontend

### ✅ SEMPRE Faça Isso Antes de Começar

Quando receber uma tarefa, **PRIMEIRO** faça uma checagem de contexto:

1. **Leia arquivos de progresso/documentação**:
   ```
   - Procure por arquivos .md na raiz do projeto
   - Leia CONCLUSAO_*, CONSOLIDACAO_*, CHECKLIST_*, README_*
   - Verifique se há documentação sobre a feature atual
   ```

2. **Verifique o que JÁ existe**:
   ```bash
   # Backend - procure por services, controllers, entities
   grep_search "nome-da-feature"
   
   # Frontend - procure por pages, components, services
   file_search "**/*NomeDaFeature*"
   ```

3. **Leia código relacionado antes de modificar**:
   ```
   - Sempre leia o arquivo COMPLETO antes de editar
   - Procure por imports e dependências
   - Verifique se há TODOs ou comentários importantes
   ```

4. **Confirme o estado atual**:
   - O backend já tem a rota?
   - O frontend já tem o service?
   - A entidade existe no banco?
   - A migração rodou?

### 📝 Fluxo Completo de Feature (SIGA NESTA ORDEM)

Quando criar uma feature completa (ex: "Gestão de Equipes"):

#### 1️⃣ Backend PRIMEIRO
```
[ ] 1.1. Criar Entity (TypeORM) em backend/src/modules/*/entities/
[ ] 1.2. Criar DTO (validações) em backend/src/modules/*/dto/
[ ] 1.3. Criar Service (lógica) em backend/src/modules/*/services/
[ ] 1.4. Criar Controller (rotas) em backend/src/modules/*/controllers/
[ ] 1.5. Registrar no Module (providers + controllers)
[ ] 1.6. Registrar entity em backend/src/config/database.config.ts
[ ] 1.7. Criar migration: npm run migration:generate
[ ] 1.8. Rodar migration: npm run migration:run
[ ] 1.9. TESTAR endpoint no Postman/Thunder Client
```

#### 2️⃣ Frontend DEPOIS
```
[ ] 2.1. Criar Service em frontend-web/src/services/
[ ] 2.2. Criar interfaces TypeScript no service
[ ] 2.3. COPIAR _TemplatePage.tsx para nova página
[ ] 2.4. Substituir todos [PERSONALIZAR]
[ ] 2.5. Conectar com service do item 2.1
[ ] 2.6. Registrar rota em App.tsx
[ ] 2.7. Adicionar no menuConfig.ts
[ ] 2.8. TESTAR na UI (criar, listar, editar, deletar)
```

#### 3️⃣ Validação Final
```
[ ] 3.1. Testar fluxo completo end-to-end
[ ] 3.2. Verificar estados: loading, error, empty, success
[ ] 3.3. Testar responsividade (mobile, tablet, desktop)
[ ] 3.4. Verificar console (sem erros)
[ ] 3.5. Documentar em arquivo CONSOLIDACAO_*.md
```

### 🔗 Conectando Backend e Frontend

**REGRA CRÍTICA**: O service do frontend DEVE espelhar as rotas do backend!

```typescript
// ❌ ERRADO - service desconectado do backend
export const criarEquipe = async (data: any) => {
  return api.post('/api/wrong-endpoint', data); // Endpoint não existe!
}

// ✅ CORRETO - verificar rota no Controller primeiro
// 1. Ler backend/src/modules/triagem/controllers/equipe.controller.ts
// 2. Ver que a rota é POST /equipes (sem /api/)
// 3. Espelhar no frontend:

export const criarEquipe = async (data: CreateEquipeDto) => {
  return api.post('/equipes', data);
}
```

### 📂 Estrutura de Arquivos - Espelho Backend/Frontend

```
backend/src/modules/triagem/
├── entities/
│   └── equipe.entity.ts          ← Define campos do banco
├── dto/
│   └── create-equipe.dto.ts      ← Define validações (class-validator)
├── services/
│   └── equipe.service.ts         ← Lógica de negócio
└── controllers/
    └── equipe.controller.ts      ← Rotas HTTP
    
frontend-web/src/
├── services/
│   └── equipeService.ts          ← ⚡ DEVE espelhar o controller
└── pages/
    └── GestaoEquipesPage.tsx     ← ⚡ DEVE usar o service
```

### 🎯 Checklist de "Não Perder Contexto"

Antes de responder ao usuário, SEMPRE verifique:

- [ ] Li todos os arquivos .md relacionados à tarefa atual?
- [ ] Procurei no código se a feature já existe parcialmente?
- [ ] Entendi se estou no backend ou frontend?
- [ ] Verifiquei se as entidades estão registradas?
- [ ] Confirmei que a migração rodou?
- [ ] Li o controller para saber as rotas exatas?
- [ ] Vi se o service frontend espelha o backend?
- [ ] Chequei se a página já está registrada em App.tsx?
- [ ] Verifiquei se está no menuConfig.ts?
- [ ] Testei antes de dizer "concluído"?

### 🚨 Sinais de que Você Perdeu Contexto

Se você está fazendo isso, **PARE** e releia o contexto:

- ❌ Criando rota que já existe
- ❌ Modificando arquivo sem ler ele primeiro
- ❌ Dizendo "agora vou criar X" quando X já existe
- ❌ Criando service frontend sem verificar o controller backend
- ❌ Pulando etapas (ex: criar página sem ter o service)
- ❌ Não mencionando arquivos que você criou 2 mensagens atrás

### 💡 Dicas para Manter Contexto

1. **Sempre mencione o que já foi feito**:
   ```
   ✅ "Vejo que já criamos a entity Equipe e o controller. 
       Agora vou criar o service frontend que se conecta à rota POST /equipes"
   ```

2. **Referencie arquivos anteriores**:
   ```
   ✅ "No arquivo equipe.controller.ts que criamos, a rota é GET /equipes/:id.
       Vou espelhar isso no equipeService.ts"
   ```

3. **Use grep/file_search antes de criar**:
   ```
   ✅ "Deixe-me verificar se já existe algo relacionado a 'equipe'..."
   ```

4. **Confirme estado antes de prosseguir**:
   ```
   ✅ "Antes de criar a página, vou confirmar que:
       - Backend tem a rota ✓
       - Service frontend existe ✓
       - Migration rodou ✓"
   ```

### 📋 Template de Resposta Ideal

Quando receber uma tarefa, estruture assim:

```markdown
## 🔍 Checagem de Contexto

- [x] Li documentação relacionada
- [x] Verifiquei código existente
- [x] Identifiquei dependências

## 📊 Estado Atual

- Backend: [controller existe? migration rodou?]
- Frontend: [service existe? página criada?]
- Integração: [testado? funcionando?]

## 🎯 Próximos Passos

1. [Etapa específica com arquivo exato]
2. [Etapa seguinte com validação]
3. [Teste final]

## 🚀 Executando...

[Aqui vão as tool calls e código]
```

### 🔄 Persistência de Progresso

Ao completar uma etapa grande, **sempre** crie/atualize um arquivo .md:

```markdown
# CONSOLIDACAO_NOME_FEATURE.md

## ✅ Concluído

- [x] Backend - Entity, DTO, Service, Controller
- [x] Frontend - Service, Página, Rota, Menu
- [x] Testes - Postman (backend) e UI (frontend)

## 📂 Arquivos Criados

### Backend
- `backend/src/modules/triagem/entities/equipe.entity.ts`
- `backend/src/modules/triagem/controllers/equipe.controller.ts`
- ...

### Frontend
- `frontend-web/src/services/equipeService.ts`
- `frontend-web/src/pages/GestaoEquipesPage.tsx`
- ...

## 🔗 Endpoints e Integrações

- POST /equipes → equipeService.criar()
- GET /equipes → equipeService.listar()
- ...

## 🧪 Como Testar

1. Backend: `npm run start:dev`
2. Frontend: `npm start`
3. Acessar: http://localhost:3000/gestao/equipes
```

---

## 🔧 Debugging e Troubleshooting

### Erros Comuns e Soluções

#### 1. EntityMetadataNotFoundError
```
❌ Erro: "No metadata for 'Equipe' was found"

✅ Solução:
1. Verificar se entity está em backend/src/config/database.config.ts
2. Adicionar import: import { Equipe } from '../modules/triagem/entities/equipe.entity';
3. Adicionar no array entities: [..., Equipe]
4. Reiniciar backend
```

#### 2. Erro 404 - Rota não encontrada
```
❌ Erro: POST /equipes retorna 404

✅ Solução:
1. Verificar se controller está registrado no module
2. Verificar se module está importado no app.module.ts
3. Verificar decorador @Controller() no controller
4. Verificar prefixo global (se houver) em main.ts
```

#### 3. CORS Error no Frontend
```
❌ Erro: "blocked by CORS policy"

✅ Solução:
1. Verificar main.ts no backend:
   app.enableCors({ origin: 'http://localhost:3000' });
2. Verificar se backend está rodando
3. Verificar URL base no axios (frontend-web/src/services/api.ts)
```

#### 4. Migration Error
```
❌ Erro: "relation already exists"

✅ Solução:
1. Verificar migrations já rodadas: npm run migration:show
2. Reverter última: npm run migration:revert
3. Ou dropar tabela manualmente e rodar novamente
```

#### 5. TypeScript Type Error
```
❌ Erro: "Type 'Equipe' is not assignable to type..."

✅ Solução:
1. Verificar se interfaces backend e frontend são IGUAIS
2. Atualizar interfaces no service frontend
3. Executar: npm run build para ver erros completos
```

### Comandos de Diagnóstico

```powershell
# Backend - verificar se está rodando
Get-Process -Name node | Select-Object Id, ProcessName, StartTime

# Backend - ver logs em tempo real
cd backend
npm run start:dev

# Frontend - verificar build
cd frontend-web
npm run build

# Banco de dados - verificar conexão
# No backend, adicionar log temporário em database.config.ts

# Verificar portas em uso
netstat -ano | findstr :3001  # Backend
netstat -ano | findstr :3000  # Frontend

# Limpar node_modules e reinstalar
cd backend
Remove-Item -Recurse -Force node_modules
npm install

cd frontend-web
Remove-Item -Recurse -Force node_modules
npm install
```

### Logs e Debugging

```typescript
// Backend - adicionar logs temporários
console.log('🔍 [Controller] Recebido:', data);
console.log('🔍 [Service] Processando:', id);
console.log('✅ [Service] Resultado:', result);

// Frontend - debugar estado
console.log('🎨 [State] Items:', items);
console.log('🎨 [API] Response:', response.data);

// IMPORTANTE: Remover logs antes de commit!
```

### Quando Algo Não Funciona

**ANTES** de criar novo código, **SEMPRE**:

1. ✅ Ler o erro COMPLETO no console
2. ✅ Verificar se backend está rodando (porta 3001)
3. ✅ Verificar se frontend está rodando (porta 3000)
4. ✅ Abrir DevTools (F12) e ver Network tab
5. ✅ Verificar se migration rodou com sucesso
6. ✅ Testar endpoint direto (Postman/Thunder Client)
7. ✅ Verificar se entity está registrada
8. ✅ Verificar se module está importado

**NÃO** assuma que algo está certo - **SEMPRE VERIFIQUE**!

---

## 🔄 Execução de Comandos e Gerenciamento de Processos

### ⚠️ PROBLEMA CRÍTICO: Matar Processos Acidentalmente

**NUNCA** execute comandos que matam processos em execução sem intenção!

#### ❌ ERROS COMUNS:

```bash
# 1. ❌ ERRADO - Executar comando de servidor em terminal já ocupado
# Isso MATA o processo anterior!
run_in_terminal("npm run start:dev")  # Mata o backend que já estava rodando!

# 2. ❌ ERRADO - Tentar múltiplas vezes até acertar
run_in_terminal("cd backend && npm start")      # Erro
run_in_terminal("cd backend && npm run dev")    # Erro
run_in_terminal("cd backend && npm run start:dev")  # Acerta, mas já tentou 3x!

# 3. ❌ ERRADO - Executar frontend e backend no mesmo terminal
run_in_terminal("cd backend && npm run start:dev")
run_in_terminal("cd frontend-web && npm start")  # MATA o backend!
```

### ✅ SOLUÇÕES CORRETAS:

#### 1. **SEMPRE Usar `isBackground: true` para Servidores**

```typescript
// ✅ CORRETO - Servidor backend (processo contínuo)
run_in_terminal({
  command: "cd backend && npm run start:dev",
  explanation: "Iniciando servidor backend na porta 3001",
  isBackground: true  // ⚡ OBRIGATÓRIO para servidores!
});

// ✅ CORRETO - Servidor frontend (processo contínuo)
run_in_terminal({
  command: "cd frontend-web && npm start",
  explanation: "Iniciando servidor frontend na porta 3000",
  isBackground: true  // ⚡ OBRIGATÓRIO para servidores!
});
```

#### 2. **Verificar ANTES de Executar**

```typescript
// ✅ CORRETO - Verificar se já está rodando primeiro
// 1. Verificar processos node
run_in_terminal({
  command: "Get-Process -Name node -ErrorAction SilentlyContinue | Select-Object Id, ProcessName, StartTime | Format-Table -AutoSize",
  explanation: "Verificando se há processos Node.js rodando",
  isBackground: false
});

// 2. SE não estiver rodando, ENTÃO iniciar
// 3. SE já estiver rodando, apenas informar ao usuário
```

#### 3. **Usar Tasks para Processos Recorrentes**

```typescript
// ✅ MELHOR AINDA - Usar tasks do VS Code
// Processos que rodam frequentemente devem usar tasks!

// Backend
run_task({
  id: "shell: Start Backend (Nest 3001)",
  workspaceFolder: "c:\\Projetos\\conectcrm"
});

// Frontend
run_task({
  id: "shell: Start Frontend (React 3000)", 
  workspaceFolder: "c:\\Projetos\\conectcrm"
});
```

### 📋 Regras de Execução de Comandos

#### Regra 1: Identifique o Tipo de Comando

| Tipo | isBackground | Exemplo |
|------|--------------|---------|
| **Servidor/Watch** | `true` | `npm run start:dev`, `npm start`, `npm run dev` |
| **Build** | `false` | `npm run build`, `npm run migration:generate` |
| **Test único** | `false` | `npm test`, `npm run migration:run` |
| **Consulta** | `false` | `git status`, `Get-Process`, `ls` |

#### Regra 2: Comando Correto por Contexto

```bash
# Backend (NestJS)
✅ npm run start:dev      # Desenvolvimento (watch mode)
✅ npm run build          # Compilar TypeScript
✅ npm run start:prod     # Produção
❌ npm start              # NÃO existe no backend!
❌ npm run dev            # NÃO existe no backend!

# Frontend (React)
✅ npm start              # Desenvolvimento
✅ npm run build          # Build para produção
❌ npm run start:dev      # NÃO existe no frontend!
❌ npm run dev            # NÃO existe no frontend!

# Migrations
✅ npm run migration:generate -- src/migrations/NomeMigration
✅ npm run migration:run
✅ npm run migration:revert
✅ npm run migration:show
```

#### Regra 3: Fluxo de Verificação → Execução

```typescript
// ✅ FLUXO CORRETO

// 1. VERIFICAR se já está rodando
const verificacao = await run_in_terminal({
  command: "Get-Process -Name node -ErrorAction SilentlyContinue",
  explanation: "Verificando processos Node.js",
  isBackground: false
});

// 2. ANALISAR resultado (se retornou processos)

// 3a. SE JÁ ESTÁ RODANDO:
//     → Informar ao usuário
//     → NÃO executar novamente

// 3b. SE NÃO ESTÁ RODANDO:
//     → Executar com isBackground: true
//     → Aguardar alguns segundos
//     → Verificar se iniciou com sucesso
```

### 🎯 Templates de Execução

#### Template 1: Iniciar Backend

```typescript
// 1. Verificar se já está rodando
const backendRodando = await run_in_terminal({
  command: "Get-Process -Name node | Where-Object { $_.MainWindowTitle -like '*backend*' }",
  explanation: "Verificando se backend já está rodando",
  isBackground: false
});

// 2. Se não estiver, iniciar
if (!backendRodando || backendRodando.includes("não encontrado")) {
  await run_in_terminal({
    command: "cd backend && npm run start:dev",
    explanation: "Iniciando servidor backend NestJS na porta 3001",
    isBackground: true  // ⚡ CRÍTICO!
  });
  
  // 3. Aguardar inicialização
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  // 4. Verificar se iniciou
  const verificacao = await run_in_terminal({
    command: "curl http://localhost:3001",
    explanation: "Verificando se backend respondeu",
    isBackground: false
  });
}
```

#### Template 2: Iniciar Frontend

```typescript
// 1. Verificar se já está rodando
const frontendRodando = await run_in_terminal({
  command: "netstat -ano | findstr :3000",
  explanation: "Verificando se porta 3000 está em uso",
  isBackground: false
});

// 2. Se não estiver, iniciar
if (!frontendRodando || frontendRodando.includes("não encontrado")) {
  await run_in_terminal({
    command: "cd frontend-web && npm start",
    explanation: "Iniciando servidor React na porta 3000",
    isBackground: true  // ⚡ CRÍTICO!
  });
}
```

#### Template 3: Executar Migration

```typescript
// ❌ NÃO usar isBackground para migrations!
await run_in_terminal({
  command: "cd backend && npm run migration:run",
  explanation: "Executando migrations pendentes no banco de dados",
  isBackground: false  // ⚡ Migration precisa completar!
});

// ✅ Aguardar resultado antes de prosseguir
```

### 🚨 Sinais de Que Você Está Fazendo Errado

**PARE** se você está fazendo isso:

- ❌ Executando `npm run start:dev` com `isBackground: false`
- ❌ Tentando múltiplos comandos até acertar (npm start, npm run dev, npm run start:dev)
- ❌ Não verificando se processo já está rodando antes
- ❌ Executando servidor no mesmo terminal de outro servidor
- ❌ Não usando tasks para processos recorrentes
- ❌ Assumindo que comando vai funcionar sem verificar package.json primeiro

### ✅ Faça ISSO Em Vez Disso

```typescript
// 1. LEIA package.json PRIMEIRO
const packageJson = await read_file({
  filePath: "backend/package.json",
  startLine: 5,
  endLine: 20  // Scripts geralmente estão aqui
});

// 2. IDENTIFIQUE o comando correto
// Backend: "start:dev": "nest start --watch"
// Frontend: "start": "react-scripts start"

// 3. VERIFIQUE se já está rodando
const processos = await run_in_terminal({
  command: "Get-Process -Name node",
  isBackground: false
});

// 4. SE não estiver, EXECUTE com isBackground: true
// 5. SE já estiver, INFORME ao usuário (não mate o processo!)
```

### 📊 Checklist de Execução de Comandos

Antes de executar QUALQUER comando de servidor:

- [ ] Li o package.json para saber o comando EXATO?
- [ ] Verifiquei se processo já está rodando?
- [ ] Usei `isBackground: true` para servidores?
- [ ] Esperei alguns segundos após iniciar?
- [ ] Verifiquei se o servidor respondeu?
- [ ] Informei ao usuário o que está acontecendo?
- [ ] Tenho certeza que não vou matar processo existente?

### 🎓 Exemplo Completo: Iniciar Backend e Frontend

```typescript
// ✅ EXEMPLO COMPLETO E CORRETO

async function iniciarAmbienteDesenvolvimento() {
  // 1. BACKEND
  console.log("🔍 Verificando backend...");
  
  // 1.1. Verificar package.json
  const backendPackage = await read_file({
    filePath: "backend/package.json",
    startLine: 1,
    endLine: 30
  });
  // Confirmar que tem "start:dev" nos scripts
  
  // 1.2. Verificar se já está rodando
  const backendProcesso = await run_in_terminal({
    command: "netstat -ano | findstr :3001",
    explanation: "Verificando se porta 3001 (backend) está em uso",
    isBackground: false
  });
  
  // 1.3. Iniciar se não estiver
  if (!backendProcesso || backendProcesso.length === 0) {
    await run_in_terminal({
      command: "cd backend && npm run start:dev",
      explanation: "Iniciando servidor backend NestJS na porta 3001",
      isBackground: true  // ⚡ OBRIGATÓRIO!
    });
    
    console.log("⏳ Aguardando backend inicializar (5 segundos)...");
    await sleep(5000);
    
    // 1.4. Verificar se iniciou
    const verificacao = await run_in_terminal({
      command: "curl http://localhost:3001",
      explanation: "Verificando se backend está respondendo",
      isBackground: false
    });
    
    console.log("✅ Backend iniciado!");
  } else {
    console.log("✅ Backend já está rodando na porta 3001");
  }
  
  // 2. FRONTEND
  console.log("🔍 Verificando frontend...");
  
  // 2.1. Verificar package.json
  const frontendPackage = await read_file({
    filePath: "frontend-web/package.json",
    startLine: 1,
    endLine: 30
  });
  // Confirmar que tem "start" nos scripts
  
  // 2.2. Verificar se já está rodando
  const frontendProcesso = await run_in_terminal({
    command: "netstat -ano | findstr :3000",
    explanation: "Verificando se porta 3000 (frontend) está em uso",
    isBackground: false
  });
  
  // 2.3. Iniciar se não estiver
  if (!frontendProcesso || frontendProcesso.length === 0) {
    await run_in_terminal({
      command: "cd frontend-web && npm start",
      explanation: "Iniciando servidor React na porta 3000",
      isBackground: true  // ⚡ OBRIGATÓRIO!
    });
    
    console.log("✅ Frontend iniciando... (aguarde browser abrir)");
  } else {
    console.log("✅ Frontend já está rodando na porta 3000");
  }
  
  console.log("\n🚀 Ambiente de desenvolvimento pronto!");
  console.log("   Backend:  http://localhost:3001");
  console.log("   Frontend: http://localhost:3000");
}
```

---

## 🎓 Fluxo de Desenvolvimento Profissional

### Metodologia para Qualidade de Produção

Ao desenvolver **qualquer funcionalidade** (frontend, backend ou integração), siga este fluxo:

#### 1️⃣ Planejamento da Funcionalidade

**ANTES de gerar código**, sempre faça:

```markdown
## 📋 Análise da Tarefa

### Objetivo
- Descrever claramente o que será desenvolvido
- Identificar o problema que está sendo resolvido

### Contexto
- Backend: Verificar entities, services, controllers existentes
- Frontend: Verificar páginas, services, componentes relacionados
- Banco de dados: Verificar se precisa de migration

### Dependências
- APIs que serão consumidas
- Módulos do NestJS (backend)
- Bibliotecas React (frontend)
- Variáveis de ambiente necessárias
- Serviços externos (WhatsApp, OpenAI, etc.)

### Estrutura Proposta
- Nomes de arquivos (seguir convenções do projeto)
- Funções/métodos principais
- Componentes React (se frontend)
- Endpoints HTTP (se backend)
- Fluxo de dados (entrada → processamento → saída)
```

**Exemplo Prático**:
```markdown
Tarefa: "Criar gestão de produtos"

✅ CORRETO - Planejamento primeiro:
1. Verificar se já existe: grep_search "produto"
2. Backend: Entity, DTO, Service, Controller
3. Frontend: Service, Page (copiar _TemplatePage.tsx)
4. Cor do módulo: Comercial (#159A9C)
5. Dependências: TypeORM, class-validator, axios

❌ ERRADO - Começar direto:
"Vou criar a entity Produto..." (sem verificar antes)
```

#### 2️⃣ Desenvolvimento

**Escreva código de qualidade produção:**

```typescript
// ✅ Código Limpo e Modular

// Backend - Service bem estruturado
@Injectable()
export class ProdutoService {
  constructor(
    @InjectRepository(Produto)
    private readonly produtoRepository: Repository<Produto>,
  ) {}

  /**
   * Busca todos os produtos ativos
   * @returns Lista de produtos
   * @throws NotFoundException se nenhum produto encontrado
   */
  async listarAtivos(): Promise<Produto[]> {
    try {
      const produtos = await this.produtoRepository.find({
        where: { ativo: true },
        order: { nome: 'ASC' },
      });
      
      if (produtos.length === 0) {
        throw new NotFoundException('Nenhum produto ativo encontrado');
      }
      
      return produtos;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Erro ao buscar produtos',
        error.message,
      );
    }
  }
}

// Frontend - Componente bem estruturado
const ProdutosPage: React.FC = () => {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    carregarProdutos();
  }, []);

  const carregarProdutos = async () => {
    try {
      setLoading(true);
      setError(null);
      const dados = await produtoService.listar();
      setProdutos(dados);
    } catch (err: unknown) {
      console.error('Erro ao carregar produtos:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };
  
  // ... resto do componente
};
```

**Boas Práticas Obrigatórias**:

- ✅ **Backend**:
  - Validação com `class-validator` em todos os DTOs
  - Try-catch em todos os métodos de service
  - Retornar status HTTP corretos (200, 201, 400, 404, 500)
  - Logs para debugging (`console.log` em dev, logger em prod)
  - Documentação com JSDoc

- ✅ **Frontend**:
  - Estados: loading, error, empty, success
  - Responsividade: mobile-first (`grid-cols-1 md:grid-cols-2 lg:grid-cols-3`)
  - Acessibilidade: labels, aria-labels, titles
  - Error boundaries para erros não tratados
  - Seguir DESIGN_GUIDELINES.md

- ✅ **Segurança**:
  - Nunca expor credenciais no código
  - Validar entrada do usuário (backend E frontend)
  - Sanitizar dados antes de usar em queries
  - Usar JWT para autenticação
  - HTTPS em produção

#### 3️⃣ Testes

**SEMPRE gerar testes** para código novo:

```typescript
// Backend - Teste de Service
describe('ProdutoService', () => {
  let service: ProdutoService;
  let repository: Repository<Produto>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        ProdutoService,
        {
          provide: getRepositoryToken(Produto),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            save: jest.fn(),
            delete: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ProdutoService>(ProdutoService);
    repository = module.get<Repository<Produto>>(getRepositoryToken(Produto));
  });

  describe('listarAtivos', () => {
    it('deve retornar lista de produtos ativos', async () => {
      const mockProdutos = [
        { id: '1', nome: 'Produto A', ativo: true },
        { id: '2', nome: 'Produto B', ativo: true },
      ];
      
      jest.spyOn(repository, 'find').mockResolvedValue(mockProdutos as any);
      
      const result = await service.listarAtivos();
      
      expect(result).toEqual(mockProdutos);
      expect(repository.find).toHaveBeenCalledWith({
        where: { ativo: true },
        order: { nome: 'ASC' },
      });
    });

    it('deve lançar NotFoundException quando não há produtos', async () => {
      jest.spyOn(repository, 'find').mockResolvedValue([]);
      
      await expect(service.listarAtivos()).rejects.toThrow(NotFoundException);
    });
  });
});

// Frontend - Teste de Componente
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ProdutosPage from './ProdutosPage';
import * as produtoService from '../services/produtoService';

jest.mock('../services/produtoService');

describe('ProdutosPage', () => {
  it('deve exibir loading inicialmente', () => {
    render(<ProdutosPage />);
    expect(screen.getByText(/carregando/i)).toBeInTheDocument();
  });

  it('deve exibir produtos após carregamento', async () => {
    const mockProdutos = [
      { id: '1', nome: 'Produto A', ativo: true },
    ];
    
    (produtoService.listar as jest.Mock).mockResolvedValue(mockProdutos);
    
    render(<ProdutosPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Produto A')).toBeInTheDocument();
    });
  });

  it('deve exibir erro quando falhar', async () => {
    (produtoService.listar as jest.Mock).mockRejectedValue(
      new Error('Erro de rede')
    );
    
    render(<ProdutosPage />);
    
    await waitFor(() => {
      expect(screen.getByText(/erro/i)).toBeInTheDocument();
    });
  });
});
```

**Cenários de Teste Obrigatórios**:
- ✅ Caso de sucesso (happy path)
- ✅ Dados vazios/nulos
- ✅ Erros de rede
- ✅ Validação de entrada inválida
- ✅ Permissões negadas (se aplicável)

#### 4️⃣ Validação Manual

**Após criar código, SEMPRE descrever como testar:**

```markdown
## 🧪 Como Testar Manualmente

### Backend
1. Iniciar servidor: `cd backend && npm run start:dev`
2. Abrir Postman/Thunder Client
3. Testar endpoints:
   - GET http://localhost:3001/produtos
     Espera: 200 OK com array de produtos
   - POST http://localhost:3001/produtos
     Body: { "nome": "Teste", "ativo": true }
     Espera: 201 Created com produto criado
   - GET http://localhost:3001/produtos/id-invalido
     Espera: 404 Not Found

### Frontend
1. Iniciar app: `cd frontend-web && npm start`
2. Navegar: http://localhost:3000/produtos
3. Verificar:
   - [ ] Loading aparece inicialmente
   - [ ] Lista de produtos carrega
   - [ ] Clicar em "Novo Produto" abre modal
   - [ ] Preencher formulário e salvar funciona
   - [ ] Editar produto funciona
   - [ ] Deletar produto funciona
   - [ ] Estados vazios aparecem quando não há dados
   - [ ] Mensagens de erro aparecem em caso de falha
4. Testar responsividade:
   - [ ] Mobile (375px)
   - [ ] Tablet (768px)
   - [ ] Desktop (1920px)
5. Verificar console (F12):
   - [ ] Sem erros no console
   - [ ] Network tab: status 200/201 nas requisições
```

#### 5️⃣ Revisão Final

**Antes de concluir, SEMPRE revisar:**

```markdown
## 🔍 Checklist de Qualidade

### Código
- [ ] Sem código duplicado
- [ ] Funções pequenas e focadas (princípio SRP)
- [ ] Nomes descritivos (variáveis, funções, componentes)
- [ ] Comentários onde necessário (lógica complexa)
- [ ] Sem console.log esquecidos (remover antes de commit)
- [ ] Imports organizados e sem não usados

### Performance
- [ ] Queries otimizadas (sem N+1)
- [ ] useEffect com dependências corretas (frontend)
- [ ] Debounce em buscas (se aplicável)
- [ ] Lazy loading de componentes pesados (se aplicável)
- [ ] Imagens otimizadas (se aplicável)

### Segurança
- [ ] Validação de entrada (backend E frontend)
- [ ] Sanitização de dados
- [ ] Autenticação verificada
- [ ] Sem credenciais no código
- [ ] CORS configurado corretamente

### Boas Práticas
- [ ] Seguir convenções do projeto (nomenclatura)
- [ ] Seguir design system (cores, componentes)
- [ ] TypeScript types corretos (sem any)
- [ ] Error handling completo
- [ ] Testes escritos e passando

### Acessibilidade (Frontend)
- [ ] Labels em inputs
- [ ] Aria-labels em ícones/botões
- [ ] Navegação por teclado funciona
- [ ] Contraste de cores adequado (WCAG 2.1)
- [ ] Foco visível em elementos interativos
```

**Sugestões de Melhoria Automáticas**:

```typescript
// ❌ ANTES - Código com problemas
const handleSave = () => {
  api.post('/produtos', data).then(res => {
    setItems([...items, res.data]);
  });
};

// ✅ DEPOIS - Código melhorado
const handleSave = async () => {
  try {
    setLoading(true);
    setError(null);
    
    const novoProduto = await produtoService.criar(data);
    
    setItems(prev => [...prev, novoProduto]);
    toast.success('Produto criado com sucesso!');
    setShowDialog(false);
  } catch (err: unknown) {
    console.error('Erro ao criar produto:', err);
    const errorMessage = err instanceof Error 
      ? err.message 
      : 'Erro ao criar produto';
    setError(errorMessage);
    toast.error(errorMessage);
  } finally {
    setLoading(false);
  }
};
```

---

### 🎯 Objetivo Final

**Gerar código que possa ir direto para produção com MÍNIMO de retrabalho.**

- ✅ Planejado e contextualizado
- ✅ Limpo e modular
- ✅ Testado (unitário + manual)
- ✅ Documentado
- ✅ Revisado para qualidade profissional

**Qualidade > Velocidade** - Fazer certo da primeira vez economiza tempo depois!

---

## 🔐 Segurança e Variáveis de Ambiente

### Variáveis de Ambiente (.env)

**NUNCA** commite credenciais no código! Use variáveis de ambiente:

#### Backend (.env)
```bash
# Database
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=sua_senha_aqui
DATABASE_NAME=conectcrm

# JWT
JWT_SECRET=chave_secreta_muito_forte_aqui
JWT_EXPIRATION=7d

# APIs Externas
WHATSAPP_API_KEY=sua_chave_aqui
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...

# URLs
FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:3001
```

#### Frontend (.env)
```bash
REACT_APP_API_URL=http://localhost:3001
REACT_APP_WS_URL=ws://localhost:3001
```

### ❌ NUNCA Faça Isso:
```typescript
// 🚫 ERRADO - credenciais hardcoded
const apiKey = 'sk-1234567890abcdef';
const password = 'minhasenha123';
const jwt = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
```

### ✅ SEMPRE Faça Isso:
```typescript
// ✅ CORRETO - usar variáveis de ambiente

// Backend (NestJS)
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MyService {
  constructor(private configService: ConfigService) {}
  
  async conectar() {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    const dbPassword = this.configService.get<string>('DATABASE_PASSWORD');
  }
}

// Frontend (React)
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';
const WS_URL = process.env.REACT_APP_WS_URL || 'ws://localhost:3001';
```

### Arquivos .env no .gitignore

```gitignore
# SEMPRE adicionar no .gitignore
.env
.env.local
.env.development.local
.env.test.local
.env.production.local
```

### Template .env.example

**SEMPRE** crie arquivo `.env.example` com valores fictícios:

```bash
# .env.example - Commitar este arquivo
DATABASE_HOST=localhost
DATABASE_PASSWORD=sua_senha_aqui  # ← Não colocar senha real
OPENAI_API_KEY=sk-your-key-here   # ← Não colocar chave real
JWT_SECRET=your-secret-here       # ← Não colocar secret real
```

### Credenciais padrão (dev local)

- Consulte **`docs/CREDENCIAIS_PADRAO.md`** para saber o usuário/senha padrão (atualmente `admin@conectsuite.com.br` / `admin123`).
- Atualize esse documento sempre que trocar as credenciais que scripts usam (ex.: `scripts/verify-backend.ps1`, smoke tests, fixtures Playwright).
- Nunca invente uma credencial diferente em README, guias ou scripts: referencie o documento único para evitar divergências.

---

## 📝 Git e Commits

### Mensagens de Commit Padronizadas

Use **Conventional Commits**:

```bash
# Formato
<tipo>(<escopo>): <descrição>

# Tipos
feat:     # Nova funcionalidade
fix:      # Correção de bug
docs:     # Documentação
style:    # Formatação (sem mudança de código)
refactor: # Refatoração (sem nova feature ou fix)
test:     # Adicionar/modificar testes
chore:    # Tarefas de build, configs, etc.
perf:     # Melhoria de performance
```

### Exemplos:
```bash
# Nova feature
git commit -m "feat(atendimento): adicionar gestão de equipes"
git commit -m "feat(comercial): criar página de cotações"

# Bug fix
git commit -m "fix(chat): corrigir scroll automático de mensagens"
git commit -m "fix(auth): resolver erro de login com JWT expirado"

# Documentação
git commit -m "docs: adicionar instruções do Copilot"
git commit -m "docs(readme): atualizar guia de instalação"

# Refatoração
git commit -m "refactor(equipes): extrair lógica para service"
git commit -m "refactor: renomear componentes para padrão PascalCase"

# Testes
git commit -m "test(produtos): adicionar testes unitários do service"

# Performance
git commit -m "perf(database): otimizar query de atendentes disponíveis"
```

### O Que NÃO Commitar

```bash
# ❌ NUNCA commitar:
node_modules/
dist/
build/
.env
.env.local
*.log
.DS_Store
Thumbs.db
*.swp
*.swo
temp-*.ts
test-*.js
debug-*.tsx
exemplo-*.md
```

### Antes de Commitar

**SEMPRE** verifique:

```powershell
# 1. Ver o que mudou
git status
git diff

# 2. Verificar se não tem arquivos sensíveis
git status | Select-String ".env|node_modules|dist|*.log"

# 3. Adicionar apenas arquivos específicos (não use git add .)
git add backend/src/modules/triagem/entities/equipe.entity.ts
git add frontend-web/src/pages/GestaoEquipesPage.tsx

# 4. Commitar com mensagem descritiva
git commit -m "feat(atendimento): adicionar gestão de equipes"

# 5. Push
git push origin nome-da-branch
```

---

## ⚡ Performance e Otimização

### Backend (NestJS)

#### 1. Queries Otimizadas (TypeORM)

```typescript
// ❌ PROBLEMA: N+1 Query
async listarEquipes() {
  const equipes = await this.equipeRepository.find();
  // Para cada equipe, faz nova query = N+1
  for (const equipe of equipes) {
    equipe.membros = await this.membroRepository.find({ 
      where: { equipeId: equipe.id } 
    });
  }
  return equipes;
}

// ✅ SOLUÇÃO: Eager Loading com Relations
async listarEquipes() {
  return await this.equipeRepository.find({
    relations: ['membros', 'atribuicoes'],  // 1 query só!
    order: { nome: 'ASC' },
  });
}

// ✅ MELHOR AINDA: Query Builder para mais controle
async listarEquipes() {
  return await this.equipeRepository
    .createQueryBuilder('equipe')
    .leftJoinAndSelect('equipe.membros', 'membros')
    .leftJoinAndSelect('equipe.atribuicoes', 'atribuicoes')
    .where('equipe.ativo = :ativo', { ativo: true })
    .orderBy('equipe.nome', 'ASC')
    .getMany();
}
```

#### 2. Paginação

```typescript
// ❌ RUIM: Retornar tudo
async listar() {
  return await this.repository.find();  // Pode retornar 10k registros!
}

// ✅ BOM: Paginação
async listar(page: number = 1, limit: number = 20) {
  const [items, total] = await this.repository.findAndCount({
    skip: (page - 1) * limit,
    take: limit,
    order: { createdAt: 'DESC' },
  });
  
  return {
    items,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
}
```

#### 3. Caching

```typescript
// Backend - Cachear dados que mudam pouco
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@Injectable()
export class ConfigService {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}
  
  async getConfig() {
    const cacheKey = 'system_config';
    
    // Tentar pegar do cache
    let config = await this.cacheManager.get(cacheKey);
    
    if (!config) {
      // Se não está no cache, buscar do banco
      config = await this.configRepository.findOne();
      // Cachear por 1 hora
      await this.cacheManager.set(cacheKey, config, 3600);
    }
    
    return config;
  }
}
```

### Frontend (React)

#### 1. useMemo e useCallback

```typescript
// ❌ RUIM: Recalcula toda vez que renderiza
const ProdutosPage = () => {
  const [produtos, setProdutos] = useState([]);
  const [filtro, setFiltro] = useState('');
  
  // ⚠️ Recalcula em TODA renderização
  const produtosFiltrados = produtos.filter(p => 
    p.nome.includes(filtro)
  );
  
  // ⚠️ Nova função criada em TODA renderização
  const handleSearch = (e) => {
    setFiltro(e.target.value);
  };
};

// ✅ BOM: Memoização
const ProdutosPage = () => {
  const [produtos, setProdutos] = useState([]);
  const [filtro, setFiltro] = useState('');
  
  // ✅ Só recalcula se produtos ou filtro mudarem
  const produtosFiltrados = useMemo(() => {
    return produtos.filter(p => 
      p.nome.toLowerCase().includes(filtro.toLowerCase())
    );
  }, [produtos, filtro]);
  
  // ✅ Função estável, não recria em toda renderização
  const handleSearch = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setFiltro(e.target.value);
  }, []);
};
```

#### 2. Debounce em Buscas

```typescript
// ❌ RUIM: Faz requisição a cada tecla
const handleSearch = (e) => {
  const query = e.target.value;
  api.get(`/produtos?search=${query}`);  // Chamada em TODA tecla!
};

// ✅ BOM: Debounce (espera 500ms após última tecla)
import { useState, useEffect } from 'react';

const ProdutosPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [produtos, setProdutos] = useState([]);
  
  useEffect(() => {
    // Debounce: só busca 500ms após parar de digitar
    const timer = setTimeout(async () => {
      if (searchTerm) {
        const response = await api.get(`/produtos?search=${searchTerm}`);
        setProdutos(response.data);
      }
    }, 500);
    
    return () => clearTimeout(timer);  // Limpa timer anterior
  }, [searchTerm]);
  
  return (
    <input 
      onChange={(e) => setSearchTerm(e.target.value)}
      placeholder="Buscar..."
    />
  );
};
```

#### 3. Lazy Loading de Componentes

```typescript
// ❌ RUIM: Importa tudo no bundle inicial
import GestaoEquipesPage from './pages/GestaoEquipesPage';
import CotacaoPage from './pages/CotacaoPage';
import ProdutosPage from './pages/ProdutosPage';

// ✅ BOM: Lazy load (só carrega quando usar)
import { lazy, Suspense } from 'react';

const GestaoEquipesPage = lazy(() => import('./pages/GestaoEquipesPage'));
const CotacaoPage = lazy(() => import('./pages/CotacaoPage'));
const ProdutosPage = lazy(() => import('./pages/ProdutosPage'));

function App() {
  return (
    <Suspense fallback={<div>Carregando...</div>}>
      <Routes>
        <Route path="/gestao/equipes" element={<GestaoEquipesPage />} />
        <Route path="/comercial/cotacoes" element={<CotacaoPage />} />
      </Routes>
    </Suspense>
  );
}
```

#### 4. Otimizar Listas Grandes

```typescript
// Para listas muito grandes (1000+ items), use virtualização
import { FixedSizeList } from 'react-window';

const ListaGrande = ({ items }) => {
  const Row = ({ index, style }) => (
    <div style={style}>
      {items[index].nome}
    </div>
  );
  
  return (
    <FixedSizeList
      height={600}
      itemCount={items.length}
      itemSize={50}
      width="100%"
    >
      {Row}
    </FixedSizeList>
  );
};
```

---

## 🌍 Internacionalização e Localização

### Datas e Horários

```typescript
// ❌ RUIM: Formato hardcoded
const data = '2025-10-18';  // Ambíguo

// ✅ BOM: Usar biblioteca de datas
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const dataFormatada = format(new Date(), "dd 'de' MMMM 'de' yyyy", { 
  locale: ptBR 
});
// "18 de outubro de 2025"

const horaFormatada = format(new Date(), 'HH:mm:ss');
// "14:30:45"
```

### Moeda

```typescript
// ❌ RUIM: Concatenação manual
const preco = 'R$ ' + valor.toFixed(2);

// ✅ BOM: Intl.NumberFormat
const formatarMoeda = (valor: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(valor);
};

formatarMoeda(1234.56);  // "R$ 1.234,56"
```

---

## 📊 Logging e Monitoramento

### Backend - Logs Estruturados

```typescript
// ❌ RUIM: console.log sem contexto
console.log('Erro');
console.log(data);

// ✅ BOM: Logs estruturados com contexto
import { Logger } from '@nestjs/common';

@Injectable()
export class EquipeService {
  private readonly logger = new Logger(EquipeService.name);
  
  async criar(dto: CreateEquipeDto) {
    this.logger.log(`Criando equipe: ${dto.nome}`);
    
    try {
      const equipe = await this.repository.save(dto);
      this.logger.log(`Equipe criada com sucesso: ${equipe.id}`);
      return equipe;
    } catch (error) {
      this.logger.error(
        `Erro ao criar equipe: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }
}
```

### Frontend - Error Boundary

```typescript
// Capturar erros não tratados
import { Component, ErrorInfo, ReactNode } from 'react';

class ErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean }
> {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  
  static getDerivedStateFromError(error: Error) {
    return { hasError: true };
  }
  
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Erro capturado:', error, errorInfo);
    // Enviar para serviço de monitoramento (Sentry, etc.)
  }
  
  render() {
    if (this.state.hasError) {
      return <h1>Algo deu errado.</h1>;
    }
    
    return this.props.children;
  }
}

// Usar no App.tsx
<ErrorBoundary>
  <App />
</ErrorBoundary>
```

---

**Última atualização**: Outubro 2025  
**Mantenedores**: Equipe ConectCRM
