import React, { useState, useEffect } from 'react';
import { propostasService } from '../services/propostasService';
import {
  Filter,
  X,
  Calendar,
  DollarSign,
  Users,
  BarChart3,
  ChevronDown,
  ChevronUp,
  RotateCcw
} from 'lucide-react';

interface FiltrosAvancadosProps {
  onFiltersChange: (filtros: {
    status?: string;
    vendedor?: string;
    dataInicio?: string;
    dataFim?: string;
    valorMin?: number;
    valorMax?: number;
    categoria?: string;
    probabilidadeMin?: number;
  }) => void;
  isOpen: boolean;
  onToggle: () => void;
}

export const FiltrosAvancados: React.FC<FiltrosAvancadosProps> = ({
  onFiltersChange,
  isOpen,
  onToggle
}) => {
  const [filtros, setFiltros] = useState({
    status: '',
    vendedor: '',
    dataInicio: '',
    dataFim: '',
    valorMin: '',
    valorMax: '',
    categoria: '',
    probabilidadeMin: ''
  });

  const [vendedores, setVendedores] = useState<Array<{ id: string; nome: string }>>([]);
  const [isLoadingVendedores, setIsLoadingVendedores] = useState(false);

  // Carregar vendedores disponíveis
  useEffect(() => {
    const carregarVendedores = async () => {
      try {
        setIsLoadingVendedores(true);
        const vendedoresData = await propostasService.obterVendedores();
        setVendedores(vendedoresData.map(v => ({ id: v.id, nome: v.nome })));
      } catch (error) {
        console.error('Erro ao carregar vendedores:', error);
      } finally {
        setIsLoadingVendedores(false);
      }
    };

    if (isOpen) {
      carregarVendedores();
    }
  }, [isOpen]);

  const handleFilterChange = (key: string, value: string) => {
    const novosFiltros = { ...filtros, [key]: value };
    setFiltros(novosFiltros);

    // Converter e aplicar filtros
    const filtrosConvertidos = {
      status: novosFiltros.status || undefined,
      vendedor: novosFiltros.vendedor || undefined,
      dataInicio: novosFiltros.dataInicio || undefined,
      dataFim: novosFiltros.dataFim || undefined,
      valorMin: novosFiltros.valorMin ? parseFloat(novosFiltros.valorMin) : undefined,
      valorMax: novosFiltros.valorMax ? parseFloat(novosFiltros.valorMax) : undefined,
      categoria: novosFiltros.categoria || undefined,
      probabilidadeMin: novosFiltros.probabilidadeMin ? parseFloat(novosFiltros.probabilidadeMin) : undefined
    };

    onFiltersChange(filtrosConvertidos);
  };

  const limparFiltros = () => {
    const filtrosLimpos = {
      status: '',
      vendedor: '',
      dataInicio: '',
      dataFim: '',
      valorMin: '',
      valorMax: '',
      categoria: '',
      probabilidadeMin: ''
    };
    setFiltros(filtrosLimpos);
    onFiltersChange({});
  };

  const aplicarFiltroRapido = (tipo: string) => {
    const hoje = new Date();
    let dataInicio = '';
    let dataFim = '';

    switch (tipo) {
      case 'hoje':
        dataInicio = dataFim = hoje.toISOString().split('T')[0];
        break;
      case 'semana':
        const inicioSemana = new Date(hoje);
        inicioSemana.setDate(hoje.getDate() - hoje.getDay());
        dataInicio = inicioSemana.toISOString().split('T')[0];
        dataFim = hoje.toISOString().split('T')[0];
        break;
      case 'mes':
        dataInicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1).toISOString().split('T')[0];
        dataFim = hoje.toISOString().split('T')[0];
        break;
      case 'trimestre':
        const mesAtual = hoje.getMonth();
        const inicioTrimestre = Math.floor(mesAtual / 3) * 3;
        dataInicio = new Date(hoje.getFullYear(), inicioTrimestre, 1).toISOString().split('T')[0];
        dataFim = hoje.toISOString().split('T')[0];
        break;
    }

    handleFilterChange('dataInicio', dataInicio);
    handleFilterChange('dataFim', dataFim);
  };

  const contarFiltrosAtivos = () => {
    return Object.values(filtros).filter(value => value !== '').length;
  };

  if (!isOpen) {
    return (
      <button
        onClick={onToggle}
        className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors duration-200"
      >
        <Filter className="h-4 w-4 mr-2" />
        Filtros Avançados
        {contarFiltrosAtivos() > 0 && (
          <span className="ml-2 px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded-full">
            {contarFiltrosAtivos()}
          </span>
        )}
      </button>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6 space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Filter className="h-5 w-5 text-gray-500 mr-2" />
          <h3 className="text-lg font-medium text-gray-900">Filtros Avançados</h3>
          {contarFiltrosAtivos() > 0 && (
            <span className="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
              {contarFiltrosAtivos()} filtro(s) ativo(s)
            </span>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={limparFiltros}
            className="inline-flex items-center px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 transition-colors duration-200"
          >
            <RotateCcw className="h-4 w-4 mr-1" />
            Limpar
          </button>
          <button
            onClick={onToggle}
            className="inline-flex items-center px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 transition-colors duration-200"
          >
            <ChevronUp className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Filtros rápidos por período */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <Calendar className="inline h-4 w-4 mr-1" />
          Períodos Rápidos
        </label>
        <div className="flex flex-wrap gap-2">
          {[
            { key: 'hoje', label: 'Hoje' },
            { key: 'semana', label: 'Esta Semana' },
            { key: 'mes', label: 'Este Mês' },
            { key: 'trimestre', label: 'Este Trimestre' }
          ].map(periodo => (
            <button
              key={periodo.key}
              onClick={() => aplicarFiltroRapido(periodo.key)}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-md hover:bg-gray-50 transition-colors duration-200"
            >
              {periodo.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid de filtros */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Status */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
          <select
            value={filtros.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Todos os Status</option>
            <option value="rascunho">Rascunho</option>
            <option value="enviada">Enviada</option>
            <option value="negociacao">Em Negociação</option>
            <option value="aprovada">Aprovada</option>
            <option value="rejeitada">Rejeitada</option>
          </select>
        </div>

        {/* Vendedor */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <Users className="inline h-4 w-4 mr-1" />
            Vendedor
          </label>
          <select
            value={filtros.vendedor}
            onChange={(e) => handleFilterChange('vendedor', e.target.value)}
            disabled={isLoadingVendedores}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
          >
            <option value="">Todos os Vendedores</option>
            {vendedores.map(vendedor => (
              <option key={vendedor.id} value={vendedor.id}>
                {vendedor.nome}
              </option>
            ))}
          </select>
        </div>

        {/* Categoria */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
          <select
            value={filtros.categoria}
            onChange={(e) => handleFilterChange('categoria', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Todas as Categorias</option>
            <option value="software">Software</option>
            <option value="consultoria">Consultoria</option>
            <option value="treinamento">Treinamento</option>
            <option value="design">Design</option>
            <option value="ecommerce">E-commerce</option>
            <option value="proposta">Proposta Geral</option>
          </select>
        </div>

        {/* Data Início */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Data Início</label>
          <input
            type="date"
            value={filtros.dataInicio}
            onChange={(e) => handleFilterChange('dataInicio', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Data Fim */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Data Fim</label>
          <input
            type="date"
            value={filtros.dataFim}
            onChange={(e) => handleFilterChange('dataFim', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Valor Mínimo */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <DollarSign className="inline h-4 w-4 mr-1" />
            Valor Mínimo
          </label>
          <input
            type="number"
            value={filtros.valorMin}
            onChange={(e) => handleFilterChange('valorMin', e.target.value)}
            placeholder="0"
            min="0"
            step="0.01"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Valor Máximo */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <DollarSign className="inline h-4 w-4 mr-1" />
            Valor Máximo
          </label>
          <input
            type="number"
            value={filtros.valorMax}
            onChange={(e) => handleFilterChange('valorMax', e.target.value)}
            placeholder="Sem limite"
            min="0"
            step="0.01"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Probabilidade Mínima */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <BarChart3 className="inline h-4 w-4 mr-1" />
            Probabilidade Mín. (%)
          </label>
          <input
            type="number"
            value={filtros.probabilidadeMin}
            onChange={(e) => handleFilterChange('probabilidadeMin', e.target.value)}
            placeholder="0"
            min="0"
            max="100"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Resumo dos filtros ativos */}
      {contarFiltrosAtivos() > 0 && (
        <div className="pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-600 mb-2">Filtros ativos:</p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(filtros).map(([key, value]) => {
              if (!value) return null;

              let label = '';
              switch (key) {
                case 'status':
                  label = `Status: ${value}`;
                  break;
                case 'vendedor':
                  const vendedor = vendedores.find(v => v.id === value);
                  label = `Vendedor: ${vendedor?.nome || value}`;
                  break;
                case 'dataInicio':
                  label = `De: ${new Date(value).toLocaleDateString('pt-BR')}`;
                  break;
                case 'dataFim':
                  label = `Até: ${new Date(value).toLocaleDateString('pt-BR')}`;
                  break;
                case 'valorMin':
                  label = `Valor mín: R$ ${parseFloat(value).toLocaleString('pt-BR')}`;
                  break;
                case 'valorMax':
                  label = `Valor máx: R$ ${parseFloat(value).toLocaleString('pt-BR')}`;
                  break;
                case 'categoria':
                  label = `Categoria: ${value}`;
                  break;
                case 'probabilidadeMin':
                  label = `Prob. mín: ${value}%`;
                  break;
              }

              return (
                <span
                  key={key}
                  className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                >
                  {label}
                  <button
                    onClick={() => handleFilterChange(key, '')}
                    className="ml-1 h-3 w-3 text-blue-600 hover:text-blue-800"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default FiltrosAvancados;
