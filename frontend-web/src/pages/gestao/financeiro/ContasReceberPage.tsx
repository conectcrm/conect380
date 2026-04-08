import React, { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  DollarSign,
  Filter,
  Loader2,
  Mail,
  RefreshCw,
  Search,
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
import contasReceberService from '../../../services/contasReceberService';
import {
  ContaReceber,
  ResumoContasReceber,
  STATUS_CONTA_RECEBER_LABELS,
  StatusContaReceber,
} from '../../../types/financeiro';

type FiltroStatusContaReceber = 'todos' | StatusContaReceber;

const btnPrimary =
  'inline-flex h-9 items-center gap-2 rounded-lg bg-[#159A9C] px-3 text-sm font-medium text-white transition hover:bg-[#117C7E] disabled:opacity-60 disabled:cursor-not-allowed';
const btnSecondary =
  'inline-flex h-9 items-center gap-2 rounded-lg border border-[#D4E2E7] bg-white px-3 text-sm font-medium text-[#244455] transition hover:bg-[#F6FAFB] disabled:opacity-60 disabled:cursor-not-allowed';

const moneyFmt = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

const resumoInicial: ResumoContasReceber = {
  totalTitulos: 0,
  valorTotal: 0,
  valorRecebido: 0,
  valorEmAberto: 0,
  valorVencido: 0,
  quantidadePendentes: 0,
  quantidadeParciais: 0,
  quantidadeRecebidas: 0,
  quantidadeVencidas: 0,
  quantidadeCanceladas: 0,
  aging: {
    aVencer: 0,
    vencido1a30: 0,
    vencido31a60: 0,
    vencido61mais: 0,
  },
};

const formatDate = (value?: string) => {
  if (!value) return 'N/A';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'N/A';
  return date.toLocaleDateString('pt-BR');
};

const getApiErrorMessage = (error: unknown, fallback: string): string => {
  if (!error || typeof error !== 'object') return fallback;

  const response = (error as { response?: { data?: unknown } }).response;
  const data = response?.data;

  if (typeof data === 'string' && data.trim()) {
    return data.trim();
  }

  if (data && typeof data === 'object') {
    const message = (data as { message?: unknown }).message;

    if (typeof message === 'string' && message.trim()) {
      return message.trim();
    }

    if (Array.isArray(message)) {
      const firstMessage = message.find((item) => typeof item === 'string' && item.trim());
      if (firstMessage) {
        return firstMessage.trim();
      }
    }
  }

  return fallback;
};

const statusBadge = (status: StatusContaReceber) => {
  const tone =
    status === 'recebida'
      ? 'border-[#BEE6CF] bg-[#F1FBF5] text-[#137A42]'
      : status === 'vencida'
        ? 'border-[#F4C7CF] bg-[#FFF4F6] text-[#B4233A]'
        : status === 'parcial'
          ? 'border-[#F9D9AA] bg-[#FFF7EA] text-[#A86400]'
          : status === 'cancelada'
            ? 'border-[#DCE8EC] bg-[#F8FBFC] text-[#476776]'
            : 'border-[#CFE3FA] bg-[#F2F8FF] text-[#1E66B4]';

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${tone}`}
    >
      {STATUS_CONTA_RECEBER_LABELS[status]}
    </span>
  );
};

export default function ContasReceberPage() {
  const [contas, setContas] = useState<ContaReceber[]>([]);
  const [resumo, setResumo] = useState<ResumoContasReceber>(resumoInicial);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const [busca, setBusca] = useState('');
  const [buscaAplicada, setBuscaAplicada] = useState('');
  const [filtroStatus, setFiltroStatus] = useState<FiltroStatusContaReceber>('todos');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [contaRecebimento, setContaRecebimento] = useState<ContaReceber | null>(null);
  const [valorRecebimento, setValorRecebimento] = useState('');
  const [metodoRecebimento, setMetodoRecebimento] = useState('pix');
  const [observacoesRecebimento, setObservacoesRecebimento] = useState('');
  const [salvandoRecebimento, setSalvandoRecebimento] = useState(false);
  const [processandoAcaoId, setProcessandoAcaoId] = useState<number | null>(null);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const hasFilters = buscaAplicada.length > 0 || filtroStatus !== 'todos';

  const carregarDados = async () => {
    try {
      setLoading(true);
      setErro(null);

      const filtros = {
        busca: buscaAplicada || undefined,
        status: filtroStatus === 'todos' ? undefined : [filtroStatus],
        page,
        pageSize,
        sortBy: 'dataVencimento' as const,
        sortOrder: 'ASC' as const,
      };

      const [lista, resumoRecebiveis] = await Promise.all([
        contasReceberService.listar(filtros),
        contasReceberService.obterResumo(filtros),
      ]);

      setContas(Array.isArray(lista.data) ? lista.data : []);
      setTotal(Number(lista.total) || 0);
      setResumo(resumoRecebiveis || resumoInicial);
    } catch (error) {
      const mensagem = getApiErrorMessage(
        error,
        'Nao foi possivel carregar os dados de contas a receber',
      );
      setErro(mensagem);
      setContas([]);
      setResumo(resumoInicial);
      toast.error(mensagem);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void carregarDados();
  }, [buscaAplicada, filtroStatus, page, pageSize]);

  useEffect(() => {
    if (page > totalPages && total > 0) {
      setPage(totalPages);
    }
  }, [page, totalPages, total]);

  const buscar = async () => {
    setPage(1);
    setBuscaAplicada(busca.trim());
  };

  const limparFiltros = async () => {
    setBusca('');
    setBuscaAplicada('');
    setFiltroStatus('todos');
    setPage(1);
  };

  const stats = useMemo(
    () => [
      { label: 'Titulos', value: String(resumo.totalTitulos), tone: 'neutral' as const },
      { label: 'Total', value: moneyFmt.format(resumo.valorTotal), tone: 'neutral' as const },
      {
        label: 'Recebido',
        value: moneyFmt.format(resumo.valorRecebido),
        tone: 'accent' as const,
      },
      {
        label: 'Em aberto',
        value: moneyFmt.format(resumo.valorEmAberto),
        tone: 'warning' as const,
      },
      {
        label: 'Vencido',
        value: moneyFmt.format(resumo.valorVencido),
        tone: 'warning' as const,
      },
    ],
    [resumo],
  );

  const gerarCorrelationId = (prefixo: string, contaId: number) =>
    `${prefixo}:${contaId}:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`;

  const contaPodeSerOperada = (conta: ContaReceber) =>
    conta.status !== 'cancelada' && conta.status !== 'recebida' && conta.valorEmAberto > 0;

  const abrirModalRecebimento = (conta: ContaReceber) => {
    if (!contaPodeSerOperada(conta)) {
      toast.error('Somente titulos pendentes/parciais podem receber baixa manual');
      return;
    }

    setContaRecebimento(conta);
    setValorRecebimento(String(conta.valorEmAberto || 0));
    setMetodoRecebimento('pix');
    setObservacoesRecebimento('');
  };

  const fecharModalRecebimento = () => {
    if (salvandoRecebimento) return;
    setContaRecebimento(null);
    setValorRecebimento('');
    setMetodoRecebimento('pix');
    setObservacoesRecebimento('');
  };

  const confirmarRecebimento = async () => {
    if (!contaRecebimento) return;

    const valor = Number(valorRecebimento.replace(',', '.'));
    if (!Number.isFinite(valor) || valor <= 0) {
      toast.error('Informe um valor de recebimento valido');
      return;
    }

    if (valor > contaRecebimento.valorEmAberto) {
      toast.error('Valor informado excede o saldo em aberto do titulo');
      return;
    }

    try {
      setSalvandoRecebimento(true);
      const correlationId = gerarCorrelationId('recebimento', contaRecebimento.id);
      const origemId = `frontend.contas-receber.registrar-recebimento:${contaRecebimento.id}`;

      const resultado = await contasReceberService.registrarRecebimento(contaRecebimento.id, {
        valor,
        metodoPagamento: metodoRecebimento,
        observacoes: observacoesRecebimento.trim() || undefined,
        correlationId,
        origemId,
      });

      toast.success(`Recebimento registrado (corr: ${resultado.correlationId.slice(-8)})`);
      fecharModalRecebimento();
      await carregarDados();
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Nao foi possivel registrar recebimento'));
    } finally {
      setSalvandoRecebimento(false);
    }
  };

  const reenviarCobranca = async (conta: ContaReceber) => {
    if (!contaPodeSerOperada(conta)) {
      toast.error('Somente titulos em aberto podem receber reenvio de cobranca');
      return;
    }

    try {
      setProcessandoAcaoId(conta.id);
      const correlationId = gerarCorrelationId('reenvio', conta.id);
      const origemId = `frontend.contas-receber.reenviar-cobranca:${conta.id}`;
      const resultado = await contasReceberService.reenviarCobranca(conta.id, {
        correlationId,
        origemId,
      });

      if (resultado.simulado) {
        toast.success(`Cobranca reenviada em modo simulado (corr: ${resultado.correlationId.slice(-8)})`);
      } else {
        toast.success(`Cobranca reenviada (corr: ${resultado.correlationId.slice(-8)})`);
      }
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Nao foi possivel reenviar cobranca'));
    } finally {
      setProcessandoAcaoId(null);
    }
  };

  return (
    <div className="space-y-5">
      <SectionCard className="space-y-4 p-5">
        <PageHeader
          title="Contas a Receber"
          description="Acompanhe recebiveis, inadimplencia e aging com base no faturamento da empresa."
          actions={
            <button type="button" onClick={() => void carregarDados()} className={btnSecondary}>
              <RefreshCw className="h-4 w-4" />
              Atualizar
            </button>
          }
        />

        {!loading && !erro ? <InlineStats stats={stats} /> : null}
      </SectionCard>

      <FiltersBar className="p-4">
        <div className="flex w-full flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end">
          <div className="w-full sm:min-w-[300px] sm:flex-1">
            <label className="mb-2 block text-sm font-medium text-[#385A6A]">Buscar recebiveis</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9AAEB8]" />
              <input
                type="text"
                value={busca}
                onChange={(event) => setBusca(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    void buscar();
                  }
                }}
                placeholder="Numero da fatura, descricao ou cliente..."
                className="h-10 w-full rounded-xl border border-[#D4E2E7] bg-white pl-10 pr-3 text-sm text-[#244455] outline-none transition focus:border-[#1A9E87]/45 focus:ring-2 focus:ring-[#1A9E87]/15"
              />
            </div>
          </div>

          <div className="w-full sm:w-auto">
            <label className="mb-2 block text-sm font-medium text-[#385A6A]">Status</label>
            <select
              value={filtroStatus}
              onChange={(event) => {
                setPage(1);
                setFiltroStatus(event.target.value as FiltroStatusContaReceber);
              }}
              className="h-10 w-full rounded-xl border border-[#D4E2E7] bg-white px-3 text-sm text-[#244455] outline-none transition focus:border-[#1A9E87]/45 focus:ring-2 focus:ring-[#1A9E87]/15 sm:w-[170px]"
            >
              <option value="todos">Todos</option>
              <option value="pendente">Pendentes</option>
              <option value="parcial">Parciais</option>
              <option value="recebida">Recebidas</option>
              <option value="vencida">Vencidas</option>
              <option value="cancelada">Canceladas</option>
            </select>
          </div>

          <div className="w-full sm:w-auto">
            <label className="mb-2 block text-sm font-medium text-[#385A6A]">Itens por pagina</label>
            <select
              value={String(pageSize)}
              onChange={(event) => {
                setPage(1);
                setPageSize(Number(event.target.value));
              }}
              className="h-10 w-full rounded-xl border border-[#D4E2E7] bg-white px-3 text-sm text-[#244455] outline-none transition focus:border-[#1A9E87]/45 focus:ring-2 focus:ring-[#1A9E87]/15 sm:w-[130px]"
            >
              <option value="10">10</option>
              <option value="20">20</option>
              <option value="50">50</option>
            </select>
          </div>

          <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
            <button type="button" onClick={() => void buscar()} className={btnPrimary}>
              <Search className="h-4 w-4" />
              Buscar
            </button>
            <button
              type="button"
              onClick={() => void limparFiltros()}
              className={btnSecondary}
              disabled={!hasFilters}
            >
              <Filter className="h-4 w-4" />
              Limpar
            </button>
          </div>
        </div>
      </FiltersBar>

      {loading ? <LoadingSkeleton lines={8} /> : null}

      {!loading && erro ? (
        <EmptyState
          icon={<AlertCircle className="h-5 w-5" />}
          title="Erro ao carregar contas a receber"
          description={erro}
          action={
            <button type="button" onClick={() => void carregarDados()} className={btnPrimary}>
              <RefreshCw className="h-4 w-4" />
              Tentar novamente
            </button>
          }
        />
      ) : null}

      {!loading && !erro && total === 0 ? (
        <EmptyState
          icon={<DollarSign className="h-5 w-5" />}
          title={hasFilters ? 'Nenhum titulo encontrado' : 'Nenhum titulo em contas a receber'}
          description={
            hasFilters
              ? 'Ajuste os filtros para visualizar outros recebiveis.'
              : 'Assim que houver faturamento, os titulos aparecerao aqui para acompanhamento.'
          }
          action={
            hasFilters ? (
              <button type="button" onClick={() => void limparFiltros()} className={btnSecondary}>
                <Filter className="h-4 w-4" />
                Limpar filtros
              </button>
            ) : undefined
          }
        />
      ) : null}

      {!loading && !erro && contas.length > 0 ? (
        <DataTableCard>
          <div className="flex flex-col gap-3 border-b border-[#E1EAEE] bg-[#F8FBFC] px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <div className="flex flex-wrap items-center gap-2 text-sm text-[#516F7D]">
              <span>{total} registro(s)</span>
              {hasFilters ? (
                <span className="rounded-full border border-[#CDE6DF] bg-[#ECF7F3] px-2 py-0.5 text-xs font-medium text-[#0F7B7D]">
                  filtros ativos
                </span>
              ) : null}
            </div>
            <div className="text-xs text-[#5F7B89]">
              Pagina {page} de {totalPages}
            </div>
          </div>

          <div className="p-4 lg:hidden">
            <div className="grid grid-cols-1 gap-3">
              {contas.map((conta) => (
                <article
                  key={conta.id}
                  className="rounded-xl border border-[#DFE9ED] bg-white p-4 shadow-[0_10px_22px_-20px_rgba(15,57,74,0.4)]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-[#173A4D]">
                        {conta.numero || 'Sem numero'}
                      </p>
                      <p className="mt-1 text-xs text-[#64808E]">{conta.descricao || 'Sem descricao'}</p>
                    </div>
                    {statusBadge(conta.status)}
                  </div>

                  <div className="mt-3 space-y-2 text-xs text-[#5F7B89]">
                    <p>
                      <strong className="text-[#173A4D]">Cliente:</strong> {conta.clienteNome}
                    </p>
                    <p>
                      <strong className="text-[#173A4D]">Vencimento:</strong> {formatDate(conta.dataVencimento)}
                    </p>
                  </div>

                  <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <p className="text-[#6F8896]">Total</p>
                      <p className="font-semibold text-[#173A4D]">{moneyFmt.format(conta.valorTotal || 0)}</p>
                    </div>
                    <div>
                      <p className="text-[#6F8896]">Recebido</p>
                      <p className="font-semibold text-[#137A42]">{moneyFmt.format(conta.valorPago || 0)}</p>
                    </div>
                    <div>
                      <p className="text-[#6F8896]">Aberto</p>
                      <p className="font-semibold text-[#A86400]">{moneyFmt.format(conta.valorEmAberto || 0)}</p>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => abrirModalRecebimento(conta)}
                      className={btnPrimary}
                      disabled={!contaPodeSerOperada(conta) || processandoAcaoId === conta.id}
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      Registrar recebimento
                    </button>
                    <button
                      type="button"
                      onClick={() => void reenviarCobranca(conta)}
                      className={btnSecondary}
                      disabled={!contaPodeSerOperada(conta) || processandoAcaoId === conta.id}
                    >
                      {processandoAcaoId === conta.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Mail className="h-4 w-4" />
                      )}
                      Reenviar cobranca
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </div>

          <div className="hidden lg:block">
            <div className="max-h-[70vh] overflow-auto">
              <table className="w-full min-w-[1080px] border-collapse">
                <thead className="sticky top-0 z-10 bg-white shadow-[0_1px_0_0_#E1EAEE]">
                  <tr>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#5B7683]">
                      Titulo
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#5B7683]">
                      Cliente
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#5B7683]">
                      Vencimento
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#5B7683]">
                      Status
                    </th>
                    <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-[#5B7683]">
                      Total
                    </th>
                    <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-[#5B7683]">
                      Recebido
                    </th>
                    <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-[#5B7683]">
                      Em aberto
                    </th>
                    <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-[#5B7683]">
                      Dias atraso
                    </th>
                    <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-[#5B7683]">
                      Acoes
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white">
                  {contas.map((conta) => (
                    <tr key={conta.id} className="border-t border-[#EDF3F5] hover:bg-[#FAFCFD]">
                      <td className="px-5 py-4 align-top">
                        <p className="text-sm font-semibold text-[#173A4D]">{conta.numero || '-'}</p>
                        <p className="mt-0.5 max-w-[280px] truncate text-xs text-[#64808E]">
                          {conta.descricao || 'Sem descricao'}
                        </p>
                      </td>
                      <td className="px-5 py-4 align-top">
                        <p className="text-sm text-[#173A4D]">{conta.clienteNome}</p>
                        {conta.clienteEmail ? (
                          <p className="mt-0.5 max-w-[220px] truncate text-xs text-[#64808E]">
                            {conta.clienteEmail}
                          </p>
                        ) : null}
                      </td>
                      <td className="px-5 py-4 align-top text-sm text-[#173A4D]">
                        <div className="inline-flex items-center gap-1.5">
                          <Calendar className="h-4 w-4 text-[#7C97A4]" />
                          {formatDate(conta.dataVencimento)}
                        </div>
                      </td>
                      <td className="px-5 py-4 align-top">{statusBadge(conta.status)}</td>
                      <td className="px-5 py-4 text-right align-top text-sm font-semibold text-[#173A4D]">
                        {moneyFmt.format(conta.valorTotal || 0)}
                      </td>
                      <td className="px-5 py-4 text-right align-top text-sm font-semibold text-[#137A42]">
                        {moneyFmt.format(conta.valorPago || 0)}
                      </td>
                      <td className="px-5 py-4 text-right align-top text-sm font-semibold text-[#A86400]">
                        {moneyFmt.format(conta.valorEmAberto || 0)}
                      </td>
                      <td className="px-5 py-4 text-right align-top text-sm text-[#476776]">
                        {conta.diasAtraso > 0 ? conta.diasAtraso : '-'}
                      </td>
                      <td className="px-5 py-4 align-top">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => abrirModalRecebimento(conta)}
                            className={btnPrimary}
                            disabled={!contaPodeSerOperada(conta) || processandoAcaoId === conta.id}
                          >
                            <CheckCircle2 className="h-4 w-4" />
                            Receber
                          </button>
                          <button
                            type="button"
                            onClick={() => void reenviarCobranca(conta)}
                            className={btnSecondary}
                            disabled={!contaPodeSerOperada(conta) || processandoAcaoId === conta.id}
                          >
                            {processandoAcaoId === conta.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Mail className="h-4 w-4" />
                            )}
                            Cobranca
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex flex-col items-stretch justify-between gap-3 border-t border-[#E1EAEE] bg-[#FBFDFE] px-4 py-3 sm:flex-row sm:items-center sm:px-5">
            <div className="text-xs text-[#5F7B89]">
              Exibindo {contas.length} de {total} titulo(s)
            </div>
            <div className="flex items-center gap-2 self-end sm:self-auto">
              <button
                type="button"
                onClick={() => setPage((current) => Math.max(current - 1, 1))}
                disabled={page <= 1}
                className={btnSecondary}
              >
                <ChevronLeft className="h-4 w-4" />
                Anterior
              </button>
              <span className="rounded-lg border border-[#D4E2E7] bg-white px-3 py-2 text-sm text-[#244455]">
                {page}/{totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage((current) => Math.min(current + 1, totalPages))}
                disabled={page >= totalPages}
                className={btnSecondary}
              >
                Proxima
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </DataTableCard>
      ) : null}

      {contaRecebimento ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B2533]/45 px-4">
          <div className="w-full max-w-xl rounded-2xl border border-[#D7E4E9] bg-white p-5 shadow-[0_28px_60px_-34px_rgba(7,30,43,0.55)]">
            <h3 className="text-lg font-semibold text-[#173A4D]">Registrar recebimento</h3>
            <p className="mt-1 text-sm text-[#5F7B89]">
              Titulo {contaRecebimento.numero || '-'} | Saldo em aberto{' '}
              {moneyFmt.format(contaRecebimento.valorEmAberto || 0)}
            </p>

            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="mb-1 block text-sm font-medium text-[#385A6A]">Valor recebido</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={valorRecebimento}
                  onChange={(event) => setValorRecebimento(event.target.value)}
                  className="h-10 w-full rounded-xl border border-[#D4E2E7] bg-white px-3 text-sm text-[#244455] outline-none transition focus:border-[#1A9E87]/45 focus:ring-2 focus:ring-[#1A9E87]/15"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-[#385A6A]">Metodo</label>
                <select
                  value={metodoRecebimento}
                  onChange={(event) => setMetodoRecebimento(event.target.value)}
                  className="h-10 w-full rounded-xl border border-[#D4E2E7] bg-white px-3 text-sm text-[#244455] outline-none transition focus:border-[#1A9E87]/45 focus:ring-2 focus:ring-[#1A9E87]/15"
                >
                  <option value="pix">PIX</option>
                  <option value="transferencia">Transferencia</option>
                  <option value="boleto">Boleto</option>
                  <option value="cartao_credito">Cartao de credito</option>
                  <option value="cartao_debito">Cartao de debito</option>
                  <option value="dinheiro">Dinheiro</option>
                  <option value="a_combinar">A combinar</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="mb-1 block text-sm font-medium text-[#385A6A]">
                  Observacoes (opcional)
                </label>
                <textarea
                  value={observacoesRecebimento}
                  onChange={(event) => setObservacoesRecebimento(event.target.value)}
                  rows={3}
                  className="w-full rounded-xl border border-[#D4E2E7] bg-white px-3 py-2 text-sm text-[#244455] outline-none transition focus:border-[#1A9E87]/45 focus:ring-2 focus:ring-[#1A9E87]/15"
                  placeholder="Ex.: comprovante validado e baixa autorizada"
                />
              </div>
            </div>

            <div className="mt-5 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={fecharModalRecebimento}
                className={btnSecondary}
                disabled={salvandoRecebimento}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => void confirmarRecebimento()}
                className={btnPrimary}
                disabled={salvandoRecebimento}
              >
                {salvandoRecebimento ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-4 w-4" />
                )}
                Confirmar recebimento
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {!loading && !erro && contas.length === 0 && total > 0 ? (
        <EmptyState
          icon={<Search className="h-5 w-5" />}
          title="Nenhum titulo encontrado nesta pagina"
          description="Volte para a pagina anterior ou ajuste os filtros aplicados."
          action={
            <button type="button" onClick={() => setPage(1)} className={btnSecondary}>
              <Filter className="h-4 w-4" />
              Ir para primeira pagina
            </button>
          }
        />
      ) : null}
    </div>
  );
}
