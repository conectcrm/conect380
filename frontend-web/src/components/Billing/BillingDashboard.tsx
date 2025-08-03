import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Progress } from '../ui/progress';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import {
  Users,
  UserCheck,
  Database,
  Zap,
  CreditCard,
  AlertTriangle,
  CheckCircle,
  Crown,
  Calendar,
  Settings
} from 'lucide-react';
import { useSubscription } from '../../hooks/useSubscription';
import { formatCurrency } from '../../utils/formatters';
import { AdminDashboard } from './Admin/AdminDashboard';

interface BillingDashboardProps {
  onUpgrade?: () => void;
  onManageBilling?: () => void;
}

export const BillingDashboard: React.FC<BillingDashboardProps> = ({
  onUpgrade,
  onManageBilling
}) => {
  const [showAdmin, setShowAdmin] = useState(false);
  const {
    assinatura,
    limites,
    loading,
    error,
    calcularProgresso,
    getStatusInfo,
    assinaturaAtiva
  } = useSubscription();

  // TODO: Implementar verificação de permissão de administrador
  // Por enquanto, vamos mostrar para todos os usuários para teste
  const isAdmin = true; // Substituir pela lógica real de verificação

  if (showAdmin) {
    return <AdminDashboard onBack={() => setShowAdmin(false)} />;
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
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
            <p className="text-red-600">{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!assinatura) {
    return (
      <Card className="border-yellow-200">
        <CardContent className="pt-6">
          <div className="text-center">
            <Crown className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Bem-vindo ao ConectCRM!</h3>
            <p className="text-gray-600 mb-6">
              Para começar a usar todas as funcionalidades, escolha um plano que se adeque às suas necessidades.
            </p>
            <Button onClick={onUpgrade} size="lg" className="bg-blue-600 hover:bg-blue-700">
              <Crown className="h-4 w-4 mr-2" />
              Escolher Plano
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const statusInfo = getStatusInfo();
  const progresso = calcularProgresso();
  const proximoVencimento = new Date(assinatura.proximoVencimento);
  const diasParaVencimento = Math.ceil((proximoVencimento.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

  return (
    <div className="space-y-6">
      {/* Header com Status da Assinatura */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Billing & Assinatura</h1>
          <p className="text-gray-600">Gerencie sua assinatura e monitore o uso dos recursos</p>
        </div>

        <div className="flex items-center gap-3">
          <Badge
            variant={statusInfo.status === 'ativa' ? 'default' : 'destructive'}
            className="text-sm"
          >
            {statusInfo.texto}
          </Badge>

          {isAdmin && (
            <Button
              onClick={() => setShowAdmin(true)}
              variant="outline"
              size="sm"
              className="border-blue-200 text-blue-600 hover:bg-blue-50"
            >
              <Settings className="h-4 w-4 mr-2" />
              Administração
            </Button>
          )}

          <Button
            onClick={onManageBilling}
            variant="outline"
            size="sm"
          >
            <CreditCard className="h-4 w-4 mr-2" />
            Gerenciar
          </Button>
        </div>
      </div>

      {/* Informações da Assinatura Atual */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5" />
            Plano Atual: {assinatura.plano.nome}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-gray-600">Valor Mensal</p>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(assinatura.valorMensal)}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-600">Próximo Vencimento</p>
              <p className="text-lg font-semibold">
                {proximoVencimento.toLocaleDateString('pt-BR')}
              </p>
              <p className={`text-sm ${diasParaVencimento <= 7 ? 'text-red-600' : 'text-gray-500'}`}>
                {diasParaVencimento > 0 ? `${diasParaVencimento} dias restantes` : 'Vencido'}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-600">Renovação</p>
              <div className="flex items-center gap-2">
                {assinatura.renovacaoAutomatica ? (
                  <>
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Automática</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="h-4 w-4 text-yellow-500" />
                    <span className="text-sm">Manual</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {assinatura.plano.descricao && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">{assinatura.plano.descricao}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Uso de Recursos */}
      {progresso && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Usuários */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Users className="h-4 w-4" />
                Usuários
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>{progresso.usuarios.usado}</span>
                  <span className="text-gray-500">de {progresso.usuarios.total}</span>
                </div>
                <Progress
                  value={progresso.usuarios.percentual}
                  className={`h-2 ${progresso.usuarios.percentual > 90 ? 'bg-red-100' : 'bg-blue-100'}`}
                />
                <p className="text-xs text-gray-600">
                  {progresso.usuarios.percentual.toFixed(1)}% utilizado
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Clientes */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <UserCheck className="h-4 w-4" />
                Clientes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>{progresso.clientes.usado}</span>
                  <span className="text-gray-500">de {progresso.clientes.total}</span>
                </div>
                <Progress
                  value={progresso.clientes.percentual}
                  className={`h-2 ${progresso.clientes.percentual > 90 ? 'bg-red-100' : 'bg-green-100'}`}
                />
                <p className="text-xs text-gray-600">
                  {progresso.clientes.percentual.toFixed(1)}% utilizado
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Storage */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Database className="h-4 w-4" />
                Armazenamento
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>{progresso.storage.usado} MB</span>
                  <span className="text-gray-500">de {progresso.storage.total} MB</span>
                </div>
                <Progress
                  value={progresso.storage.percentual}
                  className={`h-2 ${progresso.storage.percentual > 90 ? 'bg-red-100' : 'bg-purple-100'}`}
                />
                <p className="text-xs text-gray-600">
                  {progresso.storage.percentual.toFixed(1)}% utilizado
                </p>
              </div>
            </CardContent>
          </Card>

          {/* API Calls */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Zap className="h-4 w-4" />
                API Calls Hoje
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>{assinatura.apiCallsHoje}</span>
                  <span className="text-gray-500">de {assinatura.plano.limiteApiCalls}</span>
                </div>
                <Progress
                  value={(assinatura.apiCallsHoje / assinatura.plano.limiteApiCalls) * 100}
                  className="h-2 bg-orange-100"
                />
                <p className="text-xs text-gray-600">
                  {((assinatura.apiCallsHoje / assinatura.plano.limiteApiCalls) * 100).toFixed(1)}% do limite diário
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Alertas e Ações */}
      {progresso && (
        <div className="space-y-4">
          {/* Alerta de Limite */}
          {(progresso.usuarios.percentual > 90 || progresso.clientes.percentual > 90 || progresso.storage.percentual > 90) && (
            <Card className="border-yellow-200 bg-yellow-50">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-medium text-yellow-800">Limite Próximo</h4>
                    <p className="text-sm text-yellow-700 mt-1">
                      Você está próximo do limite de alguns recursos. Considere fazer upgrade do seu plano.
                    </p>
                    <Button
                      onClick={onUpgrade}
                      size="sm"
                      className="mt-3 bg-yellow-600 hover:bg-yellow-700"
                    >
                      Ver Planos Superiores
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Vencimento Próximo */}
          {diasParaVencimento <= 7 && diasParaVencimento > 0 && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-medium text-red-800">Renovação Próxima</h4>
                    <p className="text-sm text-red-700 mt-1">
                      Sua assinatura vence em {diasParaVencimento} dias.
                      {!assinatura.renovacaoAutomatica && ' Configure a renovação automática para evitar interrupções.'}
                    </p>
                    <Button
                      onClick={onManageBilling}
                      size="sm"
                      className="mt-3 bg-red-600 hover:bg-red-700"
                    >
                      Gerenciar Billing
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};
