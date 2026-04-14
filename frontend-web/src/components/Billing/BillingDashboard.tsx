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
  CreditCard,
  AlertTriangle,
  CheckCircle,
  Crown,
  Calendar,
  Receipt,
  RefreshCw,
  Wallet,
} from 'lucide-react';
import { useSubscription } from '../../hooks/useSubscription';
import { formatCurrency } from '../../utils/formatters';

interface BillingDashboardProps {
  onUpgrade?: () => void;
  onManageBilling?: () => void;
}

export const BillingDashboard: React.FC<BillingDashboardProps> = ({
  onUpgrade,
  onManageBilling,
}) => {
  const {
    assinatura,
    loading,
    error,
    calcularProgresso,
    getStatusInfo,
    isOwnerTenant,
    podeAlterarPlano,
    billingResumoFinanceiro,
    billingCapabilities,
    billingHistorico,
    billingHistoricoLoading,
    buscarHistoricoBilling,
  } = useSubscription();
  const parseDateSafe = (value: string): Date => {
    const raw = String(value || '').trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
      const [year, month, day] = raw.split('-').map((part) => Number(part));
      return new Date(year, month - 1, day, 12, 0, 0, 0);
    }

    const parsed = new Date(raw);
    if (Number.isNaN(parsed.getTime())) {
      return new Date();
    }

    return parsed;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="mb-4 h-8 w-1/4 rounded bg-[#DEEFE7]"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 rounded bg-[#DEEFE7]"></div>
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
            <h3 className="mb-2 text-xl font-semibold text-[#002333]">Bem-vindo ao ConectCRM!</h3>
            <p className="mb-6 text-[#385A6A]">
              Para comecar a usar todas as funcionalidades, escolha um plano que se adeque as suas
              necessidades.
            </p>
            <Button onClick={onUpgrade} size="lg" className="bg-[#159A9C] hover:bg-[#0F7B7D]">
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
  const proximoVencimento = parseDateSafe(assinatura.proximoVencimento);
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  proximoVencimento.setHours(0, 0, 0, 0);
  const diasParaVencimento = Math.ceil(
    (proximoVencimento.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24),
  );
  const usuariosTotalLabel =
    progresso && progresso.usuarios.total < 0
      ? 'Ilimitado'
      : String(progresso?.usuarios.total || 0);
  const clientesTotalLabel =
    progresso && progresso.clientes.total < 0
      ? 'Ilimitado'
      : String(progresso?.clientes.total || 0);
  const storageTotalLabel =
    progresso && progresso.storage.total < 0 ? 'Ilimitado' : `${progresso?.storage.total || 0} MB`;
  const apiLimit = assinatura.plano.limiteApiCalls;
  const apiPercentual =
    apiLimit > 0 ? Math.min((assinatura.apiCallsHoje / apiLimit) * 100, 100) : 0;
  const apiLimiteLabel = apiLimit < 0 ? 'Ilimitado' : apiLimit.toLocaleString('pt-BR');
  const gatewaysLabel =
    billingCapabilities?.enabledGatewayProviders?.length > 0
      ? billingCapabilities.enabledGatewayProviders.join(', ')
      : 'Nenhum gateway habilitado';

  const formatDateSafe = (value?: string | null) => {
    if (!value) {
      return '--';
    }

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return '--';
    }

    return parsed.toLocaleDateString('pt-BR');
  };

  const mapFaturaStatusLabel = (statusRaw: string) => {
    const normalized = String(statusRaw || '').trim().toLowerCase();
    if (normalized === 'paga') return { label: 'Paga', className: 'bg-green-100 text-green-700' };
    if (normalized === 'vencida')
      return { label: 'Vencida', className: 'bg-red-100 text-red-700' };
    if (normalized === 'parcialmente_paga')
      return { label: 'Parcial', className: 'bg-yellow-100 text-yellow-700' };
    if (normalized === 'cancelada')
      return { label: 'Cancelada', className: 'bg-gray-100 text-gray-700' };
    if (normalized === 'enviada')
      return { label: 'Enviada', className: 'bg-blue-100 text-blue-700' };
    return { label: 'Pendente', className: 'bg-yellow-100 text-yellow-700' };
  };

  const mapPagamentoStatusLabel = (statusRaw: string) => {
    const normalized = String(statusRaw || '').trim().toLowerCase();
    if (normalized === 'aprovado')
      return { label: 'Aprovado', className: 'bg-green-100 text-green-700' };
    if (normalized === 'rejeitado')
      return { label: 'Rejeitado', className: 'bg-red-100 text-red-700' };
    if (normalized === 'cancelado')
      return { label: 'Cancelado', className: 'bg-gray-100 text-gray-700' };
    if (normalized === 'estornado')
      return { label: 'Estornado', className: 'bg-orange-100 text-orange-700' };
    if (normalized === 'processando')
      return { label: 'Processando', className: 'bg-blue-100 text-blue-700' };
    return { label: 'Pendente', className: 'bg-yellow-100 text-yellow-700' };
  };

  return (
    <div className="space-y-6">
      {/* Header com Status da Assinatura */}
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-xl font-bold text-[#002333]">Billing & Assinatura</h2>
          <p className="text-[#385A6A]">Gerencie sua assinatura e monitore o uso dos recursos</p>
        </div>

        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:gap-3">
          <Badge
            variant={statusInfo.status === 'active' ? 'default' : 'destructive'}
            className="text-sm"
          >
            {statusInfo.texto}
          </Badge>

          {!isOwnerTenant && (
            <Button
              onClick={onManageBilling}
              variant="outline"
              size="sm"
              className="border-[#B4BEC9] text-[#19384C] hover:bg-[#F6FAF9]"
            >
              <CreditCard className="h-4 w-4 mr-2" />
              Gerenciar
            </Button>
          )}
        </div>
      </div>

      {/* Informacoes da Assinatura Atual */}
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
              <p className="text-sm text-[#385A6A]">Valor Mensal</p>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(assinatura.valorMensal)}
              </p>
            </div>

            <div>
              <p className="text-sm text-[#385A6A]">Proximo Vencimento</p>
              {isOwnerTenant ? (
                <>
                  <p className="text-lg font-semibold">Nao aplicavel</p>
                  <p className="text-sm text-gray-500">Cobranca interna da plataforma</p>
                </>
              ) : (
                <>
                  <p className="text-lg font-semibold">
                    {proximoVencimento.toLocaleDateString('pt-BR')}
                  </p>
                  <p
                    className={`text-sm ${diasParaVencimento <= 7 ? 'text-red-600' : 'text-gray-500'}`}
                  >
                    {diasParaVencimento > 0 ? `${diasParaVencimento} dias restantes` : 'Vencido'}
                  </p>
                </>
              )}
            </div>

            <div>
              <p className="text-sm text-[#385A6A]">Renovacao</p>
              <div className="flex items-center gap-2">
                {assinatura.renovacaoAutomatica ? (
                  <>
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Automatica</span>
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
            <div className="mt-4 rounded-lg bg-[#DEEFE7] p-3">
              <p className="text-sm text-[#244455]">{assinatura.plano.descricao}</p>
            </div>
          )}

          {!isOwnerTenant && billingResumoFinanceiro && (
            <>
              <div className="mt-4 grid grid-cols-1 gap-3 rounded-lg border border-[#D4E2E7] bg-white p-3 text-sm text-[#244455] sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <div className="text-xs uppercase tracking-wide text-[#5A7582]">Faturas</div>
                  <div className="text-base font-semibold">
                    {billingResumoFinanceiro.totalFaturas}
                  </div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wide text-[#5A7582]">Pagamentos</div>
                  <div className="text-base font-semibold">
                    {billingResumoFinanceiro.totalPagamentos}
                  </div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wide text-[#5A7582]">Em aberto</div>
                  <div className="text-base font-semibold">
                    {formatCurrency(billingResumoFinanceiro.valorEmAberto)}
                  </div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wide text-[#5A7582]">Gateway</div>
                  <div className="text-base font-semibold">{gatewaysLabel}</div>
                </div>
              </div>
              {billingCapabilities?.checkoutCredentialScope === 'platform_owner' && (
                <p className="mt-2 text-xs text-[#5A7582]">
                  Cobranca de assinatura centralizada na conta da empresa proprietaria da
                  plataforma.
                </p>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Uso de Recursos */}
      {progresso && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Usuarios */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Users className="h-4 w-4" />
                Usuarios
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>{progresso.usuarios.usado}</span>
                  <span className="text-gray-500">de {usuariosTotalLabel}</span>
                </div>
                <Progress
                  value={progresso.usuarios.percentual}
                  className={`h-2 ${progresso.usuarios.percentual > 90 ? 'bg-red-100' : 'bg-blue-100'}`}
                />
                <p className="text-xs text-gray-600">
                  {progresso.usuarios.total < 0
                    ? 'Sem limite de usuarios'
                    : `${progresso.usuarios.percentual.toFixed(1)}% utilizado`}
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
                  <span className="text-gray-500">de {clientesTotalLabel}</span>
                </div>
                <Progress
                  value={progresso.clientes.percentual}
                  className={`h-2 ${progresso.clientes.percentual > 90 ? 'bg-red-100' : 'bg-green-100'}`}
                />
                <p className="text-xs text-gray-600">
                  {progresso.clientes.total < 0
                    ? 'Sem limite de clientes'
                    : `${progresso.clientes.percentual.toFixed(1)}% utilizado`}
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
                  <span className="text-gray-500">de {storageTotalLabel}</span>
                </div>
                <Progress
                  value={progresso.storage.percentual}
                  className={`h-2 ${progresso.storage.percentual > 90 ? 'bg-red-100' : 'bg-purple-100'}`}
                />
                <p className="text-xs text-gray-600">
                  {progresso.storage.total < 0
                    ? 'Sem limite de armazenamento'
                    : `${progresso.storage.percentual.toFixed(1)}% utilizado`}
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
                  <span className="text-gray-500">de {apiLimiteLabel}</span>
                </div>
                <Progress value={apiPercentual} className="h-2 bg-orange-100" />
                <p className="text-xs text-gray-600">
                  {apiLimit < 0
                    ? 'Sem limite diario'
                    : `${apiPercentual.toFixed(1)}% do limite diario`}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {!isOwnerTenant && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Receipt className="h-4 w-4 text-[#159A9C]" />
                Historico recente de cobranca
              </CardTitle>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => void buscarHistoricoBilling()}
                disabled={billingHistoricoLoading}
                className="h-8 border-[#D4E2E7] text-[#244455] hover:bg-[#F6FAF9]"
              >
                <RefreshCw
                  className={`mr-1 h-3.5 w-3.5 ${billingHistoricoLoading ? 'animate-spin' : ''}`}
                />
                Atualizar
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {billingHistoricoLoading ? (
              <p className="text-sm text-[#5A7582]">Carregando historico...</p>
            ) : !billingHistorico ||
              (billingHistorico.faturas.length === 0 && billingHistorico.pagamentos.length === 0) ? (
              <p className="text-sm text-[#5A7582]">Nenhuma movimentacao recente de cobranca.</p>
            ) : (
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <div className="space-y-3">
                  <h4 className="inline-flex items-center gap-2 text-sm font-semibold text-[#244455]">
                    <Receipt className="h-4 w-4" />
                    Faturas
                  </h4>
                  {billingHistorico.faturas.slice(0, 4).length === 0 && (
                    <p className="rounded-lg border border-dashed border-[#D4E2E7] p-3 text-xs text-[#5A7582]">
                      Nenhuma fatura recente.
                    </p>
                  )}
                  {billingHistorico.faturas.slice(0, 4).map((fatura) => {
                    const statusInfo = mapFaturaStatusLabel(fatura.status);
                    return (
                      <div
                        key={`fatura-${fatura.id}`}
                        className="rounded-lg border border-[#D4E2E7] bg-white p-3"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-sm font-semibold text-[#002333]">{fatura.numero}</p>
                            <p className="text-xs text-[#5A7582]">
                              Emissao: {formatDateSafe(fatura.dataEmissao)}
                            </p>
                          </div>
                          <span
                            className={`rounded-full px-2 py-1 text-xs font-medium ${statusInfo.className}`}
                          >
                            {statusInfo.label}
                          </span>
                        </div>
                        <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-[#385A6A]">
                          <span>Total: {formatCurrency(fatura.valorTotal)}</span>
                          <span>Em aberto: {formatCurrency(fatura.valorRestante)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="space-y-3">
                  <h4 className="inline-flex items-center gap-2 text-sm font-semibold text-[#244455]">
                    <Wallet className="h-4 w-4" />
                    Pagamentos
                  </h4>
                  {billingHistorico.pagamentos.slice(0, 4).length === 0 && (
                    <p className="rounded-lg border border-dashed border-[#D4E2E7] p-3 text-xs text-[#5A7582]">
                      Nenhum pagamento recente.
                    </p>
                  )}
                  {billingHistorico.pagamentos.slice(0, 4).map((pagamento) => {
                    const statusInfo = mapPagamentoStatusLabel(pagamento.status);
                    return (
                      <div
                        key={`pagamento-${pagamento.id}`}
                        className="rounded-lg border border-[#D4E2E7] bg-white p-3"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-sm font-semibold text-[#002333]">
                              {pagamento.transacaoId}
                            </p>
                            <p className="text-xs text-[#5A7582]">
                              {pagamento.metodoPagamento || 'Metodo nao informado'} -{' '}
                              {pagamento.gateway || 'gateway'}
                            </p>
                          </div>
                          <span
                            className={`rounded-full px-2 py-1 text-xs font-medium ${statusInfo.className}`}
                          >
                            {statusInfo.label}
                          </span>
                        </div>
                        <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-[#385A6A]">
                          <span>Valor: {formatCurrency(pagamento.valor)}</span>
                          <span>Data: {formatDateSafe(pagamento.dataAprovacao || pagamento.createdAt)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Alertas e Acoes */}
      {progresso && (
        <div className="space-y-4">
          {/* Alerta de Limite */}
          {(progresso.usuarios.percentual > 90 ||
            progresso.clientes.percentual > 90 ||
            progresso.storage.percentual > 90) &&
            !isOwnerTenant && (
              <Card className="border-yellow-200 bg-yellow-50">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="font-medium text-yellow-800">Limite Proximo</h4>
                      <p className="text-sm text-yellow-700 mt-1">
                        Voce esta proximo do limite de alguns recursos. Considere fazer upgrade do
                        seu plano.
                      </p>
                      <Button
                        onClick={onUpgrade}
                        size="sm"
                        className="mt-3 bg-[#159A9C] hover:bg-[#0F7B7D]"
                        disabled={!podeAlterarPlano}
                      >
                        Ver Planos Superiores
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

          {/* Vencimento Proximo */}
          {!isOwnerTenant && diasParaVencimento <= 7 && diasParaVencimento > 0 && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-medium text-red-800">Renovacao Proxima</h4>
                    <p className="text-sm text-red-700 mt-1">
                      Sua assinatura vence em {diasParaVencimento} dias.
                      {!assinatura.renovacaoAutomatica &&
                        ' Configure a renovacao automatica para evitar interrupcoes.'}
                    </p>
                    <Button
                      onClick={onManageBilling}
                      size="sm"
                      className="mt-3 bg-[#159A9C] hover:bg-[#0F7B7D]"
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
