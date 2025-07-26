# ✅ Checklist de Desenvolvimento - Novas Telas ConectCRM

## 🚀 ANTES DE COMEÇAR

### 📋 Planejamento Obrigatório

- [ ] **Campos identificados**: Listar todos os campos monetários/numéricos
- [ ] **Fluxo mapeado**: Definir passos do formulário (se modal complexo)
- [ ] **Estados definidos**: Loading, erro, vazio, sucesso
- [ ] **Responsividade planejada**: Mobile, tablet, desktop

---

## 💰 FORMATAÇÃO MONETÁRIA (CRÍTICO)

### ❗ NUNCA ESQUECER

- [ ] **Input type="text"** (nunca "number" para moeda)
- [ ] **Função formatarMoedaInput()** implementada
- [ ] **Função parsearMoedaInput()** implementada
- [ ] **Handler handleMoneyChange()** implementado
- [ ] **Formato brasileiro**: 1.234,56 (ponto para milhares, vírgula para decimal)
- [ ] **Campo vazio permitido**: Não mostrar 0,00 quando vazio

### 🔧 Template Rápido

```typescript
// SEMPRE usar este template para campos monetários:
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

<input
  type="text"
  value={formData.valor === 0 ? "" : formatarMoedaInput(formData.valor)}
  onChange={(e) => handleMoneyChange("valor", e.target.value)}
  placeholder="0,00"
/>;
```

---

## 🏗️ ESTRUTURA DA TELA

### 📁 Componentes Obrigatórios

- [ ] **BackToNucleus** implementado
- [ ] **Cards de resumo** (4 cards mínimo)
- [ ] **Filtros avançados** em componente separado
- [ ] **Barra de busca** funcional
- [ ] **Ações em massa** (selecionar múltiplos)
- [ ] **Modal/formulário** profissional

### 🎨 Layout Padrão

```tsx
<div className="p-6 bg-gray-50 min-h-screen">
  <BackToNucleus />

  {/* Cabeçalho */}
  <div className="mb-6">
    <h1 className="text-3xl font-bold text-gray-900">Título</h1>
    <p className="text-gray-600 mt-1">Descrição</p>
  </div>

  {/* Cards de resumo */}
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
    {/* 4 cards obrigatórios */}
  </div>

  {/* Filtros e busca */}
  {/* Tabela de dados */}
  {/* Modais */}
</div>
```

---

## 🚪 MODAIS E FORMULÁRIOS

### 📝 Modal Complexo (3+ campos)

- [ ] **Sistema wizard** com passos
- [ ] **Indicador de progresso** visual
- [ ] **Navegação entre passos** (Anterior/Próximo)
- [ ] **Validação por passo** implementada
- [ ] **Revisão final** antes de salvar

### ✅ Validações Obrigatórias

- [ ] **Campos obrigatórios** validados
- [ ] **Emails** validados (regex)
- [ ] **CPF/CNPJ** validados
- [ ] **Valores numéricos** > 0 quando necessário
- [ ] **Mensagens de erro** claras e específicas

---

## 📊 DADOS E ESTADOS

### ⏳ Estados da Interface

- [ ] **Loading state** principal (página inteira)
- [ ] **Loading state** de ações (botões)
- [ ] **Error state** com retry
- [ ] **Empty state** com ação
- [ ] **Success state** com feedback

### 🔍 Filtros e Busca

- [ ] **Busca em tempo real** (debounce 300ms)
- [ ] **Filtros persistentes** na sessão
- [ ] **Contador de filtros** ativos
- [ ] **Limpar filtros** funcional
- [ ] **Múltiplos campos** de busca

---

## 📱 RESPONSIVIDADE

### 📐 Breakpoints Obrigatórios

- [ ] **Mobile** (1 coluna): `grid-cols-1`
- [ ] **Tablet** (2 colunas): `md:grid-cols-2`
- [ ] **Desktop** (4 colunas): `lg:grid-cols-4`
- [ ] **Tabelas** com scroll horizontal em mobile
- [ ] **Modais** não quebram em mobile

---

## ⚡ PERFORMANCE

### 🚀 Otimizações Críticas

