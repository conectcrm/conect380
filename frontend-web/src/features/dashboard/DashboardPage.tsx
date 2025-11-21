import React, { useMemo, useState } from 'react';
import { useI18n } from '../../contexts/I18nContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../hooks/useAuth';
import { KPICard } from '../../components/common/KPICard';
import { ResponsiveFilters, FilterOption } from '../../components/common/ResponsiveFilters';
import { useDashboard } from '../../hooks/useDashboard';
import {
  VendasChart,
  PropostasChart,
  FunnelChart,
  VendedoresChart,
  AtividadesChart
} from '../../components/charts/DashboardCharts';
import {
  AlertTriangle, Target, FileText, DollarSign,
  UserPlus, BarChart3, ArrowUp, ArrowDown,
  CheckSquare, Clock, Calendar, Bell, RefreshCw
} from 'lucide-react';

const PERIOD_LABELS: Record<string, string> = {
  semanal: 'Esta semana',
  mensal: 'Este mês',
  trimestral: 'Último trimestre',
  semestral: 'Último semestre',
  anual: 'Ano atual'
};

const DEFAULT_PERIOD_OPTIONS: FilterOption[] = Object.entries(PERIOD_LABELS).map(([value, label]) => ({
  value,
  label
}));

const DEFAULT_REGION_OPTIONS: FilterOption[] = [
  { value: 'Todas', label: 'Todas as regiões' },
  { value: 'Norte', label: 'Norte' },
  { value: 'Nordeste', label: 'Nordeste' },
  { value: 'Centro-Oeste', label: 'Centro-Oeste' },
  { value: 'Sudeste', label: 'Sudeste' },
  { value: 'Sul', label: 'Sul' }
];

