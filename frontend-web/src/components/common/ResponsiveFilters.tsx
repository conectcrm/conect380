import React, { useState } from 'react';
import { Filter, ChevronDown } from 'lucide-react';
import { useAccessibility } from '../../hooks/useAccessibility';

interface ResponsiveFiltersProps {
  filtros: {
    periodo: string;
    vendedor: string;
    regiao: string;
  };
  setFiltros: (filtros: any) => void;
}

export const ResponsiveFilters: React.FC<ResponsiveFiltersProps> = ({
  filtros,
  setFiltros
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { announceToScreenReader } = useAccessibility({ announceChanges: true });
  const filtersId = React.useId();

  const handleToggleExpand = () => {
    const newState = !isExpanded;
    setIsExpanded(newState);
    announceToScreenReader(
      newState ? 'Filtros expandidos' : 'Filtros recolhidos',
      'polite'
    );
  };

  const handleFilterChange = (filterType: string, value: string) => {
    setFiltros({ ...filtros, [filterType]: value });
    announceToScreenReader(`Filtro ${filterType} alterado para ${value}`, 'polite');
  };

  return (
    <section 
      className="bg-white rounded-lg shadow-sm border mb-4 sm:mb-6"
      role="region"
      aria-label="Filtros do dashboard"
    >
      {/* Mobile Toggle */}
      <div className="sm:hidden">
        <button
          onClick={handleToggleExpand}
          className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset transition-colors"
          aria-expanded={isExpanded}
          aria-controls={`${filtersId}-content`}
          aria-label={`${isExpanded ? 'Recolher' : 'Expandir'} filtros do dashboard`}
        >
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" aria-hidden="true" />
            <span className="text-sm font-medium text-gray-700">Filtros</span>
          </div>
          <ChevronDown 
            className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${
              isExpanded ? 'rotate-180' : ''
            }`} 
          />
        </button>
        
        {isExpanded && (
          <div className="px-4 pb-4 space-y-3 border-t border-gray-100">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Período
              </label>
              <select 
                value={filtros.periodo}
                onChange={(e) => setFiltros({...filtros, periodo: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="2025">2025</option>
                <option value="2024">2024</option>
                <option value="ultimo_mes">Último mês</option>
                <option value="ultimo_trimestre">Último trimestre</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Vendedor
              </label>
              <select 
                value={filtros.vendedor}
                onChange={(e) => setFiltros({...filtros, vendedor: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="Todos">Todos os vendedores</option>
                <option value="João Silva">João Silva</option>
                <option value="Maria Santos">Maria Santos</option>
                <option value="Pedro Costa">Pedro Costa</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Região
              </label>
              <select 
                value={filtros.regiao}
                onChange={(e) => setFiltros({...filtros, regiao: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="Todas">Todas as regiões</option>
                <option value="Norte">Norte</option>
                <option value="Sul">Sul</option>
                <option value="Sudeste">Sudeste</option>
                <option value="Centro-Oeste">Centro-Oeste</option>
                <option value="Nordeste">Nordeste</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Desktop Filters */}
      <div className="hidden sm:block p-4">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Filtros</span>
          </div>
          
          <select 
            value={filtros.periodo}
            onChange={(e) => setFiltros({...filtros, periodo: e.target.value})}
            className="px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="2025">2025</option>
            <option value="2024">2024</option>
            <option value="ultimo_mes">Último mês</option>
            <option value="ultimo_trimestre">Último trimestre</option>
          </select>
          
          <select 
            value={filtros.vendedor}
            onChange={(e) => setFiltros({...filtros, vendedor: e.target.value})}
            className="px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="Todos">Todos os vendedores</option>
            <option value="João Silva">João Silva</option>
            <option value="Maria Santos">Maria Santos</option>
            <option value="Pedro Costa">Pedro Costa</option>
          </select>
          
          <select 
            value={filtros.regiao}
            onChange={(e) => setFiltros({...filtros, regiao: e.target.value})}
            className="px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="Todas">Todas as regiões</option>
            <option value="Norte">Norte</option>
            <option value="Sul">Sul</option>
            <option value="Sudeste">Sudeste</option>
            <option value="Centro-Oeste">Centro-Oeste</option>
            <option value="Nordeste">Nordeste</option>
          </select>
        </div>
      </div>
    </section>
  );
};
