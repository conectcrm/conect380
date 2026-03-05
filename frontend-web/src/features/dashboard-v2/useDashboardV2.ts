import { useCallback, useEffect, useMemo, useState } from 'react';
import api from '../../services/api';

export type DashboardV2PeriodPreset =
  | 'today'
  | 'yesterday'
  | '7d'
  | '30d'
  | '90d'
  | 'month'
  | 'lastMonth'
  | 'ytd'
  | '365d'
  | 'custom';

export type DashboardV2DateRange = {
  periodStart: string;
  periodEnd: string;
};

export type DashboardV2Filters = {
  periodPreset: DashboardV2PeriodPreset;
  customStart?: string;
  customEnd?: string;
  vendedorId?: string;
  pipelineId?: string;
};

type CacheMeta = {
  hit: boolean;
  key: string;
  generatedAt: string;
};

export type DashboardV2Overview = {
  receitaFechada: number;
  receitaPrevista: number;
  metaReceita: number;
  ticketMedio: number;
  cicloMedioDias: number;
  oportunidadesAtivas: number;
  cache: CacheMeta;
};

export type DashboardV2TrendPoint = {
  date: string;
  receitaFechada: number;
  receitaPrevista: number;
  ticketMedio: number;
  conversao: number;
};

export type DashboardV2Trends = {
  points: DashboardV2TrendPoint[];
  cache: CacheMeta;
};

export type DashboardV2FunnelStep = {
  fromStage: string;
  toStage: string;
  entered: number;
  progressed: number;
  conversionRate: number;
};

export type DashboardV2Funnel = {
  steps: DashboardV2FunnelStep[];
  cache: CacheMeta;
};

export type DashboardV2PipelineStage = {
  stage: string;
  quantidade: number;
  valor: number;
  agingMedioDias: number;
  paradas: number;
};

export type DashboardV2PipelineSummary = {
  totalValor: number;
  stages: DashboardV2PipelineStage[];
  cache: CacheMeta;
};

export type DashboardV2Insight = {
  id: string;
  type: 'warning' | 'opportunity' | 'info';
  title: string;
  description: string;
  impact: 'alto' | 'medio' | 'baixo';
  action?: string;
};

export type DashboardV2Insights = {
  insights: DashboardV2Insight[];
  cache: CacheMeta;
};

export type DashboardV2SalesActivityType = {
  tipo: string;
  quantidade: number;
};

export type DashboardV2SalesActivitySeller = {
  vendedorId: string;
  nome: string;
  avatarUrl?: string | null;
  quantidade: number;
  oportunidadesAtivas: number;
  ultimaAtividadeEm: string | null;
};

export type DashboardV2SalesActivityRecent = {
  id: number;
  tipo: string;
  descricao: string;
  dataAtividade: string | null;
  oportunidadeId: number;
  oportunidadeTitulo?: string;
  vendedor?: {
    id: string;
    nome: string;
    avatarUrl?: string | null;
  };
};

export type DashboardV2SalesActivities = {
  range: {
    periodStart: string;
    periodEnd: string;
  };
  totalAtividades: number;
  porTipo: DashboardV2SalesActivityType[];
  porVendedor: DashboardV2SalesActivitySeller[];
  recentes: DashboardV2SalesActivityRecent[];
};

export type DashboardV2Flag = {
  enabled: boolean;
  source: 'disabled' | 'enabled' | 'rollout';
  rolloutPercentage: number;
};

export type DashboardV2Payload = {
  overview: DashboardV2Overview;
  trends: DashboardV2Trends;
  funnel: DashboardV2Funnel;
  pipelineSummary: DashboardV2PipelineSummary;
  insights: DashboardV2Insights;
  salesActivities: DashboardV2SalesActivities;
};

const defaultCacheMeta: CacheMeta = {
  hit: false,
  key: '',
  generatedAt: '',
};

const createEmptyOverview = (): DashboardV2Overview => ({
  receitaFechada: 0,
  receitaPrevista: 0,
  metaReceita: 0,
  ticketMedio: 0,
  cicloMedioDias: 0,
  oportunidadesAtivas: 0,
  cache: defaultCacheMeta,
});

const createEmptyTrends = (): DashboardV2Trends => ({
  points: [],
  cache: defaultCacheMeta,
});

const createEmptyFunnel = (): DashboardV2Funnel => ({
  steps: [],
  cache: defaultCacheMeta,
});

const createEmptyPipelineSummary = (): DashboardV2PipelineSummary => ({
  totalValor: 0,
  stages: [],
  cache: defaultCacheMeta,
});

