import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import {
  faturamentoAPI,
  FaturaRequest,
  FaturaResponse,
  PagamentoRequest,
} from '../services/faturamentoAPI';
import toast from 'react-hot-toast';

type ListaFaturasResponse = Awaited<ReturnType<typeof faturamentoAPI.listarFaturas>>;
type ResumoFaturamentoResponse = Awaited<ReturnType<typeof faturamentoAPI.obterResumoFaturamento>>;
type AnalyticsFaturamentoResponse = Awaited<
  ReturnType<typeof faturamentoAPI.obterAnalyticsFaturamento>
>;

// Hook para listar faturas
export const useFaturas = (filtros?: {
  status?: string;
  clienteId?: string;
  dataInicio?: string;
  dataFim?: string;
  page?: number;
  limit?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
  q?: string;
}) => {
  return useQuery<ListaFaturasResponse>({
    queryKey: ['faturas', filtros],
    queryFn: () => faturamentoAPI.listarFaturas(filtros),
    placeholderData: keepPreviousData,
    staleTime: 5 * 60 * 1000,
  });
};

// Hook para buscar uma fatura específica
export const useFatura = (id: string | null) => {
  return useQuery<FaturaResponse>({
    queryKey: ['fatura', id],
    queryFn: () => faturamentoAPI.buscarFaturaPorId(id!),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
};

// Hook para criar fatura
export const useCriarFatura = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dados: FaturaRequest) => faturamentoAPI.criarFatura(dados),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['faturas'] });
      toast.success('Fatura criada com sucesso!');
      return data;
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erro ao criar fatura');
      throw error;
    },
  });
};

// Hook para atualizar fatura
export const useAtualizarFatura = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, dados }: { id: string; dados: Partial<FaturaRequest> }) =>
      faturamentoAPI.atualizarFatura(id, dados),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['faturas'] });
      queryClient.invalidateQueries({ queryKey: ['fatura', variables.id] });
      toast.success('Fatura atualizada com sucesso!');
      return data;
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erro ao atualizar fatura');
      throw error;
    },
  });
};

// Hook para deletar fatura
export const useDeletarFatura = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => faturamentoAPI.deletarFatura(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['faturas'] });
      toast.success('Fatura deletada com sucesso!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erro ao deletar fatura');
      throw error;
    },
  });
};

// Hook para gerar fatura automática
export const useGerarFaturaAutomatica = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (contratoId: string) => faturamentoAPI.gerarFaturaAutomatica(contratoId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['faturas'] });
      toast.success('Fatura gerada automaticamente!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erro ao gerar fatura automática');
      throw error;
    },
  });
};

// Hook para enviar fatura por email
export const useEnviarFaturaEmail = () => {
  return useMutation({
    mutationFn: ({ faturaId, email }: { faturaId: string; email?: string }) =>
      faturamentoAPI.enviarFaturaPorEmail(faturaId, email),
    onSuccess: () => {
      toast.success('Fatura enviada por email com sucesso!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erro ao enviar fatura por email');
      throw error;
    },
  });
};

// Hook para download de PDF
export const useDownloadPDFFatura = () => {
  return useMutation({
    mutationFn: (faturaId: string) => faturamentoAPI.baixarPDFFatura(faturaId),
    onSuccess: (blob, faturaId) => {
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `fatura-${faturaId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success('Download iniciado!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erro ao baixar PDF da fatura');
      throw error;
    },
  });
};

// Hook para registrar pagamento
export const useRegistrarPagamento = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dados: PagamentoRequest) => faturamentoAPI.registrarPagamento(dados),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['faturas'] });
      queryClient.invalidateQueries({ queryKey: ['fatura', data.faturaId] });
      queryClient.invalidateQueries({ queryKey: ['pagamentos'] });
      toast.success('Pagamento registrado com sucesso!');
      return data;
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erro ao registrar pagamento');
      throw error;
    },
  });
};

// Hook para resumo de faturamento
export const useResumoFaturamento = (periodo?: { dataInicio: string; dataFim: string }) => {
  return useQuery<ResumoFaturamentoResponse>({
    queryKey: ['resumo-faturamento', periodo],
    queryFn: () => faturamentoAPI.obterResumoFaturamento(periodo),
    staleTime: 10 * 60 * 1000,
  });
};

// Hook para analytics de faturamento
export const useAnalyticsFaturamento = (periodo?: { dataInicio: string; dataFim: string }) => {
  return useQuery<AnalyticsFaturamentoResponse>({
    queryKey: ['analytics-faturamento', periodo],
    queryFn: () => faturamentoAPI.obterAnalyticsFaturamento(periodo),
    staleTime: 15 * 60 * 1000,
  });
};

// Hook personalizado para gerenciar filtros de fatura
export const useFiltrosFatura = () => {
  const [filtros, setFiltros] = useState({
    status: '',
    clienteId: '',
    dataInicio: '',
    dataFim: '',
    searchTerm: '',
    page: 1,
    limit: 10,
  });

  const updateFiltro = (key: string, value: any) => {
    setFiltros((prev) => ({
      ...prev,
      [key]: value,
      page: key !== 'page' ? 1 : value, // Reset page when other filters change
    }));
  };

  const resetFiltros = () => {
    setFiltros({
      status: '',
      clienteId: '',
      dataInicio: '',
      dataFim: '',
      searchTerm: '',
      page: 1,
      limit: 10,
    });
  };

  return {
    filtros,
    updateFiltro,
    resetFiltros,
    setFiltros,
  };
};

// Hook para estatísticas rápidas
export const useEstatisticasFaturamento = () => {
  const { data: faturas } = useFaturas();

  const [estatisticas, setEstatisticas] = useState({
    totalFaturas: 0,
    valorTotal: 0,
    faturasVencidas: 0,
    faturasAberto: 0,
    valorPago: 0,
    taxaPagamento: 0,
  });

  useEffect(() => {
    if (faturas?.faturas) {
      const lista = faturas.faturas;

      const stats = {
        totalFaturas: lista.length,
        valorTotal: lista.reduce((acc, f) => acc + f.valorTotal, 0),
        faturasVencidas: lista.filter((f) => f.status === 'vencida').length,
        faturasAberto: lista.filter((f) => ['pendente', 'enviada'].includes(f.status)).length,
        valorPago: lista
          .filter((f) => f.status === 'paga')
          .reduce((acc, f) => acc + f.valorTotal, 0),
        taxaPagamento: 0,
      };

      stats.taxaPagamento = stats.valorTotal > 0 ? (stats.valorPago / stats.valorTotal) * 100 : 0;

      setEstatisticas(stats);
    }
  }, [faturas]);

  return estatisticas;
};
