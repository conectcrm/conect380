import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Check, Crown, Users, UserCheck, Database, Zap, Star, Sparkles } from 'lucide-react';
import { useSubscription, Plano } from '../../hooks/useSubscription';
import { formatCurrency } from '../../utils/formatters';

interface PlanSelectionProps {
  onPlanSelect?: (plano: Plano, context: { requiresPayment: boolean }) => void;
  onClose?: () => void;
  showCurrentPlan?: boolean;
}

const ONE_GB = 1024 * 1024 * 1024;
const ONE_MB = 1024 * 1024;

export const PlanSelection: React.FC<PlanSelectionProps> = ({
  onPlanSelect,
  onClose,
  showCurrentPlan = true,
}) => {
  const { planos, assinatura, loading, alterarPlano } = useSubscription();
  const [isChangingPlan, setIsChangingPlan] = useState(false);

  const handlePlanSelect = async (plano: Plano) => {
    if (assinatura && plano.id !== assinatura.plano.id) {
      setIsChangingPlan(true);
      try {
        await alterarPlano(plano.id);
        onPlanSelect?.(plano, { requiresPayment: false });
      } catch (error) {
        console.error('Erro ao alterar plano:', error);
      } finally {
        setIsChangingPlan(false);
      }
      return;
    }

    onPlanSelect?.(plano, { requiresPayment: !assinatura });
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
      case 'professional':
      case 'enterprise':
        return 'text-[#159A9C]';
      default:
        return 'text-[#385A6A]';
    }
  };

  const getPlanBorderColor = (codigo: string) => {
    switch (codigo) {
      case 'starter':
      case 'professional':
      case 'enterprise':
      default:
        return 'border-[#DEEFE7]';
    }
  };

  const isCurrentPlan = (planoId: string) => assinatura?.plano.id === planoId;

  const planoTemModulo = (plano: Plano, ...codigos: string[]) => {
    const codigosPlano = (plano.modulosInclusos || []).map((modulo) =>
      String(modulo.codigo || '').toUpperCase(),
    );

    return codigos.some((codigo) => codigosPlano.includes(codigo.toUpperCase()));
  };

  const getStorageLabel = (limiteStorage: number) => {
    if (limiteStorage < 0) {
      return 'Ilimitado';
    }

    if (limiteStorage >= ONE_GB) {
      const gb = limiteStorage / ONE_GB;
      return `${gb.toLocaleString('pt-BR', {
        minimumFractionDigits: Number.isInteger(gb) ? 0 : 1,
        maximumFractionDigits: 1,
      })} GB`;
    }

    const mb = Math.max(1, Math.round(limiteStorage / ONE_MB));
    return `${mb.toLocaleString('pt-BR')} MB`;
  };

  const formatLimit = (limit: number): string => {
    if (limit < 0) {
      return 'Ilimitado';
    }

    return limit.toLocaleString('pt-BR');
  };

  const getRecommendedPlan = () => {
    const prioritizedPlan = planos.find((plano) => plano.codigo === 'professional');
    if (prioritizedPlan) {
      return prioritizedPlan.codigo;
    }

    if (planos.length === 0) {
      return '';
    }

    const middleIndex = Math.floor(planos.length / 2);
    return planos[middleIndex]?.codigo || planos[0].codigo;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#159A9C] mx-auto"></div>
          <p className="mt-2 text-[#385A6A]">Carregando planos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-[#002333]">Escolha o Plano Ideal</h2>
        <p className="mt-4 text-lg text-[#385A6A]">Planos flexiveis que crescem com sua empresa</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
        {planos.map((plano) => {
          const isRecommended = plano.codigo === getRecommendedPlan();
          const isCurrent = isCurrentPlan(plano.id);

          return (
            <Card
              key={plano.id}
              className={`
                relative overflow-hidden transition-all duration-200 hover:shadow-md
                ${getPlanBorderColor(plano.codigo)}
                ${isRecommended ? 'ring-2 ring-[#159A9C] ring-opacity-40' : ''}
                ${isCurrent ? 'ring-2 ring-green-500' : ''}
              `}
            >
              {isRecommended && (
                <div className="absolute top-0 right-0 bg-[#159A9C] text-white px-3 py-1 text-xs font-medium rounded-bl-lg">
                  Recomendado
                </div>
              )}

              {isCurrent && showCurrentPlan && (
                <div className="absolute top-0 left-0 bg-green-500 text-white px-3 py-1 text-xs font-medium rounded-br-lg">
                  Plano Atual
                </div>
              )}

              <CardHeader className="text-center">
                <div className={`mx-auto mb-4 ${getPlanColor(plano.codigo)}`}>{getPlanIcon(plano.codigo)}</div>

                <CardTitle className="text-xl text-[#002333]">{plano.nome}</CardTitle>

                <div className="mt-4">
                  <span className="text-4xl font-bold text-[#002333]">{formatCurrency(plano.preco)}</span>
                  <span className="text-[#385A6A]">/mes</span>
                </div>

                {plano.descricao && <p className="mt-2 text-sm text-[#385A6A]">{plano.descricao}</p>}
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Users className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-[#244455]">
                      {formatLimit(plano.limiteUsuarios)} usuarios
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <UserCheck className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-[#244455]">
                      {formatLimit(plano.limiteClientes)} clientes
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <Database className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-[#244455]">{getStorageLabel(plano.limiteStorage)} de armazenamento</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <Zap className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-[#244455]">
                      {formatLimit(plano.limiteApiCalls)} API calls/hora
                    </span>
                  </div>
                </div>

                <div className="border-t pt-4 space-y-2">
                  {planoTemModulo(plano, 'API', 'INTEGRACOES', 'INTEGRACOES_EXTERNAS') && (
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />
                      <span className="text-sm text-[#244455]">API completa</span>
                    </div>
                  )}

                  {planoTemModulo(plano, 'INTEGRACOES', 'INTEGRACOES_EXTERNAS') && (
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />
                      <span className="text-sm text-[#244455]">Integracoes</span>
                    </div>
                  )}

                  {plano.whiteLabel && (
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />
                      <span className="text-sm text-[#244455]">White-label</span>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    <span className="text-sm text-[#244455]">
                      Suporte {plano.suportePrioritario ? 'prioritario' : 'padrao'}
                    </span>
                  </div>
                </div>

                {plano.modulosInclusos && plano.modulosInclusos.length > 0 && (
                  <div className="border-t pt-4">
                    <h4 className="text-sm font-medium mb-2">Modulos inclusos:</h4>
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

                <Button
                  onClick={() => handlePlanSelect(plano)}
                  disabled={isCurrent || isChangingPlan}
                  className={`
                    w-full mt-6
                    ${isCurrent ? 'bg-green-600 hover:bg-green-700' : ''}
                    ${!isCurrent ? 'bg-[#159A9C] hover:bg-[#0F7B7D]' : ''}
                  `}
                  size="lg"
                >
                  {isCurrent ? 'Plano Atual' : assinatura ? 'Alterar para este Plano' : 'Escolher este Plano'}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-center">Comparacao Rapida</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="min-w-[640px] w-full text-sm">
                <thead>
                  <tr className="border-b border-[#DEEFE7]">
                    <th className="py-2 text-left text-[#385A6A] whitespace-nowrap">Recurso</th>
                    {planos.map((plano) => (
                      <th key={plano.id} className="py-2 text-center text-[#385A6A] whitespace-nowrap">
                        {plano.nome}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="space-y-2">
                  <tr className="border-b border-[#DEEFE7]">
                    <td className="py-2 text-[#244455] whitespace-nowrap">Usuarios</td>
                    {planos.map((plano) => (
                      <td key={plano.id} className="py-2 text-center text-[#244455] whitespace-nowrap">
                        {formatLimit(plano.limiteUsuarios)}
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b border-[#DEEFE7]">
                    <td className="py-2 text-[#244455] whitespace-nowrap">Clientes</td>
                    {planos.map((plano) => (
                      <td key={plano.id} className="py-2 text-center text-[#244455] whitespace-nowrap">
                        {formatLimit(plano.limiteClientes)}
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b border-[#DEEFE7]">
                    <td className="py-2 text-[#244455] whitespace-nowrap">Storage</td>
                    {planos.map((plano) => (
                      <td key={plano.id} className="py-2 text-center text-[#244455] whitespace-nowrap">
                        {getStorageLabel(plano.limiteStorage)}
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b border-[#DEEFE7]">
                    <td className="py-2 text-[#244455] whitespace-nowrap">API calls/hora</td>
                    {planos.map((plano) => (
                      <td key={plano.id} className="py-2 text-center text-[#244455] whitespace-nowrap">
                        {formatLimit(plano.limiteApiCalls)}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-2 text-[#244455] whitespace-nowrap">White-label</td>
                    {planos.map((plano) => (
                      <td key={plano.id} className="py-2 text-center text-[#244455] whitespace-nowrap">
                        {plano.whiteLabel ? 'Sim' : '--'}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

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
