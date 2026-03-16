import React, { useState, useEffect, useMemo } from 'react';
import { departamentoService } from '../../../services/departamentoService';
import {
  Departamento,
  FilterDepartamentoDto,
  TIPOS_DISTRIBUICAO,
} from '../../../types/departamentoTypes';
import ModalCadastroDepartamento from '../../../components/modals/ModalCadastroDepartamento';
import { useNucleos } from '../../../hooks/useNucleos';
import {
  Plus,
  Search,
  Edit3,
  Trash2,
  Briefcase,
  Filter,
  Users,
  Eye,
  Settings,
  Activity,
  Clock,
  Target,
  Building2,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { BackToNucleus } from '../../../components/navigation/BackToNucleus';
import { useGlobalConfirmation } from '../../../contexts/GlobalConfirmationContext';
import { toastService } from '../../../services/toastService';
import { SectionCard } from '../../../components/layout-v2';

// Tipos locais
interface DashboardCards {
  totalDepartamentos: number;
  departamentosAtivos: number;
  totalAtendentes: number;
  departamentosInativos: number;
}

function DepartamentosPage() {
  const { confirm } = useGlobalConfirmation();
  const [departamentos, setDepartamentos] = useState<Departamento[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [modalCadastroAberto, setModalCadastroAberto] = useState(false);
  const [departamentoEdicao, setDepartamentoEdicao] = useState<Departamento | null>(null);
  const [busca, setBusca] = useState('');
  const [filtroNucleo, setFiltroNucleo] = useState('todos');
  const [filtroAtivo, setFiltroAtivo] = useState<boolean | undefined>(undefined);
  const [departamentosSelecionados, setDepartamentosSelecionados] = useState<string[]>([]);
  const [dashboardCards, setDashboardCards] = useState<DashboardCards>({
    totalDepartamentos: 0,
    departamentosAtivos: 0,
    totalAtendentes: 0,
    departamentosInativos: 0,
  });

  // Hook para carregar núcleos da API (apenas ativos, com opção "Todos")
  const {
    nucleos: nucleosDisponiveisRaw,
    loading: loadingNucleos,
    error: erroNucleos,
    recarregar: recarregarNucleos,
  } = useNucleos({
    apenasAtivos: true,
    incluirTodos: true,
  });

  const nucleosDisponiveis = useMemo(
    () => (Array.isArray(nucleosDisponiveisRaw) ? nucleosDisponiveisRaw : []),
    [nucleosDisponiveisRaw],
  );

  const nucleosFiltrados = useMemo(
    () => nucleosDisponiveis.filter((nucleo) => nucleo?.id !== 'todos'),
    [nucleosDisponiveis],
  );

  useEffect(() => {
    carregarDepartamentos();
  }, []);

  useEffect(() => {
    carregarDepartamentos();
  }, [busca, filtroNucleo, filtroAtivo]);

  const carregarDepartamentos = async () => {
    setCarregando(true);
    try {
      const filtros: FilterDepartamentoDto = {
        busca: busca || undefined,
        nucleoId: filtroNucleo !== 'todos' ? filtroNucleo : undefined,
        ativo: filtroAtivo,
      };
      const dados = await departamentoService.listar(filtros);
      setDepartamentos(dados);
      calcularDashboard(dados);
    } catch (error) {
      console.error('Erro ao carregar departamentos:', error);
      toastService.error('Erro ao carregar departamentos');
    } finally {
      setCarregando(false);
    }
  };

  const calcularDashboard = (departamentos: Departamento[]) => {
    const ativos = departamentos.filter((d) => d.ativo).length;
    const inativos = departamentos.filter((d) => !d.ativo).length;
    const totalAtendentes = departamentos.reduce(
      (acc, d) => acc + (d.atendentesIds?.length || 0),
      0,
    );

    setDashboardCards({
      totalDepartamentos: departamentos.length,
      departamentosAtivos: ativos,
      totalAtendentes,
      departamentosInativos: inativos,
    });
  };

  const abrirModalNovo = () => {
    setDepartamentoEdicao(null);
    setModalCadastroAberto(true);
  };

  const abrirModalEdicao = (departamento: Departamento) => {
    setDepartamentoEdicao(departamento);
    setModalCadastroAberto(true);
  };

  const fecharModalCadastro = () => {
    setModalCadastroAberto(false);
    setDepartamentoEdicao(null);
  };

  const handleSalvarDepartamento = () => {
    carregarDepartamentos();
    toastService.success('Departamento salvo com sucesso!');
  };

  const excluirDepartamento = async (id: string) => {
    if (!(await confirm('Tem certeza que deseja excluir este departamento?'))) {
      return;
    }

    try {
      await departamentoService.remover(id);
      carregarDepartamentos();
      toastService.success('Departamento excluído com sucesso!');
    } catch (error) {
      console.error('Erro ao excluir departamento:', error);
      toastService.error('Erro ao excluir departamento');
    }
  };

  const alterarStatusDepartamento = async (id: string, ativo: boolean) => {
    try {
      await departamentoService.alterarStatus(id, ativo);
      carregarDepartamentos();
      toastService.success(`Departamento ${ativo ? 'ativado' : 'desativado'} com sucesso!`);
    } catch (error) {
      console.error('Erro ao alterar status:', error);
      toastService.error('Erro ao alterar status do departamento');
    }
  };

  const toggleSelecionarDepartamento = (id: string) => {
    setDepartamentosSelecionados((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const selecionarTodos = () => {
    setDepartamentosSelecionados(departamentos.map((d) => d.id));
  };

  const deselecionarTodos = () => {
    setDepartamentosSelecionados([]);
  };

  const handleSearch = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      carregarDepartamentos();
    }
  };

  const getTipoDistribuicaoLabel = (tipo: string) => {
    const found = TIPOS_DISTRIBUICAO.find((t) => t.value === tipo);
    return found?.label || tipo;
  };

  const departamentosFiltrados = departamentos;
  const mostrarAcoesMassa = departamentosSelecionados.length > 0;

  return (
    <div className="space-y-4 pt-1 sm:pt-2">
      {/* Header */}
      <div className="px-2 sm:px-0">
        <SectionCard className="px-4 py-3">
          <BackToNucleus nucleusName="Configurações" nucleusPath="/nuclei/configuracoes" />
        </SectionCard>
      </div>

      <div className="px-2 sm:px-0">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <SectionCard className="mb-6">
            <div className="px-6 py-6">
              <div className="flex flex-col sm:flex-row justify-between items-start">
                <div>
                  <h1 className="text-3xl font-bold text-[#002333] flex items-center">
                    <Building2 className="h-8 w-8 mr-3 text-[#159A9C]" />
                    Departamentos
                    {carregando && (
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#159A9C] ml-3"></div>
                    )}
                  </h1>
                  <p className="mt-2 text-[#B4BEC9]">
                    {carregando
                      ? 'Carregando departamentos...'
                      : `Gerencie seus ${dashboardCards.totalDepartamentos} departamentos por núcleo`}
                  </p>
                </div>
                <div className="mt-4 sm:mt-0 flex items-center gap-3">
                  <button
                    onClick={abrirModalNovo}
                    className="bg-[#159A9C] hover:bg-[#0F7B7D] text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm text-sm font-medium"
                  >
                    <Plus className="w-4 h-4" />
                    Novo Departamento
                  </button>
                </div>
              </div>
            </div>
          </SectionCard>

          {/* Dashboard Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <div className="bg-white rounded-xl shadow-sm border border-[#DEEFE7] p-6 hover:shadow-lg transition-shadow duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#002333]/60">
                    Total
                  </p>
                  <p className="text-3xl font-bold text-[#002333] mt-2">
                    {dashboardCards.totalDepartamentos}
                  </p>
                  <p className="text-sm text-[#002333]/70 mt-3">📊 Departamentos</p>
                </div>
                <div className="h-12 w-12 rounded-2xl bg-[#159A9C]/10 flex items-center justify-center shadow-sm">
                  <Building2 className="w-6 h-6 text-[#159A9C]" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-[#DEEFE7] p-6 hover:shadow-lg transition-shadow duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#002333]/60">
                    Ativos
                  </p>
                  <p className="text-3xl font-bold text-[#002333] mt-2">
                    {dashboardCards.departamentosAtivos}
                  </p>
                  <p className="text-sm text-[#002333]/70 mt-3">✅ Em operação</p>
                </div>
                <div className="h-12 w-12 rounded-2xl bg-green-500/10 flex items-center justify-center shadow-sm">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-[#DEEFE7] p-6 hover:shadow-lg transition-shadow duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#002333]/60">
                    Atendentes
                  </p>
                  <p className="text-3xl font-bold text-[#002333] mt-2">
                    {dashboardCards.totalAtendentes}
                  </p>
                  <p className="text-sm text-[#002333]/70 mt-3">👥 Total alocados</p>
                </div>
                <div className="h-12 w-12 rounded-2xl bg-[#159A9C]/10 flex items-center justify-center shadow-sm">
                  <Users className="w-6 h-6 text-[#159A9C]" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-[#DEEFE7] p-6 hover:shadow-lg transition-shadow duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#002333]/60">
                    Inativos
                  </p>
                  <p className="text-3xl font-bold text-[#002333] mt-2">
                    {dashboardCards.departamentosInativos}
                  </p>
                  <p className="text-sm text-[#002333]/70 mt-3">⏸️ Pausados</p>
                </div>
                <div className="h-12 w-12 rounded-2xl bg-gray-500/10 flex items-center justify-center shadow-sm">
                  <XCircle className="w-6 h-6 text-gray-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Filtros e Busca */}
          <SectionCard className="mb-6 p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Busca */}
              <div className="md:col-span-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Buscar por nome, código ou descrição..."
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                    onKeyDown={handleSearch}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent transition-all"
                  />
                </div>
              </div>

              {/* Filtro por Núcleo */}
              <div>
                <select
                  value={filtroNucleo}
                  onChange={(e) => setFiltroNucleo(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent transition-all"
                >
                  <option value="todos">
                    {loadingNucleos ? 'Carregando núcleos...' : 'Todos os Núcleos'}
                  </option>
                  {nucleosFiltrados.map((nucleo) => (
                    <option key={nucleo.id} value={nucleo.id}>
                      {nucleo.nome}
                    </option>
                  ))}
                </select>
                {erroNucleos && (
                  <p className="mt-2 text-sm text-red-600 flex items-center gap-2">
                    Não foi possível carregar os núcleos.
                    <button
                      type="button"
                      onClick={recarregarNucleos}
                      className="underline decoration-[#159A9C] text-[#159A9C] hover:text-[#0d7a7c]"
                    >
                      Tentar novamente
                    </button>
                  </p>
                )}
              </div>

              {/* Filtro por Status */}
              <div>
                <select
                  value={filtroAtivo === undefined ? 'todos' : filtroAtivo ? 'ativo' : 'inativo'}
                  onChange={(e) => {
                    const value = e.target.value;
                    setFiltroAtivo(value === 'todos' ? undefined : value === 'ativo');
                  }}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent transition-all"
                >
                  <option value="todos">Todos os Status</option>
                  <option value="ativo">Ativos</option>
                  <option value="inativo">Inativos</option>
                </select>
              </div>
            </div>

            {/* Ações em Massa */}
            {mostrarAcoesMassa && (
              <div className="mt-4 flex items-center justify-between bg-blue-50 px-4 py-3 rounded-lg border border-blue-200">
                <span className="text-sm font-medium text-blue-900">
                  {departamentosSelecionados.length} departamento(s) selecionado(s)
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={deselecionarTodos}
                    className="px-3 py-1.5 text-sm text-blue-700 hover:bg-blue-100 rounded-md transition-colors"
                  >
                    Desmarcar todos
                  </button>
                </div>
              </div>
            )}
          </SectionCard>

          {/* Lista de Departamentos */}
          <SectionCard>
            {carregando ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#159A9C]"></div>
              </div>
            ) : departamentosFiltrados.length === 0 ? (
              <div className="text-center py-12">
                <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Nenhum departamento encontrado
                </h3>
                <p className="text-gray-500 mb-4">
                  {busca
                    ? 'Tente ajustar os filtros de busca'
                    : 'Comece criando seu primeiro departamento'}
                </p>
                {!busca && (
                  <button
                    onClick={abrirModalNovo}
                    className="inline-flex items-center px-4 py-2 bg-[#159A9C] text-white rounded-lg hover:bg-[#0d7a7c] transition-colors"
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    Criar Departamento
                  </button>
                )}
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {departamentosFiltrados.map((departamento) => (
                  <div key={departamento.id} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between">
                      {/* Checkbox e Informações */}
                      <div className="flex items-start flex-1">
                        <input
                          type="checkbox"
                          checked={departamentosSelecionados.includes(departamento.id)}
                          onChange={() => toggleSelecionarDepartamento(departamento.id)}
                          className="mt-1 h-4 w-4 text-[#159A9C] focus:ring-[#159A9C] border-gray-300 rounded"
                        />
                        <div className="ml-4 flex-1">
                          {/* Linha 1: Nome e Status */}
                          <div className="flex items-center gap-3">
                            <div
                              className="w-12 h-12 rounded-lg flex items-center justify-center"
                              style={{ backgroundColor: `${departamento.cor}20` }}
                            >
                              <Briefcase className="w-6 h-6" style={{ color: departamento.cor }} />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <h3 className="text-lg font-semibold text-gray-900">
                                  {departamento.nome}
                                </h3>
                                {departamento.ativo ? (
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                    Ativo
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                    Inativo
                                  </span>
                                )}
                                {departamento.codigo && (
                                  <span className="text-xs text-gray-500 font-mono">
                                    {departamento.codigo}
                                  </span>
                                )}
                              </div>
                              {departamento.descricao && (
                                <p className="text-sm text-gray-600 mt-1">
                                  {departamento.descricao}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Linha 2: Métricas */}
                          <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-gray-600">
                            {departamento.nucleo && (
                              <div className="flex items-center gap-1">
                                <Target className="w-4 h-4" />
                                <span>{departamento.nucleo.nome}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-1">
                              <Users className="w-4 h-4" />
                              <span>{departamento.atendentesIds?.length || 0} atendentes</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Activity className="w-4 h-4" />
                              <span>{getTipoDistribuicaoLabel(departamento.tipoDistribuicao)}</span>
                            </div>
                            {departamento.slaRespostaMinutos && (
                              <div className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                <span>SLA: {departamento.slaRespostaMinutos}min</span>
                              </div>
                            )}
                            <div className="flex items-center gap-1">
                              <Target className="w-4 h-4" />
                              <span>Cap: {departamento.capacidadeMaximaTickets} tickets</span>
                            </div>
                            {/* Badge de Visibilidade no Bot */}
                            {departamento.visivelNoBot ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                                <Eye className="w-3 h-3 mr-1" />
                                Visível no Bot
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">
                                🚫 Oculto no Bot
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Ações */}
                      <div className="flex items-center gap-2 ml-4">
                        <button
                          onClick={() =>
                            alterarStatusDepartamento(departamento.id, !departamento.ativo)
                          }
                          className={`p-2 rounded-lg transition-colors ${
                            departamento.ativo
                              ? 'text-gray-600 hover:bg-gray-100'
                              : 'text-green-600 hover:bg-green-50'
                          }`}
                          title={departamento.ativo ? 'Desativar' : 'Ativar'}
                        >
                          {departamento.ativo ? (
                            <XCircle className="w-5 h-5" />
                          ) : (
                            <CheckCircle className="w-5 h-5" />
                          )}
                        </button>
                        <button
                          onClick={() => abrirModalEdicao(departamento)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <Edit3 className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => excluirDepartamento(departamento.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Excluir"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>
        </div>
      </div>

      {/* Modal de Cadastro/Edição */}
      {modalCadastroAberto && (
        <ModalCadastroDepartamento
          isOpen={modalCadastroAberto}
          onClose={fecharModalCadastro}
          onSuccess={handleSalvarDepartamento}
          departamentoEdicao={departamentoEdicao}
        />
      )}
    </div>
  );
}

export default DepartamentosPage;
