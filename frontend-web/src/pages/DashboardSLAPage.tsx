import React, { useState, useEffect, useCallback } from 'react';
import { 
  TrendingUp, Clock, AlertTriangle, CheckCircle, 
  XCircle, RefreshCw, Filter, BarChart3
} from 'lucide-react';
import { BackToNucleus } from '../components/navigation/BackToNucleus';
import slaService, { SlaMetricas, SlaEventLog, SlaMetricasFilterDto } from '../services/slaService';
import { format, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const DashboardSLAPage: React.FC = () => {
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
      console.error('Erro ao carregar dados do dashboard SLA:', err);
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
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[status as keyof typeof colors]}`}>
        {labels[status as keyof typeof labels] || status}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header com BackToNucleus */}
      <div className="bg-white border-b px-6 py-4">
        <BackToNucleus 
          nucleusName="Atendimento" 
          nucleusPath="/nuclei/atendimento" 
        />
      </div>

      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header da página */}
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-[#002333] flex items-center">
                  <BarChart3 className="h-8 w-8 mr-3 text-[#159A9C]" />
                  Dashboard SLA
                </h1>
                <p className="text-[#002333]/70 mt-2">
                  Acompanhamento de métricas e violações em tempo real
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setAutoRefresh(!autoRefresh)}
                  className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 text-sm font-medium ${
                    autoRefresh 
                      ? 'bg-[#159A9C] text-white hover:bg-[#0F7B7D]'
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
          </div>

          {/* Filtros */}
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Filter className="h-5 w-5 text-[#159A9C]" />
              <h3 className="text-lg font-semibold text-[#002333]">Filtros</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#002333] mb-1">
                  Data Início
                </label>
                <input
                  type="date"
                  value={filtros.dataInicio || ''}
                  onChange={(e) => setFiltros({ ...filtros, dataInicio: e.target.value })}
                  className="w-full px-4 py-2 border border-[#B4BEC9] rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#002333] mb-1">
                  Data Fim
                </label>
                <input
                  type="date"
                  value={filtros.dataFim || ''}
                  onChange={(e) => setFiltros({ ...filtros, dataFim: e.target.value })}
                  className="w-full px-4 py-2 border border-[#B4BEC9] rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#002333] mb-1">
                  Prioridade
                </label>
                <select
                  value={filtros.prioridade || ''}
                  onChange={(e) => setFiltros({ ...filtros, prioridade: e.target.value as any })}
                  className="w-full px-4 py-2 border border-[#B4BEC9] rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent text-sm"
                >
                  <option value="">Todas</option>
                  <option value="baixa">Baixa</option>
                  <option value="normal">Normal</option>
                  <option value="alta">Alta</option>
                  <option value="urgente">Urgente</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#002333] mb-1">
                  Canal
                </label>
                <select
                  value={filtros.canal || ''}
                  onChange={(e) => setFiltros({ ...filtros, canal: e.target.value })}
                  className="w-full px-4 py-2 border border-[#B4BEC9] rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent text-sm"
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

          {/* Estados: Loading, Error */}
          {loading && (
            <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#159A9C] mx-auto"></div>
              <p className="mt-4 text-[#002333]/70">Carregando métricas...</p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
              <div className="flex items-center">
                <AlertTriangle className="h-5 w-5 text-red-600 mr-3" />
                <p className="text-red-800">{error}</p>
              </div>
            </div>
          )}

          {!loading && !error && metricas && (
            <>
              {/* KPI Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
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
                          : '0.0'}% do total
                      </p>
                    </div>
                    <div className="h-12 w-12 rounded-2xl bg-yellow-500/10 flex items-center justify-center shadow-sm">
                      <Clock className="h-6 w-6 text-yellow-600" />
                    </div>
                  </div>
                </div>

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
                          : '0.0'}% do total
                      </p>
                    </div>
                    <div className="h-12 w-12 rounded-2xl bg-red-500/10 flex items-center justify-center shadow-sm">
                      <XCircle className="h-6 w-6 text-red-600" />
                    </div>
                  </div>
                </div>

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
                    <div className="h-12 w-12 rounded-2xl bg-[#159A9C]/10 flex items-center justify-center shadow-sm">
                      <CheckCircle className="h-6 w-6 text-[#159A9C]" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* Distribuição por Prioridade */}
                <div className="bg-white rounded-lg shadow-sm border p-6">
                  <h3 className="text-lg font-semibold text-[#002333] mb-4">
                    Distribuição por Prioridade
                  </h3>
                  <div className="space-y-4">
                    {(metricas?.distribuicaoPorPrioridade ?? []).map((item) => {
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
                            <span className="text-sm text-[#002333]/70">
                              {item.total} tickets
                            </span>
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

                {/* Distribuição por Canal */}
                <div className="bg-white rounded-lg shadow-sm border p-6">
                  <h3 className="text-lg font-semibold text-[#002333] mb-4">
                    Distribuição por Canal
                  </h3>
                  <div className="space-y-4">
                    {(metricas?.distribuicaoPorCanal ?? []).map((item) => {
                      const total = item.total || 1;
                      const percentCumpridos = (item.cumpridos / total) * 100;
                      const percentEmRisco = (item.emRisco / total) * 100;
                      const percentViolados = (item.violados / total) * 100;

                      return (
                        <div key={item.canal}>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-[#002333] capitalize">
                              {item.canal || 'Sem canal'}
                            </span>
                            <span className="text-sm text-[#002333]/70">
                              {item.total} tickets
                            </span>
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
              </div>

              {/* Alertas */}
              {alertas.length > 0 && (
                <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Clock className="h-5 w-5 text-yellow-600" />
                    <h3 className="text-lg font-semibold text-[#002333]">
                      Tickets em Risco ({alertas.length})
                    </h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-[#002333]/70 uppercase tracking-wider">
                            Ticket
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-[#002333]/70 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-[#002333]/70 uppercase tracking-wider">
                            Percentual
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-[#002333]/70 uppercase tracking-wider">
                            Data
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {alertas.slice(0, 10).map((alerta) => (
                          <tr key={alerta.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm text-[#002333]">
                              {alerta.ticketId.substring(0, 8)}
                            </td>
                            <td className="px-4 py-3 text-sm">
                              {badgeStatus(alerta.status)}
                            </td>
                            <td className="px-4 py-3 text-sm text-[#002333]">
                              {alerta.percentualUsado}%
                            </td>
                            <td className="px-4 py-3 text-sm text-[#002333]/70">
                              {format(new Date(alerta.createdAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Violações */}
              {violacoes.length > 0 && (
                <div className="bg-white rounded-lg shadow-sm border p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <XCircle className="h-5 w-5 text-red-600" />
                    <h3 className="text-lg font-semibold text-[#002333]">
                      Violações Recentes ({violacoes.length})
                    </h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-[#002333]/70 uppercase tracking-wider">
                            Ticket
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-[#002333]/70 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-[#002333]/70 uppercase tracking-wider">
                            Tempo Decorrido
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-[#002333]/70 uppercase tracking-wider">
                            Tempo Limite
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-[#002333]/70 uppercase tracking-wider">
                            Data
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {violacoes.slice(0, 15).map((violacao) => (
                          <tr key={violacao.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm text-[#002333]">
                              {violacao.ticketId.substring(0, 8)}
                            </td>
                            <td className="px-4 py-3 text-sm">
                              {badgeStatus(violacao.status)}
                            </td>
                            <td className="px-4 py-3 text-sm text-[#002333]">
                              {violacao.tempoResolucaoMinutos 
                                ? formatarTempo(violacao.tempoResolucaoMinutos)
                                : '-'}
                            </td>
                            <td className="px-4 py-3 text-sm text-[#002333]">
                              {violacao.tempoLimiteMinutos 
                                ? formatarTempo(violacao.tempoLimiteMinutos)
                                : '-'}
                            </td>
                            <td className="px-4 py-3 text-sm text-[#002333]/70">
                              {format(new Date(violacao.createdAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardSLAPage;
