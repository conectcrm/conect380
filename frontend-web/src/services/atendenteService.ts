import api from './api';
import type { AtendenteEquipe } from './equipeService';

// ========================================================================
// TYPES & INTERFACES
// ========================================================================

export enum StatusAtendente {
  ONLINE = 'online',
  OCUPADO = 'ocupado',
  AUSENTE = 'ausente',
  OFFLINE = 'offline',
}

export interface Atendente {
  id: string;
  empresaId: string;
  nome: string;
  email: string;
  telefone?: string;
  avatar?: string;
  status: StatusAtendente;
  ativo: boolean;
  createdAt: string;
  updatedAt: string;
  equipes?: AtendenteEquipe[];
}

export interface CreateAtendenteDto {
  nome: string;
  email: string;
  telefone?: string;
  avatar?: string;
  ativo?: boolean;
}

export interface UpdateAtendenteDto {
  nome?: string;
  email?: string;
  telefone?: string;
  avatar?: string;
  status?: StatusAtendente;
  ativo?: boolean;
}

// ========================================================================
// SERVICE
// ========================================================================

class AtendenteService {
  /**
   * Lista todos os atendentes da empresa
   */
  async listar(): Promise<Atendente[]> {
    const response = await api.get('/atendimento/atendentes');
    // Backend retorna { success: true, data: [...] }
    return response.data?.data || response.data;
  }

  /**
   * Busca um atendente por ID
   */
  async buscarPorId(id: string): Promise<Atendente> {
    const response = await api.get(`/atendimento/atendentes/${id}`);
    return response.data?.data || response.data;
  }

  /**
   * Cria um novo atendente
   * Retorna: { atendente: Atendente, senhaTemporaria?: string }
   */
  async criar(
    dados: CreateAtendenteDto,
  ): Promise<{ atendente: Atendente; senhaTemporaria?: string }> {
    const response = await api.post('/atendimento/atendentes', dados);
    const data = response.data?.data || response.data;

    // Backend retorna: { success: true, data: atendente, senhaTemporaria: 'Temp2025xyz' }
    return {
      atendente: data,
      senhaTemporaria: response.data?.senhaTemporaria,
    };
  }

  /**
   * Atualiza um atendente
   */
  async atualizar(id: string, dados: UpdateAtendenteDto): Promise<Atendente> {
    const response = await api.put(`/atendimento/atendentes/${id}`, dados);
    return response.data?.data || response.data;
  }

  /**
   * Atualiza o status de um atendente
   */
  async atualizarStatus(id: string, status: StatusAtendente): Promise<Atendente> {
    const response = await api.patch(`/atendimento/atendentes/${id}/status`, {
      status,
    });
    return response.data?.data || response.data;
  }

  /**
   * Remove um atendente (soft delete - marca como inativo)
   */
  async deletar(id: string): Promise<void> {
    await api.delete(`/atendimento/atendentes/${id}`);
  }
}

export default new AtendenteService();
