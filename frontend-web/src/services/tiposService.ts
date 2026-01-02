import api from './api';

/**
 * Service para gerenciar Tipos de Serviço configuráveis
 * 
 * Fase 3d: Frontend Dinâmico - Tickets Configuráveis
 */

export interface TipoServico {
  id: string;
  empresaId: string;
  nome: string;
  descricao: string;
  cor: string;
  icone: string;
  ordem: number;
  ativo: boolean;
  createdAt: string;
  updatedAt: string;
}

export const tiposService = {
  /**
   * Lista todos os tipos de serviço ativos da empresa
   * Usado em: Dropdowns de criação/edição de tickets
   */
  listarAtivos: async (): Promise<TipoServico[]> => {
    const response = await api.get('/atendimento/tipos-servico');
    return response.data;
  },

  /**
   * Busca um tipo específico por ID
   * Usado em: Visualização de detalhes
   */
  buscarPorId: async (id: string): Promise<TipoServico> => {
    const response = await api.get(`/atendimento/tipos-servico/${id}`);
    return response.data;
  },

  /**
   * Lista todos os tipos (ativos + inativos) - Admin Console
   */
  listarTodos: async (): Promise<TipoServico[]> => {
    const response = await api.get('/configuracoes-tickets/tipos-servico');
    return response.data;
  },

  /**
   * Cria um novo tipo de serviço - Admin Console
   * Nota: empresaId é extraído do JWT pelo backend, não enviar no body
   */
  criar: async (dados: Omit<TipoServico, 'id' | 'empresaId' | 'createdAt' | 'updatedAt'>): Promise<TipoServico> => {
    const response = await api.post('/configuracoes-tickets/tipos-servico', dados);
    return response.data;
  },

  /**
   * Atualiza um tipo existente - Admin Console
   */
  atualizar: async (id: string, dados: Partial<TipoServico>): Promise<TipoServico> => {
    const response = await api.patch(`/configuracoes-tickets/tipos-servico/${id}`, dados);
    return response.data;
  },

  /**
   * Deleta (soft delete) um tipo - Admin Console
   */
  deletar: async (id: string): Promise<void> => {
    await api.delete(`/configuracoes-tickets/tipos-servico/${id}`);
  },
};
