# 🗑️ O QUE REMOVER DO SISTEMA OMNICHANNEL

**Data**: Dezembro 2025  
**Objetivo**: Alinhar ConectCRM com padrões dos líderes de mercado (Zendesk, Intercom, Freshdesk)  
**Princípio**: Menos é mais - focar no essencial e fazer bem feito

---

## 📊 Resumo Executivo

| Categoria | Itens a Remover | Motivo | Impacto |
|-----------|-----------------|--------|---------|
| **Páginas Legadas** | 5 páginas | Duplicação/obsoletas | Alto |
| **Páginas Demo/Debug** | 4 páginas | Não-produção | Alto |
| **Features Fora de Escopo** | 8 features | Não são omnichannel | Médio |
| **Código Duplicado** | 3 arquivos | Manutenção duplicada | Alto |
| **Rotas Redundantes** | 15+ redirects | Confusão navegação | Médio |

**Total**: ~25-30 itens para remoção/consolidação

---

## 🎯 Benchmark: O Que os Líderes NÃO Fazem

### Zendesk Agent Workspace
❌ **NÃO tem**: Gestão financeira no omnichannel  
❌ **NÃO tem**: CRM completo (é integração)  
❌ **NÃO tem**: Pipeline de vendas  
✅ **FOCA EM**: Chat, tickets, base de conhecimento, automações

### Intercom Inbox
❌ **NÃO tem**: Módulo financeiro  
❌ **NÃO tem**: Gestão de produtos  
❌ **NÃO tem**: Cotações/propostas  
✅ **FOCA EM**: Conversas, usuários, campanhas, bots

### Freshdesk
❌ **NÃO tem**: ERP features  
❌ **NÃO tem**: Gestão de vendas  
❌ **NÃO tem**: Controle de estoque  
✅ **FOCA EM**: Tickets, SLA, automações, relatórios

---

## 🔴 FASE 1: Remoção Imediata (Crítico)

### 1.1. Páginas Demo/Debug (NÃO PRODUÇÃO)

#### ❌ Remover:
```
frontend-web/src/pages/
├── UploadDemoPage.tsx              # Demo de upload
├── TestePortalPage.tsx             # Testes do portal
├── GoogleEventDemo.tsx             # Demo de eventos Google
└── components/
    ├── DebugContratos.tsx          # Debug de contratos
    └── LoginDebug.tsx              # Debug de login
```

**Motivo**: Páginas de desenvolvimento não devem existir em produção

**Impacto**: Alto (risco de segurança, confusão de usuários)

**Ação**:
```powershell
# Deletar arquivos
Remove-Item frontend-web/src/pages/UploadDemoPage.tsx
Remove-Item frontend-web/src/pages/TestePortalPage.tsx
Remove-Item frontend-web/src/pages/GoogleEventDemo.tsx
Remove-Item frontend-web/src/components/DebugContratos.tsx
Remove-Item frontend-web/src/components/LoginDebug.tsx

# Remover rotas do App.tsx
# - /upload-demo
# - /teste-portal
# - /debug-contratos
# - /debug-login
```

---

### 1.2. Código Duplicado (Manutenção 2x)

#### ❌ Remover:
```
frontend-web/src/
├── features/atendimento/omnichannel/
│   ├── contexts/
│   │   ├── SocketContext.tsx       # ❌ Duplicado de useWebSocket
│   │   └── ToastContext.tsx        # ❌ Duplicado de global toast
│   └── mockData.ts                 # ❌ CRÍTICO: Dados fake em produção
```

**Motivo**: 
- `SocketContext.tsx`: Já existe `hooks/useWebSocket.ts` (3 versões!)
- `ToastContext.tsx`: Já existe toast global (react-hot-toast)
- `mockData.ts`: **RISCO DE PRODUÇÃO** - pode misturar dados fake com reais

**Impacto**: MUITO ALTO (bugs, inconsistências, dados fake)

