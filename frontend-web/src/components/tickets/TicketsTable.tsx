/**
 * TABELA DE TICKETS - CONECT CRM
 * Visualização profissional em tabela com funcionalidades avançadas
 */

import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  ChevronUp,
  ChevronDown,
  Edit2,
  Trash2,
  UserPlus,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  AlertCircle,
  Timer,
} from 'lucide-react';
import { Ticket, StatusTicketApi, TipoTicket, PrioridadeTicketApi } from '../../services/ticketsService';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface TicketsTableProps {
  tickets: Ticket[];
  onEdit: (ticket: Ticket) => void;
  onDelete: (ticket: Ticket) => void;
  onAtribuir?: (ticket: Ticket) => void;
  selectedIds: string[];
  onSelectToggle: (ticketId: string) => void;
  onSelectAll: () => void;
  sortField: string;
  sortDirection: 'asc' | 'desc';
  onSort: (field: string) => void;
  density: 'compact' | 'comfortable' | 'spacious';
  visibleColumns?: string[]; // NOVA PROPRIEDADE
}

interface SortableHeaderProps {
  field: string;
  label: React.ReactNode;
  className?: string;
  sortField: string;
  sortDirection: 'asc' | 'desc';
  onSort: (field: string) => void;
}

const SortableHeader: React.FC<SortableHeaderProps> = ({
  field,
  label,
  className = '',
  sortField,
  sortDirection,
  onSort,
}) => (
  <th
    onClick={() => onSort(field)}
    className={`px-4 py-3 text-left text-xs font-semibold text-[#002333] uppercase tracking-wider cursor-pointer hover:bg-[#159A9C]/5 transition-colors select-none ${className}`}
  >
    <div className="flex items-center gap-2">
      {label}
      {sortField === field && (
        <span className="text-[#159A9C]">
          {sortDirection === 'asc' ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </span>
      )}
    </div>
  </th>
);

export const TicketsTable: React.FC<TicketsTableProps> = ({
  tickets,
  onEdit,
  onDelete,
  onAtribuir,
  selectedIds,
  onSelectToggle,
  onSelectAll,
  sortField,
  sortDirection,
  onSort,
  density,
  visibleColumns = ['numero', 'prioridade', 'titulo', 'status', 'tipo', 'cliente', 'responsavel', 'sla', 'criado'], // PADRÃO
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  // Configurações de densidade
  const densityConfig = {
    compact: { padding: 'py-2', text: 'text-xs', avatar: 'h-6 w-6' },
    comfortable: { padding: 'py-3', text: 'text-sm', avatar: 'h-8 w-8' },
    spacious: { padding: 'py-4', text: 'text-sm', avatar: 'h-10 w-10' },
  };

  const config = densityConfig[density];

  // Helper para verificar se coluna esta visivel
  const isColumnVisible = (columnId: string) => visibleColumns.includes(columnId);

  // Labels e cores
  const getStatusLabel = (status: StatusTicketApi): string => {
    const labels: Partial<Record<StatusTicketApi, string>> = {
      FILA: 'Fila',
      EM_ATENDIMENTO: 'Em Atendimento',
      AGUARDANDO_CLIENTE: 'Aguardando Cliente',
      AGUARDANDO_INTERNO: 'Aguardando Interno',
      CONCLUIDO: 'Concluído',
      CANCELADO: 'Cancelado',
      ENCERRADO: 'Encerrado',
    };
    return labels[status] || status;
  };

  const getStatusColor = (status: StatusTicketApi): string => {
    const colors: Partial<Record<StatusTicketApi, string>> = {
      FILA: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      EM_ATENDIMENTO: 'bg-blue-100 text-blue-800 border-blue-200',
      AGUARDANDO_CLIENTE: 'bg-orange-100 text-orange-800 border-orange-200',
      AGUARDANDO_INTERNO: 'bg-purple-100 text-purple-800 border-purple-200',
      CONCLUIDO: 'bg-green-100 text-green-800 border-green-200',
      CANCELADO: 'bg-red-100 text-red-800 border-red-200',
      ENCERRADO: 'bg-gray-100 text-gray-800 border-gray-200',
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getTipoLabel = (tipo?: TipoTicket): string => {
    if (!tipo) return 'Sem tipo';
    const labels: Record<TipoTicket, string> = {
      tecnica: 'Técnica',
      comercial: 'Comercial',
      financeira: 'Financeira',
      suporte: 'Suporte',
      reclamacao: 'Reclamação',
      solicitacao: 'Solicitação',
      outros: 'Outros',
    };
    return labels[tipo] || tipo;
  };

  const getPrioridadeIcon = (prioridade: PrioridadeTicketApi) => {
    switch (prioridade) {
      case 'URGENTE':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'ALTA':
        return <AlertCircle className="h-4 w-4 text-orange-600" />;
      case 'MEDIA':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'BAIXA':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      default:
        return null;
    }
  };

  const getPrioridadeColor = (prioridade: PrioridadeTicketApi): string => {
    const colors: Record<PrioridadeTicketApi, string> = {
      URGENTE: 'bg-red-100 text-red-800 border-red-200',
      ALTA: 'bg-orange-100 text-orange-800 border-orange-200',
      MEDIA: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      BAIXA: 'bg-green-100 text-green-800 border-green-200',
    };
    return colors[prioridade] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  // SLA visual
  const getSLAStatus = (ticket: Ticket): { icon: React.ReactNode; text: string; color: string } => {
    const referencia = ticket.slaExpiresAt || ticket.dataVencimento;

    if (!referencia) {
      return {
        icon: <Clock className="h-4 w-4 text-gray-400" />,
        text: 'Sem SLA',
        color: 'text-gray-500',
      };
    }

    const expiresAtMs = new Date(referencia).getTime();
    if (!Number.isFinite(expiresAtMs)) {
      return {
        icon: <Clock className="h-4 w-4 text-gray-400" />,
        text: 'Sem SLA',
        color: 'text-gray-500',
      };
    }

    const diffMs = expiresAtMs - new Date().getTime();
    if (diffMs <= 0) {
      return {
        icon: <XCircle className="h-4 w-4 text-red-600" />,
        text: 'Vencido',
        color: 'text-red-600',
      };
    }

    if (diffMs <= 2 * 60 * 60 * 1000) {
      const horasRestantes = Math.max(1, Math.ceil(diffMs / (60 * 60 * 1000)));
      return {
        icon: <AlertTriangle className="h-4 w-4 text-orange-600" />,
        text: `< ${horasRestantes}h`,
        color: 'text-orange-600',
      };
    }

    return {
      icon: <CheckCircle className="h-4 w-4 text-green-600" />,
      text: formatDistanceToNow(new Date(referencia), { locale: ptBR }),
      color: 'text-green-600',
    };
  };

  // Formatar data relativa
  const formatDataRelativa = (data: string): string => {
    try {
      return formatDistanceToNow(new Date(data), { addSuffix: true, locale: ptBR });
    } catch {
      return 'Data inválida';
    }
  };

  const handleRowClick = (ticket: Ticket) => {
    const returnTo = `${location.pathname}${location.search}${location.hash}`;
    navigate(`/atendimento/tickets/${ticket.id}`, {
      state: {
        returnTo,
      },
    });
  };

  const allSelected = tickets.length > 0 && selectedIds.length === tickets.length;
  const someSelected = selectedIds.length > 0 && selectedIds.length < tickets.length;

  return (
    <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          {/* Header */}
          <thead className="bg-gray-50">
            <tr>
              {/* Checkbox de selecao */}
              <th className="px-4 py-3 w-12">
                <input
                  type="checkbox"
                  checked={allSelected}
                  ref={(input) => {
                    if (input) input.indeterminate = someSelected;
                  }}
                  onChange={onSelectAll}
                  className="h-4 w-4 rounded border-gray-300 text-[#159A9C] focus:ring-[#159A9C] cursor-pointer"
                />
              </th>

              {isColumnVisible('numero') && (
                <SortableHeader
                  field="numero"
                  label="#"
                  className="w-24"
                  sortField={sortField}
                  sortDirection={sortDirection}
                  onSort={onSort}
                />
              )}
              {isColumnVisible('prioridade') && (
                <SortableHeader
                  field="prioridade"
                  label="Prioridade"
                  className="w-32"
                  sortField={sortField}
                  sortDirection={sortDirection}
                  onSort={onSort}
                />
              )}
              {isColumnVisible('titulo') && (
                <SortableHeader
                  field="titulo"
                  label="Título"
                  className="min-w-[250px]"
                  sortField={sortField}
                  sortDirection={sortDirection}
                  onSort={onSort}
                />
              )}
              {isColumnVisible('status') && (
                <SortableHeader
                  field="status"
                  label="Status"
                  className="w-40"
                  sortField={sortField}
                  sortDirection={sortDirection}
                  onSort={onSort}
                />
              )}
              {isColumnVisible('tipo') && (
                <th className="px-4 py-3 text-left text-xs font-semibold text-[#002333] uppercase tracking-wider w-32">
                  Tipo
                </th>
              )}
              {isColumnVisible('cliente') && (
                <th className="px-4 py-3 text-left text-xs font-semibold text-[#002333] uppercase tracking-wider w-40">
                  Cliente
                </th>
              )}
              {isColumnVisible('responsavel') && (
                <th className="px-4 py-3 text-left text-xs font-semibold text-[#002333] uppercase tracking-wider w-40">
                  Responsável
                </th>
              )}
              {isColumnVisible('sla') && (
                <th className="px-4 py-3 text-left text-xs font-semibold text-[#002333] uppercase tracking-wider w-28">
                  SLA
                </th>
              )}
              {isColumnVisible('criado') && (
                <SortableHeader
                  field="createdAt"
                  label="Criado"
                  className="w-32"
                  sortField={sortField}
                  sortDirection={sortDirection}
                  onSort={onSort}
                />
              )}

              <th className="px-4 py-3 text-right text-xs font-semibold text-[#002333] uppercase tracking-wider w-24">
                Ações
              </th>
            </tr>
          </thead>

          {/* Body */}
          <tbody className="bg-white divide-y divide-gray-200">
            {tickets.map((ticket) => {
              const isSelected = selectedIds.includes(ticket.id);
              const slaStatus = getSLAStatus(ticket);

              return (
                <tr
                  key={ticket.id}
                  className={`hover:bg-gray-50 transition-colors ${isSelected ? 'bg-[#159A9C]/5' : ''
                    }`}
                >
                  {/* Checkbox */}
                  <td className={`px-4 ${config.padding} whitespace-nowrap`}>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => {
                        e.stopPropagation();
                        onSelectToggle(ticket.id);
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className="h-4 w-4 rounded border-gray-300 text-[#159A9C] focus:ring-[#159A9C] cursor-pointer"
                    />
                  </td>

                  {/* Numero */}
                  {isColumnVisible('numero') && (
                    <td
                      className={`px-4 ${config.padding} whitespace-nowrap cursor-pointer`}
                      onClick={() => handleRowClick(ticket)}
                    >
                      <span className={`${config.text} font-semibold text-[#159A9C]`}>
                        #{ticket.numero}
                      </span>
                    </td>
                  )}

                  {/* Prioridade */}
                  {isColumnVisible('prioridade') && (
                    <td
                      className={`px-4 ${config.padding} whitespace-nowrap cursor-pointer`}
                      onClick={() => handleRowClick(ticket)}
                    >
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full ${config.text} font-medium border ${getPrioridadeColor(
                          ticket.prioridade as PrioridadeTicketApi
                        )}`}
                      >
                        {getPrioridadeIcon(ticket.prioridade as PrioridadeTicketApi)}
                        {ticket.prioridade}
                      </span>
                    </td>
                  )}

                  {/* Título */}
                  {isColumnVisible('titulo') && (
                    <td
                      className={`px-4 ${config.padding} cursor-pointer`}
                      onClick={() => handleRowClick(ticket)}
                    >
                      <div className="flex flex-col">
                        <span className={`${config.text} font-medium text-[#002333] line-clamp-1`}>
                          {ticket.titulo || ticket.assunto || 'Sem título'}
                        </span>
                        {ticket.descricao && (
                          <span className="text-xs text-gray-500 line-clamp-1 mt-0.5">
                            {ticket.descricao}
                          </span>
                        )}
                      </div>
                    </td>
                  )}

                  {/* Status */}
                  {isColumnVisible('status') && (
                    <td
                      className={`px-4 ${config.padding} whitespace-nowrap cursor-pointer`}
                      onClick={() => handleRowClick(ticket)}
                    >
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full ${config.text} font-medium border ${getStatusColor(
                          ticket.status as StatusTicketApi
                        )}`}
                      >
                        {getStatusLabel(ticket.status as StatusTicketApi)}
                      </span>
                    </td>
                  )}

                  {/* Tipo */}
                  {isColumnVisible('tipo') && (
                    <td
                      className={`px-4 ${config.padding} whitespace-nowrap cursor-pointer`}
                      onClick={() => handleRowClick(ticket)}
                    >
                      <span className={`${config.text} text-gray-600`}>
                        {getTipoLabel(ticket.tipo)}
                      </span>
                    </td>
                  )}

                  {/* Cliente */}
                  {isColumnVisible('cliente') && (
                    <td
                      className={`px-4 ${config.padding} whitespace-nowrap cursor-pointer`}
                      onClick={() => handleRowClick(ticket)}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={`${config.avatar} rounded-full bg-[#159A9C]/10 flex items-center justify-center flex-shrink-0`}
                        >
                          <span className="text-xs font-semibold text-[#159A9C]">
                            {(ticket.cliente?.nome || 'SC').charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <span className={`${config.text} text-gray-700 truncate`}>
                          {ticket.cliente?.nome || 'Sem cliente'}
                        </span>
                      </div>
                    </td>
                  )}

                  {/* Responsável */}
                  {isColumnVisible('responsavel') && (
                    <td
                      className={`px-4 ${config.padding} whitespace-nowrap cursor-pointer`}
                      onClick={() => handleRowClick(ticket)}
                    >
                      {ticket.responsavel?.nome ? (
                        <div className="flex items-center gap-2">
                          <div
                            className={`${config.avatar} rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0`}
                          >
                            <span className="text-xs font-semibold text-blue-700">
                              {ticket.responsavel.nome.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <span className={`${config.text} text-gray-700 truncate`}>
                            {ticket.responsavel.nome}
                          </span>
                        </div>
                      ) : (
                        <span className={`${config.text} text-gray-400`}>Não atribuído</span>
                      )}
                    </td>
                  )}

                  {/* SLA */}
                  {isColumnVisible('sla') && (
                    <td
                      className={`px-4 ${config.padding} whitespace-nowrap cursor-pointer`}
                      onClick={() => handleRowClick(ticket)}
                    >
                      <div className="flex items-center gap-1.5">
                        {slaStatus.icon}
                        <span className={`${config.text} font-medium ${slaStatus.color}`}>
                          {slaStatus.text}
                        </span>
                      </div>
                    </td>
                  )}

                  {/* Data de Criação */}
                  {isColumnVisible('criado') && (
                    <td
                      className={`px-4 ${config.padding} whitespace-nowrap cursor-pointer`}
                      onClick={() => handleRowClick(ticket)}
                    >
                      <span className={`${config.text} text-gray-600`}>
                        {formatDataRelativa(ticket.createdAt)}
                      </span>
                    </td>
                  )}

                  {/* Ações */}
                  <td className={`px-4 ${config.padding} whitespace-nowrap text-right`}>
                    <div className="flex items-center justify-end gap-1">
                      {onAtribuir && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onAtribuir(ticket);
                          }}
                          className="p-1.5 text-[#159A9C] hover:bg-[#159A9C]/10 rounded transition-colors"
                          title="Atribuir"
                        >
                          <UserPlus className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onEdit(ticket);
                        }}
                        className="p-1.5 text-[#159A9C] hover:bg-[#159A9C]/10 rounded transition-colors"
                        title="Editar"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete(ticket);
                        }}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="Deletar"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Estado vazio */}
      {tickets.length === 0 && (
        <div className="text-center py-12">
          <Timer className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600">Nenhum ticket encontrado</p>
        </div>
      )}
    </div>
  );
};
