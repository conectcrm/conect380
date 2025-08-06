import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { Alert, AlertDescription } from '../ui/alert';
import { Loader2, CreditCard, Smartphone, FileText, QrCode, Copy, Check } from 'lucide-react';
import mercadoPagoService from '../../services/mercadoPagoService';
import stripeService from '../../services/stripeService';
import { toast } from 'react-hot-toast';

interface PaymentComponentProps {
  valor: number;
  descricao: string;
  clienteId?: string;
  faturaId?: string;
  onSuccess?: (payment: any) => void;
  onError?: (error: any) => void;
  metodosDisponiveis?: ('stripe' | 'mercadopago')[];
}

interface PaymentMethod {
  id: string;
  name: string;
  type: 'pix' | 'boleto' | 'cartao';
  provider: 'stripe' | 'mercadopago';
  icon: React.ReactNode;
}

const PaymentComponent: React.FC<PaymentComponentProps> = ({
  valor,
  descricao,
  clienteId,
  faturaId,
  onSuccess,
  onError,
  metodosDisponiveis = ['stripe', 'mercadopago']
}) => {
  const [loading, setLoading] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [pixData, setPixData] = useState<any>(null);
  const [paymentData, setPaymentData] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  // Dados do pagador
  const [dadosPagador, setDadosPagador] = useState({
    nome: '',
    sobrenome: '',
    email: '',
    documento: '',
    tipo_documento: 'CPF' as 'CPF' | 'CNPJ',
    telefone: ''
  });

  // Dados do cartão (para Stripe)
  const [dadosCartao, setDadosCartao] = useState({
    numero: '',
    vencimento: '',
    cvv: '',
    nome: '',
    parcelas: 1
  });

  const metodosDisponiveisConfig: PaymentMethod[] = [
    // Mercado Pago
    ...(metodosDisponiveis.includes('mercadopago') ? [
      {
        id: 'mp-pix',
        name: 'PIX - Mercado Pago',
        type: 'pix' as const,
        provider: 'mercadopago' as const,
        icon: <QrCode className="h-5 w-5" />
      },
      {
        id: 'mp-cartao',
        name: 'Cartão - Mercado Pago',
        type: 'cartao' as const,
        provider: 'mercadopago' as const,
        icon: <CreditCard className="h-5 w-5" />
      },
      {
        id: 'mp-boleto',
        name: 'Boleto - Mercado Pago',
        type: 'boleto' as const,
        provider: 'mercadopago' as const,
        icon: <FileText className="h-5 w-5" />
      }
    ] : []),
    // Stripe
    ...(metodosDisponiveis.includes('stripe') ? [
      {
        id: 'stripe-cartao',
        name: 'Cartão - Stripe',
        type: 'cartao' as const,
        provider: 'stripe' as const,
        icon: <CreditCard className="h-5 w-5" />
      },
      {
        id: 'stripe-pix',
        name: 'PIX - Stripe',
        type: 'pix' as const,
        provider: 'stripe' as const,
        icon: <Smartphone className="h-5 w-5" />
      }
    ] : [])
  ];

  useEffect(() => {
    if (pixData && pixData.point_of_interaction?.transaction_data?.qr_code) {
      // Configurar polling para verificar status do PIX
      const interval = setInterval(async () => {
        try {
          const payment = await mercadoPagoService.obterPagamento(pixData.id);
          if (payment.status === 'approved') {
            clearInterval(interval);
            toast.success('Pagamento PIX aprovado!');
            onSuccess?.(payment);
          }
        } catch (error) {
          console.error('Erro ao verificar status PIX:', error);
        }
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [pixData, onSuccess]);

  const processarPagamento = async () => {
    if (!selectedMethod) {
      toast.error('Selecione um método de pagamento');
      return;
    }

    if (!dadosPagador.email || !dadosPagador.nome) {
      toast.error('Preencha os dados obrigatórios');
      return;
    }

    setLoading(true);

    try {
      let resultado;

      if (selectedMethod.provider === 'mercadopago') {
        resultado = await processarPagamentoMercadoPago();
      } else {
        resultado = await processarPagamentoStripe();
      }

      setPaymentData(resultado);

      if (selectedMethod.type === 'pix' && resultado.point_of_interaction?.transaction_data) {
        setPixData(resultado);
      } else if (resultado.status === 'approved' || resultado.status === 'succeeded') {
        toast.success('Pagamento aprovado!');
        onSuccess?.(resultado);
      } else {
        toast.success('Pagamento criado! Aguardando confirmação...');
      }

    } catch (error: any) {
      console.error('Erro no pagamento:', error);
      toast.error(error.message || 'Erro ao processar pagamento');
      onError?.(error);
    } finally {
      setLoading(false);
    }
  };

  const processarPagamentoMercadoPago = async () => {
    const params = {
      valor,
      descricao,
      email_pagador: dadosPagador.email,
      referencia_externa: `fatura-${faturaId || Date.now()}`,
      dados_pagador: {
        nome: dadosPagador.nome,
        sobrenome: dadosPagador.sobrenome,
        documento: dadosPagador.documento,
        tipo_documento: dadosPagador.tipo_documento,
        telefone: dadosPagador.telefone
      }
    };

    switch (selectedMethod?.type) {
      case 'pix':
        return await mercadoPagoService.criarPagamentoPix(params);

      case 'cartao':
        // Para cartão, seria necessário primeiro tokenizar os dados
        throw new Error('Implementar tokenização do cartão');

      case 'boleto':
        return await mercadoPagoService.criarPreferencia({
          ...params,
          metodo_pagamento: 'boleto'
        });

      default:
        throw new Error('Método não suportado');
    }
  };

  const processarPagamentoStripe = async () => {
    const params = {
      amount: valor * 100, // Stripe usa centavos
      currency: 'brl',
      description: descricao,
      customer: {
        email: dadosPagador.email,
        name: `${dadosPagador.nome} ${dadosPagador.sobrenome}`,
        phone: dadosPagador.telefone,
        metadata: {
          documento: dadosPagador.documento,
          fatura_id: faturaId || ''
        }
      },
      metadata: {
        fatura_id: faturaId || '',
        cliente_id: clienteId || ''
      }
    };

    switch (selectedMethod?.type) {
      case 'cartao':
        return await stripeService.criarPagamento({
          ...params,
          payment_method_types: ['card']
        });

      case 'pix':
        return await stripeService.criarPagamento({
          ...params,
          payment_method_types: ['pix']
        });

      default:
        throw new Error('Método não suportado');
    }
  };

  const copiarPixCode = async () => {
    if (pixData?.point_of_interaction?.transaction_data?.qr_code) {
      await navigator.clipboard.writeText(pixData.point_of_interaction.transaction_data.qr_code);
      setCopied(true);
      toast.success('Código PIX copiado!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (pixData) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            Pagamento PIX
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">
              {mercadoPagoService.formatarValor(valor)}
            </p>
            <p className="text-sm text-gray-600">{descricao}</p>
          </div>

          <Separator />

          {pixData.point_of_interaction?.transaction_data?.qr_code_base64 && (
            <div className="text-center">
              <img
                src={mercadoPagoService.gerarQRCodePix(pixData.point_of_interaction.transaction_data.qr_code_base64)}
                alt="QR Code PIX"
                className="mx-auto max-w-48 h-auto"
              />
            </div>
          )}

          {pixData.point_of_interaction?.transaction_data?.qr_code && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Código PIX:</p>
              <div className="flex gap-2">
                <Input
                  readOnly
                  value={pixData.point_of_interaction.transaction_data.qr_code}
                  className="font-mono text-xs"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={copiarPixCode}
                  disabled={copied}
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          )}

          <Alert>
            <AlertDescription>
              Escaneie o QR Code ou copie e cole o código PIX no seu app bancário.
              O pagamento será confirmado automaticamente.
            </AlertDescription>
          </Alert>

          <Badge variant="outline" className="w-full justify-center">
            Status: {mercadoPagoService.getStatusLabel(pixData.status)}
          </Badge>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Pagamento</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center">
          <p className="text-2xl font-bold">{new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
          }).format(valor)}</p>
          <p className="text-sm text-gray-600">{descricao}</p>
        </div>

        <Separator />

        {/* Método de Pagamento */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Método de Pagamento</label>
          <Select onValueChange={(value) => {
            const method = metodosDisponiveisConfig.find(m => m.id === value);
            setSelectedMethod(method || null);
          }}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione o método" />
            </SelectTrigger>
            <SelectContent>
              {metodosDisponiveisConfig.map((method) => (
                <SelectItem key={method.id} value={method.id}>
                  <div className="flex items-center gap-2">
                    {method.icon}
                    {method.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Dados do Pagador */}
        <div className="space-y-3">
          <h4 className="font-medium">Dados do Pagador</h4>

          <div className="grid grid-cols-2 gap-2">
            <Input
              placeholder="Nome"
              value={dadosPagador.nome}
              onChange={(e) => setDadosPagador(prev => ({ ...prev, nome: e.target.value }))}
            />
            <Input
              placeholder="Sobrenome"
              value={dadosPagador.sobrenome}
              onChange={(e) => setDadosPagador(prev => ({ ...prev, sobrenome: e.target.value }))}
            />
          </div>

          <Input
            type="email"
            placeholder="Email"
            value={dadosPagador.email}
            onChange={(e) => setDadosPagador(prev => ({ ...prev, email: e.target.value }))}
          />

          <div className="grid grid-cols-2 gap-2">
            <Select
              value={dadosPagador.tipo_documento}
              onValueChange={(value: 'CPF' | 'CNPJ') =>
                setDadosPagador(prev => ({ ...prev, tipo_documento: value }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CPF">CPF</SelectItem>
                <SelectItem value="CNPJ">CNPJ</SelectItem>
              </SelectContent>
            </Select>
            <Input
              placeholder={dadosPagador.tipo_documento === 'CPF' ? 'CPF' : 'CNPJ'}
              value={dadosPagador.documento}
              onChange={(e) => setDadosPagador(prev => ({ ...prev, documento: e.target.value }))}
            />
          </div>

          <Input
            placeholder="Telefone (opcional)"
            value={dadosPagador.telefone}
            onChange={(e) => setDadosPagador(prev => ({ ...prev, telefone: e.target.value }))}
          />
        </div>

        {/* Dados do Cartão (se necessário) */}
        {selectedMethod?.type === 'cartao' && (
          <div className="space-y-3">
            <h4 className="font-medium">Dados do Cartão</h4>

            <Input
              placeholder="Número do cartão"
              value={dadosCartao.numero}
              onChange={(e) => setDadosCartao(prev => ({ ...prev, numero: e.target.value }))}
            />

            <div className="grid grid-cols-2 gap-2">
              <Input
                placeholder="MM/AA"
                value={dadosCartao.vencimento}
                onChange={(e) => setDadosCartao(prev => ({ ...prev, vencimento: e.target.value }))}
              />
              <Input
                placeholder="CVV"
                value={dadosCartao.cvv}
                onChange={(e) => setDadosCartao(prev => ({ ...prev, cvv: e.target.value }))}
              />
            </div>

            <Input
              placeholder="Nome no cartão"
              value={dadosCartao.nome}
              onChange={(e) => setDadosCartao(prev => ({ ...prev, nome: e.target.value }))}
            />

            <Select
              value={dadosCartao.parcelas.toString()}
              onValueChange={(value) => setDadosCartao(prev => ({ ...prev, parcelas: parseInt(value) }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Parcelas" />
              </SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(parcela => (
                  <SelectItem key={parcela} value={parcela.toString()}>
                    {parcela}x de {new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL'
                    }).format(valor / parcela)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <Button
          onClick={processarPagamento}
          disabled={loading || !selectedMethod}
          className="w-full"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processando...
            </>
          ) : (
            `Pagar ${new Intl.NumberFormat('pt-BR', {
              style: 'currency',
              currency: 'BRL'
            }).format(valor)}`
          )}
        </Button>
      </CardContent>
    </Card>
  );
};

export default PaymentComponent;
