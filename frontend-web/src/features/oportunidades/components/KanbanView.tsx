import React, { useState } from 'react';
import { useKanbanOportunidades } from '../hooks/useOportunidades';
import { Oportunidade, EstagioOportunidade, FiltrosOportunidade } from '../../../types/oportunidades/index';
import { KanbanCard } from './KanbanCard';
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult
} from '@hello-pangea/dnd';
import {
  TrendingUp,
  Users,
  DollarSign,
  Clock,
  RefreshCw,
  AlertCircle
} from 'lucide-react';

interface KanbanViewProps {
  onVisualizarOportunidade: (oportunidade: Oportunidade) => void;
  filtros?: Partial<FiltrosOportunidade>;
}

export const KanbanView: React.FC<KanbanViewProps> = ({
  onVisualizarOportunidade,
  filtros
}) => {
  const { dadosKanban, loading, error, moverOportunidade, recarregar } = useKanbanOportunidades(filtros);
  const [draggedItem, setDraggedItem] = useState<Oportunidade | null>(null);

  const handleDragStart = (start: any) => {
    const oportunidade = findOportunidadeById(parseInt(start.draggableId));
    setDraggedItem(oportunidade);
  };

  const handleDragEnd = async (result: DropResult) => {
    const { source, destination, draggableId } = result;

    setDraggedItem(null);

    if (!destination) return;
    if (source.droppableId === destination.droppableId) return;

    const oportunidadeId = parseInt(draggableId);
    const estagioOrigem = source.droppableId as EstagioOportunidade;
    const estagioDestino = destination.droppableId as EstagioOportunidade;

    await moverOportunidade(oportunidadeId, estagioOrigem, estagioDestino);
  };

  const findOportunidadeById = (id: number): Oportunidade | null => {
    if (!dadosKanban) return null;

    for (const estagio of dadosKanban.estagios) {
      const oportunidade = estagio.oportunidades.find(op => op.id === id);
      if (oportunidade) return oportunidade;
    }

    return null;
  };

  const getEstagioConfig = (estagio: EstagioOportunidade) => {
    const configs = {
      [EstagioOportunidade.LEADS]: {
        nome: 'Leads',
        cor: 'bg-gray-100 border-gray-300',
        corTexto: 'text-gray-700',
        icone: Users
      },
      [EstagioOportunidade.QUALIFICACAO]: {
        nome: 'Qualificação',
        cor: 'bg-blue-50 border-blue-200',
        corTexto: 'text-blue-700',
        icone: Clock
      },
      [EstagioOportunidade.PROPOSTA]: {
        nome: 'Proposta',
        cor: 'bg-yellow-50 border-yellow-200',
        corTexto: 'text-yellow-700',
        icone: DollarSign
      },
      [EstagioOportunidade.NEGOCIACAO]: {
        nome: 'Negociação',
        cor: 'bg-orange-50 border-orange-200',
        corTexto: 'text-orange-700',
        icone: TrendingUp
      },
      [EstagioOportunidade.FECHAMENTO]: {
        nome: 'Fechamento',
        cor: 'bg-purple-50 border-purple-200',
        corTexto: 'text-purple-700',
        icone: Clock
      },
      [EstagioOportunidade.GANHO]: {
        nome: 'Ganho',
        cor: 'bg-green-50 border-green-200',
        corTexto: 'text-green-700',
        icone: TrendingUp
      },
      [EstagioOportunidade.PERDIDO]: {
        nome: 'Perdido',
        cor: 'bg-red-50 border-red-200',
        corTexto: 'text-red-700',
        icone: AlertCircle
      }
    };

    return configs[estagio];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-[#159A9C] mx-auto mb-4 animate-spin" />
          <p className="text-gray-600">Carregando pipeline...</p>
        </div>
      </div>
    );
  }

  if (error || !dadosKanban) {
    return (
      <div className="text-center py-16">
        <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Erro ao carregar pipeline</h3>
        <p className="text-gray-600 mb-4">{error || 'Dados não disponíveis'}</p>
        <button
          onClick={recarregar}
          className="bg-[#159A9C] text-white px-4 py-2 rounded-lg hover:bg-[#138A8C] transition-colors"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Resumo do Pipeline */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Pipeline de Vendas</h2>
            <p className="text-sm text-gray-600 mt-1">
              {dadosKanban.totalOportunidades} oportunidades • {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL'
              }).format(dadosKanban.totalValor)} em negociação
            </p>
          </div>

          <button
            onClick={recarregar}
            className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <DragDropContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div className="flex overflow-x-auto min-h-[600px]">
            {dadosKanban?.estagios?.map((estagioData) => {
              const config = getEstagioConfig(estagioData.estagio);
              const Icone = config.icone;

              return (
                <div
                  key={estagioData.estagio}
                  className="flex-shrink-0 w-80 p-4 border-r border-gray-200 last:border-r-0"
                >
                  {/* Header da Coluna */}
                  <div className={`rounded-lg p-4 mb-4 border ${config.cor}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Icone className={`w-5 h-5 ${config.corTexto}`} />
                        <h3 className={`font-semibold ${config.corTexto}`}>
                          {config.nome}
                        </h3>
                      </div>

                      <div className="text-right">
                        <div className={`text-lg font-bold ${config.corTexto}`}>
                          {estagioData?.quantidade || 0}
                        </div>
                        <div className="text-xs text-gray-600">
                          {new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                            notation: 'compact'
                          }).format(estagioData?.valor || 0)}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Lista de Oportunidades */}
                  <Droppable droppableId={estagioData.estagio}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`
                          min-h-[400px] space-y-3 rounded-lg p-2 transition-colors
                          ${snapshot.isDraggingOver ? 'bg-blue-50 border-2 border-blue-200 border-dashed' : ''}
                        `}
                      >
                        {estagioData?.oportunidades?.map((oportunidade, index) => (
                          <Draggable
                            key={oportunidade.id}
                            draggableId={oportunidade.id.toString()}
                            index={index}
                          >
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className={`
                                  ${snapshot.isDragging ? 'rotate-6 shadow-2xl' : ''}
                                  ${snapshot.isDragging ? 'z-50' : 'z-0'}
                                `}
                              >
                                <KanbanCard
                                  oportunidade={oportunidade}
                                  onClick={() => onVisualizarOportunidade(oportunidade)}
                                  isDragging={snapshot.isDragging}
                                />
                              </div>
                            )}
                          </Draggable>
                        ))}

                        {provided.placeholder}

                        {/* Placeholder quando vazio */}
                        {estagioData.oportunidades.length === 0 && (
                          <div className="text-center py-8 text-gray-400">
                            <div className="text-sm">Nenhuma oportunidade</div>
                            <div className="text-xs mt-1">
                              Arraste oportunidades para cá
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </Droppable>
                </div>
              );
            })}
          </div>
        </DragDropContext>
      </div>

      {/* Indicador de Drag */}
      {draggedItem && (
        <div className="fixed bottom-4 right-4 bg-black text-white px-4 py-2 rounded-lg shadow-lg z-50">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-[#159A9C] rounded-full animate-pulse"></div>
            <span className="text-sm">
              Movendo "{draggedItem.titulo}"
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