**Ação**:
```powershell
# Executar script de limpeza
.\scripts\cleanup-omnichannel.ps1

# Ou manualmente:
Remove-Item frontend-web/src/features/atendimento/omnichannel/contexts/SocketContext.tsx
Remove-Item frontend-web/src/features/atendimento/omnichannel/contexts/ToastContext.tsx
Remove-Item frontend-web/src/features/atendimento/omnichannel/mockData.ts

# Migrar imports:
# SocketContext → useWebSocket
# ToastContext (local) → react-hot-toast (global)
```

---

## 🟡 FASE 2: Consolidação (Importante)

### 2.1. Páginas Legadas/Duplicadas

#### ❌ Remover ou Consolidar:

**1. FunilVendas.jsx (Legado)**
```
frontend-web/src/pages/
├── FunilVendas.jsx           # ❌ Versão antiga (JSX, não TypeScript)
├── FunilVendasAPI.jsx        # ❌ Versão com API
└── PipelinePage.tsx          # ✅ Versão atual (TypeScript)
```

**Decisão**: Manter **APENAS** `PipelinePage.tsx`

**Motivo**: 
- Sistema omnichannel não precisa de pipeline de vendas
- Zendesk/Intercom não têm funil de vendas
- Deve estar no módulo CRM/Vendas, não Atendimento

**Ação**:
```powershell
Remove-Item frontend-web/src/pages/FunilVendas.jsx
Remove-Item frontend-web/src/pages/FunilVendasAPI.jsx

# Mover PipelinePage para módulo correto
Move-Item frontend-web/src/pages/PipelinePage.tsx `
          frontend-web/src/features/vendas/PipelinePage.tsx

# Atualizar rota em App.tsx
# /pipeline → Requer módulo VENDAS (não ATENDIMENTO)
```

---

**2. CentralOperacoesPage.tsx (Confusão)**
```
frontend-web/src/pages/CentralOperacoesPage.tsx  # ❌ Nome genérico
```

**Problema**: 
- Nome muito genérico ("Central de Operações" - operações de quê?)
- Não está claro se é Atendimento, Vendas, Logística
- Zendesk tem "Agent Workspace" (específico para atendimento)

**Decisão**: Renomear ou remover baseado no conteúdo real

**Ação**:
```powershell
# Opção A: Se for dashboard de atendimento, renomear
Rename-Item CentralOperacoesPage.tsx → AtendimentoDashboard.tsx

