/**
 * 🔌 Socket Context - WebSocket para comunicação em tempo real
 * 
 * Funcionalidades:
 * - Conexão persistente com Socket.IO
 * - Eventos de mensagens novas
 * - Eventos de atualização de tickets
 * - Typing indicators
 * - Notificações de status
 * - Reconexão automática
 */

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { Mensagem, Ticket } from '../types';

// ===== TIPOS =====

interface SocketContextData {
  connected: boolean;
  socket: Socket | null;

  // Eventos de escuta
  onNovaMensagem: (callback: (mensagem: Mensagem) => void) => void;
  onTicketAtualizado: (callback: (ticket: Ticket) => void) => void;
  onUsuarioDigitando: (callback: (data: { ticketId: string; nomeUsuario: string }) => void) => void;
  onStatusMensagem: (callback: (data: { mensagemId: string; status: string }) => void) => void;

  // Ações
  enviarDigitando: (ticketId: string) => void;
  entrarSalaTicket: (ticketId: string) => void;
  sairSalaTicket: (ticketId: string) => void;
}

// ===== CONTEXTO =====

const SocketContext = createContext<SocketContextData>({} as SocketContextData);

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket deve ser usado dentro de SocketProvider');
  }
  return context;
};

// ===== PROVIDER =====

interface SocketProviderProps {
  children: React.ReactNode;
}

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const callbacksRef = useRef<{
    novaMensagem: Array<(mensagem: Mensagem) => void>;
    ticketAtualizado: Array<(ticket: Ticket) => void>;
    usuarioDigitando: Array<(data: { ticketId: string; nomeUsuario: string }) => void>;
    statusMensagem: Array<(data: { mensagemId: string; status: string }) => void>;
  }>({
    novaMensagem: [],
    ticketAtualizado: [],
    usuarioDigitando: [],
    statusMensagem: []
  });

  // ===== INICIALIZAR SOCKET =====
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      console.warn('⚠️ Socket não conectado: token não encontrado');
      return;
    }

    const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

    console.log('🔌 Conectando ao WebSocket...', API_URL);

    const socketInstance = io(API_URL, {
      auth: { token },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
      transports: ['websocket', 'polling']
    });

    // ===== EVENTOS DE CONEXÃO =====

    socketInstance.on('connect', () => {
      console.log('✅ Socket conectado:', socketInstance.id);
      setConnected(true);
    });

    socketInstance.on('disconnect', (reason) => {
      console.log('❌ Socket desconectado:', reason);
      setConnected(false);
    });

    socketInstance.on('connect_error', (error) => {
      console.error('❌ Erro de conexão do socket:', error);
      setConnected(false);
    });

    socketInstance.on('reconnect', (attemptNumber) => {
      console.log('🔄 Socket reconectado (tentativa', attemptNumber, ')');
      setConnected(true);
    });

    socketInstance.on('reconnect_attempt', (attemptNumber) => {
      console.log('🔄 Tentando reconectar...', attemptNumber);
    });

    socketInstance.on('reconnect_error', (error) => {
      console.error('❌ Erro ao reconectar:', error);
    });

    socketInstance.on('reconnect_failed', () => {
      console.error('❌ Falha ao reconectar após múltiplas tentativas');
    });

    // ===== EVENTOS DE NEGÓCIO =====

    // Nova mensagem recebida
    socketInstance.on('nova-mensagem', (mensagem: Mensagem) => {
      console.log('📨 Nova mensagem recebida:', mensagem);
      callbacksRef.current.novaMensagem.forEach(cb => cb(mensagem));
    });

    // Ticket atualizado
    socketInstance.on('ticket-atualizado', (ticket: Ticket) => {
      console.log('🎫 Ticket atualizado:', ticket);
      callbacksRef.current.ticketAtualizado.forEach(cb => cb(ticket));
    });

    // Usuário digitando
    socketInstance.on('usuario-digitando', (data: { ticketId: string; nomeUsuario: string }) => {
      console.log('✍️ Usuário digitando:', data);
      callbacksRef.current.usuarioDigitando.forEach(cb => cb(data));
    });

    // Status de mensagem atualizado
    socketInstance.on('status-mensagem', (data: { mensagemId: string; status: string }) => {
      console.log('✔️ Status mensagem:', data);
      callbacksRef.current.statusMensagem.forEach(cb => cb(data));
    });

    setSocket(socketInstance);

    // Cleanup
    return () => {
      console.log('🔌 Desconectando socket...');
      socketInstance.disconnect();
    };
  }, []);

  // ===== REGISTRAR CALLBACKS =====

  const onNovaMensagem = useCallback((callback: (mensagem: Mensagem) => void) => {
    callbacksRef.current.novaMensagem.push(callback);

    // Retornar função de cleanup
    return () => {
      callbacksRef.current.novaMensagem = callbacksRef.current.novaMensagem.filter(
        cb => cb !== callback
      );
    };
  }, []);

  const onTicketAtualizado = useCallback((callback: (ticket: Ticket) => void) => {
    callbacksRef.current.ticketAtualizado.push(callback);

    return () => {
      callbacksRef.current.ticketAtualizado = callbacksRef.current.ticketAtualizado.filter(
        cb => cb !== callback
      );
    };
  }, []);

  const onUsuarioDigitando = useCallback((
    callback: (data: { ticketId: string; nomeUsuario: string }) => void
  ) => {
    callbacksRef.current.usuarioDigitando.push(callback);

    return () => {
      callbacksRef.current.usuarioDigitando = callbacksRef.current.usuarioDigitando.filter(
        cb => cb !== callback
      );
    };
  }, []);

  const onStatusMensagem = useCallback((
    callback: (data: { mensagemId: string; status: string }) => void
  ) => {
    callbacksRef.current.statusMensagem.push(callback);

    return () => {
      callbacksRef.current.statusMensagem = callbacksRef.current.statusMensagem.filter(
        cb => cb !== callback
      );
    };
  }, []);

  // ===== AÇÕES =====

  const enviarDigitando = useCallback((ticketId: string) => {
    if (socket && connected) {
      socket.emit('digitando', { ticketId });
    }
  }, [socket, connected]);

  const entrarSalaTicket = useCallback((ticketId: string) => {
    if (socket && connected) {
      console.log('📥 Entrando na sala do ticket:', ticketId);
      socket.emit('entrar-ticket', { ticketId });
    }
  }, [socket, connected]);

  const sairSalaTicket = useCallback((ticketId: string) => {
    if (socket && connected) {
      console.log('📤 Saindo da sala do ticket:', ticketId);
      socket.emit('sair-ticket', { ticketId });
    }
  }, [socket, connected]);

  // ===== CONTEXTO VALUE =====

  const value: SocketContextData = {
    connected,
    socket,
    onNovaMensagem,
    onTicketAtualizado,
    onUsuarioDigitando,
    onStatusMensagem,
    enviarDigitando,
    entrarSalaTicket,
    sairSalaTicket
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};
