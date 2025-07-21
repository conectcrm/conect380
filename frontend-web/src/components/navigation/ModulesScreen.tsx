import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

export interface ModuleItem {
  id: string;
  name: string;
  description: string;
  href: string;
  icon: React.ComponentType<any>;
  notifications: number;
  badge?: string; // "Novo", "Beta", "Em Breve", etc.
  badgeColor?: 'blue' | 'green' | 'yellow' | 'red' | 'purple';
  status: 'active' | 'beta' | 'coming_soon';
}

export interface NucleusModulesData {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  color: 'blue' | 'green' | 'purple' | 'orange' | 'red';
  modules: ModuleItem[];
}

interface ModulesScreenProps {
  nucleusData: NucleusModulesData;
}

const getColorClasses = (color: string) => {
  // Paleta Crevasse aplicada consistentemente
  const colors = {
    blue: {
      gradient: 'from-[#159A9C] to-[#0F7B7D]',
      bg: 'bg-[#DEEFE7]',
      border: 'border-[#B4BEC9]',
      text: 'text-[#002333]',
      icon: 'text-[#159A9C]'
    },
    green: {
      gradient: 'from-[#159A9C] to-[#0F7B7D]',
      bg: 'bg-[#DEEFE7]',
      border: 'border-[#B4BEC9]',
      text: 'text-[#002333]',
      icon: 'text-[#159A9C]'
    },
    orange: {
      gradient: 'from-[#159A9C] to-[#0F7B7D]',
      bg: 'bg-[#DEEFE7]',
      border: 'border-[#B4BEC9]',
      text: 'text-[#002333]',
      icon: 'text-[#159A9C]'
    },
    purple: {
      gradient: 'from-[#159A9C] to-[#0F7B7D]',
      bg: 'bg-[#DEEFE7]',
      border: 'border-[#B4BEC9]',
      text: 'text-[#002333]',
      icon: 'text-[#159A9C]'
    },
    red: {
      gradient: 'from-[#159A9C] to-[#0F7B7D]',
      bg: 'bg-[#DEEFE7]',
      border: 'border-[#B4BEC9]',
      text: 'text-[#002333]',
      icon: 'text-[#159A9C]'
    }
  };

  return colors[color as keyof typeof colors] || colors.blue;
};

const getBadgeClasses = (badgeColor: string = 'blue') => {
  // Badges usando cores da paleta Crevasse
  const badges = {
    blue: 'bg-[#DEEFE7] text-[#159A9C]',
    green: 'bg-[#DEEFE7] text-[#159A9C]',
    yellow: 'bg-[#B4BEC9] text-[#002333]',
    red: 'bg-[#B4BEC9] text-[#002333]',
    purple: 'bg-[#DEEFE7] text-[#159A9C]'
  };

  return badges[badgeColor as keyof typeof badges] || badges.blue;
};

const ModulesScreen: React.FC<ModulesScreenProps> = ({ nucleusData }) => {
  const colorClasses = getColorClasses(nucleusData.color);
  const NucleusIcon = nucleusData.icon;

  const getStatusBadge = (module: ModuleItem) => {
    if (module.status === 'coming_soon') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          Em Breve
        </span>
      );
    }
    if (module.status === 'beta') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          Beta
        </span>
      );
    }
    if (module.badge) {
      return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getBadgeClasses(module.badgeColor)}`}>
          {module.badge}
        </span>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Título do Núcleo */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <div className={`p-3 rounded-xl ${colorClasses.bg} ${colorClasses.border} border`}>
              <NucleusIcon className={`w-8 h-8 ${colorClasses.icon}`} />
            </div>
            <div className="ml-4">
              <h1 className="text-3xl font-bold text-gray-900">{nucleusData.title}</h1>
              <p className="text-lg text-gray-600 mt-1">{nucleusData.description}</p>
            </div>
          </div>
        </div>

        {/* Grid de Módulos */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {nucleusData.modules.map((module) => {
            const ModuleIcon = module.icon;
            const isClickable = module.status === 'active' || module.status === 'beta';

            const moduleCard = (
              <div
                className={`
                  bg-white rounded-xl shadow-sm border border-gray-200 p-6 h-full
                  transition-all duration-200 ease-in-out
                  ${isClickable 
                    ? 'hover:shadow-md hover:border-gray-300 cursor-pointer transform hover:-translate-y-1' 
                    : 'opacity-60 cursor-not-allowed'
                  }
                `}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-3 rounded-lg ${colorClasses.bg}`}>
                    <ModuleIcon className={`w-6 h-6 ${colorClasses.icon}`} />
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {/* Badge de notificações */}
                    {module.notifications > 0 && (
                      <span className={`
                        inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none
                        bg-red-500 text-white rounded-full min-w-[20px] h-5
                      `}>
                        {module.notifications > 99 ? '99+' : module.notifications}
                      </span>
                    )}
                    
                    {/* Badge de status */}
                    {getStatusBadge(module)}
                  </div>
                </div>

                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {module.name}
                  </h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {module.description}
                  </p>
                </div>

                {isClickable && (
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <span className="text-sm font-medium text-gray-500">
                      Acessar módulo
                    </span>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </div>
                )}
              </div>
            );

            return isClickable ? (
              <Link key={module.id} to={module.href} className="block h-full">
                {moduleCard}
              </Link>
            ) : (
              <div key={module.id} className="h-full">
                {moduleCard}
              </div>
            );
          })}
        </div>

        {/* Estatísticas do Núcleo */}
        <div className="mt-12 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Resumo do {nucleusData.title}</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {nucleusData.modules.filter(m => m.status === 'active').length}
              </div>
              <div className="text-sm text-gray-600">Módulos Ativos</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {nucleusData.modules.filter(m => m.status === 'beta').length}
              </div>
              <div className="text-sm text-gray-600">Em Beta</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-500">
                {nucleusData.modules.filter(m => m.status === 'coming_soon').length}
              </div>
              <div className="text-sm text-gray-600">Em Desenvolvimento</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModulesScreen;
