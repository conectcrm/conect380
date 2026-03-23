import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { KeyRound, Eye, EyeOff, AlertCircle, CheckCircle2 } from 'lucide-react';
import api from '../services/api';
import Conect360Logo from '../components/ui/Conect360Logo';
import { toastService } from '../services/toastService';

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

interface LocationState {
  userId: string;
  email: string;
  nome: string;
  senhaTemporaria?: string;
}

const TrocarSenhaPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LocationState | undefined;
  const nomeUsuario = state?.nome ?? 'Usuário';
  const emailUsuario = state?.email ?? '';
  const senhaTemporariaRecebida = state?.senhaTemporaria?.trim() || '';

  const [senhaAntiga, setSenhaAntiga] = useState(() => senhaTemporariaRecebida);
  const [senhaNova, setSenhaNova] = useState('');
  const [senhaConfirmacao, setSenhaConfirmacao] = useState('');
  const [mostrarSenhaAntiga, setMostrarSenhaAntiga] = useState(false);
  const [mostrarSenhaNova, setMostrarSenhaNova] = useState(false);
  const [mostrarSenhaConfirmacao, setMostrarSenhaConfirmacao] = useState(false);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  React.useEffect(() => {
    if (senhaTemporariaRecebida) {
      setSenhaAntiga(senhaTemporariaRecebida);
    }
  }, [senhaTemporariaRecebida]);

  // Validações em tempo real
  const validacoes = {
    tamanhoMinimo: senhaNova.length >= 6,
    senhasIguais: senhaNova === senhaConfirmacao && senhaNova.length > 0,
    preenchido: senhaAntiga.length > 0 && senhaNova.length > 0 && senhaConfirmacao.length > 0,
  };

  const formularioValido =
    validacoes.tamanhoMinimo && validacoes.senhasIguais && validacoes.preenchido;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formularioValido) {
      toastService.error('Preencha todos os campos corretamente');
      return;
    }

    if (!state?.userId) {
      toastService.error('Dados de sessão inválidos. Faça login novamente.');
      navigate('/login');
      return;
    }

    try {
      setLoading(true);
      setErro(null);

      const response = await api.post('/auth/trocar-senha', {
        userId: state.userId,
        senhaAntiga,
        senhaNova,
      });

      if (response.data.success) {
        toastService.success('Senha alterada com sucesso! Redirecionando...');

        // Aguardar 2 segundos e redirecionar para login
        setTimeout(() => {
          navigate('/login', {
            state: {
              message: 'Senha alterada! Faça login com sua nova senha.',
              email: emailUsuario,
            },
          });
        }, 2000);
      }
    } catch (err: unknown) {
      console.error('Erro ao trocar senha:', err);
      const errorMessage =
        normalizeApiErrorMessage(err) || (err instanceof Error ? err.message : 'Erro ao trocar senha');
      setErro(errorMessage);
      toastService.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Se não tiver dados na navegação, redirecionar
  if (!state?.userId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-10">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 max-w-md w-full text-center">
          <div className="flex items-center justify-center mb-6">
            <Conect360Logo size="lg" variant="full" className="w-auto" />
          </div>
          <AlertCircle className="h-14 w-14 text-red-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Sessão inválida</h2>
          <p className="text-gray-600 mb-6">
            Não foi possível identificar sua sessão. Por favor, faça login novamente.
          </p>
          <button
            onClick={() => navigate('/login')}
            className="w-full bg-[#159A9C] text-white px-4 py-2 rounded-lg hover:bg-[#0F7B7D] transition-colors text-sm font-medium"
          >
            Ir para login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-10">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-6">
            <Conect360Logo size="lg" variant="full" className="w-auto" />
          </div>
          <div className="bg-[#DEEFE7] rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <KeyRound className="h-8 w-8 text-[#159A9C]" />
          </div>
          <h1 className="text-3xl font-bold text-[#002333] mb-2">Trocar senha</h1>
          <p className="text-[#002333]/70">
            Olá, <strong>{nomeUsuario}</strong>! Este é seu primeiro acesso.
          </p>
          <p className="text-sm text-[#002333]/60 mt-1">Por segurança, troque sua senha temporária.</p>
        </div>

        {/* Erro */}
        {erro && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-start">
            <AlertCircle className="h-5 w-5 text-red-600 mr-3 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-800">{erro}</p>
          </div>
        )}

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Senha Temporária */}
          {senhaTemporariaRecebida ? (
            <div className="bg-[#159A9C]/10 border border-[#159A9C]/20 rounded-lg p-4">
              <p className="text-sm text-[#002333] font-medium">
                Sua senha temporária foi aplicada automaticamente para concluir a troca.
              </p>
              <button
                type="button"
                onClick={() => setMostrarSenhaAntiga(!mostrarSenhaAntiga)}
                className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-[#159A9C] hover:text-[#0F7B7D] transition-colors"
              >
                {mostrarSenhaAntiga ? (
                  <>
                    <EyeOff className="h-4 w-4" />
                    Ocultar senha temporária
                  </>
                ) : (
                  <>
                    <Eye className="h-4 w-4" />
                    Mostrar senha temporária
                  </>
                )}
              </button>
              {mostrarSenhaAntiga && (
                <div className="mt-2 px-3 py-2 bg-white border border-[#DEEFE7] rounded-md font-mono text-sm text-[#002333]">
                  {senhaAntiga}
                </div>
              )}
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Senha Temporária
              </label>
              <div className="relative">
                <input
                  type={mostrarSenhaAntiga ? 'text' : 'password'}
                  value={senhaAntiga}
                  onChange={(e) => setSenhaAntiga(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent pr-12"
                  placeholder="Digite a senha temporária"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setMostrarSenhaAntiga(!mostrarSenhaAntiga)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#B4BEC9] hover:text-[#159A9C] transition-colors"
                >
                  {mostrarSenhaAntiga ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Nova Senha */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Nova Senha</label>
            <div className="relative">
              <input
                type={mostrarSenhaNova ? 'text' : 'password'}
                value={senhaNova}
                onChange={(e) => setSenhaNova(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent pr-12"
                placeholder="Digite sua nova senha"
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setMostrarSenhaNova(!mostrarSenhaNova)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#B4BEC9] hover:text-[#159A9C] transition-colors"
              >
                {mostrarSenhaNova ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            {/* Validação tamanho */}
            <div className="flex items-center mt-2">
              {senhaNova.length > 0 &&
                (validacoes.tamanhoMinimo ? (
                  <CheckCircle2 className="h-4 w-4 text-green-600 mr-2" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-red-600 mr-2" />
                ))}
              <p
                className={`text-xs ${
                  senhaNova.length === 0
                    ? 'text-gray-500'
                    : validacoes.tamanhoMinimo
                      ? 'text-green-600'
                      : 'text-red-600'
                }`}
              >
                Mínimo de 6 caracteres
              </p>
            </div>
          </div>

          {/* Confirmar Senha */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Confirmar Nova Senha
            </label>
            <div className="relative">
              <input
                type={mostrarSenhaConfirmacao ? 'text' : 'password'}
                value={senhaConfirmacao}
                onChange={(e) => setSenhaConfirmacao(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent pr-12"
                placeholder="Confirme sua nova senha"
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setMostrarSenhaConfirmacao(!mostrarSenhaConfirmacao)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#B4BEC9] hover:text-[#159A9C] transition-colors"
              >
                {mostrarSenhaConfirmacao ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
            {/* Validação senhas iguais */}
            {senhaConfirmacao.length > 0 && (
              <div className="flex items-center mt-2">
                {validacoes.senhasIguais ? (
                  <CheckCircle2 className="h-4 w-4 text-green-600 mr-2" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-red-600 mr-2" />
                )}
                <p
                  className={`text-xs ${
                    validacoes.senhasIguais ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {validacoes.senhasIguais ? 'Senhas conferem' : 'Senhas não conferem'}
                </p>
              </div>
            )}
          </div>

          {/* Botão Submit */}
          <button
            type="submit"
            disabled={!formularioValido || loading}
            className={`w-full py-3 rounded-lg font-semibold transition-all ${
              formularioValido && !loading
                ? 'bg-[#159A9C] text-white hover:bg-[#0F7B7D] shadow-sm'
                : 'bg-gray-200 text-[#002333]/50 cursor-not-allowed'
            }`}
          >
            {loading ? 'Alterando senha...' : 'Trocar senha'}
          </button>
        </form>

        {/* Footer */}
        <div className="mt-6 text-center">
          <button
            onClick={() => navigate('/login')}
            className="text-sm text-[#159A9C] hover:text-[#0F7B7D] hover:underline transition-colors"
          >
            ← Voltar para login
          </button>
        </div>
      </div>
    </div>
  );
};

export default TrocarSenhaPage;
