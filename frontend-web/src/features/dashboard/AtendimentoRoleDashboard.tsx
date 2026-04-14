import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  BarChart3,
  CheckCircle2,
  Clock3,
  MessageSquare,
  RefreshCw,
  Target,
  Users,
} from 'lucide-react';
import {
  analyticsService,
  DashboardMetrics,
  DesempenhoAtendente,
  EstatisticasCanal,
} from '../../services/analyticsService';
import { userHasPermission } from '../../config/menuConfig';
import { useAuth } from '../../hooks/useAuth';

type AtendimentoRoleMode = 'suporte' | 'operacional';

interface AtendimentoRoleDashboardProps {
  mode: AtendimentoRoleMode;
}

interface MetricCard {
  id: string;
  title: string;
  value: string;
  subtitle: string;
  icon: React.ReactNode;
}

const roleCopy: Record<
  AtendimentoRoleMode,
  { title: string; subtitle: string; equipeTitle: string }
> = {
  suporte: {
    title: 'Dashboard de Suporte',
    subtitle: 'Monitoramento de fila, SLA e tempo de resposta do atendimento.',
    equipeTitle: 'Atendentes com melhor SLA',
  },
  operacional: {
    title: 'Dashboard Operacional',
    subtitle: 'Visao consolidada de volume, resolucao e eficiencia da operacao.',
    equipeTitle: 'Atendentes com maior volume',
  },
};

const formatNumber = (value: number) => value.toLocaleString('pt-BR');

const formatMinutes = (value: number) => {
  if (value < 60) return `${Math.round(value)} min`;
  const hours = Math.floor(value / 60);
  const minutes = Math.round(value % 60);
  return minutes > 0 ? `${hours}h ${minutes}min` : `${hours}h`;
};

const formatHours = (value: number) => {
  if (value < 1) return `${Math.round(value * 60)} min`;
  return `${value.toFixed(1)} h`;
};

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

