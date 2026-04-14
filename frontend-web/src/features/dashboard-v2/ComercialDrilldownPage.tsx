import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import api from '../../services/api';
import {
  type DashboardV2Funnel,
  type DashboardV2Insight,
  type DashboardV2Insights,
  type DashboardV2Overview,
  type DashboardV2PipelineSummary,
  type DashboardV2SalesActivities,
  type DashboardV2Trends,
} from './useDashboardV2';

type ComercialDrilldownMetric =
  | 'geral'
  | 'faturamento'
  | 'ticket-medio'
  | 'ganhos'
  | 'pipeline-negociacao'
  | 'meta-carteira';

type ComercialDrilldownPayload = {
  overview: DashboardV2Overview;
  trends: DashboardV2Trends;
  funnel: DashboardV2Funnel;
  pipelineSummary: DashboardV2PipelineSummary;
  insights: DashboardV2Insights;
  salesActivities: DashboardV2SalesActivities;
};

const dateInputPattern = /^\d{4}-\d{2}-\d{2}$/;

const validMetricSet: Set<ComercialDrilldownMetric> = new Set([
  'geral',
  'faturamento',
  'ticket-medio',
  'ganhos',
  'pipeline-negociacao',
  'meta-carteira',
]);

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

const formatDateLabel = (value: string): string => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString('pt-BR');
};

const toDateInput = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const buildFallbackRange = (): { periodStart: string; periodEnd: string } => {
  const end = new Date();
  const start = new Date(end);
  start.setDate(start.getDate() - 29);
  return {
    periodStart: toDateInput(start),
    periodEnd: toDateInput(end),
  };
};

const normalizeError = (error: unknown): string => {
  if (typeof error === 'object' && error !== null) {
    const response = (error as { response?: { data?: { message?: string | string[] } } }).response;
    const message = response?.data?.message;
    if (typeof message === 'string' && message.trim()) return message;
    if (Array.isArray(message) && message.length > 0) return String(message[0]);
  }

  if (error instanceof Error && error.message) return error.message;
  return 'Nao foi possivel carregar o relatorio contextual.';
};

const getMetricConfig = (
  metric: ComercialDrilldownMetric,
  payload: ComercialDrilldownPayload | null,
): { label: string; description: string; value: string; helper: string } => {
  const overview = payload?.overview;
  const pipeline = payload?.pipelineSummary;
  const ganhos = Number(pipeline?.stages?.find((stage) => stage.stage === 'won')?.quantidade || 0);
  const negotiationStage = pipeline?.stages?.find((stage) => stage.stage === 'negotiation');

  switch (metric) {
    case 'faturamento':
      return {
        label: 'Faturamento no período',
        description: 'Receita fechada no recorte filtrado do dashboard comercial.',
        value: formatCurrency(Number(overview?.receitaFechada || 0)),
        helper: `Meta no recorte: ${formatCurrency(Number(overview?.metaReceita || 0))}`,
      };
    case 'ticket-medio':
      return {
        label: 'Ticket médio no período',
        description: 'Valor médio por venda no recorte ativo.',
        value: formatCurrency(Number(overview?.ticketMedio || 0)),
        helper: `Ciclo médio: ${formatNumber(Number(overview?.cicloMedioDias || 0))} dias`,
      };
    case 'ganhos':
      return {
        label: 'Ganhos no período',
        description: 'Quantidade de oportunidades ganhas no recorte selecionado.',
        value: `${formatNumber(ganhos)} vendas`,
        helper: `Oportunidades ativas: ${formatNumber(Number(overview?.oportunidadesAtivas || 0))}`,
      };
    case 'pipeline-negociacao':
      return {
        label: 'Pipeline em negociação',
        description: 'Valor em negociação dentro do período filtrado.',
        value: formatCurrency(Number(negotiationStage?.valor || 0)),
        helper: `${formatNumber(Number(negotiationStage?.quantidade || 0))} oportunidades em negociação`,
      };
    case 'meta-carteira':
      return {
        label: 'Meta e carteira ativa',
        description: 'Comparativo de meta, carteira ativa e projeção de receita.',
        value: formatCurrency(Number(overview?.metaReceita || 0)),
        helper: `Receita prevista: ${formatCurrency(Number(overview?.receitaPrevista || 0))}`,
      };
    case 'geral':
    default:
      return {
        label: 'Visão geral comercial',
        description: 'Resumo consolidado dos indicadores comerciais do período.',
        value: formatCurrency(Number(overview?.receitaFechada || 0)),
        helper: `Receita prevista: ${formatCurrency(Number(overview?.receitaPrevista || 0))}`,
      };
  }
};

const ComercialDrilldownPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [payload, setPayload] = useState<ComercialDrilldownPayload | null>(null);

  const fallbackRange = useMemo(() => buildFallbackRange(), []);
  const periodStart = dateInputPattern.test(searchParams.get('periodStart') || '')
    ? String(searchParams.get('periodStart'))
    : fallbackRange.periodStart;
  const periodEnd = dateInputPattern.test(searchParams.get('periodEnd') || '')
    ? String(searchParams.get('periodEnd'))
    : fallbackRange.periodEnd;
  const vendedorId = (searchParams.get('vendedorId') || '').trim() || undefined;
  const metricParam = (searchParams.get('metric') || '').trim() as ComercialDrilldownMetric;
  const metric: ComercialDrilldownMetric = validMetricSet.has(metricParam) ? metricParam : 'geral';

  const load = useCallback(async () => {
    setError(null);

    const baseParams = {
      periodStart,
      periodEnd,
      vendedorId,
    };

    const [snapshot, atividades] = await Promise.all([
      api.get<Omit<ComercialDrilldownPayload, 'salesActivities'>>('/dashboard/v2/snapshot', {
        params: baseParams,
      }),
      api.get<DashboardV2SalesActivities>('/oportunidades/atividades/resumo-gerencial', {
        params: {
          ...baseParams,
          limit: '20',
        },
      }),
    ]);

    setPayload({
      ...snapshot.data,
      salesActivities: atividades.data,
    });
  }, [periodEnd, periodStart, vendedorId]);

  useEffect(() => {
    const bootstrap = async () => {
      setLoading(true);
      try {
        await load();
      } catch (loadError) {
        setError(normalizeError(loadError));
      } finally {
        setLoading(false);
      }
    };

    void bootstrap();
  }, [load]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await load();
    } catch (refreshError) {
      setError(normalizeError(refreshError));
    } finally {
      setRefreshing(false);
    }
  }, [load]);

  const metricConfig = useMemo(() => getMetricConfig(metric, payload), [metric, payload]);
  const trendRows = useMemo(
    () => (payload?.trends?.points || []).slice(-15).reverse(),
    [payload?.trends?.points],
  );
  const pipelineRows = payload?.pipelineSummary?.stages || [];
  const funnelRows = payload?.funnel?.steps || [];
  const recentActivities = payload?.salesActivities?.recentes || [];
  const insights = payload?.insights?.insights || [];
  const generatedAt = payload?.overview?.cache?.generatedAt || '';
  const generatedAtLabel = generatedAt ? new Date(generatedAt).toLocaleString('pt-BR') : '-';

  if (loading) {
    return <div className="h-56 animate-pulse rounded-[20px] bg-[#E6EFF0]" />;
  }

  if (error) {
    return (
      <section className="rounded-[20px] border border-[#F1D3D8] bg-[#FFF5F7] p-5">
        <h2 className="text-xl font-semibold text-[#8A2335]">Falha ao carregar relatório</h2>
        <p className="mt-2 text-sm text-[#8A2335]">{error}</p>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => void refresh()}
            className="inline-flex items-center gap-2 rounded-xl bg-[#C53A53] px-4 py-2 text-sm font-semibold text-white hover:bg-[#A93247]"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Tentar novamente
          </button>
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="inline-flex items-center gap-2 rounded-xl border border-[#D4DEE3] bg-white px-4 py-2 text-sm font-semibold text-[#244556] hover:bg-[#F4FAF8]"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar ao dashboard
          </button>
        </div>
      </section>
    );
  }

  return (
    <div className="space-y-4">
      <section className="rounded-[20px] border border-[#DCE7EB] bg-[linear-gradient(135deg,#F9FDFD_0%,#F0F8F8_55%,#F8FCFC_100%)] p-5 shadow-[0_16px_30px_-24px_rgba(16,57,74,0.28)]">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <span className="inline-flex items-center rounded-full border border-[#CFE6E8] bg-white/80 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#4C7283]">
              Relatorio contextual
            </span>
            <h1 className="mt-2 text-[27px] font-semibold tracking-[-0.02em] text-[#173A4E]">
              {metricConfig.label}
            </h1>
            <p className="mt-1 text-[14px] text-[#4D6D7B]">{metricConfig.description}</p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center rounded-full border border-[#D3E4E8] bg-white px-2.5 py-1 text-[12px] font-medium text-[#466777]">
                Periodo: {formatDateLabel(periodStart)} a {formatDateLabel(periodEnd)}
              </span>
              <span className="inline-flex items-center rounded-full border border-[#D3E4E8] bg-white px-2.5 py-1 text-[12px] font-medium text-[#466777]">
                Vendedor: {vendedorId || 'Todos'}
              </span>
              <span className="inline-flex items-center rounded-full border border-[#D3E4E8] bg-white px-2.5 py-1 text-[12px] font-medium text-[#466777]">
                Atualizado: {generatedAtLabel}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="inline-flex items-center gap-2 rounded-xl border border-[#D4DEE3] bg-white px-4 py-2 text-sm font-semibold text-[#244556] hover:bg-[#F4FAF8]"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar ao dashboard
            </button>
            <button
              type="button"
              onClick={() => void refresh()}
              className="inline-flex items-center gap-2 rounded-xl border border-[#D4DEE3] bg-white px-4 py-2 text-sm font-semibold text-[#244556] hover:bg-[#F4FAF8]"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              Atualizar
            </button>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-[14px] border border-[#DCE7EB] bg-white px-3.5 py-3">
            <p className="text-[11px] uppercase tracking-wide text-[#7A929E]">Indicador foco</p>
            <p className="mt-1 text-[22px] font-semibold text-[#18374B]">{metricConfig.value}</p>
            <p className="mt-2 text-[12px] text-[#6B8591]">{metricConfig.helper}</p>
          </div>
          <div className="rounded-[14px] border border-[#DCE7EB] bg-white px-3.5 py-3">
            <p className="text-[11px] uppercase tracking-wide text-[#7A929E]">Receita prevista</p>
            <p className="mt-1 text-[22px] font-semibold text-[#18374B]">
              {formatCurrency(Number(payload?.overview?.receitaPrevista || 0))}
            </p>
            <p className="mt-2 text-[12px] text-[#6B8591]">Comparativo com receita fechada no recorte</p>
          </div>
          <div className="rounded-[14px] border border-[#DCE7EB] bg-white px-3.5 py-3">
            <p className="text-[11px] uppercase tracking-wide text-[#7A929E]">Oportunidades ativas</p>
            <p className="mt-1 text-[22px] font-semibold text-[#18374B]">
              {formatNumber(Number(payload?.overview?.oportunidadesAtivas || 0))}
            </p>
            <p className="mt-2 text-[12px] text-[#6B8591]">Carteira ativa no período filtrado</p>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-3.5 2xl:grid-cols-12">
        <article className="rounded-[20px] border border-[#DCE7EB] bg-white p-5 shadow-[0_16px_30px_-24px_rgba(16,57,74,0.28)] 2xl:col-span-7">
          <h2 className="text-[20px] font-semibold tracking-[-0.012em] text-[#18374B]">
            Tendencia diaria no recorte
          </h2>
          <p className="mt-1 text-[13px] text-[#6B8591]">
            Base usada para os cards do dashboard neste mesmo período.
          </p>
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-left text-[13px]">
              <thead className="text-[#6B8591]">
                <tr>
                  <th className="px-2 py-2 font-semibold">Data</th>
                  <th className="px-2 py-2 font-semibold">Receita fechada</th>
                  <th className="px-2 py-2 font-semibold">Receita prevista</th>
                  <th className="px-2 py-2 font-semibold">Ticket médio</th>
                  <th className="px-2 py-2 font-semibold">Conversao</th>
                </tr>
              </thead>
              <tbody>
                {trendRows.length ? (
                  trendRows.map((row) => (
                    <tr key={row.date} className="border-t border-[#E7EFF2] text-[#244556]">
                      <td className="px-2 py-2">{formatDateLabel(row.date)}</td>
                      <td className="px-2 py-2">{formatCurrency(Number(row.receitaFechada || 0))}</td>
                      <td className="px-2 py-2">{formatCurrency(Number(row.receitaPrevista || 0))}</td>
                      <td className="px-2 py-2">{formatCurrency(Number(row.ticketMedio || 0))}</td>
                      <td className="px-2 py-2">{Number(row.conversao || 0).toFixed(1)}%</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-2 py-4 text-[#6B8591]">
                      Sem pontos de tendência para o período selecionado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </article>

        <article className="rounded-[20px] border border-[#DCE7EB] bg-white p-5 shadow-[0_16px_30px_-24px_rgba(16,57,74,0.28)] 2xl:col-span-5">
          <h2 className="text-[20px] font-semibold tracking-[-0.012em] text-[#18374B]">
            Insights do período
          </h2>
          <p className="mt-1 text-[13px] text-[#6B8591]">
            Mesmos insights exibidos no dashboard comercial principal.
          </p>
          <div className="mt-4 space-y-2.5">
            {insights.length ? (
              insights.slice(0, 6).map((insight: DashboardV2Insight) => (
                <div
                  key={insight.id}
                  className="rounded-[14px] border border-[#E0EAEE] bg-[#FBFDFE] px-3.5 py-3"
                >
                  <p className="text-[14px] font-semibold text-[#173548]">{insight.title}</p>
                  <p className="mt-1 text-[13px] text-[#607C89]">{insight.description}</p>
                </div>
              ))
            ) : (
              <div className="rounded-[14px] border border-dashed border-[#D3E3E8] bg-[#F7FBFC] px-3 py-3.5 text-[13px] text-[#607C89]">
                Sem insights para o período selecionado.
              </div>
            )}
          </div>
        </article>
      </section>

      <section className="grid grid-cols-1 gap-3.5 2xl:grid-cols-12">
        <article className="rounded-[20px] border border-[#DCE7EB] bg-white p-5 shadow-[0_16px_30px_-24px_rgba(16,57,74,0.28)] 2xl:col-span-6">
          <h2 className="text-[20px] font-semibold tracking-[-0.012em] text-[#18374B]">
            Funil detalhado
          </h2>
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-left text-[13px]">
              <thead className="text-[#6B8591]">
                <tr>
                  <th className="px-2 py-2 font-semibold">De</th>
                  <th className="px-2 py-2 font-semibold">Para</th>
                  <th className="px-2 py-2 font-semibold">Entraram</th>
                  <th className="px-2 py-2 font-semibold">Avancaram</th>
                  <th className="px-2 py-2 font-semibold">Conversao</th>
                </tr>
              </thead>
              <tbody>
                {funnelRows.length ? (
                  funnelRows.map((row) => (
                    <tr
                      key={`${row.fromStage}-${row.toStage}`}
                      className="border-t border-[#E7EFF2] text-[#244556]"
                    >
                      <td className="px-2 py-2">{row.fromStage}</td>
                      <td className="px-2 py-2">{row.toStage}</td>
                      <td className="px-2 py-2">{formatNumber(row.entered)}</td>
                      <td className="px-2 py-2">{formatNumber(row.progressed)}</td>
                      <td className="px-2 py-2">{Number(row.conversionRate || 0).toFixed(1)}%</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-2 py-4 text-[#6B8591]">
                      Sem dados de funil para o período selecionado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </article>

        <article className="rounded-[20px] border border-[#DCE7EB] bg-white p-5 shadow-[0_16px_30px_-24px_rgba(16,57,74,0.28)] 2xl:col-span-6">
          <h2 className="text-[20px] font-semibold tracking-[-0.012em] text-[#18374B]">
            Pipeline por estágio
          </h2>
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-left text-[13px]">
              <thead className="text-[#6B8591]">
                <tr>
                  <th className="px-2 py-2 font-semibold">Estágio</th>
                  <th className="px-2 py-2 font-semibold">Quantidade</th>
                  <th className="px-2 py-2 font-semibold">Valor</th>
                  <th className="px-2 py-2 font-semibold">Aging médio</th>
                  <th className="px-2 py-2 font-semibold">Paradas</th>
                </tr>
              </thead>
              <tbody>
                {pipelineRows.length ? (
                  pipelineRows.map((row) => (
                    <tr key={row.stage} className="border-t border-[#E7EFF2] text-[#244556]">
                      <td className="px-2 py-2">{row.stage}</td>
                      <td className="px-2 py-2">{formatNumber(row.quantidade)}</td>
                      <td className="px-2 py-2">{formatCurrency(Number(row.valor || 0))}</td>
                      <td className="px-2 py-2">{formatNumber(Number(row.agingMedioDias || 0))} dias</td>
                      <td className="px-2 py-2">{formatNumber(row.paradas)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-2 py-4 text-[#6B8591]">
                      Sem dados de pipeline para o período selecionado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </article>
      </section>

      <section className="rounded-[20px] border border-[#DCE7EB] bg-white p-5 shadow-[0_16px_30px_-24px_rgba(16,57,74,0.28)]">
        <h2 className="text-[20px] font-semibold tracking-[-0.012em] text-[#18374B]">
          Atividades recentes do período
        </h2>
        <p className="mt-1 text-[13px] text-[#6B8591]">
          Eventos comerciais para auditoria do contexto analisado.
        </p>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-left text-[13px]">
            <thead className="text-[#6B8591]">
              <tr>
                <th className="px-2 py-2 font-semibold">Data</th>
                <th className="px-2 py-2 font-semibold">Tipo</th>
                <th className="px-2 py-2 font-semibold">Descricao</th>
                <th className="px-2 py-2 font-semibold">Oportunidade</th>
                <th className="px-2 py-2 font-semibold">Vendedor</th>
              </tr>
            </thead>
            <tbody>
              {recentActivities.length ? (
                recentActivities.map((item) => (
                  <tr key={item.id} className="border-t border-[#E7EFF2] text-[#244556]">
                    <td className="px-2 py-2">{item.dataAtividade ? formatDateLabel(item.dataAtividade) : '-'}</td>
                    <td className="px-2 py-2">{item.tipo}</td>
                    <td className="px-2 py-2">{item.descricao}</td>
                    <td className="px-2 py-2">{item.oportunidadeTitulo || item.oportunidadeId}</td>
                    <td className="px-2 py-2">{item.vendedor?.nome || '-'}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-2 py-4 text-[#6B8591]">
                    Sem atividades recentes para o período selecionado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default ComercialDrilldownPage;
