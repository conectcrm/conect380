import React, { useState } from 'react';
import { Search, SlidersHorizontal, Calendar, DollarSign, Tag, X, FilterX } from 'lucide-react';

// Interface simplificada para este componente
interface FiltrosSimples {
  status?: string;
  dataInicio?: string;
  dataFim?: string;
  valorMinimo?: number;
  valorMaximo?: number;
  fornecedorId?: string;
}

interface BarraBuscaFiltrosProps {
  termoBusca: string;
  onTermoBuscaChange: (termo: string) => void;
  filtros: FiltrosSimples;
  onFiltrosChange: (filtros: FiltrosSimples) => void;
  onLimparFiltros: () => void;
  mostrarFiltros: boolean;
  onToggleFiltros: () => void;
}

export const BarraBuscaFiltros: React.FC<BarraBuscaFiltrosProps> = ({
  termoBusca,
  onTermoBuscaChange,
  filtros,
  onFiltrosChange,
  onLimparFiltros,
  mostrarFiltros,
  onToggleFiltros,
}) => {
  const [filtrosLocais, setFiltrosLocais] = useState<FiltrosSimples>(filtros);

  const aplicarFiltros = () => {
    onFiltrosChange(filtrosLocais);
    onToggleFiltros();
  };

  const limparFiltros = () => {
    setFiltrosLocais({});
    onLimparFiltros();
  };

  const temFiltrosAtivos = Object.keys(filtros).length > 0;

  return (
    <div className="space-y-4 mb-6">
      {/* Barra de Busca Principal */}
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Buscar por número, fornecedor, descrição ou documento..."
            value={termoBusca}
            onChange={(e) => onTermoBuscaChange(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          />
        </div>

        <button
          onClick={onToggleFiltros}
          className={`flex items-center gap-2 px-4 py-3 border rounded-lg transition-colors ${
            mostrarFiltros || temFiltrosAtivos
              ? 'bg-blue-50 border-blue-200 text-blue-700'
              : 'border-gray-300 text-gray-700 hover:bg-gray-50'
          }`}
        >
          <SlidersHorizontal className="w-4 h-4" />
          Filtros
          {temFiltrosAtivos && (
            <span className="bg-blue-600 text-white text-xs rounded-full px-2 py-0.5 min-w-[20px] text-center">
              {Object.keys(filtros).length}
            </span>
          )}
        </button>

        {temFiltrosAtivos && (
          <button
            onClick={onLimparFiltros}
            className="flex items-center gap-2 px-4 py-3 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <FilterX className="w-4 h-4" />
            Limpar
          </button>
        )}
      </div>

      {/* Painel de Filtros Expandido */}
      {mostrarFiltros && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Filtros Avançados</h3>
            <button onClick={onToggleFiltros} className="text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Tag className="w-4 h-4 inline mr-1" />
                Status
              </label>
              <select
                value={filtrosLocais.status || ''}
                onChange={(e) =>
                  setFiltrosLocais((prev) => ({ ...prev, status: e.target.value || undefined }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Todos os status</option>
                <option value="vencido">Vencido</option>
                <option value="vence_hoje">Vence Hoje</option>
                <option value="a_vencer">A Vencer</option>
                <option value="pago">Pago</option>
                <option value="agendado">Agendado</option>
                <option value="cancelado">Cancelado</option>
              </select>
            </div>

            {/* Data Início */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-1" />
                Vencimento - De
              </label>
              <input
                type="date"
                value={filtrosLocais.dataInicio || ''}
                onChange={(e) =>
                  setFiltrosLocais((prev) => ({ ...prev, dataInicio: e.target.value || undefined }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Data Fim */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-1" />
                Vencimento - Até
              </label>
              <input
                type="date"
                value={filtrosLocais.dataFim || ''}
                onChange={(e) =>
                  setFiltrosLocais((prev) => ({ ...prev, dataFim: e.target.value || undefined }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Valor Mínimo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <DollarSign className="w-4 h-4 inline mr-1" />
                Valor Mínimo
              </label>
              <input
                type="number"
                step="0.01"
                placeholder="0,00"
                value={filtrosLocais.valorMinimo || ''}
                onChange={(e) =>
                  setFiltrosLocais((prev) => ({
                    ...prev,
                    valorMinimo: parseFloat(e.target.value) || undefined,
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Valor Máximo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <DollarSign className="w-4 h-4 inline mr-1" />
                Valor Máximo
              </label>
              <input
                type="number"
                step="0.01"
                placeholder="0,00"
                value={filtrosLocais.valorMaximo || ''}
                onChange={(e) =>
                  setFiltrosLocais((prev) => ({
                    ...prev,
                    valorMaximo: parseFloat(e.target.value) || undefined,
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="flex gap-3 justify-end">
            <button
              onClick={limparFiltros}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Limpar Filtros
            </button>
            <button
              onClick={aplicarFiltros}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Aplicar Filtros
            </button>
          </div>
        </div>
      )}

      {/* Tags de Filtros Ativos */}
      {temFiltrosAtivos && !mostrarFiltros && (
        <div className="flex flex-wrap gap-2">
          {Object.entries(filtros).map(([key, value]) => {
            if (!value) return null;

            let label = '';
            switch (key) {
              case 'status':
                label = `Status: ${value}`;
                break;
              case 'dataInicio':
                label = `De: ${new Date(value as string).toLocaleDateString('pt-BR')}`;
                break;
              case 'dataFim':
                label = `Até: ${new Date(value as string).toLocaleDateString('pt-BR')}`;
                break;
              case 'valorMinimo':
                label = `Min: R$ ${value}`;
                break;
              case 'valorMaximo':
                label = `Max: R$ ${value}`;
                break;
              default:
                label = `${key}: ${value}`;
            }

            return (
              <span
                key={key}
                className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
              >
                {label}
                <button
                  onClick={() => {
                    const novosFiltros = { ...filtros };
                    delete novosFiltros[key as keyof FiltrosSimples];
                    onFiltrosChange(novosFiltros);
                  }}
                  className="ml-1 hover:text-blue-600"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default BarraBuscaFiltros;
