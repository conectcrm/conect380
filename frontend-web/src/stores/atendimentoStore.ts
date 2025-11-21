/**
 * 🏪 Store Centralizada de Atendimento (Zustand)
 * 
 * Gerencia o estado global do módulo de atendimento:
 * - Tickets (lista, selecionado, loading, error)
 * - Mensagens (por ticket)
 * - Cliente selecionado
 * - Histórico do cliente
 * 
 * Benefícios:
 * - Estado sincronizado entre todos os componentes
 * - Sem duplicação de estado
 * - Performance otimizada (menos re-renders)
 * - Fácil de testar
 * - DevTools para debug
 */

import { create } from 'zustand';
import { persist, createJSONStorage, devtools } from 'zustand/middleware';
import { Ticket, Mensagem } from '../features/atendimento/omnichannel/types';

// ===== INTERFACES =====

export interface AtendimentoStore {
  // ===== ESTADO - TICKETS =====
  tickets: Ticket[];
  ticketsLoading: boolean;
  ticketsError: string | null;
  ticketSelecionado: Ticket | null;

  // ===== ESTADO - MENSAGENS (por ticket) =====
  mensagens: Record<string, Mensagem[]>; // key: ticketId
  mensagensLoading: Record<string, boolean>;
  mensagensError: Record<string, string | null>;

  // ===== ESTADO - CLIENTE =====
  clienteSelecionado: any | null; // Tipo genérico por enquanto
  historicoCliente: any[];

  // ===== AÇÕES - TICKETS =====
  setTickets: (tickets: Ticket[]) => void;
  setTicketsLoading: (loading: boolean) => void;
  setTicketsError: (error: string | null) => void;

  selecionarTicket: (ticket: Ticket | null) => void;
  adicionarTicket: (ticket: Ticket) => void;
  atualizarTicket: (ticketId: string, dados: Partial<Ticket>) => void;
  removerTicket: (ticketId: string) => void;

  // ===== AÇÕES - MENSAGENS =====
  setMensagens: (ticketId: string, mensagens: Mensagem[]) => void;
  adicionarMensagem: (ticketId: string, mensagem: Mensagem) => void;
  atualizarMensagem: (ticketId: string, mensagemId: string, dados: Partial<Mensagem>) => void;
  setMensagensLoading: (ticketId: string, loading: boolean) => void;
  setMensagensError: (ticketId: string, error: string | null) => void;
  limparMensagens: (ticketId: string) => void;

  // ===== AÇÕES - CLIENTE =====
  setClienteSelecionado: (cliente: any | null) => void;
  setHistoricoCliente: (historico: any[]) => void;

  // ===== AÇÕES - RESET =====
  resetStore: () => void;
  resetTickets: () => void;
}

// ===== ESTADO INICIAL =====

const stateInicial = {
  // Tickets
  tickets: [],
  ticketsLoading: false,
  ticketsError: null,
  ticketSelecionado: null,

  // Mensagens
  mensagens: {},
  mensagensLoading: {},
  mensagensError: {},

  // Cliente
  clienteSelecionado: null,
  historicoCliente: [],
};

const fallbackStorage: Storage = (() => {
  let memory: Record<string, string> = {};

  return {
    getItem: (key: string) => (key in memory ? memory[key] : null),
    setItem: (key: string, value: string) => {
      memory[key] = value;
    },
    removeItem: (key: string) => {
      delete memory[key];
    },
    clear: () => {
      memory = {};
    },
    key: (index: number) => Object.keys(memory)[index] ?? null,
    get length() {
      return Object.keys(memory).length;
    },
  };
})();

const getBrowserStorage = (): Storage => {
  if (typeof window !== 'undefined' && window.localStorage) {
    return window.localStorage;
  }

  if (typeof globalThis !== 'undefined') {
    const globalWithStorage = globalThis as typeof globalThis & { localStorage?: Storage };
    if (globalWithStorage.localStorage) {
      return globalWithStorage.localStorage;
    }
  }

  return fallbackStorage;
};

const persistentStorageProxy: Storage = {
  getItem: (key: string) => getBrowserStorage().getItem(key),
  setItem: (key: string, value: string) => getBrowserStorage().setItem(key, value),
  removeItem: (key: string) => getBrowserStorage().removeItem(key),
  clear: () => getBrowserStorage().clear(),
  key: (index: number) => getBrowserStorage().key(index),
  get length() {
    return getBrowserStorage().length;
  },
};

// ===== STORE =====

