/**
 * ðŸ”Œ WebSocketContext - Contexto Global para Gerenciamento de WebSocket
 *
 * Funcionalidades:
 * - ConexÃ£o WebSocket Ãºnica em toda aplicaÃ§Ã£o (Singleton)
 * - Estado global de conexÃ£o (connected, error)
 * - ReconexÃ£o automÃ¡tica
 * - Eventos globais para toda aplicaÃ§Ã£o
 *
 * Uso:
 * - Wrap App.tsx com <WebSocketProvider>
 * - Use hook useWebSocketStatus() em qualquer componente
 */

import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { resolveSocketBaseUrl } from '../utils/network';

interface WebSocketContextData {
  connected: boolean;
  connecting: boolean;
  error: string | null;
  reconnect: () => void;
}

const WebSocketContext = createContext<WebSocketContextData>({
  connected: false,
  connecting: false,
  error: null,
  reconnect: () => { },
});

interface WebSocketProviderProps {
  children: ReactNode;
}

const SOCKET_BASE_URL = resolveSocketBaseUrl({
  envUrl: process.env.REACT_APP_WEBSOCKET_URL || process.env.REACT_APP_WS_URL,
  onEnvIgnored: ({ envUrl, currentHost }) => {
    console.warn(
      'âš ï¸ [WebSocketContext] Ignorando URL de WebSocket local em acesso via rede:',
      envUrl,
      'â†’ host atual',
      currentHost,
    );
  },
});

const WEBSOCKET_URL = SOCKET_BASE_URL.endsWith('/')
  ? `${SOCKET_BASE_URL}atendimento`
  : `${SOCKET_BASE_URL}/atendimento`;
const TOKEN_STORAGE_KEY = 'authToken';
const AUTH_TOKEN_EVENT_NAME = 'authTokenChanged';
const EMPRESA_EVENT_NAME = 'empresaAtivaChanged';
const DEBUG = process.env.REACT_APP_DEBUG_WS === 'true';

// ðŸ”’ SINGLETON: Garantir apenas 1 instÃ¢ncia WebSocket
let globalSocket: Socket | null = null;

