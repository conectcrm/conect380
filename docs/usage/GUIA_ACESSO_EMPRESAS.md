# 🚀 Guia de Acesso - Módulo de Gestão de Empresas

## 📍 **Como Acessar a Tela de Empresas**

### **Caminho 1: Via Núcleo Sistema** (Recomendado)

1. **Acesse o Dashboard**
   - URL: `http://localhost:3000/dashboard`

2. **Navegue para o Núcleo Sistema**
   - Clique no card **"Sistema"** no dashboard principal
   - Ou acesse diretamente: `http://localhost:3000/nuclei/sistema`

3. **Acesse o Módulo de Gestão de Empresas**
   - No núcleo Sistema, clique em **"Gestão de Empresas"**
   - Será redirecionado para: `http://localhost:3000/admin/empresas`

---

### **Caminho 2: Acesso Direto** (URL)

```
http://localhost:3000/admin/empresas
```

---

## 🎯 **Localização no Menu**

```
Dashboard Principal
├── 🏠 Dashboard
├── 🎯 Central de Operações  
├── 👥 CRM
├── 💼 Vendas
├── 💰 Financeiro
└── ⚙️ Sistema ←── AQUI
    ├── 🏢 Gestão de Empresas ←── NOVO MÓDULO
    └── ⚙️ Configurações
```

---

## 📱 **Navegação Visual**

### **1. Dashboard Principal**
- Localize o card **"Sistema"** (roxo)
- Mostra notificação: **4** (3 empresas + 1 configurações)

### **2. Núcleo Sistema**
- **Gestão de Empresas** (ícone: 🏢)
  - Descrição: "Gerenciamento e monitoramento de empresas cadastradas no sistema"
  - Status: **Ativo**
  - Notificações: **3**

### **3. Página de Empresas**
- **Título**: "Gestão de Empresas"
- **Subtitle**: "Administração e monitoramento de empresas"
- **URL**: `/admin/empresas`

---

## ✅ **Status de Integração**

### **Rotas Configuradas**
- ✅ Rota adicionada no `App.tsx`
- ✅ Import do componente realizado
- ✅ Mapeamento de título no `DashboardLayout`

### **Navegação Integrada**
- ✅ Módulo adicionado ao `SistemaNucleusPage`
- ✅ Ícone `Building2` configurado
- ✅ Notificações ativas (3)
- ✅ Status "active"

### **Compilação**
- ✅ Build realizado com sucesso
- ✅ Sem erros de importação
- ✅ Componentes funcionais

---

## 🎨 **Funcionalidades Disponíveis**

### **Dashboard de Métricas**
- Total de empresas
- Empresas ativas vs inativas  
- Receita mensal estimada
- Taxa de conversão trial

### **Lista de Empresas**
- Cards visuais por empresa
- Status coloridos (Ativa, Trial, Suspensa, Inativa)
- Informações de plano e usuários

### **Sistema de Filtros**
- Busca por nome, CNPJ, email
- Filtros por status e plano
- Filtros avançados (período, valor)
- Filtros rápidos pré-configurados

---

## 🚀 **Para Desenvolvedores**

### **Arquivos Envolvidos**
```
frontend-web/
├── src/
│   ├── App.tsx (rota adicionada)
│   ├── components/layout/DashboardLayout.tsx (título)
│   ├── pages/nuclei/SistemaNucleusPage.tsx (módulo)
│   └── features/admin/empresas/
│       ├── EmpresasListPage.tsx
│       └── components/
│           ├── EmpresaCard.tsx
│           ├── EmpresaFilters.tsx  
│           └── EmpresaMetrics.tsx
```

### **Estrutura de Navegação**
```typescript
// Em SistemaNucleusPage.tsx
{
  id: 'gestao-empresas',
  name: 'Gestão de Empresas',
  description: 'Gerenciamento e monitoramento de empresas...',
  href: '/admin/empresas',
  icon: Building2,
  notifications: 3,
  status: 'active'
}
```

---

## 🎉 **Resumo**

**A tela de gestão de empresas está totalmente integrada e acessível via:**

1. **Dashboard → Sistema → Gestão de Empresas**
2. **URL Direta:** `/admin/empresas`

**Status:** ✅ **PRONTO PARA USO**
