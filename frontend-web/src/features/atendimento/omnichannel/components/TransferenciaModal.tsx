import React, { useState, useEffect } from 'react';
import { X, Search, User, AlertCircle } from 'lucide-react';
import atendenteService, { Atendente, StatusAtendente } from '../../../../services/atendenteService';
import { ticketsService, Ticket } from '../../../../services/ticketsService';

interface TransferenciaModalProps {
  ticket: Ticket;
  onClose: () => void;
  onSuccess: (ticket: Ticket) => void;
}

const TransferenciaModal: React.FC<TransferenciaModalProps> = ({
  ticket,
  onClose,
  onSuccess,
}) => {
  const [atendentes, setAtendentes] = useState<Atendente[]>([]);
  const [atendentesFiltrados, setAtendentesFiltrados] = useState<Atendente[]>([]);
  const [loading, setLoading] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const [atendenteIdSelecionado, setAtendenteIdSelecionado] = useState<string>('');
  const [motivo, setMotivo] = useState('');
  const [notaInterna, setNotaInterna] = useState('');
  const [busca, setBusca] = useState('');

  useEffect(() => {
    carregarAtendentes();
  }, []);

  useEffect(() => {
    // Filtrar atendentes pela busca
    if (!busca.trim()) {
      setAtendentesFiltrados(atendentes);
      return;
    }

    const termo = busca.toLowerCase();
    const filtrados = atendentes.filter(
      (a) =>
        a.nome.toLowerCase().includes(termo) ||
        a.email.toLowerCase().includes(termo)
    );
    setAtendentesFiltrados(filtrados);
  }, [busca, atendentes]);

  const carregarAtendentes = async () => {
    try {
      setLoading(true);
      setErro(null);

      const lista = await atendenteService.listar();

      // Filtrar: remover atendente atual do ticket e mostrar apenas ativos
      const atendentesFiltrados = lista.filter(
        (a) => a.ativo && a.id !== ticket.atendenteId
      );

      setAtendentes(atendentesFiltrados);
      setAtendentesFiltrados(atendentesFiltrados);
    } catch (err: unknown) {
      console.error('Erro ao carregar atendentes:', err);
      setErro(err instanceof Error ? err.message : 'Erro ao carregar atendentes');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!atendenteIdSelecionado) {
      setErro('Selecione um atendente para transferir');
      return;
    }

    if (!motivo.trim()) {
      setErro('Informe o motivo da transferência');
      return;
    }

    try {
      setEnviando(true);
      setErro(null);

      const resultado = await ticketsService.transferir(ticket.id, {
        atendenteId: atendenteIdSelecionado,
        motivo: motivo.trim(),
        notaInterna: notaInterna.trim() || undefined,
      });

      onSuccess(resultado.data);
      onClose();
    } catch (err: unknown) {
      console.error('Erro ao transferir ticket:', err);
      setErro(err instanceof Error ? err.message : 'Erro ao transferir ticket');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-semibold text-[#002333]">
              Transferir Ticket
            </h2>
            <p className="text-sm text-[#002333]/60 mt-1">
              Ticket #{ticket.numero || ticket.id.substring(0, 8)}
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={enviando}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          >
            <X className="h-5 w-5 text-[#002333]" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-hidden flex flex-col">
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Busca de atendentes */}
            <div>
              <label className="block text-sm font-medium text-[#002333] mb-2">
                Buscar Atendente
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[#002333]/40" />
                <input
                  type="text"
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  placeholder="Digite o nome ou email..."
                  disabled={loading || enviando}
                  className="w-full pl-10 pr-4 py-2 border border-[#B4BEC9] rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            {/* Lista de atendentes */}
            <div>
              <label className="block text-sm font-medium text-[#002333] mb-3">
                Selecione o Atendente <span className="text-red-500">*</span>
              </label>

              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#159A9C]"></div>
                </div>
              ) : atendentesFiltrados.length === 0 ? (
                <div className="text-center py-8 text-[#002333]/60">
                  {busca ? 'Nenhum atendente encontrado' : 'Nenhum atendente disponível'}
                </div>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto border border-[#B4BEC9] rounded-lg p-2">
                  {atendentesFiltrados.map((atendente) => (
                    <label
                      key={atendente.id}
                      className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${atendenteIdSelecionado === atendente.id
                          ? 'bg-[#159A9C]/10 border-2 border-[#159A9C]'
                          : 'bg-white border border-[#B4BEC9] hover:bg-gray-50'
                        }`}
                    >
                      <input
                        type="radio"
                        name="atendente"
                        value={atendente.id}
                        checked={atendenteIdSelecionado === atendente.id}
                        onChange={(e) => setAtendenteIdSelecionado(e.target.value)}
                        disabled={enviando}
                        className="w-4 h-4 text-[#159A9C] focus:ring-[#159A9C]"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-[#159A9C]" />
                          <span className="font-medium text-[#002333]">
                            {atendente.nome}
                          </span>
                        </div>
                        <span className="text-sm text-[#002333]/60">
                          {atendente.email}
                        </span>
                      </div>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${atendente.status === StatusAtendente.ONLINE
                            ? 'bg-green-100 text-green-700'
                            : atendente.status === StatusAtendente.OCUPADO
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}
                      >
                        {atendente.status === StatusAtendente.ONLINE
                          ? 'Disponível'
                          : atendente.status === StatusAtendente.OCUPADO
                            ? 'Ocupado'
                            : 'Ausente'}
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Motivo */}
            <div>
              <label className="block text-sm font-medium text-[#002333] mb-2">
                Motivo da Transferência <span className="text-red-500">*</span>
              </label>
              <textarea
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                placeholder="Descreva o motivo da transferência..."
                disabled={enviando}
                rows={3}
                className="w-full px-4 py-2 border border-[#B4BEC9] rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed resize-none"
              />
            </div>

            {/* Nota Interna (opcional) */}
            <div>
              <label className="block text-sm font-medium text-[#002333] mb-2">
                Nota Interna (Opcional)
              </label>
              <textarea
                value={notaInterna}
                onChange={(e) => setNotaInterna(e.target.value)}
                placeholder="Adicione informações internas sobre o ticket..."
                disabled={enviando}
                rows={2}
                className="w-full px-4 py-2 border border-[#B4BEC9] rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed resize-none"
              />
            </div>

            {/* Mensagem de Erro */}
            {erro && (
              <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-800">{erro}</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-6 border-t">
            <button
              type="button"
              onClick={onClose}
              disabled={enviando}
              className="px-4 py-2 text-[#002333] border border-[#B4BEC9] rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={enviando || loading}
              className="px-4 py-2 bg-[#159A9C] text-white rounded-lg hover:bg-[#0F7B7D] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {enviando ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  Transferindo...
                </>
              ) : (
                'Confirmar Transferência'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TransferenciaModal;
