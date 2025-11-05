import React, { useState, useEffect } from 'react';
import {
  RefreshCw,
  Plus,
  Edit2,
  Trash2,
  Filter,
  Target,
  ChevronDown,
  ChevronUp,
  Users,
  Building2,
} from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import nucleoService, {
  Nucleo,
  CreateNucleoDto,
  TipoDistribuicao,
} from '../../../services/nucleoService';
import { departamentoService } from '../../../services/departamentoService';
import ModalGerenciarAgentesNucleo from '../../../components/atendimento/ModalGerenciarAgentesNucleo';
import { ModalGerenciarDepartamentos } from '../../../components/atendimento/ModalGerenciarDepartamentos';
import { ModalDepartamento } from '../../../components/atendimento/ModalDepartamento';

interface NucleoExpanded extends Nucleo {
  departamentos?: any[];
  atendentes?: any[];
}

const GestaoNucleosPage: React.FC = () => {
  const [nucleos, setNucleos] = useState<NucleoExpanded[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [editingNucleo, setEditingNucleo] = useState<Nucleo | null>(null);
  const [expandedNucleos, setExpandedNucleos] = useState<Set<string>>(new Set());

  // Modal de gerenciar agentes
  const [showAgentModal, setShowAgentModal] = useState(false);
  const [selectedNucleoForAgents, setSelectedNucleoForAgents] = useState<Nucleo | null>(null);

  // Modal de gerenciar departamentos
  const [showDeptModal, setShowDeptModal] = useState(false);
  const [selectedNucleoForDepts, setSelectedNucleoForDepts] = useState<Nucleo | null>(null);

  // Modal de criar/editar departamento individual
  const [showDeptFormModal, setShowDeptFormModal] = useState(false);
  const [editingDepartamento, setEditingDepartamento] = useState<any | null>(null);
  const [selectedNucleoForDeptForm, setSelectedNucleoForDeptForm] = useState<Nucleo | null>(null);

  // Filtros
  const [filtros, setFiltros] = useState({
    nome: '',
    ativo: undefined as boolean | undefined,
    tipoDistribuicao: undefined as TipoDistribuicao | undefined,
  });

  // Form state
  const [formData, setFormData] = useState<CreateNucleoDto>({
    nome: '',
    descricao: '',
    codigo: '',
    cor: '#3B82F6',
    icone: 'support',
    ativo: true,
    visivelNoBot: true,
    prioridade: 50,
    tipoDistribuicao: 'round_robin',
    slaRespostaMinutos: 15,
    slaResolucaoHoras: 24,
    capacidadeMaxima: 50,
    mensagemBoasVindas: '',
  });

  useEffect(() => {
    carregarNucleos();
  }, []);

  const carregarNucleos = async () => {
    try {
      setLoading(true);
      setError(null);
      const dados = await nucleoService.listar(filtros);
      const nucleosArray = Array.isArray(dados) ? dados : [];

      // Para cada núcleo, buscar departamentos
      const nucleosComDados = await Promise.all(
        nucleosArray.map(async (nucleo) => {
          try {
            const departamentos = await departamentoService.listarPorNucleo(nucleo.id);
            return {
              ...nucleo,
              departamentos: departamentos || [],
              atendentes: nucleo.atendentesIds || [],
            };
          } catch (err) {
            console.error(`Erro ao buscar departamentos do núcleo ${nucleo.id}:`, err);
            return {
              ...nucleo,
              departamentos: [],
              atendentes: nucleo.atendentesIds || [],
            };
          }
        })
      );

      setNucleos(nucleosComDados);
    } catch (err: unknown) {
      console.error('Erro ao carregar núcleos:', err);
      const responseMessage = (err as any)?.response?.data?.message;
      const normalizedMessage = Array.isArray(responseMessage)
        ? responseMessage.join('. ')
        : responseMessage;
      const fallbackMessage = err instanceof Error ? err.message : undefined;
      setError(normalizedMessage || fallbackMessage || 'Erro ao carregar núcleos');
      setNucleos([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleNucleoExpansao = (nucleoId: string) => {
    setExpandedNucleos(prev => {
      const newSet = new Set(prev);
      if (newSet.has(nucleoId)) {
        newSet.delete(nucleoId);
      } else {
        newSet.add(nucleoId);
      }
      return newSet;
    });
  };

  const handleOpenDialog = (nucleo?: Nucleo) => {
    if (nucleo) {
      setEditingNucleo(nucleo);
      setFormData({
        nome: nucleo.nome ?? '',
        descricao: nucleo.descricao ?? '',
        codigo: nucleo.codigo ?? '',
        cor: nucleo.cor || '#3B82F6',
        icone: nucleo.icone || 'support',
        ativo: nucleo.ativo ?? true,
        visivelNoBot: nucleo.visivelNoBot ?? true,
        prioridade: nucleo.prioridade ?? 50,
        tipoDistribuicao: nucleo.tipoDistribuicao ?? 'round_robin',
        slaRespostaMinutos: nucleo.slaRespostaMinutos ?? undefined,
        slaResolucaoHoras: nucleo.slaResolucaoHoras ?? undefined,
        capacidadeMaxima:
          nucleo.capacidadeMaxima ?? nucleo.capacidadeMaximaTickets ?? 50,
        mensagemBoasVindas: nucleo.mensagemBoasVindas ?? '',
      });
    } else {
      setEditingNucleo(null);
      setFormData({
        nome: '',
        descricao: '',
        codigo: '',
        cor: '#3B82F6',
        icone: 'support',
        ativo: true,
        visivelNoBot: true,
        prioridade: 50,
        tipoDistribuicao: 'round_robin',
        slaRespostaMinutos: 15,
        slaResolucaoHoras: 24,
        capacidadeMaxima: 50,
        mensagemBoasVindas: '',
      });
    }
    setShowDialog(true);
  };

  const handleSave = async () => {
    try {
      setError(null);
      if (editingNucleo) {
        await nucleoService.atualizar(editingNucleo.id, formData);
      } else {
        await nucleoService.criar(formData);
      }
      setShowDialog(false);
      setEditingNucleo(null);
      carregarNucleos();
    } catch (err: unknown) {
      console.error('Erro ao salvar núcleo:', err);
      const responseMessage = (err as any)?.response?.data?.message;
      const normalizedMessage = Array.isArray(responseMessage)
        ? responseMessage.join('. ')
        : responseMessage;
      const fallbackMessage = err instanceof Error ? err.message : undefined;
      setError(normalizedMessage || fallbackMessage || 'Erro ao salvar núcleo');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja deletar este núcleo?')) {
      return;
    }

    try {
      setError(null);
      await nucleoService.deletar(id);
      carregarNucleos();
    } catch (err: unknown) {
      console.error('Erro ao deletar núcleo:', err);
      const responseMessage = (err as any)?.response?.data?.message;
      const normalizedMessage = Array.isArray(responseMessage)
        ? responseMessage.join('. ')
        : responseMessage;
      const fallbackMessage = err instanceof Error ? err.message : undefined;
      setError(normalizedMessage || fallbackMessage || 'Erro ao deletar núcleo');
    }
  };

  const getTipoDistribuicaoLabel = (tipo: TipoDistribuicao | string) => {
    const labels: Record<TipoDistribuicao, string> = {
      round_robin: 'Round Robin',
      load_balancing: 'Balanceamento de carga',
      skill_based: 'Habilidades (Skill Based)',
      manual: 'Manual',
    };
    return labels[tipo as TipoDistribuicao] ?? tipo;
  };

  const getCapacidadeColor = (nucleo: Nucleo) => {
    const capacidade = nucleo.capacidadeMaxima ?? nucleo.capacidadeMaximaTickets ?? 50;
    const percentual = (nucleo.totalTicketsAbertos / capacidade) * 100;

    if (percentual >= 100) return 'bg-red-100 text-red-800';
    if (percentual >= 80) return 'bg-yellow-100 text-yellow-800';
    return 'bg-green-100 text-green-800';
  };

  // ========================================================================
  // HANDLERS PARA DEPARTAMENTOS
  // ========================================================================

  const handleAdicionarDepartamento = (nucleo: Nucleo) => {
    setSelectedNucleoForDeptForm(nucleo);
    setEditingDepartamento(null);
    setShowDeptFormModal(true);
  };

  const handleEditarDepartamento = (nucleo: Nucleo, departamento: any) => {
    setSelectedNucleoForDeptForm(nucleo);
    setEditingDepartamento(departamento);
    setShowDeptFormModal(true);
  };

  const handleDeletarDepartamento = async (departamentoId: string, departamentoNome: string) => {
    if (!window.confirm(`Tem certeza que deseja deletar o departamento "${departamentoNome}"?`)) {
      return;
    }

    try {
      setError(null);
      await departamentoService.remover(departamentoId);
      carregarNucleos();
    } catch (err: unknown) {
      console.error('Erro ao deletar departamento:', err);
      const responseMessage = (err as any)?.response?.data?.message;
      const normalizedMessage = Array.isArray(responseMessage)
        ? responseMessage.join('. ')
        : responseMessage;
      const fallbackMessage = err instanceof Error ? err.message : undefined;
      setError(normalizedMessage || fallbackMessage || 'Erro ao deletar departamento');
    }
  };

  // ========================================================================
  // HANDLERS PARA ATENDENTES DIRETOS
  // ========================================================================

  const handleRemoverAtendente = async (nucleo: Nucleo, atendenteId: string) => {
    if (!window.confirm('Tem certeza que deseja remover este atendente do núcleo?')) {
      return;
    }

    try {
      setError(null);
      const atendentesAtualizados = (nucleo.atendentesIds || []).filter(id => id !== atendenteId);

      await nucleoService.atualizar(nucleo.id, {
        atendentesIds: atendentesAtualizados,
      });

      carregarNucleos();
    } catch (err: unknown) {
      console.error('Erro ao remover atendente:', err);
      const responseMessage = (err as any)?.response?.data?.message;
      const normalizedMessage = Array.isArray(responseMessage)
        ? responseMessage.join('. ')
        : responseMessage;
      const fallbackMessage = err instanceof Error ? err.message : undefined;
      setError(normalizedMessage || fallbackMessage || 'Erro ao remover atendente');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <Target className="h-10 w-10 text-blue-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Gestão de Núcleos</h1>
              <p className="text-gray-600 mt-1">
                Gerencie os núcleos de atendimento e opções do menu do WhatsApp
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={carregarNucleos} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Atualizar
            </Button>
            <Button onClick={() => handleOpenDialog()} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Novo Núcleo
            </Button>
          </div>
        </div>

        {/* Card Informativo */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-blue-900 mb-1">
                  📱 Como funciona o menu do WhatsApp?
                </h3>
                <p className="text-sm text-blue-800">
                  Os núcleos com <strong>"Visível no Bot"</strong> ativado aparecem automaticamente como opções no menu inicial do WhatsApp.
                  A ordem é definida pelo campo <strong>"Prioridade"</strong> (menor número = aparece primeiro).
                  O bot adiciona automaticamente a opção "❌ Digite SAIR para cancelar".
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Filtros */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Buscar por nome
                </label>
                <input
                  type="text"
                  value={filtros.nome}
                  onChange={(e) => setFiltros({ ...filtros, nome: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Digite o nome..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={filtros.ativo === undefined ? 'todos' : filtros.ativo ? 'ativo' : 'inativo'}
                  onChange={(e) => {
                    const value = e.target.value;
                    setFiltros({
                      ...filtros,
                      ativo: value === 'todos' ? undefined : value === 'ativo',
                    });
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="todos">Todos</option>
                  <option value="ativo">Ativos</option>
                  <option value="inativo">Inativos</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de Distribuição
                </label>
                <select
                  value={filtros.tipoDistribuicao || ''}
                  onChange={(e) => {
                    const value = e.target.value as TipoDistribuicao | '';
                    setFiltros({
                      ...filtros,
                      tipoDistribuicao: value === '' ? undefined : value,
                    });
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Todos</option>
                  <option value="round_robin">Round Robin</option>
                  <option value="load_balancing">Balanceamento de carga</option>
                  <option value="skill_based">Skill Based</option>
                  <option value="manual">Manual</option>
                </select>
              </div>

              <div className="flex items-end">
                <Button onClick={carregarNucleos} className="w-full bg-blue-600 hover:bg-blue-700">
                  Aplicar Filtros
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Alertas */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md flex justify-between items-center">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="text-red-600 hover:text-red-800">
              ×
            </button>
          </div>
        )}

        {/* Grid de Cards */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        ) : nucleos.length === 0 ? (
          <Card>
            <CardContent className="py-20 text-center text-gray-500">
              <Target className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p className="text-lg font-medium">Nenhum núcleo encontrado</p>
              <p className="text-sm mt-2">Crie um novo núcleo para começar</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {nucleos.map((nucleo) => {
              const isExpanded = expandedNucleos.has(nucleo.id);
              const numDepartamentos = nucleo.departamentos?.length || 0;
              const numAtendentes = nucleo.atendentes?.length || 0;
              const temDepartamentos = numDepartamentos > 0;
              const temAtendentes = numAtendentes > 0;

              return (
                <Card key={nucleo.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-0">
                    {/* Header do Card */}
                    <div className="p-6 border-b border-gray-200">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4 flex-1">
                          {/* Ícone do Núcleo */}
                          <div
                            className="w-14 h-14 rounded-lg flex items-center justify-center text-white font-bold text-xl flex-shrink-0"
                            style={{ backgroundColor: nucleo.cor || '#3B82F6' }}
                          >
                            {nucleo.icone?.charAt(0).toUpperCase() || 'N'}
                          </div>

                          {/* Informações do Núcleo */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="text-lg font-semibold text-gray-900 truncate">
                                {nucleo.nome}
                              </h3>
                              {nucleo.visivelNoBot && (
                                <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-800 border border-green-200">
                                  <svg className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  Visível WhatsApp
                                </span>
                              )}
                            </div>

                            {nucleo.descricao && (
                              <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                                {nucleo.descricao}
                              </p>
                            )}

                            {/* Badges de Informação */}
                            <div className="flex items-center gap-3 flex-wrap mt-3">
                              <span className="inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
                                {nucleo.codigo}
                              </span>
                              <span
                                className={`inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-full ${nucleo.ativo
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-gray-100 text-gray-600'
                                  }`}
                              >
                                {nucleo.ativo ? '✓ Ativo' : '✗ Inativo'}
                              </span>
                              <span className="inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                                Prioridade: {nucleo.prioridade}
                              </span>
                            </div>

                            {/* Contadores de Departamentos e Atendentes */}
                            <div className="flex items-center gap-4 mt-3">
                              <div className="flex items-center gap-1.5 text-sm">
                                <Building2 className="h-4 w-4 text-gray-400" />
                                <span className="font-medium text-gray-700">{numDepartamentos}</span>
                                <span className="text-gray-500">
                                  {numDepartamentos === 1 ? 'departamento' : 'departamentos'}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5 text-sm">
                                <Users className="h-4 w-4 text-gray-400" />
                                <span className="font-medium text-gray-700">{numAtendentes}</span>
                                <span className="text-gray-500">
                                  {numAtendentes === 1 ? 'atendente' : 'atendentes'}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Ações do Card */}
                        <div className="flex items-center gap-2 ml-4">
                          <button
                            onClick={() => handleOpenDialog(nucleo)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Editar núcleo"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(nucleo.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Deletar núcleo"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => toggleNucleoExpansao(nucleo.id)}
                            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            title={isExpanded ? 'Recolher' : 'Expandir'}
                          >
                            {isExpanded ? (
                              <ChevronUp className="h-5 w-5" />
                            ) : (
                              <ChevronDown className="h-5 w-5" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Área Expansível - Departamentos e Atendentes */}
                    {isExpanded && (
                      <div className="p-6 bg-gray-50 border-t border-gray-200">
                        {/* Seção de Departamentos */}
                        {temDepartamentos ? (
                          <div className="mb-6">
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                                <Building2 className="h-4 w-4 text-gray-600" />
                                Departamentos ({numDepartamentos})
                              </h4>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleAdicionarDepartamento(nucleo)}
                                  className="text-xs text-green-600 hover:text-green-800 font-medium"
                                  title="Criar novo departamento"
                                >
                                  + Novo
                                </button>
                                <button
                                  onClick={() => {
                                    setSelectedNucleoForDepts(nucleo);
                                    setShowDeptModal(true);
                                  }}
                                  className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                                  title="Vincular departamentos existentes"
                                >
                                  Vincular Existentes
                                </button>
                              </div>
                            </div>
                            <div className="space-y-2">
                              {nucleo.departamentos?.map((dept) => (
                                <div
                                  key={dept.id}
                                  className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 hover:border-blue-300 transition-colors"
                                >
                                  <div className="flex items-center gap-3">
                                    <div
                                      className="w-8 h-8 rounded flex items-center justify-center text-white text-xs font-semibold"
                                      style={{ backgroundColor: dept.cor || '#6366F1' }}
                                    >
                                      {dept.nome?.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                      <p className="text-sm font-medium text-gray-900">{dept.nome}</p>
                                      {dept.descricao && (
                                        <p className="text-xs text-gray-500 line-clamp-1">{dept.descricao}</p>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span
                                      className={`px-2 py-0.5 text-xs font-medium rounded ${dept.ativo
                                        ? 'bg-green-100 text-green-700'
                                        : 'bg-gray-100 text-gray-600'
                                        }`}
                                    >
                                      {dept.ativo ? 'Ativo' : 'Inativo'}
                                    </span>
                                    <button
                                      onClick={() => handleEditarDepartamento(nucleo, dept)}
                                      className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                                      title="Editar departamento"
                                    >
                                      <Edit2 className="h-3.5 w-3.5" />
                                    </button>
                                    <button
                                      onClick={() => handleDeletarDepartamento(dept.id, dept.nome)}
                                      className="p-1 text-red-600 hover:bg-red-50 rounded"
                                      title="Deletar departamento"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className="mb-6 p-4 bg-white rounded-lg border-2 border-dashed border-gray-300">
                            <div className="text-center">
                              <Building2 className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                              <p className="text-sm font-medium text-gray-700 mb-1">
                                Nenhum departamento cadastrado
                              </p>
                              <p className="text-xs text-gray-500 mb-3">
                                Atendentes serão atribuídos diretamente ao núcleo
                              </p>
                              <div className="flex gap-2 justify-center">
                                <button
                                  onClick={() => handleAdicionarDepartamento(nucleo)}
                                  className="text-xs text-green-600 hover:text-green-800 font-medium px-3 py-1 border border-green-300 rounded hover:bg-green-50"
                                >
                                  + Novo Departamento
                                </button>
                                <button
                                  onClick={() => {
                                    setSelectedNucleoForDepts(nucleo);
                                    setShowDeptModal(true);
                                  }}
                                  className="text-xs text-blue-600 hover:text-blue-800 font-medium px-3 py-1 border border-blue-300 rounded hover:bg-blue-50"
                                >
                                  Vincular Existentes
                                </button>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Seção de Atendentes Diretos */}
                        {!temDepartamentos && (
                          <div>
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                                <Users className="h-4 w-4 text-gray-600" />
                                Atendentes Diretos ({numAtendentes})
                              </h4>
                              <button
                                onClick={() => {
                                  setSelectedNucleoForAgents(nucleo);
                                  setShowAgentModal(true);
                                }}
                                className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                              >
                                + Gerenciar Atendentes
                              </button>
                            </div>
                            {temAtendentes ? (
                              <div className="space-y-2">
                                {nucleo.atendentes?.slice(0, 3).map((atendenteId) => (
                                  <div
                                    key={atendenteId}
                                    className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200"
                                  >
                                    <div className="flex items-center gap-3">
                                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs font-semibold">
                                        A
                                      </div>
                                      <div>
                                        <p className="text-sm font-medium text-gray-900">
                                          Atendente {atendenteId.slice(0, 8)}
                                        </p>
                                        <p className="text-xs text-gray-500">ID: {atendenteId}</p>
                                      </div>
                                    </div>
                                    <button
                                      onClick={() => handleRemoverAtendente(nucleo, atendenteId)}
                                      className="p-1 text-red-600 hover:bg-red-50 rounded"
                                      title="Remover atendente"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                  </div>
                                ))}
                                {numAtendentes > 3 && (
                                  <p className="text-xs text-gray-500 text-center py-2">
                                    + {numAtendentes - 3} atendentes adicionais
                                  </p>
                                )}
                              </div>
                            ) : (
                              <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                                <p className="text-xs text-yellow-800">
                                  ⚠️ <strong>Atenção:</strong> Este núcleo não tem departamentos nem atendentes.
                                  Tickets criados ficarão na fila manual.
                                </p>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Link para Gestão Completa */}
                        {temDepartamentos && (
                          <div className="mt-4 pt-4 border-t border-gray-200">
                            <button className="w-full text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center justify-center gap-2">
                              <Building2 className="h-4 w-4" />
                              Gerenciar Departamentos Completo
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Dialog de Criação/Edição */}
        {showDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-2xl font-bold text-gray-900">
                  {editingNucleo ? 'Editar Núcleo' : 'Novo Núcleo'}
                </h2>
              </div>

              <div className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nome *
                    </label>
                    <input
                      type="text"
                      value={formData.nome}
                      onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Código *
                    </label>
                    <input
                      type="text"
                      value={formData.codigo}
                      onChange={(e) =>
                        setFormData({ ...formData, codigo: e.target.value.toUpperCase() })
                      }
                      disabled={!!editingNucleo}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descrição
                  </label>
                  <textarea
                    value={formData.descricao}
                    onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tipo de Distribuição *
                    </label>
                    <select
                      value={formData.tipoDistribuicao}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          tipoDistribuicao: e.target.value as TipoDistribuicao,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="round_robin">Round Robin</option>
                      <option value="load_balancing">Balanceamento de carga</option>
                      <option value="skill_based">Skill Based</option>
                      <option value="manual">Manual</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Prioridade
                      <span className="ml-1 text-xs text-gray-500">(ordem no menu WhatsApp)</span>
                    </label>
                    <input
                      type="number"
                      value={formData.prioridade ?? ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          prioridade:
                            e.target.value === '' ? undefined : Number(e.target.value),
                        })
                      }
                      placeholder="Ex: 1 (primeiro), 2 (segundo)..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Menor número = aparece primeiro no menu
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      SLA Resposta (min)
                    </label>
                    <input
                      type="number"
                      value={formData.slaRespostaMinutos ?? ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          slaRespostaMinutos:
                            e.target.value === '' ? undefined : Number(e.target.value),
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      SLA Resolução (h)
                    </label>
                    <input
                      type="number"
                      value={formData.slaResolucaoHoras ?? ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          slaResolucaoHoras:
                            e.target.value === '' ? undefined : Number(e.target.value),
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Capacidade Máxima
                    </label>
                    <input
                      type="number"
                      value={formData.capacidadeMaxima ?? ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          capacidadeMaxima:
                            e.target.value === '' ? undefined : Number(e.target.value),
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Cor
                    </label>
                    <input
                      type="color"
                      value={formData.cor}
                      onChange={(e) => setFormData({ ...formData, cor: e.target.value })}
                      className="w-full h-10 px-1 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Ícone
                    </label>
                    <input
                      type="text"
                      value={formData.icone}
                      onChange={(e) => setFormData({ ...formData, icone: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mensagem de Boas-Vindas (Transferência)
                  </label>
                  <textarea
                    value={formData.mensagemBoasVindas}
                    onChange={(e) =>
                      setFormData({ ...formData, mensagemBoasVindas: e.target.value })
                    }
                    rows={3}
                    placeholder="Ex: 🛠️ Você foi direcionado para o Suporte Técnico. Um especialista irá te atender em breve!"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Mensagem enviada automaticamente quando o cliente é transferido para este núcleo
                  </p>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.ativo}
                    onChange={(e) => setFormData({ ...formData, ativo: e.target.checked })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 block text-sm text-gray-900">
                    Núcleo Ativo
                  </label>
                </div>

                <div className="flex items-start p-4 bg-green-50 border border-green-200 rounded-lg">
                  <input
                    type="checkbox"
                    checked={formData.visivelNoBot ?? true}
                    onChange={(e) => setFormData({ ...formData, visivelNoBot: e.target.checked })}
                    className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded mt-0.5"
                  />
                  <div className="ml-3">
                    <label className="block text-sm font-medium text-gray-900">
                      📱 Visível no Menu do WhatsApp
                    </label>
                    <p className="text-xs text-gray-600 mt-1">
                      Quando ativado, este núcleo aparece como opção no menu inicial que o bot envia aos clientes no WhatsApp.
                      Use o campo "Prioridade" para definir a ordem (menor = aparece primeiro).
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-gray-200 flex justify-end gap-2">
                <Button onClick={() => setShowDialog(false)} variant="outline">
                  Cancelar
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={!formData.nome || !formData.codigo}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {editingNucleo ? 'Salvar' : 'Criar'}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Gerenciar Agentes */}
        {selectedNucleoForAgents && (
          <ModalGerenciarAgentesNucleo
            isOpen={showAgentModal}
            onClose={() => {
              setShowAgentModal(false);
              setSelectedNucleoForAgents(null);
            }}
            nucleo={selectedNucleoForAgents}
            onSuccess={() => {
              carregarNucleos(); // Recarregar lista após salvar
            }}
          />
        )}

        {/* Modal de Gerenciar Departamentos */}
        {selectedNucleoForDepts && (
          <ModalGerenciarDepartamentos
            isOpen={showDeptModal}
            onClose={() => {
              setShowDeptModal(false);
              setSelectedNucleoForDepts(null);
            }}
            nucleo={selectedNucleoForDepts}
            onSuccess={() => {
              carregarNucleos(); // Recarregar lista após salvar
            }}
          />
        )}

        {/* Modal de Criar/Editar Departamento */}
        {selectedNucleoForDeptForm && (
          <ModalDepartamento
            isOpen={showDeptFormModal}
            onClose={() => {
              setShowDeptFormModal(false);
              setSelectedNucleoForDeptForm(null);
              setEditingDepartamento(null);
            }}
            nucleoId={selectedNucleoForDeptForm.id}
            nucleoNome={selectedNucleoForDeptForm.nome}
            departamento={editingDepartamento}
            onSuccess={() => {
              carregarNucleos(); // Recarregar lista após salvar
            }}
          />
        )}
      </div>
    </div>
  );
};

export default GestaoNucleosPage;
