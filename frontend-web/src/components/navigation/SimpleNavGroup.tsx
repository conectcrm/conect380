import React from 'react';
import { Link, useLocation } from 'react-router-dom';
// import { ChevronRight } from 'lucide-react'; // Não usado mais
import './sidebar-animations.css';
import './menu-improvements.css';

export interface NavigationNucleus {
  id: string;
  title: string;
  icon: React.ComponentType<any>;
  href: string; // Rota para a tela do núcleo
  color: 'blue' | 'green' | 'purple' | 'orange' | 'red';
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
    <nav className={`flex-1 space-y-1 ${sidebarCollapsed ? 'sidebar-collapsed px-0' : 'px-2'}`}>
      {nuclei.map((nucleus) => {
        const isActive = location.pathname.startsWith(nucleus.href);
        const colorClasses = getColorClasses(nucleus.color, isActive);
        const Icon = nucleus.icon;

        return (
          <Link
            key={nucleus.id}
            to={nucleus.href}
            className={`
              menu-item-improved group flex items-center relative
              transition-all duration-200 ease-in-out
              focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:ring-offset-2
              ${isActive ? 'active' : ''}
              ${sidebarCollapsed ? 'justify-center flex-col' : 'justify-between'}
            `}
            title={sidebarCollapsed ? nucleus.title : undefined}
          >
            {sidebarCollapsed ? (
              // Layout simplificado para sidebar colapsada - apenas o ícone centralizado
              <Icon className="menu-icon-improved" />
            ) : (
              // Layout completo para sidebar expandida
              <>
                <div className="flex items-center min-w-0 flex-1">
                  <Icon className="menu-icon-improved" />
                  <div className="flex-1 min-w-0">
                    <div className="menu-text-improved">
                      {nucleus.title}
                    </div>
                  </div>
                </div>

                {/* Ícone de seta DESABILITADO - todos os menus navegam diretamente */}
                {/* {nucleus.id !== 'dashboard' && (
                  <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isActive ? 'rotate-90 text-[#159A9C]' : ''}`} />
                )} */}
              </>
            )}

            {/* Tooltip melhorado para sidebar colapsada */}
            {sidebarCollapsed && (
              <div className="tooltip-improved">
                <div className="font-semibold">{nucleus.title}</div>
              </div>
            )}
          </Link>
        );
      })}
    </nav>
  );
};

export default SimpleNavGroup;