# Opção B: Se for genérico demais, deletar
Remove-Item frontend-web/src/pages/CentralOperacoesPage.tsx
```

---

### 2.2. Features NÃO-Omnichannel no Menu de Atendimento

#### ❌ Remover do Núcleo Atendimento:

Atualmente no menu "Atendimento":
```typescript
{
  id: 'atendimento',
  children: [
    // ✅ CORRETO - É omnichannel
    { id: 'atendimento-chat' },
    { id: 'atendimento-filas' },
    { id: 'atendimento-templates' },
    { id: 'atendimento-sla' },
    
    // ❌ ERRADO - NÃO é omnichannel
    { id: 'atendimento-supervisao' },        // → Admin
    { id: 'atendimento-dashboard-analytics' }, // → Relatórios
    { id: 'atendimento-fechamento-automatico' }, // → Automações (separado)
  ]
}
```

**O que Zendesk/Intercom fazem**:
- **Supervisão** → Aba separada "Admin" ou "Management"
- **Analytics** → Módulo "Reports & Analytics" (separado)
- **Automações** → Seção "Automations" (não mistura com chat)

**Ação**: Reorganizar hierarquia

```typescript
// ✅ CORRETO - Padrão Zendesk
export const menuConfig = [
  {
    id: 'atendimento',
    title: 'Atendimento',
    children: [
      { title: 'Chat Omnichannel' },      // ✅ Core
      { title: 'Filas' },                  // ✅ Core
      { title: 'Templates' },              // ✅ Produtividade
      { title: 'SLA' },                    // ✅ Gestão
    ]
  },
  {
    id: 'automacoes',
    title: 'Automações',
    children: [
      { title: 'Regras' },
      { title: 'Fechamento Automático' },
      { title: 'Distribuição' },
    ]
  },
  {
    id: 'relatorios',
    title: 'Relatórios',
    children: [
      { title: 'Dashboard Analytics' },
      { title: 'Performance' },
      { title: 'Métricas' },
    ]
  },
  {
    id: 'administracao',
    title: 'Administração',
    adminOnly: true,
    children: [
      { title: 'Supervisão' },
      { title: 'Usuários' },
      { title: 'Permissões' },
    ]
  }
];
```

---

### 2.3. Rotas Redundantes (Redirects)

#### ❌ Limpar Redirects Antigos:

```typescript
// App.tsx - Redirects legados (remover após migração)
<Route path="/funil-vendas" element={<Navigate to="/pipeline" />} />
<Route path="/oportunidades" element={<Navigate to="/pipeline" />} />
<Route path="/orcamentos" element={<Navigate to="/cotacoes" />} />
<Route path="/gestao/empresas" element={<Navigate to="/admin/empresas" />} />
<Route path="/gestao/usuarios" element={<Navigate to="/nuclei/configuracoes/usuarios" />} />
<Route path="/gestao/nucleos" element={<Navigate to="/atendimento/configuracoes?tab=nucleos" />} />
<Route path="/gestao/equipes" element={<Navigate to="/atendimento/configuracoes?tab=equipes" />} />
<Route path="/gestao/atendentes" element={<Navigate to="/atendimento/configuracoes?tab=atendentes" />} />
<Route path="/gestao/tags" element={<Navigate to="/atendimento/configuracoes?tab=tags" />} />
<Route path="/gestao/atribuicoes" element={<Navigate to="/atendimento/distribuicao" />} />
<Route path="/gestao/departamentos" element={<Navigate to="/nuclei/configuracoes/departamentos" />} />
<Route path="/gestao/fluxos" element={<Navigate to="/atendimento/configuracoes?tab=fluxos" />} />
<Route path="/configuracoes/empresa" element={<Navigate to="/nuclei/configuracoes/empresa" />} />
<Route path="/configuracoes/email" element={<Navigate to="/nuclei/configuracoes/email" />} />
<Route path="/configuracoes/metas" element={<Navigate to="/nuclei/configuracoes/metas" />} />
<Route path="/configuracoes/integracoes" element={<Navigate to="/nuclei/configuracoes/integracoes" />} />
<Route path="/configuracoes/departamentos" element={<Navigate to="/nuclei/configuracoes/departamentos" />} />
```

**Motivo**: 15+ redirects poluem codebase e confundem navegação

**Ação**: 
1. Comunicar usuários sobre mudança de rotas (changelog)
2. Manter redirects por 3 meses (grace period)
3. Deletar após 3 meses

```typescript
// ✅ Após 3 meses, App.tsx deve ter APENAS rotas diretas
<Routes>
  <Route path="/atendimento/chat" element={<Chat />} />
  <Route path="/atendimento/filas" element={<Filas />} />
  <Route path="/relatorios/analytics" element={<Analytics />} />
  {/* SEM redirects */}
</Routes>
```

---

## 🟢 FASE 3: Features Fora de Escopo Omnichannel

### 3.1. Módulos que NÃO São Atendimento

#### ❌ Mover para Módulos Corretos:

**1. Gestão Comercial (CRM/Vendas)**
```
Atual:    Menu "Atendimento" ou solto
Correto:  Menu "Comercial" ou "CRM"

Features:
├── Pipeline de Vendas         → módulo VENDAS
├── Propostas                  → módulo VENDAS
├── Cotações                   → módulo VENDAS
├── Minhas Aprovações          → módulo VENDAS
├── Produtos                   → módulo VENDAS
├── Combos                     → módulo VENDAS
├── Leads                      → módulo CRM
├── Clientes                   → módulo CRM
├── Contatos                   → módulo CRM
├── Interações                 → módulo CRM
└── Agenda                     → módulo CRM
```

**2. Gestão Financeira**
```
Atual:    Misturado com Atendimento
Correto:  Menu "Financeiro"

