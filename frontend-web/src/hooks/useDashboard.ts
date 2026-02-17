import { useState, useEffect, useCallback } from 'react';
import { API_BASE_URL } from '../services/api';

const DASHBOARD_FETCH_TIMEOUT_MS = 20_000;

const fetchJsonWithTimeout = async <T,>(
  url: string,
  options: RequestInit,
  timeoutMs: number,
): Promise<T> => {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Erro ${response.status}: ${response.statusText}`);
    }

    return (await response.json()) as T;
  } finally {
    window.clearTimeout(timeoutId);
  }
};

// Interfaces
export interface DashboardKPIs {
  faturamentoTotal: {
    valor: number;
    meta: number;
    variacao: number;
    periodo: string;
  };
  ticketMedio: {
    valor: number;
    variacao: number;
    periodo: string;
  };
  vendasFechadas: {
    quantidade: number;
    variacao: number;
    periodo: string;
  };
  emNegociacao: {
    valor: number;
    quantidade: number;
    propostas: string[];
  };
  novosClientesMes: {
    quantidade: number;
    variacao: number;
  };
  leadsQualificados: {
    quantidade: number;
    variacao: number;
  };
  propostasEnviadas: {
    valor: number;
    variacao: number;
  };
  cicloMedio: {
    dias: number;
    variacao: number;
  };
  tempoEtapa: {
    dias: number;
    variacao: number;
  };
  followUpsPendentes: {
    quantidade: number;
    variacao: number;
  };
  taxaSucessoGeral: {
    percentual: number;
    variacao: number;
  };
}

export interface VendedorRanking {
  id: string;
  nome: string;
  vendas: number;
  meta: number;
  variacao: number;
  posicao: number;
  badges: string[];
  cor: string;
}

export interface AlertaInteligente {
  id: string;
  tipo: 'meta' | 'prazo' | 'tendencia' | 'oportunidade' | 'conquista';
  severidade: 'baixa' | 'media' | 'alta' | 'critica';
  titulo: string;
  descricao: string;
  valor?: number;
  dataLimite?: string;
  acao?: {
    texto: string;
    url: string;
  };
  timestamp: Date;
  lido: boolean;
}

interface DashboardData {
  kpis: DashboardKPIs | null;
  vendedoresRanking: VendedorRanking[];
  alertas: AlertaInteligente[];
  chartsData?: {
    vendasMensais?: Array<{ mes: string; valor: number; meta: number }>;
    propostasPorStatus?: Array<{ status: string; valor: number; color: string }>;
    atividadesTimeline?: Array<{ mes: string; reunioes: number; ligacoes: number; emails: number }>;
    funilVendas?: Array<{ etapa: string; quantidade: number; valor: number }>;
  };
  metadata: {
    periodo: string;
    vendedorId?: string;
    regiao?: string;
    atualizadoEm?: string;
    proximaAtualizacao?: string;
    periodosDisponiveis?: string[];
    vendedoresDisponiveis?: Array<{ id: string; nome: string }>;
    regioesDisponiveis?: string[];
  } | null;
}

interface UseDashboardOptions {
  periodo?: string;
  vendedorId?: string;
  regiao?: string;
  autoRefresh?: boolean;
  refreshInterval?: number; // em milissegundos
}

interface UseDashboardReturn {
  data: DashboardData;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  updateFilters: (filters: Partial<UseDashboardOptions>) => void;
}

const createEmptyDashboardData = (): DashboardData => ({
  kpis: null,
  vendedoresRanking: [],
  alertas: [],
  chartsData: undefined,
  metadata: null,
});

const getAuthToken = (): string | null => localStorage.getItem('authToken');

/**
 * Hook customizado para gerenciar dados do dashboard
 * Consome APIs reais do backend e gerencia estado
 */
export const useDashboard = (options: UseDashboardOptions = {}): UseDashboardReturn => {
  const {
    periodo = 'mensal',
    vendedorId,
    regiao,
    autoRefresh = true,
    refreshInterval = 15 * 60 * 1000, // 15 minutos
  } = options;

  // Estados
  const [data, setData] = useState<DashboardData>(createEmptyDashboardData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({ periodo, vendedorId, regiao });

  // Função para buscar dados do dashboard
  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const token = getAuthToken();
      if (!token) {
        setData(createEmptyDashboardData());
        setError('Sessao nao autenticada. Faca login novamente.');
        return;
      }

      // Construir query parameters
      const params = new URLSearchParams();
      params.append('periodo', filters.periodo);
      if (filters.vendedorId) params.append('vendedor', filters.vendedorId);
      if (filters.regiao) params.append('regiao', filters.regiao);

      // Buscar dados do resumo completo
      const result = await fetchJsonWithTimeout<any>(
        `${API_BASE_URL}/dashboard/resumo?${params.toString()}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        },
        DASHBOARD_FETCH_TIMEOUT_MS,
      );

      // Converter timestamps dos alertas
      const alertasComData = result.alertas.map((alerta: any) => ({
        ...alerta,
        timestamp: new Date(alerta.timestamp),
      }));

      const metadataDefaults = {
        periodo: filters.periodo,
        vendedorId: filters.vendedorId,
        regiao: filters.regiao,
        atualizadoEm: new Date().toISOString(),
        proximaAtualizacao: new Date(Date.now() + refreshInterval).toISOString(),
        periodosDisponiveis: ['semanal', 'mensal', 'trimestral', 'semestral', 'anual'],
      };

      const metadata = result.metadata
        ? {
            ...metadataDefaults,
            ...result.metadata,
            periodosDisponiveis:
              result.metadata.periodosDisponiveis ?? metadataDefaults.periodosDisponiveis,
            vendedoresDisponiveis:
              result.metadata.vendedoresDisponiveis ??
              result.vendedoresRanking?.map(({ id, nome }: VendedorRanking) => ({ id, nome })),
            regioesDisponiveis: result.metadata.regioesDisponiveis,
          }
        : {
            ...metadataDefaults,
            vendedoresDisponiveis: result.vendedoresRanking?.map(
              ({ id, nome }: VendedorRanking) => ({ id, nome }),
            ),
          };

      setData({
        kpis: result.kpis,
        vendedoresRanking: result.vendedoresRanking,
        alertas: alertasComData,
        chartsData: result.chartsData,
        metadata,
      });
    } catch (err) {
      console.error('❌ Erro ao buscar dados do dashboard:', err);
      const isAbortError =
        err instanceof DOMException ? err.name === 'AbortError' : (err as any)?.name === 'AbortError';
      const errorMessage = isAbortError
        ? 'Tempo limite ao carregar o dashboard. Verifique se o backend está rodando.'
        : err instanceof Error
          ? err.message
          : 'Erro desconhecido';

      setError(errorMessage);

      if (errorMessage.includes('401')) {
        setData(createEmptyDashboardData());
      } else {
        setData(getMockData());
      }
    } finally {
      setLoading(false);
    }
  }, [filters, refreshInterval]);

  // Função para atualizar filtros
  const updateFilters = useCallback((newFilters: Partial<UseDashboardOptions>) => {
    setFilters((prev) => ({
      ...prev,
      ...newFilters,
    }));
  }, []);

  // Função para refresh manual
  const refresh = useCallback(async () => {
    await fetchDashboardData();
  }, [fetchDashboardData]);

  // Effect para buscar dados iniciais e quando filtros mudam
  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Effect para auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchDashboardData();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, fetchDashboardData]);

  return {
    data,
    loading,
    error,
    refresh,
    updateFilters,
  };
};

