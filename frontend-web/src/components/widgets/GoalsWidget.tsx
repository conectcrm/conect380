import React from 'react';
import { Target, TrendingUp, Award, Calendar } from 'lucide-react';

interface Goal {
  id: string;
  title: string;
  current: number;
  target: number;
  unit: string;
  period: string;
  progress: number;
  trend: 'up' | 'down' | 'stable';
  color: string;
}

const goals: Goal[] = [
  {
    id: '1',
    title: 'Vendas do Mês',
    current: 275000,
    target: 320000,
    unit: 'R$',
    period: 'Julho 2025',
    progress: 86,
    trend: 'up',
    color: 'blue',
  },
  {
    id: '2',
    title: 'Novos Clientes',
    current: 28,
    target: 35,
    unit: 'clientes',
    period: 'Este mês',
    progress: 80,
    trend: 'up',
    color: 'green',
  },
  {
    id: '3',
    title: 'Propostas Enviadas',
    current: 45,
    target: 50,
    unit: 'propostas',
    period: 'Este mês',
    progress: 90,
    trend: 'up',
    color: 'purple',
  },
  {
    id: '4',
    title: 'Taxa de Conversão',
    current: 68,
    target: 75,
    unit: '%',
    period: 'Trimestre',
    progress: 91,
    trend: 'stable',
    color: 'orange',
  },
];

const formatValue = (value: number, unit: string) => {
  if (unit === 'R$') {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  }

  if (unit === '%') {
    return `${value}%`;
  }

  return `${value.toLocaleString('pt-BR')} ${unit}`;
};

const getProgressColor = (color: string, progress: number) => {
  const baseColors = {
    blue: progress >= 90 ? 'bg-blue-500' : progress >= 70 ? 'bg-blue-400' : 'bg-blue-300',
    green: progress >= 90 ? 'bg-green-500' : progress >= 70 ? 'bg-green-400' : 'bg-green-300',
    purple: progress >= 90 ? 'bg-purple-500' : progress >= 70 ? 'bg-purple-400' : 'bg-purple-300',
    orange: progress >= 90 ? 'bg-orange-500' : progress >= 70 ? 'bg-orange-400' : 'bg-orange-300',
  };

  return baseColors[color as keyof typeof baseColors] || 'bg-gray-400';
};

const getTrendIcon = (trend: Goal['trend']) => {
  switch (trend) {
    case 'up':
      return <TrendingUp className="w-4 h-4 text-green-500" />;
    case 'down':
      return <TrendingUp className="w-4 h-4 text-red-500 transform rotate-180" />;
    case 'stable':
      return <div className="w-4 h-0.5 bg-gray-400 rounded"></div>;
    default:
      return null;
  }
};

interface GoalsWidgetProps {
  className?: string;
  isLoading?: boolean;
}

export const GoalsWidget: React.FC<GoalsWidgetProps> = ({ className = '', isLoading = false }) => {
  if (isLoading) {
    return (
      <div className={`bg-white rounded-xl shadow-sm border p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded mb-6 w-1/2"></div>
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="space-y-2">
                <div className="flex justify-between">
                  <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                </div>
                <div className="h-2 bg-gray-200 rounded"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
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
      aria-label="Metas e objetivos do período"
    >
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Target className="w-5 h-5 text-gray-600" />
          Metas & Objetivos
        </h3>
        <button
          className="text-sm text-blue-600 hover:text-blue-800 hover:underline focus:outline-none focus:underline"
          aria-label="Ver detalhes das metas"
        >
          Detalhes
        </button>
      </div>

      <div className="space-y-6">
        {goals.map((goal) => (
          <div
            key={goal.id}
            className="space-y-3 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            role="article"
            aria-label={`Meta: ${goal.title}`}
          >
            {/* Header da meta */}
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-gray-900 mb-1">{goal.title}</h4>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Calendar className="w-3 h-3" />
                  <span>{goal.period}</span>
                  {getTrendIcon(goal.trend)}
                </div>
              </div>

              <div className="text-right">
                <div className="text-sm font-bold text-gray-900">
                  {formatValue(goal.current, goal.unit)}
                </div>
                <div className="text-xs text-gray-500">
                  de {formatValue(goal.target, goal.unit)}
                </div>
              </div>
            </div>

            {/* Barra de progresso */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-medium text-gray-600">Progresso</span>
                <span className="text-xs font-bold text-gray-900">{goal.progress}%</span>
              </div>

              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(goal.color, goal.progress)}`}
                  style={{ width: `${Math.min(goal.progress, 100)}%` }}
                  role="progressbar"
                  aria-valuenow={goal.progress}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`Progresso da meta ${goal.title}: ${goal.progress}%`}
                ></div>
              </div>
            </div>

            {/* Status da meta */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                {goal.progress >= 90 && <Award className="w-4 h-4 text-yellow-500" />}
                <span
                  className={`text-xs font-medium ${
                    goal.progress >= 90
                      ? 'text-green-600'
                      : goal.progress >= 70
                        ? 'text-yellow-600'
                        : 'text-gray-600'
                  }`}
                >
                  {goal.progress >= 90
                    ? 'Excelente!'
                    : goal.progress >= 70
                      ? 'No caminho certo'
                      : 'Precisa acelerar'}
                </span>
              </div>

              <span className="text-xs text-gray-500">
                {goal.target - goal.current > 0
                  ? `Faltam ${formatValue(goal.target - goal.current, goal.unit).replace('-', '')}`
                  : 'Meta atingida!'}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Footer com resumo */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="text-center">
          <div className="text-sm text-gray-600 mb-2">Performance geral do período</div>
          <div className="flex items-center justify-center gap-2">
            <div className="w-16 h-16 relative">
              <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 64 64">
                <circle
                  cx="32"
                  cy="32"
                  r="28"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                  className="text-gray-200"
                />
                <circle
                  cx="32"
                  cy="32"
                  r="28"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                  strokeDasharray={`${(goals.reduce((acc, goal) => acc + goal.progress, 0) / goals.length) * 1.75} 175`}
                  className="text-blue-500"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-sm font-bold text-gray-900">
                  {Math.round(goals.reduce((acc, goal) => acc + goal.progress, 0) / goals.length)}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
