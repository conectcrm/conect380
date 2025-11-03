/**
 * 🔌 useWebSocket - Hook para conexão WebSocket em tempo real
 * 
 * Funcionalidades:
 * - Conectar ao gateway do backend
 * - Autenticação automática com JWT
 * - Receber eventos em tempo real:
 *   - novo_ticket
 *   - nova_mensagem
 *   - ticket_atualizado
 *   - ticket_transferido
 *   - ticket_encerrado
 * - Reconexão automática
 * - Gerenciamento de estado de conexão
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { Ticket, Mensagem } from '../types';
import { normalizarMensagemPayload } from '../services/atendimentoService';

interface WebSocketEvents {
  onNovoTicket?: (ticket: Ticket) => void;
  onNovaMensagem?: (mensagem: Mensagem) => void;
  onTicketAtualizado?: (ticket: Ticket) => void;
  onTicketTransferido?: (data: { ticket: Ticket; antigoAtendente?: string; novoAtendente?: string }) => void;
  onTicketEncerrado?: (ticket: Ticket) => void;
}

interface UseWebSocketOptions {
  enabled?: boolean;
  autoConnect?: boolean;
  events?: WebSocketEvents;
}

interface UseWebSocketReturn {
  connected: boolean;
  connecting: boolean;
  error: string | null;
  connect: () => void;
  disconnect: () => void;
  emit: (event: string, data: any) => void;
  entrarNoTicket: (ticketId: string) => void; // 🔥 NOVA
  sairDoTicket: (ticketId: string) => void; // 🔥 NOVA
}

const WEBSOCKET_URL = process.env.REACT_APP_WEBSOCKET_URL || 'http://localhost:3001/atendimento';
const DEBUG = false; // ✅ Desabilitado após resolução do problema de tempo real

// 🔒 SINGLETON: Garantir apenas 1 instância WebSocket em toda aplicação
let globalSocket: Socket | null = null;
let connectionCount = 0;
let isConnecting = false; // 🚦 Flag para prevenir múltiplas conexões simultâneas

export const useWebSocket = (
  options: UseWebSocketOptions = {}
): UseWebSocketReturn => {
  const {
    enabled = true,
    autoConnect = true,
    events = {}
  } = options;

  const socketRef = useRef<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Conectar ao WebSocket
  const connect = useCallback(() => {
    if (!enabled) {
      if (DEBUG) console.log('⚠️ WebSocket desabilitado');
      return;
    }

    // 🔒 Se já existe uma instância global conectada, reutilizar
    if (globalSocket?.connected) {
      if (DEBUG) console.log('♻️ Reutilizando WebSocket existente. ID:', globalSocket.id);
      socketRef.current = globalSocket;
      setConnected(true);
      setConnecting(false);
      connectionCount++;
      if (DEBUG) console.log(`📊 Componentes usando WebSocket: ${connectionCount}`);
      return;
    }

    // 🚦 Se já está conectando, aguardar
    if (isConnecting) {
      if (DEBUG) console.log('⏳ Aguardando conexão em progresso...');
      // Retry após 100ms
      setTimeout(() => {
        if (globalSocket?.connected) {
          if (DEBUG) console.log('♻️ Conexão estabelecida! Reutilizando. ID:', globalSocket.id);
          socketRef.current = globalSocket;
          setConnected(true);
          setConnecting(false);
          connectionCount++;
          if (DEBUG) console.log(`📊 Componentes usando WebSocket: ${connectionCount}`);
        }
      }, 100);
      return;
    }

    if (socketRef.current?.connected) {
      if (DEBUG) console.log('✅ WebSocket já está conectado');
      return;
    }

    try {
      isConnecting = true; // 🚦 Bloquear outras tentativas
      setConnecting(true);
      setError(null);

      // Obter token de autenticação
      const token = localStorage.getItem('authToken');
      if (!token) {
        isConnecting = false;
        throw new Error('Token de autenticação não encontrado');
      }

      if (DEBUG) console.log('🔌 Conectando ao WebSocket:', WEBSOCKET_URL);

      // Criar conexão (apenas se não existir)
      const socket = io(WEBSOCKET_URL, {
        auth: {
          token
        },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
      });

      // Guardar como instância global
      globalSocket = socket;
      socketRef.current = socket;
      connectionCount++;

      // Eventos de conexão
      socket.on('connect', () => {
        isConnecting = false; // 🚦 Liberar após conectar
        if (DEBUG) {
          console.log('✅ WebSocket conectado! ID:', socket.id);
          console.log(`📊 Componentes usando WebSocket: ${connectionCount}`);
        }
        setConnected(true);
        setConnecting(false);
        setError(null);
      });

      // 🔥 DEBUG: Capturar TODOS os eventos recebidos (apenas em desenvolvimento)
      if (DEBUG) {
        socket.onAny((eventName, ...args) => {
          console.log('🔥 [DEBUG] Evento recebido:', eventName, args);
        });
      }

      socket.on('disconnect', (reason) => {
        if (DEBUG) console.log('❌ WebSocket desconectado:', reason);
        setConnected(false);
        setConnecting(false);

        if (reason === 'io server disconnect') {
          // Reconectar se servidor desconectou
          socket.connect();
        }
      });

      socket.on('connect_error', (err) => {
        isConnecting = false; // 🚦 Liberar em caso de erro
        console.error('❌ Erro de conexão WebSocket:', err.message);
        setError(err.message);
        setConnecting(false);
      });

      // Eventos de negócio
      socket.on('novo_ticket', (ticket: Ticket) => {
        if (DEBUG) console.log('📨 Novo ticket recebido:', ticket);
        events.onNovoTicket?.(ticket);
      });

      socket.on('nova_mensagem', (mensagem: Mensagem) => {
        if (DEBUG) console.log('💬 Nova mensagem recebida:', mensagem);
        const mensagemNormalizada = normalizarMensagemPayload(mensagem);
        events.onNovaMensagem?.(mensagemNormalizada);
      });

      socket.on('ticket_atualizado', (ticket: Ticket) => {
        if (DEBUG) console.log('🔄 Ticket atualizado:', ticket);
        events.onTicketAtualizado?.(ticket);
      });

      socket.on('ticket_transferido', (data: any) => {
        if (DEBUG) console.log('🔀 Ticket transferido:', data);
        events.onTicketTransferido?.(data);
      });

      socket.on('ticket_encerrado', (ticket: Ticket) => {
        if (DEBUG) console.log('✅ Ticket encerrado:', ticket);
        events.onTicketEncerrado?.(ticket);
      });

      // Eventos de erro
      socket.on('error', (error: any) => {
        console.error('❌ Erro do WebSocket:', error);
        setError(error.message || 'Erro desconhecido');
      });

      socketRef.current = socket;

    } catch (err: any) {
      isConnecting = false; // 🚦 Liberar em caso de erro
      console.error('❌ Erro ao conectar WebSocket:', err);
      setError(err.message);
      setConnecting(false);
    }
  }, [enabled, events]);

  // Desconectar
  const disconnect = useCallback(() => {
    connectionCount = Math.max(0, connectionCount - 1);
    if (DEBUG) console.log(`📊 Componentes usando WebSocket: ${connectionCount}`);

    // 🔒 Só desconectar se nenhum componente estiver usando
    if (connectionCount === 0 && socketRef.current) {
      if (DEBUG) console.log('🔌 Desconectando WebSocket...');
      socketRef.current.disconnect();
      socketRef.current = null;
      globalSocket = null;
      isConnecting = false; // 🚦 Reset flag
      setConnected(false);
      setConnecting(false);
    } else {
      if (DEBUG) console.log('♻️ WebSocket mantido (ainda em uso por outros componentes)');
    }
  }, []);

  // Emitir evento
  const emit = useCallback((event: string, data: any) => {
    if (socketRef.current?.connected) {
      if (DEBUG) console.log('📤 Emitindo evento:', event, data);
      socketRef.current.emit(event, data);
    } else {
      console.warn('⚠️ WebSocket não conectado, não é possível emitir evento:', event);
    }
  }, []);

  // 🔥 NOVO: Entrar na sala de um ticket
  const entrarNoTicket = useCallback((ticketId: string) => {
    if (socketRef.current?.connected) {
      if (DEBUG) console.log('🚪 Entrando na sala do ticket:', ticketId);
      socketRef.current.emit('ticket:entrar', { ticketId });
    } else {
      console.warn('⚠️ WebSocket não conectado, não é possível entrar no ticket:', ticketId);
    }
  }, []);

  // 🔥 NOVO: Sair da sala de um ticket
  const sairDoTicket = useCallback((ticketId: string) => {
    if (socketRef.current?.connected) {
      if (DEBUG) console.log('🚪 Saindo da sala do ticket:', ticketId);
      socketRef.current.emit('ticket:sair', { ticketId });
    } else {
      console.warn('⚠️ WebSocket não conectado, não é possível sair do ticket:', ticketId);
    }
  }, []);

  // Auto-conectar na montagem
  useEffect(() => {
    // Evitar reconexões desnecessárias
    if (autoConnect && enabled && !socketRef.current?.connected) {
      connect();
    }

    // Desconectar na desmontagem (apenas se realmente conectado)
    return () => {
      // Em dev mode (React Strict Mode), não desconectar imediatamente
      // para evitar reconexões causadas pelo double render
      const isDev = process.env.NODE_ENV === 'development';

      if (socketRef.current?.connected && !isDev) {
        disconnect();
      }
    };
    // ⚠️ IMPORTANTE: Não incluir 'connect' e 'disconnect' nas dependências
    // para evitar loop infinito de reconexões
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoConnect, enabled]);

  return {
    connected,
    connecting,
    error,
    connect,
    disconnect,
    emit,
    entrarNoTicket, // 🔥 NOVA
    sairDoTicket, // 🔥 NOVA
  };
};
