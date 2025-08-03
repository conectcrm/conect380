import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import {
  Crown,
  X,
  Check,
  TrendingUp,
  Users,
  UserCheck,
  Database,
  Zap
} from 'lucide-react';
import { useSubscription, Plano } from '../../hooks/useSubscription';
import { formatCurrency } from '../../utils/formatters';

interface UpgradePromptProps {
  module?: string;
  reason?: 'limit-reached' | 'module-not-included' | 'feature-premium';
  onUpgrade?: (plano: Plano) => void;
  onDismiss?: () => void;
  compact?: boolean;
}

export const UpgradePrompt: React.FC<UpgradePromptProps> = ({
  module,
  reason = 'feature-premium',
  onUpgrade,
  onDismiss,
  compact = false
}) => {
  const { planos, assinatura, alterarPlano } = useSubscription();
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  const getRecommendedPlans = (): Plano[] => {
    if (!assinatura) return planos;

    // Sugerir planos superiores ao atual
    const currentPlanIndex = planos.findIndex(p => p.id === assinatura.plano.id);
    return planos.slice(currentPlanIndex + 1);
  };

  const handleUpgrade = async (plano: Plano) => {
    if (!assinatura) {
      onUpgrade?.(plano);
      return;
    }

    setIsUpgrading(true);
    setSelectedPlan(plano.id);

    try {
      await alterarPlano(plano.id);
      onUpgrade?.(plano);
    } catch (error) {
      console.error('Erro ao fazer upgrade:', error);
    } finally {
      setIsUpgrading(false);
      setSelectedPlan(null);
    }
  };

  const getPromptContent = () => {
    switch (reason) {
      case 'limit-reached':
        return {
          title: 'Limite Atingido',
          description: 'Você atingiu o limite do seu plano atual. Faça upgrade para continuar.',
          icon: <TrendingUp className="h-8 w-8 text-orange-500" />,
          color: 'orange'
        };

      case 'module-not-included':
        return {
          title: `Módulo ${module || 'Premium'} Não Incluído`,
          description: 'Este módulo não está disponível no seu plano atual.',
          icon: <Crown className="h-8 w-8 text-blue-500" />,
          color: 'blue'
        };

      default:
        return {
          title: 'Recurso Premium',
          description: 'Este recurso está disponível apenas nos planos superiores.',
          icon: <Crown className="h-8 w-8 text-purple-500" />,
          color: 'purple'
        };
    }
  };

  const content = getPromptContent();
  const recommendedPlans = getRecommendedPlans();

  if (compact) {
    return (
      <Card className={`border-${content.color}-200 bg-${content.color}-50`}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {content.icon}
              <div>
                <h4 className={`font-medium text-${content.color}-800`}>
                  {content.title}
                </h4>
                <p className={`text-sm text-${content.color}-700`}>
                  {content.description}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {recommendedPlans.length > 0 && (
                <Button
                  size="sm"
                  onClick={() => handleUpgrade(recommendedPlans[0])}
                  disabled={isUpgrading}
                  className={`bg-${content.color}-600 hover:bg-${content.color}-700`}
                >
                  Upgrade
                </Button>
              )}

              {onDismiss && (
                <Button variant="ghost" size="sm" onClick={onDismiss}>
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`border-${content.color}-200`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-3">
            {content.icon}
            {content.title}
          </CardTitle>
          {onDismiss && (
            <Button variant="ghost" size="sm" onClick={onDismiss}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        <p className="text-gray-600">{content.description}</p>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Plano Atual */}
        {assinatura && (
          <div className="p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium mb-2">Plano Atual</h4>
            <div className="flex items-center justify-between">
              <div>
                <span className="text-lg font-semibold">{assinatura.plano.nome}</span>
                <span className="text-gray-500 ml-2">
                  {formatCurrency(assinatura.plano.preco)}/mês
                </span>
              </div>
              <Badge variant="outline">Atual</Badge>
            </div>
          </div>
        )}

        {/* Planos Recomendados */}
        <div className="space-y-4">
          <h4 className="font-medium">Planos Recomendados</h4>

          {recommendedPlans.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              Você já possui o plano mais avançado disponível.
            </p>
          ) : (
            <div className="grid gap-4">
              {recommendedPlans.map((plano) => (
                <div
                  key={plano.id}
                  className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h5 className="font-semibold text-lg">{plano.nome}</h5>
                      <div className="flex items-center gap-2">
                        <span className="text-2xl font-bold text-blue-600">
                          {formatCurrency(plano.preco)}
                        </span>
                        <span className="text-gray-500">/mês</span>
                      </div>
                    </div>

                    <Button
                      onClick={() => handleUpgrade(plano)}
                      disabled={isUpgrading}
                      className={`
                        ${selectedPlan === plano.id && isUpgrading ? 'opacity-50' : ''}
                        bg-blue-600 hover:bg-blue-700
                      `}
                    >
                      {selectedPlan === plano.id && isUpgrading ? 'Upgrading...' : 'Escolher'}
                    </Button>
                  </div>

                  {plano.descricao && (
                    <p className="text-gray-600 text-sm mb-3">{plano.descricao}</p>
                  )}

                  {/* Comparação de Recursos */}
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-gray-400" />
                      <span>{plano.limiteUsuarios} usuários</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <UserCheck className="h-4 w-4 text-gray-400" />
                      <span>{plano.limiteClientes.toLocaleString()} clientes</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Database className="h-4 w-4 text-gray-400" />
                      <span>{Math.round(plano.limiteStorage / (1024 * 1024 * 1024))} GB</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Zap className="h-4 w-4 text-gray-400" />
                      <span>{plano.limiteApiCalls.toLocaleString()} API calls</span>
                    </div>
                  </div>

                  {/* Recursos Especiais */}
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <div className="flex flex-wrap gap-2">
                      {plano.permiteWhitelabel && (
                        <div className="flex items-center gap-1">
                          <Check className="h-3 w-3 text-green-500" />
                          <span className="text-xs text-gray-600">White-label</span>
                        </div>
                      )}
                      {plano.permiteApi && (
                        <div className="flex items-center gap-1">
                          <Check className="h-3 w-3 text-green-500" />
                          <span className="text-xs text-gray-600">API completa</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <Check className="h-3 w-3 text-green-500" />
                        <span className="text-xs text-gray-600">
                          Suporte {plano.suportePrioridade}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Call to Action */}
        <div className="text-center pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-600 mb-3">
            Precisa de ajuda para escolher? Fale com nossa equipe.
          </p>
          <Button variant="outline" size="sm">
            Falar com Consultor
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
