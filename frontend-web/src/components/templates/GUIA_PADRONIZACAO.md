# 📋 Guia de Padronização de Telas - ConectCRM

## 🎯 Visão Geral

Este documento descreve o sistema de templates padronizados para criação de telas no ConectCRM. O sistema foi baseado no padrão estabelecido pela **tela de Fornecedores**, considerada nossa referência de design e funcionalidade.

## 🧩 Componentes Base

### 1. StandardPageTemplate

Template principal que padroniza a estrutura de páginas com:
- Header padronizado com título e ações
- Cards de dashboard/estatísticas
- Sistema de filtros e busca
- Ações em massa (bulk actions)
- Estados de carregamento
- Navegação de retorno

### 2. StandardDataTable

Componente de tabela de dados com:
- Ordenação por colunas
- Seleção múltipla de itens
- Menu de ações por item
- Paginação automática
- Estados vazios personalizados
- Loading states

## 📁 Estrutura dos Templates

```typescript
// Localização dos templates
src/components/templates/
├── StandardPageTemplate.tsx    // Template principal
├── StandardDataTable.tsx      // Tabela de dados
└── index.ts                   // Exportações e tipos
```

## 🚀 Como Usar

### Exemplo Básico - Página de Faturamento

```tsx
import React, { useState, useEffect } from 'react';
import { StandardPageTemplate, StandardDataTable } from '../../components/templates';
import { Plus, FileText, DollarSign } from 'lucide-react';

export const MinhaPage: React.FC = () => {
  const [data, setData] = useState([]);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);

  // Dashboard Cards
  const dashboardCards = [
    {
      title: 'Total de Itens',
      value: data.length,
      subtitle: '📊 Visão geral',
      icon: FileText,
      color: 'blue' as const
    },
    {
      title: 'Valor Total',
      value: 'R$ 15.000,00',
      subtitle: '💰 Faturamento',
      icon: DollarSign,
      color: 'green' as const
    }
  ];

  // Colunas da tabela
  const columns = [
    {
      key: 'nome',
      label: 'Nome',
      sortable: true
    },
    {
      key: 'valor',
      label: 'Valor',
      render: (item) => item.valor.toLocaleString('pt-BR', { 
        style: 'currency', 
        currency: 'BRL' 
      })
    }
  ];

  // Ações da tabela
  const actions = [
    {
      label: 'Visualizar',
      onClick: (item) => console.log('Ver', item),
      icon: Eye
    },
    {
      label: 'Editar',
      onClick: (item) => console.log('Editar', item),
      icon: Edit
    }
  ];

  return (
    <StandardPageTemplate
      title="Minha Página"
      subtitle="Descrição da página"
      backTo="/nucleo-anterior"
      
      dashboardCards={dashboardCards}
      
      primaryAction={{
        label: 'Novo Item',
        onClick: () => console.log('Criar novo'),
        icon: Plus
      }}
      
      searchConfig={{
        placeholder: 'Buscar itens...',
        value: searchTerm,
        onChange: setSearchTerm
      }}
      
      bulkActions={selectedItems.length > 0 ? {
        selectedCount: selectedItems.length,
        onSelectAll: () => setSelectedItems(data.map(item => item.id)),
        onDeselectAll: () => setSelectedItems([]),
        actions: [
          {
            label: 'Exportar Selecionados',
            onClick: () => console.log('Exportar', selectedItems)
          }
        ]
      } : undefined}
      
      loading={loading}
    >
      <StandardDataTable
        data={data}
        columns={columns}
        actions={actions}
        selectable={true}
        selectedItems={selectedItems}
        onSelectionChange={setSelectedItems}
        getItemId={(item) => item.id}
        emptyState={{
          title: 'Nenhum item encontrado',
          description: 'Não há itens para exibir.',
          icon: FileText,
          action: {
            label: 'Criar Primeiro Item',
            onClick: () => console.log('Criar primeiro')
          }
        }}
      />
    </StandardPageTemplate>
  );
};
```

## 🎨 Configuração de Cores

O sistema usa cores padronizadas baseadas no ConectCRM:

