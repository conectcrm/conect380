import React, { useState, useEffect } from 'react';
import { BaseModal } from '../base/BaseModal';
import { Button } from '../ui';
import {
  MessageCircle,
  Send,
  AlertCircle,
  CheckCircle,
  Loader2,
  FileText,
  Phone,
  User,
  DollarSign,
} from 'lucide-react';

interface ModalEnviarWhatsAppProps {
  isOpen: boolean;
  onClose: () => void;
  proposta: {
    id: string;
    numero: string;
    cliente: {
      nome: string;
      whatsapp?: string;
      telefone?: string;
    };
    valorTotal: number;
    empresa: {
      nome: string;
    };
  };
  pdfBuffer?: Buffer | Uint8Array;
  onSuccess?: () => void;
}

interface WhatsAppStatus {
  isConnected: boolean;
  isAuthenticated: boolean;
}

const ModalEnviarWhatsApp: React.FC<ModalEnviarWhatsAppProps> = ({
  isOpen,
  onClose,
  proposta,
  pdfBuffer,
  onSuccess,
}) => {
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [customMessage, setCustomMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [whatsappStatus, setWhatsappStatus] = useState<WhatsAppStatus>({
    isConnected: false,
    isAuthenticated: false,
  });
  const [step, setStep] = useState<'check' | 'form' | 'sending' | 'success' | 'error'>('check');
  const [errorMessage, setErrorMessage] = useState('');

  // Carregar status do WhatsApp ao abrir modal
  useEffect(() => {
    if (isOpen) {
      checkWhatsAppStatus();
      initializeForm();
    }
  }, [isOpen, proposta]);

  // Inicializar formulário
  const initializeForm = () => {
    const number = proposta.cliente.whatsapp || proposta.cliente.telefone || '';
    setWhatsappNumber(number);
    setCustomMessage('');
    setStep('check');
    setErrorMessage('');
  };

  // Verificar status do WhatsApp
  const checkWhatsAppStatus = async () => {
    try {
      const response = await fetch('/api/whatsapp/status', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        const result = await response.json();
        setWhatsappStatus(result.data);

        if (result.data.isConnected && result.data.isAuthenticated) {
          setStep('form');
        } else {
          setStep('check');
        }
      }
    } catch (error) {
      console.error('Erro ao verificar status WhatsApp:', error);
      setStep('check');
    }
  };

  // Conectar WhatsApp
  const handleConnectWhatsApp = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/whatsapp/initialize', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        // Aguardar um pouco e verificar status novamente
        setTimeout(() => {
          checkWhatsAppStatus();
        }, 3000);
      } else {
        const error = await response.json();
        setErrorMessage(error.message || 'Erro ao conectar WhatsApp');
        setStep('error');
      }
    } catch (error) {
      console.error('Erro ao conectar WhatsApp:', error);
      setErrorMessage('Erro ao conectar WhatsApp');
      setStep('error');
    } finally {
      setLoading(false);
    }
  };

  // Validar número
  const validateNumber = (number: string): boolean => {
    const cleaned = number.replace(/\D/g, '');
    return cleaned.length >= 10 && cleaned.length <= 13;
  };

  // Formatar número para exibição
  const formatNumber = (number: string): string => {
    const cleaned = number.replace(/\D/g, '');
    if (cleaned.length === 11) {
      return cleaned.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3');
    } else if (cleaned.length === 10) {
      return cleaned.replace(/^(\d{2})(\d{4})(\d{4})$/, '($1) $2-$3');
    }
    return number;
  };

  // Gerar mensagem padrão
  const getDefaultMessage = (): string => {
    const valorFormatado = new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(proposta.valorTotal);

    return `🎯 *Nova Proposta Comercial*

👋 Olá *${proposta.cliente.nome}*!

📋 Enviamos sua proposta comercial:
• *Número:* ${proposta.numero}
• *Valor Total:* ${valorFormatado}
• *Empresa:* ${proposta.empresa.nome}

📎 O arquivo PDF com todos os detalhes está anexado acima.

✅ *Próximos Passos:*
• Analise a proposta com calma
• Entre em contato conosco para esclarecimentos
• Confirme sua aprovação quando estiver pronto

📞 *Dúvidas?* Responda esta mensagem!

---
_Enviado automaticamente pelo sistema ${proposta.empresa.nome}_`;
  };

  // Enviar proposta
  const handleSendProposal = async () => {
    if (!whatsappNumber.trim()) {
      alert('Digite o número do WhatsApp');
      return;
    }

    if (!validateNumber(whatsappNumber)) {
      alert('Número de WhatsApp inválido');
      return;
    }

    setLoading(true);
    setStep('sending');

    try {
      // Preparar FormData
      const formData = new FormData();
      formData.append('clienteNome', proposta.cliente.nome);
      formData.append('clienteWhatsApp', whatsappNumber);
      formData.append('propostaNumero', proposta.numero);
      formData.append('valorTotal', proposta.valorTotal.toString());
      formData.append('empresaNome', proposta.empresa.nome);

      if (customMessage.trim()) {
        formData.append('mensagemPersonalizada', customMessage);
      }

      // Adicionar PDF se disponível
      if (pdfBuffer) {
        const blob = new Blob([pdfBuffer], { type: 'application/pdf' });
        formData.append('pdf', blob, `Proposta_${proposta.numero}.pdf`);
      }

      const response = await fetch('/api/whatsapp/send-proposal', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: formData,
      });

      const result = await response.json();

      if (response.ok) {
        setStep('success');
        if (onSuccess) {
          onSuccess();
        }
      } else {
        setErrorMessage(result.message || 'Erro ao enviar proposta');
        setStep('error');
      }
    } catch (error) {
      console.error('Erro ao enviar proposta:', error);
      setErrorMessage('Erro ao enviar proposta via WhatsApp');
      setStep('error');
    } finally {
      setLoading(false);
    }
  };

  // Renderizar conteúdo baseado no step
  const renderContent = () => {
    switch (step) {
      case 'check':
        return (
          <div className="text-center py-6">
            <MessageCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Verificando WhatsApp</h3>

            {!whatsappStatus.isConnected ? (
              <div className="space-y-4">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-yellow-700">
                    <AlertCircle className="w-5 h-5" />
                    <span className="font-medium">WhatsApp não conectado</span>
                  </div>
                  <p className="text-sm text-yellow-600 mt-2">
                    É necessário conectar o WhatsApp Business para enviar propostas.
                  </p>
                </div>

                <Button
                  onClick={handleConnectWhatsApp}
                  disabled={loading}
                  className="bg-green-500 hover:bg-green-600"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Conectando...
                    </>
                  ) : (
                    <>
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Conectar WhatsApp
                    </>
                  )}
                </Button>

                <p className="text-xs text-gray-500">
                  Será necessário escanear o QR Code com seu WhatsApp
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-green-700">
                    <CheckCircle className="w-5 h-5" />
                    <span className="font-medium">WhatsApp conectado</span>
                  </div>
                  <p className="text-sm text-green-600 mt-2">
                    Pronto para enviar propostas via WhatsApp.
                  </p>
                </div>

                <Button onClick={() => setStep('form')} className="bg-blue-500 hover:bg-blue-600">
                  Continuar
                </Button>
              </div>
            )}
          </div>
        );

      case 'form':
        return (
          <div className="space-y-6">
            {/* Dados da Proposta */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Dados da Proposta
              </h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Cliente:</span>
                  <p className="font-medium">{proposta.cliente.nome}</p>
                </div>
                <div>
                  <span className="text-gray-600">Número:</span>
                  <p className="font-medium">{proposta.numero}</p>
                </div>
                <div>
                  <span className="text-gray-600">Valor:</span>
                  <p className="font-medium">
                    {new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                    }).format(proposta.valorTotal)}
                  </p>
                </div>
                <div>
                  <span className="text-gray-600">Empresa:</span>
                  <p className="font-medium">{proposta.empresa.nome}</p>
                </div>
              </div>
            </div>

            {/* Número WhatsApp */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Phone className="w-4 h-4 inline mr-1" />
                Número do WhatsApp
              </label>
              <input
                type="tel"
                value={whatsappNumber}
                onChange={(e) => setWhatsappNumber(e.target.value)}
                placeholder="11999999999"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Digite apenas números com DDD (ex: 11999999999)
              </p>
              {whatsappNumber && (
                <p className="text-sm text-green-600 mt-1">
                  Formato: {formatNumber(whatsappNumber)}
                </p>
              )}
            </div>

            {/* Mensagem Personalizada */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mensagem Personalizada (opcional)
              </label>
              <textarea
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                placeholder={getDefaultMessage()}
                rows={8}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
              <p className="text-xs text-gray-500 mt-1">
                Deixe em branco para usar a mensagem padrão
              </p>
            </div>

            {/* Informações sobre anexo */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-blue-700">
                <FileText className="w-4 h-4" />
                <span className="font-medium">
                  {pdfBuffer ? 'PDF será anexado' : 'Somente mensagem'}
                </span>
              </div>
              <p className="text-sm text-blue-600 mt-1">
                {pdfBuffer
                  ? 'O arquivo PDF da proposta será enviado junto com a mensagem.'
                  : 'Apenas a mensagem será enviada, sem anexo.'}
              </p>
            </div>
          </div>
        );

      case 'sending':
        return (
          <div className="text-center py-8">
            <Loader2 className="w-16 h-16 text-blue-500 mx-auto mb-4 animate-spin" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Enviando Proposta...</h3>
            <p className="text-gray-600">Aguarde enquanto enviamos a proposta via WhatsApp</p>
          </div>
        );

      case 'success':
        return (
          <div className="text-center py-8">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Proposta Enviada!</h3>
            <p className="text-gray-600 mb-4">
              A proposta foi enviada com sucesso para {formatNumber(whatsappNumber)}
            </p>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm text-green-700">
                ✅ Cliente: {proposta.cliente.nome}
                <br />✅ Proposta: {proposta.numero}
                <br />✅ WhatsApp: {formatNumber(whatsappNumber)}
                <br />
                {pdfBuffer && '✅ PDF anexado'}
              </p>
            </div>
          </div>
        );

      case 'error':
        return (
          <div className="text-center py-8">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Erro ao Enviar</h3>
            <p className="text-gray-600 mb-4">{errorMessage}</p>
            <div className="flex justify-center gap-2">
              <Button onClick={() => setStep('form')} variant="outline">
                Tentar Novamente
              </Button>
              <Button onClick={checkWhatsAppStatus} className="bg-green-500 hover:bg-green-600">
                Verificar WhatsApp
              </Button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // Renderizar footer
  const renderFooter = () => {
    switch (step) {
      case 'form':
        return (
          <>
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              onClick={handleSendProposal}
              disabled={!whatsappNumber.trim() || loading}
              className="bg-green-500 hover:bg-green-600"
            >
              <Send className="w-4 h-4 mr-2" />
              Enviar via WhatsApp
            </Button>
          </>
        );

      case 'success':
        return (
          <Button onClick={onClose} className="bg-green-500 hover:bg-green-600">
            Fechar
          </Button>
        );

      default:
        return (
          <Button variant="outline" onClick={onClose}>
            Fechar
          </Button>
        );
    }
  };

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title="Enviar via WhatsApp" maxWidth="lg">
      {renderContent()}
      <div className="flex justify-end gap-2 mt-6">{renderFooter()}</div>
    </BaseModal>
  );
};

export default ModalEnviarWhatsApp;