Features:
├── Faturamento                → módulo FINANCEIRO
├── Contas a Receber           → módulo FINANCEIRO
├── Contas a Pagar             → módulo FINANCEIRO
├── Fornecedores               → módulo FINANCEIRO
├── Fluxo de Caixa             → módulo FINANCEIRO
├── Relatórios Financeiros     → módulo FINANCEIRO
└── Billing/Assinaturas        → módulo BILLING
```

**3. Administração de Sistema**
```
Atual:    Parte em "Atendimento", parte solto
Correto:  Menu "Administração" (superadmin)

Features:
├── Gestão de Empresas         → admin
├── Console Admin              → admin
├── Gestão de Usuários         → admin
├── Permissões                 → admin
├── Auditoria                  → admin
├── Monitoramento              → admin
└── Conformidade (LGPD)        → admin
```

---

### 3.2. Páginas "Under Construction" (Consolidar)

#### ⚠️ Decisão: Remover ou Implementar?

Atualmente há **10+ rotas** com `ModuleUnderConstruction`:
```typescript
<Route path="/admin/relatorios" element={<ModuleUnderConstruction ... />} />
<Route path="/admin/auditoria" element={<ModuleUnderConstruction ... />} />
<Route path="/admin/monitoramento" element={<ModuleUnderConstruction ... />} />
<Route path="/admin/analytics" element={<ModuleUnderConstruction ... />} />
<Route path="/admin/conformidade" element={<ModuleUnderConstruction ... />} />
<Route path="/admin/acesso" element={<ModuleUnderConstruction ... />} />
<Route path="/financeiro/relatorios" element={<ModuleUnderConstruction ... />} />
<Route path="/financeiro/conciliacao" element={<ModuleUnderConstruction ... />} />
<Route path="/financeiro/centro-custos" element={<ModuleUnderConstruction ... />} />
<Route path="/financeiro/tesouraria" element={<ModuleUnderConstruction ... />} />
```

**Opções**:

**Opção A: Remover do Menu** (Recomendado)
```typescript
// NÃO mostrar no menu se não está implementado
// Usuário não vê expectativa não cumprida
```

**Opção B: Mostrar com Badge "Em Breve"**
```typescript
{
  id: 'relatorios',
  title: 'Relatórios',
  badge: 'Em Breve',
  disabled: true, // Não clicável
}
```

**Opção C: Implementar no Roadmap**
```typescript
// Ver OMNICHANNEL_ROADMAP_MELHORIAS.md
// Q3 2026: Implementar relatórios essenciais
```

---

## 📋 Checklist de Remoção

### Fase 1: Limpeza Imediata (1 semana)

- [ ] **Deletar páginas demo/debug**
  - [ ] UploadDemoPage.tsx
  - [ ] TestePortalPage.tsx
  - [ ] GoogleEventDemo.tsx
  - [ ] DebugContratos.tsx
  - [ ] LoginDebug.tsx
  - [ ] Remover rotas em App.tsx

- [ ] **Deletar código duplicado**
  - [ ] contexts/SocketContext.tsx → usar useWebSocket
  - [ ] contexts/ToastContext.tsx → usar react-hot-toast
  - [ ] mockData.ts → remover URGENTE
  - [ ] Migrar imports em 17 arquivos

- [ ] **Consolidar FunilVendas**
  - [ ] Deletar FunilVendas.jsx
  - [ ] Deletar FunilVendasAPI.jsx
  - [ ] Mover PipelinePage para features/vendas/

### Fase 2: Reorganização (2 semanas)

- [ ] **Separar módulos no menu**
  - [ ] Atendimento: APENAS chat, filas, templates, SLA
  - [ ] Automações: Regras, fechamento, distribuição
  - [ ] Relatórios: Analytics, performance, métricas
  - [ ] Admin: Supervisão, usuários, permissões

- [ ] **Limpar redirects antigos**
  - [ ] Comunicar mudanças (changelog)
  - [ ] Manter redirects por 3 meses
  - [ ] Remover após grace period

- [ ] **Mover features para módulos corretos**
  - [ ] Pipeline/Propostas/Cotações → VENDAS
  - [ ] Leads/Clientes/Contatos → CRM
  - [ ] Faturamento/Contas → FINANCEIRO

### Fase 3: Simplificação (1 semana)

- [ ] **Decidir sobre "Under Construction"**
  - [ ] Opção A: Remover do menu (recomendado)
  - [ ] Opção B: Badge "Em Breve"
  - [ ] Opção C: Implementar (ver roadmap)

- [ ] **Renomear páginas confusas**
  - [ ] CentralOperacoesPage → AtendimentoDashboard (ou deletar)

---

## 📊 Estrutura de Menu IDEAL (Padrão Zendesk)

### ✅ Menu Simplificado e Focado

```typescript
export const menuConfig = [
  // ===== VISÃO GERAL =====
  {
    section: 'Visão Geral',
    items: [
      {
        id: 'dashboard',
        title: 'Dashboard',
        href: '/dashboard',
        icon: Home,
      }
    ]
  },
  
  // ===== OPERAÇÕES =====
  {
    section: 'Operações',
    items: [
      {
        id: 'atendimento',
        title: 'Atendimento',
        icon: MessageSquare,
        requiredModule: 'ATENDIMENTO',
        children: [
          { title: 'Chat Omnichannel', href: '/atendimento/chat' },
          { title: 'Central', href: '/atendimento/central' },
          { title: 'Filas', href: '/atendimento/filas' },
          { title: 'Templates', href: '/atendimento/templates' },
        ]
      },
      {
        id: 'crm',
        title: 'CRM',
        icon: Users,
        requiredModule: 'CRM',
        children: [
          { title: 'Leads', href: '/leads' },
          { title: 'Clientes', href: '/clientes' },
          { title: 'Contatos', href: '/contatos' },
          { title: 'Interações', href: '/interacoes' },
          { title: 'Agenda', href: '/agenda' },
        ]
      },
      {
        id: 'vendas',
        title: 'Vendas',
        icon: TrendingUp,
        requiredModule: 'VENDAS',
        children: [
          { title: 'Pipeline', href: '/pipeline' },
          { title: 'Propostas', href: '/propostas' },
          { title: 'Cotações', href: '/cotacoes' },
          { title: 'Produtos', href: '/produtos' },
        ]
      },
      {
        id: 'financeiro',
        title: 'Financeiro',
        icon: DollarSign,
        requiredModule: 'FINANCEIRO',
        children: [
          { title: 'Faturamento', href: '/faturamento' },
          { title: 'Contas a Receber', href: '/financeiro/receber' },
          { title: 'Contas a Pagar', href: '/financeiro/pagar' },
        ]
      }
    ]
  },
  
  // ===== AUTOMAÇÕES =====
  {
    section: 'Automações',
    items: [
      {
        id: 'automacoes',
        title: 'Regras e Ações',
        icon: Zap,
        requiredModule: 'ATENDIMENTO',
        children: [
          { title: 'Automações', href: '/automacoes' },
          { title: 'Fechamento Automático', href: '/automacoes/fechamento' },
          { title: 'Distribuição', href: '/automacoes/distribuicao' },
        ]
      }
    ]
  },
  
  // ===== ANÁLISES =====
  {
    section: 'Análises',
    items: [
      {
        id: 'relatorios',
        title: 'Relatórios',
        icon: BarChart3,
        children: [
          { title: 'Performance', href: '/relatorios/performance' },
          { title: 'SLA', href: '/relatorios/sla' },
          { title: 'Analytics', href: '/relatorios/analytics' },
        ]
      }
    ]
  },
  
  // ===== CONFIGURAÇÕES =====
  {
    section: 'Configurações',
    items: [
      {
        id: 'configuracoes',
        title: 'Configurações',
        icon: Settings,
        children: [
          { title: 'Empresa', href: '/configuracoes/empresa' },
          { title: 'Usuários', href: '/configuracoes/usuarios' },
          { title: 'Integrações', href: '/configuracoes/integracoes' },
        ]
      }
    ]
  },
  
  // ===== ADMINISTRAÇÃO (SUPERADMIN) =====
  {
    section: 'Administração',
    adminOnly: true,
    items: [
      {
        id: 'admin',
        title: 'Admin Console',
        icon: Shield,
        children: [
          { title: 'Empresas', href: '/admin/empresas' },
          { title: 'Supervisão', href: '/admin/supervisao' },
          { title: 'Permissões', href: '/admin/permissoes' },
        ]
      }
    ]
  }
];
```

**Resultado**: Menu limpo, organizado e alinhado com Zendesk!

---

## 🎯 Resultado Esperado

### Antes (Situação Atual)
```
📁 frontend-web/src/pages/
├── 📄 40+ arquivos TSX
├── 📁 5+ subdiretórios
├── 🐛 Páginas demo/debug em produção
├── 🔄 15+ redirects
├── 📦 Código duplicado (3 arquivos)
└── 🤔 Menu confuso (mix de módulos)
```

### Depois (Objetivo)
```
📁 frontend-web/src/
├── features/
│   ├── atendimento/      # APENAS chat omnichannel
│   ├── crm/              # Leads, clientes, contatos
│   ├── vendas/           # Pipeline, propostas, produtos
│   ├── financeiro/       # Faturamento, contas
│   └── admin/            # Console admin
├── pages/
│   └── 📄 10-15 arquivos # APENAS páginas essenciais
└── ✅ 0 páginas demo
    ✅ 0 código duplicado
    ✅ 0 redirects antigos
    ✅ Menu organizado por módulo
