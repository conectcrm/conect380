import { useState, useCallback } from 'react';
import {
  clientesService,
  NotaCliente,
  CreateNotaDto,
  UpdateNotaDto,
} from '../services/clientesService';

interface UseNotasReturn {
  notas: NotaCliente[];
  loading: boolean;
  error: string | null;
  carregarNotas: (clienteId?: string, ticketId?: string, telefone?: string) => Promise<void>;
  criarNota: (nota: CreateNotaDto) => Promise<NotaCliente | null>;
  atualizarNota: (notaId: string, nota: UpdateNotaDto) => Promise<NotaCliente | null>;
  toggleImportante: (notaId: string, importante: boolean) => Promise<void>;
  deletarNota: (notaId: string) => Promise<void>;
  contarNotas: (clienteId: string) => Promise<{ total: number; importantes: number } | null>;
}

/**
 * Hook para gerenciar notas de clientes
 *
 * Funcionalidades:
 * - Carregar notas por cliente, ticket ou telefone
 * - Criar nova nota
 * - Atualizar nota existente
 * - Marcar/desmarcar como importante
 * - Deletar nota
 * - Contar notas (total e importantes)
 *
 * @example
 * ```tsx
 * const { notas, loading, error, carregarNotas, criarNota } = useNotas();
 *
 * useEffect(() => {
 *   carregarNotas(clienteId);
 * }, [clienteId]);
 *
 * const handleCriar = async () => {
 *   await criarNota({
 *     clienteId,
 *     conteudo: 'Nova nota',
 *     importante: false
 *   });
 * };
 * ```
 */
export const useNotas = (): UseNotasReturn => {
  const [notas, setNotas] = useState<NotaCliente[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Carregar notas (por cliente, ticket ou telefone)
   * Prioridade: clienteId > ticketId > telefone
   */
  const carregarNotas = useCallback(
    async (clienteId?: string, ticketId?: string, telefone?: string) => {
      try {
        setLoading(true);
        setError(null);

        let notasCarregadas: NotaCliente[] = [];

        if (clienteId) {
          notasCarregadas = await clientesService.listarNotasCliente(clienteId);
        } else if (ticketId) {
          notasCarregadas = await clientesService.listarNotasTicket(ticketId);
        } else if (telefone) {
          notasCarregadas = await clientesService.listarNotasPorTelefone(telefone);
        } else {
          console.warn(
            '⚠️ useNotas: Nenhum identificador fornecido (clienteId, ticketId ou telefone)',
          );
          notasCarregadas = [];
        }

        setNotas(notasCarregadas);
      } catch (err: unknown) {
        console.error('❌ Erro ao carregar notas:', err);
        const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar notas';
        setError(errorMessage);
        setNotas([]);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  /**
   * Criar nova nota
   */
  const criarNota = useCallback(async (nota: CreateNotaDto): Promise<NotaCliente | null> => {
    try {
      setError(null);
      const novaNota = await clientesService.criarNota(nota);

      // Adicionar nota ao estado local
      setNotas((prev) => [novaNota, ...prev]);

      return novaNota;
    } catch (err: unknown) {
      console.error('❌ Erro ao criar nota:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erro ao criar nota';
      setError(errorMessage);
      return null;
    }
  }, []);

  /**
   * Atualizar nota existente
   */
  const atualizarNota = useCallback(
    async (notaId: string, nota: UpdateNotaDto): Promise<NotaCliente | null> => {
      try {
        setError(null);
        const notaAtualizada = await clientesService.atualizarNota(notaId, nota);

        // Atualizar nota no estado local
        setNotas((prev) => prev.map((n) => (n.id === notaId ? notaAtualizada : n)));

        return notaAtualizada;
      } catch (err: unknown) {
        console.error('❌ Erro ao atualizar nota:', err);
        const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar nota';
        setError(errorMessage);
        return null;
      }
    },
    [],
  );

  /**
   * Marcar/desmarcar nota como importante
   */
  const toggleImportante = useCallback(async (notaId: string, importante: boolean) => {
    try {
      setError(null);
      const notaAtualizada = await clientesService.toggleImportante(notaId, importante);

      // Atualizar nota no estado local
      setNotas((prev) => prev.map((n) => (n.id === notaId ? notaAtualizada : n)));
    } catch (err: unknown) {
      console.error('❌ Erro ao marcar nota como importante:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erro ao marcar nota';
      setError(errorMessage);
    }
  }, []);

  /**
   * Deletar nota
   */
  const deletarNota = useCallback(async (notaId: string) => {
    try {
      setError(null);
      await clientesService.deletarNota(notaId);

      // Remover nota do estado local
      setNotas((prev) => prev.filter((n) => n.id !== notaId));
    } catch (err: unknown) {
      console.error('❌ Erro ao deletar nota:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erro ao deletar nota';
      setError(errorMessage);
    }
  }, []);

  /**
   * Contar notas de um cliente
   */
  const contarNotas = useCallback(async (clienteId: string) => {
    try {
      setError(null);
      const contagem = await clientesService.contarNotasCliente(clienteId);
      return contagem;
    } catch (err: unknown) {
      console.error('❌ Erro ao contar notas:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erro ao contar notas';
      setError(errorMessage);
      return null;
    }
  }, []);

  return {
    notas,
    loading,
    error,
    carregarNotas,
    criarNota,
    atualizarNota,
    toggleImportante,
    deletarNota,
    contarNotas,
  };
};
