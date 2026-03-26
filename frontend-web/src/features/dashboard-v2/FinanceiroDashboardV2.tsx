import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowRight,
  BellRing,
  CheckCircle2,
  Landmark,
  RefreshCw,
  ShieldCheck,
  Wallet,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import faturamentoService, {
  EstatisticasPagamentos,
  FaturasPaginadasResponse,
  StatusFatura,
} from '../../services/faturamentoService';
import contasPagarService from '../../services/contasPagarService';
import contaBancariaService from '../../services/contaBancariaService';
import conciliacaoBancariaService from '../../services/conciliacaoBancariaService';
import alertasOperacionaisFinanceiroService from '../../services/alertasOperacionaisFinanceiroService';
import {
  AlertaOperacionalFinanceiro,
  ContaPagar,
  ImportacaoExtrato,
  ResumoFinanceiro,
} from '../../types/financeiro';
import { toastService } from '../../services/toastService';
import type { DashboardV2Insight, DashboardV2Insights } from './useDashboardV2';
import GoalProgressCard from './components/GoalProgressCard';
import InsightsPanel from './components/InsightsPanel';
import KpiTrendCard from './components/KpiTrendCard';
import {
  aplicarAtualizacaoAlertaOperacional,
  contarAlertasOperacionais,
  priorizarAlertasOperacionais,
} from './financeiro-alertas-state';
import {
  isAlertaReprocessavel,
  montarPayloadReprocessamento,
  REPROCESSAMENTO_CANCELADO,
} from './financeiro-alertas-reprocessamento';

type PeriodoFiltro = '7d' | '30d' | '90d';

const periodOptions: Array<{ value: PeriodoFiltro; label: string }> = [
  { value: '7d', label: 'Últimos 7 dias' },
  { value: '30d', label: 'Últimos 30 dias' },
  { value: '90d', label: 'Últimos 90 dias' },
];

const periodQuickChips: Array<{ value: PeriodoFiltro; label: string }> = [
  { value: '7d', label: '7 dias' },
  { value: '30d', label: '30 dias' },
  { value: '90d', label: '90 dias' },
];

const periodLabelMap: Record<PeriodoFiltro, string> = {
  '7d': 'Ultimos 7 dias',
  '30d': 'Ultimos 30 dias',
  '90d': 'Ultimos 90 dias',
};

const formatCurrency = (value: number): string =>
  value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

const formatNumber = (value: number): string =>
  value.toLocaleString('pt-BR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

const formatDateTime = (value: string): string => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return 'Atualizado agora';
  return parsed.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatDate = (value: string): string => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString('pt-BR');
};

const alertSeverityLabelMap = {
  critical: 'Crítico',
  warning: 'Atenção',
  info: 'Informativo',
} as const;

const alertStatusLabelMap = {
  ativo: 'Ativo',
  acknowledged: 'Reconhecido',
  resolvido: 'Resolvido',
} as const;

const clampPercent = (value: number): number => Math.max(0, Math.min(100, value));

const sectionSurfaceClass =
  'rounded-[20px] border border-[#DCE7EB] bg-white p-5 shadow-[0_16px_30px_-24px_rgba(16,57,74,0.28)]';
const neutralMetricCardClass = 'rounded-[14px] border border-[#E2ECEF] bg-[#FBFDFD] px-3.5 py-3';
const quickActionCardClass =
  'rounded-[16px] border border-[#E2ECEF] bg-[#FBFDFD] px-3.5 py-3 text-left transition hover:border-[#CFE0E6] hover:bg-white';

const formatCompactCurrency = (value: number): string => {
  if (Math.abs(value) >= 1_000_000) {
    return `R$${(value / 1_000_000).toFixed(1)}M`;
  }

  if (Math.abs(value) >= 1_000) {
    return `R$${(value / 1_000).toFixed(0)}K`;
  }

  return formatCurrency(value);
};

const periodRange = (periodo: PeriodoFiltro): { dataInicioIso: string; dataFimIso: string } => {
  const dataFim = new Date();
  const dataInicio = new Date(dataFim);
  dataInicio.setDate(dataInicio.getDate() - (periodo === '7d' ? 7 : periodo === '30d' ? 30 : 90));
  return { dataInicioIso: dataInicio.toISOString(), dataFimIso: dataFim.toISOString() };
};

