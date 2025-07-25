import React from 'react';
import { 
  Users, 
  UserCheck, 
  UserPlus, 
  TrendingUp, 
  DollarSign, 
  Target,
  Calendar,
  Award
} from 'lucide-react';

interface ContatoMetricsProps {
  metrics: {
    total: number;
    ativos: number;
    prospectos: number;
    leads: number;
    valorPotencial: number;
    pontuacaoMedia: number;
    novosMes: number;
    taxaConversao: number;
  };
}

export const ContatoMetrics: React.FC<ContatoMetricsProps> = ({ metrics }) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const formatScore = (value: number) => {
    return `${value.toFixed(1)}/100`;
  };

  const metricsData = [
    {
      title: 'Total de Contatos',
      value: metrics.total.toLocaleString('pt-BR'),
      icon: Users,
      color: 'bg-blue-100 text-blue-600',
      bgColor: 'bg-blue-50',
      change: '+12%',
      changeType: 'positive' as const
    },
    {
      title: 'Contatos Ativos',
      value: metrics.ativos.toLocaleString('pt-BR'),
      icon: UserCheck,
      color: 'bg-green-100 text-green-600',
      bgColor: 'bg-green-50',
      change: '+8%',
      changeType: 'positive' as const
    },
    {
      title: 'Prospectos',
      value: metrics.prospectos.toLocaleString('pt-BR'),
      icon: Target,
      color: 'bg-orange-100 text-orange-600',
      bgColor: 'bg-orange-50',
      change: '+15%',
      changeType: 'positive' as const
    },
    {
      title: 'Novos Leads',
      value: metrics.leads.toLocaleString('pt-BR'),
      icon: UserPlus,
      color: 'bg-purple-100 text-purple-600',
      bgColor: 'bg-purple-50',
      change: '+23%',
      changeType: 'positive' as const
    },
    {
      title: 'Valor Potencial',
      value: formatCurrency(metrics.valorPotencial),
      icon: DollarSign,
      color: 'bg-emerald-100 text-emerald-600',
      bgColor: 'bg-emerald-50',
      change: '+18%',
      changeType: 'positive' as const
    },
    {
      title: 'Pontuação Média',
      value: formatScore(metrics.pontuacaoMedia),
      icon: Award,
      color: 'bg-yellow-100 text-yellow-600',
      bgColor: 'bg-yellow-50',
      change: '+5%',
      changeType: 'positive' as const
    },
    {
      title: 'Novos este Mês',
      value: metrics.novosMes.toLocaleString('pt-BR'),
      icon: Calendar,
      color: 'bg-indigo-100 text-indigo-600',
      bgColor: 'bg-indigo-50',
      change: '+28%',
      changeType: 'positive' as const
    },
    {
      title: 'Taxa de Conversão',
      value: formatPercentage(metrics.taxaConversao),
      icon: TrendingUp,
      color: 'bg-pink-100 text-pink-600',
      bgColor: 'bg-pink-50',
      change: '+3%',
      changeType: 'positive' as const
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8">
      {metricsData.map((metric, index) => {
        const Icon = metric.icon;
        
        return (
          <div key={index} className={`${metric.bgColor} rounded-xl p-4 md:p-6 border border-gray-100 hover:shadow-md transition-shadow`}>
            <div className="flex items-center justify-between mb-3 md:mb-4">
              <div className={`w-10 h-10 md:w-12 md:h-12 ${metric.color} rounded-lg flex items-center justify-center`}>
                <Icon className="w-5 h-5 md:w-6 md:h-6" />
              </div>
              <span className={`text-xs md:text-sm font-medium px-2 py-1 rounded-full ${
                metric.changeType === 'positive' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {metric.change}
              </span>
            </div>
            
            <div>
              <h3 className="text-lg md:text-2xl font-bold text-[#002333] mb-1">
                {metric.value}
              </h3>
              <p className="text-xs md:text-sm text-[#B4BEC9]">
                {metric.title}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
};
