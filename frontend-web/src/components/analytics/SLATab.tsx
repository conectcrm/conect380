/**
 * Aba de Métricas SLA
 * 
 * Componente extraído de DashboardSLAPage.tsx para consolidação
 * em DashboardAnalyticsPage com sistema de abas.
 * 
 * @author ConectCRM
 * @date 09/12/2025
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  TrendingUp,
  Clock,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Filter,
  CheckCircle,
} from 'lucide-react';
import slaService, { SlaMetricas, SlaEventLog, SlaMetricasFilterDto } from '../../services/slaService';
import { format, subDays } from 'date-fns';

const SLATab: React.FC = () => {
  const [metricas, setMetricas] = useState<SlaMetricas | null>(null);
  const [violacoes, setViolacoes] = useState<SlaEventLog[]>([]);
  const [alertas, setAlertas] = useState<SlaEventLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [filtros, setFiltros] = useState<SlaMetricasFilterDto>({
    dataInicio: format(subDays(new Date(), 7), 'yyyy-MM-dd'),
    dataFim: format(new Date(), 'yyyy-MM-dd'),
  });

  // Carregar dados
  const carregarDados = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [metricasData, violacoesData, alertasData] = await Promise.all([
        slaService.buscarMetricas(filtros),
        slaService.buscarViolacoes(),
        slaService.buscarAlertas(),
      ]);

      setMetricas(metricasData);
      setViolacoes(violacoesData);
      setAlertas(alertasData);
    } catch (err: unknown) {
      console.error('Erro ao carregar dados SLA:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  }, [filtros]);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  // Auto-refresh a cada 30 segundos
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      carregarDados();
    }, 30000);

    return () => clearInterval(interval);
  }, [autoRefresh, carregarDados]);

  // Formatar minutos para horas/minutos
  const formatarTempo = (minutos: number): string => {
    if (minutos < 60) return `${minutos}m`;
    const horas = Math.floor(minutos / 60);
    const mins = minutos % 60;
    return mins > 0 ? `${horas}h ${mins}m` : `${horas}h`;
  };

  // Badge de status
  const badgeStatus = (status: string) => {
    const colors = {
      cumprido: 'bg-green-100 text-green-800',
      em_risco: 'bg-yellow-100 text-yellow-800',
      violado: 'bg-red-100 text-red-800',
    };
    const labels = {
      cumprido: 'Cumprido',
      em_risco: 'Em Risco',
      violado: 'Violado',
    };
    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[status as keyof typeof colors]}`}
      >
        {labels[status as keyof typeof labels] || status}
      </span>
    );
  };

  return (
    <div>
      {/* Filtros e Controles */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-[#9333EA]" />
            <h3 className="text-lg font-semibold text-[#002333]">Filtros SLA</h3>
          </div>
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
              onClick={carregarDados}
              className="px-4 py-2 bg-white text-[#002333] border border-[#B4BEC9] rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
            >
              <RefreshCw className="h-4 w-4 inline mr-2" />
              Atualizar
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-[#002333] mb-1">Data Início</label>
            <input
              type="date"
              value={filtros.dataInicio || ''}
              onChange={(e) => setFiltros({ ...filtros, dataInicio: e.target.value })}
              className="w-full px-4 py-2 border border-[#B4BEC9] rounded-lg focus:ring-2 focus:ring-[#9333EA] focus:border-transparent text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#002333] mb-1">Data Fim</label>
            <input
              type="date"
              value={filtros.dataFim || ''}
              onChange={(e) => setFiltros({ ...filtros, dataFim: e.target.value })}
              className="w-full px-4 py-2 border border-[#B4BEC9] rounded-lg focus:ring-2 focus:ring-[#9333EA] focus:border-transparent text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#002333] mb-1">Prioridade</label>
            <select
              value={filtros.prioridade || ''}
              onChange={(e) => setFiltros({ ...filtros, prioridade: e.target.value as any })}
              className="w-full px-4 py-2 border border-[#B4BEC9] rounded-lg focus:ring-2 focus:ring-[#9333EA] focus:border-transparent text-sm"
            >
              <option value="">Todas</option>
              <option value="baixa">Baixa</option>
              <option value="normal">Normal</option>
              <option value="alta">Alta</option>
              <option value="urgente">Urgente</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#002333] mb-1">Canal</label>
            <select
              value={filtros.canal || ''}
              onChange={(e) => setFiltros({ ...filtros, canal: e.target.value })}
              className="w-full px-4 py-2 border border-[#B4BEC9] rounded-lg focus:ring-2 focus:ring-[#9333EA] focus:border-transparent text-sm"
            >
              <option value="">Todos</option>
              <option value="whatsapp">WhatsApp</option>
              <option value="email">Email</option>
              <option value="chat">Chat</option>
              <option value="telefone">Telefone</option>
            </select>
          </div>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#9333EA] mx-auto"></div>
          <p className="mt-4 text-[#002333]/70">Carregando métricas SLA...</p>
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
      {!loading && !error && metricas && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            {/* Taxa de Cumprimento */}
            <div className="p-5 rounded-2xl border border-[#DEEFE7] shadow-sm text-[#002333] bg-[#FFFFFF]">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#002333]/60">
                    Taxa de Cumprimento
                  </p>
                  <p className="mt-2 text-3xl font-bold text-[#002333]">
                    {metricas?.taxaCumprimento?.toFixed(1) ?? '0.0'}%
                  </p>
                  <p className="mt-3 text-sm text-[#002333]/70">
                    {metricas?.ticketsCumpridos ?? 0} de {metricas?.totalTickets ?? 0} tickets
                  </p>
                </div>
                <div className="h-12 w-12 rounded-2xl bg-green-500/10 flex items-center justify-center shadow-sm">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </div>

            {/* Tickets em Risco */}
            <div className="p-5 rounded-2xl border border-[#DEEFE7] shadow-sm text-[#002333] bg-[#FFFFFF]">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#002333]/60">
                    Tickets em Risco
                  </p>
                  <p className="mt-2 text-3xl font-bold text-[#002333]">
                    {metricas?.ticketsEmRisco ?? 0}
                  </p>
                  <p className="mt-3 text-sm text-[#002333]/70">
                    {(metricas?.totalTickets ?? 0) > 0
                      ? (((metricas?.ticketsEmRisco ?? 0) / (metricas?.totalTickets ?? 1)) * 100).toFixed(1)
                      : '0.0'}
                    % do total
                  </p>
                </div>
                <div className="h-12 w-12 rounded-2xl bg-yellow-500/10 flex items-center justify-center shadow-sm">
                  <Clock className="h-6 w-6 text-yellow-600" />
                </div>
              </div>
            </div>

            {/* Tickets Violados */}
            <div className="p-5 rounded-2xl border border-[#DEEFE7] shadow-sm text-[#002333] bg-[#FFFFFF]">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#002333]/60">
                    Tickets Violados
                  </p>
                  <p className="mt-2 text-3xl font-bold text-[#002333]">
                    {metricas?.ticketsViolados ?? 0}
                  </p>
                  <p className="mt-3 text-sm text-[#002333]/70">
                    {(metricas?.totalTickets ?? 0) > 0
                      ? (((metricas?.ticketsViolados ?? 0) / (metricas?.totalTickets ?? 1)) * 100).toFixed(1)
                      : '0.0'}
                    % do total
                  </p>
                </div>
                <div className="h-12 w-12 rounded-2xl bg-red-500/10 flex items-center justify-center shadow-sm">
                  <XCircle className="h-6 w-6 text-red-600" />
                </div>
              </div>
            </div>

            {/* Tempo Médio de Resposta */}
            <div className="p-5 rounded-2xl border border-[#DEEFE7] shadow-sm text-[#002333] bg-[#FFFFFF]">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#002333]/60">
                    Tempo Médio Resposta
                  </p>
                  <p className="mt-2 text-3xl font-bold text-[#002333]">
                    {formatarTempo(metricas?.tempoMedioRespostaMinutos ?? 0)}
                  </p>
                  <p className="mt-3 text-sm text-[#002333]/70">
                    Média de {metricas?.totalTickets ?? 0} tickets
                  </p>
                </div>
                <div className="h-12 w-12 rounded-2xl bg-[#9333EA]/10 flex items-center justify-center shadow-sm">
                  <CheckCircle className="h-6 w-6 text-[#9333EA]" />
                </div>
              </div>
            </div>
          </div>

          {/* Distribuição por Prioridade */}
          {metricas.distribuicaoPorPrioridade && metricas.distribuicaoPorPrioridade.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
              <h3 className="text-lg font-semibold text-[#002333] mb-4">Distribuição por Prioridade</h3>
              <div className="space-y-4">
                {metricas.distribuicaoPorPrioridade.map((item) => {
                  const total = item.total || 1;
                  const percentCumpridos = (item.cumpridos / total) * 100;
                  const percentEmRisco = (item.emRisco / total) * 100;
                  const percentViolados = (item.violados / total) * 100;

                  return (
                    <div key={item.prioridade}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-[#002333] capitalize">
                          {item.prioridade}
                        </span>
                        <span className="text-sm text-[#002333]/70">{item.total} tickets</span>
                      </div>
                      <div className="flex h-4 rounded-full overflow-hidden">
                        <div
                          className="bg-green-500"
                          style={{ width: `${percentCumpridos}%` }}
                          title={`${item.cumpridos} cumpridos`}
                        />
                        <div
                          className="bg-yellow-500"
                          style={{ width: `${percentEmRisco}%` }}
                          title={`${item.emRisco} em risco`}
                        />
                        <div
                          className="bg-red-500"
                          style={{ width: `${percentViolados}%` }}
                          title={`${item.violados} violados`}
                        />
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-xs text-[#002333]/70">
                        <span className="flex items-center gap-1">
                          <div className="w-3 h-3 rounded-full bg-green-500"></div>
                          {item.cumpridos} cumpridos
                        </span>
                        <span className="flex items-center gap-1">
                          <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                          {item.emRisco} em risco
                        </span>
                        <span className="flex items-center gap-1">
                          <div className="w-3 h-3 rounded-full bg-red-500"></div>
                          {item.violados} violados
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Violações Recentes */}
          {violacoes.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
              <h3 className="text-lg font-semibold text-[#002333] mb-4 flex items-center">
                <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
                Violações Recentes ({violacoes.length})
              </h3>
              <div className="space-y-3">
                {violacoes.slice(0, 5).map((violacao) => (
                  <div
                    key={violacao.id}
                    className="border border-red-200 rounded-lg p-4 bg-red-50/50"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-[#002333]">
                          Ticket #{violacao.ticketId}
                        </p>
                        <p className="text-sm text-[#002333]/70 mt-1">
                          Tempo resposta: {formatarTempo(violacao.tempoRespostaMinutos || 0)}
                        </p>
                      </div>
                      {badgeStatus(violacao.status)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Alertas */}
          {alertas.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-[#002333] mb-4 flex items-center">
                <Clock className="h-5 w-5 text-yellow-600 mr-2" />
                Alertas ({alertas.length})
              </h3>
              <div className="space-y-3">
                {alertas.slice(0, 5).map((alerta) => (
                  <div
                    key={alerta.id}
                    className="border border-yellow-200 rounded-lg p-4 bg-yellow-50/50"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-[#002333]">
                          Ticket #{alerta.ticketId}
                        </p>
                        <p className="text-sm text-[#002333]/70 mt-1">
                          Tempo resposta: {formatarTempo(alerta.tempoRespostaMinutos || 0)}
                        </p>
                      </div>
                      {badgeStatus(alerta.status)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default SLATab;
