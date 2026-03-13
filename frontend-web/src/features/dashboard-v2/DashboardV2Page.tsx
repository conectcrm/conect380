import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity,
  BadgeCheck,
  Clock3,
  DollarSign,
  RefreshCw,
  Target,
} from 'lucide-react';
import { useDashboardV2, type DashboardV2TrendPoint } from './useDashboardV2';
import KpiTrendCard from './components/KpiTrendCard';
import GoalProgressCard from './components/GoalProgressCard';
import ConversionFunnel from './components/ConversionFunnel';
import InsightsPanel from './components/InsightsPanel';
import PipelineStageSummary from './components/PipelineStageSummary';
import api from '../../services/api';

type ChartWindow = '3m' | '6m' | '12m';

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

const dashboardPeriodOptions: Array<{ value: '30d' | '90d' | '365d'; label: string }> = [
  { value: '30d', label: '30 dias' },
  { value: '90d', label: '90 dias' },
  { value: '365d', label: '12 meses' },
];

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

const trendDelta = (points: DashboardV2TrendPoint[], key: keyof DashboardV2TrendPoint): number => {
  if (!points.length) return 0;

  const first = Number(points[0][key] || 0);
  const last = Number(points[points.length - 1][key] || 0);

  if (Math.abs(first) < 0.0001) {
    return last === 0 ? 0 : 100;
  }

  return ((last - first) / Math.abs(first)) * 100;
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
  const { data, loading, error, filters, setFilters, refresh, refreshing } = useDashboardV2(true);
  const [chartWindow, setChartWindow] = useState<ChartWindow>('3m');
  const [vendedorOptions, setVendedorOptions] = useState<VendedorOption[]>([]);

  useEffect(() => {
    let mounted = true;

    const loadVendedores = async () => {
      try {
        const response = await api.get('/dashboard/resumo', {
          params: { periodo: 'mensal' },
        });

        if (!mounted) return;

        const metadata = response?.data?.metadata;
        const vendedores = Array.isArray(metadata?.vendedoresDisponiveis)
          ? metadata.vendedoresDisponiveis
          : [];

        const normalized = vendedores
          .map((vendedor: { id?: unknown; nome?: unknown }) => ({
            id: String(vendedor?.id || ''),
            nome: String(vendedor?.nome || ''),
          }))
          .filter((vendedor: VendedorOption) => vendedor.id && vendedor.nome);

        setVendedorOptions(normalized);
      } catch {
        if (!mounted) return;
        setVendedorOptions([]);
      }
    };

    void loadVendedores();

    return () => {
      mounted = false;
    };
  }, []);

  const trendPoints = data?.trends?.points || [];

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

  const currentWindow = useMemo(() => monthlySeries.slice(-windowSize), [monthlySeries, windowSize]);
  const previousWindow = useMemo(
    () => monthlySeries.slice(-(windowSize * 2), -windowSize),
    [monthlySeries, windowSize],
  );

  const vendasTotal = useMemo(
    () => currentWindow.reduce((acc, row) => acc + row.receitaFechada, 0),
    [currentWindow],
  );

  const metaTotal = useMemo(
    () => currentWindow.reduce((acc, row) => acc + row.receitaPrevista, 0),
    [currentWindow],
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

  const receitaDelta = useMemo(() => trendDelta(trendPoints, 'receitaFechada'), [trendPoints]);
  const ticketDelta = useMemo(() => trendDelta(trendPoints, 'ticketMedio'), [trendPoints]);
  const conversaoDelta = useMemo(() => trendDelta(trendPoints, 'conversao'), [trendPoints]);

  const goalProgress = useMemo(() => {
    const fechada = Number(data?.overview?.receitaFechada || 0);
    const prevista = Number(data?.overview?.receitaPrevista || 0);
    if (prevista <= 0) return 0;
    return (fechada / prevista) * 100;
  }, [data?.overview?.receitaFechada, data?.overview?.receitaPrevista]);

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

  const negotiationPercent = useMemo(() => {
    const entered = Number(data?.funnel?.steps?.[0]?.entered || 0);
    const progressed = Number(data?.funnel?.steps?.[1]?.progressed || 0);
    if (!entered) return 0;
    return (progressed / entered) * 100;
  }, [data?.funnel?.steps]);

  const vendasVsPeriodoAnteriorSignal = vendasVsPeriodoAnterior >= 0 ? '+' : '-';
  const vendasVsPeriodoAnteriorClass =
    vendasVsPeriodoAnterior >= 0 ? 'text-[#159E84]' : 'text-[#AF3D4F]';
  const hasActiveFilters = Boolean(filters.vendedorId) || filters.period !== '365d';
  const latestGeneratedAt =
    data?.overview?.cache?.generatedAt ||
    data?.trends?.cache?.generatedAt ||
    data?.funnel?.cache?.generatedAt ||
    data?.pipelineSummary?.cache?.generatedAt ||
    data?.insights?.cache?.generatedAt ||
    '';
  const latestGeneratedAtLabel = latestGeneratedAt ? formatDateTime(latestGeneratedAt) : 'Atualizado agora';

  if (loading) {
    return (
      <div className="space-y-3.5">
        <div className="h-9 w-40 animate-pulse rounded-xl bg-[#E6EFF0]" />
        <div className="grid grid-cols-1 gap-3 xl:grid-cols-5">
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
        <p className="mt-2 text-sm text-[#5E7A88]">Sincronize os dados para gerar os indicadores analiticos.</p>
      </section>
    );
  }

  const vendasBarHeight = `${(vendasTotal / chartMaxValue) * 100}%`;
  const metaBarHeight = `${(metaTotal / chartMaxValue) * 100}%`;
  const goalLineTop = `${100 - (chartGoalLine / chartMaxValue) * 100}%`;

  return (
    <div className="space-y-4">
      <section className="rounded-[20px] border border-[#DCE7EB] bg-white p-5 shadow-[0_16px_30px_-24px_rgba(16,57,74,0.28)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-[20px] font-semibold tracking-[-0.012em] text-[#18374B]">
              Dashboard Comercial
            </h2>
            <p className="mt-1 text-[13px] text-[#617D89]">
              Receita, conversao e pipeline com filtros de periodo e vendedor.
            </p>
            <p className="mt-1 text-[12px] text-[#7A929E]">
              Ultima sincronizacao: {latestGeneratedAtLabel} (auto refresh a cada 2 min)
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <label htmlFor="dashboard-v2-period" className="text-[13px] font-medium text-[#567583]">
              Periodo
            </label>
            <select
              id="dashboard-v2-period"
              value={filters.period}
              onChange={(event) =>
                setFilters({
                  period: event.target.value as '30d' | '90d' | '365d',
                })
              }
              className="rounded-[10px] border border-[#D5E3E8] bg-white px-3 py-2 text-[13px] text-[#244556] focus:border-[#159A9C] focus:outline-none"
            >
              {dashboardPeriodOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <label htmlFor="dashboard-v2-vendedor" className="text-[13px] font-medium text-[#567583]">
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
              className="rounded-[10px] border border-[#D5E3E8] bg-white px-3 py-2 text-[13px] text-[#244556] focus:border-[#159A9C] focus:outline-none"
            >
              <option value="">Todos</option>
              {vendedorOptions.map((vendedor) => (
                <option key={vendedor.id} value={vendedor.id}>
                  {vendedor.nome}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => {
                setFilters({
                  period: '365d',
                  vendedorId: undefined,
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
        </div>
      </section>

      <section className="grid grid-cols-1 gap-3.5 lg:grid-cols-2 xl:grid-cols-5">
        <KpiTrendCard
          title="Faturamento"
          value={formatCurrency(data.overview.receitaFechada)}
          trendPercent={receitaDelta}
          sparkline={receitaSparkline}
          progressPercent={goalProgress}
          progressTone="amber"
          footerLeft={`Meta: ${formatCurrency(data.overview.receitaPrevista)}`}
          footerRight={`${Math.max(0, goalProgress).toFixed(0)}%`}
          icon={<DollarSign className="h-5 w-5" />}
          onClick={() => navigate('/financeiro/contas-receber')}
          ariaLabel="Abrir contas a receber"
        />

        <KpiTrendCard
          title="Ticket Medio"
          value={formatCurrency(data.overview.ticketMedio)}
          trendPercent={ticketDelta}
          sparkline={ticketSparkline}
          progressPercent={ticketProgress}
          progressTone="teal"
          footerLeft={
            ticketBenchmark > 0
              ? `Referencia historica: ${formatCurrency(ticketBenchmark)}`
              : 'Referencia historica indisponivel'
          }
          footerRight=""
          icon={<Target className="h-5 w-5" />}
          onClick={() => navigate('/propostas')}
          ariaLabel="Abrir propostas para analise de ticket medio"
        />

        <KpiTrendCard
          title="Vendas Fechadas"
          value={formatNumber(Number(wonStage?.quantidade || 0))}
          valueSuffix="vendas"
          trendPercent={conversaoDelta}
          sparkline={conversaoSparkline}
          progressPercent={Math.max(0, Math.min(100, Number(data.funnel.steps?.[2]?.conversionRate || 0)))}
          progressTone="teal"
          footerLeft={`Meta: ${Math.max(0, Number(data.funnel.steps?.[1]?.conversionRate || 0)).toFixed(0)}%`}
          footerRight={`${Math.max(0, Number(data.funnel.steps?.[2]?.conversionRate || 0)).toFixed(0)}%`}
          icon={<BadgeCheck className="h-5 w-5" />}
          onClick={() => navigate('/propostas')}
          ariaLabel="Abrir propostas fechadas"
        />

        <KpiTrendCard
          title="Em Negociacao"
          value={formatCurrency(Number(negotiationStage?.valor || 0))}
          trendPercent={negotiationPercent}
          trendLabel={`${Number(negotiationStage?.quantidade || 0)} propostas ativas`}
          progressPercent={Math.max(0, Number(data.funnel.steps?.[1]?.conversionRate || 0))}
          progressTone="amber"
          footerLeft={`${Math.max(0, Number(data.funnel.steps?.[2]?.conversionRate || 0)).toFixed(0)}%`}
          footerRight={`${Number(negotiationStage?.quantidade || 0)} oportunidades`}
          icon={<Clock3 className="h-5 w-5" />}
          onClick={() => navigate('/pipeline')}
          ariaLabel="Abrir pipeline comercial"
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
                  strokeDashoffset={88 - (88 * Math.max(0, Math.min(100, negotiationPercent))) / 100}
                  strokeLinecap="round"
                />
              </svg>
            </div>
          }
        />

        <GoalProgressCard
          title="Progresso ativas"
          primaryValue={formatCurrency(data.overview.receitaPrevista)}
          secondaryValue={formatNumber(data.overview.oportunidadesAtivas)}
          trendPercent={receitaDelta}
          progressPercent={goalProgress}
          projectionLabel={`Projecao: ${formatCurrency(data.overview.receitaPrevista)}`}
          icon={<Activity className="h-5 w-5" />}
        />
      </section>

      <section className="grid grid-cols-1 gap-3.5 xl:grid-cols-12">
        <div className="space-y-3.5 xl:col-span-9">
          <div className="grid grid-cols-1 gap-3.5 xl:grid-cols-12">
            <article className="rounded-[20px] border border-[#DCE7EB] bg-white p-5 shadow-[0_16px_30px_-24px_rgba(16,57,74,0.28)] xl:col-span-7">
              <div className="flex items-start justify-between gap-2.5">
                <div>
                  <h3 className="text-[20px] font-semibold tracking-[-0.012em] text-[#18374B]">Vendas vs Meta do periodo</h3>
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

            <div className="xl:col-span-5">
              <ConversionFunnel steps={data.funnel.steps} />
            </div>
          </div>

          <PipelineStageSummary data={data.pipelineSummary} />
        </div>

        <div className="xl:col-span-3">
          <InsightsPanel insights={data.insights.insights} />
        </div>
      </section>
    </div>
  );
};

export default DashboardV2Page;
