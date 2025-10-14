/**
 * 🎯 useAtendimentos - Hook para gerenciar tickets de atendimento
 * 
 * Funcionalidades:
 * - Listagem com filtros
 * - Seleção de ticket
 * - Criação de novo ticket
 * - Transferência
 * - Encerramento
 * - Reabertura
 * - Auto-refresh
 */

import { useState, useEffect, useCallback } from 'react';
import {
  atendimentoService,
  ListarTicketsParams
} from '../services/atendimentoService';
import { Ticket, StatusAtendimento, CanalTipo } from '../types';
import { NovoAtendimentoData } from '../modals/NovoAtendimentoModal';
import { TransferenciaData } from '../modals/TransferirAtendimentoModal';
import { EncerramentoData } from '../modals/EncerrarAtendimentoModal';

interface UseAtendimentosOptions {
  autoRefresh?: boolean;
  refreshInterval?: number; // em segundos
  filtroInicial?: ListarTicketsParams;
}

interface UseAtendimentosReturn {
  // Estado
  tickets: Ticket[];
  ticketSelecionado: Ticket | null;
  loading: boolean;
  error: string | null;
  totalTickets: number;
  paginaAtual: number;
  totalPaginas: number;

  // Filtros
  filtros: ListarTicketsParams;
  setFiltros: (filtros: ListarTicketsParams) => void;

  // Ações
  selecionarTicket: (ticketId: string) => void;
  criarTicket: (dados: NovoAtendimentoData) => Promise<Ticket>;
  transferirTicket: (ticketId: string, dados: TransferenciaData) => Promise<void>;
  encerrarTicket: (ticketId: string, dados: EncerramentoData) => Promise<void>;
  reabrirTicket: (ticketId: string) => Promise<void>;
  recarregar: () => Promise<void>;

  // Navegação
  irParaPagina: (pagina: number) => void;
}

