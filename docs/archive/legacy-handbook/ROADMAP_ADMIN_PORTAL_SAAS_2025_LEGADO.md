# 🚀 Roadmap: Admin Portal SaaS & Gestão de Clientes B2B

**Objetivo**: Criar sistema completo de gerenciamento de empresas clientes (multi-tenant) seguindo padrões de mercado (Salesforce, HubSpot, Stripe).

**Data Início**: 21 de novembro de 2025  
**Prazo Total**: 6 semanas  
**Status Atual**: 🟡 Em Progresso

---

## 📊 Visão Geral

### O que já existe:
- ✅ Tabela `empresa_modulos` (licenciamento)
- ✅ Entity `Empresa` com dados básicos
- ✅ Sistema de módulos e planos (enums)
- ✅ Frontend `/admin/empresas` (com mock data)
- ✅ Frontend `/billing` (cliente side)

### O que vamos construir:
- 🎯 Portal Admin completo (vendor side)
- 🎯 APIs de gestão de empresas
- 🎯 Sistema de billing funcional
- 🎯 Analytics e métricas de negócio
- 🎯 Automações e health score

---

## 🎯 FASE 1: Backend Admin - Gestão de Empresas (Semana 1-2)

**Objetivo**: Conectar frontend admin com backend real e criar APIs essenciais.

### ✅ 1.1 Melhorias na Entity Empresa
- [x] Adicionar campos de status, trial, MRR
- [x] Campos de health score e último acesso
- [x] Uso mensal e limites
- [x] Integração Stripe (customer_id, subscription_id)

### ✅ 1.2 Migration para Novos Campos
- [x] Criar migration `AlterEmpresaAddAdminFields`
- [x] Rodar migration em desenvolvimento
- [x] Testar rollback

### 🔄 1.3 Admin Controller (Backend)
**Arquivo**: `backend/src/modules/admin/controllers/admin-empresas.controller.ts`

Endpoints:
```typescript
GET    /api/admin/empresas              // Listar todas (paginado, filtros)
GET    /api/admin/empresas/:id          // Detalhes completos
POST   /api/admin/empresas              // Criar empresa (onboarding)
PUT    /api/admin/empresas/:id          // Atualizar dados
PATCH  /api/admin/empresas/:id/status   // Suspender/Reativar
GET    /api/admin/empresas/:id/usuarios // Usuários da empresa
GET    /api/admin/empresas/:id/logs     // Log de atividades
```

**Dependências**:
- AdminEmpresasService
- EmpresaRepository
- UserRepository
- LogService

### 🔄 1.4 Admin Service (Backend)
**Arquivo**: `backend/src/modules/admin/services/admin-empresas.service.ts`

Métodos:
- `listarTodas(filters, pagination)` → com status, plano, health score
- `buscarPorId(id)` → com relacionamentos (usuários, módulos)
- `criar(dto)` → onboarding completo (empresa + admin user + módulos)
- `atualizar(id, dto)` → validações e logs
- `suspender(id, motivo)` → desativar acesso + notificar
- `reativar(id)` → restaurar acesso
- `calcularHealthScore(id)` → score 0-100

### 🔄 1.5 DTOs de Administração
**Arquivos**:
- `create-empresa-admin.dto.ts` → validação completa
- `update-empresa-admin.dto.ts` → campos editáveis
- `empresa-detail-admin.dto.ts` → resposta com tudo
- `empresa-list-admin.dto.ts` → resposta resumida
- `filter-empresas-admin.dto.ts` → filtros de busca

### 🔄 1.6 Frontend Service
**Arquivo**: `frontend-web/src/services/adminEmpresasService.ts`

Espelhar APIs do backend:
```typescript
export const adminEmpresasService = {
  listar(filters, page, limit),
  buscarPorId(id),
  criar(data),
  atualizar(id, data),
  suspender(id, motivo),
  reativar(id),
  listarUsuarios(empresaId),
  buscarLogs(empresaId)
}
```

### 🔄 1.7 Atualizar Página Admin Empresas
**Arquivo**: `frontend-web/src/features/admin/empresas/EmpresasListPage.tsx`

Substituir mock data por chamadas reais:
- Integrar com `adminEmpresasService`
- Loading states corretos
- Error handling
- Paginação funcional
- Filtros aplicados

### 🔄 1.8 Página de Detalhes da Empresa
**Arquivo**: `frontend-web/src/features/admin/empresas/EmpresaDetailPage.tsx`

