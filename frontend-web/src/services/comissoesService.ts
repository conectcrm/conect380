import api from './api';

export type StatusComissaoLancamento = 'pendente' | 'aprovada' | 'paga' | 'cancelada';

export interface ComissaoLancamentoParticipante {
  id: string;
  usuarioId: string;
  papel?: string | null;
  percentual: number;
  valorComissao: number;
}

export interface ComissaoLancamento {
  id: string;
  propostaId?: string | null;
  faturaId: number;
  pagamentoId: number;
  origem: string;
  competenciaAno: number;
  competenciaMes: number;
  dataEvento: string;
  valorBaseLiquido: number;
  valorComissaoTotal: number;
  status: StatusComissaoLancamento;
  participantes: ComissaoLancamentoParticipante[];
}

export interface PropostaComissaoParticipanteConfig {
  usuarioId: string;
  percentual: number;
  papel?: string | null;
}

export interface PropostaComissaoConfig {
  participantes: PropostaComissaoParticipanteConfig[];
  observacoes?: string | null;
}

export interface PropostaComissaoConfigResponse {
  propostaId: string;
  config: PropostaComissaoConfig | null;
  atualizadoPor?: string | null;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const comissoesService = {
  async listarMinhas(params?: {
    competenciaAno?: number;
    competenciaMes?: number;
    status?: StatusComissaoLancamento;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<ComissaoLancamento>> {
    const search = new URLSearchParams();
    if (params?.competenciaAno) search.set('competenciaAno', String(params.competenciaAno));
    if (params?.competenciaMes) search.set('competenciaMes', String(params.competenciaMes));
    if (params?.status) search.set('status', params.status);
    if (params?.page) search.set('page', String(params.page));
    if (params?.limit) search.set('limit', String(params.limit));

    const query = search.toString();
    const response = await api.get(`/comissoes/minhas${query ? `?${query}` : ''}`);
    return response.data;
  },

  async listarLancamentos(params?: {
    competenciaAno?: number;
    competenciaMes?: number;
    status?: StatusComissaoLancamento;
    usuarioId?: string;
    propostaId?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<ComissaoLancamento>> {
    const search = new URLSearchParams();
    if (params?.competenciaAno) search.set('competenciaAno', String(params.competenciaAno));
    if (params?.competenciaMes) search.set('competenciaMes', String(params.competenciaMes));
    if (params?.status) search.set('status', params.status);
    if (params?.usuarioId) search.set('usuarioId', params.usuarioId);
    if (params?.propostaId) search.set('propostaId', params.propostaId);
    if (params?.page) search.set('page', String(params.page));
    if (params?.limit) search.set('limit', String(params.limit));

    const query = search.toString();
    const response = await api.get(`/comissoes/lancamentos${query ? `?${query}` : ''}`);
    return response.data;
  },

  async obterConfigProposta(propostaId: string): Promise<PropostaComissaoConfigResponse> {
    const id = String(propostaId || '').trim();
    if (!id) {
      throw new Error('propostaId é obrigatório');
    }

    const response = await api.get(`/comissoes/propostas/${id}/config`);
    return response.data;
  },

  async salvarConfigProposta(
    propostaId: string,
    config: PropostaComissaoConfig,
  ): Promise<PropostaComissaoConfigResponse> {
    const id = String(propostaId || '').trim();
    if (!id) {
      throw new Error('propostaId é obrigatório');
    }

    const response = await api.post(`/comissoes/propostas/${id}/config`, config);
    return response.data;
  },
};

export default comissoesService;
