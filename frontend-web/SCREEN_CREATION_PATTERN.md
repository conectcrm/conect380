# Padrão de Criação de Telas (Funil de Vendas & Produtos)

Este guia consolida o padrão adotado nas telas de **Oportunidades (funil de vendas)** e **Produtos**, alinhado ao tema **Crevasse Professional**. Use-o ao criar novas telas para garantir consistência visual, funcional e de UX. Os exemplos usam React + Tailwind, mas os princípios valem para qualquer stack.

---

## 1. Fundamentos do Tema Crevasse

- **Paleta Base**: `#159A9C` (primária), `#0F7B7D` (hover), `#002333` (texto), `#B4BEC9` (bordas, texto secundário), `#DEEFE7` (fundos suaves), `#FFFFFF` (background).
- **Foco**: use sempre `focus:ring-2 focus:ring-[#159A9C] focus:border-[#159A9C]` em inputs, selects e botões interativos.
- **Botões Primários**: gradiente `from-[#159A9C] to-[#0F7B7D]` com texto branco; estados hover escurecem ligeiramente.
- **Bordas e cartões**: `border-[#DEEFE7]` + sombra leve `shadow-sm`; destaque adicional com `hover:shadow-md`.
- **Tipografia**: títulos `text-[#002333] font-bold`; subtítulos/descrições `text-[#002333]/70` ou `text-[#B4BEC9]` conforme contraste desejado.

---

## 2. Estrutura Base da Página

```tsx
export const NovaTela = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [items, setItems] = useState<ItemType[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    try {
      setIsLoading(true);
      const response = await servico.findAll();
      setItems(response);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb / Voltar para Núcleo */}
      <div className="bg-white border-b px-6 py-4">
        <BackToNucleus nucleusName="CRM" nucleusPath="/nuclei/crm" currentModuleName="Nome da Tela" />
      </div>

      <div className="p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header principal */}
          <HeaderPrincipal isLoading={isLoading} onRefresh={() => carregarDados(true)} />

          {/* Se existirem métricas relevantes, renderize cards de KPIs */}
          <SecaoKPIs data={metricas} />

          {/* Barra de filtros/busca e ações rápidas */}
          <BarraControles
            showFilters={showFilters}
            toggleFilters={() => setShowFilters(prev => !prev)}
            onSearch={setBusca}
            onExport={handleExport}
          />

          {/* Filtros avançados expansíveis */}
          {showFilters && <PainelFiltros filtros={filtros} onApply={aplicarFiltros} onReset={limparFiltros} />}

          {/* Conteúdo principal */}
          <ConteudoPrincipal isLoading={isLoading} items={items} />
        </div>
      </div>

      {/* Modais contextuais */}
      <Modais />
    </div>
  );
};
```

### Elementos Obrigatórios

1. `min-h-screen bg-gray-50`: garante fundo neutro.
2. Header com `BackToNucleus` (breadcrumb) + bloco principal (título, descrição, ações primárias).
3. Espaçamento interno `p-6` + limite `max-w-7xl mx-auto` para manter legibilidade.
4. Estados: loading, erro e vazio sempre tratados (detalhes na seção 6).

---

## 3. Header Principal

Inspirado nas telas de Produtos e Oportunidades.

```tsx
const HeaderPrincipal = ({ isLoading, onRefresh }: { isLoading: boolean; onRefresh: () => void; }) => (
  <div className="bg-white rounded-lg shadow-sm border border-[#DEEFE7] p-6">
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 className="text-3xl font-bold text-[#002333] flex items-center gap-3">
          <Target className="h-8 w-8 text-[#159A9C]" />
          Nome da Tela
          {isLoading && <span className="animate-spin h-5 w-5 border-b-2 border-[#159A9C]"></span>}
        </h1>
        <p className="mt-2 text-[#002333]/70">Descrição contextual curta.</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="inline-flex items-center gap-2 px-4 py-2 border border-[#B4BEC9] rounded-lg text-[#002333] bg-white hover:bg-[#DEEFE7] focus:outline-none focus:ring-2 focus:ring-[#159A9C] disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          Atualizar
        </button>

        <button
          onClick={handleAcaoPrincipal}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-white bg-gradient-to-r from-[#159A9C] to-[#0F7B7D] hover:from-[#0F7B7D] hover:to-[#0C6062] focus:outline-none focus:ring-2 focus:ring-[#159A9C] shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Nova Ação
        </button>
      </div>
    </div>
  </div>
);
```

