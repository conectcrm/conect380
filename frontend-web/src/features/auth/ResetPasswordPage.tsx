import React, { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { KeyRound, Eye, EyeOff, ArrowLeft, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { authService } from '../../services/authService';

const ResetPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = useMemo(() => searchParams.get('token')?.trim() || '', [searchParams]);

  const [novaSenha, setNovaSenha] = useState('');
  const [confirmacaoSenha, setConfirmacaoSenha] = useState('');
  const [mostrarNovaSenha, setMostrarNovaSenha] = useState(false);
  const [mostrarConfirmacao, setMostrarConfirmacao] = useState(false);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<'success' | 'error' | null>(null);
  const [message, setMessage] = useState('');

  const senhaValida = novaSenha.length >= 6;
  const senhasConferem = novaSenha.length > 0 && novaSenha === confirmacaoSenha;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!token) {
      setFeedback('error');
      setMessage('Token inválido ou expirado. Solicite uma nova recuperação.');
      toast.error('Token inválido ou expirado.');
      return;
    }

    if (!senhaValida) {
      toast.error('A nova senha deve ter pelo menos 6 caracteres.');
      return;
    }

    if (!senhasConferem) {
      toast.error('As senhas informadas não conferem.');
      return;
    }

    try {
      setLoading(true);
      setFeedback(null);
      setMessage('');

      const response = await authService.redefinirSenhaComToken({ token, senhaNova: novaSenha.trim() });

      setFeedback('success');
      setMessage(response.message || 'Senha alterada com sucesso! Você já pode fazer login.');
      toast.success('Senha redefinida com sucesso!');
      setNovaSenha('');
      setConfirmacaoSenha('');
    } catch (error: unknown) {
      console.error('Erro ao redefinir senha:', error);
      const fallbackMessage = (error as any)?.response?.data?.message || 'Token inválido ou expirado. Solicite uma nova recuperação de senha.';
      setFeedback('error');
      setMessage(fallbackMessage);
      toast.error(fallbackMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#DEEFE7] via-white to-[#DEEFE7] flex items-center justify-center px-4 py-10">
        <div className="max-w-lg w-full bg-white rounded-2xl shadow-xl border border-[#DEEFE7] p-8 text-center">
          <div className="h-16 w-16 mx-auto rounded-full bg-red-50 flex items-center justify-center text-red-500 mb-4">
            <AlertCircle className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-bold text-[#002333] mb-2">Link inválido</h1>
          <p className="text-[#4B5563] mb-6">
            Não encontramos um token válido de recuperação. Solicite um novo link e tente novamente.
          </p>
          <button
            type="button"
            onClick={() => navigate('/esqueci-minha-senha')}
            className="inline-flex items-center gap-2 bg-[#159A9C] text-white font-semibold px-5 py-3 rounded-xl hover:bg-[#0F7B7D] transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar para recuperar acesso
          </button>
        </div>
      </div>
    );
  }

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
              <KeyRound className="h-8 w-8" />
            </div>
            <h1 className="text-3xl font-bold text-[#002333] mb-2">Defina uma nova senha</h1>
            <p className="text-[#4B5563]">
              Crie uma senha segura para continuar acessando o Conect CRM.
            </p>
          </div>

          {feedback && (
            <div
              className={`flex items-start gap-3 rounded-xl border px-4 py-3 mb-6 ${feedback === 'success'
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
              <label className="block text-sm font-semibold text-[#002333] mb-2" htmlFor="nova-senha">
                Nova senha
              </label>
              <div className="relative">
                <input
                  id="nova-senha"
                  type={mostrarNovaSenha ? 'text' : 'password'}
                  value={novaSenha}
                  onChange={(event) => setNovaSenha(event.target.value)}
                  className="w-full pr-12 pl-4 py-3 border border-[#B4BEC9] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#159A9C] focus:border-transparent transition-colors"
                  placeholder="Digite a nova senha"
                  autoComplete="new-password"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setMostrarNovaSenha((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#B4BEC9] hover:text-[#159A9C] transition-colors"
                >
                  {mostrarNovaSenha ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              <p className={`text-xs mt-2 ${senhaValida ? 'text-green-600' : 'text-[#6B7280]'}`}>
                Mínimo de 6 caracteres.
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-[#002333] mb-2" htmlFor="confirmacao-senha">
                Confirmar nova senha
              </label>
              <div className="relative">
                <input
                  id="confirmacao-senha"
                  type={mostrarConfirmacao ? 'text' : 'password'}
                  value={confirmacaoSenha}
                  onChange={(event) => setConfirmacaoSenha(event.target.value)}
                  className="w-full pr-12 pl-4 py-3 border border-[#B4BEC9] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#159A9C] focus:border-transparent transition-colors"
                  placeholder="Repita a nova senha"
                  autoComplete="new-password"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setMostrarConfirmacao((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#B4BEC9] hover:text-[#159A9C] transition-colors"
                >
                  {mostrarConfirmacao ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              <p className={`text-xs mt-2 ${senhasConferem ? 'text-green-600' : 'text-[#6B7280]'}`}>
                {senhasConferem ? 'Senhas conferem.' : 'As senhas devem ser iguais.'}
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
                  <span>Salvando nova senha...</span>
                </>
              ) : (
                <>
                  <span>Atualizar senha</span>
                  <KeyRound className="h-5 w-5" />
                </>
              )}
            </button>
          </form>

          {feedback === 'success' && (
            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => navigate('/login', { replace: true })}
                className="inline-flex items-center gap-2 text-sm font-semibold text-[#159A9C] hover:text-[#0F7B7D] transition-colors"
              >
                Acessar login agora
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
