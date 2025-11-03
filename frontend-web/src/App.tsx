import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { I18nProvider } from './contexts/I18nContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { EmpresaProvider } from './contexts/EmpresaContextAPIReal';
import { ProfileProvider } from './contexts/ProfileContext';
import { SidebarProvider } from './contexts/SidebarContext';
import { MenuProvider } from './contexts/MenuContext';
import { ToastProvider } from './features/atendimento/omnichannel/contexts/ToastContext';
import { protegerRota } from './utils/routeGuardHelper';
import { ModuloEnum } from './services/modulosService';
import LoginPage from './features/auth/LoginPage';
import RegistroEmpresaPage from './features/auth/RegistroEmpresaPage';
import VerificacaoEmailPage from './features/auth/VerificacaoEmailPage';
import TrocarSenhaPage from './pages/TrocarSenhaPage'; // ✅ Troca de senha (primeiro acesso)
import DashboardLayout from './components/layout/DashboardLayout';
import DashboardRouter from './features/dashboard/DashboardRouter';
import ClientesPage from './features/clientes/ClientesPage';
import PropostasPage from './features/propostas/PropostasPage';
import CategoriasProdutosPage from './features/produtos/CategoriasProdutosPage';
import ProdutosPage from './features/produtos/ProdutosPage';
import FinanceiroPage from './features/financeiro/FinanceiroPage';
import ConfiguracoesPage from './features/configuracoes/ConfiguracoesPage';
import ContasReceberPage from './features/financeiro/ContasReceberPage';
import ContasPagarPage from './pages/gestao/financeiro/ContasPagarSimplificada';
import FornecedoresPage from './features/financeiro/fornecedores/FornecedoresPage';
import ContratosPage from './features/contratos/ContratosPage';
import DebugContratos from './components/DebugContratos';
import LoginDebug from './components/LoginDebug';
import { AgendaPage } from './features/agenda/AgendaPage';
import { OportunidadesPage } from './features/oportunidades/OportunidadesPage';
import { ExemploModalProduto } from './examples/ExemploModalProduto';
import CombosPage from './features/combos/CombosPage';
import NovoComboPage from './features/combos/NovoComboPage';
import NotificationsPage from './pages/NotificationsPage';
import FunilVendas from './pages/FunilVendas';
// Importar páginas de núcleos
import CrmNucleusPage from './pages/nuclei/CrmNucleusPage';
import VendasNucleusPage from './pages/nuclei/VendasNucleusPage';
import FinanceiroNucleusPage from './pages/nuclei/FinanceiroNucleusPage';
import ConfiguracoesNucleusPage from './pages/nuclei/ConfiguracoesNucleusPage';
import AdministracaoNucleusPage from './pages/nuclei/AdministracaoNucleusPage';
import ModuleUnderConstruction from './components/common/ModuleUnderConstruction';
import { UploadDemoPage } from './pages/UploadDemoPage';
import { EmpresasListPage } from './features/admin/empresas/EmpresasListPage';
import { MinhasEmpresasPage } from './features/empresas/MinhasEmpresasPage';
import ContatosPage from './features/contatos/ContatosPage';
import { UsuariosPage } from './features/gestao/usuarios/UsuariosPage';
import PerfilPage from './features/perfil/PerfilPage';
import AtendimentoIntegradoPage from './pages/AtendimentoIntegradoPage';
import AtendimentoDashboard from './pages/AtendimentoDashboard';
import GestaoNucleosPage from './pages/GestaoNucleosPage';
import GestaoFluxosPage from './pages/GestaoFluxosPage';
import FluxoBuilderPage from './pages/FluxoBuilderPage';
import GestaoEquipesPage from './pages/GestaoEquipesPage';
import GestaoAtendentesPage from './pages/GestaoAtendentesPage';
import GestaoUsuariosPage from './pages/GestaoUsuariosPage';
import GestaoAtribuicoesPage from './pages/GestaoAtribuicoesPage';
import GestaoDepartamentosPage from './pages/GestaoDepartamentosPage';
// Importar novas páginas do sistema de empresas
import { ConfiguracaoEmpresaPage } from './pages/empresas/ConfiguracaoEmpresaPage';
import { RelatoriosAnalyticsPage } from './pages/empresas/RelatoriosAnalyticsPage';
import { SistemaPermissoesPage } from './pages/empresas/SistemaPermissoesPage';
import { BackupSincronizacaoPage } from './pages/empresas/BackupSincronizacaoPage';
import { useAuth } from './hooks/useAuth';
import PortalRoutes from './routes/PortalRoutes';
import ChatwootConfiguracao from './pages/configuracoes/ChatwootConfiguracao';
import MetasConfiguracao from './pages/configuracoes/MetasConfiguracao';
import IntegracoesPage from './pages/configuracoes/IntegracoesPage';
import TestePortalPage from './pages/TestePortalPage';
import PortalClientePage from './pages/PortalClientePage';
import ConfiguracaoEmailPage from './pages/ConfiguracaoEmailPage';
import ScrollToTop from './components/common/ScrollToTop';
import { BillingPage } from './pages/billing';
import FaturamentoPage from './pages/faturamento/FaturamentoPage';
import CotacaoPage from './pages/CotacaoPage';
import DepartamentosPage from './pages/DepartamentosPage';

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
      <DashboardLayout>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardRouter />} />

          {/* Página de Notificações */}
          <Route path="/notifications" element={<NotificationsPage />} />

          {/* Página de Contratos */}
          <Route path="/contratos/:id" element={<ContratosPage />} />

          {/* Debug de Contratos */}
          <Route path="/debug-contratos" element={<DebugContratos />} />

          {/* Debug de Login */}
          <Route path="/debug-login" element={<LoginDebug />} />

          {/* Rotas das páginas de núcleos - Protegidas por licença */}
          <Route path="/nuclei/crm" element={protegerRota(ModuloEnum.CRM, <CrmNucleusPage />)} />
          <Route path="/nuclei/vendas" element={protegerRota(ModuloEnum.VENDAS, <VendasNucleusPage />)} />
          <Route path="/nuclei/financeiro" element={protegerRota(ModuloEnum.FINANCEIRO, <FinanceiroNucleusPage />)} />
          <Route path="/nuclei/configuracoes" element={<ConfiguracoesNucleusPage />} /> {/* Configurações: base platform */}
          <Route path="/nuclei/administracao" element={protegerRota(ModuloEnum.ADMINISTRACAO, <AdministracaoNucleusPage />)} />

          {/* Rotas administrativas do sistema - Protegidas */}
          <Route path="/admin/empresas" element={protegerRota(ModuloEnum.ADMINISTRACAO, <EmpresasListPage />)} />
          <Route path="/gestao/nucleos" element={protegerRota(ModuloEnum.ATENDIMENTO, <GestaoNucleosPage />)} />
          <Route path="/gestao/fluxos" element={protegerRota(ModuloEnum.ATENDIMENTO, <GestaoFluxosPage />)} />
          <Route path="/gestao/fluxos/:id/builder" element={protegerRota(ModuloEnum.ATENDIMENTO, <FluxoBuilderPage />)} />
          <Route path="/gestao/fluxos/novo/builder" element={protegerRota(ModuloEnum.ATENDIMENTO, <FluxoBuilderPage />)} />
          <Route path="/gestao/equipes" element={protegerRota(ModuloEnum.ATENDIMENTO, <GestaoEquipesPage />)} />
          <Route path="/gestao/atendentes" element={protegerRota(ModuloEnum.ATENDIMENTO, <GestaoAtendentesPage />)} />
          <Route path="/gestao/atribuicoes" element={protegerRota(ModuloEnum.ATENDIMENTO, <GestaoAtribuicoesPage />)} />
          <Route path="/gestao/departamentos" element={protegerRota(ModuloEnum.ATENDIMENTO, <GestaoDepartamentosPage />)} />

          {/* Rotas do módulo de Administração */}
          <Route path="/admin/relatorios" element={
            <ModuleUnderConstruction
              moduleName="Relatórios Avançados"
              description="Analytics empresarial, dashboards executivos e KPIs estratégicos"
              estimatedCompletion="Q2 2025"
              features={[
                "Dashboards executivos",
                "KPIs estratégicos",
                "Analytics de vendas",
                "Relatórios customizados",
                "Exportação avançada"
              ]}
            />
          } />

          <Route path="/admin/auditoria" element={
            <ModuleUnderConstruction
              moduleName="Auditoria & Logs"
              description="Rastreamento de ações, logs de sistema e conformidade"
              estimatedCompletion="Q3 2025"
              features={[
                "Log de atividades",
                "Auditoria de acessos",
                "Histórico de alterações",
                "Relatórios de conformidade",
                "Monitoramento em tempo real"
              ]}
            />
          } />

          <Route path="/admin/monitoramento" element={
            <ModuleUnderConstruction
              moduleName="Monitoramento de Sistema"
              description="Status do sistema, performance e alertas de infraestrutura"
              estimatedCompletion="Q3 2025"
              features={[
                "Monitor de performance",
                "Alertas em tempo real",
                "Status de serviços",
                "Métricas de uso",
                "Dashboard de infraestrutura"
              ]}
            />
          } />

          <Route path="/admin/analytics" element={
            <ModuleUnderConstruction
              moduleName="Dados & Analytics"
              description="Análise de dados, métricas de uso e inteligência de negócios"
              estimatedCompletion="Q4 2025"
              features={[
                "Análise de dados",
                "Métricas de uso",
                "Business Intelligence",
                "Dashboards interativos",
                "Relatórios estatísticos"
              ]}
            />
          } />

          <Route path="/admin/conformidade" element={
            <ModuleUnderConstruction
              moduleName="Políticas & Conformidade"
              description="Gestão de políticas internas, LGPD e compliance regulatório"
              estimatedCompletion="Q4 2025"
              features={[
                "Gestão de políticas",
                "Compliance LGPD",
                "Controle de consentimento",
                "Auditoria de conformidade",
                "Relatórios regulatórios"
              ]}
            />
          } />

          <Route path="/admin/acesso" element={
            <ModuleUnderConstruction
              moduleName="Controle de Acesso"
              description="Configuração de roles, permissões e políticas de segurança avançadas"
              estimatedCompletion="Q2 2025"
              features={[
                "Gestão de roles",
                "Permissões granulares",
                "Políticas de segurança",
                "Autenticação 2FA",
                "Controle de sessões"
              ]}
            />
          } />

          {/* Gerenciamento de Empresas do Usuário */}
          <Route path="/empresas/minhas" element={<MinhasEmpresasPage />} />
          <Route path="/empresas/:empresaId/configuracoes" element={<ConfiguracaoEmpresaPage />} />
          <Route path="/empresas/:empresaId/relatorios" element={<RelatoriosAnalyticsPage />} />
          <Route path="/empresas/:empresaId/permissoes" element={<SistemaPermissoesPage />} />
          <Route path="/empresas/:empresaId/backup" element={<BackupSincronizacaoPage />} />

          {/* Configurações globais da empresa ativa - Padrão consolidado */}
          <Route path="/nuclei/configuracoes/empresas" element={protegerRota(ModuloEnum.ADMINISTRACAO, <EmpresasListPage />)} />
          <Route path="/nuclei/configuracoes/usuarios" element={<GestaoUsuariosPage />} />
          <Route path="/nuclei/configuracoes/empresa" element={<ConfiguracaoEmpresaPage />} />
          <Route path="/nuclei/configuracoes/email" element={<ConfiguracaoEmailPage />} />
          <Route path="/nuclei/configuracoes/chatwoot" element={<ChatwootConfiguracao />} />
          <Route path="/nuclei/configuracoes/metas" element={<MetasConfiguracao />} />
          <Route path="/nuclei/configuracoes/integracoes" element={<IntegracoesPage />} />
          <Route path="/nuclei/configuracoes/departamentos" element={<DepartamentosPage />} />
          
          {/* Rotas legadas - Redirects para compatibilidade */}
          <Route path="/gestao/empresas" element={<Navigate to="/nuclei/configuracoes/empresas" replace />} />
          <Route path="/gestao/usuarios" element={<Navigate to="/nuclei/configuracoes/usuarios" replace />} />
          <Route path="/configuracoes/empresa" element={<Navigate to="/nuclei/configuracoes/empresa" replace />} />
          <Route path="/configuracoes/email" element={<Navigate to="/nuclei/configuracoes/email" replace />} />
          <Route path="/configuracoes/chatwoot" element={<Navigate to="/nuclei/configuracoes/chatwoot" replace />} />
          <Route path="/configuracoes/metas" element={<Navigate to="/nuclei/configuracoes/metas" replace />} />
          <Route path="/configuracoes/integracoes" element={<Navigate to="/nuclei/configuracoes/integracoes" replace />} />
          <Route path="/configuracoes/departamentos" element={<Navigate to="/nuclei/configuracoes/departamentos" replace />} />
          
          <Route path="/relatorios/analytics" element={<RelatoriosAnalyticsPage />} />
          <Route path="/gestao/permissoes" element={<SistemaPermissoesPage />} />
          <Route path="/sistema/backup" element={<BackupSincronizacaoPage />} />

          {/* Atendimento Omnichannel - Protegido */}
          <Route path="/atendimento" element={protegerRota(ModuloEnum.ATENDIMENTO, <AtendimentoDashboard />)} />
          <Route path="/atendimento/chat" element={protegerRota(ModuloEnum.ATENDIMENTO, <AtendimentoIntegradoPage />)} />

          {/* Perfil do Usuário */}
          <Route path="/perfil" element={<PerfilPage />} />

          {/* Sistema de Billing e Assinaturas - Protegido */}
          <Route path="/billing" element={protegerRota(ModuloEnum.BILLING, <BillingPage />)} />
          <Route path="/assinaturas" element={protegerRota(ModuloEnum.BILLING, <BillingPage />)} />

          {/* Sistema de Faturamento - Protegido */}
          <Route path="/faturamento" element={protegerRota(ModuloEnum.BILLING, <FaturamentoPage />)} />

          {/* Exemplo Modal Produto */}
          <Route path="/exemplo-produto" element={<ExemploModalProduto />} />

          {/* Rotas dos módulos existentes - Protegidas */}
          <Route path="/clientes" element={protegerRota(ModuloEnum.CRM, <ClientesPage />)} />
          <Route path="/contatos" element={protegerRota(ModuloEnum.CRM, <ContatosPage />)} />
          <Route path="/propostas" element={protegerRota(ModuloEnum.VENDAS, <PropostasPage />)} />
          <Route path="/cotacoes" element={protegerRota(ModuloEnum.VENDAS, <CotacaoPage />)} />
          <Route path="/orcamentos" element={protegerRota(ModuloEnum.VENDAS, <CotacaoPage />)} />
          <Route path="/funil-vendas" element={protegerRota(ModuloEnum.VENDAS, <FunilVendas />)} />
          <Route path="/produtos" element={protegerRota(ModuloEnum.VENDAS, <ProdutosPage />)} />
          <Route path="/produtos/categorias" element={protegerRota(ModuloEnum.VENDAS, <CategoriasProdutosPage />)} />

          {/* Rotas dos Combos - Protegidas */}
          <Route path="/combos" element={protegerRota(ModuloEnum.VENDAS, <CombosPage />)} />
          <Route path="/combos/novo" element={protegerRota(ModuloEnum.VENDAS, <NovoComboPage />)} />
          <Route path="/combos/:id/editar" element={protegerRota(ModuloEnum.VENDAS, <NovoComboPage />)} />

          <Route path="/agenda" element={protegerRota(ModuloEnum.CRM, <AgendaPage />)} />
          <Route path="/oportunidades" element={protegerRota(ModuloEnum.VENDAS, <OportunidadesPage />)} />

          {/* Upload Demo */}
          <Route path="/upload-demo" element={<UploadDemoPage />} />

          {/* Teste do Portal do Cliente */}
          <Route path="/teste-portal" element={<TestePortalPage />} />

          {/* Portal do Cliente - Gestão */}
          <Route path="/portal" element={<PortalClientePage />} />

          {/* Rotas do Núcleo Financeiro - Protegidas */}
          <Route path="/financeiro" element={protegerRota(ModuloEnum.FINANCEIRO, <FinanceiroPage />)} />
          <Route path="/financeiro/contas-receber" element={protegerRota(ModuloEnum.FINANCEIRO, <ContasReceberPage />)} />
          <Route path="/financeiro/contas-pagar" element={protegerRota(ModuloEnum.FINANCEIRO, <ContasPagarPage />)} />
          <Route path="/financeiro/fornecedores" element={protegerRota(ModuloEnum.FINANCEIRO, <FornecedoresPage />)} />

          {/* Módulos financeiros - Protegidos */}
          <Route path="/financeiro/faturamento" element={protegerRota(ModuloEnum.BILLING, <FaturamentoPage />)} />

          <Route path="/financeiro/relatorios" element={
            <ModuleUnderConstruction
              moduleName="Relatórios Financeiros"
              description="Análises e indicadores financeiros avançados"
              estimatedCompletion="Q2 2025"
              features={[
                "DRE (Demonstração do Resultado)",
                "Balanço patrimonial",
                "Análise de indicadores",
                "Gráficos interativos",
                "Exportação em múltiplos formatos"
              ]}
            />
          } />

          <Route path="/financeiro/conciliacao" element={
            <ModuleUnderConstruction
              moduleName="Conciliação Bancária"
              description="Conciliação automática de extratos bancários"
              estimatedCompletion="Q2 2025"
              features={[
                "Importação de extratos OFX/CSV",
                "Conciliação automática",
                "Lançamentos pendentes",
                "Reconciliação manual",
                "Múltiplas contas bancárias"
              ]}
            />
          } />

          <Route path="/financeiro/centro-custos" element={
            <ModuleUnderConstruction
              moduleName="Centro de Custos"
              description="Organização e controle detalhado de custos"
              estimatedCompletion="Q1 2025"
              features={[
                "Hierarquia de centros de custo",
                "Rateio automático",
                "Análise de custos",
                "Orçamento vs realizado",
                "Relatórios por centro"
              ]}
            />
          } />

          <Route path="/financeiro/tesouraria" element={
            <ModuleUnderConstruction
              moduleName="Tesouraria"
              description="Gestão avançada de caixa e investimentos"
              estimatedCompletion="Q3 2025"
              features={[
                "Gestão de múltiplas contas",
                "Aplicações financeiras",
                "Projeção de fluxo de caixa",
                "Controle de cheques",
                "Dashboard executivo"
              ]}
            />
          } />

          <Route path="/configuracoes" element={<ConfiguracoesPage />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </DashboardLayout>
    );
  }

  return (
    <Routes>
      {/* Rotas públicas do portal do cliente */}
      <Route path="/portal/*" element={<PortalRoutes />} />

      {/* Página de configuração de e-mail - pública para facilitar configuração */}
      <Route path="/configuracao-email" element={<ConfiguracaoEmailPage />} />

      {/* Rotas de autenticação */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/registro" element={<RegistroEmpresaPage />} />
      <Route path="/verificar-email" element={<VerificacaoEmailPage />} />
      <Route path="/trocar-senha" element={<TrocarSenhaPage />} /> {/* ✅ Troca de senha (primeiro acesso) */}
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
                  <SidebarProvider>
                    <MenuProvider>
                      <ToastProvider>
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
                      </ToastProvider>
                    </MenuProvider>
                  </SidebarProvider>
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
