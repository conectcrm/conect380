import { api } from './api';

export type MetaTipo = 'mensal' | 'trimestral' | 'anual';

export interface Meta {
  id: string;
  tipo: MetaTipo;
  periodo: string;
  valor: number;
  vendedorId?: string;
  regiao?: string;
  descricao?: string;
  ativa: boolean;
  empresaId?: string;
  criadaEm: string;
  atualizadaEm: string;
}

export interface CreateMetaDto {
  tipo: MetaTipo;
  periodo: string;
  valor: number;
  vendedorId?: string;
  regiao?: string;
  descricao?: string;
  empresaId?: string;
}

export interface UpdateMetaDto extends Partial<CreateMetaDto> {
  ativa?: boolean;
}

export interface ListMetasParams {
  tipo?: MetaTipo;
  periodo?: string;
  vendedorId?: string;
  regiao?: string;
}

const basePath = '/metas';

export const metaService = {
  async listar(params?: ListMetasParams): Promise<Meta[]> {
    const response = await api.get(basePath, { params });
    return response.data;
  },

  async buscarPorId(id: string): Promise<Meta> {
    const response = await api.get(`${basePath}/${id}`);
    return response.data;
  },

  async criar(data: CreateMetaDto): Promise<Meta> {
    const response = await api.post(basePath, data);
    return response.data;
  },

  async atualizar(id: string, data: UpdateMetaDto): Promise<Meta> {
    const response = await api.patch(`${basePath}/${id}`, data);
    return response.data;
  },

  async remover(id: string): Promise<void> {
    await api.delete(`${basePath}/${id}`);
  },

  async buscarMetaAtual(vendedorId?: string, regiao?: string): Promise<Meta | null> {
    const response = await api.get(`${basePath}/atual`, { params: { vendedorId, regiao } });
    return response.data;
  },
};
