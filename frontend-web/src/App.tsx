import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React, { Suspense } from 'react';
import { Toaster } from 'react-hot-toast';
import { Navigate, Route, BrowserRouter as Router, Routes, useLocation } from 'react-router-dom';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { AuthProvider } from './contexts/AuthContext';
import { EmpresaProvider } from './contexts/EmpresaContextAPIReal';
import { I18nProvider } from './contexts/I18nContext';
import { MenuProvider } from './contexts/MenuContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { ProfileProvider } from './contexts/ProfileContext';
import { SidebarProvider } from './contexts/SidebarContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { WebSocketProvider } from './contexts/WebSocketContext';
import { ModuloEnum } from './services/modulosService';
import { protegerRota, protegerRotaSuperadmin } from './utils/routeGuardHelper';
// Importar páginas de núcleos
import ModuleUnderConstruction from './components/common/ModuleUnderConstruction';
// Sistema de Filas - ETAPA 5 (Núcleo Atendimento)
// Sistema de Distribuição Automática - Núcleo Atendimento
// Sistema de Templates de Mensagens - Núcleo Atendimento
// Sistema de SLA Tracking - Núcleo Atendimento
// Sistema de Fechamento Automático - Núcleo Atendimento
// Chat Omnichannel - ETAPA 2 (Evolução Chat → Omnichannel)
// ETAPA 3: Páginas Consolidadas com Abas
// Importar novas páginas do sistema de empresas
import ScrollToTop from './components/common/ScrollToTop';
import { useAuth } from './hooks/useAuth';
import { getMvpBlockedRouteInfo } from './config/mvpScope';
// ⚠️ Demandas agora são Tickets - imports removidos (apenas redirects mantidos)
// Sprint 2 - Fase 3e: Admin Console Tickets Configuráveis
// (code splitting) imports estáticos removidos

// Configuração do React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Code splitting (route-level): reduz bundle inicial carregando páginas sob demanda.
const ForgotPasswordPage = React.lazy(() => import('./features/auth/ForgotPasswordPage'));
const LoginPage = React.lazy(() => import('./features/auth/LoginPage'));
const RegistroEmpresaPage = React.lazy(() => import('./features/auth/RegistroEmpresaPage'));
const ResetPasswordPage = React.lazy(() => import('./features/auth/ResetPasswordPage'));
const VerificacaoEmailPage = React.lazy(() => import('./features/auth/VerificacaoEmailPage'));

const ClientesPage = React.lazy(() => import('./features/clientes/ClientesPage'));
const ContatosPage = React.lazy(() => import('./features/contatos/ContatosPage'));
const LeadsPage = React.lazy(() => import('./pages/LeadsPage'));
const InteracoesPage = React.lazy(() => import('./pages/InteracoesPage'));

const DashboardRouter = React.lazy(() => import('./features/dashboard/DashboardRouter'));
const NotificationsPage = React.lazy(() => import('./pages/NotificationsPage'));
const ContratosPage = React.lazy(() => import('./features/contratos/ContratosPage'));

const AdministracaoNucleusPage = React.lazy(
  () => import('./pages/nuclei/AdministracaoNucleusPage'),
);
const CrmNucleusPage = React.lazy(() => import('./pages/nuclei/CrmNucleusPage'));
const VendasNucleusPage = React.lazy(() => import('./pages/nuclei/VendasNucleusPage'));
const FinanceiroNucleusPage = React.lazy(() => import('./pages/nuclei/FinanceiroNucleusPage'));

const ConfiguracoesPage = React.lazy(() => import('./features/configuracoes/ConfiguracoesPage'));
const ConfiguracoesWrapper = React.lazy(() => import('./pages/ConfiguracoesWrapper'));
const GestaoModulosPage = React.lazy(() => import('./pages/GestaoModulosPage'));
const AdminConsolePage = React.lazy(() => import('./pages/AdminConsolePage'));
const GestaoUsuariosPage = React.lazy(() => import('./features/gestao/pages/GestaoUsuariosPage'));

const AtendimentoDashboard = React.lazy(
  () => import('./features/atendimento/pages/AtendimentoDashboard'),
);
const InboxAtendimentoPage = React.lazy(() => import('./pages/InboxAtendimentoPage'));
const AutomacoesPage = React.lazy(() => import('./pages/AutomacoesPage'));
const EquipePage = React.lazy(() => import('./pages/EquipePage'));
const FluxoBuilderPage = React.lazy(() => import('./features/atendimento/pages/FluxoBuilderPage'));
const ConfiguracaoDistribuicaoPage = React.lazy(
  () => import('./pages/ConfiguracaoDistribuicaoPage'),
);
const DashboardDistribuicaoPage = React.lazy(() => import('./pages/DashboardDistribuicaoPage'));
const GestaoSkillsPage = React.lazy(() => import('./pages/GestaoSkillsPage'));
const ConfiguracaoSLAPage = React.lazy(() => import('./pages/ConfiguracaoSLAPage'));
const DashboardAnalyticsPage = React.lazy(() => import('./pages/DashboardAnalyticsPage'));
const FechamentoAutomaticoPage = React.lazy(() => import('./pages/FechamentoAutomaticoPage'));
const GestaoTicketsPage = React.lazy(() => import('./pages/GestaoTicketsPage'));
const TicketCreatePage = React.lazy(() => import('./pages/TicketCreatePage'));
const TicketDetailPage = React.lazy(() => import('./pages/TicketDetailPage'));
const GestaoNiveisAtendimentoPage = React.lazy(() => import('./pages/GestaoNiveisAtendimentoPage'));
const GestaoTiposServicoPage = React.lazy(() => import('./pages/GestaoTiposServicoPage'));

