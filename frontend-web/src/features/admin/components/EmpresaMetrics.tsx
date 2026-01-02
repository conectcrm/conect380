import React from 'react';
import {
  Building2,
  TrendingUp,
  DollarSign,
  Users,
  AlertTriangle,
  Calendar,
  CheckCircle,
  Clock,
  Ban,
  Activity,
} from 'lucide-react';

interface Empresa {
  id: string;
  nome: string;
  cnpj: string;
  email: string;
  plano: 'starter' | 'professional' | 'enterprise';
  status: 'ativa' | 'trial' | 'suspensa' | 'inativa';
  usuariosAtivos: number;
  clientesCadastrados: number;
  ultimoAcesso: Date;
  dataExpiracao: Date;
  valorMensal: number;
}

interface MetricData {
  totalEmpresas: number;
  empresasAtivas: number;
  empresasTrial: number;
  empresasSuspensas: number;
  empresasInativas: number;
  receitaMensal: number;
  mediaUsuariosPorEmpresa: number;
  totalUsuarios: number;
  empresasExpirandoSemana: number;
  novasEmpresasMes: number;
  cancelamentosMes: number;
  taxaConversaoTrial: number;
}

interface EmpresaMetricsProps {
  empresas: Empresa[];
  isLoading?: boolean;
}

