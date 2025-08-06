import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import {
  CreditCard,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Download,
  Send,
  RotateCcw
} from 'lucide-react';
import PaymentComponent from './PaymentComponent';
import stripeService from '../../services/stripeService';
import mercadoPagoService from '../../services/mercadoPagoService';
import { toast } from 'react-hot-toast';

interface Fatura {
  id: string;
  numero: string;
  valor: number;
  descricao: string;
  data_vencimento: string;
  status: 'pendente' | 'paga' | 'vencida' | 'cancelada';
  cliente: {
    id: string;
    nome: string;
    email: string;
    documento: string;
  };
  proposta_id?: string;
  contrato_id?: string;
  metodo_pagamento?: 'stripe' | 'mercadopago' | 'manual';
  payment_intent_id?: string;
  mercadopago_payment_id?: string;
}

interface BillingIntegrationProps {
  faturas: Fatura[];
  onFaturaUpdate: (fatura: Fatura) => void;
  onPaymentSuccess: (fatura: Fatura, payment: any) => void;
}

const BillingIntegration: React.FC<BillingIntegrationProps> = ({
  faturas,
  onFaturaUpdate,
  onPaymentSuccess
}) => {
  const [faturaSelected, setFaturaSelected] = useState<Fatura | null>(null);
  const [showPayment, setShowPayment] = useState(false);
  const [loading, setLoading] = useState<Record<string, boolean>>({});

  // Ouvir eventos de pagamento
  useEffect(() => {
    const handleStripePaymentSuccess = (event: CustomEvent) => {
      const { payment } = event.detail;
      console.log('Pagamento Stripe aprovado:', payment);

      // Encontrar fatura relacionada
      const fatura = faturas.find(f => f.payment_intent_id === payment.id);
      if (fatura) {
        const faturaAtualizada = { ...fatura, status: 'paga' as const };
        onFaturaUpdate(faturaAtualizada);
        onPaymentSuccess(faturaAtualizada, payment);
        toast.success(`Fatura ${fatura.numero} paga com sucesso!`);
      }
    };

    const handleMercadoPagoPaymentSuccess = (event: CustomEvent) => {
      const { payment } = event.detail;
      console.log('Pagamento Mercado Pago aprovado:', payment);

      // Encontrar fatura relacionada
      const fatura = faturas.find(f => f.mercadopago_payment_id === payment.id.toString());
      if (fatura) {
        const faturaAtualizada = { ...fatura, status: 'paga' as const };
        onFaturaUpdate(faturaAtualizada);
        onPaymentSuccess(faturaAtualizada, payment);
        toast.success(`Fatura ${fatura.numero} paga com sucesso!`);
      }
    };

    window.addEventListener('stripe:payment:succeeded', handleStripePaymentSuccess as EventListener);
    window.addEventListener('mercadopago:payment:approved', handleMercadoPagoPaymentSuccess as EventListener);

    return () => {
      window.removeEventListener('stripe:payment:succeeded', handleStripePaymentSuccess as EventListener);
      window.removeEventListener('mercadopago:payment:approved', handleMercadoPagoPaymentSuccess as EventListener);
    };
  }, [faturas, onFaturaUpdate, onPaymentSuccess]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paga': return 'bg-green-100 text-green-800';
      case 'pendente': return 'bg-yellow-100 text-yellow-800';
      case 'vencida': return 'bg-red-100 text-red-800';
      case 'cancelada': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paga': return <CheckCircle className="h-4 w-4" />;
      case 'pendente': return <Clock className="h-4 w-4" />;
      case 'vencida': return <AlertCircle className="h-4 w-4" />;
      case 'cancelada': return <XCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const abrirPagamento = (fatura: Fatura) => {
    setFaturaSelected(fatura);
    setShowPayment(true);
  };

  const enviarCobrancaPorEmail = async (fatura: Fatura) => {
    const faturaId = fatura.id;
    setLoading(prev => ({ ...prev, [faturaId]: true }));

    try {
      // Implementar envio de cobrança por email
      const response = await fetch(`/api/faturas/${faturaId}/send-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });

      if (response.ok) {
        toast.success(`Cobrança enviada para ${fatura.cliente.email}`);
      } else {
        throw new Error('Erro ao enviar cobrança');
      }
    } catch (error) {
      console.error('Erro ao enviar cobrança:', error);
      toast.error('Erro ao enviar cobrança por email');
    } finally {
      setLoading(prev => ({ ...prev, [faturaId]: false }));
    }
  };

  const baixarFatura = async (fatura: Fatura) => {
    try {
      const response = await fetch(`/api/faturas/${fatura.id}/pdf`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `fatura-${fatura.numero}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        throw new Error('Erro ao baixar fatura');
      }
    } catch (error) {
      console.error('Erro ao baixar fatura:', error);
      toast.error('Erro ao baixar fatura');
    }
  };

  const reprocessarPagamento = async (fatura: Fatura) => {
    const faturaId = fatura.id;
    setLoading(prev => ({ ...prev, [faturaId]: true }));

    try {
      let pagamento;

      if (fatura.metodo_pagamento === 'stripe' && fatura.payment_intent_id) {
        pagamento = await stripeService.obterPagamento(fatura.payment_intent_id);
      } else if (fatura.metodo_pagamento === 'mercadopago' && fatura.mercadopago_payment_id) {
        pagamento = await mercadoPagoService.obterPagamento(fatura.mercadopago_payment_id);
      }

      if (pagamento) {
        // Verificar se o status mudou
        if (
          (fatura.metodo_pagamento === 'stripe' && pagamento.status === 'succeeded') ||
          (fatura.metodo_pagamento === 'mercadopago' && pagamento.status === 'approved')
        ) {
          const faturaAtualizada = { ...fatura, status: 'paga' as const };
          onFaturaUpdate(faturaAtualizada);
          toast.success(`Status da fatura ${fatura.numero} atualizado para PAGA`);
        } else {
          toast.info(`Status atual: ${pagamento.status}`);
        }
      }
    } catch (error) {
      console.error('Erro ao reprocessar pagamento:', error);
      toast.error('Erro ao verificar status do pagamento');
    } finally {
      setLoading(prev => ({ ...prev, [faturaId]: false }));
    }
  };

  const handlePaymentSuccess = (payment: any) => {
    if (faturaSelected) {
      const faturaAtualizada = { ...faturaSelected, status: 'paga' as const };
      onFaturaUpdate(faturaAtualizada);
      onPaymentSuccess(faturaAtualizada, payment);
      setShowPayment(false);
      setFaturaSelected(null);
    }
  };

  const handlePaymentError = (error: any) => {
    console.error('Erro no pagamento:', error);
    toast.error('Erro no processamento do pagamento');
  };

  if (showPayment && faturaSelected) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Pagamento da Fatura {faturaSelected.numero}</h3>
          <Button variant="outline" onClick={() => setShowPayment(false)}>
            Voltar
          </Button>
        </div>

        <PaymentComponent
          valor={faturaSelected.valor}
          descricao={faturaSelected.descricao}
          clienteId={faturaSelected.cliente.id}
          faturaId={faturaSelected.id}
          onSuccess={handlePaymentSuccess}
          onError={handlePaymentError}
          metodosDisponiveis={['stripe', 'mercadopago']}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Faturamento</h2>
        <div className="flex gap-2">
          <Badge variant="outline">
            {faturas.filter(f => f.status === 'pendente').length} Pendentes
          </Badge>
          <Badge variant="outline">
            {faturas.filter(f => f.status === 'vencida').length} Vencidas
          </Badge>
          <Badge variant="outline" className="bg-green-50">
            {faturas.filter(f => f.status === 'paga').length} Pagas
          </Badge>
        </div>
      </div>

      <div className="grid gap-4">
        {faturas.map((fatura) => (
          <Card key={fatura.id} className="w-full">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">
                  Fatura {fatura.numero}
                </CardTitle>
                <Badge className={getStatusColor(fatura.status)}>
                  <div className="flex items-center gap-1">
                    {getStatusIcon(fatura.status)}
                    {fatura.status.toUpperCase()}
                  </div>
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Cliente</p>
                  <p className="font-medium">{fatura.cliente.nome}</p>
                  <p className="text-sm text-gray-600">{fatura.cliente.email}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-600">Valor</p>
                  <p className="text-2xl font-bold text-green-600">
                    {new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL'
                    }).format(fatura.valor)}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-600">Vencimento</p>
                  <p className="font-medium">
                    {new Date(fatura.data_vencimento).toLocaleDateString('pt-BR')}
                  </p>
                  {fatura.metodo_pagamento && (
                    <Badge variant="outline" className="mt-1">
                      {fatura.metodo_pagamento}
                    </Badge>
                  )}
                </div>
              </div>

              <Separator />

              <div className="flex flex-wrap gap-2">
                {fatura.status === 'pendente' && (
                  <Button
                    onClick={() => abrirPagamento(fatura)}
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <CreditCard className="h-4 w-4 mr-2" />
                    Pagar Agora
                  </Button>
                )}

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => enviarCobrancaPorEmail(fatura)}
                  disabled={loading[fatura.id]}
                >
                  <Send className="h-4 w-4 mr-2" />
                  Enviar por Email
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => baixarFatura(fatura)}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Baixar PDF
                </Button>

                {(fatura.payment_intent_id || fatura.mercadopago_payment_id) && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => reprocessarPagamento(fatura)}
                    disabled={loading[fatura.id]}
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Verificar Status
                  </Button>
                )}
              </div>

              {fatura.descricao && (
                <div className="pt-2 border-t">
                  <p className="text-sm text-gray-600">Descrição</p>
                  <p className="text-sm">{fatura.descricao}</p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}

        {faturas.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-8">
              <DollarSign className="h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-600">Nenhuma fatura encontrada</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default BillingIntegration;
