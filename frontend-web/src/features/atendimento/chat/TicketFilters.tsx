import React, { useState, useEffect } from 'react';
import { Search, Filter, X } from 'lucide-react';

export interface TicketFiltersState {
  search: string;
  status: string;
  prioridade: string;
  ordenacao: 'recente' | 'antigo' | 'prioridade';
}

interface TicketFiltersProps {
  filters: TicketFiltersState;
  onChange: (filters: TicketFiltersState) => void;
  onClearFilters?: () => void;
}

export const TicketFilters: React.FC<TicketFiltersProps> = ({
  filters,
  onChange,
  onClearFilters,
}) => {
  const [searchDebounced, setSearchDebounced] = useState(filters.search);

  // Debounce para busca
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchDebounced !== filters.search) {
        onChange({ ...filters, search: searchDebounced });
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchDebounced]);

  // Atualizar quando filters.search mudar externamente
  useEffect(() => {
    setSearchDebounced(filters.search);
  }, [filters.search]);

  const hasActiveFilters =
    filters.status !== '' || filters.prioridade !== '' || filters.search !== '';

  const handleClearFilters = () => {
    setSearchDebounced('');
    if (onClearFilters) {
      onClearFilters();
    } else {
      onChange({
        search: '',
        status: '',
        prioridade: '',
        ordenacao: 'recente',
      });
    }
  };

  return (
    <div className="bg-white border-b">
      <div className="p-3 space-y-3">
        {/* Busca */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por #número, assunto, cliente..."
            value={searchDebounced}
            onChange={(e) => setSearchDebounced(e.target.value)}
            className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {searchDebounced && (
            <button
              onClick={() => setSearchDebounced('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filtros em linha */}
        <div className="grid grid-cols-3 gap-2">
          {/* Status */}
          <select
            value={filters.status}
            onChange={(e) => onChange({ ...filters, status: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
          >
            <option value="">Todos Status</option>
            <option value="aberto">📬 Abertos</option>
            <option value="em_atendimento">💬 Em Atendimento</option>
            <option value="aguardando">⏸️ Aguardando</option>
            <option value="resolvido">✅ Resolvidos</option>
            <option value="fechado">🔒 Fechados</option>
          </select>

          {/* Prioridade */}
          <select
            value={filters.prioridade}
            onChange={(e) => onChange({ ...filters, prioridade: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
          >
            <option value="">Todas Prioridades</option>
            <option value="alta">🔴 Alta</option>
            <option value="media">🟡 Média</option>
            <option value="baixa">🟢 Baixa</option>
          </select>

          {/* Ordenação */}
          <select
            value={filters.ordenacao}
            onChange={(e) => onChange({ ...filters, ordenacao: e.target.value as any })}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
          >
            <option value="recente">🕐 Mais Recentes</option>
            <option value="antigo">🕑 Mais Antigos</option>
            <option value="prioridade">⚠️ Por Prioridade</option>
          </select>
        </div>

        {/* Indicador de filtros ativos + Limpar */}
        {hasActiveFilters && (
          <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
            <div className="flex items-center gap-2 text-sm text-blue-700">
              <Filter className="w-4 h-4" />
              <span className="font-medium">Filtros ativos</span>
            </div>
            <button
              onClick={handleClearFilters}
              className="flex items-center gap-1 text-sm text-blue-700 hover:text-blue-900 font-medium"
            >
              <X className="w-4 h-4" />
              Limpar filtros
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// Hook para gerenciar estado dos filtros
export const useTicketFilters = (initialFilters?: Partial<TicketFiltersState>) => {
  const [filters, setFilters] = useState<TicketFiltersState>({
    search: '',
    status: '',
    prioridade: '',
    ordenacao: 'recente',
    ...initialFilters,
  });

  const clearFilters = () => {
    setFilters({
      search: '',
      status: '',
      prioridade: '',
      ordenacao: 'recente',
    });
  };

  return {
    filters,
    setFilters,
    clearFilters,
  };
};
