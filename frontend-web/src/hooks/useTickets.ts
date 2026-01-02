import { useState, useEffect, useCallback } from 'react';
import {
  ticketsService,
  TicketFiltros,
  EscalarTicketDto,
  DesescalarTicketDto,
  ReatribuirTicketDto,
} from '../services/ticketsService';
import { StatusTicket, PrioridadeTicket, SeveridadeTicket, NivelAtendimentoTicket } from '../types/ticket';
import {
  converterTicketAPIParaComponente,
  TicketComponente,
  converterStatusComponenteParaAPI,
  converterPrioridadeComponenteParaAPI,
} from '../utils/ticketAdapters';

/**
 * Hook customizado para gerenciar tickets com API real
 */
export function useTickets(empresaId: string, filtrosIniciais?: Partial<TicketFiltros>) {
  const [tickets, setTickets] = useState<TicketComponente[]>([]);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [pagina, setPagina] = useState(1);
  const [limite, setLimite] = useState(50);

  /**
   * Carrega tickets da API
   */
  const carregarTickets = useCallback(
    async (filtros?: Partial<TicketFiltros>) => {
      if (!empresaId) {
        console.warn('⚠️ useTickets: empresaId não fornecido');
        return;
      }

      setLoading(true);
      setErro(null);

      try {
        const filtrosCompletos: TicketFiltros = {
          empresaId,
          limite: filtros?.limite || limite,
          pagina: filtros?.pagina || pagina,
          ...filtrosIniciais,
          ...filtros,
        };

        console.log('🔄 Carregando tickets com filtros:', filtrosCompletos);

        const resposta = await ticketsService.listar(filtrosCompletos);

        if (resposta.success) {
          // Converter tickets da API para o formato dos componentes
          const ticketsConvertidos = resposta.data.map(converterTicketAPIParaComponente);
          setTickets(ticketsConvertidos);
          setTotal(resposta.total);
          setPagina(resposta.pagina);
          setLimite(resposta.limite);
          console.log(
            `✅ ${ticketsConvertidos.length} tickets carregados (total: ${resposta.total})`,
          );
        } else {
          setErro('Falha ao carregar tickets');
        }
      } catch (error: any) {
        console.error('❌ Erro ao carregar tickets:', error);
        setErro(error.response?.data?.message || error.message || 'Erro ao carregar tickets');
      } finally {
        setLoading(false);
      }
    },
    [empresaId, filtrosIniciais, limite, pagina],
  );

  /**
   * Atualiza o status de um ticket
   */
  const atualizarStatus = useCallback(
    async (ticketId: string, novoStatus: StatusTicket, atendenteId?: string) => {
      try {
        console.log(`🔄 Atualizando status do ticket ${ticketId} para ${novoStatus}`);

        const resposta = await ticketsService.atualizarStatus(ticketId, empresaId, {
          status: novoStatus,
          atendenteId,
        });

        if (resposta.success) {
          // Converter e atualizar o ticket na lista local
          const ticketConvertido = converterTicketAPIParaComponente(resposta.data);
          setTickets((prev) => prev.map((t) => (t.id === ticketId ? ticketConvertido : t)));
          console.log('✅ Status do ticket atualizado com sucesso');
          return ticketConvertido;
        }
      } catch (error: any) {
        console.error('❌ Erro ao atualizar status do ticket:', error);
        throw error;
      }
    },
    [empresaId],
  );

  /**
   * Atualiza a prioridade de um ticket
   */
  const atualizarPrioridade = useCallback(
    async (ticketId: string, novaPrioridade: PrioridadeTicket) => {
      try {
        console.log(`🔄 Atualizando prioridade do ticket ${ticketId} para ${novaPrioridade}`);

        const resposta = await ticketsService.atualizarPrioridade(ticketId, empresaId, {
          prioridade: novaPrioridade,
        });

        if (resposta.success) {
          // Converter e atualizar o ticket na lista local
          const ticketConvertido = converterTicketAPIParaComponente(resposta.data);
          setTickets((prev) => prev.map((t) => (t.id === ticketId ? ticketConvertido : t)));
          console.log('✅ Prioridade do ticket atualizada com sucesso');
          return ticketConvertido;
        }
      } catch (error: any) {
        console.error('❌ Erro ao atualizar prioridade do ticket:', error);
        throw error;
      }
    },
    [empresaId],
  );

  /**
   * Escalona um ticket
   */
  const escalarTicket = useCallback(
    async (
      ticketId: string,
      dados: Omit<EscalarTicketDto, 'level'> & { level: NivelAtendimentoTicket },
    ) => {
      try {
        console.log(`⬆️ Escalando ticket ${ticketId} para ${dados.level}`);

        const resposta = await ticketsService.escalar(ticketId, empresaId, dados);

        if (resposta.success) {
          const ticketConvertido = converterTicketAPIParaComponente(resposta.data);
          setTickets((prev) => prev.map((t) => (t.id === ticketId ? ticketConvertido : t)));
          console.log('✅ Ticket escalonado com sucesso');
          return ticketConvertido;
        }
      } catch (error: any) {
        console.error('❌ Erro ao escalonar ticket:', error);
        throw error;
      }
    },
    [empresaId],
  );

  /**
   * Remove escalonamento de um ticket
   */
  const desescalarTicket = useCallback(
    async (ticketId: string, dados?: DesescalarTicketDto) => {
      try {
        console.log(`⬇️ Desescalonando ticket ${ticketId}`);

        const resposta = await ticketsService.desescalar(ticketId, empresaId, dados || {});

        if (resposta.success) {
          const ticketConvertido = converterTicketAPIParaComponente(resposta.data);
          setTickets((prev) => prev.map((t) => (t.id === ticketId ? ticketConvertido : t)));
          console.log('✅ Ticket desescalonado com sucesso');
          return ticketConvertido;
        }
      } catch (error: any) {
        console.error('❌ Erro ao desescalonar ticket:', error);
        throw error;
      }
    },
    [empresaId],
  );

  /**
   * Reatribui ticket para fila/atendente e ajusta nível/severidade
   */
  const reatribuirTicket = useCallback(
    async (
      ticketId: string,
      dados: Omit<ReatribuirTicketDto, 'assignedLevel' | 'severity'> & {
        assignedLevel?: NivelAtendimentoTicket;
        severity?: SeveridadeTicket;
      },
    ) => {
      try {
        console.log(`📌 Reatribuindo ticket ${ticketId}`);

        const resposta = await ticketsService.reatribuir(ticketId, empresaId, dados);

        if (resposta.success) {
          const ticketConvertido = converterTicketAPIParaComponente(resposta.data);
          setTickets((prev) => prev.map((t) => (t.id === ticketId ? ticketConvertido : t)));
          console.log('✅ Ticket reatribuído com sucesso');
          return ticketConvertido;
        }
      } catch (error: any) {
        console.error('❌ Erro ao reatribuir ticket:', error);
        throw error;
      }
    },
    [empresaId],
  );

  /**
   * Atribui um atendente a um ticket
   */
  const atribuirAtendente = useCallback(
    async (ticketId: string, atendenteId: string) => {
      try {
        console.log(`🔄 Atribuindo atendente ${atendenteId} ao ticket ${ticketId}`);

        const resposta = await ticketsService.atribuirAtendente(ticketId, empresaId, {
          atendenteId,
        });

        if (resposta.success) {
          // Converter e atualizar o ticket na lista local
          const ticketConvertido = converterTicketAPIParaComponente(resposta.data);
          setTickets((prev) => prev.map((t) => (t.id === ticketId ? ticketConvertido : t)));
          console.log('✅ Atendente atribuído com sucesso');
          return ticketConvertido;
        }
      } catch (error: any) {
        console.error('❌ Erro ao atribuir atendente ao ticket:', error);
        throw error;
      }
    },
    [empresaId],
  );

  /**
   * Busca um ticket específico por ID
   */
  const buscarTicket = useCallback(
    async (ticketId: string) => {
      try {
        console.log(`🔍 Buscando ticket ${ticketId}`);

        const resposta = await ticketsService.buscar(ticketId, empresaId);

        if (resposta.success) {
          console.log('✅ Ticket encontrado:', resposta.data);
          return resposta.data;
        }
      } catch (error: any) {
        console.error('❌ Erro ao buscar ticket:', error);
        throw error;
      }
    },
    [empresaId],
  );

  /**
   * Recarrega a lista de tickets
   */
  const recarregar = useCallback(() => {
    carregarTickets();
  }, [carregarTickets]);

  /**
   * Carrega tickets automaticamente quando o empresaId muda
   */
  useEffect(() => {
    if (empresaId) {
      carregarTickets();
    }
  }, [empresaId, carregarTickets]);

  return {
    tickets,
    loading,
    erro,
    total,
    pagina,
    limite,
    carregarTickets,
    atualizarStatus,
    atualizarPrioridade,
    atribuirAtendente,
    buscarTicket,
    recarregar,
    escalarTicket,
    desescalarTicket,
    reatribuirTicket,
  };
}
