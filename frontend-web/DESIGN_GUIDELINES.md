# 🎨 Guidelines de Design - Conect CRM

## 🎨 Tema Único: Crevasse Professional

**TEMA OFICIAL DO SISTEMA**: O ConectCRM usa **EXCLUSIVAMENTE** a paleta **Crevasse Professional** como tema padrão em **TODO O SISTEMA**.

### ⚠️ REGRA FUNDAMENTAL
- ✅ **Tema Crevasse**: ÚNICO para todo o sistema (Comercial, Atendimento, Financeiro, Gestão, CRM, etc)
- ✅ **Layout/Template**: VARIA conforme o contexto e necessidade da tela
- ❌ **NÃO existe**: "tema por módulo" ou "cores por núcleo" diferentes

**O que varia entre telas:**
- ✅ Layout (com/sem KPI cards, grid/lista, formulário/dashboard)
- ✅ Componentes específicos (tabelas, cards, modais)
- ✅ Estrutura de informação (filtros, agrupamentos)
- ❌ Cores do tema (SEMPRE Crevasse)
- ❌ Tipografia base (SEMPRE a mesma)

### Paleta Crevasse (5 cores principais)
```typescript
// PALETA OFICIAL - ÚNICO TEMA DO SISTEMA - NÃO ALTERAR
const CREVASSE_PALETTE = {
  crevasse1: '#B4BEC9',  // Cinza azulado (secundário, bordas, texto secundário)
  crevasse2: '#159A9C',  // Teal (primary, ações principais, destaques, ícones)
  crevasse3: '#002333',  // Azul escuro profundo (texto principal, títulos)
  crevasse4: '#DEEFE7',  // Verde claro suave (fundos secundários, bordas claras)
  crevasse5: '#FFFFFF',  // Branco puro (background principal)
};
```

### Aplicação da Paleta (TODO O SISTEMA)
```typescript
// Cores do sistema derivadas da paleta Crevasse:
colors: {
  primary: '#159A9C',        // Crevasse-2 - SEMPRE esta cor
  primaryHover: '#0F7B7D',   // Variação escura do teal
  primaryLight: '#DEEFE7',   // Crevasse-4
  secondary: '#B4BEC9',      // Crevasse-1
  text: '#002333',           // Crevasse-3
  textSecondary: '#B4BEC9',  // Crevasse-1
  background: '#FFFFFF',     // Crevasse-5
  backgroundSecondary: '#DEEFE7', // Crevasse-4
  border: '#B4BEC9',         // Crevasse-1
  borderLight: '#DEEFE7',    // Crevasse-4
}
```

## Paleta de Cores Oficial

### Cores Primárias do Sistema (Crevasse - ÚNICAS)
```css
--primary: #159A9C          /* Crevasse-2: Botões, links, ícones principais */
--primary-hover: #0F7B7D    /* Hover do primary */
--primary-light: #DEEFE7    /* Crevasse-4: Fundos secundários */
--text-primary: #002333     /* Crevasse-3: Texto principal, títulos */
--text-secondary: #B4BEC9   /* Crevasse-1: Texto secundário */
--border: #B4BEC9           /* Crevasse-1: Bordas padrão */
--border-light: #DEEFE7     /* Crevasse-4: Bordas claras */
```

### Cores de Ação/Ícones Contextuais
**Para ícones e indicadores específicos de contexto (não para tema geral):**
```css
--icon-default: #159A9C     /* Ícone padrão (Crevasse-2) */
--icon-success: #16A34A     /* Ícone de sucesso/confirmação */
--icon-warning: #FBBF24     /* Ícone de alerta/atenção */
--icon-error: #DC2626       /* Ícone de erro/crítico */
--icon-info: #3B82F6        /* Ícone informativo */
```

**IMPORTANTE**: Estas cores são APENAS para ícones contextuais específicos (ex: status de sucesso/erro). O tema base continua sendo Crevasse em todas as telas.

