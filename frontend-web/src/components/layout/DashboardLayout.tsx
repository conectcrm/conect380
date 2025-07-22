import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useI18n } from '../../contexts/I18nContext';
import { useTheme } from '../../contexts/ThemeContext';
import { formatCompanyName, formatUserName } from '../../utils/textUtils';
import SimpleNavGroup, { NavigationNucleus } from '../navigation/SimpleNavGroup';
import NotificationCenter from '../notifications/NotificationCenter';
import { 
  Menu, 
  X, 
  Home, 
  Users, 
  Settings,
  LogOut,
  Bell,
  Search,
  Wifi,
  WifiOff,
  User,
  ChevronDown,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  ShoppingBag,
  DollarSign,
  Target
} from 'lucide-react';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { user, logout } = useAuth();
  const { t } = useI18n();
  const { currentPalette } = useTheme();
  const location = useLocation();

  // Mapeamento de rotas para títulos dinâmicos
  const getPageInfo = (pathname: string) => {
    const routeMap: Record<string, { title: string; subtitle: string }> = {
      '/dashboard': {
        title: 'Dashboard',
        subtitle: 'Visão geral do seu negócio'
      },
      '/central-operacoes': {
        title: 'Central de Operações',
        subtitle: 'Fluxo integrado de vendas completo'
      },
      '/nuclei/principal': {
        title: 'Principal',
        subtitle: 'Módulos principais do sistema'
      },
      '/nuclei/crm': {
        title: 'CRM',
        subtitle: 'Gestão de relacionamento com clientes'
      },
      '/nuclei/vendas': {
        title: 'Vendas',
        subtitle: 'Propostas, produtos e oportunidades'
      },
      '/nuclei/financeiro': {
        title: 'Financeiro',
        subtitle: 'Controle financeiro e faturamento'
      },
      '/nuclei/sistema': {
        title: 'Sistema',
        subtitle: 'Configurações e administração'
      },
      '/clientes': {
        title: 'Clientes',
        subtitle: 'Gerencie seus clientes e contatos'
      },
      '/propostas': {
        title: 'Propostas',
        subtitle: 'Acompanhe suas propostas comerciais'
      },
      '/produtos': {
        title: 'Produtos',
        subtitle: 'Catálogo de produtos e serviços'
      },
      '/combos': {
        title: 'Combos',
        subtitle: 'Gestão de combos e pacotes de produtos'
      },
      '/combos/novo': {
        title: 'Novo Combo',
        subtitle: 'Criar um novo combo de produtos'
      },
      '/financeiro/contas-receber': {
        title: 'Contas a Receber',
        subtitle: 'Gestão de recebimentos e inadimplência'
      },
      '/financeiro/contas-pagar': {
        title: 'Contas a Pagar',
        subtitle: 'Controle de pagamentos e fornecedores'
      },
      '/financeiro/fluxo-caixa': {
        title: 'Fluxo de Caixa',
        subtitle: 'Acompanhamento de entradas e saídas'
      },
      '/configuracoes': {
        title: 'Configurações',
        subtitle: 'Configurações do sistema'
      }
    };

    return routeMap[pathname] || {
      title: 'Fênix CRM',
      subtitle: 'Sistema de gestão empresarial'
    };
  };

  const currentPage = getPageInfo(location.pathname);

  // Dados dos núcleos para navegação simplificada
  const navigationNuclei: NavigationNucleus[] = [
    {
      id: 'dashboard',
      title: 'Dashboard',
      icon: Home,
      href: '/dashboard',
      color: 'blue',
      totalNotifications: 0,
      description: 'Visão geral do negócio'
    },
    {
      id: 'central-operacoes',
      title: 'Central de Operações',
      icon: Target,
      href: '/central-operacoes',
      color: 'purple',
      totalNotifications: 0,
      description: 'Fluxo integrado de vendas'
    },
    {
      id: 'crm',
      title: 'CRM',
      icon: Users,
      href: '/nuclei/crm',
      color: 'green',
      totalNotifications: 3, // clientes
      description: 'Gestão de relacionamento com clientes'
    },
    {
      id: 'vendas',
      title: 'Vendas',
      icon: ShoppingBag,
      href: '/nuclei/vendas',
      color: 'green',
      totalNotifications: 2, // propostas e produtos
      description: 'Propostas, produtos e oportunidades'
    },
    {
      id: 'financeiro',
      title: 'Financeiro',
      icon: DollarSign,
      href: '/nuclei/financeiro',
      color: 'orange',
      totalNotifications: 8, // 5 contas receber + 2 contas pagar + 1 faturamento
      description: 'Controle financeiro e faturamento'
    },
    {
      id: 'sistema',
      title: 'Sistema',
      icon: Settings,
      href: '/nuclei/sistema',
      color: 'purple',
      totalNotifications: 1,
      description: 'Configurações e administração'
    }
  ];

  // Estados para funcionalidades da barra superior
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showUserMenu, setShowUserMenu] = useState(false);
  
  // Estados para sistema de busca
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [searchResults] = useState([
    { id: 1, type: 'cliente', title: 'João Silva', subtitle: 'cliente@email.com' },
    { id: 2, type: 'proposta', title: 'Proposta #001', subtitle: 'R$ 15.000,00' },
    { id: 3, type: 'contrato', title: 'Contrato #123', subtitle: 'Ativo até 12/2025' }
  ]);

  const handleLogout = () => {
    logout();
  };

  // Monitor de conexão
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Effect para fechar dropdowns ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      
      if (showUserMenu && !target.closest('[data-dropdown="user-menu"]')) {
        setShowUserMenu(false);
      }
      
      if (showSearchResults && !target.closest('[data-dropdown="search"]')) {
        setShowSearchResults(false);
      }
    };

    if (showUserMenu || showSearchResults) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showUserMenu, showSearchResults]);

  // Effect para atalho de teclado da busca
  useEffect(() => {
    const handleKeydown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault();
        const searchInput = document.querySelector('input[placeholder*="Buscar"]') as HTMLInputElement;
        if (searchInput) {
          searchInput.focus();
        }
      }
      
      if (event.key === 'Escape') {
        setShowSearchResults(false);
        setSearchQuery('');
      }
    };

    document.addEventListener('keydown', handleKeydown);
    return () => document.removeEventListener('keydown', handleKeydown);
  }, []);

  return (
    <div className="h-screen flex overflow-hidden bg-[#DEEFE7]">
      {/* Sidebar para mobile */}
      <div className={`fixed inset-0 flex z-40 md:hidden ${sidebarOpen ? '' : 'hidden'}`}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
        
        <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white">
          <div className="absolute top-0 right-0 -mr-12 pt-2">
            <button
              className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-6 w-6 text-white" />
            </button>
          </div>
          
          <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
            <div className="flex-shrink-0 flex items-center px-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-[#159A9C] to-[#0F7B7D] rounded-xl flex items-center justify-center text-white font-bold shadow-lg transition-all duration-200 hover:shadow-xl">
                  F
                </div>
                <div>
                  <h1 className="text-lg font-bold text-gray-900">Fênix CRM</h1>
                  <p className="text-xs text-blue-600 font-medium">
                    {formatCompanyName(user?.empresa?.nome || 'Demo Corp')}
                  </p>
                </div>
              </div>
            </div>
            {/* Navegação Mobile */}
            <SimpleNavGroup 
              nuclei={navigationNuclei}
              sidebarCollapsed={false}
            />
          </div>
        </div>
      </div>

      {/* Sidebar para desktop */}
      <div className="hidden md:flex md:flex-shrink-0">
        <div className={`flex flex-col transition-all duration-300 bg-[#FFFFFF] border-r border-[#DEEFE7] relative overflow-hidden shadow-sm ${sidebarCollapsed ? 'w-16' : 'w-64'}`}>
          <div className="flex flex-col h-full">
            <div className={`flex-1 flex flex-col pt-5 pb-4 min-h-0 ${sidebarCollapsed ? 'overflow-hidden px-2' : 'overflow-y-auto'}`}>
              {/* Header da Sidebar */}
              <div className={`flex items-center flex-shrink-0 mb-6 min-h-[60px] ${sidebarCollapsed ? 'px-2' : 'px-4'}`}>
                {!sidebarCollapsed ? (
                  // Layout quando expandida
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-8 h-8 bg-gradient-to-br from-[#159A9C] to-[#0F7B7D] rounded-xl flex items-center justify-center text-white font-bold shadow-lg flex-shrink-0 transition-all duration-200 hover:shadow-xl">
                      F
                    </div>
                    <div className="min-w-0 flex-1">
                      <h1 className="text-lg font-bold text-gray-900 truncate">Fênix CRM</h1>
                      <p className="text-xs text-blue-600 font-medium truncate">
                        {formatCompanyName(user?.empresa?.nome || 'Demo Corp')}
                      </p>
                    </div>
                    <button
                      onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                      className="p-2 rounded-xl bg-gradient-to-r from-gray-50 to-gray-100 hover:from-blue-50 hover:to-blue-100 border border-gray-200 hover:border-blue-200 shadow-sm transition-all duration-200 hover:shadow-md flex-shrink-0 group"
                      title="Recolher sidebar"
                    >
                      <ChevronLeft className="h-4 w-4 text-gray-600 group-hover:text-blue-600 transition-colors" />
                    </button>
                  </div>
                ) : (
                  // Layout quando colapsada - centralizado
                  <div className="flex flex-col items-center gap-2 w-full">
                    <div className="w-8 h-8 bg-gradient-to-br from-[#159A9C] to-[#0F7B7D] rounded-xl flex items-center justify-center text-white font-bold shadow-lg transition-all duration-200 hover:shadow-xl group relative">
                      F
                      <div className="absolute left-full ml-3 px-3 py-2 bg-gray-800 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-[60] shadow-lg">
                        <div className="font-semibold">Fênix CRM</div>
                        <div className="text-xs text-gray-300">
                          {formatCompanyName(user?.empresa?.nome || 'Demo Corp')}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                      className="p-1.5 rounded-lg bg-gradient-to-r from-gray-50 to-gray-100 hover:from-blue-50 hover:to-blue-100 border border-gray-200 hover:border-blue-200 shadow-sm transition-all duration-200 hover:shadow-md group"
                      title="Expandir sidebar"
                    >
                      <ChevronRight className="h-3 w-3 text-gray-600 group-hover:text-blue-600 transition-colors" />
                    </button>
                  </div>
                )}
              </div>

              {/* Navegação Simplificada */}
              <SimpleNavGroup 
                nuclei={navigationNuclei}
                sidebarCollapsed={sidebarCollapsed}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Conteúdo principal */}
      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        {/* Header Refatorado e Moderno */}
        <header className="relative z-10 flex-shrink-0 bg-white/95 backdrop-blur-sm border-b border-gray-200/80">
          <div className="w-full max-w-[1440px] mx-auto px-4 md:px-6">
            <div className="h-16 flex items-center justify-between">
              
              {/* Lado Esquerdo: Menu Mobile + Nome do Sistema + Status */}
              <div className="flex items-center gap-3">
                <button
                  className="p-2 text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 rounded-lg md:hidden transition-colors"
                  onClick={() => setSidebarOpen(true)}
                >
                  <Menu className="h-5 w-5" />
                </button>

                <div className="flex items-center gap-3">
                  <h1 className="text-lg font-semibold text-gray-900">
                    {formatCompanyName(user?.empresa?.nome || 'Fênix CRM Demo')}
                  </h1>
                  
                  {/* Status Online Unificado */}
                  <div 
                    className="flex items-center gap-1.5 px-2 py-1 bg-green-50 border border-green-200 rounded-full transition-all duration-300"
                    title="Sistema funcionando normalmente"
                  >
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-xs font-medium text-green-700 hidden sm:inline">
                      Online
                    </span>
                  </div>
                </div>
              </div>

              {/* Lado Direito: Busca + Notificações + Avatar */}
              <div className="flex items-center gap-3">
                
                {/* Campo de Busca Compacto */}
                <div className="relative hidden md:block" data-dropdown="search">
                {/* Campo de Busca Compacto */}
                <div className="relative hidden md:block" data-dropdown="search">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setShowSearchResults(e.target.value.length > 0);
                    }}
                    onFocus={() => setShowSearchResults(searchQuery.length > 0)}
                    placeholder="Buscar..."
                    className="w-60 pl-9 pr-12 py-2 border border-gray-200 rounded-lg bg-gray-50/80 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 focus:bg-white text-sm transition-all"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                    <kbd className="inline-flex items-center px-1.5 py-0.5 border border-gray-300 rounded text-xs bg-white text-gray-600 font-medium">
                      ⌘K
                    </kbd>
                  </div>
                  
                  {/* Dropdown de Resultados de Busca */}
                  {showSearchResults && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl border shadow-xl z-50 overflow-hidden">
                      <div className="p-3 border-b bg-gray-50">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-gray-600">
                            Resultados para "{searchQuery}"
                          </span>
                          <span className="text-xs text-gray-500">
                            {searchResults.length} encontrado{searchResults.length !== 1 ? 's' : ''}
                          </span>
                        </div>
                      </div>
                      
                      <div className="max-h-80 overflow-y-auto">
                        {searchResults
                          .filter(result => 
                            result.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            result.subtitle.toLowerCase().includes(searchQuery.toLowerCase())
                          )
                          .map((result) => (
                          <div key={result.id} className="p-3 hover:bg-gray-50 cursor-pointer transition-colors border-b last:border-b-0">
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-medium ${
                                result.type === 'cliente' ? 'bg-blue-500' :
                                result.type === 'proposta' ? 'bg-green-500' :
                                'bg-purple-500'
                              }`}>
                                {result.type === 'cliente' ? 'C' :
                                 result.type === 'proposta' ? 'P' : 'CT'}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">
                                  {result.title}
                                </p>
                                <p className="text-xs text-gray-500 truncate">
                                  {result.subtitle}
                                </p>
                              </div>
                              <div className="text-xs text-gray-400 capitalize">
                                {result.type}
                              </div>
                            </div>
                          </div>
                        ))}
                        
                        {searchResults.filter(result => 
                          result.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          result.subtitle.toLowerCase().includes(searchQuery.toLowerCase())
                        ).length === 0 && (
                          <div className="p-6 text-center">
                            <Search className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                            <p className="text-sm text-gray-500">Nenhum resultado encontrado</p>
                            <p className="text-xs text-gray-400">Tente usar outros termos</p>
                          </div>
                        )}
                      </div>
                      
                      <div className="p-3 border-t bg-gray-50">
                        <button className="w-full text-xs text-blue-600 hover:text-blue-700 font-medium transition-colors">
                          Ver todos os resultados
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

                {/* Notificações - Sistema Novo */}
                <NotificationCenter className="relative" />

                {/* Avatar/Menu do Usuário Compacto */}
                <div className="relative" data-dropdown="user-menu">
                  <button 
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-gray-100/80 transition-colors"
                    title={`${formatUserName(user?.nome || 'Admin Sistema')}`}
                  >
                    <div className="w-8 h-8 bg-gradient-to-br from-[#159A9C] to-[#0F7B7D] rounded-full flex items-center justify-center shadow-sm">
                      <User className="w-4 h-4 text-white" />
                    </div>
                    <ChevronDown className="w-3 h-3 text-gray-400 hidden sm:block" />
                  </button>

                  {/* Dropdown do Usuário - Design Moderno com Idioma */}
                  {showUserMenu && (
                    <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl border shadow-xl z-50 overflow-hidden">
                      {/* Header do Profile */}
                      <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-[#159A9C] to-[#0F7B7D] rounded-full flex items-center justify-center shadow-sm">
                            <User className="w-5 h-5 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-900 truncate">
                              {formatUserName(user?.nome || 'Admin Sistema')}
                            </p>
                            <p className="text-sm text-gray-600 truncate">
                              {user?.email || 'admin@fenixcrm.com'}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      {/* Menu de ações */}
                      <div className="py-2">
                        <button className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors">
                          <User className="w-4 h-4 text-gray-400" />
                          Meu Perfil
                        </button>
                        <button className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors">
                          <Settings className="w-4 h-4 text-gray-400" />
                          Configurações
                        </button>
                        
                        {/* Seletor de Idioma */}
                        <div className="px-4 py-2 border-t border-gray-100 mt-1">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Idioma</span>
                          </div>
                          <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                            <span className="text-lg">🇧🇷</span>
                            <span className="text-sm font-medium text-gray-700">Português</span>
                          </div>
                        </div>
                        
                        <button className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors">
                          <HelpCircle className="w-4 h-4 text-gray-400" />
                          Ajuda e Suporte
                        </button>
                      </div>
                      
                      {/* Ações críticas */}
                      <div className="border-t border-gray-100 py-2">
                        <button 
                          onClick={handleLogout}
                          className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-3 transition-colors"
                        >
                          <LogOut className="w-4 h-4" />
                          Sair do Sistema
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                
              </div>
            </div>
          </div>
        </header>

        {/* Conteúdo da página */}
        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          <div className="py-6">
            <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
