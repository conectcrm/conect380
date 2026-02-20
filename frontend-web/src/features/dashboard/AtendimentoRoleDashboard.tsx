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

const AtendimentoRoleDashboard: React.FC<AtendimentoRoleDashboardProps> = ({ mode }) => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [atendentes, setAtendentes] = useState<DesempenhoAtendente[]>([]);
  const [canais, setCanais] = useState<EstatisticasCanal[]>([]);
  const [periodo, setPeriodo] = useState<'7d' | '30d' | '90d'>('7d');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
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
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao carregar dashboard de atendimento';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [periodo]);

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

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg border border-[#DEEFE7] shadow-sm p-6 mb-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-[#002333]">{roleCopy[mode].title}</h1>
              <p className="text-[#002333]/70 mt-1">{roleCopy[mode].subtitle}</p>
            </div>

            <div className="flex items-center gap-3">
              <select
                value={periodo}
                onChange={(event) => setPeriodo(event.target.value as '7d' | '30d' | '90d')}
                className="px-3 py-2 border border-[#B4BEC9] rounded-lg text-sm focus:ring-2 focus:ring-[#159A9C] focus:border-transparent"
              >
                <option value="7d">Ultimos 7 dias</option>
                <option value="30d">Ultimos 30 dias</option>
                <option value="90d">Ultimos 90 dias</option>
              </select>

              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="px-4 py-2 bg-[#159A9C] text-white rounded-lg hover:bg-[#0F7B7D] disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium flex items-center gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                Atualizar
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-red-800 font-medium">Falha ao carregar dados</p>
              <p className="text-red-700 text-sm">{error}</p>
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