const createEmptyInsights = (): DashboardV2Insights => ({
  insights: [],
  cache: defaultCacheMeta,
});

const createEmptySalesActivities = (
  range: DashboardV2DateRange,
): DashboardV2SalesActivities => ({
  range: {
    periodStart: range.periodStart,
    periodEnd: range.periodEnd,
  },
  totalAtividades: 0,
  porTipo: [],
  porVendedor: [],
  recentes: [],
});

type UseDashboardV2FlagResult = {
  loading: boolean;
  error: string | null;
  flag: DashboardV2Flag;
};

const defaultFlag: DashboardV2Flag = {
  enabled: false,
  source: 'disabled',
  rolloutPercentage: 0,
};

type ApiErrorPayload = {
  message?: string | string[];
};

type ApiErrorShape = {
  response?: {
    status?: number;
    data?: ApiErrorPayload;
  };
  message?: string;
};

const DASHBOARD_V2_FILTERS_STORAGE_KEY = 'conect360:dashboard-v2:filters:v2';
const DASHBOARD_V2_AUTO_REFRESH_INTERVAL_MS = 5 * 60 * 1000;
const dateInputPattern = /^\d{4}-\d{2}-\d{2}$/;

const toDateInput = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const toDayStart = (date: Date): Date =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate());

const shiftDays = (date: Date, days: number): Date => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

const isValidDateInput = (value: string | undefined): value is string =>
  Boolean(value && dateInputPattern.test(value));

const createDateFromInput = (value: string | undefined): Date | null => {
  if (!isValidDateInput(value)) return null;
  const [yearRaw, monthRaw, dayRaw] = value.split('-');
  const year = Number(yearRaw);
  const month = Number(monthRaw);
  const day = Number(dayRaw);
  const parsed = new Date(year, month - 1, day);

  if (
    Number.isNaN(parsed.getTime()) ||
    parsed.getFullYear() !== year ||
    parsed.getMonth() !== month - 1 ||
    parsed.getDate() !== day
  ) {
    return null;
  }

  return parsed;
};

export const resolveDashboardV2Range = (filters: DashboardV2Filters): DashboardV2DateRange => {
  const today = toDayStart(new Date());
  let start = new Date(today);
  let end = new Date(today);

  switch (filters.periodPreset) {
    case 'today':
      break;
    case 'yesterday':
      start = shiftDays(today, -1);
      end = shiftDays(today, -1);
      break;
    case '7d':
      start = shiftDays(today, -6);
      break;
    case '30d':
      start = shiftDays(today, -29);
      break;
    case '90d':
      start = shiftDays(today, -89);
      break;
    case 'month':
      start = new Date(today.getFullYear(), today.getMonth(), 1);
      break;
    case 'lastMonth':
      start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      end = new Date(today.getFullYear(), today.getMonth(), 0);
      break;
    case 'ytd':
      start = new Date(today.getFullYear(), 0, 1);
      break;
    case '365d':
      start = shiftDays(today, -364);
      break;
    case 'custom': {
      const customStart = createDateFromInput(filters.customStart);
      const customEnd = createDateFromInput(filters.customEnd);

      if (customStart && customEnd) {
        start = customStart;
        end = customEnd;
      } else if (customStart && !customEnd) {
        start = customStart;
        end = customStart;
      } else if (!customStart && customEnd) {
        start = customEnd;
        end = customEnd;
      } else {
        start = shiftDays(today, -29);
        end = today;
      }
      break;
    }
    default:
      start = shiftDays(today, -29);
      break;
  }

  if (start.getTime() > end.getTime()) {
    const temp = start;
    start = end;
    end = temp;
  }

  return {
    periodStart: toDateInput(start),
    periodEnd: toDateInput(end),
  };
};

const normalizeError = (error: unknown): string => {
  const parsed = (error || {}) as ApiErrorShape;
  const backendMessage = parsed.response?.data?.message;
  if (typeof backendMessage === 'string') {
    return backendMessage;
  }

  if (Array.isArray(backendMessage) && backendMessage.length > 0) {
    return backendMessage[0];
  }

  if (parsed.response?.status === 403) {
    return 'Dashboard V2 desabilitado para esta empresa.';
  }

  return parsed.message || 'Nao foi possivel carregar o Dashboard V2.';
};