const PipelinePage = React.lazy(() => import('./pages/PipelinePage'));
const PropostasPage = React.lazy(() => import('./features/propostas/PropostasPage'));
const CotacaoPage = React.lazy(() => import('./features/comercial/pages/CotacaoPage'));
const MinhasAprovacoesPage = React.lazy(
  () => import('./features/comercial/pages/MinhasAprovacoesPage'),
);
const ProdutosPage = React.lazy(() => import('./features/produtos/ProdutosPage'));
const CategoriasProdutosPage = React.lazy(
  () => import('./features/produtos/CategoriasProdutosPage'),
);
const CombosPage = React.lazy(() => import('./features/combos/CombosPage'));
const NovoComboPage = React.lazy(() => import('./features/combos/NovoComboPage'));

const FinanceiroPage = React.lazy(() => import('./features/financeiro/FinanceiroPage'));
const ContasReceberPage = React.lazy(() => import('./features/financeiro/ContasReceberPage'));
const ContasPagarPage = React.lazy(() => import('./pages/gestao/financeiro/ContasPagarPage'));
const FluxoCaixaPage = React.lazy(() => import('./pages/financeiro/FluxoCaixa'));
const FornecedoresPage = React.lazy(
  () => import('./features/financeiro/fornecedores/FornecedoresPage'),
);

const PerfilPage = React.lazy(() => import('./features/perfil/PerfilPage'));
const PortalClientePage = React.lazy(() => import('./pages/PortalClientePage'));
const FaturamentoPage = React.lazy(() => import('./pages/faturamento/FaturamentoPage'));
const TrocarSenhaPage = React.lazy(() => import('./pages/TrocarSenhaPage'));

const DashboardLayout = React.lazy(() => import('./components/layout/DashboardLayout'));

const PortalRoutes = React.lazy(() => import('./routes/PortalRoutes'));

const CaptureLeadPage = React.lazy(() => import('./pages/CaptureLeadPage'));

const ExemploModalProduto = React.lazy(() =>
  import('./examples/ExemploModalProduto').then((m) => ({ default: m.ExemploModalProduto })),
);

const DepartamentosPage = React.lazy(() => import('./features/gestao/pages/DepartamentosPage'));

const ConfigurarCanalEmail = React.lazy(() => import('./pages/ConfigurarCanalEmail'));

const GestaoStatusCustomizadosPage = React.lazy(
  () => import('./pages/GestaoStatusCustomizadosPage'),
);

const AgendaPage = React.lazy(() =>
  import('./features/agenda/AgendaPage').then((m) => ({ default: m.AgendaPage })),
);

const EmpresasListPage = React.lazy(() =>
  import('./features/admin/empresas/EmpresasListPage').then((m) => ({
    default: m.EmpresasListPage,
  })),
);
const EmpresaDetailPage = React.lazy(() =>
  import('./features/admin/empresas/EmpresaDetailPage').then((m) => ({
    default: m.EmpresaDetailPage,
  })),
);
const MinhasEmpresasPage = React.lazy(() =>
  import('./features/empresas/MinhasEmpresasPage').then((m) => ({ default: m.MinhasEmpresasPage })),
);

const BillingPage = React.lazy(() =>
  import('./pages/billing').then((m) => ({ default: m.BillingPage })),
);

const IntegracoesPage = React.lazy(() => import('./pages/configuracoes/IntegracoesPage'));
const MetasConfiguracao = React.lazy(() => import('./pages/configuracoes/MetasConfiguracao'));

const ConfiguracaoEmpresaPage = React.lazy(
  () => import('./pages/empresas/ConfiguracaoEmpresaPage'),
);
const RelatoriosAnalyticsPage = React.lazy(() =>
  import('./pages/empresas/RelatoriosAnalyticsPage').then((m) => ({
    default: m.RelatoriosAnalyticsPage,
  })),
);
const SistemaPermissoesPage = React.lazy(() =>
  import('./pages/empresas/SistemaPermissoesPage').then((m) => ({
    default: m.SistemaPermissoesPage,
  })),
);
const BackupSincronizacaoPage = React.lazy(() =>
  import('./pages/empresas/BackupSincronizacaoPage').then((m) => ({
    default: m.BackupSincronizacaoPage,
  })),
);

