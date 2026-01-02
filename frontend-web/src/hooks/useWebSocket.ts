import { useEffect, useState, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

interface UseWebSocketOptions {
  url: string;
  token: string | null;
  autoConnect?: boolean;
  onConnect?: () => void;
  onDisconnect?: (reason: string) => void;
  onError?: (error: Error) => void;
}

interface WebSocketState {
  connected: boolean;
  connecting: boolean;
  error: Error | null;
}

export function useWebSocket(options: UseWebSocketOptions) {
  const { url, token, autoConnect = true, onConnect, onDisconnect, onError } = options;

  const [state, setState] = useState<WebSocketState>({
    connected: false,
    connecting: false,
    error: null,
  });

  const socketRef = useRef<Socket | null>(null);
  const eventHandlers = useRef<Map<string, Set<Function>>>(new Map());

  // Conectar ao WebSocket
  const connect = useCallback(() => {
    if (socketRef.current?.connected) {
      console.warn('[WebSocket] Já está conectado');
      return;
    }

    if (!token) {
      console.error('[WebSocket] Token não fornecido');
      setState({ connected: false, connecting: false, error: new Error('Token não fornecido') });
      return;
    }

    console.log('[WebSocket] Conectando...', url);
    setState({ connected: false, connecting: true, error: null });

    const socket = io(url, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    socket.on('connect', () => {
      console.log('[WebSocket] Conectado!', socket.id);
      setState({ connected: true, connecting: false, error: null });
      onConnect?.();
    });

    socket.on('disconnect', (reason) => {
      console.log('[WebSocket] Desconectado:', reason);
      setState({ connected: false, connecting: false, error: null });
      onDisconnect?.(reason);
    });

    socket.on('connect_error', (error) => {
      console.error('[WebSocket] Erro de conexão:', error.message);
      setState({ connected: false, connecting: false, error });
      onError?.(error);
    });

    socket.on('reconnecting', (attemptNumber) => {
      console.log('[WebSocket] Tentando reconectar...', attemptNumber);
      setState({ connected: false, connecting: true, error: null });
    });

    socket.on('reconnect', (attemptNumber) => {
      console.log('[WebSocket] Reconectado após', attemptNumber, 'tentativas');
      setState({ connected: true, connecting: false, error: null });
    });

    socket.on('reconnect_failed', () => {
      console.error('[WebSocket] Falha ao reconectar');
      setState({
        connected: false,
        connecting: false,
        error: new Error('Falha ao reconectar'),
      });
    });

    socketRef.current = socket;
  }, [url, token, onConnect, onDisconnect, onError]);

  // Desconectar
  const disconnect = useCallback(() => {
    if (socketRef.current) {
      try {
        // ✅ Verificar se socket está realmente conectado antes de desconectar
        if (socketRef.current.connected || socketRef.current.active) {
          console.log('[WebSocket] Desconectando...');
          socketRef.current.disconnect();
        } else {
          console.log('[WebSocket] Já estava desconectado');
        }
      } catch (err) {
        // ✅ Ignorar erros de desconexão (socket já pode estar fechado)
        console.log('[WebSocket] Erro ao desconectar (esperado em desenvolvimento):', err);
      } finally {
        socketRef.current = null;
        setState({ connected: false, connecting: false, error: null });
      }
    }
  }, []);

  // Emitir evento
  const emit = useCallback((event: string, data?: any) => {
    if (!socketRef.current?.connected) {
      console.warn('[WebSocket] Não conectado. Evento não enviado:', event);
      return false;
    }

    socketRef.current.emit(event, data);
    return true;
  }, []);

  // Registrar listener de evento
  const on = useCallback((event: string, handler: Function) => {
    if (!socketRef.current) {
      console.warn('[WebSocket] Socket não inicializado');
      return () => { };
    }

    // Guardar referência do handler
    if (!eventHandlers.current.has(event)) {
      eventHandlers.current.set(event, new Set());
    }
    eventHandlers.current.get(event)!.add(handler);

    // Registrar no socket
    socketRef.current.on(event as any, handler as any);

    // Retornar função de cleanup
    return () => {
      if (socketRef.current) {
        socketRef.current.off(event as any, handler as any);
      }
      eventHandlers.current.get(event)?.delete(handler);
    };
  }, []);

  // Remover listener de evento
  const off = useCallback((event: string, handler?: Function) => {
    if (socketRef.current) {
      if (handler) {
        socketRef.current.off(event as any, handler as any);
        eventHandlers.current.get(event)?.delete(handler);
      } else {
        socketRef.current.off(event as any);
        eventHandlers.current.delete(event);
      }
    }
  }, []);

  // Auto-conectar quando token estiver disponível
  useEffect(() => {
    // ✅ Evitar múltiplas conexões em React StrictMode
    if (autoConnect && token && !socketRef.current) {
      connect();
    }

    return () => {
      disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoConnect, token]); // Não incluir connect/disconnect nas dependências para evitar reconexões

  return {
    ...state,
    socket: socketRef.current,
    connect,
    disconnect,
    emit,
    on,
    off,
  };
}
