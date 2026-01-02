import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useI18n } from '../../contexts/I18nContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useProfile } from '../../contexts/ProfileContext';
import { useSidebar } from '../../contexts/SidebarContext';
import { useWebSocketStatus } from '../../contexts/WebSocketContext';
import { formatCompanyName, formatUserName } from '../../utils/textUtils';
import HierarchicalNavGroup from '../navigation/HierarchicalNavGroup';
import { menuConfig, getMenuParaEmpresa } from '../../config/menuConfig';
import { useModulosAtivos } from '../../hooks/useModuloAtivo';
import NotificationCenter from '../notifications/NotificationCenter';
import ConectCRMLogoFinal from '../ui/ConectCRMLogoFinal';
import LanguageSelector from '../common/LanguageSelector';
import searchService, { SearchResult } from '../../services/searchService';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Menu,
  X,
  Users,
  Settings,
  LogOut,
  Search,
  User,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Building2,
  MessageCircle,
  Mail,
} from 'lucide-react';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const formatCnpj = (cnpj?: string): string => {
  if (!cnpj) {
    return '';
  }

  const digits = cnpj.replace(/\D/g, '');
  if (digits.length !== 14) {
    return cnpj;
  }

  return digits.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
};

const ROLE_LABELS: Record<string, string> = {
  superadmin: 'Super Admin',
  admin: 'Administrador',
  manager: 'Gestor',
  vendedor: 'Vendedor',
  user: 'Usuário',
};

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { sidebarCollapsed, setSidebarCollapsed } = useSidebar();
  const [showProfileSelector, setShowProfileSelector] = useState(false);
  const [showLanguageSelector, setShowLanguageSelector] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { user, logout } = useAuth();
  const { t, language, availableLanguages } = useI18n();

  // 🔌 WebSocket Status para NotificationIndicator
  const { connected: wsConnected, error: wsError, reconnect: wsReconnect } = useWebSocketStatus();

  const { currentPalette } = useTheme();
  const { perfilSelecionado, setPerfilSelecionado } = useProfile();
  const location = useLocation();
  const navigate = useNavigate();

  // ⚡ LICENCIAMENTO: Buscar módulos ativos da empresa
  const [modulosAtivos, loadingModulos] = useModulosAtivos();

  // ⚡ LICENCIAMENTO: Filtrar menu baseado nos módulos ativos
  const menuFiltrado = useMemo(() => {
    if (loadingModulos) return []; // Não mostrar menu enquanto carrega
    return getMenuParaEmpresa(modulosAtivos);
  }, [modulosAtivos, loadingModulos]);

  const roleKey = (user?.role || '').toLowerCase();
  const displayRole =
    ROLE_LABELS[roleKey] || (user?.role ? formatUserName(user.role) : 'Administrador');

  // Verificação se é admin
  const isAdmin =
    roleKey === 'superadmin' || roleKey === 'admin' || roleKey === 'manager' || user?.email?.includes('admin');

  const lastLoginRaw =
    (user as any)?.ultimo_login ??
    (user as any)?.ultimoLogin ??
    (user as any)?.lastLoginAt ??
    (user as any)?.last_login;
  const lastLoginDate = lastLoginRaw ? new Date(lastLoginRaw) : null;
  const lastLoginText =
    lastLoginDate && !Number.isNaN(lastLoginDate.getTime())
      ? formatDistanceToNow(lastLoginDate, { addSuffix: true, locale: ptBR })
      : null;
  const lastLoginLabel = lastLoginText
    ? `Último acesso ${lastLoginText}`
    : lastLoginRaw
      ? 'Último acesso indisponível'
      : 'Nunca acessou';

  const rawAppVersion =
    (typeof window !== 'undefined' && (window as any)?.__APP_VERSION__) ??
    process.env.REACT_APP_APP_VERSION ??
    process.env.REACT_APP_VERSION;
  const appVersion = rawAppVersion
    ? rawAppVersion.toLowerCase().startsWith('v')
      ? rawAppVersion
      : `v${rawAppVersion}`
    : null;

  const companyCardName = user?.empresa?.nome ? formatCompanyName(user.empresa.nome) : null;
  const companyPlanLabel = user?.empresa?.plano ? formatUserName(user.empresa.plano) : null;
  const companyCardCnpj = user?.empresa?.cnpj ? formatCnpj(user.empresa.cnpj) : null;

  const handleNavigate = (path: string) => {
    setShowUserMenu(false);
    setShowProfileSelector(false);
    setShowLanguageSelector(false);
    navigate(path);
  };

  // Perfis disponíveis para o seletor
  const availableProfiles = [
    {
      id: 'administrador' as const,
      nome: 'Administrador',
      descricao: 'Acesso total ao sistema',
    },
    {
      id: 'gerente' as const,
      nome: 'Gerente',
      descricao: 'Gestão de equipes e relatórios',
    },
    {
      id: 'vendedor' as const,
      nome: 'Vendedor',
      descricao: 'Gestão de vendas e clientes',
    },
    {
      id: 'operacional' as const,
      nome: 'Operacional',
      descricao: 'Operações e processos',
    },
    {
      id: 'financeiro' as const,
      nome: 'Financeiro',
      descricao: 'Gestão financeira',
    },
    {
      id: 'suporte' as const,
      nome: 'Suporte',
      descricao: 'Atendimento ao cliente',
    },
  ];

  const getTipoColor = (tipo: string) => {
    switch (tipo) {
      case 'administrador':
        return 'bg-red-100 text-red-800';
      case 'gerente':
        return 'bg-blue-100 text-blue-800';
      case 'vendedor':
        return 'bg-green-100 text-green-800';
      case 'operacional':
        return 'bg-purple-100 text-purple-800';
      case 'financeiro':
        return 'bg-yellow-100 text-yellow-800';
      case 'suporte':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getCurrentProfile = () => {
    return availableProfiles.find((p) => p.id === perfilSelecionado) || availableProfiles[0];
  };

  const handleProfileSelect = (profileId: string) => {
    setPerfilSelecionado(profileId as any);
    setShowProfileSelector(false);
  };

  // ✨ Mac Dock Magnification Effect
  const [mouseY, setMouseY] = useState<number | null>(null);
  const sidebarItemsRef = useRef<(HTMLElement | null)[]>([]);

  const handleMouseMoveSidebar = (e: React.MouseEvent<HTMLDivElement>) => {
    const sidebar = e.currentTarget;
    const rect = sidebar.getBoundingClientRect();
    setMouseY(e.clientY - rect.top);
  };

  const handleMouseLeaveSidebar = () => {
    setMouseY(null);
  };

  const getDockScale = (index: number): number => {
    if (mouseY === null) return 1;

    const element = sidebarItemsRef.current[index];
    if (!element) return 1;

    const rect = element.getBoundingClientRect();
    const elementCenter = rect.top + rect.height / 2 - element.closest('.h-full')!.getBoundingClientRect().top;

    const distance = Math.abs(mouseY - elementCenter);
    const maxDistance = 120; // Distância máxima de influência

    if (distance > maxDistance) return 1;

    // Escala baseada na distância (mais perto = maior)
    // Hover direto: 1.6x, adjacente: 1.3x, longe: 1.0x
    const scale = 1 + (1 - distance / maxDistance) * 0.6;
    return Math.max(1, Math.min(1.6, scale));
  };

  // Fechar menus ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;

      // Fechar menu do usuário se clicado fora (mas não quando clicamos no seletor de perfil)
      if (!target.closest('[data-user-menu]') && !target.closest('[data-profile-selector]')) {
        setShowUserMenu(false);
      }

      // Fechar seletor de perfil se clicado fora
      if (!target.closest('[data-profile-selector]')) {
        setShowProfileSelector(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Mapeamento de rotas para títulos dinâmicos
  const getPageInfo = (pathname: string) => {
    const routeMap: Record<string, { title: string; subtitle: string }> = {
      '/dashboard': {
        title: t('navigation.dashboard'),
        subtitle: t('dashboard.subtitle'),
      },
      '/nuclei/principal': {
        title: t('navigation.main'),
        subtitle: t('navigation.mainModules'),
      },
      '/nuclei/crm': {
        title: 'CRM',
        subtitle: t('navigation.customerManagement'),
      },
      '/nuclei/vendas': {
        title: t('navigation.sales'),
        subtitle: t('navigation.salesProposals'),
      },
      '/nuclei/financeiro': {
        title: t('navigation.financial'),
        subtitle: t('navigation.financialControl'),
      },
      '/nuclei/configuracoes': {
        title: t('navigation.settings'),
        subtitle: t('navigation.systemSettings'),
      },
      '/nuclei/administracao': {
        title: 'Administração',
        subtitle: 'Gestão empresarial e controle administrativo',
      },
      '/clientes': {
        title: 'Clientes',
        subtitle: 'Gerencie seus clientes e contatos',
      },
      '/propostas': {
        title: 'Propostas',
        subtitle: 'Acompanhe suas propostas comerciais',
      },
      '/produtos': {
        title: 'Produtos',
        subtitle: 'Catálogo de produtos e serviços',
      },
      '/combos': {
        title: 'Combos',
        subtitle: 'Gestão de combos e pacotes de produtos',
      },
      '/combos/novo': {
        title: 'Novo Combo',
        subtitle: 'Criar um novo combo de produtos',
      },
      '/financeiro/contas-receber': {
        title: 'Contas a Receber',
        subtitle: 'Gestão de recebimentos e inadimplência',
      },
      '/financeiro/contas-pagar': {
        title: 'Contas a Pagar',
        subtitle: 'Controle de pagamentos e fornecedores',
      },
      '/financeiro/fluxo-caixa': {
        title: 'Fluxo de Caixa',
        subtitle: 'Acompanhamento de entradas e saídas',
      },
      '/faturamento': {
        title: 'Faturamento',
        subtitle: 'Gerencie faturas, cobranças e recebimentos',
      },
      '/financeiro/faturamento': {
        title: 'Faturamento',
        subtitle: 'Gerencie faturas, cobranças e recebimentos',
      },
      '/billing': {
        title: 'Billing & Assinaturas',
        subtitle: 'Gerencie sua assinatura, planos e faturamento',
      },
      '/atendimento': {
        title: 'Atendimento Omnichannel',
        subtitle: 'Chat em tempo real • WebSocket • Multi-canal',
      },
      '/suporte': {
        title: 'Suporte',
        subtitle: 'Central de ajuda e atendimento ao cliente',
      },
      '/configuracoes': {
        title: 'Configurações',
        subtitle: 'Configurações do sistema',
      },
      '/admin/empresas': {
        title: 'Gestão de Empresas',
        subtitle: 'Administração e monitoramento de empresas',
      },
      '/empresas/minhas': {
        title: 'Minhas Empresas',
        subtitle: 'Gerencie suas empresas e alterne entre elas',
      },
      '/configuracoes/empresa': {
        title: 'Configurações da Empresa',
        subtitle: 'Configurações específicas da empresa ativa',
      },
      '/configuracoes/departamentos': {
        title: 'Gestão de Departamentos',
        subtitle: 'Configure departamentos de atendimento e organize sua equipe',
      },
      '/configuracoes/metas': {
        title: 'Metas Comerciais',
        subtitle: 'Defina e gerencie metas de vendas por período, vendedor ou região',
      },
      '/relatorios/analytics': {
        title: 'Relatórios e Analytics',
        subtitle: 'Análise detalhada de performance e resultados',
      },
      '/gestao/usuarios': {
        title: 'Gestão de Usuários',
        subtitle: 'Gerencie usuários, permissões e atendentes do sistema',
      },
      '/sistema/backup': {
        title: 'Backup e Sincronização',
        subtitle: 'Gerencie backups e sincronize dados entre empresas',
      },
    };

    return (
      routeMap[pathname] || {
        title: 'Conect CRM',
        subtitle: 'Sistema de gestão empresarial',
      }
    );
  };

  const currentPage = getPageInfo(location.pathname);

  // Estados para funcionalidades da barra superior
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Estados para sistema de busca
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);

  // Debounce da busca
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchQuery.length >= 2) {
        setSearchLoading(true);
        try {
          const results = await searchService.searchGlobal(searchQuery);
          setSearchResults(results);
          setShowSearchResults(true);
        } catch (error) {
          console.error('Erro na busca:', error);
          setSearchResults([]);
        } finally {
          setSearchLoading(false);
        }
      } else {
        setSearchResults([]);
        setShowSearchResults(false);
      }
    }, 300); // 300ms de debounce

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const companyName = formatCompanyName(user?.empresa?.nome || 'Sua Empresa Ltda');
  const companyCnpj = formatCnpj(user?.empresa?.cnpj);
  const companyIdentifier = companyCnpj || user?.empresa?.slug?.toUpperCase();
  const companyPlan = user?.empresa?.plano;

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
        const searchInput = document.querySelector(
          'input[placeholder*="Buscar"]',
        ) as HTMLInputElement;
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
        <div
          className="fixed inset-0 bg-gray-600 bg-opacity-75"
          onClick={() => setSidebarOpen(false)}
        />

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
            <HierarchicalNavGroup menuItems={menuFiltrado} sidebarCollapsed={false} />
          </div>
        </div>
      </div>

      {/* Sidebar para desktop - Duas colunas: Barra fixa + Painel suspenso */}
      <div className="hidden md:flex md:flex-shrink-0 relative">
        {/* Barra de Ícones Fixa (Coluna 1) com Efeito Mac Dock */}
        <div
          className="flex flex-col w-[75px] bg-[#002333] border-r border-[#001a26] relative z-20 shadow-lg"
          onMouseMove={handleMouseMoveSidebar}
          onMouseLeave={handleMouseLeaveSidebar}
        >
          <div className="flex flex-col h-full">
            <div className="flex-1 flex flex-col pt-4 pb-4 overflow-y-auto">
              {/* Logo no topo com Efeito Dock */}
              <div className="flex items-center justify-center flex-shrink-0 mb-3 px-2">
                <div
                  ref={(el) => {
                    if (el) sidebarItemsRef.current[0] = el;
                  }}
                  style={{
                    transform: `scale(${getDockScale(0)})`,
                    transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                  }}
                >
                  <ConectCRMLogoFinal size="sm" variant="icon" />
                </div>
              </div>

              {/* Separador sutil */}
              <div className="mx-3 mb-3 border-t border-white/10"></div>

              {/* Navegação de Ícones Verticais */}
              <div className="flex-1 flex flex-col">
                <HierarchicalNavGroup
                  menuItems={menuFiltrado}
                  sidebarCollapsed={false}
                />
              </div>

              {/* Ações rápidas - modo ícone com Efeito Dock */}
              <div className="mt-auto pt-3 px-2 border-t border-white/10">
                <div className="flex flex-col items-center gap-2">
                  <Link
                    to="/suporte"
                    ref={(el) => {
                      if (el) sidebarItemsRef.current[1] = el;
                    }}
                    className="flex flex-col items-center justify-center w-full py-2 rounded-lg text-white/70 hover:text-white hover:bg-white/5 group"
                    style={{
                      transform: `scale(${getDockScale(1)})`,
                      transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                    }}
                    title="Central de ajuda"
                  >
                    <MessageCircle className="h-5 w-5 mb-1" />
                    <span className="text-[9px] font-semibold uppercase tracking-wide">Ajuda</span>
                  </Link>
                  <a
                    href="mailto:suporte@conectcrm.com"
                    ref={(el) => {
                      if (el) sidebarItemsRef.current[2] = el;
                    }}
                    className="flex flex-col items-center justify-center w-full py-2 rounded-lg bg-[#159A9C]/20 text-[#159A9C] hover:bg-[#159A9C]/30 group"
                    style={{
                      transform: `scale(${getDockScale(2)})`,
                      transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                    }}
                    title="Abrir chamado"
                  >
                    <Mail className="h-4 w-4 mb-1" />
                    <span className="text-[9px] font-semibold uppercase tracking-wide">Suporte</span>
                  </a>
                </div>
              </div>
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

          <div className="w-full px-4 md:px-6">
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
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#159A9C]/10 text-[#159A9C] shadow-inner">
                      <Building2 className="h-5 w-5" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-lg font-bold text-[#159A9C] truncate">
                        {companyName}
                      </span>
                      <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-[#4B5563]">
                        {companyIdentifier && (
                          <span className="font-semibold tracking-wide text-[#002333]/70 uppercase">
                            {companyIdentifier}
                          </span>
                        )}
                        {companyPlan && (
                          <>
                            {companyIdentifier && (
                              <span className="text-[#B4BEC9]" aria-hidden="true">
                                •
                              </span>
                            )}
                            <span className="font-medium text-[#159A9C] uppercase">
                              Plano {companyPlan.toUpperCase()}
                            </span>
                          </>
                        )}
                      </div>
                      <span className="text-xs text-[#4B5563] mt-1">
                        Sistema de Gestão Empresarial
                      </span>
                    </div>
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

              {/* Lado Direito: Busca + Notificações + Avatar */}
              <div className="flex items-center gap-3">
                {/* Campo de Busca Melhorado */}
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
                              {searchLoading ? 'Buscando...' : `Resultados para "${searchQuery}"`}
                            </span>
                            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                              {searchResults.length} encontrado
                              {searchResults.length !== 1 ? 's' : ''}
                            </span>
                          </div>
                        </div>

                        <div className="max-h-80 overflow-y-auto">
                          {searchLoading ? (
                            <div className="p-8 text-center">
                              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#159A9C] mx-auto"></div>
                              <p className="text-sm text-gray-500 mt-3">Buscando...</p>
                            </div>
                          ) : searchResults.length > 0 ? (
                            searchResults.map((result) => (
                              <div
                                key={result.id}
                                className="p-3 hover:bg-gray-50 cursor-pointer transition-colors border-b last:border-b-0 group"
                              >
                                <div className="flex items-center gap-3">
                                  <div
                                    className={`w-9 h-9 rounded-lg flex items-center justify-center text-white text-xs font-medium transition-transform group-hover:scale-105 ${result.type === 'cliente'
                                      ? 'bg-blue-500'
                                      : result.type === 'proposta'
                                        ? 'bg-green-500'
                                        : 'bg-purple-500'
                                      }`}
                                  >
                                    {result.type === 'cliente'
                                      ? 'C'
                                      : result.type === 'proposta'
                                        ? 'P'
                                        : 'CT'}
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
                            ))
                          ) : (
                            <div className="p-8 text-center">
                              <Search className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                              <p className="text-sm text-gray-500 font-medium">
                                Nenhum resultado encontrado
                              </p>
                              <p className="text-xs text-gray-400 mt-1">
                                Tente usar outros termos de busca
                              </p>
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
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setShowUserMenu(!showUserMenu)}
                      className="flex items-center gap-2 p-2 rounded-xl hover:bg-gray-100/80 transition-all duration-200 group"
                      title={`${formatUserName(user?.nome || 'Admin Sistema')}`}
                      data-user-menu
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
                          {displayRole}
                        </span>
                      </div>
                      <ChevronDown className="w-3 h-3 text-gray-400 hidden sm:block group-hover:text-gray-600 transition-colors" />
                    </button>
                  </div>

                  {/* Dropdown do Usuário - Design Premium Compacto */}
                  {showUserMenu && (
                    <div
                      className="absolute right-0 top-full mt-2 w-72 bg-white rounded-xl border shadow-xl z-40 overflow-visible"
                      data-user-menu
                    >
                      {/* Header do Profile Compacto */}
                      <div className="p-4 bg-gradient-to-r from-[#159A9C]/5 to-[#0F7B7D]/5 border-b">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <div className="w-10 h-10 bg-gradient-to-br from-[#159A9C] to-[#0F7B7D] rounded-full flex items-center justify-center shadow-lg">
                              <User className="w-5 h-5 text-white" />
                            </div>
                            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-900 truncate text-sm">
                              {formatUserName(user?.nome || 'Admin Sistema')}
                            </p>
                            <p className="text-xs text-gray-600 truncate">
                              {user?.email || 'admin@conectsuite.com.br'}
                            </p>
                            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                              <span className="text-xs text-[#159A9C] font-medium bg-[#159A9C]/10 px-1.5 py-0.5 rounded-full">
                                {displayRole}
                              </span>
                              <span className="text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded-full">
                                Online
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Informações adicionais compactas */}
                        <div className="mt-2 pt-2 border-t border-gray-200/50">
                          <div className="flex flex-col gap-1 text-xs text-gray-500 sm:flex-row sm:items-center sm:justify-between">
                            <span>{lastLoginLabel}</span>
                            {appVersion && (
                              <span className="text-[#159A9C] font-medium">{appVersion}</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* SEÇÃO PERFIL */}
                      <div className="py-1">
                        <div className="px-4 py-1.5">
                          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                            Perfil
                          </span>
                        </div>

                        <Link
                          to="/perfil"
                          className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-blue-25 flex items-center gap-3 transition-all duration-200 group"
                          onClick={() => setShowUserMenu(false)}
                        >
                          <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center group-hover:bg-blue-100 group-hover:scale-105 transition-all duration-200">
                            <User className="w-4 h-4 text-blue-600" />
                          </div>
                          <div className="flex-1">
                            <div className="font-medium text-gray-900 text-sm">Meu Perfil</div>
                            <div className="text-xs text-gray-500">Informações pessoais</div>
                          </div>
                        </Link>

                        {/* Seletor de Perfil - Apenas para Administradores */}
                        {isAdmin && (
                          <div className="relative" data-profile-selector>
                            <button
                              onClick={() => setShowProfileSelector(!showProfileSelector)}
                              className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gradient-to-r hover:from-teal-50 hover:to-teal-25 flex items-center gap-3 transition-all duration-200 group"
                            >
                              <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center group-hover:bg-teal-100 group-hover:scale-105 transition-all duration-200">
                                <Users className="w-4 h-4 text-teal-600" />
                              </div>
                              <div className="flex-1">
                                <div className="font-medium text-gray-900 flex items-center gap-1.5 text-sm">
                                  Alterar Perfil
                                  <ChevronDown
                                    className={`w-3 h-3 text-gray-400 transition-transform ${showProfileSelector ? 'rotate-180' : ''}`}
                                  />
                                </div>
                                <div className="text-xs text-gray-500 flex items-center gap-1">
                                  <span
                                    className={`px-1.5 py-0.5 rounded text-xs font-medium ${getTipoColor(perfilSelecionado)}`}
                                  >
                                    {getCurrentProfile().nome}
                                  </span>
                                </div>
                              </div>
                            </button>

                            {/* Dropdown de perfis - Abre ao lado */}
                            {showProfileSelector && (
                              <div
                                className="absolute right-full top-0 mr-3 w-72 bg-white border border-gray-200 rounded-xl shadow-xl z-[60] overflow-hidden"
                                data-profile-selector
                                style={{
                                  display: 'block',
                                  backgroundColor: 'white',
                                  border: '1px solid #e5e7eb',
                                  boxShadow:
                                    '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                                }}
                              >
                                {/* Header do dropdown compacto */}
                                <div className="p-3 bg-gradient-to-r from-[#159A9C]/5 to-[#0F7B7D]/5 border-b">
                                  <div className="flex items-center gap-2">
                                    <Users className="w-4 h-4 text-[#159A9C]" />
                                    <h3 className="font-semibold text-gray-900 text-sm">
                                      Selecionar Perfil
                                    </h3>
                                  </div>
                                  <p className="text-xs text-gray-600 mt-1">
                                    Atual:{' '}
                                    <span
                                      className={`px-1.5 py-0.5 rounded-full text-xs font-medium ${getTipoColor(perfilSelecionado)}`}
                                    >
                                      {getCurrentProfile().nome}
                                    </span>
                                  </p>
                                </div>

                                {/* Lista de perfis compacta */}
                                <div className="max-h-64 overflow-y-auto">
                                  {availableProfiles.map((profile) => (
                                    <button
                                      key={profile.id}
                                      onClick={() => handleProfileSelect(profile.id)}
                                      className={`w-full p-3 text-left hover:bg-gray-50 transition-all duration-200 border-l-4 group ${perfilSelecionado === profile.id
                                        ? 'bg-blue-50 border-blue-500 shadow-sm'
                                        : 'border-transparent hover:border-gray-200'
                                        }`}
                                    >
                                      <div className="flex items-center justify-between">
                                        <div className="flex-1 min-w-0">
                                          <div className="font-medium text-gray-900 flex items-center gap-1.5 text-sm">
                                            {profile.nome}
                                            {perfilSelecionado === profile.id && (
                                              <span className="text-xs text-blue-600 font-medium flex items-center gap-1">
                                                <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
                                                Ativo
                                              </span>
                                            )}
                                          </div>
                                          <div className="text-xs text-gray-500 mt-0.5">
                                            {profile.descricao}
                                          </div>
                                        </div>
                                        <span
                                          className={`text-xs px-2 py-0.5 rounded-full ${getTipoColor(profile.id)} ml-2 group-hover:scale-105 transition-transform`}
                                        >
                                          {profile.nome}
                                        </span>
                                      </div>
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* SEPARADOR */}
                      <div className="border-t border-gray-100"></div>

                      {/* SEÇÃO EMPRESA */}
                      <div className="py-1">
                        <div className="px-4 py-1.5">
                          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                            Empresa
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleNavigate('/nuclei/configuracoes/empresa')}
                          className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gradient-to-r hover:from-emerald-50 hover:to-emerald-25 flex items-center gap-3 transition-all duration-200 group"
                        >
                          <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center group-hover:bg-emerald-100 group-hover:scale-105 transition-all duration-200">
                            <Building2 className="w-4 h-4 text-emerald-600" />
                          </div>
                          <div className="flex-1">
                            <div className="font-medium text-gray-900 text-sm">Empresa atual</div>
                            <div className="text-xs text-gray-500 truncate">
                              {companyCardName || 'Nenhuma empresa vinculada'}
                            </div>
                            {companyCardCnpj && (
                              <div className="text-[10px] text-gray-400 mt-1">
                                CNPJ {companyCardCnpj}
                              </div>
                            )}
                          </div>
                          {companyPlanLabel ? (
                            <div className="px-2 py-1 bg-emerald-100 rounded-full text-emerald-700 text-xs font-semibold">
                              {companyPlanLabel}
                            </div>
                          ) : (
                            <ChevronRight className="w-4 h-4 text-emerald-500" />
                          )}
                        </button>
                      </div>

                      {/* SEPARADOR */}
                      <div className="border-t border-gray-100"></div>

                      {/* SEÇÃO SISTEMA */}
                      <div className="py-1">
                        <div className="px-4 py-1.5">
                          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                            Sistema
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleNavigate('/nuclei/configuracoes/empresa')}
                          className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gradient-to-r hover:from-purple-50 hover:to-purple-25 flex items-center gap-3 transition-all duration-200 group"
                        >
                          <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center group-hover:bg-purple-100 group-hover:scale-105 transition-all duration-200">
                            <Settings className="w-4 h-4 text-purple-600" />
                          </div>
                          <div className="flex-1">
                            <div className="font-medium text-gray-900 text-sm">
                              {t('navigation.settings') || 'Configurações'}
                            </div>
                            <div className="text-xs text-gray-500">
                              {t('common.preferences') || 'Preferências'}
                            </div>
                          </div>
                        </button>

                        {/* Seletor de Idioma Funcional */}
                        <div className="px-4 py-2">
                          <button
                            onClick={() => setShowLanguageSelector(true)}
                            className="w-full flex items-center gap-3 p-2.5 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-all duration-200 group"
                          >
                            <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shadow-sm">
                              <span className="text-lg">
                                {availableLanguages.find((lang) => lang.code === language)?.flag ||
                                  '🇧🇷'}
                              </span>
                            </div>
                            <div className="flex-1">
                              <div className="text-sm font-medium text-gray-700">
                                {availableLanguages.find((lang) => lang.code === language)
                                  ?.nativeName || 'Português (BR)'}
                              </div>
                              <div className="text-xs text-gray-500">
                                {t('common.systemLanguage')}
                              </div>
                            </div>
                            <ChevronDown className="w-3 h-3 text-gray-400 group-hover:text-gray-600 transition-colors" />
                          </button>
                        </div>

                        <Link
                          to="/suporte"
                          className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-blue-25 flex items-center gap-3 transition-all duration-200 group"
                          onClick={() => setShowUserMenu(false)}
                        >
                          <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center group-hover:bg-blue-100 group-hover:scale-105 transition-all duration-200">
                            <MessageCircle className="w-4 h-4 text-blue-600" />
                          </div>
                          <div className="flex-1">
                            <div className="font-medium text-gray-900 text-sm">
                              {t('common.helpSupport')}
                            </div>
                            <div className="text-xs text-gray-500">{t('common.helpCenter')}</div>
                          </div>
                        </Link>
                      </div>

                      {/* SEPARADOR */}
                      <div className="border-t border-gray-100"></div>

                      {/* SEÇÃO AÇÃO */}
                      <div className="py-1">
                        <button
                          onClick={handleLogout}
                          className="w-full px-4 py-2.5 text-left text-sm text-red-600 hover:bg-gradient-to-r hover:from-red-50 hover:to-red-25 flex items-center gap-3 transition-all duration-200 rounded-b-xl group"
                        >
                          <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center group-hover:bg-red-100 group-hover:scale-105 transition-all duration-200">
                            <LogOut className="w-4 h-4 text-red-600" />
                          </div>
                          <div className="flex-1">
                            <div className="font-medium text-red-600 text-sm">
                              {t('auth.logout')}
                            </div>
                            <div className="text-xs text-red-400">{t('common.endSession')}</div>
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
        <main
          className={`flex-1 relative focus:outline-none ${location.pathname === '/atendimento' || location.pathname === '/atendimento/chat' ? 'overflow-hidden' : 'overflow-y-auto'}`}
        >
          {location.pathname === '/atendimento' || location.pathname === '/atendimento/chat' ? (
            // Para as rotas de atendimento, não aplicar padding para usar tela completa
            <div className="h-full w-full">{children}</div>
          ) : (
            // Para outras rotas, usar toda a largura disponível
            <div className="py-6">
              <div className="w-full px-4 sm:px-6">{children}</div>
            </div>
          )}
        </main>
      </div>

      {/* Modal de Seleção de Idioma */}
      {showLanguageSelector && (
        <LanguageSelector showAsModal={true} onClose={() => setShowLanguageSelector(false)} />
      )}
    </div>
  );
};

export default DashboardLayout;