**Variações**
- Acrescente contadores rápidos ao lado do título quando fizer sentido (ex.: total de oportunidades, valor do pipeline).
- Se a tela precisar de abas ou troca de visualizações (Kanban, lista, calendário), adicione um `toggle` aqui, conforme Oportunidades.

---

## 4. KPIs e Cards de Métricas (Opcional)

Nem toda tela precisa de KPIs. Use apenas quando houver indicadores relevantes (ex.: estatísticas de produtos, métricas do funil).

```tsx
const SecaoKPIs = ({ data }: { data?: KPIData[] }) => {
  if (!data || data.length === 0) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {data.map(card => (
        <div key={card.id} className="rounded-xl p-6 shadow-sm border border-[#DEEFE7] bg-white hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-[#002333]/70">{card.label}</p>
              <p className="mt-2 text-3xl font-bold text-[#002333]">{card.value}</p>
              {card.description && <p className="mt-2 text-xs text-[#002333]/70">{card.description}</p>}
            </div>
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${card.iconBackground}`}>
              <card.icon className={`w-6 h-6 ${card.iconColor}`} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
```

- Em KPIs mais destacados, aplique gradientes no card inteiro (`bg-gradient-to-br from-blue-100 to-blue-200`) como nas versões recentes de Propostas.
- Mantenha o equilíbrio: 3–4 cards principais no máximo.
- **Não usar** cards sólidos coloridos fora da paleta Crevasse. Quando precisar de destaque, reproduza os gradientes suaves utilizados em Produtos e Oportunidades (fundos claros com bordas `#DEEFE7`, ícones sobre fundo branco translúcido).

---

## 5. Barra de Controles (Filtros, Busca, Ações)

Combine padrões de Produtos (busca + selects) e Oportunidades (visualizações, chips de filtro).

```tsx
const BarraControles = ({ showFilters, toggleFilters, onSearch, onExport }: PropsControles) => (
  <div className="bg-white rounded-lg shadow-sm border border-[#DEEFE7] p-6">
    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
      <div className="relative w-full lg:max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#B4BEC9] w-5 h-5" />
        <input
          type="text"
          placeholder="Buscar..."
          onChange={(e) => onSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-[#B4BEC9] rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-[#159A9C] text-[#002333] placeholder-[#B4BEC9]"
        />
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={toggleFilters}
          className={`px-4 py-2 rounded-lg border flex items-center gap-2 transition-colors ${showFilters ? 'bg-[#159A9C] text-white border-[#159A9C]' : 'bg-white text-[#002333] border-[#B4BEC9] hover:bg-[#DEEFE7]'}`}
        >
          <Filter className="w-4 h-4" /> Filtros
        </button>

        <button
          onClick={onExport}
          className="px-4 py-2 border border-[#B4BEC9] rounded-lg text-[#002333] bg-white hover:bg-[#DEEFE7] focus:outline-none focus:ring-2 focus:ring-[#159A9C]"
        >
          <Download className="w-4 h-4" /> Exportar
        </button>
      </div>
    </div>
  </div>
);
```

**Visualizações alternadas (opcional)**
- Quando houver múltiplos layouts (Kanban, lista, cards), use `flex bg-gray-100 rounded-lg p-1` com botões que alternam classes `bg-white text-[#159A9C]` e `text-gray-600` (ver OportunidadesPage).

---

## 6. Estados Obrigatórios

### Loading
- Centralize spinner com `animate-spin` + mensagem em `text-[#002333]/70`.

### Erro
- Ícone `AlertCircle` vermelho, mensagem clara e botão “Tentar novamente” com cor primária.

### Vazio
- Ícone contextual (`Package`, `Target`, etc.), título `text-[#002333]`, mensagem auxiliar `text-[#002333]/70` e, se possível, CTA (ex.: “Criar primeiro item”).

