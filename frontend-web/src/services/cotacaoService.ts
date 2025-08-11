import { api } from './api';
import { 
  Cotacao, 
  CriarCotacaoRequest, 
  AtualizarCotacaoRequest,
  FiltroCotacao,
  StatusCotacao 
} from '../types/cotacaoTypes';

export const cotacaoService = {
  async listar(filtros?: FiltroCotacao): Promise<Cotacao[]> {
    const params = new URLSearchParams();
    
    if (filtros) {
      Object.entries(filtros).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            value.forEach(v => params.append(key, v.toString()));
          } else {
            params.append(key, value.toString());
          }
        }
      });
    }

    const response = await api.get(`/cotacoes?${params.toString()}`);
    return response.data;
  },

  async buscarPorId(id: string): Promise<Cotacao> {
    const response = await api.get(`/cotacoes/${id}`);
    return response.data;
  },

  async criar(data: CriarCotacaoRequest): Promise<Cotacao> {
    // Calcular valores dos itens
    const itensComValor = data.itens.map(item => ({
      ...item,
      valorTotal: item.quantidade * item.valorUnitario
    }));

    const cotacaoData = {
      ...data,
      itens: itensComValor,
      valorTotal: itensComValor.reduce((sum, item) => sum + item.valorTotal, 0)
    };

    const response = await api.post('/cotacoes', cotacaoData);
    return response.data;
  },

  async atualizar(id: string, data: AtualizarCotacaoRequest): Promise<Cotacao> {
    // Recalcular valores se itens foram alterados
    if (data.itens) {
      const itensComValor = data.itens.map(item => ({
        ...item,
        valorTotal: item.quantidade * item.valorUnitario
      }));

      data.itens = itensComValor as any;
      (data as any).valorTotal = itensComValor.reduce((sum, item) => sum + item.valorTotal, 0);
    }

    const response = await api.put(`/cotacoes/${id}`, data);
    return response.data;
  },

  async deletar(id: string): Promise<void> {
    await api.delete(`/cotacoes/${id}`);
  },

  async alterarStatus(id: string, status: StatusCotacao, observacao?: string): Promise<Cotacao> {
    const response = await api.patch(`/cotacoes/${id}/status`, {
      status,
      observacao
    });
    return response.data;
  },

  async duplicar(id: string): Promise<Cotacao> {
    const response = await api.post(`/cotacoes/${id}/duplicar`);
    return response.data;
  },

  async enviarPorEmail(id: string, emails: string[], mensagem?: string): Promise<void> {
    await api.post(`/cotacoes/${id}/enviar-email`, {
      emails,
      mensagem
    });
  },

  async gerarPDF(id: string): Promise<Blob> {
    const response = await api.get(`/cotacoes/${id}/pdf`, {
      responseType: 'blob'
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
            value.forEach(v => params.append(key, v.toString()));
          } else {
            params.append(key, value.toString());
          }
        }
      });
    }

    const response = await api.get(`/cotacoes/exportar?${params.toString()}`, {
      responseType: 'blob'
    });
    return response.data;
  },

  async buscarProximoNumero(): Promise<string> {
    const response = await api.get('/cotacoes/proximo-numero');
    return response.data.numero;
  },

  async buscarTemplates(): Promise<any[]> {
    const response = await api.get('/cotacoes/templates');
    return response.data;
  },

  async salvarTemplate(nome: string, cotacaoId: string): Promise<void> {
    await api.post('/cotacoes/templates', {
      nome,
      cotacaoId
    });
  }
};
