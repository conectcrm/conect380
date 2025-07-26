import React, { useState } from 'react';
import { 
  DragDropContext, 
  Droppable, 
  Draggable 
} from 'react-beautiful-dnd';
import {
  Plus,
  Filter,
  Search,
  Calendar,
  DollarSign,
  Users,
  TrendingUp,
  Eye,
  Edit,
  Trash2,
  Phone,
  Mail,
  Clock,
  Target,
  BarChart3
} from 'lucide-react';
import ConectCRMLogoFinal from '../components/ui/ConectCRMLogoFinal';
import OpportunityModal from '../components/OpportunityModal';
import { ModalCriarOportunidade } from '../components/modals/ModalCriarOportunidade';
import { BackToNucleus } from '../components/navigation/BackToNucleus';
import { useQuery, useMutation, useQueryClient } from 'react-query';
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
  const { data: pipelineData, isLoading: loadingPipeline, error: pipelineError } = useQuery(
    'pipeline',
    () => opportunitiesService.getPipelineData(),
    { 
      refetchInterval: 30000,
      retry: 3,
      retryDelay: 1000
    }
  );

  const { data: metrics, isLoading: loadingMetrics, error: metricsError } = useQuery(
    'metrics',
    () => opportunitiesService.getMetrics(),
    { 
      refetchInterval: 30000,
      retry: 3,
      retryDelay: 1000
    }
  );

  // Mutation para atualizar estágio (drag and drop)
  const updateStageMutation = useMutation(
    ({ id, estagio }) => opportunitiesService.updateStage(id, estagio),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('pipeline');
        queryClient.invalidateQueries('metrics');
        toast.success('Oportunidade movida com sucesso!');
      },
      onError: (error) => {
        console.error('Erro ao mover oportunidade:', error);
        toast.error('Erro ao mover oportunidade. Tente novamente.');
        // Recarregar dados em caso de erro
        queryClient.invalidateQueries('pipeline');
      }
    }
  );

  // Mutation para criar nova oportunidade
  const createOpportunityMutation = useMutation(
    (oportunidadeData) => opportunitiesService.create(oportunidadeData),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('pipeline');
        queryClient.invalidateQueries('metrics');
        setShowCreateModal(false);
        toast.success('Oportunidade criada com sucesso!');
      },
      onError: (error) => {
        console.error('Erro ao criar oportunidade:', error);
        toast.error('Erro ao criar oportunidade. Tente novamente.');
      }
    }
  );

  // Handler para criar oportunidade
  const handleCreateOpportunity = (oportunidadeData) => {
    createOpportunityMutation.mutate(oportunidadeData);
  };

  // Loading states
  if (loadingPipeline || loadingMetrics) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#159A9C] mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando funil de vendas...</p>
        </div>
      </div>
    );
  }

  // Error states
  if (pipelineError || metricsError) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <p className="font-bold">Erro ao carregar dados</p>
            <p>Verifique se o backend está rodando e tente novamente.</p>
          </div>
          <button 
            onClick={() => {
              queryClient.invalidateQueries('pipeline');
              queryClient.invalidateQueries('metrics');
            }}
            className="bg-[#159A9C] text-white px-4 py-2 rounded-lg hover:bg-[#0F7B7D] transition-colors"
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
          className={`bg-white rounded-xl p-4 mb-3 shadow-sm border border-gray-200 hover:shadow-md transition-all cursor-pointer
            ${snapshot.isDragging ? 'rotate-2 shadow-lg' : ''}
            ${opportunity.prioridade === 'high' ? 'border-l-4 border-l-red-500' : ''}
            ${opportunity.prioridade === 'medium' ? 'border-l-4 border-l-yellow-500' : ''}
            ${opportunity.prioridade === 'low' ? 'border-l-4 border-l-green-500' : ''}
          `}
          onClick={() => {
            setSelectedOpportunity(opportunity);
            setShowModal(true);
          }}
        >
          <div className="flex justify-between items-start mb-2">
            <h4 className="font-semibold text-gray-900 text-sm leading-tight line-clamp-2">
              {opportunity.titulo}
            </h4>
            <div className="flex gap-1 ml-2">
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  // Editar oportunidade
                }}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <Edit className="w-3 h-3 text-gray-400" />
              </button>
            </div>
          </div>

          <div className="text-xs text-gray-600 mb-2">
            <div className="flex items-center gap-1 mb-1">
              <Users className="w-3 h-3" />
              {opportunity.cliente?.nome || opportunity.empresaContato || 'Cliente não informado'}
            </div>
            <div className="flex items-center gap-1">
              <DollarSign className="w-3 h-3" />
              {new Intl.NumberFormat('pt-BR', { 
                style: 'currency', 
                currency: 'BRL' 
              }).format(opportunity.valor || 0)}
            </div>
          </div>

          <div className="flex justify-between items-center text-xs">
            <span className="text-gray-500">
              {opportunity.probabilidade || 0}% prob.
            </span>
            <span className="text-gray-500">
              {opportunity.dataFechamentoEsperado 
                ? new Date(opportunity.dataFechamentoEsperado).toLocaleDateString('pt-BR')
                : 'Sem data'
              }
            </span>
          </div>

          <div className="flex items-center justify-between mt-2">
            <span className="text-xs bg-gray-100 px-2 py-1 rounded-full">
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
    <div className="flex-1 min-w-[280px] bg-gray-50 rounded-xl p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div 
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: stage?.color || '#6B7280' }}
          />
          <h3 className="font-semibold text-gray-900">{stage?.title || 'Estágio'}</h3>
          <span className="bg-gray-200 text-gray-700 text-xs px-2 py-1 rounded-full">
            {opportunities.length}
          </span>
        </div>
        <button 
          onClick={() => {
            // Adicionar nova oportunidade neste estágio
          }}
          className="p-1 hover:bg-white rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4 text-gray-500" />
        </button>
      </div>

      <Droppable droppableId={stage?.id || 'unknown'}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`min-h-[400px] transition-colors rounded-lg ${
              snapshot.isDraggingOver ? 'bg-[#159A9C] bg-opacity-10' : ''
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
      <div className="mt-4 pt-3 border-t border-gray-200">
        <div className="text-xs text-gray-600">
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
      <BackToNucleus 
        nucleusName="Vendas" 
        nucleusPath="/nuclei/vendas"
      />
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <ConectCRMLogoFinal variant="icon" size="sm" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Funil de Vendas</h1>
              <p className="text-gray-600">Gerencie suas oportunidades de vendas</p>
            </div>
          </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
              showFilters 
                ? 'bg-[#159A9C] text-white border-[#159A9C]' 
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
          >
            <Filter className="w-4 h-4" />
            Filtros
          </button>
          <button 
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 bg-[#159A9C] text-white px-4 py-2 rounded-lg hover:bg-[#0F7B7D] transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nova Oportunidade
          </button>
        </div>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Target className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total de Oportunidades</p>
              <p className="text-2xl font-bold text-gray-900">{metricsData.totalOportunidades}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <DollarSign className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Valor Total Pipeline</p>
              <p className="text-2xl font-bold text-gray-900">
                {new Intl.NumberFormat('pt-BR', { 
                  style: 'currency', 
                  currency: 'BRL',
                  notation: 'compact',
                  maximumFractionDigits: 1
                }).format(metricsData.valorTotalPipeline)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Vendas Fechadas</p>
              <p className="text-2xl font-bold text-gray-900">
                {new Intl.NumberFormat('pt-BR', { 
                  style: 'currency', 
                  currency: 'BRL',
                  notation: 'compact',
                  maximumFractionDigits: 1
                }).format(metricsData.valorGanho)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <BarChart3 className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Taxa de Conversão</p>
              <p className="text-2xl font-bold text-gray-900">{metricsData.taxaConversao}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      {showFilters && (
        <div className="bg-white rounded-xl p-4 mb-6 shadow-sm border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Buscar
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar oportunidades..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Vendedor
              </label>
              <select
                value={filters.assignedTo}
                onChange={(e) => setFilters({...filters, assignedTo: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent"
              >
                <option value="all">Todos</option>
                <option value="Ana Silva">Ana Silva</option>
                <option value="Carlos Vendas">Carlos Vendas</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Prioridade
              </label>
              <select
                value={filters.priority}
                onChange={(e) => setFilters({...filters, priority: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent"
              >
                <option value="all">Todas</option>
                <option value="high">Alta</option>
                <option value="medium">Média</option>
                <option value="low">Baixa</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Período
              </label>
              <select
                value={filters.dateRange}
                onChange={(e) => setFilters({...filters, dateRange: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent"
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
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="flex gap-4 overflow-x-auto pb-4">
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
            queryClient.invalidateQueries('pipeline');
            queryClient.invalidateQueries('metrics');
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
  );
};

export default FunilVendas;