const FinanceiroDashboardV2: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [periodo, setPeriodo] = useState<PeriodoFiltro>('30d');
  const [faturasData, setFaturasData] = useState<FaturasPaginadasResponse | null>(null);
  const [pagamentosStats, setPagamentosStats] = useState<EstatisticasPagamentos | null>(null);
  const [resumoContasPagar, setResumoContasPagar] = useState<ResumoFinanceiro | null>(null);
  const [pendenciasAprovacao, setPendenciasAprovacao] = useState<ContaPagar[]>([]);
  const [importacoesConciliacao, setImportacoesConciliacao] = useState<ImportacaoExtrato[]>([]);
  const [alertasOperacionais, setAlertasOperacionais] = useState<AlertaOperacionalFinanceiro[]>([]);
  const [saldoBancarioTotal, setSaldoBancarioTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [warning, setWarning] = useState<string | null>(null);
  const [warningAlertas, setWarningAlertas] = useState<string | null>(null);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string | null>(null);
  const [insights, setInsights] = useState<DashboardV2Insight[]>([]);
  const [alertaActionById, setAlertaActionById] = useState<
    Record<string, 'ack' | 'resolver' | 'reprocessar' | undefined>
  >({});

  const carregarDados = useCallback(async () => {
    setWarning(null);
    setWarningAlertas(null);
    const range = periodRange(periodo);
    const dataInicio = range.dataInicioIso.slice(0, 10);
    const dataFim = range.dataFimIso.slice(0, 10);

    const resultados = await Promise.allSettled([
      faturamentoService.listarFaturasPaginadas({
        page: 1,
        pageSize: 250,
        dataInicial: range.dataInicioIso,
        dataFinal: range.dataFimIso,
        sortBy: 'dataVencimento',
        sortOrder: 'ASC',
      }),
      faturamentoService.obterEstatisticasPagamentos({
        dataInicio: range.dataInicioIso,
        dataFim: range.dataFimIso,
      }),
      contasPagarService.obterResumo({ dataInicio, dataFim }),
      contasPagarService.listarPendenciasAprovacao(),
      contaBancariaService.listarAtivas(),
      conciliacaoBancariaService.listarImportacoes({ limite: 10 }),
      alertasOperacionaisFinanceiroService
        .recalcular()
        .then(() => alertasOperacionaisFinanceiroService.listar({ limite: 12 })),
      api.get<DashboardV2Insights>('/dashboard/v2/financeiro/insights', {
        params: {
          periodStart: dataInicio,
          periodEnd: dataFim,
        },
      }),
    ]);

    let falhasCriticas = 0;
    if (resultados[0].status === 'fulfilled') setFaturasData(resultados[0].value);
    else falhasCriticas += 1;
    if (resultados[1].status === 'fulfilled') setPagamentosStats(resultados[1].value);
    else falhasCriticas += 1;
    if (resultados[2].status === 'fulfilled') setResumoContasPagar(resultados[2].value);
    else falhasCriticas += 1;
    if (resultados[3].status === 'fulfilled') setPendenciasAprovacao(resultados[3].value);
    else falhasCriticas += 1;
    if (resultados[4].status === 'fulfilled') {
      const saldo = resultados[4].value.reduce((acc, conta) => acc + Number(conta.saldo || 0), 0);
      setSaldoBancarioTotal(Number(saldo.toFixed(2)));
    } else falhasCriticas += 1;
    if (resultados[5].status === 'fulfilled') {
      setImportacoesConciliacao(resultados[5].value);
    }
    if (resultados[6].status === 'fulfilled') {
      setAlertasOperacionais(resultados[6].value);
    } else {
      setWarningAlertas('Não foi possível carregar alertas operacionais agora.');
    }
    if (resultados[7].status === 'fulfilled') {
      setInsights(resultados[7].value.data?.insights || []);
    } else {
      falhasCriticas += 1;
      setInsights([]);
    }

    if (falhasCriticas > 0) {
      setWarning('Alguns indicadores não puderam ser carregados. Exibindo dados parciais.');
    }

    setLastUpdatedAt(new Date().toISOString());
  }, [periodo]);

  useEffect(() => {
    const bootstrap = async () => {
      setLoading(true);
      try {
        await carregarDados();
      } finally {
        setLoading(false);
      }
    };
    void bootstrap();
  }, [carregarDados]);

  const refresh = async () => {
    setRefreshing(true);
    try {
      await carregarDados();
    } finally {
      setRefreshing(false);
    }
  };

  const faturas = faturasData?.data || [];
  const valorFaturado = Number(faturasData?.aggregates?.valorTotal || 0);
  const valorRecebido = Number(
    faturasData?.aggregates?.valorRecebido || pagamentosStats?.valorTotal || 0,
  );
  const valorEmAberto = Number(faturasData?.aggregates?.valorEmAberto || 0);
  const totalAtrasado = Number(resumoContasPagar?.totalAtrasado || 0);
  const totalMes = Number(resumoContasPagar?.totalMes || 0);
  const totalQuantidadeFaturas = Number(faturasData?.total || faturas.length || 0);
  const pendenciasValor = pendenciasAprovacao.reduce(
    (acc, conta) => acc + Number(conta.valorRestante || conta.valorTotal || 0),
    0,
  );
  const taxaRecebimento = valorFaturado > 0 ? (valorRecebido / valorFaturado) * 100 : 0;
  const caixaPercent = clampPercent(totalMes > 0 ? (saldoBancarioTotal / totalMes) * 100 : 100);
  const faturadoMedioPorFatura =
    totalQuantidadeFaturas > 0 ? valorFaturado / totalQuantidadeFaturas : 0;
  const recebidasCount = faturas.filter((item) => item.status === StatusFatura.PAGA).length;
  const vencidasCount = faturas.filter((item) => item.status === StatusFatura.VENCIDA).length;
  const importacoesRecentesCount = importacoesConciliacao.length;
  const coberturaCaixaMeses = totalMes > 0 ? saldoBancarioTotal / totalMes : 0;
  const caixaCoverageLabel =
    totalMes > 0
      ? `${coberturaCaixaMeses.toFixed(1)}x do desembolso mensal`
      : 'Sem desembolso mensal de referência';

  const sparkFaturado = useMemo(
    () => faturas.slice(-12).map((item) => Number(item.valorTotal || 0)),
    [faturas],
  );
  const sparkRecebido = useMemo(
    () =>
      faturas
        .slice(-12)
        .map((item) => (item.status === StatusFatura.PAGA ? Number(item.valorTotal || 0) : 0)),
    [faturas],
  );
  const sparkAtrasado = useMemo(
    () =>
      faturas
        .slice(-12)
        .map((item) => (item.status === StatusFatura.VENCIDA ? Number(item.valorTotal || 0) : 0)),
    [faturas],
  );

  const alertasPriorizados = useMemo(
    () => priorizarAlertasOperacionais(alertasOperacionais),
    [alertasOperacionais],
  );

  const contadoresAlertas = useMemo(
    () => contarAlertasOperacionais(alertasPriorizados),
    [alertasPriorizados],
  );
  const alertasAtivosCount = useMemo(
    () => alertasPriorizados.filter((alerta) => alerta.status === 'ativo').length,
    [alertasPriorizados],
  );
  const alertasReconhecidosCount = useMemo(
    () => alertasPriorizados.filter((alerta) => alerta.status === 'acknowledged').length,
    [alertasPriorizados],
  );
  const alertasReprocessaveisCount = useMemo(
    () => alertasPriorizados.filter((alerta) => isAlertaReprocessavel(alerta.tipo)).length,
    [alertasPriorizados],
  );
  const hasActiveFilters = periodo !== '30d';
  const lastUpdatedLabel = lastUpdatedAt ? formatDateTime(lastUpdatedAt) : 'Atualizado agora';
  const periodoLabel = periodLabelMap[periodo];
  const { dataInicioIso, dataFimIso } = useMemo(() => periodRange(periodo), [periodo]);
  const periodoRangeLabel = `${formatDate(dataInicioIso)} a ${formatDate(dataFimIso)}`;
  const horaAtual = new Date().getHours();
  const saudacaoPeriodo = horaAtual < 12 ? 'Bom dia' : horaAtual < 18 ? 'Boa tarde' : 'Boa noite';
  const primeiroNome =
    user?.nome && user.nome.trim().length > 0 ? user.nome.trim().split(/\s+/)[0] : 'financeiro';
  const empresaLabel = user?.empresa?.nome || 'operacao financeira';
  const saudacaoTitulo = `${saudacaoPeriodo}, ${primeiroNome}`;
  const statusFinanceiroLabel =
    totalAtrasado <= 0 && taxaRecebimento >= 85
      ? 'Operacao saudavel'
      : totalAtrasado > 0 || taxaRecebimento < 70
        ? 'Em atencao'
        : 'Em acompanhamento';
  const statusFinanceiroTone =
    totalAtrasado <= 0 && taxaRecebimento >= 85
      ? 'bg-[#E8F6F4] text-[#166A6B]'
      : totalAtrasado > 0 || taxaRecebimento < 70
        ? 'bg-[#FFF4E9] text-[#A06213]'
        : 'bg-[#EAF5FA] text-[#2C708D]';
  const focoAlertasOperacionais = useCallback(() => {
    if (typeof document === 'undefined') return;
    const secao = document.getElementById('financeiro-alertas-operacionais');
    if (secao) {
      secao.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  const compartilharInsights = useCallback(async () => {
    if (!insights.length) {
      toastService.info('Sem insights para compartilhar neste período.');
      return;
    }

    const linhas = insights.slice(0, 5).map((insight, index) => {
      const acao = insight.action ? ` | Ação: ${insight.action}` : '';
      return `${index + 1}. ${insight.title} - ${insight.description}${acao}`;
    });

    const resumo = `Insights financeiros (${periodoRangeLabel})\n${linhas.join('\n')}`;
    const clipboardApi =
      typeof navigator !== 'undefined' && navigator.clipboard
        ? navigator.clipboard
        : null;

    if (!clipboardApi) {
      toastService.warning('Cópia automática indisponível neste navegador.');
      return;
    }

    try {
      await clipboardApi.writeText(resumo);
      toastService.success('Insights copiados para a área de transferência.');
    } catch {
      toastService.error('Não foi possível copiar os insights automaticamente.');
    }
  }, [insights, periodoRangeLabel]);

  const abrirInsight = useCallback(
    (insight: DashboardV2Insight) => {
      switch (insight.id) {
        case 'financeiro-recebimento-abaixo-meta':
        case 'financeiro-recebimento-em-linha':
          navigate('/financeiro/faturamento');
          return;
        case 'financeiro-contas-atrasadas':
        case 'financeiro-sem-atrasos':
          navigate('/financeiro/contas-pagar');
          return;
        case 'financeiro-pressao-caixa':
          navigate('/financeiro/contas-bancarias');
          return;
        case 'financeiro-fila-aprovacao':
          navigate('/financeiro/aprovacoes');
          return;
        case 'financeiro-alertas-criticos':
        case 'financeiro-alertas-ativos':
          focoAlertasOperacionais();
          return;
        case 'financeiro-conciliacao-recente':
        case 'financeiro-sem-importacao':
          navigate('/financeiro/conciliacao');
          return;
        default:
          navigate('/nuclei/financeiro');
      }
    },
    [focoAlertasOperacionais, navigate],
  );

  const atualizarAlerta = useCallback(
    async (alerta: AlertaOperacionalFinanceiro, acao: 'ack' | 'resolver' | 'reprocessar') => {
      const id = alerta.id;
      setAlertaActionById((prev) => ({ ...prev, [id]: acao }));

      try {
        let atualizado: AlertaOperacionalFinanceiro;
        let limparWarning = true;

        if (acao === 'ack') {
          atualizado = await alertasOperacionaisFinanceiroService.ack(id, {
            observacao: 'Atualizado pelo painel financeiro',
          });
        } else if (acao === 'resolver') {
          atualizado = await alertasOperacionaisFinanceiroService.resolver(id, {
            observacao: 'Resolvido pelo painel financeiro',
          });
        } else {
          const dados = montarPayloadReprocessamento(alerta);
          if (!dados) {
            throw new Error(REPROCESSAMENTO_CANCELADO);
          }
          const resultado = await alertasOperacionaisFinanceiroService.reprocessar(id, dados);
          atualizado = resultado.alerta;
          if (!resultado.sucesso) {
            limparWarning = false;
            setWarningAlertas(resultado.mensagem || 'Não foi possível reprocessar o alerta.');
          }
        }

        setAlertasOperacionais((prev) => aplicarAtualizacaoAlertaOperacional(prev, atualizado));
        if (limparWarning) {
          setWarningAlertas(null);
        }
      } catch (error) {
        if (error instanceof Error && error.message === REPROCESSAMENTO_CANCELADO) {
          return;
        }
        if (acao === 'reprocessar' && error instanceof Error && error.message) {
          setWarningAlertas(error.message);
        } else {
          setWarningAlertas('Não foi possível atualizar o alerta selecionado.');
        }
      } finally {
        setAlertaActionById((prev) => ({ ...prev, [id]: undefined }));
      }
    },
    [],
  );

  if (loading) {
    return <div className="h-60 animate-pulse rounded-[20px] bg-[#E6EFF0]" />;
  }

  return (
    <div className="space-y-4">
      <section className="mb-6 rounded-[20px] border border-[#DCE7EB] bg-[linear-gradient(135deg,#F9FDFD_0%,#F0F8F8_55%,#F8FCFC_100%)] p-5 shadow-[0_16px_30px_-24px_rgba(16,57,74,0.28)]">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="min-w-0">
            <span className="inline-flex items-center rounded-full border border-[#CFE6E8] bg-white/80 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#4C7283]">
              Dashboard Financeiro
            </span>
            <h1 className="mt-2 text-[27px] font-semibold tracking-[-0.02em] text-[#173A4E]">
              {saudacaoTitulo}
            </h1>
            <p className="mt-1 text-[14px] text-[#4D6D7B]">
              Visao consolidada de faturamento, recebimentos e caixa em{' '}
              <span className="font-semibold text-[#1D4F63]">{empresaLabel}</span>.
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center rounded-full border border-[#D3E4E8] bg-white px-2.5 py-1 text-[12px] font-medium text-[#466777]">
                Periodo: {periodoRangeLabel}
              </span>
              <span className="inline-flex items-center rounded-full border border-[#D3E4E8] bg-white px-2.5 py-1 text-[12px] font-medium text-[#466777]">
                Atualizado: {lastUpdatedLabel}
              </span>
              <span className="inline-flex items-center rounded-full border border-[#D3E4E8] bg-white px-2.5 py-1 text-[12px] font-medium text-[#466777]">
                Recorte: {periodoLabel}
              </span>
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-1 text-[12px] font-semibold ${statusFinanceiroTone}`}
              >
                {statusFinanceiroLabel}
              </span>
            </div>
            {warning ? <p className="mt-2 text-[13px] text-[#A56B13]">{warning}</p> : null}
          </div>

          <div className="w-full rounded-[14px] border border-[#D5E3E8] bg-white/80 p-3.5 xl:w-auto xl:min-w-[520px]">
            <div className="flex flex-wrap items-center gap-2">
              <label
                htmlFor="dashboard-financeiro-periodo"
                className="text-[13px] font-medium text-[#567583]"
              >
                Periodo
              </label>
              <select
                id="dashboard-financeiro-periodo"
                value={periodo}
                onChange={(event) => setPeriodo(event.target.value as PeriodoFiltro)}
                className="w-full min-w-0 rounded-[10px] border border-[#D5E3E8] bg-white px-3 py-2 text-[13px] text-[#244556] focus:border-[#159A9C] focus:outline-none sm:w-auto sm:min-w-[180px]"
              >
                {periodOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={() => setPeriodo('30d')}
                disabled={!hasActiveFilters}
                className="inline-flex items-center gap-2 rounded-[10px] border border-[#D5E3E8] px-3 py-2 text-[13px] font-semibold text-[#26495C] hover:bg-[#F3F9F8] disabled:cursor-not-allowed disabled:opacity-50"
              >
                Limpar filtros
              </button>
              <button
                type="button"
                onClick={() => void refresh()}
                className="inline-flex items-center gap-2 rounded-[10px] border border-[#D5E3E8] px-3 py-2 text-[13px] font-semibold text-[#26495C] hover:bg-[#F3F9F8]"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
                Atualizar
              </button>
            </div>

            <div
              className="mt-2.5 flex w-full flex-wrap items-center gap-1.5"
              role="group"
              aria-label="Atalhos de periodo financeiro"
            >
              {periodQuickChips.map((chip) => {
                const isActive = periodo === chip.value;
                return (
                  <button
                    key={chip.value}
                    type="button"
                    onClick={() => setPeriodo(chip.value)}
                    className={`rounded-full border px-3 py-1 text-[12px] font-semibold transition ${
                      isActive
                        ? 'border-[#159A9C] bg-[#E8F6F4] text-[#186A6B]'
                        : 'border-[#D5E3E8] bg-white text-[#5E7A88] hover:border-[#BFD5DD] hover:text-[#244556]'
                    }`}
                    aria-pressed={isActive}
                  >
                    {chip.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="flex items-center justify-between rounded-[12px] border border-[#DCE7EB] bg-white/90 px-3 py-2">
            <div>
              <p className="text-[11px] uppercase tracking-wide text-[#7A929E]">
                Taxa de recebimento
              </p>
              <p className="text-[16px] font-semibold text-[#18374B]">
                {taxaRecebimento.toFixed(0)}%
              </p>
            </div>
            <Wallet className="h-5 w-5 text-[#159A9C]" />
          </div>
          <div className="flex items-center justify-between rounded-[12px] border border-[#DCE7EB] bg-white/90 px-3 py-2">
            <div>
              <p className="text-[11px] uppercase tracking-wide text-[#7A929E]">Em atraso</p>
              <p className="text-[16px] font-semibold text-[#18374B]">
                {formatCompactCurrency(totalAtrasado)}
              </p>
            </div>
            <AlertTriangle className="h-5 w-5 text-[#D28A2C]" />
          </div>
          <div className="flex items-center justify-between rounded-[12px] border border-[#DCE7EB] bg-white/90 px-3 py-2">
            <div>
              <p className="text-[11px] uppercase tracking-wide text-[#7A929E]">Caixa disponivel</p>
              <p className="text-[16px] font-semibold text-[#18374B]">
                {formatCompactCurrency(saldoBancarioTotal)}
              </p>
            </div>
            <Landmark className="h-5 w-5 text-[#159A9C]" />
          </div>
        </div>

        <div className="mt-4 h-2 w-full rounded-full bg-[#DEEFE7]">
          <div
            className="h-2 rounded-full bg-[#159A9C] transition-all"
            style={{ width: `${clampPercent(taxaRecebimento)}%` }}
          />
        </div>
      </section>
      <section className="grid grid-cols-1 gap-3.5 lg:grid-cols-2 xl:grid-cols-5">
        <KpiTrendCard
          title="Faturado"
          featureHint="Mostra o total faturado no recorte e o ticket medio por fatura."
          value={formatCurrency(valorFaturado)}
          sparkline={sparkFaturado}
          progressPercent={clampPercent(
            totalQuantidadeFaturas > 0 ? (recebidasCount / totalQuantidadeFaturas) * 100 : 0,
          )}
          footerLeft={`${formatNumber(totalQuantidadeFaturas)} faturas no período`}
          footerRight={
            faturadoMedioPorFatura > 0
              ? `Ticket médio: ${formatCompactCurrency(faturadoMedioPorFatura)}`
              : 'Sem ticket calculado'
          }
          icon={<Wallet className="h-5 w-5" />}
        />
        <KpiTrendCard
          title="Recebido"
          featureHint="Mostra o valor ja recebido e a taxa de conversao financeira do periodo."
          value={formatCurrency(valorRecebido)}
          progressPercent={taxaRecebimento}
          sparkline={sparkRecebido}
          footerLeft={`${taxaRecebimento.toFixed(0)}% de conversão financeira`}
          footerRight={`${formatNumber(recebidasCount)} faturas pagas`}
          icon={<Wallet className="h-5 w-5" />}
        />
        <KpiTrendCard
          title="Em aberto"
          featureHint="Mostra o saldo ainda em aberto, incluindo volume vencido no periodo."
          value={formatCurrency(valorEmAberto)}
          progressPercent={clampPercent(100 - taxaRecebimento)}
          progressTone="amber"
          sparkline={sparkAtrasado}
          footerLeft={`${formatNumber(vencidasCount)} faturas vencidas`}
          footerRight={
            totalAtrasado > 0
              ? `Atrasado: ${formatCompactCurrency(totalAtrasado)}`
              : 'Sem atraso relevante'
          }
          icon={<Wallet className="h-5 w-5" />}
        />
        <KpiTrendCard
          title="Fila de aprovações"
          featureHint="Mostra quantos itens aguardam aprovacao e o impacto financeiro da fila."
          value={formatNumber(pendenciasAprovacao.length)}
          valueSuffix="itens"
          progressPercent={clampPercent(pendenciasAprovacao.length * 12)}
          progressTone="amber"
          footerLeft={
            pendenciasValor > 0
              ? `Fila: ${formatCompactCurrency(pendenciasValor)}`
              : 'Sem valor pendente'
          }
          footerRight={`${formatNumber(importacoesRecentesCount)} importações recentes`}
          icon={<ShieldCheck className="h-5 w-5" />}
        />
        <GoalProgressCard
          title="Posicao de caixa"
          featureHint="Compara o saldo bancario atual com o desembolso mensal estimado."
          primaryValue={formatCurrency(saldoBancarioTotal)}
          primaryLabel="Saldo bancário"
          secondaryValue={formatCurrency(totalMes)}
          secondaryLabel="Desembolso mensal"
          progressPercent={caixaPercent}
          projectionLabel={caixaCoverageLabel}
          icon={<Landmark className="h-5 w-5" />}
        />
      </section>

      <section className="grid grid-cols-1 gap-3.5 2xl:grid-cols-12">
        <article className="space-y-3.5 2xl:col-span-9">
          <div id="financeiro-alertas-operacionais" className={sectionSurfaceClass}>
            <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
              <div>
                <span className="inline-flex items-center rounded-full border border-[#D7E5EA] bg-[#F5FAFB] px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#4F7282]">
                  Operacao critica
                </span>
                <div className="mt-2 flex items-center gap-2">
                  <BellRing className="h-4.5 w-4.5 text-[#2A5C70]" />
                  <h3 className="text-[20px] font-semibold tracking-[-0.012em] text-[#18374B]">
                    Alertas operacionais
                  </h3>
                </div>
                <p className="mt-1 text-[13px] text-[#617D89]">
                  Priorização de risco e ações imediatas para o time financeiro.
                </p>
              </div>
              <button
                type="button"
                onClick={() => void refresh()}
                className="inline-flex items-center gap-1 rounded-[10px] border border-[#D5E3E8] px-2.5 py-1.5 text-[13px] font-semibold text-[#2A5C70] hover:bg-[#F3F9F8]"
              >
                Revalidar alertas
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="mb-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2 2xl:grid-cols-4">
              <div className="rounded-[14px] border border-[#F2D4D4] bg-[#FFF5F5] px-3.5 py-3 text-[#8A3030]">
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em]">Críticos</p>
                <p className="mt-1 text-[22px] font-semibold leading-none">
                  {formatNumber(contadoresAlertas.critical)}
                </p>
                <p className="mt-2 text-[12px] text-[#9C5454]">
                  Itens que exigem resposta imediata.
                </p>
              </div>
              <div className="rounded-[14px] border border-[#F4E1BF] bg-[#FFF8EB] px-3.5 py-3 text-[#8A5D11]">
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em]">Em atenção</p>
                <p className="mt-1 text-[22px] font-semibold leading-none">
                  {formatNumber(contadoresAlertas.warning)}
                </p>
                <p className="mt-2 text-[12px] text-[#9A7A34]">
                  Demandas com potencial de escalada.
                </p>
              </div>
              <div className="rounded-[14px] border border-[#DDEAF0] bg-[#F4FAFD] px-3.5 py-3 text-[#2F5C72]">
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em]">Ativos</p>
                <p className="mt-1 text-[22px] font-semibold leading-none">
                  {formatNumber(alertasAtivosCount)}
                </p>
                <p className="mt-2 text-[12px] text-[#5E8397]">
                  Alertas ainda sem resolução final.
                </p>
              </div>
              <div className="rounded-[14px] border border-[#DDE7EC] bg-[#F8FBFD] px-3.5 py-3 text-[#436273]">
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em]">Cobertura</p>
                <p className="mt-1 text-[22px] font-semibold leading-none">
                  {formatNumber(alertasReprocessaveisCount)}
                </p>
                <p className="mt-2 text-[12px] text-[#69808C]">
                  reprocessáveis • {formatNumber(alertasReconhecidosCount)} reconhecidos
                </p>
              </div>
            </div>

            {warningAlertas ? (
              <p className="mb-3 text-[13px] text-[#A56B13]">{warningAlertas}</p>
            ) : null}

            {alertasPriorizados.length === 0 ? (
              <p className="rounded-[14px] border border-dashed border-[#DCE7EB] bg-[#FAFCFD] px-3 py-4 text-[14px] text-[#5D7785]">
                Sem alertas operacionais ativos no momento.
              </p>
            ) : (
              <div className="space-y-3">
                {alertasPriorizados.slice(0, 6).map((alerta) => {
                  const currentAction = alertaActionById[alerta.id];
                  const isProcessing = Boolean(currentAction);
                  return (
                    <div
                      key={alerta.id}
                      className="rounded-[16px] border border-[#E2ECEF] bg-[#FBFDFD] px-3.5 py-3.5"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="mb-2 flex flex-wrap items-center gap-2">
                            <span
                              className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-semibold ${
                                alerta.severidade === 'critical'
                                  ? 'bg-[#FFE9E9] text-[#A93B3B]'
                                  : alerta.severidade === 'warning'
                                    ? 'bg-[#FFF2DD] text-[#A16A16]'
                                    : 'bg-[#EAF4F8] text-[#436B80]'
                              }`}
                            >
                              {alerta.severidade === 'critical' ? (
                                <AlertTriangle className="h-3 w-3" />
                              ) : (
                                <CheckCircle2 className="h-3 w-3" />
                              )}
                              {alertSeverityLabelMap[alerta.severidade]}
                            </span>
                            <span className="inline-flex items-center rounded-full border border-[#D8E5EA] bg-white px-2 py-1 text-[11px] font-semibold text-[#5D7885]">
                              {alertStatusLabelMap[alerta.status]}
                            </span>
                            <span className="text-[11px] text-[#7E96A2]">
                              Criado em {formatDateTime(alerta.createdAt)}
                            </span>
                          </div>

                          <p className="text-[14px] font-semibold text-[#1C3B4E]">
                            {alerta.titulo}
                          </p>
                          {alerta.descricao ? (
                            <p className="mt-1 text-[13px] text-[#5F7C89]">{alerta.descricao}</p>
                          ) : null}

                          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-[#7E96A2]">
                            {alerta.referencia ? <span>Ref.: {alerta.referencia}</span> : null}
                            <span>Atualizado: {formatDateTime(alerta.updatedAt)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        {alerta.status === 'ativo' ? (
                          <button
                            type="button"
                            onClick={() => void atualizarAlerta(alerta, 'ack')}
                            disabled={isProcessing}
                            className="rounded-[10px] border border-[#D9E7EB] bg-white px-2.5 py-1.5 text-[12px] font-semibold text-[#305C70] disabled:opacity-60"
                          >
                            {currentAction === 'ack' ? 'Processando...' : 'Reconhecer'}
                          </button>
                        ) : null}
                        {isAlertaReprocessavel(alerta.tipo) ? (
                          <button
                            type="button"
                            onClick={() => void atualizarAlerta(alerta, 'reprocessar')}
                            disabled={isProcessing}
                            className="rounded-[10px] border border-[#D9E7EB] bg-white px-2.5 py-1.5 text-[12px] font-semibold text-[#305C70] disabled:opacity-60"
                          >
                            {currentAction === 'reprocessar' ? 'Reprocessando...' : 'Reprocessar'}
                          </button>
                        ) : null}
                        <button
                          type="button"
                          onClick={() => void atualizarAlerta(alerta, 'resolver')}
                          disabled={isProcessing}
                          className="rounded-[10px] border border-[#159A9C] bg-[#159A9C] px-2.5 py-1.5 text-[12px] font-semibold text-white disabled:opacity-60"
                        >
                          {currentAction === 'resolver' ? 'Processando...' : 'Resolver'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className={sectionSurfaceClass}>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div>
                <span className="inline-flex items-center rounded-full border border-[#D7E5EA] bg-[#F5FAFB] px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#4F7282]">
                  Visao operacional
                </span>
                <h3 className="mt-2 text-[20px] font-semibold tracking-[-0.012em] text-[#18374B]">
                  Resumo operacional
                </h3>
                <p className="mt-1 text-[13px] text-[#617D89]">
                  Itens que merecem acompanhamento diário do financeiro.
                </p>
              </div>
              <button
                type="button"
                onClick={() => navigate('/financeiro/contas-pagar')}
                className="inline-flex items-center gap-1 rounded-[10px] border border-[#D5E3E8] px-2.5 py-1.5 text-[13px] font-semibold text-[#2A5C70] hover:bg-[#F3F9F8]"
              >
                Contas a pagar
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="grid grid-cols-1 gap-2.5 md:grid-cols-3">
              <div className={neutralMetricCardClass}>
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#6D8793]">
                  Atrasado
                </p>
                <p className="mt-1 text-[22px] font-semibold leading-none text-[#1C3B4E]">
                  {formatCurrency(totalAtrasado)}
                </p>
                <p className="mt-2 text-[12px] text-[#738B97]">
                  Montante vencido aguardando tratamento.
                </p>
              </div>
              <div className={neutralMetricCardClass}>
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#6D8793]">
                  Pendencias
                </p>
                <p className="mt-1 text-[22px] font-semibold leading-none text-[#1C3B4E]">
                  {formatCurrency(pendenciasValor)}
                </p>
                <p className="mt-2 text-[12px] text-[#738B97]">
                  Fila financeira aguardando aprovação.
                </p>
              </div>
              <div className={neutralMetricCardClass}>
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#6D8793]">
                  Importações
                </p>
                <p className="mt-1 text-[22px] font-semibold leading-none text-[#1C3B4E]">
                  {formatNumber(importacoesConciliacao.length)}
                </p>
                <p className="mt-2 text-[12px] text-[#738B97]">
                  Arquivos recentes para conciliação bancária.
                </p>
              </div>
            </div>
          </div>

          <div className={sectionSurfaceClass}>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div>
                <span className="inline-flex items-center rounded-full border border-[#D7E5EA] bg-[#F5FAFB] px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#4F7282]">
                  Atalhos financeiros
                </span>
                <h3 className="mt-2 text-[20px] font-semibold tracking-[-0.012em] text-[#18374B]">
                  Acoes rapidas
                </h3>
                <p className="mt-1 text-[13px] text-[#617D89]">
                  Atalhos com contexto para reduzir clique e decisao desnecessaria.
                </p>
              </div>
              <button
                type="button"
                onClick={() => navigate('/financeiro/conciliacao')}
                className="inline-flex items-center gap-1 rounded-[10px] border border-[#D5E3E8] px-2.5 py-1.5 text-[13px] font-semibold text-[#2A5C70] hover:bg-[#F3F9F8]"
              >
                Conciliacao
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="grid grid-cols-1 gap-2.5 md:grid-cols-3">
              <button
                type="button"
                onClick={() => navigate('/financeiro/aprovacoes')}
                className={quickActionCardClass}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[14px] font-semibold text-[#1C3B4E]">Fila de aprovações</p>
                    <p className="mt-1 text-[12px] text-[#708894]">
                      {formatNumber(pendenciasAprovacao.length)} itens somando{' '}
                      {formatCompactCurrency(pendenciasValor)}.
                    </p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-[#6F8894]" />
                </div>
              </button>
              <button
                type="button"
                onClick={() => navigate('/financeiro/contas-bancarias')}
                className={quickActionCardClass}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[14px] font-semibold text-[#1C3B4E]">Contas bancárias</p>
                    <p className="mt-1 text-[12px] text-[#708894]">
                      Saldo consolidado de {formatCompactCurrency(saldoBancarioTotal)}.
                    </p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-[#6F8894]" />
                </div>
              </button>
              <button
                type="button"
                onClick={() => navigate('/financeiro/contas-receber')}
                className={quickActionCardClass}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[14px] font-semibold text-[#1C3B4E]">Contas a receber</p>
                    <p className="mt-1 text-[12px] text-[#708894]">
                      {formatNumber(totalQuantidadeFaturas)} faturas e{' '}
                      {formatCompactCurrency(valorEmAberto)} em aberto.
                    </p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-[#6F8894]" />
                </div>
              </button>
            </div>
          </div>
        </article>

        <div className="2xl:col-span-3">
          <InsightsPanel
            insights={insights}
            onInsightClick={abrirInsight}
            onShareClick={() => {
              void compartilharInsights();
            }}
          />
        </div>
      </section>
    </div>
  );
};

export default FinanceiroDashboardV2;
