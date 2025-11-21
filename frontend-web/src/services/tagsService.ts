import api from './api';

export interface Tag {
  id: string;
  nome: string;
  cor: string;
  descricao?: string;
  ativo: boolean;
  empresaId?: string;
  createdAt: string;
  updatedAt: string;
  usageCount?: number; // Quando buscar com contagem
}

export interface CreateTagDto {
  nome: string;
  cor: string;
  descricao?: string;
  ativo?: boolean;
}

export interface UpdateTagDto {
  nome?: string;
  cor?: string;
  descricao?: string;
  ativo?: boolean;
}

const tagsService = {
  /**
   * Lista todas as tags
   * @param apenasAtivas - Se true, retorna apenas tags ativas
   * @param comContagem - Se true, inclui contagem de uso (quantos tickets têm cada tag)
   */
  async listar(apenasAtivas = false, comContagem = false): Promise<Tag[]> {
    const params = new URLSearchParams();
    if (apenasAtivas) params.append('apenasAtivas', 'true');
    if (comContagem) params.append('comContagem', 'true');

    const url = `/tags${params.toString() ? `?${params.toString()}` : ''}`;
    const response = await api.get(url);
    return response.data.data;
  },

  /**
   * Busca uma tag por ID
   */
  async buscarPorId(id: string): Promise<Tag> {
    const response = await api.get(`/tags/${id}`);
    return response.data.data;
  },

  /**
   * Cria uma nova tag
   */
  async criar(data: CreateTagDto): Promise<Tag> {
    const response = await api.post('/tags', data);
    return response.data.data;
  },

  /**
   * Atualiza uma tag existente
   */
  async atualizar(id: string, data: UpdateTagDto): Promise<Tag> {
    const response = await api.put(`/tags/${id}`, data);
    return response.data.data;
  },

  /**
   * Deleta uma tag (soft delete - marca como inativo)
   */
  async deletar(id: string): Promise<void> {
    await api.delete(`/tags/${id}`);
  },
};

export default tagsService;