### ❌ REMOVIDO: "Cores por Módulo/Núcleo"
Não existe mais conceito de "cor do módulo Comercial", "cor do módulo Atendimento", etc. 
**TODO O SISTEMA** usa a mesma paleta Crevasse Professional.

## Estrutura de Layout Padrão

### 1. Container Principal
```tsx
<div className="min-h-screen bg-gray-50">
  {/* Header com Breadcrumb */}
  <div className="bg-white border-b px-6 py-4">
    <BackToNucleus
      nucleusName="Nome do Núcleo"
      nucleusPath="/nuclei/nome-nucleo"
    />
  </div>

  {/* Conteúdo */}
  <div className="p-6">
    <div className="max-w-7xl mx-auto">
      {/* Seus componentes aqui */}
    </div>
  </div>
</div>
```

### 2. Header da Página
```tsx
<div className="bg-white rounded-lg shadow-sm border mb-6">
  <div className="px-6 py-6">
    <div className="flex flex-col sm:flex-row justify-between items-start">
      <div>
        <h1 className="text-3xl font-bold text-[#002333] flex items-center">
          <IconeDoModulo className="h-8 w-8 mr-3 text-[#COR-DO-MODULO]" />
          Título da Página
          {loading && (
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#COR-DO-MODULO] ml-3"></div>
          )}
        </h1>
        <p className="mt-2 text-[#B4BEC9]">
          Descrição ou contadores dinâmicos
        </p>
      </div>
      <div className="mt-4 sm:mt-0 flex items-center gap-3">
        {/* Botão de Refresh (opcional) */}
        <button
          onClick={carregarDados}
          disabled={loading}
          className="px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-5 h-5 text-gray-600 ${loading ? 'animate-spin' : ''}`} />
        </button>
        
        {/* Botão Principal */}
        <button
          onClick={handleNovo}
          className="bg-[#COR-DO-MODULO] hover:bg-[#COR-DO-MODULO-HOVER] text-white px-6 py-3 rounded-lg flex items-center gap-2 transition-colors shadow-sm"
        >
          <Plus className="w-5 h-5" />
          Novo Item
        </button>
      </div>
    </div>
  </div>
</div>
```

### 3. Dashboard Cards (KPI Cards - Métricas)

**PADRÃO OFICIAL**: KPI Cards devem seguir o design limpo e sem gradientes/cores chamativas, conforme usado no Funil de Vendas.

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
  <div className="p-5 rounded-2xl border border-[#DEEFE7] shadow-sm text-[#002333] bg-[#FFFFFF]">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-[#002333]/60">
          Label da Métrica
        </p>
        <p className="mt-2 text-3xl font-bold text-[#002333]">
          {valorMetrica}
        </p>
        <p className="mt-3 text-sm text-[#002333]/70">
          Descrição explicativa da métrica ou contexto adicional.
        </p>
      </div>
      <div className="h-12 w-12 rounded-2xl bg-[#159A9C]/10 flex items-center justify-center shadow-sm">
        <IconeMetrica className="h-6 w-6 text-[#159A9C]" />
      </div>
    </div>
  </div>
</div>
```

**Características dos KPI Cards:**
- ✅ **Background**: Branco (`bg-[#FFFFFF]`)
- ✅ **Borda**: Cinza clara (`border-[#DEEFE7]`)
- ✅ **Texto principal**: `text-[#002333]` (Crevasse-3)
- ✅ **Texto secundário**: `text-[#002333]/60` ou `text-[#002333]/70`
- ✅ **Ícone**: Container com `bg-[#159A9C]/10` e ícone em `text-[#159A9C]`
- ✅ **Tamanho**: `p-5`, `rounded-2xl`
- ✅ **Shadow**: `shadow-sm` (sutil)
- ❌ **NÃO usar**: Gradientes coloridos
- ❌ **NÃO usar**: Backgrounds coloridos (azul, verde, amarelo, roxo, etc)

