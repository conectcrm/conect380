import { api } from './api';

export interface User {
  id: string;
  nome: string;
  email: string;
  username: string;
  ativo: boolean;
  avatar?: string;
  empresaId: string;
  createdAt?: string;
  updatedAt?: string;
}

export const usersService = {
  /**
   * Lista todos os usuários da empresa
   */
  async listar(): Promise<User[]> {
    const response = await api.get('/users');
    // Backend retorna: { success: true, data: { items: [...], total, pagina, limite } }
    return response.data?.data?.items || response.data?.items || response.data || [];
  },

  /**
   * Lista usuários ativos (para dropdowns)
   */
  async listarAtivos(): Promise<User[]> {
    const response = await api.get('/users?ativo=true');
    // Backend retorna: { success: true, data: { items: [...], total, pagina, limite } }
    return response.data?.data?.items || response.data?.items || response.data || [];
  },

  /**
   * Busca usuário por ID
   */
  async buscarPorId(id: string): Promise<User> {
    const response = await api.get(`/users/${id}`);
    return response.data?.data || response.data;
  },
};

export default usersService;
