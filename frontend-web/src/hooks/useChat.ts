import { useEffect, useState, useCallback } from 'react';
import { useWebSocket } from './useWebSocket';
import { resolveSocketBaseUrl } from '../utils/network';

const SOCKET_BASE_URL = resolveSocketBaseUrl({
  envUrl: process.env.REACT_APP_WEBSOCKET_URL || process.env.REACT_APP_WS_URL,
  onEnvIgnored: ({ envUrl, currentHost }) => {
    console.warn(
      '⚠️ [Chat] Ignorando URL de WebSocket local em acesso via rede:',
      envUrl,
      '→ host atual',
      currentHost,
    );
  },
});

const WEBSOCKET_URL = SOCKET_BASE_URL.endsWith('/')
  ? `${SOCKET_BASE_URL}atendimento`
  : `${SOCKET_BASE_URL}/atendimento`;

interface Mensagem {
  id: string;
  ticketId: string;
  ticketNumero?: string;
  remetenteId?: string;
  atendenteId?: string;
  tipo: 'TEXTO' | 'IMAGEM' | 'AUDIO' | 'VIDEO' | 'ARQUIVO';
  conteudo: string;
  direcao?: 'enviada' | 'recebida';
  criadoEm: Date;
}

interface Ticket {
  id: string;
  numero: string;
  empresaId: string;
  clienteId?: string;
  canalId: string;
  filaId?: string;
  atendenteId?: string;
  status: string;
  prioridade: string;
  assunto?: string;
  descricao?: string;
  criadoEm: Date;
}

interface Atendente {
  atendenteId: string;
  atendenteNome?: string;
  status: 'online' | 'ocupado' | 'ausente' | 'offline';
  timestamp: Date;
}

interface UseChatOptions {
  token: string | null;
  ticketId?: string;
  onNovaMensagem?: (mensagem: Mensagem) => void;
  onNovoTicket?: (ticket: Ticket) => void;
  onTicketAtualizado?: (data: any) => void;
}

