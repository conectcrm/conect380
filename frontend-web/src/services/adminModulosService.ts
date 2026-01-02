import api from './api';

/**
 * Interface para limites de módulos
 */
export interface LimitesModulo {
  usuarios?: number;
  leads?: number;
  storage_mb?: number;
  api_calls_dia?: number;
  whatsapp_conexoes?: number;
  email_envios_dia?: number;
}

/**
 * Interface para uso atual de módulos
 */
export interface UsoAtualModulo {
  usuarios?: number;
  leads?: number;
  storage_mb?: number;
  api_calls_dia?: number;
  whatsapp_conexoes?: number;
  email_envios_dia?: number;
}

/**
 * Interface para módulo de empresa
 */
export interface ModuloEmpresa {
  id: string;
  empresa_id: string;
  modulo: 'crm' | 'atendimento' | 'comercial' | 'financeiro' | 'produtos' | 'configuracoes';
  ativo: boolean;
  limites: LimitesModulo;
  uso_atual: UsoAtualModulo;
  configuracoes: Record<string, unknown>;
  data_ativacao: Date | string;
  data_desativacao?: Date | string;
  ultima_atualizacao: Date | string;
}

/**
 * DTO para criar/ativar módulo
 */
export interface CreateModuloDto {
  modulo: 'crm' | 'atendimento' | 'comercial' | 'financeiro' | 'produtos' | 'configuracoes';
  limites?: LimitesModulo;
  configuracoes?: Record<string, unknown>;
  ativo?: boolean;
}

/**
 * DTO para atualizar módulo
 */
export interface UpdateModuloDto {
  limites?: LimitesModulo;
  configuracoes?: Record<string, unknown>;
  ativo?: boolean;
}

/**
 * Interface para histórico de mudanças de plano
 */
export interface HistoricoPlano {
  id: string;
  empresa_id: string;
  plano_anterior: string;
  plano_novo: string;
  valor_anterior: number;
  valor_novo: number;
  motivo?: string;
  alterado_por?: string;
  data_alteracao: Date | string;
}

/**
 * DTO para mudança de plano
 */
export interface MudarPlanoDto {
  plano: 'starter' | 'professional' | 'enterprise' | 'custom';
  motivo?: string;
  valor_mensal?: number;
  alterado_por?: string;
}

export interface MudarPlanoResponse {
  message: string;
  empresa_id: string;
  plano: string;
  valor_mensal?: number;
  metadata?: Record<string, unknown>;
}

/**
 * Service para gerenciamento de módulos e planos de empresas
 * Backend: /api/admin/empresas/:id/modulos
 */
export const adminModulosService = {
  /**
   * Listar todos os módulos de uma empresa
   */
  async listarModulos(empresaId: string): Promise<ModuloEmpresa[]> {
    const response = await api.get(`/admin/empresas/${empresaId}/modulos`);
    return response.data;
  },

  /**
   * Ativar um módulo para a empresa
   */
  async ativarModulo(empresaId: string, data: CreateModuloDto): Promise<ModuloEmpresa> {
    const response = await api.post(`/admin/empresas/${empresaId}/modulos`, data);
    return response.data;
  },

  /**
   * Desativar um módulo da empresa
   */
  async desativarModulo(empresaId: string, modulo: string): Promise<void> {
    await api.delete(`/admin/empresas/${empresaId}/modulos/${modulo}`);
  },

  /**
   * Atualizar configurações ou limites de um módulo
   */
  async atualizarModulo(
    empresaId: string,
    modulo: string,
    data: UpdateModuloDto,
  ): Promise<ModuloEmpresa> {
    const response = await api.patch(`/admin/empresas/${empresaId}/modulos/${modulo}`, data);
    return response.data;
  },

  /**
   * Buscar histórico de mudanças de plano da empresa
   */
  async historicoPlanos(empresaId: string): Promise<HistoricoPlano[]> {
    const response = await api.get(`/admin/empresas/${empresaId}/historico-planos`);
    return response.data;
  },

  /**
   * Mudar o plano da empresa
   */
  async mudarPlano(empresaId: string, data: MudarPlanoDto): Promise<MudarPlanoResponse> {
    const response = await api.patch(`/admin/empresas/${empresaId}/plano`, data);
    return response.data;
  },
};

export default adminModulosService;

// Named exports para compatibilidade
export const listarModulos = adminModulosService.listarModulos;
export const ativarModulo = adminModulosService.ativarModulo;
export const desativarModulo = adminModulosService.desativarModulo;
export const atualizarModulo = adminModulosService.atualizarModulo;
export const historicoPlanos = adminModulosService.historicoPlanos;
export const mudarPlano = adminModulosService.mudarPlano;
