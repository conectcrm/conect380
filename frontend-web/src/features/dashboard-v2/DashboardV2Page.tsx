import React, { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, BadgeCheck, Clock3, DollarSign, RefreshCw, Target } from 'lucide-react';
import {
  useDashboardV2,
  type DashboardV2Insight,
  type DashboardV2PeriodPreset,
  type DashboardV2TrendPoint,
} from './useDashboardV2';
import KpiTrendCard from './components/KpiTrendCard';
import GoalProgressCard from './components/GoalProgressCard';
import ConversionFunnel from './components/ConversionFunnel';
import InsightsPanel from './components/InsightsPanel';
import PipelineStageSummary from './components/PipelineStageSummary';
import { useAuth } from '../../contexts/AuthContext';
import { toastService } from '../../services/toastService';

type ChartWindow = '3m' | '6m' | '12m';
type ComercialDrilldownMetric =
  | 'geral'
  | 'faturamento'
  | 'ticket-medio'
  | 'ganhos'
  | 'pipeline-negociacao'
  | 'meta-carteira';

type MonthTrend = {
  key: string;
  label: string;
  receitaFechada: number;
  receitaPrevista: number;
  ticketMedio: number;
};

type VendedorOption = {
  id: string;
  nome: string;
};

const dashboardPeriodOptions: Array<{ value: DashboardV2PeriodPreset; label: string }> = [
  { value: 'today', label: 'Hoje' },
  { value: 'yesterday', label: 'Ontem' },
  { value: '7d', label: 'Ultimos 7 dias' },
  { value: '30d', label: 'Ultimos 30 dias' },
  { value: '90d', label: 'Ultimos 90 dias' },
  { value: 'month', label: 'Mes atual' },
  { value: 'lastMonth', label: 'Mes anterior' },
  { value: 'ytd', label: 'Ano atual' },
  { value: '365d', label: 'Ultimos 12 meses' },
  { value: 'custom', label: 'Personalizado' },
];

const dashboardQuickPeriodChips: Array<{ value: DashboardV2PeriodPreset; label: string }> = [
  { value: 'today', label: 'Hoje' },
  { value: '7d', label: '7 dias' },
  { value: 'month', label: 'Mes atual' },
  { value: '30d', label: '30 dias' },
  { value: '90d', label: '90 dias' },
];

const dashboardTrendLabelByPreset: Record<Exclude<DashboardV2PeriodPreset, 'custom'>, string> = {
  today: 'vs. inicio de hoje',
  yesterday: 'vs. inicio de ontem',
  '7d': 'vs. inicio dos ultimos 7 dias',
  '30d': 'vs. inicio dos ultimos 30 dias',
  '90d': 'vs. inicio dos ultimos 90 dias',
  month: 'vs. inicio do mes atual',
  lastMonth: 'vs. inicio do mes anterior',
  ytd: 'vs. inicio do ano atual',
  '365d': 'vs. inicio dos ultimos 12 meses',
};

const periodButtons: Array<{ key: ChartWindow; label: string }> = [
  { key: '3m', label: '3M' },
  { key: '6m', label: '6M' },
  { key: '12m', label: '12M' },
];

const chartWindowSize: Record<ChartWindow, number> = {
  '3m': 3,
  '6m': 6,
  '12m': 12,
};

const monthFormatter = new Intl.DateTimeFormat('pt-BR', { month: 'short' });

const formatCurrency = (value: number): string =>
  value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

const formatCompactCurrency = (value: number): string => {
  if (Math.abs(value) >= 1_000_000) {
    return `R$${(value / 1_000_000).toFixed(1)}M`;
  }

  if (Math.abs(value) >= 1_000) {
    return `R$${(value / 1_000).toFixed(0)}K`;
  }

  return formatCurrency(value);
};

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

