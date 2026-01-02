import { useState, useEffect } from 'react';
import nucleoService, { Nucleo } from '../services/nucleoService';

interface UseNucleosOptions {
  /**
   * Retornar apenas núcleos ativos
   * @default true
   */
  apenasAtivos?: boolean;

  /**
   * Incluir opção "Todos os Núcleos" no início da lista
   * @default false
   */
  incluirTodos?: boolean;

  /**
   * Carregar automaticamente ao montar
   * @default true
   */
  autoLoad?: boolean;
}

/**
 * Hook para carregar e gerenciar núcleos de atendimento
 *
 * @example
 * // Carregar apenas núcleos ativos
 * const { nucleos, loading } = useNucleos({ apenasAtivos: true });
 *
 * @example
 * // Carregar todos os núcleos com opção "Todos"
 * const { nucleos, loading } = useNucleos({
 *   apenasAtivos: false,
 *   incluirTodos: true
 * });
 *
 * @example
 * // Controle manual do carregamento
 * const { nucleos, loading, recarregar } = useNucleos({ autoLoad: false });
 * // ... depois
 * recarregar();
 */
export function useNucleos(options: UseNucleosOptions = {}) {
  const { apenasAtivos = true, incluirTodos = false, autoLoad = true } = options;

  const [nucleos, setNucleos] = useState<Nucleo[]>([]);
  const [loading, setLoading] = useState(autoLoad);
  const [error, setError] = useState<string | null>(null);

  const carregarNucleos = async () => {
    try {
      setLoading(true);
      setError(null);

      // Montar filtros para API
      const filtros: Record<string, any> = {};
      if (apenasAtivos) {
        filtros.ativo = true;
      }

      // Buscar núcleos da API
      const dados = await nucleoService.listar(filtros);
      let nucleosCarregados = Array.isArray(dados) ? dados : [];

      // Ordenar por prioridade (maior primeiro)
      nucleosCarregados.sort((a, b) => (b.prioridade || 0) - (a.prioridade || 0));

      // Adicionar opção "Todos" se solicitado
      if (incluirTodos) {
        nucleosCarregados = [
          {
            id: 'todos',
            nome: 'Todos os Núcleos',
            codigo: 'TODOS',
            ativo: true,
            prioridade: 999,
          } as any,
          ...nucleosCarregados,
        ];
      }

      setNucleos(nucleosCarregados);
    } catch (err) {
      console.error('[useNucleos] Erro ao carregar núcleos:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar núcleos';
      setError(errorMessage);
      setNucleos([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (autoLoad) {
      carregarNucleos();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apenasAtivos, incluirTodos, autoLoad]);

  return {
    nucleos,
    loading,
    error,
    recarregar: carregarNucleos,
  };
}
