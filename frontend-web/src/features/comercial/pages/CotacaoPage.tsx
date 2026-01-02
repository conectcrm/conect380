import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { cotacaoService } from '../../../services/cotacaoService';
import { fornecedorService } from '../../../services/fornecedorService';
import {
  Cotacao,
  FiltroCotacao,
  StatusCotacao,
  PrioridadeCotacao,
} from '../../../types/cotacaoTypes';
import ModalCadastroCotacao from '../../../components/modals/ModalCadastroCotacao';
import ModalDetalhesCotacao from '../../../components/modals/ModalDetalhesCotacao';
import {
  Plus,
  Search,
  Edit3,
  Trash2,
  FileText,
  Filter,
  Download,
  MoreVertical,
  FileSpreadsheet,
  Eye,
  Check,
  X,
  CheckCircle,
  XCircle,
  Calendar,
  Activity,
  Settings,
  DollarSign,
  Clock,
  AlertCircle,
  User,
  Mail,
  Copy,
  Send,
} from 'lucide-react';
import { BackToNucleus } from '../../../components/navigation/BackToNucleus';

// Tipos locais
interface DashboardCards {
  totalCotacoes: number;
  cotacoesPendentes: number;
  cotacoesAprovadas: number;
  cotacoesReprovadas: number;
  cotacoesVencidas: number;
}

const useConfirmacaoInteligente = () => ({
  confirmar: (tipo: string, callback: () => void, options?: any) => {
    const confirmed = window.confirm(`Tem certeza que deseja realizar esta ação?`);
    if (confirmed) {
      callback();
    }
  },
});

const useValidacaoFinanceira = () => ({
  validar: () => true,
});

