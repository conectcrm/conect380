# Frontend - ConectCRM

## 🎨 Criando Novas Telas

### ⚡ Quick Start

```powershell
# 1. Copie o template
cp src/pages/_TemplatePage.tsx src/pages/MinhaNovaPage.tsx

# 2. Abra e busque por "[PERSONALIZAR]"
# 3. Substitua conforme suas necessidades
# 4. Registre a rota em App.tsx
# 5. Adicione no menu em src/config/menuConfig.ts
```

### 📚 Documentação Completa

Antes de criar qualquer tela, **LEIA**:

- **Design Guidelines**: [`DESIGN_GUIDELINES.md`](./DESIGN_GUIDELINES.md)
- **Template Base**: [`src/pages/_TemplatePage.tsx`](./src/pages/_TemplatePage.tsx)
- **Instruções Copilot**: [`../.github/copilot-instructions.md`](../.github/copilot-instructions.md)

### 🎨 Paleta de Cores

Cores EXATAS que devem ser usadas (copie e cole):

```typescript
const CORES_SISTEMA = {
  // Texto
  primaryDark: '#002333',      // Títulos e textos principais
  secondaryGray: '#B4BEC9',    // Textos secundários
  
  // Módulos
  comercial: '#159A9C',        // Teal - Comercial
  atendimento: '#9333EA',      // Purple - Atendimento
  financeiro: '#16A34A',       // Green - Financeiro
  gestao: '#2563EB',           // Blue - Gestão
};
```

### 🚀 Exemplos Práticos

Use estas páginas como referência:

1. **Módulo Comercial**: [`src/pages/CotacaoPage.tsx`](./src/pages/CotacaoPage.tsx)
   - Cor: `#159A9C` (teal)
   - Ícone: `FileText`
   - Dashboard completo com filtros

2. **Módulo Atendimento**: [`src/pages/GestaoEquipesPage.tsx`](./src/pages/GestaoEquipesPage.tsx)
   - Cor: `#9333EA` (purple)
   - Ícone: `Users`
   - CRUD completo com modais

### ✅ Checklist de Nova Tela

Ao criar uma tela, certifique-se de:

- [ ] Copiou `_TemplatePage.tsx` como base
- [ ] Substituiu TODOS os `[PERSONALIZAR]`
- [ ] Usou cor correta do módulo
- [ ] Incluiu `BackToNucleus` no header
- [ ] Implementou 4 dashboard cards com gradientes
- [ ] Adicionou barra de busca/filtros
- [ ] Grid responsivo (`grid-cols-1 md:grid-cols-2 lg:grid-cols-3`)
- [ ] Estado vazio com call-to-action
- [ ] Loading states
- [ ] Error handling
- [ ] Badges de status padronizados
- [ ] Hover effects nos cards
- [ ] Modais com botão X de fechar
- [ ] TypeScript interfaces definidas
- [ ] Rota registrada em `App.tsx`
- [ ] Item adicionado em `menuConfig.ts`
- [ ] Testado em mobile e desktop

### 🚫 Erros Comuns a Evitar

#### ❌ NÃO use componentes shadcn/ui:
```typescript
// ERRADO ❌
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Dialog } from '../components/ui/dialog';

// CORRETO ✅
// Use Tailwind CSS puro em <button>, <div>, etc.
<button className="bg-[#9333EA] hover:bg-[#7E22CE] px-6 py-3 rounded-lg">
```

#### ❌ NÃO use cores aleatórias:
```typescript
// ERRADO ❌
<Users className="text-blue-500" />

// CORRETO ✅
<Users className="text-[#9333EA]" /> // Cor exata do módulo
```

#### ❌ NÃO esqueça BackToNucleus:
```typescript
// ERRADO ❌
<div className="p-6">
  <h1>Título</h1>
  ...

// CORRETO ✅
<div className="bg-white border-b px-6 py-4">
  <BackToNucleus nucleusName="Atendimento" nucleusPath="/atendimento" />
</div>
```

### 🎯 Estrutura Padrão de Página

```tsx
<div className="min-h-screen bg-gray-50">
  {/* 1. Header com breadcrumb */}
  <div className="bg-white border-b px-6 py-4">
    <BackToNucleus nucleusName="..." nucleusPath="..." />
  </div>

  {/* 2. Container principal */}
  <div className="p-6">
    <div className="max-w-7xl mx-auto">
      
      {/* 3. Título da página */}
      <div className="bg-white rounded-lg shadow-sm border mb-6 px-6 py-6">
        <h1 className="text-3xl font-bold text-[#002333] flex items-center">
          <Icone className="h-8 w-8 mr-3 text-[COR_MODULO]" />
          Título
        </h1>
      </div>

      {/* 4. Dashboard cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        {/* 4 cards com gradientes */}
      </div>

      {/* 5. Filtros/Busca */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
        {/* Search bar */}
      </div>

      {/* 6. Lista/Grid de items */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Cards dos items */}
      </div>
    </div>
  </div>
</div>
```

### 📱 Responsividade

Sempre use grid responsivo:

```tsx
// Dashboard (4 colunas no desktop)
className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"

// Lista de cards (3 colunas no desktop)
className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"

// Botões no header
className="flex flex-col sm:flex-row gap-3"
```

### 🔧 Stack Técnico

- **Framework**: React 18 + TypeScript
- **Styling**: Tailwind CSS (sem shadcn/ui para novas telas)
- **Icons**: Lucide React
- **Routing**: React Router DOM
- **HTTP**: Axios
- **State**: React Hooks (useState, useEffect)

### 📂 Estrutura de Pastas

```
src/
├── pages/              # Páginas do sistema
│   ├── _TemplatePage.tsx   # ⭐ TEMPLATE BASE
│   ├── CotacaoPage.tsx     # Exemplo Comercial
│   └── GestaoEquipesPage.tsx # Exemplo Atendimento
├── components/
│   └── navigation/
│       └── BackToNucleus.tsx
├── services/           # Services de API
├── config/
│   └── menuConfig.ts   # Configuração do menu
└── App.tsx             # Rotas principais
```

### 🆘 Precisa de Ajuda?

1. **Consulte o template**: `src/pages/_TemplatePage.tsx` tem TODOS os padrões
2. **Veja exemplos**: `CotacaoPage.tsx` e `GestaoEquipesPage.tsx`
3. **Leia as guidelines**: `DESIGN_GUIDELINES.md` tem documentação completa
4. **Use o Copilot**: Ele já conhece todos os padrões automaticamente!

---

**Última atualização**: Outubro 2025  
**Mantenedores**: Equipe ConectCRM