**Variações de Cor do Ícone (quando necessário):**
- Padrão/Principal: `bg-[#159A9C]/10` + `text-[#159A9C]`
- Sucesso/Positivo: `bg-green-500/10` + `text-green-600`
- Alerta/Atenção: `bg-yellow-500/10` + `text-yellow-600`
- Erro/Negativo: `bg-red-500/10` + `text-red-600`

**IMPORTANTE**: O foco dos KPI cards é clareza e legibilidade, não decoração visual excessiva.

### 4. Botões - Padrão do Sistema

**TEMA ÚNICO**: Todos os botões seguem a paleta Crevasse, independente do módulo.

**TAMANHO PADRÃO**: `px-4 py-2` + `text-sm font-medium` (compacto e profissional - padrão da tela de Produtos)

#### Botão Principal (Primary)
```tsx
// ✅ PADRÃO - Ações principais (criar, salvar, confirmar)
<button
  onClick={handleAction}
  className="bg-[#159A9C] hover:bg-[#0F7B7D] text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
  disabled={loading}
>
  <Plus className="w-4 h-4" />
  Nova Ação
</button>
```

#### Botão Secundário (Secondary)
```tsx
// ✅ PADRÃO - Ações secundárias (cancelar, voltar, filtros)
<button
  onClick={handleCancel}
  className="bg-white hover:bg-gray-50 text-[#002333] border border-gray-300 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm text-sm font-medium"
>
  <X className="w-4 h-4" />
  Cancelar
</button>
```

#### Botão de Ação Destrutiva (Danger)
```tsx
// ✅ PADRÃO - Ações destrutivas (deletar, remover)
<button
  onClick={handleDelete}
  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm text-sm font-medium"
>
  <Trash2 className="w-5 h-5" />
  Excluir
</button>
```

#### Botão de Ícone (Icon Button)
```tsx
// ✅ PADRÃO - Botões pequenos com apenas ícone
<button
  onClick={handleRefresh}
  disabled={loading}
  className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
  title="Atualizar"
>
  <RefreshCw className={`w-5 h-5 text-gray-600 ${loading ? 'animate-spin' : ''}`} />
</button>
```

#### Botão de Ação em Card (Ghost/Minimal)
```tsx
// ✅ PADRÃO - Ações dentro de cards/listas
<button
  onClick={handleEdit}
  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
  title="Editar"
>
  <Edit2 className="w-4 h-4 text-gray-600" />
</button>
```

**Variações de Cor (apenas quando necessário):**
```tsx
// Sucesso/Confirmação
className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 text-sm font-medium"

// Alerta/Atenção
className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 text-sm font-medium"

// Informativo
className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 text-sm font-medium"
```

**Regras de Botões:**
- ✅ **Primary sempre Crevasse**: `bg-[#159A9C]` + `hover:bg-[#0F7B7D]`
- ✅ **Tamanho padrão**: `px-4 py-2` + `text-sm font-medium` (compacto, seguir tela de Produtos)
- ❌ **NÃO use**: `px-6 py-3` (botões grandes demais)
- ✅ **Ícones**: `w-4 h-4` em botões de texto
- ✅ **Bordas arredondadas**: `rounded-lg` (padrão)
- ✅ **Transições suaves**: `transition-colors`
- ✅ **Shadow sutil**: `shadow-sm` em botões principais
- ✅ **Estados disabled**: `disabled:opacity-50 disabled:cursor-not-allowed`
- ❌ **NÃO usar**: Cores diferentes de Crevasse para botões primários
- ❌ **NÃO usar**: Gradientes em botões

