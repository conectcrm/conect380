import { useState, useEffect, useCallback } from 'react';

interface SupportWidgetState {
  isOpen: boolean;
  hasNewMessage: boolean;
  unreadCount: number;
  isAgentOnline: boolean;
  averageResponseTime: string;
}

interface UseSupportWidgetReturn extends SupportWidgetState {
  toggleWidget: () => void;
  openWidget: () => void;
  closeWidget: () => void;
  markMessagesAsRead: () => void;
  triggerNewMessage: () => void;
}

export const useSupportWidget = (): UseSupportWidgetReturn => {
  const [state, setState] = useState<SupportWidgetState>({
    isOpen: false,
    hasNewMessage: false,
    unreadCount: 0,
    isAgentOnline: true,
    averageResponseTime: '2 min',
  });

  // Simular status do agente (pode ser conectado via WebSocket)
  useEffect(() => {
    const checkAgentStatus = () => {
      // Simular mudança de status baseado no horário
      const now = new Date();
      const hour = now.getHours();
      const isBusinessHours = hour >= 8 && hour <= 18;

      setState((prev) => ({
        ...prev,
        isAgentOnline: isBusinessHours,
        averageResponseTime: isBusinessHours ? '2 min' : '15 min',
      }));
    };

    // Verificar status inicial
    checkAgentStatus();

    // Verificar a cada 5 minutos
    const interval = setInterval(checkAgentStatus, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  // Simular novas mensagens aleatórias
  useEffect(() => {
    if (state.isOpen) return; // Não mostrar notificações se o widget estiver aberto

    const simulateNewMessage = () => {
      // 30% de chance de receber uma "nova mensagem" a cada 2 minutos
      if (Math.random() > 0.7) {
        setState((prev) => ({
          ...prev,
          hasNewMessage: true,
          unreadCount: prev.unreadCount + 1,
        }));

        // Remover a notificação após 15 segundos se não for vista
        setTimeout(() => {
          setState((prev) => ({
            ...prev,
            hasNewMessage: false,
          }));
        }, 15000);
      }
    };

    const interval = setInterval(simulateNewMessage, 2 * 60 * 1000); // A cada 2 minutos

    return () => clearInterval(interval);
  }, [state.isOpen]);

  const toggleWidget = useCallback(() => {
    setState((prev) => {
      const newIsOpen = !prev.isOpen;

      // Se estiver abrindo, marcar mensagens como lidas
      if (newIsOpen) {
        return {
          ...prev,
          isOpen: newIsOpen,
          hasNewMessage: false,
          unreadCount: 0,
        };
      }

      return {
        ...prev,
        isOpen: newIsOpen,
      };
    });
  }, []);

  const openWidget = useCallback(() => {
    setState((prev) => ({
      ...prev,
      isOpen: true,
      hasNewMessage: false,
      unreadCount: 0,
    }));
  }, []);

  const closeWidget = useCallback(() => {
    setState((prev) => ({
      ...prev,
      isOpen: false,
    }));
  }, []);

  const markMessagesAsRead = useCallback(() => {
    setState((prev) => ({
      ...prev,
      hasNewMessage: false,
      unreadCount: 0,
    }));
  }, []);

  const triggerNewMessage = useCallback(() => {
    setState((prev) => ({
      ...prev,
      hasNewMessage: true,
      unreadCount: prev.unreadCount + 1,
    }));
  }, []);

  return {
    ...state,
    toggleWidget,
    openWidget,
    closeWidget,
    markMessagesAsRead,
    triggerNewMessage,
  };
};
