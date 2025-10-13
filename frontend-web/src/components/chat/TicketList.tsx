import React, { useState } from 'react';

interface Ticket {
  id: string;
  numero: number | string;
  empresaId: string;
  clienteId?: string;
  canalId: string;
  filaId?: string;
  atendenteId?: string;
  status: string;
  prioridade: string;
  assunto?: string;
  descricao?: string;
  contatoNome?: string;
  contatoTelefone?: string;
  ultimaMensagemEm?: string | Date;
  criadoEm: Date | string;
}

interface TicketListProps {
  tickets: Ticket[];
  activeTicketId: string | null;
  onTicketSelect: (ticketId: string) => void;
}

export function TicketList({ tickets, activeTicketId, onTicketSelect }: TicketListProps) {
  const [filtroStatus, setFiltroStatus] = useState<string>('todos');

  const ticketsFiltrados = tickets.filter((ticket) => {
    if (filtroStatus === 'todos') return true;
    return ticket.status === filtroStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'aberto':
        return 'bg-blue-100 text-blue-800';
      case 'em_atendimento':
        return 'bg-yellow-100 text-yellow-800';
      case 'aguardando':
        return 'bg-orange-100 text-orange-800';
      case 'resolvido':
        return 'bg-green-100 text-green-800';
      case 'fechado':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPrioridadeIcon = (prioridade: string) => {
    switch (prioridade) {
      case 'alta':
        return '🔴';
      case 'media':
        return '🟡';
      case 'baixa':
        return '🟢';
      default:
        return '⚪';
    }
  };

  const formatarData = (data: Date) => {
    const agora = new Date();
    const dataTicket = new Date(data);
    const diffMs = agora.getTime() - dataTicket.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'agora';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h`;
    return `${Math.floor(diffMins / 1440)}d`;
  };

  return (
    <div className="w-80 bg-white border-r flex flex-col">
      {/* Cabeçalho */}
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold text-gray-800 mb-3">Tickets</h2>

        {/* Filtros */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          <button
            onClick={() => setFiltroStatus('todos')}
            className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${filtroStatus === 'todos'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
          >
            Todos ({tickets.length})
          </button>
          <button
            onClick={() => setFiltroStatus('aberto')}
            className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${filtroStatus === 'aberto'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
          >
            Abertos ({tickets.filter((t) => t.status === 'aberto').length})
          </button>
          <button
            onClick={() => setFiltroStatus('em_atendimento')}
            className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${filtroStatus === 'em_atendimento'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
          >
            Em Atendimento ({tickets.filter((t) => t.status === 'em_atendimento').length})
          </button>
        </div>
      </div>

      {/* Lista de tickets */}
      <div className="flex-1 overflow-y-auto">
        {ticketsFiltrados.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 p-4">
            <svg
              className="w-12 h-12 mb-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
              />
            </svg>
            <p className="text-sm">Nenhum ticket encontrado</p>
          </div>
        ) : (
          <div className="divide-y">
            {ticketsFiltrados.map((ticket) => (
              <button
                key={ticket.id}
                onClick={() => onTicketSelect(ticket.id)}
                className={`w-full p-4 text-left hover:bg-gray-50 transition-colors ${activeTicketId === ticket.id ? 'bg-blue-50 border-l-4 border-blue-600' : ''
                  }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-gray-500">#{ticket.numero}</span>
                    <span className="text-lg">{getPrioridadeIcon(ticket.prioridade)}</span>
                  </div>
                  <span className="text-xs text-gray-400">{formatarData(ticket.criadoEm)}</span>
                </div>

                <h3 className="font-medium text-gray-900 mb-1 line-clamp-1">
                  {ticket.assunto || 'Sem assunto'}
                </h3>

                {ticket.descricao && (
                  <p className="text-sm text-gray-600 mb-2 line-clamp-2">{ticket.descricao}</p>
                )}

                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(ticket.status)}`}>
                    {ticket.status}
                  </span>
                  {ticket.atendenteId && (
                    <span className="text-xs text-gray-500">
                      <svg
                        className="inline w-3 h-3 mr-1"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                      Atribuído
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
