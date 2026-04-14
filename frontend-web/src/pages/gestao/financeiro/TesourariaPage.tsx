import React, { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import {
  AlertCircle,
  ArrowRightLeft,
  CheckCircle2,
  Filter,
  Landmark,
  Loader2,
  RefreshCw,
  Search,
  TrendingDown,
  TrendingUp,
  XCircle,
} from 'lucide-react';
import {
  DataTableCard,
  EmptyState,
  FiltersBar,
  LoadingSkeleton,
  PageHeader,
  SectionCard,
} from '../../../components/layout-v2';
import tesourariaService from '../../../services/tesourariaService';
import {
  MovimentacaoTesouraria,
  PosicaoTesouraria,
  STATUS_MOVIMENTACAO_TESOURARIA_LABELS,
  StatusMovimentacaoTesouraria,
} from '../../../types/financeiro';

const btnPrimary =
  'inline-flex h-9 items-center gap-2 rounded-lg bg-[#159A9C] px-3 text-sm font-medium text-white transition hover:bg-[#117C7E] disabled:opacity-60 disabled:cursor-not-allowed';
const btnSecondary =
  'inline-flex h-9 items-center gap-2 rounded-lg border border-[#D4E2E7] bg-white px-3 text-sm font-medium text-[#244455] transition hover:bg-[#F6FAFB] disabled:opacity-60 disabled:cursor-not-allowed';
const btnDanger =
  'inline-flex h-9 items-center gap-2 rounded-lg border border-[#F4C7CF] bg-[#FFF4F6] px-3 text-sm font-medium text-[#B4233A] transition hover:bg-[#FFECEF] disabled:opacity-60 disabled:cursor-not-allowed';

const moneyFmt = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

const posicaoInicial: PosicaoTesouraria = {
  referenciaEm: '',
  janelaDias: 30,
  totalContas: 0,
  saldoAtualConsolidado: 0,
  entradasPrevistasConsolidadas: 0,
  saidasProgramadasConsolidadas: 0,
  saldoProjetadoConsolidado: 0,
  itens: [],
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

const statusBadge = (status: StatusMovimentacaoTesouraria) => {
  const tone =
    status === 'aprovada'
      ? 'border-[#BEE6CF] bg-[#F1FBF5] text-[#137A42]'
      : status === 'cancelada'
        ? 'border-[#F4C7CF] bg-[#FFF4F6] text-[#B4233A]'
        : 'border-[#F9D9AA] bg-[#FFF7EA] text-[#A86400]';

  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${tone}`}>
      {STATUS_MOVIMENTACAO_TESOURARIA_LABELS[status]}
    </span>
  );
};

export default function TesourariaPage() {
  const [janelaDias, setJanelaDias] = useState(30);
  const [incluirInativas, setIncluirInativas] = useState(false);
  const [filtroStatusMovimentacoes, setFiltroStatusMovimentacoes] = useState<
    'todos' | StatusMovimentacaoTesouraria
  >('todos');

  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [posicao, setPosicao] = useState<PosicaoTesouraria>(posicaoInicial);
  const [movimentacoes, setMovimentacoes] = useState<MovimentacaoTesouraria[]>([]);
  const [totalMovimentacoes, setTotalMovimentacoes] = useState(0);

  const [contaOrigemId, setContaOrigemId] = useState('');
  const [contaDestinoId, setContaDestinoId] = useState('');
  const [valorTransferencia, setValorTransferencia] = useState('');
  const [descricaoTransferencia, setDescricaoTransferencia] = useState('');

  const [salvandoTransferencia, setSalvandoTransferencia] = useState(false);
  const [processandoMovimentacaoId, setProcessandoMovimentacaoId] = useState<string | null>(null);

  const carregarDados = async (overrides?: {
    janelaDias?: number;
    incluirInativas?: boolean;
    statusMovimentacoes?: 'todos' | StatusMovimentacaoTesouraria;
  }) => {
    const filtrosPosicao = {
      janelaDias: overrides?.janelaDias ?? janelaDias,
      incluirInativas: overrides?.incluirInativas ?? incluirInativas,
    };

    const statusMovimentacoes = overrides?.statusMovimentacoes ?? filtroStatusMovimentacoes;

    try {
      setLoading(true);
      setErro(null);

      const [responsePosicao, responseMovimentacoes] = await Promise.all([
        tesourariaService.obterPosicao(filtrosPosicao),
        tesourariaService.listarMovimentacoes({
          status: statusMovimentacoes === 'todos' ? undefined : statusMovimentacoes,
          limite: 20,
        }),
      ]);

      setPosicao(responsePosicao || posicaoInicial);
      setMovimentacoes(Array.isArray(responseMovimentacoes.data) ? responseMovimentacoes.data : []);
      setTotalMovimentacoes(Number(responseMovimentacoes.total) || 0);
    } catch (error) {
      const mensagem = getApiErrorMessage(error, 'Nao foi possivel carregar os dados de tesouraria');
      setErro(mensagem);
      setPosicao(posicaoInicial);
      setMovimentacoes([]);
      setTotalMovimentacoes(0);
      toast.error(mensagem);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void carregarDados();
  }, []);

  useEffect(() => {
    if (posicao.itens.length === 0) {
      setContaOrigemId('');
      setContaDestinoId('');
      return;
    }

    const primeiraConta = posicao.itens[0];
    const segundaConta = posicao.itens.find((item) => item.contaBancariaId !== primeiraConta.contaBancariaId);

    if (!contaOrigemId || !posicao.itens.some((item) => item.contaBancariaId === contaOrigemId)) {
      setContaOrigemId(primeiraConta.contaBancariaId);
    }

    if (!contaDestinoId || !posicao.itens.some((item) => item.contaBancariaId === contaDestinoId)) {
      setContaDestinoId((segundaConta || primeiraConta).contaBancariaId);
    }
  }, [posicao.itens]);

  const painelMetricas = useMemo(
    () => [
      {
        label: 'Saldo atual',
        value: moneyFmt.format(posicao.saldoAtualConsolidado),
        hint: `${posicao.totalContas} conta(s) monitoradas`,
        highlightClass: 'text-[#173A4D]',
      },
      {
        label: 'Entradas previstas',
        value: moneyFmt.format(posicao.entradasPrevistasConsolidadas),
        hint: `Janela de ${janelaDias} dia(s)`,
        highlightClass: 'text-[#137A42]',
      },
      {
        label: 'Saidas programadas',
        value: moneyFmt.format(posicao.saidasProgramadasConsolidadas),
        hint: 'Compromissos no periodo',
        highlightClass: 'text-[#A86400]',
      },
      {
        label: 'Saldo projetado',
        value: moneyFmt.format(posicao.saldoProjetadoConsolidado),
        hint: `Referencia ${posicao.referenciaEm || '-'}`,
        highlightClass:
          posicao.saldoProjetadoConsolidado >= 0 ? 'text-[#137A42]' : 'text-[#B4233A]',
      },
    ],
    [janelaDias, posicao],
  );

  const hasFilters = janelaDias !== 30 || incluirInativas || filtroStatusMovimentacoes !== 'todos';

  const buscar = async () => {
    await carregarDados();
  };

  const limparFiltros = async () => {
    setJanelaDias(30);
    setIncluirInativas(false);
    setFiltroStatusMovimentacoes('todos');
    await carregarDados({ janelaDias: 30, incluirInativas: false, statusMovimentacoes: 'todos' });
  };

  const gerarCorrelationId = () => `tesouraria:transferencia:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`;

  const criarTransferencia = async () => {
    if (!contaOrigemId || !contaDestinoId) {
      toast.error('Selecione conta de origem e destino');
      return;
    }

    if (contaOrigemId === contaDestinoId) {
      toast.error('Conta de origem deve ser diferente da conta de destino');
      return;
    }

    const valor = Number(valorTransferencia.replace(',', '.'));
    if (!Number.isFinite(valor) || valor <= 0) {
      toast.error('Informe um valor valido para transferencia');
      return;
    }

    try {
      setSalvandoTransferencia(true);
      const correlationId = gerarCorrelationId();
      const origemId = `frontend.tesouraria.transferencia:${contaOrigemId}->${contaDestinoId}`;

      const resultado = await tesourariaService.criarTransferencia({
        contaOrigemId,
        contaDestinoId,
        valor,
        descricao: descricaoTransferencia.trim() || undefined,
        correlationId,
        origemId,
      });

      toast.success(`Transferencia criada (corr: ${resultado.movimentacao.correlationId.slice(-8)})`);
      setValorTransferencia('');
      setDescricaoTransferencia('');
      await carregarDados();
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Nao foi possivel criar transferencia'));
    } finally {
      setSalvandoTransferencia(false);
    }
  };

  const aprovarTransferencia = async (movimentacaoId: string) => {
    try {
      setProcessandoMovimentacaoId(movimentacaoId);
      const resultado = await tesourariaService.aprovarTransferencia(movimentacaoId, {
        observacao: 'Aprovacao via painel tesouraria',
      });

      toast.success(
        `Transferencia aprovada (origem: ${moneyFmt.format(
          resultado.saldoContaOrigem,
        )} | destino: ${moneyFmt.format(resultado.saldoContaDestino)})`,
      );
      await carregarDados();
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Nao foi possivel aprovar transferencia'));
    } finally {
      setProcessandoMovimentacaoId(null);
    }
  };

  const cancelarTransferencia = async (movimentacaoId: string) => {
    try {
      setProcessandoMovimentacaoId(movimentacaoId);
      await tesourariaService.cancelarTransferencia(movimentacaoId, {
        observacao: 'Cancelamento via painel tesouraria',
      });
      toast.success('Transferencia cancelada');
      await carregarDados();
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Nao foi possivel cancelar transferencia'));
    } finally {
      setProcessandoMovimentacaoId(null);
    }
  };

  return (
    <div className="space-y-4 pt-1 sm:pt-2">
      <SectionCard className="space-y-[18px] border-[#CBDAE2] bg-gradient-to-br from-white via-white to-[#F3FAF8] p-5 shadow-[0_24px_46px_-34px_rgba(16,57,74,0.38)]">
        <PageHeader
          eyebrow={
            <span className="inline-flex items-center rounded-full border border-[#BFD9E2] bg-[#EFF8FB] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#3F6A7C]">
              Nucleo Financeiro
            </span>
          }
          title={
            <span className="text-[27px] font-bold leading-[1.03] tracking-[-0.018em] text-[#002333] sm:text-[28px]">
              Tesouraria
            </span>
          }
          titleClassName="leading-none sm:inline-flex sm:items-center"
          description="Posicao consolidada de caixa por conta bancaria com visao de curto prazo."
          descriptionClassName="max-w-[64ch] text-[12px] leading-[1.4] text-[#5B7A89] sm:border-l sm:border-[#D7E5EC] sm:pl-3 sm:text-[13px]"
          inlineDescriptionOnDesktop
          actions={
            <button type="button" onClick={() => void carregarDados()} className={btnSecondary}>
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </button>
          }
        />

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          {painelMetricas.map((item) => (
            <div key={item.label} className="rounded-xl border border-[#D2E1E8] bg-white px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-[#5F7B89]">
                {item.label}
              </p>
              <p className={`mt-1 text-lg font-semibold ${item.highlightClass}`}>
                {loading ? '--' : item.value}
              </p>
              <p className="mt-1 text-xs text-[#688390]">{item.hint}</p>
            </div>
          ))}
        </div>

        <div className="pt-1">
          <FiltersBar className="space-y-4 rounded-2xl border border-[#D4E1E8] bg-gradient-to-br from-[#F7FBFD] to-[#F1F7FA] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)]">
            <div className="flex w-full flex-col gap-4">
              <div className="flex w-full flex-col gap-3 xl:flex-row xl:items-end">
                <div className="w-full xl:w-[180px]">
                  <label className="mb-2 block text-sm font-medium text-[#385A6A]">Janela de analise</label>
                  <select
                    value={String(janelaDias)}
                    onChange={(event) => setJanelaDias(Number(event.target.value))}
                    className="h-10 w-full rounded-xl border border-[#D4E2E7] bg-white px-3 text-sm text-[#244455] outline-none transition focus:border-[#1A9E87]/45 focus:ring-2 focus:ring-[#1A9E87]/15"
                  >
                    <option value="7">7 dias</option>
                    <option value="15">15 dias</option>
                    <option value="30">30 dias</option>
                    <option value="60">60 dias</option>
                    <option value="90">90 dias</option>
                  </select>
                </div>

                <div className="w-full xl:w-[220px]">
                  <label className="mb-2 block text-sm font-medium text-[#385A6A]">Status transferencias</label>
                  <select
                    value={filtroStatusMovimentacoes}
                    onChange={(event) =>
                      setFiltroStatusMovimentacoes(
                        event.target.value as 'todos' | StatusMovimentacaoTesouraria,
                      )
                    }
                    className="h-10 w-full rounded-xl border border-[#D4E2E7] bg-white px-3 text-sm text-[#244455] outline-none transition focus:border-[#1A9E87]/45 focus:ring-2 focus:ring-[#1A9E87]/15"
                  >
                    <option value="todos">Todos</option>
                    <option value="pendente">Pendentes</option>
                    <option value="aprovada">Aprovadas</option>
                    <option value="cancelada">Canceladas</option>
                  </select>
                </div>

                <div className="w-full xl:min-w-[240px] xl:flex-1">
                  <label className="mb-2 block text-sm font-medium text-[#385A6A]">Contas exibidas</label>
                  <label className="inline-flex h-10 w-full items-center gap-2 rounded-xl border border-[#D4E2E7] bg-white px-3 text-sm text-[#244455]">
                    <input
                      type="checkbox"
                      checked={incluirInativas}
                      onChange={(event) => setIncluirInativas(event.target.checked)}
                      className="h-4 w-4 rounded border-[#B8CBD4] text-[#159A9C] focus:ring-[#159A9C]/40"
                    />
                    Incluir inativas
                  </label>
                </div>

                <div className="flex w-full flex-wrap items-center gap-2 xl:w-auto xl:justify-end">
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
            </div>
          </FiltersBar>
        </div>
      </SectionCard>

      {loading ? <LoadingSkeleton lines={8} /> : null}

      {!loading && erro ? (
        <EmptyState
          icon={<AlertCircle className="h-5 w-5" />}
          title="Erro ao carregar tesouraria"
          description={erro}
          action={
            <button type="button" onClick={() => void carregarDados()} className={btnPrimary}>
              <RefreshCw className="h-4 w-4" />
              Tentar novamente
            </button>
          }
        />
      ) : null}

      {!loading && !erro && posicao.itens.length === 0 ? (
        <EmptyState
          icon={<Landmark className="h-5 w-5" />}
          title="Nenhuma conta bancaria encontrada"
          description="Cadastre ou ative contas bancarias para visualizar a posicao de tesouraria."
        />
      ) : null}

      {!loading && !erro && posicao.itens.length > 0 ? (
        <DataTableCard>
          <div className="flex flex-col gap-3 border-b border-[#E1EAEE] bg-[#F8FBFC] px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <div className="text-sm text-[#516F7D]">
              {posicao.totalContas} conta(s) | referencia {posicao.referenciaEm}
            </div>
            <div
              className={`text-sm font-semibold ${
                posicao.saldoProjetadoConsolidado >= 0 ? 'text-[#137A42]' : 'text-[#B4233A]'
              }`}
            >
              Saldo projetado: {moneyFmt.format(posicao.saldoProjetadoConsolidado)}
            </div>
          </div>

          <div className="max-h-[70vh] overflow-auto">
            <table className="w-full min-w-[900px] border-collapse">
              <thead className="sticky top-0 z-10 bg-white shadow-[0_1px_0_0_#E1EAEE]">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#5B7683]">
                    Conta
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#5B7683]">
                    Banco / Dados
                  </th>
                  <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-[#5B7683]">
                    Saldo atual
                  </th>
                  <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-[#5B7683]">
                    Saidas programadas
                  </th>
                  <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-[#5B7683]">
                    Saldo projetado
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {posicao.itens.map((item) => (
                  <tr key={item.contaBancariaId} className="border-t border-[#EDF3F5] hover:bg-[#FAFCFD]">
                    <td className="px-5 py-4 align-top">
                      <div className="text-sm font-semibold text-[#173A4D]">{item.nomeConta}</div>
                      <div className="mt-0.5 text-xs text-[#64808E]">
                        {item.tipoConta} {item.ativo ? '' : '(inativa)'}
                      </div>
                    </td>
                    <td className="px-5 py-4 align-top text-sm text-[#173A4D]">
                      <div>{item.banco}</div>
                      <div className="mt-0.5 text-xs text-[#64808E]">
                        Ag {item.agencia} • Cc {item.conta}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-right align-top text-sm font-semibold text-[#173A4D]">
                      {moneyFmt.format(item.saldoAtual)}
                    </td>
                    <td className="px-5 py-4 text-right align-top text-sm text-[#B4233A]">
                      <span className="inline-flex items-center gap-1">
                        <TrendingDown className="h-4 w-4" />
                        {moneyFmt.format(item.saidasProgramadas)}
                      </span>
                    </td>
                    <td
                      className={`px-5 py-4 text-right align-top text-sm font-semibold ${
                        item.saldoProjetado >= 0 ? 'text-[#137A42]' : 'text-[#B4233A]'
                      }`}
                    >
                      <span className="inline-flex items-center gap-1">
                        <TrendingUp className="h-4 w-4" />
                        {moneyFmt.format(item.saldoProjetado)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </DataTableCard>
      ) : null}

      {!loading && !erro && posicao.itens.length > 0 ? (
        <SectionCard className="space-y-4 p-5">
          <div>
            <h2 className="text-lg font-semibold text-[#002333]">Transferencias internas</h2>
            <p className="mt-1 text-sm text-[#5B7A89]">
              Crie e processe movimentacoes entre contas internas com rastreabilidade.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 lg:grid-cols-5">
            <div className="lg:col-span-2">
              <label className="mb-2 block text-sm font-medium text-[#385A6A]">Conta origem</label>
              <select
                value={contaOrigemId}
                onChange={(event) => setContaOrigemId(event.target.value)}
                className="h-10 w-full rounded-xl border border-[#D4E2E7] bg-white px-3 text-sm text-[#244455] outline-none transition focus:border-[#1A9E87]/45 focus:ring-2 focus:ring-[#1A9E87]/15"
              >
                {posicao.itens.map((item) => (
                  <option key={item.contaBancariaId} value={item.contaBancariaId}>
                    {item.nomeConta} ({moneyFmt.format(item.saldoAtual)})
                  </option>
                ))}
              </select>
            </div>

            <div className="lg:col-span-2">
              <label className="mb-2 block text-sm font-medium text-[#385A6A]">Conta destino</label>
              <select
                value={contaDestinoId}
                onChange={(event) => setContaDestinoId(event.target.value)}
                className="h-10 w-full rounded-xl border border-[#D4E2E7] bg-white px-3 text-sm text-[#244455] outline-none transition focus:border-[#1A9E87]/45 focus:ring-2 focus:ring-[#1A9E87]/15"
              >
                {posicao.itens.map((item) => (
                  <option key={item.contaBancariaId} value={item.contaBancariaId}>
                    {item.nomeConta} ({moneyFmt.format(item.saldoAtual)})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-[#385A6A]">Valor</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={valorTransferencia}
                onChange={(event) => setValorTransferencia(event.target.value)}
                className="h-10 w-full rounded-xl border border-[#D4E2E7] bg-white px-3 text-sm text-[#244455] outline-none transition focus:border-[#1A9E87]/45 focus:ring-2 focus:ring-[#1A9E87]/15"
              />
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="flex-1">
              <label className="mb-2 block text-sm font-medium text-[#385A6A]">Descricao (opcional)</label>
              <input
                type="text"
                value={descricaoTransferencia}
                onChange={(event) => setDescricaoTransferencia(event.target.value)}
                placeholder="Ex.: reposicao de caixa operacional"
                className="h-10 w-full rounded-xl border border-[#D4E2E7] bg-white px-3 text-sm text-[#244455] outline-none transition focus:border-[#1A9E87]/45 focus:ring-2 focus:ring-[#1A9E87]/15"
              />
            </div>
            <div className="self-end">
              <button
                type="button"
                onClick={() => void criarTransferencia()}
                className={btnPrimary}
                disabled={salvandoTransferencia || posicao.itens.length < 2}
              >
                {salvandoTransferencia ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ArrowRightLeft className="h-4 w-4" />
                )}
                Criar transferencia
              </button>
            </div>
          </div>

          <DataTableCard>
            <div className="flex flex-col gap-3 border-b border-[#E1EAEE] bg-[#F8FBFC] px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
              <div className="text-sm text-[#516F7D]">{totalMovimentacoes} transferencia(s) carregadas</div>
              <button type="button" onClick={() => void carregarDados()} className={btnSecondary}>
                <RefreshCw className="h-4 w-4" />
                Atualizar historico
              </button>
            </div>

            {movimentacoes.length === 0 ? (
              <div className="p-5">
                <EmptyState
                  icon={<ArrowRightLeft className="h-5 w-5" />}
                  title="Sem transferencias para os filtros atuais"
                  description="Crie uma transferencia interna para iniciar a trilha operacional."
                />
              </div>
            ) : (
              <div className="max-h-[60vh] overflow-auto">
                <table className="w-full min-w-[960px] border-collapse">
                  <thead className="sticky top-0 z-10 bg-white shadow-[0_1px_0_0_#E1EAEE]">
                    <tr>
                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#5B7683]">
                        Data
                      </th>
                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#5B7683]">
                        Origem
                      </th>
                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#5B7683]">
                        Destino
                      </th>
                      <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-[#5B7683]">
                        Valor
                      </th>
                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#5B7683]">
                        Status
                      </th>
                      <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-[#5B7683]">
                        Acoes
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white">
                    {movimentacoes.map((movimentacao) => (
                      <tr key={movimentacao.id} className="border-t border-[#EDF3F5] hover:bg-[#FAFCFD]">
                        <td className="px-5 py-4 align-top text-sm text-[#173A4D]">
                          {new Date(movimentacao.createdAt).toLocaleString('pt-BR')}
                          <div className="mt-1 text-xs text-[#64808E]">corr: {movimentacao.correlationId.slice(-10)}</div>
                        </td>
                        <td className="px-5 py-4 align-top text-sm text-[#173A4D]">
                          {movimentacao.contaOrigemNome}
                        </td>
                        <td className="px-5 py-4 align-top text-sm text-[#173A4D]">
                          {movimentacao.contaDestinoNome}
                        </td>
                        <td className="px-5 py-4 text-right align-top text-sm font-semibold text-[#173A4D]">
                          {moneyFmt.format(movimentacao.valor)}
                        </td>
                        <td className="px-5 py-4 align-top">{statusBadge(movimentacao.status)}</td>
                        <td className="px-5 py-4 align-top">
                          {movimentacao.status === 'pendente' ? (
                            <div className="flex justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => void aprovarTransferencia(movimentacao.id)}
                                className={btnPrimary}
                                disabled={processandoMovimentacaoId === movimentacao.id}
                              >
                                {processandoMovimentacaoId === movimentacao.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <CheckCircle2 className="h-4 w-4" />
                                )}
                                Aprovar
                              </button>
                              <button
                                type="button"
                                onClick={() => void cancelarTransferencia(movimentacao.id)}
                                className={btnDanger}
                                disabled={processandoMovimentacaoId === movimentacao.id}
                              >
                                {processandoMovimentacaoId === movimentacao.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <XCircle className="h-4 w-4" />
                                )}
                                Cancelar
                              </button>
                            </div>
                          ) : (
                            <div className="text-right text-xs text-[#64808E]">Sem acao</div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </DataTableCard>
        </SectionCard>
      ) : null}
    </div>
  );
}
