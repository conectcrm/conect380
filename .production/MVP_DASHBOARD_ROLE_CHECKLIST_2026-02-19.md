# MVP Dashboard Role Checklist (2026-02-19)

## Objetivo
Validar, por perfil de usuario, se os dashboards estao prontos para operacao de MVP com dados reais.

## Criterios de prontidao usados
- Dashboard roteado corretamente por perfil.
- Dados vindos de API real (sem cards mock hardcoded).
- Estados de loading e erro presentes.
- Indicadores principais coerentes com o papel do perfil.
- Escopo por empresa e, quando aplicavel, por usuario/perfil.

## Mapa atual de roteamento
- `administrador` -> `DashboardPage`
- `gerente` -> `DashboardPage`
- `vendedor` -> `VendedorDashboard`
- `operacional` -> `OperacionalDashboard`
- `suporte` -> `SuporteDashboard`
- `financeiro` -> `FinanceiroDashboard`

Arquivo-base: `frontend-web/src/features/dashboard/DashboardRouter.tsx`

## Analise individual por dashboard

### 1) Administrador
- Componente: `frontend-web/src/features/dashboard/DashboardPage.tsx`
- Fonte de dados: `useDashboard` -> `GET /dashboard/resumo`
- Status: `PRONTO PARA MVP`
- Pontos fortes:
  - Dados reais de KPIs, ranking, alertas e graficos.
  - Filtros de periodo, vendedor e regiao.
  - Auto-refresh e fallback de erro.
- Risco residual:
  - Usa a mesma visao do `gerente` (sem separacao visual/funcional por perfil).

### 2) Gerente
- Componente: `frontend-web/src/features/dashboard/DashboardPage.tsx`
- Fonte de dados: `useDashboard` -> `GET /dashboard/resumo`
- Status: `PRONTO PARA MVP`
- Pontos fortes:
  - Visao consolidada de equipe e indicadores comerciais.
  - Alertas inteligentes integrados.
- Risco residual:
  - Igual ao `administrador`, sem diferenciação de componentes.

### 3) Vendedor
- Componentes:
  - `frontend-web/src/features/dashboard/VendedorDashboard.tsx`
  - `frontend-web/src/hooks/useVendedorDashboard.ts`
- Fontes de dados reais:
  - `GET /dashboard/resumo`
  - `GET /eventos?startDate&endDate` (primario, user-scoped)
  - `GET /agenda-eventos` (fallback de contingencia)
  - `GET /leads` (com `responsavel_id`)
  - `GET /propostas` (fallback para dados do resumo se indisponivel)
- Status: `PRONTO PARA MVP`
- Entregue nesta etapa:
  - Remocao dos blocos hardcoded de propostas, agenda e leads.
  - Renderizacao dinamica de alertas, performance e cards comerciais.
  - Agenda prioriza endpoint user-scoped para reduzir risco de escopo.
- Risco residual:
  - Fallback `agenda-eventos` permanece empresa-scoped, usado apenas se `/eventos` falhar.

### 4) Operacional
- Componentes:
  - `frontend-web/src/features/dashboard/OperacionalDashboard.tsx`
  - `frontend-web/src/features/dashboard/AtendimentoRoleDashboard.tsx`
- Fonte de dados: `/api/atendimento/analytics/*`
- Status: `PRONTO PARA MVP`
- Entregue nesta etapa:
  - Dashboard operacional dedicado com KPIs de volume, resolucao e SLA.
  - Tabela de equipe e distribuicao por canal.
  - Filtro de periodo e refresh manual.

### 5) Suporte
- Componentes:
  - `frontend-web/src/features/dashboard/SuporteDashboard.tsx`
  - `frontend-web/src/features/dashboard/AtendimentoRoleDashboard.tsx`
- Fonte de dados: `/api/atendimento/analytics/*`
- Status: `PRONTO PARA MVP`
- Entregue nesta etapa:
  - Dashboard de suporte dedicado com foco em pendencias, tempo de resposta e SLA.
  - Tabela de atendentes e canais.
  - Filtro de periodo e refresh manual.

### 6) Financeiro
- Componente: `frontend-web/src/features/dashboard/FinanceiroDashboard.tsx`
- Fontes de dados reais:
  - `GET /faturamento/faturas/paginadas`
  - `GET /faturamento/pagamentos/estatisticas`
- Status: `PRONTO PARA MVP`
- Entregue nesta etapa:
  - Dashboard financeiro dedicado com KPIs de faturado, recebido, em aberto e taxa de recebimento.
  - Secoes de distribuicao por status, proximos vencimentos e metodos de pagamento.
  - Filtro de periodo (7d/30d/90d), loading/erro e refresh manual.
- Risco residual:
  - Painel ainda nao cobre previsao de fluxo de caixa e DRE (fora do escopo MVP atual).

## Validacao tecnica executada nesta etapa
- `npm --prefix frontend-web run type-check` -> OK
- `npm --prefix frontend-web run build` -> OK
- `npm --prefix backend run type-check` -> OK
- `npm --prefix backend run build` -> OK
- `.production/scripts/smoke-dashboard-role-scope.ps1` -> PASS

## Checklist final de release (dashboards por perfil)
- [x] `administrador` com dados reais e filtros ativos
- [x] `gerente` com dados reais e filtros ativos
- [x] `vendedor` sem blocos mock e com dados reais
- [x] `operacional` com dashboard dedicado de atendimento
- [x] `suporte` com dashboard dedicado de atendimento
- [x] `financeiro` com dashboard dedicado e indicadores reais

## Decisao recomendada de release
- Go para MVP: dashboards por perfil validados com dados reais e smoke de escopo aprovado.
