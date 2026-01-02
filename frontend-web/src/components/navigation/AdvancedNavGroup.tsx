import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { ChevronDown, ChevronRight, Dot } from 'lucide-react';

export interface NavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType<any>;
  notifications: number;
  badge?: string; // Novo: badge customizado (ex: "Novo", "Beta")
  isNew?: boolean; // Indicador de funcionalidade nova
}

export interface NavigationGroup {
  title: string;
  icon?: React.ComponentType<any>;
  items: NavigationItem[];
  defaultExpanded?: boolean;
  color?: 'blue' | 'green' | 'purple' | 'orange' | 'red'; // Cores temáticas
}

interface AdvancedNavGroupProps extends NavigationGroup {
  sidebarCollapsed: boolean;
  groupId: string; // Para salvar estado local
}

const AdvancedNavGroup: React.FC<AdvancedNavGroupProps> = ({
  title,
  items,
  sidebarCollapsed,
  icon: GroupIcon,
  defaultExpanded = true,
  groupId,
  color = 'blue',
}) => {
  // Salvar estado do grupo no localStorage
  const [isExpanded, setIsExpanded] = useState(() => {
    const saved = localStorage.getItem(`nav-group-${groupId}`);
    return saved !== null ? JSON.parse(saved) : defaultExpanded;
  });

  const location = useLocation();

  // Verificar se algum item do grupo está ativo
  const hasActiveItem = items.some((item) => location.pathname === item.href);
  const activeItem = items.find((item) => location.pathname === item.href);

  // Auto-expandir se algum item estiver ativo
  useEffect(() => {
    if (hasActiveItem && !isExpanded) {
      setIsExpanded(true);
    }
  }, [hasActiveItem, isExpanded]);

  // Salvar estado quando expandir/colapsar
  const toggleExpanded = () => {
    const newState = !isExpanded;
    setIsExpanded(newState);
    localStorage.setItem(`nav-group-${groupId}`, JSON.stringify(newState));
  };

  // Total de notificações do grupo
  const totalNotifications = items.reduce((sum, item) => sum + item.notifications, 0);
  const hasNewItems = items.some((item) => item.isNew);

  // Cores por tema - usando classes estáticas para compatibilidade com Tailwind
  const getColorClasses = (color: string, isActive: boolean) => {
    const baseClasses = {
      blue: {
        active: 'bg-blue-50 border-blue-500 text-blue-700',
        hover: 'hover:bg-blue-50 hover:text-blue-700',
        icon: 'text-blue-600',
        border: 'border-blue-500',
      },
      green: {
        active: 'bg-green-50 border-green-500 text-green-700',
        hover: 'hover:bg-green-50 hover:text-green-700',
        icon: 'text-green-600',
        border: 'border-green-500',
      },
      orange: {
        active: 'bg-orange-50 border-orange-500 text-orange-700',
        hover: 'hover:bg-orange-50 hover:text-orange-700',
        icon: 'text-orange-600',
        border: 'border-orange-500',
      },
      purple: {
        active: 'bg-purple-50 border-purple-500 text-purple-700',
        hover: 'hover:bg-purple-50 hover:text-purple-700',
        icon: 'text-purple-600',
        border: 'border-purple-500',
      },
      red: {
        active: 'bg-red-50 border-red-500 text-red-700',
        hover: 'hover:bg-red-50 hover:text-red-700',
        icon: 'text-red-600',
        border: 'border-red-500',
      },
    };

    return baseClasses[color as keyof typeof baseClasses] || baseClasses.blue;
  };

  const colorClasses = getColorClasses(color, hasActiveItem);

  if (sidebarCollapsed) {
    // Quando sidebar está colapsada
    return (
      <div className="space-y-2">
        {/* Separador visual */}
        <div className="w-6 h-px bg-gray-200 mx-auto"></div>

        {/* Indicador do grupo quando colapsado */}
        {GroupIcon && (
          <div
            className={`flex justify-center p-2 rounded-lg ${hasActiveItem ? colorClasses.active : 'text-gray-400'} group relative`}
          >
            <GroupIcon className="w-5 h-5" />
            {totalNotifications > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-red-500 to-red-600 text-white text-xs font-bold rounded-full flex items-center justify-center">
                {totalNotifications > 9 ? '9+' : totalNotifications}
              </span>
            )}
            {hasNewItems && (
              <span className="absolute -top-1 -left-1 w-3 h-3 bg-green-500 rounded-full animate-pulse"></span>
            )}

            {/* Tooltip do grupo */}
            <div className="absolute left-full ml-3 px-3 py-2 bg-gray-800 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-[60] shadow-lg">
              <div className="font-semibold">{title}</div>
              <div className="text-xs text-gray-300">{items.length} módulos</div>
              {activeItem && (
                <div className="text-xs text-blue-300 mt-1">Ativo: {activeItem.name}</div>
              )}
            </div>
          </div>
        )}

        {items.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.name}
              to={item.href}
              className={`${
                isActive
                  ? `${colorClasses.active} border-r-2 ${colorClasses.border} shadow-sm`
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 hover:shadow-sm'
              } group flex items-center justify-center px-2 py-4 mx-1 rounded-lg ${colorClasses.hover} text-sm font-medium transition-all duration-300 ease-in-out relative transform hover:scale-105`}
              title={item.name}
            >
              <Icon
                className={`${
                  isActive ? colorClasses.icon : 'text-gray-400 group-hover:text-gray-500'
                } h-6 w-6 transition-colors flex-shrink-0`}
              />

              {/* Indicador visual para item ativo */}
              {isActive && (
                <div
                  className={`absolute -left-1 top-1/2 transform -translate-y-1/2 w-1 h-8 ${colorClasses.border.replace('border-', 'bg-')} rounded-r-full`}
                ></div>
              )}

              {/* Badge de notificação */}
              {item.notifications > 0 && (
                <span className="absolute -top-1 -right-1 inline-flex items-center justify-center w-5 h-5 text-xs font-bold leading-none text-white bg-gradient-to-r from-red-500 to-red-600 rounded-full shadow-md">
                  {item.notifications > 9 ? '9+' : item.notifications}
                </span>
              )}

              {/* Badge de novo item */}
              {item.isNew && (
                <span className="absolute -top-1 -left-1 w-3 h-3 bg-green-500 rounded-full animate-pulse"></span>
              )}

              {/* Tooltip */}
              <div className="absolute left-full ml-3 px-2 py-1 bg-gray-800 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-[60] shadow-lg">
                {item.name}
                {item.notifications > 0 && (
                  <span className="ml-2 text-red-300">({item.notifications})</span>
                )}
                {item.badge && <span className="ml-2 text-yellow-300">{item.badge}</span>}
              </div>
            </Link>
          );
        })}
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {/* Header do Grupo - Clicável para expandir/colapsar */}
      <button
        onClick={toggleExpanded}
        className={`w-full flex items-center justify-between px-3 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider ${colorClasses.hover} rounded-lg transition-all duration-200 group ${
          hasActiveItem ? colorClasses.active : ''
        }`}
      >
        <div className="flex items-center gap-3">
          {GroupIcon && (
            <GroupIcon
              className={`w-4 h-4 ${hasActiveItem ? colorClasses.icon : 'text-gray-400 group-hover:text-gray-600'}`}
            />
          )}
          <span className="font-semibold">{title}</span>

          {/* Badges do grupo */}
          <div className="flex items-center gap-1">
            {totalNotifications > 0 && (
              <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-gradient-to-r from-red-500 to-red-600 rounded-full">
                {totalNotifications > 9 ? '9+' : totalNotifications}
              </span>
            )}
            {hasNewItems && (
              <span className="inline-flex items-center px-2 py-1 text-xs font-bold leading-none text-green-700 bg-green-100 rounded-full">
                Novo
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">{items.length}</span>
          {isExpanded ? (
            <ChevronDown className="w-4 h-4 transition-transform duration-200" />
          ) : (
            <ChevronRight className="w-4 h-4 transition-transform duration-200" />
          )}
        </div>
      </button>

      {/* Items do Grupo - Animação de expansão */}
      <div
        className={`transition-all duration-300 ease-in-out overflow-hidden ${
          isExpanded ? 'max-h-[800px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="space-y-1 pl-2 pt-1">
          {items.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`${
                  isActive
                    ? `${colorClasses.active} border-r-2 ${colorClasses.border} shadow-sm`
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                } group flex items-center px-3 py-2.5 text-sm font-medium rounded-l-lg transition-all duration-200 relative hover:pl-4`}
              >
                <Icon
                  className={`${
                    isActive ? colorClasses.icon : 'text-gray-400 group-hover:text-gray-500'
                  } mr-3 h-5 w-5 transition-colors flex-shrink-0`}
                />

                <span className="flex-1 truncate">{item.name}</span>

                {/* Badges e notificações */}
                <div className="flex items-center gap-2">
                  {item.badge && (
                    <span className="inline-flex items-center px-2 py-1 text-xs font-medium text-yellow-700 bg-yellow-100 rounded-full">
                      {item.badge}
                    </span>
                  )}
                  {item.isNew && <Dot className="w-4 h-4 text-green-500 animate-pulse" />}
                  {item.notifications > 0 && (
                    <span className="ml-2 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-gradient-to-r from-red-500 to-red-600 rounded-full shadow-sm">
                      {item.notifications > 9 ? '9+' : item.notifications}
                    </span>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AdvancedNavGroup;
