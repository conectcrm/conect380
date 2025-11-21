import React, { useState } from 'react';
import { X, MessageSquare, Calendar, TrendingUp } from 'lucide-react';
import { EstagioOportunidade } from '../../types/oportunidades';

interface ModalMudancaEstagioProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (motivo: string, comentario: string, proximaAcao?: Date) => void;
  estagioOrigem: string;
  estagioDestino: string;
  tituloOportunidade: string;
  loading?: boolean;
}

// Motivos predefinidos para mudança de estágio
const MOTIVOS_MUDANCA = [
  { value: 'avanco_natural', label: '✅ Avanço natural do processo' },
  { value: 'feedback_positivo', label: '📞 Feedback positivo do cliente' },
  { value: 'documentacao_completa', label: '📋 Documentação completa' },
  { value: 'reuniao_realizada', label: '💬 Reunião realizada com sucesso' },
  { value: 'solicitacao_cliente', label: '🔄 Solicitação do cliente' },
  { value: 'ajuste_estrategia', label: '⚠️ Ajuste de estratégia' },
  { value: 'aprovacao_interna', label: '🎯 Aprovação interna obtida' },
  { value: 'outro', label: '📝 Outro motivo' }
];

// Mapeamento de estágios para nomes legíveis
const ESTAGIOS_LABELS: Record<EstagioOportunidade, string> = {
  [EstagioOportunidade.LEADS]: 'Leads',
  [EstagioOportunidade.QUALIFICACAO]: 'Qualificação',
  [EstagioOportunidade.PROPOSTA]: 'Proposta',
  [EstagioOportunidade.NEGOCIACAO]: 'Negociação',
  [EstagioOportunidade.FECHAMENTO]: 'Fechamento'
};

const ModalMudancaEstagio: React.FC<ModalMudancaEstagioProps> = ({
  isOpen,
  onClose,
  onConfirm,
  estagioOrigem,
  estagioDestino,
  tituloOportunidade,
  loading = false
}) => {
  const [motivo, setMotivo] = useState('');
  const [comentario, setComentario] = useState('');
  const [proximaAcao, setProximaAcao] = useState('');
  const [mostrarOutroMotivo, setMostrarOutroMotivo] = useState(false);

  if (!isOpen) return null;

  const handleMotivoChange = (value: string) => {
    setMotivo(value);
    setMostrarOutroMotivo(value === 'outro');
  };

  const handleConfirmar = () => {
    if (!motivo) return;

    const motivoFinal = mostrarOutroMotivo && comentario
      ? comentario
      : MOTIVOS_MUDANCA.find(m => m.value === motivo)?.label || motivo;

    onConfirm(
      motivoFinal,
      mostrarOutroMotivo ? '' : comentario,
      proximaAcao ? new Date(proximaAcao) : undefined
    );
  };

  const isFormValid = motivo && (!mostrarOutroMotivo || comentario.trim().length > 0);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-br from-[#159A9C] to-[#0F7B7D] text-white p-6 rounded-t-2xl">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <TrendingUp className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Mudança de Estágio</h2>
                <p className="text-white/80 text-sm mt-1">
                  Registre o motivo desta movimentação
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={loading}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors disabled:opacity-50"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {/* Info da Oportunidade */}
          <div className="bg-[#DEEFE7]/30 rounded-xl p-4 border border-[#DEEFE7]">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#002333]/60 mb-2">
              Oportunidade
            </p>
            <p className="font-bold text-[#002333] mb-3">{tituloOportunidade}</p>
            <div className="flex items-center gap-2 text-sm">
              <span className="px-3 py-1 bg-red-100 text-red-700 rounded-lg font-semibold">
                {ESTAGIOS_LABELS[estagioOrigem as EstagioOportunidade]}
              </span>
              <span className="text-[#002333]/40">→</span>
              <span className="px-3 py-1 bg-green-100 text-green-700 rounded-lg font-semibold">
                {ESTAGIOS_LABELS[estagioDestino as EstagioOportunidade]}
              </span>
            </div>
          </div>

          {/* Motivo */}
          <div>
            <label className="block text-sm font-medium text-[#002333] mb-2">
              Motivo da Mudança <span className="text-red-600">*</span>
            </label>
            <select
              value={motivo}
              onChange={(e) => handleMotivoChange(e.target.value)}
              disabled={loading}
              className="w-full px-4 py-2.5 border border-[#B4BEC9] rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent text-sm bg-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="">Selecione o motivo...</option>
              {MOTIVOS_MUDANCA.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>

          {/* Comentário */}
          <div>
            <label className="block text-sm font-medium text-[#002333] mb-2">
              {mostrarOutroMotivo ? 'Descreva o motivo' : 'Comentário adicional'}
              {mostrarOutroMotivo && <span className="text-red-600"> *</span>}
            </label>
            <div className="relative">
              <div className="absolute top-3 left-3 text-[#002333]/40">
                <MessageSquare className="h-5 w-5" />
              </div>
              <textarea
                value={comentario}
                onChange={(e) => setComentario(e.target.value)}
                placeholder={
                  mostrarOutroMotivo
                    ? 'Descreva o motivo da mudança...'
                    : 'Adicione detalhes sobre esta mudança... (opcional)'
                }
                rows={4}
                disabled={loading}
                className="w-full pl-11 pr-4 py-2.5 border border-[#B4BEC9] rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent text-sm resize-none disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>
            <p className="mt-1 text-xs text-[#002333]/60">
              {comentario.length}/500 caracteres
            </p>
          </div>

          {/* Próxima Ação (opcional) */}
          <div>
            <label className="block text-sm font-medium text-[#002333] mb-2">
              Agendar Próxima Ação (opcional)
            </label>
            <div className="relative">
              <div className="absolute top-1/2 -translate-y-1/2 left-3 text-[#002333]/40">
                <Calendar className="h-5 w-5" />
              </div>
              <input
                type="date"
                value={proximaAcao}
                onChange={(e) => setProximaAcao(e.target.value)}
                disabled={loading}
                min={new Date().toISOString().split('T')[0]}
                className="w-full pl-11 pr-4 py-2.5 border border-[#B4BEC9] rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>
            <p className="mt-1 text-xs text-[#002333]/60">
              Data para follow-up ou próxima atividade
            </p>
          </div>

          {/* Info sobre histórico */}
          <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
            <p className="text-xs text-blue-800">
              <strong>💡 Histórico:</strong> Esta movimentação será registrada automaticamente
              no histórico de atividades da oportunidade com data, hora e seu usuário.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 rounded-b-2xl flex items-center justify-between gap-3 border-t">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-[#002333] hover:bg-gray-100 rounded-lg transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirmar}
            disabled={!isFormValid || loading}
            className="px-6 py-2 bg-[#159A9C] text-white rounded-lg hover:bg-[#0F7B7D] transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? (
              <>
                <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Movendo...
              </>
            ) : (
              <>
                <TrendingUp className="h-4 w-4" />
                Confirmar Mudança
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalMudancaEstagio;
