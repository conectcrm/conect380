/**
 * NotificationsProvider
 *
 * Provider global para gerenciar notificações em tempo real
 * Utiliza Context API para compartilhar estado entre componentes
 *
 * Features:
 * - Conexão WebSocket centralizada
 * - Estado global de notificações
 * - Callbacks para eventos do WebSocket
 * - Fácil acesso via useNotificationsContext hook
 *
 * @author ConectCRM
 * @date 2025-11-18
 */

import React, { createContext, useContext, ReactNode, useState, useCallback } from 'react';
import {
  useNotifications,
  Notificacao,
  NovoTicketEvento,
  TicketAtualizadoEvento,
  TicketAtribuidoEvento,
  NovaMensagemEvento,
} from '../hooks/useNotifications';

// Interface do contexto
interface NotificationsContextType {
  isConnected: boolean;
  error: string | null;
  connect: () => void;
  disconnect: () => void;
  emit: (event: string, data: any) => void;
  // Estados
  novosTickets: NovoTicketEvento[];
  ticketsAtualizados: TicketAtualizadoEvento[];
  ticketsAtribuidos: TicketAtribuidoEvento[];
  novasMensagens: NovaMensagemEvento[];
  notificacoes: Notificacao[];
  // Funções
  limparNotificacoes: () => void;
}

// Criar contexto
const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);

// Provider props
interface NotificationsProviderProps {
  children: ReactNode;
  autoConnect?: boolean;
  enableSound?: boolean;
  enableToast?: boolean;
}

/**
 * Provider de notificações
 */
export const NotificationsProvider: React.FC<NotificationsProviderProps> = ({
  children,
  autoConnect = true,
  enableSound = true,
  enableToast = true,
}) => {
  // Estados para armazenar eventos
  const [novosTickets, setNovosTickets] = useState<NovoTicketEvento[]>([]);
  const [ticketsAtualizados, setTicketsAtualizados] = useState<TicketAtualizadoEvento[]>([]);
  const [ticketsAtribuidos, setTicketsAtribuidos] = useState<TicketAtribuidoEvento[]>([]);
  const [novasMensagens, setNovasMensagens] = useState<NovaMensagemEvento[]>([]);
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);

  // Callbacks para eventos
  const handleNovoTicket = useCallback((ticket: NovoTicketEvento) => {
    setNovosTickets((prev) => [...prev, ticket]);
  }, []);

  const handleTicketAtualizado = useCallback((ticket: TicketAtualizadoEvento) => {
    setTicketsAtualizados((prev) => [...prev, ticket]);
  }, []);

  const handleTicketAtribuido = useCallback((atribuicao: TicketAtribuidoEvento) => {
    setTicketsAtribuidos((prev) => [...prev, atribuicao]);
  }, []);

  const handleNovaMensagem = useCallback((mensagem: NovaMensagemEvento) => {
    setNovasMensagens((prev) => [...prev, mensagem]);
  }, []);

  const handleNotificacao = useCallback((notificacao: Notificacao) => {
    setNotificacoes((prev) => [...prev, notificacao]);
  }, []);

  // Limpar todas as notificações
  const limparNotificacoes = useCallback(() => {
    setNovosTickets([]);
    setTicketsAtualizados([]);
    setTicketsAtribuidos([]);
    setNovasMensagens([]);
    setNotificacoes([]);
  }, []);

  // Hook de notificações
  const { isConnected, error, connect, disconnect, emit } = useNotifications({
    autoConnect,
    enableSound,
    enableToast,
    onNovoTicket: handleNovoTicket,
    onTicketAtualizado: handleTicketAtualizado,
    onTicketAtribuido: handleTicketAtribuido,
    onNovaMensagem: handleNovaMensagem,
    onNotificacao: handleNotificacao,
  });

  const contextValue: NotificationsContextType = {
    isConnected,
    error,
    connect,
    disconnect,
    emit,
    novosTickets,
    ticketsAtualizados,
    ticketsAtribuidos,
    novasMensagens,
    notificacoes,
    limparNotificacoes,
  };

  return (
    <NotificationsContext.Provider value={contextValue}>{children}</NotificationsContext.Provider>
  );
};

/**
 * Hook para acessar contexto de notificações
 */
export const useNotificationsContext = (): NotificationsContextType => {
  const context = useContext(NotificationsContext);

  if (!context) {
    throw new Error('useNotificationsContext deve ser usado dentro de NotificationsProvider');
  }

  return context;
};
