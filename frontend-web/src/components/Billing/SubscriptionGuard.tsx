import React from 'react';
import { useSubscription } from '../../hooks/useSubscription';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import {
  Lock,
  Crown,
  AlertTriangle,
  Loader2
} from 'lucide-react';

interface SubscriptionGuardProps {
  children: React.ReactNode;
  requiredModule?: string;
  fallback?: React.ReactNode;
  onUpgrade?: () => void;
}

export const SubscriptionGuard: React.FC<SubscriptionGuardProps> = ({
  children,
  requiredModule,
  fallback,
  onUpgrade
}) => {
  const {
    assinatura,
    loading,
    error,
    temAcessoModulo,
    temAssinatura,
    assinaturaAtiva,
    getStatusInfo
  } = useSubscription();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Verificando assinatura...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200">
        <CardContent className="pt-6">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-red-800 mb-2">Erro de Verificação</h3>
            <p className="text-red-600 mb-4">{error}</p>
            <Button variant="outline" onClick={() => window.location.reload()}>
              Tentar Novamente
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Sem assinatura
  if (!temAssinatura) {
    return fallback || (
      <Card className="border-yellow-200 bg-yellow-50">
        <CardContent className="pt-6">
          <div className="text-center">
            <Crown className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-yellow-800 mb-2">
              Assinatura Necessária
            </h3>
            <p className="text-yellow-700 mb-6">
              Para acessar esta funcionalidade, você precisa de uma assinatura ativa.
            </p>
            <Button
              onClick={onUpgrade || (() => window.location.href = '/billing')}
              className="bg-yellow-600 hover:bg-yellow-700"
            >
              <Crown className="h-4 w-4 mr-2" />
              Escolher Plano
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Assinatura inativa
  if (!assinaturaAtiva) {
    const statusInfo = getStatusInfo();

    return fallback || (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="pt-6">
          <div className="text-center">
            <Lock className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-red-800 mb-2">
              Assinatura {statusInfo.texto}
            </h3>
            <p className="text-red-700 mb-6">
              {statusInfo.descricao}
            </p>
            <Button
              onClick={onUpgrade || (() => window.location.href = '/billing')}
              className="bg-red-600 hover:bg-red-700"
            >
              Reativar Assinatura
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Verificar módulo específico
  if (requiredModule && !temAcessoModulo(requiredModule)) {
    const moduleName = requiredModule.charAt(0).toUpperCase() + requiredModule.slice(1);

    return fallback || (
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="pt-6">
          <div className="text-center">
            <Lock className="h-16 w-16 text-blue-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-blue-800 mb-2">
              Módulo {moduleName} Não Incluído
            </h3>
            <p className="text-blue-700 mb-2">
              Este módulo não está incluído no seu plano atual.
            </p>
            <p className="text-sm text-blue-600 mb-6">
              Plano Atual: <strong>{assinatura?.plano.nome}</strong>
            </p>
            <Button
              onClick={onUpgrade || (() => window.location.href = '/billing?tab=plans')}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Crown className="h-4 w-4 mr-2" />
              Fazer Upgrade
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Tudo OK, renderizar conteúdo
  return <>{children}</>;
};

// Hook para usar o guard programaticamente
export const useSubscriptionGuard = () => {
  const subscription = useSubscription();

  const checkAccess = (requiredModule?: string): {
    hasAccess: boolean;
    reason?: 'no-subscription' | 'inactive-subscription' | 'module-not-included';
    message?: string;
  } => {
    if (!subscription.temAssinatura) {
      return {
        hasAccess: false,
        reason: 'no-subscription',
        message: 'Assinatura necessária para acessar esta funcionalidade'
      };
    }

    if (!subscription.assinaturaAtiva) {
      return {
        hasAccess: false,
        reason: 'inactive-subscription',
        message: 'Assinatura inativa'
      };
    }

    if (requiredModule && !subscription.temAcessoModulo(requiredModule)) {
      return {
        hasAccess: false,
        reason: 'module-not-included',
        message: `Módulo ${requiredModule} não incluído no plano atual`
      };
    }

    return { hasAccess: true };
  };

  const requiresUpgrade = (requiredModule?: string): boolean => {
    const access = checkAccess(requiredModule);
    return !access.hasAccess;
  };

  return {
    ...subscription,
    checkAccess,
    requiresUpgrade
  };
};
