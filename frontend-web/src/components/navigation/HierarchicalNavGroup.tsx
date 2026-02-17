import React, { useEffect, useMemo, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, X } from 'lucide-react';
import { MenuConfig } from '../../config/menuConfig';
import { UI_LAYERS } from '../../config/uiLayers';
import { useAuth } from '../../hooks/useAuth';
import { useSidebar } from '../../contexts/SidebarContext';
import './sidebar-animations.css';
import './menu-improvements.css';

interface HierarchicalNavGroupProps {
  menuItems: MenuConfig[];
  sidebarCollapsed: boolean;
  instanceId?: string;
}

interface SubmenuSection {
  id: string;
  title?: string;
  items: MenuConfig[];
}

interface SubmenuTheme {
  accent: string;
  accentStrong: string;
  accentSoft: string;
  accentSoftAlt: string;
  accentBorder: string;
  accentShadow: string;
}

const SUBMENU_THEMES: Record<MenuConfig['color'], SubmenuTheme> = {
  blue: {
    accent: '#159A9C',
    accentStrong: '#0F7B7D',
    accentSoft: '#EEF7F3',
    accentSoftAlt: '#DEEFE7',
    accentBorder: 'rgba(21, 154, 156, 0.3)',
    accentShadow: 'rgba(0, 35, 51, 0.7)',
  },
  green: {
    accent: '#1E9E55',
    accentStrong: '#157642',
    accentSoft: '#EEF8F1',
    accentSoftAlt: '#DDF0E3',
    accentBorder: 'rgba(30, 158, 85, 0.28)',
    accentShadow: 'rgba(18, 73, 42, 0.6)',
  },
  purple: {
    accent: '#7C3AED',
    accentStrong: '#5B21B6',
    accentSoft: '#F3EEFD',
    accentSoftAlt: '#E8DFFD',
    accentBorder: 'rgba(124, 58, 237, 0.28)',
    accentShadow: 'rgba(53, 23, 105, 0.62)',
  },
  orange: {
    accent: '#EA580C',
    accentStrong: '#C2410C',
    accentSoft: '#FFF3EB',
    accentSoftAlt: '#FFE5D6',
    accentBorder: 'rgba(234, 88, 12, 0.28)',
    accentShadow: 'rgba(109, 44, 16, 0.56)',
  },
  red: {
    accent: '#DC2626',
    accentStrong: '#991B1B',
    accentSoft: '#FDEEED',
    accentSoftAlt: '#FADDDD',
    accentBorder: 'rgba(220, 38, 38, 0.28)',
    accentShadow: 'rgba(92, 26, 26, 0.55)',
  },
};

