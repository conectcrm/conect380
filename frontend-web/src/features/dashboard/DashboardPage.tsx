import React, { useState, useEffect } from 'react';
import { useI18n } from '../../contexts/I18nContext';
import { useTheme } from '../../contexts/ThemeContext';
import { KPICard } from '../../components/common/KPICard';
import { ResponsiveFilters } from '../../components/common/ResponsiveFilters';
import ColorPaletteSelector from '../../components/common/ColorPaletteSelector';
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
  CheckSquare, Clock, Eye, Edit, Plus, Calendar, Bell
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
    <div className="p-6">
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

      {/* Área de Gráficos Reais - Layout Responsivo */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">
        {/* Gráfico de Vendas vs Meta */}
        <VendasChart />
        
        {/* Gráfico de Status das Propostas */}
        <PropostasChart />
      </div>

      {/* Segunda linha de gráficos */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">
        {/* Funil de Vendas */}
        <FunnelChart />
        
        {/* Performance dos Vendedores */}
        <div className="xl:col-span-2">
          <VendedoresChart />
        </div>
      </div>

      {/* Gráfico de atividades */}
      <div className="mb-8">
        <AtividadesChart />
      </div>
      {/* Seção de Análises e Status - Layout Responsivo */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mb-6">
        {/* Status das Propostas - Gráfico Circular */}
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm">
          <PropostasChart />
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
    </div>
  );
};

export default DashboardPage;
