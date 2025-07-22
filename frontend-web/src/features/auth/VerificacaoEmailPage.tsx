import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { 
  Mail, 
  CheckCircle, 
  XCircle, 
  Loader2, 
  ArrowRight,
  RefreshCw
} from 'lucide-react';
import { empresaService } from '../../services/empresaService';

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
        setMessage(response.message || 'Email verificado com sucesso!');
        
        // Redirecionar para login após 3 segundos
        setTimeout(() => {
          navigate('/login', {
            state: {
              message: 'Conta ativada com sucesso! Faça login para continuar.',
              email: emailParam
            }
          });
        }, 3000);
      } else {
        setStatus('error');
        setMessage(response.message || 'Erro ao verificar email');
      }
    } catch (error: any) {
      console.error('Erro na verificação:', error);
      
      if (error.message.includes('expirado')) {
        setStatus('expired');
        setMessage('O link de verificação expirou');
      } else {
        setStatus('error');
        setMessage(error.message || 'Erro ao verificar email');
      }
    }
  };

  const reenviarEmail = async () => {
    if (!email) {
      toast.error('Email não fornecido');
      return;
    }

    try {
      setIsResending(true);
      await empresaService.reenviarEmailAtivacao(email);
      
      toast.success('Email de ativação reenviado com sucesso!');
      setStatus('loading');
      setMessage('Verifique sua caixa de entrada...');
    } catch (error: any) {
      console.error('Erro ao reenviar email:', error);
      toast.error(error.message || 'Erro ao reenviar email');
    } finally {
      setIsResending(false);
    }
  };

  const renderContent = () => {
    switch (status) {
      case 'loading':
        return (
          <div className="text-center">
            <div className="w-20 h-20 mx-auto mb-6 bg-blue-100 rounded-full flex items-center justify-center">
              <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Verificando Email
            </h1>
            <p className="text-gray-600 mb-6">
              Aguarde enquanto verificamos seu email...
            </p>
          </div>
        );

      case 'success':
        return (
          <div className="text-center">
            <div className="w-20 h-20 mx-auto mb-6 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Email Verificado!
            </h1>
            <p className="text-gray-600 mb-6">
              {message}
            </p>
            <p className="text-sm text-gray-500 mb-6">
              Você será redirecionado para o login em alguns segundos...
            </p>
            <button
              onClick={() => navigate('/login', {
                state: {
                  message: 'Conta ativada com sucesso! Faça login para continuar.',
                  email: emailParam
                }
              })}
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#159A9C] text-white rounded-lg hover:bg-[#0F7B7D] transition-colors"
            >
              Ir para Login
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
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Link Expirado
            </h1>
            <p className="text-gray-600 mb-6">
              {message}. Você pode solicitar um novo link de verificação.
            </p>
            {email && (
              <div className="space-y-4">
                <p className="text-sm text-gray-500">
                  Reenviar para: <strong>{email}</strong>
                </p>
                <button
                  onClick={reenviarEmail}
                  disabled={isResending}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-[#159A9C] text-white rounded-lg hover:bg-[#0F7B7D] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isResending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Reenviando...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4" />
                      Reenviar Email
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
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Erro na Verificação
            </h1>
            <p className="text-gray-600 mb-6">
              {message}
            </p>
            <div className="space-y-4">
              {email && (
                <>
                  <p className="text-sm text-gray-500">
                    Reenviar para: <strong>{email}</strong>
                  </p>
                  <button
                    onClick={reenviarEmail}
                    disabled={isResending}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-[#159A9C] text-white rounded-lg hover:bg-[#0F7B7D] disabled:opacity-50 disabled:cursor-not-allowed transition-colors mr-4"
                  >
                    {isResending ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Reenviando...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-4 h-4" />
                        Reenviar Email
                      </>
                    )}
                  </button>
                </>
              )}
              <button
                onClick={() => navigate('/login')}
                className="inline-flex items-center gap-2 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Ir para Login
              </button>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#DEEFE7] to-white flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-lg shadow-lg p-8">
          {renderContent()}
        </div>
        
        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-gray-600 text-sm">
            Precisa de ajuda?{' '}
            <a 
              href="mailto:suporte@fenixcrm.com" 
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
