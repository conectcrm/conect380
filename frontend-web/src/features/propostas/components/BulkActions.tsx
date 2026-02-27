import React, { useMemo, useState } from 'react';
import { propostasService } from '../services/propostasService';
import { Check, X, Trash2, Mail, CheckCircle, AlertTriangle, Loader } from 'lucide-react';

interface BulkActionsProps {
  selectedIds: string[];
  onAction: (action: string, success: boolean) => void;
  onClearSelection: () => void;
}

const STATUS_OPTIONS: Array<{ value: string; label: string }> = [
  { value: 'enviada', label: 'Enviada' },
  { value: 'visualizada', label: 'Visualizada' },
  { value: 'negociacao', label: 'Em negociacao' },
  { value: 'aprovada', label: 'Aprovada' },
  { value: 'contrato_gerado', label: 'Contrato gerado' },
  { value: 'contrato_assinado', label: 'Contrato assinado' },
  { value: 'fatura_criada', label: 'Fatura criada' },
  { value: 'aguardando_pagamento', label: 'Aguardando pagamento' },
  { value: 'pago', label: 'Pago' },
  { value: 'rejeitada', label: 'Rejeitada' },
  { value: 'expirada', label: 'Expirada' },
];

export const BulkActions: React.FC<BulkActionsProps> = ({
  selectedIds,
  onAction,
  onClearSelection,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [bulkStatus, setBulkStatus] = useState(STATUS_OPTIONS[0].value);
  const [showConfirmDialog, setShowConfirmDialog] = useState<{
    action: string;
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  const statusLabelMap = useMemo(
    () =>
      STATUS_OPTIONS.reduce<Record<string, string>>((acc, option) => {
        acc[option.value] = option.label;
        return acc;
      }, {}),
    [],
  );

  const handleStatusUpdate = async (novoStatus: string) => {
    try {
      setIsLoading(true);
      await propostasService.atualizarStatusEmLote(selectedIds, novoStatus);
      onAction(`Status atualizado para ${statusLabelMap[novoStatus] || novoStatus}`, true);
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
      onAction(`${selectedIds.length} propostas excluidas`, true);
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
      title: 'Confirmar exclusao',
      message: `Tem certeza que deseja excluir ${selectedIds.length} proposta(s)? Esta acao nao pode ser desfeita.`,
      onConfirm: handleDelete,
    });
  };

  const confirmSendEmail = () => {
    setShowConfirmDialog({
      action: 'email',
      title: 'Enviar por email',
      message: `Deseja enviar ${selectedIds.length} proposta(s) por email para os respectivos clientes?`,
      onConfirm: handleSendEmail,
    });
  };

  if (selectedIds.length === 0) return null;

  return (
    <>
      <div className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 transform">
        <div className="flex items-center space-x-3 rounded-lg border bg-white p-4 shadow-lg">
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-5 w-5 text-blue-600" />
            <span className="font-medium text-gray-900">
              {selectedIds.length} proposta(s) selecionada(s)
            </span>
          </div>

          <div className="h-6 w-px bg-gray-300" />

          <div className="flex items-center space-x-2">
            <select
              value={bulkStatus}
              onChange={(e) => setBulkStatus(e.target.value)}
              disabled={isLoading}
              className="h-9 rounded-md border border-gray-300 px-2 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100"
              title="Selecionar novo status"
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <button
              onClick={() => handleStatusUpdate(bulkStatus)}
              disabled={isLoading}
              className="inline-flex items-center rounded-md border border-transparent bg-blue-600 px-3 py-1.5 text-sm font-medium text-white transition-colors duration-200 hover:bg-blue-700 disabled:bg-gray-400"
              title="Aplicar status em lote"
            >
              {isLoading ? <Loader className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            </button>

            <button
              onClick={confirmSendEmail}
              disabled={isLoading}
              className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors duration-200 hover:bg-gray-50 disabled:bg-gray-100"
              title="Enviar por email"
            >
              {isLoading ? <Loader className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
            </button>

            <button
              onClick={confirmDelete}
              disabled={isLoading}
              className="inline-flex items-center rounded-md border border-transparent bg-red-600 px-3 py-1.5 text-sm font-medium text-white transition-colors duration-200 hover:bg-red-700 disabled:bg-gray-400"
              title="Excluir selecionadas"
            >
              {isLoading ? <Loader className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            </button>
          </div>

          <div className="h-6 w-px bg-gray-300" />

          <button
            onClick={onClearSelection}
            disabled={isLoading}
            className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors duration-200 hover:bg-gray-50 disabled:bg-gray-100"
            title="Limpar selecao"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {showConfirmDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="mx-4 w-full max-w-md rounded-lg bg-white p-6">
            <div className="mb-4 flex items-center">
              {showConfirmDialog.action === 'delete' ? (
                <AlertTriangle className="mr-3 h-6 w-6 text-red-500" />
              ) : (
                <Mail className="mr-3 h-6 w-6 text-blue-500" />
              )}
              <h3 className="text-lg font-medium text-gray-900">{showConfirmDialog.title}</h3>
            </div>

            <p className="mb-6 text-gray-600">{showConfirmDialog.message}</p>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowConfirmDialog(null)}
                disabled={isLoading}
                className="rounded-md border border-gray-300 px-4 py-2 text-gray-700 transition-colors duration-200 hover:bg-gray-50 disabled:bg-gray-100"
              >
                Cancelar
              </button>
              <button
                onClick={showConfirmDialog.onConfirm}
                disabled={isLoading}
                className={`rounded-md px-4 py-2 text-white transition-colors duration-200 ${
                  showConfirmDialog.action === 'delete'
                    ? 'bg-red-600 hover:bg-red-700 disabled:bg-red-400'
                    : 'bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400'
                }`}
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <Loader className="mr-2 h-4 w-4 animate-spin" />
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
