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
import { useAtendimentoStore } from '../../../../stores/atendimentoStore';
import { resolveSocketBaseUrl } from '../../../../utils/network';
import { apiPublic } from '../../../../services/api';

interface WebSocketEvents {
  onNovoTicket?: (ticket: Ticket) => void;
  onNovaMensagem?: (mensagem: Mensagem) => void;
  onTicketAtualizado?: (ticket: Ticket) => void;
  onTicketTransferido?: (data: {
    ticket: Ticket;
    antigoAtendente?: string;
    novoAtendente?: string;
  }) => void;
  onTicketEncerrado?: (ticket: Ticket) => void;
  onUsuarioDigitando?: (data: { ticketId: string; usuarioId: string; usuarioNome: string }) => void; // 🆕 NOVO
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
  entrarNoTicket: (ticketId: string) => void;
  sairDoTicket: (ticketId: string) => void;
  emitirDigitando: (ticketId: string) => void; // 🆕 NOVO
}

const SOCKET_BASE_URL = resolveSocketBaseUrl({
  envUrl: process.env.REACT_APP_WEBSOCKET_URL || process.env.REACT_APP_WS_URL,
  onEnvIgnored: ({ envUrl, currentHost }) => {
    console.warn(
      '⚠️ [Omnichannel] Ignorando URL de WebSocket local em acesso via rede:',
      envUrl,
      '→ host atual',
      currentHost,
    );
  },
});

const WEBSOCKET_URL = SOCKET_BASE_URL.endsWith('/')
  ? `${SOCKET_BASE_URL}atendimento`
  : `${SOCKET_BASE_URL}/atendimento`;
const DEBUG = false; // 🔍 DEBUG ATIVADO para diagnosticar indicador de digitação
const AUTH_TOKEN_EVENT_NAME = 'authTokenChanged';

const parseJwtExpMs = (token: string | null): number | null => {
  if (!token) return null;

  try {
    const payloadBase64 = token.split('.')[1];
    if (!payloadBase64) return null;
    const normalized = payloadBase64.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);
    const payload = JSON.parse(atob(padded));
    if (!payload?.exp || typeof payload.exp !== 'number') return null;
    return payload.exp * 1000;
  } catch {
    return null;
  }
};

const tokenExpirado = (token: string | null, margemSegundos = 5): boolean => {
  const expMs = parseJwtExpMs(token);
  if (!expMs) return false;
  return Date.now() + margemSegundos * 1000 >= expMs;
};

// 🔒 SINGLETON: Garantir apenas 1 instância WebSocket em toda aplicação
let globalSocket: Socket | null = null;
let connectionCount = 0;
let isConnecting = false; // 🚦 Flag para prevenir múltiplas conexões simultâneas

