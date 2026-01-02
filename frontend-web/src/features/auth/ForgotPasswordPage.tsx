import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, ArrowLeft, ArrowRight, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { authService } from '../../services/authService';

const ForgotPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<'success' | 'error' | null>(null);
  const [message, setMessage] = useState('');

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!email.trim()) {
      toast.error('Informe um e-mail válido para continuar');
      setFeedback('error');
      setMessage('Informe um e-mail válido para continuar');
      return;
    }

    try {
      setLoading(true);
      setFeedback(null);
      setMessage('');

      const response = await authService.solicitarRecuperacaoSenha(email.trim().toLowerCase());

      setFeedback('success');
      setMessage(
        response.message ||
          'Se o e-mail estiver cadastrado, enviaremos as instruções em instantes.',
      );
      toast.success('Verifique sua caixa de entrada ou a pasta de spam.');
    } catch (error: unknown) {
      console.error('Erro ao solicitar recuperação de senha:', error);
      const fallbackMessage =
        (error as any)?.response?.data?.message ||
        'Não foi possível processar sua solicitação. Tente novamente em instantes.';
      setFeedback('error');
      setMessage(fallbackMessage);
      toast.error(fallbackMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#DEEFE7] via-white to-[#DEEFE7] flex items-center justify-center px-4 py-10">
      <div className="max-w-lg w-full">
        <div className="mb-6">
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#159A9C] hover:text-[#0F7B7D] transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar para login
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-[#DEEFE7] p-8">
          <div className="text-center mb-8">
            <div className="h-16 w-16 mx-auto rounded-full bg-[#DEEFE7] flex items-center justify-center text-[#159A9C] mb-4">
              <Mail className="h-8 w-8" />
            </div>
            <h1 className="text-3xl font-bold text-[#002333] mb-2">Recuperar acesso</h1>
            <p className="text-[#4B5563]">
              Informe o e-mail cadastrado para receber um link seguro e criar uma nova senha.
            </p>
          </div>

          {feedback && (
            <div
              className={`flex items-start gap-3 rounded-xl border px-4 py-3 mb-6 ${
                feedback === 'success'
                  ? 'border-green-200 bg-green-50 text-green-800'
                  : 'border-red-200 bg-red-50 text-red-700'
              }`}
            >
              {feedback === 'success' ? (
                <CheckCircle2 className="h-5 w-5 mt-0.5" />
              ) : (
                <AlertCircle className="h-5 w-5 mt-0.5" />
              )}
              <p className="text-sm leading-relaxed">{message}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-[#002333] mb-2" htmlFor="email">
                E-mail cadastrado
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-[#B4BEC9] h-5 w-5" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="w-full pl-11 pr-4 py-3 border border-[#B4BEC9] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#159A9C] focus:border-transparent transition-colors"
                  placeholder="nome@empresa.com"
                  autoComplete="email"
                  disabled={loading}
                />
              </div>
              <p className="text-xs text-[#6B7280] mt-2">
                Enviaremos um e-mail com validade de 1 hora. Verifique também a pasta de spam.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#159A9C] to-[#0F7B7D] text-white font-semibold py-3 rounded-xl shadow-md hover:shadow-lg transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Enviando instruções...</span>
                </>
              ) : (
                <>
                  <span>Enviar link de recuperação</span>
                  <ArrowRight className="h-5 w-5" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