export const useDashboardV2Flag = (enabled = true): UseDashboardV2FlagResult => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [flag, setFlag] = useState<DashboardV2Flag>(defaultFlag);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      setError(null);
      setFlag(defaultFlag);
      return;
    }

    let mounted = true;

    const fetchFlag = async (): Promise<void> => {
      try {
        setLoading(true);
        const response = await api.get<DashboardV2Flag>('/dashboard/v2/feature-flag');

        if (!mounted) return;

        setFlag({
          enabled: Boolean(response.data?.enabled),
          source: response.data?.source || 'disabled',
          rolloutPercentage: Number(response.data?.rolloutPercentage || 0),
        });
        setError(null);
      } catch (err: unknown) {
        if (!mounted) return;

        setFlag(defaultFlag);
        setError(normalizeError(err));
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    void fetchFlag();

    return () => {
      mounted = false;
    };
  }, [enabled]);

  return { loading, error, flag };
};

type UseDashboardV2Result = {
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  data: DashboardV2Payload | null;
  activeRange: DashboardV2DateRange;
  filters: DashboardV2Filters;
  setFilters: (next: Partial<DashboardV2Filters>) => void;
  refresh: () => Promise<void>;
};

export const defaultDashboardV2Filters: DashboardV2Filters = {
  periodPreset: '30d',
  customStart: undefined,
  customEnd: undefined,
  vendedorId: undefined,
  pipelineId: undefined,
};

const validPeriodPresets = new Set<DashboardV2PeriodPreset>([
  'today',
  'yesterday',
  '7d',
  '30d',
  '90d',
  'month',
  'lastMonth',
  'ytd',
  '365d',
  'custom',
]);

export const sanitizeDashboardV2Filters = (input: unknown): DashboardV2Filters => {
  const raw = (input || {}) as Partial<DashboardV2Filters> & { period?: unknown };

  const legacyPeriod =
    typeof raw.period === 'string' && validPeriodPresets.has(raw.period as DashboardV2PeriodPreset)
      ? (raw.period as DashboardV2PeriodPreset)
      : undefined;

  const periodPreset =
    typeof raw.periodPreset === 'string' && validPeriodPresets.has(raw.periodPreset)
      ? raw.periodPreset
      : legacyPeriod || defaultDashboardV2Filters.periodPreset;

  const customStart = isValidDateInput(raw.customStart) ? raw.customStart : undefined;
  const customEnd = isValidDateInput(raw.customEnd) ? raw.customEnd : undefined;

  let normalizedCustomStart = customStart;
  let normalizedCustomEnd = customEnd;

  if (periodPreset === 'custom' && customStart && customEnd && customStart > customEnd) {
    normalizedCustomStart = customEnd;
    normalizedCustomEnd = customStart;
  }

  if (periodPreset !== 'custom') {
    normalizedCustomStart = undefined;
    normalizedCustomEnd = undefined;
  }

  return {
    periodPreset,
    customStart: normalizedCustomStart,
    customEnd: normalizedCustomEnd,
    vendedorId: raw.vendedorId || undefined,
    pipelineId: raw.pipelineId || undefined,
  };
};

const readStoredFilters = (): DashboardV2Filters => {
  if (typeof window === 'undefined') {
    return defaultDashboardV2Filters;
  }

  try {
    const raw = window.localStorage.getItem(DASHBOARD_V2_FILTERS_STORAGE_KEY);
    if (!raw) {
      return defaultDashboardV2Filters;
    }
    return sanitizeDashboardV2Filters(JSON.parse(raw));
  } catch {
    return defaultDashboardV2Filters;
  }
};

type DashboardFetchResult = {
  payload: DashboardV2Payload;
  rejectedCount: number;
  allRejected: boolean;
  firstError: unknown;
};

type DashboardV2SnapshotApiPayload = Omit<DashboardV2Payload, 'salesActivities'>;

