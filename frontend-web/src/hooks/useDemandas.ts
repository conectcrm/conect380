import { useState, useCallback } from 'react';
import {
  clientesService,
  Demanda,
  CreateDemandaDto,
  UpdateDemandaDto,
} from '../services/clientesService';

/**
 * Hook para gerenciar demandas de clientes
 *
 * Fornece funcionalidades completas de CRUD para demandas,
 * incluindo operações especiais como atribuir responsável,
 * alterar status, iniciar, concluir e cancelar demandas.
 */
export const useDemandas = () => {
  const [demandas, setDemandas] = useState<Demanda[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Carregar demandas por cliente, telefone ou ticket
   */
  const carregarDemandas = useCallback(
    async (params: {
      clienteId?: string;
      telefone?: string;
      ticketId?: string;
      empresaId?: string;
    }) => {
      try {
        setLoading(true);
        setError(null);

        let resultado: Demanda[] = [];

        if (params.clienteId) {
          resultado = await clientesService.listarDemandasCliente(
            params.clienteId,
            params.empresaId,
          );
        } else if (params.telefone) {
          resultado = await clientesService.listarDemandasPorTelefone(
            params.telefone,
            params.empresaId,
          );
        } else if (params.ticketId) {
          resultado = await clientesService.listarDemandasTicket(params.ticketId, params.empresaId);
        }

        setDemandas(resultado);
      } catch (err: unknown) {
        console.error('Erro ao carregar demandas:', err);
        const responseMessage = (err as any)?.response?.data?.message;
        const normalizedMessage = Array.isArray(responseMessage)
          ? responseMessage.join('. ')
          : responseMessage;
        const fallbackMessage = err instanceof Error ? err.message : undefined;
        setError(normalizedMessage || fallbackMessage || 'Erro ao carregar demandas');
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  /**
   * Carregar demandas por status
   */
  const carregarDemandaPorStatus = useCallback(
    async (
      status: 'aberta' | 'em_andamento' | 'aguardando' | 'concluida' | 'cancelada',
      empresaId?: string,
    ) => {
      try {
        setLoading(true);
        setError(null);

        const resultado = await clientesService.buscarDemandasPorStatus(status, empresaId);
        setDemandas(resultado);
      } catch (err: unknown) {
        console.error('Erro ao carregar demandas por status:', err);
        const responseMessage = (err as any)?.response?.data?.message;
        const normalizedMessage = Array.isArray(responseMessage)
          ? responseMessage.join('. ')
          : responseMessage;
        const fallbackMessage = err instanceof Error ? err.message : undefined;
        setError(normalizedMessage || fallbackMessage || 'Erro ao carregar demandas');
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  /**
   * Criar nova demanda
   */
  const criarDemanda = useCallback(
    async (demandaData: CreateDemandaDto): Promise<Demanda | null> => {
      try {
        setLoading(true);
        setError(null);

        const novaDemanda = await clientesService.criarDemanda(demandaData);
        setDemandas((prev) => [novaDemanda, ...prev]);

        return novaDemanda;
      } catch (err: unknown) {
        console.error('Erro ao criar demanda:', err);
        const responseMessage = (err as any)?.response?.data?.message;
        const normalizedMessage = Array.isArray(responseMessage)
          ? responseMessage.join('. ')
          : responseMessage;
        const fallbackMessage = err instanceof Error ? err.message : undefined;
        setError(normalizedMessage || fallbackMessage || 'Erro ao criar demanda');
        return null;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  /**
   * Atualizar demanda existente
   */
  const atualizarDemanda = useCallback(
    async (demandaId: string, demandaData: UpdateDemandaDto): Promise<Demanda | null> => {
      try {
        setLoading(true);
        setError(null);

        const demandaAtualizada = await clientesService.atualizarDemanda(demandaId, demandaData);
        setDemandas((prev) => prev.map((d) => (d.id === demandaId ? demandaAtualizada : d)));

        return demandaAtualizada;
      } catch (err: unknown) {
        console.error('Erro ao atualizar demanda:', err);
        const responseMessage = (err as any)?.response?.data?.message;
        const normalizedMessage = Array.isArray(responseMessage)
          ? responseMessage.join('. ')
          : responseMessage;
        const fallbackMessage = err instanceof Error ? err.message : undefined;
        setError(normalizedMessage || fallbackMessage || 'Erro ao atualizar demanda');
        return null;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  /**
   * Atribuir responsável à demanda
   */
  const atribuirResponsavel = useCallback(
    async (demandaId: string, responsavelId: string): Promise<Demanda | null> => {
      try {
        setLoading(true);
        setError(null);

        const demandaAtualizada = await clientesService.atribuirResponsavel(
          demandaId,
          responsavelId,
        );
        setDemandas((prev) => prev.map((d) => (d.id === demandaId ? demandaAtualizada : d)));

        return demandaAtualizada;
      } catch (err: unknown) {
        console.error('Erro ao atribuir responsável:', err);
        const responseMessage = (err as any)?.response?.data?.message;
        const normalizedMessage = Array.isArray(responseMessage)
          ? responseMessage.join('. ')
          : responseMessage;
        const fallbackMessage = err instanceof Error ? err.message : undefined;
        setError(normalizedMessage || fallbackMessage || 'Erro ao atribuir responsável');
        return null;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  /**
   * Alterar status da demanda
   */
  const alterarStatus = useCallback(
    async (
      demandaId: string,
      status: 'aberta' | 'em_andamento' | 'aguardando' | 'concluida' | 'cancelada',
    ): Promise<Demanda | null> => {
      try {
        setLoading(true);
        setError(null);

        const demandaAtualizada = await clientesService.alterarStatusDemanda(demandaId, status);
        setDemandas((prev) => prev.map((d) => (d.id === demandaId ? demandaAtualizada : d)));

        return demandaAtualizada;
      } catch (err: unknown) {
        console.error('Erro ao alterar status:', err);
        const responseMessage = (err as any)?.response?.data?.message;
        const normalizedMessage = Array.isArray(responseMessage)
          ? responseMessage.join('. ')
          : responseMessage;
        const fallbackMessage = err instanceof Error ? err.message : undefined;
        setError(normalizedMessage || fallbackMessage || 'Erro ao alterar status');
        return null;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  /**
   * Iniciar demanda (atalho para status em_andamento)
   */
  const iniciarDemanda = useCallback(async (demandaId: string): Promise<Demanda | null> => {
    try {
      setLoading(true);
      setError(null);

      const demandaAtualizada = await clientesService.iniciarDemanda(demandaId);
      setDemandas((prev) => prev.map((d) => (d.id === demandaId ? demandaAtualizada : d)));

      return demandaAtualizada;
    } catch (err: unknown) {
      console.error('Erro ao iniciar demanda:', err);
      const responseMessage = (err as any)?.response?.data?.message;
      const normalizedMessage = Array.isArray(responseMessage)
        ? responseMessage.join('. ')
        : responseMessage;
      const fallbackMessage = err instanceof Error ? err.message : undefined;
      setError(normalizedMessage || fallbackMessage || 'Erro ao iniciar demanda');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Concluir demanda
   */
  const concluirDemanda = useCallback(async (demandaId: string): Promise<Demanda | null> => {
    try {
      setLoading(true);
      setError(null);

      const demandaAtualizada = await clientesService.concluirDemanda(demandaId);
      setDemandas((prev) => prev.map((d) => (d.id === demandaId ? demandaAtualizada : d)));

      return demandaAtualizada;
    } catch (err: unknown) {
      console.error('Erro ao concluir demanda:', err);
      const responseMessage = (err as any)?.response?.data?.message;
      const normalizedMessage = Array.isArray(responseMessage)
        ? responseMessage.join('. ')
        : responseMessage;
      const fallbackMessage = err instanceof Error ? err.message : undefined;
      setError(normalizedMessage || fallbackMessage || 'Erro ao concluir demanda');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Cancelar demanda
   */
  const cancelarDemanda = useCallback(async (demandaId: string): Promise<Demanda | null> => {
    try {
      setLoading(true);
      setError(null);

      const demandaAtualizada = await clientesService.cancelarDemanda(demandaId);
      setDemandas((prev) => prev.map((d) => (d.id === demandaId ? demandaAtualizada : d)));

      return demandaAtualizada;
    } catch (err: unknown) {
      console.error('Erro ao cancelar demanda:', err);
      const responseMessage = (err as any)?.response?.data?.message;
      const normalizedMessage = Array.isArray(responseMessage)
        ? responseMessage.join('. ')
        : responseMessage;
      const fallbackMessage = err instanceof Error ? err.message : undefined;
      setError(normalizedMessage || fallbackMessage || 'Erro ao cancelar demanda');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Deletar demanda
   */
  const deletarDemanda = useCallback(async (demandaId: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      await clientesService.deletarDemanda(demandaId);
      setDemandas((prev) => prev.filter((d) => d.id !== demandaId));

      return true;
    } catch (err: unknown) {
      console.error('Erro ao deletar demanda:', err);
      const responseMessage = (err as any)?.response?.data?.message;
      const normalizedMessage = Array.isArray(responseMessage)
        ? responseMessage.join('. ')
        : responseMessage;
      const fallbackMessage = err instanceof Error ? err.message : undefined;
      setError(normalizedMessage || fallbackMessage || 'Erro ao deletar demanda');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Contar demandas de um cliente
   */
  const contarDemandas = useCallback(
    async (
      clienteId: string,
      empresaId?: string,
    ): Promise<{ total: number; abertas: number; urgentes: number } | null> => {
      try {
        const contadores = await clientesService.contarDemandasCliente(clienteId, empresaId);
        return contadores;
      } catch (err: unknown) {
        console.error('Erro ao contar demandas:', err);
        const responseMessage = (err as any)?.response?.data?.message;
        const normalizedMessage = Array.isArray(responseMessage)
          ? responseMessage.join('. ')
          : responseMessage;
        const fallbackMessage = err instanceof Error ? err.message : undefined;
        setError(normalizedMessage || fallbackMessage || 'Erro ao contar demandas');
        return null;
      }
    },
    [],
  );

  return {
    demandas,
    loading,
    error,
    carregarDemandas,
    carregarDemandaPorStatus,
    criarDemanda,
    atualizarDemanda,
    atribuirResponsavel,
    alterarStatus,
    iniciarDemanda,
    concluirDemanda,
    cancelarDemanda,
    deletarDemanda,
    contarDemandas,
  };
};
