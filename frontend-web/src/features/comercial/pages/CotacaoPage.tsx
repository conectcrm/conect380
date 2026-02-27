import React, { useEffect, useMemo, useRef, useState } from 'react';
import { cotacaoService } from '../../../services/cotacaoService';
import { toastService } from '../../../services/toastService';
import { exportToCSV, exportToExcel } from '../../../utils/exportUtils';
import {
  Cotacao,
  FiltroCotacao,
  PrioridadeCotacao,
  StatusCotacao,
} from '../../../types/cotacaoTypes';
import { useGlobalConfirmation } from '../../../contexts/GlobalConfirmationContext';
import { useAuth } from '../../../hooks/useAuth';
import { userHasPermission } from '../../../config/menuConfig';
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
  FileSpreadsheet,
  Eye,
  Check,
  X,
  CheckCircle,
  XCircle,
  AlertCircle,
  Calendar,
  Activity,
  DollarSign,
  Clock,
  User,
  Send,
  RefreshCw,
} from 'lucide-react';
import {
  DataTableCard,
  EmptyState,
  FiltersBar,
  InlineStats,
  LoadingSkeleton,
  PageHeader,
  SectionCard,
} from '../../../components/layout-v2';

type FiltroStatusUI =
  | 'todos'
  | 'vencida'
  | 'rascunho'
  | 'enviada'
  | 'em_analise'
  | 'aprovada'
  | 'pedido_gerado'
  | 'adquirido'
  | 'rejeitada'
  | 'convertida'
  | 'cancelada'
  | 'pendente';

const FINALIZED_STATUS = new Set<StatusCotacao>([
  StatusCotacao.APROVADA,
  StatusCotacao.PEDIDO_GERADO,
  StatusCotacao.ADQUIRIDO,
  StatusCotacao.CONVERTIDA,
  StatusCotacao.CANCELADA,
  StatusCotacao.REJEITADA,
]);

const statusOptions: Array<{ value: FiltroStatusUI; label: string }> = [
  { value: 'todos', label: 'Todos' },
  { value: 'rascunho', label: 'Rascunho' },
  { value: 'enviada', label: 'Enviada' },
  { value: 'pendente', label: 'Pendente' },
  { value: 'em_analise', label: 'Em analise' },
  { value: 'aprovada', label: 'Aprovada' },
  { value: 'pedido_gerado', label: 'Pedido gerado' },
  { value: 'adquirido', label: 'Adquirido' },
  { value: 'rejeitada', label: 'Rejeitada' },
  { value: 'vencida', label: 'Vencida' },
  { value: 'convertida', label: 'Convertida' },
  { value: 'cancelada', label: 'Cancelada' },
];

const quickStatusCards: Array<{
  value: FiltroStatusUI;
  label: string;
  countKey: 'total' | 'pendentes' | 'aprovadas' | 'reprovadas' | 'vencidas';
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { value: 'todos', label: 'Total', countKey: 'total', icon: FileText },
  { value: 'em_analise', label: 'Pendentes', countKey: 'pendentes', icon: Clock },
  { value: 'aprovada', label: 'Aprovadas', countKey: 'aprovadas', icon: CheckCircle },
  { value: 'rejeitada', label: 'Reprovadas', countKey: 'reprovadas', icon: XCircle },
  { value: 'vencida', label: 'Vencidas', countKey: 'vencidas', icon: AlertCircle },
];

const moneyFmt = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

const btnPrimary =
  'inline-flex items-center gap-2 rounded-lg bg-[#159A9C] px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[#0F7B7D] disabled:opacity-60 disabled:cursor-not-allowed';
const btnSecondary =
  'inline-flex items-center gap-2 rounded-lg border border-[#B4BEC9] bg-white px-4 py-2 text-sm font-medium text-[#19384C] transition-colors hover:bg-[#F6FAF9] disabled:opacity-60 disabled:cursor-not-allowed';
const btnDanger =
  'inline-flex items-center gap-2 rounded-lg bg-[#B4233A] px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[#981E31] disabled:opacity-60 disabled:cursor-not-allowed';

function formatDate(value?: string) {
  if (!value) return 'Sem vencimento';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return 'Data invalida';
  return parsed.toLocaleDateString('pt-BR');
}

function formatDateForExport(value?: string) {
  if (!value) return '';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '';
  return parsed.toLocaleDateString('pt-BR');
}

function formatStatusForExport(status: string) {
  const map: Record<string, string> = {
    rascunho: 'Rascunho',
    enviada: 'Enviada',
    pendente: 'Pendente',
    em_analise: 'Em analise',
    aprovada: 'Aprovada',
    pedido_gerado: 'Pedido gerado',
    adquirido: 'Adquirido',
    rejeitada: 'Rejeitada',
    vencida: 'Vencida',
    convertida: 'Convertida',
    cancelada: 'Cancelada',
  };
  return map[status] || status;
}

