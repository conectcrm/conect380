# 📊 Estrutura de Dashboards por Perfil - ConectCRM

## 🎯 Visão Geral

Cada perfil de usuário precisa de uma visão específica e relevante para suas responsabilidades diárias. Aqui está a estrutura recomendada:

## 👑 **GESTOR/ADMIN** - Dashboard Estratégico
**Arquivo:** `DashboardPage.tsx` (já implementado)

### Widgets Principais:
- ✅ **KPIs Financeiros:** Faturamento, ticket médio, margem
- ✅ **Performance da Equipe:** Ranking, metas, produtividade
- ✅ **Alertas Gerenciais:** Propostas vencendo, problemas críticos
- ✅ **Gráficos Estratégicos:** Tendências, comparativos, previsões
- ✅ **Próximas Atividades:** Visão executiva das prioridades

### Foco:
- Visão estratégica do negócio
- Performance geral da equipe
- Tomada de decisões baseada em dados
- Identificação de oportunidades e problemas

---

## 💼 **VENDEDOR** - Dashboard Operacional
**Arquivo:** `VendedorDashboard.tsx` (implementado)

### Widgets Principais:
- 🎯 **Metas Pessoais:** Progress individual, ranking na equipe
- 📈 **Pipeline Pessoal:** Oportunidades ativas, probabilidades
- 📅 **Agenda do Dia:** Calls, reuniões, follow-ups
- 🔥 **Propostas Ativas:** Status visual (quente/morna/fria)
- 👥 **Leads Para Qualificar:** Lista priorizada de novos leads
- 🏆 **Gamificação:** Pontuação, badges, performance semanal

### Foco:
- Produtividade pessoal
- Pipeline individual
- Atividades do dia
- Metas e incentivos

---

## 📋 **OPERACIONAL/SUPORTE** - Dashboard de Atendimento
**Arquivo:** `OperacionalDashboard.tsx` (a implementar)

### Widgets Principais:
- 🎫 **Tickets Abertos:** Por prioridade e SLA
- ⏱️ **Tempo de Resposta:** Médio e por categoria
- 👥 **Clientes Ativos:** Com problemas ou demandas
- 📞 **Fila de Atendimento:** Próximos contatos
- 📊 **Satisfação:** NPS e feedback dos clientes
- 🔄 **Processos:** Pendentes, aprovações, validações

### Estrutura Sugerida:
```typescript
// Widgets específicos para operacional
- SLA Dashboard (tempo de resposta)
- Tickets por status (aberto, pendente, resolvido)
- Satisfação do cliente (NPS, ratings)
- Processos internos (aprovações, validações)
- Knowledge base (artigos mais acessados)
```

---

## 💰 **FINANCEIRO** - Dashboard Financeiro
**Arquivo:** `FinanceiroDashboard.tsx` (a implementar)

### Widgets Principais:
- 💳 **Contas a Receber:** Vencidas, vencendo, em dia
- 💸 **Contas a Pagar:** Fornecedores, salários, comissões
- 📊 **Fluxo de Caixa:** Previsão 30/60/90 dias
- 📈 **Inadimplência:** Taxa, valores, ações de cobrança
- 🏦 **Conciliação:** Bancária, cartões, pagamentos
- 📋 **Relatórios:** DRE, balancete, indicadores

### Estrutura Sugerida:
```typescript
// KPIs financeiros específicos
- Recebimentos do mês
- Taxa de inadimplência
- Fluxo de caixa projetado
- Comissões a pagar
- Margem de contribuição
```

---

## 🎮 **IMPLEMENTAÇÃO POR ETAPAS**

### ✅ **Fase 1: Completa**
- [x] Dashboard Gestor (DashboardPage.tsx)
- [x] Dashboard Vendedor (VendedorDashboard.tsx)
- [x] Router por perfil (DashboardRouter.tsx)

### 🚧 **Fase 2: Próximos Passos**
```typescript
// 1. Operacional Dashboard
- Tickets e SLA widgets
- Customer satisfaction tracker
- Process monitoring

// 2. Financeiro Dashboard  
- Accounts receivable/payable
- Cash flow projections
- Commission tracking

// 3. Perfis Específicos
- Marketing Dashboard (campanhas, leads, ROI)
- Suporte Dashboard (base de conhecimento, FAQ)
- CEO Dashboard (visão executiva ultra-resumida)
```

---

## 🔄 **DADOS E HOOKS ESPECÍFICOS**

### Por Perfil:
```typescript
// Gestor
const { data } = useDashboard(); // Dados gerais da empresa

// Vendedor  
const { data } = useVendedorDashboard(vendedorId); // Dados pessoais

// Operacional
const { data } = useOperacionalDashboard(); // Tickets e processos

// Financeiro
const { data } = useFinanceiroDashboard(); // Contas e fluxo
```

---

## 🎨 **DESIGN CONSISTENTE**

### Padrão Visual:
- **Header personalizado** por perfil (cores diferentes)
- **KPIs relevantes** para cada função
- **Gamificação** para vendedores (ranking, badges)
- **Alertas específicos** por responsabilidade
- **Navegação contextual** (botões de ação relevantes)

### Cores por Perfil:
- 👑 **Gestor:** Azul/Roxo (estratégico)
- 💼 **Vendedor:** Verde/Laranja (ação/energia)
- 📋 **Operacional:** Azul/Cinza (eficiência)
- 💰 **Financeiro:** Verde/Dourado (estabilidade)

---

## 🚀 **BENEFÍCIOS**

1. **Produtividade:** Cada usuário vê apenas o que importa
2. **Engajamento:** Dashboards relevantes mantêm o foco
3. **Decisões:** Dados contextualizados por função
4. **Gamificação:** Vendedores motivados com ranking e metas
5. **Eficiência:** Reduz tempo procurando informações

Esta estrutura garante que cada perfil tenha uma experiência otimizada e relevante para suas responsabilidades específicas!