export const useWebSocket = (options: UseWebSocketOptions = {}): UseWebSocketReturn => {
  const { enabled = true, autoConnect = true, events = {} } = options;

  const socketRef = useRef<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 🏪 Actions da Store Zustand
  const adicionarMensagemStore = useAtendimentoStore((state) => state.adicionarMensagem);
  const atualizarTicketStore = useAtendimentoStore((state) => state.atualizarTicket);
  const adicionarTicketStore = useAtendimentoStore((state) => state.adicionarTicket);

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

      // ✅ Obter token ATUALIZADO do localStorage (pode ter sido renovado pelo interceptor)
      const token = localStorage.getItem('authToken');
      if (!token) {
        isConnecting = false;
        throw new Error('Token de autenticação não encontrado');
      }

      if (DEBUG) console.log('🔌 Conectando ao WebSocket:', WEBSOCKET_URL);
      if (DEBUG) console.log('🔑 Token (primeiros 20 chars):', token.substring(0, 20) + '...');

      // Criar conexão (apenas se não existir)
      const socket = io(WEBSOCKET_URL, {
        auth: {
          token,
        },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
      });
      let authExpiradaNotificada = false;
      let refreshEmAndamento = false;

      const renovarTokenEReconectar = async () => {
        if (refreshEmAndamento) return;
        refreshEmAndamento = true;

        try {
          const refreshToken = localStorage.getItem('refreshToken');
          if (!refreshToken) throw new Error('Refresh token ausente');

          const refreshResponse = await apiPublic.post('/auth/refresh', { refreshToken });
          const success = refreshResponse.data?.success === true;
          const newToken = refreshResponse.data?.data?.access_token;
          const newRefreshToken = refreshResponse.data?.data?.refresh_token;

          if (!success || !newToken || !newRefreshToken) {
            throw new Error('Resposta invalida do refresh');
          }

          localStorage.setItem('authToken', newToken);
          localStorage.setItem('refreshToken', newRefreshToken);
          window.dispatchEvent(new CustomEvent(AUTH_TOKEN_EVENT_NAME));

          authExpiradaNotificada = false;
          socket.auth = { token: newToken } as any;

          if (!socket.connected) {
            socket.connect();
          }
        } catch (refreshError) {
          console.error('❌ Falha ao renovar token do WebSocket:', refreshError);
          setError('Sessao expirada. Faca login novamente.');
          socket.io.opts.reconnection = false;
          socket.disconnect();
        } finally {
          refreshEmAndamento = false;
        }
      };

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
          const tokenAtual = localStorage.getItem('authToken');
          if (authExpiradaNotificada || tokenExpirado(tokenAtual)) {
            void renovarTokenEReconectar();
            return;
          }

          // Reconectar se servidor desconectou por outro motivo
          socket.connect();
        }
      });

      socket.on('connect_error', (err) => {
        isConnecting = false; // 🚦 Liberar em caso de erro
        console.error('❌ Erro de conexão WebSocket:', err.message);

        // 🔄 Se erro for de autenticação (token expirado), tentar obter novo token e reconectar
        if (err.message.includes('jwt expired') || err.message.includes('TokenExpiredError')) {
          authExpiradaNotificada = true;
          void renovarTokenEReconectar();
        } else {
          setError(err.message);
        }

        setConnecting(false);
      });

      // 🧹 REMOVER listeners antigos antes de adicionar novos (evitar duplicação)
      socket.off('novo_ticket');
      socket.off('nova_mensagem');
      socket.off('ticket_atualizado');
      socket.off('ticket_transferido');
      socket.off('ticket_encerrado');
      socket.off('mensagem:digitando');
      socket.off('auth:token-expired');
      socket.off('auth:token-invalid');

      // Eventos de negócio
      socket.on('novo_ticket', (ticket: Ticket) => {
        if (DEBUG) console.log('📨 Novo ticket recebido:', ticket);

        // 🏪 Atualizar store diretamente
        adicionarTicketStore(ticket);

        // 🔔 Callback opcional para notificações/UI
        events.onNovoTicket?.(ticket);
      });

      socket.on('nova_mensagem', (mensagem: Mensagem) => {
        if (DEBUG) console.log('💬 Nova mensagem recebida:', mensagem);
        const mensagemNormalizada = normalizarMensagemPayload(mensagem);

        // 🔔 Callback para componente processar (evitar duplicação no store)
        // O callback (ChatOmnichannel) chamará adicionarMensagemRecebida que já adiciona ao store
        events.onNovaMensagem?.(mensagemNormalizada);
      });

      socket.on('ticket_atualizado', (ticket: Ticket) => {
        if (DEBUG) console.log('🔄 Ticket atualizado:', ticket);

        // 🏪 Atualizar store diretamente
        if (ticket.id) {
          atualizarTicketStore(ticket.id, ticket);
        }

        // 🔔 Callback opcional para notificações/UI
        events.onTicketAtualizado?.(ticket);
      });

      socket.on('ticket_transferido', (data: any) => {
        if (DEBUG) console.log('🔀 Ticket transferido:', data);

        // 🏪 Atualizar store diretamente
        if (data.ticket?.id) {
          atualizarTicketStore(data.ticket.id, data.ticket);
        }

        // 🔔 Callback opcional para notificações/UI
        events.onTicketTransferido?.(data);
      });

      socket.on('ticket_encerrado', (ticket: Ticket) => {
        if (DEBUG) console.log('✅ Ticket encerrado:', ticket);

        // 🏪 Atualizar store diretamente
        if (ticket.id) {
          atualizarTicketStore(ticket.id, { ...ticket, status: 'encerrado' });
        }

        // 🔔 Callback opcional para notificações/UI
        events.onTicketEncerrado?.(ticket);
      });

      // 🆕 NOVO: Evento de usuário digitando
      socket.on('mensagem:digitando', (data: any) => {
        if (events.onUsuarioDigitando) {
          events.onUsuarioDigitando(data);
        }
      });

      socket.on('auth:token-expired', () => {
        authExpiradaNotificada = true;
        void renovarTokenEReconectar();
      });

      socket.on('auth:token-invalid', () => {
        setError('Token invalido para o WebSocket. Faca login novamente.');
        socket.io.opts.reconnection = false;
        socket.disconnect();
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
      try {
        // ✅ Verificar se socket está realmente conectado antes de desconectar
        if (socketRef.current.connected || socketRef.current.active) {
          if (DEBUG) console.log('🔌 Desconectando WebSocket...');
          socketRef.current.disconnect();
        } else {
          if (DEBUG) console.log('🔌 WebSocket já estava desconectado');
        }
      } catch (err) {
        // ✅ Ignorar erros de desconexão (socket já pode estar fechado)
        if (DEBUG) console.log('⚠️ Erro ao desconectar (esperado em desenvolvimento):', err);
      } finally {
        socketRef.current = null;
        globalSocket = null;
        isConnecting = false; // 🚦 Reset flag
        setConnected(false);
        setConnecting(false);
      }
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
      socketRef.current.emit('ticket:entrar', { ticketId });
    } else {
      console.warn('⚠️ [HOOK] WebSocket não conectado, não é possível entrar no ticket:', ticketId);
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

  // 🆕 NOVO: Emitir evento de digitação
  const emitirDigitando = useCallback((ticketId: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('mensagem:digitando', { ticketId });
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
    entrarNoTicket,
    sairDoTicket,
    emitirDigitando, // 🆕 NOVO
  };
};