- [ ] **useMemo** para cálculos pesados
- [ ] **useCallback** para handlers
- [ ] **React.memo** para componentes pesados
- [ ] **Lazy loading** para modais grandes
- [ ] **Debounce** para busca

---

## 🎨 VISUAL E UX

### 🎯 Padrões Visuais

- [ ] **Cores consistentes**: blue-600, green-600, red-600, orange-600
- [ ] **Espaçamentos padronizados**: p-4, p-6, gap-4, gap-6
- [ ] **Ícones Lucide** React
- [ ] **Estados visuais**: hover, active, disabled
- [ ] **Feedback visual** para ações

### 🔤 Tipografia

- [ ] **Título página**: `text-3xl font-bold text-gray-900`
- [ ] **Título seção**: `text-xl font-semibold text-gray-900`
- [ ] **Texto padrão**: `text-sm text-gray-900`
- [ ] **Texto secundário**: `text-sm text-gray-600`

---

## 🧪 ANTES DE MERGEAR

### ✅ Checklist Final

- [ ] **Formatação monetária** testada com dados reais
- [ ] **Modal** abre e fecha corretamente
- [ ] **Validações** funcionam em todos os campos
- [ ] **Responsividade** testada em 3 tamanhos
- [ ] **Loading/Error** estados testados
- [ ] **Busca e filtros** funcionais
- [ ] **Ações em massa** implementadas
- [ ] **Performance** sem lentidão visível

### 🔍 Testes Manuais

- [ ] **Dados reais**: Testar com dados do banco
- [ ] **Campos vazios**: Limpar todos os campos
- [ ] **Valores grandes**: Testar com números grandes
- [ ] **Mobile**: Abrir no celular/tablet
- [ ] **Error simulation**: Simular erros de API

---

## ❌ PROBLEMAS PARA EVITAR

### 🚫 Nunca Fazer

- ❌ **Input type="number"** para moeda
- ❌ **Formatação inconsistente** de valores
- ❌ **Modal sem loading** state
- ❌ **Sem validação** de campos obrigatórios
- ❌ **Sem responsive** em mobile
- ❌ **Sem estados de erro** tratados
- ❌ **Sem componente separado** para filtros
- ❌ **Hardcode** de valores

### ⚠️ Cuidados Especiais

- ⚠️ **Valores monetários**: Sempre formatação brasileira
- ⚠️ **Datas**: Sempre formato brasileiro (DD/MM/AAAA)
- ⚠️ **CPF/CNPJ**: Validação e formatação
- ⚠️ **Estados de loading**: Não bloquear interface desnecessariamente
- ⚠️ **Mensagens de erro**: Específicas e acionáveis

---

## 🆘 DÚVIDAS FREQUENTES

### ❓ Campo monetário não formata?

✅ Verificar: `type="text"`, `formatarMoedaInput()`, `handleMoneyChange()`

### ❓ Modal não abre?

✅ Verificar: estado booleano, componente importado, z-index

### ❓ Validação não funciona?

✅ Verificar: função de validação chamada, estado de errors atualizado

### ❓ Tabela não responsive?

✅ Adicionar: `overflow-x-auto` na div container da tabela

### ❓ Performance lenta?

✅ Verificar: useMemo em filtros, useCallback em handlers, componentes memo

---

## 📚 REFERÊNCIAS RÁPIDAS

### 🎯 Telas de Referência

- **✅ ContasPagarSimplificada.tsx**: Exemplo completo e correto
- **✅ ModalContaPagarNovo.tsx**: Modal wizard profissional
- **✅ FiltrosAvancados.tsx**: Sistema de filtros completo

### 🔗 Links Úteis

- **Lucide Icons**: https://lucide.dev/icons/
- **Tailwind CSS**: https://tailwindcss.com/docs
- **React Hook Form**: Para formulários complexos
- **React Query**: Para gerenciamento de estado de servidor

---

## 🎯 OBJETIVO FINAL

**Meta**: Zero retrabalho - tela funcional e profissional na primeira versão.

**Resultado esperado**:

- ✅ Formatação correta desde o início
- ✅ UX profissional e intuitiva
- ✅ Performance otimizada
- ✅ Responsividade completa
- ✅ Código manutenível

---

_🚀 Use este checklist em TODA nova tela para garantir qualidade e consistência!_
