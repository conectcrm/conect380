/**
 * xR WebSocketContext - Contexto Global para Gerenciamento de WebSocket
 *
 * Funcionalidades:
 * - Conexão WebSocket única em toda aplicação (Singleton)
 * - Estado global de conexão (connected, error)
 * - Reconexão automática
 * - Eventos globais para toda aplicação
 *
 * Uso:
 * - Wrap App.tsx com <WebSocketProvider>
 * - Use hook useWebSocketStatus() em qualquer componente
 */

import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { resolveSocketBaseUrl } from '../utils/network';
import { apiPublic } from '../services/api';

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
      'a️ [WebSocketContext] Ignorando URL de WebSocket local em acesso via rede:',
      envUrl,
      '  host atual',
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

// x SINGLETON: Garantir apenas 1 instância WebSocket
let globalSocket: Socket | null = null;
let providerInstanceCount = 0;
let globalCleanupTimer: number | null = null;

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
    if (globalCleanupTimer) {
      window.clearTimeout(globalCleanupTimer);
      globalCleanupTimer = null;
    }

    // Se já está conectado, não fazer nada
    if (globalSocket?.connected) {
      if (DEBUG) console.log('"️ [WebSocketContext] WebSocket já conectado');
      return;
    }

    // Se já está conectando, não fazer nada
    if (connecting) {
      if (DEBUG) console.log('⏳ [WebSocketContext] Conexão já em progresso');
      return;
    }

    setConnecting(true);
    setError(null);

    try {
      const token = localStorage.getItem(TOKEN_STORAGE_KEY);

      if (!token) {
        console.warn('a️ [WebSocketContext] Token não encontrado - aguardando login');
        setConnecting(false);
        return;
      }

      if (DEBUG) console.log('xR [WebSocketContext] Conectando ao WebSocket:', WEBSOCKET_URL);

      const socket = io(WEBSOCKET_URL, {
        auth: { token },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 2000,
        reconnectionDelayMax: 10000,
        timeout: 10000,
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
          console.error('❌ [WebSocketContext] Falha ao renovar token do WebSocket:', refreshError);
          setError('Sessao expirada. Faca login novamente.');
          socket.io.opts.reconnection = false;
          socket.disconnect();
        } finally {
          refreshEmAndamento = false;
        }
      };

      // Event: connect
      socket.on('connect', () => {
        if (DEBUG) console.log('S& [WebSocketContext] WebSocket conectado! ID:', socket.id);
        setConnected(true);
        setConnecting(false);
        setError(null);
      });

      // Event: disconnect
      socket.on('disconnect', (reason) => {
        if (DEBUG) console.log('x [WebSocketContext] WebSocket desconectado. Razão:', reason);
        setConnected(false);
        setConnecting(false);

        if (reason === 'io server disconnect') {
          const tokenAtual = localStorage.getItem(TOKEN_STORAGE_KEY);
          if (authExpiradaNotificada || tokenExpirado(tokenAtual)) {
            void renovarTokenEReconectar();
            return;
          }

          // Servidor forçou desconexão, reconectar
          setTimeout(() => socket.connect(), 1000);
        }
      });

      // Event: connect_error
      socket.on('connect_error', (err) => {
        console.error('R [WebSocketContext] Erro de conexão:', err.message);
        if (err.message.includes('jwt expired') || err.message.includes('TokenExpiredError')) {
          authExpiradaNotificada = true;
          void renovarTokenEReconectar();
        } else {
          setError(err.message);
        }
        setConnected(false);
        setConnecting(false);
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

      // Event: error
      socket.on('error', (err) => {
        console.error('R [WebSocketContext] Erro:', err);
        setError(typeof err === 'string' ? err : 'Erro desconhecido');
      });

      // Event: reconnect_attempt
      socket.io.on('reconnect_attempt', (attempt) => {
        if (DEBUG) console.log(`x [WebSocketContext] Tentativa de reconexão #${attempt}`);
        setConnecting(true);
        setError(null);
      });

      // Event: reconnect_failed
      socket.io.on('reconnect_failed', () => {
        console.error('R [WebSocketContext] Falha ao reconectar após múltiplas tentativas');
        setError('Falha ao conectar. Verifique sua conexão.');
        setConnecting(false);
      });

      globalSocket = socket;
    } catch (err) {
      console.error('R [WebSocketContext] Erro ao criar socket:', err);
      setError('Erro ao criar conexão');
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

    if (DEBUG) console.log('x [WebSocketContext] Reconectando manualmente...');

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
      if (DEBUG) console.log('xR [WebSocketContext] Finalizando conexão por logout');
      globalSocket.disconnect();
      globalSocket = null;
      setConnected(false);
      setConnecting(false);
      setError(null);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    providerInstanceCount += 1;
    if (globalCleanupTimer) {
      window.clearTimeout(globalCleanupTimer);
      globalCleanupTimer = null;
    }

    return () => {
      providerInstanceCount = Math.max(0, providerInstanceCount - 1);
    };
  }, []);

  useEffect(() => {
    if (!isAuthenticated || typeof window === 'undefined') {
      return;
    }

    const handleRealtimeContextChange = () => {
      if (DEBUG) {
        console.log('x [WebSocketContext] Contexto alterado, forçando reconexão do socket');
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
      // S& Delay pequeno para evitar desconexão prematura no StrictMode
      if (globalCleanupTimer) {
        window.clearTimeout(globalCleanupTimer);
      }
      globalCleanupTimer = window.setTimeout(() => {
        if (providerInstanceCount > 0) {
          globalCleanupTimer = null;
          return;
        }
        if (globalSocket) {
          try {
            if (DEBUG) console.log('xR [WebSocketContext] Desconectando WebSocket');
            // S& Verificar se está conectado antes de desconectar
            if (globalSocket.connected) {
              globalSocket.disconnect();
            }
          } catch (err) {
            // S& Ignorar erros no cleanup (esperado em React StrictMode)
            // Não logar - erro esperado no desenvolvimento
          } finally {
            globalSocket = null;
            if (reconnectTimeoutRef.current) {
              window.clearTimeout(reconnectTimeoutRef.current);
              reconnectTimeoutRef.current = null;
            }
            globalCleanupTimer = null;
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
 * Use em qualquer componente que precise saber se está conectado
 */
export const useWebSocketStatus = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocketStatus deve ser usado dentro de um WebSocketProvider');
  }
  return context;
};
