import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { I18nProvider } from './contexts/I18nContext';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { NotificationProvider } from './contexts/NotificationContext';
import { EmpresaProvider } from './contexts/EmpresaContextAPIReal';
import { ProfileProvider } from './contexts/ProfileContext';
import { SidebarProvider } from './contexts/SidebarContext';
import { MenuProvider } from './contexts/MenuContext';
import { WebSocketProvider } from './contexts/WebSocketContext';
import { protegerRota, protegerRotaSuperadmin } from './utils/routeGuardHelper';
import { ModuloEnum } from './services/modulosService';
import LoginPage from './features/auth/LoginPage';
import RegistroEmpresaPage from './features/auth/RegistroEmpresaPage';
import VerificacaoEmailPage from './features/auth/VerificacaoEmailPage';
import ForgotPasswordPage from './features/auth/ForgotPasswordPage';
import ResetPasswordPage from './features/auth/ResetPasswordPage';
import TrocarSenhaPage from './pages/TrocarSenhaPage'; // ✅ Troca de senha (primeiro acesso)
import CaptureLeadPage from './pages/CaptureLeadPage'; // ✅ Formulário público de captura
import DashboardLayout from './components/layout/DashboardLayout';
import DashboardRouter from './features/dashboard/DashboardRouter';
import ClientesPage from './features/clientes/ClientesPage';
import PropostasPage from './features/propostas/PropostasPage';
import CategoriasProdutosPage from './features/produtos/CategoriasProdutosPage';
import ProdutosPage from './features/produtos/ProdutosPage';
import FinanceiroPage from './features/financeiro/FinanceiroPage';
import ConfiguracoesPage from './features/configuracoes/ConfiguracoesPage';
import ContasReceberPage from './features/financeiro/ContasReceberPage';
import ContasPagarPage from './pages/gestao/financeiro/ContasPagarPage';
import FornecedoresPage from './features/financeiro/fornecedores/FornecedoresPage';
import ContratosPage from './features/contratos/ContratosPage';
import { AgendaPage } from './features/agenda/AgendaPage';
import { ExemploModalProduto } from './examples/ExemploModalProduto';
import CombosPage from './features/combos/CombosPage';
import NovoComboPage from './features/combos/NovoComboPage';
import NotificationsPage from './pages/NotificationsPage';
// Importar páginas de núcleos
import CrmNucleusPage from './pages/nuclei/CrmNucleusPage';
import VendasNucleusPage from './pages/nuclei/VendasNucleusPage';
import FinanceiroNucleusPage from './pages/nuclei/FinanceiroNucleusPage';
import ConfiguracoesNucleusPage from './pages/nuclei/ConfiguracoesNucleusPage';
import AdministracaoNucleusPage from './pages/nuclei/AdministracaoNucleusPage';
import ModuleUnderConstruction from './components/common/ModuleUnderConstruction';
import { EmpresasListPage } from './features/admin/empresas/EmpresasListPage';
import { EmpresaDetailPage } from './features/admin/empresas/EmpresaDetailPage';
import GestaoModulosPage from './pages/GestaoModulosPage';
import { MinhasEmpresasPage } from './features/empresas/MinhasEmpresasPage';
import ContatosPage from './features/contatos/ContatosPage';
import PerfilPage from './features/perfil/PerfilPage';
import PipelinePage from './pages/PipelinePage';
import LeadsPage from './pages/LeadsPage';
import InteracoesPage from './pages/InteracoesPage';
import AtendimentoIntegradoPage from './features/atendimento/pages/AtendimentoIntegradoPage';
import AtendimentoDashboard from './features/atendimento/pages/AtendimentoDashboard';
import FluxoBuilderPage from './features/atendimento/pages/FluxoBuilderPage';
import GestaoUsuariosPage from './features/gestao/pages/GestaoUsuariosPage';
import ConfiguracoesWrapper from './pages/ConfiguracoesWrapper';
import AdminConsolePage from './pages/AdminConsolePage';
// Sistema de Filas - ETAPA 5 (Núcleo Atendimento)
import GestaoFilasPage from './features/atendimento/pages/GestaoFilasPage';
// Sistema de Distribuição Automática - Núcleo Atendimento
import DashboardDistribuicaoPage from './pages/DashboardDistribuicaoPage';
import ConfiguracaoDistribuicaoPage from './pages/ConfiguracaoDistribuicaoPage';
import GestaoSkillsPage from './pages/GestaoSkillsPage';
// Sistema de Templates de Mensagens - Núcleo Atendimento
import GestaoTemplatesPage from './pages/GestaoTemplatesPage';
// Sistema de SLA Tracking - Núcleo Atendimento
import ConfiguracaoSLAPage from './pages/ConfiguracaoSLAPage';
import DashboardSLAPage from './pages/DashboardSLAPage';
// Sistema de Fechamento Automático - Núcleo Atendimento
import FechamentoAutomaticoPage from './pages/FechamentoAutomaticoPage';
import DashboardAnalyticsPage from './pages/DashboardAnalyticsPage';
// Chat Omnichannel - ETAPA 2 (Evolução Chat → Omnichannel)
import InboxAtendimentoPage from './pages/InboxAtendimentoPage';
// ETAPA 3: Páginas Consolidadas com Abas
import AutomacoesPage from './pages/AutomacoesPage';
import EquipePage from './pages/EquipePage';
// Importar novas páginas do sistema de empresas
import ConfiguracaoEmpresaPage from './pages/empresas/ConfiguracaoEmpresaPage';
import { RelatoriosAnalyticsPage } from './pages/empresas/RelatoriosAnalyticsPage';
import { SistemaPermissoesPage } from './pages/empresas/SistemaPermissoesPage';
import { BackupSincronizacaoPage } from './pages/empresas/BackupSincronizacaoPage';
import { useAuth } from './hooks/useAuth';
import PortalRoutes from './routes/PortalRoutes';
import MetasConfiguracao from './pages/configuracoes/MetasConfiguracao';
import IntegracoesPage from './pages/configuracoes/IntegracoesPage';
import PortalClientePage from './pages/PortalClientePage';
import ConfiguracaoEmailPage from './features/configuracoes/pages/ConfiguracaoEmailPage';
import ScrollToTop from './components/common/ScrollToTop';
import { BillingPage } from './pages/billing';
import FaturamentoPage from './pages/faturamento/FaturamentoPage';
import CotacaoPage from './features/comercial/pages/CotacaoPage';
import MinhasAprovacoesPage from './features/comercial/pages/MinhasAprovacoesPage';
import DepartamentosPage from './features/gestao/pages/DepartamentosPage';
import ConfigurarCanalEmail from './pages/ConfigurarCanalEmail';
import DemandasPage from './pages/DemandasPage';
import DemandaDetailPage from './pages/DemandaDetailPage';

