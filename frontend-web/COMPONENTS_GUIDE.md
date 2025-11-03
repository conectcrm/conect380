# 🧩 Guia de Componentes - ConectCRM

## 📘 Referência Rápida para Desenvolvimento

Este guia contém **componentes prontos** seguindo o **tema Crevasse Professional** e as diretrizes do sistema.

---

## 🎨 Tema Crevasse - Cores Principais

```typescript
// Paleta oficial - USE SEMPRE estas cores
const CREVASSE = {
  primary: '#159A9C',       // Teal - ações principais
  primaryHover: '#0F7B7D',  // Teal escuro - hover
  text: '#002333',          // Azul escuro - texto
  secondary: '#B4BEC9',     // Cinza azulado - secundário
  border: '#B4BEC9',        // Bordas
  borderLight: '#DEEFE7',   // Bordas claras
  background: '#FFFFFF',    // Fundo branco
  backgroundSoft: '#DEEFE7', // Fundo suave
};
```

---

## 1️⃣ Botões

### Botão Primary (Crevasse Teal)

```tsx
<button
  onClick={handleAction}
  disabled={loading}
  className="bg-[#159A9C] hover:bg-[#0F7B7D] text-white px-6 py-3 rounded-lg 
             flex items-center gap-2 transition-colors shadow-sm 
             disabled:opacity-50 disabled:cursor-not-allowed"
>
  <Plus className="w-5 h-5" />
  Criar Novo
</button>
```

### Botão Secondary (Outline)

```tsx
<button
  onClick={handleAction}
  className="border-2 border-[#B4BEC9] text-[#002333] px-6 py-3 rounded-lg 
             flex items-center gap-2 hover:bg-[#DEEFE7] transition-colors"
>
  <Edit2 className="w-5 h-5" />
  Editar
</button>
```

### Botão Danger (Deletar)

```tsx
<button
  onClick={handleDelete}
  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg 
             flex items-center gap-2 transition-colors"
>
  <Trash2 className="w-4 h-4" />
  Deletar
</button>
```

### Botão Icon (Refresh, Close)