Seções:
- Informações gerais (editar inline)
- Módulos ativos (ativar/desativar)
- Usuários (com status)
- Health score (visual + breakdown)
- Histórico de atividades
- Notas internas
- Ações: Suspender, Reativar, Editar Plano

**Status Fase 1**: 🟡 **EM PROGRESSO** (0% completo)  
**Prazo**: 21 nov - 4 dez  
**Dependências**: Nenhuma

---

## 🎯 FASE 2: Gestão de Módulos e Planos (Semana 3)

**Objetivo**: Sistema completo de licenciamento e mudança de planos.

### 🔲 2.1 Admin Módulos Controller
**Arquivo**: `backend/src/modules/admin/controllers/admin-modulos.controller.ts`

```typescript
GET    /api/admin/empresas/:id/modulos       // Módulos da empresa
POST   /api/admin/empresas/:id/modulos       // Ativar módulo
PUT    /api/admin/empresas/:id/modulos/:mod  // Editar (ex: expiration)
DELETE /api/admin/empresas/:id/modulos/:mod  // Desativar
POST   /api/admin/empresas/:id/plano         // Mudar plano completo
GET    /api/admin/modulos/estatisticas       // Uso global de módulos
```

### 🔲 2.2 Planos Service
**Arquivo**: `backend/src/modules/admin/services/planos.service.ts`

Métodos:
- `listarPlanos()` → STARTER, BUSINESS, ENTERPRISE + features
- `mudarPlano(empresaId, novoPlano)` → ativar/desativar módulos
- `calcularPreco(plano, modulosExtras)` → pricing dinâmico
- `validarLimites(empresaId)` → verificar se está no limite

### 🔲 2.3 Frontend - Modal de Gestão de Módulos
**Componente**: `ModalGestaoModulos.tsx`

UI:
- Checkbox por módulo (com ícone)
- Data de expiração (se trial)
- Toggle ativo/inativo
- Botão "Salvar Alterações"

### 🔲 2.4 Frontend - Modal de Mudança de Plano
**Componente**: `ModalMudancaPlano.tsx`

UI:
- Cards dos 3 planos (atual destacado)
- Lista de features incluídas
- Cálculo de preço
- Botão "Confirmar Mudança"

**Status Fase 2**: ⚪ **NÃO INICIADA**  
**Prazo**: 5 dez - 11 dez  
**Dependências**: Fase 1 completa

---

## 🎯 FASE 3: Billing & Financeiro (Semana 4)

**Objetivo**: Sistema de cobrança recorrente e integração com gateway de pagamento.

### 🔲 3.1 Billing Controller (Admin)
**Arquivo**: `backend/src/modules/admin/controllers/admin-billing.controller.ts`

```typescript
GET    /api/admin/billing/mrr              // Monthly Recurring Revenue
GET    /api/admin/billing/arr              // Annual Recurring Revenue
GET    /api/admin/billing/churn            // Taxa de cancelamento
GET    /api/admin/billing/faturas          // Todas as faturas
GET    /api/admin/billing/inadimplencia    // Empresas em atraso
POST   /api/admin/billing/cobranca/:id     // Forçar cobrança manual
GET    /api/admin/billing/previsao         // Forecast
```

### 🔲 3.2 Stripe Integration Service
**Arquivo**: `backend/src/modules/billing/services/stripe-integration.service.ts`

Métodos:
- `criarCustomer(empresa)` → Stripe Customer
- `criarAssinatura(customerId, plano)` → Stripe Subscription
- `atualizarAssinatura(subscriptionId, novoPlano)` → upgrade/downgrade
- `cancelarAssinatura(subscriptionId)` → cancel at period end
- `webhookHandler(event)` → processar eventos Stripe

### 🔲 3.3 Faturas Entity e Service
**Arquivos**:
- `faturas.entity.ts` → tabela de faturas
- `faturas.service.ts` → CRUD + geração automática

Campos da fatura:
- empresa_id, valor, status, data_vencimento
- stripe_invoice_id, url_pagamento, url_pdf

### 🔲 3.4 Customer Portal - Billing Funcional
**Arquivo**: `frontend-web/src/pages/billing/index.tsx`

Conectar com backend real:
- Listar faturas da empresa
- Baixar PDF
- Pagar fatura pendente (redirect Stripe)
- Atualizar método de pagamento

### 🔲 3.5 Admin Dashboard Financeiro
**Arquivo**: `frontend-web/src/features/admin/billing/BillingDashboard.tsx`

