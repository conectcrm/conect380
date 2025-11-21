import React, { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { MenuConfig } from '../../config/menuConfig';
import { useAuth } from '../../hooks/useAuth';
import { useMenu } from '../../contexts/MenuContext';
import './sidebar-animations.css';
import './menu-improvements.css';

interface HierarchicalNavGroupProps {
  menuItems: MenuConfig[];
  sidebarCollapsed: boolean;
}

const HierarchicalNavGroup: React.FC<HierarchicalNavGroupProps> = ({
  menuItems,
  sidebarCollapsed
}) => {
  const location = useLocation();
  const { user } = useAuth();
  const { expandedMenus, toggleMenu, isMenuExpanded, expandMenu } = useMenu();

  // Verificação se é admin
  const isAdmin = user?.role === 'admin' || user?.role === 'manager' || user?.email?.includes('admin');

  // Auto-expandir menu baseado na rota atual (apenas se ainda não foi manualmente controlado)
  useEffect(() => {
    const currentPath = location.pathname;

    // Encontrar qual menu pai deve estar expandido baseado na rota atual
    const menuToExpand = menuItems.find(menu => {
      if (menu.children) {
        return menu.children.some(child => child.href && currentPath === child.href);
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
      return item.children.some(child => isMenuItemActive(child));
    }

    return false;
  };

  const isChildActive = (parent: MenuConfig): boolean => {
    if (!parent.children) return false;
    return parent.children.some(child => isMenuItemActive(child));
  };

  const getColorClasses = (color: string, active: boolean = false, isChild: boolean = false) => {
    const crevassePalette = {
      primary: '#159A9C',
      primaryLight: '#DEEFE7',
      neutral: '#B4BEC9',
      dark: '#002333',
      white: '#FFFFFF'
    };

    const baseClasses = {
      blue: {
        hover: 'hover:bg-[#DEEFE7]',
        active: active ? 'bg-[#DEEFE7] border-r-2 border-[#159A9C]' : '',
        text: active ? 'text-[#002333]' : 'text-[#002333]',
        icon: active ? 'text-[#159A9C]' : 'text-[#B4BEC9]',
        badge: 'bg-[#159A9C]'
      },
      green: {
        hover: 'hover:bg-[#DEEFE7]',
        active: active ? 'bg-[#DEEFE7] border-r-2 border-[#159A9C]' : '',
        text: active ? 'text-[#002333]' : 'text-[#002333]',
        icon: active ? 'text-[#159A9C]' : 'text-[#B4BEC9]',
        badge: 'bg-[#159A9C]'
      },
      orange: {
        hover: 'hover:bg-[#DEEFE7]',
        active: active ? 'bg-[#DEEFE7] border-r-2 border-[#159A9C]' : '',
        text: active ? 'text-[#002333]' : 'text-[#002333]',
        icon: active ? 'text-[#159A9C]' : 'text-[#B4BEC9]',
        badge: 'bg-[#159A9C]'
      },
      purple: {
        hover: 'hover:bg-[#DEEFE7]',
        active: active ? 'bg-[#DEEFE7] border-r-2 border-[#159A9C]' : '',
        text: active ? 'text-[#002333]' : 'text-[#002333]',
        icon: active ? 'text-[#159A9C]' : 'text-[#B4BEC9]',
        badge: 'bg-[#159A9C]'
      },
      red: {
        hover: 'hover:bg-[#DEEFE7]',
        active: active ? 'bg-[#DEEFE7] border-r-2 border-[#159A9C]' : '',
        text: active ? 'text-[#002333]' : 'text-[#002333]',
        icon: active ? 'text-[#159A9C]' : 'text-[#B4BEC9]',
        badge: 'bg-[#159A9C]'
      }
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
        localStorage.setItem('manually-closed-menus', JSON.stringify([...manuallyClosedMenus, menuId]));
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
    const isExpanded = isMenuExpanded(item.id);
    const colorClasses = getColorClasses(item.color, isActive, isChild);
    const Icon = item.icon;

    // Se o item tem filhos, renderizar como botão expansível (ou ícone quando colapsado)
    if (hasChildren) {
      // Se sidebar colapsada, mostrar apenas o ícone do núcleo principal
      if (sidebarCollapsed) {
        return (
          <Link
            key={item.id}
            to={item.href || (item.children?.[0]?.href || '#')}
            className={`
              group flex items-center relative
              transition-all duration-200 ease-in-out
              focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:ring-offset-2
              justify-center flex-col p-3 mx-1 rounded-lg
              ${colorClasses.hover} ${isChildActive(item) ? colorClasses.active : ''}
            `}
            title={item.title}
            aria-current={isChildActive(item) ? 'page' : undefined}
          >
            <div className="flex flex-col items-center">
              <Icon className={`
                h-6 w-6 transition-colors duration-200 
                ${isChildActive(item) ? colorClasses.icon.replace('text-[#B4BEC9]', 'text-[#159A9C]') : colorClasses.icon}
              `} />
              {isChildActive(item) && (
                <div className="w-1.5 h-1.5 bg-[#159A9C] rounded-full mt-1"></div>
              )}
            </div>

            {/* Tooltip para sidebar colapsada */}
            <div className="tooltip-improved">
              <div className="font-semibold">{item.title}</div>
              {item.children && item.children.length > 0 && (
                <div className="text-xs mt-1 text-gray-300 opacity-80">
                  {item.children.slice(0, 3).map(child => child.title).join(' • ')}
                  {item.children.length > 3 && '...'}
                </div>
              )}
            </div>
          </Link>
        );
      }

      // Se sidebar expandida, mostrar menu com dropdown
      return (
        <div key={item.id} className="space-y-1">
          <button
            onClick={() => handleMenuToggle(item.id)}
            className={`
              w-full group flex items-center justify-between
              px-3 py-2 text-sm font-medium rounded-lg
              transition-all duration-200 ease-in-out
              focus:outline-none focus:ring-2 focus:ring-blue-500/20
              ${colorClasses.hover} ${isChildActive(item) ? colorClasses.active : ''}
              ${!isChild ? 'hover:translate-x-1 hover:shadow-sm' : ''}
              ${isChild ? 'ml-0 pl-3' : ''}
            `}
            aria-expanded={isExpanded}
            aria-controls={`submenu-${item.id}`}
          >
            <div className="flex items-center min-w-0 flex-1">
              <Icon className={`
                flex-shrink-0 mr-3 h-5 w-5 transition-colors duration-200
                ${isChildActive(item) ? colorClasses.icon.replace('text-[#B4BEC9]', 'text-[#159A9C]') : colorClasses.icon}
              `} />
              <span className={`
                truncate transition-colors duration-200
                ${isChildActive(item) ? 'text-[#002333] font-semibold' : colorClasses.text}
              `}>
                {item.title}
              </span>
              {item.badge && (
                <span className={`ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium text-white ${colorClasses.badge}`}>
                  {item.badge}
                </span>
              )}
            </div>
            <ChevronDown
              className={`
                flex-shrink-0 ml-2 h-4 w-4 text-gray-400 transition-transform duration-200
                ${isExpanded ? 'rotate-180' : ''}
                ${isChildActive(item) ? 'text-[#159A9C]' : ''}
              `}
            />
          </button>

          {/* Submenu */}
          <div
            id={`submenu-${item.id}`}
            className={`
            overflow-hidden transition-all duration-300 ease-in-out
            ${isExpanded ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'}
          `}
            aria-hidden={!isExpanded}
          >
            <div className="pl-8 ml-2 border-l-2 border-[#DEEFE7]/60 space-y-1">
              {item.children?.map(child => renderMenuItem(child, true))}
            </div>
          </div>
        </div>
      );
    }

    // Se o item não tem filhos ou a sidebar está colapsada, renderizar como link
    const linkContent = (
      <>
        {sidebarCollapsed ? (
          <div className="flex flex-col items-center">
            <Icon className={`h-5 w-5 transition-colors duration-200 ${colorClasses.icon}`} />
            {isActive && (
              <div className="w-1 h-1 bg-[#159A9C] rounded-full mt-1"></div>
            )}
          </div>
        ) : (
          <>
            <div className="flex items-center min-w-0 flex-1">
              <Icon className={`
                flex-shrink-0 mr-3 h-5 w-5 transition-colors duration-200
                ${isActive ? colorClasses.icon.replace('text-[#B4BEC9]', 'text-[#159A9C]') : colorClasses.icon}
              `} />
              <span className={`
                truncate transition-colors duration-200
                ${isActive ? 'text-[#002333] font-semibold' : colorClasses.text}
              `}>
                {item.title}
              </span>
              {item.badge && (
                <span className={`ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium text-white ${colorClasses.badge}`}>
                  {item.badge}
                </span>
              )}
            </div>
            {hasChildren && (
              <ChevronRight className="flex-shrink-0 ml-2 h-4 w-4 text-gray-400" />
            )}
          </>
        )}
      </>
    );

    if (item.href) {
      return (
        <Link
          key={item.id}
          to={item.href}
          className={`
            group flex items-center relative
            transition-all duration-200 ease-in-out
            focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:ring-offset-2
            ${sidebarCollapsed ? 'justify-center flex-col p-2 mx-1' : `px-3 py-2 rounded-lg ${colorClasses.hover} ${isActive ? colorClasses.active : ''} ${!isChild ? 'hover:translate-x-1 hover:shadow-sm' : ''}`}
            ${isChild ? 'ml-0 pl-3' : ''}
          `}
          title={item.title}
          aria-current={isActive ? 'page' : undefined}
        >
          {linkContent}

          {/* Tooltip para sidebar colapsada */}
          {sidebarCollapsed && (
            <div className="tooltip-improved">
              <div className="font-semibold">{item.title}</div>
            </div>
          )}
        </Link>
      );
    }

    return null;
  };

  // Filtrar menus baseado nas permissões
  const filteredMenuItems = menuItems.filter(item => {
    if (item.adminOnly && !isAdmin) {
      return false;
    }
    return true;
  });

  // Agrupar menus por seção para exibir cabeçalhos quando a sidebar está expandida
  const groupedMenuItems = filteredMenuItems.reduce(
    (sections: { name: string; items: MenuConfig[] }[], item) => {
      const sectionName = item.section || 'Outros';
      const existingSection = sections.find(section => section.name === sectionName);

      if (existingSection) {
        existingSection.items.push(item);
      } else {
        sections.push({ name: sectionName, items: [item] });
      }

      return sections;
    },
    []
  );

  const isSectionActive = (items: MenuConfig[]) => items.some(item => isMenuItemActive(item));

  return (
    <nav className={`flex-1 ${sidebarCollapsed ? 'px-1 space-y-1' : 'px-2 space-y-4'}`}>
      {groupedMenuItems.map((section, index) => {
        if (sidebarCollapsed) {
          return section.items.map(item => renderMenuItem(item));
        }

        const sectionActive = isSectionActive(section.items);

        return (
          <div
            key={section.name}
            className={`space-y-2 ${index > 0 ? 'pt-6 mt-2' : ''}`}
          >
            {index > 0 && (
              <div className="mx-3 border-t border-[#DEEFE7]/60"></div>
            )}
            <div className="px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[#B4BEC9] flex items-center gap-2">
              <span className={`h-1.5 w-1.5 rounded-full transition-colors duration-200 ${sectionActive ? 'bg-[#159A9C]' : 'bg-[#B4BEC9]'}`} />
              <span className={`transition-colors duration-200 ${sectionActive ? 'text-[#159A9C]' : ''}`}>
                {section.name}
              </span>
            </div>
            <div className="space-y-1">
              {section.items.map(item => renderMenuItem(item))}
            </div>
          </div>
        );
      })}
    </nav>
  );
};

export default HierarchicalNavGroup;