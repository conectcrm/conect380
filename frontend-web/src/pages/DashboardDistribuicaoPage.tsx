/**
 * PÁGINA: Dashboard de Distribuição Automática
 * Módulo: Atendimento
 * Funcionalidade: Métricas, KPIs e logs de distribuição
 */

import React, { useState, useEffect } from 'react';
import {
  RefreshCw,
  BarChart3,
  Shuffle,
  TrendingUp,
  AlertCircle,
  Users,
  Activity,
  Clock,
} from 'lucide-react';
import { BackToNucleus } from '../components/navigation/BackToNucleus';
import {
  distribuicaoAvancadaService,
  DistribuicaoMetricas,
  DistribuicaoLog,
  AlgoritmoDistribuicao,
} from '../services/distribuicaoAvancadaService';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const DashboardDistribuicaoPage: React.FC = () => {
  // Estados
  const [metricas, setMetricas] = useState<DistribuicaoMetricas | null>(null);
  const [metricsPerformance, setMetricsPerformance] = useState<{
    distribuicoes: {
      total: number;
      sucesso: number;
      falha: number;
      taxaSucessoPct: number;
    };
    performance: {
      tempoMedioMs: number;
      tempoTotalMs: number;
    };
    cache: {
      hits: number;
      misses: number;
      taxaHitPct: number;
      configsCacheadas: number;
      skillsCacheadas: number;
    };
  } | null>(null);
  const [logs, setLogs] = useState<DistribuicaoLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);

  useEffect(() => {
    carregarDados();
  }, [paginaAtual]);

  const carregarDados = async () => {
    try {
      setLoading(true);
      setError(null);

      const [metricasData, metricsPerformanceData, logsData] = await Promise.all([
        distribuicaoAvancadaService.obterMetricas(),
        distribuicaoAvancadaService.obterMetricasPerformance(),
        distribuicaoAvancadaService.listarLogs({ page: paginaAtual, limit: 10 }),
      ]);

      setMetricas(metricasData);
      setMetricsPerformance(metricsPerformanceData);
      setLogs(logsData.data);
      setTotalPaginas(logsData.pagination.totalPages);
    } catch (err: unknown) {
      console.error('Erro ao carregar dados:', err);
      const responseMessage = (err as any)?.response?.data?.message;
      const normalizedMessage = Array.isArray(responseMessage)
        ? responseMessage.join('. ')
        : responseMessage;
      const fallbackMessage = err instanceof Error ? err.message : undefined;
      setError(normalizedMessage || fallbackMessage || 'Erro ao carregar dados do dashboard');
    } finally {
      setLoading(false);
    }
  };

  const getAlgoritmoLabel = (algoritmo: AlgoritmoDistribuicao): string => {
    const labels: Record<AlgoritmoDistribuicao, string> = {
      'round-robin': 'Round-Robin',
      'menor-carga': 'Menor Carga',
      'skills': 'Skills',
      'hibrido': 'Híbrido',
    };
    return labels[algoritmo];
  };

  const getAlgoritmoColor = (algoritmo: AlgoritmoDistribuicao): string => {
    const colors: Record<AlgoritmoDistribuicao, string> = {
      'round-robin': 'bg-blue-500',
      'menor-carga': 'bg-green-500',
      'skills': 'bg-purple-500',
      'hibrido': 'bg-[#159A9C]',
    };
    return colors[algoritmo];
  };

  const calcularPorcentagem = (valor: number, total: number): number => {
    if (total === 0) return 0;
    return Math.round((valor / total) * 100);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header com BackToNucleus */}
      <div className="bg-white border-b px-6 py-4">
        <BackToNucleus nucleusName="Atendimento" nucleusPath="/atendimento" />
      </div>

      {/* Container principal */}
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header da página */}
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-[#002333] flex items-center gap-3">
                  <BarChart3 className="h-8 w-8 text-[#159A9C]" />
                  Dashboard de Distribuição
                </h1>
                <p className="text-[#002333]/70 mt-2">
                  Métricas e análise de distribuição automática de tickets
                </p>
              </div>
              <button
                onClick={carregarDados}
                disabled={loading}
                className="px-4 py-2 bg-white text-[#002333] border border-[#B4BEC9] rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm font-medium"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Atualizar
              </button>
            </div>
          </div>

          {/* Mensagem de erro */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-red-900">Erro</h3>
                <p className="text-red-700 text-sm mt-1">{error}</p>
              </div>
            </div>
          )}

          {/* KPI Cards - Padrão Funil de Vendas */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Total de Distribuições */}
            <div className="p-5 rounded-2xl border border-[#DEEFE7] shadow-sm text-[#002333] bg-[#FFFFFF]">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#002333]/60">
                    Total de Distribuições
                  </p>
                  <p className="mt-2 text-3xl font-bold text-[#002333]">
                    {loading ? '...' : metricas?.totalDistribuicoes.toLocaleString('pt-BR') || 0}
                  </p>
                  <p className="mt-3 text-sm text-[#002333]/70">
                    Tickets distribuídos automaticamente
                  </p>
                </div>
                <div className="h-12 w-12 rounded-2xl bg-[#159A9C]/10 flex items-center justify-center shadow-sm">
                  <Shuffle className="h-6 w-6 text-[#159A9C]" />
                </div>
              </div>
            </div>

            {/* Distribuições Recentes (24h) */}
            <div className="p-5 rounded-2xl border border-[#DEEFE7] shadow-sm text-[#002333] bg-[#FFFFFF]">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#002333]/60">
                    Últimas 24 Horas
                  </p>
                  <p className="mt-2 text-3xl font-bold text-[#002333]">
                    {loading ? '...' : metricas?.distribuicoesRecentes.toLocaleString('pt-BR') || 0}
                  </p>
                  <p className="mt-3 text-sm text-[#002333]/70">
                    Distribuições nas últimas 24h
                  </p>
                </div>
                <div className="h-12 w-12 rounded-2xl bg-blue-500/10 flex items-center justify-center shadow-sm">
                  <Activity className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </div>

            {/* Total de Realocações */}
            <div className="p-5 rounded-2xl border border-[#DEEFE7] shadow-sm text-[#002333] bg-[#FFFFFF]">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#002333]/60">
                    Realocações
                  </p>
                  <p className="mt-2 text-3xl font-bold text-[#002333]">
                    {loading ? '...' : metricas?.totalRealocacoes.toLocaleString('pt-BR') || 0}
                  </p>
                  <p className="mt-3 text-sm text-[#002333]/70">
                    Tickets realocados manualmente
                  </p>
                </div>
                <div className="h-12 w-12 rounded-2xl bg-yellow-500/10 flex items-center justify-center shadow-sm">
                  <TrendingUp className="h-6 w-6 text-yellow-600" />
                </div>
              </div>
            </div>

            {/* Taxa de Realocação */}
            <div className="p-5 rounded-2xl border border-[#DEEFE7] shadow-sm text-[#002333] bg-[#FFFFFF]">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#002333]/60">
                    Taxa de Realocação
                  </p>
                  <p className="mt-2 text-3xl font-bold text-[#002333]">
                    {loading
                      ? '...'
                      : metricas
                        ? `${calcularPorcentagem(
                          metricas.totalRealocacoes,
                          metricas.totalDistribuicoes,
                        )}%`
                        : '0%'}
                  </p>
                  <p className="mt-3 text-sm text-[#002333]/70">
                    Percentual de realocações
                  </p>
                </div>
                <div className="h-12 w-12 rounded-2xl bg-purple-500/10 flex items-center justify-center shadow-sm">
                  <Users className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </div>
          </div>

          {/* KPI Cards de Performance (cache e timing) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Cache Hit Rate */}
            <div className="p-5 rounded-2xl border border-[#DEEFE7] shadow-sm text-[#002333] bg-[#FFFFFF]">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#002333]/60">
                    Cache Hit Rate
                  </p>
                  <p className="mt-2 text-3xl font-bold text-[#002333]">
                    {loading ? '...' : `${metricsPerformance?.cache.taxaHitPct.toFixed(1) || 0}%`}
                  </p>
                  <p className="mt-3 text-sm text-[#002333]/70">
                    Taxa de acerto do cache
                  </p>
                </div>
                <div className="h-12 w-12 rounded-2xl bg-green-500/10 flex items-center justify-center shadow-sm">
                  <Activity className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </div>

            {/* Tempo Médio */}
            <div className="p-5 rounded-2xl border border-[#DEEFE7] shadow-sm text-[#002333] bg-[#FFFFFF]">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#002333]/60">
                    Tempo Médio
                  </p>
                  <p className="mt-2 text-3xl font-bold text-[#002333]">
                    {loading ? '...' : `${metricsPerformance?.performance.tempoMedioMs.toFixed(0) || 0}ms`}
                  </p>
                  <p className="mt-3 text-sm text-[#002333]/70">
                    Tempo médio de distribuição
                  </p>
                </div>
                <div className="h-12 w-12 rounded-2xl bg-blue-500/10 flex items-center justify-center shadow-sm">
                  <Clock className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </div>

            {/* Taxa de Sucesso */}
            <div className="p-5 rounded-2xl border border-[#DEEFE7] shadow-sm text-[#002333] bg-[#FFFFFF]">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#002333]/60">
                    Taxa de Sucesso
                  </p>
                  <p className="mt-2 text-3xl font-bold text-[#002333]">
                    {loading ? '...' : `${metricsPerformance?.distribuicoes.taxaSucessoPct.toFixed(1) || 0}%`}
                  </p>
                  <p className="mt-3 text-sm text-[#002333]/70">
                    Distribuições bem-sucedidas
                  </p>
                </div>
                <div className="h-12 w-12 rounded-2xl bg-green-500/10 flex items-center justify-center shadow-sm">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </div>

            {/* Items Cacheados */}
            <div className="p-5 rounded-2xl border border-[#DEEFE7] shadow-sm text-[#002333] bg-[#FFFFFF]">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#002333]/60">
                    Items em Cache
                  </p>
                  <p className="mt-2 text-3xl font-bold text-[#002333]">
                    {loading
                      ? '...'
                      : (metricsPerformance?.cache.configsCacheadas || 0) +
                      (metricsPerformance?.cache.skillsCacheadas || 0)}
                  </p>
                  <p className="mt-3 text-sm text-[#002333]/70">
                    Configs ({metricsPerformance?.cache.configsCacheadas || 0}) + Skills (
                    {metricsPerformance?.cache.skillsCacheadas || 0})
                  </p>
                </div>
                <div className="h-12 w-12 rounded-2xl bg-[#159A9C]/10 flex items-center justify-center shadow-sm">
                  <BarChart3 className="h-6 w-6 text-[#159A9C]" />
                </div>
              </div>
            </div>
          </div>

          {/* Gráfico de Distribuição por Algoritmo */}
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
            <h2 className="text-lg font-bold text-[#002333] mb-6 flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-[#159A9C]" />
              Distribuição por Algoritmo
            </h2>

            {loading ? (
              <div className="text-center py-12">
                <RefreshCw className="h-8 w-8 text-[#159A9C] animate-spin mx-auto mb-4" />
                <p className="text-[#002333]/70">Carregando métricas...</p>
              </div>
            ) : metricas?.porAlgoritmo && metricas.porAlgoritmo.length > 0 ? (
              <div className="space-y-4">
                {metricas.porAlgoritmo.map((item) => {
                  const percentual = calcularPorcentagem(
                    parseInt(item.total as any),
                    metricas.totalDistribuicoes,
                  );
                  return (
                    <div key={item.algoritmo}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-[#002333]">
                          {getAlgoritmoLabel(item.algoritmo)}
                        </span>
                        <span className="text-sm text-[#002333]/70">
                          {item.total.toLocaleString('pt-BR')} ({percentual}%)
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                        <div
                          className={`${getAlgoritmoColor(item.algoritmo)} h-3 rounded-full transition-all duration-500`}
                          style={{ width: `${percentual}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <BarChart3 className="h-12 w-12 text-[#B4BEC9] mx-auto mb-4" />
                <p className="text-[#002333]/70">Nenhuma distribuição registrada ainda</p>
              </div>
            )}
          </div>

          {/* Logs Recentes */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-bold text-[#002333] mb-6 flex items-center gap-2">
              <Clock className="h-5 w-5 text-[#159A9C]" />
              Logs Recentes
            </h2>

            {loading ? (
              <div className="text-center py-12">
                <RefreshCw className="h-8 w-8 text-[#159A9C] animate-spin mx-auto mb-4" />
                <p className="text-[#002333]/70">Carregando logs...</p>
              </div>
            ) : logs.length === 0 ? (
              <div className="text-center py-12">
                <Clock className="h-12 w-12 text-[#B4BEC9] mx-auto mb-4" />
                <p className="text-[#002333]/70">Nenhum log de distribuição encontrado</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-[#DEEFE7]">
                        <th className="text-left py-3 px-4 text-xs font-semibold text-[#002333]/60 uppercase tracking-wide">
                          Data/Hora
                        </th>
                        <th className="text-left py-3 px-4 text-xs font-semibold text-[#002333]/60 uppercase tracking-wide">
                          Ticket
                        </th>
                        <th className="text-left py-3 px-4 text-xs font-semibold text-[#002333]/60 uppercase tracking-wide">
                          Atendente
                        </th>
                        <th className="text-left py-3 px-4 text-xs font-semibold text-[#002333]/60 uppercase tracking-wide">
                          Algoritmo
                        </th>
                        <th className="text-left py-3 px-4 text-xs font-semibold text-[#002333]/60 uppercase tracking-wide">
                          Carga
                        </th>
                        <th className="text-left py-3 px-4 text-xs font-semibold text-[#002333]/60 uppercase tracking-wide">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {logs.map((log) => (
                        <tr key={log.id} className="border-b border-[#DEEFE7] hover:bg-gray-50">
                          <td className="py-3 px-4 text-sm text-[#002333]">
                            {format(new Date(log.timestamp), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                          </td>
                          <td className="py-3 px-4 text-sm text-[#002333] font-mono">
                            {log.ticketId.substring(0, 8)}...
                          </td>
                          <td className="py-3 px-4 text-sm text-[#002333]">
                            {log.atendente?.nome || 'N/A'}
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${log.algoritmo === 'round-robin'
                                  ? 'bg-blue-500/10 text-blue-600'
                                  : log.algoritmo === 'menor-carga'
                                    ? 'bg-green-500/10 text-green-600'
                                    : log.algoritmo === 'skills'
                                      ? 'bg-purple-500/10 text-purple-600'
                                      : 'bg-[#159A9C]/10 text-[#159A9C]'
                                }`}
                            >
                              {getAlgoritmoLabel(log.algoritmo)}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-sm text-[#002333]">
                            {log.cargaAtendente} tickets
                          </td>
                          <td className="py-3 px-4">
                            {log.realocacao ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                Realocado
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                Automático
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Paginação */}
                {totalPaginas > 1 && (
                  <div className="flex items-center justify-between mt-6 pt-4 border-t">
                    <p className="text-sm text-[#002333]/70">
                      Página {paginaAtual} de {totalPaginas}
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setPaginaAtual((p) => Math.max(1, p - 1))}
                        disabled={paginaAtual === 1 || loading}
                        className="px-4 py-2 bg-white text-[#002333] border border-[#B4BEC9] rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                      >
                        Anterior
                      </button>
                      <button
                        onClick={() => setPaginaAtual((p) => Math.min(totalPaginas, p + 1))}
                        disabled={paginaAtual === totalPaginas || loading}
                        className="px-4 py-2 bg-white text-[#002333] border border-[#B4BEC9] rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                      >
                        Próxima
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardDistribuicaoPage;
