import React from 'react';
import { Search, Filter, X, Building2, Calendar, DollarSign } from 'lucide-react';

interface FilterState {
  search: string;
  status: string[];
  plano: string[];
  dataInicio: string;
  dataFim: string;
  valorMin: string;
  valorMax: string;
}

interface EmpresaFiltersProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  totalEmpresas: number;
  empresasFiltradas: number;
}

export const EmpresaFilters: React.FC<EmpresaFiltersProps> = ({
  filters,
  onFiltersChange,
  totalEmpresas,
  empresasFiltradas,
}) => {
  const [showAdvanced, setShowAdvanced] = React.useState(false);

  const statusOptions = [
    { value: 'ativa', label: 'Ativa', color: 'bg-green-100 text-green-800' },
    { value: 'trial', label: 'Trial', color: 'bg-blue-100 text-blue-800' },
    { value: 'suspensa', label: 'Suspensa', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'inativa', label: 'Inativa', color: 'bg-red-100 text-red-800' },
  ];

  const planoOptions = [
    { value: 'starter', label: 'Starter', color: 'bg-blue-100 text-blue-800' },
    { value: 'professional', label: 'Professional', color: 'bg-purple-100 text-purple-800' },
    { value: 'enterprise', label: 'Enterprise', color: 'bg-orange-100 text-orange-800' },
  ];

  const updateFilter = (key: keyof FilterState, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value,
    });
  };

  const toggleArrayFilter = (key: 'status' | 'plano', value: string) => {
    const currentArray = filters[key];
    const newArray = currentArray.includes(value)
      ? currentArray.filter((item) => item !== value)
      : [...currentArray, value];

    updateFilter(key, newArray);
  };

  const clearFilters = () => {
    onFiltersChange({
      search: '',
      status: [],
      plano: [],
      dataInicio: '',
      dataFim: '',
      valorMin: '',
      valorMax: '',
    });
    setShowAdvanced(false);
  };

  const hasActiveFilters = () => {
    return (
      filters.search ||
      filters.status.length > 0 ||
      filters.plano.length > 0 ||
      filters.dataInicio ||
      filters.dataFim ||
      filters.valorMin ||
      filters.valorMax
    );
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
      {/* Busca principal e contador */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Buscar por nome, CNPJ ou email..."
              value={filters.search}
              onChange={(e) => updateFilter('search', e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent"
            />
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="text-sm text-gray-600">
            <span className="font-semibold text-[#159A9C]">{empresasFiltradas}</span> de{' '}
            <span className="font-semibold">{totalEmpresas}</span> empresas
          </div>

          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Filter className="w-4 h-4" />
            <span className="text-sm">Filtros avançados</span>
          </button>

          {hasActiveFilters() && (
            <button
              onClick={clearFilters}
              className="flex items-center space-x-2 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
              <span className="text-sm">Limpar</span>
            </button>
          )}
        </div>
      </div>

      {/* Filtros rápidos */}
      <div className="space-y-4">
        {/* Status */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
          <div className="flex flex-wrap gap-2">
            {statusOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => toggleArrayFilter('status', option.value)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  filters.status.includes(option.value)
                    ? option.color
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Planos */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Planos</label>
          <div className="flex flex-wrap gap-2">
            {planoOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => toggleArrayFilter('plano', option.value)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  filters.plano.includes(option.value)
                    ? option.color
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Filtros avançados */}
      {showAdvanced && (
        <div className="mt-6 pt-6 border-t border-gray-200 space-y-4">
          <h4 className="text-sm font-semibold text-gray-900 mb-4">Filtros Avançados</h4>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Período de cadastro */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-1" />
                Data de cadastro
              </label>
              <div className="space-y-2">
                <input
                  type="date"
                  value={filters.dataInicio}
                  onChange={(e) => updateFilter('dataInicio', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent"
                  placeholder="Data inicial"
                />
                <input
                  type="date"
                  value={filters.dataFim}
                  onChange={(e) => updateFilter('dataFim', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent"
                  placeholder="Data final"
                />
              </div>
            </div>

            {/* Faixa de valor */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <DollarSign className="w-4 h-4 inline mr-1" />
                Valor mensal (R$)
              </label>
              <div className="space-y-2">
                <input
                  type="number"
                  value={filters.valorMin}
                  onChange={(e) => updateFilter('valorMin', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent"
                  placeholder="Valor mínimo"
                  min="0"
                  step="0.01"
                />
                <input
                  type="number"
                  value={filters.valorMax}
                  onChange={(e) => updateFilter('valorMax', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent"
                  placeholder="Valor máximo"
                  min="0"
                  step="0.01"
                />
              </div>
            </div>

            {/* Estatísticas rápidas */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Building2 className="w-4 h-4 inline mr-1" />
                Filtros rápidos
              </label>
              <div className="space-y-2">
                <button
                  onClick={() => updateFilter('status', ['ativa'])}
                  className="w-full px-3 py-2 text-left text-sm bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors"
                >
                  Apenas empresas ativas
                </button>
                <button
                  onClick={() => updateFilter('status', ['trial'])}
                  className="w-full px-3 py-2 text-left text-sm bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  Apenas em trial
                </button>
                <button
                  onClick={() => {
                    const today = new Date();
                    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
                    updateFilter('dataFim', nextWeek.toISOString().split('T')[0]);
                  }}
                  className="w-full px-3 py-2 text-left text-sm bg-yellow-50 text-yellow-700 rounded-lg hover:bg-yellow-100 transition-colors"
                >
                  Expirando em 7 dias
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Resumo dos filtros ativos */}
      {hasActiveFilters() && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-gray-600 font-medium">Filtros ativos:</span>

            {filters.search && (
              <span className="px-2 py-1 bg-[#159A9C] text-white text-xs rounded-full">
                Busca: "{filters.search}"
              </span>
            )}

            {filters.status.map((status) => (
              <span
                key={status}
                className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full"
              >
                Status: {statusOptions.find((s) => s.value === status)?.label}
              </span>
            ))}

            {filters.plano.map((plano) => (
              <span
                key={plano}
                className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full"
              >
                Plano: {planoOptions.find((p) => p.value === plano)?.label}
              </span>
            ))}

            {(filters.dataInicio || filters.dataFim) && (
              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                Período: {filters.dataInicio || '...'} até {filters.dataFim || '...'}
              </span>
            )}

            {(filters.valorMin || filters.valorMax) && (
              <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                Valor: R$ {filters.valorMin || '0'} - R$ {filters.valorMax || '∞'}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
