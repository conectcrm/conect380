import React from 'react';
import { BackToNucleus } from '../navigation/BackToNucleus';
import { ArrowLeft } from 'lucide-react';

// Interface local para evitar importação circular
interface DashboardCard {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ComponentType<{ className?: string }>;
  color: 'blue' | 'green' | 'red' | 'purple' | 'yellow' | 'indigo';
  bgGradient?: string;
}

interface StandardPageTemplateProps {
  // Header
  title: string;
  subtitle?: string;
  backTo?: string;

  // Dashboard Cards
  dashboardCards?: DashboardCard[];

  // Actions Bar
  primaryAction?: {
    label: string;
    onClick: () => void;
    icon?: React.ComponentType<{ className?: string }>;
  };
  secondaryActions?: Array<{
    label: string;
    onClick: () => void;
    icon?: React.ComponentType<{ className?: string }>;
    variant?: 'default' | 'outline' | 'danger';
  }>;

  // Bulk Actions
  bulkActions?: {
    selectedCount: number;
    onSelectAll: () => void;
    onDeselectAll: () => void;
    actions: Array<{
      label: string;
      onClick: () => void;
      variant?: 'default' | 'outline' | 'danger';
    }>;
  };

  // Filters & Search
  searchConfig?: {
    placeholder: string;
    value: string;
    onChange: (value: string) => void;
    onSearch?: () => void;
  };

  filters?: Array<{
    label: string;
    value: string;
    options: Array<{ label: string; value: string }>;
    onChange: (value: string) => void;
  }>;

  // Content
  children: React.ReactNode;

  // Loading
  loading?: boolean;
}

const colorConfigs = {
  blue: {
    text: 'text-blue-600',
    bg: 'from-blue-100 to-blue-200',
    icon: 'text-blue-600'
  },
  green: {
    text: 'text-green-600',
    bg: 'from-green-100 to-green-200',
    icon: 'text-green-600'
  },
  red: {
    text: 'text-red-600',
    bg: 'from-red-100 to-red-200',
    icon: 'text-red-600'
  },
  purple: {
    text: 'text-purple-600',
    bg: 'from-purple-100 to-purple-200',
    icon: 'text-purple-600'
  },
  yellow: {
    text: 'text-yellow-600',
    bg: 'from-yellow-100 to-yellow-200',
    icon: 'text-yellow-600'
  },
  indigo: {
    text: 'text-indigo-600',
    bg: 'from-indigo-100 to-indigo-200',
    icon: 'text-indigo-600'
  }
};

export const StandardPageTemplate: React.FC<StandardPageTemplateProps> = ({
  title,
  subtitle,
  backTo,
  dashboardCards,
  primaryAction,
  secondaryActions,
  bulkActions,
  searchConfig,
  filters,
  children,
  loading = false
}) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Navigation */}
        {backTo && (
          <BackToNucleus
            nucleusName="Núcleo Anterior"
            nucleusPath={backTo}
            currentModuleName={title}
          />
        )}

        {/* Page Header */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{title}</h1>
              {subtitle && <p className="text-gray-600">{subtitle}</p>}
            </div>

            {/* Primary Action */}
            {primaryAction && (
              <div className="mt-4 lg:mt-0">
                <button
                  onClick={primaryAction.onClick}
                  className="bg-[#159A9C] text-white px-6 py-3 rounded-lg hover:bg-[#138A8C] transition-colors duration-200 flex items-center space-x-2 font-medium shadow-sm"
                >
                  {primaryAction.icon && <primaryAction.icon className="w-5 h-5" />}
                  <span>{primaryAction.label}</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Dashboard Cards */}
        {dashboardCards && dashboardCards.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            {dashboardCards.map((card, index) => {
              const config = colorConfigs[card.color];
              const IconComponent = card.icon;

              return (
                <div
                  key={index}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-lg transition-shadow duration-300"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">
                        {card.title}
                      </p>
                      <p className={`text-3xl font-bold mt-2 ${config.text}`}>
                        {card.value}
                      </p>
                      {card.subtitle && (
                        <p className="text-xs text-gray-400 mt-1">{card.subtitle}</p>
                      )}
                    </div>
                    <div className={`p-4 bg-gradient-to-br ${card.bgGradient || config.bg} rounded-xl`}>
                      <IconComponent className={`w-8 h-8 ${config.icon}`} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Bulk Actions Bar */}
        {bulkActions && bulkActions.selectedCount > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center space-x-4">
                <span className="text-blue-800 font-medium">
                  {bulkActions.selectedCount} item(s) selecionado(s)
                </span>
                <button
                  onClick={bulkActions.onSelectAll}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  Selecionar todos
                </button>
                <button
                  onClick={bulkActions.onDeselectAll}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  Desmarcar todos
                </button>
              </div>

              <div className="flex flex-wrap gap-2">
                {bulkActions.actions.map((action, index) => (
                  <button
                    key={index}
                    onClick={action.onClick}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${action.variant === 'danger'
                        ? 'bg-red-600 text-white hover:bg-red-700'
                        : action.variant === 'outline'
                          ? 'bg-white border border-blue-600 text-blue-600 hover:bg-blue-50'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Filters and Search */}
        {(searchConfig || (filters && filters.length > 0)) && (
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
            <div className="flex flex-col sm:flex-row gap-4 items-end">

              {/* Search */}
              {searchConfig && (
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Buscar
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder={searchConfig.placeholder}
                      value={searchConfig.value}
                      onChange={(e) => searchConfig.onChange(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && searchConfig.onSearch?.()}
                      className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent transition-colors"
                    />
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                  </div>
                </div>
              )}

              {/* Filters */}
              {filters && filters.map((filter, index) => (
                <div key={index} className="min-w-48">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {filter.label}
                  </label>
                  <select
                    value={filter.value}
                    onChange={(e) => filter.onChange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent"
                  >
                    {filter.options.map((option, optionIndex) => (
                      <option key={optionIndex} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              ))}

              {/* Secondary Actions */}
              {secondaryActions && (
                <div className="flex gap-2">
                  {secondaryActions.map((action, index) => (
                    <button
                      key={index}
                      onClick={action.onClick}
                      className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center space-x-2 ${action.variant === 'danger'
                          ? 'bg-red-600 text-white hover:bg-red-700'
                          : action.variant === 'outline'
                            ? 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                            : 'bg-[#159A9C] text-white hover:bg-[#138A8C]'
                        }`}
                    >
                      {action.icon && <action.icon className="w-4 h-4" />}
                      <span>{action.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#159A9C] mx-auto mb-4"></div>
            <p className="text-gray-500">Carregando...</p>
          </div>
        ) : (
          /* Main Content */
          children
        )}
      </div>
    </div>
  );
};

export default StandardPageTemplate;
