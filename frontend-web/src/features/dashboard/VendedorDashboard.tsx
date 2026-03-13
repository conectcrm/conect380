import React, { useState } from 'react';
import {
  AlertTriangle,
  ArrowUp,
  Bell,
  Calendar,
  Clock3,
  Mail,
  Phone,
  RefreshCw,
  Star,
  Target,
  TrendingUp,
  Trophy,
  Users,
} from 'lucide-react';
import {
  useVendedorDashboard,
  type VendedorDashboardPeriodo,
} from '../../hooks/useVendedorDashboard';

const vendedorPeriodOptions: Array<{ value: VendedorDashboardPeriodo; label: string }> = [
  { value: 'semanal', label: 'Semana atual' },
  { value: 'mensal', label: 'Mes atual' },
  { value: 'trimestral', label: 'Trimestre atual' },
  { value: 'semestral', label: 'Semestre atual' },
  { value: 'anual', label: 'Ano atual' },
];

const vendedorPeriodLabels: Record<VendedorDashboardPeriodo, string> = {
  semanal: 'Semana atual',
  mensal: 'Mes atual',
  trimestral: 'Trimestre atual',
  semestral: 'Semestre atual',
  anual: 'Ano atual',
};

const formatCurrency = (value: number): string =>
  value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  });

const formatDate = (value: string): string => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString('pt-BR');
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

const propostaStyleByTemperature = (
  temperatura: 'quente' | 'morno' | 'frio',
): {
  wrapper: string;
  badge: string;
  value: string;
} => {
  if (temperatura === 'quente') {
    return {
      wrapper: 'border-green-200 bg-green-50',
      badge: 'bg-green-600 text-white',
      value: 'text-green-700',
    };
  }
  if (temperatura === 'morno') {
    return {
      wrapper: 'border-yellow-200 bg-yellow-50',
      badge: 'bg-yellow-600 text-white',
      value: 'text-yellow-700',
    };
  }
  return {
    wrapper: 'border-gray-200 bg-gray-50',
    badge: 'bg-gray-600 text-white',
    value: 'text-gray-700',
  };
};

const alertaSeverityColor = (severity: 'baixa' | 'media' | 'alta' | 'critica'): string => {
  if (severity === 'critica') return 'bg-red-100 text-red-700';
  if (severity === 'alta') return 'bg-orange-100 text-orange-700';
  if (severity === 'media') return 'bg-yellow-100 text-yellow-700';
  return 'bg-blue-100 text-blue-700';
};

