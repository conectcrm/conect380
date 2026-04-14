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
  Plus,
  RefreshCw,
  Search,
} from 'lucide-react';
import {
  DataTableCard,
  EmptyState,
  LoadingSkeleton,
  PageHeader,
  SectionCard,
} from '../../../components/layout-v2';
import ClienteSelect, { ClienteSelectValue } from '../../../components/selects/ClienteSelect';
import { useAuth } from '../../../hooks/useAuth';
import contasReceberService from '../../../services/contasReceberService';
import {
  ContaReceber,
  ORIGEM_CONTA_RECEBER_LABELS,
  OrigemContaReceber,
  ResumoContasReceber,
  STATUS_CONTA_RECEBER_LABELS,
  StatusContaReceber,
  TIPO_LANCAMENTO_AVULSO_LABELS,
  TipoLancamentoAvulsoContaReceber,
} from '../../../types/financeiro';

type FiltroStatusContaReceber = 'todos' | StatusContaReceber;
type FiltroOrigemContaReceber = 'todas' | OrigemContaReceber;

const btnPrimary =
  'inline-flex h-9 items-center gap-2 rounded-lg bg-[#159A9C] px-3 text-sm font-medium text-white transition hover:bg-[#117C7E] disabled:opacity-60 disabled:cursor-not-allowed';
const btnSecondary =
  'inline-flex h-9 items-center gap-2 rounded-lg border border-[#D4E2E7] bg-white px-3 text-sm font-medium text-[#244455] transition hover:bg-[#F6FAFB] disabled:opacity-60 disabled:cursor-not-allowed';

