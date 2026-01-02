import api from './api';

export interface EmpresaAdmin {
  id: string;
  nome: string;
  cnpj: string;
  email: string;
  telefone: string;
  endereco?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
  subdominio: string;
  plano: string;
  status: 'trial' | 'active' | 'suspended' | 'cancelled' | 'past_due';
  ativo: boolean;
  logo_url?: string;
  data_expiracao?: Date;
  trial_end_date?: Date;
  email_verificado: boolean;
  valor_mensal: number;
  usuarios_ativos: number;
  ultimo_acesso?: Date;
  health_score: number;
  uso_mensal?: {
    usuarios?: number;
    clientes?: number;
    tickets?: number;
    armazenamento_mb?: number;
  };
  limites?: {
    usuarios?: number;
    clientes?: number;
    armazenamento?: string;
  };
  account_manager_id?: string;
  notas_internas?: string;
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
  created_at: Date;
  updated_at: Date;
  usuarios?: EmpresaUsuarioResumo[];
  modulos?: EmpresaModuloResumo[];
}

export interface EmpresaUsuarioResumo {
  id: string;
  nome: string;
  email: string;
  role: string;
  ativo: boolean;
  ultimo_acesso?: Date;
}

export interface EmpresaModuloResumo {
  id: string;
  nome: string;
  status: 'active' | 'inactive' | 'pending';
  ativado_em?: Date;
  expira_em?: Date;
}

export interface FilterEmpresasParams {
  search?: string;
  status?: string;
  plano?: string;
  healthScoreMin?: number;
  healthScoreMax?: number;
  dataInicio?: string;
  dataFim?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface CreateEmpresaAdminData {
  nome: string;
  cnpj: string;
  email: string;
  telefone: string;
  endereco?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
  plano: string;
  status?: string;
  valor_mensal?: number;
  trial_days?: number;
  limites?: {
    usuarios?: number;
    clientes?: number;
    armazenamento?: string;
  };
  account_manager_id?: string;
  notas_internas?: string;
  admin_nome: string;
  admin_email: string;
  admin_senha: string;
}

export interface UpdateEmpresaAdminData {
  nome?: string;
  telefone?: string;
  endereco?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
  plano?: string;
  status?: string;
  valor_mensal?: number;
  ativo?: boolean;
  limites?: {
    usuarios?: number;
    clientes?: number;
    armazenamento?: string;
  };
  account_manager_id?: string;
  notas_internas?: string;
  logo_url?: string;
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
}

export interface EmpresasListResponse {
  data: EmpresaAdmin[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

/**
 * Service para gerenciamento administrativo de empresas
 * Backend: /api/admin/empresas
 */
export const adminEmpresasService = {
  /**
   * Listar todas as empresas com filtros e paginação
   */
  async listar(filters: FilterEmpresasParams = {}): Promise<EmpresasListResponse> {
    const params = new URLSearchParams();

    if (filters.search) params.append('search', filters.search);
    if (filters.status) params.append('status', filters.status);
    if (filters.plano) params.append('plano', filters.plano);
    if (filters.healthScoreMin !== undefined)
      params.append('healthScoreMin', filters.healthScoreMin.toString());
    if (filters.healthScoreMax !== undefined)
      params.append('healthScoreMax', filters.healthScoreMax.toString());
    if (filters.dataInicio) params.append('dataInicio', filters.dataInicio);
    if (filters.dataFim) params.append('dataFim', filters.dataFim);
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());
    if (filters.sortBy) params.append('sortBy', filters.sortBy);
    if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);

    const response = await api.get(`/admin/empresas?${params.toString()}`);
    return response.data;
  },

  /**
   * Buscar detalhes completos de uma empresa
   */
  async buscarPorId(id: string): Promise<EmpresaAdmin> {
    const response = await api.get(`/admin/empresas/${id}`);
    return response.data;
  },

  /**
   * Criar nova empresa (onboarding completo)
   */
  async criar(data: CreateEmpresaAdminData): Promise<EmpresaAdmin> {
    const response = await api.post('/admin/empresas', data);
    return response.data;
  },

  /**
   * Atualizar dados da empresa
   */
  async atualizar(id: string, data: UpdateEmpresaAdminData): Promise<EmpresaAdmin> {
    const response = await api.put(`/admin/empresas/${id}`, data);
    return response.data;
  },

  /**
   * Suspender empresa (bloquear acesso)
   */
  async suspender(id: string, motivo: string): Promise<{ message: string; empresa: EmpresaAdmin }> {
    const response = await api.patch(`/admin/empresas/${id}/suspender`, { motivo });
    return response.data;
  },

  /**
   * Reativar empresa (restaurar acesso)
   */
  async reativar(id: string): Promise<{ message: string; empresa: EmpresaAdmin }> {
    const response = await api.patch(`/admin/empresas/${id}/reativar`);
    return response.data;
  },

  /**
   * Listar usuários da empresa
   */
  async listarUsuarios(empresaId: string): Promise<EmpresaUsuarioResumo[]> {
    const response = await api.get(`/admin/empresas/${empresaId}/usuarios`);
    return response.data;
  },

  /**
   * Recalcular health score da empresa
   */
  async calcularHealthScore(id: string): Promise<{ id: string; health_score: number }> {
    const response = await api.post(`/admin/empresas/${id}/health-score`);
    return response.data;
  },
};

export default adminEmpresasService;

// Named exports para compatibilidade
export const listar = adminEmpresasService.listar;
export const buscarPorId = adminEmpresasService.buscarPorId;
export const criar = adminEmpresasService.criar;
export const atualizar = adminEmpresasService.atualizar;
export const suspender = adminEmpresasService.suspender;
export const reativar = adminEmpresasService.reativar;
export const listarUsuarios = adminEmpresasService.listarUsuarios;
export const calcularHealthScore = adminEmpresasService.calcularHealthScore;
