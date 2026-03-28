import { api } from '../../../services/api';

export type CoreAdminOverview = {
  generated_at?: string;
  pending_access_requests?: number;
  admin_security_alerts?: number;
  pending_break_glass_requests?: number;
  active_break_glass_accesses?: number;
  users?: {
    total?: number;
    ativos?: number;
    inativos?: number;
  };
};

export type CoreAdminCapabilities = {
  allowBreakGlassRequestCreation: boolean;
  allowManualBillingDueDateCycle: boolean;
  allowPlanDeletion: boolean;
  allowDirectAccessRecertification: boolean;
  allowCompanyModuleManagement: boolean;
};

export type CoreAdminRuntimeContext = {
  environment?: string;
  policySource?: 'environment';
  releaseVersion?: string | null;
  adminMfaRequired?: boolean;
  legacyTransitionMode?: string;
  capabilities?: CoreAdminCapabilities;
};

export type CoreAdminRuntimeHistoryItem = {
  id?: string;
  createdAt?: string;
  policyFingerprint?: string;
  environment?: string;
  releaseVersion?: string | null;
  capabilities?: CoreAdminCapabilities;
};

export type CoreAdminCompany = {
  id: string;
  nome: string;
  cnpj?: string;
  status?: string;
  plano?: string;
  ativo?: boolean;
  email?: string;
};

export type CoreAdminPlan = {
  id: string;
  nome: string;
  codigo: string;
  descricao?: string;
  preco: number;
  limiteUsuarios: number;
  limiteClientes: number;
  limiteStorage: number;
  limiteApiCalls: number;
  ativo: boolean;
  modulosInclusos?: Array<{ id: string; nome?: string; codigo?: string }>;
};

export type CoreAdminBillingItem = {
  empresa: {
    id: string | null;
    nome?: string | null;
    status?: string | null;
    plano?: string | null;
    ativo?: boolean | null;
  };
  assinatura: {
    id: string;
    status: string;
    status_canonico: string;
    valor_mensal?: number;
    proximo_vencimento?: string | null;
    renovacao_automatica?: boolean;
    criado_em?: string;
    atualizado_em?: string;
  } | null;
};

export type CoreAdminCriticalAuditItem = {
  id: string;
  createdAt: string;
  actorUserId?: string | null;
  actorRole?: string | null;
  actorEmail?: string | null;
  targetType?: string | null;
  targetId?: string | null;
  httpMethod?: string | null;
  route?: string | null;
  statusCode?: number | null;
  outcome?: string | null;
  requestId?: string | null;
  errorMessage?: string | null;
};

export type CoreAdminAuditActivityItem = {
  id: string;
  usuario_id?: string;
  empresa_id?: string;
  tipo?: string;
  descricao?: string;
  detalhes?: string;
  createdAt?: string;
  created_at?: string;
  criado_em?: string;
  categoria?: string | null;
  evento?: string | null;
};

export type CoreAdminFeatureFlag = {
  id: string;
  empresa_id: string;
  flag_key: string;
  enabled: boolean;
  rollout_percentage: number;
  updated_by?: string | null;
  updated_at?: string;
};

export type CoreAdminCompanyDetails = CoreAdminCompany & {
  slug?: string;
  ultimo_acesso?: string | null;
  limite_usuarios?: number;
  limite_clientes?: number;
  valor_mensal?: number;
  trial_ate?: string | null;
};

export type CoreAdminCompanyModule = {
  id: string;
  empresaId?: string;
  modulo: string;
  ativo: boolean;
  limites?: Record<string, number>;
  uso_atual?: Record<string, number>;
  configuracoes?: Record<string, unknown>;
  dataAtivacao?: string;
  dataDesativacao?: string | null;
  ultimaAtualizacao?: string;
};

export type CoreAdminCompanyPlanHistory = {
  id: string;
  empresaId?: string;
  planoAnterior?: string;
  planoNovo?: string;
  valorAnterior?: number;
  valorNovo?: number;
  motivo?: string | null;
  alteradoPor?: string | null;
  dataAlteracao?: string;
};

