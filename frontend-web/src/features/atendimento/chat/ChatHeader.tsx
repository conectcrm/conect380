import React from 'react';
import { User, ChevronRight, ChevronLeft, MoreVertical, Phone, Mail, Star } from 'lucide-react';

interface ChatHeaderProps {
  ticket?: {
    id: string;
    numero: number | string;
    status: string;
    prioridade: string;
    contatoNome?: string;
    contatoTelefone?: string;
    clienteNome?: string;
    clienteVip?: boolean;
    assunto?: string;
  } | null;
  contextoAberto: boolean;
  onToggleContexto: () => void;
  onStatusChange?: (status: string) => void;
  onPrioridadeChange?: (prioridade: string) => void;
}

const Avatar: React.FC<{ name?: string; src?: string }> = ({ name, src }) => {
  const initials = name
    ? name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
    : '??';

  return (
    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold text-sm shadow-sm">
      {src ? (
        <img src={src} alt={name} className="w-full h-full rounded-full object-cover" />
      ) : (
        initials
      )}
    </div>
  );
};

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const getStatusColor = () => {
    switch (status) {
      case 'aberto':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'em_atendimento':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'aguardando':
        return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'resolvido':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'fechado':
        return 'bg-gray-100 text-gray-700 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusLabel = () => {
    switch (status) {
      case 'aberto':
        return '📬 Aberto';
      case 'em_atendimento':
        return '💬 Em Atendimento';
      case 'aguardando':
        return '⏸️ Aguardando';
      case 'resolvido':
        return '✅ Resolvido';
      case 'fechado':
        return '🔒 Fechado';
      default:
        return status;
    }
  };

  return (
    <span className={`px-2 py-1 rounded-md text-xs font-medium border ${getStatusColor()}`}>
      {getStatusLabel()}
    </span>
  );
};

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  ticket,
  contextoAberto,
  onToggleContexto,
  onStatusChange,
  onPrioridadeChange
}) => {
  if (!ticket) {
    return (
      <div className="bg-white border-b px-6 py-4 flex items-center justify-center">
        <p className="text-sm text-gray-500">Selecione um ticket para visualizar</p>
      </div>
    );
  }

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

  return (
    <div className="bg-white border-b">
      <div className="px-6 py-3 flex items-center justify-between">
        {/* Informações do Cliente */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <Avatar name={ticket.contatoNome || ticket.clienteNome} />

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-gray-900 truncate">
                {ticket.contatoNome || ticket.clienteNome || 'Cliente não identificado'}
              </h3>
              {ticket.clienteVip && (
                <span title="Cliente VIP">
                  <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                </span>
              )}
              <span className="text-xs text-gray-500 font-mono">
                #{ticket.numero}
              </span>
            </div>

            <div className="flex items-center gap-3 text-sm text-gray-500">
              {ticket.contatoTelefone && (
                <div className="flex items-center gap-1">
                  <Phone className="w-3 h-3" />
                  <span className="truncate">{ticket.contatoTelefone}</span>
                </div>
              )}
              {ticket.assunto && (
                <span className="truncate text-xs">
                  {ticket.assunto}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Ações */}
        <div className="flex items-center gap-3 ml-4">
          {/* Prioridade */}
          <select
            value={ticket.prioridade}
            onChange={(e) => onPrioridadeChange?.(e.target.value)}
            className="px-2 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            title="Alterar prioridade"
          >
            <option value="baixa">🟢 Baixa</option>
            <option value="media">🟡 Média</option>
            <option value="alta">🔴 Alta</option>
          </select>

          {/* Status */}
          <select
            value={ticket.status}
            onChange={(e) => onStatusChange?.(e.target.value)}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            title="Alterar status"
          >
            <option value="aberto">📬 Aberto</option>
            <option value="em_atendimento">💬 Em Atendimento</option>
            <option value="aguardando">⏸️ Aguardando</option>
            <option value="resolvido">✅ Resolvido</option>
            <option value="fechado">🔒 Fechado</option>
          </select>

          {/* Toggle Contexto */}
          <button
            onClick={onToggleContexto}
            className={`flex items-center gap-2 px-3 py-2 rounded-md transition-all ${contextoAberto
                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                : 'bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100'
              }`}
            title={contextoAberto ? 'Fechar painel de contexto' : 'Abrir painel de contexto'}
          >
            {contextoAberto ? (
              <>
                <ChevronRight className="w-4 h-4" />
                <span className="text-sm font-medium hidden lg:inline">Fechar</span>
              </>
            ) : (
              <>
                <ChevronLeft className="w-4 h-4" />
                <span className="text-sm font-medium hidden lg:inline">Contexto</span>
              </>
            )}
          </button>

          {/* Menu Mais Opções */}
          <button
            className="p-2 hover:bg-gray-100 rounded-md transition-colors"
            title="Mais opções"
          >
            <MoreVertical className="w-4 h-4 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Linha de Status e Prioridade (visível em mobile) */}
      <div className="lg:hidden px-6 py-2 bg-gray-50 border-t flex items-center gap-2">
        <StatusBadge status={ticket.status} />
        <span className="text-lg">{getPrioridadeIcon(ticket.prioridade)}</span>
      </div>
    </div>
  );
};