const VendedorDashboard: React.FC = () => {
  const [periodo, setPeriodo] = useState<VendedorDashboardPeriodo>('mensal');
  const { data, loading, error, refresh, insights, lastUpdatedAt } = useVendedorDashboard({
    autoRefresh: true,
    refreshInterval: 5 * 60 * 1000,
    periodo,
  });

  if (loading && !data.kpis.meta) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-xl shadow-lg text-center">
          <RefreshCw className="h-10 w-10 animate-spin text-[#159A9C] mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Carregando dashboard</h3>
          <p className="text-gray-600">Buscando indicadores do vendedor...</p>
        </div>
      </div>
    );
  }

  if (error && !data.kpis.meta) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-xl shadow-lg text-center max-w-md">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Falha ao carregar dashboard</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={refresh}
            className="px-4 py-2 bg-[#159A9C] text-white rounded-lg hover:bg-[#0F7B7D] transition-colors"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  const { kpis, propostas, agenda, leads, alertas } = data;
  const totalAtividadesHoje =
    (kpis.atividades?.hoje?.calls || 0) +
    (kpis.atividades?.hoje?.reunioes || 0) +
    (kpis.atividades?.hoje?.followups || 0);

  const totalAtividadesSemana =
    (kpis.atividades?.semana?.calls || 0) +
    (kpis.atividades?.semana?.reunioes || 0) +
    (kpis.atividades?.semana?.followups || 0);
  const hasActiveFilters = periodo !== 'mensal';
  const ultimaAtualizacaoLabel = lastUpdatedAt ? formatDateTime(lastUpdatedAt) : 'Atualizado agora';

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <section className="mb-6 rounded-[20px] border border-[#DCE7EB] bg-white p-5 shadow-[0_16px_30px_-24px_rgba(16,57,74,0.28)]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-[20px] font-semibold tracking-[-0.012em] text-[#18374B]">
                Dashboard Comercial
                <span className="ml-2 text-[14px] font-medium text-[#159A9C]">Vendedor</span>
              </h1>
              <p className="mt-1 text-[13px] text-[#617D89]">
                Pipeline, agenda e metas com foco na execucao comercial diaria.
              </p>
              <p className="mt-1 text-[12px] text-[#7A929E]">
                Ultima sincronizacao: {ultimaAtualizacaoLabel} (auto refresh a cada 5 min)
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <label htmlFor="dashboard-vendedor-periodo" className="text-[13px] font-medium text-[#567583]">
                Periodo
              </label>
              <select
                id="dashboard-vendedor-periodo"
                value={periodo}
                onChange={(event) => setPeriodo(event.target.value as VendedorDashboardPeriodo)}
                className="rounded-[10px] border border-[#D5E3E8] bg-white px-3 py-2 text-[13px] text-[#244556] focus:border-[#159A9C] focus:outline-none"
              >
                {vendedorPeriodOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={() => setPeriodo('mensal')}
                disabled={!hasActiveFilters}
                className="inline-flex items-center gap-2 rounded-[10px] border border-[#D5E3E8] px-3 py-2 text-[13px] font-semibold text-[#26495C] hover:bg-[#F3F9F8] disabled:cursor-not-allowed disabled:opacity-50"
              >
                Limpar filtros
              </button>

              <button
                type="button"
                onClick={refresh}
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-[10px] border border-[#D5E3E8] px-3 py-2 text-[13px] font-semibold text-[#26495C] hover:bg-[#F3F9F8] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
                Atualizar
              </button>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="flex items-center justify-between rounded-[12px] border border-[#DCE7EB] bg-[#FBFDFD] px-3 py-2">
              <div>
                <p className="text-[11px] uppercase tracking-wide text-[#7A929E]">Ranking</p>
                <p className="text-[16px] font-semibold text-[#18374B]">
                  #{kpis.ranking?.posicao || 0} de {kpis.ranking?.total || 0}
                </p>
              </div>
              <Trophy className="h-5 w-5 text-[#159A9C]" />
            </div>
            <div className="flex items-center justify-between rounded-[12px] border border-[#DCE7EB] bg-[#FBFDFD] px-3 py-2">
              <div>
                <p className="text-[11px] uppercase tracking-wide text-[#7A929E]">Meta concluida</p>
                <p className="text-[16px] font-semibold text-[#18374B]">{kpis.meta?.percentual || 0}%</p>
              </div>
              <Target className="h-5 w-5 text-[#159A9C]" />
            </div>
            <div className="flex items-center justify-between rounded-[12px] border border-[#DCE7EB] bg-[#FBFDFD] px-3 py-2">
              <div>
                <p className="text-[11px] uppercase tracking-wide text-[#7A929E]">Periodo ativo</p>
                <p className="text-[16px] font-semibold text-[#18374B]">
                  {vendedorPeriodLabels[periodo]}
                </p>
              </div>
              <Calendar className="h-5 w-5 text-[#159A9C]" />
            </div>
          </div>

          <div className="mt-4 h-2 w-full rounded-full bg-[#DEEFE7]">
            <div
              className="bg-[#159A9C] h-2 rounded-full transition-all"
              style={{ width: `${Math.min(100, kpis.meta?.percentual || 0)}%` }}
            />
          </div>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wide text-gray-600">Meta atual</h3>
                <div className="text-2xl font-bold text-gray-900 mt-1">
                  {formatCurrency(kpis.meta?.atual || 0)}
                </div>
                <div className="text-sm text-gray-500">de {formatCurrency(kpis.meta?.mensal || 0)}</div>
              </div>
              <div className="p-3 bg-[#159A9C]/10 rounded-lg">
                <Target className="h-8 w-8 text-[#159A9C]" />
              </div>
            </div>
            <div className="flex items-center text-sm text-green-600">
              <ArrowUp className="w-4 h-4 mr-1" />
              <span>
                Falta {formatCurrency(Math.max(0, (kpis.meta?.mensal || 0) - (kpis.meta?.atual || 0)))}
              </span>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wide text-gray-600">Pipeline</h3>
                <div className="text-2xl font-bold text-gray-900 mt-1">
                  {formatCurrency(kpis.pipeline?.valor || 0)}
                </div>
                <div className="text-sm text-gray-500">
                  {kpis.pipeline?.quantidade || 0} propostas ativas
                </div>
              </div>
              <div className="p-3 bg-[#159A9C]/10 rounded-lg">
                <TrendingUp className="h-8 w-8 text-[#159A9C]" />
              </div>
            </div>
            <div className="text-sm text-[#159A9C]">{kpis.pipeline?.probabilidade || 0}% de conversao</div>
          </div>

          <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wide text-gray-600">Ranking</h3>
                <div className="text-2xl font-bold text-gray-900 mt-1">#{kpis.ranking?.posicao || 0}</div>
                <div className="text-sm text-gray-500">{kpis.ranking?.pontos || 0} pontos</div>
              </div>
              <div className="p-3 bg-[#159A9C]/10 rounded-lg">
                <Star className="h-8 w-8 text-[#159A9C]" />
              </div>
            </div>
            <div className="text-sm text-[#159A9C]">{kpis.ranking?.nivel || 'Vendedor'}</div>
          </div>

          <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wide text-gray-600">Atividades hoje</h3>
                <div className="text-2xl font-bold text-gray-900 mt-1">{totalAtividadesHoje}</div>
                <div className="text-sm text-gray-500">acoes registradas</div>
              </div>
              <div className="p-3 bg-[#159A9C]/10 rounded-lg">
                <Calendar className="h-8 w-8 text-[#159A9C]" />
              </div>
            </div>
            <div className="space-y-1 text-xs text-gray-600">
              <div className="flex justify-between">
                <span>Calls</span>
                <span className="font-medium text-gray-800">{kpis.atividades?.hoje?.calls || 0}</span>
              </div>
              <div className="flex justify-between">
                <span>Reunioes</span>
                <span className="font-medium text-gray-800">{kpis.atividades?.hoje?.reunioes || 0}</span>
              </div>
              <div className="flex justify-between">
                <span>Follow-ups</span>
                <span className="font-medium text-gray-800">{kpis.atividades?.hoje?.followups || 0}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm mb-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Propostas em negociacao</h3>
            <span className="text-sm text-gray-500">{propostas.length} propostas ativas</span>
          </div>

          {propostas.length === 0 ? (
            <p className="text-sm text-gray-600">Nenhuma proposta ativa no momento.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {propostas.map((proposta) => {
                const styles = propostaStyleByTemperature(proposta.temperatura);
                return (
                  <div key={proposta.id} className={`p-4 border rounded-lg ${styles.wrapper}`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-xs font-medium px-2 py-1 rounded ${styles.badge}`}>
                        {proposta.temperatura.toUpperCase()}
                      </span>
                      <span className={`text-sm font-bold ${styles.value}`}>
                        {formatCurrency(proposta.valor)}
                      </span>
                    </div>
                    <h4 className="font-medium text-gray-900">{proposta.cliente}</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      Prazo {formatDate(proposta.prazo)} ({proposta.diasAteVencimento}d)
                    </p>
                    <div className="flex items-center justify-between mt-3">
                      <span className="text-xs text-gray-600">Prob. {proposta.probabilidade}%</span>
                      <span className="text-xs font-medium text-[#159A9C]">{proposta.proximaAcao}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Agenda comercial</h3>
              <span className="text-sm text-gray-500">{agenda.length} eventos</span>
            </div>

            {agenda.length === 0 ? (
              <p className="text-sm text-gray-600">Sem compromissos cadastrados para os proximos dias.</p>
            ) : (
              <div className="space-y-3">
                {agenda.map((evento) => (
                  <div key={evento.id} className="flex items-center p-3 bg-gray-50 rounded-lg border-l-4 border-[#159A9C]">
                    <div className="p-2 bg-[#159A9C]/10 rounded-full mr-3">
                      {evento.tipo === 'call' && <Phone className="w-4 h-4 text-[#159A9C]" />}
                      {evento.tipo === 'reuniao' && <Users className="w-4 h-4 text-[#159A9C]" />}
                      {evento.tipo === 'email' && <Mail className="w-4 h-4 text-[#159A9C]" />}
                      {evento.tipo !== 'call' && evento.tipo !== 'reuniao' && evento.tipo !== 'email' && (
                        <Clock3 className="w-4 h-4 text-[#159A9C]" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{evento.titulo}</p>
                      <p className="text-sm text-gray-600">
                        {evento.horario} • {evento.duracao} min
                      </p>
                    </div>
                    <span className="text-xs text-[#159A9C] font-medium uppercase">{evento.prioridade}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Leads para atuar</h3>
              <span className="text-sm text-gray-500">{leads.length} leads</span>
            </div>

            {leads.length === 0 ? (
              <p className="text-sm text-gray-600">Nenhum lead pendente para este vendedor.</p>
            ) : (
              <div className="space-y-3">
                {leads.map((lead) => (
                  <div
                    key={lead.id}
                    className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    <div>
                      <p className="font-medium text-gray-900">{lead.nome}</p>
                      <p className="text-sm text-gray-600">
                        {lead.empresa} • score {lead.score}
                      </p>
                    </div>
                    <span className="text-xs bg-[#159A9C] text-white px-3 py-1 rounded">
                      {lead.proximaAcao}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Bell className="h-5 w-5 text-[#159A9C]" />
              <h3 className="text-lg font-semibold text-gray-900">Alertas inteligentes</h3>
            </div>
            {alertas.length === 0 ? (
              <p className="text-sm text-gray-600">Sem alertas ativos para este periodo.</p>
            ) : (
              <div className="space-y-3">
                {alertas.slice(0, 5).map((alerta) => (
                  <div key={alerta.id} className="p-3 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-medium text-gray-900">{alerta.titulo}</p>
                      <span className={`text-xs px-2 py-1 rounded ${alertaSeverityColor(alerta.severidade)}`}>
                        {alerta.severidade}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">{alerta.descricao}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance da semana</h3>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Atividades na semana</p>
                <p className="text-2xl font-bold text-[#002333]">{totalAtividadesSemana}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Taxa de conversao</p>
                <p className="text-2xl font-bold text-[#002333]">
                  {kpis.performance?.taxaConversao?.toFixed(1) || '0.0'}%
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Nota geral</p>
                <p className="text-3xl font-bold text-[#002333]">{kpis.performance?.nota || 0}</p>
              </div>
              <div className="flex items-center gap-1 text-[#159A9C]">
                {Array.from({ length: 5 }).map((_, index) => (
                  <Star
                    key={index}
                    className={`w-5 h-5 ${
                      index < (kpis.performance?.estrelas || 0) ? 'fill-current' : 'opacity-30'
                    }`}
                  />
                ))}
              </div>
            </div>

            <p className="text-xs text-gray-500 mt-3">
              Status da meta: {String((insights as any)?.statusMeta || 'sem dados')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VendedorDashboard;