```tsx
<button
  onClick={handleRefresh}
  disabled={loading}
  className="p-3 border border-[#B4BEC9] rounded-lg hover:bg-[#DEEFE7] 
             transition-colors disabled:opacity-50"
>
  <RefreshCw className={`w-5 h-5 text-[#002333] ${loading ? 'animate-spin' : ''}`} />
</button>
```

---

## 2️⃣ Inputs e Formulários

### Input de Texto com Label

```tsx
<div className="space-y-2">
  <label className="block text-sm font-medium text-[#002333]">
    Nome do Item
  </label>
  <input
    type="text"
    value={nome}
    onChange={(e) => setNome(e.target.value)}
    placeholder="Digite o nome..."
    className="w-full px-4 py-3 border border-[#B4BEC9] rounded-lg 
               focus:ring-2 focus:ring-[#159A9C] focus:border-transparent 
               transition-colors placeholder-[#B4BEC9]"
  />
</div>
```

### Input com Ícone (Search)

```tsx
<div className="relative">
  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 
                     text-[#B4BEC9] w-5 h-5" />
  <input
    type="text"
    placeholder="Buscar..."
    value={busca}
    onChange={(e) => setBusca(e.target.value)}
    className="w-full pl-11 pr-4 py-3 border border-[#B4BEC9] rounded-lg 
               focus:ring-2 focus:ring-[#159A9C] focus:border-transparent"
  />
</div>
```

### Select (Dropdown)

```tsx
<div className="space-y-2">
  <label className="block text-sm font-medium text-[#002333]">
    Categoria
  </label>
  <select
    value={categoria}
    onChange={(e) => setCategoria(e.target.value)}
    className="w-full px-4 py-3 border border-[#B4BEC9] rounded-lg 
               focus:ring-2 focus:ring-[#159A9C] focus:border-transparent 
               bg-white text-[#002333]"
  >
    <option value="">Selecione...</option>
    <option value="1">Categoria 1</option>
    <option value="2">Categoria 2</option>
  </select>
</div>
```

### Textarea

```tsx
<div className="space-y-2">
  <label className="block text-sm font-medium text-[#002333]">
    Descrição
  </label>
  <textarea
    value={descricao}
    onChange={(e) => setDescricao(e.target.value)}
    rows={4}
    placeholder="Digite a descrição..."
    className="w-full px-4 py-3 border border-[#B4BEC9] rounded-lg 
               focus:ring-2 focus:ring-[#159A9C] focus:border-transparent 
               transition-colors resize-none"
  />
</div>
```

### Checkbox

```tsx
<label className="flex items-center gap-3 cursor-pointer group">
  <input
    type="checkbox"
    checked={ativo}
    onChange={(e) => setAtivo(e.target.checked)}
    className="w-5 h-5 border-2 border-[#B4BEC9] rounded 
               text-[#159A9C] focus:ring-2 focus:ring-[#159A9C]"
  />
  <span className="text-[#002333] group-hover:text-[#159A9C] transition-colors">
    Item Ativo
  </span>
</label>
```

---

## 3️⃣ Cards

### Card Básico

```tsx
<div className="bg-white rounded-xl shadow-sm border border-[#B4BEC9] p-6 
                hover:shadow-lg transition-shadow duration-300">
  <h3 className="text-xl font-semibold text-[#002333] mb-2">
    Título do Card
  </h3>
  <p className="text-[#B4BEC9] text-sm">
    Descrição ou conteúdo do card
  </p>
</div>
```

### Card de Métrica (Dashboard)

```tsx
<div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 
                hover:shadow-lg transition-shadow duration-300">
  <div className="flex items-center justify-between">
    <div>
      <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">
        Total de Itens
      </p>
      <p className="text-3xl font-bold text-gray-900 mt-2">
        {total}
      </p>
      <p className="text-xs text-gray-400 mt-1">
        📊 Atualizado agora
      </p>
    </div>
    <div className="p-4 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl">
      <Package className="w-8 h-8 text-blue-600" />
    </div>
  </div>
</div>
```

### Card de Lista (Item Clicável)

```tsx
<div className="bg-white rounded-lg border border-[#B4BEC9] p-5 
                hover:shadow-lg hover:border-[#159A9C] transition-all 
                duration-300 cursor-pointer group">
  <div className="flex justify-between items-start mb-3">
    <div className="flex-1">
      <h3 className="text-lg font-semibold text-[#002333] 
                     group-hover:text-[#159A9C] transition-colors">
        Nome do Item
      </h3>
      <p className="text-sm text-[#B4BEC9] mt-1">
        Descrição curta do item
      </p>
    </div>
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full 
                     text-xs font-medium bg-green-100 text-green-800">
      Ativo
    </span>
  </div>
  
  <div className="flex items-center justify-between text-xs text-[#B4BEC9]">
    <span>Criado em: 01/11/2025</span>
    <div className="flex gap-2">
      <button className="p-1 hover:text-[#159A9C] transition-colors">
        <Edit2 className="w-4 h-4" />
      </button>
      <button className="p-1 hover:text-red-600 transition-colors">
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  </div>
</div>
```

---

## 4️⃣ Badges (Status)

### Badge Ativo (Verde)

```tsx
<span className="inline-flex items-center px-2.5 py-0.5 rounded-full 
                 text-xs font-medium bg-green-100 text-green-800">
  <CheckCircle className="w-3 h-3 mr-1" />
  Ativo
</span>
```

### Badge Pendente (Amarelo)

```tsx
<span className="inline-flex items-center px-2.5 py-0.5 rounded-full 
                 text-xs font-medium bg-yellow-100 text-yellow-800">
  <Clock className="w-3 h-3 mr-1" />
  Pendente
</span>
```

### Badge Inativo (Cinza)

```tsx
<span className="inline-flex items-center px-2.5 py-0.5 rounded-full 
                 text-xs font-medium bg-gray-100 text-gray-800">
  Inativo
</span>
```

### Badge Erro (Vermelho)

```tsx
<span className="inline-flex items-center px-2.5 py-0.5 rounded-full 
                 text-xs font-medium bg-red-100 text-red-800">
  <AlertCircle className="w-3 h-3 mr-1" />
  Erro
</span>
```

---

## 5️⃣ Modal/Dialog

### Modal Completo

```tsx
{showModal && (
  <div className="fixed inset-0 z-50 flex items-center justify-center 
                  bg-black bg-opacity-50 p-4">
    <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full 
                    max-h-[90vh] overflow-y-auto">
      {/* Header */}
      <div className="flex justify-between items-center p-6 border-b 
                      border-[#DEEFE7]">
        <h2 className="text-2xl font-bold text-[#002333] flex items-center">
          <Plus className="w-6 h-6 mr-3 text-[#159A9C]" />
          Novo Item
        </h2>
        <button
          onClick={() => setShowModal(false)}
          className="p-2 hover:bg-[#DEEFE7] rounded-lg transition-colors"
        >
          <X className="w-5 h-5 text-[#B4BEC9]" />
        </button>
      </div>

      {/* Body */}
      <div className="p-6 space-y-4">
        {/* Seus inputs aqui */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-[#002333]">
            Nome
          </label>
          <input
            type="text"
            className="w-full px-4 py-3 border border-[#B4BEC9] rounded-lg 
                       focus:ring-2 focus:ring-[#159A9C]"
          />
        </div>
      </div>

      {/* Footer */}
      <div className="flex justify-end gap-3 p-6 border-t border-[#DEEFE7]">
        <button
          onClick={() => setShowModal(false)}
          className="px-6 py-3 border-2 border-[#B4BEC9] text-[#002333] 
                     rounded-lg hover:bg-[#DEEFE7] transition-colors"
        >
          Cancelar
        </button>
        <button
          onClick={handleSave}
          disabled={loading}
          className="bg-[#159A9C] hover:bg-[#0F7B7D] text-white px-6 py-3 
                     rounded-lg transition-colors disabled:opacity-50"
        >
          {loading ? 'Salvando...' : 'Salvar'}
        </button>
      </div>
    </div>
  </div>
)}
```

---

## 6️⃣ Estados de Loading

### Spinner Inline

```tsx
{loading && (
  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#159A9C]"></div>
)}
```

### Loading Card (Skeleton)

```tsx
<div className="bg-white rounded-lg border border-[#B4BEC9] p-5 animate-pulse">
  <div className="h-4 bg-[#DEEFE7] rounded w-3/4 mb-3"></div>
  <div className="h-3 bg-[#DEEFE7] rounded w-1/2 mb-2"></div>
  <div className="h-3 bg-[#DEEFE7] rounded w-2/3"></div>
</div>
```

### Loading Full Page

```tsx
{loading && (
  <div className="flex items-center justify-center py-20">
    <div className="text-center">
      <div className="animate-spin rounded-full h-16 w-16 border-b-4 
                      border-[#159A9C] mx-auto mb-4"></div>
      <p className="text-[#B4BEC9] text-lg">Carregando...</p>
    </div>
  </div>
)}
```

---

## 7️⃣ Estados Vazios

### Empty State com CTA

```tsx
{items.length === 0 && !loading && (
  <div className="text-center py-20">
    <div className="flex justify-center mb-6">
      <div className="p-6 bg-gradient-to-br from-blue-100 to-blue-200 
                      rounded-full">
        <Package className="w-16 h-16 text-blue-600" />
      </div>
    </div>
    <h3 className="text-2xl font-bold text-[#002333] mb-3">
      Nenhum item encontrado
    </h3>
    <p className="text-[#B4BEC9] mb-8 max-w-md mx-auto">
      Comece criando seu primeiro item para gerenciar suas informações
    </p>
    <button
      onClick={handleNovo}
      className="bg-[#159A9C] hover:bg-[#0F7B7D] text-white px-8 py-4 
                 rounded-lg inline-flex items-center gap-2 text-lg 
                 shadow-lg transition-colors"
    >
      <Plus className="w-6 h-6" />
      Criar Primeiro Item
    </button>
  </div>
)}
```

---

## 8️⃣ Estados de Erro

### Error Alert

```tsx
{error && (
  <div className="bg-red-50 border-l-4 border-red-600 p-4 rounded-r-lg mb-6">
    <div className="flex items-start">
      <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
      <div className="flex-1">
        <h3 className="text-sm font-semibold text-red-800 mb-1">
          Erro ao carregar dados
        </h3>
        <p className="text-sm text-red-700">{error}</p>
      </div>
      <button
        onClick={() => setError(null)}
        className="ml-3 text-red-600 hover:text-red-800"
      >
        <X className="w-5 h-5" />
      </button>
    </div>
  </div>
)}
```

---

## 9️⃣ Tabelas

### Tabela Responsiva

```tsx
<div className="bg-white rounded-lg shadow-sm border border-[#B4BEC9] overflow-hidden">
  <div className="overflow-x-auto">
    <table className="w-full">
      <thead className="bg-[#DEEFE7] border-b border-[#B4BEC9]">
        <tr>
          <th className="px-6 py-4 text-left text-xs font-semibold 
                         text-[#002333] uppercase tracking-wider">
            Nome
          </th>
          <th className="px-6 py-4 text-left text-xs font-semibold 
                         text-[#002333] uppercase tracking-wider">
            Status
          </th>
          <th className="px-6 py-4 text-right text-xs font-semibold 
                         text-[#002333] uppercase tracking-wider">
            Ações
          </th>
        </tr>
      </thead>
      <tbody className="divide-y divide-[#DEEFE7]">
        {items.map((item) => (
          <tr key={item.id} className="hover:bg-[#DEEFE7] transition-colors">
            <td className="px-6 py-4 text-sm text-[#002333] font-medium">
              {item.nome}
            </td>
            <td className="px-6 py-4 text-sm">
              <span className="inline-flex items-center px-2.5 py-0.5 
                               rounded-full text-xs font-medium 
                               bg-green-100 text-green-800">
                Ativo
              </span>
            </td>
            <td className="px-6 py-4 text-right text-sm space-x-2">
              <button className="text-[#159A9C] hover:text-[#0F7B7D]">
                <Edit2 className="w-4 h-4" />
              </button>
              <button className="text-red-600 hover:text-red-800">
                <Trash2 className="w-4 h-4" />
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
</div>
```

---

## 🔟 Breadcrumb com BackToNucleus

### BackToNucleus (OBRIGATÓRIO em todas as páginas)

```tsx
import { BackToNucleus } from '../components/navigation/BackToNucleus';

// No header da página:
<div className="bg-white border-b px-6 py-4">
  <BackToNucleus
    nucleusName="Atendimento"
    nucleusPath="/nuclei/atendimento"
  />
</div>
```

---

## 1️⃣1️⃣ Grid Responsivo

### Grid de Cards (Padrão)

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {items.map((item) => (
    <div key={item.id} className="bg-white rounded-lg border border-[#B4BEC9] p-5">
      {/* Conteúdo do card */}
    </div>
  ))}
</div>
```

### Grid de Métricas (Dashboard)

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
  {/* 4 cards de métricas */}
</div>
```

---

## 1️⃣2️⃣ Toasts/Notifications

### Toast de Sucesso

```tsx
<div className="fixed bottom-6 right-6 bg-white border-l-4 border-green-600 
                rounded-lg shadow-xl p-4 flex items-center gap-3 
                animate-slide-in-right">
  <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
  <div>
    <p className="font-semibold text-[#002333]">Sucesso!</p>
    <p className="text-sm text-[#B4BEC9]">Item criado com sucesso</p>
  </div>
  <button className="ml-4 text-[#B4BEC9] hover:text-[#002333]">
    <X className="w-5 h-5" />
  </button>
</div>
```

---

## 1️⃣3️⃣ Tabs

### Tabs Horizontais

```tsx
<div className="bg-white rounded-lg border border-[#B4BEC9] mb-6">
  <div className="flex border-b border-[#DEEFE7]">
    <button
      onClick={() => setActiveTab('geral')}
      className={`px-6 py-4 text-sm font-medium transition-colors border-b-2 
                  ${activeTab === 'geral' 
                    ? 'border-[#159A9C] text-[#159A9C]' 
                    : 'border-transparent text-[#B4BEC9] hover:text-[#002333]'}`}
    >
      Geral
    </button>
    <button
      onClick={() => setActiveTab('config')}
      className={`px-6 py-4 text-sm font-medium transition-colors border-b-2 
                  ${activeTab === 'config' 
                    ? 'border-[#159A9C] text-[#159A9C]' 
                    : 'border-transparent text-[#B4BEC9] hover:text-[#002333]'}`}
    >
      Configurações
    </button>
  </div>
  
  <div className="p-6">
    {activeTab === 'geral' && <div>Conteúdo Geral</div>}
    {activeTab === 'config' && <div>Conteúdo Configurações</div>}
  </div>
</div>
```

---

## 🎯 Dicas de Uso

### ✅ Sempre Fazer
- Usar cores da paleta Crevasse
- Adicionar estados de loading
- Implementar estado vazio
- Incluir tratamento de erro
- Usar transições suaves (`transition-colors`, `duration-300`)
- Grid responsivo (mobile-first)
- BackToNucleus em todas as páginas

### ❌ Nunca Fazer
- Cores hardcoded fora da paleta
- Esquecer loading states
- Ignorar estado vazio
- Usar componentes shadcn/ui
- Grid fixo sem responsividade
- Modal sem botão de fechar

---

## 📚 Referências

- **Template Base**: `frontend-web/src/pages/_TemplatePage.tsx`
- **Design Guidelines**: `frontend-web/DESIGN_GUIDELINES.md`
- **Copilot Instructions**: `.github/copilot-instructions.md`
- **Theme Context**: `frontend-web/src/contexts/ThemeContext.tsx`

---

## 🎨 Paleta de Gradientes (Dashboard Cards)

```tsx
// Blue (Total/Geral)
className="bg-gradient-to-br from-blue-100 to-blue-200"
className="text-blue-600"

// Green (Sucesso/Aprovado)
className="bg-gradient-to-br from-green-100 to-green-200"
className="text-green-600"

// Yellow (Pendente/Ativo)
className="bg-gradient-to-br from-yellow-100 to-yellow-200"
className="text-yellow-600"

// Purple (Personalizado)
className="bg-gradient-to-br from-purple-100 to-purple-200"
className="text-purple-600"

// Red (Erro/Vencido)
className="bg-gradient-to-br from-red-100 to-red-200"
className="text-red-600"

// Gray (Inativo)
className="bg-gradient-to-br from-gray-100 to-gray-200"
className="text-gray-600"
```

---

**🚀 Use este guia como referência rápida ao desenvolver novas telas!**

**Última atualização**: Novembro 2025
