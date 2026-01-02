import React, { useState } from 'react';
import { propostasService } from '../services/propostasService';
import {
  Check,
  X,
  Send,
  Trash2,
  Copy,
  Mail,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader,
} from 'lucide-react';

interface BulkActionsProps {
  selectedIds: string[];
  onAction: (action: string, success: boolean) => void;
  onClearSelection: () => void;
}

export const BulkActions: React.FC<BulkActionsProps> = ({
  selectedIds,
  onAction,
  onClearSelection,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState<{
    action: string;
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  const handleStatusUpdate = async (novoStatus: 'enviada' | 'aprovada' | 'rejeitada') => {
    try {
      setIsLoading(true);
      await propostasService.atualizarStatusEmLote(selectedIds, novoStatus);
      onAction(`Status atualizado para ${novoStatus}`, true);
      onClearSelection();
    } catch (error) {
      console.error('Erro ao atualizar status em lote:', error);
      onAction('Erro ao atualizar status', false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setIsLoading(true);
      await propostasService.excluirEmLote(selectedIds);
      onAction(`${selectedIds.length} propostas excluídas`, true);
      onClearSelection();
    } catch (error) {
      console.error('Erro ao excluir propostas em lote:', error);
      onAction('Erro ao excluir propostas', false);
    } finally {
      setIsLoading(false);
      setShowConfirmDialog(null);
    }
  };

  const handleSendEmail = async () => {
    try {
      setIsLoading(true);
      await propostasService.enviarEmailEmLote(selectedIds);
      onAction(`${selectedIds.length} propostas enviadas por email`, true);
      onClearSelection();
    } catch (error) {
      console.error('Erro ao enviar emails em lote:', error);
      onAction('Erro ao enviar emails', false);
    } finally {
      setIsLoading(false);
      setShowConfirmDialog(null);
    }
  };

  const confirmDelete = () => {
    setShowConfirmDialog({
      action: 'delete',
      title: 'Confirmar Exclusão',
      message: `Tem certeza que deseja excluir ${selectedIds.length} proposta(s)? Esta ação não pode ser desfeita.`,
      onConfirm: handleDelete,
    });
  };

  const confirmSendEmail = () => {
    setShowConfirmDialog({
      action: 'email',
      title: 'Enviar Por Email',
      message: `Deseja enviar ${selectedIds.length} proposta(s) por email para os respectivos clientes?`,
      onConfirm: handleSendEmail,
    });
  };

  if (selectedIds.length === 0) return null;

  return (
    <>
      <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50">
        <div className="bg-white rounded-lg shadow-lg border p-4 flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-5 w-5 text-blue-600" />
            <span className="font-medium text-gray-900">
              {selectedIds.length} proposta(s) selecionada(s)
            </span>
          </div>

          <div className="h-6 w-px bg-gray-300"></div>

          <div className="flex items-center space-x-2">
            {/* Ação: Aprovar */}
            <button
              onClick={() => handleStatusUpdate('aprovada')}
              disabled={isLoading}
              className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:bg-gray-400 transition-colors duration-200"
              title="Aprovar selecionadas"
            >
              {isLoading ? (
                <Loader className="h-4 w-4 animate-spin" />
              ) : (
                <Check className="h-4 w-4" />
              )}
            </button>

            {/* Ação: Rejeitar */}
            <button
              onClick={() => handleStatusUpdate('rejeitada')}
              disabled={isLoading}
              className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 disabled:bg-gray-400 transition-colors duration-200"
              title="Rejeitar selecionadas"
            >
              {isLoading ? <Loader className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
            </button>

            {/* Ação: Enviar */}
            <button
              onClick={() => handleStatusUpdate('enviada')}
              disabled={isLoading}
              className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 transition-colors duration-200"
              title="Marcar como enviadas"
            >
              {isLoading ? (
                <Loader className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </button>

            {/* Ação: Enviar Email */}
            <button
              onClick={confirmSendEmail}
              disabled={isLoading}
              className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:bg-gray-100 transition-colors duration-200"
              title="Enviar por email"
            >
              {isLoading ? (
                <Loader className="h-4 w-4 animate-spin" />
              ) : (
                <Mail className="h-4 w-4" />
              )}
            </button>

            {/* Ação: Excluir */}
            <button
              onClick={confirmDelete}
              disabled={isLoading}
              className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 disabled:bg-gray-400 transition-colors duration-200"
              title="Excluir selecionadas"
            >
              {isLoading ? (
                <Loader className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
            </button>
          </div>

          <div className="h-6 w-px bg-gray-300"></div>

          {/* Limpar seleção */}
          <button
            onClick={onClearSelection}
            disabled={isLoading}
            className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:bg-gray-100 transition-colors duration-200"
            title="Limpar seleção"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Dialog de Confirmação */}
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center mb-4">
              {showConfirmDialog.action === 'delete' ? (
                <AlertTriangle className="h-6 w-6 text-red-500 mr-3" />
              ) : (
                <Mail className="h-6 w-6 text-blue-500 mr-3" />
              )}
              <h3 className="text-lg font-medium text-gray-900">{showConfirmDialog.title}</h3>
            </div>

            <p className="text-gray-600 mb-6">{showConfirmDialog.message}</p>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowConfirmDialog(null)}
                disabled={isLoading}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:bg-gray-100 transition-colors duration-200"
              >
                Cancelar
              </button>
              <button
                onClick={showConfirmDialog.onConfirm}
                disabled={isLoading}
                className={`px-4 py-2 rounded-md text-white transition-colors duration-200 ${
                  showConfirmDialog.action === 'delete'
                    ? 'bg-red-600 hover:bg-red-700 disabled:bg-red-400'
                    : 'bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400'
                }`}
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <Loader className="h-4 w-4 animate-spin mr-2" />
                    Processando...
                  </div>
                ) : (
                  'Confirmar'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default BulkActions;