export type CoreAdminSystemModule = {
  id: string;
  nome: string;
  codigo: string;
  descricao?: string | null;
  ativo: boolean;
  essencial: boolean;
  ordem?: number;
};

export type CoreAdminUser = {
  id: string;
  nome?: string;
  email?: string;
  role?: string;
  ativo?: boolean;
  empresa_id?: string;
};

export type CoreAdminUsersResult = {
  items: CoreAdminUser[];
  total: number;
  pagina: number;
  limite: number;
};

export type CoreAdminAccessChangeRequest = {
  id: string;
  action?: string;
  status?: string;
  request_reason?: string | null;
  decision_reason?: string | null;
  created_at?: string;
  decided_at?: string | null;
  requested_by?: {
    id?: string;
    nome?: string;
    email?: string;
  } | null;
  target_user?: {
    id?: string;
    nome?: string;
    email?: string;
    role?: string;
  } | null;
};

export type CoreAdminBreakGlassRequest = {
  id: string;
  status?: string;
  request_reason?: string;
  approval_reason?: string | null;
  revocation_reason?: string | null;
  duration_minutes?: number;
  requested_at?: string;
  approved_at?: string | null;
  starts_at?: string | null;
  expires_at?: string | null;
  target_user?: {
    id?: string;
    nome?: string;
    email?: string;
    role?: string;
  } | null;
  requested_by?: {
    id?: string;
    nome?: string;
    email?: string;
    role?: string;
  } | null;
};

export type CoreAdminAccessReviewReport = {
  empresa_id?: string;
  generated_at?: string;
  filters?: {
    role?: string | null;
    include_inactive?: boolean;
    detail_limit?: number;
  };
  summary?: {
    total_users?: number;
    active_users?: number;
    inactive_users?: number;
    by_profile?: Array<{
      role?: string;
      total?: number;
      ativos?: number;
      inativos?: number;
    }>;
  };
  users?: Array<{
    id: string;
    nome?: string;
    email?: string;
    role?: string;
    ativo?: boolean;
    permissoes?: string[];
    ultimo_login?: string | null;
    created_at?: string | null;
    updated_at?: string | null;
  }>;
};

const unwrapData = <T>(payload: any, fallback: T): T => {
  if (payload && typeof payload === 'object' && 'data' in payload) {
    return (payload.data as T) ?? fallback;
  }
  return (payload as T) ?? fallback;
};

const unwrapMeta = <T>(payload: any, fallback: T): T => {
  if (payload && typeof payload === 'object' && 'meta' in payload) {
    return (payload.meta as T) ?? fallback;
  }
  return fallback;
};

