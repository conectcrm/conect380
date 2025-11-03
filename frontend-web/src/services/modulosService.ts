import api from './api';

export enum ModuloEnum {
  ATENDIMENTO = 'ATENDIMENTO',
  CRM = 'CRM',
  VENDAS = 'VENDAS',
  FINANCEIRO = 'FINANCEIRO',
  BILLING = 'BILLING',
  ADMINISTRACAO = 'ADMINISTRACAO',
}

export enum PlanoEnum {
  STARTER = 'STARTER',
  BUSINESS = 'BUSINESS',
  ENTERPRISE = 'ENTERPRISE',
}

export interface EmpresaModulo {
  id: string;
  empresa_id: string;
  modulo: ModuloEnum;
  ativo: boolean;
  data_ativacao: string;
  data_expiracao: string | null;
  plano: PlanoEnum | null;
  created_at: string;
  updated_at: string;
}

export interface CreateEmpresaModuloDto {
  modulo: ModuloEnum;
  ativo?: boolean;
  data_expiracao?: string;
  plano?: PlanoEnum;
}

/**
 * Service para gerenciar licenciamento de módulos da empresa
 */
export const modulosService = {
  /**
   * Lista módulos ativos da empresa logada
   * @returns Array de módulos ativos (string[])
   */
  async listarModulosAtivos(): Promise<ModuloEnum[]> {
    const response = await api.get('/empresas/modulos/ativos');
    return response.data.data;
  },

  /**
   * Lista todos os módulos (ativos e inativos)
   * @returns Array de EmpresaModulo
   */
  async listar(): Promise<EmpresaModulo[]> {
    const response = await api.get('/empresas/modulos');
    return response.data.data;
  },

  /**
   * Verifica se módulo está ativo
   * @param modulo Módulo a verificar
   * @returns true se ativo
   */
  async isModuloAtivo(modulo: ModuloEnum): Promise<boolean> {
    const response = await api.get(`/empresas/modulos/verificar/${modulo}`);
    return response.data.data.ativo;
  },

  /**
   * Retorna plano atual da empresa
   * @returns Plano atual ou null
   */
  async getPlanoAtual(): Promise<PlanoEnum | null> {
    const response = await api.get('/empresas/modulos/plano');
    return response.data.data.plano;
  },

  /**
   * Ativa módulo
   * @param dto Dados do módulo
   * @returns Módulo criado
   */
  async ativar(dto: CreateEmpresaModuloDto): Promise<EmpresaModulo> {
    const response = await api.post('/empresas/modulos/ativar', dto);
    return response.data.data;
  },

  /**
   * Desativa módulo
   * @param modulo Módulo a desativar
   */
  async desativar(modulo: ModuloEnum): Promise<void> {
    await api.delete(`/empresas/modulos/${modulo}`);
  },

  /**
   * Ativa plano completo (Starter, Business, Enterprise)
   * @param plano Plano a ativar
   */
  async ativarPlano(plano: PlanoEnum): Promise<void> {
    await api.post(`/empresas/modulos/plano/${plano}`);
  },
};
