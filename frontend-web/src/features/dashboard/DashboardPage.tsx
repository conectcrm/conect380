import React, { useState, useEffect } from 'react';
import { useI18n } from '../../contexts/I18nContext';
import { useTheme } from '../../contexts/ThemeContext';
import { KPICard } from '../../components/common/KPICard';
import { ResponsiveFilters } from '../../components/common/ResponsiveFilters';
import { ResponsiveDashboardLayout } from '../../components/layout/ResponsiveDashboardLayout';
import ColorPaletteSelector from '../../components/common/ColorPaletteSelector';
import LanguageSelector from '../../components/common/LanguageSelector';
import { 
  Plus, AlertTriangle, Activity, Target,
  Calendar, Bell, Users, FileText, DollarSign,
  TrendingUp, UserPlus, BarChart3, ChevronRight,
  Palette, Filter, ArrowUp, CheckSquare, Clock,
  Eye, Edit
} from 'lucide-react';

const DashboardPage: React.FC = () => {
  const { t } = useI18n();
  const { currentPalette } = useTheme();
  
  const [filtros, setFiltros] = useState({
    periodo: "2025",
    vendedor: "Todos",
    regiao: "Todas"
  });

  const [showPaletteSelector, setShowPaletteSelector] = useState(false);
  const [showLanguageSelector, setShowLanguageSelector] = useState(false);
  
  const [loading, setLoading] = useState(false);

  // Dados estáticos para demonstração
  const dashboardData = {
    kpis: {
      totalClientes: 248,
      propostasAtivas: 32,
      receitaMensal: 125000,
      taxaConversao: 68
    },
    ultimasPropostas: [
      {
        cliente: "Empresa ABC Ltda",
        valor: 25000,
        status: "Aprovada",
        data: "2025-01-15",
        vendedor: "João Silva"
      },
      {
        cliente: "Tech Solutions Inovação",
        valor: 18500,
        status: "Negociação",
        data: "2025-01-14",
        vendedor: "Maria Santos"
      },
      {
        cliente: "Digital Marketing Pro",
        valor: 12000,
        status: "Pendente",
        data: "2025-01-13",
        vendedor: "Pedro Costa"
      },
      {
        cliente: "StartUp Growth",
        valor: 8500,
        status: "Aprovada",
        data: "2025-01-12",
        vendedor: "Ana Oliveira"
      },
      {
        cliente: "Consultoria Empresarial",
        valor: 15000,
        status: "Rejeitada",
        data: "2025-01-11",
        vendedor: "João Silva"
      }
    ]
  };

  // Simulação de carregamento inicial
  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => {
      setLoading(false);
    }, 500);
    
    return () => clearTimeout(timer);
  }, [filtros]);

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[1,2,3,4].map(i => (
              <div key={i} className="bg-gray-200 h-32 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <ResponsiveDashboardLayout
      title={t('dashboard.title')}
      subtitle={t('dashboard.subtitle')}
      actions={
        <>
          <LanguageSelector />
          <button 
            onClick={() => setShowPaletteSelector(true)}
            className="px-3 py-2 sm:px-4 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2 text-sm transition-colors"
            title={t('dashboard.themes')}
          >
            <Palette className="w-4 h-4" />
            <span className="hidden sm:inline">{t('dashboard.themes')}</span>
          </button>
          <button className="px-3 py-2 sm:px-4 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2 text-sm">
            <Calendar className="w-4 h-4" />
            <span className="hidden sm:inline">{t('dashboard.schedule')}</span>
          </button>
          <button 
            className="px-3 py-2 sm:px-4 rounded-lg text-white flex items-center gap-2 text-sm transition-colors"
            style={{ 
              backgroundColor: currentPalette.colors.primary,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = currentPalette.colors.primaryHover;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = currentPalette.colors.primary;
            }}
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">{t('dashboard.newProposal')}</span>
          </button>
        </>
      }
    >
      {/* Filtros */}
      <ResponsiveFilters filtros={filtros} setFiltros={setFiltros} />
      
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
                {t('dashboard.detailedPerformance')}
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
      </div>

      {/* KPIs Cards Reformulados - SEM DUPLICAÇÃO */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
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
      </div>

      {/* Área de Gráficos e Widgets - Layout Responsivo */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6 mb-6">
        {/* Gráfico de Evolução de Vendas */}
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4">
            <h3 className="text-lg font-semibold mb-2 sm:mb-0">{t('dashboard.salesEvolution')}</h3>
            <div className="flex items-center gap-2 text-sm">
              <button className="px-3 py-1 text-blue-600 bg-blue-50 rounded border border-blue-200 hover:bg-blue-100 transition-colors">
                Valor
              </button>
              <button className="px-3 py-1 text-gray-600 hover:bg-gray-50 rounded transition-colors">
                Quantidade
              </button>
            </div>
          </div>
          
          {/* Gráfico de Linha Responsivo */}
          <div className="h-64 sm:h-80 relative">
            <div className="absolute inset-0 flex items-end justify-between bg-gray-50 rounded p-2">
              {[
                { mes: 'Jan', valor: 180000, altura: '45%' },
                { mes: 'Fev', valor: 220000, altura: '55%' },
                { mes: 'Mar', valor: 190000, altura: '47%' },
                { mes: 'Abr', valor: 250000, altura: '62%' },
                { mes: 'Mai', valor: 280000, altura: '70%' },
                { mes: 'Jun', valor: 240000, altura: '60%' },
                { mes: 'Jul', valor: 300000, altura: '75%' },
                { mes: 'Ago', valor: 320000, altura: '80%' },
                { mes: 'Set', valor: 290000, altura: '72%' },
                { mes: 'Out', valor: 340000, altura: '85%' },
                { mes: 'Nov', valor: 360000, altura: '90%' },
                { mes: 'Dez', valor: 400000, altura: '100%' }
              ].map((item, index) => (
                <div key={index} className="flex flex-col items-center flex-1 group cursor-pointer">
                  <div 
                    className="w-full mx-1 bg-blue-500 hover:bg-blue-600 transition-all duration-300 rounded-t relative group-hover:shadow-lg"
                    style={{ height: item.altura }}
                    title={`${item.mes}: ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.valor)}`}
                  >
                    {/* Tooltip */}
                    <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', notation: 'compact' }).format(item.valor)}
                    </div>
                  </div>
                  <span className="text-xs text-gray-600 mt-2 font-medium">{item.mes}</span>
                </div>
              ))}
            </div>
          </div>
          
          {/* Resumo */}
          <div className="mt-4 pt-4 border-t flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div className="text-sm text-gray-600">
              <span className="font-medium">Total: </span>
              <span className="text-blue-600 font-semibold">R$ 2.600.000</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-blue-500 rounded"></div>
                <span className="text-gray-600">Vendas (R$)</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Funil de Vendas Responsivo */}
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold">{t('dashboard.salesFunnel')}</h3>
            <button className="text-sm text-blue-600 hover:underline">Ver detalhes</button>
          </div>
          
          <div className="space-y-4">
            {[
              { etapa: 'Leads', total: 150, conversao: 100, cor: 'bg-gray-600', corFundo: 'bg-gray-50' },
              { etapa: 'Qualificados', total: 89, conversao: 59.3, cor: 'bg-gray-500', corFundo: 'bg-gray-50' },
              { etapa: 'Propostas', total: 45, conversao: 50.6, cor: 'bg-blue-500', corFundo: 'bg-blue-50' },
              { etapa: 'Negociação', total: 23, conversao: 51.1, cor: 'bg-blue-600', corFundo: 'bg-blue-50' },
              { etapa: 'Fechados', total: 15, conversao: 65.2, cor: 'bg-slate-600', corFundo: 'bg-slate-50' }
            ].map((item, index) => (
              <div key={index} className={`p-3 rounded-lg ${item.corFundo} border border-opacity-20`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${item.cor}`}></div>
                    <span className="font-medium text-gray-800">{item.etapa}</span>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <span className="text-2xl font-bold text-gray-900">{item.total}</span>
                    <span className="text-sm text-gray-500">({item.conversao.toFixed(1)}%)</span>
                  </div>
                </div>
                
                {/* Barra de Progresso */}
                <div className="mt-3">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${item.cor} transition-all duration-500`}
                      style={{ width: `${(item.total / 150) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Conversão Geral */}
          <div className="mt-6 pt-4 border-t bg-gray-50 rounded-lg p-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">Taxa de Conversão Geral</span>
              <span className="text-lg font-bold text-green-600">10%</span>
            </div>
            <div className="text-xs text-gray-500 mt-1">
              15 fechamentos de 150 leads iniciais
            </div>
          </div>
        </div>
      </div>

      {/* Seção de Análises e Status - Layout Responsivo */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mb-6">
        {/* Status das Propostas - Gráfico Circular */}
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">{t('dashboard.proposalStatus')}</h3>
            <button className="text-sm text-blue-600 hover:underline">Ver todas</button>
          </div>
          
          {/* Gráfico Circular Responsivo */}
          <div className="flex flex-col items-center">
            <div className="relative w-32 h-32 sm:w-40 sm:h-40">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                {/* Background circle */}
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="#f3f4f6"
                  strokeWidth="8"
                />
                
                {/* Pendentes - 41.4% */}
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="#6b7280"
                  strokeWidth="8"
                  strokeDasharray={`${41.4 * 2.51} 251.2`}
                  strokeDashoffset="0"
                  className="transition-all duration-500"
                />
                
                {/* Aprovadas - 27.6% */}
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="8"
                  strokeDasharray={`${27.6 * 2.51} 251.2`}
                  strokeDashoffset={`-${41.4 * 2.51}`}
                  className="transition-all duration-500"
                />
                
                {/* Negociação - 20.7% */}
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="#1e40af"
                  strokeWidth="8"
                  strokeDasharray={`${20.7 * 2.51} 251.2`}
                  strokeDashoffset={`-${(41.4 + 27.6) * 2.51}`}
                  className="transition-all duration-500"
                />
                
                {/* Rejeitadas - 10.3% */}
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="#94a3b8"
                  strokeWidth="8"
                  strokeDasharray={`${10.3 * 2.51} 251.2`}
                  strokeDashoffset={`-${(41.4 + 27.6 + 20.7) * 2.51}`}
                  className="transition-all duration-500"
                />
              </svg>
              
              {/* Centro com total */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl sm:text-3xl font-bold text-gray-900">29</span>
                <span className="text-xs text-gray-500 font-medium">Total</span>
              </div>
            </div>
            
            {/* Legenda Responsiva */}
            <div className="mt-4 space-y-2 w-full">
              {[
                { label: 'Pendentes', valor: 12, percent: '41.4%', cor: 'bg-gray-500' },
                { label: 'Aprovadas', valor: 8, percent: '27.6%', cor: 'bg-blue-500' },
                { label: 'Negociação', valor: 6, percent: '20.7%', cor: 'bg-blue-700' },
                { label: 'Rejeitadas', valor: 3, percent: '10.3%', cor: 'bg-slate-400' }
              ].map((item, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${item.cor}`}></div>
                    <span className="text-gray-700">{item.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">{item.valor}</span>
                    <span className="text-gray-500">{item.percent}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Ações Rápidas Melhoradas */}
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm">
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
        </div>

        {/* Análise de Performance Compacta Melhorada */}
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold mb-4">{t('dashboard.performance')}</h3>
          
          {/* Métricas Principais */}
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

          {/* Progresso por Etapa */}
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
        </div>
      </div>

      {/* Segunda linha de widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
        {/* Tabela de Propostas Recentes */}
        <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-sm">
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
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        proposta.status === 'Aprovada' ? 'bg-green-100 text-green-800' :
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
        </div>
        
        {/* Ranking de Vendedores */}
        <div className="bg-white p-6 rounded-lg shadow-sm">
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
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                    index === 0 ? 'bg-gray-600' :
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
        </div>
      </div>

      {/* Terceira linha - Alertas e Atividades */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {/* Alertas e Notificações */}
        <div className="bg-white p-6 rounded-lg shadow-sm">
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
        </div>

        {/* Atividades Recentes */}
        <div className="bg-white p-6 rounded-lg shadow-sm">
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
        </div>
      </div>

      {/* Modal de Seleção de Paleta */}
      {showPaletteSelector && (
        <ColorPaletteSelector 
          showAsModal={true}
          onClose={() => setShowPaletteSelector(false)}
        />
      )}
      
      {/* Modal de Seleção de Idioma */}
      {showLanguageSelector && (
        <LanguageSelector 
          showAsModal={true}
          onClose={() => setShowLanguageSelector(false)}
        />
      )}
    </ResponsiveDashboardLayout>
  );
};

export default DashboardPage;
