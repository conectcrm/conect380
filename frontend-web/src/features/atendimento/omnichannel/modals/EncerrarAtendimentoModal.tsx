import React, { useState } from 'react';
import { X, CheckCircle, AlertCircle, Calendar } from 'lucide-react';
import { useTheme } from '../../../../contexts/ThemeContext';

interface EncerrarAtendimentoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (dados: EncerramentoData) => void;
  ticketAtual?: {
    id: string;
    contato: { nome: string };
    assunto?: string;
  };
}

export interface EncerramentoData {
  motivo: string;
  observacoes?: string;
  criarFollowUp: boolean;
  dataFollowUp?: Date;
  solicitarAvaliacao: boolean;
}

export const EncerrarAtendimentoModal: React.FC<EncerrarAtendimentoModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  ticketAtual
}) => {
  const { currentPalette } = useTheme();

  const [motivo, setMotivo] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [criarFollowUp, setCriarFollowUp] = useState(false);
  const [dataFollowUp, setDataFollowUp] = useState('');
  const [solicitarAvaliacao, setSolicitarAvaliacao] = useState(true);

  const motivosEncerramento = [
    { value: 'resolvido', label: 'Problema Resolvido', icon: '✅', cor: '#10B981' },
    { value: 'cancelado_cliente', label: 'Cancelado pelo Cliente', icon: '🚫', cor: '#F59E0B' },
    { value: 'sem_resposta', label: 'Cliente Sem Resposta', icon: '⏰', cor: '#6B7280' },
    { value: 'duplicado', label: 'Atendimento Duplicado', icon: '📋', cor: '#6B7280' },
    { value: 'spam', label: 'Spam/Inválido', icon: '🗑️', cor: '#EF4444' },
    { value: 'outro', label: 'Outro Motivo', icon: '📝', cor: '#8B5CF6' }
  ];

  const handleConfirmar = () => {
    if (!motivo) {
      alert('Selecione o motivo do encerramento');
      return;
    }

    if (criarFollowUp && !dataFollowUp) {
      alert('Selecione a data do follow-up');
      return;
    }

    const dados: EncerramentoData = {
      motivo,
      observacoes: observacoes || undefined,
      criarFollowUp,
      dataFollowUp: criarFollowUp && dataFollowUp ? new Date(dataFollowUp) : undefined,
      solicitarAvaliacao
    };

    onConfirm(dados);
    handleFechar();
  };

  const handleFechar = () => {
    // Reset form
    setMotivo('');
    setObservacoes('');
    setCriarFollowUp(false);
    setDataFollowUp('');
    setSolicitarAvaliacao(true);
    onClose();
  };

  if (!isOpen) return null;

  const motivoSelecionado = motivosEncerramento.find(m => m.value === motivo);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-lg shadow-2xl w-[calc(100%-2rem)] sm:w-[500px] md:w-[600px] max-w-[700px] max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4 border-b"
          style={{ backgroundColor: `${currentPalette.colors.primary}10` }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ backgroundColor: currentPalette.colors.primary, color: 'white' }}
            >
              <CheckCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Encerrar Atendimento
              </h2>
              {ticketAtual && (
                <p className="text-sm text-gray-500">
                  {ticketAtual.contato.nome} {ticketAtual.assunto && `• ${ticketAtual.assunto}`}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={handleFechar}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="space-y-5">
            {/* Motivo do Encerramento */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Motivo do Encerramento *
              </label>
              <div className="grid grid-cols-2 gap-3">
                {motivosEncerramento.map((m) => (
                  <button
                    key={m.value}
                    onClick={() => setMotivo(m.value)}
                    className={`p-4 rounded-lg border-2 transition-all text-left ${motivo === m.value
                      ? 'border-current shadow-md scale-105'
                      : 'border-gray-200 hover:border-gray-300'
                      }`}
                    style={{
                      borderColor: motivo === m.value ? m.cor : undefined,
                      backgroundColor: motivo === m.value ? `${m.cor}10` : undefined
                    }}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xl">{m.icon}</span>
                      <span
                        className="text-sm font-medium"
                        style={{ color: motivo === m.value ? m.cor : '#374151' }}
                      >
                        {m.label}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Observações Finais */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Observações Finais
              </label>
              <textarea
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                placeholder={`Adicione detalhes sobre o encerramento${motivoSelecionado?.label ? ` (${motivoSelecionado.label})` : ''}...`}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-offset-0 focus:border-transparent text-sm resize-none"
                style={{ '--tw-ring-color': currentPalette.colors.primary } as any}
              />
              <p className="text-xs text-gray-500 mt-1">
                Estas observações serão salvas no histórico do cliente
              </p>
            </div>

            {/* Opções Adicionais */}
            <div className="space-y-3">
              {/* Criar Follow-up */}
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="followup"
                    checked={criarFollowUp}
                    onChange={(e) => setCriarFollowUp(e.target.checked)}
                    className="mt-1 w-4 h-4 rounded border-gray-300 focus:ring-2 focus:ring-offset-0"
                    style={{
                      accentColor: currentPalette.colors.primary,
                      '--tw-ring-color': currentPalette.colors.primary
                    } as any}
                  />
                  <div className="flex-1">
                    <label htmlFor="followup" className="text-sm font-medium text-gray-700 cursor-pointer flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Criar tarefa de follow-up
                    </label>
                    <p className="text-xs text-gray-500 mt-1">
                      Agendar um acompanhamento futuro com este cliente
                    </p>

                    {criarFollowUp && (
                      <div className="mt-3">
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Data do Follow-up *
                        </label>
                        <input
                          type="date"
                          value={dataFollowUp}
                          onChange={(e) => setDataFollowUp(e.target.value)}
                          min={new Date().toISOString().split('T')[0]}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-offset-0 focus:border-transparent text-sm"
                          style={{ '--tw-ring-color': currentPalette.colors.primary } as any}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Solicitar Avaliação */}
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="avaliacao"
                    checked={solicitarAvaliacao}
                    onChange={(e) => setSolicitarAvaliacao(e.target.checked)}
                    className="mt-1 w-4 h-4 rounded border-gray-300 focus:ring-2 focus:ring-offset-0"
                    style={{
                      accentColor: currentPalette.colors.primary,
                      '--tw-ring-color': currentPalette.colors.primary
                    } as any}
                  />
                  <div className="flex-1">
                    <label htmlFor="avaliacao" className="text-sm font-medium text-gray-700 cursor-pointer flex items-center gap-2">
                      ⭐ Solicitar avaliação do atendimento
                    </label>
                    <p className="text-xs text-gray-500 mt-1">
                      O cliente receberá uma mensagem pedindo para avaliar o atendimento (CSAT)
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Aviso */}
            {motivo === 'resolvido' ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-green-800">
                  <p className="font-medium mb-1">Atendimento Concluído!</p>
                  <p className="text-xs">
                    O ticket será movido para "Resolvidos" e o cliente poderá reabrir caso necessário.
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-yellow-800">
                  <p className="font-medium mb-1">Atenção!</p>
                  <p className="text-xs">
                    Ao encerrar este atendimento, ele será arquivado e não aparecerá mais na lista de ativos.
                    Você poderá consultá-lo no histórico.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t bg-gray-50">
          <button
            onClick={handleFechar}
            className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors text-sm font-medium"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirmar}
            disabled={!motivo || (criarFollowUp && !dataFollowUp)}
            className="px-6 py-2 text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            style={{ backgroundColor: motivoSelecionado?.cor || currentPalette.colors.primary }}
          >
            <CheckCircle className="w-4 h-4" />
            Encerrar Atendimento
          </button>
        </div>
      </div>
    </div>
  );
};