const DEFAULT_VENDOR_OPTIONS: FilterOption[] = [
  { value: 'Todos', label: 'Todos os vendedores' }
];

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
  const { user } = useAuth();

  const [filtros, setFiltros] = useState({
    periodo: "mensal",
    vendedor: "Todos",
    regiao: "Todas"
  });

  const firstName = user?.nome?.split(' ')[0] ?? undefined;
  const saudacao = (() => {
    const hora = new Date().getHours();
    if (hora < 12) return 'Bom dia';
    if (hora < 18) return 'Boa tarde';
    return 'Boa noite';
  })();



  // Hook para dados reais do dashboard
  const { data, loading, error, refresh, updateFilters } = useDashboard({
    periodo: filtros.periodo,
    vendedorId: filtros.vendedor === 'Todos' ? undefined : filtros.vendedor,
    regiao: filtros.regiao === 'Todas' ? undefined : filtros.regiao,
    autoRefresh: true,
    refreshInterval: 15 * 60 * 1000 // 15 minutos
  });

  const periodOptions = useMemo<FilterOption[]>(() => {
    const metadataPeriodos = (data?.metadata as { periodosDisponiveis?: string[] } | null)?.periodosDisponiveis;
    if (Array.isArray(metadataPeriodos) && metadataPeriodos.length > 0) {
      const mapped = metadataPeriodos
        .filter((periodo): periodo is keyof typeof PERIOD_LABELS => periodo in PERIOD_LABELS)
        .map((periodo) => ({ value: periodo, label: PERIOD_LABELS[periodo] }));

      if (mapped.length > 0) {
        return mapped;
      }
    }

    return DEFAULT_PERIOD_OPTIONS;
  }, [data?.metadata]);

  const vendedorOptions = useMemo<FilterOption[]>(() => {
    const metadataVendedores = (data?.metadata as { vendedoresDisponiveis?: Array<{ id: string; nome: string }> } | null)?.vendedoresDisponiveis;
    const source = Array.isArray(metadataVendedores) && metadataVendedores.length > 0
      ? metadataVendedores.map(({ id, nome }) => ({ value: id, label: nome }))
      : (Array.isArray(data?.vendedoresRanking) ? data.vendedoresRanking.map((vendedor) => ({ value: vendedor.id, label: vendedor.nome })) : []);

    const unique = new Map<string, string>();
    DEFAULT_VENDOR_OPTIONS.forEach(({ value, label }) => unique.set(value, label));
    source.forEach(({ value, label }) => {
      if (value && label && !unique.has(value)) {
        unique.set(value, label);
      }
    });

    return Array.from(unique.entries()).map(([value, label]) => ({ value, label }));
  }, [data?.metadata, data?.vendedoresRanking]);

  const regiaoOptions = useMemo<FilterOption[]>(() => {
    const metadataRegioes = (data?.metadata as { regioesDisponiveis?: string[] } | null)?.regioesDisponiveis;
    if (Array.isArray(metadataRegioes) && metadataRegioes.length > 0) {
      const unique = new Map<string, string>();
      DEFAULT_REGION_OPTIONS.forEach(({ value, label }) => unique.set(value, label));

      metadataRegioes.forEach((regiao) => {
        if (!unique.has(regiao)) {
          unique.set(regiao, regiao === 'Todas' ? 'Todas as regiões' : regiao);
        }
      });

      const mapped = Array.from(unique.entries()).map(([value, label]) => ({
        value,
        label
      }));

      if (mapped.length > 0) {
        return mapped;
      }
    }

    return DEFAULT_REGION_OPTIONS;
  }, [data?.metadata]);

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
  if (loading || !data?.kpis) {
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
  if (error) {
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

  const totalAlertas = data.alertas?.length ?? 0;
  const propostasAtivas = data.kpis?.emNegociacao?.quantidade ?? 0;
  const periodoAtivoLabel = PERIOD_LABELS[filtros.periodo] ?? filtros.periodo;
  const faturamentoTendencia = Array.isArray((data.kpis?.faturamentoTotal as any)?.tendencia)
    ? ((data.kpis?.faturamentoTotal as any)?.tendencia as number[])
    : undefined;
  const propostasEmFoco = Array.isArray(data.kpis?.emNegociacao?.propostas)
    ? data.kpis?.emNegociacao?.propostas ?? []
    : [];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-6">
        {/* Header da Página */}
        <div className="bg-white border border-[#DEEFE7] rounded-2xl shadow-sm p-6 mb-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl border border-[#159A9C] bg-[#159A9C] bg-opacity-10 flex items-center justify-center text-[#159A9C] shadow-sm">
                <BarChart3 className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#B4BEC9]">visão geral</p>
                <h1 className="text-2xl font-semibold text-[#002333]">Painel de performance</h1>
                <p className="text-sm font-semibold text-[#0F7B7D]">
                  {firstName ? `${saudacao}, ${firstName}!` : `${saudacao}!`}
                </p>
                <p className="text-sm text-[#0F7B7D] mt-1">
                  Indicadores críticos em um layout enxuto para decisões rápidas
                </p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-[#B4BEC9] bg-[#DEEFE7] text-sm text-[#0F7B7D]">
                <Clock className="h-4 w-4" />
                <span>Atualização automática a cada 15 min</span>
              </div>
              <button
                onClick={refresh}
                disabled={loading}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-[#159A9C] text-[#159A9C] hover:bg-[#DEEFE7] disabled:opacity-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#159A9C]/40"
              >
                <RefreshCw className={`${loading ? 'animate-spin' : ''} h-4 w-4`} />
                <span>Sincronizar agora</span>
              </button>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="flex items-center justify-between px-4 py-3 rounded-xl border border-[#DEEFE7] bg-[#FFFFFF] shadow-sm">
              <div>
                <p className="text-xs font-semibold uppercase text-[#B4BEC9]">Alertas ativos</p>
                <p className="text-xl font-semibold text-[#002333]">{totalAlertas}</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-[#DEEFE7] text-[#0F7B7D] flex items-center justify-center">
                <Bell className="h-5 w-5" />
              </div>
            </div>
            <div className="flex items-center justify-between px-4 py-3 rounded-xl border border-[#DEEFE7] bg-[#FFFFFF] shadow-sm">
              <div>
                <p className="text-xs font-semibold uppercase text-[#B4BEC9]">Propostas ativas</p>
                <p className="text-xl font-semibold text-[#002333]">{propostasAtivas}</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-[#DEEFE7] text-[#159A9C] flex items-center justify-center">
                <Target className="h-5 w-5" />
              </div>
            </div>
            <div className="flex items-center justify-between px-4 py-3 rounded-xl border border-[#DEEFE7] bg-[#FFFFFF] shadow-sm">
              <div>
                <p className="text-xs font-semibold uppercase text-[#B4BEC9]">Período ativo</p>
                <p className="text-xl font-semibold text-[#002333]">{periodoAtivoLabel}</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-[#DEEFE7] text-[#002333] flex items-center justify-center">
                <Calendar className="h-5 w-5" />
              </div>
            </div>
          </div>
        </div>

        {/* Filtros */}
        <ResponsiveFilters
          filtros={filtros}
          onChange={handleFiltroChange}
          periodOptions={periodOptions}
          vendedorOptions={vendedorOptions}
          regiaoOptions={regiaoOptions}
          loading={loading}
        />

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

        {/* Painel Comercial Dinâmico */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-[#DEEFE7] shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-[#002333]">Ranking de vendedores</h3>
                <p className="text-sm text-[#0F7B7D]">Metas atingidas no período selecionado</p>
              </div>
              {data.metadata?.atualizadoEm && (
                <span className="text-xs font-semibold text-[#B4BEC9]">
                  Atualizado em {new Date(data.metadata.atualizadoEm).toLocaleString('pt-BR')}
                </span>
              )}
            </div>
            {data.vendedoresRanking && data.vendedoresRanking.length > 0 ? (
              <div className="space-y-3">
                {data.vendedoresRanking.slice(0, 5).map((vendedor, index) => {
                  const percentualMeta = vendedor.meta
                    ? Math.round((vendedor.vendas / vendedor.meta) * 100)
                    : null;
                  return (
                    <div
                      key={vendedor.id}
                      className="flex items-center justify-between p-3 rounded-xl border border-[#DEEFE7] bg-[#FFFFFF]"
                    >
                      <div className="flex items-center gap-4">
                        <span className="h-8 w-8 rounded-full bg-[#DEEFE7] text-[#159A9C] flex items-center justify-center font-semibold">
                          #{index + 1}
                        </span>
                        <div>
                          <p className="text-sm font-semibold text-[#002333]">{vendedor.nome}</p>
                          <p className="text-xs text-[#0F7B7D]">
                            {percentualMeta !== null ? `${percentualMeta}% da meta` : 'Meta não informada'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-[#002333]">
                          {vendedor.vendas.toLocaleString('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                            minimumFractionDigits: 0
                          })}
                        </p>
                        <p
                          className="text-xs font-semibold"
                          style={{
                            color: vendedor.variacao >= 0
                              ? currentPalette.colors.success
                              : currentPalette.colors.error
                          }}
                        >
                          {vendedor.variacao >= 0 ? '+' : ''}{vendedor.variacao}% vs período anterior
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-4 rounded-lg border border-dashed border-[#B4BEC9] text-sm text-[#0F7B7D]">
                Nenhum vendedor com desempenho registrado para o filtro atual.
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl p-6 border border-[#DEEFE7] shadow-sm">
            <h3 className="text-lg font-semibold text-[#002333] mb-4">Pipeline atual</h3>
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-semibold text-[#002333]">Em negociação</p>
                  <p className="text-xs text-[#0F7B7D]">Valor potencial do pipeline</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-[#002333]">
                    {(data.kpis?.emNegociacao?.valor ?? 0).toLocaleString('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                      minimumFractionDigits: 0
                    })}
                  </p>
                  <span className="text-xs text-[#0F7B7D]">
                    {data.kpis?.emNegociacao?.quantidade ?? 0} propostas
                  </span>
                </div>
              </div>

              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-semibold text-[#002333]">Taxa de sucesso</p>
                  <p className="text-xs text-[#0F7B7D]">Conversão geral do período</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-[#002333]">
                    {(data.kpis?.taxaSucessoGeral?.percentual ?? 0).toFixed(1)}%
                  </p>
                  <span
                    className="text-xs font-semibold"
                    style={{
                      color: (data.kpis?.taxaSucessoGeral?.variacao ?? 0) >= 0
                        ? currentPalette.colors.success
                        : currentPalette.colors.error
                    }}
                  >
                    {(data.kpis?.taxaSucessoGeral?.variacao ?? 0) >= 0 ? '+' : ''}
                    {data.kpis?.taxaSucessoGeral?.variacao ?? 0}% vs período anterior
                  </span>
                </div>
              </div>

              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-semibold text-[#002333]">Novos clientes</p>
                  <p className="text-xs text-[#0F7B7D]">Crescimento da base</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-[#002333]">
                    {data.kpis?.novosClientesMes?.quantidade ?? 0}
                  </p>
                  <span
                    className="text-xs font-semibold"
                    style={{
                      color: (data.kpis?.novosClientesMes?.variacao ?? 0) >= 0
                        ? currentPalette.colors.primary
                        : currentPalette.colors.error
                    }}
                  >
                    {(data.kpis?.novosClientesMes?.variacao ?? 0) >= 0 ? '+' : ''}
                    {data.kpis?.novosClientesMes?.variacao ?? 0}% vs mês anterior
                  </span>
                </div>
              </div>

              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-semibold text-[#002333]">Leads qualificados</p>
                  <p className="text-xs text-[#0F7B7D]">Entradas prontas para venda</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-[#002333]">
                    {data.kpis?.leadsQualificados?.quantidade ?? 0}
                  </p>
                  <span
                    className="text-xs font-semibold"
                    style={{
                      color: (data.kpis?.leadsQualificados?.variacao ?? 0) >= 0
                        ? currentPalette.colors.primary
                        : currentPalette.colors.error
                    }}
                  >
                    {(data.kpis?.leadsQualificados?.variacao ?? 0) >= 0 ? '+' : ''}
                    {data.kpis?.leadsQualificados?.variacao ?? 0}% vs mês anterior
                  </span>
                </div>
              </div>

              {propostasEmFoco.length > 0 && (
                <div>
                  <p className="text-xs uppercase tracking-wide text-[#B4BEC9] mb-2">Propostas em foco</p>
                  <div className="flex flex-wrap gap-2">
                    {propostasEmFoco.slice(0, 6).map((codigo) => (
                      <span
                        key={codigo}
                        className="px-3 py-1 rounded-full text-xs font-semibold bg-[#DEEFE7] text-[#159A9C]"
                      >
                        {codigo}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* KPIs Principais com Dados Reais */}
        {data.kpis && data.kpis.faturamentoTotal && data.kpis.ticketMedio && data.kpis.vendasFechadas && data.kpis.emNegociacao && (
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
                {faturamentoTendencia && faturamentoTendencia.length > 0 && (
                  <div className="mt-3">
                    <span className="text-xs font-medium" style={{ color: currentPalette.colors.textSecondary }}>
                      Últimos 7 dias:
                    </span>
                    <MiniTrendChart
                      data={faturamentoTendencia}
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
                {data.kpis?.vendasFechadas?.quantidade ?? 0}
              </div>
              <div className="flex items-center gap-2">
                {(data.kpis?.vendasFechadas?.variacao ?? 0) >= 0 ? (
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
                    color: (data.kpis?.vendasFechadas?.variacao ?? 0) >= 0
                      ? currentPalette.colors.success
                      : currentPalette.colors.error
                  }}
                >
                  {(data.kpis?.vendasFechadas?.variacao ?? 0) >= 0 ? '+' : ''}{data.kpis?.vendasFechadas?.variacao ?? 0}% {data.kpis?.vendasFechadas?.periodo ?? 'vs mês anterior'}
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
                {(data.kpis?.emNegociacao?.valor ?? 0).toLocaleString('pt-BR', {
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
                  {data.kpis?.emNegociacao?.quantidade ?? 0} propostas ativas
                </span>
              </div>
            </div>
          </div>
        )}

        {/* KPIs Secundários */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <KPICard
            title="Leads Qualificados"
            value={data.kpis?.leadsQualificados?.quantidade || 0}
            icon={<Target size={24} />}
            trend={{
              value: data.kpis?.leadsQualificados?.variacao || 0,
              isPositive: (data.kpis?.leadsQualificados?.variacao || 0) >= 0,
              label: 'vs mês anterior'
            }}
          />

          <KPICard
            title="Propostas Enviadas"
            value={(data.kpis?.propostasEnviadas?.valor ?? 0).toLocaleString('pt-BR', {
              style: 'currency',
              currency: 'BRL',
              minimumFractionDigits: 0
            })}
            icon={<FileText size={24} />}
            trend={{
              value: data.kpis?.propostasEnviadas?.variacao || 0,
              isPositive: (data.kpis?.propostasEnviadas?.variacao || 0) >= 0,
              label: 'vs mês anterior'
            }}
          />

          <KPICard
            title="Taxa de Sucesso"
            value={`${(data.kpis?.taxaSucessoGeral?.percentual ?? 0).toFixed(1)}%`}
            icon={<BarChart3 size={24} />}
            trend={{
              value: data.kpis?.taxaSucessoGeral?.variacao || 0,
              isPositive: (data.kpis?.taxaSucessoGeral?.variacao || 0) >= 0,
              label: 'vs mês anterior'
            }}
          />

          <KPICard
            title="Novos Clientes"
            value={data.kpis?.novosClientesMes?.quantidade || 0}
            icon={<UserPlus size={24} />}
            trend={{
              value: data.kpis?.novosClientesMes?.variacao || 0,
              isPositive: (data.kpis?.novosClientesMes?.variacao || 0) >= 0,
              label: 'vs mês anterior'
            }}
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

      </div>
    </div>
  );
};

export default DashboardPage;
