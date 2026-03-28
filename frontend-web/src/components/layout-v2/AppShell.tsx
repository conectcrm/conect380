import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ChevronDown, LogOut, Menu, Settings, Shield, User, Users, X } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useProfile, type PerfilUsuario } from '../../contexts/ProfileContext';
import { useSidebar } from '../../contexts/SidebarContext';
import { useModulosAtivos } from '../../hooks/useModuloAtivo';
import { getMenuParaEmpresa, type MenuConfig } from '../../config/menuConfig';
import HierarchicalNavGroup from '../navigation/HierarchicalNavGroup';
import GlobalSearchCommand, { type GlobalSearchEntry } from '../navigation/GlobalSearchCommand';
import NotificationCenter from '../notifications/NotificationCenter';
import Conect360Logo from '../ui/Conect360Logo';
import CompanySelector from '../tenant/CompanySelector';
import GlobalAgendaQuickPanel from '../topbar/GlobalAgendaQuickPanel';
import RouteTemplateFrame from './RouteTemplateFrame';
import SystemMaintenanceBanner from './SystemMaintenanceBanner';
import { shellSpacing, shellTokens } from './tokens';
import { resolveAvatarUrl } from '../../utils/avatar';

type AppShellProps = {
  children: React.ReactNode;
};

const MOBILE_BREAKPOINT = 768;

const isMobileAutoHideEnabledForViewport = (): boolean => {
  if (typeof window === 'undefined') {
    return false;
  }

  const screenWidth =
    typeof window.screen?.width === 'number' ? window.screen.width : window.innerWidth;
  const screenHeight =
    typeof window.screen?.height === 'number' ? window.screen.height : window.innerHeight;
  const shortestScreenEdge = Math.min(screenWidth, screenHeight);
  const isPhoneLikeScreen = shortestScreenEdge <= 820;

  if (!isPhoneLikeScreen || window.innerWidth >= MOBILE_BREAKPOINT) {
    return false;
  }

  const hasTouchFirstViewport =
    typeof window.matchMedia === 'function' ? window.matchMedia('(hover: none)').matches : false;

  const hasTouchPoints =
    typeof navigator !== 'undefined' && typeof navigator.maxTouchPoints === 'number'
      ? navigator.maxTouchPoints > 0
      : false;

  const isLikelyMobileUserAgent =
    typeof navigator !== 'undefined'
      ? /android|iphone|ipad|ipod|mobile/i.test(navigator.userAgent || '')
      : false;

  return hasTouchFirstViewport || (hasTouchPoints && isLikelyMobileUserAgent);
};

const availableProfiles: Array<{
  id: PerfilUsuario;
  nome: string;
  descricao: string;
}> = [
  { id: 'administrador', nome: 'Administrador', descricao: 'Acesso total ao sistema' },
  { id: 'gerente', nome: 'Gerente', descricao: 'Gestao de equipes e relatorios' },
  { id: 'vendedor', nome: 'Vendedor', descricao: 'Gestao de vendas e clientes' },
  { id: 'operacional', nome: 'Operacional', descricao: 'Operacoes e processos' },
  { id: 'financeiro', nome: 'Financeiro', descricao: 'Gestao financeira' },
  { id: 'suporte', nome: 'Suporte', descricao: 'Atendimento ao cliente' },
];

const resolveInitials = (name?: string): string => {
  if (!name) return 'AD';
  const parts = name.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) return 'AD';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();

  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
};

const getTipoColor = (tipo: PerfilUsuario): string => {
  if (tipo === 'administrador') return 'bg-red-100 text-red-700';
  return 'bg-[#159A9C]/10 text-[#159A9C]';
};

const hasAgendaRouteAccess = (menuItems: MenuConfig[]): boolean => {
  const targetRoutes = new Set(['/agenda', '/crm/agenda']);
  const stack = [...menuItems];

  while (stack.length > 0) {
    const current = stack.pop();
    if (!current) continue;

    if (current.href && targetRoutes.has(current.href)) {
      return true;
    }

    if (Array.isArray(current.children) && current.children.length > 0) {
      stack.push(...current.children);
    }
  }

  return false;
};

const Brand: React.FC = () => {
  return (
    <div className="inline-flex items-center">
      <Conect360Logo variant="full" size="md" className="h-10 w-auto" />
    </div>
  );
};

