import React, { useState } from 'react';
import { useI18n } from '../../contexts/I18nContext';
import { useTheme } from '../../contexts/ThemeContext';
import { KPICard } from '../../components/common/KPICard';
import { ResponsiveFilters } from '../../components/common/ResponsiveFilters';
import ColorPaletteSelector from '../../components/common/ColorPaletteSelector';
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
  TrendingUp, UserPlus, BarChart3, ChevronRight, Filter, ArrowUp,
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
        <div
          className="rounded-xl p-6 border border-red-200 bg-red-50"
        >
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

      {/* Área de Destaque - Valor de Vendas com Filtros Específicos */}
      <div className="mb-6">
        <div
          className="rounded-xl p-6 border shadow-sm"
          style={{
            background: `linear-gradient(to bottom right, ${currentPalette.colors.backgroundSecondary}, ${currentPalette.colors.neutralLight})`,
            borderColor: currentPalette.colors.border
          }}
        >
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
            <div>
              <h2
                className="text-3xl font-bold mb-2 flex items-center gap-3"
                style={{ color: currentPalette.colors.text }}
              >
                <TrendingUp
                  className="w-8 h-8"
                  style={{ color: currentPalette.colors.primary }}
                />
                {t('dashboard.salesHighlight')}
              </h2>
              <p
                className="text-sm"
                style={{ color: currentPalette.colors.textSecondary }}
              >
                Performance baseada em dados reais do sistema
              </p>
            </div>

            {/* Filtros Específicos para Vendas */}
            <div
              className="flex flex-wrap items-center gap-3 rounded-xl p-4 shadow-sm border"
              style={{
                backgroundColor: currentPalette.colors.background,
                borderColor: currentPalette.colors.border
              }}
            >
              <div className="flex items-center gap-2">
                <Filter
                  className="w-4 h-4"
                  style={{ color: currentPalette.colors.textSecondary }}
                />
                <span
                  className="text-sm font-medium"
                  style={{ color: currentPalette.colors.text }}
                >
                  {t('common.filters')}:
                </span>
              </div>

              <select
                value={filtros.periodo}
                onChange={(e) => handleFiltroChange({ ...filtros, periodo: e.target.value })}
                className="px-4 py-2 border rounded-lg text-sm bg-white transition-all"
                style={{
                  borderColor: currentPalette.colors.border,
                  color: currentPalette.colors.text
                }}
              >
                <option value="mensal">Mês Atual</option>
                <option value="trimestral">Trimestre</option>
                <option value="semestral">Semestre</option>
                <option value="anual">Ano</option>
              </select>

              <select
                value={filtros.vendedor}
                onChange={(e) => handleFiltroChange({ ...filtros, vendedor: e.target.value })}
                className="px-4 py-2 border rounded-lg text-sm bg-white transition-all"
                style={{
                  borderColor: currentPalette.colors.border,
                  color: currentPalette.colors.text
                }}
              >
                <option value="Todos">Todos Vendedores</option>
                {data.vendedoresRanking.map(vendedor => (
                  <option key={vendedor.id} value={vendedor.id}>
                    {vendedor.nome}
                  </option>
                ))}
              </select>

              <select
                value={filtros.regiao}
                onChange={(e) => handleFiltroChange({ ...filtros, regiao: e.target.value })}
                className="px-4 py-2 border rounded-lg text-sm bg-white transition-all"
                style={{
                  borderColor: currentPalette.colors.border,
                  color: currentPalette.colors.text
                }}
              >
                <option value="Todas">Todas Regiões</option>
                <option value="sudeste">Sudeste</option>
                <option value="sul">Sul</option>
                <option value="nordeste">Nordeste</option>
                <option value="norte">Norte</option>
                <option value="centro">Centro-Oeste</option>
              </select>
            </div>
          </div>

          {/* Métricas Principais de Vendas com Dados Reais */}
          {data.kpis && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
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
                  {(data.kpis.faturamentoTotal.valor / data.kpis.faturamentoTotal.meta) >= 1 && (
                    <div className="absolute top-2 right-2">
                      <div className="bg-green-100 text-green-800 text-xs font-bold px-2 py-1 rounded-full">
                        🔥 Meta Superada!
                      </div>
                    </div>
                  )}
                </div>
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
                <div
                  className="mt-3 text-xs"
                  style={{ color: currentPalette.colors.textSecondary }}
                >
                  Tendência consistente
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
                <div
                  className="mt-3 text-xs"
                  style={{ color: currentPalette.colors.textSecondary }}
                >
                  Performance excelente!
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
                <div
                  className="mt-3 text-xs"
                  style={{ color: currentPalette.colors.textSecondary }}
                >
                  Pipeline forte
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Seção de Filtros */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border" style={{ borderColor: currentPalette.colors.border }}>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              style={{ color: currentPalette.colors.textSecondary }}
            >
              <path
                d="M3 6h18M8 12h8M11 18h2"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span
              className="text-sm font-medium"
              style={{ color: currentPalette.colors.text }}
            >
              {t('common.filters')}:
            </span>
          </div>

          <select
            className="px-4 py-2 border rounded-lg text-sm bg-white transition-all"
            style={{
              borderColor: currentPalette.colors.border,
              color: currentPalette.colors.text
            }}
            onFocus={(e) => {
              e.target.style.borderColor = currentPalette.colors.primary;
              e.target.style.boxShadow = `0 0 0 2px ${currentPalette.colors.primaryLight}`;
            }}
            onBlur={(e) => {
              e.target.style.borderColor = currentPalette.colors.border;
              e.target.style.boxShadow = 'none';
            }}
          >
            <option value="mensal">{t('dashboard.currentMonth')}</option>
            <option value="trimestral">{t('dashboard.quarter')}</option>
            <option value="semestral">{t('dashboard.semester')}</option>
            <option value="anual">{t('dashboard.fullYear')}</option>
          </select>

          <select
            className="px-4 py-2 border rounded-lg text-sm bg-white transition-all"
            style={{
              borderColor: currentPalette.colors.border,
              color: currentPalette.colors.text
            }}
            onFocus={(e) => {
              e.target.style.borderColor = currentPalette.colors.primary;
              e.target.style.boxShadow = `0 0 0 2px ${currentPalette.colors.primaryLight}`;
            }}
            onBlur={(e) => {
              e.target.style.borderColor = currentPalette.colors.border;
              e.target.style.boxShadow = 'none';
            }}
          >
            <option value="todos">{t('dashboard.allSellers')}</option>
            <option value="carlos">Carlos Mendes</option>
            <option value="fernanda">Fernanda Lima</option>
            <option value="ricardo">Ricardo Torres</option>
            <option value="juliana">Juliana Costa</option>
          </select>

          <select
            className="px-4 py-2 border rounded-lg text-sm bg-white transition-all"
            style={{
              borderColor: currentPalette.colors.border,
              color: currentPalette.colors.text
            }}
            onFocus={(e) => {
              e.target.style.borderColor = currentPalette.colors.primary;
              e.target.style.boxShadow = `0 0 0 2px ${currentPalette.colors.primaryLight}`;
            }}
            onBlur={(e) => {
              e.target.style.borderColor = currentPalette.colors.border;
              e.target.style.boxShadow = 'none';
            }}
          >
            <option value="todas">{t('dashboard.allRegions')}</option>
            <option value="sudeste">{t('dashboard.southeastRegion')}</option>
            <option value="sul">{t('dashboard.southRegion')}</option>
            <option value="nordeste">{t('dashboard.northeastRegion')}</option>
            <option value="norte">{t('dashboard.northRegion')}</option>
            <option value="centro">{t('dashboard.centerwestRegion')}</option>
          </select>
        </div>
      </div>

      {/* Métricas Principais de Vendas */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
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
              {t('dashboard.totalRevenue')}
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
            R$ 487.650
          </div>
          <div className="flex items-center gap-2">
            <ArrowUp
              className="w-5 h-5"
              style={{ color: currentPalette.colors.success }}
            />
            <span
              className="text-sm font-bold"
              style={{ color: currentPalette.colors.success }}
            >
              +24% vs mês anterior
            </span>
          </div>
          <div
            className="mt-3 text-xs"
            style={{ color: currentPalette.colors.textSecondary }}
          >
            Meta: R$ 450.000 (108%)
          </div>
        </div>

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
              {t('dashboard.averageTicket')}
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
            R$ 23.420
          </div>
          <div className="flex items-center gap-2">
            <ArrowUp
              className="w-5 h-5"
              style={{ color: currentPalette.colors.primary }}
            />
            <span
              className="text-sm font-bold"
              style={{ color: currentPalette.colors.primary }}
            >
              +8.7% vs meta
            </span>
          </div>
          <div
            className="mt-3 text-xs"
            style={{ color: currentPalette.colors.textSecondary }}
          >
            Crescimento consistente
          </div>
        </div>

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
              {t('dashboard.closedSales')}
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
            34
          </div>
          <div className="flex items-center gap-2">
            <ArrowUp
              className="w-5 h-5"
              style={{ color: currentPalette.colors.success }}
            />
            <span
              className="text-sm font-bold"
              style={{ color: currentPalette.colors.success }}
            >
              +18 este mês
            </span>
          </div>
          <div
            className="mt-3 text-xs"
            style={{ color: currentPalette.colors.textSecondary }}
          >
            Melhor mês do ano!
          </div>
        </div>

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
              {t('dashboard.inNegotiation')}
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
            R$ 285.400
          </div>
          <div className="flex items-center gap-2">
            <span
              className="text-sm font-bold"
              style={{ color: currentPalette.colors.textSecondary }}
            >
              22 propostas ativas
            </span>
          </div>
          <div
            className="mt-3 text-xs"
            style={{ color: currentPalette.colors.textSecondary }}
          >
            Pipeline forte
          </div>
        </div>
      </div>

      {/* Barra de Progresso da Meta */}
      <div
        className="mt-6 rounded-lg p-4 border"
        style={{
          backgroundColor: currentPalette.colors.background,
          borderColor: currentPalette.colors.border
        }}
      >
        <div className="flex justify-between items-center mb-2">
          <span
            className="text-sm font-bold"
            style={{ color: currentPalette.colors.text }}
          >
            Meta Mensal (R$ 450.000)
          </span>
          <span
            className="text-lg font-black"
            style={{ color: currentPalette.colors.text }}
          >
            108%
          </span>
        </div>
        <div
          className="w-full rounded-full h-3"
          style={{ backgroundColor: currentPalette.colors.neutralLight }}
        >
          <div
            className="h-3 rounded-full transition-all duration-1000"
            style={{
              width: '100%',
              background: `linear-gradient(to right, ${currentPalette.colors.primary}, ${currentPalette.colors.primaryDark})`
            }}
          >
            <div
              className="h-3 rounded-full"
              style={{
                width: '8%',
                background: `linear-gradient(to right, ${currentPalette.colors.accent}, ${currentPalette.colors.primary})`
              }}
            ></div>
          </div>
        </div>
        <div
          className="text-xs mt-1 font-medium"
          style={{ color: currentPalette.colors.textSecondary }}
        >
          Meta superada! Parabéns à equipe!
        </div>
      </div>
    </div>
      </div >

  {/* KPIs Cards Reformulados - SEM DUPLICAÇÃO */ }
  < div className = "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8" >
        <KPICard
          title={t('dashboard.newClients')}
          value={dashboardData.kpis.totalClientes}
          icon={<UserPlus size={24} />}
          trend={{
            value: 12.5,
            isPositive: true,
            label: "vs. mês anterior"
          }}
          isLoading={loading}
          color="blue"
        />

        <KPICard
          title={t('dashboard.qualifiedLeads')}
          value={dashboardData.kpis.propostasAtivas}
          icon={<Target size={24} />}
          trend={{
            value: 8.3,
            isPositive: true,
            label: "vs. mês anterior"
          }}
          isLoading={loading}
          color="purple"
        />

        <KPICard
          title={t('dashboard.sentProposals')}
          value={`R$ ${dashboardData.kpis.receitaMensal.toLocaleString()}`}
          icon={<FileText size={24} />}
          trend={{
            value: 15.2,
            isPositive: true,
            label: "vs. mês anterior"
          }}
          isLoading={loading}
          color="orange"
        />

        <KPICard
          title={t('dashboard.successRate')}
          value={`${dashboardData.kpis.taxaConversao}%`}
          icon={<TrendingUp size={24} />}
          trend={{
            value: 2.1,
            isPositive: false,
            label: "vs. mês anterior"
          }}
          isLoading={loading}
          color="green"
        />
      </div >

  {/* Área de Gráficos Reais - Layout Responsivo */ }
  < div className = "grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8" >
    {/* Gráfico de Vendas vs Meta */ }
    < VendasChart />

    {/* Gráfico de Status das Propostas */ }
    < PropostasChart />
      </div >

  {/* Segunda linha de gráficos */ }
  < div className = "grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8" >
    {/* Funil de Vendas */ }
    < FunnelChart />

    {/* Performance dos Vendedores */ }
    < div className = "xl:col-span-2" >
      <VendedoresChart />
        </div >
      </div >

  {/* Gráfico de atividades */ }
  < div className = "mb-8" >
    <AtividadesChart />
      </div >
  {/* Seção de Análises e Status - Layout Responsivo */ }
  < div className = "grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mb-6" >
    {/* Status das Propostas - Gráfico Circular */ }
    < div className = "bg-white p-4 sm:p-6 rounded-lg shadow-sm" >
      <PropostasChart />
        </div >

  {/* Ações Rápidas Melhoradas */ }
  < div className = "bg-white p-4 sm:p-6 rounded-lg shadow-sm" >
          <h3 className="text-lg font-semibold mb-4">{t('dashboard.quickActions')}</h3>

          <div className="space-y-3">
            <button className="w-full flex items-center gap-3 p-3 text-left hover:bg-gray-50 rounded-lg transition-colors border border-gray-200 hover:border-gray-300">
              <div className="p-2 bg-gray-100 rounded-full">
                <Plus className="w-4 h-4 text-gray-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900">Nova Proposta</p>
                <p className="text-sm text-gray-500">Criar proposta para cliente</p>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </button>

            <button className="w-full flex items-center gap-3 p-3 text-left hover:bg-blue-50 rounded-lg transition-colors border border-blue-200 hover:border-blue-300">
              <div className="p-2 bg-blue-100 rounded-full">
                <Calendar className="w-4 h-4 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900">Agendar Reunião</p>
                <p className="text-sm text-gray-500">Marcar call com prospect</p>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </button>

            <button className="w-full flex items-center gap-3 p-3 text-left hover:bg-gray-50 rounded-lg transition-colors border border-gray-200 hover:border-gray-300">
              <div className="p-2 bg-gray-100 rounded-full">
                <Users className="w-4 h-4 text-gray-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900">Novo Lead</p>
                <p className="text-sm text-gray-500">Cadastrar novo prospect</p>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </button>

            <button className="w-full flex items-center gap-3 p-3 text-left hover:bg-gray-50 rounded-lg transition-colors border border-gray-200 hover:border-gray-300">
              <div className="p-2 bg-gray-100 rounded-full">
                <BarChart3 className="w-4 h-4 text-gray-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900">Relatório</p>
                <p className="text-sm text-gray-500">Gerar análise de vendas</p>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        </div >

  {/* Análise de Performance Compacta Melhorada */ }
  < div className = "bg-white p-4 sm:p-6 rounded-lg shadow-sm" >
    <h3 className="text-lg font-semibold mb-4">{t('dashboard.performance')}</h3>

{/* Métricas Principais */ }
<div className="grid grid-cols-2 gap-3 mb-4">
  <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-3 rounded-lg border border-gray-200">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-xs text-gray-600 font-medium">Ticket Médio</p>
        <p className="text-lg font-bold text-gray-700">R$ 18.750</p>
        <p className="text-xs text-blue-600">+12% vs mês anterior</p>
      </div>
      <TrendingUp className="w-6 h-6 text-gray-500" />
    </div>
  </div>

  <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-3 rounded-lg border border-blue-200">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-xs text-blue-600 font-medium">Ciclo Médio</p>
        <p className="text-lg font-bold text-blue-700">12 dias</p>
        <p className="text-xs text-blue-600">-3 dias vs meta</p>
      </div>
      <Clock className="w-6 h-6 text-blue-500" />
    </div>
  </div>
</div>

{/* Progresso por Etapa */ }
<div className="space-y-3">
  <h4 className="text-sm font-semibold text-gray-700">Progresso por Etapa</h4>
  {[
    { etapa: 'Prospecção', valor: 45, meta: 50, cor: 'bg-gray-500' },
    { etapa: 'Qualificação', valor: 32, meta: 40, cor: 'bg-gray-600' },
    { etapa: 'Proposta', valor: 28, meta: 30, cor: 'bg-blue-500' },
    { etapa: 'Fechamento', valor: 15, meta: 20, cor: 'bg-blue-600' }
  ].map((item, index) => (
    <div key={index} className="space-y-1">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${item.cor}`}></div>
          <span className="text-xs font-medium text-gray-700">{item.etapa}</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-xs font-medium text-gray-900">{item.valor}</span>
          <span className="text-xs text-gray-500">/{item.meta}</span>
        </div>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-1.5">
        <div
          className={`h-1.5 rounded-full ${item.cor} transition-all duration-500`}
          style={{ width: `${(item.valor / item.meta) * 100}%` }}
        ></div>
      </div>
    </div>
  ))}
</div>
        </div >
      </div >

  {/* Segunda linha de widgets */ }
  < div className = "grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6" >
    {/* Tabela de Propostas Recentes */ }
    < div className = "lg:col-span-2 xl:col-span-2 bg-white p-6 rounded-lg shadow-sm" >
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">{t('dashboard.recentProposals')}</h3>
            <button className="text-sm text-blue-600 hover:underline">Ver todas</button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left p-2">Cliente</th>
                  <th className="text-left p-2">Valor</th>
                  <th className="text-left p-2">Status</th>
                  <th className="text-left p-2">Data</th>
                  <th className="text-left p-2">Ações</th>
                </tr>
              </thead>
              <tbody>
                {dashboardData.ultimasPropostas.map((proposta, index) => (
                  <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="p-2 font-medium">{proposta.cliente}</td>
                    <td className="p-2">R$ {proposta.valor.toLocaleString()}</td>
                    <td className="p-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${proposta.status === 'Aprovada' ? 'bg-green-100 text-green-800' :
                          proposta.status === 'Negociação' ? 'bg-blue-100 text-blue-800' :
                            proposta.status === 'Pendente' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                        }`}>
                        {proposta.status}
                      </span>
                    </td>
                    <td className="p-2 text-gray-600">{new Date(proposta.data).toLocaleDateString('pt-BR')}</td>
                    <td className="p-2">
                      <div className="flex gap-2">
                        <button className="p-1 hover:bg-gray-200 rounded">
                          <Eye className="w-4 h-4 text-gray-600" />
                        </button>
                        <button className="p-1 hover:bg-gray-200 rounded">
                          <Edit className="w-4 h-4 text-gray-600" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div >

  {/* Ranking de Vendedores */ }
  < div className = "bg-white p-6 rounded-lg shadow-sm" >
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">{t('dashboard.topSellers')}</h3>
            <button className="text-sm text-blue-600 hover:underline">Ver ranking</button>
          </div>

          <div className="space-y-3">
            {[
              { nome: 'Carlos Mendes', vendas: 'R$ 245.800', posicao: 1, cor: 'text-gray-700', icone: '1' },
              { nome: 'Fernanda Lima', vendas: 'R$ 198.400', posicao: 2, cor: 'text-gray-600', icone: '2' },
              { nome: 'Ricardo Torres', vendas: 'R$ 156.700', posicao: 3, cor: 'text-blue-600', icone: '3' },
              { nome: 'Juliana Costa', vendas: 'R$ 134.200', posicao: 4, cor: 'text-blue-600', icone: '4' },
              { nome: 'Alexandre Silva', vendas: 'R$ 89.650', posicao: 5, cor: 'text-gray-600', icone: '5' }
            ].map((vendedor, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${index === 0 ? 'bg-gray-600' :
                      index === 1 ? 'bg-gray-500' :
                        index === 2 ? 'bg-blue-500' : 'bg-gray-400'
                    }`}>
                    {vendedor.icone}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{vendedor.nome}</p>
                    <p className="text-sm text-gray-600">{vendedor.vendas}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`font-bold ${vendedor.cor}`}>#{vendedor.posicao}</span>
                </div>
              </div>
            ))}
          </div>
        </div >
      </div >

  {/* Terceira linha - Alertas e Atividades */ }
  < div className = "grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6" >
    {/* Alertas e Notificações */ }
    < div className = "bg-white p-6 rounded-lg shadow-sm" >
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              {t('dashboard.alerts')}
            </h3>
            <button className="text-sm text-blue-600 hover:underline">Ver todos</button>
          </div>

          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 bg-gray-50 border-l-4 border-gray-400 rounded">
              <AlertTriangle className="w-4 h-4 text-gray-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-800">Proposta vencida</p>
                <p className="text-xs text-gray-600">Tech Solutions - Proposta venceu há 3 dias</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-slate-50 border-l-4 border-slate-400 rounded">
              <Clock className="w-4 h-4 text-slate-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-slate-800">Follow-up pendente</p>
                <p className="text-xs text-slate-600">Empresa ABC - Último contato há 5 dias</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-blue-50 border-l-4 border-blue-400 rounded">
              <Bell className="w-4 h-4 text-blue-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-800">Reunião agendada</p>
                <p className="text-xs text-blue-600">StartUp Growth - Hoje às 15:00</p>
              </div>
            </div>
          </div>
        </div >

  {/* Atividades Recentes */ }
  < div className = "bg-white p-6 rounded-lg shadow-sm" >
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Activity className="w-5 h-5 text-gray-600" />
              {t('dashboard.recentActivities')}
            </h3>
            <button className="text-sm text-blue-600 hover:underline">Ver todas</button>
          </div>

          <div className="space-y-4">
            {[
              {
                icon: <CheckSquare className="w-4 h-4 text-blue-600" />,
                titulo: "Proposta aprovada",
                descricao: "Empresa ABC aprovou proposta de R$ 25.000",
                tempo: "2 horas atrás",
                usuario: "João Silva"
              },
              {
                icon: <Plus className="w-4 h-4 text-gray-600" />,
                titulo: "Novo cliente cadastrado",
                descricao: "Digital Marketing Pro foi adicionado ao sistema",
                tempo: "4 horas atrás",
                usuario: "Maria Santos"
              },
              {
                icon: <Edit className="w-4 h-4 text-slate-600" />,
                titulo: "Proposta atualizada",
                descricao: "Valores da proposta para StartUp Growth foram ajustados",
                tempo: "6 horas atrás",
                usuario: "Pedro Costa"
              },
              {
                icon: <Calendar className="w-4 h-4 text-blue-500" />,
                titulo: "Reunião realizada",
                descricao: "Meeting com Tech Solutions - Apresentação do produto",
                tempo: "1 dia atrás",
                usuario: "Ana Oliveira"
              }
            ].map((atividade, index) => (
              <div key={index} className="flex items-start gap-3 pb-3 border-b border-gray-100 last:border-b-0">
                <div className="p-2 bg-gray-100 rounded-full">
                  {atividade.icon}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{atividade.titulo}</p>
                  <p className="text-xs text-gray-600">{atividade.descricao}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-gray-500">{atividade.tempo}</span>
                    <span className="text-xs text-gray-400">•</span>
                    <span className="text-xs text-gray-500">{atividade.usuario}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div >
      </div >

  {/* Modal de Seleção de Paleta */ }
{
  showPaletteSelector && (
    <ColorPaletteSelector
      showAsModal={true}
      onClose={() => setShowPaletteSelector(false)}
    />
  )
}
    </div >
  );
};

export default DashboardPage;


