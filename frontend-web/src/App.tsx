import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { I18nProvider } from './contexts/I18nContext';
import { NotificationProvider } from './contexts/NotificationContext';
import LoginPage from './features/auth/LoginPage';
import RegistroEmpresaPage from './features/auth/RegistroEmpresaPage';
import VerificacaoEmailPage from './features/auth/VerificacaoEmailPage';
import DashboardLayout from './components/layout/DashboardLayout';
import DashboardPage from './features/dashboard/DashboardPage';
import ClientesPage from './features/clientes/ClientesPage';
import PropostasPage from './features/propostas/PropostasPage';
import CategoriasProdutosPage from './features/produtos/CategoriasProdutosPage';
import ProdutosPage from './features/produtos/ProdutosPage';
import FinanceiroPage from './features/financeiro/FinanceiroPage';
import ConfiguracoesPage from './features/configuracoes/ConfiguracoesPage';
import ContasReceberPage from './features/financeiro/ContasReceberPage';
import ContasPagarPage from './features/financeiro/ContasPagarPage';
import { AgendaPage } from './features/agenda/AgendaPage';
import { ExemploModalProduto } from './examples/ExemploModalProduto';
import CombosPage from './features/combos/CombosPage';
import NovoComboPage from './features/combos/NovoComboPage';
import CentralOperacoesPage from './pages/CentralOperacoesPage';
import NotificationsPage from './pages/NotificationsPage';
import FunilVendas from './pages/FunilVendas';
// Importar páginas de núcleos
import CrmNucleusPage from './pages/nuclei/CrmNucleusPage';
import VendasNucleusPage from './pages/nuclei/VendasNucleusPage';
import FinanceiroNucleusPage from './pages/nuclei/FinanceiroNucleusPage';
import SistemaNucleusPage from './pages/nuclei/SistemaNucleusPage';
import ModuleUnderConstruction from './components/common/ModuleUnderConstruction';
import { UploadDemoPage } from './pages/UploadDemoPage';
import { useAuth } from './hooks/useAuth';

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
          <Route path="/dashboard" element={<DashboardPage />} />
          
          {/* Página de Notificações */}
          <Route path="/notifications" element={<NotificationsPage />} />
          
          {/* Central de Operações - Fluxo Integrado */}
          <Route path="/central-operacoes" element={<CentralOperacoesPage />} />
          
          {/* Rotas das páginas de núcleos */}
          <Route path="/nuclei/crm" element={<CrmNucleusPage />} />
          <Route path="/nuclei/vendas" element={<VendasNucleusPage />} />
          <Route path="/nuclei/financeiro" element={<FinanceiroNucleusPage />} />
          <Route path="/nuclei/sistema" element={<SistemaNucleusPage />} />
          
          {/* Exemplo Modal Produto */}
          <Route path="/exemplo-produto" element={<ExemploModalProduto />} />
          
          {/* Rotas dos módulos existentes */}
          <Route path="/clientes" element={<ClientesPage />} />
          <Route path="/propostas" element={<PropostasPage />} />
          <Route path="/funil-vendas" element={<FunilVendas />} />
          <Route path="/produtos" element={<ProdutosPage />} />
          <Route path="/produtos/categorias" element={<CategoriasProdutosPage />} />
          
          {/* Rotas dos Combos */}
          <Route path="/combos" element={<CombosPage />} />
          <Route path="/combos/novo" element={<NovoComboPage />} />
          <Route path="/combos/:id/editar" element={<NovoComboPage />} />
          
          <Route path="/agenda" element={<AgendaPage />} />
          
          {/* Upload Demo */}
          <Route path="/upload-demo" element={<UploadDemoPage />} />
          
          {/* Rotas do Núcleo Financeiro */}
          <Route path="/financeiro" element={<FinanceiroPage />} />
          <Route path="/financeiro/contas-receber" element={<ContasReceberPage />} />
          <Route path="/financeiro/contas-pagar" element={<ContasPagarPage />} />
          
          {/* Módulos financeiros em desenvolvimento */}
          <Route path="/financeiro/faturamento" element={
            <ModuleUnderConstruction 
              moduleName="Faturamento"
              description="Sistema completo de emissão e controle de notas fiscais"
              estimatedCompletion="Q1 2025"
              features={[
                "Emissão de NFe, NFSe e NFCe",
                "Integração com SEFAZ",
                "Controle de série e numeração",
                "Cancelamento e carta de correção",
                "Relatórios de faturamento"
              ]}
            />
          } />
          
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
      <Route path="/login" element={<LoginPage />} />
      <Route path="/registro" element={<RegistroEmpresaPage />} />
      <Route path="/verificar-email" element={<VerificacaoEmailPage />} />
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
            <NotificationProvider>
              <Router>
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
            </NotificationProvider>
          </AuthProvider>
        </ThemeProvider>
      </I18nProvider>
    </QueryClientProvider>
  );
};

export default App;
