import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import './sidebar-animations.css';

export interface NavigationNucleus {
  id: string;
  title: string;
  icon: React.ComponentType<any>;
  href: string; // Rota para a tela do núcleo
  color: 'blue' | 'green' | 'purple' | 'orange' | 'red';
  totalNotifications: number;
  description: string;
}

interface SimpleNavGroupProps {
  nuclei: NavigationNucleus[];
  sidebarCollapsed: boolean;
}

const getColorClasses = (color: string, active: boolean = false) => {
  // Paleta Crevasse aplicada ao sistema
  const crevassePalette = {
    primary: '#159A9C',      // Teal principal
    primaryLight: '#DEEFE7', // Verde claro
    neutral: '#B4BEC9',      // Cinza azulado
    dark: '#002333',         // Azul escuro
    white: '#FFFFFF'         // Branco
  };

  const baseClasses = {
    blue: {
      hover: 'hover:bg-[#DEEFE7]', // Crevasse-4
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

const SimpleNavGroup: React.FC<SimpleNavGroupProps> = ({ nuclei, sidebarCollapsed }) => {
  const location = useLocation();

  return (
    <nav className={`flex-1 px-2 space-y-1 ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      {nuclei.map((nucleus) => {
        const isActive = location.pathname.startsWith(nucleus.href);
        const colorClasses = getColorClasses(nucleus.color, isActive);
        const Icon = nucleus.icon;

        return (
          <Link
            key={nucleus.id}
            to={nucleus.href}
            className={`
              sidebar-nav-link group flex items-center justify-between px-3 py-3 text-sm font-medium rounded-lg
              transition-all duration-200 ease-in-out relative
              focus:outline-none focus:ring-0 focus:border-transparent
              ${colorClasses.hover}
              ${colorClasses.active}
              ${isActive ? 'active' : ''}
              ${sidebarCollapsed ? 'justify-center px-2' : ''}
              ${sidebarCollapsed ? 'hover:scale-110 hover:-translate-y-1' : ''}
              ${sidebarCollapsed ? 'hover:shadow-none focus:shadow-none' : ''}
            `}
            style={{
              transition: sidebarCollapsed 
                ? 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), background-color 0.2s ease-in-out' 
                : 'all 0.2s ease-in-out',
              outline: 'none',
              boxShadow: 'none'
            }}
            title={sidebarCollapsed ? nucleus.title : undefined}
          >
            <div className="flex items-center min-w-0">
              <Icon className={`
                nav-icon
                ${sidebarCollapsed ? 'w-6 h-6' : 'w-5 h-5'} 
                ${colorClasses.icon} 
                flex-shrink-0
                ${sidebarCollapsed ? 'group-hover:scale-125 transition-transform duration-300 ease-out' : ''}
              `} />
              
              {!sidebarCollapsed && (
                <div className="ml-3 flex-1 min-w-0">
                  <span className={`block ${colorClasses.text} font-medium`}>
                    {nucleus.title}
                  </span>
                  <span className="block text-xs text-gray-500 mt-0.5 truncate">
                    {nucleus.description}
                  </span>
                </div>
              )}
            </div>

            {!sidebarCollapsed && (
              <div className="flex items-center space-x-2">
                {/* Badge de notificações */}
                {nucleus.totalNotifications > 0 && (
                  <span className={`
                    inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none
                    ${colorClasses.badge} text-white rounded-full min-w-[20px] h-5
                  `}>
                    {nucleus.totalNotifications > 99 ? '99+' : nucleus.totalNotifications}
                  </span>
                )}
                
                {/* Ícone de seta - apenas para núcleos que levam a telas de módulos */}
                {nucleus.id !== 'dashboard' && (
                  <ChevronRight className={`w-4 h-4 ${colorClasses.icon} transition-transform duration-200 ${isActive ? 'rotate-90' : ''}`} />
                )}
              </div>
            )}

            {/* Badge de notificações para sidebar colapsada */}
            {sidebarCollapsed && nucleus.totalNotifications > 0 && (
              <span className={`
                notification-badge absolute -top-1 -right-1 inline-flex items-center justify-center 
                w-5 h-5 text-xs font-bold leading-none text-white 
                ${colorClasses.badge} rounded-full
                transform transition-all duration-300 ease-out
                group-hover:scale-125 group-hover:-translate-y-0.5
              `}>
                {nucleus.totalNotifications > 9 ? '9+' : nucleus.totalNotifications}
              </span>
            )}

            {/* Tooltip para sidebar colapsada */}
            {sidebarCollapsed && (
              <div className={`
                sidebar-tooltip absolute left-full ml-3 px-3 py-2 text-white text-sm rounded-md 
                opacity-0 group-hover:opacity-100 transition-all duration-300 ease-out
                pointer-events-none whitespace-nowrap z-[60]
                ${isActive ? 'bg-[#159A9C]' : 'bg-gray-800'}
              `}>
                <div className="font-semibold">{nucleus.title}</div>
                <div className="text-xs opacity-90 mt-0.5">
                  {nucleus.description}
                </div>
                {nucleus.totalNotifications > 0 && (
                  <div className="text-xs opacity-90 mt-1">
                    {nucleus.totalNotifications} notificaç{nucleus.totalNotifications === 1 ? 'ão' : 'ões'}
                  </div>
                )}
                {/* Seta do tooltip */}
                <div className={`
                  absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-1
                  w-0 h-0 border-t-4 border-b-4 border-r-4
                  border-transparent ${isActive ? 'border-r-[#159A9C]' : 'border-r-gray-800'}
                `}></div>
              </div>
            )}
          </Link>
        );
      })}
    </nav>
  );
};

export default SimpleNavGroup;
