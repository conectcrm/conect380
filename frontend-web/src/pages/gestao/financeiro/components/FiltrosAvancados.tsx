import React, { useState, useEffect } from 'react';
import { 
  X, 
  Calendar, 
  DollarSign, 
  Filter, 
  Building, 
  Tag, 
  CheckCircle2,
  RotateCcw,
  Search,
  CalendarDays,
  Banknote,
  AlertTriangle,
  Clock,
  CreditCard
} from 'lucide-react';
import { 
  FiltrosContasPagar, 
  StatusContaPagar, 
  CategoriaContaPagar, 
  FormaPagamento,
  PrioridadePagamento,
  STATUS_LABELS,
  CATEGORIA_LABELS,
  FORMA_PAGAMENTO_LABELS,
  PRIORIDADE_LABELS
} from '../../../../types/financeiro';

interface FiltrosAvancadosProps {
  filtros: FiltrosContasPagar;
  onFiltrosChange: (filtros: FiltrosContasPagar) => void;
  onFechar: () => void;
}

interface FiltroRapido {
  id: string;
  label: string;
  filtro: Partial<FiltrosContasPagar>;
  icon: React.ElementType;
  color: string;
}

const FiltrosAvancados: React.FC<FiltrosAvancadosProps> = ({
  filtros,
  onFiltrosChange,
  onFechar
}) => {
  const [filtrosLocais, setFiltrosLocais] = useState<FiltrosContasPagar>(filtros);
  const [abaSelecionada, setAbaSelecionada] = useState<'rapidos' | 'periodo' | 'valores' | 'categorias'>('rapidos');

  // Filtros rápidos seguindo padrão dos melhores ERPs
  const filtrosRapidos: FiltroRapido[] = [
    {
      id: 'vencendo_hoje',
      label: 'Vencendo Hoje',
      filtro: {
        dataInicio: new Date().toISOString().split('T')[0],
        dataFim: new Date().toISOString().split('T')[0],
        status: [StatusContaPagar.EM_ABERTO]
      },
      icon: AlertTriangle,
      color: 'text-orange-600 bg-orange-50 border-orange-200'
    },
    {
      id: 'vencidos',
      label: 'Vencidos',
      filtro: {
        dataFim: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: [StatusContaPagar.EM_ABERTO]
      },
      icon: AlertTriangle,
      color: 'text-red-600 bg-red-50 border-red-200'
    },
    {
      id: 'proximos_7_dias',
      label: 'Próximos 7 Dias',
      filtro: {
        dataInicio: new Date().toISOString().split('T')[0],
        dataFim: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: [StatusContaPagar.EM_ABERTO]
      },
      icon: Clock,
      color: 'text-blue-600 bg-blue-50 border-blue-200'
    },
    {
      id: 'pagos_mes',
      label: 'Pagos no Mês',
      filtro: {
        dataInicio: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
        dataFim: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0],
        status: [StatusContaPagar.PAGO]
      },
      icon: CheckCircle2,
      color: 'text-green-600 bg-green-50 border-green-200'
    },
    {
      id: 'alta_prioridade',
      label: 'Alta Prioridade',
      filtro: {
        prioridade: [PrioridadePagamento.ALTA, PrioridadePagamento.URGENTE],
        status: [StatusContaPagar.EM_ABERTO]
      },
      icon: AlertTriangle,
      color: 'text-purple-600 bg-purple-50 border-purple-200'
    },
    {
      id: 'tecnologia',
      label: 'Tecnologia',
      filtro: {
        categoria: [CategoriaContaPagar.TECNOLOGIA]
      },
      icon: RotateCcw,
      color: 'text-indigo-600 bg-indigo-50 border-indigo-200'
    }
  ];

  useEffect(() => {
    setFiltrosLocais(filtros);
  }, [filtros]);

  const handleAplicarFiltros = () => {
    onFiltrosChange(filtrosLocais);
    onFechar();
  };

  const handleLimparFiltros = () => {
    const filtrosLimpos: FiltrosContasPagar = {};
    setFiltrosLocais(filtrosLimpos);
    onFiltrosChange(filtrosLimpos);
  };

  const handleFiltroRapido = (filtro: Partial<FiltrosContasPagar>) => {
    setFiltrosLocais(filtro);
    onFiltrosChange(filtro);
    onFechar();
  };

  const updateFiltro = (campo: keyof FiltrosContasPagar, valor: any) => {
    setFiltrosLocais(prev => ({
      ...prev,
      [campo]: valor
    }));
  };

  const toggleArrayValue = (campo: keyof FiltrosContasPagar, valor: any) => {
    const arrayAtual = (filtrosLocais[campo] as any[]) || [];
    const novoArray = arrayAtual.includes(valor)
      ? arrayAtual.filter(item => item !== valor)
      : [...arrayAtual, valor];
    
    updateFiltro(campo, novoArray.length > 0 ? novoArray : undefined);
  };

  const countFiltrosAtivos = () => {
    return Object.keys(filtrosLocais).filter(key => {
      const valor = filtrosLocais[key as keyof FiltrosContasPagar];
      if (Array.isArray(valor)) {
        return valor.length > 0;
      }
      return valor !== undefined && valor !== null && valor !== '';
    }).length;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Filter className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Filtros Avançados</h2>
              <p className="text-sm text-gray-600">
                {countFiltrosAtivos()} filtro{countFiltrosAtivos() !== 1 ? 's' : ''} ativo{countFiltrosAtivos() !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={handleLimparFiltros}
              className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-2"
            >
              <RotateCcw className="h-4 w-4" />
              <span>Limpar</span>
            </button>
            <button
              onClick={onFechar}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-gray-200 bg-gray-50">
          {[
            { id: 'rapidos', label: 'Filtros Rápidos', icon: Search },
            { id: 'periodo', label: 'Período', icon: CalendarDays },
            { id: 'valores', label: 'Valores', icon: Banknote },
            { id: 'categorias', label: 'Categorias', icon: Tag }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setAbaSelecionada(tab.id as any)}
                className={`flex items-center space-x-2 px-6 py-4 font-medium text-sm transition-colors border-b-2 ${
                  abaSelecionada === tab.id
                    ? 'text-blue-600 border-blue-600 bg-white'
                    : 'text-gray-600 border-transparent hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {/* Filtros Rápidos */}
          {abaSelecionada === 'rapidos' && (
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Filtros Rápidos</h3>
                <p className="text-sm text-gray-600">Aplique filtros pré-configurados comumente utilizados</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filtrosRapidos.map((filtroRapido) => {
                  const Icon = filtroRapido.icon;
                  return (
                    <button
                      key={filtroRapido.id}
                      onClick={() => handleFiltroRapido(filtroRapido.filtro)}
                      className={`p-4 border-2 rounded-xl transition-all hover:shadow-md ${filtroRapido.color} hover:scale-105`}
                    >
                      <div className="flex items-center space-x-3">
                        <Icon className="h-6 w-6" />
                        <span className="font-medium">{filtroRapido.label}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Filtros de Período */}
          {abaSelecionada === 'periodo' && (
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Filtros por Período</h3>
                <p className="text-sm text-gray-600">Configure intervalos de datas específicos</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900 flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-blue-600" />
                    <span>Data de Vencimento</span>
                  </h4>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Data Inicial</label>
                      <input
                        type="date"
                        value={filtrosLocais.dataInicio || ''}
                        onChange={(e) => updateFiltro('dataInicio', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Data Final</label>
                      <input
                        type="date"
                        value={filtrosLocais.dataFim || ''}
                        onChange={(e) => updateFiltro('dataFim', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900 flex items-center space-x-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span>Status</span>
                  </h4>
                  
                  <div className="space-y-2">
                    {Object.entries(STATUS_LABELS).map(([status, label]) => (
                      <label key={status} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={(filtrosLocais.status || []).includes(status as StatusContaPagar)}
                          onChange={() => toggleArrayValue('status', status as StatusContaPagar)}
                          className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm font-medium text-gray-700">{label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Filtros de Valores */}
          {abaSelecionada === 'valores' && (
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Filtros por Valores</h3>
                <p className="text-sm text-gray-600">Configure intervalos de valores e formas de pagamento</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900 flex items-center space-x-2">
                    <DollarSign className="h-4 w-4 text-green-600" />
                    <span>Faixa de Valores</span>
                  </h4>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Valor Mínimo</label>
                      <div className="relative">
                        <span className="absolute left-3 top-2 text-gray-500">R$</span>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={filtrosLocais.valorMinimo || ''}
                          onChange={(e) => updateFiltro('valorMinimo', parseFloat(e.target.value) || undefined)}
                          className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="0,00"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Valor Máximo</label>
                      <div className="relative">
                        <span className="absolute left-3 top-2 text-gray-500">R$</span>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={filtrosLocais.valorMaximo || ''}
                          onChange={(e) => updateFiltro('valorMaximo', parseFloat(e.target.value) || undefined)}
                          className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="0,00"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900 flex items-center space-x-2">
                    <CreditCard className="h-4 w-4 text-purple-600" />
                    <span>Forma de Pagamento</span>
                  </h4>
                  
                  <div className="space-y-2">
                    {Object.entries(FORMA_PAGAMENTO_LABELS).map(([forma, label]) => (
                      <label key={forma} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={(filtrosLocais.formaPagamento || []).includes(forma as FormaPagamento)}
                          onChange={() => toggleArrayValue('formaPagamento', forma as FormaPagamento)}
                          className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm font-medium text-gray-700">{label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Filtros de Categorias */}
          {abaSelecionada === 'categorias' && (
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Filtros por Categorias</h3>
                <p className="text-sm text-gray-600">Organize por categorias e prioridades</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900 flex items-center space-x-2">
                    <Tag className="h-4 w-4 text-indigo-600" />
                    <span>Categorias</span>
                  </h4>
                  
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {Object.entries(CATEGORIA_LABELS).map(([categoria, label]) => (
                      <label key={categoria} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={(filtrosLocais.categoria || []).includes(categoria as CategoriaContaPagar)}
                          onChange={() => toggleArrayValue('categoria', categoria as CategoriaContaPagar)}
                          className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm font-medium text-gray-700">{label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900 flex items-center space-x-2">
                    <AlertTriangle className="h-4 w-4 text-orange-600" />
                    <span>Prioridade</span>
                  </h4>
                  
                  <div className="space-y-2">
                    {Object.entries(PRIORIDADE_LABELS).map(([prioridade, label]) => (
                      <label key={prioridade} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={(filtrosLocais.prioridade || []).includes(prioridade as PrioridadePagamento)}
                          onChange={() => toggleArrayValue('prioridade', prioridade as PrioridadePagamento)}
                          className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm font-medium text-gray-700">{label}</span>
                      </label>
                    ))}
                  </div>

                  <div className="pt-4 border-t border-gray-200">
                    <h5 className="font-medium text-gray-900 mb-3">Busca por Texto</h5>
                    <div className="relative">
                      <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                      <input
                        type="text"
                        value={filtrosLocais.termo || ''}
                        onChange={(e) => updateFiltro('termo', e.target.value)}
                        placeholder="Buscar por descrição, número, fornecedor..."
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <div className="text-sm text-gray-600">
            {countFiltrosAtivos() > 0 && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {countFiltrosAtivos()} filtro{countFiltrosAtivos() !== 1 ? 's' : ''} ativo{countFiltrosAtivos() !== 1 ? 's' : ''}
              </span>
            )}
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={onFechar}
              className="px-6 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleAplicarFiltros}
              className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <Filter className="h-4 w-4" />
              <span>Aplicar Filtros</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FiltrosAvancados;
