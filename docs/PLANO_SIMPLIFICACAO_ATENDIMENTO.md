# 📋 Plano de Simplificação - Módulo Atendimento

**Data Início:** 09/12/2025  
**Responsável:** Equipe ConectCRM  
**Status:** 🟡 Em Planejamento  
**Objetivo:** Reduzir complexidade de 12 para 5 itens de menu (-58%)

---

## 📌 Índice

1. [Visão Geral](#visão-geral)
2. [Fases de Implementação](#fases-de-implementação)
3. [Checklist de Execução](#checklist-de-execução)
4. [Guia de Implementação Técnica](#guia-de-implementação-técnica)
5. [Validação e Testes](#validação-e-testes)
6. [Rollback Plan](#rollback-plan)

---

## 🎯 Visão Geral

### Situação Atual (ANTES)
```
Atendimento (12 pontos de navegação)
├── Chat
├── Gestão de Filas
├── Templates de Mensagens
├── SLA Dashboard                    ← DUPLICAÇÃO
├── Distribuição Dashboard           ← DUPLICAÇÃO
├── Fechamento Automático
├── Dashboard Analytics
└── Configurações
    ├── Geral
    ├── SLA                          ← DUPLICAÇÃO
    ├── Distribuição                 ← DUPLICAÇÃO
    └── Skills
```

### Situação Desejada (DEPOIS)
```
Atendimento (5 pontos de navegação)
├── 💬 Caixa de Entrada
├── 📊 Métricas & Analytics
│   └── Abas: Geral | SLA | Distribuição | Desempenho
├── 🤖 Automações
│   └── Abas: Bot | Templates | Regras | Triggers
├── 👥 Equipe
│   └── Abas: Atendentes | Filas | Skills | Roteamento
└── ⚙️  Configurações
    └── Abas: Geral | Canais | SLA | Notificações
```

---

## 🚀 Fases de Implementação

### **FASE 1: Quick Wins (Semana 1-2)** 🔥
**Objetivo:** Simplificar navegação sem quebrar funcionalidades  
**Esforço:** 16-24 horas  
**Risco:** BAIXO

#### Entregas:
1. ✅ Consolidar dashboards em abas
2. ✅ Simplificar menuConfig.ts
3. ✅ Criar redirects para compatibilidade
4. ✅ Renomear "Chat" → "Caixa de Entrada"

---

### **FASE 2: Consolidação (Semana 3-4)** ⚡
**Objetivo:** Agrupar funcionalidades relacionadas  
**Esforço:** 32-40 horas  
**Risco:** MÉDIO

#### Entregas:
1. ⭐ Criar AutomacoesAtendimentoPage
2. ⭐ Criar EquipeAtendimentoPage
3. ⭐ Melhorar ConfiguracoesAtendimentoPage
4. ⭐ Atualizar breadcrumbs

---

### **FASE 3: Premium (Semana 5-8)** 🏆
**Objetivo:** Criar experiência nível Zendesk/Intercom  
**Esforço:** 64-80 horas  
**Risco:** ALTO

#### Entregas:
1. 🎯 Criar InboxAtendimentoPage (lista + chat)
2. 🎯 Melhorar analytics (gráficos interativos)
3. 🎯 Status em tempo real na equipe
4. 🎯 Busca avançada e filtros salvos

---

## ✅ Checklist de Execução

### FASE 1 - Quick Wins

#### 1.1. Consolidar Dashboards ⚡ PRIORIDADE MÁXIMA
```
Backend: Nenhuma alteração necessária
Frontend: Modificar DashboardAnalyticsPage.tsx
```

- [ ] **Passo 1.1.1:** Adicionar sistema de abas em DashboardAnalyticsPage
  - [ ] Instalar/verificar lib de tabs (usar Tailwind + state)
  - [ ] Criar componente `<TabNavigation />` reutilizável
  - [ ] Definir 4 abas: Geral, SLA, Distribuição, Desempenho
  - [ ] Implementar navegação via query param `?tab=`

- [ ] **Passo 1.1.2:** Criar aba "Geral" (já existe como página principal)
  - [ ] Manter KPIs atuais (6 cards)
  - [ ] Manter gráfico de tendência
  - [ ] Manter filtro de período

- [ ] **Passo 1.1.3:** Criar aba "SLA"
  - [ ] Buscar conteúdo de DashboardSLAPage.tsx
  - [ ] Extrair componentes principais:
    - SLAOverviewCards (cards de métricas SLA)
    - SLABreachList (lista de tickets em risco)
    - SLATimeline (gráfico temporal)
  - [ ] Integrar na aba usando mesmos services

- [ ] **Passo 1.1.4:** Criar aba "Distribuição"
  - [ ] Buscar conteúdo de DashboardDistribuicaoPage.tsx
  - [ ] Extrair componentes:
    - CargaAtendentesChart (gráfico de carga)
    - FilasStatusCards (status das filas)
    - DistribuicaoMetrics (métricas agregadas)
  - [ ] Integrar na aba

- [ ] **Passo 1.1.5:** Criar aba "Desempenho"
  - [ ] Tabela de atendentes (já existe)
  - [ ] Estatísticas por canal (já existe)
  - [ ] Adicionar ranking (top performers)

- [ ] **Passo 1.1.6:** Testar navegação entre abas
  - [ ] Validar que state persiste ao trocar abas
  - [ ] Validar query params (?tab=sla)
  - [ ] Testar deep linking (compartilhar URL com aba)

**Arquivos Modificados:**
```
frontend-web/src/pages/DashboardAnalyticsPage.tsx     [MODIFICAR]
frontend-web/src/components/tabs/TabNavigation.tsx    [CRIAR]
frontend-web/src/components/analytics/               [CRIAR pasta]
  ├── SLAOverviewCards.tsx                           [CRIAR]
  ├── CargaAtendentesChart.tsx                       [CRIAR]
  └── DesempenhoTable.tsx                            [CRIAR]
```

---

#### 1.2. Simplificar menuConfig.ts

- [ ] **Passo 1.2.1:** Remover itens duplicados do menu principal
  ```typescript
  // REMOVER:
  ├── SLA Dashboard                    → Agora é aba
  ├── Distribuição Dashboard           → Agora é aba
  
  // MANTER:
  ├── Chat                             → Renomear
  ├── Dashboard Analytics              → Renomear
  ├── Gestão de Filas                  → Mover depois
  ├── Templates                        → Mover depois
  ├── Fechamento Automático            → Mover depois
  └── Configurações (submenu)          → Simplificar depois
  ```

- [ ] **Passo 1.2.2:** Renomear itens existentes
  ```typescript
  Chat → "Caixa de Entrada"
  Dashboard Analytics → "Métricas & Analytics"
  ```

- [ ] **Passo 1.2.3:** Atualizar ícones
  ```typescript
  Caixa de Entrada: MessageSquare (já tem)
  Métricas & Analytics: BarChart3 (já tem)
  ```

- [ ] **Passo 1.2.4:** Simplificar submenu Configurações
  ```typescript
  // ANTES: 4 subitens (Geral, SLA, Distribuição, Skills)
  // DEPOIS: 2 subitens (Geral, Avançado)
  // SLA/Distribuição vão para ConfiguracoesAtendimentoPage como abas
  ```

**Arquivo Modificado:**
```
frontend-web/src/config/menuConfig.ts                [MODIFICAR]
```

---

#### 1.3. Criar Redirects para Compatibilidade

- [ ] **Passo 1.3.1:** Adicionar redirects em App.tsx
  ```typescript
  // Redirects antigos → novos
  /nuclei/atendimento/sla/dashboard 
    → /atendimento/analytics?tab=sla
  
  /nuclei/atendimento/distribuicao/dashboard 
    → /atendimento/analytics?tab=distribuicao
  
  /atendimento/dashboard-analytics 
    → /atendimento/analytics
  
  /atendimento/chat 
    → /atendimento/inbox (preparar para Fase 3)
  ```

- [ ] **Passo 1.3.2:** Criar componente RedirectWithTab
  ```typescript
  // Componente helper para preservar query params
  const RedirectWithTab: React.FC<{to: string, tab: string}> = ({to, tab}) => {
    return <Navigate to={`${to}?tab=${tab}`} replace />;
  };
  ```

- [ ] **Passo 1.3.3:** Testar todos os redirects
  - [ ] Testar URL antiga direta no browser
  - [ ] Testar link salvo em favoritos
  - [ ] Testar link compartilhado (email, chat)

**Arquivo Modificado:**
```
frontend-web/src/App.tsx                             [MODIFICAR]
```

---

#### 1.4. Atualizar Breadcrumbs

- [ ] **Passo 1.4.1:** Atualizar DashboardLayout.tsx
  ```typescript
  // Remover breadcrumbs órfãos:
  '/nuclei/atendimento/sla/dashboard'
  '/nuclei/atendimento/distribuicao/dashboard'
  
  // Adicionar novos:
  '/atendimento/analytics': {
    title: 'Métricas & Analytics',
    subtitle: 'Dashboards consolidados',
  }
  ```

- [ ] **Passo 1.4.2:** Adicionar breadcrumb para abas
  ```typescript
  // Detectar query param e mostrar no breadcrumb
  // Ex: "Atendimento > Métricas & Analytics > SLA"
  ```

**Arquivo Modificado:**
```
frontend-web/src/components/layout/DashboardLayout.tsx   [MODIFICAR]
```

---

#### 1.5. Validação FASE 1

- [ ] **Teste de Navegação**
  - [ ] Abrir /atendimento/analytics → ver aba "Geral"
  - [ ] Clicar aba "SLA" → ver métricas SLA
  - [ ] Clicar aba "Distribuição" → ver carga atendentes
  - [ ] Copiar URL com ?tab=sla → abrir em nova janela → mostrar aba correta

- [ ] **Teste de Redirects**
  - [ ] Acessar URL antiga /nuclei/atendimento/sla/dashboard
  - [ ] Verificar redirect para /atendimento/analytics?tab=sla
  - [ ] Verificar aba SLA aberta automaticamente

- [ ] **Teste de Menu**
  - [ ] Verificar menu "Atendimento" tem 2 itens a menos
  - [ ] "SLA Dashboard" e "Distribuição Dashboard" NÃO aparecem
  - [ ] "Métricas & Analytics" aparece

- [ ] **Teste de Responsividade**
  - [ ] Mobile (375px): abas funcionam
  - [ ] Tablet (768px): layout ok
  - [ ] Desktop (1920px): tudo visível

- [ ] **Teste de Performance**
  - [ ] Trocar abas < 200ms
  - [ ] Carregar dados SLA < 2s
  - [ ] Sem memory leaks ao trocar abas

**Critérios de Aceitação FASE 1:**
- ✅ Menu reduzido de 8 para 6 itens (-25%)
- ✅ Dashboards consolidados em 1 página com abas
- ✅ Todos os redirects funcionando
- ✅ Zero erros no console
- ✅ Breadcrumbs corretos

---

### FASE 2 - Consolidação

#### 2.1. Criar AutomacoesAtendimentoPage

- [ ] **Passo 2.1.1:** Criar arquivo base
  ```bash
  frontend-web/src/features/atendimento/pages/AutomacoesAtendimentoPage.tsx
  ```

- [ ] **Passo 2.1.2:** Implementar sistema de abas
  - [ ] Aba "Bot & Fluxos" (reutilizar FluxoBuilderPage)
  - [ ] Aba "Templates" (reutilizar GestaoTemplatesPage)
  - [ ] Aba "Regras de Tempo" (reutilizar FechamentoAutomaticoPage)
  - [ ] Aba "Triggers" (criar nova - webhook/eventos)

- [ ] **Passo 2.1.3:** Integrar componentes existentes
  ```typescript
  // Não recriar do zero - reutilizar!
  import FluxoBuilderPage from './FluxoBuilderPage';
  import GestaoTemplatesPage from './GestaoTemplatesPage';
  import FechamentoAutomaticoPage from '../../../pages/FechamentoAutomaticoPage';
  
  // Renderizar como abas
  {activeTab === 'bot' && <FluxoBuilderPage />}
  {activeTab === 'templates' && <GestaoTemplatesPage />}
  ```

- [ ] **Passo 2.1.4:** Adicionar rota no App.tsx
  ```typescript
  <Route 
    path="/atendimento/automacoes" 
    element={protegerRota(ModuloEnum.ATENDIMENTO, <AutomacoesAtendimentoPage />)} 
  />
  ```

- [ ] **Passo 2.1.5:** Adicionar no menuConfig
  ```typescript
  {
    id: 'atendimento-automacoes',
    title: 'Automações',
    icon: Zap,
    href: '/atendimento/automacoes',
    color: 'purple',
  }
  ```

- [ ] **Passo 2.1.6:** Criar redirects das páginas antigas
  ```typescript
  <Route path="/nuclei/atendimento/templates" 
    element={<Navigate to="/atendimento/automacoes?tab=templates" />} 
  />
  <Route path="/atendimento/fechamento-automatico" 
    element={<Navigate to="/atendimento/automacoes?tab=regras" />} 
  />
  ```

**Arquivos:**
```
frontend-web/src/features/atendimento/pages/
  AutomacoesAtendimentoPage.tsx                      [CRIAR]
frontend-web/src/App.tsx                             [MODIFICAR]
frontend-web/src/config/menuConfig.ts                [MODIFICAR]
```

---

#### 2.2. Criar EquipeAtendimentoPage

- [ ] **Passo 2.2.1:** Criar arquivo base
  ```bash
  frontend-web/src/features/atendimento/pages/EquipeAtendimentoPage.tsx
  ```

- [ ] **Passo 2.2.2:** Implementar 4 abas
  - [ ] Aba "Atendentes" (criar nova - lista com status)
  - [ ] Aba "Filas" (reutilizar GestaoFilasPage)
  - [ ] Aba "Skills" (reutilizar GestaoSkillsPage)
  - [ ] Aba "Roteamento" (reutilizar ConfiguracaoDistribuicaoPage)

- [ ] **Passo 2.2.3:** Criar aba "Atendentes" (NOVA)
  ```typescript
  // Componente novo - lista de atendentes com:
  - Status em tempo real (online/offline/ocupado)
  - Quantidade de tickets ativos
  - Skills do atendente
  - Horário de trabalho
  - Ações: editar, desativar, atribuir fila
  ```

- [ ] **Passo 2.2.4:** Integrar WebSocket para status real-time
  ```typescript
  // Conectar ao socket do backend
  socket.on('atendente:status', (data) => {
    // Atualizar badge verde/vermelho/amarelo
  });
  ```

- [ ] **Passo 2.2.5:** Adicionar rota e menu
  ```typescript
  // App.tsx
  <Route path="/atendimento/equipe" element={<EquipeAtendimentoPage />} />
  
  // menuConfig.ts
  {
    id: 'atendimento-equipe',
    title: 'Equipe',
    icon: Users,
    href: '/atendimento/equipe',
    color: 'purple',
  }
  ```

- [ ] **Passo 2.2.6:** Criar redirects
  ```typescript
  <Route path="/nuclei/atendimento/filas" 
    element={<Navigate to="/atendimento/equipe?tab=filas" />} 
  />
  <Route path="/nuclei/atendimento/distribuicao/skills" 
    element={<Navigate to="/atendimento/equipe?tab=skills" />} 
  />
  ```

**Arquivos:**
```
frontend-web/src/features/atendimento/pages/
  EquipeAtendimentoPage.tsx                          [CRIAR]
frontend-web/src/components/equipe/
  AtendentesTable.tsx                                [CRIAR]
  StatusIndicator.tsx                                [CRIAR]
```

---

#### 2.3. Melhorar ConfiguracoesAtendimentoPage

- [ ] **Passo 2.3.1:** Adicionar novas abas
  - [ ] Aba "Geral" (já existe)
  - [ ] Aba "Canais" (nova - WhatsApp, Email, Chat)
  - [ ] Aba "SLA & Prioridades" (migrar de /nuclei/atendimento/sla/configuracoes)
  - [ ] Aba "Notificações" (nova - alertas, webhooks)

- [ ] **Passo 2.3.2:** Criar aba "Canais"
  ```typescript
  // Lista de canais disponíveis:
  - WhatsApp (status: conectado/desconectado)
  - Email (configurar SMTP)
  - Chat Web (ativar/desativar)
  - SMS (Twilio credentials)
  - Botão: "Adicionar Canal"
  ```

- [ ] **Passo 2.3.3:** Migrar config SLA
  ```typescript
  // Buscar conteúdo de ConfiguracaoSLAPage.tsx
  // Extrair formulário de SLA policies
  // Integrar na aba "SLA & Prioridades"
  ```

- [ ] **Passo 2.3.4:** Criar aba "Notificações"
  ```typescript
  // Configurações:
  - Email de alertas (admin)
  - Webhook URL (eventos)
  - Frequência de resumos
  - Tipos de alertas (SLA breach, ticket novo, etc)
  ```

- [ ] **Passo 2.3.5:** Atualizar submenu Configurações
  ```typescript
  // menuConfig.ts - REMOVER subitens:
  children: [
    // ❌ SLA (agora é aba)
    // ❌ Distribuição (movido para Equipe)
    // ❌ Skills (movido para Equipe)
    // ✅ MANTER apenas link para página principal
  ]
  ```

- [ ] **Passo 2.3.6:** Criar redirects
  ```typescript
  <Route path="/nuclei/atendimento/sla/configuracoes" 
    element={<Navigate to="/atendimento/configuracoes?tab=sla" />} 
  />
  <Route path="/nuclei/atendimento/distribuicao/configuracao" 
    element={<Navigate to="/atendimento/equipe?tab=roteamento" />} 
  />
  ```

**Arquivos:**
```
frontend-web/src/features/atendimento/configuracoes/
  ConfiguracoesAtendimentoPage.tsx                   [MODIFICAR]
frontend-web/src/components/configuracoes/
  CanaisConfig.tsx                                   [CRIAR]
  SLAConfig.tsx                                      [CRIAR]
  NotificacoesConfig.tsx                             [CRIAR]
```

---

#### 2.4. Remover Submenu Configurações

- [ ] **Passo 2.4.1:** Atualizar menuConfig.ts
  ```typescript
  // ANTES:
  {
    id: 'atendimento-configuracoes',
    title: 'Configurações',
    children: [
      { id: 'geral', ... },
      { id: 'sla', ... },      // ❌ REMOVER
      { id: 'distribuicao', ... }, // ❌ REMOVER
      { id: 'skills', ... },   // ❌ REMOVER
    ]
  }
  
  // DEPOIS:
  {
    id: 'atendimento-configuracoes',
    title: 'Configurações',
    icon: Settings,
    href: '/atendimento/configuracoes', // SEM children
    color: 'purple',
  }
  ```

- [ ] **Passo 2.4.2:** Remover ícones não utilizados
  ```typescript
  // Verificar se Clock e Shuffle ainda são usados
  // Se não, remover dos imports do menuConfig.ts
  ```

**Arquivo:**
```
frontend-web/src/config/menuConfig.ts                [MODIFICAR]
```

---

#### 2.5. Validação FASE 2

- [ ] **Teste de Automações**
  - [ ] Abrir /atendimento/automacoes
  - [ ] Trocar entre abas (Bot, Templates, Regras)
  - [ ] Verificar que funcionalidades existentes ainda funcionam
  - [ ] Testar criar novo template
  - [ ] Testar editar regra de fechamento

- [ ] **Teste de Equipe**
  - [ ] Abrir /atendimento/equipe
  - [ ] Ver lista de atendentes (aba Atendentes)
  - [ ] Ver filas (aba Filas)
  - [ ] Ver skills (aba Skills)
  - [ ] Ver config de roteamento (aba Roteamento)

- [ ] **Teste de Configurações**
  - [ ] Abrir /atendimento/configuracoes
  - [ ] Ver aba Geral
  - [ ] Ver aba Canais
  - [ ] Ver aba SLA (migrada)
  - [ ] Ver aba Notificações

- [ ] **Teste de Menu**
  - [ ] Verificar que menu Atendimento tem 5 itens:
    1. Caixa de Entrada
    2. Métricas & Analytics
    3. Automações ⭐ NOVO
    4. Equipe ⭐ NOVO
    5. Configurações (SEM submenu)

- [ ] **Teste de Redirects**
  - [ ] URLs antigas de templates → /atendimento/automacoes?tab=templates
  - [ ] URLs antigas de filas → /atendimento/equipe?tab=filas
  - [ ] URLs antigas de SLA config → /atendimento/configuracoes?tab=sla

**Critérios de Aceitação FASE 2:**
- ✅ Menu reduzido para 5 itens (-58% total)
- ✅ Zero submenu em Configurações
- ✅ Todas funcionalidades acessíveis via abas
- ✅ Redirects funcionando
- ✅ Zero erros no console

---

### FASE 3 - Premium (Opcional)

#### 3.1. Criar InboxAtendimentoPage

**Escopo:** Caixa de entrada unificada estilo Zendesk

- [ ] **Passo 3.1.1:** Criar estrutura base
  ```
  Layout 2 colunas:
  ├── Coluna Esquerda (30%): Lista de tickets
  └── Coluna Direita (70%): Chat ativo
  ```

- [ ] **Passo 3.1.2:** Implementar lista de tickets
  ```typescript
  // Componentes:
  - TicketList (virtual scroll para performance)
  - TicketCard (preview da última mensagem)
  - TicketFilters (abertos, meus, urgentes, não atribuídos)
  - SearchBar (busca instantânea)
  ```

- [ ] **Passo 3.1.3:** Integrar ChatOmnichannel
  ```typescript
  // Reutilizar componente existente
  import ChatOmnichannel from '../omnichannel/ChatOmnichannel';
  
  // Passar ticket selecionado como prop
  <ChatOmnichannel ticketId={selectedTicketId} />
  ```

- [ ] **Passo 3.1.4:** Adicionar ações rápidas
  ```typescript
  // Toolbar com botões:
  - Atribuir para mim
  - Atribuir para outro
  - Marcar como resolvido
  - Adicionar nota interna
  - Escalar para N2/N3
  - Adicionar tag
  ```

- [ ] **Passo 3.1.5:** Implementar busca avançada
  ```typescript
  // Filtros:
  - Status (aberto, pendente, resolvido)
  - Prioridade (baixa, média, alta, urgente)
  - Atendente
  - Canal (WhatsApp, Email, Chat)
  - Período (hoje, 7d, 30d, custom)
  - Tags
  ```

- [ ] **Passo 3.1.6:** WebSocket para updates em tempo real
  ```typescript
  // Eventos:
  socket.on('ticket:new', () => {...})
  socket.on('ticket:updated', () => {...})
  socket.on('message:new', () => {...})
  socket.on('atendente:typing', () => {...})
  ```

**Arquivos:**
```
frontend-web/src/features/atendimento/pages/
  InboxAtendimentoPage.tsx                           [CRIAR]
frontend-web/src/components/inbox/
  TicketList.tsx                                     [CRIAR]
  TicketCard.tsx                                     [CRIAR]
  TicketFilters.tsx                                  [CRIAR]
  SearchBar.tsx                                      [CRIAR]
  QuickActions.tsx                                   [CRIAR]
```

---

#### 3.2. Melhorar Analytics (Gráficos Interativos)

- [ ] **Passo 3.2.1:** Instalar biblioteca de gráficos
  ```bash
  npm install recharts
  # ou
  npm install chart.js react-chartjs-2
  ```

- [ ] **Passo 3.2.2:** Adicionar gráfico de tendência
  ```typescript
  // LineChart para mostrar tickets ao longo do tempo
  <LineChart>
    <Line dataKey="novos" stroke="#159A9C" />
    <Line dataKey="resolvidos" stroke="#16A34A" />
    <Line dataKey="pendentes" stroke="#FBBF24" />
  </LineChart>
  ```

- [ ] **Passo 3.2.3:** Adicionar gráfico de pizza (canais)
  ```typescript
  // PieChart para distribuição por canal
  <PieChart>
    <Pie data={canais} dataKey="quantidade" nameKey="canal" />
  </PieChart>
  ```

- [ ] **Passo 3.2.4:** Adicionar drill-down nos KPIs
  ```typescript
  // Clicar no card = modal com detalhes
  <KPICard onClick={() => setShowDetails(true)}>
    {/* ... */}
  </KPICard>
  ```

- [ ] **Passo 3.2.5:** Adicionar exportação
  ```typescript
  // Botões:
  - Exportar CSV
  - Exportar PDF
  - Agendar relatório por email
  ```

---

#### 3.3. Status em Tempo Real (Equipe)

- [ ] **Passo 3.3.1:** Implementar presença online
  ```typescript
  // Badge verde/vermelho/amarelo
  enum Status {
    ONLINE = 'online',      // verde
    OFFLINE = 'offline',    // cinza
    OCUPADO = 'ocupado',    // amarelo
    AUSENTE = 'ausente',    // vermelho
  }
  ```

- [ ] **Passo 3.3.2:** Mostrar carga atual
  ```typescript
  // Card por atendente:
  Nome: João Silva
  Status: 🟢 Online
  Tickets Ativos: 5 / 10
  Tempo Médio: 15min
  Última Atividade: há 2min
  ```

- [ ] **Passo 3.3.3:** WebSocket para updates
  ```typescript
  socket.on('atendente:status', (data) => {
    updateAtendenteStatus(data.id, data.status);
  });
  
  socket.on('ticket:assigned', (data) => {
    updateCargaAtendente(data.atendenteId);
  });
  ```

---

#### 3.4. Validação FASE 3

- [ ] **Teste de Inbox**
  - [ ] Abrir /atendimento/inbox
  - [ ] Ver lista de tickets na esquerda
  - [ ] Clicar em ticket → chat abre na direita
  - [ ] Buscar ticket → lista filtra instantaneamente
  - [ ] Atribuir ticket → notificação em tempo real
  - [ ] Nova mensagem → badge de notificação

- [ ] **Teste de Analytics**
  - [ ] Gráficos carregam < 2s
  - [ ] Hover em gráfico → tooltip com detalhes
  - [ ] Clicar em KPI → drill-down funciona
  - [ ] Exportar CSV → arquivo baixa corretamente

- [ ] **Teste de Status Real-Time**
  - [ ] Atendente faz login → status muda para online
  - [ ] Atendente recebe ticket → contador aumenta
  - [ ] Atendente resolve ticket → contador diminui
  - [ ] Atendente fica inativo > 10min → status "ausente"

**Critérios de Aceitação FASE 3:**
- ✅ Inbox funcional com lista + chat
- ✅ Busca < 300ms
- ✅ Gráficos interativos
- ✅ Status real-time < 1s de delay
- ✅ NPS usuários > 8/10

---

## 🧪 Validação e Testes

### Checklist de Testes por Fase

#### FASE 1 - Testes Básicos
```
Navegação:
- [ ] Abrir cada aba de Analytics
- [ ] Verificar redirects de URLs antigas
- [ ] Verificar breadcrumbs corretos

Funcionalidade:
- [ ] Métricas carregam corretamente
- [ ] Filtros funcionam
- [ ] Dados são os mesmos das páginas antigas

Performance:
- [ ] Trocar abas < 200ms
- [ ] Carregar dados < 2s
- [ ] Sem memory leaks

Browser:
- [ ] Chrome ✅
- [ ] Firefox ✅
- [ ] Safari ✅
- [ ] Edge ✅

Responsividade:
- [ ] Mobile (375px) ✅
- [ ] Tablet (768px) ✅
- [ ] Desktop (1920px) ✅
```

#### FASE 2 - Testes Avançados
```
Automações:
- [ ] Criar template
- [ ] Editar template
- [ ] Deletar template
- [ ] Criar fluxo de bot
- [ ] Testar regra de fechamento

Equipe:
- [ ] Ver lista de atendentes
- [ ] Criar nova fila
- [ ] Atribuir skill
- [ ] Configurar roteamento

Configurações:
- [ ] Adicionar canal
- [ ] Configurar SLA
- [ ] Testar notificação
- [ ] Salvar configurações

Redirects:
- [ ] 10+ URLs antigas testadas
- [ ] Todas redirecionam corretamente
- [ ] Query params preservados
```

#### FASE 3 - Testes Premium
```
Inbox:
- [ ] Carregar 1000+ tickets (virtual scroll)
- [ ] Busca instantânea
- [ ] Filtros salvos
- [ ] Ações em lote
- [ ] WebSocket sem desconexões

Real-Time:
- [ ] Novo ticket aparece < 1s
- [ ] Status atendente atualiza < 1s
- [ ] Typing indicator funciona
- [ ] Notificações desktop

Performance:
- [ ] Lighthouse Score > 90
- [ ] First Contentful Paint < 1.5s
- [ ] Time to Interactive < 3s
- [ ] Cumulative Layout Shift < 0.1
```

---

## 🔄 Rollback Plan

### Se algo der errado...

#### FASE 1 - Rollback Simples
```bash
# 1. Reverter commit
git revert <commit-hash>

# 2. Restaurar menuConfig.ts
git checkout HEAD~1 frontend-web/src/config/menuConfig.ts

# 3. Remover redirects
git checkout HEAD~1 frontend-web/src/App.tsx

# 4. Deploy
npm run build
```

#### FASE 2 - Rollback Moderado
```bash
# 1. Desabilitar novas páginas no menu
# Comentar no menuConfig.ts:
// { id: 'automacoes', ... }
// { id: 'equipe', ... }

# 2. Desabilitar redirects
# Comentar em App.tsx

# 3. Manter páginas antigas ativas
# Descomentar rotas antigas

# 4. Comunicar usuários
# "Temporariamente voltamos à navegação anterior"
```

#### FASE 3 - Rollback Complexo
```bash
# 1. Feature flag
ENABLE_NEW_INBOX=false

# 2. Condicional no código
{process.env.ENABLE_NEW_INBOX ? 
  <InboxAtendimentoPage /> : 
  <ChatOmnichannel />
}

# 3. Rollout gradual
# Liberar para 10% usuários
# Coletar feedback
# Aumentar para 50%
# Finalmente 100%
```

---

## 📊 Métricas de Sucesso

### KPIs para Acompanhar

#### Navegação
- **Cliques até ação:** Reduzir de 3 para 2 cliques
- **Taxa de erro:** < 5% (usuário clica no lugar errado)
- **Tempo até encontrar funcionalidade:** < 30s

#### Adoção
- **% usuários usando novas abas:** > 80% em 1 semana
- **% usuários usando Inbox (F3):** > 60% em 1 mês
- **Tickets de suporte sobre navegação:** Reduzir 50%

#### Satisfação
- **NPS (Net Promoter Score):** > 8/10
- **CSAT (Customer Satisfaction):** > 90%
- **Feedback positivo:** > 80%

#### Performance
- **Tempo de carregamento:** < 2s (P95)
- **Tempo de resposta API:** < 500ms (P95)
- **Uptime:** > 99.9%

---

## 📝 Histórico de Mudanças

| Data | Fase | Responsável | Status | Observações |
|------|------|-------------|--------|-------------|
| 09/12/2025 | Planejamento | Equipe | ✅ Concluído | Documento criado |
| - | Fase 1 | - | 🟡 Aguardando | - |
| - | Fase 2 | - | ⚪ Pendente | - |
| - | Fase 3 | - | ⚪ Pendente | - |

---

## 🤝 Próximos Passos

### Decisão Imediata Necessária:

**Opção A: MVP (FASE 1 apenas) - 2 semanas**
- ✅ Menor risco
- ✅ Quick wins visíveis
- ✅ Não quebra nada
- ❌ Melhoria limitada

**Opção B: Consolidação (FASE 1 + 2) - 4 semanas**
- ✅ Alinhado com mercado
- ✅ Redução significativa de complexidade
- ✅ ROI alto
- ⚠️ Requer mais testes

**Opção C: Completo (FASE 1 + 2 + 3) - 8 semanas**
- ✅ Experiência premium
- ✅ Diferencial competitivo
- ✅ Maior satisfação usuários
- ⚠️ Maior esforço

---

## 📞 Contatos

**Dúvidas sobre o plano:**
- Abrir issue no GitHub
- Mencionar @equipe-frontend

**Aprovação necessária:**
- Product Owner
- Tech Lead

---

**Documento vivo:** Este plano será atualizado conforme progresso.  
**Última atualização:** 09/12/2025  
**Versão:** 1.0