const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const { perfilSelecionado, setPerfilSelecionado } = useProfile();
  const { setActiveSubmenuPanel } = useSidebar();
  const [modulosAtivos, loadingModulos] = useModulosAtivos();

  const location = useLocation();
  const navigate = useNavigate();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showProfileSelector, setShowProfileSelector] = useState(false);
  const [isMobileAutoHideEnabled, setIsMobileAutoHideEnabled] = useState(() =>
    isMobileAutoHideEnabledForViewport(),
  );
  const [isMobileTopbarHidden, setIsMobileTopbarHidden] = useState(false);
  const lastScrollYRef = useRef(0);

  useEffect(() => {
    setMobileOpen(false);
    setShowUserMenu(false);
    setShowProfileSelector(false);
    setIsMobileTopbarHidden(false);
    lastScrollYRef.current = window.scrollY;
    setActiveSubmenuPanel(null);
  }, [location.pathname, setActiveSubmenuPanel]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('[data-user-menu]') && !target.closest('[data-profile-selector]')) {
        setShowUserMenu(false);
      }
      if (!target.closest('[data-profile-selector]')) {
        setShowProfileSelector(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const SCROLL_HIDE_THRESHOLD = 90;
    const SCROLL_DELTA_THRESHOLD = 8;
    let ticking = false;

    const updateTopbarVisibility = () => {
      ticking = false;

      if (!isMobileAutoHideEnabled) {
        if (isMobileTopbarHidden) {
          setIsMobileTopbarHidden(false);
        }
        lastScrollYRef.current = window.scrollY;
        return;
      }

      const currentScrollY = Math.max(window.scrollY, 0);
      const scrollDelta = currentScrollY - lastScrollYRef.current;

      if (currentScrollY <= 16) {
        if (isMobileTopbarHidden) {
          setIsMobileTopbarHidden(false);
        }
      } else if (
        scrollDelta > SCROLL_DELTA_THRESHOLD &&
        currentScrollY > SCROLL_HIDE_THRESHOLD &&
        !isMobileTopbarHidden
      ) {
        setIsMobileTopbarHidden(true);
      } else if (scrollDelta < -SCROLL_DELTA_THRESHOLD && isMobileTopbarHidden) {
        setIsMobileTopbarHidden(false);
      }

      lastScrollYRef.current = currentScrollY;
    };

    const onScroll = () => {
      if (ticking) {
        return;
      }

      ticking = true;
      window.requestAnimationFrame(updateTopbarVisibility);
    };

    const onResize = () => {
      const nextIsMobileAutoHideEnabled = isMobileAutoHideEnabledForViewport();
      setIsMobileAutoHideEnabled(nextIsMobileAutoHideEnabled);

      if (!nextIsMobileAutoHideEnabled) {
        setIsMobileTopbarHidden(false);
      }
    };

    lastScrollYRef.current = window.scrollY;
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize, { passive: true });

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
    };
  }, [isMobileAutoHideEnabled, isMobileTopbarHidden]);

  const menuFiltrado = useMemo(() => {
    if (loadingModulos) return [];
    return getMenuParaEmpresa(modulosAtivos, user);
  }, [loadingModulos, modulosAtivos, user]);
  const canAccessAgendaQuickPanel = useMemo(
    () => hasAgendaRouteAccess(menuFiltrado),
    [menuFiltrado],
  );

  const globalSearchEntries = useMemo<GlobalSearchEntry[]>(() => {
    const normalizePath = (href: string): string => {
      if (href.length > 1 && href.endsWith('/')) {
        return href.slice(0, -1);
      }
      return href;
    };

    const entriesByPath = new Map<string, GlobalSearchEntry>();

    const visit = (items: MenuConfig[], trail: string[] = []): void => {
      items.forEach((item) => {
        const nextTrail = [...trail, item.title];

        if (item.href) {
          const normalizedHref = normalizePath(item.href);
          const parentTrail = trail.join(' / ');

          const entry: GlobalSearchEntry = {
            id: `${item.id}-${normalizedHref}`,
            title: item.title,
            href: item.href,
            icon: item.icon,
            section: trail[0] ?? item.title,
            subtitle: parentTrail || undefined,
            keywords: [item.shortTitle, item.group, item.section].filter(Boolean) as string[],
          };

          const existing = entriesByPath.get(normalizedHref);
          const shouldReplace = !existing || (!existing.subtitle && Boolean(entry.subtitle));
          if (shouldReplace) {
            entriesByPath.set(normalizedHref, entry);
          }
        }

        if (item.children?.length) {
          visit(item.children, nextTrail);
        }
      });
    };

    visit(menuFiltrado);

    return Array.from(entriesByPath.values()).sort((a, b) =>
      a.title.localeCompare(b.title, 'pt-BR', { sensitivity: 'base' }),
    );
  }, [menuFiltrado]);

  const roleKey = String(user?.role || '').toLowerCase();
  const isAdmin =
    roleKey === 'superadmin' ||
    roleKey === 'admin' ||
    roleKey === 'manager' ||
    roleKey === 'gerente';
  const isSuperAdmin = roleKey === 'superadmin';
  const canAccessCoreAdmin = isSuperAdmin;

  const initials = useMemo(() => resolveInitials(user?.nome), [user?.nome]);
  const avatarUrl = useMemo(() => resolveAvatarUrl(user?.avatar_url || null), [user?.avatar_url]);

  const getCurrentProfile = () =>
    availableProfiles.find((profile) => profile.id === perfilSelecionado) || availableProfiles[0];

  const handleProfileSelect = (profileId: PerfilUsuario) => {
    setPerfilSelecionado(profileId);
    setShowProfileSelector(false);
  };

  const handleOpenCoreAdmin = () => {
    navigate('/core-admin');
  };

  return (
    <div className={shellTokens.appRoot}>
      <aside
        className={`fixed inset-y-0 left-0 z-30 hidden w-[74px] ${shellTokens.sidebar} md:flex md:flex-col`}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-center px-2 pb-3 pt-4">
            <Link to="/dashboard" aria-label="Ir para o dashboard">
              <Conect360Logo variant="icon" size="md" className="h-10 w-10" />
            </Link>
          </div>

          <div className="mx-2.5 border-t border-[#D4E1E5]" />

          <div className="flex-1 overflow-y-auto py-2">
            <HierarchicalNavGroup
              menuItems={menuFiltrado}
              sidebarCollapsed={false}
              instanceId="desktop"
            />
          </div>
        </div>
      </aside>

      {mobileOpen ? (
        <div className="fixed inset-0 z-40 md:hidden">
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="absolute inset-0 bg-[#072433]/45"
            aria-label="Fechar menu"
          />
          <div
            data-testid="mobile-sidebar-drawer"
            className="relative z-10 h-full w-[290px] border-r border-[#D7E4E8] bg-white p-4 shadow-[0_30px_60px_-42px_rgba(9,45,62,0.85)]"
          >
            <div className="mb-5 flex items-center justify-between">
              <Brand />
              <button
                data-testid="mobile-menu-close"
                type="button"
                onClick={() => setMobileOpen(false)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-[#5B7583] hover:bg-[#EEF6F8]"
                aria-label="Fechar menu"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="max-h-[calc(100vh-120px)] overflow-y-auto">
              <HierarchicalNavGroup
                menuItems={menuFiltrado}
                sidebarCollapsed={false}
                instanceId="mobile"
              />
            </div>
          </div>
        </div>
      ) : null}

      <div className="min-h-screen md:pl-[74px]">
        <header className={`sticky top-0 z-20 ${shellTokens.topbar}`}>
          <div
            data-testid="mobile-topbar-container"
            className={`transition-[max-height,opacity,transform] duration-200 ease-out md:max-h-[86px] md:translate-y-0 md:opacity-100 md:pointer-events-auto ${
              isMobileAutoHideEnabled && isMobileTopbarHidden
                ? 'max-h-0 -translate-y-2 opacity-0 pointer-events-none overflow-hidden'
                : 'max-h-[86px] translate-y-0 opacity-100 overflow-visible'
            }`}
          >
            <div
              className={`flex h-[86px] items-center justify-between ${shellSpacing.pageOuterX}`}
            >
              <div className="flex items-center gap-3">
                <button
                  data-testid="mobile-menu-open"
                  type="button"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[#D6E3E7] text-[#496372] md:hidden"
                  onClick={() => setMobileOpen(true)}
                  aria-label="Abrir menu"
                >
                  <Menu className="h-5 w-5" />
                </button>
                <div className="md:hidden">
                  <Conect360Logo variant="icon" size="sm" className="h-8 w-8" />
                </div>
              </div>

              <div className="flex items-center gap-2.5 md:gap-3" data-testid="topbar-actions-tray">
                <GlobalSearchCommand entries={globalSearchEntries} />

                <CompanySelector className="hidden sm:inline-flex" />
                <CompanySelector compact className="sm:hidden" />

                {canAccessAgendaQuickPanel ? <GlobalAgendaQuickPanel /> : null}

                {isSuperAdmin ? (
                  <button
                    type="button"
                    onClick={handleOpenCoreAdmin}
                    className="hidden h-8 w-8 items-center justify-center rounded-lg border border-[#D7E4E9] bg-white text-[#5E7887] transition-colors hover:bg-[#F4FAFC] hover:text-[#234A5F] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#159A9C]/30 sm:inline-flex"
                    title="Abrir Core Admin"
                    aria-label="Abrir Core Admin"
                  >
                    <Shield className="h-4 w-4" />
                  </button>
                ) : null}
                <NotificationCenter />

                <div className="relative" data-user-menu>
                  <button
                    type="button"
                    data-user-menu
                    onClick={() => setShowUserMenu((value) => !value)}
                    className="inline-flex items-center gap-2 rounded-full border border-[#D2E0E6] bg-white px-2 py-1.5 hover:bg-[#F5FBF9]"
                    aria-label="Perfil do usuario"
                  >
                    <span className="inline-flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-[#20B4A7] to-[#118A88] text-[11px] font-bold text-white">
                      {avatarUrl ? (
                        <img
                          src={avatarUrl}
                          alt={user?.nome || 'Usuario'}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        initials
                      )}
                    </span>
                    <span className="hidden text-left sm:block">
                      <span className="block text-[11px] leading-none text-[#55707E]">
                        {user?.nome || 'Administrador'}
                      </span>
                      <span className="mt-1 block text-[11px] font-semibold leading-none text-[#1D3E4F]">
                        {roleKey === 'superadmin' ? 'Super Admin' : 'Administrador'}
                      </span>
                    </span>
                    <ChevronDown className="h-4 w-4 text-[#6A8795]" />
                  </button>

                  {showUserMenu ? (
                    <div
                      data-user-menu
                      className="absolute right-0 top-full z-50 mt-2 w-72 rounded-2xl border border-[#D8E5E9] bg-white p-2 shadow-[0_28px_56px_-40px_rgba(7,36,51,0.8)]"
                    >
                      <Link
                        to="/perfil"
                        className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-[#214251] hover:bg-[#EEF5F8]"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <User className="h-4 w-4 text-[#5F7B88]" />
                        Meu Perfil
                      </Link>

                      <button
                        type="button"
                        onClick={() => {
                          setShowUserMenu(false);
                          navigate('/configuracoes/empresa');
                        }}
                        className="mt-1 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-medium text-[#214251] hover:bg-[#EEF5F8]"
                      >
                        <Settings className="h-4 w-4 text-[#5F7B88]" />
                        Configuracoes
                      </button>

                      {canAccessCoreAdmin ? (
                        <button
                          type="button"
                          onClick={() => {
                            setShowUserMenu(false);
                            navigate('/core-admin');
                          }}
                          className="mt-1 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-medium text-[#214251] hover:bg-[#EEF5F8]"
                        >
                          <Shield className="h-4 w-4 text-[#5F7B88]" />
                          Core Admin
                        </button>
                      ) : null}

                      {isAdmin ? (
                        <div className="relative mt-1" data-profile-selector>
                          <button
                            type="button"
                            onClick={() => setShowProfileSelector((value) => !value)}
                            className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm font-medium text-[#214251] hover:bg-[#EEF5F8]"
                          >
                            <span className="inline-flex items-center gap-2">
                              <Users className="h-4 w-4 text-[#5F7B88]" />
                              Alterar Perfil
                            </span>
                            <span
                              className={`rounded px-1.5 py-0.5 text-xs ${getTipoColor(perfilSelecionado)}`}
                            >
                              {getCurrentProfile().nome}
                            </span>
                          </button>

                          {showProfileSelector ? (
                            <div
                              data-profile-selector
                              className="absolute right-0 top-full z-50 mt-2 w-72 overflow-hidden rounded-xl border border-[#D8E5E9] bg-white shadow-[0_24px_48px_-36px_rgba(7,36,51,0.8)]"
                            >
                              <div className="max-h-64 overflow-y-auto">
                                {availableProfiles.map((profile) => (
                                  <button
                                    key={profile.id}
                                    type="button"
                                    onClick={() => handleProfileSelect(profile.id)}
                                    className={`w-full border-l-2 px-3 py-2 text-left hover:bg-[#F6FBF9] ${
                                      perfilSelecionado === profile.id
                                        ? 'border-[#159A9C] bg-[#159A9C]/5'
                                        : 'border-transparent'
                                    }`}
                                  >
                                    <div className="text-sm font-semibold text-[#214251]">
                                      {profile.nome}
                                    </div>
                                    <div className="text-xs text-[#6A8795]">
                                      {profile.descricao}
                                    </div>
                                  </button>
                                ))}
                              </div>
                            </div>
                          ) : null}
                        </div>
                      ) : null}

                      <button
                        type="button"
                        onClick={() => {
                          setShowUserMenu(false);
                          logout();
                          navigate('/login');
                        }}
                        className="mt-1 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-medium text-[#B4233A] hover:bg-[#FFF2F4]"
                      >
                        <LogOut className="h-4 w-4" />
                        Sair
                      </button>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </div>

          <div className={shellSpacing.pageOuterX}>
            <div className={`h-px rounded-full ${shellTokens.divider}`} aria-hidden />
            <SystemMaintenanceBanner />
          </div>
        </header>

        <main className={`${shellSpacing.pageOuterX} ${shellSpacing.pageOuterY}`}>
          <RouteTemplateFrame>{children}</RouteTemplateFrame>
        </main>
      </div>
    </div>
  );
};

export default React.memo(AppShell);
