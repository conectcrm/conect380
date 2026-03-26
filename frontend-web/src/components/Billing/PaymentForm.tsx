import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import {
  AlertCircle,
  Building,
  CheckCircle,
  CreditCard,
  Loader2,
  Lock,
  Smartphone,
} from 'lucide-react';
import { api } from '../../services/api';

interface PaymentMethod {
  id: string;
  name: string;
  icon: React.ComponentType<any>;
  description: string;
}

interface PaymentFormProps {
  planoSelecionado?: {
    id: string;
    nome: string;
    preco: number | string;
    periodo?: string;
    features?: string[];
  };
  onPaymentSuccess: (paymentData: any) => void;
  onCancel: () => void;
  className?: string;
  checkoutEnabled?: boolean;
  checkoutProviderLabel?: string;
}

const PAYMENT_METHODS: PaymentMethod[] = [
  {
    id: 'card',
    name: 'Cartao de Credito',
    icon: CreditCard,
    description: 'Aprovacao imediata',
  },
  {
    id: 'pix',
    name: 'PIX',
    icon: Smartphone,
    description: 'Confirmacao em ate 2 minutos',
  },
  {
    id: 'boleto',
    name: 'Boleto Bancario',
    icon: Building,
    description: 'Confirmacao em 1-3 dias uteis',
  },
];

const parsePrice = (preco?: number | string): number => {
  if (typeof preco === 'number') {
    return Number.isFinite(preco) ? preco : 0;
  }

  if (typeof preco === 'string') {
    const parsed = Number(preco);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
};

export const PaymentForm: React.FC<PaymentFormProps> = ({
  planoSelecionado,
  onPaymentSuccess,
  onCancel,
  className,
  checkoutEnabled = true,
  checkoutProviderLabel = 'Gateway de pagamento',
}) => {
  const [selectedMethod, setSelectedMethod] = useState<string>('card');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const price = useMemo(() => parsePrice(planoSelecionado?.preco), [planoSelecionado?.preco]);
  const hasValidPlan = Boolean(planoSelecionado?.id);

  const handleCheckout = async () => {
    if (!checkoutEnabled) {
      setError('Checkout indisponivel para tenant proprietario com politica interna.');
      return;
    }

    if (!planoSelecionado?.id) {
      setError('Plano nao selecionado para checkout.');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const response = await api.post('/assinaturas/checkout', {
        planoId: planoSelecionado.id,
      });

      const checkoutData = response?.data || {};
      const checkoutUrl = checkoutData.initPoint || checkoutData.sandboxInitPoint;

      if (!checkoutUrl || typeof checkoutUrl !== 'string') {
        throw new Error('Checkout indisponivel no momento. Tente novamente.');
      }

      onPaymentSuccess({
        status: 'redirect',
        method: selectedMethod,
        ...checkoutData,
      });

      window.location.assign(checkoutUrl);
    } catch (checkoutError: any) {
      const backendMessage =
        checkoutError?.response?.data?.message ||
        checkoutError?.message ||
        'Nao foi possivel iniciar o checkout seguro.';
      setError(String(backendMessage));
      setIsProcessing(false);
    }
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle>Finalizar Assinatura</CardTitle>
          <Button variant="ghost" size="sm" onClick={onCancel}>
            x
          </Button>
        </div>

        {planoSelecionado && (
          <div className="mt-4 rounded-lg bg-[#DEEFE7] p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="font-semibold text-[#002333]">{planoSelecionado.nome}</div>
                <div className="text-sm text-[#385A6A]">
                  {planoSelecionado.periodo || 'Cobranca mensal'}
                </div>
              </div>
              <div className="text-left sm:text-right">
                <div className="text-2xl font-bold text-[#002333]">
                  {price.toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  })}
                </div>
                <div className="text-sm text-[#385A6A]">por mes</div>
              </div>
            </div>
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-6 p-6 pt-0">
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-[#002333]">Forma de pagamento</h3>
          <p className="text-sm text-[#385A6A]">
            {checkoutEnabled
              ? `A cobranca final e concluida no checkout seguro do provedor (${checkoutProviderLabel}).`
              : 'Este tenant utiliza politica interna de cobranca e nao realiza checkout self-service.'}
          </p>
          <div className="grid gap-3">
            {PAYMENT_METHODS.map((method) => {
              const Icon = method.icon;
              const isSelected = selectedMethod === method.id;

              return (
                <button
                  key={method.id}
                  type="button"
                  onClick={() => setSelectedMethod(method.id)}
                  className={`w-full rounded-xl border-2 p-4 text-left transition-all duration-200 hover:border-[#159A9C]/40 hover:bg-[#159A9C]/5 ${
                    isSelected
                      ? 'border-[#159A9C] bg-[#159A9C]/5 shadow-md'
                      : 'border-[#D4E2E7] bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg border border-gray-200 bg-white p-2">
                        <Icon className="h-5 w-5 text-gray-700" />
                      </div>
                      <div>
                        <div className="font-medium text-[#002333]">{method.name}</div>
                        <div className="text-sm text-[#385A6A]">{method.description}</div>
                      </div>
                    </div>
                    {isSelected && <CheckCircle className="h-5 w-5 text-[#159A9C]" />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="rounded-lg border border-[#DEEFE7] bg-[#DEEFE7]/55 p-4">
          <div className="flex items-start gap-3">
            <Lock className="mt-0.5 h-5 w-5 flex-shrink-0 text-[#159A9C]" />
            <div className="text-sm">
              <div className="font-medium text-[#244455]">Checkout seguro</div>
              <div className="text-[#385A6A]">
                Seus dados de pagamento sao processados no provedor seguro. Este sistema nao
                armazena dados de cartao.
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            <div className="flex items-start gap-2">
              <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button
            onClick={handleCheckout}
            className="flex-1 bg-[#159A9C] hover:bg-[#0F7B7D]"
            disabled={!hasValidPlan || isProcessing || !checkoutEnabled}
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Redirecionando para checkout...
              </>
            ) : checkoutEnabled ? (
              'Ir para checkout seguro'
            ) : (
              'Checkout indisponivel'
            )}
          </Button>
          <Button variant="outline" onClick={onCancel} disabled={isProcessing}>
            Cancelar
          </Button>
        </div>

        <div className="text-center">
          <Badge variant="outline" className="text-xs text-[#5A7582]">
            Se o redirecionamento falhar, tente novamente em alguns segundos.
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
};
