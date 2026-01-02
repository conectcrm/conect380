/**
 * 💬 useMensagens - Hook para gerenciar mensagens do chat
 *
 * Funcionalidades:
 * - Carregar mensagens
 * - Enviar mensagem (texto/áudio/arquivos)
 * - Paginação infinita
 * - Marcar como lida
 * - Upload de arquivos
 * - Gravação de áudio
 * - Auto-scroll
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { atendimentoService, normalizarMensagemPayload } from '../services/atendimentoService';
import { Mensagem, StatusMensagem } from '../types';
import {
  useAtendimentoStore,
} from '../../../../stores/atendimentoStore';

const DEBUG = false; // 🧪 Habilitado para testar mensagens em tempo real

const chaveMensagem = (m: Mensagem) => m.id || m.idExterno || `${m.ticketId}-${m.timestamp}`;

const deduplicarMensagens = (lista: Mensagem[]): Mensagem[] => {
  const mapa = new Map<string, Mensagem>();

  lista.forEach((msg) => {
    const key = chaveMensagem(msg);
    if (!mapa.has(key)) {
      mapa.set(key, msg);
    }
  });

  return Array.from(mapa.values());
};

interface UseMensagensOptions {
  ticketId: string | null;
  autoScroll?: boolean;
  pageSize?: number;
  onUploadProgress?: (progress: number) => void; // 🔄 NOVO: Callback de progresso de upload
}

interface UseMensagensReturn {
  // Estado
  mensagens: Mensagem[];
  loading: boolean;
  error: string | null;
  enviando: boolean;
  temMais: boolean;
  paginaAtual: number;

  // Ações de mensagem
  enviarMensagem: (conteudo: string) => Promise<void>;
  enviarMensagemComAnexos: (conteudo: string, arquivos: File[]) => Promise<void>;
  enviarAudio: (audioBlob: Blob, duracao: number) => Promise<void>;
  carregarMais: () => Promise<void>;
  marcarComoLidas: (mensagemIds: string[]) => Promise<void>;
  recarregar: () => Promise<void>;
  adicionarMensagemRecebida: (mensagem: Mensagem) => void; // 🔥 NOVA: para WebSocket

  // Refs úteis
  mensagensRef: React.RefObject<HTMLDivElement>;
}

export const useMensagens = (options: UseMensagensOptions): UseMensagensReturn => {
  const { ticketId, autoScroll = true, pageSize = 50 } = options;

  // ===== ESTADO LOCAL REATIVO (como Slack, WhatsApp, Discord) =====
  // 🔥 Mensagens são gerenciadas localmente para garantir reatividade imediata
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [temMais, setTemMais] = useState(false);
  const [paginaAtual, setPaginaAtual] = useState(1);

  const mensagensRef = useRef<HTMLDivElement>(null);
  const ultimaMensagemRef = useRef<string | null>(null);

  // 🔥 Manter sincronização com store Zustand (para outros componentes)
  const {
    setMensagens: setMensagensStore,
    adicionarMensagem: adicionarMensagemStore,
    atualizarMensagem: atualizarMensagemStore,
  } = useAtendimentoStore();

  // ===== CARREGAR MENSAGENS =====
  const carregarMensagens = useCallback(
    async (pagina: number = 1, append: boolean = false) => {
      if (!ticketId) {
        setMensagens([]);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await atendimentoService.listarMensagens({
          ticketId,
          page: pagina,
          limit: pageSize,
        });

        if (append) {
          // Adicionar mensagens antigas (paginação) com deduplicação
          setMensagens((prev) => deduplicarMensagens([...response.data, ...prev]));
        } else {
          // Substituir mensagens (refresh)
          const dedup = deduplicarMensagens(response.data);
          setMensagens(dedup);

          // 🔥 Sincronizar com store Zustand (para outros componentes)
          setMensagensStore(ticketId, dedup);
        }

        setTemMais(response.data.length === pageSize);
        setPaginaAtual(pagina);

        if (DEBUG)
          console.log(`✅ ${response.data.length} mensagens carregadas (página ${pagina})`);
      } catch (err: any) {
        const mensagemErro = err.response?.data?.message || 'Erro ao carregar mensagens';
        setError(mensagemErro);
        console.error('❌ Erro ao carregar mensagens:', err);
      } finally {
        setLoading(false);
      }
    },
    [ticketId, pageSize, setMensagensStore],
  );

  // ===== CARREGAR MAIS (SCROLL INFINITO) =====
  const carregarMais = useCallback(async () => {
    if (!temMais || loading) return;

    await carregarMensagens(paginaAtual + 1, true);
  }, [temMais, loading, paginaAtual, carregarMensagens]);

  // ===== ENVIAR MENSAGEM =====
  const enviarMensagem = useCallback(
    async (conteudo: string) => {
      if (!ticketId || !conteudo.trim()) return;

      setEnviando(true);

      try {
        const novaMensagem = await atendimentoService.enviarMensagem({
          ticketId,
          conteudo: conteudo.trim(),
        });

        // 🔥 Não adicionar manualmente; dedupe usa id/idExterno e WS já entrega
        if (DEBUG) console.log('✅ Mensagem enviada, aguardando WebSocket...');
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Erro ao enviar mensagem';
        setError(errorMessage);
        console.error('❌ Erro ao enviar mensagem:', err);
        throw err;
      } finally {
        setEnviando(false);
      }
    },
    [ticketId],
  );

  // ===== ENVIAR MENSAGEM COM ANEXOS =====
  const enviarMensagemComAnexos = useCallback(
    async (conteudo: string, arquivos: File[]) => {
      if (!ticketId || (!conteudo.trim() && arquivos.length === 0)) return;

      setEnviando(true);

      try {
        const novaMensagem = await atendimentoService.enviarMensagem({
          ticketId,
          conteudo: conteudo.trim() || '📎 Anexo',
          anexos: arquivos,
          onUploadProgress: options?.onUploadProgress, // 🔄 NOVO: Passar callback de progresso
        });

        // 🔥 Não adicionar manualmente; WebSocket entrega e dedupe evita duplicata
        if (DEBUG) console.log('✅ Mensagem com anexos enviada, aguardando WebSocket...');
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Erro ao enviar mensagem';
        setError(errorMessage);
        console.error('❌ Erro ao enviar mensagem com anexos:', err);
        throw err;
      } finally {
        setEnviando(false);
      }
    },
    [ticketId, options?.onUploadProgress],
  );

  // ===== ENVIAR ÁUDIO =====
  const enviarAudio = useCallback(
    async (audioBlob: Blob, duracao: number) => {
      if (!ticketId) return;

      setEnviando(true);

      try {
        const novaMensagem = await atendimentoService.enviarMensagem({
          ticketId,
          conteudo: '',
          audio: { blob: audioBlob, duracao },
        });

        // 🔥 Não adicionar manualmente; WS entrega
        if (DEBUG) console.log('✅ Áudio enviado, aguardando WebSocket...');
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Erro ao enviar áudio';
        setError(errorMessage);
        console.error('❌ Erro ao enviar áudio:', err);
        throw err;
      } finally {
        setEnviando(false);
      }
    },
    [ticketId],
  );

  // ===== MARCAR COMO LIDAS =====
  const marcarComoLidas = useCallback(
    async (mensagemIds: string[]) => {
      if (!ticketId || mensagemIds.length === 0) return;

      try {
        await atendimentoService.marcarComoLidas(ticketId, mensagemIds);

        // Atualizar mensagens na store
        mensagemIds.forEach((mensagemId) => {
          atualizarMensagemStore(ticketId, mensagemId, { status: 'lido' as StatusMensagem });
        });

        if (DEBUG) console.log(`✅ ${mensagemIds.length} mensagens marcadas como lidas`);
      } catch (err: any) {
        console.error('❌ Erro ao marcar mensagens como lidas:', err);
      }
    },
    [ticketId, atualizarMensagemStore],
  );

  // ===== RECARREGAR =====
  const recarregar = useCallback(async () => {
    await carregarMensagens(1, false);
  }, [carregarMensagens]);

  // ===== ADICIONAR MENSAGEM RECEBIDA (WEBSOCKET) =====
  const adicionarMensagemRecebida = useCallback(
    (mensagem: Mensagem) => {
      if (!ticketId || !mensagem || mensagem.ticketId !== ticketId) return;

      const mensagemNormalizada = normalizarMensagemPayload(mensagem);

      if (DEBUG) console.log('📩 Adicionando mensagem recebida via WebSocket:', mensagem);

      // 🔥 ATUALIZAR ESTADO LOCAL (para reatividade imediata)
      setMensagens((prev) => {
        // 🛡️ Garantir que prev seja sempre um array
        const prevArray = Array.isArray(prev) ? prev : [];

        // Evitar duplicatas
        const novaChave = chaveMensagem(mensagemNormalizada);
        const jaExiste = prevArray.some((m) => chaveMensagem(m) === novaChave);
        if (jaExiste) {
          if (DEBUG) console.warn(`⚠️ Mensagem ${mensagemNormalizada.id} já existe`);
          return prevArray;
        }

        if (DEBUG) console.log('🔥 Mensagem adicionada em tempo real:', mensagemNormalizada.id);
        return [...prevArray, mensagemNormalizada]; // Adiciona no final
      });

      // 🔄 Sincronizar com store (para outros componentes)
      adicionarMensagemStore(ticketId, mensagemNormalizada);
    },
    [ticketId, adicionarMensagemStore],
  );

  // ===== SCROLL AUTOMÁTICO =====
  const scrollParaFinal = useCallback(() => {
    if (!autoScroll || !mensagensRef.current) return;

    setTimeout(() => {
      mensagensRef.current?.scrollTo({
        top: mensagensRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }, 100);
  }, [autoScroll]);

  // ===== EFEITOS =====

  // Carregar mensagens quando ticket mudar
  useEffect(() => {
    if (ticketId) {
      setPaginaAtual(1);
      carregarMensagens(1, false);
    }
  }, [ticketId, carregarMensagens]);

  // Scroll automático quando nova mensagem chegar
  useEffect(() => {
    if (mensagens.length > 0) {
      const ultimaMensagem = mensagens[mensagens.length - 1];

      // Só fazer scroll se for mensagem nova
      if (ultimaMensagemRef.current !== ultimaMensagem.id) {
        ultimaMensagemRef.current = ultimaMensagem.id;

        // Scroll apenas se for mensagem do atendente (enviada por mim)
        if (ultimaMensagem.remetente.tipo === 'atendente') {
          scrollParaFinal();
        }
      }
    }
  }, [mensagens, scrollParaFinal]);

  // Marcar mensagens não lidas como lidas ao visualizar
  useEffect(() => {
    if (mensagens.length === 0 || !ticketId) return;

    // Buscar mensagens do cliente que não foram lidas
    const mensagensNaoLidas = mensagens
      .filter((msg) => msg.remetente.tipo === 'cliente' && msg.status !== 'lido')
      .map((msg) => msg.id);

    if (mensagensNaoLidas.length > 0) {
      // Marcar após 2 segundos de visualização
      const timeout = setTimeout(() => {
        marcarComoLidas(mensagensNaoLidas);
      }, 2000);

      return () => clearTimeout(timeout);
    }
  }, [mensagens, ticketId, marcarComoLidas]);

  // ===== RETORNO =====
  return {
    // Estado
    mensagens,
    loading,
    error,
    enviando,
    temMais,
    paginaAtual,

    // Ações
    enviarMensagem,
    enviarMensagemComAnexos,
    enviarAudio,
    carregarMais,
    marcarComoLidas,
    recarregar,
    adicionarMensagemRecebida, // 🔥 NOVA

    // Refs
    mensagensRef,
  };
};
