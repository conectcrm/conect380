import { useCallback, useEffect, useMemo, useState } from 'react';
import api from '../../services/api';

export type DashboardV2Period = '30d' | '90d' | '365d';

export type DashboardV2Filters = {
  period: DashboardV2Period;
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
};

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

const toDateInput = (date: Date): string => date.toISOString().slice(0, 10);

const resolveRange = (period: DashboardV2Period): { periodStart: string; periodEnd: string } => {
  const end = new Date();
  const start = new Date(end);

  switch (period) {
    case '30d':
      start.setDate(start.getDate() - 29);
      break;
    case '90d':
      start.setDate(start.getDate() - 89);
      break;
    case '365d':
      start.setDate(start.getDate() - 364);
      break;
    default:
      start.setDate(start.getDate() - 29);
      break;
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
  filters: DashboardV2Filters;
  setFilters: (next: Partial<DashboardV2Filters>) => void;
  refresh: () => Promise<void>;
};

const defaultFilters: DashboardV2Filters = {
  period: '30d',
  vendedorId: undefined,
  pipelineId: undefined,
};

export const useDashboardV2 = (autoRefresh = true): UseDashboardV2Result => {
  const [filters, setFiltersState] = useState<DashboardV2Filters>(defaultFilters);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<DashboardV2Payload | null>(null);

  const queryParams = useMemo(() => {
    const range = resolveRange(filters.period);

    return {
      ...range,
      vendedorId: filters.vendedorId || undefined,
      pipelineId: filters.pipelineId || undefined,
    };
  }, [filters.period, filters.vendedorId, filters.pipelineId]);

  const fetchDashboard = useCallback(
    async (mode: 'initial' | 'refresh' = 'initial') => {
      if (mode === 'initial') {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      try {
        const [overview, trends, funnel, pipelineSummary, insights] = await Promise.all([
          api.get<DashboardV2Overview>('/dashboard/v2/overview', { params: queryParams }),
          api.get<DashboardV2Trends>('/dashboard/v2/trends', { params: queryParams }),
          api.get<DashboardV2Funnel>('/dashboard/v2/funnel', { params: queryParams }),
          api.get<DashboardV2PipelineSummary>('/dashboard/v2/pipeline-summary', {
            params: queryParams,
          }),
          api.get<DashboardV2Insights>('/dashboard/v2/insights', { params: queryParams }),
        ]);

        setData({
          overview: overview.data,
          trends: trends.data,
          funnel: funnel.data,
          pipelineSummary: pipelineSummary.data,
          insights: insights.data,
        });
        setError(null);
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
    [queryParams],
  );

  useEffect(() => {
    void fetchDashboard('initial');
  }, [fetchDashboard]);

  useEffect(() => {
    if (!autoRefresh) {
      return;
    }

    const interval = window.setInterval(
      () => {
        void fetchDashboard('refresh');
      },
      2 * 60 * 1000,
    );

    return () => {
      window.clearInterval(interval);
    };
  }, [autoRefresh, fetchDashboard]);

  const setFilters = useCallback((next: Partial<DashboardV2Filters>) => {
    setFiltersState((prev) => ({ ...prev, ...next }));
  }, []);

  const refresh = useCallback(async () => {
    await fetchDashboard('refresh');
  }, [fetchDashboard]);

  return {
    loading,
    refreshing,
    error,
    data,
    filters,
    setFilters,
    refresh,
  };
};
