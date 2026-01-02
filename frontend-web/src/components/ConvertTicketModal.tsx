import React, { useState } from 'react';
import { X, AlertTriangle, CheckCircle } from 'lucide-react';
import demandaService, {
  TipoDemanda,
  PrioridadeDemanda,
  tipoLabels,
  prioridadeLabels,
} from '../services/demandaService';

interface ConvertTicketModalProps {
  ticketId: string;
  ticketNumero: string;
  ticketAssunto: string;
  onClose: () => void;
  onSuccess: (demandaId: string) => void;
}

export const ConvertTicketModal: React.FC<ConvertTicketModalProps> = ({
  ticketId,
  ticketNumero,
  ticketAssunto,
  onClose,
  onSuccess,
}) => {
  const [modo, setModo] = useState<'automatico' | 'manual'>('automatico');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Campos do formulário (modo manual)
  const [tipo, setTipo] = useState<TipoDemanda>('suporte');
  const [prioridade, setPrioridade] = useState<PrioridadeDemanda>('media');
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');

  const handleConvert = async () => {
    try {
      setLoading(true);
      setError(null);

      let demanda;

      if (modo === 'automatico') {
        // Conversão automática (inferência)
        demanda = await demandaService.converterTicket(ticketId, {});
      } else {
        // Conversão manual (com overrides)
        demanda = await demandaService.converterTicket(ticketId, {
          tipo,
          prioridade,
          ...(titulo && { titulo }),
          ...(descricao && { descricao }),
        });
      }

      onSuccess(demanda.id);
    } catch (err: any) {
      console.error('Erro ao converter ticket:', err);

      const responseMessage = err?.response?.data?.message;
      const normalizedMessage = Array.isArray(responseMessage)
        ? responseMessage.join('. ')
        : responseMessage;
      const fallbackMessage = err instanceof Error ? err.message : undefined;

      setError(normalizedMessage || fallbackMessage || 'Erro ao converter ticket em demanda');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-[#002333]">Converter em Demanda</h2>
            <p className="text-sm text-[#B4BEC9] mt-1">
              Ticket #{ticketNumero}: {ticketAssunto}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            disabled={loading}
          >
            <X className="h-5 w-5 text-[#002333]" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Erro */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-800">Erro ao converter</p>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          )}

          {/* Modo de conversão */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-[#002333] mb-3">
              Modo de Conversão
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setModo('automatico')}
                className={`px-4 py-3 rounded-lg border-2 transition-all ${modo === 'automatico'
                    ? 'border-[#159A9C] bg-[#159A9C]/5 text-[#159A9C]'
                    : 'border-[#B4BEC9] text-[#002333] hover:border-[#159A9C]/50'
                  }`}
                disabled={loading}
              >
                <div className="text-left">
                  <p className="font-semibold text-sm">Automático</p>
                  <p className="text-xs opacity-75 mt-1">
                    Sistema infere tipo e prioridade
                  </p>
                </div>
              </button>

              <button
                onClick={() => setModo('manual')}
                className={`px-4 py-3 rounded-lg border-2 transition-all ${modo === 'manual'
                    ? 'border-[#159A9C] bg-[#159A9C]/5 text-[#159A9C]'
                    : 'border-[#B4BEC9] text-[#002333] hover:border-[#159A9C]/50'
                  }`}
                disabled={loading}
              >
                <div className="text-left">
                  <p className="font-semibold text-sm">Manual</p>
                  <p className="text-xs opacity-75 mt-1">
                    Definir tipo e prioridade
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* Informativo (modo automático) */}
          {modo === 'automatico' && (
            <div className="mb-6 p-4 bg-[#DEEFE7] border border-[#159A9C]/20 rounded-lg">
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-[#159A9C] flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-[#002333]">
                    Conversão Automática
                  </p>
                  <p className="text-sm text-[#002333]/70 mt-1">
                    O sistema analisará o conteúdo do ticket para determinar automaticamente
                    o tipo (técnica, suporte, comercial, etc.) e a prioridade (baixa, média, alta, crítica).
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Formulário (modo manual) */}
          {modo === 'manual' && (
            <div className="space-y-4">
              {/* Tipo */}
              <div>
                <label className="block text-sm font-medium text-[#002333] mb-2">
                  Tipo de Demanda *
                </label>
                <select
                  value={tipo}
                  onChange={(e) => setTipo(e.target.value as TipoDemanda)}
                  className="w-full px-4 py-2 border border-[#B4BEC9] rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent"
                  disabled={loading}
                >
                  {(Object.keys(tipoLabels) as TipoDemanda[]).map((key) => (
                    <option key={key} value={key}>
                      {tipoLabels[key]}
                    </option>
                  ))}
                </select>
              </div>

              {/* Prioridade */}
              <div>
                <label className="block text-sm font-medium text-[#002333] mb-2">
                  Prioridade *
                </label>
                <select
                  value={prioridade}
                  onChange={(e) => setPrioridade(e.target.value as PrioridadeDemanda)}
                  className="w-full px-4 py-2 border border-[#B4BEC9] rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent"
                  disabled={loading}
                >
                  {(Object.keys(prioridadeLabels) as PrioridadeDemanda[]).map((key) => (
                    <option key={key} value={key}>
                      {prioridadeLabels[key]}
                    </option>
                  ))}
                </select>
              </div>

              {/* Título (opcional) */}
              <div>
                <label className="block text-sm font-medium text-[#002333] mb-2">
                  Título (opcional)
                </label>
                <input
                  type="text"
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  placeholder="Deixe vazio para usar o padrão"
                  className="w-full px-4 py-2 border border-[#B4BEC9] rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent"
                  disabled={loading}
                />
                <p className="text-xs text-[#B4BEC9] mt-1">
                  Se não informado, será gerado automaticamente a partir do ticket
                </p>
              </div>

              {/* Descrição (opcional) */}
              <div>
                <label className="block text-sm font-medium text-[#002333] mb-2">
                  Descrição Adicional (opcional)
                </label>
                <textarea
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  placeholder="Informações adicionais..."
                  rows={3}
                  className="w-full px-4 py-2 border border-[#B4BEC9] rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent resize-none"
                  disabled={loading}
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t px-6 py-4 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white text-[#002333] border border-[#B4BEC9] rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            onClick={handleConvert}
            className="px-4 py-2 bg-[#159A9C] text-white rounded-lg hover:bg-[#0F7B7D] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm font-medium"
            disabled={loading}
          >
            {loading ? (
              <>
                <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Convertendo...
              </>
            ) : (
              'Converter em Demanda'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConvertTicketModal;