```typescript
const coresPadrao = {
  primary: '#159A9C',      // Verde ConectCRM
  secondary: '#138A8C',    // Verde escuro
  blue: 'text-blue-600',   // Azul para informações
  green: 'text-green-600', // Verde para sucesso
  red: 'text-red-600',     // Vermelho para erros
  yellow: 'text-yellow-600', // Amarelo para avisos
  purple: 'text-purple-600', // Roxo para especiais
  indigo: 'text-indigo-600'  // Índigo para neutro
};
```

## 📊 Dashboard Cards

Estrutura dos cards de dashboard:

```typescript
interface DashboardCard {
  title: string;                    // Título do card
  value: string | number;           // Valor principal
  subtitle?: string;                // Texto adicional
  icon: React.ComponentType;        // Ícone do Lucide React
  color: 'blue' | 'green' | 'red'   // Cor do tema
    | 'purple' | 'yellow' | 'indigo';
  bgGradient?: string;              // Gradiente customizado (opcional)
}
```

### Exemplos de Cards:

```tsx
const exemploCards: DashboardCard[] = [
  {
    title: 'Total de Vendas',
    value: 150,
    subtitle: '📈 +12% este mês',
    icon: TrendingUp,
    color: 'green'
  },
  {
    title: 'Receita Total',
    value: 'R$ 45.000,00',
    subtitle: '💰 Faturamento bruto',
    icon: DollarSign,
    color: 'blue'
  },
  {
    title: 'Pendências',
    value: 8,
    subtitle: '⚠️ Requer atenção',
    icon: AlertTriangle,
    color: 'red'
  }
];
```

## 🔍 Sistema de Filtros

### Configuração de Busca:

```typescript
const searchConfig = {
  placeholder: 'Buscar por nome, email, documento...',
  value: searchTerm,
  onChange: setSearchTerm,
  onSearch: () => executarBusca() // Opcional
};
```

### Configuração de Filtros:

```typescript
const filters = [
  {
    label: 'Status',
    value: statusFilter,
    options: [
      { label: 'Todos', value: 'todos' },
      { label: '✅ Ativos', value: 'ativo' },
      { label: '❌ Inativos', value: 'inativo' }
    ],
    onChange: setStatusFilter
  },
  {
    label: 'Categoria',
    value: categoriaFilter,
    options: [
      { label: 'Todas', value: 'todas' },
      { label: 'Premium', value: 'premium' },
      { label: 'Standard', value: 'standard' }
    ],
    onChange: setCategoriaFilter
  }
];
```

## 📋 Configuração de Tabelas

### Definindo Colunas:

```typescript
const columns: TableColumn<MeuTipo>[] = [
  {
    key: 'nome',
    label: 'Nome',
    sortable: true,
    width: 'w-64' // Tailwind CSS width
  },
  {
    key: 'email',
    label: 'E-mail',
    render: (item) => (
      <a href={`mailto:${item.email}`} className="text-blue-600">
        {item.email}
      </a>
    )
  },
  {
    key: 'valor',
    label: 'Valor',
    align: 'right',
    render: (item) => formatarMoeda(item.valor)
  },
  {
    key: 'status',
    label: 'Status',
    render: (item) => <StatusBadge status={item.status} />
  }
];
```

### Definindo Ações:

```typescript
const actions: TableAction<MeuTipo>[] = [
  {
    label: 'Visualizar',
    onClick: handleVisualizar,
    icon: Eye
  },
  {
    label: 'Editar',
    onClick: handleEditar,
    icon: Edit,
    show: (item) => item.status !== 'finalizado' // Condicional
  },
  {
    label: 'Excluir',
    onClick: handleExcluir,
    icon: Trash2,
    variant: 'danger' // Ação perigosa
  }
];
```

## ⚡ Ações em Massa

Sistema para operações em múltiplos itens:

```typescript
const bulkActions = {
  selectedCount: selectedItems.length,
  onSelectAll: () => setSelectedItems(allIds),
  onDeselectAll: () => setSelectedItems([]),
  actions: [
    {
      label: 'Ativar Selecionados',
      onClick: () => ativarSelecionados(selectedItems)
    },
    {
      label: 'Exportar CSV',
      onClick: () => exportarCSV(selectedItems),
      variant: 'outline' as const
    },
    {
      label: 'Excluir Selecionados',
      onClick: () => excluirSelecionados(selectedItems),
      variant: 'danger' as const
    }
  ]
};
```