// Componente principal de rotas
const AppRoutes: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  // Exibir loading durante verificação inicial de autenticação
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-xl shadow-lg text-center max-w-md w-full mx-4">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-2xl shadow-lg mx-auto mb-4">
            C
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Conect CRM</h2>
          <p className="text-gray-600 mb-6">Carregando aplicação...</p>

          {/* Loading spinner */}
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    const blockedRouteInfo = getMvpBlockedRouteInfo(location.pathname);
    if (blockedRouteInfo) {
      return (
        <DashboardLayout>
          <ModuleUnderConstruction
            moduleName={blockedRouteInfo.moduleName}
            description={blockedRouteInfo.description}
            estimatedCompletion={blockedRouteInfo.estimatedCompletion}
            features={blockedRouteInfo.features}
          />
        </DashboardLayout>
      );
    }

    return (
      <>
        {/* Rotas Fullscreen (sem DashboardLayout) */}
        <Routes>
          {/* Nova Inbox - Tela cheia estilo Zendesk/Intercom */}
          <Route
            path="/atendimento/inbox"
            element={protegerRota(ModuloEnum.ATENDIMENTO, <InboxAtendimentoPage />)}
          />

          {/* Redirect: Chat antigo → Nova Inbox */}
          <Route path="/atendimento/chat" element={<Navigate to="/atendimento/inbox" replace />} />

          {/* Todas as outras rotas renderizam dentro do DashboardLayout */}
          <Route
            path="*"
            element={
              <DashboardLayout>
                <Routes>
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
                  <Route path="/dashboard" element={<DashboardRouter />} />
                  {/* Página de Notificações */}
                  <Route path="/notifications" element={<NotificationsPage />} />
                  {/* Página de Contratos */}
                  <Route path="/contratos/:id" element={<ContratosPage />} />
                  {/* Rotas das páginas de núcleos - Protegidas por licença */}
                  <Route
                    path="/nuclei/crm"
                    element={protegerRota(ModuloEnum.CRM, <CrmNucleusPage />)}
                  />
                  <Route
                    path="/nuclei/vendas"
                    element={protegerRota(ModuloEnum.VENDAS, <VendasNucleusPage />)}
                  />
                  <Route
                    path="/nuclei/financeiro"
                    element={protegerRota(ModuloEnum.FINANCEIRO, <FinanceiroNucleusPage />)}
                  />
                  <Route path="/nuclei/comercial" element={<Navigate to="/nuclei/crm" replace />} />
                  <Route
                    path="/nuclei/configuracoes"
                    element={<Navigate to="/configuracoes" replace />}
                  />{' '}
                  {/* Configurações: base platform */}
                  <Route
                    path="/nuclei/administracao"
                    element={protegerRotaSuperadmin(<AdministracaoNucleusPage />)}
                  />
                  {/* Rotas administrativas do sistema - Protegidas */}
                  <Route
                    path="/admin/empresas"
                    element={protegerRotaSuperadmin(<EmpresasListPage />)}
                  />
                  <Route
                    path="/admin/empresas/:id"
                    element={protegerRotaSuperadmin(<EmpresaDetailPage />)}
                  />
                  <Route
                    path="/admin/empresas/:empresaId/modulos"
                    element={protegerRotaSuperadmin(<GestaoModulosPage />)}
                  />
                  <Route
                    path="/admin/console"
                    element={protegerRotaSuperadmin(<AdminConsolePage />)}
                  />
                  <Route
                    path="/admin/usuarios"
                    element={<Navigate to="/configuracoes/usuarios" replace />}
                  />
                  <Route path="/admin/sistema" element={<Navigate to="/configuracoes" replace />} />
                  {/* ⭐ NOVA ROTA: Configurações de Atendimento com Abas (com redirects automáticos) */}
                  <Route
                    path="/atendimento/configuracoes"
                    element={protegerRota(ModuloEnum.ATENDIMENTO, <ConfiguracoesWrapper />)}
                  />
                  {/* 🔄 REDIRECTS: Rotas antigas redirecionam para abas específicas */}
                  <Route
                    path="/gestao/nucleos"
                    element={<Navigate to="/atendimento/configuracoes?tab=nucleos" replace />}
                  />
                  <Route
                    path="/gestao/equipes"
                    element={<Navigate to="/atendimento/configuracoes?tab=equipes" replace />}
                  />
                  <Route
                    path="/gestao/atendentes"
                    element={<Navigate to="/atendimento/configuracoes?tab=atendentes" replace />}
                  />
                  <Route
                    path="/gestao/tags"
                    element={<Navigate to="/atendimento/configuracoes?tab=tags" replace />}
                  />
                  {/* ❌ REMOVIDO: Apenas Atribuições descontinuadas (absorvidas por Distribuição) */}
                  <Route
                    path="/gestao/atribuicoes"
                    element={<Navigate to="/atendimento/distribuicao" replace />}
                  />
                  {/* ⚠️ REDIRECT ANTIGO: Departamentos permanecem ativos em /nuclei/configuracoes/departamentos */}
                  <Route
                    path="/gestao/departamentos"
                    element={<Navigate to="/configuracoes/departamentos" replace />}
                  />
                  {/* ✅ Fluxos consolidados em Automações > Bot (mantém rotas builder separadas) */}
                  <Route
                    path="/gestao/fluxos"
                    element={<Navigate to="/atendimento/automacoes?tab=bot" replace />}
                  />
                  <Route
                    path="/gestao/fluxos/:id/builder"
                    element={protegerRota(ModuloEnum.ATENDIMENTO, <FluxoBuilderPage />)}
                  />
                  <Route
                    path="/gestao/fluxos/novo/builder"
                    element={protegerRota(ModuloEnum.ATENDIMENTO, <FluxoBuilderPage />)}
                  />
                  {/* Rotas do módulo de Administração */}
                  <Route
                    path="/admin/relatorios"
                    element={protegerRotaSuperadmin(
                      <ModuleUnderConstruction
                        moduleName="Relatórios Avançados"
                        description="Analytics empresarial, dashboards executivos e KPIs estratégicos"
                        estimatedCompletion="Q2 2025"
                        features={[
                          'Dashboards executivos',
                          'KPIs estratégicos',
                          'Analytics de vendas',
                          'Relatórios customizados',
                          'Exportação avançada',
                        ]}
                      />,
                    )}
                  />
                  <Route
                    path="/admin/auditoria"
                    element={protegerRotaSuperadmin(
                      <ModuleUnderConstruction
                        moduleName="Auditoria & Logs"
                        description="Rastreamento de ações, logs de sistema e conformidade"
                        estimatedCompletion="Q3 2025"
                        features={[
                          'Log de atividades',
                          'Auditoria de acessos',
                          'Histórico de alterações',
                          'Relatórios de conformidade',
                          'Monitoramento em tempo real',
                        ]}
                      />,
                    )}
                  />
                  <Route
                    path="/admin/monitoramento"
                    element={protegerRotaSuperadmin(
                      <ModuleUnderConstruction
                        moduleName="Monitoramento de Sistema"
                        description="Status do sistema, performance e alertas de infraestrutura"
                        estimatedCompletion="Q3 2025"
                        features={[
                          'Monitor de performance',
                          'Alertas em tempo real',
                          'Status de serviços',
                          'Métricas de uso',
                          'Dashboard de infraestrutura',
                        ]}
                      />,
                    )}
                  />
                  <Route
                    path="/admin/analytics"
                    element={protegerRotaSuperadmin(
                      <ModuleUnderConstruction
                        moduleName="Dados & Analytics"
                        description="Análise de dados, métricas de uso e inteligência de negócios"
                        estimatedCompletion="Q4 2025"
                        features={[
                          'Análise de dados',
                          'Métricas de uso',
                          'Business Intelligence',
                          'Dashboards interativos',
                          'Relatórios estatísticos',
                        ]}
                      />,
                    )}
                  />
                  <Route
                    path="/admin/conformidade"
                    element={protegerRotaSuperadmin(
                      <ModuleUnderConstruction
                        moduleName="Políticas & Conformidade"
                        description="Gestão de políticas internas, LGPD e compliance regulatório"
                        estimatedCompletion="Q4 2025"
                        features={[
                          'Gestão de políticas',
                          'Compliance LGPD',
                          'Controle de consentimento',
                          'Auditoria de conformidade',
                          'Relatórios regulatórios',
                        ]}
                      />,
                    )}
                  />
                  <Route
                    path="/admin/acesso"
                    element={protegerRotaSuperadmin(
                      <ModuleUnderConstruction
                        moduleName="Controle de Acesso"
                        description="Configuração de roles, permissões e políticas de segurança avançadas"
                        estimatedCompletion="Q2 2025"
                        features={[
                          'Gestão de roles',
                          'Permissões granulares',
                          'Políticas de segurança',
                          'Autenticação 2FA',
                          'Controle de sessões',
                        ]}
                      />,
                    )}
                  />
                  {/* Gerenciamento de Empresas do Usuário */}
                  <Route path="/empresas/minhas" element={<MinhasEmpresasPage />} />
                  <Route
                    path="/empresas/:empresaId/configuracoes"
                    element={<ConfiguracaoEmpresaPage />}
                  />
                  <Route
                    path="/empresas/:empresaId/relatorios"
                    element={<RelatoriosAnalyticsPage />}
                  />
                  <Route
                    path="/empresas/:empresaId/permissoes"
                    element={<SistemaPermissoesPage />}
                  />
                  <Route path="/empresas/:empresaId/backup" element={<BackupSincronizacaoPage />} />
                  {/* Configurações globais da empresa ativa - Padrão consolidado */}
                  <Route path="/configuracoes/usuarios" element={<GestaoUsuariosPage />} />
                  <Route path="/configuracoes/empresa" element={<ConfiguracaoEmpresaPage />} />
                  <Route
                    path="/configuracoes/email"
                    element={<Navigate to="/configuracoes/empresa" replace />}
                  />
                  <Route path="/configuracoes/metas" element={<MetasConfiguracao />} />
                  <Route path="/configuracoes/integracoes" element={<IntegracoesPage />} />
                  <Route path="/configuracoes/departamentos" element={<DepartamentosPage />} />
                  <Route
                    path="/configuracoes/sistema"
                    element={<Navigate to="/configuracoes" replace />}
                  />
                  <Route
                    path="/configuracoes/seguranca"
                    element={<Navigate to="/configuracoes" replace />}
                  />
                  {/* ROTAS DO NÚCLEO ATENDIMENTO */}
                  <Route
                    path="/nuclei/atendimento/canais/email"
                    element={<ConfigurarCanalEmail />}
                  />
                  {/* SLA Tracking */}
                  <Route
                    path="/nuclei/atendimento/sla/configuracoes"
                    element={<ConfiguracaoSLAPage />}
                  />
                  {/* Distribuição Automática */}
                  <Route
                    path="/nuclei/atendimento/distribuicao/configuracao"
                    element={<ConfiguracaoDistribuicaoPage />}
                  />
                  <Route
                    path="/nuclei/atendimento/distribuicao/skills"
                    element={<GestaoSkillsPage />}
                  />
                  {/* Sprint 2 - Fase 6: Gestão Unificada de Tickets (substitui Demandas) */}
                  <Route
                    path="/atendimento/tickets"
                    element={protegerRota(ModuloEnum.ATENDIMENTO, <GestaoTicketsPage />)}
                  />
                  <Route
                    path="/atendimento/tickets/novo"
                    element={protegerRota(ModuloEnum.ATENDIMENTO, <TicketCreatePage />)}
                  />
                  {/* Sprint 2 - Fase 7: Detalhes do Ticket */}
                  <Route
                    path="/atendimento/tickets/:id"
                    element={protegerRota(ModuloEnum.ATENDIMENTO, <TicketDetailPage />)}
                  />
                  {/* ⚠️ DEPRECATED: Demandas agora são Tickets (tipo='suporte') - Redirects para compatibilidade */}
                  <Route
                    path="/nuclei/atendimento/demandas"
                    element={<Navigate to="/atendimento/tickets?tipo=suporte" replace />}
                  />
                  <Route
                    path="/nuclei/atendimento/tickets"
                    element={<Navigate to="/atendimento/tickets" replace />}
                  />
                  <Route
                    path="/nuclei/atendimento/tickets/novo"
                    element={<Navigate to="/atendimento/tickets/novo" replace />}
                  />
                  <Route
                    path="/nuclei/atendimento/demandas/:id"
                    element={<Navigate to="/atendimento/tickets/:id" replace />}
                  />
                  <Route
                    path="/demandas"
                    element={<Navigate to="/atendimento/tickets?tipo=suporte" replace />}
                  />
                  <Route
                    path="/demandas/:id"
                    element={<Navigate to="/atendimento/tickets/:id" replace />}
                  />
                  {/* Sprint 2 - Fase 3e: Admin Console para Configurações de Tickets */}
                  <Route
                    path="/configuracoes/tickets/niveis"
                    element={protegerRota(ModuloEnum.ATENDIMENTO, <GestaoNiveisAtendimentoPage />)}
                  />
                  <Route
                    path="/configuracoes/tickets/status"
                    element={protegerRota(ModuloEnum.ATENDIMENTO, <GestaoStatusCustomizadosPage />)}
                  />
                  <Route
                    path="/configuracoes/tickets/tipos"
                    element={protegerRota(ModuloEnum.ATENDIMENTO, <GestaoTiposServicoPage />)}
                  />
                  <Route
                    path="/configuracoes/tickets"
                    element={<Navigate to="/configuracoes/tickets/niveis" replace />}
                  />
                  <Route
                    path="/configuracoes/tickets/*"
                    element={<Navigate to="/configuracoes/tickets/niveis" replace />}
                  />
                  {/* Rotas legadas - Redirects para compatibilidade */}
                  <Route
                    path="/gestao/empresas"
                    element={<Navigate to="/admin/empresas" replace />}
                  />{' '}
                  {/* Redirect para gestão admin */}
                  <Route
                    path="/nuclei/configuracoes/empresas"
                    element={<Navigate to="/configuracoes/empresa" replace />}
                  />
                  <Route
                    path="/gestao/usuarios"
                    element={<Navigate to="/configuracoes/usuarios" replace />}
                  />
                  <Route
                    path="/nuclei/configuracoes/usuarios"
                    element={<Navigate to="/configuracoes/usuarios" replace />}
                  />
                  <Route
                    path="/nuclei/configuracoes/empresa"
                    element={<Navigate to="/configuracoes/empresa" replace />}
                  />
                  <Route
                    path="/nuclei/configuracoes/email"
                    element={<Navigate to="/configuracoes/empresa" replace />}
                  />
                  <Route
                    path="/nuclei/configuracoes/metas"
                    element={<Navigate to="/configuracoes/metas" replace />}
                  />
                  <Route
                    path="/nuclei/configuracoes/integracoes"
                    element={<Navigate to="/configuracoes/integracoes" replace />}
                  />
                  <Route
                    path="/nuclei/configuracoes/departamentos"
                    element={<Navigate to="/configuracoes/departamentos" replace />}
                  />
                  <Route
                    path="/nuclei/configuracoes/tickets/niveis"
                    element={<Navigate to="/configuracoes/tickets/niveis" replace />}
                  />
                  <Route
                    path="/nuclei/configuracoes/tickets/status"
                    element={<Navigate to="/configuracoes/tickets/status" replace />}
                  />
                  <Route
                    path="/nuclei/configuracoes/tickets/tipos"
                    element={<Navigate to="/configuracoes/tickets/tipos" replace />}
                  />
                  <Route path="/relatorios/analytics" element={<RelatoriosAnalyticsPage />} />
                  <Route path="/gestao/permissoes" element={<SistemaPermissoesPage />} />
                  <Route path="/sistema/backup" element={<BackupSincronizacaoPage />} />
                  {/* Atendimento Omnichannel - Protegido */}
                  <Route
                    path="/atendimento"
                    element={protegerRota(ModuloEnum.ATENDIMENTO, <AtendimentoDashboard />)}
                  />
                  {/* ETAPA 3: Páginas Consolidadas */}
                  <Route
                    path="/atendimento/automacoes"
                    element={protegerRota(ModuloEnum.ATENDIMENTO, <AutomacoesPage />)}
                  />
                  <Route
                    path="/atendimento/equipe"
                    element={protegerRota(ModuloEnum.ATENDIMENTO, <EquipePage />)}
                  />
                  <Route
                    path="/atendimento/distribuicao"
                    element={protegerRota(ModuloEnum.ATENDIMENTO, <ConfiguracaoDistribuicaoPage />)}
                  />
                  <Route
                    path="/atendimento/distribuicao/dashboard"
                    element={protegerRota(ModuloEnum.ATENDIMENTO, <DashboardDistribuicaoPage />)}
                  />
                  <Route
                    path="/atendimento/fechamento-automatico"
                    element={protegerRota(ModuloEnum.ATENDIMENTO, <FechamentoAutomaticoPage />)}
                  />
                  {/* Dashboard Analytics (nova URL) */}
                  <Route
                    path="/atendimento/analytics"
                    element={protegerRota(ModuloEnum.ATENDIMENTO, <DashboardAnalyticsPage />)}
                  />
                  {/* Redirects para URLs antigas (compatibilidade) */}
                  <Route
                    path="/atendimento/dashboard-analytics"
                    element={<Navigate to="/atendimento/analytics" replace />}
                  />
                  <Route
                    path="/nuclei/atendimento/sla/dashboard"
                    element={<Navigate to="/atendimento/analytics?tab=sla" replace />}
                  />
                  <Route
                    path="/nuclei/atendimento/distribuicao/dashboard"
                    element={<Navigate to="/atendimento/analytics?tab=distribuicao" replace />}
                  />
                  {/* ETAPA 3: Redirects para páginas consolidadas */}
                  <Route
                    path="/nuclei/atendimento/templates"
                    element={<Navigate to="/atendimento/automacoes?tab=templates" replace />}
                  />
                  <Route
                    path="/atendimento/bot"
                    element={<Navigate to="/atendimento/automacoes?tab=bot" replace />}
                  />
                  <Route
                    path="/atendimento/regras"
                    element={<Navigate to="/atendimento/automacoes?tab=regras" replace />}
                  />
                  <Route
                    path="/nuclei/atendimento/filas"
                    element={<Navigate to="/atendimento/equipe?tab=filas" replace />}
                  />
                  <Route
                    path="/nuclei/atendimento/atendentes"
                    element={<Navigate to="/atendimento/equipe?tab=atendentes" replace />}
                  />
                  <Route
                    path="/nuclei/atendimento/skills"
                    element={<Navigate to="/atendimento/equipe?tab=skills" replace />}
                  />
                  {/* Perfil do Usuário */}
                  <Route path="/perfil" element={<PerfilPage />} />
                  {/* Sistema de Billing e Assinaturas - Protegido */}
                  <Route
                    path="/billing"
                    element={protegerRota(ModuloEnum.BILLING, <BillingPage />)}
                  />
                  <Route
                    path="/billing/assinaturas"
                    element={protegerRota(ModuloEnum.BILLING, <BillingPage />)}
                  />
                  <Route
                    path="/billing/planos"
                    element={protegerRota(ModuloEnum.BILLING, <BillingPage />)}
                  />
                  <Route
                    path="/billing/faturas"
                    element={protegerRota(ModuloEnum.BILLING, <BillingPage />)}
                  />
                  <Route
                    path="/billing/pagamentos"
                    element={protegerRota(ModuloEnum.BILLING, <BillingPage />)}
                  />
                  <Route
                    path="/assinaturas"
                    element={protegerRota(ModuloEnum.BILLING, <BillingPage />)}
                  />
                  {/* Sistema de Faturamento - Protegido */}
                  <Route
                    path="/faturamento"
                    element={protegerRota(ModuloEnum.BILLING, <FaturamentoPage />)}
                  />
                  {/* Exemplo Modal Produto */}
                  <Route path="/exemplo-produto" element={<ExemploModalProduto />} />
                  {/* Rotas dos módulos existentes - Protegidas */}
                  <Route path="/leads" element={protegerRota(ModuloEnum.CRM, <LeadsPage />)} />
                  <Route
                    path="/clientes"
                    element={protegerRota(ModuloEnum.CRM, <ClientesPage />)}
                  />
                  <Route
                    path="/contatos"
                    element={protegerRota(ModuloEnum.CRM, <ContatosPage />)}
                  />
                  <Route
                    path="/interacoes"
                    element={protegerRota(ModuloEnum.CRM, <InteracoesPage />)}
                  />
                  <Route
                    path="/pipeline"
                    element={protegerRota(ModuloEnum.CRM, <PipelinePage />)}
                  />
                  {/* Redirects - Consolidação de telas */}
                  <Route path="/funil-vendas" element={<Navigate to="/pipeline" replace />} />
                  <Route path="/oportunidades" element={<Navigate to="/pipeline" replace />} />
                  <Route
                    path="/propostas"
                    element={protegerRota(ModuloEnum.VENDAS, <PropostasPage />)}
                  />
                  <Route
                    path="/vendas/propostas"
                    element={protegerRota(ModuloEnum.VENDAS, <PropostasPage />)}
                  />
                  <Route
                    path="/cotacoes"
                    element={protegerRota(ModuloEnum.VENDAS, <CotacaoPage />)}
                  />
                  <Route
                    path="/vendas/cotacoes"
                    element={protegerRota(ModuloEnum.VENDAS, <CotacaoPage />)}
                  />
                  <Route
                    path="/orcamentos"
                    element={protegerRota(ModuloEnum.VENDAS, <CotacaoPage />)}
                  />
                  <Route
                    path="/aprovacoes/pendentes"
                    element={protegerRota(ModuloEnum.VENDAS, <MinhasAprovacoesPage />)}
                  />
                  <Route
                    path="/vendas/aprovacoes"
                    element={protegerRota(ModuloEnum.VENDAS, <MinhasAprovacoesPage />)}
                  />
                  <Route
                    path="/produtos"
                    element={protegerRota(ModuloEnum.VENDAS, <ProdutosPage />)}
                  />
                  <Route
                    path="/vendas/produtos"
                    element={protegerRota(ModuloEnum.VENDAS, <ProdutosPage />)}
                  />
                  <Route
                    path="/produtos/categorias"
                    element={protegerRota(ModuloEnum.VENDAS, <CategoriasProdutosPage />)}
                  />
                  {/* Rotas dos Combos - Protegidas */}
                  <Route path="/combos" element={protegerRota(ModuloEnum.VENDAS, <CombosPage />)} />
                  <Route
                    path="/vendas/combos"
                    element={protegerRota(ModuloEnum.VENDAS, <CombosPage />)}
                  />
                  <Route
                    path="/combos/novo"
                    element={protegerRota(ModuloEnum.VENDAS, <NovoComboPage />)}
                  />
                  <Route
                    path="/vendas/combos/novo"
                    element={protegerRota(ModuloEnum.VENDAS, <NovoComboPage />)}
                  />
                  <Route
                    path="/combos/:id/editar"
                    element={protegerRota(ModuloEnum.VENDAS, <NovoComboPage />)}
                  />
                  <Route
                    path="/vendas/combos/:id/editar"
                    element={protegerRota(ModuloEnum.VENDAS, <NovoComboPage />)}
                  />
                  <Route path="/agenda" element={protegerRota(ModuloEnum.CRM, <AgendaPage />)} />
                  <Route
                    path="/crm/agenda"
                    element={protegerRota(ModuloEnum.CRM, <AgendaPage />)}
                  />
                  <Route
                    path="/crm/clientes"
                    element={protegerRota(ModuloEnum.CRM, <ClientesPage />)}
                  />
                  <Route
                    path="/crm/contatos"
                    element={protegerRota(ModuloEnum.CRM, <ContatosPage />)}
                  />
                  <Route path="/crm/leads" element={protegerRota(ModuloEnum.CRM, <LeadsPage />)} />
                  <Route
                    path="/crm/interacoes"
                    element={protegerRota(ModuloEnum.CRM, <InteracoesPage />)}
                  />
                  <Route
                    path="/crm/pipeline"
                    element={protegerRota(ModuloEnum.CRM, <PipelinePage />)}
                  />
                  {/* Portal do Cliente - Gestão */}
                  <Route path="/portal" element={<PortalClientePage />} />
                  {/* Rotas do Núcleo Financeiro - Protegidas */}
                  <Route
                    path="/financeiro"
                    element={protegerRota(ModuloEnum.FINANCEIRO, <FinanceiroPage />)}
                  />
                  <Route
                    path="/financeiro/contas-receber"
                    element={protegerRota(ModuloEnum.FINANCEIRO, <ContasReceberPage />)}
                  />
                  <Route
                    path="/financeiro/contas-pagar"
                    element={protegerRota(ModuloEnum.FINANCEIRO, <ContasPagarPage />)}
                  />
                  <Route
                    path="/financeiro/fluxo-caixa"
                    element={protegerRota(ModuloEnum.FINANCEIRO, <FluxoCaixaPage />)}
                  />
                  <Route
                    path="/financeiro/fornecedores"
                    element={protegerRota(ModuloEnum.FINANCEIRO, <FornecedoresPage />)}
                  />
                  {/* Módulos financeiros - Protegidos */}
                  <Route
                    path="/financeiro/faturamento"
                    element={protegerRota(ModuloEnum.BILLING, <FaturamentoPage />)}
                  />
                  <Route
                    path="/financeiro/relatorios"
                    element={
                      <ModuleUnderConstruction
                        moduleName="Relatórios Financeiros"
                        description="Análises e indicadores financeiros avançados"
                        estimatedCompletion="Q2 2025"
                        features={[
                          'DRE (Demonstração do Resultado)',
                          'Balanço patrimonial',
                          'Análise de indicadores',
                          'Gráficos interativos',
                          'Exportação em múltiplos formatos',
                        ]}
                      />
                    }
                  />
                  <Route
                    path="/financeiro/conciliacao"
                    element={
                      <ModuleUnderConstruction
                        moduleName="Conciliação Bancária"
                        description="Conciliação automática de extratos bancários"
                        estimatedCompletion="Q2 2025"
                        features={[
                          'Importação de extratos OFX/CSV',
                          'Conciliação automática',
                          'Lançamentos pendentes',
                          'Reconciliação manual',
                          'Múltiplas contas bancárias',
                        ]}
                      />
                    }
                  />
                  <Route
                    path="/financeiro/centro-custos"
                    element={
                      <ModuleUnderConstruction
                        moduleName="Centro de Custos"
                        description="Organização e controle detalhado de custos"
                        estimatedCompletion="Q1 2025"
                        features={[
                          'Hierarquia de centros de custo',
                          'Rateio automático',
                          'Análise de custos',
                          'Orçamento vs realizado',
                          'Relatórios por centro',
                        ]}
                      />
                    }
                  />
                  <Route
                    path="/financeiro/tesouraria"
                    element={
                      <ModuleUnderConstruction
                        moduleName="Tesouraria"
                        description="Gestão avançada de caixa e investimentos"
                        estimatedCompletion="Q3 2025"
                        features={[
                          'Gestão de múltiplas contas',
                          'Aplicações financeiras',
                          'Projeção de fluxo de caixa',
                          'Controle de cheques',
                          'Dashboard executivo',
                        ]}
                      />
                    }
                  />
                  <Route path="/configuracoes" element={<ConfiguracoesPage />} />
                  <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Routes>
              </DashboardLayout>
            }
          />
        </Routes>
      </>
    );
  }

  return (
    <Routes>
      {/* Rotas públicas do portal do cliente */}
      <Route path="/portal/*" element={<PortalRoutes />} />
      {/* Rota legada: configuração de e-mail (local) foi consolidada em Configurações > Empresa */}
      <Route
        path="/configuracao-email"
        element={<Navigate to="/configuracoes/empresa" replace />}
      />
      {/* Formulário público de captura de leads */}
      <Route path="/capturar-lead" element={<CaptureLeadPage />} />
      {/* Rotas de autenticação */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/registro" element={<RegistroEmpresaPage />} />
      <Route path="/verificar-email" element={<VerificacaoEmailPage />} />
      <Route path="/esqueci-minha-senha" element={<ForgotPasswordPage />} />
      <Route path="/recuperar-senha" element={<ResetPasswordPage />} />
      <Route path="/trocar-senha" element={<TrocarSenhaPage />} />{' '}
      {/* ✅ Troca de senha (primeiro acesso) */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <I18nProvider>
        <ThemeProvider>
          <AuthProvider>
            <ProfileProvider>
              <NotificationProvider>
                <EmpresaProvider>
                  <WebSocketProvider>
                    <ErrorBoundary>
                      <SidebarProvider>
                        <MenuProvider>
                          {/* SocketProvider temporariamente desabilitado - usando useWebSocket do chat */}
                          {/* <SocketProvider> */}
                          <Router
                            future={{
                              v7_startTransition: true,
                              v7_relativeSplatPath: true,
                            }}
                          >
                            <ScrollToTop />
                            <div className="App">
                              <Suspense
                                fallback={
                                  <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                                    <div className="bg-white p-6 rounded-xl shadow-lg text-center max-w-md w-full mx-4">
                                      <p className="text-gray-600">Carregando...</p>
                                    </div>
                                  </div>
                                }
                              >
                                <AppRoutes />
                              </Suspense>

                              {/* Toast Notifications */}
                              <Toaster position="top-right" />
                            </div>
                          </Router>
                          {/* </SocketProvider> */}
                        </MenuProvider>
                      </SidebarProvider>
                    </ErrorBoundary>
                  </WebSocketProvider>
                </EmpresaProvider>
              </NotificationProvider>
            </ProfileProvider>
          </AuthProvider>
        </ThemeProvider>
      </I18nProvider>
    </QueryClientProvider>
  );
};

export default App;