KPIs:
- MRR/ARR com gráfico de tendência
- Churn rate (mensal)
- Empresas inadimplentes (lista)
- Previsão de receita (3 meses)

**Status Fase 3**: ⚪ **NÃO INICIADA**  
**Prazo**: 12 dez - 18 dez  
**Dependências**: Fase 2 completa

---

## 🎯 FASE 4: Analytics & Dashboard Admin (Semana 5)

**Objetivo**: Métricas de negócio e visão executiva.

### 🔲 4.1 Analytics Controller
**Arquivo**: `backend/src/modules/admin/controllers/admin-analytics.controller.ts`

```typescript
GET    /api/admin/analytics/dashboard       // KPIs principais
GET    /api/admin/analytics/crescimento     // Novos clientes/mês
GET    /api/admin/analytics/uso-modulos     // Módulos mais usados
GET    /api/admin/analytics/planos          // Distribuição por plano
GET    /api/admin/analytics/retencao        // Cohort analysis
GET    /api/admin/analytics/ltv             // Lifetime Value
```

### 🔲 4.2 Analytics Service
**Arquivo**: `backend/src/modules/admin/services/analytics.service.ts`

Cálculos:
- Total de empresas (ativas, trial, suspensas)
- MRR e crescimento mensal
- Churn rate
- CAC (Customer Acquisition Cost)
- LTV (Lifetime Value)
- Cohort retention

### 🔲 4.3 Admin Dashboard Page
**Arquivo**: `frontend-web/src/features/admin/dashboard/AdminDashboardPage.tsx`

Layout:
```
┌─────────────────────────────────────────┐
│  KPI Cards (4 colunas)                  │
│  - Total Empresas    - MRR              │
│  - Churn Rate        - Health Score     │
├─────────────────────────────────────────┤
│  Gráficos (2 colunas)                   │
│  - Crescimento       - Dist. Planos     │
├─────────────────────────────────────────┤
│  Tabela: Empresas que Precisam Atenção │
│  (health score < 50 OU sem uso 7+ dias) │
└─────────────────────────────────────────┘
```

### 🔲 4.4 Relatórios Exportáveis
**Feature**: Exportar dados em PDF/Excel

Relatórios:
- Lista de empresas (com filtros)
- Financeiro mensal
- Uso de módulos
- Churn analysis

**Status Fase 4**: ⚪ **NÃO INICIADA**  
**Prazo**: 19 dez - 25 dez  
**Dependências**: Fase 3 completa

---

## 🎯 FASE 5: Automações & Health Score (Semana 6)

**Objetivo**: Jobs automáticos e sistema de alerta.

### 🔲 5.1 Health Score Service
**Arquivo**: `backend/src/modules/admin/services/health-score.service.ts`

Algoritmo:
```typescript
Score = (Uso × 0.4) + (Engajamento × 0.3) + (Financeiro × 0.2) + (Suporte × 0.1)

Uso (40%):
- Login diário: 40 pts
- Login semanal: 25 pts
- Sem uso 7+ dias: 0 pts

Engajamento (30%):
- Usuários ativos / total: 30 pts
- Funcionalidades usadas: 15 pts
- Dados cadastrados: 15 pts

Financeiro (20%):
- Pagamentos em dia: 20 pts
- Atraso < 5 dias: 10 pts
- Inadimplente: 0 pts

Suporte (10%):
- NPS alto: +10 pts
- Tickets antigos: -5 pts
```

### 🔲 5.2 Jobs Agendados (CRON)
**Arquivo**: `backend/src/modules/admin/jobs/admin.jobs.ts`

Jobs:
```typescript
@Cron('0 0 * * *') // Diário - 00:00
verificarExpiracoes() {
  - Trial expirando em 3 dias → email
  - Trial expirado → suspender
  - Assinatura expirada → downgrade
}

@Cron('0 1 * * *') // Diário - 01:00
calcularMetricas() {
  - Atualizar MRR/ARR
  - Calcular churn
  - Atualizar dashboards
}

@Cron('0 */6 * * *') // A cada 6h
atualizarHealthScores() {
  - Recalcular todos os scores
  - Alertar se score < 40
}

@Cron('0 0 1 * *') // Todo dia 1 do mês
gerarFaturasRecorrentes() {
  - Gerar faturas automáticas
  - Enviar emails de cobrança
  - Tentar cobrar no Stripe
}
```

### 🔲 5.3 Sistema de Alertas
**Arquivo**: `backend/src/modules/admin/services/alerts.service.ts`

