import { useState, useEffect, useCallback, useRef } from 'react';
import {
  messagesService,
  Mensagem,
  BuscarMensagensFiltros,
  CriarMensagemDto,
  TipoMensagem,
} from '../services/messagesService';
import { useWebSocket } from './useWebSocket';

const WS_URL = process.env.REACT_APP_WS_URL || 'http://localhost:3001';

/**
 * Hook customizado para gerenciar mensagens com WebSocket em tempo real
 * 
 * Adiciona recursos de tempo real ao hook useMessages original:
 * - Recebe mensagens em tempo real via WebSocket
 * - Atualiza lista automaticamente quando nova mensagem chega
 * - Notifica quando usuário está digitando
 * - Entra/sai de salas de tickets automaticamente
 * 
 * @example
 * ```tsx
 * const { 
 *   mensagens, 
 *   enviarMensagem, 
 *   notificarDigitando 
 * } = useMessagesRealtime(ticketId);
 * ```
 */
export function useMessagesRealtime(ticketId: string | null) {
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [enviando, setEnviando] = useState(false);
  const [digitando, setDigitando] = useState<{ userId: string; timestamp: Date } | null>(null);

  // Token do usuário
  const socketRef = useRef<Socket | null>(null);
  const token = localStorage.getItem('authToken');
  const empresaId = localStorage.getItem('empresaAtiva');

  // WebSocket hook
  const {
    connected: wsConnected,
    emit: wsEmit,
    on: wsOn,
  } = useWebSocket({
    url: `${WS_URL}/atendimento`,
    token,
    autoConnect: true,
  });

  // Ref para evitar múltiplas adições da mesma mensagem
  const mensagensIdsRef = useRef<Set<string>>(new Set());

  // Funções auxiliares para WebSocket
  const entrarTicket = useCallback((ticketId: string) => {
    if (wsEmit) {
      wsEmit('ticket:entrar', { ticketId });
    }
  }, [wsEmit]);

  const sairTicket = useCallback((ticketId: string) => {
    if (wsEmit) {
      wsEmit('ticket:sair', { ticketId });
    }
  }, [wsEmit]);

  const wsNotificarDigitando = useCallback((ticketId: string, atendenteId: string) => {
    if (wsEmit) {
      wsEmit('mensagem:digitando', { ticketId, atendenteId });
    }
  }, [wsEmit]);

  /**
   * Carrega mensagens de um ticket
   */
  const carregarMensagens = useCallback(async (filtros?: Partial<BuscarMensagensFiltros>) => {
    if (!ticketId) {
      console.warn('⚠️ useMessagesRealtime: ticketId não fornecido');
      return;
    }

    setLoading(true);
    setErro(null);

    try {
      const filtrosCompletos: BuscarMensagensFiltros = {
        ticketId,
        limit: filtros?.limit || 50,
        offset: filtros?.offset || 0,
        ...filtros,
      };

      console.log('🔄 [Realtime] Carregando mensagens do ticket:', ticketId);

      const resposta = await messagesService.listar(filtrosCompletos);

      if (resposta.success) {
        setMensagens(resposta.data);
        setTotal(resposta.total);

        // Atualizar ref com IDs das mensagens carregadas
        mensagensIdsRef.current = new Set(resposta.data.map(m => m.id));

        console.log(`✅ [Realtime] ${resposta.data.length} mensagens carregadas (total: ${resposta.total})`);
      } else {
        setErro('Falha ao carregar mensagens');
      }
    } catch (error: any) {
      console.error('❌ [Realtime] Erro ao carregar mensagens:', error);
      setErro(error.response?.data?.message || error.message || 'Erro ao carregar mensagens');
    } finally {
      setLoading(false);
    }
  }, [ticketId]);

  /**
   * Envia uma nova mensagem
   */
  const enviarMensagem = useCallback(async (
    conteudo: string,
    tipo?: TipoMensagem,
    metadata?: any
  ) => {
    if (!ticketId) {
      console.error('❌ [Realtime] Tentativa de enviar mensagem sem ticketId');
      return;
    }

    setEnviando(true);
    setErro(null);

    try {
      const dados: CriarMensagemDto = {
        ticketId,
        conteudo,
        tipo: tipo || TipoMensagem.TEXTO,
        metadata,
      };

      console.log('📤 [Realtime] Enviando mensagem:', dados);

      const resposta = await messagesService.enviar(dados);

      if (resposta.success) {
        // A mensagem será adicionada via WebSocket automaticamente
        // Mas adicionamos aqui também para feedback instantâneo
        if (!mensagensIdsRef.current.has(resposta.data.id)) {
          setMensagens((prev) => [...prev, resposta.data]);
          mensagensIdsRef.current.add(resposta.data.id);
        }
        console.log('✅ [Realtime] Mensagem enviada com sucesso');
        return resposta.data;
      }
    } catch (error: any) {
      console.error('❌ [Realtime] Erro ao enviar mensagem:', error);
      setErro(error.response?.data?.message || error.message || 'Erro ao enviar mensagem');
      throw error;
    } finally {
      setEnviando(false);
    }
  }, [ticketId]);

  /**
   * Faz upload de um arquivo e envia como mensagem
   */
  const enviarArquivo = useCallback(async (arquivo: File) => {
    if (!ticketId) {
      console.error('❌ [Realtime] Tentativa de enviar arquivo sem ticketId');
      return;
    }

    setEnviando(true);
    setErro(null);

    try {
      console.log('📤 [Realtime] Enviando arquivo:', arquivo.name);

      const resposta = await messagesService.uploadArquivo(ticketId, arquivo);

      if (resposta.success) {
        // A mensagem será adicionada via WebSocket automaticamente
        if (!mensagensIdsRef.current.has(resposta.data.id)) {
          setMensagens((prev) => [...prev, resposta.data]);
          mensagensIdsRef.current.add(resposta.data.id);
        }
        console.log('✅ [Realtime] Arquivo enviado com sucesso');
        return resposta.data;
      }
    } catch (error: any) {
      console.error('❌ [Realtime] Erro ao enviar arquivo:', error);
      setErro(error.response?.data?.message || error.message || 'Erro ao enviar arquivo');
      throw error;
    } finally {
      setEnviando(false);
    }
  }, [ticketId]);

  /**
   * Marca mensagens como lidas
   */
  const marcarComoLida = useCallback(async (mensagemIds: string[]) => {
    try {
      console.log('📖 [Realtime] Marcando mensagens como lidas:', mensagemIds);

      const resposta = await messagesService.marcarComoLida({ mensagemIds });

      if (resposta.success) {
        // Atualizar mensagens na lista local
        setMensagens((prev) =>
          prev.map((m) =>
            mensagemIds.includes(m.id) ? { ...m, lida: true, lidaEm: new Date().toISOString() } : m
          )
        );
        console.log('✅ [Realtime] Mensagens marcadas como lidas');
      }
    } catch (error: any) {
      console.error('❌ [Realtime] Erro ao marcar mensagens como lidas:', error);
      throw error;
    }
  }, []);

  /**
   * Notifica que está digitando
   */
  const notificarDigitando = useCallback(() => {
    if (!ticketId) return;

    const atendenteId = localStorage.getItem('userId') || 'unknown';
    wsNotificarDigitando(ticketId, atendenteId);
  }, [ticketId, wsNotificarDigitando]);

  /**
   * Recarrega mensagens do ticket
   */
  const recarregar = useCallback(() => {
    carregarMensagens();
  }, [carregarMensagens]);

  /**
   * Entrar na sala do ticket e configurar listeners WebSocket
   */
  useEffect(() => {
    if (!ticketId || !wsConnected) return;

    console.log(`🚪 [Realtime] Entrando na sala do ticket: ${ticketId}`);
    entrarTicket(ticketId);

    // Listener para nova mensagem
    const unsubscribeNovaMensagem = wsOn('mensagem:nova', (mensagem: Mensagem) => {
      console.log('📨 [Realtime] Nova mensagem recebida via WebSocket:', mensagem);

      // Verificar se a mensagem é deste ticket
      if (mensagem.ticketId === ticketId) {
        // Verificar se já não foi adicionada
        if (!mensagensIdsRef.current.has(mensagem.id)) {
          setMensagens((prev) => [...prev, mensagem]);
          mensagensIdsRef.current.add(mensagem.id);

          // Tocar som de notificação (opcional)
          playNotificationSound();
        }
      }
    });

    // Listener para digitando
    const unsubscribeDigitando = wsOn('mensagem:digitando', (data: { ticketId: string; userId: string; timestamp: Date }) => {
      if (data.ticketId === ticketId) {
        console.log('⌨️ [Realtime] Usuário digitando:', data.userId);
        setDigitando({ userId: data.userId, timestamp: data.timestamp });

        // Remover indicador de digitando após 3 segundos
        setTimeout(() => {
          setDigitando(null);
        }, 3000);
      }
    });

    // Cleanup: sair da sala e remover listeners
    return () => {
      console.log(`🚪 [Realtime] Saindo da sala do ticket: ${ticketId}`);
      sairTicket(ticketId);
      unsubscribeNovaMensagem();
      unsubscribeDigitando();
    };
  }, [ticketId, wsConnected, wsOn, entrarTicket, sairTicket]);

  /**
   * Carrega mensagens automaticamente quando o ticketId muda
   */
  useEffect(() => {
    if (ticketId) {
      carregarMensagens();
    } else {
      // Limpar mensagens se não há ticket selecionado
      setMensagens([]);
      setTotal(0);
      setErro(null);
      mensagensIdsRef.current.clear();
    }
  }, [ticketId, carregarMensagens]);

  return {
    mensagens,
    loading,
    erro,
    total,
    enviando,
    digitando,
    wsConnected,
    carregarMensagens,
    enviarMensagem,
    enviarArquivo,
    marcarComoLida,
    notificarDigitando,
    recarregar,
  };
}

/**
 * Toca som de notificação (opcional)
 */
function playNotificationSound() {
  try {
    // Criar um tom simples usando Web Audio API
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = 800; // Frequência em Hz
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.2);
  } catch (error) {
    // Som de notificação falhou, mas não é crítico
    console.warn('⚠️ [Realtime] Falha ao reproduzir som de notificação:', error);
  }
}
