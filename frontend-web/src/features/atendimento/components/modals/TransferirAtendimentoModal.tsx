import React, { useState, useEffect } from 'react';
import { X, UserCheck, AlertCircle, Loader2, Search, Users } from 'lucide-react';
import { useAuth } from '../../../../hooks/useAuth';
import { api } from '../../../../services/api';

// ===== INTERFACES =====

export interface Atendente {
  id: string;
  nome: string;
  email: string;
  status: 'disponivel' | 'ocupado' | 'ausente' | 'offline';
  foto?: string;
  ticketsAtivos?: number;
}

export interface TransferenciaData {
  atendenteId: string;
  motivo?: string;
  notaInterna?: string;
}

interface TransferirAtendimentoModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticketId: string;
  ticketNumero?: number;
  atendenteAtualId?: string;
  onSucesso: () => void;
}

const MOTIVOS_TRANSFERENCIA = [
  { valor: 'redistribuicao', label: 'Redistribuição de carga' },
  { valor: 'especialidade', label: 'Área de especialidade' },
  { valor: 'indisponibilidade', label: 'Indisponibilidade' },
  { valor: 'escalonamento', label: 'Escalonamento' },
  { valor: 'outros', label: 'Outros' },
];

// ===== COMPONENTE PRINCIPAL =====

