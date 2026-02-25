import { api } from './api';
import {
  Cotacao,
  CriarCotacaoRequest,
  AtualizarCotacaoRequest,
  FiltroCotacao,
  StatusCotacao,
  CotacaoListResponse,
  CotacaoMetadataCriacao,
} from '../types/cotacaoTypes';

export const cotacaoService = {
  async listar(filtros?: FiltroCotacao): Promise<CotacaoListResponse> {
    const params = new URLSearchParams();

    if (filtros) {
      Object.entries(filtros).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            value.forEach((v) => params.append(key, v.toString()));
          } else {
            params.append(key, value.toString());
          }
        }
      });
    }

    const queryString = params.toString();
    const response = await api.get(`/cotacao${queryString ? `?${queryString}` : ''}`);
    const payload = response.data;

    if (Array.isArray(payload)) {
      const fallbackItems = payload;
      return {
        items: fallbackItems,
        pagination: {
          page: 1,
          limit: fallbackItems.length,
          total: fallbackItems.length,
          pages: 1,
        },
        statistics: {
          total: fallbackItems.length,
          totalValue: fallbackItems.reduce((sum, item) => sum + (item.valorTotal || 0), 0),
          byStatus: [],
          byPriority: [],
        },
      };
    }

    const items = Array.isArray(payload?.items) ? payload.items : [];

    const pagination = payload?.pagination ?? {
      page: 1,
      limit: items.length,
      total: items.length,
      pages: 1,
    };

    const statistics = payload?.statistics ?? {
      total: items.length,
      totalValue: items.reduce((sum: number, item: Cotacao) => sum + (item.valorTotal || 0), 0),
      byStatus: [],
      byPriority: [],
    };

    return {
      items,
      pagination,
      statistics,
    };
  },

  async buscarPorId(id: string): Promise<Cotacao> {
    const response = await api.get(`/cotacao/${id}`);
    return response.data;
  },

  async criar(data: CriarCotacaoRequest): Promise<Cotacao> {
    // Backend calcula todos os valores (valorTotal, descontos, impostos)
    // Frontend envia apenas dados brutos
    const response = await api.post('/cotacao', data);
    return response.data;
  },

  async atualizar(id: string, data: AtualizarCotacaoRequest): Promise<Cotacao> {
    // Backend calcula todos os valores automaticamente
    const response = await api.put(`/cotacao/${id}`, data);
    return response.data;
  },

  async deletar(id: string): Promise<void> {
    await api.delete(`/cotacao/${id}`);
  },

  async aprovar(id: string, justificativa?: string): Promise<Cotacao> {
    const response = await api.post(`/cotacao/${id}/aprovar`, {
      justificativa,
    });
    return response.data.data;
  },

  async reprovar(id: string, justificativa: string): Promise<Cotacao> {
    const response = await api.post(`/cotacao/${id}/reprovar`, {
      justificativa,
    });
    return response.data.data;
  },

  async enviarParaAprovacao(id: string): Promise<Cotacao> {
    const response = await api.post(`/cotacao/${id}/enviar-para-aprovacao`);
    return response.data.data;
  },

  async alterarStatus(id: string, status: StatusCotacao, observacao?: string): Promise<Cotacao> {
    const response = await api.patch(`/cotacao/${id}/status`, {
      status,
      observacao,
    });
    return response.data;
  },

  async duplicar(id: string): Promise<Cotacao> {
    const response = await api.post(`/cotacao/${id}/duplicar`);
    return response.data;
  },

  async enviarPorEmail(id: string, emails: string[], mensagem?: string): Promise<void> {
    await api.post(`/cotacao/${id}/enviar-email`, {
      destinatarios: emails,
      mensagem,
    });
  },

  async gerarPDF(id: string): Promise<Blob> {
    const response = await api.get(`/cotacao/${id}/pdf`, {
      responseType: 'blob',
    });
    return response.data;
  },

  async exportar(filtros?: FiltroCotacao, formato: 'csv' | 'excel' = 'excel'): Promise<Blob> {
    const params = new URLSearchParams();
    params.append('formato', formato);

    if (filtros) {
      Object.entries(filtros).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            value.forEach((v) => params.append(key, v.toString()));
          } else {
            params.append(key, value.toString());
          }
        }
      });
    }

    const response = await api.get(`/cotacao/exportar?${params.toString()}`, {
      responseType: 'blob',
    });
    return response.data;
  },

  async buscarProximoNumero(): Promise<string> {
    const response = await api.get('/cotacao/proximo-numero');
    return response.data.proximoNumero ?? response.data.numero;
  },

  async buscarMetadataCriacao(): Promise<CotacaoMetadataCriacao> {
    const response = await api.get('/cotacao/metadata/criacao');
    return response.data;
  },

  async minhasAprovacoes(): Promise<Cotacao[]> {
    const response = await api.get('/cotacao/minhas-aprovacoes');
    return response.data;
  },

  async buscarTemplates(): Promise<any[]> {
    const response = await api.get('/cotacao/templates');
    return response.data;
  },

  async salvarTemplate(nome: string, cotacaoId: string): Promise<void> {
    await api.post('/cotacao/templates', {
      nome,
      cotacaoId,
    });
  },

  async aprovarLote(
    cotacaoIds: string[],
    justificativa?: string,
  ): Promise<{
    total: number;
    sucessos: number;
    falhas: number;
    cotacoesProcessadas: string[];
    erros: Array<{ cotacaoId: string; erro: string }>;
  }> {
    const response = await api.post('/cotacao/aprovar-lote', {
      cotacaoIds,
      justificativa,
    });
    return response.data.data;
  },

  async reprovarLote(
    cotacaoIds: string[],
    justificativa: string,
  ): Promise<{
    total: number;
    sucessos: number;
    falhas: number;
    cotacoesProcessadas: string[];
    erros: Array<{ cotacaoId: string; erro: string }>;
  }> {
    const response = await api.post('/cotacao/reprovar-lote', {
      cotacaoIds,
      justificativa,
    });
    return response.data.data;
  },
};