const fetchDashboardPayload = async (
  params: Record<string, string | undefined>,
  range: DashboardV2DateRange,
): Promise<DashboardFetchResult> => {
  const salesActivitiesParams = {
    periodStart: params.periodStart,
    periodEnd: params.periodEnd,
    vendedorId: params.vendedorId,
    limit: '12',
  };

  const [snapshotResult, salesActivitiesResult] = await Promise.allSettled([
    api.get<DashboardV2SnapshotApiPayload>('/dashboard/v2/snapshot', { params }),
    api.get<DashboardV2SalesActivities>('/oportunidades/atividades/resumo-gerencial', {
      params: salesActivitiesParams,
    }),
  ]);

  if (snapshotResult.status === 'fulfilled') {
    return {
      payload: {
        ...snapshotResult.value.data,
        salesActivities:
          salesActivitiesResult.status === 'fulfilled'
            ? salesActivitiesResult.value.data
            : createEmptySalesActivities(range),
      },
      rejectedCount: salesActivitiesResult.status === 'rejected' ? 1 : 0,
      allRejected: false,
      firstError: salesActivitiesResult.status === 'rejected' ? salesActivitiesResult.reason : null,
    };
  }

  const settled = await Promise.allSettled([
    api.get<DashboardV2Overview>('/dashboard/v2/overview', { params }),
    api.get<DashboardV2Trends>('/dashboard/v2/trends', { params }),
    api.get<DashboardV2Funnel>('/dashboard/v2/funnel', { params }),
    api.get<DashboardV2PipelineSummary>('/dashboard/v2/pipeline-summary', { params }),
    api.get<DashboardV2Insights>('/dashboard/v2/insights', { params }),
    api.get<DashboardV2SalesActivities>('/oportunidades/atividades/resumo-gerencial', {
      params: salesActivitiesParams,
    }),
  ]);

  const rejected = settled.filter((result) => result.status === 'rejected');

  const overview =
    settled[0].status === 'fulfilled' ? settled[0].value.data : createEmptyOverview();
  const trends = settled[1].status === 'fulfilled' ? settled[1].value.data : createEmptyTrends();
  const funnel = settled[2].status === 'fulfilled' ? settled[2].value.data : createEmptyFunnel();
  const pipelineSummary =
    settled[3].status === 'fulfilled' ? settled[3].value.data : createEmptyPipelineSummary();
  const insights =
    settled[4].status === 'fulfilled' ? settled[4].value.data : createEmptyInsights();
  const salesActivities =
    settled[5].status === 'fulfilled' ? settled[5].value.data : createEmptySalesActivities(range);

  return {
    payload: {
      overview,
      trends,
      funnel,
      pipelineSummary,
      insights,
      salesActivities,
    },
    rejectedCount: rejected.length,
    allRejected: rejected.length === settled.length,
    firstError: rejected[0]?.status === 'rejected' ? rejected[0].reason : null,
  };
};

export const useDashboardV2 = (autoRefresh = true): UseDashboardV2Result => {
  const [filters, setFiltersState] = useState<DashboardV2Filters>(() => readStoredFilters());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<DashboardV2Payload | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      window.localStorage.setItem(DASHBOARD_V2_FILTERS_STORAGE_KEY, JSON.stringify(filters));
    } catch {
      // Ignore storage failures and keep runtime state.
    }
  }, [filters]);

  const activeRange = useMemo(
    () =>
      resolveDashboardV2Range({
        periodPreset: filters.periodPreset,
        customStart: filters.customStart,
        customEnd: filters.customEnd,
      }),
    [filters.periodPreset, filters.customStart, filters.customEnd],
  );

  const queryParams = useMemo(
    () => ({
      ...activeRange,
      vendedorId: filters.vendedorId || undefined,
      pipelineId: filters.pipelineId || undefined,
    }),
    [activeRange, filters.vendedorId, filters.pipelineId],
  );

  const fetchDashboard = useCallback(
    async (mode: 'initial' | 'refresh' = 'initial') => {
      if (mode === 'initial') {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      try {
        const currentResult = await fetchDashboardPayload(queryParams, activeRange);
        if (currentResult.allRejected && currentResult.firstError) {
          throw currentResult.firstError;
        }

        setData(currentResult.payload);

        const notices: string[] = [];
        if (currentResult.rejectedCount > 0) {
          notices.push('Alguns indicadores nao puderam ser carregados. Exibindo dados parciais.');
        }

        setError(notices.length > 0 ? notices.join(' ') : null);
      } catch (err: unknown) {
        setError(normalizeError(err));
      } finally {
        if (mode === 'initial') {
          setLoading(false);
        } else {
          setRefreshing(false);
        }
      }
    },
    [queryParams, activeRange],
  );

  useEffect(() => {
    void fetchDashboard('initial');
  }, [fetchDashboard]);

  useEffect(() => {
    if (!autoRefresh) {
      return;
    }

    const refreshIfVisible = () => {
      if (document.visibilityState !== 'visible') {
        return;
      }

      void fetchDashboard('refresh');
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        void fetchDashboard('refresh');
      }
    };

    const interval = window.setInterval(refreshIfVisible, DASHBOARD_V2_AUTO_REFRESH_INTERVAL_MS);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [autoRefresh, fetchDashboard]);

  const setFilters = useCallback((next: Partial<DashboardV2Filters>) => {
    setFiltersState((prev) => sanitizeDashboardV2Filters({ ...prev, ...next }));
  }, []);

  const refresh = useCallback(async () => {
    await fetchDashboard('refresh');
  }, [fetchDashboard]);

  return {
    loading,
    refreshing,
    error,
    data,
    activeRange,
    filters,
    setFilters,
    refresh,
  };
};
