import React, { useMemo, useState } from 'react';
import { Filter, ChevronDown } from 'lucide-react';
import { useAccessibility } from '../../hooks/useAccessibility';

export interface FilterOption {
  value: string;
  label: string;
}

interface ResponsiveFiltersProps {
  filtros: {
    periodo: string;
    vendedor: string;
    regiao: string;
  };
  onChange: (filtros: ResponsiveFiltersProps['filtros']) => void;
  periodOptions: FilterOption[];
  vendedorOptions: FilterOption[];
  regiaoOptions: FilterOption[];
  disabled?: boolean;
  loading?: boolean;
}

export const ResponsiveFilters: React.FC<ResponsiveFiltersProps> = ({
  filtros,
  onChange,
  periodOptions = [],
  vendedorOptions = [],
  regiaoOptions = [],
  disabled = false,
  loading = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { announceToScreenReader } = useAccessibility({ announceChanges: true });
  const filtersId = React.useId();

  const effectivePeriodOptions = useMemo(
    () =>
      periodOptions.length > 0
        ? periodOptions
        : [
            { value: 'semanal', label: 'Esta semana' },
            { value: 'mensal', label: 'Este mês' },
            { value: 'trimestral', label: 'Último trimestre' },
            { value: 'semestral', label: 'Último semestre' },
            { value: 'anual', label: 'Ano atual' },
          ],
    [periodOptions],
  );

  const effectiveVendedorOptions = useMemo(() => {
    if (vendedorOptions.length === 0) {
      return [{ value: 'Todos', label: 'Todos os vendedores' }];
    }

    const hasTodos = vendedorOptions.some((option) => option.value === 'Todos');
    return hasTodos
      ? vendedorOptions
      : [{ value: 'Todos', label: 'Todos os vendedores' }, ...vendedorOptions];
  }, [vendedorOptions]);

  const effectiveRegiaoOptions = useMemo(() => {
    if (regiaoOptions.length === 0) {
      return [
        { value: 'Todas', label: 'Todas as regiões' },
        { value: 'Norte', label: 'Norte' },
        { value: 'Nordeste', label: 'Nordeste' },
        { value: 'Centro-Oeste', label: 'Centro-Oeste' },
        { value: 'Sudeste', label: 'Sudeste' },
        { value: 'Sul', label: 'Sul' },
      ];
    }

    const hasTodas = regiaoOptions.some((option) => option.value === 'Todas');
    return hasTodas
      ? regiaoOptions
      : [{ value: 'Todas', label: 'Todas as regiões' }, ...regiaoOptions];
  }, [regiaoOptions]);

  const isDisabled = disabled || loading;

  const handleToggleExpand = () => {
    const newState = !isExpanded;
    setIsExpanded(newState);
    announceToScreenReader(newState ? 'Filtros expandidos' : 'Filtros recolhidos', 'polite');
  };

  const handleSelectChange =
    (key: keyof ResponsiveFiltersProps['filtros']) =>
    (event: React.ChangeEvent<HTMLSelectElement>) => {
      const updated = {
        ...filtros,
        [key]: event.target.value,
      };
      onChange(updated);
    };

  const renderOptions = (options: FilterOption[]) =>
    options.map((option) => (
      <option key={option.value} value={option.value}>
        {option.label}
      </option>
    ));

  return (
    <section
      className="bg-white rounded-lg shadow-sm border mb-4 sm:mb-6"
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
              <label className="block text-xs font-medium text-gray-700 mb-1">Período</label>
              <select
                value={filtros.periodo}
                onChange={handleSelectChange('periodo')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={isDisabled}
              >
                {renderOptions(effectivePeriodOptions)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Vendedor</label>
              <select
                value={filtros.vendedor}
                onChange={handleSelectChange('vendedor')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={isDisabled}
              >
                {renderOptions(effectiveVendedorOptions)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Região</label>
              <select
                value={filtros.regiao}
                onChange={handleSelectChange('regiao')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={isDisabled}
              >
                {renderOptions(effectiveRegiaoOptions)}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Desktop Filters */}
      <div className="hidden sm:block p-4">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" aria-hidden="true" />
            <span className="text-sm font-medium text-gray-700">Filtros</span>
          </div>

          <select
            value={filtros.periodo}
            onChange={handleSelectChange('periodo')}
            className="px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            disabled={isDisabled}
          >
            {renderOptions(effectivePeriodOptions)}
          </select>

          <select
            value={filtros.vendedor}
            onChange={handleSelectChange('vendedor')}
            className="px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            disabled={isDisabled}
          >
            {renderOptions(effectiveVendedorOptions)}
          </select>

          <select
            value={filtros.regiao}
            onChange={handleSelectChange('regiao')}
            className="px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            disabled={isDisabled}
          >
            {renderOptions(effectiveRegiaoOptions)}
          </select>
        </div>
      </div>
    </section>
  );
};
