import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import {
  filaService,
  Fila,
  FilaAtendente,
  CreateFilaDto,
  UpdateFilaDto,
  AddAtendenteFilaDto,
  AtribuirTicketDto,
  MetricasFila,
} from '../services/filaService';

/**
 * State da Fila Store
 */
interface FilaState {
  // State
  filas: Fila[];
  filaSelecionada: Fila | null;
  loading: boolean;
  error: string | null;
  metricas: Record<string, MetricasFila>; // { filaId: metricas }

  // Actions - CRUD Filas
  listarFilas: (empresaId: string) => Promise<void>;
  buscarFila: (id: string, empresaId: string) => Promise<void>;
  criarFila: (empresaId: string, dto: CreateFilaDto) => Promise<Fila>;
  atualizarFila: (
    id: string,
    empresaId: string,
    dto: UpdateFilaDto,
  ) => Promise<Fila>;
  removerFila: (id: string, empresaId: string) => Promise<void>;

  // Actions - Gestão de Atendentes
  adicionarAtendente: (
    filaId: string,
    empresaId: string,
    dto: AddAtendenteFilaDto,
  ) => Promise<FilaAtendente>;
  removerAtendente: (
    filaId: string,
    atendenteId: string,
    empresaId: string,
  ) => Promise<void>;
  listarAtendentes: (
    filaId: string,
    empresaId: string,
  ) => Promise<FilaAtendente[]>;

  // Actions - Distribuição de Tickets
  distribuirTicket: (
    empresaId: string,
    dto: AtribuirTicketDto,
  ) => Promise<{ ticket: any; atendente: any }>;

  // Actions - Métricas
  obterMetricas: (filaId: string, empresaId: string) => Promise<void>;

  // Actions - Seleção
  selecionarFila: (fila: Fila | null) => void;

  // Actions - Reset
  resetError: () => void;
  resetStore: () => void;
}

/**
 * Fila Store
 * Gerencia estado das filas de atendimento
 */