const AtendimentoRoleDashboard: React.FC<AtendimentoRoleDashboardProps> = ({ mode }) => {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [atendentes, setAtendentes] = useState<DesempenhoAtendente[]>([]);
  const [canais, setCanais] = useState<EstatisticasCanal[]>([]);
  const [periodo, setPeriodo] = useState<'7d' | '30d' | '90d'>('7d');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string | null>(null);
  const canViewAnalytics = useMemo(() => userHasPermission(user, 'relatorios.read'), [user]);

  const loadData = useCallback(async () => {
    if (!canViewAnalytics) {
      setError(null);
      setMetrics(null);
      setAtendentes([]);
      setCanais([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const [metricsData, atendentesData, canaisData] = await Promise.all([
        analyticsService.getDashboardMetrics({ periodo }),
        analyticsService.getDesempenhoAtendentes({ periodo, limite: 5 }),
        analyticsService.getEstatisticasCanais({ periodo }),
      ]);

      setMetrics(metricsData);
      setAtendentes(atendentesData);
      setCanais(canaisData);
      setLastUpdatedAt(new Date().toISOString());
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao carregar dashboard de atendimento';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [canViewAnalytics, periodo]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const cards = useMemo<MetricCard[]>(() => {
    if (!metrics) return [];

    const taxaResolucao =
      metrics.ticketsTotal > 0 ? (metrics.ticketsResolvidos / metrics.ticketsTotal) * 100 : 0;

    if (mode === 'suporte') {
      return [
        {
          id: 'pendentes',
          title: 'Tickets Pendentes',
          value: formatNumber(metrics.ticketsPendentes),
          subtitle: `${formatNumber(metrics.ticketsAbertos)} em aberto`,
          icon: <MessageSquare className="h-5 w-5 text-[#159A9C]" />,
        },
        {
          id: 'resposta',
          title: 'Tempo Medio de Resposta',
          value: formatMinutes(metrics.tempoMedioResposta),
          subtitle: 'Primeira resposta',
          icon: <Clock3 className="h-5 w-5 text-[#159A9C]" />,
        },
        {
          id: 'sla',
          title: 'SLA Atingido',
          value: `${metrics.slaAtingido.toFixed(1)}%`,
          subtitle: 'Dentro do prazo',
          icon: <Target className="h-5 w-5 text-[#159A9C]" />,
        },
        {
          id: 'satisfacao',
          title: 'Satisfacao',
          value: `${metrics.satisfacaoCliente.toFixed(1)}/5.0`,
          subtitle: 'Proxy de qualidade',
          icon: <CheckCircle2 className="h-5 w-5 text-[#159A9C]" />,
        },
      ];
    }

    return [
      {
        id: 'total',
        title: 'Tickets no Periodo',
        value: formatNumber(metrics.ticketsTotal),
        subtitle: `${formatNumber(metrics.ticketsAbertos)} em aberto`,
        icon: <BarChart3 className="h-5 w-5 text-[#159A9C]" />,
      },
      {
        id: 'resolvidos',
        title: 'Tickets Resolvidos',
        value: formatNumber(metrics.ticketsResolvidos),
        subtitle: `${taxaResolucao.toFixed(1)}% de resolucao`,
        icon: <CheckCircle2 className="h-5 w-5 text-[#159A9C]" />,
      },
      {
        id: 'resolucao',
        title: 'Tempo Medio de Resolucao',
        value: formatHours(metrics.tempoMedioResolucao),
        subtitle: 'Do inicio ao fechamento',
        icon: <Clock3 className="h-5 w-5 text-[#159A9C]" />,
      },
      {
        id: 'sla-operacao',
        title: 'SLA Global',
        value: `${metrics.slaAtingido.toFixed(1)}%`,
        subtitle: 'Resolucao dentro do prazo',
        icon: <Target className="h-5 w-5 text-[#159A9C]" />,
      },
    ];
  }, [metrics, mode]);

  const equipeData = useMemo(() => {
    if (mode === 'suporte') {
      return [...atendentes].sort((a, b) => b.slaAtingido - a.slaAtingido);
    }
    return [...atendentes].sort((a, b) => b.ticketsAtendidos - a.ticketsAtendidos);
  }, [atendentes, mode]);

  const canaisData = useMemo(() => {
    const totalTickets = canais.reduce((acc, canal) => acc + canal.ticketsTotal, 0);
    return canais
      .map((canal) => ({
        ...canal,
        percentual: totalTickets > 0 ? (canal.ticketsTotal / totalTickets) * 100 : 0,
      }))
      .sort((a, b) => b.ticketsTotal - a.ticketsTotal);
  }, [canais]);

  const hasActiveFilters = periodo !== '7d';
  const lastUpdatedLabel = lastUpdatedAt ? formatDateTime(lastUpdatedAt) : 'Atualizado agora';
  const periodoLabel = periodo === '7d' ? 'Ultimos 7 dias' : periodo === '30d' ? 'Ultimos 30 dias' : 'Ultimos 90 dias';

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <section className="mb-6 rounded-[20px] border border-[#DCE7EB] bg-white p-5 shadow-[0_16px_30px_-24px_rgba(16,57,74,0.28)]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-[20px] font-semibold tracking-[-0.012em] text-[#18374B]">
                {roleCopy[mode].title}
              </h1>
              <p className="mt-1 text-[13px] text-[#617D89]">{roleCopy[mode].subtitle}</p>
              <p className="mt-1 text-[12px] text-[#7A929E]">
                Ultima sincronizacao: {lastUpdatedLabel} (modo {periodoLabel.toLowerCase()})
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <label htmlFor={`dashboard-atendimento-periodo-${mode}`} className="text-[13px] font-medium text-[#567583]">
                Periodo
              </label>
              <select
                id={`dashboard-atendimento-periodo-${mode}`}
                value={periodo}
                onChange={(event) => setPeriodo(event.target.value as '7d' | '30d' | '90d')}
                className="rounded-[10px] border border-[#D5E3E8] bg-white px-3 py-2 text-[13px] text-[#244556] focus:border-[#159A9C] focus:outline-none"
              >
                <option value="7d">Ultimos 7 dias</option>
                <option value="30d">Ultimos 30 dias</option>
                <option value="90d">Ultimos 90 dias</option>
              </select>

              <button
                type="button"
                onClick={() => setPeriodo('7d')}
                disabled={!hasActiveFilters}
                className="inline-flex items-center gap-2 rounded-[10px] border border-[#D5E3E8] px-3 py-2 text-[13px] font-semibold text-[#26495C] hover:bg-[#F3F9F8] disabled:cursor-not-allowed disabled:opacity-50"
              >
                Limpar filtros
              </button>

              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="inline-flex items-center gap-2 rounded-[10px] border border-[#D5E3E8] px-3 py-2 text-[13px] font-semibold text-[#26495C] hover:bg-[#F3F9F8] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
                Atualizar
              </button>
            </div>
          </div>
        </section>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-red-800 font-medium">Falha ao carregar dados</p>
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          </div>
        )}

        {!loading && !error && !canViewAnalytics && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-amber-700 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-amber-900 font-medium">Visao analitica restrita</p>
              <p className="text-amber-800 text-sm">
                Este perfil possui acesso ao dashboard, mas nao tem permissao de relatorios para
                carregar os indicadores avancados.
              </p>
            </div>
          </div>
        )}

        {loading && (
          <div className="bg-white rounded-lg border border-[#DEEFE7] p-8 text-center mb-6">
            <RefreshCw className="h-8 w-8 text-[#159A9C] animate-spin mx-auto mb-3" />
            <p className="text-[#002333]/70">Carregando metricas...</p>
          </div>
        )}

        {!loading && metrics && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-6">
              {cards.map((card) => (
                <div key={card.id} className="bg-white rounded-lg border border-[#DEEFE7] p-5 shadow-sm">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-wide font-semibold text-[#002333]/60">
                        {card.title}
                      </p>
                      <p className="text-2xl font-bold text-[#002333] mt-2">{card.value}</p>
                      <p className="text-sm text-[#002333]/70 mt-2">{card.subtitle}</p>
                    </div>
                    <div className="h-11 w-11 rounded-xl bg-[#159A9C]/10 flex items-center justify-center">
                      {card.icon}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg border border-[#DEEFE7] p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <Users className="h-5 w-5 text-[#159A9C]" />
                  <h2 className="text-lg font-semibold text-[#002333]">{roleCopy[mode].equipeTitle}</h2>
                </div>

                {equipeData.length === 0 ? (
                  <p className="text-sm text-[#002333]/70">Sem dados de desempenho para o periodo.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-[#DEEFE7]">
                          <th className="text-left py-2 text-[#002333]/60 font-semibold">Atendente</th>
                          <th className="text-right py-2 text-[#002333]/60 font-semibold">Tickets</th>
                          <th className="text-right py-2 text-[#002333]/60 font-semibold">Resposta</th>
                          <th className="text-right py-2 text-[#002333]/60 font-semibold">SLA</th>
                        </tr>
                      </thead>
                      <tbody>
                        {equipeData.map((item) => (
                          <tr key={item.atendenteId} className="border-b border-[#DEEFE7] last:border-b-0">
                            <td className="py-2 text-[#002333]">{item.nome}</td>
                            <td className="py-2 text-right text-[#002333]">
                              {formatNumber(item.ticketsAtendidos)}
                            </td>
                            <td className="py-2 text-right text-[#002333]">
                              {formatMinutes(item.tempoMedioResposta)}
                            </td>
                            <td className="py-2 text-right text-[#002333]">{item.slaAtingido.toFixed(1)}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div className="bg-white rounded-lg border border-[#DEEFE7] p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <MessageSquare className="h-5 w-5 text-[#159A9C]" />
                  <h2 className="text-lg font-semibold text-[#002333]">Distribuicao por Canal</h2>
                </div>

                {canaisData.length === 0 ? (
                  <p className="text-sm text-[#002333]/70">Sem dados de canais para o periodo.</p>
                ) : (
                  <div className="space-y-4">
                    {canaisData.map((canal) => (
                      <div key={canal.canalId}>
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="text-[#002333] font-medium">{canal.nome}</span>
                          <span className="text-[#002333]/70">{formatNumber(canal.ticketsTotal)} tickets</span>
                        </div>
                        <div className="w-full h-2 bg-[#DEEFE7] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#159A9C]"
                            style={{ width: `${Math.max(4, canal.percentual)}%` }}
                          />
                        </div>
                        <div className="flex items-center justify-between text-xs mt-1 text-[#002333]/70">
                          <span>{canal.percentual.toFixed(1)}% do volume</span>
                          <span>TMR {formatMinutes(canal.tempoMedioResposta)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AtendimentoRoleDashboard;
