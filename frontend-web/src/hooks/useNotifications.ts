/**
 * Hook customizado para gerenciar notificações em tempo real via WebSocket
 * 
 * Conecta-se ao atendimento.gateway.ts e escuta eventos de:
 * - novo_ticket: Novo ticket criado
 * - ticket_atualizado: Status/dados do ticket mudaram
 * - ticket:atribuido: Ticket foi atribuído a um atendente
 * - nova_mensagem: Nova mensagem recebida
 * - notificacao: Notificação genérica do sistema
 * 
 * Features:
 * - Conexão automática ao montar
 * - Desconexão automática ao desmontar
 * - Reconnect automático em caso de falha
 * - Toast notifications com react-hot-toast
 * - Áudio de notificação (opcional)
 * 
 * @author ConectCRM
 * @date 2025-11-18
 */

import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import toast from 'react-hot-toast';

// WebSocket URL (ajustar conforme ambiente)
const WS_URL = process.env.REACT_APP_WS_URL || 'http://localhost:3001';

// Interface para notificação
export interface Notificacao {
  tipo: 'info' | 'success' | 'warning' | 'error';
  titulo: string;
  mensagem: string;
  ticketId?: string;
  timestamp?: Date;
}

// Interface para evento de novo ticket
export interface NovoTicketEvento {
  id: string;
  clienteNome: string;
  clienteNumero: string;
  assunto?: string;
  status: string;
  createdAt: Date;
}

// Interface para evento de ticket atualizado
export interface TicketAtualizadoEvento {
  id: string;
  ticketId: string;
  status: string;
  updatedAt: Date;
}

// Interface para evento de ticket atribuído
export interface TicketAtribuidoEvento {
  ticketId: string;
  atendenteId: string;
  atendenteNome: string;
  ticket: any;
}

// Interface para evento de nova mensagem
export interface NovaMensagemEvento {
  id: string;
  ticketId: string;
  remetente: 'CLIENTE' | 'ATENDENTE' | 'SISTEMA';
  conteudo: string;
  createdAt: Date;
}

/**
 * Hook useNotifications
 * 
 * @param options - Opções de configuração
 * @returns Estado da conexão e funções de controle
 */