// Configuração do React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Componente principal de rotas
const AppRoutes: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();

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
          <Route
            path="/atendimento/chat"
            element={<Navigate to="/atendimento/inbox" replace />}
          />

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
                  <Route path="/nuclei/crm" element={protegerRota(ModuloEnum.CRM, <CrmNucleusPage />)} />
                  <Route
                    path="/nuclei/vendas"
                    element={protegerRota(ModuloEnum.VENDAS, <VendasNucleusPage />)}
                  />
                  <Route
                    path="/nuclei/financeiro"
                    element={protegerRota(ModuloEnum.FINANCEIRO, <FinanceiroNucleusPage />)}
                  />
                  <Route path="/nuclei/configuracoes" element={<ConfiguracoesNucleusPage />} />{' '}
                  {/* Configurações: base platform */}
                  <Route
                    path="/nuclei/administracao"
                    element={protegerRotaSuperadmin(<AdministracaoNucleusPage />)}
                  />
                  {/* Rotas administrativas do sistema - Protegidas */}
                  <Route path="/admin/empresas" element={protegerRotaSuperadmin(<EmpresasListPage />)} />
                  <Route
                    path="/admin/empresas/:id"
                    element={protegerRotaSuperadmin(<EmpresaDetailPage />)}
                  />
                  <Route
                    path="/admin/empresas/:empresaId/modulos"
                    element={protegerRotaSuperadmin(<GestaoModulosPage />)}
                  />
                  <Route path="/admin/console" element={protegerRotaSuperadmin(<AdminConsolePage />)} />
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
                    element={<Navigate to="/nuclei/configuracoes/departamentos" replace />}
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
                  <Route path="/empresas/:empresaId/configuracoes" element={<ConfiguracaoEmpresaPage />} />
                  <Route path="/empresas/:empresaId/relatorios" element={<RelatoriosAnalyticsPage />} />
                  <Route path="/empresas/:empresaId/permissoes" element={<SistemaPermissoesPage />} />
                  <Route path="/empresas/:empresaId/backup" element={<BackupSincronizacaoPage />} />
                  {/* Configurações globais da empresa ativa - Padrão consolidado */}
                  <Route path="/nuclei/configuracoes/usuarios" element={<GestaoUsuariosPage />} />
                  <Route path="/nuclei/configuracoes/empresa" element={<ConfiguracaoEmpresaPage />} />
                  <Route path="/nuclei/configuracoes/email" element={<ConfiguracaoEmailPage />} />
                  <Route path="/nuclei/configuracoes/metas" element={<MetasConfiguracao />} />
                  <Route path="/nuclei/configuracoes/integracoes" element={<IntegracoesPage />} />
                  <Route path="/nuclei/configuracoes/departamentos" element={<DepartamentosPage />} />
                  {/* ROTAS DO NÚCLEO ATENDIMENTO */}
                  <Route path="/nuclei/atendimento/filas" element={<GestaoFilasPage />} />
                  <Route path="/nuclei/atendimento/templates" element={<GestaoTemplatesPage />} />
                  <Route path="/nuclei/atendimento/canais/email" element={<ConfigurarCanalEmail />} />
                  {/* SLA Tracking */}
                  <Route path="/nuclei/atendimento/sla/configuracoes" element={<ConfiguracaoSLAPage />} />
                  <Route path="/nuclei/atendimento/sla/dashboard" element={<DashboardSLAPage />} />
                  {/* Distribuição Automática */}
                  <Route
                    path="/nuclei/atendimento/distribuicao/dashboard"
                    element={<DashboardDistribuicaoPage />}
                  />
                  <Route
                    path="/nuclei/atendimento/distribuicao/configuracao"
                    element={<ConfiguracaoDistribuicaoPage />}
                  />
                  <Route path="/nuclei/atendimento/distribuicao/skills" element={<GestaoSkillsPage />} />
                  {/* Sistema de Demandas */}
                  <Route path="/nuclei/atendimento/demandas" element={<DemandasPage />} />
                  <Route path="/nuclei/atendimento/demandas/:id" element={<DemandaDetailPage />} />
                  {/* Sprint 2: Redirects para modelo unificado Tickets (manter 6 meses) */}
                  <Route 
                    path="/demandas" 
                    element={<Navigate to="/nuclei/atendimento/demandas" replace />} 
                  />
                  <Route 
                    path="/demandas/:id" 
                    element={<Navigate to="/nuclei/atendimento/demandas/:id" replace />} 
                  />
                  {/* Rotas legadas - Redirects para compatibilidade */}
                  <Route path="/gestao/empresas" element={<Navigate to="/admin/empresas" replace />} />{' '}
                  {/* Redirect para gestão admin */}
                  <Route path="/nuclei/configuracoes/empresas" element={<ConfiguracaoEmpresaPage />} />
                  <Route
                    path="/gestao/usuarios"
                    element={<Navigate to="/nuclei/configuracoes/usuarios" replace />}
                  />
                  <Route
                    path="/configuracoes/empresa"
                    element={<Navigate to="/nuclei/configuracoes/empresa" replace />}
                  />
                  <Route
                    path="/configuracoes/email"
                    element={<Navigate to="/nuclei/configuracoes/email" replace />}
                  />
                  <Route
                    path="/configuracoes/metas"
                    element={<Navigate to="/nuclei/configuracoes/metas" replace />}
                  />
                  <Route
                    path="/configuracoes/integracoes"
                    element={<Navigate to="/nuclei/configuracoes/integracoes" replace />}
                  />
                  <Route
                    path="/configuracoes/departamentos"
                    element={<Navigate to="/nuclei/configuracoes/departamentos" replace />}
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
                  <Route path="/billing" element={protegerRota(ModuloEnum.BILLING, <BillingPage />)} />
                  <Route path="/assinaturas" element={protegerRota(ModuloEnum.BILLING, <BillingPage />)} />
                  {/* Sistema de Faturamento - Protegido */}
                  <Route
                    path="/faturamento"
                    element={protegerRota(ModuloEnum.BILLING, <FaturamentoPage />)}
                  />
                  {/* Exemplo Modal Produto */}
                  <Route path="/exemplo-produto" element={<ExemploModalProduto />} />
                  {/* Rotas dos módulos existentes - Protegidas */}
                  <Route path="/leads" element={protegerRota(ModuloEnum.CRM, <LeadsPage />)} />
                  <Route path="/clientes" element={protegerRota(ModuloEnum.CRM, <ClientesPage />)} />
                  <Route path="/contatos" element={protegerRota(ModuloEnum.CRM, <ContatosPage />)} />
                  <Route
                    path="/interacoes"
                    element={protegerRota(ModuloEnum.CRM, <InteracoesPage />)}
                  />
                  <Route path="/pipeline" element={protegerRota(ModuloEnum.CRM, <PipelinePage />)} />
                  {/* Redirects - Consolidação de telas */}
                  <Route path="/funil-vendas" element={<Navigate to="/pipeline" replace />} />
                  <Route path="/oportunidades" element={<Navigate to="/pipeline" replace />} />
                  <Route path="/propostas" element={protegerRota(ModuloEnum.VENDAS, <PropostasPage />)} />
                  <Route path="/cotacoes" element={protegerRota(ModuloEnum.VENDAS, <CotacaoPage />)} />
                  <Route path="/orcamentos" element={protegerRota(ModuloEnum.VENDAS, <CotacaoPage />)} />
                  <Route
                    path="/aprovacoes/pendentes"
                    element={protegerRota(ModuloEnum.VENDAS, <MinhasAprovacoesPage />)}
                  />
                  <Route path="/produtos" element={protegerRota(ModuloEnum.VENDAS, <ProdutosPage />)} />
                  <Route
                    path="/produtos/categorias"
                    element={protegerRota(ModuloEnum.VENDAS, <CategoriasProdutosPage />)}
                  />
                  {/* Rotas dos Combos - Protegidas */}
                  <Route path="/combos" element={protegerRota(ModuloEnum.VENDAS, <CombosPage />)} />
                  <Route path="/combos/novo" element={protegerRota(ModuloEnum.VENDAS, <NovoComboPage />)} />
                  <Route
                    path="/combos/:id/editar"
                    element={protegerRota(ModuloEnum.VENDAS, <NovoComboPage />)}
                  />
                  <Route path="/agenda" element={protegerRota(ModuloEnum.CRM, <AgendaPage />)} />
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
      {/* Página de configuração de e-mail - pública para facilitar configuração */}
      <Route path="/configuracao-email" element={<ConfiguracaoEmailPage />} />
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
                              <AppRoutes />

                              <Toaster
                                position="top-right"
                                toastOptions={{
                                  duration: 4000,
                                  style: {
                                    background: '#363636',
                                    color: '#fff',
                                  },
                                }}
                              />
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

