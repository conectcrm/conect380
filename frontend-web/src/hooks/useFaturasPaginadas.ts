import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { faturamentoService, FiltrosFatura, FaturasPaginadasResponse } from '../services/faturamentoService';

/**
 * Hook padronizado para listar faturas paginadas com aggregates do backend.
 * - Usa React Query com keepPreviousData para paginação fluida.
 * - Tipos fortes via FaturasPaginadasResponse.
 */
export const useFaturasPaginadas = (filtros?: FiltrosFatura) => {
  return useQuery<FaturasPaginadasResponse, unknown>({
    queryKey: ['faturas-paginadas', filtros],
    queryFn: () => faturamentoService.listarFaturasPaginadas(filtros),
    placeholderData: keepPreviousData,
    staleTime: 0, // Reduzido para 0 para garantir atualizações imediatas após mutações
    gcTime: 5 * 60 * 1000, // Mantém os dados em cache por 5 minutos para performance
  });
};

export default useFaturasPaginadas;