## 🎭 Estados da Interface

### Estado de Carregamento:

```tsx
<StandardPageTemplate loading={true}>
  {/* Conteúdo será substituído por spinner */}
</StandardPageTemplate>
```

### Estado Vazio:

```tsx
<StandardDataTable
  data={[]}
  emptyState={{
    title: 'Nenhum resultado encontrado',
    description: 'Tente ajustar os filtros ou criar um novo item.',
    icon: Search,
    action: {
      label: 'Limpar Filtros',
      onClick: limparFiltros
    }
  }}
  // ... outras props
/>
```

## 🔧 Customizações Avançadas

### Gradientes Personalizados:

```typescript
const cardPersonalizado: DashboardCard = {
  title: 'Métrica Especial',
  value: '99%',
  icon: Zap,
  color: 'purple',
  bgGradient: 'from-purple-400 via-pink-500 to-red-500'
};
```

### Renderização Customizada de Células:

```typescript
{
  key: 'cliente',
  label: 'Cliente',
  render: (item) => (
    <div className="flex items-center space-x-3">
      <img 
        src={item.avatar} 
        alt={item.nome}
        className="w-8 h-8 rounded-full"
      />
      <div>
        <div className="font-medium">{item.nome}</div>
        <div className="text-sm text-gray-500">{item.empresa}</div>
      </div>
    </div>
  )
}
```

## 📝 Boas Práticas

### 1. Consistência Visual
- Use sempre as cores padrão definidas
- Mantenha o mesmo estilo de cards em todas as telas
- Padronize os textos de botões e ações

### 2. Experiência do Usuário
- Implemente states de loading para ações demoradas
- Forneça feedback visual para ações do usuário
- Use estados vazios informativos

### 3. Performance
- Implemente paginação para listas grandes
- Use memoização em componentes pesados
- Lazy loading para dados não críticos

### 4. Acessibilidade
- Mantenha hierarquia semântica correta
- Use ARIAs quando necessário
- Garanta navegação por teclado

## 🔄 Migração de Páginas Existentes

### Passo a Passo:

1. **Analise a página atual**
   - Identifique componentes reutilizáveis
   - Mapeie funcionalidades existentes
   - Note customizações necessárias

2. **Prepare os dados**
   ```tsx
   // Transforme para formato padrão
   const dashboardCards = calcularCards(dados);
   const tableColumns = definirColunas();
   const tableActions = definirAcoes();
   ```

3. **Implemente o template**
   ```tsx
   // Substitua a estrutura antiga
   return (
     <StandardPageTemplate {...configTemplate}>
       <StandardDataTable {...configTabela} />
     </StandardPageTemplate>
   );
   ```

4. **Teste e ajuste**
   - Verifique responsividade
   - Teste todas as funcionalidades
   - Ajuste estilos específicos se necessário

## 📈 Exemplo: Faturamento Padronizada

A página de faturamento foi completamente refatorada usando este sistema:

**Antes**: 777 linhas de código repetitivo
**Depois**: 200 linhas usando templates reutilizáveis

**Benefícios obtidos**:
- ✅ Layout consistente com Fornecedores
- ✅ Funcionalidades padronizadas
- ✅ Manutenção simplificada
- ✅ Reutilização de código
- ✅ UX unificada

## 🎯 Próximos Passos

1. **Migrar outras páginas financeiras**
   - Contas a Receber
   - Contas a Pagar
   - Relatórios Financeiros

2. **Expandir para outros módulos**
   - Clientes
   - Propostas
   - Produtos

3. **Melhorias futuras**
   - Sistema de temas
   - Componentes mais especializados
   - Templates para modais

---

## 📞 Suporte

Para dúvidas sobre implementação:
1. Consulte os exemplos nesta documentação
2. Verifique a implementação na página de Fornecedores
3. Analise o código da página de Faturamento padronizada

**Lembre-se**: O objetivo é manter consistência visual e funcional em todo o sistema, facilitando a manutenção e melhorando a experiência do usuário! 🚀