### 5. Barra de Filtros/Busca
```tsx
<div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
  <div className="flex flex-col sm:flex-row gap-4 items-end">
    {/* Campo de Busca */}
    <div className="flex-1">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Buscar Items
      </label>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <input
          type="text"
          placeholder="Buscar por..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#COR-DO-MODULO] focus:border-transparent transition-colors"
        />
      </div>
    </div>

    {/* Filtros adicionais (dropdown, etc) */}
    <div className="min-w-[140px]">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Filtro
      </label>
      <select
        value={filtro}
        onChange={(e) => setFiltro(e.target.value)}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#COR-DO-MODULO] focus:border-transparent transition-colors"
      >
        <option value="todos">Todos</option>
        {/* Outras opções */}
      </select>
    </div>
  </div>
</div>
```

### 5. Cards de Lista (Grid)
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {items.map((item) => (
    <div 
      key={item.id} 
      className="bg-white rounded-lg shadow-sm border hover:shadow-lg transition-shadow duration-300"
    >
      <div className="p-6">
        {/* Header do Card */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3 flex-1">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-md flex-shrink-0"
              style={{ backgroundColor: item.cor }}
            >
              <IconeItem className="h-6 w-6" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-gray-900 truncate">
                {item.nome}
              </h3>
              <p className="text-sm">
                {/* Badge de Status */}
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  {item.status}
                </span>
              </p>
            </div>
          </div>
          
          {/* Ações */}
          <div className="flex gap-1 flex-shrink-0 ml-2">
            <button
              onClick={() => handleEditar(item)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Editar"
            >
              <Edit2 className="h-4 w-4 text-gray-600" />
            </button>
            <button
              onClick={() => handleExcluir(item.id)}
              className="p-2 hover:bg-red-50 rounded-lg transition-colors"
              title="Excluir"
            >
              <Trash2 className="h-4 w-4 text-red-500" />
            </button>
          </div>
        </div>

        {/* Conteúdo do Card */}
        {item.descricao && (
          <p className="text-sm text-gray-600 mb-4 line-clamp-2">
            {item.descricao}
          </p>
        )}

        {/* Footer do Card */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <IconeInfo className="h-4 w-4" />
            <span>{item.info}</span>
          </div>
          <button
            onClick={() => handleAcao(item)}
            className="text-[#COR-DO-MODULO] hover:text-[#COR-DO-MODULO-HOVER] text-sm font-medium flex items-center gap-1 transition-colors"
          >
            <Settings className="h-4 w-4" />
            Ação
          </button>
        </div>
      </div>
    </div>
  ))}
</div>
```

### 6. Estado Vazio
```tsx
{!loading && items.length === 0 && (
  <div className="bg-white rounded-lg shadow-sm border">
    <div className="text-center py-12 px-6">
      <IconePrincipal className="h-12 w-12 text-gray-400 mx-auto mb-4" />
      <h3 className="text-lg font-medium text-gray-900 mb-2">
        {busca ? 'Nenhum item encontrado' : 'Nenhum item cadastrado'}
      </h3>
      <p className="text-gray-600 mb-4">
        {busca
          ? 'Tente ajustar os filtros de busca'
          : 'Crie seu primeiro item para começar'}
      </p>
      {!busca && (
        <button
          onClick={handleNovo}
          className="bg-[#COR-DO-MODULO] hover:bg-[#COR-DO-MODULO-HOVER] text-white px-6 py-3 rounded-lg flex items-center gap-2 transition-colors shadow-sm mx-auto"
        >
          <Plus className="w-5 h-5" />
          Criar Primeiro Item
        </button>
      )}
    </div>
  </div>
)}
```

### 7. Modais/Dialogs
```tsx
{showDialog && (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-lg p-6 w-full max-w-md">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">
          {editando ? 'Editar Item' : 'Novo Item'}
        </h2>
        <button
          onClick={fecharDialog}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <X className="h-5 w-5 text-gray-500" />
        </button>
      </div>

      {/* Formulário */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Campo *
          </label>
          <input
            type="text"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#COR-DO-MODULO] focus:border-transparent transition-colors"
            value={formData.campo}
            onChange={(e) => setFormData({ ...formData, campo: e.target.value })}
            placeholder="Placeholder"
          />
        </div>
      </div>

      {/* Ações */}
      <div className="flex gap-3 mt-6">
        <button
          onClick={fecharDialog}
          className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Cancelar
        </button>
        <button
          onClick={handleSalvar}
          disabled={!formValido}
          className="flex-1 px-4 py-2 bg-[#COR-DO-MODULO] text-white rounded-lg hover:bg-[#COR-DO-MODULO-HOVER] disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          {editando ? 'Salvar' : 'Criar'}
        </button>
      </div>
    </div>
  </div>
)}
```

### 8. Alertas/Notificações
```tsx
{/* Erro */}
{error && (
  <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
    <p className="text-red-800">{error}</p>
  </div>
)}

{/* Sucesso */}
{sucesso && (
  <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
    <p className="text-green-800">{sucesso}</p>
  </div>
)}

{/* Info */}
{info && (
  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
    <p className="text-blue-800">{info}</p>
  </div>
)}
```

## Badges de Status

```tsx
{/* Ativo/Sucesso */}
<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
  Ativo
</span>

{/* Pendente/Aguardando */}
<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
  Pendente
</span>

{/* Inativo/Cancelado */}
<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
  Inativo
</span>

{/* Erro/Rejeitado */}
<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
  Erro
</span>

{/* Info */}
<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
  Em Análise
</span>
```

## Tipografia

### Hierarquia de Títulos
```css
h1: text-3xl font-bold text-[#002333]
h2: text-2xl font-bold text-gray-900
h3: text-xl font-bold text-gray-900
h4: text-lg font-semibold text-gray-900
```

### Corpo de Texto
```css
Texto principal: text-base text-gray-900
Texto secundário: text-sm text-gray-600
Texto terciário: text-xs text-gray-500
Label/Caption: text-sm font-medium text-gray-700
```

## Espaçamentos

### Margens e Paddings Padrão
```css
Container principal: p-6
Cards internos: p-6
Gaps em grids: gap-6
Margens entre seções: mb-6
Espaçamento em formulários: space-y-4
```

## Componentes Reutilizáveis

### BackToNucleus
```tsx
import { BackToNucleus } from '../components/navigation/BackToNucleus';

<BackToNucleus
  nucleusName="Nome do Núcleo"
  nucleusPath="/nuclei/nome-nucleo"
/>
```

### InputMoeda (Padrão de Campos Monetários)

**COMPONENTE OFICIAL** para todos os campos de valor monetário no sistema.

#### Características
- ✅ Formatação automática em tempo real (padrão brasileiro)
- ✅ Separador de milhares: ponto (.) - Ex: 1.000,00
- ✅ Separador decimal: vírgula (,)
- ✅ Sempre exibe 2 casas decimais
- ✅ inputMode="numeric" para teclado numérico no mobile
- ✅ Conversão transparente para número
- ✅ Símbolo R$ fixo à esquerda
- ✅ Validação integrada com feedback visual
- ✅ Compatível com Salesforce, HubSpot, Pipedrive

#### Quando Usar
Use **InputMoeda** sempre que precisar de um campo para:
- Valores de oportunidades/negócios
- Preços de produtos/serviços
- Valores de faturas/pagamentos
- Valores de contratos
- Orçamentos, descontos, impostos
- Qualquer campo monetário em R$

#### Uso Básico
```tsx
import InputMoeda from '../components/common/InputMoeda';

const [valor, setValor] = useState(0);

<InputMoeda
  value={valor}
  onChange={setValor}
  label="Valor Estimado"
  required
/>
```

#### Uso Completo com Validação
```tsx
import InputMoeda from '../components/common/InputMoeda';

const [formData, setFormData] = useState({ valor: 0 });
const [errors, setErrors] = useState<Record<string, string>>({});

<InputMoeda
  value={formData.valor}
  onChange={(val) => setFormData(prev => ({ ...prev, valor: val }))}
  label="Valor Total"
  placeholder="0,00"
  required
  disabled={loading}
  error={errors.valor}
  hint="Digite apenas números • Formatação automática"
  name="valor"
/>
```

#### Props Disponíveis
| Prop | Tipo | Padrão | Descrição |
|------|------|--------|-----------|
| `value` | `number` | - | Valor numérico (ex: 1234.56) |
| `onChange` | `(value: number) => void` | - | Callback com valor atualizado |
| `label` | `string` | - | Label do campo |
| `placeholder` | `string` | `"0,00"` | Placeholder |
| `required` | `boolean` | `false` | Campo obrigatório |
| `disabled` | `boolean` | `false` | Campo desabilitado |
| `error` | `string` | - | Mensagem de erro |
| `hint` | `string` | `"Digite apenas números..."` | Texto de ajuda |
| `className` | `string` | - | Classes CSS adicionais |
| `name` | `string` | - | Nome do campo (forms) |

#### Exemplos de Formatação
```typescript
// Usuário digita → Sistema exibe
"5000"       → "50,00"         // R$ 50,00
"50000"      → "500,00"        // R$ 500,00
"5000000"    → "50.000,00"     // R$ 50.000,00
"123456789"  → "1.234.567,89"  // R$ 1.234.567,89
```

#### Integração com Formulários
```tsx
// Modal de Oportunidade
<InputMoeda
  value={formData.valor}
  onChange={(val) => {
    setFormData(prev => ({ ...prev, valor: val }));
    setErrors(prev => ({ ...prev, valor: undefined }));
  }}
  label="Valor da Oportunidade"
  required
  error={errors.valor}
/>

// Página de Produtos
<InputMoeda
  value={produto.preco}
  onChange={(preco) => setProduto(prev => ({ ...prev, preco }))}
  label="Preço de Venda"
  hint="Preço unitário do produto"
/>
```

#### ❌ NÃO Usar
```tsx
// ❌ ERRADO - Input number tradicional
<input type="number" step="0.01" min="0" />

// ❌ ERRADO - Input text sem formatação
<input type="text" placeholder="Digite o valor" />

// ❌ ERRADO - Implementação inline
const [valorFormatado, setValorFormatado] = useState('');
// ... 50 linhas de código de formatação ...
```

#### ✅ SEMPRE Usar
```tsx
// ✅ CORRETO - Componente padrão
<InputMoeda
  value={valor}
  onChange={setValor}
  label="Valor"
/>
```

#### Benefícios do Padrão
- 🎯 **Consistência**: Mesmo comportamento em todo o sistema
- 🚀 **Produtividade**: Não reescrever lógica de formatação
- 🐛 **Menos Bugs**: Validação centralizada e testada
- 📱 **Mobile-First**: inputMode="numeric" nativo
- 🌍 **i18n Ready**: Preparado para outras moedas
- ♿ **Acessível**: Labels, hints, erros visuais

## Ícones (Lucide React)

### Ícones Comuns por Contexto
- **Adicionar**: `Plus`
- **Editar**: `Edit2`
- **Excluir**: `Trash2`
- **Buscar**: `Search`
- **Filtrar**: `Filter`
- **Atualizar**: `RefreshCw`
- **Configurações**: `Settings`
- **Usuários**: `Users`, `UserPlus`
- **Documentos**: `FileText`, `File`
- **Status OK**: `CheckCircle`, `Check`
- **Status Erro**: `AlertCircle`, `X`
- **Calendário**: `Calendar`
- **Relógio**: `Clock`
- **Dinheiro**: `DollarSign`
- **Download**: `Download`
- **Upload**: `Upload`
- **Visibilizar**: `Eye`
- **Mais opções**: `MoreVertical`

## Transições e Animações

### Padrões de Hover
```css
/* Botões */
hover:bg-[#COR-MAIS-ESCURA] transition-colors

/* Cards */
hover:shadow-lg transition-shadow duration-300

/* Inputs */
focus:ring-2 focus:ring-[#COR-DO-MODULO] focus:border-transparent transition-colors
```

### Loading States
```tsx
{loading && (
  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#COR-DO-MODULO]"></div>
)}
```

## Responsividade

### Breakpoints Tailwind
- `sm`: 640px (tablet pequeno)
- `md`: 768px (tablet)
- `lg`: 1024px (desktop)
- `xl`: 1280px (desktop grande)

### Grid Responsivo Padrão
```tsx
className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
```

## Template Pronto para Uso

### 📁 Arquivo: `_TemplatePage.tsx`

**Localização**: `frontend-web/src/pages/_TemplatePage.tsx`

Este arquivo é um **template completo** e funcional pronto para ser copiado e personalizado ao criar novas telas.

#### 🚀 Como usar:

1. **Copiar o arquivo**:
   ```powershell
   cp frontend-web/src/pages/_TemplatePage.tsx frontend-web/src/pages/SuaNovaPaginaPage.tsx
   ```

2. **Buscar todos os marcadores [PERSONALIZAR]** no arquivo - todos os pontos que precisam customização estão marcados

3. **Configurar o módulo**:
   - Escolher cor na paleta (Comercial: #159A9C, Atendimento: #9333EA, etc.)
   - Alterar ícone principal
   - Definir título e descrições

4. **Implementar lógica**:
   - Criar/importar service do backend
   - Definir interfaces TypeScript
   - Conectar funções de CRUD
   - Ajustar métricas do dashboard

5. **Registrar no sistema**:
   - Adicionar rota em `App.tsx`
   - Configurar menu em `menuConfig.ts`

#### ✅ O template já inclui:

- BackToNucleus breadcrumb
- Header com ícone e título
- 4 Dashboard cards com gradientes
- Barra de busca/filtros padronizada
- Grid de cards responsivo
- Modal de CRUD completo (criar/editar)
- Estados vazios com call-to-action
- Loading states
- Error handling
- Badges de status
- TypeScript interfaces
- Comentários instrutivos em todos os pontos personalizáveis

#### 📋 Checklist ao usar template:

- [ ] Substituir todos os `[PERSONALIZAR]`
- [ ] Escolher cor do módulo
- [ ] Definir interfaces TypeScript
- [ ] Conectar com service real
- [ ] Ajustar métricas do dashboard
- [ ] Personalizar campos do formulário
- [ ] Adicionar filtros específicos (se necessário)
- [ ] Remover comentários de instrução
- [ ] Registrar rota em App.tsx
- [ ] Adicionar no menuConfig.ts
- [ ] Testar todos os estados (loading, error, empty, success)
- [ ] Verificar responsividade (mobile, tablet, desktop)

## Checklist de Nova Tela

- [ ] Background: `bg-gray-50`
- [ ] Header com `BackToNucleus`
- [ ] Título com cor do módulo (`#002333` para texto)
- [ ] Ícone do módulo com cor apropriada
- [ ] Dashboard cards com gradientes
- [ ] Barra de busca/filtros padronizada
- [ ] Cards de lista com hover effects
- [ ] Estado vazio implementado
- [ ] Modais com estrutura padrão
- [ ] Alertas de erro/sucesso
- [ ] Loading states
- [ ] Responsividade testada
- [ ] Acessibilidade (titles, labels)

## Referências

### Template Base
- 🎯 `_TemplatePage.tsx` - **Template pronto para copiar** com todos os padrões implementados

### Telas de Exemplo
- ✅ `CotacaoPage.tsx` - Padrão completo do módulo Comercial
- ✅ `GestaoEquipesPage.tsx` - Padrão completo do módulo Atendimento

### Arquivos de Configuração
- `frontend-web/src/config/menuConfig.ts` - Menu lateral com cores por módulo
- `frontend-web/src/components/navigation/BackToNucleus.tsx` - Breadcrumb padrão

