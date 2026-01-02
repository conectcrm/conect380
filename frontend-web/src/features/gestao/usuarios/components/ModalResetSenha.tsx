import React, { useState } from 'react';
import { Usuario } from '../../../../types/usuarios/index';
import { X, Key, Copy, Eye, EyeOff, AlertTriangle, CheckCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { getErrorMessage } from '../../../../utils/errorHandling';

interface ModalResetSenhaProps {
  usuario: Usuario;
  isOpen: boolean;
  onClose: () => void;
  onReset: (id: string) => Promise<string | null>;
}

export const ModalResetSenha: React.FC<ModalResetSenhaProps> = ({
  usuario,
  isOpen,
  onClose,
  onReset,
}) => {
  const [novaSenha, setNovaSenha] = useState<string | null>(null);
  const [isResetting, setIsResetting] = useState(false);
  const [showSenha, setShowSenha] = useState(false);

  const handleReset = async (): Promise<void> => {
    setIsResetting(true);
    try {
      const senha = await onReset(usuario.id);
      if (senha) {
        setNovaSenha(senha);
      }
    } catch (err) {
      const mensagem = getErrorMessage(err, 'Erro ao resetar senha');
      console.error('Erro ao resetar senha do usuário:', err);
      toast.error(mensagem);
    } finally {
      setIsResetting(false);
    }
  };

  const handleCopiarSenha = async (): Promise<void> => {
    if (novaSenha) {
      try {
        await navigator.clipboard.writeText(novaSenha);
        toast.success('Senha copiada para a área de transferência!');
      } catch (err) {
        const mensagem = getErrorMessage(err, 'Erro ao copiar senha');
        console.error('Erro ao copiar senha temporária:', err);
        toast.error(mensagem);
      }
    }
  };

  const handleClose = (): void => {
    setNovaSenha(null);
    setShowSenha(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={handleClose}
        />

        <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-md sm:w-full sm:p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-2">
              <Key className="w-6 h-6 text-[#159A9C]" />
              <h3 className="text-lg font-semibold text-gray-900">Resetar Senha</h3>
            </div>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="space-y-4">
            {/* Informações do usuário */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  {usuario.avatar_url ? (
                    <img
                      className="h-10 w-10 rounded-full object-cover"
                      src={usuario.avatar_url}
                      alt={usuario.nome}
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                      <span className="text-sm font-medium text-gray-600">
                        {usuario.nome.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-900">{usuario.nome}</div>
                  <div className="text-sm text-gray-500">{usuario.email}</div>
                </div>
              </div>
            </div>

            {!novaSenha ? (
              <>
                {/* Aviso */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex">
                    <AlertTriangle className="w-5 h-5 text-yellow-400" />
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-yellow-800">Atenção</h3>
                      <p className="mt-1 text-sm text-yellow-700">
                        Uma nova senha será gerada automaticamente. O usuário deverá usar essa nova
                        senha no próximo login.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Botões de ação */}
                <div className="flex items-center justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                    disabled={isResetting}
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleReset}
                    disabled={isResetting}
                    className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2 disabled:opacity-50"
                  >
                    {isResetting ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Key className="w-4 h-4" />
                    )}
                    <span>Resetar Senha</span>
                  </button>
                </div>
              </>
            ) : (
              <>
                {/* Sucesso */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-green-800">
                        Senha resetada com sucesso!
                      </h3>
                      <p className="mt-1 text-sm text-green-700">
                        A nova senha foi gerada. Compartilhe com o usuário de forma segura.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Nova senha */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nova Senha</label>
                  <div className="flex items-center space-x-2">
                    <div className="flex-1 relative">
                      <input
                        type={showSenha ? 'text' : 'password'}
                        value={novaSenha}
                        readOnly
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 font-mono text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => setShowSenha(!showSenha)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showSenha ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <button
                      onClick={handleCopiarSenha}
                      className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center space-x-1"
                      title="Copiar senha"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Botão de fechar */}
                <div className="flex items-center justify-end pt-4">
                  <button
                    onClick={handleClose}
                    className="bg-[#159A9C] text-white px-4 py-2 rounded-lg hover:bg-[#138A8C] transition-colors"
                  >
                    Fechar
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
