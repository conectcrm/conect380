import { useEffect, useState, useCallback } from 'react';
import { useWebSocket } from './useWebSocket';
import { atendimentoService, Ticket, Mensagem } from '../services/atendimentoService';
import { resolveSocketBaseUrl } from '../utils/network';

const SOCKET_BASE_URL = resolveSocketBaseUrl({
  envUrl: process.env.REACT_APP_WEBSOCKET_URL || process.env.REACT_APP_WS_URL,
  onEnvIgnored: ({ envUrl, currentHost }) => {
    console.warn(
      '⚠️ [WhatsApp] Ignorando URL de WebSocket local em acesso via rede:',
      envUrl,
      '→ host atual',
      currentHost,
    );
  },
});

const WEBSOCKET_URL = SOCKET_BASE_URL.endsWith('/')
  ? `${SOCKET_BASE_URL}atendimento`
  : `${SOCKET_BASE_URL}/atendimento`;

interface UseWhatsAppOptions {
  empresaId: string;
  token: string | null;
  autoLoadTickets?: boolean;
}

interface NovaMensagemEvent {
  ticketId: string;
  mensagem: Mensagem;
}

export function useWhatsApp(options: UseWhatsAppOptions) {
  const { empresaId, token, autoLoadTickets = true } = options;

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [mensagens, setMensagens] = useState<Map<string, Mensagem[]>>(new Map());
  const [loading, setLoading] = useState(false);
  const [loadingMensagens, setLoadingMensagens] = useState(false);
  const [enviandoMensagem, setEnviandoMensagem] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  // WebSocket
  const {
    connected,
    connecting,
    error: wsError,
    on,
    off,
  } = useWebSocket({
    url: WEBSOCKET_URL,
    token,
    autoConnect: true,
    onConnect: () => {
      console.log('[WhatsApp] WebSocket conectado');
    },
    onDisconnect: (reason) => {
      console.log('[WhatsApp] WebSocket desconectado:', reason);
    },
    onError: (err) => {
      console.error('[WhatsApp] Erro WebSocket:', err.message);
    },
  });

  /**
   * Carregar tickets da empresa
   */
  const carregarTickets = useCallback(
    async (filtros?: { status?: string[]; atendenteId?: string; busca?: string }) => {
      try {
        setLoading(true);
        setErro(null);

        // ✅ CORREÇÃO: Se não passar filtros de status, incluir apenas tickets ativos (ABERTO, EM_ATENDIMENTO, AGUARDANDO)
        // Isso garante que tickets recém-criados apareçam após reload, mas evita carregar todos os históricos fechados
        const filtrosComStatus = {
          ...filtros,
          status: filtros?.status || ['ABERTO', 'EM_ATENDIMENTO', 'AGUARDANDO'],
        };

        const ticketsCarregados = await atendimentoService.listarTickets(
          empresaId,
          filtrosComStatus,
        );
        setTickets(ticketsCarregados);

        console.log(
          '[WhatsApp] Tickets carregados:',
          ticketsCarregados.length,
          'com filtros:',
          filtrosComStatus,
        );
      } catch (error: any) {
        console.error('[WhatsApp] Erro ao carregar tickets:', error);
        setErro(error.message || 'Erro ao carregar tickets');
      } finally {
        setLoading(false);
      }
    },
    [empresaId],
  );

  /**
   * Carregar mensagens de um ticket
   */
  const carregarMensagens = useCallback(async (ticketId: string) => {
    try {
      setLoadingMensagens(true);
      setErro(null);

      const mensagensCarregadas = await atendimentoService.listarMensagens(ticketId);

      setMensagens((prev) => {
        const novo = new Map(prev);
        novo.set(ticketId, mensagensCarregadas);
        return novo;
      });

      console.log(
        '[WhatsApp] Mensagens carregadas:',
        mensagensCarregadas.length,
        'para ticket',
        ticketId,
      );
    } catch (error: any) {
      console.error('[WhatsApp] Erro ao carregar mensagens:', error);
      setErro(error.message || 'Erro ao carregar mensagens');
    } finally {
      setLoadingMensagens(false);
    }
  }, []);

  /**
   * Enviar mensagem via WhatsApp
   */
  const enviarMensagem = useCallback(
    async (ticketId: string, telefone: string, mensagem: string) => {
      try {
        setEnviandoMensagem(true);
        setErro(null);

        const resultado = await atendimentoService.enviarMensagemWhatsApp(empresaId, {
          ticketId,
          telefone,
          mensagem,
        });

        console.log('[WhatsApp] Mensagem enviada com sucesso:', resultado);

        // Atualizar status do ticket localmente
        setTickets((prev) =>
          prev.map((t) =>
            t.id === ticketId ? { ...t, status: resultado.ticketStatus as Ticket['status'] } : t,
          ),
        );

        return resultado;
      } catch (error: any) {
        console.error('[WhatsApp] Erro ao enviar mensagem:', error);
        setErro(error.message || 'Erro ao enviar mensagem');
        throw error;
      } finally {
        setEnviandoMensagem(false);
      }
    },
    [empresaId],
  );

  /**
   * Atualizar status do ticket
   */
  const atualizarStatus = useCallback(async (ticketId: string, status: Ticket['status']) => {
    try {
      const ticketAtualizado = await atendimentoService.atualizarStatusTicket(ticketId, status);

      setTickets((prev) => prev.map((t) => (t.id === ticketId ? ticketAtualizado : t)));

      console.log('[WhatsApp] Status do ticket atualizado:', status);
    } catch (error: any) {
      console.error('[WhatsApp] Erro ao atualizar status:', error);
      setErro(error.message || 'Erro ao atualizar status');
      throw error;
    }
  }, []);

  /**
   * Atribuir ticket para atendente
   */
  const atribuirTicket = useCallback(async (ticketId: string, atendenteId: string) => {
    try {
      const ticketAtualizado = await atendimentoService.atribuirTicket(ticketId, atendenteId);

      setTickets((prev) => prev.map((t) => (t.id === ticketId ? ticketAtualizado : t)));

      console.log('[WhatsApp] Ticket atribuído para:', atendenteId);
    } catch (error: any) {
      console.error('[WhatsApp] Erro ao atribuir ticket:', error);
      setErro(error.message || 'Erro ao atribuir ticket');
      throw error;
    }
  }, []);

  // Listeners de eventos WebSocket
  useEffect(() => {
    if (!connected) return;

    // Nova mensagem recebida
    // ✅ CORRIGIDO: 'nova_mensagem' com underscore (compatível com backend)
    const unsubNovaMensagem = on('nova_mensagem', (data: NovaMensagemEvent) => {
      console.log('[WhatsApp] Nova mensagem recebida via WebSocket:', data);

      // Adicionar mensagem ao state
      setMensagens((prev) => {
        const novo = new Map(prev);
        const mensagensTicket = novo.get(data.ticketId) || [];
        novo.set(data.ticketId, [...mensagensTicket, data.mensagem]);
        return novo;
      });

      // Atualizar timestamp do ticket
      setTickets((prev) =>
        prev.map((t) =>
          t.id === data.ticketId ? { ...t, ultimaMensagemEm: data.mensagem.criadoEm } : t,
        ),
      );

      // Mover ticket para o topo da lista se não for o ativo
      setTickets((prev) => {
        const ticket = prev.find((t) => t.id === data.ticketId);
        if (!ticket) return prev;

        return [ticket, ...prev.filter((t) => t.id !== data.ticketId)];
      });
    });

    // Novo ticket criado
    // ✅ CORRIGIDO: 'novo_ticket' com underscore (compatível com backend)
    const unsubNovoTicket = on('novo_ticket', (ticket: Ticket) => {
      console.log('[WhatsApp] Novo ticket criado via WebSocket:', ticket);

      setTickets((prev) => {
        // Verificar se já existe
        if (prev.find((t) => t.id === ticket.id)) {
          return prev;
        }
        return [ticket, ...prev];
      });
    });

    // Ticket atualizado
    // ✅ CORRIGIDO: 'ticket_atualizado' com underscore (compatível com backend)
    const unsubTicketAtualizado = on(
      'ticket_atualizado',
      (data: { ticketId: string;[key: string]: any }) => {
        console.log('[WhatsApp] Ticket atualizado via WebSocket:', data);

        setTickets((prev) => prev.map((t) => (t.id === data.ticketId ? { ...t, ...data } : t)));
      },
    );

    // Status online/offline atualizado
    const unsubStatusAtualizado = on(
      'contato:status:atualizado',
      (data: { telefone: string; online: boolean; lastActivity: string }) => {
        console.log('[WhatsApp] Status de contato atualizado via WebSocket:', data);

        setTickets((prev) =>
          prev.map((t) =>
            t.contatoTelefone === data.telefone
              ? {
                ...t,
                contatoOnline: data.online,
                contatoLastActivity: data.lastActivity,
              }
              : t,
          ),
        );
      },
    );

    // Cleanup
    return () => {
      unsubNovaMensagem();
      unsubNovoTicket();
      unsubTicketAtualizado();
      unsubStatusAtualizado();
    };
  }, [connected, on]);

  // Auto-carregar tickets ao montar
  useEffect(() => {
    if (autoLoadTickets && empresaId) {
      carregarTickets();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoLoadTickets, empresaId]);

  return {
    // Estado
    tickets,
    mensagens,
    loading,
    loadingMensagens,
    enviandoMensagem,
    erro,

    // WebSocket
    connected,
    connecting,
    wsError,

    // Ações
    carregarTickets,
    carregarMensagens,
    enviarMensagem,
    atualizarStatus,
    atribuirTicket,
  };
}
