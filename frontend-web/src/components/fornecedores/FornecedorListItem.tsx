import React, { useState } from 'react';
import { Trash2, Eye, AlertTriangle } from 'lucide-react';
import { useFornecedorRemoval } from '../../hooks/useFornecedorRemoval';
import FornecedorRemovalError from './FornecedorRemovalError';

interface Fornecedor {
  id: number;
  nome: string;
  cnpj: string;
  telefone?: string;
  email?: string;
  ativo: boolean;
}

interface FornecedorListItemProps {
  fornecedor: Fornecedor;
  onUpdate: () => void;
  onViewContas: (fornecedorId: number) => void;
}

const FornecedorListItem: React.FC<FornecedorListItemProps> = ({
  fornecedor,
  onUpdate,
  onViewContas
}) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Função simples de notificação (você pode substituir por sua biblioteca preferida)
  const showNotification = (message: string, type: 'success' | 'error' | 'info') => {
    // Aqui você pode usar react-toastify, antd, ou qualquer outra biblioteca
    console.log(`[${type.toUpperCase()}] ${message}`);

    // Exemplo simples com alert (substitua por sua implementação)
    if (type === 'error') {
      alert(`❌ ${message}`);
    } else if (type === 'success') {
      alert(`✅ ${message}`);
    } else {
      alert(`ℹ️ ${message}`);
    }
  };

  const {
    isLoading,
    error,
    removeFornecedor,
    desativarFornecedor,
    clearError
  } = useFornecedorRemoval(
    onUpdate, // Callback de sucesso
    onViewContas, // Callback para navegar para contas
    {
      onSuccess: (message) => showNotification(message, 'success'),
      onError: (message) => showNotification(message, 'error'),
      onInfo: (message) => showNotification(message, 'info')
    }
  );

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    const success = await removeFornecedor(fornecedor.id);
    if (success) {
      setShowDeleteConfirm(false);
    }
    // Se houver erro, o modal de erro será exibido automaticamente
  };

  const handleDesativar = async () => {
    const success = await desativarFornecedor(fornecedor.id);
    if (success) {
      clearError();
    }
  };

  const handleVerContas = () => {
    onViewContas(fornecedor.id);
    clearError();
  };

  const handleCancelarError = () => {
    clearError();
    setShowDeleteConfirm(false);
  };

  return (
    <>
      <div className={`bg-white rounded-lg shadow-sm border p-4 ${!fornecedor.ativo ? 'opacity-60' : ''}`}>
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-gray-900">{fornecedor.nome}</h3>
              {!fornecedor.ativo && (
                <span className="px-2 py-1 text-xs bg-gray-200 text-gray-600 rounded">
                  Inativo
                </span>
              )}
            </div>
            <p className="text-sm text-gray-600">{fornecedor.cnpj}</p>
            {fornecedor.telefone && (
              <p className="text-sm text-gray-500">{fornecedor.telefone}</p>
            )}
            {fornecedor.email && (
              <p className="text-sm text-gray-500">{fornecedor.email}</p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onViewContas(fornecedor.id)}
              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title="Ver contas"
            >
              <Eye className="w-4 h-4" />
            </button>

            {fornecedor.ativo && (
              <button
                onClick={handleDeleteClick}
                disabled={isLoading}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                title="Excluir fornecedor"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Modal de confirmação simples */}
      {showDeleteConfirm && !error && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="w-6 h-6 text-red-600" />
              <h3 className="text-lg font-semibold">Confirmar exclusão</h3>
            </div>

            <p className="text-gray-600 mb-6">
              Tem certeza que deseja excluir o fornecedor <strong>{fornecedor.nome}</strong>?
              Esta ação não pode ser desfeita.
            </p>

            <div className="flex gap-3">
              <button
                onClick={handleConfirmDelete}
                disabled={isLoading}
                className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {isLoading ? 'Excluindo...' : 'Sim, excluir'}
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isLoading}
                className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de erro de dependência */}
      {error && (
        <FornecedorRemovalError
          message={error.message}
          details={error.details}
          fornecedorNome={fornecedor.nome}
          onDesativar={handleDesativar}
          onCancelar={handleCancelarError}
          onVerContas={handleVerContas}
        />
      )}
    </>
  );
};

export default FornecedorListItem;
