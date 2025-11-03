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
import { atendimentoService } from '../services/atendimentoService';
import { Mensagem, StatusMensagem } from '../types';

const DEBUG = false; // ✅ Desabilitado após resolução do problema de tempo real

interface UseMensagensOptions {
  ticketId: string | null;
  autoScroll?: boolean;
  pageSize?: number;
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

export const useMensagens = (
  options: UseMensagensOptions
): UseMensagensReturn => {
  const { ticketId, autoScroll = true, pageSize = 50 } = options;

  // ===== ESTADO =====
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [temMais, setTemMais] = useState(false);
  const [paginaAtual, setPaginaAtual] = useState(1);

  const mensagensRef = useRef<HTMLDivElement>(null);
  const ultimaMensagemRef = useRef<string | null>(null);

  // ===== CARREGAR MENSAGENS =====
  const carregarMensagens = useCallback(async (pagina: number = 1, append: boolean = false) => {
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
        limit: pageSize
      });

      if (append) {
        // Adicionar mensagens antigas (paginação)
        setMensagens(prev => [...response.data, ...prev]);
      } else {
        // Substituir mensagens (refresh)
        setMensagens(response.data);
      }

      setTemMais(response.data.length === pageSize);
      setPaginaAtual(pagina);

      if (DEBUG) console.log(`✅ ${response.data.length} mensagens carregadas (página ${pagina})`);
    } catch (err: any) {
      const mensagemErro = err.response?.data?.message || 'Erro ao carregar mensagens';
      setError(mensagemErro);
      console.error('❌ Erro ao carregar mensagens:', err);
    } finally {
      setLoading(false);
    }
  }, [ticketId, pageSize]);

  // ===== CARREGAR MAIS (SCROLL INFINITO) =====
  const carregarMais = useCallback(async () => {
    if (!temMais || loading) return;

    await carregarMensagens(paginaAtual + 1, true);
  }, [temMais, loading, paginaAtual, carregarMensagens]);

  // ===== ENVIAR MENSAGEM =====
  const enviarMensagem = useCallback(async (conteudo: string) => {
    if (!ticketId || !conteudo.trim()) return;

    setEnviando(true);
    setError(null);

    try {
      const novaMensagem = await atendimentoService.enviarMensagem({
        ticketId,
        conteudo: conteudo.trim()
      });

      // 🔥 NÃO adicionar otimisticamente - WebSocket cuidará disso
      // Evita duplicatas (mensagem aparecerá via WebSocket)
      if (DEBUG) console.log('✅ Mensagem enviada, aguardando WebSocket...');
    } catch (err: any) {
      const mensagemErro = err.response?.data?.message || 'Erro ao enviar mensagem';
      setError(mensagemErro);
      console.error('❌ Erro ao enviar mensagem:', err);
      throw err;
    } finally {
      setEnviando(false);
    }
  }, [ticketId]);

  // ===== ENVIAR MENSAGEM COM ANEXOS =====
  const enviarMensagemComAnexos = useCallback(async (
    conteudo: string,
    arquivos: File[]
  ) => {
    if (!ticketId || (!conteudo.trim() && arquivos.length === 0)) return;

    setEnviando(true);
    setError(null);

    try {
      const novaMensagem = await atendimentoService.enviarMensagem({
        ticketId,
        conteudo: conteudo.trim() || '📎 Anexo',
        anexos: arquivos
      });

      // 🔥 NÃO adicionar otimisticamente - WebSocket cuidará disso
      if (DEBUG) console.log('✅ Mensagem com anexos enviada, aguardando WebSocket...');
    } catch (err: any) {
      const mensagemErro = err.response?.data?.message || 'Erro ao enviar mensagem';
      setError(mensagemErro);
      console.error('❌ Erro ao enviar mensagem com anexos:', err);
      throw err;
    } finally {
      setEnviando(false);
    }
  }, [ticketId]);

  // ===== ENVIAR ÁUDIO =====
  const enviarAudio = useCallback(async (audioBlob: Blob, duracao: number) => {
    if (!ticketId) return;

    setEnviando(true);
    setError(null);

    try {
      const novaMensagem = await atendimentoService.enviarMensagem({
        ticketId,
        conteudo: '',
        audio: { blob: audioBlob, duracao }
      });

      // 🔥 NÃO adicionar otimisticamente - WebSocket cuidará disso
      if (DEBUG) console.log('✅ Áudio enviado, aguardando WebSocket...');
    } catch (err: any) {
      const mensagemErro = err.response?.data?.message || 'Erro ao enviar áudio';
      setError(mensagemErro);
      console.error('❌ Erro ao enviar áudio:', err);
      throw err;
    } finally {
      setEnviando(false);
    }
  }, [ticketId]);

  // ===== MARCAR COMO LIDAS =====
  const marcarComoLidas = useCallback(async (mensagemIds: string[]) => {
    if (!ticketId || mensagemIds.length === 0) return;

    try {
      await atendimentoService.marcarComoLidas(ticketId, mensagemIds);

      // Atualizar estado local
      setMensagens(prev => prev.map(msg =>
        mensagemIds.includes(msg.id)
          ? { ...msg, status: 'lido' as StatusMensagem }
          : msg
      ));

      if (DEBUG) console.log(`✅ ${mensagemIds.length} mensagens marcadas como lidas`);
    } catch (err: any) {
      console.error('❌ Erro ao marcar mensagens como lidas:', err);
    }
  }, [ticketId]);

  // ===== RECARREGAR =====
  const recarregar = useCallback(async () => {
    await carregarMensagens(1, false);
  }, [carregarMensagens]);

  // ===== ADICIONAR MENSAGEM RECEBIDA (WEBSOCKET) =====
  const adicionarMensagemRecebida = useCallback((mensagem: Mensagem) => {
    if (DEBUG) console.log('📩 Adicionando mensagem recebida via WebSocket:', mensagem);

    setMensagens(prev => {
      // Verificar se mensagem já existe (evitar duplicatas)
      const jaExiste = prev.some(m => m.id === mensagem.id);
      if (jaExiste) {
        if (DEBUG) console.log('⚠️ Mensagem já existe, ignorando duplicata');
        return prev;
      }

      // Adicionar nova mensagem ao final
      return [...prev, mensagem];
    });
  }, []);

  // ===== SCROLL AUTOMÁTICO =====
  const scrollParaFinal = useCallback(() => {
    if (!autoScroll || !mensagensRef.current) return;

    setTimeout(() => {
      mensagensRef.current?.scrollTo({
        top: mensagensRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }, 100);
  }, [autoScroll]);

  // ===== EFEITOS =====

  // Carregar mensagens quando ticket mudar
  useEffect(() => {
    if (ticketId) {
      setMensagens([]);
      setPaginaAtual(1);
      carregarMensagens(1, false);
    } else {
      setMensagens([]);
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
      .filter(msg =>
        msg.remetente.tipo === 'cliente' &&
        msg.status !== 'lido'
      )
      .map(msg => msg.id);

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
