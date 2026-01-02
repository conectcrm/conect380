import React, { useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ChevronDown, ChevronRight, X } from 'lucide-react';
import { MenuConfig } from '../../config/menuConfig';
import { useAuth } from '../../hooks/useAuth';
import { useMenu } from '../../contexts/MenuContext';
import { useSidebar } from '../../contexts/SidebarContext';
import './sidebar-animations.css';
import './menu-improvements.css';

interface HierarchicalNavGroupProps {
  menuItems: MenuConfig[];
  sidebarCollapsed: boolean;
}

const HierarchicalNavGroup: React.FC<HierarchicalNavGroupProps> = ({
  menuItems,
  sidebarCollapsed,
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { expandedMenus, toggleMenu, isMenuExpanded, expandMenu } = useMenu();
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
      if (
        activeSubmenuPanel &&
        submenuPanelRef.current &&
        !submenuPanelRef.current.contains(event.target as Node)
      ) {
        // Verificar se o clique não foi em um dos ícones da sidebar
        const target = event.target as HTMLElement;
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

  // Auto-expandir menu baseado na rota atual (apenas se ainda não foi manualmente controlado)
  useEffect(() => {
    const currentPath = location.pathname;

    // Encontrar qual menu pai deve estar expandido baseado na rota atual
    const menuToExpand = menuItems.find((menu) => {
      if (menu.children) {
        return menu.children.some((child) => child.href && currentPath === child.href);
      }
      return false;
    });

    // Só auto-expandir se o menu não estiver expandido E se não foi manualmente fechado antes
    if (menuToExpand && !expandedMenus.includes(menuToExpand.id)) {
      // Verificar se não há uma intenção manual prévia armazenada
      const manuallyClosedMenus = JSON.parse(localStorage.getItem('manually-closed-menus') || '[]');

      if (!manuallyClosedMenus.includes(menuToExpand.id)) {
        expandMenu(menuToExpand.id);
      }
    }
  }, [location.pathname, menuItems, expandedMenus, expandMenu]);

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

  const getColorClasses = (color: string, active: boolean = false, isChild: boolean = false) => {
    const crevassePalette = {
      primary: '#159A9C',
      primaryLight: '#DEEFE7',
      neutral: '#B4BEC9',
      dark: '#002333',
      white: '#FFFFFF',
    };

    const baseClasses = {
      blue: {
        hover: 'hover:bg-[#DEEFE7]',
        active: active ? 'bg-[#DEEFE7] border-r-2 border-[#159A9C]' : '',
        text: active ? 'text-[#002333]' : 'text-[#002333]',
        icon: active ? 'text-[#159A9C]' : 'text-[#B4BEC9]',
        badge: 'bg-[#159A9C]',
      },
      green: {
        hover: 'hover:bg-[#DEEFE7]',
        active: active ? 'bg-[#DEEFE7] border-r-2 border-[#159A9C]' : '',
        text: active ? 'text-[#002333]' : 'text-[#002333]',
        icon: active ? 'text-[#159A9C]' : 'text-[#B4BEC9]',
        badge: 'bg-[#159A9C]',
      },
      orange: {
        hover: 'hover:bg-[#DEEFE7]',
        active: active ? 'bg-[#DEEFE7] border-r-2 border-[#159A9C]' : '',
        text: active ? 'text-[#002333]' : 'text-[#002333]',
        icon: active ? 'text-[#159A9C]' : 'text-[#B4BEC9]',
        badge: 'bg-[#159A9C]',
      },
      purple: {
        hover: 'hover:bg-[#DEEFE7]',
        active: active ? 'bg-[#DEEFE7] border-r-2 border-[#159A9C]' : '',
        text: active ? 'text-[#002333]' : 'text-[#002333]',
        icon: active ? 'text-[#159A9C]' : 'text-[#B4BEC9]',
        badge: 'bg-[#159A9C]',
      },
      red: {
        hover: 'hover:bg-[#DEEFE7]',
        active: active ? 'bg-[#DEEFE7] border-r-2 border-[#159A9C]' : '',
        text: active ? 'text-[#002333]' : 'text-[#002333]',
        icon: active ? 'text-[#159A9C]' : 'text-[#B4BEC9]',
        badge: 'bg-[#159A9C]',
      },
    };

    return baseClasses[color as keyof typeof baseClasses] || baseClasses.blue;
  };

  // Função para lidar com toggle manual de menu
  const handleMenuToggle = (menuId: string) => {
    const isCurrentlyExpanded = isMenuExpanded(menuId);

    // Se estiver expandindo para fechado, marcar como manualmente fechado
    if (isCurrentlyExpanded) {
      const manuallyClosedMenus = JSON.parse(localStorage.getItem('manually-closed-menus') || '[]');
      if (!manuallyClosedMenus.includes(menuId)) {
        localStorage.setItem(
          'manually-closed-menus',
          JSON.stringify([...manuallyClosedMenus, menuId]),
        );
      }
    } else {
      // Se estiver abrindo, remover da lista de fechados manualmente
      const manuallyClosedMenus = JSON.parse(localStorage.getItem('manually-closed-menus') || '[]');
      const filtered = manuallyClosedMenus.filter((id: string) => id !== menuId);
      localStorage.setItem('manually-closed-menus', JSON.stringify(filtered));
    }

    toggleMenu(menuId);
  };

  const renderMenuItem = (item: MenuConfig, isChild: boolean = false) => {
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
            group flex flex-col items-center justify-center relative
            w-full py-2.5 px-1 rounded-lg
            transition-all duration-200 ease-in-out
            focus:outline-none focus:ring-2 focus:ring-[#159A9C]/20
            ${shouldHighlight ? 'bg-[#159A9C]/20' : 'hover:bg-white/5'}
          `}
          title={item.title}
        >
          <Icon
            className={`
            h-5 w-5 transition-colors duration-200 mb-1.5
            ${shouldHighlight ? 'text-[#159A9C]' : 'text-white/80 group-hover:text-white'}
          `}
          />
          <span
            className={`
            text-[9px] font-semibold text-center leading-tight max-w-full px-1 truncate uppercase tracking-wide
            ${shouldHighlight ? 'text-[#159A9C]' : 'text-white/90 group-hover:text-white'}
          `}
          >
            {item.title}
          </span>
          {/* Indicador de painel aberto ou filho ativo */}
          {shouldHighlight && (
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-10 bg-[#159A9C] rounded-l-full"></div>
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
          group flex flex-col items-center justify-center relative
          w-full py-2.5 px-1 rounded-lg
          transition-all duration-200 ease-in-out
          focus:outline-none focus:ring-2 focus:ring-[#159A9C]/20
          ${shouldBeActive ? 'bg-[#159A9C]/20' : 'hover:bg-white/5'}
        `}
        title={item.title}
        aria-current={shouldBeActive ? 'page' : undefined}
      >
        <Icon
          className={`
          h-5 w-5 transition-colors duration-200 mb-1.5
          ${shouldBeActive ? 'text-[#159A9C]' : 'text-white/80 group-hover:text-white'}
        `}
        />
        <span
          className={`
          text-[9px] font-semibold text-center leading-tight max-w-full px-1 truncate uppercase tracking-wide
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
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-10 bg-[#159A9C] rounded-l-full"></div>
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
  const activeItem = filteredMenuItems.find(item => item.id === activeSubmenuPanel);

  return (
    <>
      {/* Barra de ícones verticais */}
      <nav className="flex-1 px-1 py-2 space-y-1">
        {filteredMenuItems.map((item) => renderMenuItem(item))}
      </nav>

      {/* Backdrop */}
      {activeItem && activeItem.children && activeItem.children.length > 0 && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[9] transition-opacity duration-300"
          onClick={() => setActiveSubmenuPanel(null)}
          style={{ left: '75px', pointerEvents: 'auto' }}
        />
      )}

      {/* Painel Suspenso de Submenus */}
      {activeItem && activeItem.children && activeItem.children.length > 0 && (
        <div
          ref={submenuPanelRef}
          className="fixed left-[75px] top-0 bottom-0 w-[240px] bg-white border-r border-gray-200 shadow-2xl z-[50] overflow-y-auto animate-slide-in"
          style={{
            animation: 'slideIn 0.25s ease-out',
            pointerEvents: 'auto'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header do painel */}
          <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-4 flex items-center justify-between z-10">
            <div className="flex items-center gap-2">
              {React.createElement(activeItem.icon, { className: "h-5 w-5 text-[#159A9C]" })}
              <h3 className="font-semibold text-[#002333]">{activeItem.title}</h3>
            </div>
            <button
              onClick={() => toggleSubmenuPanel(activeItem.id)}
              className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              title="Fechar painel"
            >
              <X className="h-4 w-4 text-gray-500" />
            </button>
          </div>

          {/* Lista de submenus */}
          <div className="p-3">
            {activeItem.children.map((child) => {
              const isChildActive = isMenuItemActive(child);
              const ChildIcon = child.icon;

              return (
                <div
                  key={child.id}
                  className={`
                    group flex items-center gap-3 px-4 py-3 rounded-lg mb-1 relative
                    transition-all duration-200 cursor-pointer
                    ${isChildActive
                      ? 'bg-[#DEEFE7] text-[#002333] font-semibold shadow-sm'
                      : 'text-[#4B5563] hover:bg-[#DEEFE7]/50 hover:text-[#002333]'
                    }
                  `}
                  style={{ zIndex: 20, pointerEvents: 'auto' }}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();

                    if (child.href) {
                      navigate(child.href);
                      setTimeout(() => {
                        setActiveSubmenuPanel(null);
                      }, 100);
                    }
                  }}
                >
                  {/* Barra lateral indicadora (igual aos ícones principais) */}
                  {isChildActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-[#159A9C] rounded-r-full" />
                  )}

                  <ChildIcon className={`h-5 w-5 flex-shrink-0 transition-transform group-hover:scale-110 ${isChildActive ? 'text-[#159A9C]' : 'text-gray-400 group-hover:text-[#159A9C]'}`} />
                  <span className="text-[15px] truncate">{child.title}</span>
                  {child.badge && (
                    <span className="ml-auto text-xs bg-[#159A9C] text-white px-2 py-0.5 rounded-full font-medium">
                      {child.badge}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
};

export default HierarchicalNavGroup;
