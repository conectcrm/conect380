/**
 * Aba de Distribuição de Atendimentos
 * 
 * Componente extraído de DashboardDistribuicaoPage.tsx para consolidação
 * em DashboardAnalyticsPage com sistema de abas.
 * 
 * @author ConectCRM
 * @date 09/12/2025
 */

import React, { useState, useEffect } from 'react';
import { RefreshCw, Users, Zap, TrendingUp, Clock, AlertTriangle } from 'lucide-react';
import distribuicaoService, {
  type EstatisticasDistribuicao,
} from '../../services/distribuicaoService';

interface KpiCard {
  label: string;
  value: string | number;
  icon: React.ComponentType<any>;
  description: string;
}

const DistribuicaoTab: React.FC = () => {
  const [estatisticas, setEstatisticas] = useState<EstatisticasDistribuicao | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(false);

  // Carregar estatísticas ao montar componente
  useEffect(() => {
    carregarEstatisticas();
  }, []);

  // Auto-refresh a cada 30 segundos
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      carregarEstatisticas();
    }, 30000);

    return () => clearInterval(interval);
  }, [autoRefresh]);

  const carregarEstatisticas = async () => {
    try {
      setLoading(true);
      setError(null);

      // Obter empresaId do usuário logado
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;
      const empresaId = user?.empresaId || 'f47ac10b-58cc-4372-a567-0e02b2c3d479';

      const dados = await distribuicaoService.buscarEstatisticas(empresaId);
      setEstatisticas(dados);
    } catch (err: unknown) {
      console.error('Erro ao carregar estatísticas de distribuição:', err);
      const responseMessage = (err as any)?.response?.data?.message;
      const normalizedMessage = Array.isArray(responseMessage)
        ? responseMessage.join('. ')
        : responseMessage;
      const fallbackMessage = err instanceof Error ? err.message : undefined;
      setError(normalizedMessage || fallbackMessage || 'Erro ao carregar estatísticas');
    } finally {
      setLoading(false);
    }
  };

  // Calcular KPIs
  const kpis: KpiCard[] = React.useMemo(() => {
    if (!estatisticas) return [];

    const totalDistribuido = estatisticas.totalDistribuidos || 0;
    const totalPendentes = estatisticas.totalPendentes || 0;
    const taxaDistribuicao = estatisticas.taxaDistribuicao || 0;
    const atendenteTop = estatisticas.atendenteComMaisTickets;

    return [
      {
        label: 'Total Distribuído',
        value: totalDistribuido,
        icon: Zap,
        description: 'Tickets distribuídos automaticamente',
      },
      {
        label: 'Taxa de Distribuição',
        value: `${taxaDistribuicao.toFixed(1)}%`,
        icon: TrendingUp,
        description: 'Percentual de tickets distribuídos vs. total',
      },
      {
        label: 'Pendentes',
        value: totalPendentes,
        icon: Clock,
        description: 'Tickets aguardando distribuição',
      },
      {
        label: 'Top Atendente',
        value: atendenteTop ? atendenteTop.quantidade : 0,
        icon: Users,
        description: atendenteTop ? atendenteTop.nome : 'Nenhum',
      },
    ];
  }, [estatisticas]);

  return (
    <div>
      {/* Controles */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-[#002333]">Estatísticas de Auto-Distribuição</h3>
          <div className="flex gap-3">
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 text-sm font-medium ${autoRefresh
                  ? 'bg-[#9333EA] text-white hover:bg-[#7928CA]'
                  : 'bg-white text-[#002333] border border-[#B4BEC9] hover:bg-gray-50'
                }`}
            >
              <RefreshCw className={`h-4 w-4 ${autoRefresh ? 'animate-spin' : ''}`} />
              Auto-refresh {autoRefresh ? 'ON' : 'OFF'}
            </button>
            <button
              onClick={carregarEstatisticas}
              className="px-4 py-2 bg-white text-[#002333] border border-[#B4BEC9] rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
            >
              <RefreshCw className="h-4 w-4 inline mr-2" />
              Atualizar
            </button>
          </div>
        </div>
      </div>

      {/* Loading */}
      {loading && !estatisticas && (
        <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#9333EA] mx-auto"></div>
          <p className="mt-4 text-[#002333]/70">Carregando estatísticas de distribuição...</p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-red-600 mr-3" />
            <p className="text-red-800">{error}</p>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      {!loading && !error && estatisticas && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            {kpis.map((kpi, index) => {
              const Icon = kpi.icon;
              return (
                <div
                  key={index}
                  className="p-5 rounded-2xl border border-[#DEEFE7] shadow-sm text-[#002333] bg-[#FFFFFF]"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-[#002333]/60">
                        {kpi.label}
                      </p>
                      <p className="mt-2 text-3xl font-bold text-[#002333]">{kpi.value}</p>
                      <p className="mt-3 text-sm text-[#002333]/70">{kpi.description}</p>
                    </div>
                    <div className="h-12 w-12 rounded-2xl bg-[#9333EA]/10 flex items-center justify-center shadow-sm">
                      <Icon className="h-6 w-6 text-[#9333EA]" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Performance por Atendente */}
          {estatisticas.distribuicaoPorAtendente && estatisticas.distribuicaoPorAtendente.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
              <h3 className="text-lg font-semibold text-[#002333] mb-4 flex items-center">
                <Users className="h-5 w-5 text-[#9333EA] mr-2" />
                Performance por Atendente
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#DEEFE7]">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-[#002333]/60">
                        Atendente
                      </th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-[#002333]/60">
                        Distribuídos
                      </th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-[#002333]/60">
                        Em Atendimento
                      </th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-[#002333]/60">
                        Resolvidos
                      </th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-[#002333]/60">
                        Carga Atual
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {estatisticas.distribuicaoPorAtendente.map((atendente, index) => (
                      <tr key={index} className="border-b border-[#DEEFE7] hover:bg-gray-50">
                        <td className="py-3 px-4 text-sm text-[#002333]">{atendente.atendenteNome}</td>
                        <td className="py-3 px-4 text-sm text-[#002333] text-right font-semibold">
                          {atendente.quantidade}
                        </td>
                        <td className="py-3 px-4 text-sm text-[#002333] text-right">
                          -
                        </td>
                        <td className="py-3 px-4 text-sm text-green-600 text-right font-semibold">
                          -
                        </td>
                        <td className="py-3 px-4 text-sm text-right">
                          <div className="flex items-center justify-end gap-2">
                            <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className={`h-full ${atendente.percentual >= 80
                                    ? 'bg-red-500'
                                    : atendente.percentual >= 60
                                      ? 'bg-yellow-500'
                                      : 'bg-green-500'
                                  }`}
                                style={{ width: `${atendente.percentual}%` }}
                              />
                            </div>
                            <span className="text-sm text-[#002333] font-medium">
                              {atendente.percentual.toFixed(0)}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Distribuição por Atendente (Resumo) */}
          {estatisticas.distribuicaoPorAtendente && estatisticas.distribuicaoPorAtendente.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-[#002333] mb-4">Resumo de Distribuição</h3>
              <div className="space-y-4">
                {estatisticas.distribuicaoPorAtendente.slice(0, 5).map((atendente, index) => {
                  return (
                    <div key={index}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-[#002333]">{atendente.atendenteNome}</span>
                        <span className="text-sm text-[#002333]/70">{atendente.quantidade} tickets</span>
                      </div>
                      <div className="flex h-4 rounded-full overflow-hidden">
                        <div
                          className="bg-[#9333EA]"
                          style={{ width: `${atendente.percentual}%` }}
                          title={`${atendente.percentual.toFixed(1)}% da distribuição`}
                        />
                        <div
                          className="bg-gray-200"
                          style={{ width: `${100 - atendente.percentual}%` }}
                        />
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-xs text-[#002333]/70">
                        <span className="flex items-center gap-1">
                          <div className="w-3 h-3 rounded-full bg-[#9333EA]"></div>
                          {atendente.quantidade} tickets ({atendente.percentual.toFixed(1)}%)
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default DistribuicaoTab;
