import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

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
    <nav className="flex-1 px-2 space-y-1">
      {nuclei.map((nucleus) => {
        const isActive = location.pathname.startsWith(nucleus.href);
        const colorClasses = getColorClasses(nucleus.color, isActive);
        const Icon = nucleus.icon;

        return (
          <Link
            key={nucleus.id}
            to={nucleus.href}
            className={`
              group flex items-center justify-between px-3 py-3 text-sm font-medium rounded-lg
              transition-all duration-200 ease-in-out
              ${colorClasses.hover}
              ${colorClasses.active}
              ${sidebarCollapsed ? 'justify-center px-2' : ''}
            `}
            title={sidebarCollapsed ? nucleus.title : undefined}
          >
            <div className="flex items-center min-w-0">
              <Icon className={`${sidebarCollapsed ? 'w-6 h-6' : 'w-5 h-5'} ${colorClasses.icon} flex-shrink-0`} />
              
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
          </Link>
        );
      })}
    </nav>
  );
};

export default SimpleNavGroup;