Alertas automáticos:
- Health score < 40 → notificar admin
- Sem uso 7 dias → email reengajamento
- Inadimplência → suspensão iminente
- Trial ending → email conversão
- Churn → questionário exit

### 🔲 5.4 Email Templates
**Pasta**: `backend/src/templates/emails/`

Templates:
- `trial-ending.hbs` → Aviso de expiração
- `welcome-onboard.hbs` → Boas-vindas
- `payment-failed.hbs` → Falha no pagamento
- `subscription-cancelled.hbs` → Confirmação cancelamento
- `reengagement.hbs` → Reativar uso

### 🔲 5.5 Webhooks Externos
**Endpoint**: `/api/webhooks/stripe`

Processar eventos:
- `invoice.payment_succeeded` → ativar assinatura
- `invoice.payment_failed` → avisar inadimplência
- `customer.subscription.deleted` → cancelar conta

**Status Fase 5**: ⚪ **NÃO INICIADA**  
**Prazo**: 26 dez - 1 jan  
**Dependências**: Fase 4 completa

---

## 📊 Roadmap Visual

```
Semana 1-2  ████████████░░░░░░░░  [▶ Fase 1: Backend Admin]
Semana 3    ░░░░░░░░░░░░████████  [  Fase 2: Módulos]
Semana 4    ░░░░░░░░░░░░░░░░████  [  Fase 3: Billing]
Semana 5    ░░░░░░░░░░░░░░░░░░░░  [  Fase 4: Analytics]
Semana 6    ░░░░░░░░░░░░░░░░░░░░  [  Fase 5: Automações]
```

---

## 🎯 Prioridades & Dependências

### Crítico (P0) - Bloqueia todo o resto:
- ✅ Fase 1.1-1.2: Entity Empresa + Migration
- 🔄 Fase 1.3-1.4: APIs Admin de Empresas
- 🔄 Fase 1.6-1.7: Frontend conectado

### Importante (P1) - Funcionalidades core:
- Fase 2: Gestão de módulos
- Fase 3.1-3.3: Sistema de billing
- Fase 5.2: Jobs de expiração

### Desejável (P2) - Pode esperar:
- Fase 4: Analytics completo
- Fase 5.1: Health score
- Fase 5.5: Webhooks externos

---

## 🧪 Testes & Validação

### Por Fase:

**Fase 1**:
- [ ] API retorna lista de empresas
- [ ] API retorna detalhes de 1 empresa
- [ ] Frontend carrega dados reais
- [ ] Suspender empresa funciona
- [ ] Reativar empresa funciona

**Fase 2**:
- [ ] Ativar módulo avulso
- [ ] Desativar módulo
- [ ] Mudar plano (upgrade)
- [ ] Mudar plano (downgrade)
- [ ] Validar limites do plano

**Fase 3**:
- [ ] Criar customer no Stripe
- [ ] Criar assinatura
- [ ] Gerar fatura automática
- [ ] Cliente paga fatura
- [ ] Webhook Stripe processa

**Fase 4**:
- [ ] Dashboard exibe KPIs corretos
- [ ] MRR calculado corretamente
- [ ] Churn rate preciso
- [ ] Gráficos renderizam

**Fase 5**:
- [ ] Job de expiração roda
- [ ] Health score atualiza
- [ ] Email de trial enviado
- [ ] Suspensão automática funciona

---

## 📈 Métricas de Sucesso

### Ao final do projeto:

✅ **Funcional**:
- Admin consegue ver todas as empresas
- Admin consegue gerenciar módulos
- Cobrança automática funciona
- Alertas disparam corretamente

✅ **Performance**:
- Listagem de empresas < 2s
- Dashboard carrega < 3s
- Jobs completam < 5min

✅ **Qualidade**:
- Zero erros críticos
- 80%+ cobertura de testes
- Documentação completa

---

## 🚀 Próximos Passos IMEDIATOS

### Agora (Fase 1 - Início):

1. ✅ **Migration**: Adicionar campos na tabela `empresas`
2. 🔄 **Backend**: Criar `AdminEmpresasController`
3. 🔄 **Backend**: Criar `AdminEmpresasService`
4. 🔄 **Frontend**: Criar `adminEmpresasService.ts`
5. 🔄 **Frontend**: Conectar `EmpresasListPage` com API real

---

**Status Geral**: 🟡 **5% Completo**  
**Última Atualização**: 21/11/2025  
**Responsável**: Equipe ConectCRM
