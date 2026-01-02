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
import { resolveSocketBaseUrl } from '../utils/network';

const WS_BASE_URL = resolveSocketBaseUrl({
  envUrl: process.env.REACT_APP_WS_URL,
  useWebSocketScheme: true,
  onEnvIgnored: ({ envUrl, currentHost }) => {
    console.warn(
      '⚠️ [WebSocket] Ignorando REACT_APP_WS_URL local em acesso via rede:',
      envUrl,
      '→ host atual',
      currentHost,
    );
  },
});

const DEBUG = process.env.REACT_APP_DEBUG_WS === 'true';

const getNamespaceUrl = (namespace: string) => {
  const base = WS_BASE_URL.endsWith('/') ? WS_BASE_URL.slice(0, -1) : WS_BASE_URL;
  const path = namespace.startsWith('/') ? namespace : `/${namespace}`;
  return `${base}${path}`;
};

const WS_NAMESPACE_URL = getNamespaceUrl('/atendimento');

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

      // ✅ Garantir que AudioContext está rodando (requer interação do usuário)
      if (audioContext.state === 'suspended') {
        audioContext.resume().then(() => {
          oscillator.start(audioContext.currentTime);
          oscillator.stop(audioContext.currentTime + 0.5);
        }).catch((err) => {
          console.warn('AudioContext precisa de interação do usuário:', err);
        });
      } else {
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.5);
      }
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
      if (DEBUG) console.log('🔌 WebSocket já está conectado');
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

      if (DEBUG) console.log('🔌 Conectando ao WebSocket:', WS_NAMESPACE_URL);

      // Criar conexão Socket.io
      const socket = io(WS_NAMESPACE_URL, {
        auth: { token },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        // ✅ Suprimir warnings de conexão esperados em desenvolvimento (React StrictMode)
        closeOnBeforeunload: false,
      });

      // Event: connect
      socket.on('connect', () => {
        if (DEBUG) console.log('✅ WebSocket conectado:', socket.id);
        setIsConnected(true);
        setError(null);

        // Entrar na sala de atendentes (opcional)
        socket.emit('atendente:online', { userId });
      });

      // Event: disconnect
      socket.on('disconnect', (reason) => {
        if (DEBUG) console.log('❌ WebSocket desconectado:', reason);
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
        if (DEBUG) console.log('🆕 Novo ticket recebido:', data);

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
        if (DEBUG) console.log('🔄 Ticket atualizado:', data);

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
        if (DEBUG) console.log('👤 Ticket atribuído:', data);

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
        if (DEBUG) console.log('💬 Nova mensagem:', data);

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
        if (DEBUG) console.log('🔔 Notificação:', data);

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
      try {
        // ✅ Verificar se socket existe e está conectado antes de desconectar
        const socket = socketRef.current;
        if (socket && (socket.connected || socket.active)) {
          if (DEBUG) console.log('🔌 Desconectando WebSocket...');
          socket.disconnect();
        } else {
          if (DEBUG) console.log('🔌 WebSocket já estava desconectado');
        }
      } catch (err) {
        // ✅ Ignorar erros de desconexão (socket já pode estar fechado)
        if (DEBUG) console.log('⚠️ Erro ao desconectar (esperado em React StrictMode):', err);
      } finally {
        socketRef.current = null;
        setIsConnected(false);
      }
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
    let isCleanedUp = false;

    // ✅ Evitar múltiplas conexões em React StrictMode
    if (autoConnect && !socketRef.current) {
      connect();
    }

    // Cleanup ao desmontar
    return () => {
      isCleanedUp = true;
      // ✅ Pequeno delay para evitar desconexão prematura no StrictMode
      setTimeout(() => {
        if (isCleanedUp) {
          disconnect();
        }
      }, 100);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoConnect]); // Não incluir connect/disconnect nas dependências para evitar reconexões

  return {
    isConnected,
    error,
    connect,
    disconnect,
    emit,
    socket: socketRef.current,
  };
};
