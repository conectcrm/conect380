import React, { useState, useEffect } from 'react';
import { X, CheckCircle, AlertCircle, Loader2, Calendar, MessageSquare } from 'lucide-react';
import { useAuth } from '../../../../hooks/useAuth';
import { api } from '../../../../services/api';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSucesso: () => void;
  ticketAtual?: any;
}

type MotivoEncerramento = 'resolvido' | 'cancelado' | 'sem_resposta' | 'duplicado' | 'spam' | 'outro';

const MOTIVOS_ENCERRAMENTO: Array<{ value: MotivoEncerramento; label: string; descricao: string }> = [
  {
    value: 'resolvido',
    label: 'Resolvido',
    descricao: 'Problema/solicitação foi resolvido com sucesso'
  },
  {
    value: 'cancelado',
    label: 'Cancelado',
    descricao: 'Atendimento cancelado pelo cliente ou atendente'
  },
  {
    value: 'sem_resposta',
    label: 'Sem Resposta',
    descricao: 'Cliente não respondeu após várias tentativas'
  },
  {
    value: 'duplicado',
    label: 'Duplicado',
    descricao: 'Ticket duplicado - já existe outro atendimento para este caso'
  },
  {
    value: 'spam',
    label: 'Spam',
    descricao: 'Mensagem indesejada ou spam'
  },
  {
    value: 'outro',
    label: 'Outro',
    descricao: 'Outro motivo não listado'
  },
];

