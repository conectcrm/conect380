import { useState, useEffect, useCallback } from 'react';
import {
  messagesService,
  Mensagem,
  BuscarMensagensFiltros,
  CriarMensagemDto,
  TipoMensagem,
} from '../services/messagesService';

/**
 * Hook customizado para gerenciar mensagens de um ticket
 */
export function useMessages(ticketId: string | null) {
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [enviando, setEnviando] = useState(false);

  /**
   * Carrega mensagens de um ticket
   */
  const carregarMensagens = useCallback(
    async (filtros?: Partial<BuscarMensagensFiltros>) => {
      if (!ticketId) {
        console.warn('⚠️ useMessages: ticketId não fornecido');
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

        console.log('🔄 Carregando mensagens do ticket:', ticketId);

        const resposta = await messagesService.listar(filtrosCompletos);

        if (resposta.success) {
          setMensagens(resposta.data);
          setTotal(resposta.total);
          console.log(`✅ ${resposta.data.length} mensagens carregadas (total: ${resposta.total})`);
        } else {
          setErro('Falha ao carregar mensagens');
        }
      } catch (error: any) {
        console.error('❌ Erro ao carregar mensagens:', error);
        setErro(error.response?.data?.message || error.message || 'Erro ao carregar mensagens');
      } finally {
        setLoading(false);
      }
    },
    [ticketId],
  );

  /**
   * Envia uma nova mensagem
   */
  const enviarMensagem = useCallback(
    async (conteudo: string, tipo?: TipoMensagem, metadata?: any) => {
      if (!ticketId) {
        console.error('❌ Tentativa de enviar mensagem sem ticketId');
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

        console.log('📤 Enviando mensagem:', dados);

        const resposta = await messagesService.enviar(dados);

        if (resposta.success) {
          // Adicionar a nova mensagem à lista local
          setMensagens((prev) => [...prev, resposta.data]);
          console.log('✅ Mensagem enviada com sucesso');
          return resposta.data;
        }
      } catch (error: any) {
        console.error('❌ Erro ao enviar mensagem:', error);
        setErro(error.response?.data?.message || error.message || 'Erro ao enviar mensagem');
        throw error;
      } finally {
        setEnviando(false);
      }
    },
    [ticketId],
  );

  /**
   * Faz upload de um arquivo e envia como mensagem
   */
  const enviarArquivo = useCallback(
    async (arquivo: File) => {
      if (!ticketId) {
        console.error('❌ Tentativa de enviar arquivo sem ticketId');
        return;
      }

      setEnviando(true);
      setErro(null);

      try {
        console.log('📤 Enviando arquivo:', arquivo.name);

        const resposta = await messagesService.uploadArquivo(ticketId, arquivo);

        if (resposta.success) {
          // Adicionar a nova mensagem à lista local
          setMensagens((prev) => [...prev, resposta.data]);
          console.log('✅ Arquivo enviado com sucesso');
          return resposta.data;
        }
      } catch (error: any) {
        console.error('❌ Erro ao enviar arquivo:', error);
        setErro(error.response?.data?.message || error.message || 'Erro ao enviar arquivo');
        throw error;
      } finally {
        setEnviando(false);
      }
    },
    [ticketId],
  );

  /**
   * Marca mensagens como lidas
   */
  const marcarComoLida = useCallback(async (mensagemIds: string[]) => {
    try {
      console.log('📖 Marcando mensagens como lidas:', mensagemIds);

      const resposta = await messagesService.marcarComoLida({ mensagemIds });

      if (resposta.success) {
        // Atualizar mensagens na lista local
        setMensagens((prev) =>
          prev.map((m) =>
            mensagemIds.includes(m.id) ? { ...m, lida: true, lidaEm: new Date().toISOString() } : m,
          ),
        );
        console.log('✅ Mensagens marcadas como lidas');
      }
    } catch (error: any) {
      console.error('❌ Erro ao marcar mensagens como lidas:', error);
      throw error;
    }
  }, []);

  /**
   * Adiciona uma mensagem recebida via WebSocket
   */
  const adicionarMensagem = useCallback((novaMensagem: Mensagem) => {
    setMensagens((prev) => {
      // Verificar se a mensagem já existe
      if (prev.some((m) => m.id === novaMensagem.id)) {
        return prev;
      }
      return [...prev, novaMensagem];
    });
  }, []);

  /**
   * Atualiza uma mensagem existente (útil para WebSocket)
   */
  const atualizarMensagem = useCallback((mensagemAtualizada: Mensagem) => {
    setMensagens((prev) =>
      prev.map((m) => (m.id === mensagemAtualizada.id ? mensagemAtualizada : m)),
    );
  }, []);

  /**
   * Recarrega mensagens do ticket
   */
  const recarregar = useCallback(() => {
    carregarMensagens();
  }, [carregarMensagens]);

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
    }
  }, [ticketId, carregarMensagens]);

  return {
    mensagens,
    loading,
    erro,
    total,
    enviando,
    carregarMensagens,
    enviarMensagem,
    enviarArquivo,
    marcarComoLida,
    adicionarMensagem,
    atualizarMensagem,
    recarregar,
  };
}
