import React from 'react';
import { Clock, User, FileText, Phone, Mail, Calendar } from 'lucide-react';

interface Activity {
  id: string;
  type: 'call' | 'email' | 'meeting' | 'proposal' | 'contact';
  title: string;
  description: string;
  time: string;
  user: string;
  priority?: 'high' | 'medium' | 'low';
}

const activities: Activity[] = [
  {
    id: '1',
    type: 'call',
    title: 'Ligação para cliente',
    description: 'Contato com João Silva sobre proposta #123',
    time: '2 horas atrás',
    user: 'Ana Costa',
    priority: 'high'
  },
  {
    id: '2',
    type: 'proposal',
    title: 'Nova proposta criada',
    description: 'Proposta #124 para Empresa ABC Ltd.',
    time: '4 horas atrás',
    user: 'Carlos Santos',
    priority: 'medium'
  },
  {
    id: '3',
    type: 'meeting',
    title: 'Reunião agendada',
    description: 'Apresentação de produto para cliente XYZ',
    time: '1 dia atrás',
    user: 'Maria Oliveira',
    priority: 'medium'
  },
  {
    id: '4',
    type: 'email',
    title: 'E-mail enviado',
    description: 'Follow-up da reunião da semana passada',
    time: '2 dias atrás',
    user: 'Pedro Lima',
    priority: 'low'
  },
  {
    id: '5',
    type: 'contact',
    title: 'Novo contato adicionado',
    description: 'Contato recebido via site institucional',
    time: '3 dias atrás',
    user: 'Sistema',
    priority: 'medium'
  }
];

const getActivityIcon = (type: Activity['type']) => {
  const iconClass = "w-4 h-4";
  
  switch (type) {
    case 'call':
      return <Phone className={`${iconClass} text-blue-500`} />;
    case 'email':
      return <Mail className={`${iconClass} text-green-500`} />;
    case 'meeting':
      return <Calendar className={`${iconClass} text-purple-500`} />;
    case 'proposal':
      return <FileText className={`${iconClass} text-orange-500`} />;
    case 'contact':
      return <User className={`${iconClass} text-gray-500`} />;
    default:
      return <Clock className={`${iconClass} text-gray-400`} />;
  }
};

const getPriorityColor = (priority?: Activity['priority']) => {
  switch (priority) {
    case 'high':
      return 'border-l-red-400 bg-red-50';
    case 'medium':
      return 'border-l-yellow-400 bg-yellow-50';
    case 'low':
      return 'border-l-gray-400 bg-gray-50';
    default:
      return 'border-l-gray-300 bg-white';
  }
};

interface RecentActivitiesWidgetProps {
  className?: string;
  isLoading?: boolean;
}

export const RecentActivitiesWidget: React.FC<RecentActivitiesWidgetProps> = ({
  className = '',
  isLoading = false
}) => {
  if (isLoading) {
    return (
      <div className={`bg-white rounded-xl shadow-sm border p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded mb-4 w-1/2"></div>
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-start gap-3 p-3 border-l-4 border-gray-200 rounded">
                <div className="w-4 h-4 bg-gray-200 rounded"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                </div>
                <div className="h-3 bg-gray-200 rounded w-16"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`bg-white rounded-xl shadow-sm border p-6 ${className}`}
      role="region"
      aria-label="Atividades recentes do sistema"
    >
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Clock className="w-5 h-5 text-gray-600" />
          Atividades Recentes
        </h3>
        <button 
          className="text-sm text-blue-600 hover:text-blue-800 hover:underline focus:outline-none focus:underline"
          aria-label="Ver todas as atividades"
        >
          Ver todas
        </button>
      </div>

      <div className="space-y-3">
        {activities.map((activity) => (
          <div
            key={activity.id}
            className={`flex items-start gap-3 p-3 border-l-4 rounded transition-colors hover:bg-gray-50 ${getPriorityColor(activity.priority)}`}
            role="article"
            aria-label={`Atividade: ${activity.title}`}
          >
            <div className="flex-shrink-0 mt-1">
              {getActivityIcon(activity.type)}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-gray-900 mb-1">
                    {activity.title}
                  </h4>
                  <p className="text-sm text-gray-600 mb-1">
                    {activity.description}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <User className="w-3 h-3" />
                    <span>{activity.user}</span>
                    <span>•</span>
                    <span>{activity.time}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer com call-to-action */}
      <div className="mt-6 pt-4 border-t border-gray-100">
        <button 
          className="w-full text-sm text-gray-600 hover:text-gray-800 py-2 hover:bg-gray-50 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
          aria-label="Carregar mais atividades"
        >
          Carregar mais atividades
        </button>
      </div>
    </div>
  );
};