/**
 * Hook específico para KPIs
 */
export const useDashboardKPIs = (
  periodo: string = 'mensal',
  vendedorId?: string,
  regiao?: string,
) => {
  const [kpis, setKpis] = useState<DashboardKPIs | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchKPIs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const token = getAuthToken();
      if (!token) {
        setKpis(null);
        return;
      }

      const params = new URLSearchParams();
      params.append('periodo', periodo);
      if (vendedorId) params.append('vendedor', vendedorId);
      if (regiao) params.append('regiao', regiao);

      const response = await fetch(`${API_BASE_URL}/dashboard/kpis?${params.toString()}`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Erro ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      setKpis(result);
    } catch (err) {
      console.error('❌ Erro ao buscar KPIs:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  }, [periodo, vendedorId, regiao]);

  useEffect(() => {
    fetchKPIs();
  }, [fetchKPIs]);

  return { kpis, loading, error, refresh: fetchKPIs };
};

/**
 * Hook específico para alertas
 */
export const useDashboardAlertas = () => {
  const [alertas, setAlertas] = useState<AlertaInteligente[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAlertas = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const token = getAuthToken();
      if (!token) {
        setAlertas([]);
        return;
      }

      const response = await fetch(`${API_BASE_URL}/dashboard/alertas`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Erro ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      const alertasComData = result.map((alerta: any) => ({
        ...alerta,
        timestamp: new Date(alerta.timestamp),
      }));

      setAlertas(alertasComData);
    } catch (err) {
      console.error('❌ Erro ao buscar alertas:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  }, []);

  const marcarComoLido = useCallback((alertaId: string) => {
    setAlertas((prev) =>
      prev.map((alerta) => (alerta.id === alertaId ? { ...alerta, lido: true } : alerta)),
    );
  }, []);

  const fecharAlerta = useCallback((alertaId: string) => {
    setAlertas((prev) => prev.filter((alerta) => alerta.id !== alertaId));
  }, []);

  useEffect(() => {
    fetchAlertas();
  }, [fetchAlertas]);

  return {
    alertas,
    loading,
    error,
    refresh: fetchAlertas,
    marcarComoLido,
    fecharAlerta,
  };
};

// Dados mock como fallback
const getMockData = (): DashboardData => ({
  kpis: {
    faturamentoTotal: { valor: 487650, meta: 450000, variacao: 24, periodo: 'vs mês anterior' },
    ticketMedio: { valor: 23420, variacao: 8.7, periodo: 'vs mês anterior' },
    vendasFechadas: { quantidade: 34, variacao: 18, periodo: 'vs mês anterior' },
    emNegociacao: {
      valor: 285400,
      quantidade: 22,
      propostas: ['PROP-001', 'PROP-002', 'PROP-003'],
    },
    novosClientesMes: { quantidade: 248, variacao: 12.5 },
    leadsQualificados: { quantidade: 32, variacao: 8.3 },
    propostasEnviadas: { valor: 125000, variacao: 15.2 },
    cicloMedio: { dias: 18, variacao: -3.4 },
    tempoEtapa: { dias: 7, variacao: -1.2 },
    followUpsPendentes: { quantidade: 14, variacao: -9.5 },
    taxaSucessoGeral: { percentual: 68, variacao: -2.1 },
  },
  vendedoresRanking: [
    {
      id: '1',
      nome: 'João Silva',
      vendas: 150000,
      meta: 90000,
      variacao: 25,
      posicao: 1,
      badges: ['top_performer', 'goal_crusher'],
      cor: '#10B981',
    },
  ],
  alertas: [
    {
      id: 'mock-1',
      tipo: 'conquista',
      severidade: 'baixa',
      titulo: 'Meta Superada! 🎉',
      descricao: 'Parabéns! A meta mensal foi superada em 8%!',
      timestamp: new Date(),
      lido: false,
    },
  ],
  chartsData: undefined,
  metadata: {
    periodo: 'mensal',
    vendedorId: undefined,
    regiao: undefined,
    atualizadoEm: new Date().toISOString(),
    proximaAtualizacao: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    periodosDisponiveis: ['semanal', 'mensal', 'trimestral', 'semestral', 'anual'],
    vendedoresDisponiveis: [{ id: '1', nome: 'João Silva' }],
    regioesDisponiveis: ['Todas', 'Norte', 'Nordeste', 'Centro-Oeste', 'Sudeste', 'Sul'],
  },
});

export default useDashboard;