const HierarchicalNavGroup: React.FC<HierarchicalNavGroupProps> = ({
  menuItems,
  sidebarCollapsed: _sidebarCollapsed,
  instanceId,
}) => {
  const location = useLocation();
  const { user } = useAuth();
  const { activeSubmenuPanel, toggleSubmenuPanel, setActiveSubmenuPanel } = useSidebar();
  const submenuPanelRef = useRef<HTMLDivElement>(null);

  // Verificação se é admin
  const isAdmin =
    user?.role === 'superadmin' ||
    user?.role === 'admin' ||
    user?.role === 'manager' ||
    user?.email?.includes('admin');

  // Fechar painel ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const isClickInsideAnySubmenuPanel = Boolean(target.closest('[data-submenu-panel="true"]'));

      if (isClickInsideAnySubmenuPanel) {
        return;
      }

      if (
        activeSubmenuPanel &&
        submenuPanelRef.current &&
        !submenuPanelRef.current.contains(event.target as Node)
      ) {
        // Verificacao se o clique nao foi em um dos icones da sidebar
        const isClickOnSidebarIcon = target.closest('[data-sidebar-item]');

        if (!isClickOnSidebarIcon) {
          setActiveSubmenuPanel(null);
        }
      }
    };

    if (activeSubmenuPanel) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [activeSubmenuPanel, setActiveSubmenuPanel]);

  // Fecha painel de submenu somente quando a rota muda
  useEffect(() => {
    setActiveSubmenuPanel(null);
  }, [location.pathname, setActiveSubmenuPanel]);

  const getSubmenuPanelId = (menuId: string): string =>
    `${instanceId ? `${instanceId}-` : ''}submenu-panel-${menuId}`;

  const isMenuItemActive = (item: MenuConfig): boolean => {
    const currentPath = location.pathname;

    // Se o item tem href direto, verificar se é a rota atual
    if (item.href) {
      // Comparação exata - só considera ativo se for exatamente a rota
      return currentPath === item.href;
    }

    // Se o item tem filhos, verificar se algum filho está ativo
    if (item.children) {
      return item.children.some((child) => isMenuItemActive(child));
    }

    return false;
  };

  const isChildActive = (parent: MenuConfig): boolean => {
    if (!parent.children) return false;
    // ✅ Só retorna true se realmente tiver um filho com a rota ativa
    return parent.children.some((child) => {
      const currentPath = location.pathname;
      return child.href && currentPath === child.href;
    });
  };

  const renderMenuItem = (item: MenuConfig) => {
    // Filtrar itens admin-only
    if (item.adminOnly && !isAdmin) {
      return null;
    }

    const isActive = isMenuItemActive(item);
    const hasChildren = item.children && item.children.length > 0;
    const Icon = item.icon;
    const isPanelOpen = activeSubmenuPanel === item.id;
    const hasActiveChild = isChildActive(item);

    // ✅ Lógica corrigida: só marca como ativo se:
    // 1. O painel está aberto (clicou no item)
    // 2. OU tem um filho ativo (navegou para uma página filho)
    // Mas não os dois ao mesmo tempo para evitar duplicação visual
    const shouldHighlight = isPanelOpen || hasActiveChild;

    // Layout vertical: Ícone em cima, texto embaixo
    if (hasChildren) {
      // Item com submenu - clica para abrir painel suspenso
      return (
        <button
          key={item.id}
          data-sidebar-item
          onClick={() => toggleSubmenuPanel(item.id)}
          className={`
            sidebar-nav-link premium-sidebar-item group relative flex w-full min-h-11 items-center justify-start gap-3 rounded-xl border border-transparent px-3 py-3
            transition-all duration-200 ease-out
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#159A9C]/35 focus-visible:ring-offset-2 focus-visible:ring-offset-white md:focus-visible:ring-offset-[#002333]
            md:min-h-0 md:flex-col md:items-center md:justify-center md:gap-0 md:px-1 md:py-2.5
            ${shouldHighlight ? 'bg-[#159A9C]/20 border-[#159A9C]/35 shadow-[inset_0_0_0_1px_rgba(21,154,156,0.15)]' : 'hover:bg-white/8 hover:border-white/10'}
          `}
          title={item.title}
          aria-expanded={isPanelOpen}
          aria-controls={getSubmenuPanelId(item.id)}
        >
          <Icon
            className={`
            h-5 w-5 transition-colors duration-200 mb-0 md:mb-1.5
            ${shouldHighlight ? 'text-[#159A9C]' : 'text-white/80 group-hover:text-white'}
          `}
          />
          <span
            className={`
            text-xs md:text-[9px] font-semibold text-left md:text-center leading-tight max-w-full px-0 md:px-1 truncate uppercase tracking-wide
            ${shouldHighlight ? 'text-[#159A9C]' : 'text-white/90 group-hover:text-white'}
          `}
          >
            {item.title}
          </span>
          {/* Indicador de painel aberto ou filho ativo */}
          {shouldHighlight && (
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-9 md:h-10 bg-[#159A9C] rounded-l-full"></div>
          )}
        </button>
      );
    }

    // Item sem submenu - link direto
    // ✅ Não destacar se houver um painel aberto (prioridade visual para o painel)
    const shouldBeActive = isActive && !activeSubmenuPanel;

    return (
      <Link
        key={item.id}
        to={item.href || '#'}
        className={`
          sidebar-nav-link premium-sidebar-item group relative flex w-full min-h-11 items-center justify-start gap-3 rounded-xl border border-transparent px-3 py-3
          transition-all duration-200 ease-out
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#159A9C]/35 focus-visible:ring-offset-2 focus-visible:ring-offset-white md:focus-visible:ring-offset-[#002333]
          md:min-h-0 md:flex-col md:items-center md:justify-center md:gap-0 md:px-1 md:py-2.5
          ${shouldBeActive ? 'bg-[#159A9C]/20 border-[#159A9C]/35 shadow-[inset_0_0_0_1px_rgba(21,154,156,0.15)]' : 'hover:bg-white/8 hover:border-white/10'}
        `}
        title={item.title}
        aria-current={shouldBeActive ? 'page' : undefined}
      >
        <Icon
          className={`
          h-5 w-5 transition-colors duration-200 mb-0 md:mb-1.5
          ${shouldBeActive ? 'text-[#159A9C]' : 'text-white/80 group-hover:text-white'}
        `}
        />
        <span
          className={`
          text-xs md:text-[9px] font-semibold text-left md:text-center leading-tight max-w-full px-0 md:px-1 truncate uppercase tracking-wide
          ${shouldBeActive ? 'text-[#159A9C]' : 'text-white/90 group-hover:text-white'}
        `}
        >
          {item.title}
        </span>
        {item.badge && (
          <span className="absolute top-1 right-1 h-2 w-2 bg-[#159A9C] rounded-full"></span>
        )}
        {/* Indicador de ativo */}
        {shouldBeActive && (
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-9 md:h-10 bg-[#159A9C] rounded-l-full"></div>
        )}
      </Link>
    );
  };

  // Filtrar menus baseado nas permissões
  const filteredMenuItems = menuItems.filter((item) => {
    if (item.adminOnly && !isAdmin) {
      return false;
    }
    return true;
  });

  // Encontrar o item ativo para renderizar painel suspenso
  const activeItem = filteredMenuItems.find((item) => item.id === activeSubmenuPanel);
  const activeTheme = activeItem ? SUBMENU_THEMES[activeItem.color] : SUBMENU_THEMES.blue;
  const panelThemeVars = {
    '--submenu-accent': activeTheme.accent,
    '--submenu-accent-strong': activeTheme.accentStrong,
    '--submenu-accent-soft': activeTheme.accentSoft,
    '--submenu-accent-soft-alt': activeTheme.accentSoftAlt,
    '--submenu-accent-border': activeTheme.accentBorder,
    '--submenu-accent-shadow': activeTheme.accentShadow,
  } as React.CSSProperties;

  const groupedChildren = useMemo<SubmenuSection[]>(() => {
    if (!activeItem?.children?.length) {
      return [];
    }

    const grouped = new Map<string, MenuConfig[]>();
    const withoutGroup: MenuConfig[] = [];

    activeItem.children.forEach((child) => {
      if (child.group) {
        if (!grouped.has(child.group)) {
          grouped.set(child.group, []);
        }
        grouped.get(child.group)!.push(child);
        return;
      }

      withoutGroup.push(child);
    });

    const sections: SubmenuSection[] = [];
    let sectionIndex = 0;

    grouped.forEach((items, title) => {
      sections.push({
        id: `section-${sectionIndex++}`,
        title,
        items,
      });
    });

    if (withoutGroup.length > 0) {
      sections.push({
        id: `section-${sectionIndex++}`,
        title: grouped.size > 0 ? 'Outros' : undefined,
        items: withoutGroup,
      });
    }

    return sections;
  }, [activeItem]);

  const renderSubmenuChild = (child: MenuConfig, itemIndex: number) => {
    const isChildActive = isMenuItemActive(child);
    const ChildIcon = child.icon;
    const childHref = child.href ?? child.children?.[0]?.href;
    const itemAnimationStyle = {
      animationDelay: `${Math.min(itemIndex * 22, 220)}ms`,
    };
    const childClassName = `
      sidebar-nav-link premium-submenu-item submenu-child-item submenu-item-reveal group relative flex min-h-10 items-center gap-3 rounded-xl border px-3 py-2.5 text-left md:min-h-11 md:px-4 md:py-3
      transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#159A9C]/35
      ${isChildActive ? 'text-[#002333] font-semibold' : 'border-transparent text-[#334155] font-medium'}
    `;
    const activeItemStyle = isChildActive
      ? {
          borderColor: 'var(--submenu-accent-border)',
          background:
            'linear-gradient(90deg, var(--submenu-accent-soft) 0%, var(--submenu-accent-soft-alt) 45%, #F9FCFB 100%)',
          boxShadow: '0 14px 24px -20px var(--submenu-accent-shadow)',
        }
      : undefined;
    const itemStyle = {
      ...itemAnimationStyle,
      ...(activeItemStyle || {}),
    } as React.CSSProperties;

    const childContent = (
      <>
        {isChildActive && (
          <div
            className="absolute left-0 top-1/2 h-8 w-1 -translate-y-1/2 rounded-r-full"
            style={{
              background:
                'linear-gradient(180deg, var(--submenu-accent) 0%, var(--submenu-accent-strong) 100%)',
            }}
          />
        )}
        <div
          className={`submenu-child-icon flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg transition-all duration-200 ${
            isChildActive
              ? 'text-[color:var(--submenu-accent)] shadow-[inset_0_1px_0_rgba(255,255,255,0.85)]'
              : 'text-[#94A3B8]'
          }`}
          style={
            isChildActive
              ? {
                  backgroundColor: 'var(--submenu-accent-soft-alt)',
                }
              : undefined
          }
        >
          <ChildIcon
            className={`h-4 w-4 transition-transform duration-200 ${
              isChildActive ? 'scale-105' : 'group-hover:scale-110'
            }`}
          />
        </div>
        <span className="truncate text-[14px] leading-5">{child.title}</span>
        <div className="ml-auto flex items-center gap-2 pl-2">
          {child.badge && (
            <span
              className="rounded-full px-2 py-0.5 text-[11px] font-semibold text-white shadow-sm"
              style={{ backgroundColor: 'var(--submenu-accent)' }}
            >
              {child.badge}
            </span>
          )}
          <ChevronRight
            className={`submenu-child-chevron h-4 w-4 transition-all duration-200 ${
              isChildActive
                ? 'translate-x-0 opacity-100'
                : 'translate-x-0.5 opacity-45 text-[#8FA4AD] group-hover:translate-x-0 group-hover:opacity-100'
            }`}
            style={isChildActive ? { color: 'var(--submenu-accent)' } : undefined}
          />
        </div>
      </>
    );

    if (childHref) {
      return (
        <Link
          key={child.id}
          to={childHref}
          className={childClassName}
          style={itemStyle}
          aria-current={isChildActive ? 'page' : undefined}
        >
          {childContent}
        </Link>
      );
    }

    return (
      <button
        key={child.id}
        type="button"
        className={childClassName}
        style={itemStyle}
        onClick={() => setActiveSubmenuPanel(null)}
      >
        {childContent}
      </button>
    );
  };

  return (
    <>
      {/* Barra de ícones verticais */}
      <nav
        className="flex-1 px-2 py-2.5 space-y-1.5 md:px-1 md:space-y-1"
        aria-label="Menu principal"
      >
        {filteredMenuItems.map((item) => renderMenuItem(item))}
      </nav>

      {/* Backdrop */}
      {activeItem && activeItem.children && activeItem.children.length > 0 && (
        <div
          className={`fixed inset-0 left-0 md:left-[75px] bg-[#002333]/35 backdrop-blur-[1px] ${UI_LAYERS.SUBMENU_BACKDROP} transition-opacity duration-300 pointer-events-auto`}
          onClick={() => setActiveSubmenuPanel(null)}
          aria-hidden="true"
        />
      )}

      {/* Painel Suspenso de Submenus */}
      {activeItem && activeItem.children && activeItem.children.length > 0 && (
        <div
          ref={submenuPanelRef}
          id={getSubmenuPanelId(activeItem.id)}
          data-submenu-panel="true"
          className={`premium-submenu-panel fixed inset-y-0 left-0 ${UI_LAYERS.SUBMENU_PANEL} w-[min(90vw,332px)] overflow-y-auto border-r border-[#cfe1e5]/90 bg-white/95 shadow-2xl backdrop-blur-sm animate-slide-in md:left-[75px] md:w-[264px]`}
          style={{
            animation: 'slideIn 0.24s cubic-bezier(0.22, 1, 0.36, 1)',
            pointerEvents: 'auto',
            ...panelThemeVars,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header do painel */}
          <div
            className={`relative sticky top-0 flex items-center justify-between border-b border-gray-200/70 bg-white/95 px-4 py-4 backdrop-blur-sm ${UI_LAYERS.TOPBAR_HEADER}`}
          >
            <div
              className="pointer-events-none absolute inset-x-0 bottom-0 h-px"
              style={{
                background:
                  'linear-gradient(90deg, transparent 0%, var(--submenu-accent-border) 50%, transparent 100%)',
              }}
            />
            <div className="flex items-center gap-3">
              <div
                className="flex h-9 w-9 items-center justify-center rounded-xl border shadow-[inset_0_1px_0_rgba(255,255,255,0.85)]"
                style={{
                  borderColor: 'var(--submenu-accent-border)',
                  backgroundColor: 'var(--submenu-accent-soft-alt)',
                }}
              >
                {React.createElement(activeItem.icon, {
                  className: 'h-4 w-4',
                  style: { color: 'var(--submenu-accent)' },
                })}
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#7B8794]">
                  Modulos
                </p>
                <h3 className="truncate text-[18px] font-semibold leading-tight text-[#002333]">
                  {activeItem.title}
                </h3>
              </div>
            </div>
            <button
              onClick={() => toggleSubmenuPanel(activeItem.id)}
              className="submenu-close-btn min-h-11 min-w-11 rounded-xl border border-transparent p-2 transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#159A9C]/35 md:min-h-0 md:min-w-0 md:p-1.5"
              title="Fechar painel"
            >
              <X className="h-4 w-4 text-gray-500" />
            </button>
          </div>

          {/* Lista de submenus */}
          <div className="space-y-3 p-2.5 md:p-3">
            {groupedChildren.map((section) => (
              <section
                key={section.id}
                className="rounded-2xl border border-[#DFE9EC]/80 bg-white/72 p-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.75)]"
              >
                {section.title && (
                  <div className="mb-2 px-2">
                    <div className="flex items-center gap-2">
                      <span className="h-px flex-1 bg-gradient-to-r from-transparent via-[#d5e5e8] to-[#d5e5e8]" />
                      <span className="text-[9px] font-semibold uppercase tracking-[0.16em] text-[#7B8794] md:text-[10px]">
                        {section.title}
                      </span>
                      <span className="h-px flex-1 bg-gradient-to-l from-transparent via-[#d5e5e8] to-[#d5e5e8]" />
                    </div>
                  </div>
                )}
                <div className="space-y-1.5">
                  {section.items.map((child, itemIndex) => renderSubmenuChild(child, itemIndex))}
                </div>
              </section>
            ))}
          </div>
        </div>
      )}
    </>
  );
};

export default HierarchicalNavGroup;