export function TransferirAtendimentoModal({
  isOpen,
  onClose,
  ticketId,
  ticketNumero,
  atendenteAtualId,
  onSucesso,
}: TransferirAtendimentoModalProps) {
  const { user } = useAuth();
  // Estados
  const [atendentes, setAtendentes] = useState<Atendente[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingAtendentes, setLoadingAtendentes] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  // Form data
  const [atendenteId, setAtendenteId] = useState<string>('');
  const [motivo, setMotivo] = useState<string>('redistribuicao');
  const [notaInterna, setNotaInterna] = useState<string>('');

  // Busca
  const [buscaAtendente, setBuscaAtendente] = useState('');

  // ===== CARREGAR ATENDENTES =====

  useEffect(() => {
    if (isOpen) {
      carregarAtendentes();
    }
  }, [isOpen]);

  const carregarAtendentes = async () => {
    try {
      setLoadingAtendentes(true);
      setErro(null);

      const token = localStorage.getItem('authToken');
      const empresaId = user?.empresa?.id;

      const response = await api.get('/atendimento/atendentes', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params: { empresaId },
      });

      const todosAtendentes = response.data?.data || response.data || [];

      // Filtrar apenas atendentes disponíveis/ocupados (não offline/ausentes)
      // e remover o atendente atual do ticket
      const atendentesDisponiveis = todosAtendentes.filter(
        (a: Atendente) =>
          a.id !== atendenteAtualId &&
          (a.status === 'disponivel' || a.status === 'ocupado')
      );

      setAtendentes(atendentesDisponiveis);

      // Selecionar primeiro atendente automaticamente
      if (atendentesDisponiveis.length > 0 && !atendenteId) {
        setAtendenteId(atendentesDisponiveis[0].id);
      }
    } catch (error) {
      console.error('❌ Erro ao carregar atendentes:', error);
      setErro('Erro ao carregar lista de atendentes');
    } finally {
      setLoadingAtendentes(false);
    }
  };

  // ===== FILTRAR ATENDENTES =====

  const atendentesFiltrados = buscaAtendente
    ? atendentes.filter((a) =>
      a.nome.toLowerCase().includes(buscaAtendente.toLowerCase()) ||
      a.email.toLowerCase().includes(buscaAtendente.toLowerCase())
    )
    : atendentes;

  // ===== HANDLERS =====

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validações
    if (!atendenteId) {
      setErro('Selecione um atendente para transferir');
      return;
    }

    try {
      setLoading(true);
      setErro(null);

      const token = localStorage.getItem('authToken');
      const empresaId = user?.empresa?.id;

      // Payload para transferir ticket
      const payload: TransferenciaData = {
        atendenteId,
        motivo: motivo || undefined,
        notaInterna: notaInterna || undefined,
      };

      await api.patch(`/atendimento/tickets/${ticketId}/transferir`, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params: { empresaId },
      });

      console.log('✅ Ticket transferido com sucesso');

      onSucesso();
      handleClose();
    } catch (error: any) {
      console.error('❌ Erro ao transferir ticket:', error);
      const mensagemErro = error.response?.data?.message ||
        error.response?.data?.error ||
        'Erro ao transferir atendimento';
      setErro(mensagemErro);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    // Reset form
    setAtendenteId('');
    setMotivo('redistribuicao');
    setNotaInterna('');
    setBuscaAtendente('');
    setErro(null);
    onClose();
  };

  // ===== HELPERS =====

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'disponivel':
        return 'bg-green-100 text-green-700 border-green-300';
      case 'ocupado':
        return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      case 'ausente':
        return 'bg-gray-100 text-gray-700 border-gray-300';
      case 'offline':
        return 'bg-red-100 text-red-700 border-red-300';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'disponivel':
        return 'Disponível';
      case 'ocupado':
        return 'Ocupado';
      case 'ausente':
        return 'Ausente';
      case 'offline':
        return 'Offline';
      default:
        return status;
    }
  };

  // ===== RENDER =====

  if (!isOpen) return null;

  const atendenteSelecionado = atendentes.find((a) => a.id === atendenteId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold text-[#002333] flex items-center gap-3">
              <UserCheck className="h-7 w-7 text-[#159A9C]" />
              Transferir Atendimento
            </h2>
            {ticketNumero && (
              <p className="text-sm text-gray-500 mt-1">Ticket #{ticketNumero}</p>
            )}
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            disabled={loading}
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Erro Global */}
          {erro && (
            <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{erro}</p>
            </div>
          )}

          {/* Busca de Atendente */}
          <div>
            <label className="block text-sm font-medium text-[#002333] mb-2">
              Transferir para *
            </label>

            {loadingAtendentes ? (
              <div className="flex items-center gap-2 text-gray-500 p-4">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Carregando atendentes...</span>
              </div>
            ) : atendentes.length === 0 ? (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-700">
                  Nenhum atendente disponível para transferência no momento.
                </p>
              </div>
            ) : (
              <>
                {/* Campo de Busca */}
                <div className="relative mb-3">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    value={buscaAtendente}
                    onChange={(e) => setBuscaAtendente(e.target.value)}
                    placeholder="Buscar por nome ou e-mail..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent"
                  />
                </div>

                {/* Lista de Atendentes */}
                <div className="space-y-2 max-h-64 overflow-y-auto border border-gray-200 rounded-lg p-3 bg-gray-50">
                  {atendentesFiltrados.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-4">
                      Nenhum atendente encontrado com "{buscaAtendente}"
                    </p>
                  ) : (
                    atendentesFiltrados.map((atendente) => (
                      <button
                        key={atendente.id}
                        type="button"
                        onClick={() => setAtendenteId(atendente.id)}
                        className={`w-full p-3 rounded-lg border-2 transition-all text-left ${atendenteId === atendente.id
                          ? 'border-[#159A9C] bg-[#159A9C]/5'
                          : 'border-gray-200 hover:border-[#159A9C]/50 bg-white'
                          }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {/* Avatar */}
                            <div className="h-10 w-10 rounded-full bg-[#159A9C]/10 flex items-center justify-center flex-shrink-0">
                              {atendente.foto ? (
                                <img
                                  src={atendente.foto}
                                  alt={atendente.nome}
                                  className="h-10 w-10 rounded-full object-cover"
                                />
                              ) : (
                                <Users className="h-5 w-5 text-[#159A9C]" />
                              )}
                            </div>

                            {/* Info */}
                            <div>
                              <div className="font-medium text-[#002333]">{atendente.nome}</div>
                              <div className="text-xs text-gray-500">{atendente.email}</div>
                              {atendente.ticketsAtivos !== undefined && (
                                <div className="text-xs text-gray-400 mt-1">
                                  {atendente.ticketsAtivos} ticket{atendente.ticketsAtivos !== 1 ? 's' : ''} ativo
                                  {atendente.ticketsAtivos !== 1 ? 's' : ''}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Status Badge */}
                          <span
                            className={`px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                              atendente.status
                            )}`}
                          >
                            {getStatusLabel(atendente.status)}
                          </span>
                        </div>
                      </button>
                    ))
                  )}
                </div>

                {/* Atendente Selecionado */}
                {atendenteSelecionado && (
                  <div className="mt-3 p-3 bg-[#159A9C]/5 border border-[#159A9C]/20 rounded-lg">
                    <div className="text-xs text-gray-600 mb-1">Transferir para:</div>
                    <div className="font-medium text-[#002333]">{atendenteSelecionado.nome}</div>
                    <div className="text-sm text-gray-600">{atendenteSelecionado.email}</div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Motivo da Transferência */}
          <div>
            <label className="block text-sm font-medium text-[#002333] mb-2">
              Motivo da Transferência
            </label>
            <select
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent"
            >
              {MOTIVOS_TRANSFERENCIA.map((m) => (
                <option key={m.valor} value={m.valor}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>

          {/* Nota Interna */}
          <div>
            <label className="block text-sm font-medium text-[#002333] mb-2">
              Nota Interna (opcional)
            </label>
            <textarea
              value={notaInterna}
              onChange={(e) => setNotaInterna(e.target.value)}
              placeholder="Adicione informações relevantes para o novo atendente..."
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent resize-none"
            />
            <p className="text-xs text-gray-500 mt-1">
              Esta nota será visível apenas para a equipe interna
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="flex-1 px-4 py-2 bg-white text-[#002333] border border-[#B4BEC9] rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || loadingAtendentes || !atendenteId}
              className="flex-1 px-4 py-2 bg-[#159A9C] text-white rounded-lg hover:bg-[#0F7B7D] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm font-medium"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Transferindo...
                </>
              ) : (
                <>
                  <UserCheck className="h-4 w-4" />
                  Transferir Atendimento
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