export function EncerrarAtendimentoModal({ isOpen, onClose, onSucesso, ticketAtual }: Props) {
  const { user } = useAuth();
  const [motivo, setMotivo] = useState<MotivoEncerramento>('resolvido');
  const [observacoes, setObservacoes] = useState('');
  const [criarFollowUp, setCriarFollowUp] = useState(false);
  const [dataFollowUp, setDataFollowUp] = useState('');
  const [solicitarAvaliacao, setSolicitarAvaliacao] = useState(false);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');

  // Reset form quando modal abre
  useEffect(() => {
    if (isOpen) {
      resetForm();
    }
  }, [isOpen]);

  const resetForm = () => {
    setMotivo('resolvido');
    setObservacoes('');
    setCriarFollowUp(false);
    setDataFollowUp('');
    setSolicitarAvaliacao(false);
    setErro('');
  };

  const handleEncerrar = async () => {
    if (!ticketAtual) {
      setErro('Nenhum ticket selecionado');
      return;
    }

    // Validações
    if (!motivo) {
      setErro('Selecione o motivo do encerramento');
      return;
    }

    if (criarFollowUp && !dataFollowUp) {
      setErro('Informe a data do follow-up');
      return;
    }

    setLoading(true);
    setErro('');

    try {
      const empresaId = user?.empresa?.id;

      // Preparar dados do encerramento
      const dados: any = {
        motivo,
        observacoes: observacoes.trim() || undefined,
        criarFollowUp,
        solicitarAvaliacao,
      };

      // Adicionar data do follow-up se checkbox marcado
      if (criarFollowUp && dataFollowUp) {
        dados.dataFollowUp = new Date(dataFollowUp).toISOString();
      }

      // Endpoint: PUT /atendimento/tickets/:id (atualizar status para FECHADO)
      // Backend usa AtualizarTicketDto que aceita { status, ... }
      const response = await api.put(
        `/atendimento/tickets/${ticketAtual.id}`,
        {
          status: 'fechado', // StatusTicket.FECHADO
          // Observações serão salvas em outro campo ou log
        },
        {
          params: { empresaId },
        }
      );

      // Se houver follow-up, criar em endpoint separado (se existir)
      if (criarFollowUp && dataFollowUp) {
        console.log('📅 Follow-up agendado para:', dataFollowUp);
        // TODO: Implementar criação de follow-up quando backend tiver endpoint
      }

      // Se houver solicitação de avaliação, registrar (se backend tiver)
      if (solicitarAvaliacao) {
        console.log('⭐ Avaliação CSAT solicitada');
        // TODO: Enviar solicitação de avaliação quando backend tiver endpoint
      }

      console.log('✅ Ticket encerrado:', response.data);

      // Fechar modal
      onClose();

      // Resetar form
      resetForm();

      // Chamar callback de sucesso (recarrega tickets)
      onSucesso();

      // Toast de sucesso
      mostrarToastSucesso();
    } catch (error: any) {
      console.error('❌ Erro ao encerrar ticket:', error);
      const responseMessage = error?.response?.data?.message;
      const normalizedMessage = Array.isArray(responseMessage)
        ? responseMessage.join('. ')
        : responseMessage;
      const fallbackMessage = error instanceof Error ? error.message : undefined;
      setErro(normalizedMessage || fallbackMessage || 'Erro ao encerrar ticket');
    } finally {
      setLoading(false);
    }
  };

  const mostrarToastSucesso = () => {
    const toast = document.createElement('div');
    toast.className = 'fixed bottom-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center gap-2';
    toast.innerHTML = `
      <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
      </svg>
      <span>Ticket encerrado com sucesso!</span>
    `;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  };

  const handleClickBackdrop = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  const motivoSelecionado = MOTIVOS_ENCERRAMENTO.find(m => m.value === motivo);

  // Data mínima para follow-up: amanhã
  const amanha = new Date();
  amanha.setDate(amanha.getDate() + 1);
  const dataMinima = amanha.toISOString().split('T')[0];

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={handleClickBackdrop}
    >
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <CheckCircle className="h-6 w-6 text-green-600" />
              Encerrar Atendimento
            </h2>
            {ticketAtual && (
              <p className="text-sm text-gray-500 mt-1">
                Ticket #{ticketAtual.numero} • {ticketAtual.contatoNome || 'Sem nome'}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
            title="Fechar"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {/* Erro */}
          {erro && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800">{erro}</p>
            </div>
          )}

          {/* Motivo do Encerramento */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Motivo do Encerramento *
            </label>
            <div className="grid grid-cols-2 gap-3">
              {MOTIVOS_ENCERRAMENTO.map((m) => (
                <button
                  key={m.value}
                  onClick={() => setMotivo(m.value)}
                  disabled={loading}
                  className={`p-4 rounded-lg border-2 text-left transition-all ${motivo === m.value
                    ? 'border-green-600 bg-green-50'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <div className={`font-semibold text-sm mb-1 ${motivo === m.value ? 'text-green-900' : 'text-gray-900'
                    }`}>
                    {m.label}
                  </div>
                  <div className={`text-xs ${motivo === m.value ? 'text-green-700' : 'text-gray-500'
                    }`}>
                    {m.descricao}
                  </div>
                </button>
              ))}
            </div>

            {/* Descrição do motivo selecionado */}
            {motivoSelecionado && (
              <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Motivo selecionado:</span> {motivoSelecionado.descricao}
                </p>
              </div>
            )}
          </div>

          {/* Observações */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Observações Finais
              <span className="text-gray-400 font-normal ml-2">(opcional)</span>
            </label>
            <textarea
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              disabled={loading}
              placeholder="Adicione observações sobre o encerramento (visível internamente)..."
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 resize-none disabled:bg-gray-50 disabled:cursor-not-allowed"
            />
            <p className="text-xs text-gray-500 mt-1">
              Estas observações ficarão registradas no histórico do ticket.
            </p>
          </div>

          {/* Checkbox: Criar Follow-up */}
          <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={criarFollowUp}
                onChange={(e) => setCriarFollowUp(e.target.checked)}
                disabled={loading}
                className="mt-1 h-5 w-5 text-green-600 border-gray-300 rounded focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2 font-medium text-gray-900">
                  <Calendar className="h-4 w-4" />
                  Criar Follow-up
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  Agendar um acompanhamento futuro com o cliente
                </p>
              </div>
            </label>

            {/* Data do Follow-up (condicional) */}
            {criarFollowUp && (
              <div className="mt-4 ml-8">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Data do Follow-up *
                </label>
                <input
                  type="date"
                  value={dataFollowUp}
                  onChange={(e) => setDataFollowUp(e.target.value)}
                  min={dataMinima}
                  disabled={loading}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-50 disabled:cursor-not-allowed"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Data mínima: amanhã ({new Date(dataMinima).toLocaleDateString('pt-BR')})
                </p>
              </div>
            )}
          </div>

          {/* Checkbox: Solicitar Avaliação */}
          <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={solicitarAvaliacao}
                onChange={(e) => setSolicitarAvaliacao(e.target.checked)}
                disabled={loading}
                className="mt-1 h-5 w-5 text-green-600 border-gray-300 rounded focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2 font-medium text-gray-900">
                  <MessageSquare className="h-4 w-4" />
                  Solicitar Avaliação (CSAT)
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  Enviar pesquisa de satisfação para o cliente após o encerramento
                </p>
              </div>
            </label>
          </div>

          {/* Alerta de Confirmação */}
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-yellow-900">
                  Atenção: Esta ação não pode ser desfeita
                </p>
                <p className="text-xs text-yellow-700 mt-1">
                  Ao encerrar o ticket, ele será marcado como concluído e removido da lista de atendimentos ativos.
                  Você poderá consultar o histórico, mas não poderá reabrir o ticket diretamente.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancelar
          </button>
          <button
            onClick={handleEncerrar}
            disabled={loading || !motivo}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-sm font-medium"
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Encerrando...
              </>
            ) : (
              <>
                <CheckCircle className="h-5 w-5" />
                Encerrar Atendimento
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