export const useNotifications = (options?: {
  autoConnect?: boolean;
  userId?: string;
  onNovoTicket?: (ticket: NovoTicketEvento) => void;
  onTicketAtualizado?: (ticket: TicketAtualizadoEvento) => void;
  onTicketAtribuido?: (atribuicao: TicketAtribuidoEvento) => void;
  onNovaMensagem?: (mensagem: NovaMensagemEvento) => void;
  onNotificacao?: (notificacao: Notificacao) => void;
  enableSound?: boolean;
  enableToast?: boolean;
}) => {
  const {
    autoConnect = true,
    userId,
    onNovoTicket,
    onTicketAtualizado,
    onTicketAtribuido,
    onNovaMensagem,
    onNotificacao,
    enableSound = true,
    enableToast = true,
  } = options || {};

  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Toca som de notificação
   */
  const playNotificationSound = () => {
    if (!enableSound) return;

    try {
      // Criar áudio inline (sem arquivo externo)
      const audioContext = new AudioContext();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 800; // 800 Hz
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    } catch (err) {
      console.warn('Não foi possível tocar som de notificação:', err);
    }
  };

  /**
   * Exibe toast notification
   */
  const showToast = (notif: Notificacao) => {
    if (!enableToast) return;

    const message = `${notif.titulo}: ${notif.mensagem}`;

    switch (notif.tipo) {
      case 'success':
        toast.success(message, { duration: 4000 });
        break;
      case 'error':
        toast.error(message, { duration: 5000 });
        break;
      case 'warning':
        toast(message, {
          icon: '⚠️',
          duration: 4000,
          style: {
            background: '#FEF3C7',
            color: '#92400E',
          },
        });
        break;
      default:
        toast(message, { duration: 3000 });
    }
  };

  /**
   * Conecta ao WebSocket
   */
  const connect = () => {
    if (socketRef.current?.connected) {
      console.log('🔌 WebSocket já está conectado');
      return;
    }

    try {
      // Obter token do localStorage (usar authToken que é onde o authService salva)
      const token = localStorage.getItem('authToken');

      if (!token) {
        console.warn('⚠️ Token não encontrado. WebSocket não será conectado.');
        setIsConnected(false);
        return; // ⚡ NÃO conectar sem token
      }

      console.log('🔌 Conectando ao WebSocket:', WS_URL);

      // Criar conexão Socket.io
      const socket = io(`${WS_URL}/atendimento`, {
        auth: { token },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });

      // Event: connect
      socket.on('connect', () => {
        console.log('✅ WebSocket conectado:', socket.id);
        setIsConnected(true);
        setError(null);

        // Entrar na sala de atendentes (opcional)
        socket.emit('atendente:online', { userId });
      });

      // Event: disconnect
      socket.on('disconnect', (reason) => {
        console.log('❌ WebSocket desconectado:', reason);
        setIsConnected(false);
      });

      // Event: connect_error
      socket.on('connect_error', (err) => {
        console.error('❌ Erro ao conectar WebSocket:', err.message);
        setError(`Erro de conexão: ${err.message}`);
        setIsConnected(false);
      });

      // Event: novo_ticket
      socket.on('novo_ticket', (data: NovoTicketEvento) => {
        console.log('🆕 Novo ticket recebido:', data);

        playNotificationSound();
        showToast({
          tipo: 'info',
          titulo: 'Novo Ticket',
          mensagem: `${data.clienteNome} - ${data.assunto || 'Sem assunto'}`,
          ticketId: data.id,
        });

        onNovoTicket?.(data);
      });

      // Event: ticket_atualizado
      socket.on('ticket_atualizado', (data: TicketAtualizadoEvento) => {
        console.log('🔄 Ticket atualizado:', data);

        showToast({
          tipo: 'info',
          titulo: 'Ticket Atualizado',
          mensagem: `Status: ${data.status}`,
          ticketId: data.ticketId,
        });

        onTicketAtualizado?.(data);
      });

      // Event: ticket:atribuido
      socket.on('ticket:atribuido', (data: TicketAtribuidoEvento) => {
        console.log('👤 Ticket atribuído:', data);

        playNotificationSound();
        showToast({
          tipo: 'success',
          titulo: 'Ticket Atribuído',
          mensagem: `Ticket #${data.ticketId} foi atribuído para você`,
          ticketId: data.ticketId,
        });

        onTicketAtribuido?.(data);
      });

      // Event: nova_mensagem
      socket.on('nova_mensagem', (data: NovaMensagemEvento) => {
        console.log('💬 Nova mensagem:', data);

        // Só notificar se for mensagem do cliente
        if (data.remetente === 'CLIENTE') {
          playNotificationSound();
          showToast({
            tipo: 'info',
            titulo: 'Nova Mensagem',
            mensagem: data.conteudo.substring(0, 50) + (data.conteudo.length > 50 ? '...' : ''),
            ticketId: data.ticketId,
          });
        }

        onNovaMensagem?.(data);
      });

      // Event: notificacao (genérica)
      socket.on('notificacao', (data: Notificacao) => {
        console.log('🔔 Notificação:', data);

        playNotificationSound();
        showToast(data);

        onNotificacao?.(data);
      });

      socketRef.current = socket;
    } catch (err) {
      console.error('❌ Erro ao criar WebSocket:', err);
      setError('Erro ao criar conexão');
    }
  };

  /**
   * Desconecta do WebSocket
   */
  const disconnect = () => {
    if (socketRef.current) {
      console.log('🔌 Desconectando WebSocket...');
      socketRef.current.disconnect();
      socketRef.current = null;
      setIsConnected(false);
    }
  };

  /**
   * Envia evento customizado
   */
  const emit = (event: string, data: any) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit(event, data);
    } else {
      console.warn('⚠️ WebSocket não está conectado. Evento não enviado:', event);
    }
  };

  /**
   * Effect: auto-connect ao montar
   */
  useEffect(() => {
    if (autoConnect) {
      connect();
    }

    // Cleanup ao desmontar
    return () => {
      disconnect();
    };
  }, [autoConnect]);

  return {
    isConnected,
    error,
    connect,
    disconnect,
    emit,
    socket: socketRef.current,
  };
};
