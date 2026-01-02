import React, { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType<any>;
  notifications: number;
}

interface CollapsibleNavGroupProps {
  title: string;
  items: NavigationItem[];
  sidebarCollapsed: boolean;
  icon?: React.ComponentType<any>;
  defaultExpanded?: boolean;
}

const CollapsibleNavGroup: React.FC<CollapsibleNavGroupProps> = ({
  title,
  items,
  sidebarCollapsed,
  icon: GroupIcon,
  defaultExpanded = true,
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const location = useLocation();

  // Verificar se algum item do grupo está ativo
  const hasActiveItem = items.some((item) => location.pathname === item.href);

  // Auto-expandir se algum item estiver ativo
  React.useEffect(() => {
    if (hasActiveItem && !isExpanded) {
      setIsExpanded(true);
    }
  }, [hasActiveItem, isExpanded]);

  // Total de notificações do grupo
  const totalNotifications = items.reduce((sum, item) => sum + item.notifications, 0);

  if (sidebarCollapsed) {
    // Quando sidebar está colapsada, mostrar apenas os ícones
    return (
      <div className="space-y-2">
        {/* Separador visual */}
        <div className="w-6 h-px bg-gray-200 mx-auto"></div>

        {items.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.name}
              to={item.href}
              className={`${
                isActive
                  ? 'bg-blue-50 border-r-2 border-blue-500 text-blue-700 shadow-sm'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 hover:shadow-sm'
              } group flex items-center justify-center px-2 py-4 mx-1 rounded-lg hover:bg-blue-50 text-sm font-medium transition-all duration-300 ease-in-out relative transform hover:scale-105`}
              title={item.name}
            >
              <Icon
                className={`${
                  isActive ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'
                } h-6 w-6 transition-colors flex-shrink-0`}
              />

              {/* Indicador visual para item ativo */}
              {isActive && (
                <div className="absolute -left-1 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-blue-500 rounded-r-full"></div>
              )}

              {/* Badge de notificação */}
              {item.notifications > 0 && (
                <span className="absolute -top-1 -right-1 inline-flex items-center justify-center w-5 h-5 text-xs font-bold leading-none text-white bg-gradient-to-r from-red-500 to-red-600 rounded-full shadow-md">
                  {item.notifications > 9 ? '9+' : item.notifications}
                </span>
              )}

              {/* Tooltip */}
              <div className="absolute left-full ml-3 px-2 py-1 bg-gray-800 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-[60] shadow-lg">
                {item.name}
                {item.notifications > 0 && (
                  <span className="ml-2 text-red-300">({item.notifications})</span>
                )}
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
        onClick={() => setIsExpanded(!isExpanded)}
        className={`w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider hover:text-gray-700 hover:bg-gray-50 rounded-lg transition-all duration-200 group ${
          hasActiveItem ? 'text-blue-600 bg-blue-50' : ''
        }`}
      >
        <div className="flex items-center gap-2">
          {GroupIcon && (
            <GroupIcon className={`w-4 h-4 ${hasActiveItem ? 'text-blue-600' : 'text-gray-400'}`} />
          )}
          <span>{title}</span>
          {totalNotifications > 0 && (
            <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold leading-none text-white bg-gradient-to-r from-red-500 to-red-600 rounded-full">
              {totalNotifications > 9 ? '9+' : totalNotifications}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
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
          isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="space-y-1 pl-2">
          {items.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`${
                  isActive
                    ? 'bg-blue-50 border-r-2 border-blue-500 text-blue-700 shadow-sm'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                } group flex items-center px-3 py-2.5 text-sm font-medium rounded-l-lg transition-all duration-200 relative`}
              >
                <Icon
                  className={`${
                    isActive ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'
                  } mr-3 h-5 w-5 transition-colors flex-shrink-0`}
                />

                <span className="flex-1 truncate">{item.name}</span>

                {item.notifications > 0 && (
                  <span className="ml-2 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-gradient-to-r from-red-500 to-red-600 rounded-full shadow-sm">
                    {item.notifications > 9 ? '9+' : item.notifications}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default CollapsibleNavGroup;
