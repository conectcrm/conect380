import React, { useState } from 'react';
import { useI18n } from '../../contexts/I18nContext';
import { useTheme } from '../../contexts/ThemeContext';
import { KPICard } from '../../components/common/KPICard';
import { ResponsiveFilters } from '../../components/common/ResponsiveFilters';
import ColorPaletteSelector from '../../components/common/ColorPaletteSelector';
import { BackToNucleus } from '../../components/navigation/BackToNucleus';
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

// CSS personalizado para animações premium
const animationStyles = `
  .animate-pulse-once {
    animation: pulse-once 2s ease-in-out;
  }
  
  .kpi-card-premium {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }
  
  .kpi-card-premium:hover {
    transform: translateY(-4px) scale(1.02);
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  }
  
  @keyframes pulse-once {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.8; }
  }
  
  .sparkline-bar {
    transition: all 0.3s ease;
  }
  
  .sparkline-bar:hover {
    opacity: 1 !important;
    transform: scaleY(1.1);
  }
  
  .progress-glow {
    position: relative;
    overflow: visible;
  }
  
  .progress-glow::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    border-radius: inherit;
    box-shadow: 0 0 20px rgba(59, 130, 246, 0.5);
    opacity: 0;
    transition: opacity 0.3s ease;
  }
  
  .progress-glow:hover::after {
    opacity: 1;
  }
`;

// Injetar estilos CSS na página
if (typeof document !== 'undefined') {
  const styleElement = document.createElement('style');
  styleElement.textContent = animationStyles;
  if (!document.head.querySelector('style[data-dashboard-animations]')) {
    styleElement.setAttribute('data-dashboard-animations', 'true');
    document.head.appendChild(styleElement);
  }
}

// Componente de mini gráfico sparkline para tendências
const MiniTrendChart: React.FC<{ data: number[]; isPositive?: boolean }> = ({ data, isPositive = true }) => {
  const maxValue = Math.max(...data);
  const minValue = Math.min(...data);
  const range = maxValue - minValue || 1;

  return (
    <div className="flex items-end gap-0.5 h-8 mt-2">
      {data.map((value, index) => {
        const normalizedHeight = ((value - minValue) / range) * 100;
        const height = Math.max(normalizedHeight, 10); // Altura mínima para visibilidade

        return (
          <div
            key={index}
            className={`sparkline-bar rounded-t-sm flex-1 ${isPositive
              ? 'bg-green-400 hover:bg-green-500'
              : 'bg-red-400 hover:bg-red-500'
              }`}
            style={{
              height: `${height}%`,
              minWidth: '3px',
              opacity: 0.7
            }}
            title={`Dia ${index + 1}: ${value.toLocaleString('pt-BR')}`}
          />
        );
      })}
    </div>
  );
};

// Função para gerar badges dinâmicos baseados na performance
const getPerformanceBadge = (percentage: number) => {
  if (percentage >= 110) return { icon: '🔥', text: 'Em Chamas!', color: 'red', bgColor: 'bg-red-100', textColor: 'text-red-800' };
  if (percentage >= 90) return { icon: '⚡', text: 'Quase Lá!', color: 'yellow', bgColor: 'bg-yellow-100', textColor: 'text-yellow-800' };
  if (percentage >= 70) return { icon: '💪', text: 'No Caminho', color: 'blue', bgColor: 'bg-blue-100', textColor: 'text-blue-800' };
  return { icon: '⚠️', text: 'Atenção', color: 'orange', bgColor: 'bg-orange-100', textColor: 'text-orange-800' };
};

// Função para cores inteligentes da barra de progresso
const getProgressColor = (percentage: number) => {
  if (percentage >= 100) return 'bg-gradient-to-r from-green-400 to-green-600';
  if (percentage >= 90) return 'bg-gradient-to-r from-blue-400 to-blue-600';
  if (percentage >= 70) return 'bg-gradient-to-r from-yellow-400 to-yellow-600';
  return 'bg-gradient-to-r from-red-400 to-red-600';
};