export const useAtendimentos = (
  options: UseAtendimentosOptions = {}
): UseAtendimentosReturn => {
  const {
    autoRefresh = false,
    refreshInterval = 30, // 30 segundos padrão
    filtroInicial = { status: 'aberto', page: 1, limit: 50 }
  } = options;

  // ===== ESTADO =====
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [ticketSelecionado, setTicketSelecionado] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalTickets, setTotalTickets] = useState(0);
  const [paginaAtual, setPaginaAtual] = useState(filtroInicial.page || 1);
  const [totalPaginas, setTotalPaginas] = useState(0);
  const [filtros, setFiltros] = useState<ListarTicketsParams>(filtroInicial);

  // ===== CARREGAR TICKETS =====
  const carregarTickets = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await atendimentoService.listarTickets({
        ...filtros,
        page: paginaAtual
      });

      setTickets(response.data);
      setTotalTickets(response.total);
      setTotalPaginas(response.totalPages);

      // Se tinha um ticket selecionado, atualizar com dados novos
      if (ticketSelecionado) {
        const ticketAtualizado = response.data.find(t => t.id === ticketSelecionado.id);
        if (ticketAtualizado) {
          setTicketSelecionado(ticketAtualizado);
        }
      }

      console.log(`✅ ${response.data.length} tickets carregados`);
    } catch (err: any) {
      const mensagemErro = err.response?.data?.message || 'Erro ao carregar tickets';
      setError(mensagemErro);
      console.error('❌ Erro ao carregar tickets:', err);
    } finally {
      setLoading(false);
    }
  }, [filtros, paginaAtual, ticketSelecionado]);

  // ===== SELECIONAR TICKET =====
  const selecionarTicket = useCallback(async (ticketId: string) => {
    try {
      // Buscar ticket completo com todos os dados
      const ticket = await atendimentoService.buscarTicket(ticketId);
      setTicketSelecionado(ticket);
      console.log('✅ Ticket selecionado:', ticket.numero);
    } catch (err: any) {
      console.error('❌ Erro ao selecionar ticket:', err);
      setError('Erro ao carregar detalhes do ticket');
    }
  }, []);

  // ===== CRIAR TICKET =====
  const criarTicket = useCallback(async (dados: NovoAtendimentoData): Promise<Ticket> => {
    try {
      setLoading(true);
      const response = await atendimentoService.criarTicket(dados);

      // Recarregar lista
      await carregarTickets();

      // Selecionar o novo ticket
      setTicketSelecionado(response.ticket);

      console.log('✅ Ticket criado com sucesso:', response.ticket.numero);
      return response.ticket;
    } catch (err: any) {
      const mensagemErro = err.response?.data?.message || 'Erro ao criar ticket';
      setError(mensagemErro);
      console.error('❌ Erro ao criar ticket:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [carregarTickets]);

  // ===== TRANSFERIR TICKET =====
  const transferirTicket = useCallback(async (
    ticketId: string,
    dados: TransferenciaData
  ): Promise<void> => {
    try {
      setLoading(true);
      await atendimentoService.transferirTicket(ticketId, dados);

      // Recarregar lista e ticket atual
      await carregarTickets();

      if (ticketSelecionado?.id === ticketId) {
        await selecionarTicket(ticketId);
      }

      console.log('✅ Ticket transferido com sucesso');
    } catch (err: any) {
      const mensagemErro = err.response?.data?.message || 'Erro ao transferir ticket';
      setError(mensagemErro);
      console.error('❌ Erro ao transferir ticket:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [carregarTickets, ticketSelecionado, selecionarTicket]);

  // ===== ENCERRAR TICKET =====
  const encerrarTicket = useCallback(async (
    ticketId: string,
    dados: EncerramentoData
  ): Promise<void> => {
    try {
      setLoading(true);
      await atendimentoService.encerrarTicket(ticketId, dados);

      // Recarregar lista
      await carregarTickets();

      // Limpar seleção se era o ticket atual
      if (ticketSelecionado?.id === ticketId) {
        setTicketSelecionado(null);
      }

      console.log('✅ Ticket encerrado com sucesso');
    } catch (err: any) {
      const mensagemErro = err.response?.data?.message || 'Erro ao encerrar ticket';
      setError(mensagemErro);
      console.error('❌ Erro ao encerrar ticket:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [carregarTickets, ticketSelecionado]);

  // ===== REABRIR TICKET =====
  const reabrirTicket = useCallback(async (ticketId: string): Promise<void> => {
    try {
      setLoading(true);
      const ticketReaberto = await atendimentoService.reabrirTicket(ticketId);

      // Recarregar lista
      await carregarTickets();

      // Selecionar ticket reaberto
      setTicketSelecionado(ticketReaberto);

      console.log('✅ Ticket reaberto com sucesso');
    } catch (err: any) {
      const mensagemErro = err.response?.data?.message || 'Erro ao reabrir ticket';
      setError(mensagemErro);
      console.error('❌ Erro ao reabrir ticket:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [carregarTickets]);

  // ===== RECARREGAR =====
  const recarregar = useCallback(async () => {
    await carregarTickets();
  }, [carregarTickets]);

  // ===== NAVEGAÇÃO =====
  const irParaPagina = useCallback((pagina: number) => {
    setPaginaAtual(pagina);
  }, []);

  // ===== ATUALIZAR FILTROS =====
  const atualizarFiltros = useCallback((novosFiltros: ListarTicketsParams) => {
    setFiltros(novosFiltros);
    setPaginaAtual(1); // Resetar para primeira página ao filtrar
  }, []);

  // ===== EFEITOS =====

  // Carregar tickets ao montar ou quando filtros/página mudarem
  useEffect(() => {
    carregarTickets();
  }, [carregarTickets]);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;

    const intervalo = setInterval(() => {
      console.log('🔄 Auto-refresh dos tickets...');
      carregarTickets();
    }, refreshInterval * 1000);

    return () => clearInterval(intervalo);
  }, [autoRefresh, refreshInterval, carregarTickets]);

  // ===== RETORNO =====
  return {
    // Estado
    tickets,
    ticketSelecionado,
    loading,
    error,
    totalTickets,
    paginaAtual,
    totalPaginas,

    // Filtros
    filtros,
    setFiltros: atualizarFiltros,

    // Ações
    selecionarTicket,
    criarTicket,
    transferirTicket,
    encerrarTicket,
    reabrirTicket,
    recarregar,

    // Navegação
    irParaPagina,
  };
};
