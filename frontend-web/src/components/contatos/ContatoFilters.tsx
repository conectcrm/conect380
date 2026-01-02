import React from 'react';
import { X, RotateCcw } from 'lucide-react';

interface ContatoFiltersProps {
  statusFilter: string;
  setStatusFilter: (value: string) => void;
  tipoFilter: string;
  setTipoFilter: (value: string) => void;
  proprietarioFilter: string;
  setProprietarioFilter: (value: string) => void;
  fonteFilter: string;
  setFonteFilter: (value: string) => void;
  onReset: () => void;
}

export const ContatoFilters: React.FC<ContatoFiltersProps> = ({
  statusFilter,
  setStatusFilter,
  tipoFilter,
  setTipoFilter,
  proprietarioFilter,
  setProprietarioFilter,
  fonteFilter,
  setFonteFilter,
  onReset,
}) => {
  const statusOptions = [
    { value: 'todos', label: 'Todos os Status' },
    { value: 'ativo', label: 'Ativo' },
    { value: 'cliente', label: 'Cliente' },
    { value: 'prospecto', label: 'Prospecto' },
    { value: 'inativo', label: 'Inativo' },
    { value: 'ex-cliente', label: 'Ex-Cliente' },
  ];

  const tipoOptions = [
    { value: 'todos', label: 'Todos os Tipos' },
    { value: 'lead', label: 'Lead' },
    { value: 'cliente', label: 'Cliente' },
    { value: 'parceiro', label: 'Parceiro' },
    { value: 'fornecedor', label: 'Fornecedor' },
    { value: 'outro', label: 'Outro' },
  ];

  const proprietarioOptions = [
    { value: 'todos', label: 'Todos os Proprietários' },
    { value: 'Maria Santos', label: 'Maria Santos' },
    { value: 'Pedro Costa', label: 'Pedro Costa' },
    { value: 'Ana Silva', label: 'Ana Silva' },
    { value: 'Lucas Oliveira', label: 'Lucas Oliveira' },
    { value: 'Carla Santos', label: 'Carla Santos' },
    { value: 'Roberto Lima', label: 'Roberto Lima' },
  ];

  const fonteOptions = [
    { value: 'todas', label: 'Todas as Fontes' },
    { value: 'Website', label: 'Website' },
    { value: 'LinkedIn', label: 'LinkedIn' },
    { value: 'Google Ads', label: 'Google Ads' },
    { value: 'Facebook', label: 'Facebook' },
    { value: 'Indicação', label: 'Indicação' },
    { value: 'Feira/Evento', label: 'Feira/Evento' },
    { value: 'Networking', label: 'Networking' },
    { value: 'Telemarketing', label: 'Telemarketing' },
    { value: 'Email Marketing', label: 'Email Marketing' },
    { value: 'Outros', label: 'Outros' },
  ];

  const hasActiveFilters =
    statusFilter !== 'todos' ||
    tipoFilter !== 'todos' ||
    proprietarioFilter !== 'todos' ||
    fonteFilter !== 'todas';

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 md:p-6 mb-6 border border-gray-200">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
        <h3 className="text-lg font-semibold text-[#002333]">Filtros Avançados</h3>

        {hasActiveFilters && (
          <button
            onClick={onReset}
            className="flex items-center justify-center sm:justify-start gap-2 px-3 py-1.5 text-sm text-gray-600 hover:text-[#159A9C] transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            Limpar Filtros
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Filtro de Status */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent"
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Filtro de Tipo */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Tipo</label>
          <select
            value={tipoFilter}
            onChange={(e) => setTipoFilter(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent"
          >
            {tipoOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Filtro de Proprietário */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Proprietário</label>
          <select
            value={proprietarioFilter}
            onChange={(e) => setProprietarioFilter(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent"
          >
            {proprietarioOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Filtro de Fonte */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Fonte</label>
          <select
            value={fonteFilter}
            onChange={(e) => setFonteFilter(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent"
          >
            {fonteOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Indicadores de Filtros Ativos */}
      {hasActiveFilters && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex flex-wrap gap-2">
            <span className="text-sm text-gray-600 mr-2">Filtros ativos:</span>

            {statusFilter !== 'todos' && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                Status: {statusOptions.find((o) => o.value === statusFilter)?.label}
                <button
                  onClick={() => setStatusFilter('todos')}
                  className="hover:bg-blue-200 rounded-full p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {tipoFilter !== 'todos' && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                Tipo: {tipoOptions.find((o) => o.value === tipoFilter)?.label}
                <button
                  onClick={() => setTipoFilter('todos')}
                  className="hover:bg-green-200 rounded-full p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {proprietarioFilter !== 'todos' && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                Proprietário:{' '}
                {proprietarioOptions.find((o) => o.value === proprietarioFilter)?.label}
                <button
                  onClick={() => setProprietarioFilter('todos')}
                  className="hover:bg-purple-200 rounded-full p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {fonteFilter !== 'todas' && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full">
                Fonte: {fonteOptions.find((o) => o.value === fonteFilter)?.label}
                <button
                  onClick={() => setFonteFilter('todas')}
                  className="hover:bg-orange-200 rounded-full p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