function isCotacaoVencida(dataVencimento: string | undefined, status: StatusCotacao) {
  if (!dataVencimento) return false;
  if (FINALIZED_STATUS.has(status)) return false;
  const parsed = new Date(dataVencimento);
  if (Number.isNaN(parsed.getTime())) return false;
  return parsed < new Date();
}

function getStatusBadge(status: StatusCotacao) {
  return getStatusBadgeForCotacao({ status });
}

function getStatusBadgeForCotacao(cotacao: Pick<Cotacao, 'status' | 'metadados'>) {
  const compraStatus = cotacao.metadados?.compra?.status;
  const config: Record<string, { label: string; className: string }> = {
    rascunho: { label: 'Rascunho', className: 'bg-gray-100 text-gray-800' },
    enviada: { label: 'Enviada', className: 'bg-blue-100 text-blue-800' },
    pendente: { label: 'Pendente', className: 'bg-yellow-100 text-yellow-800' },
    em_analise: { label: 'Em analise', className: 'bg-yellow-100 text-yellow-800' },
    aprovada: { label: 'Aprovada', className: 'bg-green-100 text-green-800' },
    pedido_gerado: { label: 'Pedido gerado', className: 'bg-teal-100 text-teal-800' },
    adquirido: { label: 'Adquirido', className: 'bg-emerald-100 text-emerald-800' },
    rejeitada: { label: 'Rejeitada', className: 'bg-red-100 text-red-800' },
    vencida: { label: 'Vencida', className: 'bg-red-100 text-red-800' },
    convertida: { label: 'Convertida', className: 'bg-green-100 text-green-800' },
    cancelada: { label: 'Cancelada', className: 'bg-gray-100 text-gray-800' },
  };
  const current =
    cotacao.status === StatusCotacao.CONVERTIDA && compraStatus === 'adquirido'
      ? { label: 'Adquirido', className: 'bg-emerald-100 text-emerald-800' }
    : cotacao.status === StatusCotacao.CONVERTIDA && compraStatus === 'pedido_gerado'
        ? { label: 'Pedido gerado', className: 'bg-teal-100 text-teal-800' }
        : config[cotacao.status] || config.rascunho;
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${current.className}`}>
      {current.label}
    </span>
  );
}

function getPrioridadeBadge(prioridade: PrioridadeCotacao) {
  const config: Record<string, { label: string; className: string }> = {
    baixa: { label: 'Baixa', className: 'bg-gray-100 text-gray-800' },
    media: { label: 'Media', className: 'bg-blue-100 text-blue-800' },
    alta: { label: 'Alta', className: 'bg-yellow-100 text-yellow-800' },
    urgente: { label: 'Urgente', className: 'bg-red-100 text-red-800' },
  };
  const current = config[prioridade] || config.media;
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${current.className}`}>
      {current.label}
    </span>
  );
}

