import React, { useState, useEffect } from 'react';
import {
  Building2,
  Plus,
  Edit2,
  Trash2,
  Users,
  Eye,
  EyeOff,
  RefreshCw,
  Filter,
  Search,
  X,
  Settings,
  Clock,
  TrendingUp,
  CheckCircle,
  AlertCircle,
  GripVertical,
} from 'lucide-react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { BackToNucleus } from '../components/navigation/BackToNucleus';
import { Button } from '../components/ui/button';
import { departamentoService } from '../services/departamentoService';
import nucleoService, { Nucleo } from '../services/nucleoService';
import AgentSelector from '../components/atendimento/AgentSelector';
import {
  Departamento,
  CreateDepartamentoDto,
  UpdateDepartamentoDto,
  CORES_DEPARTAMENTO,
  TIPOS_DISTRIBUICAO,
} from '../types/departamentoTypes';

// ========================================================================
// COMPONENTE PRINCIPAL
// ========================================================================

const GestaoDepartamentosPage: React.FC = () => {
  // ========================================================================
  // STATES
  // ========================================================================

  const [departamentos, setDepartamentos] = useState<Departamento[]>([]);
  const [nucleos, setNucleos] = useState<Nucleo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Modal/Dialog
  const [showDialog, setShowDialog] = useState(false);
  const [editingDepartamento, setEditingDepartamento] = useState<Departamento | null>(null);

  // Modal de atendentes
  const [showAgentModal, setShowAgentModal] = useState(false);
  const [selectedDeptForAgents, setSelectedDeptForAgents] = useState<Departamento | null>(null);

  // Filtros
  const [filtros, setFiltros] = useState({
    busca: '',
    nucleoId: '',
    ativo: undefined as boolean | undefined,
  });

  // Form data
  const [formData, setFormData] = useState<CreateDepartamentoDto>({
    nucleoId: '',
    nome: '',
    descricao: '',
    codigo: '',
    cor: CORES_DEPARTAMENTO[0],
    icone: 'briefcase',
    ativo: true,
    visivelNoBot: true,
    ordem: 0,
    tipoDistribuicao: 'round_robin',
    capacidadeMaximaTickets: 50,
    slaRespostaMinutos: 15,
    slaResolucaoHoras: 24,
  });

  // ========================================================================
  // EFFECTS
  // ========================================================================

  useEffect(() => {
    carregarDados();
  }, []);

  useEffect(() => {
    aplicarFiltros();
  }, [filtros]);

  // ========================================================================
  // FUNÇÕES DE CARREGAMENTO
  // ========================================================================

  const carregarDados = async () => {
    try {
      setLoading(true);
      setError(null);

      const [deptos, nucs] = await Promise.all([
        departamentoService.listar(),
        nucleoService.listar(),
      ]);

      console.log('🔍 Núcleos carregados:', nucs);
      setDepartamentos(deptos || []);
      setNucleos(nucs || []);
    } catch (err: unknown) {
      console.error('Erro ao carregar dados:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar dados');
      setDepartamentos([]);
      setNucleos([]);
    } finally {
      setLoading(false);
    }
  };

  const aplicarFiltros = async () => {
    if (!filtros.busca && !filtros.nucleoId && filtros.ativo === undefined) {
      return; // Sem filtros, não recarregar
    }

    try {
      setLoading(true);
      const dados = await departamentoService.listar({
        busca: filtros.busca || undefined,
        nucleoId: filtros.nucleoId || undefined,
        ativo: filtros.ativo,
      });
      setDepartamentos(dados || []);
    } catch (err: unknown) {
      console.error('Erro ao filtrar:', err);
      setError('Erro ao aplicar filtros');
    } finally {
      setLoading(false);
    }
  };

  // ========================================================================
  // FUNÇÕES DE AÇÃO
  // ========================================================================

  const handleNovoClick = () => {
    setEditingDepartamento(null);
    setFormData({
      nucleoId: nucleos[0]?.id || '',
      nome: '',
      descricao: '',
      codigo: '',
      cor: CORES_DEPARTAMENTO[0],
      icone: 'briefcase',
      ativo: true,
      visivelNoBot: true,
      ordem: departamentos.length,
      tipoDistribuicao: 'round_robin',
      capacidadeMaximaTickets: 50,
      slaRespostaMinutos: 15,
      slaResolucaoHoras: 24,
    });
    setShowDialog(true);
    setError(null);
    setSuccess(null);
  };

  const handleEditClick = (dept: Departamento) => {
    setEditingDepartamento(dept);
    setFormData({
      nucleoId: dept.nucleoId,
      nome: dept.nome,
      descricao: dept.descricao,
      codigo: dept.codigo,
      cor: dept.cor,
      icone: dept.icone,
      ativo: dept.ativo,
      visivelNoBot: dept.visivelNoBot,
      ordem: dept.ordem,
      tipoDistribuicao: dept.tipoDistribuicao,
      capacidadeMaximaTickets: dept.capacidadeMaximaTickets,
      slaRespostaMinutos: dept.slaRespostaMinutos,
      slaResolucaoHoras: dept.slaResolucaoHoras,
      atendentesIds: dept.atendentesIds,
    });
    setShowDialog(true);
    setError(null);
    setSuccess(null);
  };

  const handleSave = async () => {
    try {
      if (!formData.nome.trim()) {
        setError('Nome é obrigatório');
        return;
      }

      if (!formData.nucleoId) {
        setError('Núcleo é obrigatório');
        return;
      }

      // 🔍 DEBUG: Verificar o que está sendo enviado
      console.log('📤 Dados sendo enviados:', {
        ...formData,
        nucleoIdType: typeof formData.nucleoId,
        nucleoIdValue: formData.nucleoId,
      });

      setError(null);
      setSuccess(null);

      if (editingDepartamento) {
        await departamentoService.atualizar(editingDepartamento.id, formData);
        setSuccess('✅ Departamento atualizado com sucesso!');
      } else {
        await departamentoService.criar(formData);
        setSuccess('✅ Departamento criado com sucesso!');
      }

      await carregarDados();

      setTimeout(() => {
        setShowDialog(false);
        setSuccess(null);
      }, 1500);
    } catch (err: unknown) {
      console.error('Erro ao salvar:', err);
      const responseMessage = (err as any)?.response?.data?.message;
      const normalizedMessage = Array.isArray(responseMessage)
        ? responseMessage.join('. ')
        : responseMessage;
      const fallbackMessage = err instanceof Error ? err.message : undefined;
      setError(normalizedMessage || fallbackMessage || 'Erro ao salvar departamento');
    }
  };

  const handleDelete = async (dept: Departamento) => {
    if (!window.confirm(`Tem certeza que deseja excluir "${dept.nome}"?`)) {
      return;
    }

    try {
      await departamentoService.remover(dept.id);
      setSuccess(`✅ Departamento "${dept.nome}" removido!`);
      await carregarDados();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: unknown) {
      console.error('Erro ao excluir:', err);
      setError('Erro ao excluir departamento');
    }
  };

  const handleToggleStatus = async (dept: Departamento) => {
    try {
      await departamentoService.alterarStatus(dept.id, !dept.ativo);
      setSuccess(`✅ Status alterado: ${!dept.ativo ? 'Ativo' : 'Inativo'}`);
      await carregarDados();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: unknown) {
      console.error('Erro ao alterar status:', err);
      setError('Erro ao alterar status');
    }
  };

  const handleGerenciarAgentes = (dept: Departamento) => {
    setSelectedDeptForAgents(dept);
    setShowAgentModal(true);
  };

  const limparFiltros = () => {
    setFiltros({
      busca: '',
      nucleoId: '',
      ativo: undefined,
    });
    carregarDados();
  };

  // ========================================================================
  // DRAG AND DROP
  // ========================================================================

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) {
      return; // Dropado fora da lista
    }

    const sourceIndex = result.source.index;
    const destinationIndex = result.destination.index;

    if (sourceIndex === destinationIndex) {
      return; // Mesma posição
    }

    // Reordenar localmente (otimistic update)
    const newDepartamentos = Array.from(departamentosFiltrados);
    const [movedItem] = newDepartamentos.splice(sourceIndex, 1);
    newDepartamentos.splice(destinationIndex, 0, movedItem);

    // Atualizar ordem local imediatamente
    const updatedWithOrder = newDepartamentos.map((dept, index) => ({
      ...dept,
      ordem: index + 1,
    }));

    // Atualizar state otimisticamente
    setDepartamentos((prev) => {
      const filtered = prev.filter((d) => !departamentosFiltrados.find((df) => df.id === d.id));
      return [...filtered, ...updatedWithOrder].sort((a, b) => (a.ordem || 0) - (b.ordem || 0));
    });

    // Salvar no backend
    try {
      const nucleoId = departamentosFiltrados[0]?.nucleoId;
      if (!nucleoId) return;

      const ordenacao = updatedWithOrder.map((d, index) => ({
        id: d.id,
        ordem: index + 1,
      }));

      await departamentoService.reordenar(nucleoId, ordenacao);

      setSuccess('Ordem atualizada com sucesso!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: unknown) {
      console.error('Erro ao reordenar:', err);
      setError('Erro ao salvar nova ordem');
      // Reverter mudança em caso de erro
      await carregarDados();
    }
  };

  // ========================================================================
  // COMPUTED VALUES
  // ========================================================================

  const departamentosFiltrados = departamentos.filter((dept) => {
    if (filtros.busca && !dept.nome.toLowerCase().includes(filtros.busca.toLowerCase())) {
      return false;
    }
    if (filtros.nucleoId && dept.nucleoId !== filtros.nucleoId) {
      return false;
    }
    if (filtros.ativo !== undefined && dept.ativo !== filtros.ativo) {
      return false;
    }
    return true;
  });

  const totalAtivos = departamentos.filter((d) => d.ativo).length;
  const totalInativos = departamentos.filter((d) => !d.ativo).length;
  const totalAtendentes = departamentos.reduce((sum, d) => sum + (d.atendentesIds?.length || 0), 0);

  // ========================================================================
  // RENDER
  // ========================================================================

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header com BackToNucleus */}
      <div className="bg-white border-b px-6 py-4">
        <BackToNucleus nucleusName="Atendimento" nucleusPath="/nuclei/atendimento" />
      </div>

      {/* Container principal */}
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header da página */}
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-[#002333] flex items-center gap-3">
                  <Building2 className="h-8 w-8 text-[#9333EA]" />
                  Gestão de Departamentos
                </h1>
                <p className="text-gray-600 mt-2">
                  Organize seus atendentes em departamentos especializados para um atendimento mais eficiente
                </p>
              </div>
              <Button
                onClick={handleNovoClick}
                className="bg-[#9333EA] hover:bg-purple-700 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Novo Departamento
              </Button>
            </div>
          </div>

          {/* Dashboard Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            {/* Card 1 - Total */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total de Departamentos</p>
                  <p className="text-3xl font-bold text-gray-900">{departamentos.length}</p>
                </div>
                <div className="p-4 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl">
                  <Building2 className="h-8 w-8 text-blue-600" />
                </div>
              </div>
            </div>

            {/* Card 2 - Ativos */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Departamentos Ativos</p>
                  <p className="text-3xl font-bold text-green-600">{totalAtivos}</p>
                </div>
                <div className="p-4 bg-gradient-to-br from-green-100 to-green-200 rounded-xl">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
              </div>
            </div>

            {/* Card 3 - Inativos */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Departamentos Inativos</p>
                  <p className="text-3xl font-bold text-gray-600">{totalInativos}</p>
                </div>
                <div className="p-4 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl">
                  <AlertCircle className="h-8 w-8 text-gray-600" />
                </div>
              </div>
            </div>

            {/* Card 4 - Atendentes */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total de Atendentes</p>
                  <p className="text-3xl font-bold text-purple-600">{totalAtendentes}</p>
                </div>
                <div className="p-4 bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl">
                  <Users className="h-8 w-8 text-purple-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Mensagens de erro/sucesso */}
          {error && (
            <div className="mb-6 flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <p>{error}</p>
              <button onClick={() => setError(null)} className="ml-auto">
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {success && (
            <div className="mb-6 flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-lg text-green-800">
              <CheckCircle className="h-5 w-5 flex-shrink-0" />
              <p>{success}</p>
              <button onClick={() => setSuccess(null)} className="ml-auto">
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Info sobre drag-and-drop */}
          <div className="mb-6 flex items-center gap-3 p-4 bg-purple-50 border border-purple-200 rounded-lg">
            <GripVertical className="h-5 w-5 text-purple-600 flex-shrink-0" />
            <p className="text-sm text-purple-800">
              <strong>Dica:</strong> Arraste os cards usando o ícone{' '}
              <GripVertical className="inline h-4 w-4" /> para reordenar os departamentos.
              A nova ordem será salva automaticamente.
            </p>
          </div>

          {/* Barra de filtros */}
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Filter className="h-5 w-5 text-gray-600" />
              <h2 className="text-lg font-semibold text-gray-900">Filtros</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Busca */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Buscar</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    value={filtros.busca}
                    onChange={(e) => setFiltros({ ...filtros, busca: e.target.value })}
                    placeholder="Nome do departamento..."
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              {/* Núcleo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Núcleo</label>
                <select
                  value={filtros.nucleoId}
                  onChange={(e) => setFiltros({ ...filtros, nucleoId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">Todos os núcleos</option>
                  {nucleos.map((nucleo) => (
                    <option key={nucleo.id} value={nucleo.id}>
                      {nucleo.nome}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={filtros.ativo === undefined ? '' : filtros.ativo ? 'true' : 'false'}
                  onChange={(e) =>
                    setFiltros({
                      ...filtros,
                      ativo: e.target.value === '' ? undefined : e.target.value === 'true',
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">Todos</option>
                  <option value="true">Ativos</option>
                  <option value="false">Inativos</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-3 mt-4">
              <Button variant="outline" onClick={limparFiltros} className="text-sm">
                <X className="h-4 w-4 mr-1" />
                Limpar Filtros
              </Button>
              <Button
                onClick={() => carregarDados()}
                variant="outline"
                className="text-sm"
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                Atualizar
              </Button>
            </div>
          </div>

          {/* Lista/Grid de departamentos */}
          {loading ? (
            <div className="flex items-center justify-center py-16 bg-white rounded-lg shadow-sm border">
              <div className="flex items-center gap-2 text-gray-600">
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-purple-500 border-t-transparent"></div>
                <span>Carregando departamentos...</span>
              </div>
            </div>
          ) : departamentosFiltrados.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-lg shadow-sm border">
              <Building2 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Nenhum departamento encontrado
              </h3>
              <p className="text-gray-600 mb-6">
                {filtros.busca || filtros.nucleoId
                  ? 'Tente ajustar os filtros'
                  : 'Comece criando seu primeiro departamento'}
              </p>
              {!filtros.busca && !filtros.nucleoId && (
                <Button onClick={handleNovoClick} className="bg-purple-600 hover:bg-purple-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Primeiro Departamento
                </Button>
              )}
            </div>
          ) : (
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="departamentos-list">
                {(provided) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                  >
                    {departamentosFiltrados.map((dept, index) => {
                      const nucleo = nucleos.find((n) => n.id === dept.nucleoId);
                      const numAtendentes = dept.atendentesIds?.length || 0;

                      return (
                        <Draggable key={dept.id} draggableId={dept.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              className={`bg-white rounded-lg shadow-sm border hover:shadow-lg transition-shadow ${snapshot.isDragging ? 'shadow-2xl ring-2 ring-purple-500' : ''
                                }`}
                            >
                              {/* Header do card */}
                              <div className="p-6 border-b border-gray-100">
                                <div className="flex items-start justify-between mb-3">
                                  <div className="flex items-center gap-2">
                                    {/* Drag Handle */}
                                    <div
                                      {...provided.dragHandleProps}
                                      className="cursor-grab active:cursor-grabbing p-1 hover:bg-gray-100 rounded"
                                      title="Arrastar para reordenar"
                                    >
                                      <GripVertical className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <div
                                      className="w-12 h-12 rounded-lg flex items-center justify-center text-white text-xl font-bold"
                                      style={{ backgroundColor: dept.cor }}
                                    >
                                      {dept.nome.charAt(0).toUpperCase()}
                                    </div>
                                  </div>
                                  <div className="flex gap-1">
                                    <button
                                      onClick={() => handleToggleStatus(dept)}
                                      className="p-1.5 text-gray-600 hover:bg-gray-100 rounded transition-colors"
                                      title={dept.ativo ? 'Desativar' : 'Ativar'}
                                    >
                                      {dept.ativo ? (
                                        <Eye className="h-4 w-4" />
                                      ) : (
                                        <EyeOff className="h-4 w-4" />
                                      )}
                                    </button>
                                    <button
                                      onClick={() => handleEditClick(dept)}
                                      className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                      title="Editar"
                                    >
                                      <Edit2 className="h-4 w-4" />
                                    </button>
                                    <button
                                      onClick={() => handleDelete(dept)}
                                      className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                                      title="Excluir"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </button>
                                  </div>
                                </div>

                                <h3 className="text-lg font-semibold text-gray-900 mb-1">{dept.nome}</h3>
                                {dept.descricao && (
                                  <p className="text-sm text-gray-600 line-clamp-2 mb-3">{dept.descricao}</p>
                                )}

                                <div className="flex flex-wrap gap-2">
                                  {!dept.ativo && (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                      Inativo
                                    </span>
                                  )}
                                  {dept.visivelNoBot && (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                      Bot ✓
                                    </span>
                                  )}
                                  {dept.codigo && (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                      {dept.codigo}
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Info do card */}
                              <div className="p-6 space-y-3">
                                {/* Núcleo */}
                                {nucleo && (
                                  <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <Building2 className="h-4 w-4" />
                                    <span>Núcleo: {nucleo.nome}</span>
                                  </div>
                                )}

                                {/* Atendentes */}
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <Users className="h-4 w-4" />
                                    <span>{numAtendentes} atendente{numAtendentes !== 1 ? 's' : ''}</span>
                                  </div>
                                  <button
                                    onClick={() => handleGerenciarAgentes(dept)}
                                    className="text-xs text-purple-600 hover:text-purple-800 font-medium"
                                  >
                                    Gerenciar
                                  </button>
                                </div>

                                {/* SLA */}
                                {dept.slaRespostaMinutos && (
                                  <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <Clock className="h-4 w-4" />
                                    <span>SLA: {dept.slaRespostaMinutos}min / {dept.slaResolucaoHoras}h</span>
                                  </div>
                                )}

                                {/* Capacidade */}
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                  <TrendingUp className="h-4 w-4" />
                                  <span>Cap: {dept.capacidadeMaximaTickets} tickets</span>
                                </div>

                                {/* Tipo distribuição */}
                                <div className="pt-3 border-t border-gray-100">
                                  <p className="text-xs text-gray-500">
                                    {TIPOS_DISTRIBUICAO.find((t) => t.value === dept.tipoDistribuicao)
                                      ?.label || dept.tipoDistribuicao}
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      );
                    })}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          )}
        </div>
      </div>

      {/* Modal de Criar/Editar (simplificado - abre como dialog) */}
      {showDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowDialog(false)}></div>
          <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">
                  {editingDepartamento ? 'Editar Departamento' : 'Novo Departamento'}
                </h2>
                <button onClick={() => setShowDialog(false)}>
                  <X className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {/* Alertas de erro */}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">{error}</span>
                </div>
              )}

              {success && (
                <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">{success}</span>
                </div>
              )}

              {/* Núcleo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Núcleo * <span className="text-red-500 text-xs">(obrigatório)</span>
                </label>
                <select
                  value={formData.nucleoId}
                  onChange={(e) => setFormData({ ...formData, nucleoId: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${!formData.nucleoId
                      ? 'border-red-300 focus:ring-red-500 bg-red-50'
                      : 'border-gray-300 focus:ring-purple-500'
                    }`}
                >
                  <option value="">⚠️ Selecione um núcleo primeiro</option>
                  {nucleos.map((nucleo) => (
                    <option key={nucleo.id} value={nucleo.id}>
                      {nucleo.nome}
                    </option>
                  ))}
                </select>
                {!formData.nucleoId && (
                  <p className="mt-1 text-xs text-red-600">
                    ⚠️ Você precisa selecionar um núcleo para criar o departamento
                  </p>
                )}
              </div>

              {/* Nome */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
                <input
                  type="text"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  placeholder="Ex: Suporte Técnico"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {/* Descrição */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                <textarea
                  value={formData.descricao || ''}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                  placeholder="Breve descrição..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {/* Código e Cor */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Código</label>
                  <input
                    type="text"
                    value={formData.codigo || ''}
                    onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                    placeholder="Ex: SUP"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cor</label>
                  <div className="flex gap-2">
                    {CORES_DEPARTAMENTO.slice(0, 5).map((cor) => (
                      <button
                        key={cor}
                        onClick={() => setFormData({ ...formData, cor })}
                        className={`w-10 h-10 rounded-full border-2 transition-all ${formData.cor === cor ? 'border-gray-900 scale-110' : 'border-gray-300'
                          }`}
                        style={{ backgroundColor: cor }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* SLA e Capacidade */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    SLA Resposta (min)
                  </label>
                  <input
                    type="number"
                    value={formData.slaRespostaMinutos || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, slaRespostaMinutos: parseInt(e.target.value) })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    SLA Resolução (h)
                  </label>
                  <input
                    type="number"
                    value={formData.slaResolucaoHoras || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, slaResolucaoHoras: parseInt(e.target.value) })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cap. Máxima
                  </label>
                  <input
                    type="number"
                    value={formData.capacidadeMaximaTickets || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        capacidadeMaximaTickets: parseInt(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              {/* Checkboxes */}
              <div className="flex gap-6">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.ativo ?? true}
                    onChange={(e) => setFormData({ ...formData, ativo: e.target.checked })}
                    className="w-4 h-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                  />
                  <span className="text-sm text-gray-700">Ativo</span>
                </label>

                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.visivelNoBot ?? true}
                    onChange={(e) => setFormData({ ...formData, visivelNoBot: e.target.checked })}
                    className="w-4 h-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                  />
                  <span className="text-sm text-gray-700">Visível no Bot</span>
                </label>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowDialog(false)}>
                Cancelar
              </Button>
              <Button
                onClick={handleSave}
                disabled={!formData.nome.trim() || !formData.nucleoId}
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                {editingDepartamento ? 'Salvar' : 'Criar'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Gerenciar Atendentes */}
      {showAgentModal && selectedDeptForAgents && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowAgentModal(false)}
          ></div>
          <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">
                  Gerenciar Atendentes - {selectedDeptForAgents.nome}
                </h2>
                <button onClick={() => setShowAgentModal(false)}>
                  <X className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <AgentSelector
                selectedAgentIds={selectedDeptForAgents.atendentesIds || []}
                onSelectionChange={async (agentIds) => {
                  try {
                    await departamentoService.atualizar(selectedDeptForAgents.id, {
                      atendentesIds: agentIds,
                    });
                    setSuccess('✅ Atendentes atualizados!');
                    await carregarDados();
                    setTimeout(() => setSuccess(null), 3000);
                  } catch (err) {
                    console.error(err);
                    setError('Erro ao atualizar atendentes');
                  }
                }}
                multiSelect={true}
                onlyActive={true}
              />
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end">
              <Button onClick={() => setShowAgentModal(false)}>Fechar</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GestaoDepartamentosPage;
