import React, { useState } from 'react';
import { useI18n } from '../../contexts/I18nContext';
import { useTheme } from '../../contexts/ThemeContext';
import { KPICard } from '../../components/common/KPICard';
import { ResponsiveFilters } from '../../components/common/ResponsiveFilters';
import ColorPaletteSelector from '../../components/common/ColorPaletteSelector';
import ChatwootQuickAccess from '../../components/chatwoot/ChatwootQuickAccess';
import { useDashboard } from '../../hooks/useDashboard';
import {
  VendasChart,
  PropostasChart,
  FunnelChart,
  VendedoresChart,
  AtividadesChart
} from '../../components/charts/DashboardCharts';
import {
  AlertTriangle, Activity, Target, Users, FileText, DollarSign,
  TrendingUp, UserPlus, BarChart3, ChevronRight, Filter, ArrowUp, ArrowDown,
  CheckSquare, Clock, Eye, Edit, Plus, Calendar, Bell, RefreshCw
} from 'lucide-react';

const DashboardPage: React.FC = () => {
  const { t } = useI18n();
  const { currentPalette } = useTheme();

  const [filtros, setFiltros] = useState({
    periodo: "mensal",
    vendedor: "Todos",
    regiao: "Todas"
  });

  const [showPaletteSelector, setShowPaletteSelector] = useState(false);

  // Hook para dados reais do dashboard
  const { data, loading, error, refresh, updateFilters } = useDashboard({
    periodo: filtros.periodo,
    vendedorId: filtros.vendedor === 'Todos' ? undefined : filtros.vendedor,
    regiao: filtros.regiao === 'Todas' ? undefined : filtros.regiao,
    autoRefresh: true,
    refreshInterval: 15 * 60 * 1000 // 15 minutos
  });

  // Atualizar filtros quando o usuário muda
  const handleFiltroChange = (novosFiltros: typeof filtros) => {
    setFiltros(novosFiltros);
    updateFilters({
      periodo: novosFiltros.periodo,
      vendedorId: novosFiltros.vendedor === 'Todos' ? undefined : novosFiltros.vendedor,
      regiao: novosFiltros.regiao === 'Todas' ? undefined : novosFiltros.regiao
    });
  };

  // Loading state
  if (loading && !data.kpis) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-gray-200 h-32 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !data.kpis) {
    return (
      <div className="p-6">
        <div className="rounded-xl p-6 border border-red-200 bg-red-50">
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle className="w-6 h-6 text-red-500" />
            <h3 className="text-lg font-semibold text-red-800">
              Erro ao carregar dados do dashboard
            </h3>
          </div>
          <p className="text-red-700 mb-4">{error}</p>
          <div className="flex gap-3">
            <button
              onClick={refresh}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
            >
              Tentar novamente
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              Recarregar página
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header com indicador de dados reais */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: currentPalette.colors.text }}>
            📊 Dashboard - Dados Reais
          </h1>
          <div className="flex items-center gap-3 mt-2">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm" style={{ color: currentPalette.colors.textSecondary }}>
                Conectado ao banco de dados
              </span>
            </div>
            {data.metadata && (
              <span className="text-xs" style={{ color: currentPalette.colors.textSecondary }}>
                Atualizado: {new Date(data.metadata.atualizadoEm).toLocaleTimeString('pt-BR')}
              </span>
            )}
            <button
              onClick={refresh}
              disabled={loading}
              className="p-1 rounded-full hover:bg-gray-100 transition-colors"
              title="Atualizar dados"
            >
              <RefreshCw
                className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`}
                style={{ color: currentPalette.colors.textSecondary }}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <ResponsiveFilters filtros={filtros} setFiltros={handleFiltroChange} />

      {/* Alertas Inteligentes */}
      {data.alertas && data.alertas.length > 0 && (
        <div className="mb-6">
          <div className="space-y-2">
            {data.alertas.slice(0, 2).map((alerta) => (
              <div
                key={alerta.id}
                className={`
                  p-4 rounded-xl border-l-4 transition-all hover:shadow-md
                  ${alerta.severidade === 'critica' ? 'bg-red-50 border-red-500' : ''}
                  ${alerta.severidade === 'alta' ? 'bg-orange-50 border-orange-500' : ''}
                  ${alerta.severidade === 'media' ? 'bg-yellow-50 border-yellow-500' : ''}
                  ${alerta.severidade === 'baixa' ? 'bg-blue-50 border-blue-500' : ''}
                  ${alerta.tipo === 'conquista' ? 'bg-green-50 border-green-500' : ''}
                `}
                style={{ backgroundColor: currentPalette.colors.backgroundSecondary }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold" style={{ color: currentPalette.colors.text }}>
                      {alerta.titulo}
                    </h4>
                    <p className="text-sm" style={{ color: currentPalette.colors.textSecondary }}>
                      {alerta.descricao}
                    </p>
                  </div>
                  {alerta.acao && (
                    <button
                      onClick={() => window.location.href = alerta.acao!.url}
                      className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 transition-colors"
                    >
                      {alerta.acao.texto}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* KPIs Principais com Dados Reais */}
      {data.kpis && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
          {/* Faturamento Total */}
          <div
            className="rounded-xl p-6 border shadow-sm hover:shadow-md transition-all relative"
            style={{
              backgroundColor: currentPalette.colors.background,
              borderColor: currentPalette.colors.border
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <h3
                className="text-sm font-bold uppercase tracking-wide"
                style={{ color: currentPalette.colors.textSecondary }}
              >
                Faturamento Total
              </h3>
              <div
                className="p-2 rounded-full"
                style={{ backgroundColor: currentPalette.colors.neutralLight }}
              >
                <DollarSign
                  className="w-6 h-6"
                  style={{ color: currentPalette.colors.neutral }}
                />
              </div>
            </div>
            <div
              className="text-4xl font-black mb-2"
              style={{ color: currentPalette.colors.text }}
            >
              {data.kpis.faturamentoTotal.valor.toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL',
                minimumFractionDigits: 0
              })}
            </div>
            <div className="flex items-center gap-2">
              {data.kpis.faturamentoTotal.variacao >= 0 ? (
                <ArrowUp
                  className="w-5 h-5"
                  style={{ color: currentPalette.colors.success }}
                />
              ) : (
                <ArrowDown
                  className="w-5 h-5"
                  style={{ color: currentPalette.colors.error }}
                />
              )}
              <span
                className="text-sm font-bold"
                style={{
                  color: data.kpis.faturamentoTotal.variacao >= 0
                    ? currentPalette.colors.success
                    : currentPalette.colors.error
                }}
              >
                {data.kpis.faturamentoTotal.variacao >= 0 ? '+' : ''}{data.kpis.faturamentoTotal.variacao}% {data.kpis.faturamentoTotal.periodo}
              </span>
            </div>
            {/* Barra de progresso da meta */}
            <div className="mt-4">
              <div className="flex justify-between items-center mb-2">
                <span
                  className="text-xs font-medium"
                  style={{ color: currentPalette.colors.textSecondary }}
                >
                  Meta: {data.kpis.faturamentoTotal.meta.toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                    minimumFractionDigits: 0
                  })}
                </span>
                <span
                  className="text-xs font-bold"
                  style={{
                    color: (data.kpis.faturamentoTotal.valor / data.kpis.faturamentoTotal.meta) >= 1
                      ? currentPalette.colors.success
                      : currentPalette.colors.primary
                  }}
                >
                  {Math.round((data.kpis.faturamentoTotal.valor / data.kpis.faturamentoTotal.meta) * 100)}%
                </span>
              </div>
              <div
                className="w-full bg-gray-200 rounded-full h-3 overflow-hidden"
                style={{ backgroundColor: currentPalette.colors.neutralLight }}
              >
                <div
                  className="h-3 rounded-full transition-all duration-1000 ease-out"
                  style={{
                    width: `${Math.min((data.kpis.faturamentoTotal.valor / data.kpis.faturamentoTotal.meta) * 100, 100)}%`,
                    backgroundColor: (data.kpis.faturamentoTotal.valor / data.kpis.faturamentoTotal.meta) >= 1
                      ? currentPalette.colors.success
                      : currentPalette.colors.primary
                  }}
                />
              </div>
            </div>
            {/* Badge de meta superada */}
            {(data.kpis.faturamentoTotal.valor / data.kpis.faturamentoTotal.meta) >= 1 && (
              <div className="absolute top-2 right-2">
                <div className="bg-green-100 text-green-800 text-xs font-bold px-2 py-1 rounded-full">
                  🔥 Meta Superada!
                </div>
              </div>
            )}
          </div>

          {/* Ticket Médio */}
          <div
            className="rounded-xl p-6 border shadow-sm hover:shadow-md transition-all"
            style={{
              backgroundColor: currentPalette.colors.background,
              borderColor: currentPalette.colors.border
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <h3
                className="text-sm font-bold uppercase tracking-wide"
                style={{ color: currentPalette.colors.textSecondary }}
              >
                Ticket Médio
              </h3>
              <div
                className="p-2 rounded-full"
                style={{ backgroundColor: currentPalette.colors.primaryLight }}
              >
                <Target
                  className="w-6 h-6"
                  style={{ color: currentPalette.colors.primary }}
                />
              </div>
            </div>
            <div
              className="text-3xl font-black mb-2"
              style={{ color: currentPalette.colors.text }}
            >
              {data.kpis.ticketMedio.valor.toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL',
                minimumFractionDigits: 0
              })}
            </div>
            <div className="flex items-center gap-2">
              {data.kpis.ticketMedio.variacao >= 0 ? (
                <ArrowUp
                  className="w-5 h-5"
                  style={{ color: currentPalette.colors.primary }}
                />
              ) : (
                <ArrowDown
                  className="w-5 h-5"
                  style={{ color: currentPalette.colors.error }}
                />
              )}
              <span
                className="text-sm font-bold"
                style={{
                  color: data.kpis.ticketMedio.variacao >= 0
                    ? currentPalette.colors.primary
                    : currentPalette.colors.error
                }}
              >
                {data.kpis.ticketMedio.variacao >= 0 ? '+' : ''}{data.kpis.ticketMedio.variacao}% {data.kpis.ticketMedio.periodo}
              </span>
            </div>
          </div>

          {/* Vendas Fechadas */}
          <div
            className="rounded-xl p-6 border shadow-sm hover:shadow-md transition-all"
            style={{
              backgroundColor: currentPalette.colors.background,
              borderColor: currentPalette.colors.border
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <h3
                className="text-sm font-bold uppercase tracking-wide"
                style={{ color: currentPalette.colors.textSecondary }}
              >
                Vendas Fechadas
              </h3>
              <div
                className="p-2 rounded-full"
                style={{ backgroundColor: currentPalette.colors.neutralLight }}
              >
                <CheckSquare
                  className="w-6 h-6"
                  style={{ color: currentPalette.colors.neutral }}
                />
              </div>
            </div>
            <div
              className="text-3xl font-black mb-2"
              style={{ color: currentPalette.colors.text }}
            >
              {data.kpis.vendasFechadas.quantidade}
            </div>
            <div className="flex items-center gap-2">
              {data.kpis.vendasFechadas.variacao >= 0 ? (
                <ArrowUp
                  className="w-5 h-5"
                  style={{ color: currentPalette.colors.success }}
                />
              ) : (
                <ArrowDown
                  className="w-5 h-5"
                  style={{ color: currentPalette.colors.error }}
                />
              )}
              <span
                className="text-sm font-bold"
                style={{
                  color: data.kpis.vendasFechadas.variacao >= 0
                    ? currentPalette.colors.success
                    : currentPalette.colors.error
                }}
              >
                {data.kpis.vendasFechadas.variacao >= 0 ? '+' : ''}{data.kpis.vendasFechadas.variacao}% {data.kpis.vendasFechadas.periodo}
              </span>
            </div>
          </div>

          {/* Em Negociação */}
          <div
            className="rounded-xl p-6 border shadow-sm hover:shadow-md transition-all"
            style={{
              backgroundColor: currentPalette.colors.background,
              borderColor: currentPalette.colors.border
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <h3
                className="text-sm font-bold uppercase tracking-wide"
                style={{ color: currentPalette.colors.textSecondary }}
              >
                Em Negociação
              </h3>
              <div
                className="p-2 rounded-full"
                style={{ backgroundColor: currentPalette.colors.neutralLight }}
              >
                <Clock
                  className="w-6 h-6"
                  style={{ color: currentPalette.colors.neutral }}
                />
              </div>
            </div>
            <div
              className="text-3xl font-black mb-2"
              style={{ color: currentPalette.colors.text }}
            >
              {data.kpis.emNegociacao.valor.toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL',
                minimumFractionDigits: 0
              })}
            </div>
            <div className="flex items-center gap-2">
              <span
                className="text-sm font-bold"
                style={{ color: currentPalette.colors.primary }}
              >
                {data.kpis.emNegociacao.quantidade} propostas ativas
              </span>
            </div>
          </div>
        </div>
      )}

      {/* KPIs Secundários */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
        <KPICard
          title="Novos Clientes"
          value={data.kpis?.novosClientesMes.quantidade || 0}
          icon={<UserPlus size={24} />}
          trend={{
            value: data.kpis?.novosClientesMes.variacao || 0,
            isPositive: (data.kpis?.novosClientesMes.variacao || 0) >= 0,
            period: "vs mês anterior"
          }}
          currentPalette={currentPalette}
        />

        <KPICard
          title="Leads Qualificados"
          value={data.kpis?.leadsQualificados.quantidade || 0}
          icon={<Target size={24} />}
          trend={{
            value: data.kpis?.leadsQualificados.variacao || 0,
            isPositive: (data.kpis?.leadsQualificados.variacao || 0) >= 0,
            period: "vs mês anterior"
          }}
          currentPalette={currentPalette}
        />

        <KPICard
          title="Propostas Enviadas"
          value={data.kpis?.propostasEnviadas.valor || 0}
          prefix="R$"
          icon={<FileText size={24} />}
          trend={{
            value: data.kpis?.propostasEnviadas.variacao || 0,
            isPositive: (data.kpis?.propostasEnviadas.variacao || 0) >= 0,
            period: "vs mês anterior"
          }}
          currentPalette={currentPalette}
        />

        <KPICard
          title="Taxa de Sucesso"
          value={data.kpis?.taxaSucessoGeral.percentual || 0}
          suffix="%"
          icon={<BarChart3 size={24} />}
          trend={{
            value: data.kpis?.taxaSucessoGeral.variacao || 0,
            isPositive: (data.kpis?.taxaSucessoGeral.variacao || 0) >= 0,
            period: "vs mês anterior"
          }}
          currentPalette={currentPalette}
        />
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">
        <VendasChart />
        <PropostasChart />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">
        <FunnelChart />
        <VendedoresChart />
        <AtividadesChart />
      </div>

      {/* Ranking de Vendedores */}
      {data.vendedoresRanking && data.vendedoresRanking.length > 0 && (
        <div className="mb-8">
          <div
            className="rounded-xl p-6 border shadow-sm"
            style={{
              backgroundColor: currentPalette.colors.background,
              borderColor: currentPalette.colors.border
            }}
          >
            <h3 className="text-xl font-bold mb-4" style={{ color: currentPalette.colors.text }}>
              🏆 Ranking de Vendedores
            </h3>
            <div className="space-y-4">
              {data.vendedoresRanking.slice(0, 5).map((vendedor) => (
                <div
                  key={vendedor.id}
                  className="flex items-center justify-between p-4 rounded-lg"
                  style={{ backgroundColor: currentPalette.colors.backgroundSecondary }}
                >
                  <div className="flex items-center gap-4">
                    <div className="text-2xl font-bold" style={{ color: vendedor.cor }}>
                      #{vendedor.posicao}
                    </div>
                    <div>
                      <h4 className="font-semibold" style={{ color: currentPalette.colors.text }}>
                        {vendedor.nome}
                      </h4>
                      <p className="text-sm" style={{ color: currentPalette.colors.textSecondary }}>
                        {vendedor.vendas.toLocaleString('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                          minimumFractionDigits: 0
                        })} de {vendedor.meta.toLocaleString('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                          minimumFractionDigits: 0
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-sm font-semibold" style={{ color: currentPalette.colors.text }}>
                        {Math.round((vendedor.vendas / vendedor.meta) * 100)}%
                      </div>
                      <div className={`text-xs ${vendedor.variacao >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {vendedor.variacao >= 0 ? '+' : ''}{vendedor.variacao}%
                      </div>
                    </div>
                    {vendedor.badges.length > 0 && (
                      <div className="flex gap-1">
                        {vendedor.badges.slice(0, 2).map((badge, index) => (
                          <div
                            key={index}
                            className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                          >
                            {badge === 'top_performer' && '🔥'}
                            {badge === 'goal_crusher' && '🎯'}
                            {badge === 'rising_star' && '⭐'}
                            {badge === 'consistent' && '💪'}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Seletor de Paleta de Cores */}
      {showPaletteSelector && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Escolher Tema</h3>
              <button
                onClick={() => setShowPaletteSelector(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <ColorPaletteSelector />
          </div>
        </div>
      )}

      {/* Acesso Rápido Chatwoot */}
      <ChatwootQuickAccess />
    </div>
  );
};

export default DashboardPage;
