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

type UsageMetric = {
  id: 'usuarios' | 'clientes' | 'storage' | 'api';
  label: string;
  icon: React.ReactNode;
  current: number;
  limitLabel: string;
  percentage: number;
  unit: string;
  isUnlimited: boolean;
};

const formatLimitLabel = (limit: number, unit: string): string => {
  if (limit < 0) {
    return 'Ilimitado';
  }

  return `${limit.toLocaleString('pt-BR')} ${unit}`.trim();
};

export const UsageMeter: React.FC<UsageMeterProps> = ({ onUpgrade, showDetails = false }) => {
  const { assinatura, limites, calcularProgresso, loading, isOwnerTenant, podeAlterarPlano } =
    useSubscription();

  if (loading || !assinatura || !limites) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 w-1/3 rounded bg-[#DEEFE7]"></div>
            <div className="h-2 rounded bg-[#DEEFE7]"></div>
            <div className="h-4 w-1/4 rounded bg-[#DEEFE7]"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const progresso = calcularProgresso();
  if (!progresso) {
    return null;
  }

  const apiLimit = assinatura.plano.limiteApiCalls;
  const apiPercentage =
    apiLimit > 0 ? Math.min((assinatura.apiCallsHoje / apiLimit) * 100, 100) : 0;

  const metrics: UsageMetric[] = [
    {
      id: 'usuarios',
      label: 'Usuarios',
      icon: <Users className="h-5 w-5" />,
      current: progresso.usuarios.usado,
      limitLabel: formatLimitLabel(progresso.usuarios.total, 'usuarios'),
      percentage: progresso.usuarios.percentual,
      unit: 'usuarios',
      isUnlimited: progresso.usuarios.total < 0,
    },
    {
      id: 'clientes',
      label: 'Clientes',
      icon: <UserCheck className="h-5 w-5" />,
      current: progresso.clientes.usado,
      limitLabel: formatLimitLabel(progresso.clientes.total, 'clientes'),
      percentage: progresso.clientes.percentual,
      unit: 'clientes',
      isUnlimited: progresso.clientes.total < 0,
    },
    {
      id: 'storage',
      label: 'Armazenamento',
      icon: <Database className="h-5 w-5" />,
      current: progresso.storage.usado,
      limitLabel:
        progresso.storage.total < 0
          ? 'Ilimitado'
          : `${progresso.storage.total.toLocaleString('pt-BR')} MB`,
      percentage: progresso.storage.percentual,
      unit: 'MB',
      isUnlimited: progresso.storage.total < 0,
    },
    {
      id: 'api',
      label: 'API Calls (hoje)',
      icon: <Zap className="h-5 w-5" />,
      current: assinatura.apiCallsHoje,
      limitLabel: formatLimitLabel(apiLimit, 'calls'),
      percentage: apiPercentage,
      unit: 'calls',
      isUnlimited: apiLimit < 0,
    },
  ];

  const hasWarnings = metrics.some((metric) => !metric.isUnlimited && metric.percentage >= 80);
  const hasCritical = metrics.some((metric) => !metric.isUnlimited && metric.percentage >= 95);

  const getStatusIcon = (metric: UsageMetric) => {
    if (metric.isUnlimited) return <CheckCircle className="h-4 w-4 text-green-500" />;
    if (metric.percentage >= 95) return <AlertTriangle className="h-4 w-4 text-red-500" />;
    if (metric.percentage >= 80) return <Info className="h-4 w-4 text-yellow-500" />;
    return <CheckCircle className="h-4 w-4 text-green-500" />;
  };

  const getStatusColor = (metric: UsageMetric) => {
    if (metric.isUnlimited) return 'text-[#159A9C]';
    if (metric.percentage >= 95) return 'text-red-600';
    if (metric.percentage >= 80) return 'text-yellow-600';
    return 'text-[#159A9C]';
  };

  const getProgressColor = (metric: UsageMetric) => {
    if (metric.isUnlimited) return 'bg-[#159A9C]';
    if (metric.percentage >= 95) return 'bg-red-600';
    if (metric.percentage >= 80) return 'bg-yellow-500';
    return 'bg-[#159A9C]';
  };

  const getPercentualLabel = (metric: UsageMetric) => {
    if (metric.isUnlimited) {
      return 'Sem limite neste recurso';
    }

    return `${metric.percentage.toFixed(1)}% utilizado`;
  };

  if (!showDetails) {
    return (
      <Card
        className={`${hasCritical ? 'border-red-200' : hasWarnings ? 'border-yellow-200' : 'border-[#DEEFE7]'}`}
      >
        <CardContent className="p-4">
          <div className="mb-3 flex items-center justify-between">
            <h4 className="font-medium">Uso dos Recursos</h4>
            {hasCritical && (
              <Badge variant="destructive" className="text-xs">
                Limite Critico
              </Badge>
            )}
            {hasWarnings && !hasCritical && (
              <Badge variant="outline" className="border-yellow-300 text-xs text-yellow-700">
                Atencao
              </Badge>
            )}
          </div>

          <div className="space-y-3">
            {metrics.map((metric) => (
              <div key={metric.id} className="flex items-center gap-3">
                <div className="text-[#6E8997]">{metric.icon}</div>
                <div className="flex-1">
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="text-[#244455]">{metric.label}</span>
                    <span className={getStatusColor(metric)}>
                      {metric.current.toLocaleString('pt-BR')} / {metric.limitLabel}
                    </span>
                  </div>
                  <div className="relative">
                    <Progress value={metric.percentage} className="h-1.5" />
                    <div
                      className={`absolute left-0 top-0 h-1.5 rounded-full transition-all ${getProgressColor(metric)}`}
                      style={{ width: `${Math.min(metric.percentage, 100)}%` }}
                    />
                  </div>
                </div>
                {getStatusIcon(metric)}
              </div>
            ))}
          </div>

          {(hasCritical || hasWarnings) && onUpgrade && !isOwnerTenant && (
            <Button
              onClick={onUpgrade}
              size="sm"
              className="mt-4 w-full"
              disabled={!podeAlterarPlano}
              variant={hasCritical ? 'destructive' : 'default'}
            >
              {hasCritical ? 'Upgrade Necessario' : 'Considerar Upgrade'}
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-[#159A9C]" />
            Uso dos Recursos - {assinatura.plano.nome}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {metrics.map((metric) => (
              <div key={metric.id} className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="text-[#6E8997]">{metric.icon}</div>
                    <span className="font-medium text-[#244455]">{metric.label}</span>
                  </div>
                  {getStatusIcon(metric)}
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>
                      {metric.current.toLocaleString('pt-BR')} {metric.unit}
                    </span>
                    <span className="text-[#6E8997]">de {metric.limitLabel}</span>
                  </div>

                  <div className="relative">
                    <Progress value={metric.percentage} className="h-3" />
                    <div
                      className={`absolute left-0 top-0 h-3 rounded-full transition-all ${getProgressColor(metric)}`}
                      style={{ width: `${Math.min(metric.percentage, 100)}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <span className={`text-sm font-medium ${getStatusColor(metric)}`}>
                      {getPercentualLabel(metric)}
                    </span>

                    {!metric.isUnlimited && metric.percentage >= 95 && (
                      <Badge variant="destructive" className="text-xs">
                        Limite Atingido
                      </Badge>
                    )}
                    {!metric.isUnlimited && metric.percentage >= 80 && metric.percentage < 95 && (
                      <Badge
                        variant="outline"
                        className="border-yellow-300 text-xs text-yellow-700"
                      >
                        Proximo do Limite
                      </Badge>
                    )}
                  </div>
                </div>

                {metric.id === 'api' && (
                  <div className="border-t border-[#DEEFE7] pt-2 text-xs text-[#6E8997]">
                    Reset diario as 00:00
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {(hasCritical || hasWarnings) && !isOwnerTenant && (
        <Card
          className={hasCritical ? 'border-red-200 bg-red-50' : 'border-yellow-200 bg-yellow-50'}
        >
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              {hasCritical ? (
                <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-600" />
              ) : (
                <Info className="mt-0.5 h-5 w-5 flex-shrink-0 text-yellow-600" />
              )}

              <div className="flex-1">
                <h4 className={`font-medium ${hasCritical ? 'text-red-800' : 'text-yellow-800'}`}>
                  {hasCritical ? 'Acao Necessaria' : 'Recomendacao'}
                </h4>

                <p className={`mt-1 text-sm ${hasCritical ? 'text-red-700' : 'text-yellow-700'}`}>
                  {hasCritical
                    ? 'Voce atingiu o limite de alguns recursos. Faca upgrade para continuar usando todas as funcionalidades.'
                    : 'Voce esta proximo do limite de alguns recursos. Considere fazer upgrade para evitar interrupcoes.'}
                </p>

                {onUpgrade && (
                  <Button
                    onClick={onUpgrade}
                    size="sm"
                    disabled={!podeAlterarPlano}
                    className={`mt-3 ${hasCritical ? 'bg-red-600 hover:bg-red-700' : 'bg-[#159A9C] hover:bg-[#0F7B7D]'}`}
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