function CotacaoPage() {
  const navigate = useNavigate();
  const [cotacoes, setCotacoes] = useState<Cotacao[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [modalCadastroAberto, setModalCadastroAberto] = useState(false);
  const [modalDetalhesAberto, setModalDetalhesAberto] = useState(false);
  const [cotacaoEdicao, setCotacaoEdicao] = useState<Cotacao | null>(null);
  const [cotacaoDetalhes, setCotacaoDetalhes] = useState<Cotacao | null>(null);
  const [busca, setBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('todos');
  const [cotacoesSelecionadas, setCotacoesSelecionadas] = useState<string[]>([]);
  const [dashboardCards, setDashboardCards] = useState<DashboardCards>({
    totalCotacoes: 0,
    cotacoesPendentes: 0,
    cotacoesAprovadas: 0,
    cotacoesReprovadas: 0,
    cotacoesVencidas: 0,
  });

  const confirmacao = useConfirmacaoInteligente();
  const validacao = useValidacaoFinanceira();

  useEffect(() => {
    carregarCotacoes();
  }, []);

  useEffect(() => {
    carregarCotacoes();
  }, [busca, filtroStatus]);

  const carregarCotacoes = async () => {
    setCarregando(true);
    try {
      const filtros: FiltroCotacao = {
        busca: busca || undefined,
        status:
          filtroStatus !== 'todos' && filtroStatus !== 'vencida'
            ? [filtroStatus as any]
            : undefined,
      };
      const dados = await cotacaoService.listar(filtros);
      let listaNormalizada = Array.isArray(dados.items) ? dados.items : [];

      // Filtro especial para vencidas (client-side)
      if (filtroStatus === 'vencida') {
        const hoje = new Date();
        listaNormalizada = listaNormalizada.filter((c) => {
          const vencimento = new Date(c.dataVencimento);
          return (
            vencimento < hoje &&
            !['aprovada', 'convertida', 'cancelada', 'rejeitada'].includes(c.status)
          );
        });
      }

      setCotacoes(listaNormalizada);
      calcularDashboard(listaNormalizada);
    } catch (error) {
      console.error('Erro ao carregar cotações:', error);
    } finally {
      setCarregando(false);
    }
  };

  const calcularDashboard = (cotacoes: Cotacao[]) => {
    const hoje = new Date();

    const pendentes = cotacoes.filter((c) =>
      ['rascunho', 'enviada', 'em_analise'].includes(c.status),
    ).length;

    const aprovadas = cotacoes.filter((c) => ['aprovada', 'convertida'].includes(c.status)).length;

    const reprovadas = cotacoes.filter((c) => c.status === 'rejeitada').length;

    const vencidas = cotacoes.filter((c) => {
      const vencimento = new Date(c.dataVencimento);
      return (
        vencimento < hoje &&
        !['aprovada', 'convertida', 'cancelada', 'rejeitada'].includes(c.status)
      );
    }).length;

    setDashboardCards({
      totalCotacoes: cotacoes.length,
      cotacoesPendentes: pendentes,
      cotacoesAprovadas: aprovadas,
      cotacoesReprovadas: reprovadas,
      cotacoesVencidas: vencidas,
    });
  };

  const abrirModalNovo = () => {
    setCotacaoEdicao(null);
    setModalCadastroAberto(true);
  };

  const abrirModalEdicao = (cotacao: Cotacao) => {
    setCotacaoEdicao(cotacao);
    setModalCadastroAberto(true);
  };

  const abrirModalDetalhes = (cotacao: Cotacao) => {
    setCotacaoDetalhes(cotacao);
    setModalDetalhesAberto(true);
  };

  const fecharModalCadastro = () => {
    setModalCadastroAberto(false);
    setCotacaoEdicao(null);
  };

  const fecharModalDetalhes = () => {
    setModalDetalhesAberto(false);
    setCotacaoDetalhes(null);
  };

  const handleSalvarCotacao = (cotacao: Cotacao) => {
    carregarCotacoes();
  };

  const handleAlterarStatus = (cotacaoId: string, novoStatus: StatusCotacao) => {
    setCotacoes((prevCotacoes) =>
      prevCotacoes.map((cotacao) =>
        cotacao.id === cotacaoId ? { ...cotacao, status: novoStatus } : cotacao,
      ),
    );
  };

  const excluirCotacao = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta cotação?')) {
      try {
        await cotacaoService.deletar(id);
        carregarCotacoes();
        fecharModalDetalhes();
      } catch (error) {
        console.error('Erro ao excluir cotação:', error);
      }
    }
  };

  const enviarParaAprovacao = async (cotacao: Cotacao) => {
    if (
      window.confirm(
        `Deseja enviar a cotação #${cotacao.numero} para aprovação?\n\nApós enviar, o aprovador será notificado.`,
      )
    ) {
      try {
        await cotacaoService.enviarParaAprovacao(cotacao.id);
        alert(
          `✅ Cotação #${cotacao.numero} enviada para aprovação com sucesso!\n\nO aprovador foi notificado.`,
        );
        carregarCotacoes(); // Recarregar lista
      } catch (error: any) {
        console.error('Erro ao enviar cotação para aprovação:', error);
        const errorMessage =
          error.response?.data?.message || error.message || 'Erro ao enviar cotação para aprovação';
        alert(`Erro ao enviar para aprovação:\n\n${errorMessage}`);
      }
    }
  };

  const toggleSelecionarCotacao = (id: string) => {
    setCotacoesSelecionadas((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const selecionarTodos = () => {
    setCotacoesSelecionadas(cotacoes.map((c) => c.id));
  };

  const deselecionarTodos = () => {
    setCotacoesSelecionadas([]);
  };

  const buscarCotacoes = () => {
    carregarCotacoes();
  };

  const handleSearch = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      buscarCotacoes();
    }
  };

  // Usar cotações diretamente (já filtradas no backend)
  const cotacoesFiltradas = cotacoes;

  const mostrarAcoesMassa = cotacoesSelecionadas.length > 0;

  const alterarStatusSelecionadas = async (novoStatus: StatusCotacao) => {
    if (
      !window.confirm(
        `Tem certeza que deseja alterar o status de ${cotacoesSelecionadas.length} cotação(ões)?`,
      )
    ) {
      return;
    }

    try {
      for (const id of cotacoesSelecionadas) {
        await cotacaoService.alterarStatus(id, novoStatus);
      }
      deselecionarTodos();
      carregarCotacoes();
    } catch (error) {
      console.error('Erro ao alterar status das cotações:', error);
    }
  };

  const excluirSelecionadas = async () => {
    confirmacao.confirmar(
      'excluir-categoria-financeira',
      async () => {
        for (const id of cotacoesSelecionadas) {
          await cotacaoService.deletar(id);
        }
        deselecionarTodos();
        carregarCotacoes();
      },
      { quantidadeItens: cotacoesSelecionadas.length },
    );
  };

  // Funções de exportação
  const exportarParaCSV = () => {
    const colunas = [
      { key: 'numero', title: 'Número' },
      { key: 'titulo', title: 'Título' },
      { key: 'fornecedor.nome', title: 'Fornecedor' },
      { key: 'status', title: 'Status', formatter: formatStatusForExport },
      { key: 'prioridade', title: 'Prioridade' },
      {
        key: 'valorTotal',
        title: 'Valor Total',
        formatter: (valor: number) =>
          `R$ ${valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      },
      { key: 'prazoResposta', title: 'Prazo Resposta', formatter: formatDateForExport },
      { key: 'dataCriacao', title: 'Data Criação', formatter: formatDateForExport },
    ];
    exportToCSV(cotacoes, colunas, 'cotacoes');
  };

  const exportarParaExcel = () => {
    const colunas = [
      { key: 'numero', title: 'Número' },
      { key: 'titulo', title: 'Título' },
      { key: 'fornecedor.nome', title: 'Fornecedor' },
      { key: 'status', title: 'Status', formatter: formatStatusForExport },
      { key: 'prioridade', title: 'Prioridade' },
      { key: 'valorTotal', title: 'Valor Total', formatter: (valor: number) => valor },
      { key: 'prazoResposta', title: 'Prazo Resposta', formatter: formatDateForExport },
      { key: 'dataCriacao', title: 'Data Criação', formatter: formatDateForExport },
    ];
    exportToExcel(cotacoes, colunas, 'cotacoes');
  };

  const exportarSelecionadas = () => {
    const cotacoesSelecionadasData = cotacoes.filter((cotacao) =>
      cotacoesSelecionadas.includes(cotacao.id),
    );
    const colunas = [
      { key: 'numero', title: 'Número' },
      { key: 'titulo', title: 'Título' },
      { key: 'fornecedor.nome', title: 'Fornecedor' },
      { key: 'status', title: 'Status', formatter: formatStatusForExport },
      {
        key: 'valorTotal',
        title: 'Valor Total',
        formatter: (valor: number) =>
          `R$ ${valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      },
    ];
    exportToCSV(cotacoesSelecionadasData, colunas, 'cotacoes-selecionadas');
  };

  // Funções auxiliares
  const formatStatusForExport = (status: string) => {
    const statusMap: Record<string, string> = {
      rascunho: 'Rascunho',
      enviada: 'Enviada',
      em_analise: 'Em Análise',
      aprovada: 'Aprovada',
      rejeitada: 'Rejeitada',
      vencida: 'Vencida',
      convertida: 'Convertida',
      cancelada: 'Cancelada',
    };
    return statusMap[status] || status;
  };

  const formatDateForExport = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR');
  };

  // Mocks para funções de exportação
  const exportToCSV = (data: any[], columns: any[], filename: string) => {
    console.log('Exportando para CSV:', filename, data.length, 'registros');
  };

  const exportToExcel = (data: any[], columns: any[], filename: string) => {
    console.log('Exportando para Excel:', filename, data.length, 'registros');
  };

  const getStatusBadge = (status: StatusCotacao) => {
    const configs = {
      rascunho: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Rascunho' },
      enviada: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Enviada' },
      pendente: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pendente' },
      em_analise: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Em Análise' },
      aprovada: { bg: 'bg-green-100', text: 'text-green-800', label: 'Aprovada' },
      rejeitada: { bg: 'bg-red-100', text: 'text-red-800', label: 'Rejeitada' },
      vencida: { bg: 'bg-red-100', text: 'text-red-800', label: 'Vencida' },
      convertida: { bg: 'bg-green-100', text: 'text-green-800', label: 'Convertida' },
      cancelada: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Cancelada' },
    };

    const config = configs[status];
    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}
      >
        {config.label}
      </span>
    );
  };

  const getPrioridadeBadge = (prioridade: PrioridadeCotacao) => {
    const configs = {
      baixa: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Baixa' },
      media: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Média' },
      alta: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Alta' },
      urgente: { bg: 'bg-red-100', text: 'text-red-800', label: 'Urgente' },
    };

    const config = configs[prioridade];
    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}
      >
        {config.label}
      </span>
    );
  };

  const isVencida = (dataVencimento: string | undefined, status: StatusCotacao) => {
    if (!dataVencimento) return false;
    const vencimento = new Date(dataVencimento);
    if (isNaN(vencimento.getTime())) return false;
    const hoje = new Date();
    return vencimento < hoje && !['aprovada', 'convertida', 'cancelada'].includes(status);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4">
        <BackToNucleus nucleusName="Comercial" nucleusPath="/nuclei/comercial" />
      </div>

      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="bg-white rounded-lg shadow-sm border mb-6">
            <div className="px-6 py-6">
              <div className="flex flex-col sm:flex-row justify-between items-start">
                <div>
                  <h1 className="text-3xl font-bold text-[#002333] flex items-center">
                    <FileText className="h-8 w-8 mr-3 text-[#159A9C]" />
                    Cotações e Orçamentos
                    {carregando && (
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#159A9C] ml-3"></div>
                    )}
                  </h1>
                  <p className="mt-2 text-[#B4BEC9]">
                    {carregando
                      ? 'Carregando cotações...'
                      : `Gerencie suas ${dashboardCards.totalCotacoes} cotações e orçamentos`}
                  </p>
                </div>
                <div className="mt-4 sm:mt-0 flex items-center gap-3">
                  <button
                    onClick={abrirModalNovo}
                    className="bg-[#159A9C] hover:bg-[#0F7B7D] text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm text-sm font-medium"
                  >
                    <Plus className="w-4 h-4" />
                    Nova Cotação
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Dashboard Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-6">
            <div
              onClick={() => setFiltroStatus('todos')}
              className={`bg-white rounded-xl shadow-sm border p-6 hover:shadow-lg transition-all duration-300 cursor-pointer ${
                filtroStatus === 'todos'
                  ? 'border-[#159A9C] ring-2 ring-[#159A9C]/20'
                  : 'border-[#DEEFE7]'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#002333]/60">
                    Total de Cotações
                  </p>
                  <p className="text-3xl font-bold text-[#002333] mt-2">
                    {dashboardCards.totalCotacoes}
                  </p>
                  <p className="text-sm text-[#002333]/70 mt-3">📊 Visão geral</p>
                </div>
                <div className="h-12 w-12 rounded-2xl bg-[#159A9C]/10 flex items-center justify-center shadow-sm">
                  <FileText className="w-6 h-6 text-[#159A9C]" />
                </div>
              </div>
            </div>

            <div
              onClick={() => setFiltroStatus('em_analise')}
              className={`bg-white rounded-xl shadow-sm border p-6 hover:shadow-lg transition-all duration-300 cursor-pointer ${
                filtroStatus === 'em_analise'
                  ? 'border-yellow-500 ring-2 ring-yellow-500/20'
                  : 'border-[#DEEFE7]'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#002333]/60">
                    Pendentes
                  </p>
                  <p className="text-3xl font-bold text-[#002333] mt-2">
                    {dashboardCards.cotacoesPendentes}
                  </p>
                  <p className="text-sm text-[#002333]/70 mt-3">⏳ Em andamento</p>
                </div>
                <div className="h-12 w-12 rounded-2xl bg-yellow-500/10 flex items-center justify-center shadow-sm">
                  <Clock className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
            </div>

            <div
              onClick={() => setFiltroStatus('aprovada')}
              className={`bg-white rounded-xl shadow-sm border p-6 hover:shadow-lg transition-all duration-300 cursor-pointer ${
                filtroStatus === 'aprovada'
                  ? 'border-green-500 ring-2 ring-green-500/20'
                  : 'border-[#DEEFE7]'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#002333]/60">
                    Aprovadas
                  </p>
                  <p className="text-3xl font-bold text-[#002333] mt-2">
                    {dashboardCards.cotacoesAprovadas}
                  </p>
                  <p className="text-sm text-[#002333]/70 mt-3">✅ Aprovadas</p>
                </div>
                <div className="h-12 w-12 rounded-2xl bg-green-500/10 flex items-center justify-center shadow-sm">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>

            <div
              onClick={() => setFiltroStatus('rejeitada')}
              className={`bg-white rounded-xl shadow-sm border p-6 hover:shadow-lg transition-all duration-300 cursor-pointer ${
                filtroStatus === 'rejeitada'
                  ? 'border-red-500 ring-2 ring-red-500/20'
                  : 'border-[#DEEFE7]'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#002333]/60">
                    Reprovadas
                  </p>
                  <p className="text-3xl font-bold text-[#002333] mt-2">
                    {dashboardCards.cotacoesReprovadas}
                  </p>
                  <p className="text-sm text-[#002333]/70 mt-3">❌ Rejeitadas</p>
                </div>
                <div className="h-12 w-12 rounded-2xl bg-red-500/10 flex items-center justify-center shadow-sm">
                  <XCircle className="w-6 h-6 text-red-600" />
                </div>
              </div>
            </div>

            <div
              onClick={() => setFiltroStatus('vencida')}
              className={`bg-white rounded-xl shadow-sm border p-6 hover:shadow-lg transition-all duration-300 cursor-pointer ${
                filtroStatus === 'vencida'
                  ? 'border-orange-500 ring-2 ring-orange-500/20'
                  : 'border-[#DEEFE7]'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#002333]/60">
                    Vencidas
                  </p>
                  <p className="text-3xl font-bold text-[#002333] mt-2">
                    {dashboardCards.cotacoesVencidas}
                  </p>
                  <p className="text-sm text-[#002333]/70 mt-3">⚠️ Atrasadas</p>
                </div>
                <div className="h-12 w-12 rounded-2xl bg-orange-500/10 flex items-center justify-center shadow-sm">
                  <AlertCircle className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Filtros */}
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
            <div className="flex flex-col sm:flex-row gap-4 items-end">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Buscar Cotações
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Buscar por número, título, fornecedor..."
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                    onKeyPress={handleSearch}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent transition-colors"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <div className="min-w-[140px]">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <select
                    value={filtroStatus}
                    onChange={(e) => setFiltroStatus(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#159A9C] focus:border-transparent transition-colors"
                  >
                    <option value="todos">Todos</option>
                    <option value="rascunho">Rascunho</option>
                    <option value="enviada">Enviada</option>
                    <option value="em_analise">Em Análise</option>
                    <option value="aprovada">Aprovada</option>
                    <option value="rejeitada">Rejeitada</option>
                    <option value="vencida">Vencida</option>
                    <option value="convertida">Convertida</option>
                    <option value="cancelada">Cancelada</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={buscarCotacoes}
                  className="px-4 py-2 bg-[#159A9C] text-white rounded-lg hover:bg-[#0F7B7D] flex items-center gap-2 transition-colors"
                >
                  <Search className="w-4 h-4" />
                  Buscar
                </button>
                <div className="flex gap-1">
                  <button
                    onClick={exportarParaCSV}
                    disabled={cotacoes.length === 0}
                    className="px-3 py-2 bg-[#159A9C] text-white rounded-lg hover:bg-[#0F7B7D] disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2 transition-colors text-sm font-medium"
                    title="Exportar para CSV"
                  >
                    <Download className="w-4 h-4" />
                    CSV
                  </button>
                  <button
                    onClick={exportarParaExcel}
                    disabled={cotacoes.length === 0}
                    className="px-3 py-2 bg-[#159A9C] text-white rounded-lg hover:bg-[#0F7B7D] disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2 transition-colors text-sm font-medium"
                    title="Exportar para Excel"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    Excel
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Ações em Massa */}
          {mostrarAcoesMassa && (
            <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-sm font-medium text-blue-900">
                      {cotacoesSelecionadas.length} cotação(ões) selecionada(s)
                    </span>
                  </div>
                  <button
                    onClick={deselecionarTodos}
                    className="text-sm text-blue-600 hover:text-blue-800 underline transition-colors"
                  >
                    Desmarcar todos
                  </button>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => alterarStatusSelecionadas('aprovada')}
                    className="px-4 py-2 bg-[#159A9C] text-white rounded-lg text-sm font-medium hover:bg-[#0F7B7D] flex items-center gap-2 transition-colors"
                  >
                    <Check className="w-4 h-4" />
                    Aprovar
                  </button>
                  <button
                    onClick={() => alterarStatusSelecionadas('rejeitada')}
                    className="px-4 py-2 bg-orange-600 text-white rounded-lg text-sm font-medium hover:bg-orange-700 flex items-center gap-2 transition-colors"
                  >
                    <X className="w-4 h-4" />
                    Rejeitar
                  </button>
                  <button
                    onClick={exportarSelecionadas}
                    className="px-4 py-2 bg-[#159A9C] text-white rounded-lg text-sm font-medium hover:bg-[#0F7B7D] flex items-center gap-2 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    Exportar
                  </button>
                  <button
                    onClick={excluirSelecionadas}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 flex items-center gap-2 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    Excluir
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Tabela de Cotações */}
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Lista de Cotações</h2>
            </div>

            {carregando ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Carregando cotações...</p>
              </div>
            ) : cotacoes.length === 0 ? (
              <div className="p-8 text-center">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Nenhuma cotação encontrada
                </h3>
                <p className="text-gray-600 mb-4">
                  {busca || filtroStatus !== 'todos'
                    ? 'Tente ajustar os filtros ou criar uma nova cotação.'
                    : 'Comece criando sua primeira cotação.'}
                </p>
                <button
                  onClick={abrirModalNovo}
                  className="bg-[#159A9C] hover:bg-[#0F7B7D] text-white px-4 py-2 rounded-lg inline-flex items-center gap-2 text-sm font-medium"
                >
                  <Plus className="w-4 h-4" />
                  Criar Primeira Cotação
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-white border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-4 text-left">
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            checked={
                              cotacoesSelecionadas.length === cotacoes.length && cotacoes.length > 0
                            }
                            onChange={(e) =>
                              e.target.checked ? selecionarTodos() : deselecionarTodos()
                            }
                            className="w-4 h-4 text-[#159A9C] bg-gray-100 border-gray-300 rounded focus:ring-[#159A9C] focus:ring-2"
                          />
                        </div>
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4" />
                          Cotação
                        </div>
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4" />
                          Fornecedor
                        </div>
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        <div className="flex items-center gap-2">
                          <Activity className="w-4 h-4" />
                          Status
                        </div>
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        <div className="flex items-center gap-2">
                          <AlertCircle className="w-4 h-4" />
                          Prioridade
                        </div>
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4" />
                          Valor Total
                        </div>
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          Vencimento
                        </div>
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        <div className="flex items-center justify-end gap-2">
                          <Settings className="w-4 h-4" />
                          Ações
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {cotacoes.map((cotacao) => (
                      <tr key={cotacao.id} className="hover:bg-gray-50">
                        <td className="px-4 py-4">
                          <input
                            type="checkbox"
                            checked={cotacoesSelecionadas.includes(cotacao.id)}
                            onChange={() => toggleSelecionarCotacao(cotacao.id)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              #{cotacao.numero}
                            </div>
                            <div className="text-sm text-gray-500">{cotacao.titulo}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {cotacao.fornecedor?.nome || 'Fornecedor não informado'}
                          </div>
                          {cotacao.fornecedor?.email && (
                            <div className="text-sm text-gray-500">{cotacao.fornecedor.email}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(cotacao.status)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getPrioridadeBadge(cotacao.prioridade)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {cotacao.valorTotal.toLocaleString('pt-BR', {
                              style: 'currency',
                              currency: 'BRL',
                            })}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {cotacao.dataVencimento ? (
                            <>
                              <div
                                className={`text-sm ${isVencida(cotacao.dataVencimento, cotacao.status) ? 'text-red-600 font-medium' : 'text-gray-900'}`}
                              >
                                {new Date(cotacao.dataVencimento).toLocaleDateString('pt-BR')}
                              </div>
                              {isVencida(cotacao.dataVencimento, cotacao.status) && (
                                <div className="text-xs text-red-500">Vencida</div>
                              )}
                            </>
                          ) : (
                            <div className="text-sm text-gray-400">Sem vencimento</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end gap-2">
                            {/* Botão "Enviar para Aprovação" - Apenas para RASCUNHO */}
                            {cotacao.status === StatusCotacao.RASCUNHO && (
                              <button
                                onClick={() => enviarParaAprovacao(cotacao)}
                                className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50 transition-colors"
                                title="Enviar para aprovação"
                              >
                                <Send className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              onClick={() => abrirModalDetalhes(cotacao)}
                              className="text-blue-600 hover:text-blue-900 p-1 rounded"
                              title="Visualizar detalhes"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => abrirModalEdicao(cotacao)}
                              className="text-green-600 hover:text-green-900 p-1 rounded"
                              title="Editar cotação"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => excluirCotacao(cotacao.id)}
                              className="text-red-600 hover:text-red-900 p-1 rounded"
                              title="Excluir cotação"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                            <div className="relative">
                              <button className="text-gray-400 hover:text-gray-600 p-1 rounded">
                                <MoreVertical className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modais */}
      <ModalCadastroCotacao
        isOpen={modalCadastroAberto}
        onClose={fecharModalCadastro}
        cotacao={cotacaoEdicao}
        onSave={handleSalvarCotacao}
      />

      <ModalDetalhesCotacao
        isOpen={modalDetalhesAberto}
        onClose={fecharModalDetalhes}
        cotacao={cotacaoDetalhes}
        onEdit={abrirModalEdicao}
        onDelete={excluirCotacao}
        onStatusChange={handleAlterarStatus}
      />
    </div>
  );
}

export default CotacaoPage;
