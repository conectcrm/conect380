/**
 * 🎯 Seletores Zustand - Atendimento Store
 *
 * Seletores reutilizáveis para otimizar re-renders.
 * Usar com shallow comparison para evitar re-renders desnecessários.
 *
 * Exemplo de uso:
 * ```typescript
 * import { selectTicketSelecionado } from './atendimentoSelectors';
 * import { shallow } from 'zustand/shallow';
 *
 * const ticketSelecionado = useAtendimentoStore(selectTicketSelecionado);
 * // ou com shallow
 * const { ticket, cliente } = useAtendimentoStore(
 *   selectTicketECliente,
 *   shallow
 * );
 * ```
 */

import { AtendimentoStore } from './atendimentoStore';

// ===== SELETORES DE ESTADO =====

/**
 * Seleciona apenas o ticket selecionado
 * Útil para componentes que só precisam do ticket atual
 */
export const selectTicketSelecionado = (state: AtendimentoStore) => state.ticketSelecionado;

/**
 * Seleciona apenas o cliente selecionado
 */
export const selectClienteSelecionado = (state: AtendimentoStore) => state.clienteSelecionado;

/**
 * Seleciona lista de tickets
 */
export const selectTickets = (state: AtendimentoStore) => state.tickets;

/**
 * Seleciona estados de loading de tickets
 */
export const selectTicketsLoading = (state: AtendimentoStore) => ({
  ticketsLoading: state.ticketsLoading,
  ticketsError: state.ticketsError,
});

/**
 * Seleciona ticket e cliente juntos (para componente que usa ambos)
 */
export const selectTicketECliente = (state: AtendimentoStore) => ({
  ticketSelecionado: state.ticketSelecionado,
  clienteSelecionado: state.clienteSelecionado,
});

/**
 * Seleciona mensagens de um ticket específico
 */
export const selectMensagensDoTicket = (ticketId: string) => (state: AtendimentoStore) => ({
  mensagens: state.mensagens[ticketId] || [],
  loading: state.mensagensLoading[ticketId] || false,
  error: state.mensagensError[ticketId] || null,
});

/**
 * Seleciona apenas o histórico do cliente
 */
export const selectHistoricoCliente = (state: AtendimentoStore) => state.historicoCliente;

// ===== SELETORES DE AÇÕES =====

/**
 * Seleciona apenas ações de ticket (sem estado)
 * Útil para evitar re-renders quando apenas funções são necessárias
 */
export const selectTicketActions = (state: AtendimentoStore) => ({
  selecionarTicket: state.selecionarTicket,
  adicionarTicket: state.adicionarTicket,
  atualizarTicket: state.atualizarTicket,
  removerTicket: state.removerTicket,
  setTickets: state.setTickets,
  setTicketsLoading: state.setTicketsLoading,
  setTicketsError: state.setTicketsError,
});

/**
 * Seleciona apenas ações de mensagens
 */
export const selectMensagensActions = (state: AtendimentoStore) => ({
  setMensagens: state.setMensagens,
  adicionarMensagem: state.adicionarMensagem,
  atualizarMensagem: state.atualizarMensagem,
  limparMensagens: state.limparMensagens,
  setMensagensLoading: state.setMensagensLoading,
  setMensagensError: state.setMensagensError,
});

/**
 * Seleciona apenas ações de cliente
 */
export const selectClienteActions = (state: AtendimentoStore) => ({
  setClienteSelecionado: state.setClienteSelecionado,
  setHistoricoCliente: state.setHistoricoCliente,
});

/**
 * Seleciona ações de reset
 */
export const selectResetActions = (state: AtendimentoStore) => ({
  resetStore: state.resetStore,
  resetTickets: state.resetTickets,
});

// ===== SELETORES DERIVADOS (COMPUTED) =====

/**
 * Seleciona tickets filtrados por status (exemplo de seletor derivado)
 */
export const selectTicketsPorStatus = (status: string) => (state: AtendimentoStore) =>
  state.tickets.filter((t) => t.status === status);

/**
 * Conta total de tickets
 */
export const selectTotalTickets = (state: AtendimentoStore) => state.tickets.length;

/**
 * Verifica se há ticket selecionado
 */
export const selectTemTicketSelecionado = (state: AtendimentoStore) =>
  state.ticketSelecionado !== null;

/**
 * Pega ID do ticket selecionado (ou null)
 */
export const selectTicketSelecionadoId = (state: AtendimentoStore) =>
  state.ticketSelecionado?.id || null;

/**
 * Verifica se está carregando tickets
 */
export const selectIsLoadingTickets = (state: AtendimentoStore) => state.ticketsLoading;

/**
 * Verifica se há erro ao carregar tickets
 */
export const selectHasErrorTickets = (state: AtendimentoStore) => state.ticketsError !== null;

// ===== SELETORES COMPOSTOS (para casos específicos) =====

/**
 * Seleciona tudo necessário para o componente de lista de tickets
 */
export const selectListaTicketsData = (state: AtendimentoStore) => ({
  tickets: state.tickets,
  loading: state.ticketsLoading,
  error: state.ticketsError,
  ticketSelecionado: state.ticketSelecionado,
  selecionarTicket: state.selecionarTicket,
});

/**
 * Seleciona tudo necessário para o componente de chat
 */
export const selectChatData = (ticketId: string) => (state: AtendimentoStore) => ({
  ticket: state.ticketSelecionado,
  mensagens: state.mensagens[ticketId] || [],
  loading: state.mensagensLoading[ticketId] || false,
  error: state.mensagensError[ticketId] || null,
  adicionarMensagem: state.adicionarMensagem,
});

/**
 * Seleciona tudo necessário para o painel do cliente
 */
export const selectClientePanelData = (state: AtendimentoStore) => ({
  cliente: state.clienteSelecionado,
  historico: state.historicoCliente,
  setHistoricoCliente: state.setHistoricoCliente,
});
