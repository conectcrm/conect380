import React, { useState } from 'react';
import {
  DragDropContext,
  Droppable,
  Draggable
} from '@hello-pangea/dnd';
import {
  Plus,
  Filter,
  Search,
  DollarSign,
  Users,
  TrendingUp,
  Edit,
  Target,
  BarChart3,
  ShoppingBag
} from 'lucide-react';
import OpportunityModal from '../components/OpportunityModal';
import { ModalCriarOportunidade } from '../components/modals/ModalCriarOportunidade';
import { BackToNucleus } from '../components/navigation/BackToNucleus';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { opportunitiesService } from '../services/opportunitiesService';
import toast from 'react-hot-toast';

const FunilVendas = () => {
  const queryClient = useQueryClient();
  const [selectedOpportunity, setSelectedOpportunity] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    dateRange: 'all',
    assignedTo: 'all',
    priority: 'all',
    source: 'all'
  });

  // Queries para dados da API
  const {
    data: pipelineData,
    isLoading: loadingPipeline,
    error: pipelineError
  } = useQuery({
    queryKey: ['pipeline'],
    queryFn: () => opportunitiesService.getPipelineData(),
    refetchInterval: 30000,
    retry: 3,
    retryDelay: 1000
  });

  const {
    data: metrics,
    isLoading: loadingMetrics,
    error: metricsError
  } = useQuery({
    queryKey: ['metrics'],
    queryFn: () => opportunitiesService.getMetrics(),
    refetchInterval: 30000,
    retry: 3,
    retryDelay: 1000
  });

  // Mutation para atualizar estágio (drag and drop)
  const updateStageMutation = useMutation({
    mutationFn: ({ id, estagio }) => opportunitiesService.updateStage(id, estagio),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pipeline'] });
      queryClient.invalidateQueries({ queryKey: ['metrics'] });
      toast.success('Oportunidade movida com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao mover oportunidade:', error);
      toast.error('Erro ao mover oportunidade. Tente novamente.');
      // Recarregar dados em caso de erro
      queryClient.invalidateQueries({ queryKey: ['pipeline'] });
    }
  });

  // Mutation para criar nova oportunidade
  const createOpportunityMutation = useMutation({
    mutationFn: (oportunidadeData) => opportunitiesService.create(oportunidadeData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pipeline'] });
      queryClient.invalidateQueries({ queryKey: ['metrics'] });
      setShowCreateModal(false);
      toast.success('Oportunidade criada com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao criar oportunidade:', error);
      toast.error('Erro ao criar oportunidade. Tente novamente.');
    }
  });

  // Handler para criar oportunidade
  const handleCreateOpportunity = (oportunidadeData) => {
    createOpportunityMutation.mutate(oportunidadeData);
  };

  // Loading states
  if (loadingPipeline || loadingMetrics) {
    return (
      <div className="p-6 bg-[#DEEFE7] min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#159A9C] mx-auto mb-4"></div>
          <p className="text-[#002333]/70">Carregando funil de vendas...</p>
        </div>
      </div>
    );
  }

  // Error states
  if (pipelineError || metricsError) {
    return (
      <div className="p-6 bg-[#DEEFE7] min-h-screen flex items-center justify-center">
        <div className="text-center max-w-sm w-full">
          <div className="bg-[#FFFFFF] border border-[#B4BEC9] text-[#002333] px-4 py-3 rounded-xl mb-4 shadow-sm">
            <p className="font-bold text-[#002333]">Erro ao carregar dados</p>
            <p className="text-sm text-[#002333]/70">Verifique se o backend está ativo e tente novamente.</p>
          </div>
          <button
            onClick={() => {
              queryClient.invalidateQueries({ queryKey: ['pipeline'] });
              queryClient.invalidateQueries({ queryKey: ['metrics'] });
            }}
            className="inline-flex items-center justify-center bg-[#159A9C] text-white px-4 py-2 rounded-lg hover:bg-[#0F7B7D] transition-colors"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  // Organizar oportunidades por estágio com dados da API
  const organizeOpportunitiesByStage = () => {
    if (!pipelineData || !pipelineData.stages) return {};

    const organized = { ...pipelineData.stages };

    // Aplicar filtros de busca e outros filtros
    Object.keys(organized).forEach(stageId => {
      if (organized[stageId]?.opportunities) {
        organized[stageId].opportunities = organized[stageId].opportunities.filter(opp => {
          if (searchTerm &&
            !opp.titulo?.toLowerCase().includes(searchTerm.toLowerCase()) &&
            !opp.empresaContato?.toLowerCase().includes(searchTerm.toLowerCase()) &&
            !opp.cliente?.nome?.toLowerCase().includes(searchTerm.toLowerCase())) {
            return false;
          }
          if (filters.assignedTo !== 'all' && opp.responsavel?.nome !== filters.assignedTo) {
            return false;
          }
          if (filters.priority !== 'all' && opp.prioridade !== filters.priority) {
            return false;
          }
          return true;
        });
      }
    });

    return organized;
  };

  const organizedStages = organizeOpportunitiesByStage();

  // Drag and Drop com API
  const onDragEnd = (result) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (destination.droppableId === source.droppableId &&
      destination.index === source.index) return;

    // Atualizar estágio via API
    updateStageMutation.mutate({
      id: parseInt(draggableId),
      estagio: destination.droppableId
    });
  };

  // Usar métricas da API
  const metricsData = metrics || {
    totalOportunidades: 0,
    valorTotalPipeline: 0,
    valorGanho: 0,
    taxaConversao: 0
  };

  const OpportunityCard = ({ opportunity, index }) => (
    <Draggable draggableId={opportunity.id.toString()} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`bg-[#FFFFFF] rounded-xl p-4 mb-3 shadow-sm border border-[#DEEFE7] hover:shadow-md transition-all cursor-pointer
            ${snapshot.isDragging ? 'rotate-2 shadow-lg' : ''}
            ${opportunity.prioridade === 'high' ? 'border-l-4 border-l-[#159A9C]' : ''}
            ${opportunity.prioridade === 'medium' ? 'border-l-4 border-l-[#002333]' : ''}
            ${opportunity.prioridade === 'low' ? 'border-l-4 border-l-[#B4BEC9]' : ''}
          `}
          onClick={() => {
            setSelectedOpportunity(opportunity);
            setShowModal(true);
          }}
        >
          <div className="flex justify-between items-start mb-2">
            <h4 className="font-semibold text-[#002333] text-sm leading-tight line-clamp-2">
              {opportunity.titulo}
            </h4>
            <div className="flex gap-1 ml-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  // Editar oportunidade
                }}
                className="p-1 hover:bg-[#DEEFE7] rounded transition-colors"
              >
                <Edit className="w-3 h-3 text-[#B4BEC9]" />
              </button>
            </div>
          </div>

          <div className="text-xs text-[#002333]/70 mb-2 space-y-1">
            <div className="flex items-center gap-1">
              <Users className="w-3 h-3 text-[#159A9C]" />
              <span>{opportunity.cliente?.nome || opportunity.empresaContato || 'Cliente não informado'}</span>
            </div>
            <div className="flex items-center gap-1">
              <DollarSign className="w-3 h-3 text-[#159A9C]" />
              <span>
                {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL'
                }).format(opportunity.valor || 0)}
              </span>
            </div>
          </div>

          <div className="flex justify-between items-center text-xs text-[#002333]/60">
            <span>
              {opportunity.probabilidade || 0}% prob.
            </span>
            <span>
              {opportunity.dataFechamentoEsperado
                ? new Date(opportunity.dataFechamentoEsperado).toLocaleDateString('pt-BR')
                : 'Sem data'
              }
            </span>
          </div>

          <div className="flex items-center justify-between mt-3">
            <span className="text-xs bg-[#DEEFE7] text-[#002333] px-2 py-1 rounded-full">
              {opportunity.responsavel?.nome || 'Sem responsável'}
            </span>
            <div className="flex gap-1">
              {opportunity.tags?.slice(0, 2).map(tag => (
                <span key={tag} className="text-xs bg-[#159A9C] text-white px-2 py-1 rounded-full">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </Draggable>
  );

  const StageColumn = ({ stage, opportunities = [] }) => (
    <div className="flex-1 min-w-[280px] bg-[#FFFFFF] border border-[#DEEFE7] rounded-2xl p-4 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: stage?.color || '#159A9C' }}
          />
          <h3 className="font-semibold text-[#002333] text-sm">
            {stage?.title || 'Estágio'}
          </h3>
          <span className="bg-[#DEEFE7] text-[#002333] text-xs font-medium px-2.5 py-1 rounded-full">
            {opportunities.length}
          </span>
        </div>
        <button
          onClick={() => {
            // Adicionar nova oportunidade neste estágio
          }}
          className="p-1 hover:bg-[#DEEFE7] rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4 text-[#159A9C]" />
        </button>
      </div>

      <Droppable droppableId={stage?.id || 'unknown'}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`min-h-[400px] transition-colors rounded-xl border border-dashed border-transparent ${snapshot.isDraggingOver ? 'bg-[#DEEFE7] border-[#159A9C]' : 'bg-transparent'
              }`}
          >
            {opportunities.map((opportunity, index) => (
              <OpportunityCard
                key={opportunity.id}
                opportunity={opportunity}
                index={index}
              />
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>

      {/* Valor total do estágio */}
      <div className="mt-4 pt-3 border-t border-[#DEEFE7]">
        <div className="text-xs text-[#002333]/70">
          Total: {new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
          }).format(
            opportunities.reduce((sum, opp) => sum + (opp.valor || 0), 0)
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-[#FFFFFF] border-b border-[#DEEFE7]">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <BackToNucleus
            nucleusName="Vendas"
            nucleusPath="/nuclei/vendas"
          />
        </div>
      </div>
      <div className="px-6 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="bg-[#FFFFFF] border border-[#DEEFE7] rounded-3xl shadow-sm mb-8">
            <div className="flex flex-col gap-6 p-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-2xl bg-[#159A9C] bg-opacity-10 flex items-center justify-center">
                  <ShoppingBag className="h-7 w-7 text-[#159A9C]" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-[#002333]">Funil de Vendas</h1>
                  <p className="text-sm text-[#002333]/70">
                    Monitore oportunidades, valores e performance da equipe comercial.
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`flex items-center justify-center gap-2 px-4 py-2 rounded-xl border transition-colors font-medium ${showFilters
                    ? 'bg-[#159A9C] text-white border-[#159A9C] shadow-sm'
                    : 'bg-[#FFFFFF] text-[#002333] border-[#B4BEC9] hover:bg-[#DEEFE7]'
                    }`}
                >
                  <Filter className="w-4 h-4" />
                  Filtros
                </button>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="flex items-center justify-center gap-2 bg-[#159A9C] text-white px-4 py-2 rounded-xl hover:bg-[#0F7B7D] transition-colors font-medium shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  Nova Oportunidade
                </button>
              </div>
            </div>
          </div>

          {/* Métricas */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="p-5 rounded-2xl border border-[#DEEFE7] shadow-sm text-[#002333] bg-[#FFFFFF]">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#002333]/60">Total de Oportunidades</p>
                  <p className="mt-2 text-3xl font-bold text-[#002333]">{metricsData.totalOportunidades}</p>
                  <p className="mt-3 text-sm text-[#002333]/70">Fluxo atual de negócios ativos no pipeline.</p>
                </div>
                <div className="h-12 w-12 rounded-2xl bg-[#159A9C]/10 flex items-center justify-center shadow-sm">
                  <Target className="h-6 w-6 text-[#159A9C]" />
                </div>
              </div>
            </div>

            <div className="p-5 rounded-2xl border border-[#DEEFE7] shadow-sm text-[#002333] bg-[#FFFFFF]">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#002333]/60">Valor Total Pipeline</p>
                  <p className="mt-2 text-3xl font-bold text-[#002333]">
                    {new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                      notation: 'compact',
                      maximumFractionDigits: 1
                    }).format(metricsData.valorTotalPipeline)}
                  </p>
                  <p className="mt-3 text-sm text-[#002333]/70">Receita potencial considerando o estágio atual.</p>
                </div>
                <div className="h-12 w-12 rounded-2xl bg-[#159A9C]/10 flex items-center justify-center shadow-sm">
                  <DollarSign className="h-6 w-6 text-[#159A9C]" />
                </div>
              </div>
            </div>

            <div className="p-5 rounded-2xl border border-[#DEEFE7] shadow-sm text-[#002333] bg-[#FFFFFF]">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#002333]/60">Vendas Fechadas</p>
                  <p className="mt-2 text-3xl font-bold text-[#002333]">
                    {new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                      notation: 'compact',
                      maximumFractionDigits: 1
                    }).format(metricsData.valorGanho)}
                  </p>
                  <p className="mt-3 text-sm text-[#002333]/70">Valor conquistado no período selecionado.</p>
                </div>
                <div className="h-12 w-12 rounded-2xl bg-[#159A9C]/10 flex items-center justify-center shadow-sm">
                  <TrendingUp className="h-6 w-6 text-[#159A9C]" />
                </div>
              </div>
            </div>

            <div className="p-5 rounded-2xl border border-[#DEEFE7] shadow-sm text-[#002333] bg-[#FFFFFF]">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#002333]/60">Taxa de Conversão</p>
                  <p className="mt-2 text-3xl font-bold text-[#002333]">{metricsData.taxaConversao}%</p>
                  <p className="mt-3 text-sm text-[#002333]/70">Indicador de eficiência do funil comercial.</p>
                </div>
                <div className="h-12 w-12 rounded-2xl bg-[#159A9C]/10 flex items-center justify-center shadow-sm">
                  <BarChart3 className="h-6 w-6 text-[#159A9C]" />
                </div>
              </div>
            </div>
          </div>

          {/* Filtros */}
          {showFilters && (
            <div className="bg-[#FFFFFF] rounded-3xl p-6 mb-8 shadow-sm border border-[#DEEFE7]">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-[#002333] mb-2">
                    Buscar
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#159A9C]" />
                    <input
                      type="text"
                      placeholder="Buscar oportunidades..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 border border-[#B4BEC9] rounded-xl bg-[#FFFFFF] text-[#002333] placeholder:text-[#002333]/40 focus:ring-2 focus:ring-[#159A9C] focus:border-transparent transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[#002333] mb-2">
                    Vendedor
                  </label>
                  <select
                    value={filters.assignedTo}
                    onChange={(e) => setFilters({ ...filters, assignedTo: e.target.value })}
                    className="w-full px-3 py-2.5 border border-[#B4BEC9] rounded-xl bg-[#FFFFFF] text-[#002333] focus:ring-2 focus:ring-[#159A9C] focus:border-transparent transition"
                  >
                    <option value="all">Todos</option>
                    <option value="Ana Silva">Ana Silva</option>
                    <option value="Carlos Vendas">Carlos Vendas</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[#002333] mb-2">
                    Prioridade
                  </label>
                  <select
                    value={filters.priority}
                    onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
                    className="w-full px-3 py-2.5 border border-[#B4BEC9] rounded-xl bg-[#FFFFFF] text-[#002333] focus:ring-2 focus:ring-[#159A9C] focus:border-transparent transition"
                  >
                    <option value="all">Todas</option>
                    <option value="high">Alta</option>
                    <option value="medium">Média</option>
                    <option value="low">Baixa</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[#002333] mb-2">
                    Período
                  </label>
                  <select
                    value={filters.dateRange}
                    onChange={(e) => setFilters({ ...filters, dateRange: e.target.value })}
                    className="w-full px-3 py-2.5 border border-[#B4BEC9] rounded-xl bg-[#FFFFFF] text-[#002333] focus:ring-2 focus:ring-[#159A9C] focus:border-transparent transition"
                  >
                    <option value="all">Todos</option>
                    <option value="this_month">Este mês</option>
                    <option value="next_month">Próximo mês</option>
                    <option value="this_quarter">Este trimestre</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Pipeline Kanban */}
          <div className="bg-[#FFFFFF] rounded-3xl p-6 shadow-sm border border-[#DEEFE7]">
            <DragDropContext onDragEnd={onDragEnd}>
              <div className="flex gap-6 overflow-x-auto pb-2">
                {pipelineData?.stageOrder?.map(stageId => (
                  <StageColumn
                    key={stageId}
                    stage={organizedStages[stageId]}
                    opportunities={organizedStages[stageId]?.opportunities || []}
                  />
                ))}
              </div>
            </DragDropContext>
          </div>

          {/* Modal de Detalhes */}
          {showModal && selectedOpportunity && (
            <OpportunityModal
              opportunity={selectedOpportunity}
              onClose={() => {
                setShowModal(false);
                setSelectedOpportunity(null);
              }}
              onUpdate={(updatedOpportunity) => {
                // Invalidar queries para recarregar dados
                queryClient.invalidateQueries({ queryKey: ['pipeline'] });
                queryClient.invalidateQueries({ queryKey: ['metrics'] });
                setShowModal(false);
                setSelectedOpportunity(null);
                toast.success('Oportunidade atualizada com sucesso!');
              }}
            />
          )}

          {/* Modal de Criação de Oportunidade */}
          <ModalCriarOportunidade
            isOpen={showCreateModal}
            onClose={() => setShowCreateModal(false)}
            onSave={handleCreateOpportunity}
            isLoading={createOpportunityMutation.isLoading}
          />
        </div>
      </div>
    </div>
  );
};

export default FunilVendas;
