/**
 * Dashboard Analytics - Módulo Atendimento
 *
 * Página de analytics com métricas agregadas, estatísticas e gráficos
 * Exibe KPIs principais, desempenho de atendentes, canais e tendências
 *
 * Features:
 * - 6 KPI Cards principais (tickets, tempos, SLA, satisfação)
 * - Filtro de período (7d, 30d, 90d)
 * - Gráfico de tendência de tickets (linha)
 * - Tabela de desempenho de atendentes
 * - Cards de estatísticas por canal
 * - Design Crevasse Professional (#159A9C)
 * - Responsivo (mobile-first)
 *
 * @author ConectCRM
 * @date 2025-11-18
 */

import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  Users,
  Activity,
  Target,
  MessageSquare,
  RefreshCw,
} from 'lucide-react';
import { BackToNucleus } from '../components/navigation/BackToNucleus';
import {
  analyticsService,
  DashboardMetrics,
  DesempenhoAtendente,
  EstatisticasCanal,
} from '../services/analyticsService';
import SLATab from '../components/analytics/SLATab';
import DistribuicaoTab from '../components/analytics/DistribuicaoTab';

const DashboardAnalyticsPage: React.FC = () => {
  // Estado de abas (ler do URL query param)
  const [activeTab, setActiveTab] = useState<'geral' | 'sla' | 'distribuicao' | 'desempenho'>(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab');
    return (tab === 'sla' || tab === 'distribuicao' || tab === 'desempenho') ? tab : 'geral';
  });

  // Estados principais
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [atendentes, setAtendentes] = useState<DesempenhoAtendente[]>([]);
  const [canais, setCanais] = useState<EstatisticasCanal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [periodo, setPeriodo] = useState<'7d' | '30d' | '90d'>('7d');
  const [refreshing, setRefreshing] = useState(false);

  // Atualizar URL quando aba mudar
  const handleTabChange = (tab: typeof activeTab) => {
    setActiveTab(tab);
    const url = new URL(window.location.href);
    url.searchParams.set('tab', tab);
    window.history.pushState({}, '', url.toString());
  };

  // Carregar dados ao montar e quando período mudar
  useEffect(() => {
    carregarDados();
  }, [periodo]);

  /**
   * Carrega todos os dados do dashboard
   */
  const carregarDados = async () => {
    try {
      setLoading(true);
      setError(null);

      // 🔐 empresaId vem automaticamente do JWT no backend
      // Carregar métricas, atendentes e canais em paralelo
      const [metricsData, atendentesData, canaisData] = await Promise.all([
        analyticsService.getDashboardMetrics({ periodo }),
        analyticsService.getDesempenhoAtendentes({ periodo, limite: 5 }),
        analyticsService.getEstatisticasCanais({ periodo }),
      ]);

      setMetrics(metricsData);
      setAtendentes(atendentesData);
      setCanais(canaisData);
    } catch (err: unknown) {
      console.error('Erro ao carregar dados do dashboard:', err);
      const errorMessage =
        err instanceof Error ? err.message : 'Erro ao carregar dados do dashboard';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Atualiza dados manualmente
   */
  const handleRefresh = async () => {
    setRefreshing(true);
    await carregarDados();
    setRefreshing(false);
  };

  /**
   * Formata número com separador de milhares
   */
  const formatarNumero = (num: number): string => {
    return num.toLocaleString('pt-BR');
  };

  /**
   * Formata tempo em minutos para exibição legível
   */
  const formatarTempo = (minutos: number): string => {
    if (minutos < 60) {
      return `${Math.round(minutos)}min`;
    }
    const horas = Math.floor(minutos / 60);
    const mins = Math.round(minutos % 60);
    return mins > 0 ? `${horas}h ${mins}min` : `${horas}h`;
  };

  /**
   * Retorna label do período
   */
  const getLabelPeriodo = (p: string): string => {
    switch (p) {
      case '7d':
        return 'Últimos 7 dias';
      case '30d':
        return 'Últimos 30 dias';
      case '90d':
        return 'Últimos 90 dias';
      default:
        return '';
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b px-6 py-4">
          <BackToNucleus nucleusName="Atendimento" nucleusPath="/atendimento" />
        </div>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <RefreshCw className="h-12 w-12 text-[#159A9C] animate-spin mx-auto mb-4" />
            <p className="text-[#002333]/60">Carregando dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header com navegação */}
      <div className="bg-white border-b px-6 py-4">
        <BackToNucleus nucleusName="Atendimento" nucleusPath="/atendimento" />
      </div>

      {/* Container principal */}
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header da página */}
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-[#002333] flex items-center">
                  <BarChart3 className="h-8 w-8 mr-3 text-[#159A9C]" />
                  Métricas & Analytics
                </h1>
                <p className="text-[#002333]/60 mt-1">Dashboards consolidados de atendimento</p>
              </div>

              {/* Controles */}
              <div className="flex flex-col sm:flex-row gap-3">
                {/* Filtro de período */}
                <select
                  value={periodo}
                  onChange={(e) => setPeriodo(e.target.value as '7d' | '30d' | '90d')}
                  className="px-4 py-2 border border-[#B4BEC9] rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent text-sm"
                >
                  <option value="7d">Últimos 7 dias</option>
                  <option value="30d">Últimos 30 dias</option>
                  <option value="90d">Últimos 90 dias</option>
                </select>

                {/* Botão atualizar */}
                <button
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="px-4 py-2 bg-[#159A9C] text-white rounded-lg hover:bg-[#0F7B7D] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm font-medium"
                >
                  <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                  Atualizar
                </button>
              </div>
            </div>

            {/* Navegação de Abas */}
            <div className="mt-6 border-b border-gray-200">
              <nav className="-mb-px flex gap-6">
                <button
                  onClick={() => handleTabChange('geral')}
                  className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'geral'
                    ? 'border-[#159A9C] text-[#159A9C]'
                    : 'border-transparent text-[#002333]/60 hover:text-[#002333] hover:border-gray-300'
                    }`}
                >
                  📊 Visão Geral
                </button>
                <button
                  onClick={() => handleTabChange('sla')}
                  className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'sla'
                    ? 'border-[#159A9C] text-[#159A9C]'
                    : 'border-transparent text-[#002333]/60 hover:text-[#002333] hover:border-gray-300'
                    }`}
                >
                  ⏱️ SLA
                </button>
                <button
                  onClick={() => handleTabChange('distribuicao')}
                  className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'distribuicao'
                    ? 'border-[#159A9C] text-[#159A9C]'
                    : 'border-transparent text-[#002333]/60 hover:text-[#002333] hover:border-gray-300'
                    }`}
                >
                  👥 Distribuição
                </button>
                <button
                  onClick={() => handleTabChange('desempenho')}
                  className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'desempenho'
                    ? 'border-[#159A9C] text-[#159A9C]'
                    : 'border-transparent text-[#002333]/60 hover:text-[#002333] hover:border-gray-300'
                    }`}
                >
                  🏆 Desempenho
                </button>
              </nav>
            </div>
          </div>

          {/* Erro feedback */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-red-800 font-medium">Erro ao carregar dados</p>
                  <p className="text-red-600 text-sm mt-1">{error}</p>
                </div>
                <button onClick={() => setError(null)} className="text-red-600 hover:text-red-800">
                  ×
                </button>
              </div>
            </div>
          )}

          {/* Conteúdo por Aba */}

          {/* ABA: Visão Geral */}
          {activeTab === 'geral' && metrics && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {/* Card: Tickets Abertos */}
                <div className="p-5 rounded-2xl border border-[#DEEFE7] shadow-sm bg-white">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-[#002333]/60">
                        Tickets Abertos
                      </p>
                      <p className="mt-2 text-3xl font-bold text-[#002333]">
                        {formatarNumero(metrics.ticketsAbertos)}
                      </p>
                      <p className="mt-3 text-sm text-[#002333]/70">
                        Total de {formatarNumero(metrics.ticketsTotal)} tickets
                      </p>
                    </div>
                    <div className="h-12 w-12 rounded-2xl bg-[#159A9C]/10 flex items-center justify-center shadow-sm">
                      <MessageSquare className="h-6 w-6 text-[#159A9C]" />
                    </div>
                  </div>
                </div>

                {/* Card: Tickets Resolvidos */}
                <div className="p-5 rounded-2xl border border-[#DEEFE7] shadow-sm bg-white">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-[#002333]/60">
                        Tickets Resolvidos
                      </p>
                      <p className="mt-2 text-3xl font-bold text-[#002333]">
                        {formatarNumero(metrics.ticketsResolvidos)}
                      </p>
                      <p className="mt-3 text-sm text-green-600">
                        {metrics.ticketsTotal > 0
                          ? `${((metrics.ticketsResolvidos / metrics.ticketsTotal) * 100).toFixed(1)}% do total`
                          : 'Sem tickets'}
                      </p>
                    </div>
                    <div className="h-12 w-12 rounded-2xl bg-green-500/10 flex items-center justify-center shadow-sm">
                      <CheckCircle2 className="h-6 w-6 text-green-600" />
                    </div>
                  </div>
                </div>

                {/* Card: Tickets Pendentes */}
                <div className="p-5 rounded-2xl border border-[#DEEFE7] shadow-sm bg-white">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-[#002333]/60">
                        Tickets Pendentes
                      </p>
                      <p className="mt-2 text-3xl font-bold text-[#002333]">
                        {formatarNumero(metrics.ticketsPendentes)}
                      </p>
                      <p className="mt-3 text-sm text-yellow-600">Aguardando ação</p>
                    </div>
                    <div className="h-12 w-12 rounded-2xl bg-yellow-500/10 flex items-center justify-center shadow-sm">
                      <AlertCircle className="h-6 w-6 text-yellow-600" />
                    </div>
                  </div>
                </div>

                {/* Card: Tempo Médio de Resposta */}
                <div className="p-5 rounded-2xl border border-[#DEEFE7] shadow-sm bg-white">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-[#002333]/60">
                        Tempo Médio de Resposta
                      </p>
                      <p className="mt-2 text-3xl font-bold text-[#002333]">
                        {formatarTempo(metrics.tempoMedioResposta)}
                      </p>
                      <p className="mt-3 text-sm text-[#002333]/70">Primeira resposta ao cliente</p>
                    </div>
                    <div className="h-12 w-12 rounded-2xl bg-[#159A9C]/10 flex items-center justify-center shadow-sm">
                      <Clock className="h-6 w-6 text-[#159A9C]" />
                    </div>
                  </div>
                </div>

                {/* Card: SLA Atingido */}
                <div className="p-5 rounded-2xl border border-[#DEEFE7] shadow-sm bg-white">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-[#002333]/60">
                        SLA Atingido
                      </p>
                      <p className="mt-2 text-3xl font-bold text-[#002333]">
                        {metrics.slaAtingido.toFixed(1)}%
                      </p>
                      <p className="mt-3 text-sm text-[#002333]/70">Resolução dentro do prazo</p>
                    </div>
                    <div
                      className={`h-12 w-12 rounded-2xl ${metrics.slaAtingido >= 90 ? 'bg-green-500/10' : 'bg-orange-500/10'} flex items-center justify-center shadow-sm`}
                    >
                      <Target
                        className={`h-6 w-6 ${metrics.slaAtingido >= 90 ? 'text-green-600' : 'text-orange-600'}`}
                      />
                    </div>
                  </div>
                </div>

                {/* Card: Satisfação do Cliente */}
                <div className="p-5 rounded-2xl border border-[#DEEFE7] shadow-sm bg-white">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-[#002333]/60">
                        Satisfação do Cliente
                      </p>
                      <p className="mt-2 text-3xl font-bold text-[#002333]">
                        {metrics.satisfacaoCliente.toFixed(1)}/5.0
                      </p>
                      <p className="mt-3 text-sm text-[#002333]/70">
                        {/* Estrelas visuais */}
                        {'★'.repeat(Math.round(metrics.satisfacaoCliente))}
                        {'☆'.repeat(5 - Math.round(metrics.satisfacaoCliente))}
                      </p>
                    </div>
                    <div className="h-12 w-12 rounded-2xl bg-[#159A9C]/10 flex items-center justify-center shadow-sm">
                      <Activity className="h-6 w-6 text-[#159A9C]" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Gráfico de Tendência - Simplificado */}
              {metrics.tendencia.tickets.length > 0 && (
                <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
                  <h2 className="text-xl font-bold text-[#002333] mb-4 flex items-center">
                    <TrendingUp className="h-5 w-5 mr-2 text-[#159A9C]" />
                    Tendência de Tickets - {getLabelPeriodo(periodo)}
                  </h2>
                  <div className="h-64 flex items-end justify-between gap-2">
                    {metrics.tendencia.tickets.map((ponto, index) => {
                      const maxValor = Math.max(...metrics.tendencia.tickets.map((p) => p.valor));
                      const altura = maxValor > 0 ? (ponto.valor / maxValor) * 100 : 0;

                      return (
                        <div key={index} className="flex-1 flex flex-col items-center">
                          <div
                            className="w-full bg-[#159A9C] rounded-t transition-all hover:bg-[#0F7B7D]"
                            style={{ height: `${altura}%`, minHeight: '4px' }}
                          ></div>
                          <div className="text-xs text-[#002333]/60 mt-2 text-center">
                            {new Date(ponto.data).toLocaleDateString('pt-BR', {
                              day: '2-digit',
                              month: '2-digit',
                            })}
                          </div>
                          <div className="text-xs font-semibold text-[#002333] mt-1">
                            {ponto.valor}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Desempenho de Atendentes */}
          {atendentes.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
              <h2 className="text-xl font-bold text-[#002333] mb-4 flex items-center">
                <Users className="h-5 w-5 mr-2 text-[#159A9C]" />
                Desempenho de Atendentes
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#DEEFE7]">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-[#002333]/60">
                        Atendente
                      </th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-[#002333]/60">
                        Tickets
                      </th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-[#002333]/60">
                        Tempo Resposta
                      </th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-[#002333]/60">
                        SLA
                      </th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-[#002333]/60">
                        Satisfação
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {atendentes.map((atendente) => (
                      <tr
                        key={atendente.atendenteId}
                        className="border-b border-[#DEEFE7] hover:bg-gray-50"
                      >
                        <td className="py-3 px-4 text-sm text-[#002333]">{atendente.nome}</td>
                        <td className="py-3 px-4 text-sm text-[#002333] text-right font-semibold">
                          {formatarNumero(atendente.ticketsAtendidos)}
                        </td>
                        <td className="py-3 px-4 text-sm text-[#002333] text-right">
                          {formatarTempo(atendente.tempoMedioResposta)}
                        </td>
                        <td className="py-3 px-4 text-sm text-right">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${atendente.slaAtingido >= 90
                              ? 'bg-green-100 text-green-800'
                              : atendente.slaAtingido >= 70
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-red-100 text-red-800'
                              }`}
                          >
                            {atendente.slaAtingido.toFixed(1)}%
                          </span>
                        </td>
                        <td className="py-3 px-4 text-sm text-[#002333] text-right">
                          {atendente.satisfacaoMedia.toFixed(1)}/5.0
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Estatísticas por Canal */}
          {canais.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-xl font-bold text-[#002333] mb-4 flex items-center">
                <MessageSquare className="h-5 w-5 mr-2 text-[#159A9C]" />
                Estatísticas por Canal
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {canais.map((canal) => (
                  <div
                    key={canal.canalId}
                    className="border border-[#DEEFE7] rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-[#002333]">{canal.nome}</h3>
                      <span className="text-xs text-[#002333]/60 uppercase">{canal.tipo}</span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-[#002333]/60">Total:</span>
                        <span className="font-semibold text-[#002333]">
                          {formatarNumero(canal.ticketsTotal)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-[#002333]/60">Abertos:</span>
                        <span className="text-[#159A9C] font-semibold">
                          {formatarNumero(canal.ticketsAbertos)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-[#002333]/60">Resolvidos:</span>
                        <span className="text-green-600 font-semibold">
                          {formatarNumero(canal.ticketsResolvidos)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-[#002333]/60">Tempo Resposta:</span>
                        <span className="font-semibold text-[#002333]">
                          {formatarTempo(canal.tempoMedioResposta)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ABA: SLA */}
          {activeTab === 'sla' && <SLATab />}

          {/* ABA: Distribuição */}
          {activeTab === 'distribuicao' && <DistribuicaoTab />}

          {/* ABA: Desempenho (Placeholder - futuro) */}
          {activeTab === 'desempenho' && (
            <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
              <div className="max-w-md mx-auto">
                <div className="h-16 w-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
                  <Target className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-[#002333] mb-2">Análise de Desempenho</h3>
                <p className="text-[#002333]/60 mb-6">
                  Rankings, comparativos e análise avançada de desempenho individual e por equipe.
                </p>
                <div className="bg-[#159A9C]/5 border border-[#159A9C]/20 rounded-lg p-4">
                  <p className="text-sm text-[#002333]">
                    🚧 <strong>Planejado</strong> - Esta aba será implementada em versões futuras com análises
                    comparativas.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardAnalyticsPage;