const moneyFmt = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const percentFmt = new Intl.NumberFormat('pt-BR', {
  style: 'percent',
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

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

const origemBadge = (origem: OrigemContaReceber) => {
  const tone =
    origem === 'avulso'
      ? 'border-[#F9D9AA] bg-[#FFF7EA] text-[#A86400]'
      : 'border-[#CFE3FA] bg-[#F2F8FF] text-[#1E66B4]';

  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold ${tone}`}>
      {ORIGEM_CONTA_RECEBER_LABELS[origem]}
    </span>
  );
};

export default function ContasReceberPage() {
  const { user } = useAuth();
  const [contas, setContas] = useState<ContaReceber[]>([]);
  const [resumo, setResumo] = useState<ResumoContasReceber>(resumoInicial);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const [busca, setBusca] = useState('');
  const [buscaAplicada, setBuscaAplicada] = useState('');
  const [filtroStatus, setFiltroStatus] = useState<FiltroStatusContaReceber>('todos');
  const [filtroOrigem, setFiltroOrigem] = useState<FiltroOrigemContaReceber>('todas');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [contaRecebimento, setContaRecebimento] = useState<ContaReceber | null>(null);
  const [valorRecebimento, setValorRecebimento] = useState('');
  const [metodoRecebimento, setMetodoRecebimento] = useState('pix');
  const [observacoesRecebimento, setObservacoesRecebimento] = useState('');
  const [salvandoRecebimento, setSalvandoRecebimento] = useState(false);
  const [processandoAcaoId, setProcessandoAcaoId] = useState<number | null>(null);
  const [modalAvulsoAberto, setModalAvulsoAberto] = useState(false);
  const [clienteAvulso, setClienteAvulso] = useState<ClienteSelectValue | null>(null);
  const [descricaoAvulso, setDescricaoAvulso] = useState('');
  const [valorAvulso, setValorAvulso] = useState('');
  const [vencimentoAvulso, setVencimentoAvulso] = useState('');
  const [tipoLancamentoAvulso, setTipoLancamentoAvulso] =
    useState<TipoLancamentoAvulsoContaReceber>('servico_avulso');
  const [formaPagamentoAvulso, setFormaPagamentoAvulso] = useState('a_combinar');
  const [observacoesAvulso, setObservacoesAvulso] = useState('');
  const [salvandoAvulso, setSalvandoAvulso] = useState(false);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const hasFilters =
    buscaAplicada.length > 0 || filtroStatus !== 'todos' || filtroOrigem !== 'todas';

  const carregarDados = async () => {
    try {
      setLoading(true);
      setErro(null);

      const filtros = {
        busca: buscaAplicada || undefined,
        status: filtroStatus === 'todos' ? undefined : [filtroStatus],
        origem: filtroOrigem === 'todas' ? undefined : [filtroOrigem],
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
        'Não foi possível carregar os dados de contas a receber',
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
  }, [buscaAplicada, filtroStatus, filtroOrigem, page, pageSize]);

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
    setFiltroOrigem('todas');
    setPage(1);
  };

  const aplicarFiltroStatus = (status: FiltroStatusContaReceber) => {
    setPage(1);
    setFiltroStatus(status);
  };

  const aplicarFiltroOrigem = (origem: FiltroOrigemContaReceber) => {
    setPage(1);
    setFiltroOrigem(origem);
  };

  const taxaRecebimento = resumo.valorTotal > 0 ? resumo.valorRecebido / resumo.valorTotal : 0;
  const indiceInadimplencia = resumo.valorEmAberto > 0 ? resumo.valorVencido / resumo.valorEmAberto : 0;

  const painelMetricas = useMemo(
    () => [
      {
        label: 'Carteira total',
        value: moneyFmt.format(resumo.valorTotal),
        highlightClass: 'text-[#173A4D]',
        hint: `${resumo.totalTitulos} título(s)`,
      },
      {
        label: 'Recebido',
        value: moneyFmt.format(resumo.valorRecebido),
        highlightClass: 'text-[#137A42]',
        hint: `Taxa ${percentFmt.format(taxaRecebimento)}`,
      },
      {
        label: 'Em aberto',
        value: moneyFmt.format(resumo.valorEmAberto),
        highlightClass: 'text-[#A86400]',
        hint: `${resumo.quantidadePendentes + resumo.quantidadeParciais} em acompanhamento`,
      },
      {
        label: 'Inadimplência',
        value: percentFmt.format(indiceInadimplencia),
        highlightClass: 'text-[#B4233A]',
        hint: `Vencido ${moneyFmt.format(resumo.valorVencido)}`,
      },
    ],
    [
      indiceInadimplencia,
      resumo.quantidadeParciais,
      resumo.quantidadePendentes,
      resumo.totalTitulos,
      resumo.valorEmAberto,
      resumo.valorRecebido,
      resumo.valorTotal,
      resumo.valorVencido,
      taxaRecebimento,
    ],
  );

  const quickStatusFilters = useMemo(
    () => [
      { key: 'todos' as const, label: 'Todos', count: resumo.totalTitulos },
      { key: 'pendente' as const, label: 'Pendentes', count: resumo.quantidadePendentes },
      { key: 'parcial' as const, label: 'Parciais', count: resumo.quantidadeParciais },
      { key: 'vencida' as const, label: 'Vencidas', count: resumo.quantidadeVencidas },
      { key: 'recebida' as const, label: 'Recebidas', count: resumo.quantidadeRecebidas },
      { key: 'cancelada' as const, label: 'Canceladas', count: resumo.quantidadeCanceladas },
    ],
    [resumo],
  );

  const quickOriginFilters = useMemo(
    () => [
      { key: 'todas' as const, label: 'Todas as origens' },
      { key: 'faturamento' as const, label: ORIGEM_CONTA_RECEBER_LABELS.faturamento },
      { key: 'avulso' as const, label: ORIGEM_CONTA_RECEBER_LABELS.avulso },
    ],
    [],
  );

  const gerarCorrelationId = (prefixo: string, contaId: number) =>
    `${prefixo}:${contaId}:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`;

  const gerarCorrelationIdAvulso = (prefixo: string) =>
    `${prefixo}:avulso:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`;

  const contaPodeSerOperada = (conta: ContaReceber) =>
    conta.status !== 'cancelada' && conta.status !== 'recebida' && conta.valorEmAberto > 0;

  const abrirModalAvulso = () => {
    setModalAvulsoAberto(true);
    setClienteAvulso(null);
    setDescricaoAvulso('');
    setValorAvulso('');
    setVencimentoAvulso(new Date().toISOString().slice(0, 10));
    setTipoLancamentoAvulso('servico_avulso');
    setFormaPagamentoAvulso('a_combinar');
    setObservacoesAvulso('');
  };

  const fecharModalAvulso = () => {
    if (salvandoAvulso) return;
    setModalAvulsoAberto(false);
  };

  const confirmarLancamentoAvulso = async () => {
    const clienteId = String(clienteAvulso?.id || '').trim();
    const descricao = descricaoAvulso.trim();
    const valor = Number(valorAvulso.replace(',', '.'));
    const dataVencimento = String(vencimentoAvulso || '').trim();

    if (!clienteId) {
      toast.error('Selecione o cliente para o lancamento avulso');
      return;
    }

    if (!descricao) {
      toast.error('Informe a descricao do lancamento avulso');
      return;
    }

    if (!Number.isFinite(valor) || valor <= 0) {
      toast.error('Informe um valor valido para o lancamento avulso');
      return;
    }

    if (!dataVencimento) {
      toast.error('Informe a data de vencimento do lancamento avulso');
      return;
    }

    try {
      setSalvandoAvulso(true);

      const correlationId = gerarCorrelationIdAvulso('criacao');
      const origemId = `frontend.contas-receber.avulso.criar:${clienteId}`;
      const usuarioResponsavelId = String(user?.id || '').trim() || undefined;

      const result = await contasReceberService.criarLancamentoAvulso({
        clienteId,
        usuarioResponsavelId,
        dataVencimento,
        descricao,
        valor,
        tipoLancamentoAvulso,
        formaPagamentoPreferida: formaPagamentoAvulso,
        observacoes: observacoesAvulso.trim() || undefined,
        correlationId,
        origemId,
      });

      toast.success(`Lancamento avulso criado (corr: ${result.correlationId.slice(-8)})`);
      setModalAvulsoAberto(false);
      await carregarDados();
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Nao foi possivel criar o lancamento avulso'));
    } finally {
      setSalvandoAvulso(false);
    }
  };

  const abrirModalRecebimento = (conta: ContaReceber) => {
    if (!contaPodeSerOperada(conta)) {
      toast.error('Somente títulos pendentes/parciais podem receber baixa manual');
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
      toast.error('Informe um valor de recebimento válido');
      return;
    }

    if (valor > contaRecebimento.valorEmAberto) {
      toast.error('Valor informado excede o saldo em aberto do título');
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
      toast.error(getApiErrorMessage(error, 'Não foi possível registrar recebimento'));
    } finally {
      setSalvandoRecebimento(false);
    }
  };

  const reenviarCobranca = async (conta: ContaReceber) => {
    if (!contaPodeSerOperada(conta)) {
      toast.error('Somente títulos em aberto podem receber reenvio de cobrança');
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
        toast.success(`Cobrança reenviada em modo simulado (corr: ${resultado.correlationId.slice(-8)})`);
      } else {
        toast.success(`Cobrança reenviada (corr: ${resultado.correlationId.slice(-8)})`);
      }
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Não foi possível reenviar cobrança'));
    } finally {
      setProcessandoAcaoId(null);
    }
  };

  return (
    <div className="space-y-5">
      <SectionCard className="space-y-[18px] border-[#CBDAE2] bg-gradient-to-br from-white via-white to-[#F3FAF8] shadow-[0_24px_46px_-34px_rgba(16,57,74,0.38)] p-5">
        <PageHeader
          eyebrow={
            <span className="inline-flex items-center rounded-full border border-[#BFD9E2] bg-[#EFF8FB] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#3F6A7C]">
              Núcleo Financeiro
            </span>
          }
          title={
            <span className="text-[27px] font-bold leading-[1.03] tracking-[-0.018em] text-[#002333] sm:text-[28px]">
              Contas a <span className="text-[#0F7B7D]">Receber</span>
            </span>
          }
          titleClassName="leading-none sm:inline-flex sm:items-center"
          description="Monitore recebiveis de faturamento e lancamentos avulsos com controle de inadimplencia."
          descriptionClassName="max-w-[64ch] text-[12px] leading-[1.4] text-[#5B7A89] sm:border-l sm:border-[#D7E5EC] sm:pl-3 sm:text-[13px]"
          inlineDescriptionOnDesktop
          actions={
            <div className="flex flex-wrap items-center gap-2">
              <button type="button" onClick={() => abrirModalAvulso()} className={btnPrimary}>
                <Plus className="h-4 w-4" />
                Nova Conta
              </button>
              <button type="button" onClick={() => void carregarDados()} className={btnSecondary}>
                <RefreshCw className="h-4 w-4" />
                Atualizar
              </button>
            </div>
          }
        />

        {!loading && !erro ? (
          <>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
              {painelMetricas.map((item) => (
                <div
                  key={item.label}
                  className="rounded-xl border border-[#D2E1E8] bg-white px-4 py-3"
                >
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-[#5F7B89]">
                    {item.label}
                  </p>
                  <p className={`mt-1 text-lg font-semibold ${item.highlightClass}`}>{item.value}</p>
                  <p className="mt-1 text-xs text-[#688390]">{item.hint}</p>
                </div>
              ))}
            </div>

            <div className="space-y-4 rounded-2xl border border-[#D4E1E8] bg-gradient-to-br from-[#F7FBFD] to-[#F1F7FA] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)]">
              <div className="grid grid-cols-1 gap-3 xl:grid-cols-[minmax(0,1fr)_220px_130px_auto]">
                <div>
                  <label className="mb-2 block text-sm font-medium text-[#385A6A]">Buscar recebíveis</label>
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
                      placeholder="Número da fatura, descrição ou cliente..."
                      className="h-10 w-full rounded-xl border border-[#D4E2E7] bg-white pl-10 pr-3 text-sm text-[#244455] outline-none transition focus:border-[#1A9E87]/45 focus:ring-2 focus:ring-[#1A9E87]/15"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-[#385A6A]">Origem</label>
                  <select
                    value={filtroOrigem}
                    onChange={(event) =>
                      aplicarFiltroOrigem(event.target.value as FiltroOrigemContaReceber)
                    }
                    className="h-10 w-full rounded-xl border border-[#D4E2E7] bg-white px-3 text-sm text-[#244455] outline-none transition focus:border-[#1A9E87]/45 focus:ring-2 focus:ring-[#1A9E87]/15"
                  >
                    {quickOriginFilters.map((item) => (
                      <option key={item.key} value={item.key}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-[#385A6A]">Itens por página</label>
                  <select
                    value={String(pageSize)}
                    onChange={(event) => {
                      setPage(1);
                      setPageSize(Number(event.target.value));
                    }}
                    className="h-10 w-full rounded-xl border border-[#D4E2E7] bg-white px-3 text-sm text-[#244455] outline-none transition focus:border-[#1A9E87]/45 focus:ring-2 focus:ring-[#1A9E87]/15"
                  >
                    <option value="10">10</option>
                    <option value="20">20</option>
                    <option value="50">50</option>
                  </select>
                </div>

                <div className="flex items-end gap-2">
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

              <div className="border-t border-[#DCE7EC] pt-3">
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    {quickStatusFilters.map((item) => {
                      const ativo = filtroStatus === item.key;
                      return (
                        <button
                          key={item.key}
                          type="button"
                          onClick={() => aplicarFiltroStatus(item.key)}
                          className={`inline-flex h-8 items-center gap-2 rounded-full border px-3 text-xs font-semibold transition ${
                            ativo
                              ? 'border-[#159A9C] bg-[#EAF8F8] text-[#0F7B7D]'
                              : 'border-[#D4E2E7] bg-white text-[#2F4D5C] hover:border-[#159A9C]/45 hover:bg-[#F4FAFB]'
                          }`}
                        >
                          <span>{item.label}</span>
                          <span className="rounded-full bg-white/80 px-1.5 py-0.5 text-[11px] text-[#355563]">
                            {item.count}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                </div>
              </div>
            </div>
          </>
        ) : null}
      </SectionCard>

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
          title={hasFilters ? 'Nenhum título encontrado' : 'Nenhum título em contas a receber'}
          description={
            hasFilters
              ? 'Ajuste os filtros para visualizar outros recebíveis.'
              : 'Assim que houver faturamento ou lancamentos avulsos, os titulos aparecerao aqui para acompanhamento.'
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
        <DataTableCard className="border-[#CBDCE4] bg-white shadow-[0_22px_40px_-32px_rgba(16,57,74,0.34)]">
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
              Página {page} de {totalPages}
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
                        {conta.numero || 'Sem número'}
                      </p>
                      <p className="mt-1 text-xs text-[#64808E]">{conta.descricao || 'Sem descrição'}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      {statusBadge(conta.status)}
                      {origemBadge(conta.origemTitulo)}
                    </div>
                  </div>

                  <div className="mt-3 space-y-2 text-xs text-[#5F7B89]">
                    <p>
                      <strong className="text-[#173A4D]">Cliente:</strong> {conta.clienteNome}
                    </p>
                    {conta.origemTitulo === 'avulso' && conta.tipoLancamentoAvulso ? (
                      <p>
                        <strong className="text-[#173A4D]">Tipo:</strong>{' '}
                        {TIPO_LANCAMENTO_AVULSO_LABELS[conta.tipoLancamentoAvulso]}
                      </p>
                    ) : null}
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
                      Reenviar cobrança
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </div>

          <div className="hidden lg:block">
            <div className="max-h-[70vh] overflow-auto">
              <table className="w-full min-w-[900px] border-collapse">
                <thead className="sticky top-0 z-10 bg-white shadow-[0_1px_0_0_#E1EAEE]">
                  <tr>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#5B7683]">
                      Título
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
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#5B7683]">
                      Origem
                    </th>
                    <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-[#5B7683]">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white">
                  {contas.map((conta) => (
                    <tr key={conta.id} className="border-t border-[#EDF3F5] hover:bg-[#FAFCFD]">
                      <td className="px-5 py-4 align-top">
                        <p className="text-sm font-semibold text-[#173A4D]">{conta.numero || '-'}</p>
                        <p className="mt-0.5 max-w-[280px] truncate text-xs text-[#64808E]">
                          {conta.descricao || 'Sem descrição'}
                        </p>
                        {conta.origemTitulo === 'avulso' && conta.tipoLancamentoAvulso ? (
                          <p className="mt-1 text-xs text-[#5F7B89]">
                            Tipo: {TIPO_LANCAMENTO_AVULSO_LABELS[conta.tipoLancamentoAvulso]}
                          </p>
                        ) : null}
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
                        <p
                          className={`mt-1 text-xs ${
                            conta.diasAtraso > 0 ? 'font-semibold text-[#B4233A]' : 'text-[#64808E]'
                          }`}
                        >
                          {conta.diasAtraso > 0 ? `${conta.diasAtraso} dia(s) em atraso` : 'Sem atraso'}
                        </p>
                      </td>
                      <td className="px-5 py-4 align-top">{statusBadge(conta.status)}</td>
                      <td className="px-5 py-4 align-top">{origemBadge(conta.origemTitulo)}</td>
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
                            Reenviar
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
              Exibindo {contas.length} de {total} título(s)
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
                Próxima
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
              Título {contaRecebimento.numero || '-'} | Saldo em aberto{' '}
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
                <label className="mb-1 block text-sm font-medium text-[#385A6A]">Método</label>
                <select
                  value={metodoRecebimento}
                  onChange={(event) => setMetodoRecebimento(event.target.value)}
                  className="h-10 w-full rounded-xl border border-[#D4E2E7] bg-white px-3 text-sm text-[#244455] outline-none transition focus:border-[#1A9E87]/45 focus:ring-2 focus:ring-[#1A9E87]/15"
                >
                  <option value="pix">PIX</option>
                  <option value="transferencia">Transferência</option>
                  <option value="boleto">Boleto</option>
                  <option value="cartao_credito">Cartão de crédito</option>
                  <option value="cartao_debito">Cartão de débito</option>
                  <option value="dinheiro">Dinheiro</option>
                  <option value="a_combinar">A combinar</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="mb-1 block text-sm font-medium text-[#385A6A]">
                  Observações (opcional)
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

      {modalAvulsoAberto ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B2533]/45 px-4">
          <div className="w-full max-w-2xl rounded-2xl border border-[#D7E4E9] bg-white p-5 shadow-[0_28px_60px_-34px_rgba(7,30,43,0.55)]">
            <h3 className="text-lg font-semibold text-[#173A4D]">Nova conta avulsa</h3>
            <p className="mt-1 text-sm text-[#5F7B89]">
              Registre recebiveis que nao vieram de venda/renovacao.
            </p>

            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <ClienteSelect
                  value={clienteAvulso}
                  onChange={setClienteAvulso}
                  required
                  label="Cliente"
                  className="w-full"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="mb-1 block text-sm font-medium text-[#385A6A]">Descricao</label>
                <input
                  type="text"
                  value={descricaoAvulso}
                  onChange={(event) => setDescricaoAvulso(event.target.value)}
                  placeholder="Ex.: Reembolso de despesas operacionais"
                  className="h-10 w-full rounded-xl border border-[#D4E2E7] bg-white px-3 text-sm text-[#244455] outline-none transition focus:border-[#1A9E87]/45 focus:ring-2 focus:ring-[#1A9E87]/15"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-[#385A6A]">Valor</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={valorAvulso}
                  onChange={(event) => setValorAvulso(event.target.value)}
                  className="h-10 w-full rounded-xl border border-[#D4E2E7] bg-white px-3 text-sm text-[#244455] outline-none transition focus:border-[#1A9E87]/45 focus:ring-2 focus:ring-[#1A9E87]/15"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-[#385A6A]">Vencimento</label>
                <input
                  type="date"
                  value={vencimentoAvulso}
                  onChange={(event) => setVencimentoAvulso(event.target.value)}
                  className="h-10 w-full rounded-xl border border-[#D4E2E7] bg-white px-3 text-sm text-[#244455] outline-none transition focus:border-[#1A9E87]/45 focus:ring-2 focus:ring-[#1A9E87]/15"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="mb-1 block text-sm font-medium text-[#385A6A]">
                  Tipo de lancamento avulso
                </label>
                <select
                  value={tipoLancamentoAvulso}
                  onChange={(event) =>
                    setTipoLancamentoAvulso(event.target.value as TipoLancamentoAvulsoContaReceber)
                  }
                  className="h-10 w-full rounded-xl border border-[#D4E2E7] bg-white px-3 text-sm text-[#244455] outline-none transition focus:border-[#1A9E87]/45 focus:ring-2 focus:ring-[#1A9E87]/15"
                >
                  <option value="instalacao">{TIPO_LANCAMENTO_AVULSO_LABELS.instalacao}</option>
                  <option value="servico_avulso">{TIPO_LANCAMENTO_AVULSO_LABELS.servico_avulso}</option>
                  <option value="solicitacao_servico">
                    {TIPO_LANCAMENTO_AVULSO_LABELS.solicitacao_servico}
                  </option>
                  <option value="reembolso">{TIPO_LANCAMENTO_AVULSO_LABELS.reembolso}</option>
                  <option value="outro">{TIPO_LANCAMENTO_AVULSO_LABELS.outro}</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="mb-1 block text-sm font-medium text-[#385A6A]">
                  Forma de pagamento preferida
                </label>
                <select
                  value={formaPagamentoAvulso}
                  onChange={(event) => setFormaPagamentoAvulso(event.target.value)}
                  className="h-10 w-full rounded-xl border border-[#D4E2E7] bg-white px-3 text-sm text-[#244455] outline-none transition focus:border-[#1A9E87]/45 focus:ring-2 focus:ring-[#1A9E87]/15"
                >
                  <option value="a_combinar">A combinar</option>
                  <option value="pix">PIX</option>
                  <option value="transferencia">Transferencia</option>
                  <option value="boleto">Boleto</option>
                  <option value="cartao_credito">Cartao de credito</option>
                  <option value="cartao_debito">Cartao de debito</option>
                  <option value="dinheiro">Dinheiro</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="mb-1 block text-sm font-medium text-[#385A6A]">
                  Observacoes (opcional)
                </label>
                <textarea
                  value={observacoesAvulso}
                  onChange={(event) => setObservacoesAvulso(event.target.value)}
                  rows={3}
                  className="w-full rounded-xl border border-[#D4E2E7] bg-white px-3 py-2 text-sm text-[#244455] outline-none transition focus:border-[#1A9E87]/45 focus:ring-2 focus:ring-[#1A9E87]/15"
                  placeholder="Informacoes para auditoria do lancamento."
                />
              </div>
            </div>

            <div className="mt-5 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={fecharModalAvulso}
                className={btnSecondary}
                disabled={salvandoAvulso}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => void confirmarLancamentoAvulso()}
                className={btnPrimary}
                disabled={salvandoAvulso}
              >
                {salvandoAvulso ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                Criar conta avulsa
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {!loading && !erro && contas.length === 0 && total > 0 ? (
        <EmptyState
          icon={<Search className="h-5 w-5" />}
          title="Nenhum título encontrado nesta página"
          description="Volte para a página anterior ou ajuste os filtros aplicados."
          action={
            <button type="button" onClick={() => setPage(1)} className={btnSecondary}>
              <Filter className="h-4 w-4" />
              Ir para primeira página
            </button>
          }
        />
      ) : null}
    </div>
  );
}
