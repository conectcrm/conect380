import React, { useMemo } from 'react';
import { Star, User, Clock, MessageSquare } from 'lucide-react';
import { TicketStats } from './TicketStats';
import { TicketFilters, TicketFiltersState } from './TicketFilters';

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
  clienteNome?: string;
  clienteVip?: boolean;
  ultimaMensagemEm?: string | Date;
  ultimaMensagem?: string;
  mensagensNaoLidas?: number;
  criadoEm: Date | string;
  atualizadoEm?: Date | string;
}

interface TicketListAprimoradoProps {
  tickets: Ticket[];
  activeTicketId: string | null;
  onTicketSelect: (ticketId: string) => void;
  filters: TicketFiltersState;
  onFiltersChange: (filters: TicketFiltersState) => void;
  onClearFilters?: () => void;
}

export function TicketListAprimorado({
  tickets,
  activeTicketId,
  onTicketSelect,
  filters,
  onFiltersChange,
  onClearFilters,
}: TicketListAprimoradoProps) {
  // Filtrar e ordenar tickets
  const ticketsFiltrados = useMemo(() => {
    let filtered = tickets.filter((ticket) => {
      // Filtro de busca
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchSearch =
          ticket.numero.toString().includes(searchLower) ||
          ticket.assunto?.toLowerCase().includes(searchLower) ||
          ticket.contatoNome?.toLowerCase().includes(searchLower) ||
          ticket.clienteNome?.toLowerCase().includes(searchLower) ||
          ticket.contatoTelefone?.includes(filters.search);

        if (!matchSearch) return false;
      }

      // Filtro de status
      if (filters.status && ticket.status !== filters.status) {
        return false;
      }

      // Filtro de prioridade
      if (filters.prioridade && ticket.prioridade !== filters.prioridade) {
        return false;
      }

      return true;
    });

    // Ordenação
    filtered.sort((a, b) => {
      switch (filters.ordenacao) {
        case 'recente':
          return (
            new Date(b.atualizadoEm || b.criadoEm).getTime() -
            new Date(a.atualizadoEm || a.criadoEm).getTime()
          );

        case 'antigo':
          return new Date(a.criadoEm).getTime() - new Date(b.criadoEm).getTime();

        case 'prioridade':
          const prioridadeOrdem = { alta: 3, media: 2, baixa: 1 };
          const prioA = prioridadeOrdem[a.prioridade as keyof typeof prioridadeOrdem] || 0;
          const prioB = prioridadeOrdem[b.prioridade as keyof typeof prioridadeOrdem] || 0;
          if (prioB !== prioA) return prioB - prioA;
          // Se mesma prioridade, ordenar por data
          return (
            new Date(b.atualizadoEm || b.criadoEm).getTime() -
            new Date(a.atualizadoEm || a.criadoEm).getTime()
          );

        default:
          return 0;
      }
    });

    return filtered;
  }, [tickets, filters]);

  // Funções auxiliares
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'aberto':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'em_atendimento':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'aguardando':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'resolvido':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'fechado':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
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

  const formatarData = (data: Date | string) => {
    const agora = new Date();
    const dataTicket = new Date(data);
    const diffMs = agora.getTime() - dataTicket.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'agora';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h`;
    const dias = Math.floor(diffMins / 1440);
    if (dias === 1) return '1d';
    if (dias < 7) return `${dias}d`;
    return dataTicket.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  };

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + '...';
  };

  return (
    <div className="w-[400px] bg-white border-r flex flex-col">
      {/* Estatísticas */}
      <TicketStats tickets={tickets} />

      {/* Filtros */}
      <TicketFilters filters={filters} onChange={onFiltersChange} onClearFilters={onClearFilters} />

      {/* Header da Lista */}
      <div className="px-4 py-2 bg-gray-50 border-b flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700">
          {ticketsFiltrados.length} ticket{ticketsFiltrados.length !== 1 ? 's' : ''}
        </h3>
        {filters.ordenacao && (
          <span className="text-xs text-gray-500">
            {filters.ordenacao === 'recente' && '🕐 Mais recentes'}
            {filters.ordenacao === 'antigo' && '🕑 Mais antigos'}
            {filters.ordenacao === 'prioridade' && '⚠️ Por prioridade'}
          </span>
        )}
      </div>

      {/* Lista de tickets */}
      <div className="flex-1 overflow-y-auto">
        {ticketsFiltrados.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 p-6">
            <svg className="w-16 h-16 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="text-sm font-medium mb-1">Nenhum ticket encontrado</p>
            <p className="text-xs text-center">
              Tente ajustar os filtros ou buscar
              <br />
              por outros critérios
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {ticketsFiltrados.map((ticket) => (
              <button
                key={ticket.id}
                onClick={() => onTicketSelect(ticket.id)}
                className={`w-full p-4 text-left hover:bg-gray-50 transition-colors relative ${
                  activeTicketId === ticket.id
                    ? 'bg-blue-50 border-l-4 border-l-blue-600'
                    : 'border-l-4 border-l-transparent'
                }`}
              >
                {/* Header do Card */}
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    {/* Número do Ticket */}
                    <span className="text-xs font-mono text-gray-500 font-medium">
                      #{ticket.numero}
                    </span>

                    {/* Prioridade */}
                    <span className="text-base" title={`Prioridade ${ticket.prioridade}`}>
                      {getPrioridadeIcon(ticket.prioridade)}
                    </span>

                    {/* VIP Badge */}
                    {ticket.clienteVip && (
                      <span title="Cliente VIP">
                        <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                      </span>
                    )}

                    {/* Mensagens não lidas */}
                    {ticket.mensagensNaoLidas && ticket.mensagensNaoLidas > 0 && (
                      <span className="ml-auto flex items-center justify-center min-w-[20px] h-5 px-1.5 bg-blue-600 text-white text-xs font-bold rounded-full">
                        {ticket.mensagensNaoLidas > 99 ? '99+' : ticket.mensagensNaoLidas}
                      </span>
                    )}
                  </div>

                  {/* Tempo */}
                  <div className="flex items-center gap-1 text-gray-400 ml-2">
                    <Clock className="w-3 h-3" />
                    <span className="text-xs">
                      {formatarData(ticket.atualizadoEm || ticket.criadoEm)}
                    </span>
                  </div>
                </div>

                {/* Nome do Contato/Cliente */}
                <h4 className="font-semibold text-gray-900 mb-1 line-clamp-1 text-sm">
                  {ticket.contatoNome || ticket.clienteNome || 'Sem identificação'}
                </h4>

                {/* Assunto */}
                {ticket.assunto && (
                  <p className="text-sm text-gray-700 mb-1 line-clamp-1 font-medium">
                    {ticket.assunto}
                  </p>
                )}

                {/* Preview da última mensagem */}
                {(ticket.ultimaMensagem || ticket.descricao) && (
                  <div className="flex items-start gap-1 mb-2">
                    <MessageSquare className="w-3 h-3 text-gray-400 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-gray-600 line-clamp-2">
                      {truncateText(ticket.ultimaMensagem || ticket.descricao || '', 80)}
                    </p>
                  </div>
                )}

                {/* Footer do Card */}
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Status */}
                  <span
                    className={`px-2 py-0.5 rounded-md text-xs font-medium border ${getStatusColor(
                      ticket.status,
                    )}`}
                  >
                    {ticket.status === 'aberto' && '📬'}
                    {ticket.status === 'em_atendimento' && '💬'}
                    {ticket.status === 'aguardando' && '⏸️'}
                    {ticket.status === 'resolvido' && '✅'}
                    {ticket.status === 'fechado' && '🔒'}{' '}
                    <span className="capitalize">{ticket.status.replace('_', ' ')}</span>
                  </span>

                  {/* Atendente */}
                  {ticket.atendenteId && (
                    <span className="flex items-center gap-1 text-xs text-gray-500">
                      <User className="w-3 h-3" />
                      Atribuído
                    </span>
                  )}

                  {/* Telefone (se houver espaço) */}
                  {ticket.contatoTelefone && (
                    <span className="text-xs text-gray-500 truncate ml-auto max-w-[120px]">
                      {ticket.contatoTelefone}
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
