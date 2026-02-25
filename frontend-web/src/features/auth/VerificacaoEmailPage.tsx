import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Mail, CheckCircle, XCircle, Loader2, ArrowRight, RefreshCw } from 'lucide-react';
import { empresaService } from '../../services/empresaService';
import { toastService } from '../../services/toastService';
import Conect360Logo from '../../components/ui/Conect360Logo';

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null;
};

const normalizeApiErrorMessage = (err: unknown): string | undefined => {
  const errRecord = isRecord(err) ? err : undefined;
  const response = errRecord && isRecord(errRecord['response']) ? errRecord['response'] : undefined;
  const data = response && isRecord(response['data']) ? response['data'] : undefined;
  const responseMessage = data ? data['message'] : undefined;

  if (Array.isArray(responseMessage)) {
    const joined = responseMessage
      .filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
      .join('. ');
    return joined || undefined;
  }

  if (typeof responseMessage === 'string' && responseMessage.trim()) {
    return responseMessage;
  }

  const message = err instanceof Error ? err.message : undefined;
  return message?.trim() ? message : undefined;
};

export const VerificacaoEmailPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'expired'>('loading');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [isResending, setIsResending] = useState(false);

  const token = searchParams.get('token');
  const emailParam = searchParams.get('email');

  useEffect(() => {
    if (emailParam) {
      setEmail(emailParam);
    }

    if (token) {
      verificarToken();
    } else {
      setStatus('error');
      setMessage('Token de verificação não encontrado');
    }
  }, [token]);

  const verificarToken = async () => {
    if (!token) return;

    try {
      setStatus('loading');
      const response = await empresaService.verificarEmailAtivacao(token);

      if (response.success) {
        setStatus('success');
        setMessage(response.message || 'E-mail verificado com sucesso!');

        // Redirecionar para login após 3 segundos
        setTimeout(() => {
          navigate('/login', {
            state: {
              message: 'Conta ativada com sucesso! Faça login para continuar.',
              email: emailParam,
            },
          });
        }, 3000);
      } else {
        setStatus('error');
        setMessage(response.message || 'Erro ao verificar e-mail');
      }
    } catch (error: unknown) {
      console.error('Erro na verificação:', error);

      const errorMessage = normalizeApiErrorMessage(error) || 'Erro ao verificar e-mail';

      if (errorMessage.toLowerCase().includes('expirado')) {
        setStatus('expired');
        setMessage('O link de verificação expirou');
      } else {
        setStatus('error');
        setMessage(errorMessage);
      }
    }
  };

  const reenviarEmail = async () => {
    if (!email) {
      toastService.error('E-mail não fornecido');
      return;
    }

    try {
      setIsResending(true);
      await empresaService.reenviarEmailAtivacao(email);

      toastService.success('E-mail de ativação reenviado com sucesso!');
      setStatus('loading');
      setMessage('Verifique sua caixa de entrada...');
    } catch (error: unknown) {
      console.error('Erro ao reenviar e-mail:', error);
      toastService.error(normalizeApiErrorMessage(error) || 'Erro ao reenviar e-mail');
    } finally {
      setIsResending(false);
    }
  };

  const renderContent = () => {
    switch (status) {
      case 'loading':
        return (
          <div className="text-center">
            <div className="w-20 h-20 mx-auto mb-6 bg-[#159A9C]/10 rounded-full flex items-center justify-center">
              <Loader2 className="w-10 h-10 text-[#159A9C] animate-spin" />
            </div>
            <h1 className="text-2xl font-bold text-[#002333] mb-4">Verificando e-mail</h1>
            <p className="text-[#002333]/70 mb-6">Aguarde enquanto verificamos seu e-mail...</p>
          </div>
        );

      case 'success':
        return (
          <div className="text-center">
            <div className="w-20 h-20 mx-auto mb-6 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-[#002333] mb-4">E-mail verificado!</h1>
            <p className="text-[#002333]/70 mb-6">{message}</p>
            <p className="text-sm text-[#002333]/60 mb-6">
              Você será redirecionado para o login em alguns segundos...
            </p>
            <button
              onClick={() =>
                navigate('/login', {
                  state: {
                    message: 'Conta ativada com sucesso! Faça login para continuar.',
                    email: emailParam,
                  },
                })
              }
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#159A9C] text-white rounded-lg hover:bg-[#0F7B7D] transition-colors text-sm font-medium"
            >
              Ir para login
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        );

      case 'expired':
        return (
          <div className="text-center">
            <div className="w-20 h-20 mx-auto mb-6 bg-yellow-100 rounded-full flex items-center justify-center">
              <Mail className="w-10 h-10 text-yellow-600" />
            </div>
            <h1 className="text-2xl font-bold text-[#002333] mb-4">Link expirado</h1>
            <p className="text-[#002333]/70 mb-6">
              {message}. Você pode solicitar um novo link de verificação.
            </p>
            {email && (
              <div className="space-y-4">
                <p className="text-sm text-[#002333]/60">
                  Reenviar para: <strong>{email}</strong>
                </p>
                <button
                  onClick={reenviarEmail}
                  disabled={isResending}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[#159A9C] text-white rounded-lg hover:bg-[#0F7B7D] disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                >
                  {isResending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Reenviando...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4" />
                      Reenviar e-mail
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        );

      case 'error':
      default:
        return (
          <div className="text-center">
            <div className="w-20 h-20 mx-auto mb-6 bg-red-100 rounded-full flex items-center justify-center">
              <XCircle className="w-10 h-10 text-red-600" />
            </div>
            <h1 className="text-2xl font-bold text-[#002333] mb-4">Erro na verificação</h1>
            <p className="text-[#002333]/70 mb-6">{message}</p>
            <div className="space-y-4">
              {email && (
                <>
                  <p className="text-sm text-[#002333]/60">
                    Reenviar para: <strong>{email}</strong>
                  </p>
                  <button
                    onClick={reenviarEmail}
                    disabled={isResending}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-[#159A9C] text-white rounded-lg hover:bg-[#0F7B7D] disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                  >
                    {isResending ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Reenviando...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-4 h-4" />
                        Reenviar e-mail
                      </>
                    )}
                  </button>
                </>
              )}
              <button
                onClick={() => navigate('/login')}
                className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 text-[#002333] rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
              >
                Ir para login
              </button>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-center mb-6">
            <Conect360Logo size="lg" variant="full" className="w-auto" />
          </div>
          {renderContent()}
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-[#002333]/60 text-sm">
            Precisa de ajuda?{' '}
            <a
              href="mailto:suporte@conectsuite.com.br"
              className="text-[#159A9C] hover:underline"
            >
              Entre em contato
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default VerificacaoEmailPage;
