import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useI18n } from '../../contexts/I18nContext';
import { useProfile, type PerfilUsuario } from '../../contexts/ProfileContext';
import { useWebSocketStatus } from '../../contexts/WebSocketContext';
import { useSidebar } from '../../contexts/SidebarContext';
import { formatCompanyName, formatUserName } from '../../utils/textUtils';
import HierarchicalNavGroup from '../navigation/HierarchicalNavGroup';
import { getMenuParaEmpresa } from '../../config/menuConfig';
import { UI_LAYERS } from '../../config/uiLayers';
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
  ChevronRight,
  Building2,
  MessageCircle,
  Mail,
} from 'lucide-react';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

type UserLoginMetadata = {
  ultimo_login?: string;
  ultimoLogin?: string;
  lastLoginAt?: string;
  last_login?: string;
};

type AppWindow = Window & {
  __APP_VERSION__?: string;
};

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
  user: 'Usuario',
};

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showProfileSelector, setShowProfileSelector] = useState(false);
  const [showLanguageSelector, setShowLanguageSelector] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isMainScrolled, setIsMainScrolled] = useState(false);
  const mainContentRef = useRef<HTMLElement | null>(null);
  const { user, logout } = useAuth();
  const { setActiveSubmenuPanel } = useSidebar();
  const { t, language, availableLanguages } = useI18n();

  // 🔌 WebSocket Status para NotificationIndicator
  const {
    connected: wsConnected,
    connecting: wsConnecting,
    error: wsError,
    reconnect: wsReconnect,
  } = useWebSocketStatus();

  const { perfilSelecionado, setPerfilSelecionado } = useProfile();
  const location = useLocation();
  const navigate = useNavigate();

  // ⚡ LICENCIAMENTO: Buscar módulos ativos da empresa
  const [modulosAtivos, loadingModulos] = useModulosAtivos();

  // ⚡ LICENCIAMENTO: Filtrar menu baseado nos módulos ativos
  const menuFiltrado = useMemo(() => {
    if (loadingModulos) return []; // Não mostrar menu enquanto carrega
    return getMenuParaEmpresa(modulosAtivos, user);
  }, [modulosAtivos, loadingModulos, user]);

  const roleKey = (user?.role || '').toLowerCase();
  const displayRole =
    ROLE_LABELS[roleKey] || (user?.role ? formatUserName(user.role) : 'Administrador');

  // Verificação se é admin
  const isAdmin =
    roleKey === 'superadmin' ||
    roleKey === 'admin' ||
    roleKey === 'manager' ||
    roleKey === 'gerente';

  const userLoginMetadata = user as (typeof user & UserLoginMetadata) | undefined;
  const lastLoginRaw =
    userLoginMetadata?.ultimo_login ??
    userLoginMetadata?.ultimoLogin ??
    userLoginMetadata?.lastLoginAt ??
    userLoginMetadata?.last_login;
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

  const windowAppVersion =
    typeof window !== 'undefined' ? (window as AppWindow).__APP_VERSION__ : undefined;
  const rawAppVersion =
    windowAppVersion ?? process.env.REACT_APP_APP_VERSION ?? process.env.REACT_APP_VERSION;
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

  const closeMobileSidebar = () => {
    setSidebarOpen(false);
    setActiveSubmenuPanel(null);
  };

  // Perfis disponíveis para o seletor
  const availableProfiles: Array<{
    id: PerfilUsuario;
    nome: string;
    descricao: string;
  }> = [
    {
      id: 'administrador',
      nome: 'Administrador',
      descricao: 'Acesso total ao sistema',
    },
    {
      id: 'gerente',
      nome: 'Gerente',
      descricao: 'Gestão de equipes e relatórios',
    },
    {
      id: 'vendedor',
      nome: 'Vendedor',
      descricao: 'Gestão de vendas e clientes',
    },
    {
      id: 'operacional',
      nome: 'Operacional',
      descricao: 'Operações e processos',
    },
    {
      id: 'financeiro',
      nome: 'Financeiro',
      descricao: 'Gestão financeira',
    },
    {
      id: 'suporte',
      nome: 'Suporte',
      descricao: 'Atendimento ao cliente',
    },
  ];

  const getTipoColor = (tipo: string) => {
    switch (tipo) {
      case 'administrador':
        return 'bg-red-100 text-red-800';
      case 'gerente':
      case 'vendedor':
      case 'operacional':
      case 'financeiro':
      case 'suporte':
        return 'bg-[#159A9C]/10 text-[#159A9C]';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getCurrentProfile = () => {
    return availableProfiles.find((p) => p.id === perfilSelecionado) || availableProfiles[0];
  };

  const handleProfileSelect = (profileId: PerfilUsuario) => {
    setPerfilSelecionado(profileId);
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
    const elementCenter =
      rect.top + rect.height / 2 - element.closest('.h-full')!.getBoundingClientRect().top;

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

  // Em mobile, fecha o drawer lateral apos navegar para evitar overlay preso sobre a tela.
  useEffect(() => {
    setSidebarOpen(false);
    setActiveSubmenuPanel(null);
  }, [location.pathname, setActiveSubmenuPanel]);

  // Estado de conectividade de rede

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

  const resolveSearchResultPath = (result: SearchResult): string => {
    const normalizedPath = result.path?.trim();
    const encodedId = encodeURIComponent(result.id);

    // Compatibilidade com rotas legadas que ainda podem vir do backend.
    if (normalizedPath) {
      if (result.type === 'cliente' && /^\/clientes\/[0-9a-fA-F-]{36}$/.test(normalizedPath)) {
        return `/crm/clientes?highlight=${encodedId}`;
      }
      if (result.type === 'produto' && /^\/produtos\/[0-9a-fA-F-]{36}$/.test(normalizedPath)) {
        return `/vendas/produtos?highlight=${encodedId}`;
      }
      if (normalizedPath.startsWith('/')) {
        return normalizedPath;
      }
    }

    // Fallback por tipo para garantir navegação mesmo sem path válido.
    switch (result.type) {
      case 'cliente':
        return `/crm/clientes?highlight=${encodedId}`;
      case 'produto':
        return `/vendas/produtos?highlight=${encodedId}`;
      case 'cotacao':
        return `/vendas/cotacoes?highlight=${encodedId}`;
      case 'oportunidade':
        return `/crm/pipeline?highlight=${encodedId}`;
      case 'contato':
        return `/crm/contatos?highlight=${encodedId}`;
      default:
        return '';
    }
  };

  const handleSearchResultSelect = (result: SearchResult) => {
    const destinationPath = resolveSearchResultPath(result);
    if (!destinationPath) {
      return;
    }

    setShowSearchResults(false);
    setSearchQuery('');
    setShowUserMenu(false);
    navigate(destinationPath);
  };

  const handleOpenTopSearchResult = () => {
    if (searchResults.length === 0) {
      return;
    }

    handleSearchResultSelect(searchResults[0]);
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

      if (showUserMenu && !target.closest('[data-user-menu]')) {
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

  useEffect(() => {
    const mainElement = mainContentRef.current;
    if (!mainElement) {
      return;
    }

    const handleMainScroll = () => {
      setIsMainScrolled(mainElement.scrollTop > 6);
    };

    handleMainScroll();
    mainElement.addEventListener('scroll', handleMainScroll, { passive: true });

    return () => {
      mainElement.removeEventListener('scroll', handleMainScroll);
    };
  }, [location.pathname]);

  const statusPill = useMemo(() => {
    if (!isOnline) {
      return {
        label: 'Sem internet',
        title: 'Sem conexao com a internet',
        className: 'bg-red-50 border-red-200 text-red-700',
        dotClass: 'bg-red-500',
        animateDot: false,
        canReconnect: false,
      };
    }

    if (wsConnected) {
      return {
        label: 'Online',
        title: 'Sistema conectado em tempo real',
        className: 'bg-green-50 border-green-200 text-green-700',
        dotClass: 'bg-green-500',
        animateDot: true,
        canReconnect: false,
      };
    }

    if (wsConnecting) {
      return {
        label: 'Conectando',
        title: 'Conectando ao servidor',
        className: 'bg-amber-50 border-amber-200 text-amber-700',
        dotClass: 'bg-amber-500',
        animateDot: true,
        canReconnect: false,
      };
    }

    return {
      label: wsError ? 'Reconectar' : 'Instavel',
      title: wsError
        ? 'Falha na conexao em tempo real. Clique para reconectar.'
        : 'Conexao instavel',
      className: 'bg-orange-50 border-orange-200 text-orange-700',
      dotClass: 'bg-orange-500',
      animateDot: false,
      canReconnect: Boolean(wsError),
    };
  }, [isOnline, wsConnected, wsConnecting, wsError]);

  const topbarControlButtonClass =
    'relative min-h-11 min-w-11 rounded-xl border border-transparent p-1.5 text-gray-600 transition-all duration-200 ease-out hover:border-[#159A9C]/25 hover:bg-[#DEEFE7]/65 hover:text-[#002333] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#159A9C]/35 focus-visible:ring-offset-2 focus-visible:ring-offset-white active:translate-y-[1px] sm:min-h-0 sm:min-w-0 sm:p-2';
  const userMenuItemBaseClass =
    'group flex w-full min-h-11 items-center gap-3 px-4 py-3 text-left text-sm text-gray-700 transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#159A9C]/35 focus-visible:ring-inset sm:min-h-0 sm:py-2.5';

  return (
    <div className="h-screen flex overflow-hidden bg-[#DEEFE7]">
      {/* Sidebar para mobile */}
      <div
        className={`fixed inset-0 flex ${UI_LAYERS.MOBILE_SIDEBAR_SHELL} md:hidden ${sidebarOpen ? '' : 'hidden'}`}
      >
        <div
          className="fixed inset-0 bg-gray-600 bg-opacity-75"
          onClick={closeMobileSidebar}
        />

        <div
          className="relative flex-1 flex flex-col max-w-xs w-full bg-white"
          data-testid="mobile-sidebar-drawer"
        >
          <div className="absolute top-0 right-0 -mr-12 pt-2">
            <button
              data-testid="mobile-menu-close"
              className="ml-1 flex h-11 w-11 items-center justify-center rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
              onClick={closeMobileSidebar}
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
            <HierarchicalNavGroup
              menuItems={menuFiltrado}
              sidebarCollapsed={false}
              instanceId="mobile"
            />
          </div>
        </div>
      </div>

      {/* Sidebar para desktop - Duas colunas: Barra fixa + Painel suspenso */}
      <div className="hidden md:flex md:flex-shrink-0 relative">
        {/* Barra de Ícones Fixa (Coluna 1) com Efeito Mac Dock */}
        <div
          className={`flex flex-col w-[75px] bg-[#002333] border-r border-[#001a26] relative ${UI_LAYERS.SIDEBAR_DESKTOP} shadow-lg`}
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
                  instanceId="desktop"
                />
              </div>

              {/* Ações rápidas - modo ícone com Efeito Dock */}
              <div className="mt-auto pt-3 px-2 border-t border-white/10">
                <div className="flex flex-col items-center gap-2">
                  <Link
                    to="/suporte"
                    className="flex flex-col items-center justify-center w-full py-2 rounded-lg text-white/70"
                    title="Central de ajuda"
                  >
                    <MessageCircle className="h-5 w-5 mb-1" />
                    <span className="text-[9px] font-semibold uppercase tracking-wide">Ajuda</span>
                  </Link>
                  <a
                    href="mailto:suporte@conectcrm.com"
                    className="flex flex-col items-center justify-center w-full py-2 rounded-lg bg-[#159A9C]/20 text-[#159A9C]"
                    title="Abrir chamado"
                  >
                    <Mail className="h-4 w-4 mb-1" />
                    <span className="text-[9px] font-semibold uppercase tracking-wide">
                      Suporte
                    </span>
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
        <header
          className={`relative ${UI_LAYERS.TOPBAR_HEADER} flex-shrink-0 border-b backdrop-blur-sm transition-all duration-300 ${
            isMainScrolled
              ? 'bg-white/98 border-gray-200 shadow-[0_14px_26px_-24px_rgba(0,35,51,0.85)]'
              : 'bg-white/95 border-gray-200/80'
          }`}
        >
          {/* Gradiente sutil no topo */}
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#159A9C]/20 to-transparent"></div>

          <div className="w-full px-3 sm:px-4 md:px-6">
            <div className="flex h-[60px] items-center justify-between sm:h-16">
              {/* Lado Esquerdo: Menu Mobile + Breadcrumb + Status */}
              <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-4">
                <button
                  data-testid="mobile-menu-open"
                  className="min-h-11 min-w-11 rounded-xl border border-transparent p-1.5 text-gray-500 transition-all duration-200 ease-out hover:border-[#159A9C]/20 hover:bg-[#DEEFE7]/70 hover:text-[#002333] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#159A9C]/35 focus-visible:ring-offset-2 focus-visible:ring-offset-white md:hidden"
                  onClick={() => setSidebarOpen(true)}
                >
                  <Menu className="h-5 w-5" />
                </button>

                <div className="flex min-w-0 items-center gap-2 sm:gap-4">
                  {/* Seção da Empresa */}
                  <div
                    className="flex min-w-0 items-center gap-2 sm:gap-3"
                    data-testid="topbar-company-section"
                  >
                    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#159A9C]/15 to-[#159A9C]/5 text-[#159A9C] shadow-[inset_0_1px_1px_rgba(255,255,255,0.9)] sm:h-11 sm:w-11">
                      <Building2 className="h-4 w-4 sm:h-5 sm:w-5" />
                    </div>
                    <div className="flex min-w-0 max-w-[40vw] flex-col sm:max-w-none">
                      <span className="truncate text-sm font-bold text-[#159A9C] sm:text-base lg:text-lg">
                        {companyName}
                      </span>
                      <div className="mt-1 hidden flex-wrap items-center gap-2 text-xs text-[#4B5563] sm:flex">
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
                      <span className="mt-1 hidden text-xs text-[#4B5563] lg:block">
                        Sistema de Gestão Empresarial
                      </span>
                    </div>
                  </div>

                  {/* Separador */}
                  <div className="h-8 w-px bg-gradient-to-b from-transparent via-gray-200 to-transparent hidden md:block"></div>

                  {/* Status Online Melhorado */}
                  <div className="flex flex-shrink-0 items-center">
                    <button
                      type="button"
                      data-testid="topbar-status-pill"
                      className={`inline-flex min-h-11 min-w-0 items-center justify-center gap-2 rounded-xl border px-2.5 py-1.5 text-xs font-semibold tracking-wide transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#159A9C]/35 focus-visible:ring-offset-2 focus-visible:ring-offset-white sm:min-h-0 sm:min-w-[108px] sm:gap-2.5 sm:px-3.5 sm:py-2 ${statusPill.className} ${statusPill.canReconnect ? 'hover:-translate-y-0.5 hover:brightness-95 hover:shadow-[0_8px_18px_-14px_rgba(0,35,51,0.6)] active:translate-y-0' : ''}`}
                      title={statusPill.title}
                      disabled={!statusPill.canReconnect}
                      onClick={() => {
                        if (statusPill.canReconnect) {
                          wsReconnect();
                        }
                      }}
                    >
                      <div className="relative">
                        <div className={`w-2 h-2 rounded-full ${statusPill.dotClass}`}></div>
                        {statusPill.animateDot && (
                          <div
                            className={`absolute inset-0 w-2 h-2 rounded-full animate-ping opacity-75 ${statusPill.dotClass}`}
                          ></div>
                        )}
                      </div>
                      <span className="text-xs font-medium hidden sm:inline">
                        {statusPill.label}
                      </span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Lado Direito: Busca + Notificações + Avatar */}
              <div
                className={`fixed bottom-3 right-3 ${UI_LAYERS.TOPBAR_FLOATING_ACTIONS} flex items-center gap-1.5 rounded-2xl border border-[#c8d8de] bg-white/96 px-1.5 py-1.5 shadow-[0_16px_34px_-24px_rgba(0,35,51,0.6)] backdrop-blur-sm sm:static sm:bottom-auto sm:right-auto sm:z-auto sm:gap-2.5 sm:border-0 sm:bg-transparent sm:p-0 sm:shadow-none`}
                data-testid="topbar-actions-tray"
              >
                {/* Campo de Busca Melhorado */}
                <div className="relative hidden md:block" data-dropdown="search">
                  <div className="relative rounded-xl transition-all duration-300 focus-within:shadow-[0_0_0_4px_rgba(21,154,156,0.12)]">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Search className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      data-testid="topbar-search-input"
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setShowSearchResults(e.target.value.length > 0);
                      }}
                      onFocus={() => setShowSearchResults(searchQuery.length > 0)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                          event.preventDefault();
                          handleOpenTopSearchResult();
                        }
                      }}
                      placeholder="Buscar clientes e produtos..."
                      className="w-72 rounded-xl border border-gray-200/90 bg-white py-2.5 pl-10 pr-16 text-sm text-gray-700 placeholder-gray-500 shadow-sm transition-all duration-200 hover:border-gray-300 hover:bg-white focus:border-[#159A9C]/50 focus:outline-none focus:ring-0"
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                      <div className="flex items-center gap-1">
                        <kbd className="inline-flex items-center px-2 py-1 border border-gray-300 rounded-md text-xs bg-white text-gray-600 font-medium shadow-sm">
                          Ctrl+K
                        </kbd>
                      </div>
                    </div>

                    {/* Dropdown de Resultados - Melhorado */}
                    {showSearchResults && (
                      <div
                        className={`absolute left-0 right-0 top-full ${UI_LAYERS.POPOVER_DROPDOWN} mt-2.5 overflow-hidden rounded-2xl border border-gray-200/80 bg-white/95 shadow-[0_24px_45px_-30px_rgba(0,35,51,0.55)] backdrop-blur-sm`}
                        data-testid="topbar-search-dropdown"
                      >
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
                              <button
                                type="button"
                                key={result.id}
                                data-testid="topbar-search-result"
                                className="group w-full cursor-pointer border-b p-3.5 text-left transition-colors duration-200 last:border-b-0 hover:bg-[#DEEFE7]/40"
                                onClick={() => handleSearchResultSelect(result)}
                              >
                                <div className="flex items-center gap-3">
                                  <div className="w-9 h-9 rounded-lg flex items-center justify-center text-white text-xs font-medium transition-transform group-hover:scale-105 bg-[#159A9C]">
                                    {result.type === 'cliente'
                                      ? 'C'
                                      : result.type === 'cotacao'
                                        ? 'CT'
                                        : result.type === 'produto'
                                          ? 'PR'
                                          : result.type === 'oportunidade'
                                            ? 'OP'
                                            : 'CO'}
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
                              </button>
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
                          <button
                            type="button"
                            data-testid="topbar-search-open-first"
                            className="w-full text-sm text-[#159A9C] hover:text-[#0F7B7D] font-medium transition-colors hover:bg-white rounded-lg py-2 disabled:text-gray-400 disabled:hover:bg-transparent"
                            onClick={handleOpenTopSearchResult}
                            disabled={searchResults.length === 0}
                          >
                            Abrir primeiro resultado
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
                      className={`${topbarControlButtonClass} group flex items-center gap-2 p-1.5 sm:p-2`}
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
                      className={`absolute right-0 bottom-full ${UI_LAYERS.USER_MENU_DROPDOWN} mb-2 w-[calc(100vw-1rem)] max-w-[18rem] overflow-visible rounded-xl border border-[#d4e2e8] bg-white shadow-[0_30px_60px_-40px_rgba(0,35,51,0.7)] sm:top-full sm:bottom-auto sm:mt-2 sm:mb-0 sm:w-72`}
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
                          className={`${userMenuItemBaseClass} hover:bg-[#DEEFE7]/55 hover:text-[#002333]`}
                          onClick={() => setShowUserMenu(false)}
                        >
                          <div className="w-8 h-8 rounded-lg bg-[#159A9C]/10 flex items-center justify-center group-hover:bg-[#159A9C]/15 group-hover:scale-105 transition-all duration-200">
                            <User className="w-4 h-4 text-[#159A9C]" />
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
                              className={`${userMenuItemBaseClass} hover:bg-[#DEEFE7]/65 hover:text-[#002333]`}
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
                                className={`absolute right-0 top-full ${UI_LAYERS.OVERLAY_DROPDOWN} mt-2 w-[calc(100vw-2rem)] max-w-[18rem] overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl sm:right-full sm:top-0 sm:mt-0 sm:mr-3 sm:w-72`}
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
                                      className={`w-full p-3 text-left hover:bg-gray-50 transition-all duration-200 border-l-4 group ${
                                        perfilSelecionado === profile.id
                                          ? 'bg-[#159A9C]/5 border-[#159A9C] shadow-sm'
                                          : 'border-transparent hover:border-gray-200'
                                      }`}
                                    >
                                      <div className="flex items-center justify-between">
                                        <div className="flex-1 min-w-0">
                                          <div className="font-medium text-gray-900 flex items-center gap-1.5 text-sm">
                                            {profile.nome}
                                            {perfilSelecionado === profile.id && (
                                              <span className="text-xs text-[#159A9C] font-medium flex items-center gap-1">
                                                <div className="w-1.5 h-1.5 bg-[#159A9C] rounded-full"></div>
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
                          className={`${userMenuItemBaseClass} hover:bg-[#DEEFE7]/65 hover:text-[#002333]`}
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
                          onClick={() => handleNavigate('/configuracoes')}
                          className={`${userMenuItemBaseClass} hover:bg-[#DEEFE7]/55 hover:text-[#002333]`}
                        >
                          <div className="w-8 h-8 rounded-lg bg-[#159A9C]/10 flex items-center justify-center group-hover:bg-[#159A9C]/15 group-hover:scale-105 transition-all duration-200">
                            <Settings className="w-4 h-4 text-[#159A9C]" />
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
                            className="group flex w-full min-h-11 items-center gap-3 rounded-lg border border-transparent bg-gray-50 p-2.5 text-left transition-all duration-200 ease-out hover:border-[#159A9C]/20 hover:bg-[#DEEFE7]/65 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#159A9C]/35 focus-visible:ring-inset sm:min-h-0"
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
                          className={`${userMenuItemBaseClass} hover:bg-[#DEEFE7]/55 hover:text-[#002333]`}
                          onClick={() => setShowUserMenu(false)}
                        >
                          <div className="w-8 h-8 rounded-lg bg-[#159A9C]/10 flex items-center justify-center group-hover:bg-[#159A9C]/15 group-hover:scale-105 transition-all duration-200">
                            <MessageCircle className="w-4 h-4 text-[#159A9C]" />
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
                          className={`${userMenuItemBaseClass} rounded-b-xl text-red-600 hover:bg-red-50 hover:text-red-700 focus-visible:ring-red-300`}
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
          ref={mainContentRef}
          className={`flex-1 relative focus:outline-none ${location.pathname === '/atendimento' || location.pathname === '/atendimento/chat' ? 'overflow-hidden' : 'overflow-y-auto'}`}
        >
          {location.pathname === '/atendimento' || location.pathname === '/atendimento/chat' ? (
            // Para as rotas de atendimento, não aplicar padding para usar tela completa
            <div className="h-full w-full">{children}</div>
          ) : (
            // Para outras rotas, usar toda a largura disponível
            <div className="py-4 sm:py-5">
              <div className="mx-auto w-full px-3 sm:px-5">{children}</div>
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