const DashboardPage: React.FC = () => {
  const { t } = useI18n();
  const { currentPalette } = useTheme();

  const [filtros, setFiltros] = useState({
    periodo: "mensal",
    vendedor: "Todos",
    regiao: "Todas"
  });



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
    <div className="min-h-screen bg-gray-50">
      <div className="p-6">
        {/* Header da Página */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <BarChart3 className="h-8 w-8 mr-3 text-blue-600" />
                Dashboard
              </h1>
              <p className="mt-2 text-gray-600">
                Visão geral dos indicadores e performance do seu negócio
              </p>
            </div>
            <div className="mt-4 sm:mt-0 flex flex-col sm:flex-row gap-3">
              <button
                onClick={refresh}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center space-x-2"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                <span>Atualizar</span>
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

        {/* Widgets de Atividades e Resumo do Dia */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Atividades Hoje */}
          <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Atividades Hoje</h3>
                <p className="text-gray-600">Tarefas e compromissos</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <Activity className="h-8 w-8 text-blue-600" />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Reuniões</span>
                <span className="font-bold text-blue-600">3</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Follow-ups</span>
                <span className="font-bold text-green-600">7</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Calls</span>
                <span className="font-bold text-orange-600">12</span>
              </div>
            </div>
          </div>

          {/* Ciclo de Vendas */}
          <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Ciclo Médio</h3>
                <p className="text-gray-600">Tempo para fechar</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <Clock className="h-8 w-8 text-green-600" />
              </div>
            </div>
            <div className="mt-4">
              <p className="text-2xl font-bold text-gray-900">28 dias</p>
              <p className="text-sm text-green-600 flex items-center">
                <ArrowDown className="w-4 h-4 mr-1" />
                -3 dias vs mês anterior
              </p>
            </div>
          </div>

          {/* Conversão do Funil */}
          <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Conversão</h3>
                <p className="text-gray-600">Lead → Venda</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <Target className="h-8 w-8 text-purple-600" />
              </div>
            </div>
            <div className="mt-4">
              <p className="text-2xl font-bold text-gray-900">18.5%</p>
              <p className="text-sm text-purple-600 flex items-center">
                <ArrowUp className="w-4 h-4 mr-1" />
                +2.3% vs mês anterior
              </p>
            </div>
          </div>

          {/* Alertas e Pendências */}
          <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Alertas</h3>
                <p className="text-gray-600">Requerem atenção</p>
              </div>
              <div className="p-3 bg-red-100 rounded-lg">
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Propostas vencendo</span>
                <span className="font-bold text-red-600">4</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Follow-ups atrasados</span>
                <span className="font-bold text-orange-600">2</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Contratos a renovar</span>
                <span className="font-bold text-yellow-600">6</span>
              </div>
            </div>
          </div>
        </div>

        {/* KPIs Principais com Dados Reais */}
        {data.kpis && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
            {/* Faturamento Total */}
            <div
              className="kpi-card-premium rounded-xl p-6 border shadow-sm hover:shadow-md transition-all relative"
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
              {/* Barra de progresso da meta aprimorada */}
              <div className="mt-4">
                {/* Cabeçalho da meta com badge */}
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
                  <div className="flex items-center gap-2">
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
                    {/* Badge de performance dinâmico */}
                    {(() => {
                      const percentage = Math.round((data.kpis.faturamentoTotal.valor / data.kpis.faturamentoTotal.meta) * 100);
                      const badge = getPerformanceBadge(percentage);
                      return (
                        <span className={`text-xs font-bold px-2 py-1 rounded-full ${badge.bgColor} ${badge.textColor}`}>
                          {badge.icon} {badge.text}
                        </span>
                      );
                    })()}
                  </div>
                </div>

                {/* Barra de progresso com cores inteligentes */}
                <div
                  className="w-full bg-gray-200 rounded-full h-4 overflow-hidden shadow-inner"
                  style={{ backgroundColor: currentPalette.colors.neutralLight }}
                >
                  <div
                    className={`h-4 rounded-full transition-all duration-1000 ease-out shadow-sm ${getProgressColor(Math.round((data.kpis.faturamentoTotal.valor / data.kpis.faturamentoTotal.meta) * 100))}`}
                    style={{
                      width: `${Math.min((data.kpis.faturamentoTotal.valor / data.kpis.faturamentoTotal.meta) * 100, 100)}%`
                    }}
                  />
                  {/* Indicador de meta superada */}
                  {(data.kpis.faturamentoTotal.valor / data.kpis.faturamentoTotal.meta) > 1 && (
                    <div className="absolute top-0 right-0 transform translate-x-2 -translate-y-1">
                      <div className="bg-yellow-400 text-yellow-900 text-xs px-2 py-1 rounded-full font-bold shadow-lg animate-bounce">
                        +{Math.round(((data.kpis.faturamentoTotal.valor / data.kpis.faturamentoTotal.meta) - 1) * 100)}%
                      </div>
                    </div>
                  )}
                </div>

                {/* Mini gráfico de tendência dos últimos 7 dias */}
                {data.kpis.faturamentoTotal.tendencia && (
                  <div className="mt-3">
                    <span className="text-xs font-medium" style={{ color: currentPalette.colors.textSecondary }}>
                      Últimos 7 dias:
                    </span>
                    <MiniTrendChart
                      data={data.kpis.faturamentoTotal.tendencia}
                      isPositive={data.kpis.faturamentoTotal.variacao >= 0}
                    />
                  </div>
                )}
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
              className="kpi-card-premium rounded-xl p-6 border shadow-sm hover:shadow-md transition-all"
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
              className="kpi-card-premium rounded-xl p-6 border shadow-sm hover:shadow-md transition-all"
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
              className="kpi-card-premium rounded-xl p-6 border shadow-sm hover:shadow-md transition-all"
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

        {/* Próximas Atividades e Resumo Rápido */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Próximas Atividades */}
          <div className="lg:col-span-2 bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Próximas Atividades</h3>
              <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                Ver todas
              </button>
            </div>
            <div className="space-y-4">
              <div className="flex items-center p-3 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                <div className="p-2 bg-blue-100 rounded-full mr-3">
                  <Calendar className="w-4 h-4 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">Reunião com Tech Solutions</p>
                  <p className="text-sm text-gray-600">Hoje, 14:30 - Apresentação da proposta</p>
                </div>
                <span className="text-sm font-medium text-blue-600">Em 2h</span>
              </div>

              <div className="flex items-center p-3 bg-green-50 rounded-lg border-l-4 border-green-500">
                <div className="p-2 bg-green-100 rounded-full mr-3">
                  <Users className="w-4 h-4 text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">Follow-up StartUp Growth</p>
                  <p className="text-sm text-gray-600">Hoje, 16:00 - Negociação de contrato</p>
                </div>
                <span className="text-sm font-medium text-green-600">Em 4h</span>
              </div>

              <div className="flex items-center p-3 bg-orange-50 rounded-lg border-l-4 border-orange-500">
                <div className="p-2 bg-orange-100 rounded-full mr-3">
                  <AlertTriangle className="w-4 h-4 text-orange-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">Proposta vencendo - Digital Pro</p>
                  <p className="text-sm text-gray-600">Amanhã - Prazo para resposta</p>
                </div>
                <span className="text-sm font-medium text-orange-600">24h</span>
              </div>
            </div>
          </div>

          {/* Performance da Semana */}
          <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Semanal</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Meta de Vendas</span>
                <div className="flex items-center">
                  <div className="w-20 bg-gray-200 rounded-full h-2 mr-2">
                    <div className="bg-blue-500 h-2 rounded-full" style={{ width: '75%' }}></div>
                  </div>
                  <span className="text-sm font-medium">75%</span>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Calls Realizadas</span>
                <div className="flex items-center">
                  <div className="w-20 bg-gray-200 rounded-full h-2 mr-2">
                    <div className="bg-green-500 h-2 rounded-full" style={{ width: '90%' }}></div>
                  </div>
                  <span className="text-sm font-medium">90%</span>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Follow-ups</span>
                <div className="flex items-center">
                  <div className="w-20 bg-gray-200 rounded-full h-2 mr-2">
                    <div className="bg-yellow-500 h-2 rounded-full" style={{ width: '60%' }}></div>
                  </div>
                  <span className="text-sm font-medium">60%</span>
                </div>
              </div>

              <div className="pt-4 border-t">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600 mb-1">8.5</div>
                  <div className="text-sm text-gray-600">Nota Semanal</div>
                  <div className="text-xs text-green-600 mt-1">🔥 Excelente!</div>
                </div>
              </div>
            </div>
          </div>
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

      </div>
    </div>
  );
};

export default DashboardPage;
