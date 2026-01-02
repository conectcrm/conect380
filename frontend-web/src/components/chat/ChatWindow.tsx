import React, { useState } from 'react';
import { useChat } from '../../hooks/useChat';
import { TicketList } from './TicketList';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { TypingIndicator } from './TypingIndicator';

interface ChatWindowProps {
  token: string;
}

export function ChatWindow({ token }: ChatWindowProps) {
  const [activeTicketId, setActiveTicketId] = useState<string | null>(null);

  const chat = useChat({
    token,
    ticketId: activeTicketId || undefined,
    onNovaMensagem: (mensagem) => {
      console.log('[ChatWindow] Nova mensagem:', mensagem);
      // Mostrar notificação se não for o ticket ativo
      if (mensagem.ticketId !== activeTicketId) {
        // TODO: mostrar toast
      }
    },
    onNovoTicket: (ticket) => {
      console.log('[ChatWindow] Novo ticket:', ticket);
      // TODO: mostrar notificação
    },
  });

  const handleTicketSelect = (ticketId: string) => {
    setActiveTicketId(ticketId);
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Indicador de conexão */}
      <div className="fixed top-4 right-4 z-50">
        {chat.connecting && (
          <div className="flex items-center gap-2 bg-yellow-500 text-white px-3 py-1 rounded-full text-sm shadow-lg">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
            Conectando...
          </div>
        )}
        {chat.connected && (
          <div className="flex items-center gap-2 bg-green-500 text-white px-3 py-1 rounded-full text-sm shadow-lg">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
            Online
          </div>
        )}
        {chat.error && !chat.connected && !chat.connecting && (
          <div className="flex items-center gap-2 bg-red-500 text-white px-3 py-1 rounded-full text-sm shadow-lg">
            <div className="w-2 h-2 bg-white rounded-full" />
            Offline
          </div>
        )}
      </div>

      {/* Sidebar com lista de tickets */}
      <TicketList
        tickets={chat.tickets}
        activeTicketId={activeTicketId}
        onTicketSelect={handleTicketSelect}
      />

      {/* Área principal */}
      <div className="flex-1 flex flex-col">
        {activeTicketId ? (
          <>
            {/* Cabeçalho */}
            <div className="bg-white border-b px-6 py-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-800">
                    Ticket #
                    {chat.tickets.find((t) => t.id === activeTicketId)?.numero ||
                      activeTicketId.slice(0, 8)}
                  </h2>
                  <p className="text-sm text-gray-500">
                    {chat.tickets.find((t) => t.id === activeTicketId)?.assunto || 'Sem assunto'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      chat.tickets.find((t) => t.id === activeTicketId)?.status === 'aberto'
                        ? 'bg-blue-100 text-blue-800'
                        : chat.tickets.find((t) => t.id === activeTicketId)?.status ===
                            'em_atendimento'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-green-100 text-green-800'
                    }`}
                  >
                    {chat.tickets.find((t) => t.id === activeTicketId)?.status}
                  </span>
                </div>
              </div>
            </div>

            {/* Lista de mensagens */}
            <MessageList
              mensagens={chat.mensagens.filter((m) => m.ticketId === activeTicketId)}
              ticketId={activeTicketId}
            />

            {/* Indicador de digitando */}
            {chat.digitando?.ticketId === activeTicketId && (
              <TypingIndicator usuarioNome={chat.digitando.usuarioNome} />
            )}

            {/* Input de mensagem */}
            <MessageInput
              ticketId={activeTicketId}
              onTyping={() => chat.emitirDigitando(activeTicketId)}
            />
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum ticket selecionado</h3>
              <p className="mt-1 text-sm text-gray-500">
                Selecione um ticket à esquerda para começar o atendimento
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
