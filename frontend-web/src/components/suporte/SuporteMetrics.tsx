import React from 'react';
import { 
  Users, 
  CheckCircle, 
  Clock, 
  Star,
  Book, 
  Video,
  Headphones,
  FileText
} from 'lucide-react';

interface SuporteMetricsProps {
  metrics: {
    ticketsAtivos: number;
    ticketsResolvidos: number;
    tempoMedioResposta: number;
    satisfacaoMedia: number;
    baseConhecimento: number;
    tutoriaisDisponiveis: number;
    horasSuporteDisponivel: number;
    especialistasOnline: number;
  };
}

export const SuporteMetrics: React.FC<SuporteMetricsProps> = ({ metrics }) => {
  const formatTime = (hours: number) => {
    if (hours < 1) {
      return `${Math.round(hours * 60)}min`;
    }
    return `${hours}h`;
  };

  const metricsData = [
    {
      title: 'Tickets Ativos',
      value: metrics.ticketsAtivos.toLocaleString('pt-BR'),
      icon: FileText,
      color: 'bg-blue-100 text-blue-600',
      bgColor: 'bg-blue-50',
      change: '+2 hoje',
      changeType: 'neutral' as const
    },
    {
      title: 'Tickets Resolvidos',
      value: metrics.ticketsResolvidos.toLocaleString('pt-BR'),
      icon: CheckCircle,
      color: 'bg-green-100 text-green-600',
      bgColor: 'bg-green-50',
      change: '+15 esta semana',
      changeType: 'positive' as const
    },
    {
      title: 'Tempo Médio Resposta',
      value: formatTime(metrics.tempoMedioResposta),
      icon: Clock,
      color: 'bg-orange-100 text-orange-600',
      bgColor: 'bg-orange-50',
      change: '-20min vs semana passada',
      changeType: 'positive' as const
    },
    {
      title: 'Satisfação Média',
      value: `${metrics.satisfacaoMedia.toFixed(1)}/5.0`,
      icon: Star,
      color: 'bg-yellow-100 text-yellow-600',
      bgColor: 'bg-yellow-50',
      change: '+0.3 este mês',
      changeType: 'positive' as const
    },
    {
      title: 'Base de Conhecimento',
      value: metrics.baseConhecimento.toLocaleString('pt-BR'),
      icon: Book,
      color: 'bg-purple-100 text-purple-600',
      bgColor: 'bg-purple-50',
      change: '+8 artigos esta semana',
      changeType: 'positive' as const
    },
    {
      title: 'Tutoriais Disponíveis',
      value: metrics.tutoriaisDisponiveis.toLocaleString('pt-BR'),
      icon: Video,
      color: 'bg-indigo-100 text-indigo-600',
      bgColor: 'bg-indigo-50',
      change: '+3 novos este mês',
      changeType: 'positive' as const
    },
    {
      title: 'Suporte 24h Disponível',
      value: `${metrics.horasSuporteDisponivel}h`,
      icon: Headphones,
      color: 'bg-emerald-100 text-emerald-600',
      bgColor: 'bg-emerald-50',
      change: 'Sempre ativo',
      changeType: 'positive' as const
    },
    {
      title: 'Especialistas Online',
      value: metrics.especialistasOnline.toLocaleString('pt-BR'),
      icon: Users,
      color: 'bg-pink-100 text-pink-600',
      bgColor: 'bg-pink-50',
      change: 'Agora disponíveis',
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
                  : 'bg-gray-100 text-gray-800'
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