export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({ children }) => {
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated } = useAuth();
  const connectingRef = useRef(false);
  const reconnectTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    connectingRef.current = connecting;
  }, [connecting]);

  const connect = () => {
    // Se jÃ¡ estÃ¡ conectado, nÃ£o fazer nada
    if (globalSocket?.connected) {
      if (DEBUG) console.log('â™»ï¸ [WebSocketContext] WebSocket jÃ¡ conectado');
      return;
    }

    // Se jÃ¡ estÃ¡ conectando, nÃ£o fazer nada
    if (connecting) {
      if (DEBUG) console.log('â³ [WebSocketContext] ConexÃ£o jÃ¡ em progresso');
      return;
    }

    setConnecting(true);
    setError(null);

    try {
      const token = localStorage.getItem(TOKEN_STORAGE_KEY);

      if (!token) {
        console.warn('âš ï¸ [WebSocketContext] Token nÃ£o encontrado - aguardando login');
        setConnecting(false);
        return;
      }

      if (DEBUG) console.log('ðŸ”Œ [WebSocketContext] Conectando ao WebSocket:', WEBSOCKET_URL);

      const socket = io(WEBSOCKET_URL, {
        auth: { token },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 2000,
        reconnectionDelayMax: 10000,
        timeout: 10000,
      });

      // Event: connect
      socket.on('connect', () => {
        if (DEBUG) console.log('âœ… [WebSocketContext] WebSocket conectado! ID:', socket.id);
        setConnected(true);
        setConnecting(false);
        setError(null);
      });

      // Event: disconnect
      socket.on('disconnect', (reason) => {
        if (DEBUG) console.log('ðŸ”´ [WebSocketContext] WebSocket desconectado. RazÃ£o:', reason);
        setConnected(false);
        setConnecting(false);

        if (reason === 'io server disconnect') {
          // Servidor forÃ§ou desconexÃ£o, reconectar
          setTimeout(() => socket.connect(), 1000);
        }
      });

      // Event: connect_error
      socket.on('connect_error', (err) => {
        console.error('âŒ [WebSocketContext] Erro de conexÃ£o:', err.message);
        setError(err.message);
        setConnected(false);
        setConnecting(false);
      });

      // Event: error
      socket.on('error', (err) => {
        console.error('âŒ [WebSocketContext] Erro:', err);
        setError(typeof err === 'string' ? err : 'Erro desconhecido');
      });

      // Event: reconnect_attempt
      socket.io.on('reconnect_attempt', (attempt) => {
        if (DEBUG) console.log(`ðŸ”„ [WebSocketContext] Tentativa de reconexÃ£o #${attempt}`);
        setConnecting(true);
        setError(null);
      });

      // Event: reconnect_failed
      socket.io.on('reconnect_failed', () => {
        console.error('âŒ [WebSocketContext] Falha ao reconectar apÃ³s mÃºltiplas tentativas');
        setError('Falha ao conectar. Verifique sua conexÃ£o.');
        setConnecting(false);
      });

      globalSocket = socket;
    } catch (err) {
      console.error('âŒ [WebSocketContext] Erro ao criar socket:', err);
      setError('Erro ao criar conexÃ£o');
      setConnecting(false);
    }
  };

  const reconnect = () => {
    if (connectingRef.current) {
      if (DEBUG) {
        console.log('[WebSocketContext] Reconexao adiada (handshake em progresso)');
      }
      if (reconnectTimeoutRef.current) {
        window.clearTimeout(reconnectTimeoutRef.current);
      }
      reconnectTimeoutRef.current = window.setTimeout(() => {
        reconnectTimeoutRef.current = null;
        reconnect();
      }, 700);
      return;
    }

    if (DEBUG) console.log('ðŸ”„ [WebSocketContext] Reconectando manualmente...');

    if (globalSocket) {
      globalSocket.disconnect();
      globalSocket = null;
    }

    setConnected(false);
    setConnecting(false);
    setError(null);

    // Aguardar 500ms antes de reconectar
    window.setTimeout(() => connect(), 500);
  };

  useEffect(() => {
    if (isAuthenticated) {
      connect();
    } else if (globalSocket) {
      if (DEBUG) console.log('ðŸ”Œ [WebSocketContext] Finalizando conexÃ£o por logout');
      globalSocket.disconnect();
      globalSocket = null;
      setConnected(false);
      setConnecting(false);
      setError(null);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated || typeof window === 'undefined') {
      return;
    }

    const handleRealtimeContextChange = () => {
      if (DEBUG) {
        console.log('ðŸ”„ [WebSocketContext] Contexto alterado, forÃ§ando reconexÃ£o do socket');
      }
      reconnect();
    };

    window.addEventListener(AUTH_TOKEN_EVENT_NAME, handleRealtimeContextChange);
    window.addEventListener(EMPRESA_EVENT_NAME, handleRealtimeContextChange);

    return () => {
      window.removeEventListener(AUTH_TOKEN_EVENT_NAME, handleRealtimeContextChange);
      window.removeEventListener(EMPRESA_EVENT_NAME, handleRealtimeContextChange);
      if (reconnectTimeoutRef.current) {
        window.clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    };
  }, [isAuthenticated]);

  // Cleanup ao desmontar
  useEffect(
    () => () => {
      // âœ… Delay pequeno para evitar desconexÃ£o prematura no StrictMode
      setTimeout(() => {
        if (globalSocket) {
          try {
            if (DEBUG) console.log('ðŸ”Œ [WebSocketContext] Desconectando WebSocket');
            // âœ… Verificar se estÃ¡ conectado antes de desconectar
            if (globalSocket.connected || globalSocket.active) {
              globalSocket.disconnect();
            }
          } catch (err) {
            // âœ… Ignorar erros no cleanup (esperado em React StrictMode)
            // NÃ£o logar - erro esperado no desenvolvimento
          } finally {
            globalSocket = null;
            if (reconnectTimeoutRef.current) {
              window.clearTimeout(reconnectTimeoutRef.current);
              reconnectTimeoutRef.current = null;
            }
          }
        }
      }, 100);
    },
    [],
  );

  const value: WebSocketContextData = {
    connected,
    connecting,
    error,
    reconnect,
  };

  return <WebSocketContext.Provider value={value}>{children}</WebSocketContext.Provider>;
};

/**
 * Hook para acessar status do WebSocket
 * Use em qualquer componente que precise saber se estÃ¡ conectado
 */
export const useWebSocketStatus = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocketStatus deve ser usado dentro de um WebSocketProvider');
  }
  return context;
};


