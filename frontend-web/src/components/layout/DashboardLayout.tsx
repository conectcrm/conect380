import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useI18n } from '../../contexts/I18nContext';
import { useTheme } from '../../contexts/ThemeContext';
import { formatCompanyName, formatUserName } from '../../utils/textUtils';
import SimpleNavGroup, { NavigationNucleus } from '../navigation/SimpleNavGroup';
import NotificationCenter from '../notifications/NotificationCenter';
import ConectCRMLogoFinal from '../ui/ConectCRMLogoFinal';
import { SupportWidget } from '../suporte/SupportWidget';
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
  Target,
  Building2,
  Calendar,
  Clock,
  MapPin,
  MessageCircle,
  CreditCard
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
      '/nuclei/configuracoes': {
        title: 'Configurações',
        subtitle: 'Configurações do sistema e integrações'
      },
      '/nuclei/administracao': {
        title: 'Administração',
        subtitle: 'Gestão empresarial e controle administrativo'
      },
      '/clientes': {
        title: 'Clientes',
        subtitle: 'Gerencie seus clientes e contatos'
      },
      '/propostas': {
        title: 'Propostas',
        subtitle: 'Acompanhe suas propostas comerciais'
      },
      '/funil-vendas': {
        title: 'Funil de Vendas',
        subtitle: 'Pipeline de oportunidades e negociações'
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
      '/billing': {
        title: 'Billing & Assinaturas',
        subtitle: 'Gerencie sua assinatura, planos e faturamento'
      },
      '/configuracoes': {
        title: 'Configurações',
        subtitle: 'Configurações do sistema'
      },
      '/configuracoes/chatwoot': {
        title: 'Configurações do Chatwoot',
        subtitle: 'Configurações da integração com Chatwoot'
      },
      '/admin/empresas': {
        title: 'Gestão de Empresas',
        subtitle: 'Administração e monitoramento de empresas'
      },
      '/empresas/minhas': {
        title: 'Minhas Empresas',
        subtitle: 'Gerencie suas empresas e alterne entre elas'
      },
      '/configuracoes/empresa': {
        title: 'Configurações da Empresa',
        subtitle: 'Configurações específicas da empresa ativa'
      },
      '/configuracoes/metas': {
        title: 'Metas Comerciais',
        subtitle: 'Defina e gerencie metas de vendas por período, vendedor ou região'
      },
      '/relatorios/analytics': {
        title: 'Relatórios e Analytics',
        subtitle: 'Análise detalhada de performance e resultados'
      },
      '/gestao/permissoes': {
        title: 'Sistema de Permissões',
        subtitle: 'Gerencie usuários e suas permissões de acesso'
      },
      '/sistema/backup': {
        title: 'Backup e Sincronização',
        subtitle: 'Gerencie backups e sincronize dados entre empresas'
      }
    };

    return routeMap[pathname] || {
      title: 'Conect CRM',
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
      color: 'blue'
    },
    {
      id: 'crm',
      title: 'CRM',
      icon: Users,
      href: '/nuclei/crm',
      color: 'blue'
    },
    {
      id: 'vendas',
      title: 'Vendas',
      icon: ShoppingBag,
      href: '/nuclei/vendas',
      color: 'green'
    },
    {
      id: 'financeiro',
      title: 'Financeiro',
      icon: DollarSign,
      href: '/nuclei/financeiro',
      color: 'orange'
    },
    {
      id: 'billing',
      title: 'Billing',
      icon: CreditCard,
      href: '/billing',
      color: 'green'
    },
    {
      id: 'configuracoes',
      title: 'Configurações',
      icon: Settings,
      href: '/nuclei/configuracoes',
      color: 'purple'
    },
    {
      id: 'administracao',
      title: 'Administração',
      icon: Building2,
      href: '/nuclei/administracao',
      color: 'blue'
    }
  ];

  // Estados para funcionalidades da barra superior
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showCompanySelector, setShowCompanySelector] = useState(false);

  // Estados para sistema de busca
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [searchResults] = useState([
    { id: 1, type: 'cliente', title: 'João Silva', subtitle: 'cliente@email.com' },
    { id: 2, type: 'proposta', title: 'Proposta #001', subtitle: 'R$ 15.000,00' },
    { id: 3, type: 'contrato', title: 'Contrato #123', subtitle: 'Ativo até 12/2025' }
  ]);

  // Lista de empresas do usuário (mock - seria obtida via API)
  const [userCompanies] = useState([
    {
      id: '1',
      nome: 'Tech Solutions Ltda',
      cnpj: '12.345.678/0001-90',
      plano: 'Professional',
      isActive: true
    },
    {
      id: '2',
      nome: 'Marketing Digital Corp',
      cnpj: '98.765.432/0001-10',
      plano: 'Enterprise',
      isActive: true
    },
    {
      id: '3',
      nome: 'Consultoria Empresarial',
      cnpj: '11.222.333/0001-44',
      plano: 'Starter',
      isActive: false
    }
  ]);

  // Empresa atualmente selecionada
  const [selectedCompany, setSelectedCompany] = useState(userCompanies[0]);

  // Função para alternar empresa
  const handleCompanySwitch = (company: typeof userCompanies[0]) => {
    setSelectedCompany(company);
    setShowCompanySelector(false);

    // Aqui você faria a chamada para API para trocar o contexto da empresa
    // updateUserContext(company.id);

    // Opcional: recarregar dados específicos da empresa
    // window.location.reload(); // ou refetch dos dados
  };

  // Estados e dados do calendário
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());

  const today = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  // Eventos de exemplo para o calendário
  const [events] = useState([
    {
      id: 1,
      date: new Date(2025, 6, 30),
      title: 'Reunião com Cliente A',
      time: '09:00',
      type: 'meeting',
      color: 'blue'
    },
    {
      id: 2,
      date: new Date(2025, 6, 31),
      title: 'Apresentação Proposta',
      time: '14:30',
      type: 'presentation',
      color: 'green'
    },
    {
      id: 3,
      date: new Date(2025, 7, 2),
      title: 'Follow-up Vendas',
      time: '10:15',
      type: 'call',
      color: 'purple'
    },
    {
      id: 4,
      date: new Date(2025, 7, 5),
      title: 'Treinamento Equipe',
      time: '16:00',
      type: 'training',
      color: 'orange'
    }
  ]);

  // Funções do calendário
  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const getEventsForDate = (date: Date) => {
    return events.filter(event =>
      event.date.toDateString() === date.toDateString()
    );
  };

  const isSameDay = (date1: Date, date2: Date) => {
    return date1.toDateString() === date2.toDateString();
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const formatDateForDisplay = (date: Date) => {
    return date.toLocaleDateString('pt-BR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

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

      if (showCalendar && !target.closest('[data-dropdown="calendar"]')) {
        setShowCalendar(false);
      }

      if (showCompanySelector && !target.closest('[data-dropdown="company"]')) {
        setShowCompanySelector(false);
      }
    };

    if (showUserMenu || showSearchResults || showCalendar || showCompanySelector) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showUserMenu, showSearchResults, showCalendar, showCompanySelector]);

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
                <ConectCRMLogoFinal size="sm" variant="full" />
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
              <div className={`sidebar-header-improved flex items-center flex-shrink-0 min-h-[60px] ${sidebarCollapsed ? 'px-2' : 'px-4'}`}>
                {!sidebarCollapsed ? (
                  // Layout quando expandida - design melhorado
                  <div className="flex items-center gap-5 flex-1 min-w-0">
                    <div className="logo-container-improved relative flex-shrink-0">
                      <div className="transform transition-all duration-300 hover:scale-110 hover:rotate-2">
                        <ConectCRMLogoFinal size="sm" variant="icon" />
                      </div>
                      {/* Brilho sutil atrás da logo */}
                      <div className="absolute inset-0 bg-gradient-to-r from-[#159A9C]/10 to-transparent rounded-full blur-xl -z-10 opacity-50"></div>
                    </div>

                    {/* Separador visual elegante */}
                    <div className="h-10 w-px bg-gradient-to-b from-transparent via-[#DEEFE7] to-transparent"></div>

                    <div className="text-container-improved min-w-0 flex-1">
                      <div className="flex flex-col">
                        <div className="brand-name-container relative">
                          <span className="brand-conect text-[#002333] font-black text-xl leading-tight tracking-wider">
                            CONECT
                          </span>
                          <div className="brand-highlight absolute -bottom-0.5 left-0 w-full h-0.5 bg-gradient-to-r from-[#159A9C] via-[#1DB5B8] to-transparent rounded-full"></div>
                        </div>
                        <span className="brand-crm text-[#159A9C] font-bold text-lg leading-tight tracking-wide -mt-0.5">
                          CRM
                        </span>
                      </div>
                      <div className="brand-subtitle text-xs text-[#6B7280] font-semibold tracking-wider mt-1.5 uppercase opacity-80">
                        Gestão Empresarial
                      </div>
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
                  <div className="flex flex-col items-center gap-3 w-full">
                    <div className="relative group">
                      <div className="transform transition-all duration-300 ease-out hover:scale-110 hover:-translate-y-1">
                        <ConectCRMLogoFinal
                          size="sm"
                          variant="icon"
                          className="transition-transform duration-300 ease-out group-hover:scale-125"
                        />
                      </div>
                      <div className="tooltip-improved left-full ml-3 opacity-0 group-hover:opacity-100 bg-gray-800 text-white text-xs rounded-md px-3 py-2 whitespace-nowrap z-[60] shadow-lg">
                        <div className="font-semibold">Conect CRM</div>
                      </div>
                    </div>
                    <button
                      onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                      className="p-1.5 rounded-lg bg-gradient-to-r from-gray-50 to-gray-100 hover:from-blue-50 hover:to-blue-100 border border-gray-200 hover:border-blue-200 shadow-sm transition-all duration-300 ease-out hover:shadow-md hover:scale-110 group"
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
          {/* Gradiente sutil no topo */}
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#159A9C]/20 to-transparent"></div>

          <div className="w-full max-w-[1440px] mx-auto px-4 md:px-6">
            <div className="h-16 flex items-center justify-between">

              {/* Lado Esquerdo: Menu Mobile + Breadcrumb + Status */}
              <div className="flex items-center gap-4">
                <button
                  className="p-2 text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 rounded-lg md:hidden transition-colors"
                  onClick={() => setSidebarOpen(true)}
                >
                  <Menu className="h-5 w-5" />
                </button>

                <div className="flex items-center gap-4">
                  {/* Seção da Empresa */}
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-3">
                      {/* Nome da Empresa com Seletor */}
                      <div className="flex items-center gap-2 relative" data-dropdown="company">
                        <Building2 className="w-5 h-5 text-[#159A9C]" />

                        {/* Botão para trocar empresa */}
                        {userCompanies.length > 1 ? (
                          <button
                            onClick={() => setShowCompanySelector(!showCompanySelector)}
                            className="flex items-center gap-2 text-lg font-bold text-[#159A9C] truncate hover:text-[#0F7B7D] transition-colors group"
                            title="Clique para alternar entre empresas"
                          >
                            <span className="truncate">
                              {formatCompanyName(selectedCompany?.nome || user?.empresa?.nome || 'Sua Empresa Ltda')}
                            </span>
                            <ChevronDown className="w-4 h-4 group-hover:text-[#0F7B7D] transition-colors flex-shrink-0" />
                          </button>
                        ) : (
                          <span className="text-lg font-bold text-[#159A9C] truncate">
                            {formatCompanyName(selectedCompany?.nome || user?.empresa?.nome || 'Sua Empresa Ltda')}
                          </span>
                        )}

                        {/* Dropdown Seletor de Empresas */}
                        {showCompanySelector && userCompanies.length > 1 && (
                          <div className="absolute top-full left-0 mt-2 w-80 bg-white rounded-xl border shadow-xl z-50 overflow-hidden">
                            {/* Header do Seletor */}
                            <div className="p-4 bg-gradient-to-r from-[#159A9C]/5 to-[#0F7B7D]/5 border-b">
                              <div className="flex items-center gap-2">
                                <Building2 className="w-4 h-4 text-[#159A9C]" />
                                <h3 className="text-sm font-semibold text-gray-900">
                                  Alternar Empresa
                                </h3>
                              </div>
                              <p className="text-xs text-gray-600 mt-1">
                                Selecione a empresa para trabalhar
                              </p>
                            </div>

                            {/* Lista de Empresas */}
                            <div className="max-h-64 overflow-y-auto">
                              {userCompanies.map((company) => (
                                <button
                                  key={company.id}
                                  onClick={() => handleCompanySwitch(company)}
                                  className={`w-full p-4 text-left hover:bg-gray-50 transition-colors border-b last:border-b-0 ${selectedCompany?.id === company.id ? 'bg-[#159A9C]/5 border-l-4 border-l-[#159A9C]' : ''
                                    }`}
                                >
                                  <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white text-xs font-bold ${company.isActive ? 'bg-green-500' : 'bg-gray-400'
                                      }`}>
                                      {company.nome.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className={`text-sm font-medium truncate ${selectedCompany?.id === company.id ? 'text-[#159A9C]' : 'text-gray-900'
                                        }`}>
                                        {company.nome}
                                      </p>
                                      <div className="flex items-center gap-2 mt-1">
                                        <span className="text-xs text-gray-500">
                                          {company.cnpj}
                                        </span>
                                        <div className="flex items-center gap-1">
                                          <div className={`w-2 h-2 rounded-full ${company.isActive ? 'bg-green-500' : 'bg-gray-400'
                                            }`}></div>
                                          <span className={`text-xs font-medium ${company.isActive ? 'text-green-600' : 'text-gray-500'
                                            }`}>
                                            {company.isActive ? 'Ativa' : 'Inativa'}
                                          </span>
                                        </div>
                                      </div>
                                      <span className={`inline-block text-xs px-2 py-0.5 rounded-full mt-1 ${company.plano === 'Enterprise' ? 'bg-purple-100 text-purple-700' :
                                        company.plano === 'Professional' ? 'bg-blue-100 text-blue-700' :
                                          'bg-gray-100 text-gray-700'
                                        }`}>
                                        {company.plano}
                                      </span>
                                    </div>
                                    {selectedCompany?.id === company.id && (
                                      <div className="flex-shrink-0">
                                        <div className="w-6 h-6 bg-[#159A9C] rounded-full flex items-center justify-center">
                                          <div className="w-2 h-2 bg-white rounded-full"></div>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </button>
                              ))}
                            </div>

                            {/* Footer com ações */}
                            <div className="p-3 border-t bg-gray-50 space-y-1">
                              <Link
                                to="/empresas/minhas"
                                className="w-full text-xs text-[#159A9C] hover:text-[#0F7B7D] font-medium transition-colors hover:bg-white rounded-lg py-2 block text-center"
                                onClick={() => setShowCompanySelector(false)}
                              >
                                Gerenciar empresas
                              </Link>

                              <div className="grid grid-cols-2 gap-1 mt-2">
                                <Link
                                  to="/configuracoes/empresa"
                                  className="text-xs text-gray-600 hover:text-[#159A9C] transition-colors hover:bg-white rounded-lg py-1.5 px-2 text-center"
                                  onClick={() => setShowCompanySelector(false)}
                                >
                                  Configurações
                                </Link>
                                <Link
                                  to="/configuracoes/chatwoot"
                                  className="text-xs text-gray-600 hover:text-[#159A9C] transition-colors hover:bg-white rounded-lg py-1.5 px-2 text-center"
                                  onClick={() => setShowCompanySelector(false)}
                                >
                                  Chatwoot
                                </Link>
                                <Link
                                  to="/relatorios/analytics"
                                  className="text-xs text-gray-600 hover:text-[#159A9C] transition-colors hover:bg-white rounded-lg py-1.5 px-2 text-center"
                                  onClick={() => setShowCompanySelector(false)}
                                >
                                  Relatórios
                                </Link>
                                <Link
                                  to="/gestao/permissoes"
                                  className="text-xs text-gray-600 hover:text-[#159A9C] transition-colors hover:bg-white rounded-lg py-1.5 px-2 text-center"
                                  onClick={() => setShowCompanySelector(false)}
                                >
                                  Permissões
                                </Link>
                                <Link
                                  to="/sistema/backup"
                                  className="text-xs text-gray-600 hover:text-[#159A9C] transition-colors hover:bg-white rounded-lg py-1.5 px-2 text-center"
                                  onClick={() => setShowCompanySelector(false)}
                                >
                                  Backup
                                </Link>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 truncate hidden sm:block font-medium">
                      Sistema de Gestão Empresarial
                    </p>
                  </div>

                  {/* Separador */}
                  <div className="h-8 w-px bg-gradient-to-b from-transparent via-gray-200 to-transparent hidden md:block"></div>

                  {/* Status Online Melhorado */}
                  <div className="flex items-center gap-3">
                    <div
                      className="flex items-center gap-2 px-3 py-1.5 bg-green-50 border border-green-200 rounded-lg transition-all duration-300 hover:bg-green-100/80"
                      title="Sistema funcionando normalmente"
                    >
                      <div className="relative">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <div className="absolute inset-0 w-2 h-2 bg-green-500 rounded-full animate-ping opacity-75"></div>
                      </div>
                      <span className="text-xs font-medium text-green-700 hidden sm:inline">
                        Online
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Lado Direito: Quick Actions + Busca + Notificações + Avatar */}
              <div className="flex items-center gap-3">

                {/* Quick Actions (apenas em desktop) */}
                <div className="hidden lg:flex items-center gap-2">
                  <button
                    className="p-2 text-gray-500 hover:text-[#159A9C] hover:bg-[#159A9C]/5 rounded-lg transition-all duration-200"
                    title="Novo cliente"
                  >
                    <Users className="h-4 w-4" />
                  </button>
                  <button
                    className="p-2 text-gray-500 hover:text-[#159A9C] hover:bg-[#159A9C]/5 rounded-lg transition-all duration-200"
                    title="Nova proposta"
                  >
                    <ShoppingBag className="h-4 w-4" />
                  </button>

                  {/* Separador */}
                  <div className="h-6 w-px bg-gray-200 mx-1"></div>

                  {/* Calendário */}
                  <div className="relative" data-dropdown="calendar">
                    <button
                      onClick={() => setShowCalendar(!showCalendar)}
                      className="p-2 text-gray-500 hover:text-[#159A9C] hover:bg-[#159A9C]/5 rounded-lg transition-all duration-200 relative group"
                      title="Calendário"
                    >
                      <Calendar className="h-4 w-4" />
                      {/* Badge de eventos hoje */}
                      {getEventsForDate(today).length > 0 && (
                        <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></div>
                      )}
                    </button>

                    {/* Dropdown do Calendário */}
                    {showCalendar && (
                      <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl border shadow-xl z-50 overflow-hidden">
                        {/* Header do Calendário */}
                        <div className="p-4 bg-gradient-to-r from-[#159A9C]/5 to-[#0F7B7D]/5 border-b">
                          <div className="flex items-center justify-between mb-3">
                            <h3 className="text-lg font-semibold text-gray-900">
                              {currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                            </h3>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => navigateMonth('prev')}
                                className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                              >
                                <ChevronLeft className="w-4 h-4 text-gray-600" />
                              </button>
                              <button
                                onClick={() => setCurrentDate(new Date())}
                                className="px-3 py-1.5 text-xs font-medium text-[#159A9C] hover:bg-[#159A9C]/10 rounded-lg transition-colors"
                              >
                                Hoje
                              </button>
                              <button
                                onClick={() => navigateMonth('next')}
                                className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                              >
                                <ChevronRight className="w-4 h-4 text-gray-600" />
                              </button>
                            </div>
                          </div>

                          {/* Data Atual */}
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Clock className="w-4 h-4" />
                            <span>{formatDateForDisplay(today)}</span>
                          </div>
                        </div>

                        {/* Grid do Calendário */}
                        <div className="p-4">
                          {/* Dias da Semana */}
                          <div className="grid grid-cols-7 gap-1 mb-2">
                            {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
                              <div key={day} className="text-xs font-medium text-gray-500 text-center py-2">
                                {day}
                              </div>
                            ))}
                          </div>

                          {/* Dias do Mês */}
                          <div className="grid grid-cols-7 gap-1">
                            {/* Dias vazios do início do mês */}
                            {Array.from({ length: getFirstDayOfMonth(currentDate) }).map((_, index) => (
                              <div key={`empty-${index}`} className="h-8"></div>
                            ))}

                            {/* Dias do mês */}
                            {Array.from({ length: getDaysInMonth(currentDate) }).map((_, index) => {
                              const day = index + 1;
                              const dateObj = new Date(currentYear, currentMonth, day);
                              const isToday = isSameDay(dateObj, today);
                              const isSelected = isSameDay(dateObj, selectedDate);
                              const dayEvents = getEventsForDate(dateObj);
                              const hasEvents = dayEvents.length > 0;

                              return (
                                <button
                                  key={day}
                                  onClick={() => setSelectedDate(dateObj)}
                                  className={`
                                  relative h-8 w-8 text-xs rounded-lg font-medium transition-all duration-200 hover:bg-gray-100
                                  ${isToday ? 'bg-[#159A9C] text-white hover:bg-[#0F7B7D]' : ''}
                                  ${isSelected && !isToday ? 'bg-blue-100 text-blue-700' : ''}
                                  ${!isToday && !isSelected ? 'text-gray-700 hover:text-gray-900' : ''}
                                `}
                                >
                                  {day}
                                  {hasEvents && (
                                    <div className={`absolute bottom-0.5 left-1/2 transform -translate-x-1/2 w-1 h-1 rounded-full ${isToday ? 'bg-white' : 'bg-[#159A9C]'}`}></div>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Eventos do Dia Selecionado */}
                        {getEventsForDate(selectedDate).length > 0 && (
                          <div className="border-t bg-gray-50 p-4">
                            <div className="flex items-center gap-2 mb-3">
                              <Calendar className="w-4 h-4 text-[#159A9C]" />
                              <span className="text-sm font-medium text-gray-700">
                                Eventos de {selectedDate.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })}
                              </span>
                            </div>
                            <div className="space-y-2 max-h-32 overflow-y-auto">
                              {getEventsForDate(selectedDate).map(event => (
                                <div key={event.id} className="flex items-center gap-3 p-2 bg-white rounded-lg border hover:border-gray-300 transition-colors cursor-pointer">
                                  <div className={`w-3 h-3 rounded-full ${event.color === 'blue' ? 'bg-blue-500' :
                                    event.color === 'green' ? 'bg-green-500' :
                                      event.color === 'purple' ? 'bg-purple-500' :
                                        'bg-orange-500'
                                    }`}></div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs font-medium text-gray-900 truncate">
                                      {event.title}
                                    </p>
                                    <div className="flex items-center gap-1 mt-1">
                                      <Clock className="w-3 h-3 text-gray-400" />
                                      <span className="text-xs text-gray-500">{event.time}</span>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Resumo de Próximos Eventos */}
                        <div className="border-t p-4">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                              Próximos Eventos
                            </span>
                            <span className="text-xs text-[#159A9C] bg-[#159A9C]/10 px-2 py-1 rounded-full">
                              {events.filter(event => event.date >= today).length} eventos
                            </span>
                          </div>

                          <div className="mt-3 space-y-2">
                            {events
                              .filter(event => event.date >= today)
                              .slice(0, 2)
                              .map(event => (
                                <div key={event.id} className="flex items-center gap-2 text-xs">
                                  <div className={`w-2 h-2 rounded-full ${event.color === 'blue' ? 'bg-blue-500' :
                                    event.color === 'green' ? 'bg-green-500' :
                                      event.color === 'purple' ? 'bg-purple-500' :
                                        'bg-orange-500'
                                    }`}></div>
                                  <span className="text-gray-600 truncate flex-1">
                                    {event.title}
                                  </span>
                                  <span className="text-gray-400">
                                    {event.date.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })}
                                  </span>
                                </div>
                              ))}
                          </div>

                          <button className="w-full mt-3 text-xs text-[#159A9C] hover:text-[#0F7B7D] font-medium transition-colors hover:bg-[#159A9C]/5 rounded-lg py-2">
                            Ver agenda completa
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>                {/* Campo de Busca Melhorado */}
                <div className="relative hidden md:block" data-dropdown="search">
                  <div className="relative">
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
                      placeholder="Buscar clientes, propostas..."
                      className="w-72 pl-10 pr-16 py-2.5 border border-gray-200 rounded-xl bg-gray-50/80 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#159A9C]/20 focus:border-[#159A9C]/50 focus:bg-white text-sm transition-all hover:bg-gray-50"
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                      <div className="flex items-center gap-1">
                        <kbd className="inline-flex items-center px-2 py-1 border border-gray-300 rounded-md text-xs bg-white text-gray-600 font-medium shadow-sm">
                          ⌘K
                        </kbd>
                      </div>
                    </div>

                    {/* Dropdown de Resultados - Melhorado */}
                    {showSearchResults && (
                      <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl border shadow-xl z-50 overflow-hidden">
                        <div className="p-4 border-b bg-gradient-to-r from-gray-50 to-white">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-700">
                              Resultados para "{searchQuery}"
                            </span>
                            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
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
                              <div key={result.id} className="p-3 hover:bg-gray-50 cursor-pointer transition-colors border-b last:border-b-0 group">
                                <div className="flex items-center gap-3">
                                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-white text-xs font-medium transition-transform group-hover:scale-105 ${result.type === 'cliente' ? 'bg-blue-500' :
                                    result.type === 'proposta' ? 'bg-green-500' :
                                      'bg-purple-500'
                                    }`}>
                                    {result.type === 'cliente' ? 'C' :
                                      result.type === 'proposta' ? 'P' : 'CT'}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900 truncate group-hover:text-[#159A9C] transition-colors">
                                      {result.title}
                                    </p>
                                    <p className="text-xs text-gray-500 truncate">
                                      {result.subtitle}
                                    </p>
                                  </div>
                                  <div className="text-xs text-gray-400 capitalize bg-gray-100 px-2 py-1 rounded-full">
                                    {result.type}
                                  </div>
                                </div>
                              </div>
                            ))}

                          {searchResults.filter(result =>
                            result.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            result.subtitle.toLowerCase().includes(searchQuery.toLowerCase())
                          ).length === 0 && (
                              <div className="p-8 text-center">
                                <Search className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                                <p className="text-sm text-gray-500 font-medium">Nenhum resultado encontrado</p>
                                <p className="text-xs text-gray-400 mt-1">Tente usar outros termos de busca</p>
                              </div>
                            )}
                        </div>

                        <div className="p-3 border-t bg-gray-50">
                          <button className="w-full text-sm text-[#159A9C] hover:text-[#0F7B7D] font-medium transition-colors hover:bg-white rounded-lg py-2">
                            Ver todos os resultados
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Notificações - Sistema Novo */}
                <NotificationCenter className="relative" />

                {/* Avatar/Menu do Usuário Melhorado */}
                <div className="relative" data-dropdown="user-menu">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center gap-2 p-2 rounded-xl hover:bg-gray-100/80 transition-all duration-200 group"
                    title={`${formatUserName(user?.nome || 'Admin Sistema')}`}
                  >
                    <div className="relative">
                      <div className="w-9 h-9 bg-gradient-to-br from-[#159A9C] to-[#0F7B7D] rounded-full flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow">
                        <User className="w-4 h-4 text-white" />
                      </div>
                      {/* Indicador de status online */}
                      <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                    </div>
                    <div className="hidden sm:flex flex-col items-start min-w-0">
                      <span className="text-sm font-medium text-gray-900 truncate max-w-24">
                        {formatUserName(user?.nome || 'Admin')}
                      </span>
                      <span className="text-xs text-gray-500 truncate max-w-24">
                        {user?.role || 'Administrador'}
                      </span>
                    </div>
                    <ChevronDown className="w-3 h-3 text-gray-400 hidden sm:block group-hover:text-gray-600 transition-colors" />
                  </button>

                  {/* Dropdown do Usuário - Design Premium */}
                  {showUserMenu && (
                    <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-xl border shadow-xl z-50 overflow-hidden">
                      {/* Header do Profile Melhorado */}
                      <div className="p-4 bg-gradient-to-r from-[#159A9C]/5 to-[#0F7B7D]/5 border-b">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <div className="w-12 h-12 bg-gradient-to-br from-[#159A9C] to-[#0F7B7D] rounded-full flex items-center justify-center shadow-lg">
                              <User className="w-6 h-6 text-white" />
                            </div>
                            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-900 truncate">
                              {formatUserName(user?.nome || 'Admin Sistema')}
                            </p>
                            <p className="text-sm text-gray-600 truncate">
                              {user?.email || 'admin@conectcrm.com'}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs text-[#159A9C] font-medium bg-[#159A9C]/10 px-2 py-0.5 rounded-full">
                                {user?.role || 'Administrador'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Menu de ações */}
                      <div className="py-2">
                        <button className="w-full px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors group">
                          <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                            <User className="w-4 h-4 text-blue-600" />
                          </div>
                          <div>
                            <div className="font-medium">Meu Perfil</div>
                            <div className="text-xs text-gray-500">Informações pessoais</div>
                          </div>
                        </button>

                        <Link
                          to="/empresas/minhas"
                          className="w-full px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors group"
                          onClick={() => setShowUserMenu(false)}
                        >
                          <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center group-hover:bg-emerald-100 transition-colors">
                            <Building2 className="w-4 h-4 text-emerald-600" />
                          </div>
                          <div>
                            <div className="font-medium">Minhas Empresas</div>
                            <div className="text-xs text-gray-500">Gerenciar e alternar empresas</div>
                          </div>
                        </Link>

                        <Link
                          to="/configuracoes/chatwoot"
                          className="w-full px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors group"
                          onClick={() => setShowUserMenu(false)}
                        >
                          <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center group-hover:bg-green-100 transition-colors">
                            <MessageCircle className="w-4 h-4 text-green-600" />
                          </div>
                          <div>
                            <div className="font-medium">Chatwoot</div>
                            <div className="text-xs text-gray-500">Configurar integração WhatsApp</div>
                          </div>
                        </Link>

                        <button className="w-full px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors group">
                          <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center group-hover:bg-purple-100 transition-colors">
                            <Settings className="w-4 h-4 text-purple-600" />
                          </div>
                          <div>
                            <div className="font-medium">Configurações</div>
                            <div className="text-xs text-gray-500">Preferências do sistema</div>
                          </div>
                        </button>

                        {/* Seletor de Idioma Melhorado */}
                        <div className="px-4 py-2 border-t border-gray-100 mt-2">
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Preferências</span>
                          </div>
                          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors group">
                            <span className="text-xl">🇧🇷</span>
                            <div className="flex-1">
                              <div className="text-sm font-medium text-gray-700">Português (Brasil)</div>
                              <div className="text-xs text-gray-500">Idioma do sistema</div>
                            </div>
                            <ChevronDown className="w-3 h-3 text-gray-400 group-hover:text-gray-600 transition-colors" />
                          </div>
                        </div>

                        <Link
                          to="/suporte"
                          className="w-full px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors group"
                          onClick={() => setShowUserMenu(false)}
                        >
                          <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center group-hover:bg-green-100 transition-colors">
                            <HelpCircle className="w-4 h-4 text-green-600" />
                          </div>
                          <div>
                            <div className="font-medium">Ajuda e Suporte</div>
                            <div className="text-xs text-gray-500">Central de ajuda</div>
                          </div>
                        </Link>
                      </div>

                      {/* Ações críticas */}
                      <div className="border-t border-gray-100 p-2">
                        <button
                          onClick={handleLogout}
                          className="w-full px-4 py-3 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-3 transition-colors rounded-lg group"
                        >
                          <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center group-hover:bg-red-100 transition-colors">
                            <LogOut className="w-4 h-4 text-red-600" />
                          </div>
                          <div>
                            <div className="font-medium">Sair do Sistema</div>
                            <div className="text-xs text-red-400">Encerrar sessão</div>
                          </div>
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

      {/* Widget de Suporte Flutuante */}
      <SupportWidget
        position="bottom-right"
        hideOnPages={['/suporte']} // Não mostrar na própria página de suporte
      />
    </div>
  );
};

export default DashboardLayout;
