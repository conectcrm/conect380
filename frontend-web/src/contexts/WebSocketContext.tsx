/**
 * 🔌 WebSocketContext - Contexto Global para Gerenciamento de WebSocket
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

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
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
      '⚠️ [WebSocketContext] Ignorando URL de WebSocket local em acesso via rede:',
      envUrl,
      '→ host atual',
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

// 🔒 SINGLETON: Garantir apenas 1 instância WebSocket
let globalSocket: Socket | null = null;

export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({ children }) => {
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated } = useAuth();

  const connect = () => {
    // Se já está conectado, não fazer nada
    if (globalSocket?.connected) {
      if (DEBUG) console.log('♻️ [WebSocketContext] WebSocket já conectado');
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
        console.warn('⚠️ [WebSocketContext] Token não encontrado - aguardando login');
        setConnecting(false);
        return;
      }

      if (DEBUG) console.log('🔌 [WebSocketContext] Conectando ao WebSocket:', WEBSOCKET_URL);

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
        if (DEBUG) console.log('✅ [WebSocketContext] WebSocket conectado! ID:', socket.id);
        setConnected(true);
        setConnecting(false);
        setError(null);
      });

      // Event: disconnect
      socket.on('disconnect', (reason) => {
        if (DEBUG) console.log('🔴 [WebSocketContext] WebSocket desconectado. Razão:', reason);
        setConnected(false);
        setConnecting(false);

        if (reason === 'io server disconnect') {
          // Servidor forçou desconexão, reconectar
          setTimeout(() => socket.connect(), 1000);
        }
      });

      // Event: connect_error
      socket.on('connect_error', (err) => {
        console.error('❌ [WebSocketContext] Erro de conexão:', err.message);
        setError(err.message);
        setConnected(false);
        setConnecting(false);
      });

      // Event: error
      socket.on('error', (err) => {
        console.error('❌ [WebSocketContext] Erro:', err);
        setError(typeof err === 'string' ? err : 'Erro desconhecido');
      });

      // Event: reconnect_attempt
      socket.io.on('reconnect_attempt', (attempt) => {
        if (DEBUG) console.log(`🔄 [WebSocketContext] Tentativa de reconexão #${attempt}`);
        setConnecting(true);
        setError(null);
      });

      // Event: reconnect_failed
      socket.io.on('reconnect_failed', () => {
        console.error('❌ [WebSocketContext] Falha ao reconectar após múltiplas tentativas');
        setError('Falha ao conectar. Verifique sua conexão.');
        setConnecting(false);
      });

      globalSocket = socket;
    } catch (err) {
      console.error('❌ [WebSocketContext] Erro ao criar socket:', err);
      setError('Erro ao criar conexão');
      setConnecting(false);
    }
  };

  const reconnect = () => {
    if (DEBUG) console.log('🔄 [WebSocketContext] Reconectando manualmente...');

    if (globalSocket) {
      globalSocket.disconnect();
      globalSocket = null;
    }

    setConnected(false);
    setConnecting(false);
    setError(null);

    // Aguardar 500ms antes de reconectar
    setTimeout(() => connect(), 500);
  };

  useEffect(() => {
    if (isAuthenticated) {
      connect();
    } else if (globalSocket) {
      if (DEBUG) console.log('🔌 [WebSocketContext] Finalizando conexão por logout');
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
        console.log('🔄 [WebSocketContext] Contexto alterado, forçando reconexão do socket');
      }
      reconnect();
    };

    window.addEventListener(AUTH_TOKEN_EVENT_NAME, handleRealtimeContextChange);
    window.addEventListener(EMPRESA_EVENT_NAME, handleRealtimeContextChange);

    return () => {
      window.removeEventListener(AUTH_TOKEN_EVENT_NAME, handleRealtimeContextChange);
      window.removeEventListener(EMPRESA_EVENT_NAME, handleRealtimeContextChange);
    };
  }, [isAuthenticated]);

  // Cleanup ao desmontar
  useEffect(
    () => () => {
      // ✅ Delay pequeno para evitar desconexão prematura no StrictMode
      setTimeout(() => {
        if (globalSocket) {
          try {
            if (DEBUG) console.log('🔌 [WebSocketContext] Desconectando WebSocket');
            // ✅ Verificar se está conectado antes de desconectar
            if (globalSocket.connected || globalSocket.active) {
              globalSocket.disconnect();
            }
          } catch (err) {
            // ✅ Ignorar erros no cleanup (esperado em React StrictMode)
            // Não logar - erro esperado no desenvolvimento
          } finally {
            globalSocket = null;
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
