# USED_UI_INVENTORY

## Fase A - grafo em uso (somente runtime ativo)
- Fonte principal: configuracao real de rotas + traversal de imports a partir das paginas roteadas (com exclusao de redirects e ModuleUnderConstruction).
- Rotas ativas auditaveis: 47.
- Arquivos raiz de rota: 45.
- Arquivos TSX alcancaveis por import traversal: 150.
- Fora de escopo (nao auditado): 500 orfaos suspeitos.

## Rota -> Pagina -> Componentes principais

| Rota | Pagina raiz | Arquivo | Componentes principais em uso |
| --- | --- | --- | --- |
| /:propostaNumero/:token | PortalClienteProposta | frontend-web/src/features/portal/PortalClienteProposta.tsx | PortalClienteProposta, StatusSyncIndicator |
| /admin/console | AdminConsolePage | frontend-web/src/pages/AdminConsolePage.tsx | AdminConsolePage, analytics cards, managed companies table |
| /admin/empresas | EmpresasListPage | frontend-web/src/features/admin/empresas/EmpresasListPage.tsx | EmpresasListPage, EmpresaFilters, EmpresaMetrics, EmpresaCard, ModalCadastroEmpresa |
| /admin/empresas/:empresaId/modulos | GestaoModulosPage | frontend-web/src/pages/GestaoModulosPage.tsx | GestaoModulosPage |
| /admin/empresas/:id | EmpresaDetailPage | frontend-web/src/features/admin/empresas/EmpresaDetailPage.tsx | EmpresaDetailPage, detail tables/cards |
| /atendimento | AtendimentoDashboard | frontend-web/src/features/atendimento/pages/AtendimentoDashboard.tsx | AtendimentoDashboard |
| /atendimento/analytics | DashboardAnalyticsPage | frontend-web/src/pages/DashboardAnalyticsPage.tsx | DashboardAnalyticsPage |
| /atendimento/automacoes | AutomacoesPage | frontend-web/src/pages/AutomacoesPage.tsx | AutomacoesPage |
| /atendimento/configuracoes | ConfiguracoesWrapper | frontend-web/src/pages/ConfiguracoesWrapper.tsx | ConfiguracoesWrapper, ConfiguracoesAtendimentoPage, CanaisTab, GeralTab, NucleosTab, TagsTab |
| /atendimento/distribuicao | ConfiguracaoDistribuicaoPage | frontend-web/src/pages/ConfiguracaoDistribuicaoPage.tsx | ConfiguracaoDistribuicaoPage |
| /atendimento/distribuicao/dashboard | DashboardDistribuicaoPage | frontend-web/src/pages/DashboardDistribuicaoPage.tsx | DashboardDistribuicaoPage |
| /atendimento/equipe | EquipePage | frontend-web/src/pages/EquipePage.tsx | EquipePage |
| /atendimento/fechamento-automatico | FechamentoAutomaticoPage | frontend-web/src/pages/FechamentoAutomaticoPage.tsx | FechamentoAutomaticoPage |
| /atendimento/inbox | InboxAtendimentoPage | frontend-web/src/pages/InboxAtendimentoPage.tsx | InboxAtendimentoPage, ChatOmnichannel, AtendimentosSidebar, ChatArea, ClientePanel, NovoAtendimentoModal, TransferenciaModal |
| /atendimento/tickets | GestaoTicketsPage | frontend-web/src/pages/GestaoTicketsPage.tsx | GestaoTicketsPage, TicketsTable, TicketFormModal, AtribuirTicketModal |
| /atendimento/tickets/:id | TicketDetailPage | frontend-web/src/pages/TicketDetailPage.tsx | TicketDetailPage, Ticket timeline/details panels |
| /atendimento/tickets/novo | TicketCreatePage | frontend-web/src/pages/TicketCreatePage.tsx | TicketCreatePage, TicketFormModal |
| /capturar-lead | CaptureLeadPage | frontend-web/src/pages/CaptureLeadPage.tsx | CaptureLeadPage |
| /configuracoes | ConfiguracoesPage | frontend-web/src/features/configuracoes/ConfiguracoesPage.tsx | ConfiguracoesPage |
| /configuracoes/empresa | ConfiguracaoEmpresaPage | frontend-web/src/pages/empresas/ConfiguracaoEmpresaPage.tsx | ConfiguracaoEmpresaPage, tabbed settings forms |
| /configuracoes/tickets/niveis | GestaoNiveisAtendimentoPage | frontend-web/src/pages/GestaoNiveisAtendimentoPage.tsx | GestaoNiveisAtendimentoPage |
| /configuracoes/tickets/status | GestaoStatusCustomizadosPage | frontend-web/src/pages/GestaoStatusCustomizadosPage.tsx | GestaoStatusCustomizadosPage |
| /configuracoes/tickets/tipos | GestaoTiposServicoPage | frontend-web/src/pages/GestaoTiposServicoPage.tsx | GestaoTiposServicoPage |
| /configuracoes/usuarios | GestaoUsuariosPage | frontend-web/src/features/gestao/pages/GestaoUsuariosPage.tsx | GestaoUsuariosPage, BackToNucleus, user CRUD dialogs, permission groups |
| /crm/leads | LeadsPage | frontend-web/src/pages/LeadsPage.tsx | LeadsPage, lead forms/import flows |
| /crm/pipeline | PipelinePage | frontend-web/src/pages/PipelinePage.tsx | PipelinePage, kanban/table pipeline views, oportunidade modals |
| /dashboard | DashboardRouter | frontend-web/src/features/dashboard/DashboardRouter.tsx | DashboardRouter, DashboardPage, AtendimentoRoleDashboard, OperacionalDashboard, SuporteDashboard, VendedorDashboard, FinanceiroDashboard |
| /empresas/:empresaId/backup | BackupSincronizacaoPage | frontend-web/src/pages/empresas/BackupSincronizacaoPage.tsx | BackupSincronizacaoPage |
| /empresas/:empresaId/configuracoes | ConfiguracaoEmpresaPage | frontend-web/src/pages/empresas/ConfiguracaoEmpresaPage.tsx | ConfiguracaoEmpresaPage, tabbed settings forms |
| /empresas/:empresaId/permissoes | SistemaPermissoesPage | frontend-web/src/pages/empresas/SistemaPermissoesPage.tsx | SistemaPermissoesPage |
| /empresas/:empresaId/relatorios | RelatoriosAnalyticsPage | frontend-web/src/pages/empresas/RelatoriosAnalyticsPage.tsx | RelatoriosAnalyticsPage |
| /empresas/minhas | MinhasEmpresasPage | frontend-web/src/features/empresas/MinhasEmpresasPage.tsx | MinhasEmpresasPage |
| /esqueci-minha-senha | ForgotPasswordPage | frontend-web/src/features/auth/ForgotPasswordPage.tsx | ForgotPasswordPage |
| /login | LoginPage | frontend-web/src/features/auth/LoginPage.tsx | LoginPage, ConectCRMLogoFinal |
| /nuclei/administracao | AdministracaoNucleusPage | frontend-web/src/pages/nuclei/AdministracaoNucleusPage.tsx | AdministracaoNucleusPage |
| /nuclei/crm | CrmNucleusPage | frontend-web/src/pages/nuclei/CrmNucleusPage.tsx | CrmNucleusPage |
| /perfil | PerfilPage | frontend-web/src/features/perfil/PerfilPage.tsx | PerfilPage |
| /portal/* | PortalRoutes | frontend-web/src/routes/PortalRoutes.tsx | PortalRoutes, PortalClienteProposta |
| /proposta/:propostaId | PortalClienteProposta | frontend-web/src/features/portal/PortalClienteProposta.tsx | PortalClienteProposta, StatusSyncIndicator |
| /proposta/:propostaNumero/:token | PortalClienteProposta | frontend-web/src/features/portal/PortalClienteProposta.tsx | PortalClienteProposta, StatusSyncIndicator |
| /recuperar-senha | ResetPasswordPage | frontend-web/src/features/auth/ResetPasswordPage.tsx | ResetPasswordPage |
| /registro | RegistroEmpresaPage | frontend-web/src/features/auth/RegistroEmpresaPage.tsx | RegistroEmpresaPage, multistep company registration form |
| /relatorios/analytics | AnalyticsPage | frontend-web/src/pages/AnalyticsPage.tsx | AnalyticsPage |
| /trocar-senha | TrocarSenhaPage | frontend-web/src/pages/TrocarSenhaPage.tsx | TrocarSenhaPage |
| /vendas/produtos | ProdutosPage | frontend-web/src/features/produtos/ProdutosPage.tsx | ProdutosPage, modal/product forms |
| /vendas/propostas | PropostasPage | frontend-web/src/features/propostas/PropostasPage.tsx | PropostasPage, DashboardPropostas, FiltrosAvancados, SelecaoMultipla, PropostaActions, ModalVisualizarProposta |
| /verificar-email | VerificacaoEmailPage | frontend-web/src/features/auth/VerificacaoEmailPage.tsx | VerificacaoEmailPage |

## Componentes compartilhados (alcancaveis)
- frontend-web/src/components/layout/DashboardLayout.tsx: layout principal das rotas autenticadas (exceto fluxo fullscreen de /atendimento/inbox e paginas publicas/portal).
- frontend-web/src/components/navigation/HierarchicalNavGroup.tsx: navegacao principal (drawer mobile e sidebar desktop) via DashboardLayout.
- frontend-web/src/components/tickets/TicketsTable.tsx: tabela de tickets usada na gestao de tickets.
- frontend-web/src/features/propostas/components/SelecaoMultipla.tsx: barra de acoes em massa em /vendas/propostas.
- frontend-web/src/features/admin/components/EmpresaCard.tsx: cards de empresas em /admin/empresas.
- frontend-web/src/components/common/BackToNucleus.tsx + frontend-web/src/components/navigation/BackToNucleus.tsx: cabecalhos de retorno em telas de configuracao/gestao.
- frontend-web/src/features/portal/components/StatusSyncIndicator.tsx: feedback de sincronizacao no portal da proposta.

## Orfaos suspeitos (nao auditados)
- Total detectado no grafo: 500.
- Amostra (somente listagem, sem auditoria):
  - src/App.tsx
  - src/__tests__/AccessibleButton.test.tsx
  - src/__tests__/KPICard.test.tsx
  - src/__tests__/ResponsiveDashboardLayout.test.tsx
  - src/__tests__/ResponsiveFilters.test.tsx
  - src/components/Billing/Admin/AdminDashboard.tsx
  - src/components/Billing/Admin/ModulosAdmin.tsx
  - src/components/Billing/Admin/PlanoFormModal.tsx
  - src/components/Billing/Admin/PlanosAdmin.tsx
  - src/components/Billing/Admin/test-imports.tsx
  - src/components/Billing/BillingDashboard.tsx
  - src/components/Billing/BillingIntegration.tsx
  - src/components/Billing/PaymentForm.tsx
  - src/components/Billing/PlanSelection.tsx
  - src/components/Billing/SubscriptionGuard.tsx
  - src/components/Billing/UpgradePrompt.tsx
  - src/components/Billing/UsageMeter.tsx
  - src/components/ConvertTicketModal.tsx
  - src/components/ErrorBoundary.tsx
  - src/components/SaveStatus.tsx
  - src/components/admin/ProfileSelector.tsx
  - src/components/admin/ProfileSelectorButton.tsx
  - src/components/admin/ProfileSelectorDropdown.tsx
  - src/components/analytics/AlertasGestao.tsx
  - src/components/analytics/AnalyticsDashboard.tsx
  - src/components/analytics/DashboardAnalytics.tsx
  - src/components/analytics/DashboardIA.tsx
  - src/components/analytics/DistribuicaoTab.tsx
  - src/components/analytics/KpisTempoReal.tsx
  - src/components/analytics/RelatoriosAvancados.tsx
  - src/components/analytics/SLATab.tsx
  - src/components/atendimento/AgentSelector.tsx
  - src/components/atendimento/ModalDepartamento.tsx
  - src/components/atendimento/ModalGerenciarAgentesNucleo.tsx
  - src/components/atendimento/ModalGerenciarDepartamentos.tsx
  - src/components/automacao/WorkflowAutomacao.tsx
  - src/components/base/BaseComponents.tsx
  - src/components/base/BaseModal.tsx
  - src/components/base/FormComponents.tsx
  - src/components/base/ModalLayouts.tsx

Observacao: qualquer item acima da secao de orfaos entrou na Fase B; os orfaos suspeitos foram explicitamente excluidos da auditoria.
