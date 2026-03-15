import React, { useMemo, useState } from 'react';
import { BaseModal, ModalButton } from '../../../components/modals/BaseModal';
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
  { value: 'contrato_gerado', label: 'Aguardando assinatura do contrato' },
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
        <div className="flex items-center space-x-3 rounded-2xl border border-[#D4E2E7] bg-white p-4 shadow-[0_20px_50px_-24px_rgba(15,57,74,0.45)]">
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-5 w-5 text-[#159A9C]" />
            <span className="font-medium text-[#19384C]">
              {selectedIds.length} proposta(s) selecionada(s)
            </span>
          </div>

          <div className="h-6 w-px bg-[#D4E2E7]" />

          <div className="flex items-center space-x-2">
            <select
              value={bulkStatus}
              onChange={(e) => setBulkStatus(e.target.value)}
              disabled={isLoading}
              className="h-9 rounded-lg border border-[#D4E2E7] bg-white px-3 text-sm text-[#355166] focus:border-[#159A9C] focus:outline-none focus:ring-2 focus:ring-[#159A9C]/20 disabled:bg-[#EEF3F5]"
              title="Selecionar novo status"
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => handleStatusUpdate(bulkStatus)}
              disabled={isLoading}
              className="inline-flex items-center rounded-lg border border-transparent bg-[#159A9C] px-3 py-1.5 text-sm font-medium text-white transition-colors duration-200 hover:bg-[#0F7B7D] disabled:bg-[#9FCFD0]"
              title="Aplicar status em lote"
            >
              {isLoading ? <Loader className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            </button>

            <button
              type="button"
              onClick={confirmSendEmail}
              disabled={isLoading}
              className="inline-flex items-center rounded-lg border border-[#D4E2E7] bg-white px-3 py-1.5 text-sm font-medium text-[#355166] transition-colors duration-200 hover:bg-[#F6FAFB] disabled:bg-[#EEF3F5]"
              title="Enviar por email"
            >
              {isLoading ? <Loader className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
            </button>

            <button
              type="button"
              onClick={confirmDelete}
              disabled={isLoading}
              className="inline-flex items-center rounded-lg border border-transparent bg-red-600 px-3 py-1.5 text-sm font-medium text-white transition-colors duration-200 hover:bg-red-700 disabled:bg-red-300"
              title="Excluir selecionadas"
            >
              {isLoading ? <Loader className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            </button>
          </div>

          <div className="h-6 w-px bg-[#D4E2E7]" />

          <button
            type="button"
            onClick={onClearSelection}
            disabled={isLoading}
            className="inline-flex items-center rounded-lg border border-[#D4E2E7] bg-white px-3 py-1.5 text-sm font-medium text-[#355166] transition-colors duration-200 hover:bg-[#F6FAFB] disabled:bg-[#EEF3F5]"
            title="Limpar selecao"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {showConfirmDialog && (
        <BaseModal
          isOpen={Boolean(showConfirmDialog)}
          onClose={() => setShowConfirmDialog(null)}
          title={showConfirmDialog.title}
          subtitle={showConfirmDialog.message}
          size="medium"
          footer={
            <div className="flex items-center justify-end gap-3">
              <ModalButton
                type="button"
                variant="secondary"
                onClick={() => setShowConfirmDialog(null)}
                disabled={isLoading}
              >
                Cancelar
              </ModalButton>
              <ModalButton
                type="button"
                variant={showConfirmDialog.action === 'delete' ? 'danger' : 'primary'}
                onClick={showConfirmDialog.onConfirm}
                loading={isLoading}
              >
                Confirmar
              </ModalButton>
            </div>
          }
        >
          <div className="flex items-start gap-3 rounded-xl border border-[#E2ECF0] bg-[#F7FBFC] p-4">
            {showConfirmDialog.action === 'delete' ? (
              <AlertTriangle className="mt-0.5 h-5 w-5 text-[#DC2626]" />
            ) : (
              <Mail className="mt-0.5 h-5 w-5 text-[#159A9C]" />
            )}
            <div>
              <p className="text-sm font-medium text-[#19384C]">Revise a ação antes de prosseguir.</p>
              <p className="mt-1 text-sm text-[#607B89]">Essa operação será aplicada a todas as propostas selecionadas.</p>
            </div>
          </div>
        </BaseModal>
      )}
    </>
  );
};

export default BulkActions;
