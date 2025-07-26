# 📋 Guia de Requisitos para Criação de Telas - ConectCRM

## 🎯 Objetivo

Este documento estabelece padrões, requisitos e melhores práticas para desenvolvimento de interfaces de usuário no ConectCRM, evitando problemas comuns e garantindo consistência na experiência do usuário.

---

## 🏗️ Arquitetura e Estrutura

### 📁 Organização de Arquivos

```
src/pages/[modulo]/[funcionalidade]/
├── [FuncionalidadePrincipal].tsx          # Página principal
├── components/                            # Componentes específicos
│   ├── Filtros[Funcionalidade].tsx       # Filtros avançados
│   ├── Modal[Funcionalidade].tsx         # Modal principal
│   ├── [Outros]Components.tsx            # Componentes auxiliares
│   └── index.ts                          # Exports organizados
├── hooks/                                # Hooks customizados
├── services/                             # Serviços API
└── types/                                # Types específicos
```

### 🧩 Componentes Obrigatórios

#### ✅ Toda tela deve ter:

- **Navegação**: `BackToNucleus` para retorno ao núcleo
- **Cabeçalho**: Título, descrição e ações principais
- **Loading State**: Indicador de carregamento
- **Error State**: Tratamento de erros com retry
- **Filtros**: Sistema de filtros avançados
- **Busca**: Campo de pesquisa global
- **Ações em Massa**: Para operações múltiplas

---

## 🎨 Padrões de Interface

### 🔴 Cards de Resumo (Obrigatório)

```typescript
interface ResumoCard {
  titulo: string;
  valor: number | string;
  quantidade?: number;
  icone: LucideIcon;
  cor: "blue" | "green" | "red" | "orange" | "purple";
  trend?: {
    valor: number;
    tipo: "aumento" | "reducao";
  };
}
```

**Exemplo de implementação:**

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
  <CardResumo
    titulo="Total Atual"
    valor={formatarMoeda(resumo.total)}
    quantidade={resumo.quantidade}
    icone={DollarSign}
    cor="blue"
  />
