import React from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';
import { formatarValorMonetario } from '../../utils/formatacao';

interface ModalMotivoEstornoProps {
  isOpen: boolean;
  pagamentoId?: number;
  valor?: number;
  transacaoId?: string;
  motivo: string;
  loading?: boolean;
  erro?: string | null;
  onMotivoChange: (value: string) => void;
  onCancel: () => void;
  onConfirm: () => void;
}

export default function ModalMotivoEstorno({
  isOpen,
  pagamentoId,
  valor,
  transacaoId,
  motivo,
  loading = false,
  erro,
  onMotivoChange,
  onCancel,
  onConfirm,
}: ModalMotivoEstornoProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-[#0D1F2A]/45 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !loading) {
          onCancel();
        }
      }}
    >
      <div
        className="w-full max-w-lg rounded-2xl border border-[#DCE8EC] bg-white p-6 shadow-[0_30px_60px_-30px_rgba(7,36,51,0.55)]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-motivo-estorno-titulo"
      >
        <div className="mb-4 flex items-start gap-3">
          <div className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-100">
            <AlertTriangle className="h-5 w-5 text-orange-700" />
          </div>
          <div className="flex-1">
            <h3 id="modal-motivo-estorno-titulo" className="text-lg font-semibold text-[#173A4D]">
              Confirmar estorno de pagamento
            </h3>
            <p className="mt-1 text-sm text-gray-600">
              Pagamento {transacaoId || `#${pagamentoId || '-'}`} no valor de{' '}
              <strong>R$ {formatarValorMonetario(Number(valor || 0))}</strong>.
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="motivo-estorno" className="block text-sm font-medium text-gray-700">
            Motivo do estorno
          </label>
          <textarea
            id="motivo-estorno"
            rows={4}
            value={motivo}
            onChange={(event) => onMotivoChange(event.target.value)}
            placeholder="Descreva o motivo do estorno..."
            className="w-full resize-y rounded-lg border border-[#D4E2E7] px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[#159A9C]"
            disabled={loading}
          />
        </div>

        {erro ? (
          <div className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {erro}
          </div>
        ) : null}

        <div className="mt-6 flex items-center justify-end gap-3 border-t border-[#E1EAEE] pt-4">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="rounded-lg bg-gray-100 px-4 py-2 text-gray-700 transition hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg bg-orange-600 px-4 py-2 text-white transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <RotateCcw className="h-4 w-4" />
            )}
            {loading ? 'Estornando...' : 'Confirmar estorno'}
          </button>
        </div>
      </div>
    </div>
  );
}
