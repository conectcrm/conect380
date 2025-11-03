import api from './api';
import {
  Departamento,
  CreateDepartamentoDto,
  UpdateDepartamentoDto,
  FilterDepartamentoDto,
  EstatisticasDepartamento,
} from '../types/departamentoTypes';

class DepartamentoService {
  /**
   * Lista todos os departamentos com filtros opcionais
   */
  async listar(filtros?: FilterDepartamentoDto): Promise<Departamento[]> {
    try {
      const params = new URLSearchParams();

      if (filtros?.nucleoId) params.append('nucleoId', filtros.nucleoId);
      if (filtros?.ativo !== undefined) params.append('ativo', String(filtros.ativo));
      if (filtros?.nome) params.append('nome', filtros.nome);
      if (filtros?.busca) params.append('busca', filtros.busca);
      if (filtros?.tipoDistribuicao) params.append('tipoDistribuicao', filtros.tipoDistribuicao);
      if (filtros?.supervisorId) params.append('supervisorId', filtros.supervisorId);

      const response = await api.get(`/departamentos?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao listar departamentos:', error);
      throw error;
    }
  }

  /**
   * Lista departamentos ativos de um núcleo específico
   */
  async listarPorNucleo(nucleoId: string): Promise<Departamento[]> {
    try {
      const response = await api.get(`/departamentos/nucleo/${nucleoId}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao listar departamentos do núcleo:', error);
      throw error;
    }
  }

  /**
   * Busca um departamento específico
   */
  async buscarPorId(id: string): Promise<Departamento> {
    try {
      const response = await api.get(`/departamentos/${id}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar departamento:', error);
      throw error;
    }
  }

  /**
   * Busca estatísticas de um departamento
   */
  async buscarEstatisticas(id: string): Promise<EstatisticasDepartamento> {
    try {
      const response = await api.get(`/departamentos/${id}/estatisticas`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar estatísticas do departamento:', error);
      throw error;
    }
  }

  /**
   * Cria um novo departamento
   */
  async criar(dados: CreateDepartamentoDto): Promise<Departamento> {
    try {
      const response = await api.post('/departamentos', dados);
      return response.data;
    } catch (error) {
      console.error('Erro ao criar departamento:', error);
      throw error;
    }
  }

  /**
   * Atualiza um departamento existente
   */
  async atualizar(id: string, dados: UpdateDepartamentoDto): Promise<Departamento> {
    try {
      const response = await api.put(`/departamentos/${id}`, dados);
      return response.data;
    } catch (error) {
      console.error('Erro ao atualizar departamento:', error);
      throw error;
    }
  }

  /**
   * Remove um departamento
   */
  async remover(id: string): Promise<void> {
    try {
      await api.delete(`/departamentos/${id}`);
    } catch (error) {
      console.error('Erro ao remover departamento:', error);
      throw error;
    }
  }

  /**
   * Adiciona um atendente ao departamento
   */
  async adicionarAtendente(departamentoId: string, atendenteId: string): Promise<Departamento> {
    try {
      const response = await api.post(
        `/departamentos/${departamentoId}/atendentes/${atendenteId}`
      );
      return response.data;
    } catch (error) {
      console.error('Erro ao adicionar atendente:', error);
      throw error;
    }
  }

  /**
   * Remove um atendente do departamento
   */
  async removerAtendente(departamentoId: string, atendenteId: string): Promise<Departamento> {
    try {
      const response = await api.delete(
        `/departamentos/${departamentoId}/atendentes/${atendenteId}`
      );
      return response.data;
    } catch (error) {
      console.error('Erro ao remover atendente:', error);
      throw error;
    }
  }

  /**
   * Reordena os departamentos de um núcleo
   */
  async reordenar(
    nucleoId: string,
    ordenacao: { id: string; ordem: number }[]
  ): Promise<void> {
    try {
      await api.post('/departamentos/reordenar', {
        nucleoId,
        ordenacao,
      });
    } catch (error) {
      console.error('Erro ao reordenar departamentos:', error);
      throw error;
    }
  }

  /**
   * Ativa ou desativa um departamento
   */
  async alterarStatus(id: string, ativo: boolean): Promise<Departamento> {
    try {
      return this.atualizar(id, { ativo });
    } catch (error) {
      console.error('Erro ao alterar status do departamento:', error);
      throw error;
    }
  }
}

export const departamentoService = new DepartamentoService();