function CotacaoPage() {
  const { confirm } = useGlobalConfirmation();
  const { user } = useAuth();
  const [cotacoes, setCotacoes] = useState<Cotacao[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erroCarregamento, setErroCarregamento] = useState<string | null>(null);
  const [modalCadastroAberto, setModalCadastroAberto] = useState(false);
  const [modalDetalhesAberto, setModalDetalhesAberto] = useState(false);
  const [cotacaoEdicao, setCotacaoEdicao] = useState<Cotacao | null>(null);
  const [cotacaoDetalhes, setCotacaoDetalhes] = useState<Cotacao | null>(null);
  const [busca, setBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState<FiltroStatusUI>('todos');
  const [cotacoesSelecionadas, setCotacoesSelecionadas] = useState<string[]>([]);
  const selectAllRef = useRef<HTMLInputElement | null>(null);

  const canCreateCotacao = userHasPermission(user as any, 'comercial.propostas.create');
  const canUpdateCotacao = userHasPermission(user as any, 'comercial.propostas.update');
  const canDeleteCotacao = userHasPermission(user as any, 'comercial.propostas.delete');
  const canSendCotacao = userHasPermission(user as any, 'comercial.propostas.send');

  const resumo = useMemo(() => {
    const pendentes = cotacoes.filter((c) =>
      ['rascunho', 'enviada', 'em_analise', 'pendente'].includes(c.status),
    ).length;
    const aprovadas = cotacoes.filter((c) =>
      ['aprovada', 'pedido_gerado', 'adquirido', 'convertida'].includes(c.status),
    ).length;
    const reprovadas = cotacoes.filter((c) => c.status === 'rejeitada').length;
    const vencidas = cotacoes.filter((c) => isCotacaoVencida(c.dataVencimento, c.status)).length;

    return {
      total: cotacoes.length,
      pendentes,
      aprovadas,
      reprovadas,
      vencidas,
    };
  }, [cotacoes]);

  const hasFilters = busca.trim().length > 0 || filtroStatus !== 'todos';
  const isAllSelected = cotacoes.length > 0 && cotacoesSelecionadas.length === cotacoes.length;
  const isSomeSelected = cotacoesSelecionadas.length > 0 && !isAllSelected;

  useEffect(() => {
    void carregarCotacoes();
  }, [busca, filtroStatus]);

  useEffect(() => {
    const visibleIds = new Set(cotacoes.map((c) => c.id));
    setCotacoesSelecionadas((prev) => prev.filter((id) => visibleIds.has(id)));
  }, [cotacoes]);

  useEffect(() => {
    if (!selectAllRef.current) return;
    selectAllRef.current.indeterminate = isSomeSelected;
  }, [isSomeSelected]);

  const carregarCotacoes = async () => {
    setCarregando(true);
    setErroCarregamento(null);
    try {
      const filtros: FiltroCotacao = {
        busca: busca.trim() || undefined,
        status:
          filtroStatus !== 'todos' && filtroStatus !== 'vencida'
            ? [filtroStatus as StatusCotacao]
            : undefined,
      };

      const dados = await cotacaoService.listar(filtros);
      let lista = Array.isArray(dados.items) ? dados.items : [];

      if (filtroStatus === 'vencida') {
        lista = lista.filter((c) => isCotacaoVencida(c.dataVencimento, c.status));
      }

      setCotacoes(lista);
    } catch (error) {
      console.error('Erro ao carregar cotacoes:', error);
      setErroCarregamento('Nao foi possivel carregar as cotacoes.');
      toastService.apiError(error, 'Erro ao carregar cotacoes');
    } finally {
      setCarregando(false);
    }
  };

  const abrirModalNovo = () => {
    if (!canCreateCotacao) {
      toastService.warning('Voce nao possui permissao para criar cotacoes');
      return;
    }
    setCotacaoEdicao(null);
    setModalCadastroAberto(true);
  };

  const abrirModalEdicao = (cotacao: Cotacao) => {
    if (!canUpdateCotacao) {
      toastService.warning('Voce nao possui permissao para editar cotacoes');
      return;
    }
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

  const handleSalvarCotacao = (_cotacao: Cotacao) => {
    void carregarCotacoes();
  };

  const handleAlterarStatus = (cotacaoId: string, novoStatus: StatusCotacao) => {
    setCotacoes((prev) =>
      prev.map((cotacao) => (cotacao.id === cotacaoId ? { ...cotacao, status: novoStatus } : cotacao)),
    );
    setCotacaoDetalhes((prev) =>
      prev && prev.id === cotacaoId ? { ...prev, status: novoStatus } : prev,
    );
    void carregarCotacoes();
  };

  const excluirCotacao = async (id: string) => {
    if (!canDeleteCotacao) {
      toastService.warning('Voce nao possui permissao para excluir cotacoes');
      return;
    }
    if (!(await confirm('Tem certeza que deseja excluir esta cotacao?'))) return;
    try {
      await cotacaoService.deletar(id);
      await carregarCotacoes();
      fecharModalDetalhes();
      toastService.success('Cotacao excluida com sucesso!');
    } catch (error) {
      console.error('Erro ao excluir cotacao:', error);
      toastService.apiError(error, 'Erro ao excluir cotacao');
    }
  };

  const enviarParaAprovacao = async (cotacao: Cotacao) => {
    if (!canSendCotacao) {
      toastService.warning('Voce nao possui permissao para enviar cotacoes');
      return;
    }
    if (
      !(await confirm(
        `Deseja enviar a cotacao #${cotacao.numero} para aprovacao?\n\nApos enviar, o aprovador sera notificado.`,
      ))
    ) {
      return;
    }
    try {
      await cotacaoService.enviarParaAprovacao(cotacao.id);
      toastService.success(`Cotacao #${cotacao.numero} enviada para aprovacao com sucesso!`);
      await carregarCotacoes();
    } catch (error) {
      console.error('Erro ao enviar cotacao para aprovacao:', error);
      toastService.apiError(error, 'Erro ao enviar cotacao para aprovacao');
    }
  };

  const toggleSelecionarCotacao = (id: string) => {
    setCotacoesSelecionadas((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const selecionarTodos = () => setCotacoesSelecionadas(cotacoes.map((c) => c.id));
  const deselecionarTodos = () => setCotacoesSelecionadas([]);

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    void carregarCotacoes();
  };

  const alterarStatusSelecionadas = async (novoStatus: StatusCotacao) => {
    if (!canUpdateCotacao) {
      toastService.warning('Voce nao possui permissao para alterar status de cotacoes');
      return;
    }
    if (
      !(await confirm(
        `Tem certeza que deseja alterar o status de ${cotacoesSelecionadas.length} cotacao(oes)?`,
      ))
    ) {
      return;
    }
    try {
      if (novoStatus === StatusCotacao.APROVADA) {
        const resultado = await cotacaoService.aprovarLote(cotacoesSelecionadas);
        if (resultado.falhas > 0) {
          toastService.warning(
            `${resultado.sucessos} cotacao(oes) aprovada(s), ${resultado.falhas} falharam`,
          );
        } else {
          toastService.success('Cotacoes aprovadas com sucesso!');
        }
      } else if (novoStatus === StatusCotacao.REJEITADA) {
        const justificativa = window.prompt(
          `Informe a justificativa para reprovar ${cotacoesSelecionadas.length} cotacao(oes):`,
          '',
        );

        if (justificativa === null) {
          return;
        }

        if (!justificativa.trim()) {
          toastService.warning('Justificativa obrigatoria para reprovar');
          return;
        }

        const resultado = await cotacaoService.reprovarLote(
          cotacoesSelecionadas,
          justificativa.trim(),
        );
        if (resultado.falhas > 0) {
          toastService.warning(
            `${resultado.sucessos} cotacao(oes) reprovada(s), ${resultado.falhas} falharam`,
          );
        } else {
          toastService.success('Cotacoes reprovadas com sucesso!');
        }
      } else {
        for (const id of cotacoesSelecionadas) {
          await cotacaoService.alterarStatus(id, novoStatus);
        }
        toastService.success('Status das cotacoes atualizado com sucesso!');
      }
      deselecionarTodos();
      await carregarCotacoes();
    } catch (error) {
      console.error('Erro ao alterar status das cotacoes:', error);
      toastService.apiError(error, 'Erro ao alterar status das cotacoes');
    }
  };

  const excluirSelecionadas = async () => {
    if (!canDeleteCotacao) {
      toastService.warning('Voce nao possui permissao para excluir cotacoes');
      return;
    }
    if (
      !(await confirm(
        `Tem certeza que deseja excluir ${cotacoesSelecionadas.length} cotacao(oes)?`,
      ))
    ) {
      return;
    }
    try {
      for (const id of cotacoesSelecionadas) {
        await cotacaoService.deletar(id);
      }
      deselecionarTodos();
      await carregarCotacoes();
      toastService.success('Cotacoes excluidas com sucesso!');
    } catch (error) {
      console.error('Erro ao excluir cotacoes em massa:', error);
      toastService.apiError(error, 'Erro ao excluir cotacoes em massa');
    }
  };

  const exportarParaCSV = () => {
    if (!cotacoes.length) {
      toastService.warning('Nao ha dados para exportar');
      return;
    }
    exportToCSV(
      cotacoes,
      [
        { key: 'numero', label: 'Numero' },
        { key: 'titulo', label: 'Titulo' },
        { key: 'fornecedor.nome', label: 'Fornecedor' },
        { key: 'status', label: 'Status', transform: formatStatusForExport },
        { key: 'prioridade', label: 'Prioridade' },
        { key: 'valorTotal', label: 'Valor Total', transform: (v: number) => moneyFmt.format(v || 0) },
        { key: 'prazoResposta', label: 'Prazo Resposta', transform: formatDateForExport },
        { key: 'dataCriacao', label: 'Data Criacao', transform: formatDateForExport },
      ],
      'cotacoes',
    );
    toastService.success('Exportacao CSV iniciada');
  };

  const exportarParaExcel = () => {
    if (!cotacoes.length) {
      toastService.warning('Nao ha dados para exportar');
      return;
    }
    exportToExcel(
      cotacoes,
      [
        { key: 'numero', label: 'Numero' },
        { key: 'titulo', label: 'Titulo' },
        { key: 'fornecedor.nome', label: 'Fornecedor' },
        { key: 'status', label: 'Status', transform: formatStatusForExport },
        { key: 'prioridade', label: 'Prioridade' },
        { key: 'valorTotal', label: 'Valor Total', transform: (v: number) => v || 0 },
        { key: 'prazoResposta', label: 'Prazo Resposta', transform: formatDateForExport },
        { key: 'dataCriacao', label: 'Data Criacao', transform: formatDateForExport },
      ],
      'cotacoes',
    );
    toastService.success('Exportacao Excel iniciada');
  };

  const exportarSelecionadas = () => {
    const selecionadas = cotacoes.filter((c) => cotacoesSelecionadas.includes(c.id));
    if (!selecionadas.length) {
      toastService.warning('Nenhuma cotacao selecionada para exportar');
      return;
    }
    exportToCSV(
      selecionadas,
      [
        { key: 'numero', label: 'Numero' },
        { key: 'titulo', label: 'Titulo' },
        { key: 'fornecedor.nome', label: 'Fornecedor' },
        { key: 'status', label: 'Status', transform: formatStatusForExport },
        { key: 'valorTotal', label: 'Valor Total', transform: (v: number) => moneyFmt.format(v || 0) },
      ],
      'cotacoes-selecionadas',
    );
    toastService.success('Exportacao iniciada');
  };

  const limparFiltros = () => {
    setBusca('');
    setFiltroStatus('todos');
  };

  const activeFilterChips = [
    busca.trim() ? { key: 'busca', label: `Busca: ${busca.trim()}`, onRemove: () => setBusca('') } : null,
    filtroStatus !== 'todos'
      ? {
          key: 'status',
          label: `Status: ${statusOptions.find((option) => option.value === filtroStatus)?.label || filtroStatus}`,
          onRemove: () => setFiltroStatus('todos'),
        }
      : null,
  ].filter(Boolean) as Array<{ key: string; label: string; onRemove: () => void }>;

  const renderRowActions = (cotacao: Cotacao) => (
    <div className="flex items-center gap-1.5">
      {canSendCotacao && cotacao.status === StatusCotacao.RASCUNHO && (
        <button
          type="button"
          onClick={() => void enviarParaAprovacao(cotacao)}
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-[#159A9C] hover:bg-[#159A9C]/10"
          title="Enviar para aprovacao"
        >
          <Send className="h-4 w-4" />
        </button>
      )}
      <button type="button" onClick={() => abrirModalDetalhes(cotacao)} className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-[#159A9C] hover:bg-[#159A9C]/10" title="Visualizar detalhes"><Eye className="h-4 w-4" /></button>
      {canUpdateCotacao && (
        <button type="button" onClick={() => abrirModalEdicao(cotacao)} className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-[#159A9C] hover:bg-[#159A9C]/10" title="Editar cotacao"><Edit3 className="h-4 w-4" /></button>
      )}
      {canDeleteCotacao && (
        <button type="button" onClick={() => void excluirCotacao(cotacao.id)} className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-[#B4233A] hover:bg-[#FFF2F4]" title="Excluir cotacao"><Trash2 className="h-4 w-4" /></button>
      )}
    </div>
  );

  return (
    <div className="space-y-4 pt-1 sm:pt-2">
      <SectionCard className="space-y-4 p-4 sm:p-5">
        <PageHeader
          title={
            <span className="inline-flex flex-wrap items-center gap-2">
              <span>Cotacoes e Orcamentos</span>
              {hasFilters ? (
                <span className="inline-flex items-center rounded-full border border-[#CDE6DF] bg-[#ECF7F3] px-2 py-0.5 text-xs font-semibold text-[#0F7B7D]">
                  filtros ativos
                </span>
              ) : null}
            </span>
          }
          description={
            carregando
              ? 'Carregando cotacoes...'
              : `Gerencie cotacoes e aprovacoes (${resumo.total} registros na lista atual).`
          }
          actions={
            <div className="flex flex-wrap items-center gap-2">
              <button type="button" onClick={() => void carregarCotacoes()} className={btnSecondary} disabled={carregando}>
                <RefreshCw className={`h-4 w-4 ${carregando ? 'animate-spin' : ''}`} />
                Atualizar
              </button>
              <button type="button" onClick={exportarParaCSV} className={btnSecondary} disabled={!cotacoes.length}>
                <Download className="h-4 w-4" />
                CSV
              </button>
              <button type="button" onClick={exportarParaExcel} className={btnSecondary} disabled={!cotacoes.length}>
                <FileSpreadsheet className="h-4 w-4" />
                Excel
              </button>
              {canCreateCotacao && (
                <button type="button" onClick={abrirModalNovo} className={btnPrimary}>
                  <Plus className="h-4 w-4" />
                  Nova Cotacao
                </button>
              )}
            </div>
          }
        />

        {!carregando && !erroCarregamento && (
          <div className="space-y-3">
            <InlineStats
              stats={[
                { label: 'Total', value: String(resumo.total), tone: 'neutral' },
                { label: 'Pendentes', value: String(resumo.pendentes), tone: 'warning' },
                { label: 'Aprovadas', value: String(resumo.aprovadas), tone: 'accent' },
                { label: 'Reprovadas', value: String(resumo.reprovadas), tone: 'neutral' },
                { label: 'Vencidas', value: String(resumo.vencidas), tone: 'warning' },
              ]}
            />

            <div className="grid grid-cols-2 gap-2 md:grid-cols-3 xl:grid-cols-5">
              {quickStatusCards.map((card) => {
                const Icon = card.icon;
                const ativo = filtroStatus === card.value;

                return (
                  <button
                    key={card.value}
                    type="button"
                    onClick={() => setFiltroStatus(card.value)}
                    className={`flex items-center justify-between rounded-xl border px-3 py-2 text-left transition-colors ${
                      ativo
                        ? 'border-[#159A9C] bg-[#ECF7F3] ring-1 ring-[#159A9C]/20'
                        : 'border-[#DCE8EC] bg-white hover:bg-[#F8FBFC]'
                    }`}
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-[#5F7B89]">{card.label}</p>
                      <p className="text-base font-semibold text-[#173A4D]">{resumo[card.countKey]}</p>
                    </div>
                    <span
                      className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                        ativo ? 'bg-[#159A9C] text-white' : 'bg-[#F0F6F8] text-[#5E7A88]'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </SectionCard>

      <FiltersBar className="p-4">
        <div className="flex w-full flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end">
          <div className="w-full sm:min-w-[280px] sm:flex-1">
            <label className="mb-2 block text-sm font-medium text-[#385A6A]">Buscar cotacoes</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9AAEB8]" />
              <input
                type="text"
                placeholder="Numero, titulo ou fornecedor..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                className="h-10 w-full rounded-xl border border-[#D4E2E7] bg-white pl-10 pr-3 text-sm text-[#244455] outline-none transition focus:border-[#1A9E87]/45 focus:ring-2 focus:ring-[#1A9E87]/15"
              />
            </div>
          </div>

          <div className="w-full sm:w-auto">
            <label className="mb-2 block text-sm font-medium text-[#385A6A]">Status</label>
            <select
              value={filtroStatus}
              onChange={(e) => setFiltroStatus(e.target.value as FiltroStatusUI)}
              className="h-10 w-full rounded-xl border border-[#D4E2E7] bg-white px-3 text-sm text-[#244455] outline-none transition focus:border-[#1A9E87]/45 focus:ring-2 focus:ring-[#1A9E87]/15 sm:w-[190px]"
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>

          <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
            <button type="button" onClick={() => void carregarCotacoes()} className={btnPrimary}>
              <Search className="h-4 w-4" />
              Buscar
            </button>
            <button type="button" onClick={limparFiltros} className={btnSecondary} disabled={!hasFilters}>
              <Filter className="h-4 w-4" />
              Limpar
            </button>
          </div>
        </div>
      </FiltersBar>

      {activeFilterChips.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {activeFilterChips.map((chip) => (
            <span key={chip.key} className="inline-flex items-center gap-2 rounded-full border border-[#CDE6DF] bg-[#ECF7F3] px-3 py-1 text-xs font-medium text-[#0F7B7D]">
              {chip.label}
              <button type="button" onClick={chip.onRemove} className="inline-flex h-4 w-4 items-center justify-center rounded-full hover:bg-[#D9EFE8]" aria-label={`Remover filtro ${chip.key}`}>
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {cotacoesSelecionadas.length > 0 && (
        <SectionCard className="p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="inline-flex items-center gap-2 rounded-full border border-[#CDE6DF] bg-[#ECF7F3] px-3 py-1 font-semibold text-[#0F7B7D]">
                <CheckCircle className="h-4 w-4" />
                {cotacoesSelecionadas.length} selecionada{cotacoesSelecionadas.length === 1 ? '' : 's'}
              </span>
              <button type="button" onClick={deselecionarTodos} className={btnSecondary}>
                <X className="h-4 w-4" />
                Limpar selecao
              </button>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {canUpdateCotacao && (
                <>
                  <button type="button" onClick={() => void alterarStatusSelecionadas(StatusCotacao.APROVADA)} className={btnPrimary}><Check className="h-4 w-4" />Aprovar</button>
                  <button type="button" onClick={() => void alterarStatusSelecionadas(StatusCotacao.REJEITADA)} className={btnSecondary}><X className="h-4 w-4" />Rejeitar</button>
                </>
              )}
              <button type="button" onClick={exportarSelecionadas} className={btnSecondary}><Download className="h-4 w-4" />Exportar</button>
              {canDeleteCotacao && (
                <button type="button" onClick={() => void excluirSelecionadas()} className={btnDanger}><Trash2 className="h-4 w-4" />Excluir</button>
              )}
            </div>
          </div>
        </SectionCard>
      )}

      {carregando && <LoadingSkeleton lines={8} />}

      {!carregando && erroCarregamento && (
        <EmptyState
          icon={<AlertCircle className="h-5 w-5" />}
          title="Falha ao carregar cotacoes"
          description={erroCarregamento}
          action={
            <button type="button" onClick={() => void carregarCotacoes()} className={btnPrimary}>
              <RefreshCw className="h-4 w-4" />
              Tentar novamente
            </button>
          }
        />
      )}

      {!carregando && !erroCarregamento && cotacoes.length === 0 && (
        <EmptyState
          icon={<FileText className="h-5 w-5" />}
          title={hasFilters ? 'Nenhuma cotacao encontrada' : 'Nenhuma cotacao cadastrada'}
          description={
            hasFilters
              ? 'Ajuste ou limpe os filtros para visualizar outras cotacoes.'
              : 'Comece criando sua primeira cotacao para acompanhar o fluxo comercial.'
          }
          action={
            hasFilters ? (
              <button type="button" onClick={limparFiltros} className={btnSecondary}>
                <Filter className="h-4 w-4" />
                Limpar filtros
              </button>
            ) : canCreateCotacao ? (
              <button type="button" onClick={abrirModalNovo} className={btnPrimary}>
                <Plus className="h-4 w-4" />
                Criar primeira cotacao
              </button>
            ) : undefined
          }
        />
      )}

      {!carregando && !erroCarregamento && cotacoes.length > 0 && (
        <DataTableCard>
          <div className="flex flex-col gap-3 border-b border-[#E1EAEE] bg-[#F8FBFC] px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <div className="flex flex-wrap items-center gap-3 text-sm text-[#516F7D]">
              <span>{cotacoes.length} registro{cotacoes.length === 1 ? '' : 's'}</span>
              {hasFilters && <span className="rounded-full border border-[#CDE6DF] bg-[#ECF7F3] px-2 py-0.5 text-xs font-medium text-[#0F7B7D]">filtrados</span>}
              {cotacoesSelecionadas.length > 0 && (
                <span className="rounded-full border border-[#CDE6DF] bg-[#ECF7F3] px-2 py-0.5 text-xs font-semibold text-[#0F7B7D]">
                  {cotacoesSelecionadas.length} selecionada{cotacoesSelecionadas.length === 1 ? '' : 's'}
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {cotacoes.length > 1 && !isAllSelected && (
                <button type="button" onClick={selecionarTodos} className={btnSecondary}>
                  <Check className="h-4 w-4" />
                  Selecionar todas
                </button>
              )}
              {cotacoesSelecionadas.length > 0 && (
                <button type="button" onClick={deselecionarTodos} className={btnSecondary}>
                  <X className="h-4 w-4" />
                  Limpar selecao
                </button>
              )}
            </div>
          </div>

          <div className="p-4 lg:hidden">
            <div className="grid grid-cols-1 gap-3">
              {cotacoes.map((cotacao) => (
                <article key={cotacao.id} className="rounded-xl border border-[#DFE9ED] bg-white p-4 shadow-[0_10px_22px_-20px_rgba(15,57,74,0.4)]">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={cotacoesSelecionadas.includes(cotacao.id)}
                          onChange={() => toggleSelecionarCotacao(cotacao.id)}
                          className="h-4 w-4 rounded border-gray-300 text-[#159A9C] focus:ring-[#159A9C]"
                        />
                        <span className="text-sm font-semibold text-[#173A4D]">#{cotacao.numero}</span>
                      </div>
                      <p className="mt-1 truncate text-sm text-[#476776]">{cotacao.titulo}</p>
                    </div>
                    {getStatusBadgeForCotacao(cotacao)}
                  </div>

                  <div className="mt-3 grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
                    <div className="rounded-lg border border-[#EDF3F5] bg-[#FAFCFD] px-3 py-2">
                      <div className="flex items-center gap-2 text-[#5F7B89]"><User className="h-4 w-4" /><span className="text-xs uppercase tracking-wide">Fornecedor</span></div>
                      <p className="mt-1 truncate font-medium text-[#173A4D]">{cotacao.fornecedor?.nome || 'Nao informado'}</p>
                      {cotacao.fornecedor?.email ? <p className="truncate text-xs text-[#64808E]">{cotacao.fornecedor.email}</p> : null}
                    </div>
                    <div className="rounded-lg border border-[#EDF3F5] bg-[#FAFCFD] px-3 py-2">
                      <div className="flex items-center gap-2 text-[#5F7B89]"><DollarSign className="h-4 w-4" /><span className="text-xs uppercase tracking-wide">Valor</span></div>
                      <p className="mt-1 font-semibold text-[#173A4D]">{moneyFmt.format(cotacao.valorTotal || 0)}</p>
                    </div>
                    <div className="rounded-lg border border-[#EDF3F5] bg-[#FAFCFD] px-3 py-2">
                      <div className="flex items-center gap-2 text-[#5F7B89]"><Activity className="h-4 w-4" /><span className="text-xs uppercase tracking-wide">Prioridade</span></div>
                      <div className="mt-1">{getPrioridadeBadge(cotacao.prioridade)}</div>
                    </div>
                    <div className="rounded-lg border border-[#EDF3F5] bg-[#FAFCFD] px-3 py-2">
                      <div className="flex items-center gap-2 text-[#5F7B89]"><Calendar className="h-4 w-4" /><span className="text-xs uppercase tracking-wide">Vencimento</span></div>
                      <p className={`mt-1 font-medium ${isCotacaoVencida(cotacao.dataVencimento, cotacao.status) ? 'text-[#B4233A]' : 'text-[#173A4D]'}`}>
                        {formatDate(cotacao.dataVencimento)}
                      </p>
                      {isCotacaoVencida(cotacao.dataVencimento, cotacao.status) ? <p className="text-xs text-[#B4233A]">Vencida</p> : null}
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-end border-t border-[#EDF3F5] pt-3">
                    {renderRowActions(cotacao)}
                  </div>
                </article>
              ))}
            </div>
          </div>

          <div className="hidden lg:block">
            <div className="max-h-[68vh] overflow-auto">
              <table className="w-full min-w-[980px] border-collapse">
                <thead className="sticky top-0 z-10 bg-white shadow-[0_1px_0_0_#E1EAEE]">
                  <tr>
                    <th className="px-4 py-3 text-left">
                      <input
                        ref={selectAllRef}
                        type="checkbox"
                        checked={isAllSelected}
                        onChange={(e) => (e.target.checked ? selecionarTodos() : deselecionarTodos())}
                        className="h-4 w-4 rounded border-gray-300 text-[#159A9C] focus:ring-[#159A9C]"
                        aria-label="Selecionar todas as cotacoes da lista"
                      />
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#5B7683]">Cotacao</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#5B7683]">Fornecedor</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#5B7683]">Status</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#5B7683]">Prioridade</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#5B7683]">Valor total</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#5B7683]">Vencimento</th>
                    <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-[#5B7683]">Acoes</th>
                  </tr>
                </thead>
                <tbody className="bg-white">
                  {cotacoes.map((cotacao) => (
                    <tr key={cotacao.id} className="border-t border-[#EDF3F5] hover:bg-[#FAFCFD]">
                      <td className="px-4 py-4 align-top">
                        <input
                          type="checkbox"
                          checked={cotacoesSelecionadas.includes(cotacao.id)}
                          onChange={() => toggleSelecionarCotacao(cotacao.id)}
                          className="h-4 w-4 rounded border-gray-300 text-[#159A9C] focus:ring-[#159A9C]"
                          aria-label={`Selecionar cotacao ${cotacao.numero}`}
                        />
                      </td>
                      <td className="px-5 py-4 align-top">
                        <div className="text-sm font-semibold text-[#173A4D]">#{cotacao.numero}</div>
                        <div className="mt-0.5 max-w-[240px] truncate text-sm text-[#64808E]">{cotacao.titulo}</div>
                      </td>
                      <td className="px-5 py-4 align-top">
                        <div className="text-sm font-medium text-[#173A4D]">{cotacao.fornecedor?.nome || 'Fornecedor nao informado'}</div>
                        {cotacao.fornecedor?.email ? <div className="mt-0.5 text-xs text-[#64808E]">{cotacao.fornecedor.email}</div> : null}
                      </td>
                      <td className="px-5 py-4 align-top">{getStatusBadgeForCotacao(cotacao)}</td>
                      <td className="px-5 py-4 align-top">{getPrioridadeBadge(cotacao.prioridade)}</td>
                      <td className="px-5 py-4 align-top text-sm font-semibold text-[#173A4D]">{moneyFmt.format(cotacao.valorTotal || 0)}</td>
                      <td className="px-5 py-4 align-top">
                        {cotacao.dataVencimento ? (
                          <div>
                            <div className={`text-sm ${isCotacaoVencida(cotacao.dataVencimento, cotacao.status) ? 'font-medium text-[#B4233A]' : 'text-[#173A4D]'}`}>
                              {formatDate(cotacao.dataVencimento)}
                            </div>
                            {isCotacaoVencida(cotacao.dataVencimento, cotacao.status) ? <div className="text-xs text-[#B4233A]">Vencida</div> : null}
                          </div>
                        ) : (
                          <span className="text-sm text-[#8AA1AC]">Sem vencimento</span>
                        )}
                      </td>
                      <td className="px-5 py-4 align-top">
                        <div className="flex justify-end">{renderRowActions(cotacao)}</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </DataTableCard>
      )}

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
