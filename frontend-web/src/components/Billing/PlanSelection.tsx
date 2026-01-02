import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Check, Crown, Users, UserCheck, Database, Zap, Star, Sparkles } from 'lucide-react';
import { useSubscription, Plano } from '../../hooks/useSubscription';
import { formatCurrency } from '../../utils/formatters';

interface PlanSelectionProps {
  onPlanSelect?: (plano: Plano) => void;
  onClose?: () => void;
  showCurrentPlan?: boolean;
}

export const PlanSelection: React.FC<PlanSelectionProps> = ({
  onPlanSelect,
  onClose,
  showCurrentPlan = true,
}) => {
  const { planos, assinatura, loading, alterarPlano } = useSubscription();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [isChangingPlan, setIsChangingPlan] = useState(false);

  const handlePlanSelect = async (plano: Plano) => {
    if (assinatura && plano.id !== assinatura.plano.id) {
      setIsChangingPlan(true);
      try {
        await alterarPlano(plano.id);
        onPlanSelect?.(plano);
      } catch (error) {
        console.error('Erro ao alterar plano:', error);
      } finally {
        setIsChangingPlan(false);
      }
    } else {
      onPlanSelect?.(plano);
    }
  };

  const getPlanIcon = (codigo: string) => {
    switch (codigo) {
      case 'starter':
        return <Users className="h-8 w-8" />;
      case 'professional':
        return <Star className="h-8 w-8" />;
      case 'enterprise':
        return <Crown className="h-8 w-8" />;
      default:
        return <Sparkles className="h-8 w-8" />;
    }
  };

  const getPlanColor = (codigo: string) => {
    switch (codigo) {
      case 'starter':
        return 'text-green-600';
      case 'professional':
        return 'text-blue-600';
      case 'enterprise':
        return 'text-purple-600';
      default:
        return 'text-gray-600';
    }
  };

  const getPlanBorderColor = (codigo: string) => {
    switch (codigo) {
      case 'starter':
        return 'border-green-200';
      case 'professional':
        return 'border-blue-200';
      case 'enterprise':
        return 'border-purple-200';
      default:
        return 'border-gray-200';
    }
  };

  const isCurrentPlan = (planoId: string) => {
    return assinatura?.plano.id === planoId;
  };

  const getRecommendedPlan = () => {
    // Lógica para recomendar plano baseado no uso atual
    return 'professional'; // Por exemplo
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Carregando planos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900">Escolha o Plano Ideal</h2>
        <p className="mt-4 text-lg text-gray-600">Planos flexíveis que crescem com sua empresa</p>
      </div>

      {/* Planos */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
        {planos.map((plano) => {
          const isRecommended = plano.codigo === getRecommendedPlan();
          const isCurrent = isCurrentPlan(plano.id);

          return (
            <Card
              key={plano.id}
              className={`
                relative overflow-hidden transition-all duration-200 hover:shadow-lg
                ${getPlanBorderColor(plano.codigo)}
                ${isRecommended ? 'ring-2 ring-blue-500 ring-opacity-50' : ''}
                ${isCurrent ? 'ring-2 ring-green-500' : ''}
              `}
            >
              {/* Badge de Recomendado */}
              {isRecommended && (
                <div className="absolute top-0 right-0 bg-blue-500 text-white px-3 py-1 text-xs font-medium rounded-bl-lg">
                  Recomendado
                </div>
              )}

              {/* Badge de Plano Atual */}
              {isCurrent && showCurrentPlan && (
                <div className="absolute top-0 left-0 bg-green-500 text-white px-3 py-1 text-xs font-medium rounded-br-lg">
                  Plano Atual
                </div>
              )}

              <CardHeader className="text-center">
                <div className={`mx-auto mb-4 ${getPlanColor(plano.codigo)}`}>
                  {getPlanIcon(plano.codigo)}
                </div>

                <CardTitle className="text-xl">{plano.nome}</CardTitle>

                <div className="mt-4">
                  <span className="text-4xl font-bold text-gray-900">
                    {formatCurrency(plano.preco)}
                  </span>
                  <span className="text-gray-600">/mês</span>
                </div>

                {plano.descricao && <p className="mt-2 text-sm text-gray-600">{plano.descricao}</p>}
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Recursos do Plano */}
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Users className="h-4 w-4 text-gray-400" />
                    <span className="text-sm">{plano.limiteUsuarios} usuários</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <UserCheck className="h-4 w-4 text-gray-400" />
                    <span className="text-sm">
                      {plano.limiteClientes.toLocaleString()} clientes
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <Database className="h-4 w-4 text-gray-400" />
                    <span className="text-sm">
                      {Math.round(plano.limiteStorage / (1024 * 1024 * 1024))} GB de armazenamento
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <Zap className="h-4 w-4 text-gray-400" />
                    <span className="text-sm">
                      {plano.limiteApiCalls.toLocaleString()} API calls/dia
                    </span>
                  </div>
                </div>

                {/* Recursos Especiais */}
                <div className="border-t pt-4 space-y-2">
                  {plano.permiteApi && (
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />
                      <span className="text-sm">API completa</span>
                    </div>
                  )}

                  {plano.permiteIntegracao && (
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />
                      <span className="text-sm">Integrações</span>
                    </div>
                  )}

                  {plano.permiteWhitelabel && (
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />
                      <span className="text-sm">White-label</span>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Suporte {plano.suportePrioridade}</span>
                  </div>
                </div>

                {/* Módulos Inclusos */}
                {plano.modulosInclusos && plano.modulosInclusos.length > 0 && (
                  <div className="border-t pt-4">
                    <h4 className="text-sm font-medium mb-2">Módulos inclusos:</h4>
                    <div className="flex flex-wrap gap-1">
                      {plano.modulosInclusos.slice(0, 4).map((modulo) => (
                        <Badge key={modulo.id} variant="outline" className="text-xs">
                          {modulo.nome}
                        </Badge>
                      ))}
                      {plano.modulosInclusos.length > 4 && (
                        <Badge variant="outline" className="text-xs">
                          +{plano.modulosInclusos.length - 4} mais
                        </Badge>
                      )}
                    </div>
                  </div>
                )}

                {/* Botão de Ação */}
                <Button
                  onClick={() => handlePlanSelect(plano)}
                  disabled={isCurrent || isChangingPlan}
                  className={`
                    w-full mt-6 
                    ${isCurrent ? 'bg-green-600 hover:bg-green-700' : ''}
                    ${plano.codigo === 'professional' ? 'bg-blue-600 hover:bg-blue-700' : ''}
                    ${plano.codigo === 'enterprise' ? 'bg-purple-600 hover:bg-purple-700' : ''}
                  `}
                  size="lg"
                >
                  {isCurrent
                    ? 'Plano Atual'
                    : assinatura
                      ? 'Alterar para este Plano'
                      : 'Escolher este Plano'}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Comparação Rápida */}
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-center">Comparação Rápida</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Recurso</th>
                    {planos.map((plano) => (
                      <th key={plano.id} className="text-center py-2">
                        {plano.nome}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="space-y-2">
                  <tr className="border-b">
                    <td className="py-2">Usuários</td>
                    {planos.map((plano) => (
                      <td key={plano.id} className="text-center py-2">
                        {plano.limiteUsuarios}
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b">
                    <td className="py-2">Clientes</td>
                    {planos.map((plano) => (
                      <td key={plano.id} className="text-center py-2">
                        {plano.limiteClientes.toLocaleString()}
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b">
                    <td className="py-2">Storage</td>
                    {planos.map((plano) => (
                      <td key={plano.id} className="text-center py-2">
                        {Math.round(plano.limiteStorage / (1024 * 1024 * 1024))} GB
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-2">White-label</td>
                    {planos.map((plano) => (
                      <td key={plano.id} className="text-center py-2">
                        {plano.permiteWhitelabel ? '✓' : '—'}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Botões de Ação */}
      {onClose && (
        <div className="text-center">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
        </div>
      )}
    </div>
  );
};
