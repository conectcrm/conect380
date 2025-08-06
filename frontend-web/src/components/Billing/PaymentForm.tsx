import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import {
  CreditCard,
  Smartphone,
  Building,
  Lock,
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';

interface PaymentMethod {
  id: string;
  name: string;
  icon: React.ComponentType<any>;
  type: 'card' | 'pix' | 'bank';
  fees?: string;
  processingTime: string;
  available: boolean;
}

interface PaymentFormProps {
  planoSelecionado?: {
    id: string;
    nome: string;
    preco: number | string;
    periodo: string;
    features: string[];
  };
  onPaymentSuccess: (paymentData: any) => void;
  onCancel: () => void;
  className?: string;
}

export const PaymentForm: React.FC<PaymentFormProps> = ({
  planoSelecionado,
  onPaymentSuccess,
  onCancel,
  className
}) => {
  const [selectedMethod, setSelectedMethod] = useState<string>('card');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStep, setPaymentStep] = useState<'method' | 'details' | 'processing' | 'success'>('method');
  const [formData, setFormData] = useState({
    // Dados do cartão
    cardNumber: '',
    cardName: '',
    cardExpiry: '',
    cardCvv: '',
    // Dados pessoais
    email: '',
    cpf: '',
    phone: '',
    // Endereço
    cep: '',
    address: '',
    city: '',
    state: ''
  });

  // Helper function para garantir que o preço seja sempre um número
  const getPrice = (preco?: number | string): number => {
    if (!preco) return 0;
    return typeof preco === 'string' ? parseFloat(preco) : preco;
  };

  // Helper function para formatar preço
  const formatPrice = (preco?: number | string): string => {
    const price = getPrice(preco);
    return price.toFixed(2);
  };

  const paymentMethods: PaymentMethod[] = [
    {
      id: 'card',
      name: 'Cartão de Crédito',
      icon: CreditCard,
      type: 'card',
      fees: 'Taxa: 3,9%',
      processingTime: 'Aprovação imediata',
      available: true
    },
    {
      id: 'pix',
      name: 'PIX',
      icon: Smartphone,
      type: 'pix',
      processingTime: 'Confirmação em até 2 minutos',
      available: true
    },
    {
      id: 'boleto',
      name: 'Boleto Bancário',
      icon: Building,
      type: 'bank',
      processingTime: 'Confirmação em 1-3 dias úteis',
      available: true
    }
  ];

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(' ');
    } else {
      return v;
    }
  };

  const formatExpiry = (value: string) => {
    const v = value.replace(/\D/g, '');
    if (v.length >= 2) {
      return `${v.slice(0, 2)}/${v.slice(2, 4)}`;
    }
    return v;
  };

  const validateForm = () => {
    if (selectedMethod === 'card') {
      return formData.cardNumber.replace(/\s/g, '').length === 16 &&
        formData.cardName.length > 0 &&
        formData.cardExpiry.length === 5 &&
        formData.cardCvv.length >= 3 &&
        formData.email.length > 0;
    }
    return formData.email.length > 0;
  };

  const handlePayment = async () => {
    if (!validateForm()) return;

    setIsProcessing(true);
    setPaymentStep('processing');

    try {
      // Simular processamento
      await new Promise(resolve => setTimeout(resolve, 3000));

      const paymentData = {
        method: selectedMethod,
        plano: planoSelecionado,
        userData: formData,
        transactionId: `tx_${Date.now()}`,
        status: 'success'
      };

      setPaymentStep('success');
      setTimeout(() => {
        onPaymentSuccess(paymentData);
      }, 2000);

    } catch (error) {
      console.error('Erro no pagamento:', error);
      setIsProcessing(false);
      setPaymentStep('details');
    }
  };

  const renderMethodSelection = () => (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Escolha a forma de pagamento
        </h3>
        <p className="text-sm text-gray-600">
          Selecione como deseja pagar pela assinatura
        </p>
      </div>

      <div className="grid gap-3">
        {paymentMethods.map((method) => {
          const Icon = method.icon;
          return (
            <button
              key={method.id}
              onClick={() => setSelectedMethod(method.id)}
              disabled={!method.available}
              className={`w-full p-4 border-2 rounded-xl text-left transition-all duration-200 hover:border-blue-300 hover:bg-blue-50 ${selectedMethod === method.id
                  ? "border-blue-500 bg-blue-50 shadow-md"
                  : "border-gray-200 bg-white"
                } ${!method.available && "opacity-50 cursor-not-allowed"}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white rounded-lg border border-gray-200">
                    <Icon className="w-5 h-5 text-gray-700" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{method.name}</div>
                    <div className="text-sm text-gray-600">{method.processingTime}</div>
                    {method.fees && (
                      <div className="text-xs text-orange-600 font-medium">{method.fees}</div>
                    )}
                  </div>
                </div>
                {selectedMethod === method.id && (
                  <CheckCircle className="w-5 h-5 text-blue-500" />
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );

  const renderCardForm = () => (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Dados do cartão de crédito
        </h3>
        <p className="text-sm text-gray-600">
          Seus dados estão protegidos com criptografia SSL
        </p>
      </div>

      <div className="grid gap-4">
        <div>
          <Label htmlFor="cardNumber">Número do cartão</Label>
          <Input
            id="cardNumber"
            placeholder="1234 5678 9012 3456"
            value={formData.cardNumber}
            onChange={(e) => handleInputChange('cardNumber', formatCardNumber(e.target.value))}
            maxLength={19}
          />
        </div>

        <div>
          <Label htmlFor="cardName">Nome no cartão</Label>
          <Input
            id="cardName"
            placeholder="Nome como está no cartão"
            value={formData.cardName}
            onChange={(e) => handleInputChange('cardName', e.target.value.toUpperCase())}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="cardExpiry">Validade</Label>
            <Input
              id="cardExpiry"
              placeholder="MM/AA"
              value={formData.cardExpiry}
              onChange={(e) => handleInputChange('cardExpiry', formatExpiry(e.target.value))}
              maxLength={5}
            />
          </div>
          <div>
            <Label htmlFor="cardCvv">CVV</Label>
            <Input
              id="cardCvv"
              placeholder="123"
              value={formData.cardCvv}
              onChange={(e) => handleInputChange('cardCvv', e.target.value.replace(/\D/g, ''))}
              maxLength={4}
            />
          </div>
        </div>

        <div>
          <Label htmlFor="email">E-mail</Label>
          <Input
            id="email"
            type="email"
            placeholder="seu@email.com"
            value={formData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
          />
        </div>
      </div>
    </div>
  );

  const renderPixForm = () => (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Pagamento via PIX
        </h3>
        <p className="text-sm text-gray-600">
          Após confirmar, você receberá o QR Code para pagamento
        </p>
      </div>

      <div>
        <Label htmlFor="email">E-mail para confirmação</Label>
        <Input
          id="email"
          type="email"
          placeholder="seu@email.com"
          value={formData.email}
          onChange={(e) => handleInputChange('email', e.target.value)}
        />
      </div>
    </div>
  );

  const renderProcessing = () => (
    <div className="text-center py-8">
      <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        Processando pagamento...
      </h3>
      <p className="text-sm text-gray-600">
        Por favor, aguarde enquanto processamos seu pagamento
      </p>
    </div>
  );

  const renderSuccess = () => (
    <div className="text-center py-8">
      <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
      <h3 className="text-xl font-bold text-gray-900 mb-2">
        Pagamento realizado com sucesso!
      </h3>
      <p className="text-sm text-gray-600 mb-4">
        Sua assinatura foi ativada e você já pode usar todos os recursos
      </p>
      <Badge variant="secondary" className="text-sm bg-green-100 text-green-800">
        Assinatura Ativa
      </Badge>
    </div>
  );

  if (paymentStep === 'processing') {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          {renderProcessing()}
        </CardContent>
      </Card>
    );
  }

  if (paymentStep === 'success') {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          {renderSuccess()}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle>Finalizar Assinatura</CardTitle>
          <Button variant="ghost" size="sm" onClick={onCancel}>
            ✕
          </Button>
        </div>

        {planoSelecionado && (
          <div className="bg-gray-50 rounded-lg p-4 mt-4">
            <div className="flex justify-between items-center">
              <div>
                <div className="font-semibold text-gray-900">{planoSelecionado.nome}</div>
                <div className="text-sm text-gray-600">{planoSelecionado.periodo}</div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-900">
                  R$ {formatPrice(planoSelecionado.preco)}
                </div>
                <div className="text-sm text-gray-600">por mês</div>
              </div>
            </div>
          </div>
        )}
      </CardHeader>

      <CardContent className="p-6 pt-0">
        {paymentStep === 'method' && (
          <div className="space-y-6">
            {renderMethodSelection()}

            <div className="flex gap-3">
              <Button
                onClick={() => setPaymentStep('details')}
                className="flex-1"
                disabled={!selectedMethod}
              >
                Continuar
              </Button>
              <Button variant="outline" onClick={onCancel}>
                Cancelar
              </Button>
            </div>
          </div>
        )}

        {paymentStep === 'details' && (
          <div className="space-y-6">
            {selectedMethod === 'card' && renderCardForm()}
            {selectedMethod === 'pix' && renderPixForm()}

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Lock className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <div className="font-medium text-yellow-800">Pagamento Seguro</div>
                  <div className="text-yellow-700">
                    Seus dados são protegidos com criptografia SSL de 256 bits
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={handlePayment}
                className="flex-1"
                disabled={!validateForm() || isProcessing}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Processando...
                  </>
                ) : (
                  `Pagar R$ ${formatPrice(planoSelecionado?.preco)}`
                )}
              </Button>
              <Button variant="outline" onClick={() => setPaymentStep('method')}>
                Voltar
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};