```tsx
if (items.length === 0) {
  return (
    <div className="text-center py-12">
      <Package className="mx-auto h-12 w-12 text-[#B4BEC9]" />
      <h3 className="mt-2 text-sm font-semibold text-[#002333]">Nenhum item encontrado</h3>
      <p className="mt-1 text-sm text-[#002333]/70">Ajuste os filtros ou crie um novo registro.</p>
      <button onClick={handleNovo} className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-[#159A9C] text-white rounded-lg hover:bg-[#138A8C]">
        <Plus className="w-4 h-4" /> Novo Registro
      </button>
    </div>
  );
}
```

---

## 7. Conteúdo Principal

O conteúdo varia conforme o contexto:

1. **Listas/Tabelas (Produtos)**
   - `table` com `divide-y divide-[#DEEFE7]`, cabeçalho `bg-[#DEEFE7]`.
   - Linhas com `hover:bg-[#DEEFE7]/40` e ações alinhadas à direita.
   - Use badges (`inline-flex px-2.5 py-0.5 rounded-full border`) seguindo `statusConfig`.

2. **Kanban/Board (Oportunidades)**
   - Colunas com `bg-white border border-[#DEEFE7] rounded-xl` e header com métricas.
   - Cartões arrastáveis usando cores secundárias para status.

3. **Alternância de Visualizações**
   - Mantenha componentes distintos (`KanbanView`, `ListView`, `CalendarView`) para separar responsabilidades.
   - Sincronize filtros e busca entre as visualizações.

4. **Cards Resumo (Propostas / Produtos)**
   - `grid` responsivo `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`.
   - Sombras leves e `hover:shadow-lg` para reforçar interatividade.

---

## 8. Interações Comuns

- **Atualização manual**: botão `RefreshCw` com `animate-spin` enquanto carrega.
- **Busca com debounce**: seguir padrão de `useEffect` com `setTimeout` (500ms) usado em Oportunidades.
- **Modais**: centralizados, `bg-white rounded-lg`, botões alinhados à direita. Reutilize componentes existentes (`ModalCadastroProduto`, `ModalOportunidadeAvancado`).
- **Toasts/Notificações**: use `toast` do `react-hot-toast` ou um banner fixo (`fixed top-4 right-4`) como em Propostas.
- **Ações em massa**: se necessário, renderize barra fixa inferior (ver `SelecaoMultipla` em Propostas).

---

## 9. Boas Práticas Reforçadas

1. **Consistência de estados**: loading, erro e vazio nunca podem faltar.
2. **Focus visível** em todos os elementos navegáveis por teclado.
3. **Responsividade**: use `flex-col sm:flex-row`, `grid-cols-1 md:grid-cols-2` etc.
4. **Dados reais**: sanitizar strings (`safeRender`) quando necessário; cache/calls otimizados (ver `PropostaActions` para inspiração).
5. **Não duplicar lógica**: isolar hooks e serviços; cada tela consome `services/*` que espelham rotas do backend.
6. **Sem KPIs irrelevantes**: só renderize cards de métricas se houver insight claro.
7. **Cores de status**: verde para sucesso, amarelo para atenção, vermelho para crítica, azul para informação.
8. **Acessibilidade**: use ícones com `aria-label` quando estiverem em botões sem texto.

---

## 10. Checklist Antes de Finalizar

- [ ] Copiou a estrutura base (container + header + conteúdo)?
- [ ] Respeitou a paleta Crevasse e regras de foco?
- [ ] Implementou ações principais e secundárias conforme contexto?
- [ ] Avaliou se KPIs são necessários (ou deixou a seção oculta)?
- [ ] Tratou loading, erro e vazio?
- [ ] Garantiu responsividade (testar mobile, tablet, desktop)?
- [ ] Conectou aos serviços corretos do backend?
- [ ] Adicionou modais e toasts alinhados ao padrão existente?

Com este padrão você pode acelerar a criação de novas telas mantendo a experiência consistente com as áreas de Funil de Vendas (Oportunidades) e Produtos. Ajuste conforme o contexto, mas preserve os fundamentos do tema Crevasse.
