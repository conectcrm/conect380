/**
 * MODAL DE ATRIBUIÇÃO DE TICKET - CONECT CRM
 * Sprint 2 - Fase 8: Frontend CRUD
 * 
 * Modal para atribuir/transferir ticket para atendente
 * - Seleção de atendente
 * - Seleção de responsável
 * - Campo de observação/motivo
 * - Integração com ticketService.transferir()
 */

import React, { useState } from 'react';
import { X, UserPlus, AlertCircle } from 'lucide-react';
import { ticketsService } from '../../services/ticketsService';
import type { Ticket } from '../../services/ticketsService';

interface AtribuirModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  ticket: Ticket | null;
}

export const AtribuirTicketModal: React.FC<AtribuirModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  ticket,
}) => {
  const [atendenteId, setAtendenteId] = useState('');
  const [motivo, setMotivo] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!ticket) return;

    if (!atendenteId.trim()) {
      setError('Selecione um atendente');
      return;
    }

    if (!motivo.trim()) {
      setError('Informe o motivo da atribuição');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      await ticketsService.transferir(ticket.id, {
        atendenteId,
        motivo,
      });

      onSuccess();
      onClose();

      // Resetar formulário
      setAtendenteId('');
      setMotivo('');
    } catch (err: unknown) {
      console.error('Erro ao atribuir ticket:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erro ao atribuir ticket';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setAtendenteId('');
      setMotivo('');
      setError(null);
      onClose();
    }
  };

  if (!isOpen || !ticket) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full">
        {/* Header */}
        <div className="border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-[#002333]">
            Atribuir Ticket #{ticket.numero}
          </h2>
          <button
            onClick={handleClose}
            disabled={loading}
            className="p-2 text-[#002333]/60 hover:text-[#002333] hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Erro */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-900">Erro</p>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          )}

          {/* Info do ticket */}
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#002333]/60 mb-2">
              Ticket Atual
            </p>
            <p className="text-sm text-[#002333] font-medium">
              {ticket.titulo || ticket.assunto || 'Sem título'}
            </p>
            {ticket.atendente && (
              <p className="text-xs text-[#002333]/70 mt-1">
                Atendente atual: {ticket.atendente.nome}
              </p>
            )}
          </div>

          {/* ID do Atendente */}
          <div>
            <label className="block text-sm font-medium text-[#002333] mb-2">
              ID do Atendente <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={atendenteId}
              onChange={(e) => {
                setAtendenteId(e.target.value);
                if (error) setError(null);
              }}
              disabled={loading}
              className="w-full px-4 py-2 border border-[#B4BEC9] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#159A9C] transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed"
              placeholder="UUID do atendente"
            />
            <p className="mt-1 text-xs text-[#002333]/60">
              Informe o ID do atendente para atribuição
            </p>
          </div>

          {/* Motivo */}
          <div>
            <label className="block text-sm font-medium text-[#002333] mb-2">
              Motivo <span className="text-red-500">*</span>
            </label>
            <textarea
              value={motivo}
              onChange={(e) => {
                setMotivo(e.target.value);
                if (error) setError(null);
              }}
              disabled={loading}
              rows={3}
              className="w-full px-4 py-2 border border-[#B4BEC9] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#159A9C] transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed"
              placeholder="Ex: Atendente anterior em férias"
            />
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="px-4 py-2 bg-white text-[#002333] border border-[#B4BEC9] rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-[#159A9C] text-white rounded-lg hover:bg-[#0F7B7D] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm font-medium"
            >
              <UserPlus className="h-4 w-4" />
              {loading ? 'Atribuindo...' : 'Atribuir'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
