import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Progress } from '../ui/progress';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import {
  Users,
  UserCheck,
  Database,
  Zap,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Info,
} from 'lucide-react';
import { useSubscription } from '../../hooks/useSubscription';

interface UsageMeterProps {
  onUpgrade?: () => void;
  showDetails?: boolean;
}

export const UsageMeter: React.FC<UsageMeterProps> = ({ onUpgrade, showDetails = false }) => {
  const { assinatura, limites, calcularProgresso, loading } = useSubscription();

  if (loading || !assinatura || !limites) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/3"></div>
            <div className="h-2 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const progresso = calcularProgresso();

  if (!progresso) return null;

  const getStatusIcon = (percentual: number) => {
    if (percentual >= 95) return <AlertTriangle className="h-4 w-4 text-red-500" />;
    if (percentual >= 80) return <Info className="h-4 w-4 text-yellow-500" />;
    return <CheckCircle className="h-4 w-4 text-green-500" />;
  };

  const getStatusColor = (percentual: number) => {
    if (percentual >= 95) return 'text-red-600';
    if (percentual >= 80) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getProgressColor = (percentual: number) => {
    if (percentual >= 95) return 'bg-red-600';
    if (percentual >= 80) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const metrics = [
    {
      id: 'usuarios',
      label: 'Usuários',
      icon: <Users className="h-5 w-5" />,
      current: progresso.usuarios.usado,
      limit: progresso.usuarios.total,
      percentage: progresso.usuarios.percentual,
      unit: 'usuários',
    },
    {
      id: 'clientes',
      label: 'Clientes',
      icon: <UserCheck className="h-5 w-5" />,
      current: progresso.clientes.usado,
      limit: progresso.clientes.total,
      percentage: progresso.clientes.percentual,
      unit: 'clientes',
    },
    {
      id: 'storage',
      label: 'Armazenamento',
      icon: <Database className="h-5 w-5" />,
      current: progresso.storage.usado,
      limit: progresso.storage.total,
      percentage: progresso.storage.percentual,
      unit: 'MB',
    },
    {
      id: 'api',
      label: 'API Calls (hoje)',
      icon: <Zap className="h-5 w-5" />,
      current: assinatura.apiCallsHoje,
      limit: assinatura.plano.limiteApiCalls,
      percentage: (assinatura.apiCallsHoje / assinatura.plano.limiteApiCalls) * 100,
      unit: 'calls',
    },
  ];

  const hasWarnings = metrics.some((metric) => metric.percentage >= 80);
  const hasCritical = metrics.some((metric) => metric.percentage >= 95);

  if (!showDetails) {
    // Versão compacta
    return (
      <Card
        className={`${hasCritical ? 'border-red-200' : hasWarnings ? 'border-yellow-200' : 'border-green-200'}`}
      >
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium">Uso dos Recursos</h4>
            {hasCritical && (
              <Badge variant="destructive" className="text-xs">
                Limite Crítico
              </Badge>
            )}
            {hasWarnings && !hasCritical && (
              <Badge variant="outline" className="text-xs border-yellow-300 text-yellow-700">
                Atenção
              </Badge>
            )}
          </div>

          <div className="space-y-3">
            {metrics.map((metric) => (
              <div key={metric.id} className="flex items-center gap-3">
                <div className="text-gray-500">{metric.icon}</div>
                <div className="flex-1">
                  <div className="flex justify-between text-sm mb-1">
                    <span>{metric.label}</span>
                    <span className={getStatusColor(metric.percentage)}>
                      {metric.current}/{metric.limit} {metric.unit}
                    </span>
                  </div>
                  <div className="relative">
                    <Progress value={metric.percentage} className="h-1.5" />
                    <div
                      className={`absolute top-0 left-0 h-1.5 rounded-full transition-all ${getProgressColor(metric.percentage)}`}
                      style={{ width: `${Math.min(metric.percentage, 100)}%` }}
                    />
                  </div>
                </div>
                {getStatusIcon(metric.percentage)}
              </div>
            ))}
          </div>

          {(hasCritical || hasWarnings) && onUpgrade && (
            <Button
              onClick={onUpgrade}
              size="sm"
              className="w-full mt-4"
              variant={hasCritical ? 'destructive' : 'default'}
            >
              {hasCritical ? 'Upgrade Necessário' : 'Considerar Upgrade'}
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  // Versão detalhada
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Uso dos Recursos - {assinatura.plano.nome}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {metrics.map((metric) => (
              <div key={metric.id} className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="text-gray-500">{metric.icon}</div>
                    <span className="font-medium">{metric.label}</span>
                  </div>
                  {getStatusIcon(metric.percentage)}
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>
                      {metric.current} {metric.unit}
                    </span>
                    <span className="text-gray-500">
                      de {metric.limit} {metric.unit}
                    </span>
                  </div>

                  <div className="relative">
                    <Progress value={metric.percentage} className="h-3" />
                    <div
                      className={`absolute top-0 left-0 h-3 rounded-full transition-all ${getProgressColor(metric.percentage)}`}
                      style={{ width: `${Math.min(metric.percentage, 100)}%` }}
                    />
                  </div>

                  <div className="flex justify-between items-center">
                    <span className={`text-sm font-medium ${getStatusColor(metric.percentage)}`}>
                      {metric.percentage.toFixed(1)}% utilizado
                    </span>

                    {metric.percentage >= 95 && (
                      <Badge variant="destructive" className="text-xs">
                        Limite Atingido
                      </Badge>
                    )}
                    {metric.percentage >= 80 && metric.percentage < 95 && (
                      <Badge
                        variant="outline"
                        className="text-xs border-yellow-300 text-yellow-700"
                      >
                        Próximo do Limite
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Estimativa baseada no uso */}
                {metric.id === 'api' && (
                  <div className="text-xs text-gray-500 border-t pt-2">Reset diário às 00:00</div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recomendações */}
      {(hasCritical || hasWarnings) && (
        <Card
          className={hasCritical ? 'border-red-200 bg-red-50' : 'border-yellow-200 bg-yellow-50'}
        >
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              {hasCritical ? (
                <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              ) : (
                <Info className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              )}

              <div className="flex-1">
                <h4 className={`font-medium ${hasCritical ? 'text-red-800' : 'text-yellow-800'}`}>
                  {hasCritical ? 'Ação Necessária' : 'Recomendação'}
                </h4>

                <p className={`text-sm mt-1 ${hasCritical ? 'text-red-700' : 'text-yellow-700'}`}>
                  {hasCritical
                    ? 'Você atingiu o limite de alguns recursos. Faça upgrade para continuar usando todas as funcionalidades.'
                    : 'Você está próximo do limite de alguns recursos. Considere fazer upgrade para evitar interrupções.'}
                </p>

                {onUpgrade && (
                  <Button
                    onClick={onUpgrade}
                    size="sm"
                    className={`mt-3 ${hasCritical ? 'bg-red-600 hover:bg-red-700' : 'bg-yellow-600 hover:bg-yellow-700'}`}
                  >
                    Ver Planos Superiores
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