export const useAtendimentoStore = create<AtendimentoStore>()(
  devtools(
    persist(
      (set, get) => ({
        ...stateInicial,

        // ===== TICKETS =====

        setTickets: (tickets) => set({ tickets }, false, 'setTickets'),

        setTicketsLoading: (loading) => set({ ticketsLoading: loading }, false, 'setTicketsLoading'),

        setTicketsError: (error) => set({ ticketsError: error }, false, 'setTicketsError'),

        selecionarTicket: (ticket) => {
          set({ ticketSelecionado: ticket }, false, 'selecionarTicket');

          // Se selecionou um ticket, também selecionar o cliente
          if (ticket?.contato) {
            set({ clienteSelecionado: ticket.contato }, false, 'setClienteSelecionado');
          }
        },

        adicionarTicket: (ticket) => set((state) => ({
          tickets: [ticket, ...state.tickets],
        }), false, 'adicionarTicket'),

        atualizarTicket: (ticketId, dados) => set((state) => {
          const ticketsAtualizados = state.tickets.map(t =>
            t.id === ticketId ? { ...t, ...dados } : t
          );

          const ticketSelecionadoAtualizado =
            state.ticketSelecionado?.id === ticketId
              ? { ...state.ticketSelecionado, ...dados }
              : state.ticketSelecionado;

          return {
            tickets: ticketsAtualizados,
            ticketSelecionado: ticketSelecionadoAtualizado,
          };
        }, false, 'atualizarTicket'),

        removerTicket: (ticketId) => set((state) => ({
          tickets: state.tickets.filter(t => t.id !== ticketId),
          ticketSelecionado:
            state.ticketSelecionado?.id === ticketId
              ? null
              : state.ticketSelecionado,
        }), false, 'removerTicket'),

        // ===== MENSAGENS =====

        setMensagens: (ticketId, mensagens) => set((state) => ({
          mensagens: {
            ...state.mensagens,
            [ticketId]: mensagens,
          },
        }), false, 'setMensagens'),

        adicionarMensagem: (ticketId, mensagem) => set((state) => {
          const mensagensExistentes = state.mensagens[ticketId] || [];

          // Evitar duplicatas (verificar por ID)
          const jaExiste = mensagensExistentes.some(m => m.id === mensagem.id);
          if (jaExiste) {
            console.warn(`⚠️ Mensagem ${mensagem.id} já existe no ticket ${ticketId}, ignorando duplicata`);
            return state;
          }

          return {
            mensagens: {
              ...state.mensagens,
              [ticketId]: [...mensagensExistentes, mensagem],
            },
          };
        }, false, 'adicionarMensagem'),

        atualizarMensagem: (ticketId, mensagemId, dados) => set((state) => {
          const mensagensExistentes = state.mensagens[ticketId] || [];

          const mensagensAtualizadas = mensagensExistentes.map(m =>
            m.id === mensagemId ? { ...m, ...dados } : m
          );

          return {
            mensagens: {
              ...state.mensagens,
              [ticketId]: mensagensAtualizadas,
            },
          };
        }, false, 'atualizarMensagem'),

        setMensagensLoading: (ticketId, loading) => set((state) => ({
          mensagensLoading: {
            ...state.mensagensLoading,
            [ticketId]: loading,
          },
        }), false, 'setMensagensLoading'),

        setMensagensError: (ticketId, error) => set((state) => ({
          mensagensError: {
            ...state.mensagensError,
            [ticketId]: error,
          },
        }), false, 'setMensagensError'),

        limparMensagens: (ticketId) => set((state) => {
          const novasMensagens = { ...state.mensagens };
          delete novasMensagens[ticketId];

          const novoLoading = { ...state.mensagensLoading };
          delete novoLoading[ticketId];

          const novoError = { ...state.mensagensError };
          delete novoError[ticketId];

          return {
            mensagens: novasMensagens,
            mensagensLoading: novoLoading,
            mensagensError: novoError,
          };
        }, false, 'limparMensagens'),

        // ===== CLIENTE =====

        setClienteSelecionado: (cliente) => set({ clienteSelecionado: cliente }, false, 'setClienteSelecionado'),

        setHistoricoCliente: (historico) => set({ historicoCliente: historico }, false, 'setHistoricoCliente'),

        // ===== RESET =====

        resetStore: () => set(stateInicial, false, 'resetStore'),

        resetTickets: () => set({
          tickets: [],
          ticketsLoading: false,
          ticketsError: null,
          ticketSelecionado: null,
        }, false, 'resetTickets'),
      }),
      {
        name: 'conectcrm-atendimento-storage', // Nome da chave no localStorage
        storage: createJSONStorage(() => persistentStorageProxy),
        partialize: (state) => ({
          // ✅ PERSISTIR: Ticket selecionado (mantém contexto após F5)
          ticketSelecionado: state.ticketSelecionado,

          // ✅ PERSISTIR: Cliente selecionado (útil para contexto)
          clienteSelecionado: state.clienteSelecionado,

          // ❌ NÃO PERSISTIR: Lista de tickets (pode ficar desatualizada)
          // tickets: não incluído

          // ❌ NÃO PERSISTIR: Mensagens (muitos dados, melhor buscar do servidor)
          // mensagens: não incluído

          // ❌ NÃO PERSISTIR: Estados de loading/error (efêmeros)
          // ticketsLoading, ticketsError, etc: não incluídos
        }),
        version: 1, // Versão do schema (incrementar se mudar estrutura)
      },
    ),
    {
      name: 'AtendimentoStore', // Nome exibido no Redux DevTools
      enabled: process.env.NODE_ENV === 'development', // Apenas em dev
    }
  )
);

// ===== SELETORES (Helpers) =====

/**
 * Pegar mensagens de um ticket específico
 */
export const getMensagensDoTicket = (ticketId: string): Mensagem[] => {
  const state = useAtendimentoStore.getState();
  return state.mensagens[ticketId] || [];
};

/**
 * Verificar se um ticket está carregando mensagens
 */
export const isTicketLoadingMensagens = (ticketId: string): boolean => {
  const state = useAtendimentoStore.getState();
  return state.mensagensLoading[ticketId] || false;
};

/**
 * Pegar erro de mensagens de um ticket
 */
export const getMensagensError = (ticketId: string): string | null => {
  const state = useAtendimentoStore.getState();
  return state.mensagensError[ticketId] || null;
};

/**
 * Contar total de mensagens não lidas
 */
export const getTotalMensagensNaoLidas = (): number => {
  const state = useAtendimentoStore.getState();
  // Contar mensagens não lidas dos tickets
  return state.tickets.reduce((total, ticket) => {
    // Usar campo correto do tipo Ticket (se existir)
    const naoLidas = (ticket as any).mensagensNaoLidas || 0;
    return total + naoLidas;
  }, 0);
};

/**
 * Buscar ticket por ID
 */
export const getTicketById = (ticketId: string): Ticket | undefined => {
  const state = useAtendimentoStore.getState();
  return state.tickets.find(t => t.id === ticketId);
};