export const coreAdminService = {
  async getOverview(): Promise<CoreAdminOverview> {
    const response = await api.get('/core-admin/bff/overview');
    return unwrapData<CoreAdminOverview>(response.data, {});
  },

  async getCapabilities(): Promise<CoreAdminCapabilities> {
    const response = await api.get('/core-admin/bff/capabilities');
    return unwrapData<CoreAdminCapabilities>(response.data, {
      allowBreakGlassRequestCreation: false,
      allowManualBillingDueDateCycle: false,
      allowPlanDeletion: false,
      allowDirectAccessRecertification: false,
      allowCompanyModuleManagement: false,
    });
  },

  async getRuntimeContext(): Promise<CoreAdminRuntimeContext> {
    const response = await api.get('/core-admin/bff/runtime-context');
    return unwrapData<CoreAdminRuntimeContext>(response.data, {});
  },

  async getRuntimeHistory(limit = 10): Promise<CoreAdminRuntimeHistoryItem[]> {
    const response = await api.get('/core-admin/bff/runtime-history', {
      params: { limit },
    });
    return unwrapData<CoreAdminRuntimeHistoryItem[]>(response.data, []);
  },

  async listUsers(params?: {
    busca?: string;
    role?: string;
    ativo?: boolean;
    ordenacao?: string;
    direcao?: string;
    limite?: number;
    pagina?: number;
  }): Promise<CoreAdminUsersResult> {
    const response = await api.get('/core-admin/bff/users', { params });
    return unwrapData<CoreAdminUsersResult>(response.data, {
      items: [],
      total: 0,
      pagina: 1,
      limite: 20,
    });
  },

  async listAccessChangeRequests(params?: {
    status?: string;
    limit?: number;
  }): Promise<CoreAdminAccessChangeRequest[]> {
    const response = await api.get('/core-admin/bff/access-change-requests', {
      params,
    });
    return unwrapData<CoreAdminAccessChangeRequest[]>(response.data, []);
  },

  async approveAccessChangeRequest(id: string, reason?: string) {
    const response = await api.post(`/core-admin/bff/access-change-requests/${id}/approve`, {
      reason,
    });
    return response.data;
  },

  async rejectAccessChangeRequest(id: string, reason?: string) {
    const response = await api.post(`/core-admin/bff/access-change-requests/${id}/reject`, {
      reason,
    });
    return response.data;
  },

  async listBreakGlassRequests(params?: {
    status?: string;
    limit?: number;
    targetUserId?: string;
  }): Promise<CoreAdminBreakGlassRequest[]> {
    const response = await api.get('/core-admin/bff/break-glass/requests', {
      params: {
        status: params?.status,
        limit: params?.limit,
        target_user_id: params?.targetUserId,
      },
    });
    return unwrapData<CoreAdminBreakGlassRequest[]>(response.data, []);
  },

  async requestBreakGlassAccess(payload: {
    targetUserId: string;
    permissions: string[];
    durationMinutes?: number;
    reason: string;
  }) {
    const response = await api.post('/core-admin/bff/break-glass/requests', {
      target_user_id: payload.targetUserId,
      permissions: payload.permissions,
      duration_minutes: payload.durationMinutes,
      reason: payload.reason,
    });
    return response.data;
  },

  async approveBreakGlassRequest(id: string, reason?: string) {
    const response = await api.post(`/core-admin/bff/break-glass/requests/${id}/approve`, {
      reason,
    });
    return response.data;
  },

  async rejectBreakGlassRequest(id: string, reason: string) {
    const response = await api.post(`/core-admin/bff/break-glass/requests/${id}/reject`, {
      reason,
    });
    return response.data;
  },

  async listActiveBreakGlassAccesses(params?: {
    limit?: number;
    targetUserId?: string;
  }): Promise<CoreAdminBreakGlassRequest[]> {
    const response = await api.get('/core-admin/bff/break-glass/active', {
      params: {
        limit: params?.limit,
        target_user_id: params?.targetUserId,
      },
    });
    return unwrapData<CoreAdminBreakGlassRequest[]>(response.data, []);
  },

  async revokeBreakGlassAccess(id: string, reason?: string) {
    const response = await api.post(`/core-admin/bff/break-glass/${id}/revoke`, {
      reason,
    });
    return response.data;
  },

  async getAccessReviewReport(params?: {
    role?: string;
    includeInactive?: boolean;
    limit?: number;
  }): Promise<CoreAdminAccessReviewReport> {
    const response = await api.get('/core-admin/bff/access-review/report', {
      params: {
        role: params?.role,
        include_inactive: params?.includeInactive,
        limit: params?.limit,
      },
    });
    return unwrapData<CoreAdminAccessReviewReport>(response.data, {});
  },

  async recertifyAccess(payload: {
    targetUserId: string;
    approved: boolean;
    reason?: string;
  }) {
    const response = await api.post('/core-admin/bff/access-review/recertify', {
      target_user_id: payload.targetUserId,
      approved: payload.approved,
      reason: payload.reason,
    });
    return response.data;
  },

  async listCompanies(params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    plano?: string;
  }): Promise<{ data: CoreAdminCompany[]; meta: any }> {
    const response = await api.get('/core-admin/bff/companies', { params });
    return {
      data: unwrapData<CoreAdminCompany[]>(response.data, []),
      meta: unwrapMeta<any>(response.data, null),
    };
  },

  async getCompany(empresaId: string): Promise<CoreAdminCompanyDetails> {
    const response = await api.get(`/core-admin/empresas/${empresaId}`);
    return response.data as CoreAdminCompanyDetails;
  },

  async listCompanyUsers(empresaId: string): Promise<CoreAdminUser[]> {
    const response = await api.get(`/core-admin/empresas/${empresaId}/usuarios`);
    return Array.isArray(response.data) ? response.data : [];
  },

  async resetCompanyUserPassword(
    empresaId: string,
    usuarioId: string,
    motivo?: string,
  ): Promise<{
    usuarioId: string;
    resetLinkDispatched: boolean;
    temporaryPasswordExposed: boolean;
    novaSenha?: string;
  }> {
    const response = await api.put(
      `/core-admin/empresas/${empresaId}/usuarios/${usuarioId}/reset-senha`,
      {
        motivo,
      },
    );
    return response.data as {
      usuarioId: string;
      resetLinkDispatched: boolean;
      temporaryPasswordExposed: boolean;
      novaSenha?: string;
    };
  },

  async listCompanyModules(empresaId: string): Promise<CoreAdminCompanyModule[]> {
    const response = await api.get(`/core-admin/empresas/${empresaId}/modulos`);
    return Array.isArray(response.data) ? response.data : [];
  },

  async activateCompanyModule(
    empresaId: string,
    payload: {
      modulo: string;
      ativo?: boolean;
    },
  ): Promise<CoreAdminCompanyModule> {
    const response = await api.post(`/core-admin/empresas/${empresaId}/modulos`, payload);
    return response.data as CoreAdminCompanyModule;
  },

  async updateCompanyModule(
    empresaId: string,
    modulo: string,
    payload: {
      ativo?: boolean;
    },
  ): Promise<CoreAdminCompanyModule> {
    const response = await api.patch(`/core-admin/empresas/${empresaId}/modulos/${modulo}`, payload);
    return response.data as CoreAdminCompanyModule;
  },

  async deactivateCompanyModule(empresaId: string, modulo: string): Promise<void> {
    await api.delete(`/core-admin/empresas/${empresaId}/modulos/${modulo}`);
  },

  async listCompanyPlanHistory(empresaId: string): Promise<CoreAdminCompanyPlanHistory[]> {
    const response = await api.get(`/core-admin/empresas/${empresaId}/historico-planos`);
    return Array.isArray(response.data) ? response.data : [];
  },

  async changeCompanyPlan(
    empresaId: string,
    payload: {
      plano: string;
      motivo?: string;
    },
  ): Promise<CoreAdminCompanyDetails> {
    const response = await api.patch(`/core-admin/empresas/${empresaId}/plano`, payload);
    return response.data as CoreAdminCompanyDetails;
  },

  async listSystemModules(includeInactive = true): Promise<CoreAdminSystemModule[]> {
    const response = await api.get('/core-admin/planos/modulos', {
      params: { include_inactive: includeInactive },
    });
    return Array.isArray(response.data) ? response.data : [];
  },

  async suspendCompany(empresaId: string, reason: string) {
    const response = await api.patch(`/core-admin/empresas/${empresaId}/suspender`, {
      motivo: reason,
    });
    return response.data;
  },

  async reactivateCompany(empresaId: string) {
    const response = await api.patch(`/core-admin/empresas/${empresaId}/reativar`);
    return response.data;
  },

  async listPlans(includeInactive = true): Promise<CoreAdminPlan[]> {
    const response = await api.get('/core-admin/planos', {
      params: { include_inactive: includeInactive },
    });
    return Array.isArray(response.data) ? response.data : [];
  },

  async togglePlanStatus(planId: string) {
    const response = await api.put(`/core-admin/planos/${planId}/toggle-status`);
    return response.data;
  },

  async listBillingSubscriptions(params?: {
    page?: number;
    limit?: number;
    status?: string;
    subscriptionStatus?: string;
  }): Promise<{ data: CoreAdminBillingItem[]; meta: any }> {
    const response = await api.get('/core-admin/bff/billing/subscriptions', {
      params: {
        page: params?.page,
        limit: params?.limit,
        status: params?.status,
        subscription_status: params?.subscriptionStatus,
      },
    });
    return {
      data: unwrapData<CoreAdminBillingItem[]>(response.data, []),
      meta: unwrapMeta<any>(response.data, null),
    };
  },

  async suspendBillingSubscription(empresaId: string, reason: string) {
    const response = await api.patch(`/core-admin/bff/billing/subscriptions/${empresaId}/suspend`, {
      reason,
    });
    return response.data;
  },

  async reactivateBillingSubscription(empresaId: string, reason: string) {
    const response = await api.patch(
      `/core-admin/bff/billing/subscriptions/${empresaId}/reactivate`,
      {
        reason,
      },
    );
    return response.data;
  },

  async runBillingDueDateCycle() {
    const response = await api.post('/core-admin/bff/billing/subscriptions/jobs/due-date-cycle');
    return response.data;
  },

  async listCriticalAudit(params?: {
    page?: number;
    limit?: number;
    outcome?: string;
    method?: string;
    dataInicio?: string;
    dataFim?: string;
  }): Promise<{ data: CoreAdminCriticalAuditItem[]; meta: any }> {
    const response = await api.get('/core-admin/bff/audit/critical', {
      params: {
        page: params?.page,
        limit: params?.limit,
        outcome: params?.outcome,
        method: params?.method,
        data_inicio: params?.dataInicio,
        data_fim: params?.dataFim,
      },
    });
    return {
      data: unwrapData<CoreAdminCriticalAuditItem[]>(response.data, []),
      meta: unwrapMeta<any>(response.data, null),
    };
  },

  async exportCriticalAudit(params?: {
    format?: 'json' | 'csv';
    limit?: number;
    outcome?: string;
    method?: string;
    dataInicio?: string;
    dataFim?: string;
  }): Promise<{ format: 'json' | 'csv'; data: string | CoreAdminCriticalAuditItem[] }> {
    const response = await api.get('/core-admin/bff/audit/critical/export', {
      params: {
        format: params?.format ?? 'csv',
        limit: params?.limit,
        outcome: params?.outcome,
        method: params?.method,
        data_inicio: params?.dataInicio,
        data_fim: params?.dataFim,
      },
    });

    return {
      format:
        response.data?.format === 'json' || response.data?.format === 'csv'
          ? response.data.format
          : 'json',
      data: response.data?.data ?? '',
    };
  },

  async listAuditActivities(params?: {
    limit?: number;
    usuarioId?: string;
    tipo?: string;
    dataInicio?: string;
    dataFim?: string;
    adminOnly?: boolean;
  }): Promise<CoreAdminAuditActivityItem[]> {
    const response = await api.get('/core-admin/bff/audit/activities', {
      params: {
        limit: params?.limit,
        usuario_id: params?.usuarioId,
        tipo: params?.tipo,
        data_inicio: params?.dataInicio,
        data_fim: params?.dataFim,
        admin_only: params?.adminOnly,
      },
    });
    return unwrapData<CoreAdminAuditActivityItem[]>(response.data, []);
  },

  async listFeatureFlags(empresaId: string): Promise<CoreAdminFeatureFlag[]> {
    const response = await api.get('/core-admin/feature-flags', {
      params: { empresaId },
    });
    return unwrapData<CoreAdminFeatureFlag[]>(response.data, []);
  },

  async listFeatureFlagCatalog(): Promise<string[]> {
    const response = await api.get('/core-admin/feature-flags/catalog');
    return unwrapData<string[]>(response.data, []);
  },

  async upsertFeatureFlags(
    empresaId: string,
    flags: Array<{ flagKey: string; enabled: boolean; rolloutPercentage?: number }>,
  ): Promise<CoreAdminFeatureFlag[]> {
    const response = await api.patch('/core-admin/feature-flags', {
      empresaId,
      flags,
    });
    return unwrapData<CoreAdminFeatureFlag[]>(response.data, []);
  },
};
