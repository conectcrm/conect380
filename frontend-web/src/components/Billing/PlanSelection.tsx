import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { AlertCircle, Check, Crown, Users, UserCheck, Database, Zap, Star, Sparkles } from 'lucide-react';
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
  const { planos, assinatura, loading, alterarPlano, isOwnerTenant, podeAlterarPlano } =
    useSubscription();
  const [isChangingPlan, setIsChangingPlan] = useState(false);
  const planActionsLocked = isOwnerTenant || !podeAlterarPlano;

  const handlePlanSelect = async (plano: Plano) => {
    if (planActionsLocked) {
      return;
    }

    const assinaturaRequerCheckout =
      assinatura?.status === 'trial' || assinatura?.status === 'canceled';
    if (!assinatura || assinaturaRequerCheckout) {
      onPlanSelect?.(plano, { requiresPayment: true });
      return;
    }

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

    onPlanSelect?.(plano, { requiresPayment: false });
  };

  const getPlanIcon = (codigo: string) => {
    switch (codigo) {
      case 'starter':
        return <Users className="h-8 w-8" />;
      case 'business':
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
      case 'business':
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
      case 'business':
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

  const getPlanPositioning = (codigo: string): string => {
    switch (codigo) {
      case 'starter':
        return 'Operacao inicial com foco em estrutura comercial essencial.';
      case 'business':
      case 'professional':
        return 'Escala de vendas com processos integrados entre equipes.';
      case 'enterprise':
        return 'Governanca, seguranca e operacao multiequipe de alta complexidade.';
      default:
        return 'Plano flexivel para evoluir com a sua operacao.';
    }
  };

  const getPlanValuePillars = (plano: Plano): string[] => {
    const pilares: string[] = [];

    if (planoTemModulo(plano, 'CRM')) {
      pilares.push('CRM e relacionamento');
    }
    if (planoTemModulo(plano, 'ATENDIMENTO')) {
      pilares.push('Atendimento omnichannel');
    }
    if (planoTemModulo(plano, 'VENDAS')) {
      pilares.push('Pipeline e propostas');
    }
    if (planoTemModulo(plano, 'FINANCEIRO')) {
      pilares.push('Financeiro integrado');
    }
    if (planoTemModulo(plano, 'BILLING')) {
      pilares.push('Gestao de assinaturas');
    }
    if (planoTemModulo(plano, 'ADMINISTRACAO')) {
      pilares.push('Governanca avancada');
    }

    if (plano.whiteLabel) {
      pilares.push('White-label');
    }

    pilares.push(plano.suportePrioritario ? 'Suporte prioritario' : 'Suporte padrao');

    return Array.from(new Set(pilares)).slice(0, 4);
  };

  const getPlanModulesSummary = (plano: Plano): string => {
    const nomes = (plano.modulosInclusos || [])
      .map((modulo) => String(modulo.nome || '').trim())
      .filter(Boolean);

    if (nomes.length === 0) {
      return '--';
    }

    const principais = nomes.slice(0, 3).join(', ');
    return nomes.length > 3 ? `${principais} +${nomes.length - 3}` : principais;
  };

  const getRecommendedPlan = () => {
    const prioritizedPlan = planos.find(
      (plano) => plano.codigo === 'business' || plano.codigo === 'professional',
    );
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
      {planActionsLocked && (
        <div className="mx-auto flex max-w-4xl items-start gap-3 rounded-lg border border-[#F4D7A1] bg-[#FFF8E8] p-4 text-sm text-[#7A4D0E]">
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <span>
            Tenant proprietario com politica interna: checkout e alteracoes de plano ficam
            desabilitados neste ambiente.
          </span>
        </div>
      )}

      <div className="text-center">
        <h2 className="text-3xl font-bold text-[#002333]">Escolha o Plano Ideal</h2>
        <p className="mt-4 text-lg text-[#385A6A]">Planos flexiveis que crescem com sua empresa</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
        {planos.map((plano) => {
          const isRecommended = plano.codigo === getRecommendedPlan();
          const isCurrent = isCurrentPlan(plano.id);
          const assinaturaRequerCheckout =
            assinatura?.status === 'trial' || assinatura?.status === 'canceled';
          const buttonDisabled =
            (isCurrent && !assinaturaRequerCheckout) || isChangingPlan || planActionsLocked;

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
                <div className="rounded-lg border border-[#DEEFE7] bg-[#F6FAF9] p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#5A7582]">
                    Perfil recomendado
                  </p>
                  <p className="mt-1 text-sm text-[#244455]">{getPlanPositioning(plano.codigo)}</p>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-[#244455]">Beneficios principais:</h4>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {getPlanValuePillars(plano).map((pilar) => (
                      <span
                        key={pilar}
                        className="rounded-full border border-[#D4E2E7] bg-white px-2 py-1 text-xs text-[#244455]"
                      >
                        {pilar}
                      </span>
                    ))}
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

                <details className="rounded-lg border border-[#DEEFE7] bg-white p-3">
                  <summary className="cursor-pointer text-sm font-medium text-[#244455]">
                    Detalhes tecnicos de capacidade
                  </summary>
                  <div className="mt-3 space-y-2">
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
                      <span className="text-sm text-[#244455]">
                        {getStorageLabel(plano.limiteStorage)} de armazenamento
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <Zap className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-[#244455]">
                        {formatLimit(plano.limiteApiCalls)} API calls/dia
                      </span>
                    </div>
                  </div>
                </details>

                <Button
                  onClick={() => handlePlanSelect(plano)}
                  disabled={buttonDisabled}
                  className={`
                    w-full mt-6
                    ${isCurrent ? 'bg-green-600 hover:bg-green-700' : ''}
                    ${!isCurrent ? 'bg-[#159A9C] hover:bg-[#0F7B7D]' : ''}
                  `}
                  size="lg"
                >
                  {planActionsLocked
                    ? 'Gerenciado internamente'
                    : isCurrent
                      ? assinaturaRequerCheckout
                        ? 'Finalizar assinatura'
                        : 'Plano Atual'
                      : assinatura
                        ? assinaturaRequerCheckout
                          ? 'Escolher e pagar'
                          : 'Alterar para este Plano'
                        : 'Escolher este Plano'}
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
                    <td className="py-2 text-[#244455] whitespace-nowrap">Perfil recomendado</td>
                    {planos.map((plano) => (
                      <td key={plano.id} className="py-2 text-center text-[#244455] whitespace-nowrap">
                        {getPlanPositioning(plano.codigo)}
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b border-[#DEEFE7]">
                    <td className="py-2 text-[#244455] whitespace-nowrap">Beneficios-chave</td>
                    {planos.map((plano) => (
                      <td key={plano.id} className="py-2 text-center text-[#244455] whitespace-nowrap">
                        {getPlanValuePillars(plano).join(' • ')}
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b border-[#DEEFE7]">
                    <td className="py-2 text-[#244455] whitespace-nowrap">Modulos principais</td>
                    {planos.map((plano) => (
                      <td key={plano.id} className="py-2 text-center text-[#244455] whitespace-nowrap">
                        {getPlanModulesSummary(plano)}
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b border-[#DEEFE7]">
                    <td className="py-2 text-[#244455] whitespace-nowrap">Suporte</td>
                    {planos.map((plano) => (
                      <td key={plano.id} className="py-2 text-center text-[#244455] whitespace-nowrap">
                        {plano.suportePrioritario ? 'Prioritario' : 'Padrao'}
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b border-[#DEEFE7]">
                    <td className="py-2 text-[#244455] whitespace-nowrap">White-label</td>
                    {planos.map((plano) => (
                      <td key={plano.id} className="py-2 text-center text-[#244455] whitespace-nowrap">
                        {plano.whiteLabel ? 'Sim' : '--'}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-2 text-[#244455] whitespace-nowrap">Capacidade tecnica</td>
                    {planos.map((plano) => (
                      <td key={plano.id} className="py-2 text-center text-[#5A7582] whitespace-nowrap">
                        Usuarios {formatLimit(plano.limiteUsuarios)} | Clientes{' '}
                        {formatLimit(plano.limiteClientes)}
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