```

**Benefícios**:
- ✅ 50% menos arquivos em `pages/`
- ✅ 0 risco de dados fake em produção
- ✅ 0 código duplicado
- ✅ Menu claro e intuitivo
- ✅ Alinhado com padrão Zendesk/Intercom
- ✅ Mais fácil de manter e evoluir

---

## 🚀 Script de Limpeza

```powershell
# cleanup-complete.ps1 - Limpeza completa do sistema

Write-Host "🧹 LIMPEZA COMPLETA DO SISTEMA" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan

# FASE 1: Páginas Demo/Debug
Write-Host "`n📝 FASE 1: Removendo páginas demo/debug..." -ForegroundColor Yellow
$demoPages = @(
    "frontend-web/src/pages/UploadDemoPage.tsx",
    "frontend-web/src/pages/TestePortalPage.tsx",
    "frontend-web/src/pages/GoogleEventDemo.tsx",
    "frontend-web/src/components/DebugContratos.tsx",
    "frontend-web/src/components/LoginDebug.tsx"
)

foreach ($page in $demoPages) {
    if (Test-Path $page) {
        Remove-Item $page -Force
        Write-Host "  ✅ Removido: $page" -ForegroundColor Green
    }
}

# FASE 2: Código Duplicado
Write-Host "`n📝 FASE 2: Removendo código duplicado..." -ForegroundColor Yellow
$duplicates = @(
    "frontend-web/src/features/atendimento/omnichannel/contexts/SocketContext.tsx",
    "frontend-web/src/features/atendimento/omnichannel/contexts/ToastContext.tsx",
    "frontend-web/src/features/atendimento/omnichannel/mockData.ts"
)

foreach ($file in $duplicates) {
    if (Test-Path $file) {
        Remove-Item $file -Force
        Write-Host "  ✅ Removido: $file" -ForegroundColor Green
    }
}

# FASE 3: Páginas Legadas
Write-Host "`n📝 FASE 3: Removendo páginas legadas..." -ForegroundColor Yellow
$legacy = @(
    "frontend-web/src/pages/FunilVendas.jsx",
    "frontend-web/src/pages/FunilVendasAPI.jsx"
)

foreach ($page in $legacy) {
    if (Test-Path $page) {
        Remove-Item $page -Force
        Write-Host "  ✅ Removido: $page" -ForegroundColor Green
    }
}

Write-Host "`n✅ LIMPEZA CONCLUÍDA!" -ForegroundColor Green
Write-Host "   Próximo passo: Atualizar imports e rotas" -ForegroundColor Cyan
```

---

**Última atualização**: Dezembro 2025  
**Próxima ação**: Executar script de limpeza e atualizar menuConfig.ts
