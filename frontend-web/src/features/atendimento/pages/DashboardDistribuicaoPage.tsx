/**
 * Dashboard de Auto-Distribuição de Filas
 * 
 * Exibe métricas e KPIs sobre distribuição automática de tickets,
 * performance dos atendentes e eficiência do sistema.
 * 
 * @author ConectCRM
 * @date 07/11/2025
 */

import React, { useState, useEffect } from 'react';
import {
  RefreshCw,
  Users,
  Zap,
  TrendingUp,
  Activity,
  BarChart3,
  Clock,
} from 'lucide-react';
import { BackToNucleus } from '../../../components/navigation/BackToNucleus';
import distribuicaoService, { type EstatisticasDistribuicao } from '../../../services/distribuicaoService';

interface KpiCard {
  label: string;
  value: string | number;
  icon: React.ComponentType<any>;
  trend?: number;
  description: string;
}

const DashboardDistribuicaoPage: React.FC = () => {
  // Estados principais
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
    }, 30000); // 30 segundos

    return () => clearInterval(interval);
  }, [autoRefresh]);

  const carregarEstatisticas = async () => {
    try {
      setLoading(true);
      setError(null);

      // Obter empresaId do usuário logado (do localStorage ou context)
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;
      const empresaId = user?.empresaId || 'f47ac10b-58cc-4372-a567-0e02b2c3d479';

      // Carregar estatísticas globais (todas as filas)
      const dados = await distribuicaoService.buscarEstatisticas(empresaId);
      setEstatisticas(dados);
    } catch (err: unknown) {
      console.error('Erro ao carregar estatísticas:', err);
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

  // Estados de loading e erro
  if (loading && !estatisticas) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b px-6 py-4">
          <BackToNucleus nucleusName="Atendimento" nucleusPath="/atendimento" />
        </div>
        <div className="p-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-center h-96">
              <div className="flex flex-col items-center gap-4">
                <RefreshCw className="h-8 w-8 text-purple-600 animate-spin" />
                <p className="text-gray-600">Carregando estatísticas...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header com BackToNucleus */}
      <div className="bg-white border-b px-6 py-4">
        <BackToNucleus nucleusName="Atendimento" nucleusPath="/atendimento" />
      </div>

      {/* Conteúdo Principal */}
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          {/* Cabeçalho da Página */}
          <div className="bg-white rounded-lg shadow-sm border mb-6">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-[#002333] flex items-center">
                    <BarChart3 className="h-8 w-8 mr-3 text-[#9333EA]" />
                    Dashboard de Auto-Distribuição
                  </h1>
                  <p className="text-gray-600 mt-2">
                    Métricas e estatísticas sobre distribuição automática de tickets
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {/* Toggle Auto-Refresh */}
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={autoRefresh}
                      onChange={(e) => setAutoRefresh(e.target.checked)}
                      className="w-4 h-4 text-purple-600 rounded focus:ring-2 focus:ring-purple-500"
                    />
                    <span className="text-sm text-gray-600">
                      Auto-atualizar (30s)
                    </span>
                  </label>

                  {/* Botão Atualizar */}
                  <button
                    onClick={carregarEstatisticas}
                    disabled={loading}
                    className="px-4 py-2 bg-white text-[#9333EA] border border-[#9333EA] rounded-lg hover:bg-purple-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm font-medium"
                  >
                    <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    Atualizar
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Mensagem de Erro */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {kpis.map((kpi, index) => (
              <div
                key={index}
                className="p-5 rounded-2xl border border-[#DEEFE7] shadow-sm text-[#002333] bg-[#FFFFFF]"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-[#002333]/60">
                      {kpi.label}
                    </p>
                    <p className="mt-2 text-3xl font-bold text-[#002333]">
                      {kpi.value}
                    </p>
                    <p className="mt-3 text-sm text-[#002333]/70">
                      {kpi.description}
                    </p>
                  </div>
                  <div className="h-12 w-12 rounded-2xl bg-[#9333EA]/10 flex items-center justify-center shadow-sm">
                    <kpi.icon className="h-6 w-6 text-[#9333EA]" />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Distribuição por Atendente */}
          {estatisticas?.distribuicaoPorAtendente && estatisticas.distribuicaoPorAtendente.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border mb-6">
              <div className="p-6">
                <h2 className="text-xl font-bold text-[#002333] mb-4 flex items-center">
                  <Activity className="h-5 w-5 mr-2 text-[#9333EA]" />
                  Distribuição por Atendente
                </h2>

                {/* Gráfico de Barras Simples (CSS-based) */}
                <div className="space-y-4">
                  {estatisticas.distribuicaoPorAtendente.map((atendente, index) => {
                    const maxTickets = Math.max(...estatisticas.distribuicaoPorAtendente!.map(a => a.quantidade));
                    const percentage = maxTickets > 0 ? (atendente.quantidade / maxTickets) * 100 : 0;

                    return (
                      <div key={index} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium text-gray-700">
                            {atendente.atendenteNome}
                          </span>
                          <span className="text-gray-600">
                            {atendente.quantidade} tickets ({atendente.percentual.toFixed(1)}%)
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div
                            className="bg-gradient-to-r from-purple-500 to-purple-600 h-3 rounded-full transition-all duration-500"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Estado Vazio */}
          {!loading && (!estatisticas || !estatisticas.distribuicaoPorAtendente?.length) && (
            <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
              <Activity className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Nenhuma distribuição registrada
              </h3>
              <p className="text-gray-600 mb-6">
                Configure a auto-distribuição em uma fila para começar a ver métricas aqui.
              </p>
              <button
                onClick={() => window.location.href = '/atendimento/distribuicao'}
                className="px-4 py-2 bg-[#9333EA] text-white rounded-lg hover:bg-[#7E22CE] transition-colors text-sm font-medium"
              >
                Configurar Auto-Distribuição
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardDistribuicaoPage;
