import api from './api';

/**
 * Service para gerenciar Níveis de Atendimento configuráveis
 * 
 * Fase 3d: Frontend Dinâmico - Tickets Configuráveis
 */

export interface NivelAtendimento {
  id: string;
  empresaId: string;
  codigo: string;
  nome: string;
  descricao: string;
  cor: string;
  ordem: number;
  ativo: boolean;
  createdAt: string;
  updatedAt: string;
}

export const niveisService = {
  /**
   * Lista todos os níveis de atendimento ativos da empresa
   * Usado em: Dropdowns de criação/edição de tickets
   */
  listarAtivos: async (): Promise<NivelAtendimento[]> => {
    const response = await api.get('/atendimento/niveis');
    return response.data;
  },

  /**
   * Busca um nível específico por ID
   * Usado em: Visualização de detalhes
   */
  buscarPorId: async (id: string): Promise<NivelAtendimento> => {
    const response = await api.get(`/atendimento/niveis/${id}`);
    return response.data;
  },

  /**
   * Lista todos os níveis (ativos + inativos) - Admin Console
   */
  listarTodos: async (): Promise<NivelAtendimento[]> => {
    const response = await api.get('/configuracoes-tickets/niveis-atendimento');
    return response.data;
  },

  /**
   * Cria um novo nível de atendimento - Admin Console
   * Nota: empresaId é extraído do JWT pelo backend, não enviar no body
   */
  criar: async (dados: Omit<NivelAtendimento, 'id' | 'empresaId' | 'createdAt' | 'updatedAt'>): Promise<NivelAtendimento> => {
    const response = await api.post('/configuracoes-tickets/niveis-atendimento', dados);
    return response.data;
  },

  /**
   * Atualiza um nível existente - Admin Console
   */
  atualizar: async (id: string, dados: Partial<NivelAtendimento>): Promise<NivelAtendimento> => {
    const response = await api.patch(`/configuracoes-tickets/niveis-atendimento/${id}`, dados);
    return response.data;
  },

  /**
   * Deleta (soft delete) um nível - Admin Console
   */
  deletar: async (id: string): Promise<void> => {
    await api.delete(`/configuracoes-tickets/niveis-atendimento/${id}`);
  },
};