export function useChat(options: UseChatOptions) {
  const { token, ticketId, onNovaMensagem, onNovoTicket, onTicketAtualizado } = options;

  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [atendentesOnline, setAtendentesOnline] = useState<Atendente[]>([]);
  const [digitando, setDigitando] = useState<{ ticketId: string; usuarioNome?: string } | null>(
    null,
  );

  const { connected, connecting, error, emit, on, off } = useWebSocket({
    url: WEBSOCKET_URL,
    token,
    autoConnect: true,
    onConnect: () => {
      console.log('[Chat] Conectado ao WebSocket');
      // Se tiver ticketId, entrar na sala do ticket
      if (ticketId) {
        entrarTicket(ticketId);
      }
    },
    onDisconnect: (reason) => {
      console.log('[Chat] Desconectado:', reason);
    },
    onError: (err) => {
      console.error('[Chat] Erro:', err.message);
    },
  });

  // Entrar na sala de um ticket
  const entrarTicket = useCallback(
    (id: string) => {
      emit('ticket:entrar', { ticketId: id });
      console.log('[Chat] Entrando no ticket:', id);
    },
    [emit],
  );

  // Sair da sala de um ticket
  const sairTicket = useCallback(
    (id: string) => {
      emit('ticket:sair', { ticketId: id });
      console.log('[Chat] Saindo do ticket:', id);
    },
    [emit],
  );

  // Emitir evento "digitando"
  const emitirDigitando = useCallback(
    (id: string) => {
      emit('mensagem:digitando', { ticketId: id });
    },
    [emit],
  );

  // Alterar status do atendente
  const alterarStatus = useCallback(
    (status: 'online' | 'ocupado' | 'ausente' | 'offline') => {
      emit('atendente:status', { status });
      console.log('[Chat] Status alterado para:', status);
    },
    [emit],
  );

  // Listeners de eventos
  useEffect(() => {
    if (!connected) return;

    // Nova mensagem
    const unsubMensagem = on('mensagem:nova', (data: Mensagem) => {
      console.log('[Chat] Nova mensagem recebida:', data);
      setMensagens((prev) => [...prev, data]);
      onNovaMensagem?.(data);
    });

    // Alguém está digitando
    const unsubDigitando = on(
      'mensagem:digitando',
      (data: { ticketId: string; usuarioNome?: string }) => {
        console.log('[Chat] Digitando:', data);
        setDigitando(data);
        // Limpar após 3 segundos
        setTimeout(() => setDigitando(null), 3000);
      },
    );

    // Mensagem não atribuída
    const unsubNaoAtribuida = on('mensagem:nao-atribuida', (data: any) => {
      console.log('[Chat] Mensagem não atribuída:', data);
      // Mostrar notificação ou alerta
    });

    // Novo ticket
    const unsubNovoTicket = on('ticket:novo', (data: Ticket) => {
      console.log('[Chat] Novo ticket:', data);
      setTickets((prev) => [data, ...prev]);
      onNovoTicket?.(data);
    });

    // Status do ticket alterado
    const unsubTicketStatus = on('ticket:status', (data: any) => {
      console.log('[Chat] Status do ticket alterado:', data);
      onTicketAtualizado?.(data);
    });

    // Ticket atualizado
    const unsubTicketAtualizado = on('ticket:atualizado', (data: any) => {
      console.log('[Chat] Ticket atualizado:', data);
      setTickets((prev) => prev.map((t) => (t.id === data.ticketId ? { ...t, ...data } : t)));
      onTicketAtualizado?.(data);
    });

    // Ticket atribuído
    const unsubTicketAtribuido = on('ticket:atribuido', (data: any) => {
      console.log('[Chat] Ticket atribuído para você:', data);
      // Mostrar notificação
    });

    // Atendente online
    const unsubAtendenteOnline = on('atendente:online', (data: Atendente) => {
      console.log('[Chat] Atendente online:', data);
      setAtendentesOnline((prev) => [
        ...prev.filter((a) => a.atendenteId !== data.atendenteId),
        data,
      ]);
    });

    // Atendente offline
    const unsubAtendenteOffline = on('atendente:offline', (data: Atendente) => {
      console.log('[Chat] Atendente offline:', data);
      setAtendentesOnline((prev) => prev.filter((a) => a.atendenteId !== data.atendenteId));
    });

    // Atendente mudou status
    const unsubAtendenteStatus = on('atendente:status', (data: Atendente) => {
      console.log('[Chat] Status do atendente:', data);
      setAtendentesOnline((prev) =>
        prev.map((a) => (a.atendenteId === data.atendenteId ? { ...a, status: data.status } : a)),
      );
    });

    // Notificação genérica
    const unsubNotificacao = on('notificacao', (data: any) => {
      console.log('[Chat] Notificação:', data);
      // Mostrar toast/alert
    });

    // Cleanup
    return () => {
      unsubMensagem();
      unsubDigitando();
      unsubNaoAtribuida();
      unsubNovoTicket();
      unsubTicketStatus();
      unsubTicketAtualizado();
      unsubTicketAtribuido();
      unsubAtendenteOnline();
      unsubAtendenteOffline();
      unsubAtendenteStatus();
      unsubNotificacao();
    };
  }, [connected, on, onNovaMensagem, onNovoTicket, onTicketAtualizado]);

  // Entrar/sair de ticket quando ticketId mudar
  useEffect(() => {
    if (ticketId && connected) {
      entrarTicket(ticketId);

      return () => {
        sairTicket(ticketId);
      };
    }
  }, [ticketId, connected, entrarTicket, sairTicket]);

  return {
    connected,
    connecting,
    error,
    mensagens,
    tickets,
    atendentesOnline,
    digitando,
    entrarTicket,
    sairTicket,
    emitirDigitando,
    alterarStatus,
  };
}
