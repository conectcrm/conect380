import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { KeyRound, Eye, EyeOff, AlertCircle, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';

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
      toast.error('Preencha todos os campos corretamente');
      return;
    }

    if (!state?.userId) {
      toast.error('Dados de sessão inválidos. Faça login novamente.');
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
        toast.success('✅ Senha alterada com sucesso! Redirecionando...');

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
        (err as any)?.response?.data?.message ||
        (err instanceof Error ? err.message : 'Erro ao trocar senha');
      setErro(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Se não tiver dados na navegação, redirecionar
  if (!state?.userId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-6">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Sessão Inválida</h2>
          <p className="text-gray-600 mb-6">
            Não foi possível identificar sua sessão. Por favor, faça login novamente.
          </p>
          <button
            onClick={() => navigate('/login')}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Ir para Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-6">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="bg-blue-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <KeyRound className="h-8 w-8 text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold text-[#002333] mb-2">Trocar Senha</h1>
          <p className="text-gray-600">
            Olá, <strong>{nomeUsuario}</strong>! Este é seu primeiro acesso.
          </p>
          <p className="text-sm text-gray-500 mt-1">Por segurança, troque sua senha temporária.</p>
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
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-900 font-medium">
                Sua senha temporária foi aplicada automaticamente para concluir a troca.
              </p>
              <button
                type="button"
                onClick={() => setMostrarSenhaAntiga(!mostrarSenhaAntiga)}
                className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700"
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
                <div className="mt-2 px-3 py-2 bg-white border border-blue-200 rounded-md font-mono text-sm text-blue-900">
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
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-12"
                  placeholder="Digite a senha temporária"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setMostrarSenhaAntiga(!mostrarSenhaAntiga)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
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
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-12"
                placeholder="Digite sua nova senha"
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setMostrarSenhaNova(!mostrarSenhaNova)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
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
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-12"
                placeholder="Confirme sua nova senha"
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setMostrarSenhaConfirmacao(!mostrarSenhaConfirmacao)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
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
                ? 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-lg'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {loading ? 'Alterando senha...' : 'Trocar Senha'}
          </button>
        </form>

        {/* Footer */}
        <div className="mt-6 text-center">
          <button
            onClick={() => navigate('/login')}
            className="text-sm text-blue-600 hover:text-blue-700 hover:underline"
          >
            ← Voltar para login
          </button>
        </div>
      </div>
    </div>
  );
};

export default TrocarSenhaPage;