export const useFilaStore = create<FilaState>()(
  devtools(
    persist(
      (set, get) => ({
        // State inicial
        filas: [],
        filaSelecionada: null,
        loading: false,
        error: null,
        metricas: {},

        // CRUD Filas
        listarFilas: async (empresaId: string) => {
          try {
            set({ loading: true, error: null });
            const filas = await filaService.listar(empresaId);
            set({ filas, loading: false });
          } catch (err: unknown) {
            const errorMessage =
              err instanceof Error ? err.message : 'Erro ao listar filas';
            set({ error: errorMessage, loading: false });
            throw err;
          }
        },

        buscarFila: async (id: string, empresaId: string) => {
          try {
            set({ loading: true, error: null });
            const fila = await filaService.buscarPorId(id, empresaId);
            set({ filaSelecionada: fila, loading: false });
          } catch (err: unknown) {
            const errorMessage =
              err instanceof Error ? err.message : 'Erro ao buscar fila';
            set({ error: errorMessage, loading: false });
            throw err;
          }
        },

        criarFila: async (empresaId: string, dto: CreateFilaDto) => {
          try {
            set({ loading: true, error: null });
            const novaFila = await filaService.criar(empresaId, dto);

            // Adicionar à lista local
            set((state) => ({
              filas: [...state.filas, novaFila].sort((a, b) => a.ordem - b.ordem),
              loading: false,
            }));

            return novaFila;
          } catch (err: unknown) {
            const errorMessage =
              err instanceof Error ? err.message : 'Erro ao criar fila';
            set({ error: errorMessage, loading: false });
            throw err;
          }
        },

        atualizarFila: async (
          id: string,
          empresaId: string,
          dto: UpdateFilaDto,
        ) => {
          try {
            set({ loading: true, error: null });
            const filaAtualizada = await filaService.atualizar(
              id,
              empresaId,
              dto,
            );

            // Atualizar na lista local
            set((state) => ({
              filas: state.filas
                .map((f) => (f.id === id ? filaAtualizada : f))
                .sort((a, b) => a.ordem - b.ordem),
              filaSelecionada:
                state.filaSelecionada?.id === id
                  ? filaAtualizada
                  : state.filaSelecionada,
              loading: false,
            }));

            return filaAtualizada;
          } catch (err: unknown) {
            const errorMessage =
              err instanceof Error ? err.message : 'Erro ao atualizar fila';
            set({ error: errorMessage, loading: false });
            throw err;
          }
        },

        removerFila: async (id: string, empresaId: string) => {
          try {
            set({ loading: true, error: null });
            await filaService.remover(id, empresaId);

            // Remover da lista local
            set((state) => ({
              filas: state.filas.filter((f) => f.id !== id),
              filaSelecionada:
                state.filaSelecionada?.id === id
                  ? null
                  : state.filaSelecionada,
              loading: false,
            }));
          } catch (err: unknown) {
            const errorMessage =
              err instanceof Error ? err.message : 'Erro ao remover fila';
            set({ error: errorMessage, loading: false });
            throw err;
          }
        },

        // Gestão de Atendentes
        adicionarAtendente: async (
          filaId: string,
          empresaId: string,
          dto: AddAtendenteFilaDto,
        ) => {
          try {
            set({ loading: true, error: null });
            const filaAtendente = await filaService.adicionarAtendente(
              filaId,
              empresaId,
              dto,
            );

            // Recarregar fila para atualizar lista de atendentes
            const filaAtualizada = await filaService.buscarPorId(
              filaId,
              empresaId,
            );

            set((state) => ({
              filas: state.filas.map((f) =>
                f.id === filaId ? filaAtualizada : f,
              ),
              filaSelecionada:
                state.filaSelecionada?.id === filaId
                  ? filaAtualizada
                  : state.filaSelecionada,
              loading: false,
            }));

            return filaAtendente;
          } catch (err: unknown) {
            const errorMessage =
              err instanceof Error
                ? err.message
                : 'Erro ao adicionar atendente';
            set({ error: errorMessage, loading: false });
            throw err;
          }
        },

        removerAtendente: async (
          filaId: string,
          atendenteId: string,
          empresaId: string,
        ) => {
          try {
            set({ loading: true, error: null });
            await filaService.removerAtendente(
              filaId,
              atendenteId,
              empresaId,
            );

            // Recarregar fila para atualizar lista de atendentes
            const filaAtualizada = await filaService.buscarPorId(
              filaId,
              empresaId,
            );

            set((state) => ({
              filas: state.filas.map((f) =>
                f.id === filaId ? filaAtualizada : f,
              ),
              filaSelecionada:
                state.filaSelecionada?.id === filaId
                  ? filaAtualizada
                  : state.filaSelecionada,
              loading: false,
            }));
          } catch (err: unknown) {
            const errorMessage =
              err instanceof Error ? err.message : 'Erro ao remover atendente';
            set({ error: errorMessage, loading: false });
            throw err;
          }
        },

        listarAtendentes: async (filaId: string, empresaId: string) => {
          try {
            set({ loading: true, error: null });
            const atendentes = await filaService.listarAtendentes(
              filaId,
              empresaId,
            );
            set({ loading: false });
            return atendentes;
          } catch (err: unknown) {
            const errorMessage =
              err instanceof Error
                ? err.message
                : 'Erro ao listar atendentes';
            set({ error: errorMessage, loading: false });
            throw err;
          }
        },

        // Distribuição de Tickets
        distribuirTicket: async (
          empresaId: string,
          dto: AtribuirTicketDto,
        ) => {
          try {
            set({ loading: true, error: null });
            const resultado = await filaService.distribuirTicket(
              empresaId,
              dto,
            );
            set({ loading: false });
            return resultado;
          } catch (err: unknown) {
            const errorMessage =
              err instanceof Error ? err.message : 'Erro ao distribuir ticket';
            set({ error: errorMessage, loading: false });
            throw err;
          }
        },

        // Métricas
        obterMetricas: async (filaId: string, empresaId: string) => {
          try {
            set({ loading: true, error: null });
            const metricas = await filaService.obterMetricas(
              filaId,
              empresaId,
            );

            set((state) => ({
              metricas: {
                ...state.metricas,
                [filaId]: metricas,
              },
              loading: false,
            }));
          } catch (err: unknown) {
            const errorMessage =
              err instanceof Error ? err.message : 'Erro ao obter métricas';
            set({ error: errorMessage, loading: false });
            throw err;
          }
        },

        // Seleção
        selecionarFila: (fila: Fila | null) => {
          set({ filaSelecionada: fila });
        },

        // Reset
        resetError: () => {
          set({ error: null });
        },

        resetStore: () => {
          set({
            filas: [],
            filaSelecionada: null,
            loading: false,
            error: null,
            metricas: {},
          });
        },
      }),
      {
        name: 'fila-storage',
        partialize: (state) => ({
          // Persistir apenas filaSelecionada (não persistir filas - sempre buscar do backend)
          filaSelecionada: state.filaSelecionada,
        }),
      },
    ),
    {
      name: 'FilaStore',
    },
  ),
);

/**
 * Selectors individuais para performance
 */
export const useFilas = () => useFilaStore((state) => state.filas);
export const useFilaSelecionada = () =>
  useFilaStore((state) => state.filaSelecionada);
export const useFilaLoading = () => useFilaStore((state) => state.loading);
export const useFilaError = () => useFilaStore((state) => state.error);
export const useFilaMetricas = () => useFilaStore((state) => state.metricas);