</div>
```

### 🔍 Sistema de Filtros

```typescript
interface FiltrosPadrao {
  dataInicio?: string;
  dataFim?: string;
  status?: string[];
  categoria?: string[];
  fornecedor?: string;
  valorMin?: number;
  valorMax?: number;
  tags?: string[];
}
```

**Características obrigatórias:**

- ✅ Filtros em abas separadas por contexto
- ✅ Botões "Limpar Filtros" e "Aplicar"
- ✅ Contador de filtros ativos
- ✅ Persistência de filtros na sessão

### 📊 Tabelas de Dados

```typescript
interface ColunaTabela {
  key: string;
  titulo: string;
  ordenavel?: boolean;
  largura?: string;
  formatador?: (valor: any) => string;
  componente?: (valor: any, registro: any) => ReactNode;
}
```

**Funcionalidades obrigatórias:**

- ✅ Seleção múltipla com checkbox
- ✅ Ordenação por colunas
- ✅ Paginação ou scroll infinito
- ✅ Estados visuais (destaque para urgente/atrasado)
- ✅ Ações por linha (editar, excluir, etc.)

---

## 💰 Formatação de Valores

### 🔢 Campos Monetários (OBRIGATÓRIO)

**Sempre implementar formatação brasileira:**

```typescript
// Funções obrigatórias em todo modal/formulário com valores
const formatarMoedaInput = (valor: number | string): string => {
  if (valor === "" || valor === 0 || valor === null || valor === undefined)
    return "";

  const numero = typeof valor === "string" ? parseFloat(valor) : valor;
  if (isNaN(numero)) return "";

  return numero.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const parsearMoedaInput = (valorFormatado: string): number => {
  if (!valorFormatado) return 0;

  const apenasNumeros = valorFormatado.replace(/[^\d,.-]/g, "");
  if (!apenasNumeros) return 0;

  const valorAmericano = apenasNumeros.replace(/\./g, "").replace(",", ".");
  const numero = parseFloat(valorAmericano);
  return isNaN(numero) ? 0 : numero;
};

const handleMoneyChange = (campo: string, valorFormatado: string) => {
  const valorNumerico =
    valorFormatado === "" ? 0 : parsearMoedaInput(valorFormatado);

  setFormData((prev) => ({
    ...prev,
    [campo]: valorNumerico,
  }));
};
```

**Configuração de inputs monetários:**

```tsx
<input
  type="text" // SEMPRE text, nunca number para campos monetários
  value={formData.valor === 0 ? "" : formatarMoedaInput(formData.valor)}
  onChange={(e) => handleMoneyChange("valor", e.target.value)}
  placeholder="0,00"
  className="..."
/>
```

**Sempre utilizar a lógica de formatação automática igual ao modal de oportunidades:**

```typescript
// Função padrão para campos monetários (formatação automática durante digitação)
const formatCurrency = (value: string): string => {
  const numericValue = value.replace(/\D/g, "");
  if (!numericValue || numericValue === "0") return "";
  const formattedValue = (parseInt(numericValue) / 100).toFixed(2);
  return formattedValue.replace(".", ",").replace(/\B(?=(\d{3})+(?!\d))/g, ".");
};

// Handler padrão para campos monetários
const handleValorChange = (
  valorInput: string,
  setInput: (v: string) => void,
  setFormData: (fn: (prev: any) => any) => void,
  campo: string
) => {
  const cleanValue = valorInput.replace(/^R\$\s*/, "");
  const formatted = formatCurrency(cleanValue);
  const formattedValue = formatted ? `R$ ${formatted}` : "";
  setInput(formattedValue);
  const valorNumerico = formattedValue
    ? parseFloat(formattedValue.replace(/[^\d,]/g, "").replace(",", "."))
    : 0;
  setFormData((prev) => ({ ...prev, [campo]: valorNumerico }));
};
```

**Configuração recomendada para inputs monetários:**

```tsx
<input
  type="text" // SEMPRE text, nunca number para campos monetários
  value={valorInput}
  onChange={(e) =>
    handleValorChange(e.target.value, setValorInput, setFormData, "valor")
  }
  placeholder="R$ 0,00"
  className="..."
/>
```

> **Padrão obrigatório:** Todos os campos monetários devem usar esta lógica para garantir digitação natural, formatação brasileira automática e consistência em toda a aplicação.

### 📅 Formatação de Datas

```typescript
const formatarData = (data: string | Date) => {
  return new Date(data).toLocaleDateString("pt-BR");
};

const formatarDataHora = (data: string | Date) => {
  return new Date(data).toLocaleString("pt-BR");
};
```

---

## 🚪 Modais e Formulários

### 📝 Modal Wizard (Formulários Complexos)

**Estrutura obrigatória:**

```typescript
interface PassoModal {
  id: number;
  nome: string;
  icon: LucideIcon;
  obrigatorio: boolean;
}

const passos: PassoModal[] = [
  { id: 0, nome: "Informações Básicas", icon: FileText, obrigatorio: true },
  { id: 1, nome: "Valores e Pagamento", icon: DollarSign, obrigatorio: true },
  { id: 2, nome: "Detalhes e Anexos", icon: Paperclip, obrigatorio: false },
  { id: 3, nome: "Revisão Final", icon: CheckCircle, obrigatorio: true },
];
```

**Funcionalidades obrigatórias:**

- ✅ Navegação entre passos
- ✅ Validação por passo
- ✅ Indicador de progresso
- ✅ Botões de navegação (Anterior/Próximo)
- ✅ Salvamento como rascunho
- ✅ Revisão final antes de salvar

### 🔄 Estados de Formulário

```typescript
interface EstadoFormulario<T> {
  dados: T;
  errors: Partial<Record<keyof T, string>>;
  loading: boolean;
  etapaAtual: number;
  modoEdicao: boolean;
}
```

### ✅ Validações Obrigatórias

```typescript
// Implementar para todos os formulários
const validarFormulario = (dados: any): Record<string, string> => {
  const erros: Record<string, string> = {};

  // Validações por tipo de campo
  if (!dados.nome?.trim()) {
    erros.nome = "Nome é obrigatório";
  }

  if (dados.email && !validarEmail(dados.email)) {
    erros.email = "Email inválido";
  }

  if (!dados.valor || Number(dados.valor) <= 0) {
    erros.valor = "Valor deve ser maior que zero";
  }

  return erros;
};
```

---

## 🎭 Estados da Interface

### ⏳ Loading States

```tsx
// Loading principal da página
if (loading) {
  return (
    <div className="flex items-center justify-center h-96">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
    </div>
  );
}

// Loading de ações específicas
<button disabled={salvando} className="...">
  {salvando ? (
    <>
      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
      Salvando...
    </>
  ) : (
    "Salvar"
  )}
</button>;
```

### ❌ Error States

```tsx
// Error principal da página
if (error) {
  return (
    <div className="text-center py-12">
      <div className="text-red-600 text-lg mb-2">{error}</div>
      <button
        onClick={recarregarDados}
        className="text-blue-600 hover:text-blue-800 underline"
      >
        Tentar novamente
      </button>
    </div>
  );
}
```

### 📄 Empty States

```tsx
// Estado vazio com ação
{
  dados.length === 0 && !loading && (
    <div className="text-center py-12">
      <div className="text-gray-500 text-lg mb-4">
        Nenhum registro encontrado
      </div>
      <button
        onClick={handleNovo}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
      >
        Criar Primeiro Registro
      </button>
    </div>
  );
}
```

---

## 🔧 Funcionalidades Técnicas

### 🔄 Gerenciamento de Estado

```typescript
// Hook personalizado para cada entidade
const useEntidade = () => {
  const [dados, setDados] = useState<Entidade[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filtros, setFiltros] = useState<FiltrosEntidade>({});

  const carregarDados = useCallback(async () => {
    // Implementação...
  }, [filtros]);

  return {
    dados,
    loading,
    error,
    filtros,
    setFiltros,
    carregarDados,
    // ... outras funções
  };
};
```

### 🔍 Busca e Filtros

```typescript
// Busca em tempo real com debounce
const [termoBusca, setTermoBusca] = useState("");
const [termoBuscaDebounced] = useDebounce(termoBusca, 300);

const dadosFiltrados = useMemo(() => {
  return dados.filter((item) => {
    // Implementar busca em múltiplos campos
    const termo = termoBuscaDebounced.toLowerCase();
    return (
      item.nome.toLowerCase().includes(termo) ||
      item.codigo.toLowerCase().includes(termo) ||
      item.descricao?.toLowerCase().includes(termo)
    );
  });
}, [dados, termoBuscaDebounced, filtros]);
```

### 📱 Responsividade

```typescript
// Configurações responsivas obrigatórias
const breakpoints = {
  mobile: 'grid-cols-1',
  tablet: 'md:grid-cols-2',
  desktop: 'lg:grid-cols-4'
};

// Uso em cards de resumo
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">

// Uso em formulários
<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
```

---

## 🎨 Padrões de Design

### 🎨 Cores do Sistema

```typescript
const cores = {
  primaria: "blue-600",
  sucesso: "green-600",
  erro: "red-600",
  alerta: "orange-600",
  info: "blue-500",
  neutro: "gray-600",
};

const coresStatus = {
  ativo: "bg-green-100 text-green-800",
  inativo: "bg-gray-100 text-gray-800",
  pendente: "bg-orange-100 text-orange-800",
  erro: "bg-red-100 text-red-800",
};
```

### 🔲 Espaçamentos Padrão

```css
/* Espaçamentos obrigatórios */
.container-principal {
  @apply p-6;
}
.card-padrao {
  @apply p-4;
}
.modal-padrao {
  @apply p-6;
}
.gap-elementos {
  @apply gap-4;
}
.gap-secoes {
  @apply gap-6;
}
```

### 🔤 Tipografia

```css
/* Hierarquia de títulos */
.titulo-pagina {
  @apply text-3xl font-bold text-gray-900;
}
.titulo-secao {
  @apply text-xl font-semibold text-gray-900;
}
.titulo-card {
  @apply text-lg font-medium text-gray-900;
}
.texto-padrao {
  @apply text-sm text-gray-900;
}
.texto-secundario {
  @apply text-sm text-gray-600;
}
.texto-legenda {
  @apply text-xs text-gray-500;
}
```

---

## ⚡ Performance e Otimização

### 🚀 Memoização Obrigatória

```typescript
// Computações pesadas
const dadosCalculados = useMemo(() => {
  return calcularResumo(dados);
}, [dados]);

// Callbacks que não devem recriar
const handleAction = useCallback(
  (id: string) => {
    // ação...
  },
  [dependencias]
);

// Componentes pesados
const ComponentePesado = memo(({ dados }) => {
  // renderização...
});
```

### 📊 Lazy Loading

```typescript
// Importação lazy para modais
const ModalPesado = lazy(() => import("./components/ModalPesado"));

// Uso com Suspense
<Suspense fallback={<LoadingSpinner />}>
  {modalAberto && <ModalPesado />}
</Suspense>;
```

---

## 🧪 Testes e Qualidade

### ✅ Testes Obrigatórios

```typescript
// Testes de renderização
test("deve renderizar a página corretamente", () => {
  render(<PaginaTeste />);
  expect(screen.getByText("Título da Página")).toBeInTheDocument();
});

// Testes de interação
test("deve abrir modal ao clicar no botão", () => {
  render(<PaginaTeste />);
  fireEvent.click(screen.getByText("Novo Item"));
  expect(screen.getByRole("dialog")).toBeInTheDocument();
});

// Testes de formatação
test("deve formatar valores monetários corretamente", () => {
  expect(formatarMoedaInput(1234.56)).toBe("1.234,56");
  expect(parsearMoedaInput("1.234,56")).toBe(1234.56);
});
```

### 🔍 Code Review Checklist

- [ ] ✅ Formatação monetária implementada
- [ ] ✅ Estados de loading e erro tratados
- [ ] ✅ Responsividade em mobile/tablet/desktop
- [ ] ✅ Validações de formulário completas
- [ ] ✅ Acessibilidade (ARIA labels, tab navigation)
- [ ] ✅ Performance (memo, useMemo, useCallback)
- [ ] ✅ Testes unitários criados
- [ ] ✅ Documentação atualizada

---

## 📚 Exemplos de Referência

### ✅ Tela Bem Implementada

**ContasPagarSimplificada.tsx** ✅

- Cards de resumo com dados financeiros
- Filtros avançados em componente separado
- Modal profissional com wizard
- Formatação monetária correta
- Estados de erro e loading
- Responsividade completa

### ❌ Problemas Comuns Evitados

- ❌ Campos monetários com `type="number"`
- ❌ Formatação de valores inconsistente
- ❌ Modais sem passos para formulários complexos
- ❌ Falta de validações adequadas
- ❌ Estados de loading/erro ausentes
- ❌ Componentes não responsivos

---

## 🔄 Processo de Desenvolvimento

### 1. **Planejamento** (Antes de começar)

- [ ] Definir requisitos funcionais
- [ ] Mapear fluxos de usuário
- [ ] Identificar campos monetários/numéricos
- [ ] Planejar estrutura de componentes

### 2. **Desenvolvimento** (Durante)

- [ ] Criar estrutura de arquivos padrão
- [ ] Implementar formatações obrigatórias
- [ ] Adicionar estados de loading/erro
- [ ] Testar responsividade
- [ ] Validar acessibilidade

### 3. **Revisão** (Antes de mergear)

- [ ] Code review com checklist
- [ ] Testes automatizados passando
- [ ] Validação com dados reais
- [ ] Documentação atualizada

---

## 📞 Suporte e Dúvidas

### 🆘 Quando Surgir Dúvida

1. **Consultar este documento primeiro**
2. **Verificar implementações de referência**
3. **Testar com dados reais**
4. **Documentar soluções encontradas**

### 📝 Atualizações do Documento

- **Sempre que encontrar novo padrão útil**
- **Quando resolver problema recorrente**
- **Após implementar nova funcionalidade padrão**
- **Durante revisões de código que identifiquem melhorias**

---

## 🎯 Meta: Zero Retrabalho

**Objetivo final:** Seguindo este guia, qualquer desenvolvedor deve conseguir criar telas profissionais, consistentes e sem problemas de formatação ou UX, eliminando a necessidade de correções posteriores.

**Resultado esperado:**

- ✅ Formatação monetária correta desde o início
- ✅ UX consistente em todas as telas
- ✅ Performance otimizada
- ✅ Código manutenível e testável
- ✅ Experiência de usuário profissional

---

_Documento criado em: Dezembro 2024_  
_Versão: 1.0_  
_Status: 📋 Guia ativo para desenvolvimento_