const parseDateValue = (value: string): Date | null => {
  if (!value) return null;

  const normalized = value.includes('T') ? value.slice(0, 10) : value;
  const match = normalized.match(/^(\d{4})-(\d{2})-(\d{2})$/);

  if (match) {
    const [, yearRaw, monthRaw, dayRaw] = match;
    const year = Number(yearRaw);
    const month = Number(monthRaw);
    const day = Number(dayRaw);
    const parsed = new Date(year, month - 1, day);

    if (
      !Number.isNaN(parsed.getTime()) &&
      parsed.getFullYear() === year &&
      parsed.getMonth() === month - 1 &&
      parsed.getDate() === day
    ) {
      return parsed;
    }
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
};

const formatDateLabel = (value: string): string => {
  const parsed = parseDateValue(value);
  if (!parsed) return value;

  return parsed.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

const formatRangeLabel = (start: string, end: string): string =>
  `${formatDateLabel(start)} a ${formatDateLabel(end)}`;

const average = (values: number[]): number => {
  if (!values.length) return 0;
  return values.reduce((total, value) => total + value, 0) / values.length;
};

const trendDelta = (points: DashboardV2TrendPoint[], key: keyof DashboardV2TrendPoint): number => {
  if (!points.length) return 0;

  const values = points.map((point) => Number(point[key] || 0));
  if (values.length < 2) return 0;

  const chunkSize = Math.max(1, Math.min(7, Math.floor(values.length / 3) || 1));
  const baselineChunk = values.slice(0, chunkSize);
  const currentChunk = values.slice(-chunkSize);
  let baseline = average(baselineChunk);
  const current = average(currentChunk);

  if (Math.abs(baseline) < 0.0001) {
    const historicalNonZero = values.slice(0, -1).find((value) => Math.abs(value) >= 0.0001);
    baseline = typeof historicalNonZero === 'number' ? historicalNonZero : 0;
  }

  if (Math.abs(baseline) < 0.0001) {
    return 0;
  }

  return ((current - baseline) / Math.abs(baseline)) * 100;
};

const toMonthLabel = (monthKey: string): string => {
  const [year, month] = monthKey.split('-').map(Number);
  if (!year || !month) return monthKey;
  return monthFormatter.format(new Date(year, month - 1, 1)).replace('.', '');
};

const buildMonthlySeries = (points: DashboardV2TrendPoint[]): MonthTrend[] => {
  const buckets = new Map<string, MonthTrend>();

  points.forEach((point) => {
    const key = String(point.date || '').slice(0, 7);
    if (!key) return;

    const current = buckets.get(key) || {
      key,
      label: toMonthLabel(key),
      receitaFechada: 0,
      receitaPrevista: 0,
      ticketMedio: 0,
    };

    current.receitaFechada += Number(point.receitaFechada || 0);
    current.receitaPrevista += Number(point.receitaPrevista || 0);
    current.ticketMedio += Number(point.ticketMedio || 0);

    buckets.set(key, current);
  });

  return Array.from(buckets.values()).sort((a, b) => a.key.localeCompare(b.key));
};

const DashboardV2Page: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data, loading, error, filters, activeRange, setFilters, refresh, refreshing } =
    useDashboardV2(true);
  const [chartWindow, setChartWindow] = useState<ChartWindow>('3m');
  const vendedorOptions = useMemo<VendedorOption[]>(() => {
    const vendedores = data?.salesActivities?.porVendedor ?? [];
    if (!vendedores.length) {
      return [];
    }

    const uniqueById = new Map<string, VendedorOption>();
    vendedores.forEach((vendedor) => {
      const id = String(vendedor?.vendedorId || '').trim();
      const nome = String(vendedor?.nome || '').trim();

      if (id && nome && !uniqueById.has(id)) {
        uniqueById.set(id, { id, nome });
      }
    });

    return Array.from(uniqueById.values()).sort((a, b) =>
      a.nome.localeCompare(b.nome, 'pt-BR', { sensitivity: 'base' }),
    );
  }, [data?.salesActivities?.porVendedor]);

  const trendPoints = useMemo(() => data?.trends?.points ?? [], [data?.trends?.points]);

  const receitaSparkline = useMemo(
    () => trendPoints.slice(-20).map((point) => Number(point.receitaFechada || 0)),
    [trendPoints],
  );

  const ticketSparkline = useMemo(
    () => trendPoints.slice(-20).map((point) => Number(point.ticketMedio || 0)),
    [trendPoints],
  );

  const conversaoSparkline = useMemo(
    () => trendPoints.slice(-20).map((point) => Number(point.conversao || 0)),
    [trendPoints],
  );

  const monthlySeries = useMemo(() => buildMonthlySeries(trendPoints), [trendPoints]);
  const windowSize = chartWindowSize[chartWindow];

  const currentWindow = useMemo(
    () => monthlySeries.slice(-windowSize),
    [monthlySeries, windowSize],
  );
  const previousWindow = useMemo(
    () => monthlySeries.slice(-(windowSize * 2), -windowSize),
    [monthlySeries, windowSize],
  );

  const vendasTotal = useMemo(
    () => currentWindow.reduce((acc, row) => acc + row.receitaFechada, 0),
    [currentWindow],
  );

  const metaTotal = useMemo(
    () => Number(data?.overview?.metaReceita || 0),
    [data?.overview?.metaReceita],
  );

  const previousVendas = useMemo(
    () => previousWindow.reduce((acc, row) => acc + row.receitaFechada, 0),
    [previousWindow],
  );

  const vendasVsPeriodoAnterior = useMemo(() => {
    if (previousVendas === 0) {
      return vendasTotal > 0 ? 100 : 0;
    }

    return ((vendasTotal - previousVendas) / Math.abs(previousVendas)) * 100;
  }, [previousVendas, vendasTotal]);

  const chartGoalLine = useMemo(() => metaTotal * 0.7, [metaTotal]);
  const chartMaxValue = useMemo(
    () => Math.max(metaTotal, vendasTotal, chartGoalLine, 1),
    [metaTotal, vendasTotal, chartGoalLine],
  );

  const yTicks = useMemo(() => {
    const ratios = [1, 0.75, 0.5, 0.25];
    return ratios.map((ratio) => Math.round(chartMaxValue * ratio));
  }, [chartMaxValue]);

  const receitaDeltaFallback = useMemo(
    () => trendDelta(trendPoints, 'receitaFechada'),
    [trendPoints],
  );
  const ticketDeltaFallback = useMemo(() => trendDelta(trendPoints, 'ticketMedio'), [trendPoints]);
  const conversaoDeltaFallback = useMemo(() => trendDelta(trendPoints, 'conversao'), [trendPoints]);
  const trendPeriodLabel =
    filters.periodPreset === 'custom'
      ? 'vs. inicio do periodo personalizado'
      : dashboardTrendLabelByPreset[filters.periodPreset];

  const goalProgress = useMemo(() => {
    const fechada = Number(data?.overview?.receitaFechada || 0);
    const metaReceita = Number(data?.overview?.metaReceita || 0);
    if (metaReceita <= 0) return 0;
    return (fechada / metaReceita) * 100;
  }, [data?.overview?.receitaFechada, data?.overview?.metaReceita]);

  const ticketBenchmark = useMemo(() => {
    if (trendPoints.length <= 1) return 0;

    const historical = trendPoints
      .slice(0, -1)
      .map((point) => Number(point.ticketMedio || 0))
      .filter((value) => value > 0);

    if (!historical.length) return 0;

    return historical.reduce((acc, value) => acc + value, 0) / historical.length;
  }, [trendPoints]);

  const ticketProgress = useMemo(() => {
    if (ticketBenchmark <= 0) return 0;
    return (Number(data?.overview?.ticketMedio || 0) / ticketBenchmark) * 100;
  }, [data?.overview?.ticketMedio, ticketBenchmark]);

  const negotiationStage = useMemo(
    () => data?.pipelineSummary?.stages?.find((stage) => stage.stage === 'negotiation'),
    [data?.pipelineSummary?.stages],
  );

  const wonStage = useMemo(
    () => data?.pipelineSummary?.stages?.find((stage) => stage.stage === 'won'),
    [data?.pipelineSummary?.stages],
  );

  const funnelStepToNegotiation = useMemo(
    () => data?.funnel?.steps?.find((step) => step.toStage === 'negotiation'),
    [data?.funnel?.steps],
  );

  const funnelStepToWon = useMemo(
    () => data?.funnel?.steps?.find((step) => step.toStage === 'won'),
    [data?.funnel?.steps],
  );

  const negotiationValueDeltaFallback = useMemo(
    () => trendDelta(trendPoints, 'receitaPrevista'),
    [trendPoints],
  );
  const negotiationCount = Number(negotiationStage?.quantidade || 0);
  const activeOpportunityCount = Number(data?.overview?.oportunidadesAtivas || 0);

  const negotiationSharePercent = useMemo(() => {
    if (!activeOpportunityCount) return 0;
    return (negotiationCount / activeOpportunityCount) * 100;
  }, [activeOpportunityCount, negotiationCount]);

  const wonConversionPercent = Math.max(0, Number(funnelStepToWon?.conversionRate || 0));
  const receitaTrendPercent = receitaDeltaFallback;
  const ticketTrendPercent = ticketDeltaFallback;
  const vendasFechadasTrendPercent = conversaoDeltaFallback;
  const negociacaoTrendPercent = negotiationValueDeltaFallback;
  const progressoAtivoTrendPercent = receitaDeltaFallback;

  const vendasVsPeriodoAnteriorSignal = vendasVsPeriodoAnterior >= 0 ? '+' : '-';
  const vendasVsPeriodoAnteriorClass =
    vendasVsPeriodoAnterior >= 0 ? 'text-[#159E84]' : 'text-[#AF3D4F]';
  const hasActiveFilters =
    filters.periodPreset !== '30d' || Boolean(filters.vendedorId) || Boolean(filters.pipelineId);
  const handlePeriodPresetChange = (preset: DashboardV2PeriodPreset): void => {
    if (preset === 'custom') {
      setFilters({
        periodPreset: preset,
        customStart: activeRange.periodStart,
        customEnd: activeRange.periodEnd,
      });
      return;
    }

    setFilters({
      periodPreset: preset,
    });
  };
  const latestGeneratedAt =
    data?.overview?.cache?.generatedAt ||
    data?.trends?.cache?.generatedAt ||
    data?.funnel?.cache?.generatedAt ||
    data?.pipelineSummary?.cache?.generatedAt ||
    data?.insights?.cache?.generatedAt ||
    '';
  const latestGeneratedAtLabel = latestGeneratedAt
    ? formatDateTime(latestGeneratedAt)
    : 'Atualizado agora';
  const metaProgressPercent = Math.max(0, Math.min(100, goalProgress));
  const horaAtual = new Date().getHours();
  const saudacaoPeriodo = horaAtual < 12 ? 'Bom dia' : horaAtual < 18 ? 'Boa tarde' : 'Boa noite';
  const primeiroNome =
    user?.nome && user.nome.trim().length > 0 ? user.nome.trim().split(/\s+/)[0] : 'time';
  const empresaLabel = user?.empresa?.nome || 'operacao comercial';
  const saudacaoTitulo = `${saudacaoPeriodo}, ${primeiroNome}`;
  const vendedorSelecionadoLabel = filters.vendedorId
    ? vendedorOptions.find((option) => option.id === filters.vendedorId)?.nome ||
      'Vendedor filtrado'
    : 'Todos os vendedores';
  const statusComercialLabel =
    metaProgressPercent >= 100
      ? 'Meta superada'
      : metaProgressPercent >= 70
        ? 'Em caminho certo'
        : 'Em atencao';
  const statusComercialTone =
    metaProgressPercent >= 100
      ? 'bg-[#E8F6F4] text-[#166A6B]'
      : metaProgressPercent >= 70
        ? 'bg-[#EAF5FA] text-[#2C708D]'
        : 'bg-[#FFF4E9] text-[#A06213]';
  const buildComercialDrilldownPath = useCallback(
    (metric: ComercialDrilldownMetric): string => {
      const params = new URLSearchParams({
        metric,
        periodStart: activeRange.periodStart,
        periodEnd: activeRange.periodEnd,
      });

      if (filters.vendedorId) {
        params.set('vendedorId', filters.vendedorId);
      }

      if (filters.pipelineId) {
        params.set('pipelineId', filters.pipelineId);
      }

      return `/relatorios/comercial/drilldown?${params.toString()}`;
    },
    [activeRange.periodEnd, activeRange.periodStart, filters.pipelineId, filters.vendedorId],
  );

  const abrirInsight = useCallback(
    (insight: DashboardV2Insight) => {
      switch (insight.id) {
        case 'previsto-maior-que-fechado':
          navigate(buildComercialDrilldownPath('pipeline-negociacao'));
          return;
        case 'queda-receita-fechada':
          navigate(buildComercialDrilldownPath('faturamento'));
          return;
        case 'oportunidades-paradas':
          navigate(buildComercialDrilldownPath('pipeline-negociacao'));
          return;
        case 'painel-estavel':
          navigate(buildComercialDrilldownPath('geral'));
          return;
        default:
          navigate(buildComercialDrilldownPath('geral'));
      }
    },
    [buildComercialDrilldownPath, navigate],
  );

  const compartilharInsights = useCallback(async () => {
    const insights = data?.insights?.insights || [];
    if (!insights.length) {
      toastService.info('Sem insights para compartilhar neste periodo.');
      return;
    }

    const linhas = insights.slice(0, 5).map((insight, index) => {
      const acao = insight.action ? ` | Acao: ${insight.action}` : '';
      return `${index + 1}. ${insight.title} - ${insight.description}${acao}`;
    });

    const resumo = `Insights comerciais (${formatRangeLabel(activeRange.periodStart, activeRange.periodEnd)})\n${linhas.join('\n')}`;
    const clipboardApi =
      typeof navigator !== 'undefined' && navigator.clipboard
        ? navigator.clipboard
        : null;

    if (!clipboardApi) {
      toastService.warning('Copia automatica indisponivel neste navegador.');
      return;
    }

    try {
      await clipboardApi.writeText(resumo);
      toastService.success('Insights copiados para a area de transferencia.');
    } catch {
      toastService.error('Nao foi possivel copiar os insights automaticamente.');
    }
  }, [activeRange.periodEnd, activeRange.periodStart, data?.insights?.insights]);

  if (loading) {
    return (
      <div className="space-y-3.5">
        <div className="h-9 w-40 animate-pulse rounded-xl bg-[#E6EFF0]" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 min-[1850px]:grid-cols-5">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="h-[232px] animate-pulse rounded-[20px] bg-[#E6EFF0]" />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-3 xl:grid-cols-12">
          <div className="xl:col-span-9">
            <div className="h-[382px] animate-pulse rounded-[20px] bg-[#E6EFF0]" />
          </div>
          <div className="xl:col-span-3">
            <div className="h-[382px] animate-pulse rounded-[20px] bg-[#E6EFF0]" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <section className="rounded-[20px] border border-[#F1D3D8] bg-[#FFF5F7] p-5">
        <h2 className="text-xl font-semibold text-[#8A2335]">Falha ao carregar o Dashboard V2</h2>
        <p className="mt-2 text-sm text-[#8A2335]">{error}</p>
        <button
          type="button"
          onClick={() => {
            void refresh();
          }}
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#C53A53] px-4 py-2 text-sm font-semibold text-white hover:bg-[#A93247]"
        >
          <RefreshCw className="h-4 w-4" />
          Tentar novamente
        </button>
      </section>
    );
  }

  if (!data) {
    return (
      <section className="rounded-[20px] border border-[#DCE6EA] bg-white p-5 shadow-[0_10px_28px_-22px_rgba(15,55,71,0.45)]">
        <h2 className="text-xl font-semibold text-[#173548]">Sem dados no Dashboard V2</h2>
        <p className="mt-2 text-sm text-[#5E7A88]">
          Sincronize os dados para gerar os indicadores analiticos.
        </p>
      </section>
    );
  }

  const vendasBarHeight = `${(vendasTotal / chartMaxValue) * 100}%`;
  const metaBarHeight = `${(metaTotal / chartMaxValue) * 100}%`;
  const goalLineTop = `${100 - (chartGoalLine / chartMaxValue) * 100}%`;

  return (
    <div className="space-y-4">
      <section className="mb-6 rounded-[20px] border border-[#DCE7EB] bg-[linear-gradient(135deg,#F9FDFD_0%,#F0F8F8_55%,#F8FCFC_100%)] p-5 shadow-[0_16px_30px_-24px_rgba(16,57,74,0.28)]">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="min-w-0">
            <span className="inline-flex items-center rounded-full border border-[#CFE6E8] bg-white/80 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#4C7283]">
              Dashboard Comercial Global
            </span>
            <h1 className="mt-2 text-[27px] font-semibold tracking-[-0.02em] text-[#173A4E]">
              {saudacaoTitulo}
            </h1>
            <p className="mt-1 text-[14px] text-[#4D6D7B]">
              Visao consolidada de vendas em{' '}
              <span className="font-semibold text-[#1D4F63]">{empresaLabel}</span>.
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center rounded-full border border-[#D3E4E8] bg-white px-2.5 py-1 text-[12px] font-medium text-[#466777]">
                Periodo: {formatRangeLabel(activeRange.periodStart, activeRange.periodEnd)}
              </span>
              <span className="inline-flex items-center rounded-full border border-[#D3E4E8] bg-white px-2.5 py-1 text-[12px] font-medium text-[#466777]">
                Atualizado: {latestGeneratedAtLabel}
              </span>
              <span className="inline-flex items-center rounded-full border border-[#D3E4E8] bg-white px-2.5 py-1 text-[12px] font-medium text-[#466777]">
                Equipe: {vendedorSelecionadoLabel}
              </span>
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-1 text-[12px] font-semibold ${statusComercialTone}`}
              >
                {statusComercialLabel}
              </span>
            </div>
          </div>

          <div className="w-full rounded-[14px] border border-[#D5E3E8] bg-white/80 p-3.5 xl:w-auto xl:min-w-[560px]">
            <div className="flex w-full flex-wrap items-center gap-2">
              <label
                htmlFor="dashboard-v2-period"
                className="text-[13px] font-medium text-[#567583]"
              >
                Periodo
              </label>
              <select
                id="dashboard-v2-period"
                value={filters.periodPreset}
                onChange={(event) =>
                  handlePeriodPresetChange(event.target.value as DashboardV2PeriodPreset)
                }
                className="w-full min-w-0 rounded-[10px] border border-[#D5E3E8] bg-white px-3 py-2 text-[13px] text-[#244556] focus:border-[#159A9C] focus:outline-none sm:w-auto sm:min-w-[180px]"
              >
                {dashboardPeriodOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

              {filters.periodPreset === 'custom' ? (
                <>
                  <input
                    type="date"
                    aria-label="Data inicial"
                    value={filters.customStart || ''}
                    onChange={(event) =>
                      setFilters({
                        customStart: event.target.value || undefined,
                      })
                    }
                    className="w-full rounded-[10px] border border-[#D5E3E8] bg-white px-3 py-2 text-[13px] text-[#244556] focus:border-[#159A9C] focus:outline-none sm:w-auto"
                  />
                  <input
                    type="date"
                    aria-label="Data final"
                    value={filters.customEnd || ''}
                    onChange={(event) =>
                      setFilters({
                        customEnd: event.target.value || undefined,
                      })
                    }
                    className="w-full rounded-[10px] border border-[#D5E3E8] bg-white px-3 py-2 text-[13px] text-[#244556] focus:border-[#159A9C] focus:outline-none sm:w-auto"
                  />
                </>
              ) : null}

              <label
                htmlFor="dashboard-v2-vendedor"
                className="text-[13px] font-medium text-[#567583]"
              >
                Vendedor
              </label>
              <select
                id="dashboard-v2-vendedor"
                value={filters.vendedorId || ''}
                onChange={(event) =>
                  setFilters({
                    vendedorId: event.target.value || undefined,
                  })
                }
                className="w-full min-w-0 rounded-[10px] border border-[#D5E3E8] bg-white px-3 py-2 text-[13px] text-[#244556] focus:border-[#159A9C] focus:outline-none sm:w-auto sm:min-w-[220px]"
              >
                <option value="">Todos</option>
                {vendedorOptions.map((vendedor, index) => (
                  <option key={`${vendedor.id}-${index}`} value={vendedor.id}>
                    {vendedor.nome}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={() => {
                  setFilters({
                    periodPreset: '30d',
                    customStart: undefined,
                    customEnd: undefined,
                    vendedorId: undefined,
                    pipelineId: undefined,
                  });
                }}
                disabled={!hasActiveFilters}
                className="inline-flex items-center gap-2 rounded-[10px] border border-[#D5E3E8] px-3 py-2 text-[13px] font-semibold text-[#26495C] hover:bg-[#F3F9F8] disabled:cursor-not-allowed disabled:opacity-50"
              >
                Limpar filtros
              </button>

              <button
                type="button"
                onClick={() => {
                  void refresh();
                }}
                className="inline-flex items-center gap-2 rounded-[10px] border border-[#D5E3E8] px-3 py-2 text-[13px] font-semibold text-[#26495C] hover:bg-[#F3F9F8]"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
                Atualizar
              </button>
            </div>

            <div
              className="mt-2.5 flex w-full flex-wrap items-center gap-1.5"
              role="group"
              aria-label="Atalhos de periodo"
            >
              {dashboardQuickPeriodChips.map((chip) => {
                const isActive = filters.periodPreset === chip.value;

                return (
                  <button
                    key={chip.value}
                    type="button"
                    onClick={() => handlePeriodPresetChange(chip.value)}
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
              <p className="text-[11px] uppercase tracking-wide text-[#7A929E]">Meta concluida</p>
              <p className="text-[16px] font-semibold text-[#18374B]">
                {metaProgressPercent.toFixed(0)}%
              </p>
            </div>
            <Target className="h-5 w-5 text-[#159A9C]" />
          </div>
          <div className="flex items-center justify-between rounded-[12px] border border-[#DCE7EB] bg-white/90 px-3 py-2">
            <div>
              <p className="text-[11px] uppercase tracking-wide text-[#7A929E]">Faturamento</p>
              <p className="text-[16px] font-semibold text-[#18374B]">
                {formatCompactCurrency(data.overview.receitaFechada)}
              </p>
            </div>
            <DollarSign className="h-5 w-5 text-[#159A9C]" />
          </div>
          <div className="flex items-center justify-between rounded-[12px] border border-[#DCE7EB] bg-white/90 px-3 py-2">
            <div>
              <p className="text-[11px] uppercase tracking-wide text-[#7A929E]">Ganhos</p>
              <p className="text-[16px] font-semibold text-[#18374B]">
                {formatNumber(Number(wonStage?.quantidade || 0))} vendas
              </p>
            </div>
            <BadgeCheck className="h-5 w-5 text-[#159A9C]" />
          </div>
        </div>

        <div className="mt-4 h-2 w-full rounded-full bg-[#DEEFE7]">
          <div
            className="h-2 rounded-full bg-[#159A9C] transition-all"
            style={{ width: `${metaProgressPercent}%` }}
          />
        </div>
      </section>
      <section className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 min-[1850px]:grid-cols-5">
        <KpiTrendCard
          title="Faturamento"
          featureHint="Mostra a receita fechada no periodo selecionado. Clique para abrir o relatorio contextual."
          value={formatCurrency(data.overview.receitaFechada)}
          trendPercent={receitaTrendPercent}
          trendLabel={trendPeriodLabel}
          sparkline={receitaSparkline}
          progressPercent={goalProgress}
          progressTone="amber"
          footerLeft={`Meta do recorte: ${formatCurrency(metaTotal)}`}
          footerRight={`${Math.max(0, goalProgress).toFixed(0)}% da meta atingida`}
          icon={<DollarSign className="h-5 w-5" />}
          onClick={() => navigate(buildComercialDrilldownPath('faturamento'))}
          ariaLabel="Abrir relatorio contextual de faturamento"
        />

        <KpiTrendCard
          title="Ticket Medio"
          featureHint="Mostra o valor médio por venda no período. Clique para abrir o relatório contextual."
          value={formatCurrency(data.overview.ticketMedio)}
          trendPercent={ticketTrendPercent}
          trendLabel={trendPeriodLabel}
          sparkline={ticketSparkline}
          progressPercent={ticketProgress}
          progressTone="teal"
          footerLeft={
            ticketBenchmark > 0
              ? `Base historica: ${formatCurrency(ticketBenchmark)}`
              : 'Historico insuficiente para comparacao'
          }
          footerRight={
            ticketProgress > 0 ? `${ticketProgress.toFixed(0)}% do benchmark recente` : ''
          }
          icon={<Target className="h-5 w-5" />}
          onClick={() => navigate(buildComercialDrilldownPath('ticket-medio'))}
          ariaLabel="Abrir relatório contextual de ticket médio"
        />

        <KpiTrendCard
          title="Ganhos no periodo"
          featureHint="Mostra quantas vendas foram ganhas e como está a conversão no período."
          value={formatNumber(Number(wonStage?.quantidade || 0))}
          valueSuffix="vendas"
          trendPercent={vendasFechadasTrendPercent}
          trendLabel={`taxa de conversao ${trendPeriodLabel}`}
          sparkline={conversaoSparkline}
          progressPercent={Math.max(0, Math.min(100, wonConversionPercent))}
          progressTone="teal"
          footerLeft={`Chegada ate negociacao: ${Math.max(0, Number(funnelStepToNegotiation?.conversionRate || 0)).toFixed(0)}%`}
          footerRight={`Taxa final de ganho: ${Math.max(0, wonConversionPercent).toFixed(0)}%`}
          icon={<BadgeCheck className="h-5 w-5" />}
          onClick={() => navigate(buildComercialDrilldownPath('ganhos'))}
          ariaLabel="Abrir relatório contextual de ganhos"
        />

        <KpiTrendCard
          title="Pipeline em negociacao"
          featureHint="Mostra o valor em negociação e a participação dessas oportunidades no pipeline."
          value={formatCurrency(Number(negotiationStage?.valor || 0))}
          trendPercent={negociacaoTrendPercent}
          trendLabel={`estoque em negociacao ${trendPeriodLabel}`}
          progressPercent={Math.max(0, Math.min(100, negotiationSharePercent))}
          progressTone="amber"
          footerLeft={`Chance de ganho: ${Math.max(0, wonConversionPercent).toFixed(0)}%`}
          footerRight={`${negotiationCount} de ${activeOpportunityCount} oportunidades ativas`}
          icon={<Clock3 className="h-5 w-5" />}
          onClick={() => navigate(buildComercialDrilldownPath('pipeline-negociacao'))}
          ariaLabel="Abrir relatório contextual de pipeline em negociação"
          rightVisual={
            <div className="relative h-[62px] w-[62px]">
              <svg viewBox="0 0 36 36" className="h-full w-full -rotate-90">
                <circle cx="18" cy="18" r="14" fill="none" stroke="#D8E7E0" strokeWidth="5" />
                <circle
                  cx="18"
                  cy="18"
                  r="14"
                  fill="none"
                  stroke="#49B896"
                  strokeWidth="5"
                  strokeDasharray={88}
                  strokeDashoffset={
                    88 - (88 * Math.max(0, Math.min(100, negotiationSharePercent))) / 100
                  }
                  strokeLinecap="round"
                />
              </svg>
            </div>
          }
        />

        <GoalProgressCard
          title="Meta e carteira ativa"
          featureHint="Compara a meta de receita com oportunidades ativas e a projecao do pipeline."
          primaryValue={formatCurrency(metaTotal)}
          primaryLabel="Meta"
          secondaryValue={formatNumber(data.overview.oportunidadesAtivas)}
          secondaryLabel="Oportunidades ativas"
          trendPercent={progressoAtivoTrendPercent}
          progressPercent={goalProgress}
          projectionLabel={`Projecao do pipeline: ${formatCurrency(data.overview.receitaPrevista)}`}
          icon={<Activity className="h-5 w-5" />}
        />
      </section>

      <section className="grid grid-cols-1 gap-3.5 2xl:grid-cols-12">
        <div className="space-y-3.5 2xl:col-span-9">
          <div className="grid grid-cols-1 gap-3.5 2xl:grid-cols-12">
            <article className="rounded-[20px] border border-[#DCE7EB] bg-white p-5 shadow-[0_16px_30px_-24px_rgba(16,57,74,0.28)] 2xl:col-span-7">
              <div className="flex flex-wrap items-start justify-between gap-2.5">
                <div>
                  <h3 className="text-[20px] font-semibold tracking-[-0.012em] text-[#18374B]">
                    Vendas vs. meta do periodo
                  </h3>
                  <p className="mt-1.5 inline-flex items-center gap-1 text-[14px] text-[#617D89]">
                    <span className={`font-semibold ${vendasVsPeriodoAnteriorClass}`}>
                      {vendasVsPeriodoAnteriorSignal}
                      {Math.abs(vendasVsPeriodoAnterior).toFixed(0)}%
                    </span>
                    vs janela anterior equivalente
                  </p>
                </div>

                <div className="inline-flex rounded-[11px] border border-[#DCE8EC] bg-[#ECF3F0] p-1">
                  {periodButtons.map((button) => (
                    <button
                      key={button.key}
                      type="button"
                      onClick={() => setChartWindow(button.key)}
                      className={`rounded-[9px] px-3 py-1 text-[13px] font-semibold transition ${
                        chartWindow === button.key
                          ? 'bg-white text-[#213D4B] shadow-[0_8px_18px_-14px_rgba(16,62,83,0.6)]'
                          : 'text-[#6B8390] hover:text-[#213D4B]'
                      }`}
                    >
                      {button.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-4 grid grid-cols-[62px_1fr] gap-2.5">
                <div className="relative h-[252px] text-[12px] text-[#8EA4AE]">
                  {yTicks.map((tick, index) => (
                    <div
                      key={`${tick}-${index}`}
                      className="absolute left-0 w-full -translate-y-1/2"
                      style={{ top: `${(index / (yTicks.length - 1 || 1)) * 100}%` }}
                    >
                      {formatCompactCurrency(tick)}
                    </div>
                  ))}
                  <div className="absolute bottom-0 left-0">R$0</div>
                </div>

                <div className="relative h-[252px] rounded-[15px] border border-[#E0EAEE] bg-[#FDFFFE] px-6 pb-9 pt-4">
                  {yTicks.map((_, index) => (
                    <div
                      key={`grid-${index}`}
                      className="absolute left-0 right-0 border-t border-dashed border-[#E8EFF2]"
                      style={{ top: `${(index / (yTicks.length - 1 || 1)) * 100}%` }}
                    />
                  ))}

                  <div
                    className="absolute left-0 right-0 border-t-2 border-dashed border-[#90A4AD]/22"
                    style={{ top: goalLineTop }}
                  />

                  <div className="relative z-10 flex h-full items-end justify-center gap-6">
                    <div className="w-[42%] max-w-[180px] text-center">
                      <div className="mx-auto flex h-[184px] w-full items-end justify-center">
                        <div
                          className="w-full rounded-t-[11px] border border-[#B9DED5] bg-[#BFE4DB]"
                          style={{ height: metaBarHeight }}
                        />
                      </div>
                    </div>

                    <div className="w-[42%] max-w-[180px] text-center">
                      <div className="mx-auto flex h-[184px] w-full items-end justify-center">
                        <div
                          className="w-full rounded-t-[11px] border border-[#E5B44C] bg-[#F0C055]"
                          style={{ height: vendasBarHeight }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 items-center gap-5 text-[13px] text-[#5F7B88]">
                    <span className="inline-flex items-center gap-1.5">
                      <span className="h-1.5 w-4 rounded-full bg-[#BFE5DC]" />
                      Meta
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <span className="h-1.5 w-4 rounded-full bg-[#F0C055]" />
                      Vendas
                    </span>
                  </div>
                </div>
              </div>
            </article>

            <div className="2xl:col-span-5">
              <ConversionFunnel steps={data.funnel.steps} />
            </div>
          </div>

          <PipelineStageSummary data={data.pipelineSummary} />
        </div>

        <div className="2xl:col-span-3">
          <InsightsPanel
            insights={data.insights.insights}
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

export default DashboardV2Page;


