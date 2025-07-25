import React, { useState, useEffect } from 'react';
import { BackToNucleus } from '../../components/navigation/BackToNucleus';
import { useOportunidades, useEstatisticasOportunidades } from './hooks/useOportunidades';
import { KanbanView } from './components/KanbanView';
import { ListView } from './components/ListView';
import { CalendarView } from './components/CalendarView';
import { FiltrosOportunidades } from './components/FiltrosOportunidades';
import { EstatisticasCards } from './components/EstatisticasCards';
import { ModalOportunidadeAvancado } from './components/ModalOportunidadeAvancado';
import { ExportModal } from './components/ExportModal';
import { VisualizacaoOportunidades, Oportunidade } from '../../types/oportunidades/index';
import {
  Target,
  Plus,
  Filter,
  Search,
  Grid3X3,
  List,
  Calendar,
  BarChart3,
  Download,
  Settings,
  RefreshCw,
  Eye,
  Users,
  TrendingUp,
  AlertCircle
} from 'lucide-react';

export const OportunidadesPage: React.FC = () => {
  const [visualizacao, setVisualizacao] = useState<VisualizacaoOportunidades>('kanban');
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  const [mostrarNovaOportunidade, setMostrarNovaOportunidade] = useState(false);
  const [mostrarExport, setMostrarExport] = useState(false);
  const [oportunidadeSelecionada, setOportunidadeSelecionada] = useState<Oportunidade | null>(null);
  const [termoBusca, setTermoBusca] = useState('');

  const {
    oportunidades,
    loading,
    error,
    filtros,
    carregarOportunidades,
    criarOportunidade,
    atualizarOportunidade,
    excluirOportunidade,
    moverOportunidade,
    aplicarFiltros,
    limparFiltros
  } = useOportunidades();

  const {
    estatisticas,
    loading: loadingEstatisticas
  } = useEstatisticasOportunidades(filtros);

  // Busca em tempo real com debounce otimizado
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (termoBusca.trim()) {
        aplicarFiltros({ busca: termoBusca });
      } else if (filtros.busca) {
        // Só limpar se havia busca antes
        aplicarFiltros({ busca: '' });
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [termoBusca]); // Removido aplicarFiltros das dependências

  const handleNovaOportunidade = () => {
    setMostrarNovaOportunidade(true);
  };

  const handleVisualizarOportunidade = (oportunidade: Oportunidade) => {
    setOportunidadeSelecionada(oportunidade);
  };

  const getIconeVisualizacao = (tipo: VisualizacaoOportunidades) => {
    switch (tipo) {
      case 'kanban': return Grid3X3;
      case 'lista': return List;
      case 'calendario': return Calendar;
      case 'grafico': return BarChart3;
      default: return Grid3X3;
    }
  };

  const getCountFiltrosAtivos = () => {
    return Object.keys(filtros).filter(key => {
      const valor = filtros[key as keyof typeof filtros];
      return valor !== undefined && valor !== '' && valor !== null;
    }).length;
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Erro ao carregar oportunidades</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => carregarOportunidades(false)}
            className="bg-[#159A9C] text-white px-4 py-2 rounded-lg hover:bg-[#138A8C] transition-colors"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="px-6 py-4">
          <BackToNucleus
            nucleusName="CRM"
            nucleusPath="/nuclei/crm"
            currentModuleName="Oportunidades"
          />
          
          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Target className="w-6 h-6 text-[#159A9C]" />
                <h1 className="text-2xl font-bold text-gray-900">Oportunidades</h1>
              </div>
              
              {estatisticas && (
                <div className="hidden md:flex items-center space-x-4 text-sm text-gray-600">
                  <span className="flex items-center">
                    <Users className="w-4 h-4 mr-1" />
                    {estatisticas.totalOportunidades} oportunidades
                  </span>
                  <span className="flex items-center">
                    <TrendingUp className="w-4 h-4 mr-1" />
                    {new Intl.NumberFormat('pt-BR', { 
                      style: 'currency', 
                      currency: 'BRL' 
                    }).format(estatisticas.valorTotalPipeline)}
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-center space-x-3">
              {/* Busca */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Buscar oportunidades..."
                  value={termoBusca}
                  onChange={(e) => setTermoBusca(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-[#159A9C] w-64"
                />
              </div>

              {/* Filtros */}
              <button
                onClick={() => setMostrarFiltros(!mostrarFiltros)}
                className={`
                  px-3 py-2 rounded-lg border transition-colors flex items-center space-x-2
                  ${mostrarFiltros 
                    ? 'bg-[#159A9C] text-white border-[#159A9C]' 
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }
                  ${getCountFiltrosAtivos() > 0 ? 'ring-2 ring-orange-200' : ''}
                `}
              >
                <Filter className="w-4 h-4" />
                <span>Filtros</span>
                {getCountFiltrosAtivos() > 0 && (
                  <span className="bg-orange-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {getCountFiltrosAtivos()}
                  </span>
                )}
              </button>

              {/* Visualizações */}
              <div className="flex items-center bg-gray-100 rounded-lg p-1">
                {(['kanban', 'lista', 'calendario', 'grafico'] as VisualizacaoOportunidades[]).map((tipo) => {
                  const Icone = getIconeVisualizacao(tipo);
                  return (
                    <button
                      key={tipo}
                      onClick={() => setVisualizacao(tipo)}
                      className={`
                        p-2 rounded-md transition-colors
                        ${visualizacao === tipo 
                          ? 'bg-white text-[#159A9C] shadow-sm' 
                          : 'text-gray-600 hover:text-gray-900'
                        }
                      `}
                      title={tipo.charAt(0).toUpperCase() + tipo.slice(1)}
                    >
                      <Icone className="w-4 h-4" />
                    </button>
                  );
                })}
              </div>

              {/* Ações */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => carregarOportunidades(false)}
                  disabled={loading}
                  className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                  title="Atualizar"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                </button>

                <button
                  onClick={() => setMostrarExport(true)}
                  className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Exportar"
                >
                  <Download className="w-4 h-4" />
                </button>

                <button className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors">
                  <Settings className="w-4 h-4" />
                </button>
              </div>

              {/* Nova Oportunidade */}
              <button
                onClick={handleNovaOportunidade}
                className="bg-[#159A9C] text-white px-4 py-2 rounded-lg hover:bg-[#138A8C] transition-colors flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Nova Oportunidade</span>
              </button>
            </div>
          </div>
        </div>

        {/* Filtros Expandidos */}
        {mostrarFiltros && (
          <div className="border-t bg-gray-50">
            <FiltrosOportunidades
              filtros={filtros}
              aplicarFiltros={aplicarFiltros}
              limparFiltros={limparFiltros}
              onClose={() => setMostrarFiltros(false)}
            />
          </div>
        )}
      </div>

      {/* Estatísticas */}
      {estatisticas && !loadingEstatisticas && (
        <div className="bg-white border-b">
          <EstatisticasCards estatisticas={estatisticas} />
        </div>
      )}

      {/* Conteúdo Principal */}
      <div className="flex-1 p-6">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <RefreshCw className="w-8 h-8 text-[#159A9C] mx-auto mb-4 animate-spin" />
              <p className="text-gray-600">Carregando oportunidades...</p>
            </div>
          </div>
        ) : (
          <>
            {visualizacao === 'kanban' && (
              <KanbanView
                onVisualizarOportunidade={handleVisualizarOportunidade}
                filtros={filtros}
              />
            )}

            {visualizacao === 'lista' && (
              <ListView
                oportunidades={oportunidades}
                onVisualizarOportunidade={handleVisualizarOportunidade}
                onEditarOportunidade={atualizarOportunidade}
                onExcluirOportunidade={excluirOportunidade}
              />
            )}

            {visualizacao === 'calendario' && (
              <CalendarView
                oportunidades={oportunidades}
                onVisualizarOportunidade={handleVisualizarOportunidade}
              />
            )}

            {visualizacao === 'grafico' && (
              <div className="text-center py-16">
                <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Visualização em Gráficos</h3>
                <p className="text-gray-600">Esta funcionalidade estará disponível em breve</p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modais */}
      <ModalOportunidadeAvancado
        isOpen={mostrarNovaOportunidade}
        onClose={() => setMostrarNovaOportunidade(false)}
        onSuccess={() => {
          // Não recarrega as oportunidades pois o hook já adiciona no estado local
          setMostrarNovaOportunidade(false);
        }}
      />

      {oportunidadeSelecionada && (
        <ModalOportunidadeAvancado
          oportunidade={oportunidadeSelecionada}
          isOpen={!!oportunidadeSelecionada}
          onClose={() => setOportunidadeSelecionada(null)}
          onSuccess={() => {
            // Não recarrega as oportunidades pois o hook já atualiza no estado local
            setOportunidadeSelecionada(null);
          }}
        />
      )}

      <ExportModal
        isOpen={mostrarExport}
        onClose={() => setMostrarExport(false)}
        filtros={filtros}
        totalOportunidades={oportunidades.length}
      />
    </div>
  );
};

export default OportunidadesPage;