export const EmpresaMetrics: React.FC<EmpresaMetricsProps> = ({ empresas, isLoading = false }) => {
  // Calcular métricas a partir da lista de empresas
  const calculateMetrics = (): MetricData => {
    const now = new Date();
    const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const totalEmpresas = empresas.length;
    const empresasAtivas = empresas.filter((e) => e.status === 'ativa').length;
    const empresasTrial = empresas.filter((e) => e.status === 'trial').length;
    const empresasSuspensas = empresas.filter((e) => e.status === 'suspensa').length;
    const empresasInativas = empresas.filter((e) => e.status === 'inativa').length;

    const receitaMensal = empresas
      .filter((e) => e.status === 'ativa')
      .reduce((sum, e) => sum + e.valorMensal, 0);

    const totalUsuarios = empresas.reduce((sum, e) => sum + e.usuariosAtivos, 0);
    const mediaUsuariosPorEmpresa = totalEmpresas > 0 ? totalUsuarios / totalEmpresas : 0;

    const empresasExpirandoSemana = empresas.filter(
      (e) => e.dataExpiracao && e.dataExpiracao <= oneWeekFromNow,
    ).length;

    // Simular dados que normalmente viriam da API
    const novasEmpresasMes = Math.round(totalEmpresas * 0.15);
    const cancelamentosMes = Math.round(totalEmpresas * 0.05);
    const taxaConversaoTrial =
      empresasTrial > 0 ? (empresasAtivas / (empresasAtivas + empresasTrial)) * 100 : 0;

    return {
      totalEmpresas,
      empresasAtivas,
      empresasTrial,
      empresasSuspensas,
      empresasInativas,
      receitaMensal,
      mediaUsuariosPorEmpresa,
      totalUsuarios,
      empresasExpirandoSemana,
      novasEmpresasMes,
      cancelamentosMes,
      taxaConversaoTrial,
    };
  };

  const data = calculateMetrics();
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const MetricCard: React.FC<{
    title: string;
    value: string | number;
    icon: React.ComponentType<any>;
    color: string;
    trend?: {
      value: number;
      isPositive: boolean;
    };
    subtitle?: string;
  }> = ({ title, value, icon: Icon, color, trend, subtitle }) => {
    if (isLoading) {
      return (
        <div className="bg-white p-6 rounded-lg border border-gray-200 animate-pulse">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-24"></div>
              <div className="h-8 bg-gray-200 rounded w-16"></div>
            </div>
            <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
          </div>
        </div>
      );
    }

    return (
      <div className="bg-white p-6 rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
            {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
            {trend && (
              <div
                className={`flex items-center mt-2 ${
                  trend.isPositive ? 'text-green-600' : 'text-red-600'
                }`}
              >
                <TrendingUp
                  className={`w-4 h-4 mr-1 ${!trend.isPositive ? 'transform rotate-180' : ''}`}
                />
                <span className="text-sm font-medium">
                  {trend.isPositive ? '+' : ''}
                  {trend.value.toFixed(1)}%
                </span>
              </div>
            )}
          </div>
          <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${color}`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
        </div>
      </div>
    );
  };

  const calculateGrowthRate = (current: number, previous: number) => {
    if (previous === 0) return { value: 0, isPositive: true };
    const growth = ((current - previous) / previous) * 100;
    return { value: Math.abs(growth), isPositive: growth >= 0 };
  };

  // Simular dados de crescimento (em um cenário real, viria da API)
  const previousMonthData = {
    empresasAtivas: Math.round(data.empresasAtivas * 0.95),
    receitaMensal: data.receitaMensal * 0.92,
    totalUsuarios: Math.round(data.totalUsuarios * 0.98),
    novasEmpresas: Math.round(data.novasEmpresasMes * 0.85),
  };

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Métricas do Sistema</h2>
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <Activity className="w-4 h-4" />
          <span>Atualizado agora</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total de Empresas */}
        <MetricCard
          title="Total de Empresas"
          value={data.totalEmpresas.toLocaleString('pt-BR')}
          icon={Building2}
          color="bg-[#159A9C]"
          subtitle={`${data.empresasAtivas} ativas`}
        />

        {/* Receita Mensal */}
        <MetricCard
          title="Receita Mensal"
          value={formatCurrency(data.receitaMensal)}
          icon={DollarSign}
          color="bg-green-500"
          trend={calculateGrowthRate(data.receitaMensal, previousMonthData.receitaMensal)}
        />

        {/* Total de Usuários */}
        <MetricCard
          title="Total de Usuários"
          value={data.totalUsuarios.toLocaleString('pt-BR')}
          icon={Users}
          color="bg-blue-500"
          trend={calculateGrowthRate(data.totalUsuarios, previousMonthData.totalUsuarios)}
          subtitle={`${data.mediaUsuariosPorEmpresa.toFixed(1)} por empresa`}
        />

        {/* Conversão Trial */}
        <MetricCard
          title="Taxa de Conversão"
          value={formatPercentage(data.taxaConversaoTrial)}
          icon={TrendingUp}
          color="bg-purple-500"
          subtitle="Trial → Pago"
        />
      </div>

      {/* Segunda linha de métricas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
        {/* Empresas Ativas */}
        <MetricCard
          title="Empresas Ativas"
          value={data.empresasAtivas}
          icon={CheckCircle}
          color="bg-green-600"
          trend={calculateGrowthRate(data.empresasAtivas, previousMonthData.empresasAtivas)}
        />

        {/* Em Trial */}
        <MetricCard
          title="Em Trial"
          value={data.empresasTrial}
          icon={Clock}
          color="bg-blue-600"
          subtitle="Período teste"
        />

        {/* Suspensas */}
        <MetricCard
          title="Suspensas"
          value={data.empresasSuspensas}
          icon={AlertTriangle}
          color="bg-yellow-500"
          subtitle="Requer atenção"
        />

        {/* Inativas */}
        <MetricCard
          title="Inativas"
          value={data.empresasInativas}
          icon={Ban}
          color="bg-red-500"
          subtitle="Canceladas"
        />
      </div>

      {/* Alertas e estatísticas importantes */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
        {/* Expirando esta semana */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Expirando esta semana</p>
              <p className="text-2xl font-bold text-red-600">{data.empresasExpirandoSemana}</p>
              <p className="text-sm text-gray-500">Requer renovação</p>
            </div>
          </div>
        </div>

        {/* Novas empresas este mês */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Novas este mês</p>
              <p className="text-2xl font-bold text-green-600">{data.novasEmpresasMes}</p>
              <div className="flex items-center mt-1">
                <span className="text-sm text-green-600 font-medium">
                  +
                  {calculateGrowthRate(
                    data.novasEmpresasMes,
                    previousMonthData.novasEmpresas,
                  ).value.toFixed(1)}
                  %
                </span>
                <span className="text-sm text-gray-500 ml-1">vs mês anterior</span>
              </div>
            </div>
          </div>
        </div>

        {/* Cancelamentos */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Cancelamentos</p>
              <p className="text-2xl font-bold text-orange-600">{data.cancelamentosMes}</p>
              <p className="text-sm text-gray-500">Este mês</p>
            </div>
          </div>
        </div>
      </div>

      {/* Barra de status distribuição */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 mt-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Distribuição por Status</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span>Ativas</span>
            </div>
            <span className="font-medium">
              {data.empresasAtivas} ({((data.empresasAtivas / data.totalEmpresas) * 100).toFixed(1)}
              %)
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span>Trial</span>
            </div>
            <span className="font-medium">
              {data.empresasTrial} ({((data.empresasTrial / data.totalEmpresas) * 100).toFixed(1)}%)
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <span>Suspensas</span>
            </div>
            <span className="font-medium">
              {data.empresasSuspensas} (
              {((data.empresasSuspensas / data.totalEmpresas) * 100).toFixed(1)}%)
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span>Inativas</span>
            </div>
            <span className="font-medium">
              {data.empresasInativas} (
              {((data.empresasInativas / data.totalEmpresas) * 100).toFixed(1)}%)
            </span>
          </div>
        </div>

        {/* Barra de progresso visual */}
        <div className="mt-4">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="flex h-2 rounded-full overflow-hidden">
              <div
                className="bg-green-500"
                style={{ width: `${(data.empresasAtivas / data.totalEmpresas) * 100}%` }}
              ></div>
              <div
                className="bg-blue-500"
                style={{ width: `${(data.empresasTrial / data.totalEmpresas) * 100}%` }}
              ></div>
              <div
                className="bg-yellow-500"
                style={{ width: `${(data.empresasSuspensas / data.totalEmpresas) * 100}%` }}
              ></div>
              <div
                className="bg-red-500"
                style={{ width: `${(data.empresasInativas / data.totalEmpresas) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
