import api from './api';

/**
 * Service para gerenciar Status Customizados configuráveis
 * 
 * Fase 3d: Frontend Dinâmico - Tickets Configuráveis
 */

export interface StatusCustomizado {
  id: string;
  empresaId: string;
  nivelAtendimentoId: string;
  nome: string;
  descricao: string;
  cor: string;
  ordem: number;
  finalizador: boolean;
  ativo: boolean;
  createdAt: string;
  updatedAt: string;
  // Populated relations
  nivelAtendimento?: {
    id: string;
    codigo: string;
    nome: string;
  };
}

export const statusService = {
  /**
   * Lista status ativos de um nível específico
   * Usado em: Dropdown de status ao criar/editar tickets
   * 
   * IMPORTANTE: Status são vinculados a níveis (N1 tem status diferentes de N2)
   */
  listarPorNivel: async (nivelId: string): Promise<StatusCustomizado[]> => {
    const response = await api.get(`/atendimento/status-customizados?nivelId=${nivelId}`);
    return response.data;
  },

  /**
   * Busca um status específico por ID
   * Usado em: Visualização de detalhes
   */
  buscarPorId: async (id: string): Promise<StatusCustomizado> => {
    const response = await api.get(`/atendimento/status-customizados/${id}`);
    return response.data;
  },

  /**
   * Lista todos os status (ativos + inativos) - Admin Console
   */
  listarTodos: async (): Promise<StatusCustomizado[]> => {
    const response = await api.get('/configuracoes-tickets/status-customizados');
    return response.data;
  },

  /**
   * Lista todos os status ativos (de todos os níveis)
   * Usado em: Admin Console - visão geral
   */
  listarAtivos: async (): Promise<StatusCustomizado[]> => {
    const response = await api.get('/configuracoes-tickets/status-customizados/ativos');
    return response.data;
  },

  /**
   * Cria um novo status customizado - Admin Console
   * Nota: empresaId é extraído do JWT pelo backend, não enviar no body
   */
  criar: async (dados: Omit<StatusCustomizado, 'id' | 'empresaId' | 'createdAt' | 'updatedAt' | 'nivelAtendimento'>): Promise<StatusCustomizado> => {
    const response = await api.post('/configuracoes-tickets/status-customizados', dados);
    return response.data;
  },

  /**
   * Atualiza um status existente - Admin Console
   */
  atualizar: async (id: string, dados: Partial<StatusCustomizado>): Promise<StatusCustomizado> => {
    const response = await api.patch(`/configuracoes-tickets/status-customizados/${id}`, dados);
    return response.data;
  },

  /**
   * Deleta (soft delete) um status - Admin Console
   */
  deletar: async (id: string): Promise<void> => {
    await api.delete(`/configuracoes-tickets/status-customizados/${id}`);
  },
};
